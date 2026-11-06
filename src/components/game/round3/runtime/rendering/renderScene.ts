import { GLOW_RADIUS } from '../config/constants';
import { getInteractableForState, HUNT1_INTERACTABLE_IDS, HUNT2_INTERACTABLE_IDS, INTERACTABLES } from '../config/interactables';
import { ROOMS, ROOM_BY_ID } from '../config/rooms';
import { isDoorOpen } from '../engine/world/doors';
import { DOORS } from '../engine/world/geometry';
import { lampLevel } from '../engine/world/lighting';
import type { GameState, Player, PlayerIndex } from '../types';
import { dist } from '../utils/math';
import { createSeededRandom } from '../utils/rng';
import { drawProp, type WorldAssets } from './prerender';

type Ctx = CanvasRenderingContext2D;

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

function drawSilhouette(c: Ctx, x: number, y: number, a: number): void {
  c.save();
  c.globalAlpha = a;
  c.translate(x, y);
  c.fillStyle = '#05030a';
  c.beginPath();
  c.moveTo(-10, 16);
  c.lineTo(-14, -10);
  c.lineTo(-5, -26);
  c.lineTo(5, -26);
  c.lineTo(14, -10);
  c.lineTo(10, 16);
  c.fill();
  c.fillStyle = 'rgba(220,230,255,.9)';
  c.fillRect(-4, -20, 2, 2);
  c.fillRect(2, -20, 2, 2);
  c.restore();
}

function drawBody(c: Ctx, x: number, y: number, colour: string, alpha: number): void {
  c.globalAlpha = alpha;
  c.fillStyle = 'rgba(0,0,0,.5)';
  c.beginPath();
  c.ellipse(x, y + 9, 11, 5, 0, 0, 7);
  c.fill();
  c.fillStyle = colour;
  c.beginPath();
  c.arc(x, y, 10, 0, 7);
  c.fill();
  c.fillStyle = '#e8d0b0';
  c.beginPath();
  c.arc(x, y - 8, 6, 0, 7);
  c.fill();
  c.globalAlpha = 1;
}

function drawDoors(c: Ctx, state: GameState, i: PlayerIndex): void {
  const timeline = i === 1 ? 'future' : 'past';
  for (const d of DOORS) {
    if (isDoorOpen(state, d, timeline)) continue;
    const k = d.blocker;
    if (i) {
      // Future: a pile of rubble.
      const q = createSeededRandom(k.x + k.y);
      for (let s = 0; s < 9; s++) {
        c.fillStyle = ['#5b5f68', '#444851', '#6a6e78'][s % 3];
        c.beginPath();
        c.ellipse(
          d.connector.x + (d.horizontal ? 30 + (s % 3) * 20 : q() * 60),
          d.connector.y + (d.horizontal ? q() * 60 : 30 + (s % 3) * 10),
          14 + q() * 8,
          12 + q() * 6,
          q(),
          0,
          7,
        );
        c.fill();
      }
    } else {
      // Past: a locked wooden door with a red light.
      c.fillStyle = '#4a3420';
      c.fillRect(k.x - (d.horizontal ? 3 : 0), k.y - (d.horizontal ? 0 : 3), k.w + (d.horizontal ? 6 : 0), k.h + (d.horizontal ? 0 : 6));
      c.fillStyle = '#e05030';
      c.beginPath();
      c.arc(k.x + k.w / 2, k.y + k.h / 2, 4, 0, 7);
      c.fill();
    }
  }
  for (const d of DOORS) {
    if (!isDoorOpen(state, d, timeline)) continue;
    const k = d.blocker;
    c.fillStyle = '#8a6a3a';
    if (d.horizontal) {
      c.fillRect(k.x - 3, k.y - 4, k.w + 6, 5);
      c.fillRect(k.x - 3, k.y + k.h - 1, k.w + 6, 5);
    } else {
      c.fillRect(k.x - 4, k.y - 3, 5, k.h + 6);
      c.fillRect(k.x + k.w - 1, k.y - 3, 5, k.h + 6);
    }
  }
}

function drawEntities(c: Ctx, state: GameState, i: PlayerIndex, player: Player | null): void {
  if (i) {
    for (const e of state.entities) {
      if (e.gone) continue;
      for (const p of e.trail) {
        const a = 1 - (state.time - p.t) / 6;
        if (a > 0) {
          c.fillStyle = `rgba(120,160,255,${a * 0.5})`;
          c.beginPath();
          c.ellipse(p.x, p.y, 5, 3, 0, 0, 7);
          c.fill();
        }
      }
    }
  }
  for (const e of state.entities) {
    if (e.gone) continue;
    if (!i && (!player || dist(e, player) > 260)) continue;
    let a = i ? 0.75 : 0.14;
    if (i && state.huntIndex === 1 && !e.real) a *= 0.2 + 0.8 * Math.abs(Math.sin(state.time * 9 + e.x));
    c.save();
    c.globalAlpha = a;
    c.translate(e.x, e.y + Math.sin(state.time * 2 + e.x) * 3);
    const g = c.createRadialGradient(0, -10, 2, 0, -10, 34);
    g.addColorStop(0, '#8f7cff');
    g.addColorStop(1, 'rgba(10,0,30,0)');
    c.fillStyle = g;
    c.fillRect(-34, -44, 68, 70);
    c.fillStyle = '#0a0614';
    c.beginPath();
    c.moveTo(-12, 14);
    c.lineTo(-18, -14);
    c.lineTo(-6, -30);
    c.lineTo(6, -30);
    c.lineTo(18, -14);
    c.lineTo(12, 14);
    c.lineTo(4, 8);
    c.lineTo(-4, 16);
    c.fill();
    c.fillStyle = '#fff';
    c.fillRect(-5, -24, 3, 3);
    c.fillRect(3, -24, 3, 3);
    c.restore();
    if (i && ((state.revealTimer > 0 && e.real) || e.marked)) {
      c.strokeStyle = e.marked ? '#f44' : '#7fe';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(e.x, e.y - 6, 30 + Math.sin(state.time * 6) * 3, 0, 7);
      c.stroke();
    }
  }
}

/** Lighting: a dark layer with soft holes cut out where lamps and the player are. */
function drawLighting(p: SceneParams, ox: number, oy: number): void {
  const { view, state, timeline: i, t, player, cx, cy } = p;
  const { ctx, light, lightCtx: lx, canvas } = view;
  const w = canvas.width;
  const h = canvas.height;

  lx.globalCompositeOperation = 'source-over';
  lx.fillStyle = i ? 'rgba(3,12,19,.58)' : 'rgba(32,19,5,.52)';
  lx.fillRect(0, 0, w, h);
  lx.globalCompositeOperation = 'destination-out';

  const hole = (x0: number, y0: number, r: number, a: number): void => {
    const x = x0 + ox;
    const y = y0 + oy;
    const g = lx.createRadialGradient(x, y, r * 0.1, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    lx.fillStyle = g;
    lx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  if (player) hole(player.x, player.y, i ? 290 : 320, 1);
  else hole(cx, cy, 520, 0.9);

  for (const r of ROOMS) {
    const l = lampLevel(state, r, i === 1 ? 'future' : 'past');
    if (l) {
      const flicker =
        (0.7 +
          0.3 *
            Math.sin(t * 11 + r.gx * 7 + r.gy * 3) *
            Math.sin(t * 3.7 + r.gy) *
            (state.flags.power && i ? 1 : Math.random() * 0.5 + 0.5)) *
        (Math.sin(t * 17 + r.gx * 5 + r.gy * 9) > 0.95 ? 0.25 : 1);
      hole(r.x + 150, r.y + 130, 300 * l, 0.95 * flicker);
    }
  }
  for (const d of DOORS) {
    hole(
      d.connector.x + d.connector.w / 2,
      d.connector.y + d.connector.h / 2,
      150,
      (state.brownout > 0 ? 0 : i ? 0.5 : 0.8) * (Math.sin(t * 9 + d.connector.x) > 0.92 ? 0.3 : 1),
    );
  }
  ctx.drawImage(light, 0, 0);

  ctx.globalCompositeOperation = 'screen';
  for (const r of ROOMS) {
    if (lampLevel(state, r, i === 1 ? 'future' : 'past') > 0.3) {
      const x = r.x + 150 + ox;
      const y = r.y + 130 + oy;
      const g = ctx.createRadialGradient(x, y, 5, x, y, 190);
      g.addColorStop(0, i ? 'rgba(90,100,200,.16)' : 'rgba(255,170,60,.17)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 190, y - 190, 380, 380);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

/** Moving shadow blobs, fog and dust. */
function drawAtmosphere(p: SceneParams, ox: number, oy: number): void {
  const { view, timeline: i, t, dust } = p;
  const { ctx, canvas } = view;
  const w = canvas.width;
  const h = canvas.height;

  for (let k = 0; k < 4; k++) {
    const x = ox + 700 + Math.sin(t * 0.13 + k * 1.7) * 650 + k * 60;
    const y = oy + 520 + Math.cos(t * 0.1 + k * 2.3) * 430;
    const g = ctx.createRadialGradient(x, y, 10, x, y, 170);
    g.addColorStop(0, 'rgba(0,0,0,.4)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 170, y - 170, 340, 340);
  }
  for (let k = 0; k < 7; k++) {
    const x = (Math.sin(t * 0.07 + k * 2) * 0.5 + 0.5) * w;
    const y = (Math.cos(t * 0.05 + k * 3) * 0.5 + 0.5) * h;
    const g = ctx.createRadialGradient(x, y, 10, x, y, 260);
    g.addColorStop(0, i ? 'rgba(150,160,230,.11)' : 'rgba(220,200,150,.09)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 260, y - 260, 520, 520);
  }
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  for (const m of dust) {
    m.y -= m.v * 0.02;
    m.x += Math.sin(t + m.v * 99) * 0.0006;
    if (m.y < 0) m.y = 1;
    ctx.fillRect(m.x * w, m.y * h, 2.2, 2.2);
  }
}

/** Draws one half-screen (or the menu background). Port of the original `scene`. */
export function renderScene(p: SceneParams): void {
  const { view, assets, state, timeline: i, cx, cy, t, player } = p;
  const { ctx, canvas } = view;
  const w = canvas.width;
  const h = canvas.height;
  const ox = Math.round(w / 2 - cx);
  const oy = Math.round(h / 2 - cy);

  ctx.save();
  ctx.translate(ox, oy);
  ctx.fillStyle = assets.wallPatterns[i] ?? '#000';
  ctx.fillRect(-ox, -oy, w, h);
  ctx.restore();
  ctx.drawImage(assets.worlds[i], ox, oy);

  ctx.save();
  ctx.translate(ox, oy);
  if (state.huntIndex === 0) {
    for (const object of INTERACTABLES) {
      if (HUNT1_INTERACTABLE_IDS.has(object.id) && object.timeline === (i ? 'future' : 'past')) drawProp(ctx, object, i === 1);
    }
  }
  if (state.huntIndex === 1) {
    for (const sourceObject of INTERACTABLES) {
      const object = getInteractableForState(sourceObject, state);
      const hiddenUntil = state.hunt2HiddenInteractablesUntil?.[object.id] ?? 0;
      const hidden = state.hunt2ObjectStates?.[object.id] === 'hidden' || (object.id === 'trueMemoryAnchor' && !state.hunt2Subtasks?.trueAnchorActivated);
      if (!HUNT2_INTERACTABLE_IDS.has(object.id) || object.timeline !== (i ? 'future' : 'past') || hidden || hiddenUntil > state.time) continue;
      if (object.id === 'falseDoor3' && state.hunt2OpenedInteractables?.includes(object.id)) {
        ctx.fillStyle = 'rgba(8,12,18,.9)'; ctx.fillRect(object.x - 17, object.y - 27, 34, 54);
        ctx.strokeStyle = 'rgba(121,215,208,.85)'; ctx.lineWidth = 2; ctx.strokeRect(object.x - 20, object.y - 30, 40, 58);
        ctx.fillStyle = 'rgba(118,202,198,.18)'; ctx.beginPath(); ctx.ellipse(object.x, object.y, 15, 25, 0, 0, Math.PI * 2); ctx.fill();
      } else drawProp(ctx, object, i === 1);
    }
  }
  drawDoors(ctx, state, i);

  // Glints on nearby props.
  for (const o of INTERACTABLES) {
    const huntOwnedVisible = (state.huntIndex === 0 && HUNT1_INTERACTABLE_IDS.has(o.id))
      || (state.huntIndex === 1 && HUNT2_INTERACTABLE_IDS.has(o.id));
    const temporarilyHidden = (state.hunt2HiddenInteractablesUntil?.[o.id] ?? 0) > state.time;
    const hunt2Hidden = state.hunt2ObjectStates?.[o.id] === 'hidden' || (o.id === 'trueMemoryAnchor' && !state.hunt2Subtasks?.trueAnchorActivated);
    if (!temporarilyHidden && !hunt2Hidden && (!HUNT1_INTERACTABLE_IDS.has(o.id) && !HUNT2_INTERACTABLE_IDS.has(o.id) || huntOwnedVisible)
      && o.timeline === (i ? 'future' : 'past') && player && dist(o, player) < GLOW_RADIUS) {
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 4 + o.x);
      ctx.fillStyle = i ? '#8f7cff' : '#ffd27a';
      ctx.beginPath();
      ctx.arc(o.x + Math.sin(t * 2 + o.y) * 10, o.y + Math.cos(t * 3) * 8, 3.5, 0, 7);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  drawEntities(ctx, state, i, player);

  for (const [x, y] of SHADOW_SPOTS) {
    const d = player ? dist({ x, y }, player) : 400;
    if (d > 240 && d < 760) {
      const flicker = Math.sin(t * 2.3 + x) > -0.4 ? 1 : 0;
      drawSilhouette(ctx, x + Math.sin(t * 0.8 + y) * 6, y, flicker * Math.min(0.55, (760 - d) / 500) * (i ? 1 : 0.55));
    }
  }
  for (const a of state.apparitions) {
    const age = t - a.t;
    if (a.playerIndex === i && age < 4) drawSilhouette(ctx, a.x, a.y, Math.sin((age / 4) * 3.14) * 0.85);
  }

  if (state.phase === 'playing') {
    const partner = state.players[i === 0 ? 1 : 0];
    drawBody(ctx, partner.x, partner.y, i ? '#e0a030' : '#2aa8a0', 0.3);
    const self = state.players[i];
    drawBody(ctx, self.x, self.y, i ? '#2aa8a0' : '#e0a030', 1);
  }
  ctx.restore();

  drawLighting(p, ox, oy);
  drawAtmosphere(p, ox, oy);
}
