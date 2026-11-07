
import { GLOW_RADIUS } from '../config/constants';
import {
  getInteractableForState,
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

/** Draws a distant humanoid shadow. */
function drawSilhouette(
  c: Ctx,
  x: number,
  y: number,
  a: number,
): void {
  if (a <= 0) return;

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

  // Faint supernatural eyes.
  c.shadowBlur = 8;
  c.shadowColor = '#b5c5ff';
  c.fillStyle = 'rgba(220,230,255,.9)';
  c.fillRect(-4, -20, 2, 2);
  c.fillRect(2, -20, 2, 2);
  c.shadowBlur = 0;

  c.restore();
}

/** Draws a player character and its ground shadow. */
function drawBody(
  c: Ctx,
  x: number,
  y: number,
  colour: string,
  alpha: number,
): void {
  c.save();
  c.globalAlpha = alpha;

  c.fillStyle = 'rgba(0,0,0,.55)';
  c.beginPath();
  c.ellipse(x, y + 9, 11, 5, 0, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = colour;
  c.beginPath();
  c.arc(x, y, 10, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#e8d0b0';
  c.beginPath();
  c.arc(x, y - 8, 6, 0, Math.PI * 2);
  c.fill();

  c.restore();
}

/** Draws timeline-specific doors and their blockers. */
function drawDoors(
  c: Ctx,
  state: GameState,
  i: PlayerIndex,
): void {
  const timeline = i === 1 ? 'future' : 'past';

  for (const d of DOORS) {
    if (isDoorOpen(state, d, timeline)) continue;

    const k = d.blocker;

    if (i) {
      // Future: broken rubble and debris.
      const q = createSeededRandom(k.x + k.y);

      for (let s = 0; s < 9; s++) {
        c.fillStyle = ['#5b5f68', '#444851', '#6a6e78'][s % 3];

        c.beginPath();
        c.ellipse(
          d.connector.x +
            (d.horizontal ? 30 + (s % 3) * 20 : q() * 60),
          d.connector.y +
            (d.horizontal ? q() * 60 : 30 + (s % 3) * 10),
          14 + q() * 8,
          12 + q() * 6,
          q(),
          0,
          Math.PI * 2,
        );
        c.fill();
      }
    } else {
      // Past: locked wooden door with a warning light.
      c.fillStyle = '#4a3420';

      c.fillRect(
        k.x - (d.horizontal ? 3 : 0),
        k.y - (d.horizontal ? 0 : 3),
        k.w + (d.horizontal ? 6 : 0),
        k.h + (d.horizontal ? 0 : 6),
      );

      c.save();
      c.shadowBlur = 12;
      c.shadowColor = '#e05030';
      c.fillStyle = '#e05030';

      c.beginPath();
      c.arc(
        k.x + k.w / 2,
        k.y + k.h / 2,
        4,
        0,
        Math.PI * 2,
      );
      c.fill();
      c.restore();
    }
  }

  // Door frames.
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

/** Draws paranormal entities, trails and spectral energy. */
function drawEntities(
  c: Ctx,
  state: GameState,
  i: PlayerIndex,
  player: Player | null,
): void {
  // Spectral traces are stronger in the Future timeline.
  if (i === 1) {
    for (const entity of state.entities) {
      if (entity.gone) continue;

      for (const point of entity.trail) {
        const age = state.time - point.t;
        const alpha = Math.max(0, 1 - age / 7);

        if (alpha <= 0) continue;

        c.save();
        c.globalAlpha = alpha * 0.65;

        const trace = c.createRadialGradient(
          point.x,
          point.y,
          1,
          point.x,
          point.y,
          18,
        );

        trace.addColorStop(0, 'rgba(150,175,255,0.8)');
        trace.addColorStop(0.4, 'rgba(100,110,255,0.3)');
        trace.addColorStop(1, 'rgba(50,30,150,0)');

        c.fillStyle = trace;
        c.beginPath();
        c.arc(point.x, point.y, 18, 0, Math.PI * 2);
        c.fill();

        // Small residual energy mark.
        c.fillStyle = 'rgba(165,190,255,0.35)';
        c.beginPath();
        c.ellipse(point.x, point.y, 5, 3, 0, 0, Math.PI * 2);
        c.fill();

        c.restore();
      }
    }
  }

  for (const entity of state.entities) {
    if (entity.gone) continue;

    const distance = player ? dist(entity, player) : 500;

    if (!i && (!player || distance > 300)) continue;

    const proximity = Math.max(0, 1 - distance / 300);

    let alpha = i ? 0.82 : 0.18;

    if (i && state.huntIndex === 1 && !entity.real) {
      alpha *=
        0.2 +
        0.8 * Math.abs(Math.sin(state.time * 9 + entity.x));
    }

    const flicker =
      0.86 + Math.sin(state.time * 7 + entity.x) * 0.1;

    const floatY =
      Math.sin(state.time * 1.8 + entity.x) * 5;

    c.save();
    c.globalAlpha = alpha * flicker;
    c.translate(entity.x, entity.y + floatY);

    // Large paranormal aura.
    const aura = c.createRadialGradient(
      0,
      -12,
      3,
      0,
      -12,
      65 + proximity * 25,
    );

    aura.addColorStop(0, 'rgba(170,145,255,0.45)');
    aura.addColorStop(0.3, 'rgba(110,80,220,0.22)');
    aura.addColorStop(0.7, 'rgba(60,45,160,0.08)');
    aura.addColorStop(1, 'rgba(10,0,35,0)');

    c.fillStyle = aura;
    c.fillRect(-90, -100, 180, 180);

    // Distorted energy tendrils.
    c.strokeStyle = 'rgba(150,140,255,0.24)';
    c.lineWidth = 2;

    for (let k = 0; k < 4; k++) {
      const sway = Math.sin(state.time * 2.5 + k * 2) * 9;

      c.beginPath();
      c.moveTo((k - 1.5) * 8, 5);

      c.quadraticCurveTo(
        (k - 1.5) * 20 + sway,
        22,
        (k - 1.5) * 25 - sway,
        42 + Math.sin(state.time * 3 + k) * 7,
      );

      c.stroke();
    }

    // Shadow body.
    c.fillStyle = '#080511';
    c.beginPath();

    c.moveTo(-12, 15);
    c.quadraticCurveTo(-20, -5, -15, -22);
    c.lineTo(-7, -34);
    c.quadraticCurveTo(0, -39, 7, -34);
    c.lineTo(15, -22);
    c.quadraticCurveTo(20, -5, 12, 15);
    c.lineTo(5, 9);
    c.lineTo(0, 18);
    c.lineTo(-5, 9);
    c.closePath();
    c.fill();

    // Ghostly head aura.
    const headGlow = c.createRadialGradient(
      0,
      -27,
      1,
      0,
      -27,
      18,
    );

    headGlow.addColorStop(0, 'rgba(125,110,220,0.32)');
    headGlow.addColorStop(1, 'rgba(20,10,50,0)');

    c.fillStyle = headGlow;
    c.fillRect(-20, -47, 40, 40);

    // Eyes.
    c.shadowBlur = 12;
    c.shadowColor = '#a99aff';
    c.fillStyle = '#d9d5ff';

    c.fillRect(-6, -25, 3, 3);
    c.fillRect(3, -25, 3, 3);

    c.shadowBlur = 0;
    c.restore();

    // Reveal and marking indicators.
    if (
      i === 1 &&
      ((state.revealTimer > 0 && entity.real) || entity.marked)
    ) {
      c.save();

      const revealColor = entity.marked ? '#ff5151' : '#8dffff';

      c.strokeStyle = revealColor;
      c.shadowColor = revealColor;
      c.shadowBlur = 15;
      c.lineWidth = 2;

      c.beginPath();
      c.arc(
        entity.x,
        entity.y - 8,
        36 + Math.sin(state.time * 5) * 4,
        0,
        Math.PI * 2,
      );

      c.stroke();
      c.restore();
    }
  }
}

/** Lighting: dark layer with soft light openings. */
function drawLighting(
  p: SceneParams,
  ox: number,
  oy: number,
): void {
  const {
    view,
    state,
    timeline: i,
    t,
    player,
    cx,
    cy,
  } = p;

  const { ctx, light, lightCtx: lx, canvas } = view;

  const w = canvas.width;
  const h = canvas.height;

  if (!w || !h) return;

  // Base darkness.
  lx.globalCompositeOperation = 'source-over';

  lx.fillStyle = i
    ? 'rgba(3,9,24,.66)'
    : 'rgba(29,17,7,.58)';

  lx.fillRect(0, 0, w, h);

  // Remove darkness around light sources.
  lx.globalCompositeOperation = 'destination-out';

  const hole = (
    x0: number,
    y0: number,
    r: number,
    a: number,
  ): void => {
    const x = x0 + ox;
    const y = y0 + oy;

    const g = lx.createRadialGradient(
      x,
      y,
      r * 0.1,
      x,
      y,
      r,
    );

    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(0.55, `rgba(0,0,0,${a * 0.45})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');

    lx.fillStyle = g;
    lx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  // Player light.
  if (player) {
    hole(player.x, player.y, i ? 255 : 285, 1);
  } else {
    hole(cx, cy, 520, 0.9);
  }

  // Room lamps with deterministic flickering.
  for (const room of ROOMS) {
    const level = lampLevel(
      state,
      room,
      i === 1 ? 'future' : 'past',
    );

    if (!level) continue;

    const powerFactor =
      state.flags.power && i ? 1 : 0.75;

    const slowFlicker =
      0.88 +
      0.12 *
        Math.sin(t * 8 + room.gx * 7 + room.gy * 3);

    const irregularFlicker =
      Math.sin(t * 17 + room.gx * 5 + room.gy * 9) > 0.965
        ? 0.22
        : 1;

    const flicker =
      slowFlicker * irregularFlicker * powerFactor;

    hole(
      room.x + 150,
      room.y + 130,
      300 * level,
      0.95 * flicker,
    );
  }

  // Doorway light leakage.
  for (const door of DOORS) {
    hole(
      door.connector.x + door.connector.w / 2,
      door.connector.y + door.connector.h / 2,
      150,
      (state.brownout > 0 ? 0 : i ? 0.5 : 0.8) *
        (Math.sin(t * 9 + door.connector.x) > 0.92 ? 0.3 : 1),
    );
  }

  // Apply darkness layer.
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(light, 0, 0);

  // Add coloured lamp glow.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (const room of ROOMS) {
    const level = lampLevel(
      state,
      room,
      i === 1 ? 'future' : 'past',
    );

    if (level <= 0.3) continue;

    const x = room.x + 150 + ox;
    const y = room.y + 130 + oy;

    const g = ctx.createRadialGradient(
      x,
      y,
      5,
      x,
      y,
      190,
    );

    g.addColorStop(
      0,
      i
        ? 'rgba(90,110,225,.19)'
        : 'rgba(255,170,80,.18)',
    );

    g.addColorStop(
      0.5,
      i
        ? 'rgba(65,75,175,.06)'
        : 'rgba(180,105,40,.06)',
    );

    g.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = g;
    ctx.fillRect(x - 190, y - 190, 380, 380);
  }

  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

/** Moving shadows, layered fog, floating ash and spectral particles. */
function drawAtmosphere(
  p: SceneParams,
): void {
  const { view, timeline: i, t, dust } = p;
  const { ctx, canvas } = view;

  const w = canvas.width;
  const h = canvas.height;

  if (!w || !h) return;

  ctx.save();

  // 1. Timeline-specific ambient colour grade.
  const ambient = ctx.createLinearGradient(
    0,
    0,
    0,
    h,
  );

  if (i === 1) {
    ambient.addColorStop(0, 'rgba(8,12,35,0.12)');
    ambient.addColorStop(0.55, 'rgba(15,20,55,0.07)');
    ambient.addColorStop(1, 'rgba(25,15,55,0.18)');
  } else {
    ambient.addColorStop(0, 'rgba(25,17,12,0.10)');
    ambient.addColorStop(0.55, 'rgba(30,22,15,0.04)');
    ambient.addColorStop(1, 'rgba(35,25,16,0.15)');
  }

  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, w, h);

  // 2. Moving fog layers.
  ctx.globalCompositeOperation = 'screen';

  for (let k = 0; k < 5; k++) {
    const x =
      w * (0.5 + Math.sin(t * 0.12 + k * 1.8) * 0.42);

    const y =
      h * (0.55 + Math.cos(t * 0.09 + k * 1.4) * 0.2);

    const radius = w * (0.22 + (k % 3) * 0.07);

    const fog = ctx.createRadialGradient(
      x,
      y,
      5,
      x,
      y,
      radius,
    );

    const colour = i === 1
      ? '135,145,235'
      : '180,150,110';

    fog.addColorStop(0, `rgba(${colour},0.075)`);
    fog.addColorStop(0.35, `rgba(${colour},0.035)`);
    fog.addColorStop(1, `rgba(${colour},0)`);

    ctx.fillStyle = fog;
    ctx.fillRect(
      x - radius,
      y - radius,
      radius * 2,
      radius * 2,
    );
  }

  // 3. Horizontal low-lying mist.
  for (let k = 0; k < 3; k++) {
    const y =
      h * (0.66 + k * 0.13) +
      Math.sin(t * 0.35 + k) * 12;

    const x =
      Math.sin(t * 0.15 + k * 2) * w * 0.15;

    const mist = ctx.createLinearGradient(
      x,
      y - 45,
      x,
      y + 65,
    );

    mist.addColorStop(0, 'rgba(100,115,175,0)');
    mist.addColorStop(
      0.5,
      i
        ? 'rgba(120,135,220,0.045)'
        : 'rgba(185,155,115,0.035)',
    );

    mist.addColorStop(1, 'rgba(100,115,175,0)');

    ctx.fillStyle = mist;
    ctx.fillRect(0, y - 65, w, 130);
  }

  // 4. Moving distant shadow disturbances.
  ctx.globalCompositeOperation = 'multiply';

  for (let k = 0; k < 4; k++) {
    const x =
      w * (0.5 + Math.sin(t * 0.13 + k * 1.7) * 0.5);

    const y =
      h * (0.5 + Math.cos(t * 0.1 + k * 2.3) * 0.35);

    const shadow = ctx.createRadialGradient(
      x,
      y,
      10,
      x,
      y,
      170,
    );

    shadow.addColorStop(0, 'rgba(0,0,0,0.16)');
    shadow.addColorStop(0.5, 'rgba(0,0,0,0.07)');
    shadow.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = shadow;
    ctx.fillRect(x - 170, y - 170, 340, 340);
  }

  // 5. Floating dust and spectral particles.
  ctx.globalCompositeOperation = 'screen';

  for (let index = 0; index < dust.length; index++) {
    const mote = dust[index];

    mote.y -= mote.v * 0.012;

    mote.x +=
      Math.sin(t * 0.3 + index) * 0.00025;

    if (mote.y < -0.02) {
      mote.y = 1.02;
      mote.x = Math.random();
    }

    if (mote.x < 0) mote.x = 1;
    if (mote.x > 1) mote.x = 0;

    const x = mote.x * w;
    const y = mote.y * h;

    const shimmer =
      0.35 +
      Math.abs(Math.sin(t * 1.8 + index)) * 0.65;

    const size = index % 11 === 0 ? 3 : 1.5;

    ctx.globalAlpha = shimmer * 0.45;

    ctx.fillStyle =
      index % 4 === 0 ? '#a9a0ff' : '#c5d1e9';

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  // 6. Rare supernatural light pulses.
  const pulse = Math.pow(
    Math.max(0, Math.sin(t * 0.7 + 1)),
    18,
  );

  if (pulse > 0.03) {
    ctx.fillStyle =
      `rgba(115,125,255,${pulse * 0.055})`;

    ctx.fillRect(0, 0, w, h);
  }

  // 7. Distant spectral glow.
  const glowX =
    w * (0.75 + Math.sin(t * 0.16) * 0.13);

  const glowY =
    h * (0.36 + Math.cos(t * 0.12) * 0.1);

  const distantGlow = ctx.createRadialGradient(
    glowX,
    glowY,
    1,
    glowX,
    glowY,
    w * 0.22,
  );

  distantGlow.addColorStop(
    0,
    'rgba(115,105,255,0.055)',
  );

  distantGlow.addColorStop(
    1,
    'rgba(60,50,180,0)',
  );

  ctx.fillStyle = distantGlow;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();

  // 8. Cinematic vignette.
  const vignette = ctx.createRadialGradient(
    w * 0.5,
    h * 0.48,
    Math.min(w, h) * 0.2,
    w * 0.5,
    h * 0.48,
    Math.max(w, h) * 0.76,
  );

  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.5, 'rgba(0,0,0,0.08)');
  vignette.addColorStop(1, 'rgba(0,0,8,0.58)');

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

/** Draws one half-screen (or the menu background). */
export function renderScene(p: SceneParams): void {
  const {
    view,
    assets,
    state,
    timeline: i,
    cx,
    cy,
    t,
    player,
  } = p;

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
      if (
        HUNT1_INTERACTABLE_IDS.has(object.id) &&
        object.timeline === (i ? 'future' : 'past')
      ) {
        drawProp(ctx, object, i === 1);
      }
    }
  }

  // HUNT II INTERACTABLES.
  if (state.huntIndex === 1) {
    for (const sourceObject of INTERACTABLES) {
      const object = getInteractableForState(
        sourceObject,
        state,
      );

      const hiddenUntil =
        state.hunt2HiddenInteractablesUntil?.[object.id] ?? 0;

      const hidden =
        state.hunt2ObjectStates?.[object.id] === 'hidden' ||
        (object.id === 'trueMemoryAnchor' &&
          !state.hunt2Subtasks?.trueAnchorActivated);

      if (
        !HUNT2_INTERACTABLE_IDS.has(object.id) ||
        object.timeline !== (i ? 'future' : 'past') ||
        hidden ||
        hiddenUntil > state.time
      ) {
        continue;
      }

      if (
        object.id === 'falseDoor3' &&
        state.hunt2OpenedInteractables?.includes(object.id)
      ) {
        ctx.fillStyle = 'rgba(8,12,18,.9)';

        ctx.fillRect(
          object.x - 17,
          object.y - 27,
          34,
          54,
        );

        ctx.strokeStyle = 'rgba(121,215,208,.85)';
        ctx.lineWidth = 2;

        ctx.strokeRect(
          object.x - 20,
          object.y - 30,
          40,
          58,
        );

        ctx.fillStyle = 'rgba(118,202,198,.18)';

        ctx.beginPath();
        ctx.ellipse(
          object.x,
          object.y,
          15,
          25,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else {
        drawProp(ctx, object, i === 1);
      }
    }
  }

  // HUNT III INTERACTABLES.
  if (state.huntIndex === 2) {
    for (const object of INTERACTABLES) {
      if (
        HUNT3_INTERACTABLE_IDS.has(object.id) &&
        isHunt3InteractableAvailable(
          object.id,
          state.hunt3Stage,
        ) &&
        object.timeline === (i ? 'future' : 'past')
      ) {
        drawProp(ctx, object, i === 1);
      }
    }
  }

  // Doors.
  drawDoors(ctx, state, i);

  // Nearby interactable glints.
  for (const object of INTERACTABLES) {
    const huntOwnedVisible =
      (state.huntIndex === 0 &&
        HUNT1_INTERACTABLE_IDS.has(object.id)) ||
      (state.huntIndex === 1 &&
        HUNT2_INTERACTABLE_IDS.has(object.id)) ||
      (state.huntIndex === 2 &&
        HUNT3_INTERACTABLE_IDS.has(object.id) &&
        isHunt3InteractableAvailable(
          object.id,
          state.hunt3Stage,
        ));

    const temporarilyHidden =
      (state.hunt2HiddenInteractablesUntil?.[object.id] ?? 0) >
      state.time;

    const hunt2Hidden =
      state.hunt2ObjectStates?.[object.id] === 'hidden' ||
      (object.id === 'trueMemoryAnchor' &&
        !state.hunt2Subtasks?.trueAnchorActivated);

    if (
      !temporarilyHidden &&
      !hunt2Hidden &&
      (
        !HUNT1_INTERACTABLE_IDS.has(object.id) &&
        !HUNT2_INTERACTABLE_IDS.has(object.id) &&
        !HUNT3_INTERACTABLE_IDS.has(object.id) ||
        huntOwnedVisible
      ) &&
      object.timeline === (i ? 'future' : 'past') &&
      player &&
      dist(object, player) < GLOW_RADIUS
    ) {
      ctx.save();

      const shimmer =
        0.5 + 0.5 * Math.sin(t * 4 + object.x);

      const glowColour =
        i ? '#9b88ff' : '#ffd27a';

      ctx.globalAlpha = 0.35 + 0.35 * shimmer;
      ctx.shadowBlur = 12;
      ctx.shadowColor = glowColour;
      ctx.fillStyle = glowColour;

      ctx.beginPath();

      ctx.arc(
        object.x + Math.sin(t * 2 + object.y) * 10,
        object.y + Math.cos(t * 3) * 8,
        3.5 + shimmer,
        0,
        Math.PI * 2,
      );

      ctx.fill();
      ctx.restore();
    }
  }

  // Paranormal entities.
  drawEntities(ctx, state, i, player);

  // Distant wandering shadows.
  for (const [x, y] of SHADOW_SPOTS) {
    const d = player
      ? dist({ x, y }, player)
      : 400;

    if (d > 240 && d < 760) {
      const flicker =
        Math.sin(t * 2.3 + x) > -0.4 ? 1 : 0;

      const visibility =
        flicker *
        Math.min(0.55, (760 - d) / 500) *
        (i ? 1 : 0.55);

      drawSilhouette(
        ctx,
        x + Math.sin(t * 0.8 + y) * 6,
        y,
        visibility,
      );
    }
  }

  // Temporary apparitions.
  for (const apparition of state.apparitions) {
    const age = t - apparition.t;

    if (apparition.playerIndex === i && age < 4 && age >= 0) {
      const fade =
        Math.sin((age / 4) * Math.PI) * 0.85;

      drawSilhouette(
        ctx,
        apparition.x,
        apparition.y,
        fade,
      );
    }
  }

  // Player and partner.
  if (state.phase === 'playing') {
    const partner =
      state.players[i === 0 ? 1 : 0];

    drawBody(
      ctx,
      partner.x,
      partner.y,
      i ? '#e0a030' : '#2aa8a0',
      0.3,
    );

    const self = state.players[i];

    drawBody(
      ctx,
      self.x,
      self.y,
      i ? '#2aa8a0' : '#e0a030',
      1,
    );
  }

  ctx.restore();

  // Apply lighting and environmental atmosphere.
  drawLighting(p, ox, oy);
  drawAtmosphere(p);
}
