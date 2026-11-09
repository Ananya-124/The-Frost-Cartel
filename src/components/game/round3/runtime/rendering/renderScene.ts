import { GLOW_RADIUS } from '../config/constants';
import {
  HUNT1_INTERACTABLE_IDS,
  HUNT2_INTERACTABLE_IDS,
  HUNT3_INTERACTABLE_IDS,
  INTERACTABLES,
  isHunt3InteractableAvailable,
} from '../config/interactables';
import { ROOMS, ROOM_BY_ID } from '../config/rooms';
import { isDoorOpen } from '../engine/world/doors';
import { DOORS } from '../engine/world/geometry';
import { lampLevel } from '../engine/world/lighting';
import type { CharacterPose, GameState, Player, PlayerIndex } from '../types';
import { dist } from '../utils/math';
import { createSeededRandom } from '../utils/rng';
import { drawProp, type WorldAssets } from './prerender';

type Ctx = CanvasRenderingContext2D;

const TAU = Math.PI * 2;

export interface View {
  canvas: HTMLCanvasElement;
  ctx: Ctx;
  /** Offscreen darkness layer, same size as the canvas. */
  light: HTMLCanvasElement;
  lightCtx: Ctx;
}

export interface DustMote {
  x: number;
  y: number;
  v: number;
}

export interface SceneParams {
  view: View;
  assets: WorldAssets;
  dust: DustMote[];
  state: GameState;
  /** 0 = Past, 1 = Future. */
  timeline: PlayerIndex;
  /** World point at the centre of the view. */
  cx: number;
  cy: number;
  t: number;
  player: Player | null;
  playerPose?: CharacterPose;
  partnerPose?: CharacterPose;
}

/** Wandering silhouettes placed around the map. */
const SHADOW_SPOTS: ReadonlyArray<readonly [number, number]> = [
  [ROOM_BY_ID.hall.x + 60, ROOM_BY_ID.hall.y + 230],
  [ROOM_BY_ID.arch.x + 250, ROOM_BY_ID.arch.y + 240],
  [ROOM_BY_ID.lab.x + 40, ROOM_BY_ID.lab.y + 230],
  [ROOM_BY_ID.con.x + 250, ROOM_BY_ID.con.y + 60],
  [ROOM_BY_ID.exam.x + 250, ROOM_BY_ID.exam.y + 230],
  [ROOM_BY_ID.gen.x + 40, ROOM_BY_ID.gen.y + 40],
  [ROOM_BY_ID.obs.x + 60, ROOM_BY_ID.obs.y + 230],
];

/** Overall ghost scale: tall enough to be unsettling, small enough to sit well in a room. */
const GHOST_SCALE = 0.72;

/**
 * Draws a pale ghost woman in local space (origin = ghost centre, hem at +y):
 * translucent blue-grey nightgown with a ruffled yoke and long sleeves, long curly black hair,
 * hollow face with glowing white eyes and an open mouth.
 * Purely visual: driven only by `time` and a per-ghost `seed`, no randomness, no state.
 */
function drawGhostFigure(c: Ctx, time: number, seed: number): void {
  const sway = Math.sin(time * 0.9 + seed);
  const reach = Math.sin(time * 0.8 + seed) * 1.6;

  c.save();
  c.scale(GHOST_SCALE, GHOST_SCALE);
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // Cold blue glow around the figure.
  const aura = c.createRadialGradient(0, -2, 3, 0, -2, 56);
  aura.addColorStop(0, 'rgba(150,188,222,.2)');
  aura.addColorStop(0.5, 'rgba(96,130,170,.08)');
  aura.addColorStop(1, 'rgba(30,48,76,0)');
  c.fillStyle = aura;
  c.fillRect(-60, -64, 120, 128);

  // Nightgown silhouette with a soft, drifting hem.
  const gownPath = (): void => {
    c.beginPath();
    c.moveTo(-4.5, -22);
    c.quadraticCurveTo(-11, -22, -12, -14);
    c.lineTo(-13.5 + sway * 0.5, 8);
    c.quadraticCurveTo(-15, 20, -16 + sway, 30);
    const n = 8;
    for (let k = 0; k <= n; k++) {
      const hx = -16 + (32 * k) / n + sway;
      const hy = 31 + (k % 2 ? 2 : 0) + Math.sin(time * 1.4 + k * 1.2 + seed) * 1.8;
      c.lineTo(hx, hy);
    }
    c.quadraticCurveTo(15, 20, 13.5, 8);
    c.lineTo(12, -14);
    c.quadraticCurveTo(11, -22, 4.5, -22);
    c.closePath();
  };

  // Wispy fade below the hem.
  for (const wx of [-10, -3, 4, 11]) {
    const wisp = c.createLinearGradient(0, 30, 0, 46);
    wisp.addColorStop(0, 'rgba(150,176,204,.26)');
    wisp.addColorStop(1, 'rgba(130,158,186,0)');
    c.strokeStyle = wisp;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(wx + sway, 31);
    c.quadraticCurveTo(wx + Math.sin(time * 1.1 + wx + seed) * 4, 38, wx + Math.sin(time * 0.8 + wx * 2 + seed) * 6, 46);
    c.stroke();
  }

  // Gown body: translucent pale blue, fading toward the hem.
  const gown = c.createLinearGradient(0, -22, 0, 34);
  gown.addColorStop(0, 'rgba(200,218,236,.92)');
  gown.addColorStop(0.45, 'rgba(164,188,212,.8)');
  gown.addColorStop(0.8, 'rgba(136,164,192,.5)');
  gown.addColorStop(1, 'rgba(120,150,180,0)');
  gownPath();
  c.fillStyle = gown;
  c.fill();

  // Side shading for volume.
  const volume = c.createLinearGradient(-16, 0, 16, 0);
  volume.addColorStop(0, 'rgba(22,36,60,.4)');
  volume.addColorStop(0.35, 'rgba(255,255,255,0)');
  volume.addColorStop(0.6, 'rgba(255,255,255,.07)');
  volume.addColorStop(1, 'rgba(22,36,60,.46)');
  gownPath();
  c.fillStyle = volume;
  c.fill();

  // Worn, mottled fabric.
  c.fillStyle = 'rgba(84,110,142,.16)';
  for (let k = 0; k < 10; k++) {
    const mx = -9 + ((k * 7) % 18);
    const my = -8 + ((k * 11) % 34);
    c.beginPath(); c.ellipse(mx, my, 2.2, 4, (k % 3) * 0.4 - 0.4, 0, TAU); c.fill();
  }
  c.strokeStyle = 'rgba(70,94,126,.26)';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-8, -6); c.quadraticCurveTo(-10 + sway * 0.6, 14, -11, 31);
  c.moveTo(-3.5, -4); c.quadraticCurveTo(-4.5, 14, -5, 33);
  c.moveTo(3.5, -4); c.quadraticCurveTo(4.5 - sway * 0.4, 14, 5, 33);
  c.moveTo(8.5, -6); c.quadraticCurveTo(10, 14, 11, 31);
  c.stroke();

  // Ruffled yoke, centre placket and buttons.
  c.fillStyle = 'rgba(214,228,242,.5)';
  c.beginPath();
  c.moveTo(-11, -19); c.quadraticCurveTo(0, -22, 11, -19);
  c.lineTo(10.5, -12); c.quadraticCurveTo(0, -9.5, -10.5, -12);
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(236,245,252,.62)';
  c.lineWidth = 0.9;
  c.beginPath();
  for (let k = -4; k <= 4; k++) {
    c.moveTo(k * 2.4 - 1.2, -11.2 + Math.abs(k) * 0.1);
    c.quadraticCurveTo(k * 2.4, -9.2 + Math.abs(k) * 0.1, k * 2.4 + 1.2, -11.2 + Math.abs(k) * 0.1);
  }
  c.stroke();
  c.strokeStyle = 'rgba(70,94,126,.3)';
  c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(0, -9); c.lineTo(0, 14); c.stroke();
  c.fillStyle = 'rgba(232,242,252,.55)';
  for (const by of [-6, -1, 4, 9]) {
    c.beginPath(); c.arc(0, by, 0.7, 0, TAU); c.fill();
  }

  // Long sleeves hanging at the sides, with limp pale hands.
  for (const sd of [-1, 1]) {
    const cx = sd * (16.5 + sway * 0.4 * sd);
    const cy = 15 + reach * sd * 0.5;
    c.strokeStyle = 'rgba(176,198,222,.86)';
    c.lineWidth = 6.5;
    c.beginPath(); c.moveTo(sd * 10, -19); c.quadraticCurveTo(sd * 16, -6, cx, cy); c.stroke();
    c.strokeStyle = 'rgba(64,88,120,.34)';
    c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(sd * 13, -17); c.quadraticCurveTo(sd * 19.5, -5, cx + sd * 3, cy); c.stroke();
    c.strokeStyle = 'rgba(232,242,252,.4)';
    c.beginPath(); c.moveTo(sd * 8, -17); c.quadraticCurveTo(sd * 13, -6, cx - sd * 3, cy); c.stroke();
    c.fillStyle = 'rgba(214,228,242,.9)';
    c.beginPath(); c.ellipse(cx, cy + 3.4, 2, 3, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(204,220,236,.6)';
    c.lineWidth = 0.7;
    c.beginPath();
    for (let f = -1; f <= 1; f++) {
      c.moveTo(cx + f * 1, cy + 5.4);
      c.lineTo(cx + f * 1.4, cy + 9);
    }
    c.stroke();
  }

  // Curly hair helper: a coiling strand falling from (x0, y0).
  const curly = (x0: number, y0: number, dirx: number, len: number, ph: number, w: number): void => {
    c.lineWidth = w;
    c.beginPath();
    for (let j = 0; j <= 14; j++) {
      const t = j / 14;
      const x = x0 + dirx * (2 + t * 3.2) + Math.sin(t * 16 + ph) * 1.7 * (0.5 + t * 0.5) + sway * t * 0.8;
      const y = y0 + t * len;
      if (j === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
  };

  // Back mass of dark hair.
  c.fillStyle = 'rgba(8,10,15,.97)';
  c.beginPath(); c.ellipse(0, -28, 11, 13.4, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(8,10,15,.95)';
  for (const sd of [-1, 1]) {
    for (let k = 0; k < 5; k++) {
      curly(sd * (6 + k * 1.1), -33 + k * 2.4, sd, 30 - k * 3.4, k * 1.9 + seed + sd, 3);
    }
  }

  // Face: ghostly blue-white with hollow features.
  const face = c.createRadialGradient(-1, -30, 0, 0, -28, 9);
  face.addColorStop(0, 'rgba(222,234,246,.98)');
  face.addColorStop(0.6, 'rgba(176,196,218,.9)');
  face.addColorStop(1, 'rgba(112,138,168,.78)');
  c.fillStyle = face;
  c.beginPath(); c.ellipse(0, -27.5, 5.2, 6.9, 0, 0, TAU); c.fill();

  // Hollow cheeks and brow shadow.
  c.fillStyle = 'rgba(52,72,102,.22)';
  c.beginPath(); c.ellipse(-3.3, -24.5, 1.5, 2.6, 0.2, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(3.3, -24.5, 1.5, 2.6, -0.2, 0, TAU); c.fill();
  c.fillStyle = 'rgba(30,44,68,.32)';
  c.beginPath(); c.ellipse(0, -31.8, 5, 1.5, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(56,76,106,.28)';
  c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(0, -28); c.lineTo(0.4, -25.2); c.stroke();

  // Glowing white eyes in dark sockets.
  const flick = 0.82 + Math.sin(time * 5.3 + seed) * 0.12;
  for (const ex of [-2.2, 2.2]) {
    c.fillStyle = 'rgba(16,24,40,.74)';
    c.beginPath(); c.ellipse(ex, -29.2, 2.3, 2.1, 0, 0, TAU); c.fill();
    const glow = c.createRadialGradient(ex, -29.2, 0, ex, -29.2, 4.2);
    glow.addColorStop(0, `rgba(236,248,255,${0.6 * flick})`);
    glow.addColorStop(1, 'rgba(180,220,255,0)');
    c.fillStyle = glow;
    c.beginPath(); c.arc(ex, -29.2, 4.2, 0, TAU); c.fill();
    c.fillStyle = `rgba(252,254,255,${flick})`;
    c.beginPath(); c.ellipse(ex, -29.2, 1.4, 1.05, 0, 0, TAU); c.fill();
  }

  // Open, slack mouth.
  c.fillStyle = 'rgba(12,14,22,.94)';
  c.beginPath(); c.ellipse(0.2, -23.2, 1.5, 2.5, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(12,14,22,.55)';
  c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(0.2, -20.8); c.lineTo(0.2, -18.6 + Math.sin(time * 1.8 + seed) * 0.6); c.stroke();

  // Centre-parted fringe framing the face, and curls over the shoulders.
  c.strokeStyle = 'rgba(8,10,15,.97)';
  c.lineWidth = 2.4;
  c.beginPath();
  for (const sd of [-1, 1]) {
    c.moveTo(0, -35); c.quadraticCurveTo(sd * 5.8, -34, sd * 5.8, -26);
  }
  c.stroke();
  for (const sd of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      curly(sd * (5.4 + k * 1.4), -29 + k * 2.5, sd * 0.6, 26 - k * 4, k * 2.3 + seed + sd * 2, 2.2);
    }
  }

  c.restore();
}

/** Draws a distant ghost: the same apparition as the entities, seen from afar. */
function drawSilhouette(c: Ctx, x: number, y: number, a: number, t = 0): void {
  if (a <= 0) return;

  c.save();
  c.globalAlpha = a;
  c.translate(x, y);
  drawGhostFigure(c, t, x * 0.013 + y * 0.007);
  c.restore();
}

/**
 * Draws a player character: a top-down investigator with head, shoulders, swinging arms,
 * stepping legs and field gear. Local space has "forward" along +y.
 */
function drawBody(
  c: Ctx,
  x: number,
  y: number,
  character: PlayerIndex,
  alpha: number,
  pose: CharacterPose = { facingX: 0, facingY: 1, moving: false, phase: 0 },
): void {
  const tracker = character === 1;

  // Archivist: steel-blue field coat that stands out from the warm amber Past.
  // Tracker: hi-vis orange vest and dark kit that stands out from the cold grey Future.
  const P = tracker
    ? {
        jacket: '#2a332d', jacketHi: '#4a5b4d', accent: '#f0791a', stripe: '#f4e8b8',
        pants: '#22241f', boot: '#12110e', skin: '#c9a07c', glove: '#191917',
        hair: '#181917', cap: '#262c26', rim: 'rgba(255,214,150,.9)',
        halo: 'rgba(255,165,70,.26)', beam: '255,230,175',
      }
    : {
        jacket: '#3d87a8', jacketHi: '#86c6dd', accent: '#efe6cf', stripe: '#d9ecf2',
        pants: '#2a2d33', boot: '#1a1411', skin: '#d4a984', glove: '#4a3626',
        hair: '#2b1a12', cap: '#2b1a12', rim: 'rgba(214,241,250,.9)',
        halo: 'rgba(140,205,235,.26)', beam: '215,238,255',
      };

  const angle = Math.atan2(-pose.facingX, pose.facingY);
  const swing = pose.moving ? Math.sin(pose.phase) * 4.4 : 0;
  const bob = pose.moving ? Math.abs(Math.sin(pose.phase)) * 0.8 : 0;

  c.save();
  c.globalAlpha = alpha;

  // Separation halo so the character reads against any floor.
  const halo = c.createRadialGradient(x, y, 4, x, y, 34);
  halo.addColorStop(0, P.halo);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = halo;
  c.fillRect(x - 34, y - 34, 68, 68);

  // Ground shadow.
  c.fillStyle = 'rgba(0,0,0,.55)';
  c.beginPath();
  c.ellipse(x + 2, y + 3, 14, 9, 0, 0, TAU);
  c.fill();

  c.translate(x, y);
  c.rotate(angle);
  c.translate(0, -bob * 0.4);
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // --- Rear gear ---
  if (tracker) {
    c.fillStyle = '#3d4437';
    c.beginPath(); c.roundRect(-7.5, -13, 15, 12, 3); c.fill();
    c.strokeStyle = '#0d0e0b'; c.lineWidth = 1; c.stroke();
    c.fillStyle = P.accent; c.fillRect(-7.5, -8, 15, 2);
    c.fillStyle = '#2a2f26'; c.fillRect(-5, -12, 10, 3);
    c.strokeStyle = '#111'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(5, -13); c.lineTo(7, -23); c.stroke();
    c.fillStyle = '#ff3b2a'; c.beginPath(); c.arc(7, -23, 1.2, 0, TAU); c.fill();
  } else {
    // Long coat tail and shoulder satchel.
    c.fillStyle = '#2f6783';
    c.beginPath(); c.moveTo(-8, -1); c.lineTo(8, -1); c.lineTo(9.5, -10); c.lineTo(0, -12); c.lineTo(-9.5, -10); c.closePath(); c.fill();
    c.strokeStyle = '#0c1a22'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#6b4a2c';
    c.beginPath(); c.roundRect(-14, -1, 5.5, 8, 1.5); c.fill();
    c.strokeStyle = '#2a1a0c'; c.stroke();
  }

  // --- Legs (alternating stride) ---
  for (const s of [-1, 1]) {
    const f = swing * s;
    c.strokeStyle = P.pants; c.lineWidth = 5;
    c.beginPath(); c.moveTo(s * 3.3, 0); c.lineTo(s * 3.5, 5 + f); c.stroke();
    c.fillStyle = P.boot;
    c.beginPath(); c.ellipse(s * 3.6, 8.4 + f, 3.1, 4.4, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)';
    c.beginPath(); c.ellipse(s * 3.6 - 0.8, 7.4 + f, 0.9, 2, 0, 0, TAU); c.fill();
  }

  // --- Arms (swing opposite to legs) ---
  for (const s of [-1, 1]) {
    const f = -swing * s * 0.9;
    const hx = s * 10.8; const hy = 4 + f;
    c.strokeStyle = P.jacket; c.lineWidth = 4.8;
    c.beginPath(); c.moveTo(s * 8.2, -1.5); c.lineTo(hx, hy - 1); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(s * 8.2 + s * 2.4, -1.5); c.lineTo(hx + s * 2.4, hy - 1); c.stroke();
    // Hand / glove.
    c.fillStyle = P.glove;
    c.beginPath(); c.arc(hx, hy + 1, 2.3, 0, TAU); c.fill();
  }

  // --- Torso ---
  const tg = c.createLinearGradient(-9, 0, 9, 0);
  tg.addColorStop(0, P.jacket);
  tg.addColorStop(0.5, P.jacketHi);
  tg.addColorStop(1, P.jacket);
  c.fillStyle = tg;
  c.beginPath(); c.ellipse(0, 0, 9.4, 6.6, 0, 0, TAU); c.fill();
  c.strokeStyle = P.rim; c.lineWidth = 1.1; c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(0, -6.2); c.lineTo(0, 6.2); c.stroke();

  if (tracker) {
    // Hi-vis vest with reflective bands.
    c.fillStyle = P.accent;
    c.beginPath(); c.ellipse(0, 0.2, 7.2, 5.6, 0, 0, TAU); c.fill();
    c.strokeStyle = P.stripe; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(-3.6, -5); c.lineTo(-3.6, 5); c.moveTo(3.6, -5); c.lineTo(3.6, 5); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(0, -5.5); c.lineTo(0, 5.5); c.stroke();
    c.fillStyle = '#1a1a18'; c.fillRect(2.4, -1.5, 3, 2.5); // radio clip
  } else {
    // Scarf and satchel strap across the shoulders.
    c.strokeStyle = '#6b4a2c'; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(-8, -3); c.lineTo(8, 4); c.stroke();
    c.fillStyle = P.accent;
    c.beginPath(); c.ellipse(0, 2.6, 4.8, 3.3, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 0.8; c.stroke();
  }

  // --- Head ---
  c.fillStyle = P.skin;
  c.beginPath(); c.ellipse(-5.1, 2, 1.1, 1.7, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(5.1, 2, 1.1, 1.7, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(0, 1.8, 5.2, 5.6, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 0.8; c.stroke();

  if (tracker) {
    // Beanie with a bright headlamp.
    c.fillStyle = P.cap;
    c.beginPath(); c.ellipse(0, 0.6, 5.5, 5, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.1)';
    c.beginPath(); c.ellipse(-1.5, -1, 2.5, 1.6, 0, 0, TAU); c.fill();
    c.strokeStyle = '#0d0d0c'; c.lineWidth = 0.9;
    c.beginPath(); c.arc(0, 0.6, 5.5, 0.35, Math.PI - 0.35); c.stroke();
    c.fillStyle = '#6b6f66';
    c.beginPath(); c.arc(0, 5.2, 1.5, 0, TAU); c.fill();
  } else {
    // Dark swept-back hair with a highlight.
    c.fillStyle = P.hair;
    c.beginPath(); c.ellipse(0, 0.3, 5.3, 4.8, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(190,150,110,.45)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(-1, -3.5); c.quadraticCurveTo(2, -1, 1, 3); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.08)';
    c.beginPath(); c.ellipse(-1.5, -1.5, 2.2, 1.3, 0.3, 0, TAU); c.fill();
  }

  c.restore();
}

/** Draws timeline-specific doors and their blockers. */
function drawDoors(c: Ctx, state: GameState, i: PlayerIndex): void {
  const timeline = i === 1 ? 'future' : 'past';

  for (const d of DOORS) {
    if (isDoorOpen(state, d, timeline)) continue;

    const k = d.blocker;

    if (i) {
      // Future: collapsed masonry, twisted rebar and dust.
      const q = createSeededRandom(k.x + k.y);

      for (let s = 0; s < 9; s++) {
        const rx = d.connector.x + (d.horizontal ? 30 + (s % 3) * 20 : q() * 60);
        const ry = d.connector.y + (d.horizontal ? q() * 60 : 30 + (s % 3) * 10);
        const rw = 14 + q() * 8;
        const rh = 12 + q() * 6;
        const rot = q();
        c.fillStyle = 'rgba(0,0,0,.4)';
        c.beginPath(); c.ellipse(rx + 3, ry + 4, rw, rh, rot, 0, TAU); c.fill();
        const g = c.createRadialGradient(rx - 4, ry - 4, 1, rx, ry, rw);
        g.addColorStop(0, ['#7a7e86', '#666a72', '#858993'][s % 3]);
        g.addColorStop(1, '#2d3036');
        c.fillStyle = g;
        c.beginPath(); c.ellipse(rx, ry, rw, rh, rot, 0, TAU); c.fill();
      }
      c.strokeStyle = '#7a4222';
      c.lineWidth = 2;
      for (let s = 0; s < 3; s++) {
        const sx = d.connector.x + q() * Math.max(10, d.connector.w);
        const sy = d.connector.y + q() * Math.max(10, d.connector.h);
        c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + (q() - 0.5) * 36, sy + (q() - 0.5) * 36); c.stroke();
      }
      c.lineWidth = 1;
    } else {
      // Past: reinforced locked door with a blinking warning lamp.
      c.fillStyle = '#3a2a1a';
      c.fillRect(
        k.x - (d.horizontal ? 3 : 0),
        k.y - (d.horizontal ? 0 : 3),
        k.w + (d.horizontal ? 6 : 0),
        k.h + (d.horizontal ? 0 : 6),
      );
      c.strokeStyle = '#8b8f8a';
      c.lineWidth = 2;
      if (d.horizontal) {
        for (let s = 4; s < k.w; s += 14) { c.beginPath(); c.moveTo(k.x + s, k.y); c.lineTo(k.x + s, k.y + k.h); c.stroke(); }
      } else {
        for (let s = 4; s < k.h; s += 14) { c.beginPath(); c.moveTo(k.x, k.y + s); c.lineTo(k.x + k.w, k.y + s); c.stroke(); }
      }
      c.lineWidth = 1;

      const blink = 0.55 + 0.45 * Math.max(0, Math.sin(state.time * 4));
      c.save();
      c.shadowBlur = 14;
      c.shadowColor = '#e05030';
      c.globalAlpha = blink;
      c.fillStyle = '#ff4a2a';
      c.beginPath();
      c.arc(k.x + k.w / 2, k.y + k.h / 2, 4, 0, TAU);
      c.fill();
      c.restore();
    }
  }

  // Door frames.
  for (const d of DOORS) {
    if (!isDoorOpen(state, d, timeline)) continue;

    const k = d.blocker;

    c.fillStyle = i ? '#5a5444' : '#8a6a3a';

    if (d.horizontal) {
      c.fillRect(k.x - 3, k.y - 4, k.w + 6, 5);
      c.fillRect(k.x - 3, k.y + k.h - 1, k.w + 6, 5);
    } else {
      c.fillRect(k.x - 4, k.y - 3, 5, k.h + 6);
      c.fillRect(k.x + k.w - 1, k.y - 3, 5, k.h + 6);
    }
  }
}

/** Draws paranormal entities, trails and spectral energy. */
function drawEntities(c: Ctx, state: GameState, i: PlayerIndex, player: Player | null): void {
  if (i === 1) {
    for (const entity of state.entities) {
      if (entity.gone) continue;

      for (const point of entity.trail) {
        const age = state.time - point.t;
        const alpha = Math.max(0, 1 - age / 7);

        if (alpha <= 0) continue;

        c.save();
        c.globalAlpha = alpha * 0.38;

        const trace = c.createRadialGradient(point.x, point.y, 1, point.x, point.y, 18);
        trace.addColorStop(0, 'rgba(143,153,145,0.42)');
        trace.addColorStop(0.4, 'rgba(83,99,91,0.2)');
        trace.addColorStop(1, 'rgba(20,28,23,0)');

        c.fillStyle = trace;
        c.beginPath();
        c.arc(point.x, point.y, 18, 0, TAU);
        c.fill();

        c.restore();
      }
    }
  }

  for (const entity of state.entities) {
    if (entity.gone) continue;

    const distance = player ? dist(entity, player) : 500;

    if (!i && (!player || distance > 300)) continue;

    let alpha = i ? 0.85 : 0.2;

    if (i && state.huntIndex === 1 && !entity.real) {
      alpha *= 0.2 + 0.8 * Math.abs(Math.sin(state.time * 9 + entity.x));
    }

    const flicker = 0.93 + Math.sin(state.time * 1.3 + entity.x) * 0.05;
    const floatY = Math.sin(state.time * 0.65 + entity.x) * 1.8;

    c.save();
    c.globalAlpha = alpha * flicker;
    c.translate(entity.x, entity.y + floatY);

    drawGhostFigure(c, state.time, entity.x + entity.y * 0.37);

    c.restore();

    // Reveal and marking indicators.
    if (i === 1 && ((state.revealTimer > 0 && entity.real) || entity.marked)) {
      c.save();
      const revealColor = entity.marked ? '#bd7161' : '#c6b58b';
      c.strokeStyle = revealColor;
      c.shadowColor = revealColor;
      c.shadowBlur = 3;
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(entity.x, entity.y - 2, 18, 30, 0, 0, TAU);
      c.stroke();
      c.restore();
    }
  }
}

/** Lighting: dark layer with lamp pools and flickering lights. */
function drawLighting(p: SceneParams, ox: number, oy: number): void {
  const { view, state, timeline: i, t, player, cx, cy } = p;
  const { ctx, light, lightCtx: lx, canvas } = view;

  const w = canvas.width;
  const h = canvas.height;

  if (!w || !h) return;

  // Base darkness: warm brown in the Past, blue-black in the Future.
  lx.globalCompositeOperation = 'source-over';
  lx.fillStyle = i ? 'rgba(7,10,9,.58)' : 'rgba(30,15,5,.62)';
  lx.fillRect(0, 0, w, h);

  lx.globalCompositeOperation = 'destination-out';

  const hole = (x0: number, y0: number, r: number, a: number): void => {
    const x = x0 + ox;
    const y = y0 + oy;
    const g = lx.createRadialGradient(x, y, r * 0.1, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(0.55, `rgba(0,0,0,${a * 0.45})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    lx.fillStyle = g;
    lx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  if (player) {
    hole(player.x, player.y, i ? 275 : 250, 1);
  } else {
    hole(cx, cy, 520, 0.9);
  }

  // Room lamps with deterministic flickering (more erratic in the Future).
  for (const room of ROOMS) {
    const level = lampLevel(state, room, i === 1 ? 'future' : 'past');
    if (!level) continue;

    const powerFactor = state.flags.power && i ? 1 : 0.75;
    const slowFlicker = 0.88 + 0.12 * Math.sin(t * 8 + room.gx * 7 + room.gy * 3);
    const irregularFlicker =
      Math.sin(t * 17 + room.gx * 5 + room.gy * 9) > (i ? 0.93 : 0.965) ? (i ? 0.1 : 0.22) : 1;
    const flicker = slowFlicker * irregularFlicker * powerFactor;

    hole(room.x + 150, room.y + 130, (i ? 335 : 290) * level, (i ? 0.86 : 0.95) * flicker);
  }

  for (const door of DOORS) {
    hole(
      door.connector.x + door.connector.w / 2,
      door.connector.y + door.connector.h / 2,
      140,
      (state.brownout > 0 ? 0 : i ? 0.62 : 0.8) *
        (Math.sin(t * 9 + door.connector.x) > 0.92 ? 0.3 : 1),
    );
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(light, 0, 0);

  // Coloured lamp glow.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (const room of ROOMS) {
    const level = lampLevel(state, room, i === 1 ? 'future' : 'past');
    if (level <= 0.3) continue;

    const x = room.x + 150 + ox;
    const y = room.y + 130 + oy;
    const g = ctx.createRadialGradient(x, y, 5, x, y, 190);
    g.addColorStop(0, i ? 'rgba(112,128,119,.13)' : 'rgba(255,165,70,.2)');
    g.addColorStop(0.5, i ? 'rgba(54,65,58,.025)' : 'rgba(180,100,35,.065)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 190, y - 190, 380, 380);
  }

  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

/** Fog, mist, drifting shadows, dust, light pulses and vignette. */
function drawAtmosphere(p: SceneParams): void {
  const { view, timeline: i, t, dust } = p;
  const { ctx, canvas } = view;

  const w = canvas.width;
  const h = canvas.height;

  if (!w || !h) return;

  ctx.save();

  // 1. Timeline colour grade.
  const ambient = ctx.createLinearGradient(0, 0, 0, h);
  if (i === 1) {
    ambient.addColorStop(0, 'rgba(8,24,32,0.12)');
    ambient.addColorStop(0.55, 'rgba(12,30,36,0.07)');
    ambient.addColorStop(1, 'rgba(10,20,26,0.14)');
  } else {
    ambient.addColorStop(0, 'rgba(40,20,8,0.14)');
    ambient.addColorStop(0.55, 'rgba(45,26,10,0.06)');
    ambient.addColorStop(1, 'rgba(50,28,10,0.18)');
  }
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, w, h);

  // 2. Moving fog banks.
  ctx.globalCompositeOperation = 'screen';
    const fogCount = i === 1 ? 5 : 4;
  for (let k = 0; k < fogCount; k++) {
    const x = w * (0.5 + Math.sin(t * 0.12 + k * 1.8) * 0.42);
    const y = h * (0.55 + Math.cos(t * 0.09 + k * 1.4) * 0.2);
    const radius = w * (0.22 + (k % 3) * 0.07);
    const fog = ctx.createRadialGradient(x, y, 5, x, y, radius);
    const colour = i === 1 ? '103,111,103' : '190,150,100';
    const a = i === 1 ? 0.035 : 0.04;
    fog.addColorStop(0, `rgba(${colour},${a})`);
    fog.addColorStop(0.35, `rgba(${colour},${a * 0.5})`);
    fog.addColorStop(1, `rgba(${colour},0)`);
    ctx.fillStyle = fog;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  // 3. Low-lying mist.
  for (let k = 0; k < 3; k++) {
    const y = h * (0.66 + k * 0.13) + Math.sin(t * 0.35 + k) * 12;
    const x = Math.sin(t * 0.15 + k * 2) * w * 0.15;
    const mist = ctx.createLinearGradient(x, y - 45, x, y + 65);
    mist.addColorStop(0, 'rgba(100,105,92,0)');
    mist.addColorStop(0.5, i ? 'rgba(108,116,105,0.03)' : 'rgba(185,150,110,0.04)');
    mist.addColorStop(1, 'rgba(100,105,92,0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, y - 65, w, 130);
  }

  // 4. Drifting dark patches.
  ctx.globalCompositeOperation = 'multiply';
  for (let k = 0; k < 4; k++) {
    const x = w * (0.5 + Math.sin(t * 0.13 + k * 1.7) * 0.5);
    const y = h * (0.5 + Math.cos(t * 0.1 + k * 2.3) * 0.35);
    const shadow = ctx.createRadialGradient(x, y, 10, x, y, 170);
    shadow.addColorStop(0, i ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.2)');
    shadow.addColorStop(0.5, i ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.08)');
    shadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadow;
    ctx.fillRect(x - 170, y - 170, 340, 340);
  }

  // 5. Dust / ash / spores.
  ctx.globalCompositeOperation = 'screen';
  for (let index = 0; index < dust.length; index++) {
    const mote = dust[index];

    mote.y -= mote.v * 0.012;
    mote.x += Math.sin(t * 0.3 + index) * 0.00025;

    if (mote.y < -0.02) {
      mote.y = 1.02;
      mote.x = Math.random();
    }
    if (mote.x < 0) mote.x = 1;
    if (mote.x > 1) mote.x = 0;

    const x = mote.x * w;
    const y = mote.y * h;
    const shimmer = 0.35 + Math.abs(Math.sin(t * 1.8 + index)) * 0.65;
    const size = index % 11 === 0 ? 2 : 1;

    ctx.globalAlpha = shimmer * (i ? 0.16 : 0.28);
    ctx.fillStyle = i ? (index % 4 === 0 ? '#999c8e' : '#aaa99a') : (index % 4 === 0 ? '#d3b385' : '#cbbfa5');
    ctx.beginPath();
    ctx.arc(x, y, size, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 6. Rare light pulses; the Future occasionally flashes blood-red.
  const pulse = Math.pow(Math.max(0, Math.sin(t * 0.7 + 1)), 18);
  if (pulse > 0.03) {
    ctx.fillStyle = i ? `rgba(115,49,43,${pulse * 0.025})` : `rgba(187,150,100,${pulse * 0.03})`;
    ctx.fillRect(0, 0, w, h);
  }

  // 7. Distant spectral glow.
  const glowX = w * (0.75 + Math.sin(t * 0.16) * 0.13);
  const glowY = h * (0.36 + Math.cos(t * 0.12) * 0.1);
  const distantGlow = ctx.createRadialGradient(glowX, glowY, 1, glowX, glowY, w * 0.22);
  distantGlow.addColorStop(0, i ? 'rgba(92,105,96,0.022)' : 'rgba(181,140,100,0.035)');
  distantGlow.addColorStop(1, 'rgba(60,50,40,0)');
  ctx.fillStyle = distantGlow;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();

  // 8. Heavy vignette.
  const vignette = ctx.createRadialGradient(
    w * 0.5, h * 0.48, Math.min(w, h) * 0.18,
    w * 0.5, h * 0.48, Math.max(w, h) * 0.74,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.5, 'rgba(0,0,0,0.12)');
  vignette.addColorStop(1, i ? 'rgba(0,4,8,0.3)' : 'rgba(10,4,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

/** Draws one half-screen (or the menu background). */
export function renderScene(p: SceneParams): void {
  const { view, assets, state, timeline: i, cx, cy, t, player } = p;

  const { ctx, canvas } = view;

  const w = canvas.width;
  const h = canvas.height;

  const ox = Math.round(w / 2 - cx);
  const oy = Math.round(h / 2 - cy);

  if (!w || !h) return;

  // Background wall.
  ctx.save();
  ctx.translate(ox, oy);
  ctx.fillStyle = assets.wallPatterns[i] ?? '#000';
  ctx.fillRect(-ox, -oy, w, h);
  ctx.restore();

  // Main world image.
  ctx.drawImage(assets.worlds[i], ox, oy);

  ctx.save();
  ctx.translate(ox, oy);

  // HUNT I INTERACTABLES.
  if (state.huntIndex === 0) {
    for (const object of INTERACTABLES) {
      if (HUNT1_INTERACTABLE_IDS.has(object.id) && object.timeline === (i ? 'future' : 'past')) {
        drawProp(ctx, object, i === 1);
        if (state.highlightTimer > 0 && state.highlightedObjectId === object.id) drawCardHighlight(ctx, object);
      }
    }
  }

  // HUNT II INTERACTABLES.
  if (state.huntIndex === 1) {
    for (const object of INTERACTABLES) {
      const hiddenUntil = state.hunt2HiddenInteractablesUntil?.[object.id] ?? 0;
      const hidden =
        state.hunt2ObjectStates?.[object.id] === 'hidden' ||
        (object.id === 'trueMemoryAnchor' && !state.hunt2Subtasks?.trueAnchorActivated);

      if (
        !HUNT2_INTERACTABLE_IDS.has(object.id) ||
        object.timeline !== (i ? 'future' : 'past') ||
        hidden ||
        hiddenUntil > state.time
      ) {
        continue;
      }

      drawProp(ctx, object, i === 1);
      if (state.highlightTimer > 0 && state.highlightedObjectId === object.id) drawCardHighlight(ctx, object);
    }
  }

  // HUNT III INTERACTABLES.
  if (state.huntIndex === 2) {
    for (const object of INTERACTABLES) {
      if (
        HUNT3_INTERACTABLE_IDS.has(object.id) &&
        isHunt3InteractableAvailable(object.id, state.hunt3Stage) &&
        object.timeline === (i ? 'future' : 'past')
      ) {
        drawProp(ctx, object, i === 1);
        if (state.highlightTimer > 0 && state.highlightedObjectId === object.id) drawCardHighlight(ctx, object);
      }
    }
  }

  // Doors.
  drawDoors(ctx, state, i);

  // Nearby interactable glints.
  for (const object of INTERACTABLES) {
    const huntOwnedVisible =
      (state.huntIndex === 0 && HUNT1_INTERACTABLE_IDS.has(object.id)) ||
      (state.huntIndex === 1 && HUNT2_INTERACTABLE_IDS.has(object.id)) ||
      (state.huntIndex === 2 &&
        HUNT3_INTERACTABLE_IDS.has(object.id) &&
        isHunt3InteractableAvailable(object.id, state.hunt3Stage));

    const temporarilyHidden = (state.hunt2HiddenInteractablesUntil?.[object.id] ?? 0) > state.time;

    const hunt2Hidden =
      state.hunt2ObjectStates?.[object.id] === 'hidden' ||
      (object.id === 'trueMemoryAnchor' && !state.hunt2Subtasks?.trueAnchorActivated);

    if (
      !temporarilyHidden &&
      !hunt2Hidden &&
      ((!HUNT1_INTERACTABLE_IDS.has(object.id) &&
        !HUNT2_INTERACTABLE_IDS.has(object.id) &&
        !HUNT3_INTERACTABLE_IDS.has(object.id)) ||
        huntOwnedVisible) &&
      object.timeline === (i ? 'future' : 'past') &&
      player &&
      dist(object, player) < GLOW_RADIUS
    ) {
      ctx.save();

      const shimmer = 0.5 + 0.5 * Math.sin(t * 2.5 + object.x);
      const glowColour = i ? '#b8aa82' : '#ffd27a';

      // Pulsing interaction ring on the floor under the object.
      ctx.globalAlpha = i ? 0.12 + 0.1 * shimmer : 0.22 + 0.2 * shimmer;
      ctx.strokeStyle = glowColour;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -t * 12;
      ctx.beginPath();
      ctx.ellipse(object.x, object.y + 4, 34 + shimmer * 3, 22 + shimmer * 2, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);

      // Drifting spark.
      ctx.globalAlpha = i ? 0.18 + 0.14 * shimmer : 0.35 + 0.35 * shimmer;
      ctx.shadowBlur = i ? 5 : 12;
      ctx.shadowColor = glowColour;
      ctx.fillStyle = glowColour;
      ctx.beginPath();
      ctx.arc(
        object.x + Math.sin(t * 2 + object.y) * 10,
        object.y + Math.cos(t * 3) * 8,
        3.5 + shimmer,
        0,
        TAU,
      );
      ctx.fill();
      ctx.restore();

      // If already examined, show clear completion indicator.
      const isExamined =
        !!state.completed[object.id] ||
        !!state.flags[object.id as keyof typeof state.flags] ||
        !!state.hunt2Subtasks?.[object.id] ||
        state.hunt2ObjectStates?.[object.id] === 'examined' ||
        state.hunt2ObjectStates?.[object.id] === 'inspected';
      if (isExamined) {
        ctx.save();
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = i ? '#c3b78f' : '#34d399';
        ctx.shadowColor = i ? '#6f664c' : '#059669';
        ctx.shadowBlur = i ? 2 : 6;
        ctx.textAlign = 'center';
        ctx.fillText('✓ EXAMINED', object.x, object.y - object.hitbox.h - 6);
        ctx.restore();
      }
    }
  }

  // Paranormal entities.
  drawEntities(ctx, state, i, player);

  // Distant wandering shadows.
  for (const [x, y] of SHADOW_SPOTS) {
    const d = player ? dist({ x, y }, player) : 400;

    if (d > 240 && d < 760) {
      const flicker = Math.sin(t * 2.3 + x) > -0.4 ? 1 : 0;
      const visibility = flicker * Math.min(0.55, (760 - d) / 500) * (i ? 1 : 0.55);

      drawSilhouette(ctx, x + Math.sin(t * 0.8 + y) * 6, y, visibility, t);
    }
  }

  // Temporary apparitions.
  for (const apparition of state.apparitions) {
    const age = t - apparition.t;

    if (apparition.playerIndex === i && age < 4 && age >= 0) {
      const fade = Math.sin((age / 4) * Math.PI) * 0.85;
      drawSilhouette(ctx, apparition.x, apparition.y, fade, t);
    }
  }

  // Player and partner.
  if (state.phase === 'playing') {
    const partner = state.players[i === 0 ? 1 : 0];

    // Keep the other investigator present as a dim spatial reference, not a
    // second bright controllable figure in this player's view.
    drawBody(ctx, partner.x, partner.y, i === 0 ? 1 : 0, 0.16, p.partnerPose);

    const self = state.players[i];

    drawBody(ctx, self.x, self.y, i, 1, p.playerPose);
  }

  ctx.restore();

  drawLighting(p, ox, oy);
  drawAtmosphere(p);
}

function drawCardHighlight(ctx: CanvasRenderingContext2D, object: (typeof INTERACTABLES)[number]): void {
  ctx.save();
  ctx.strokeStyle = object.timeline === 'future' ? '#c8b27a' : '#8dffff';
  ctx.shadowColor = object.timeline === 'future' ? '#8a7650' : '#8dffff';
  ctx.shadowBlur = object.timeline === 'future' ? 5 : 18;
  ctx.lineWidth = object.timeline === 'future' ? 1.5 : 3;
  ctx.beginPath();
  ctx.arc(object.x, object.y, 34, 0, TAU);
  ctx.stroke();
  ctx.restore();
}