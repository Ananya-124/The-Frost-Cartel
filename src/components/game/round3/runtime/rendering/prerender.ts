import { RUNES, WORLD_HEIGHT, WORLD_WIDTH } from '../config/constants';
import { HUNT1_INTERACTABLE_IDS, HUNT2_INTERACTABLE_IDS, HUNT3_INTERACTABLE_IDS, INTERACTABLES } from '../config/interactables';
import { ROOMS } from '../config/rooms';
import { DOORS, WALKABLE_RECTS } from '../engine/world/geometry';
import type { InteractableObject, PlayerIndex, Room } from '../types';
import { randomInt } from '../utils/math';
import { createSeededRandom } from '../utils/rng';

type Ctx = CanvasRenderingContext2D;

const TAU = Math.PI * 2;

export interface WorldAssets {
  /** Fully pre-drawn world for each timeline. */
  worlds: [HTMLCanvasElement, HTMLCanvasElement];
  wallPatterns: [CanvasPattern | null, CanvasPattern | null];
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

export function get2d(canvas: HTMLCanvasElement): Ctx {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not supported');
  return ctx;
}

/** Furniture block with contact shadow, lit top face, grain, front face and outline. */
function box(c: Ctx, x: number, y: number, w: number, h: number, col: string, depth = 7): void {
  const r = createSeededRandom(Math.floor(x * 31 + y * 17 + w * 7 + h));
  // Contact + cast shadow.
  c.fillStyle = 'rgba(0,0,0,.3)';
  c.fillRect(x + 3, y + 4, w + 2, h + 2);
  c.fillStyle = 'rgba(0,0,0,.42)';
  c.fillRect(x + 7, y + 9, w, h);
  // Top face.
  c.fillStyle = col;
  c.fillRect(x, y, w, h - depth);
  const g = c.createLinearGradient(x, y, x, y + h - depth);
  g.addColorStop(0, 'rgba(255,255,255,.22)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,.25)');
  c.fillStyle = g;
  c.fillRect(x, y, w, h - depth);
  const grains = Math.min(16, Math.floor((w * h) / 90));
  for (let k = 0; k < grains; k++) {
    c.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.12})`;
    c.fillRect(x + r() * w, y + r() * Math.max(1, h - depth), 1 + r() * 7, 1);
  }
  // Front face.
  c.fillStyle = col;
  c.fillRect(x, y + h - depth, w, depth);
  c.fillStyle = 'rgba(0,0,0,.52)';
  c.fillRect(x, y + h - depth, w, depth);
  c.fillStyle = 'rgba(255,255,255,.18)';
  c.fillRect(x, y, w, 1.5);
  c.strokeStyle = 'rgba(0,0,0,.75)';
  c.lineWidth = 1;
  c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function glow(c: Ctx, x: number, y: number, radius: number, color: string, alpha: number): void {
  const g = c.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color.replace('A', String(alpha)));
  g.addColorStop(1, color.replace('A', '0'));
  c.fillStyle = g;
  c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

/* -------------------------------------------------------------------------- */
/*  Floors & walls                                                            */
/* -------------------------------------------------------------------------- */

function floorTile(future: boolean): HTMLCanvasElement {
  const canvas = makeCanvas(64, 64);
  const x = get2d(canvas);
  const r = createSeededRandom(future ? 105 : 109);

  if (!future) {
    // PAST: stained clinical linoleum, sickly green and yellowed.
    for (let ty = 0; ty < 2; ty++) {
      for (let tx = 0; tx < 2; tx++) {
        x.fillStyle = (tx + ty) % 2 ? '#7b8265' : '#8a8f70';
        x.fillRect(tx * 32, ty * 32, 32, 32);
        const g = x.createLinearGradient(tx * 32, ty * 32, tx * 32 + 32, ty * 32 + 32);
        g.addColorStop(0, 'rgba(255,255,230,.08)');
        g.addColorStop(1, 'rgba(0,0,0,.14)');
        x.fillStyle = g;
        x.fillRect(tx * 32, ty * 32, 32, 32);
      }
    }
    x.strokeStyle = 'rgba(18,20,12,.6)';
    x.lineWidth = 1.4;
    x.strokeRect(0.5, 0.5, 63, 63);
    x.beginPath();
    x.moveTo(32, 0); x.lineTo(32, 64);
    x.moveTo(0, 32); x.lineTo(64, 32);
    x.stroke();

    for (let k = 0; k < 140; k++) {
      x.fillStyle = r() > 0.5 ? `rgba(240,235,190,${0.03 + r() * 0.08})` : `rgba(20,14,6,${0.04 + r() * 0.1})`;
      x.fillRect(r() * 64, r() * 64, 1 + r() * 4, 1 + r() * 2);
    }
    // Buffer scuffs.
    x.strokeStyle = 'rgba(235,230,200,.16)';
    for (let k = 0; k < 5; k++) {
      const sx = r() * 56; const sy = r() * 56;
      x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + 12, sy + (r() - 0.5) * 8, sx + 22, sy + (r() - 0.5) * 6); x.stroke();
    }
    // Water-damage stains.
    x.fillStyle = 'rgba(92,70,30,.16)';
    x.beginPath(); x.ellipse(14 + r() * 36, 14 + r() * 36, 8 + r() * 10, 5 + r() * 7, r() * 3, 0, TAU); x.fill();
    x.fillStyle = 'rgba(60,32,18,.1)';
    x.beginPath(); x.ellipse(20 + r() * 26, 20 + r() * 26, 4 + r() * 5, 3 + r() * 4, r() * 3, 0, TAU); x.fill();
    // Hairline cracks.
    x.strokeStyle = 'rgba(25,20,10,.55)';
    for (let k = 0; k < 3; k++) {
      let sx = 6 + r() * 50; let sy = 6 + r() * 50;
      x.beginPath(); x.moveTo(sx, sy);
      for (let s = 0; s < 4; s++) { sx += (r() - 0.5) * 10; sy += 4 + r() * 7; x.lineTo(sx, sy); }
      x.stroke();
    }
    return canvas;
  }

  // FUTURE: collapsed, wet concrete with rust, moss and standing water.
  x.fillStyle = '#566062';
  x.fillRect(0, 0, 64, 64);
  const base = x.createLinearGradient(0, 0, 64, 64);
  base.addColorStop(0, 'rgba(120,130,125,.10)');
  base.addColorStop(1, 'rgba(0,0,0,.22)');
  x.fillStyle = base;
  x.fillRect(0, 0, 64, 64);
  x.strokeStyle = 'rgba(8,10,10,.7)';
  x.lineWidth = 2;
  x.strokeRect(1, 1, 62, 62);
  x.lineWidth = 1;
  x.beginPath(); x.moveTo(32, 1); x.lineTo(32, 63); x.stroke();

  for (let k = 0; k < 160; k++) {
    x.fillStyle = r() > 0.5 ? `rgba(170,180,172,${0.03 + r() * 0.08})` : `rgba(0,0,0,${0.05 + r() * 0.14})`;
    x.fillRect(r() * 64, r() * 64, 1 + r() * 3, 1 + r() * 3);
  }
  // Rust streaks.
  for (let k = 0; k < 2; k++) {
    const sx = 6 + r() * 52;
    const g = x.createLinearGradient(sx, 0, sx, 64);
    g.addColorStop(0, 'rgba(110,52,22,0)');
    g.addColorStop(0.4, 'rgba(110,52,22,.28)');
    g.addColorStop(1, 'rgba(70,30,14,0)');
    x.fillStyle = g;
    x.fillRect(sx, 0, 2 + r() * 3, 64);
  }
  // Puddle with cold reflection.
  if (r() > 0.35) {
    const px = 14 + r() * 36; const py = 14 + r() * 36;
    x.fillStyle = 'rgba(28,45,55,.55)';
    x.beginPath(); x.ellipse(px, py, 11 + r() * 8, 6 + r() * 4, r() * 2, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(170,205,220,.2)';
    x.beginPath(); x.ellipse(px - 2, py - 1, 7, 3, 0, 0.2, 2.6); x.stroke();
  }
  // Moss / mould.
  for (let k = 0; k < 6; k++) {
    x.fillStyle = `rgba(${40 + r() * 20},${62 + r() * 26},${40 + r() * 14},.3)`;
    x.beginPath(); x.arc(r() * 64, r() * 64, 1.5 + r() * 4, 0, TAU); x.fill();
  }
  // Deep fractures.
  x.strokeStyle = 'rgba(2,3,3,.8)';
  for (let k = 0; k < 4; k++) {
    let sx = 4 + r() * 56; let sy = 4 + r() * 56;
    x.lineWidth = 1 + r();
    x.beginPath(); x.moveTo(sx, sy);
    for (let s = 0; s < 5; s++) { sx += (r() - 0.5) * 14; sy += 4 + r() * 9; x.lineTo(sx, sy); }
    x.stroke();
  }
  x.lineWidth = 1;
  return canvas;
}

function wallTile(future: boolean): HTMLCanvasElement {
  const canvas = makeCanvas(96, 64);
  const x = get2d(canvas);
  const r = createSeededRandom(future ? 221 : 222);

  if (!future) {
    // PAST: peeling green plaster over a tiled dado, soaked with damp.
    x.fillStyle = '#56624c';
    x.fillRect(0, 0, 96, 38);
    for (let k = 0; k < 26; k++) {
      x.fillStyle = r() > 0.5 ? `rgba(130,150,110,${0.05 + r() * 0.1})` : `rgba(20,28,16,${0.06 + r() * 0.12})`;
      x.beginPath(); x.ellipse(r() * 96, r() * 38, 4 + r() * 14, 2 + r() * 8, r() * 3, 0, TAU); x.fill();
    }
    // Peeled patches exposing brick.
    for (let k = 0; k < 3; k++) {
      const px = 8 + r() * 70; const py = 3 + r() * 20;
      x.fillStyle = '#6a4a3a';
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + 10 + r() * 10, py + 2); x.lineTo(px + 14 + r() * 8, py + 10 + r() * 6); x.lineTo(px + 3, py + 14 + r() * 4); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(12,10,6,.6)'; x.stroke();
    }
    // Damp drips.
    for (let k = 0; k < 5; k++) {
      const dx = r() * 96;
      const g = x.createLinearGradient(dx, 0, dx, 38);
      g.addColorStop(0, 'rgba(25,30,18,.35)');
      g.addColorStop(1, 'rgba(25,30,18,0)');
      x.fillStyle = g; x.fillRect(dx, 0, 2 + r() * 3, 38);
    }
    // Tiled dado.
    for (let ty = 0; ty < 2; ty++) {
      for (let tx = 0; tx < 6; tx++) {
        x.fillStyle = (tx + ty) % 2 ? '#a8ad98' : '#b3b7a2';
        x.fillRect(tx * 16 + 1, 38 + ty * 13 + 1, 14, 11);
        x.fillStyle = 'rgba(0,0,0,.22)';
        x.fillRect(tx * 16 + 1, 38 + ty * 13 + 9, 14, 3);
      }
    }
    x.fillStyle = 'rgba(30,24,12,.35)';
    x.fillRect(0, 38, 96, 26);
    x.fillStyle = '#2f2a1e'; x.fillRect(0, 36, 96, 3);
    x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(0, 36, 96, 1);
    return canvas;
  }

  // FUTURE: ruined concrete blockwork, black mould and exposed rebar.
  x.fillStyle = '#434b49';
  x.fillRect(0, 0, 96, 64);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? -24 : 0;
    for (let col = 0; col < 3; col++) {
      const bx = off + col * 48;
      x.fillStyle = ['#3a3f3c', '#343936', '#40453f'][Math.floor(r() * 3)];
      x.fillRect(bx + 1, row * 16 + 1, 46, 14);
      x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(bx + 1, row * 16 + 13, 46, 2);
      x.fillStyle = 'rgba(190,200,190,.07)'; x.fillRect(bx + 2, row * 16 + 1, 44, 1);
    }
  }
  for (let k = 0; k < 10; k++) {
    const mx = r() * 96; const my = r() * 64;
    const g = x.createRadialGradient(mx, my, 0, mx, my, 8 + r() * 12);
    g.addColorStop(0, 'rgba(6,10,6,.55)'); g.addColorStop(1, 'rgba(6,10,6,0)');
    x.fillStyle = g; x.fillRect(mx - 20, my - 20, 40, 40);
  }
  for (let k = 0; k < 4; k++) {
    const dx = r() * 96;
    const g = x.createLinearGradient(dx, 0, dx, 64);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(10,14,12,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(dx, 0, 2 + r() * 3, 64);
  }
  x.strokeStyle = 'rgba(0,0,0,.8)';
  x.lineWidth = 1;
  x.beginPath();
  x.moveTo(13, 2); x.lineTo(21, 18); x.lineTo(12, 30); x.lineTo(25, 44); x.lineTo(17, 62);
  x.moveTo(77, 4); x.lineTo(69, 21); x.lineTo(82, 34); x.lineTo(73, 52);
  x.stroke();
  // Rusted rebar.
  x.strokeStyle = '#7a4222'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(50, 22); x.lineTo(60, 25); x.moveTo(50, 27); x.lineTo(63, 32); x.stroke();
  x.lineWidth = 1;
  return canvas;
}

/* -------------------------------------------------------------------------- */
/*  Rooms                                                                     */
/* -------------------------------------------------------------------------- */

/** Room furniture, clutter and horror dressing. */
function drawRoom(c: Ctx, room: Room, future: boolean): void {
  const X = room.x;
  const Y = room.y;
  const id = room.id;
  const q = createSeededRandom(room.gx * 7 + room.gy * 13 + 3);

  if (['lab', 'exam', 'con'].includes(id)) {
    c.fillStyle = future ? 'rgba(50,90,70,.22)' : 'rgba(80,125,80,.2)';
    c.fillRect(X, Y, room.w, room.h);
  }
  if (['dir', 'rec', 'hall'].includes(id)) {
    // Worn carpet.
    const rg = c.createLinearGradient(X + 40, Y + 60, X + 260, Y + 220);
    rg.addColorStop(0, future ? 'rgba(70,24,24,.45)' : 'rgba(120,34,30,.45)');
    rg.addColorStop(1, future ? 'rgba(40,14,14,.5)' : 'rgba(85,22,22,.45)');
    c.fillStyle = rg;
    c.fillRect(X + 40, Y + 60, 220, 160);
    c.strokeStyle = 'rgba(200,170,90,.35)';
    c.strokeRect(X + 48, Y + 68, 204, 144);
    c.strokeStyle = 'rgba(0,0,0,.25)';
    for (let k = 0; k < 14; k++) { c.beginPath(); c.moveTo(X + 40, Y + 60 + k * 11.4); c.lineTo(X + 260, Y + 60 + k * 11.4); c.stroke(); }
  }
  if (id === 'exam') {
    box(c, X + 30, Y + 190, 70, 42, '#cfcab8');
    box(c, X + 210, Y + 90, 50, 40, '#8d958f');
    for (let k = 0; k < 4; k++) {
      c.fillStyle = '#b9c2c8';
      c.fillRect(X + 215 + k * 10, Y + 98, 6, 16);
    }
    c.strokeStyle = '#999';
    c.beginPath();
    c.moveTo(X + 20, Y + 14);
    c.lineTo(X + 280, Y + 14);
    c.stroke();
    // Privacy curtain rail with hanging curtain.
    c.fillStyle = future ? 'rgba(110,120,110,.4)' : 'rgba(170,190,170,.45)';
    for (let k = 0; k < 10; k++) c.fillRect(X + 20 + k * 26, Y + 14, 22, 18 + (k % 3) * 3);
  }
  if (id === 'arch') {
    for (let k = 0; k < 3; k++) {
      box(c, X + 25, Y + 110 + k * 55, 250, 26, '#5a3d22');
      for (let b = 0; b < 24; b++) {
        c.fillStyle = ['#8a2d2d', '#2d4a8a', '#6b6b2d', '#3d6b3d'][randomInt(4)];
        c.fillRect(X + 30 + b * 10, Y + 113 + k * 55, 7, 14);
      }
    }
  }
  if (id === 'dir') {
    box(c, X + 30, Y + 210, 50, 40, '#4a2a2a');
    box(c, X + 220, Y + 210, 50, 40, '#4a2a2a');
  }
  if (id === 'obs') {
    c.fillStyle = 'rgba(150,200,230,.45)';
    c.fillRect(X + 30, Y + 8, 240, 16);
    c.fillStyle = 'rgba(255,255,255,.4)';
    for (let k = 0; k < 5; k++) c.fillRect(X + 40 + k * 48, Y + 8, 8, 16);
    box(c, X + 40, Y + 120, 90, 26, '#443b30');
    box(c, X + 170, Y + 120, 90, 26, '#443b30');
  }
  if (id === 'lab') {
    box(c, X + 40, Y + 150, 200, 34, '#707a78');
    for (let k = 0; k < 7; k++) {
      c.fillStyle = ['#7be', '#e77', '#7e9', '#eb6'][k % 4];
      c.beginPath();
      c.arc(X + 55 + k * 28, Y + 157, 5, 0, TAU);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)';
      c.fillRect(X + 53 + k * 28, Y + 153, 2, 2);
    }
    box(c, X + 30, Y + 215, 60, 45, '#555f5c');
  }
  if (id === 'sec') {
    box(c, X + 30, Y + 30, 120, 40, '#3a3d40');
    for (let k = 0; k < 3; k++) {
      c.fillStyle = '#10201a';
      c.fillRect(X + 38 + k * 36, Y + 34, 28, 18);
      c.fillStyle = future ? 'rgba(80,150,120,.16)' : 'rgba(80,200,140,.35)';
      c.fillRect(X + 40 + k * 36, Y + 36, 24, 3);
    }
    box(c, X + 240, Y + 150, 40, 90, '#55595c');
    box(c, X + 40, Y + 200, 100, 36, '#4a3a28');
  }
  if (id === 'gen') {
    for (let k = 0; k < 2; k++) {
      const gx = X + 50 + k * 200; const gy = Y + 190;
      c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(gx + 5, gy + 8, 40, 36, 0, 0, TAU); c.fill();
      const g = c.createRadialGradient(gx - 10, gy - 12, 4, gx, gy, 40);
      g.addColorStop(0, '#6a726a'); g.addColorStop(1, '#2d332d');
      c.fillStyle = g;
      c.beginPath(); c.arc(gx, gy, 38, 0, TAU); c.fill();
      c.strokeStyle = '#151815'; c.lineWidth = 2; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1;
      c.beginPath(); c.arc(gx, gy, 24, 0, TAU); c.stroke();
    }
    c.strokeStyle = '#6a5a3a';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(X, Y + 40);
    c.lineTo(X + 300, Y + 40);
    c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.4)';
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(X, Y + 43); c.lineTo(X + 300, Y + 43); c.stroke();
  }
  if (id === 'con') {
    c.strokeStyle = '#1e1e1e';
    c.lineWidth = 3;
    for (let s = 0; s < 2; s++) {
      for (let k = 0; k < 7; k++) {
        c.beginPath();
        c.moveTo(X + (s ? 190 : 20) + k * 13, Y + 150);
        c.lineTo(X + (s ? 190 : 20) + k * 13, Y + 260);
        c.stroke();
      }
    }
    c.lineWidth = 1;
  }
  if (id === 'exp') {
    c.strokeStyle = future ? 'rgba(170,40,40,.65)' : 'rgba(200,70,60,.55)';
    c.lineWidth = 3;
    c.beginPath(); c.arc(X + 150, Y + 145, 92, 0, TAU); c.stroke();
    c.beginPath(); c.arc(X + 150, Y + 145, 70, 0, TAU); c.stroke();
    c.lineWidth = 1;
    c.font = '16px serif';
    c.fillStyle = 'rgba(200,70,60,.7)';
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * 6.28;
      c.fillText(RUNES[k % 4], X + 150 + Math.cos(a) * 81 - 5, Y + 145 + Math.sin(a) * 81 + 5);
    }
  }
  if (id === 'hall') {
    for (const [a, b] of [[40, 40], [260, 40], [40, 240], [260, 240]] as const) {
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(X + a + 5, Y + b + 7, 18, 14, 0, 0, TAU); c.fill();
      const g = c.createRadialGradient(X + a - 5, Y + b - 6, 2, X + a, Y + b, 17);
      g.addColorStop(0, '#a29d86'); g.addColorStop(1, '#5c5a49');
      c.fillStyle = g;
      c.beginPath(); c.arc(X + a, Y + b, 16, 0, TAU); c.fill();
      c.strokeStyle = '#000'; c.stroke();
    }
  }
  if (id === 'rec') {
    box(c, X + 20, Y + 30, 130, 32, '#5a3d22');
    box(c, X + 30, Y + 220, 90, 38, '#4a3c5a');
  }

  // Scattered papers, glass, stains and a crate.
  for (let k = 0; k < 9; k++) {
    c.save();
    c.translate(X + 30 + q() * 240, Y + 30 + q() * 220);
    c.rotate(q() * 6);
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.fillRect(1.5, 1.5, 12, 16);
    c.fillStyle = future ? 'rgba(170,160,120,.5)' : 'rgba(240,235,215,.85)';
    c.fillRect(0, 0, 12, 16);
    c.strokeStyle = 'rgba(40,30,20,.35)';
    for (let l = 0; l < 3; l++) { c.beginPath(); c.moveTo(1.5, 4 + l * 4); c.lineTo(10, 4 + l * 4); c.stroke(); }
    c.restore();
  }
  for (let k = 0; k < 5; k++) {
    const x = X + 30 + q() * 240;
    const y = Y + 30 + q() * 220;
    c.fillStyle = 'rgba(190,230,250,.55)';
    c.beginPath();
    c.moveTo(x, y); c.lineTo(x + 7, y + 3); c.lineTo(x + 2, y + 8);
    c.fill();
  }

  // Large dried blood pool + drag trail.
  c.fillStyle = future ? 'rgba(60,0,8,.6)' : 'rgba(110,10,10,.5)';
  c.beginPath();
  c.ellipse(X + 40 + q() * 220, Y + 60 + q() * 160, 14 + q() * 18, 8 + q() * 10, q(), 0, TAU);
  c.fill();
  c.strokeStyle = future ? 'rgba(70,0,8,.5)' : 'rgba(105,12,12,.38)';
  c.lineWidth = 6; c.lineCap = 'round';
  c.beginPath();
  let tx = X + 40 + q() * 220; let ty = Y + 70 + q() * 150;
  c.moveTo(tx, ty);
  for (let s = 0; s < 4; s++) { tx += (q() - 0.5) * 50; ty += 12 + q() * 22; c.quadraticCurveTo(tx + 10, ty - 6, tx, ty); }
  c.stroke();
  c.lineWidth = 1; c.lineCap = 'butt';

  // Overturned chair.
  c.save();
  c.translate(X + 40 + q() * 220, Y + 80 + q() * 150);
  c.rotate(q() * 3);
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(2, 3, 16, 16);
  c.fillStyle = '#4a3624'; c.fillRect(0, 0, 14, 14);
  c.strokeStyle = '#1c130c'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(-8, -9); c.moveTo(14, 0); c.lineTo(22, -8); c.moveTo(0, 14); c.lineTo(-6, 22); c.stroke();
  c.restore();

  // Hanging cables from the ceiling.
  c.strokeStyle = 'rgba(5,5,5,.7)'; c.lineWidth = 1.5;
  for (let k = 0; k < 2; k++) {
    const sx = X + 30 + q() * 240;
    c.beginPath(); c.moveTo(sx, Y); c.bezierCurveTo(sx + 14, Y + 20, sx - 12, Y + 34, sx + 6, Y + 52); c.stroke();
  }
  c.lineWidth = 1;

  c.save();
  c.translate(X + 30 + q() * 240, Y + 190 + q() * 60);
  c.rotate(q() * 3);
  box(c, 0, 0, 16, 16, '#6b4a2a', 4);
  c.restore();
}

/* -------------------------------------------------------------------------- */
/*  Interactable props                                                        */
/* -------------------------------------------------------------------------- */

/** One interactable prop, drawn at its position (slightly crooked in the Future). */
export function drawProp(c: Ctx, o: InteractableObject, future: boolean): void {
  const q = createSeededRandom(o.x * 3 + o.y);
  c.save();
  c.translate(o.x, o.y);
  if (future) c.rotate((q() - 0.5) * 0.3);
  switch (o.kind) {
    case 'desk': {
      box(c, -38, -18, 76, 36, future ? '#4d3a28' : '#6b4a2a');
      c.fillStyle = future ? '#252a24' : '#2f3c2c';
      c.fillRect(-31, -14, 36, 15);
      c.save(); c.rotate(-0.12);
      c.fillStyle = future ? '#b3a882' : '#eee6cd'; c.fillRect(-26, -13, 15, 12);
      c.strokeStyle = 'rgba(40,30,20,.5)';
      for (let l = 0; l < 4; l++) { c.beginPath(); c.moveTo(-24, -10 + l * 3); c.lineTo(-13, -10 + l * 3); c.stroke(); }
      c.restore();
      c.save(); c.rotate(0.1); c.fillStyle = future ? '#9d936f' : '#e0d8bd'; c.fillRect(-6, -14, 13, 10); c.restore();
      if (!future) glow(c, 23, -8, 26, 'rgba(255,210,120,A)', 0.35);
      c.fillStyle = '#1a1713'; c.beginPath(); c.arc(23, -8, 5, 0, TAU); c.fill();
      c.fillStyle = future ? '#5a6050' : '#e6bf62'; c.beginPath(); c.arc(23, -8, 3, 0, TAU); c.fill();
      c.fillStyle = '#d9d4c4'; c.beginPath(); c.arc(12, 6, 3.4, 0, TAU); c.fill();
      c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(12, 6, 2.2, 0, TAU); c.fill();
      if (future) { c.fillStyle = 'rgba(60,0,8,.55)'; c.beginPath(); c.ellipse(-10, 8, 7, 3.5, 0.3, 0, TAU); c.fill(); }
      break;
    }
    case 'shelf': {
      box(c, -44, -12, 88, 26, future ? '#3f2e1c' : '#5a3d22');
      const cols = ['#8a2d2d', '#2d4a8a', '#6b6b2d', '#3d6b3d', '#5a3a5a', '#7a5a2a'];
      for (let b = 0; b < 9; b++) {
        const h = 14 + (b % 3) * 2;
        c.fillStyle = cols[b % cols.length];
        c.fillRect(-41 + b * 9.2, -10 + (16 - h), 7, h);
        c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(-41 + b * 9.2, -10 + (16 - h), 1.2, h);
        c.fillStyle = 'rgba(230,210,150,.55)'; c.fillRect(-40 + b * 9.2, -7 + (16 - h), 5, 1);
      }
      c.fillStyle = 'rgba(200,200,190,.12)'; c.fillRect(-44, -12, 88, 4);
      break;
    }
    case 'mach': {
      box(c, -36, -28, 72, 56, future ? '#3d443f' : '#59605a');
      c.strokeStyle = '#2a2a24'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-36, -18); c.lineTo(-44, -18); c.lineTo(-44, 10); c.moveTo(36, -10); c.lineTo(44, -10); c.lineTo(44, 14); c.stroke();
      c.lineWidth = 1;
      for (let g = 0; g < 2; g++) {
        const gx = -14 + g * 28;
        c.fillStyle = '#dcdac2'; c.beginPath(); c.arc(gx, -12, 8.5, 0, TAU); c.fill();
        c.strokeStyle = '#161512'; c.lineWidth = 1.5; c.stroke(); c.lineWidth = 1;
        c.strokeStyle = '#a22'; c.beginPath(); c.moveTo(gx, -12); c.lineTo(gx + 4, -17); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(gx - 3, -15, 3, 1.6, -0.5, 0, TAU); c.fill();
      }
      for (let s = 0; s < 6; s++) { c.fillStyle = s % 2 ? '#14120c' : '#e0a030'; c.fillRect(-26 + s * 8.7, 6, 8.7, 5); }
      c.fillStyle = '#1c1c1a';
      for (const [rx, ry] of [[-32, -24], [32, -24], [-32, 24], [32, 24]] as const) { c.beginPath(); c.arc(rx, ry, 1.5, 0, TAU); c.fill(); }
      c.fillStyle = future ? '#401010' : '#ff3a2a'; c.beginPath(); c.arc(26, 18, 2.4, 0, TAU); c.fill();
      if (!future) glow(c, 26, 18, 14, 'rgba(255,60,40,A)', 0.5);
      break;
    }
    case 'bed': {
      box(c, -38, -20, 76, 42, '#8a8f8a');
      c.fillStyle = future ? '#a9a590' : '#d9d6c6'; c.fillRect(-34, -16, 68, 30);
      c.fillStyle = future ? '#8d8a76' : '#eceadb'; c.fillRect(-32, -15, 18, 14);
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-12, -16, 3, 30);
      c.strokeStyle = '#4a3a2a'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-4, -18); c.lineTo(-4, 16); c.moveTo(14, -18); c.lineTo(14, 16); c.stroke(); c.lineWidth = 1;
      c.fillStyle = future ? 'rgba(80,0,10,.55)' : 'rgba(130,16,16,.5)';
      c.beginPath(); c.ellipse(20, 2, 8, 6, 0.4, 0, TAU); c.fill();
      break;
    }
    case 'cab': {
      box(c, -24, -20, 48, 40, future ? '#4b5248' : '#6d7468');
      for (let d = 0; d < 3; d++) {
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-20, -16 + d * 11, 40, 1);
        c.fillStyle = '#d0d0c8'; c.fillRect(-5, -12 + d * 11, 10, 2.4);
        c.fillStyle = '#e6dcb8'; c.fillRect(-14, -14 + d * 11, 7, 3);
      }
      c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(-24, -20, 8, 33);
      break;
    }
    case 'door': {
      box(c, -19, -29, 38, 58, future ? '#292b35' : '#5e4931', 3);
      c.fillStyle = future ? '#6f7a8c' : '#b99a5d';
      c.fillRect(-14, -24, 28, 48);
      const dg = c.createLinearGradient(-14, 0, 14, 0);
      dg.addColorStop(0, 'rgba(255,255,255,.14)'); dg.addColorStop(1, 'rgba(0,0,0,.3)');
      c.fillStyle = dg; c.fillRect(-14, -24, 28, 48);
      c.strokeStyle = future ? 'rgba(175,190,220,.45)' : 'rgba(230,205,150,.5)';
      c.lineWidth = 1; c.strokeRect(-10, -19, 20, 38);
      c.fillStyle = '#e0c98a'; c.beginPath(); c.arc(9, 1, 2.2, 0, TAU); c.fill();
      break;
    }
    case 'tape': {
      box(c, -22, -14, 44, 28, '#2a2a2a');
      for (const x of [-9, 9]) {
        c.fillStyle = '#0d0d0d'; c.beginPath(); c.arc(x, -3, 7, 0, TAU); c.fill();
        c.strokeStyle = '#bbb'; c.beginPath(); c.arc(x, -3, 6, 0, TAU); c.stroke();
        c.strokeStyle = '#888';
        for (let s = 0; s < 3; s++) { const a = s * 2.09; c.beginPath(); c.moveTo(x, -3); c.lineTo(x + Math.cos(a) * 5, -3 + Math.sin(a) * 5); c.stroke(); }
      }
      c.strokeStyle = '#3a2a1a'; c.beginPath(); c.moveTo(-9, 4); c.lineTo(9, 4); c.stroke();
      c.fillStyle = future ? '#401010' : '#ff3030'; c.beginPath(); c.arc(16, 9, 1.8, 0, TAU); c.fill();
      break;
    }
    case 'clock': {
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.arc(2, 3, 15, 0, TAU); c.fill();
      c.fillStyle = '#3a2a1a'; c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill();
      c.fillStyle = '#ece4cb'; c.beginPath(); c.arc(0, 0, 13.5, 0, TAU); c.fill();
      c.strokeStyle = '#222';
      for (let k = 0; k < 12; k++) { const a = k * 0.5236; c.beginPath(); c.moveTo(Math.cos(a) * 11, Math.sin(a) * 11); c.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); c.stroke(); }
      c.strokeStyle = '#111'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -10); c.moveTo(0, 0); c.lineTo(8, 3); c.stroke();
      c.lineWidth = 1;
      if (future) { c.strokeStyle = 'rgba(0,0,0,.7)'; c.beginPath(); c.moveTo(-9, -9); c.lineTo(0, 1); c.lineTo(10, 9); c.stroke(); }
      break;
    }
    case 'crack': {
      c.strokeStyle = '#020306'; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(-30, -14); c.lineTo(-8, 6); c.lineTo(-14, 18); c.moveTo(-8, 6); c.lineTo(22, 12); c.stroke();
      c.lineWidth = 1;
      c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(10, -16, 18, 14);
      c.fillStyle = '#5a4a30'; c.fillRect(8, -18, 18, 14);
      c.strokeStyle = '#2a2014'; c.strokeRect(8.5, -17.5, 17, 13);
      break;
    }
    case 'term': {
      box(c, -22, -18, 44, 34, '#4a4f55');
      c.fillStyle = '#0a110d'; c.fillRect(-17, -15, 34, 18);
      c.fillStyle = future ? '#0d1818' : '#133a24'; c.fillRect(-16, -14, 32, 16);
      if (!future) {
        c.fillStyle = 'rgba(110,255,160,.65)';
        for (let l = 0; l < 4; l++) c.fillRect(-13, -11 + l * 3.4, 10 + ((l * 7) % 12), 1.2);
        glow(c, 0, -6, 34, 'rgba(90,255,150,A)', 0.22);
      } else {
        c.strokeStyle = '#223'; c.beginPath(); c.moveTo(-10, -14); c.lineTo(4, 2); c.stroke();
        c.fillStyle = 'rgba(120,200,190,.25)'; c.fillRect(-13, -9, 9, 1.2);
      }
      c.fillStyle = '#1c1d20'; c.fillRect(-14, 7, 28, 5);
      break;
    }
    case 'node': {
      const col = future ? '#8f7cff' : '#e0a458';
      glow(c, 0, 0, 44, future ? 'rgba(130,110,255,A)' : 'rgba(255,170,70,A)', 0.28);
      c.strokeStyle = col; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.stroke();
      c.lineWidth = 1;
      c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.stroke();
      c.fillStyle = col; c.font = '11px serif';
      ([[0, -30], [30, 4], [0, 36], [-30, 4]] as const).forEach(([x, y], i) => c.fillText(RUNES[i], x - 4, y));
      break;
    }
    case 'prints': {
      c.fillStyle = future ? 'rgba(70,0,10,.7)' : 'rgba(80,12,12,.62)';
      for (let s = 0; s < 14; s++) {
        const px = -60 + s * 9; const py = Math.sin(s * 0.7) * 26 + (s % 2) * 6;
        c.beginPath(); c.ellipse(px, py, 3.6, 7, 0.4, 0, TAU); c.fill();
        c.beginPath(); c.ellipse(px + 1, py - 9, 2, 1.6, 0.4, 0, TAU); c.fill();
      }
      break;
    }
    case 'mirror': {
      box(c, -18, -26, 36, 52, '#6a5a3a', 4);
      const mg = c.createLinearGradient(-14, -22, 14, 18);
      mg.addColorStop(0, '#b6d3de'); mg.addColorStop(0.5, '#7c99a6'); mg.addColorStop(1, '#a2bcc6');
      c.fillStyle = mg; c.fillRect(-14, -22, 28, 40);
      c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(-8, -22); c.lineTo(4, 0); c.lineTo(-6, 18); c.stroke();
      if (future) { c.fillStyle = 'rgba(5,5,10,.55)'; c.beginPath(); c.ellipse(2, -2, 5, 12, 0, 0, TAU); c.fill(); }
      break;
    }
  }
  c.restore();
}

/* -------------------------------------------------------------------------- */
/*  World dressing                                                            */
/* -------------------------------------------------------------------------- */

function drawWorldAtmosphere(c: Ctx, future: boolean): void {
  const q = createSeededRandom(future ? 903 : 407);

  const edge = c.createRadialGradient(
    WORLD_WIDTH / 2, WORLD_HEIGHT / 2, Math.min(WORLD_WIDTH, WORLD_HEIGHT) * 0.18,
    WORLD_WIDTH / 2, WORLD_HEIGHT / 2, Math.max(WORLD_WIDTH, WORLD_HEIGHT) * 0.72,
  );
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(1, future ? 'rgba(0,4,8,.25)' : 'rgba(20,10,2,.4)');
  c.fillStyle = edge;
  c.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  for (const room of ROOMS) {
    c.save();
    c.strokeStyle = future ? 'rgba(90,120,130,.22)' : 'rgba(232,205,145,.2)';
    c.lineWidth = 3;
    c.strokeRect(room.x - 5, room.y - 5, room.w + 10, room.h + 10);
    c.strokeStyle = 'rgba(0,0,0,.5)';
    c.lineWidth = 1;
    c.strokeRect(room.x - 2, room.y - 2, room.w + 4, room.h + 4);

    const lamp = c.createRadialGradient(room.x + room.w / 2, room.y + 22, 4, room.x + room.w / 2, room.y + 22, 118);
    lamp.addColorStop(0, future ? 'rgba(90,140,160,.10)' : 'rgba(255,200,110,.13)');
    lamp.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = lamp;
    c.fillRect(room.x - 90, room.y - 95, room.w + 180, room.h + 190);

    // Caged ceiling light fixture.
    const lx = room.x + room.w / 2; const ly = room.y + 22;
    c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(lx - 20, ly - 5, 40, 9);
    c.fillStyle = future ? '#2a3030' : '#6c6a58'; c.fillRect(lx - 18, ly - 4, 36, 6);
    c.fillStyle = future ? (room.gx % 2 ? '#51636a' : '#1b2224') : '#e9dcae';
    c.fillRect(lx - 14, ly - 2, 28, 2.5);
    c.restore();

    // Damp mould in the corners.
    for (const [mx, my] of [[room.x, room.y], [room.x + room.w, room.y], [room.x, room.y + room.h], [room.x + room.w, room.y + room.h]] as const) {
      const mg = c.createRadialGradient(mx, my, 0, mx, my, 38 + q() * 22);
      mg.addColorStop(0, future ? 'rgba(4,10,6,.55)' : 'rgba(20,16,6,.4)');
      mg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = mg;
      c.fillRect(mx - 60, my - 60, 120, 120);
    }

    // Debris and scrape marks.
    for (let k = 0; k < 8; k++) {
      const x = room.x + 18 + q() * (room.w - 36);
      const y = room.y + 22 + q() * (room.h - 44);
      c.fillStyle = future ? 'rgba(6,10,14,.4)' : 'rgba(35,25,12,.24)';
      c.beginPath(); c.ellipse(x, y, 3 + q() * 9, 1 + q() * 3, q() * Math.PI, 0, TAU); c.fill();
    }

    // Bloody handprints and claw scratches on the wall strip.
    for (let k = 0; k < (future ? 4 : 2); k++) {
      const hx = room.x + 10 + q() * (room.w - 20);
      const hy = room.y - 26 + q() * 14;
      c.fillStyle = future ? 'rgba(80,0,8,.75)' : 'rgba(110,10,10,.6)';
      c.beginPath(); c.ellipse(hx, hy, 4.5, 5.5, 0, 0, TAU); c.fill();
      for (let f = 0; f < 4; f++) { c.beginPath(); c.ellipse(hx - 4 + f * 2.7, hy - 7, 1.1, 3, (f - 1.5) * 0.12, 0, TAU); c.fill(); }
      c.beginPath(); c.moveTo(hx - 2, hy + 4); c.lineTo(hx - 3 + q() * 2, hy + 14 + q() * 8); c.lineTo(hx + 2, hy + 4); c.fill();
    }
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1;
    const cx = room.x + 20 + q() * (room.w - 60);
    for (let s = 0; s < 4; s++) { c.beginPath(); c.moveTo(cx + s * 4, room.y - 30); c.lineTo(cx + s * 4 + 3, room.y - 4); c.stroke(); }
  }

  for (let k = 0; k < 180; k++) {
    c.fillStyle = future ? 'rgba(150,185,200,.12)' : 'rgba(255,225,165,.12)';
    c.fillRect(q() * WORLD_WIDTH, q() * WORLD_HEIGHT, 1 + q() * 2, 1 + q() * 2);
  }
}

/** Stencilled, corroded metal room plaques. */
function drawRoomPlaque(c: Ctx, room: Room, future: boolean): void {
  const x = room.x + 8;
  const y = room.y - 28;
  const w = Math.max(96, room.name.length * 8 + 16);
  c.save();
  c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x - 2, y - 10, w, 22);
  c.fillStyle = future ? '#1d2528' : '#2c2518'; c.fillRect(x - 4, y - 13, w, 22);
  const g = c.createLinearGradient(x, y - 13, x, y + 9);
  g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(1, 'rgba(0,0,0,.25)');
  c.fillStyle = g; c.fillRect(x - 4, y - 13, w, 22);
  c.strokeStyle = future ? 'rgba(120,150,160,.6)' : 'rgba(210,175,100,.6)';
  c.strokeRect(x - 3.5, y - 12.5, w - 1, 21);
  c.fillStyle = future ? '#4a5a5e' : '#8d7a4c';
  for (const rx of [x, x + w - 8]) { c.beginPath(); c.arc(rx, y - 2, 1.4, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(90,40,16,.35)'; c.fillRect(x + w * 0.55, y - 12, 8, 21);
  c.fillStyle = future ? '#b6ccd0' : '#efd8a0';
  c.font = 'bold 10px monospace';
  c.textBaseline = 'middle';
  c.fillText(room.name.toUpperCase(), x + 6, y - 2);
  c.restore();
}

/** Draws a whole timeline's world once into an offscreen canvas. */
function buildWorld(timeline: PlayerIndex, wallPattern: CanvasPattern | null): HTMLCanvasElement {
  const canvas = makeCanvas(WORLD_WIDTH, WORLD_HEIGHT);
  const c = get2d(canvas);
  const f = timeline === 1;
  const floorPattern = c.createPattern(floorTile(f), 'repeat');

  c.fillStyle = wallPattern ?? '#000';
  c.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  c.fillStyle = f ? '#414846' : '#4a4a37';
  for (const r of WALKABLE_RECTS) c.fillRect(r.x - 16, r.y - 34, r.w + 32, r.h + 52);

  for (const r of ROOMS) {
    const g = c.createLinearGradient(0, r.y - 34, 0, r.y);
    g.addColorStop(0, f ? '#3f4643' : '#6a6c52');
    g.addColorStop(1, f ? '#2c322f' : '#4b4c3a');
    c.fillStyle = g;
    c.fillRect(r.x - 16, r.y - 34, r.w + 32, 34);
    c.strokeStyle = 'rgba(0,0,0,.3)';
    for (let y = r.y - 34; y < r.y; y += 11) {
      c.beginPath(); c.moveTo(r.x - 16, y); c.lineTo(r.x + r.w + 16, y); c.stroke();
      for (let x = r.x - 16 + ((Math.floor(y / 11)) % 2) * 14; x < r.x + r.w + 16; x += 28) {
        c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 11); c.stroke();
      }
    }
    // Baseboard shadow where wall meets floor.
    const bg = c.createLinearGradient(0, r.y - 10, 0, r.y + 6);
    bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,0,.5)');
    c.fillStyle = bg; c.fillRect(r.x - 16, r.y - 10, r.w + 32, 16);
    if (!f) {
      c.fillStyle = 'rgba(62,74,54,.34)';
      c.fillRect(r.x - 16, r.y - 14, r.w + 32, 14);
    }
  }

  c.fillStyle = floorPattern ?? '#222';
  for (const r of WALKABLE_RECTS) c.fillRect(r.x, r.y, r.w, r.h);
  for (const r of ROOMS) drawRoom(c, r, f);
  for (const o of INTERACTABLES) {
    if (o.timeline === (f ? 'future' : 'past') && !HUNT1_INTERACTABLE_IDS.has(o.id) && !HUNT2_INTERACTABLE_IDS.has(o.id) && !HUNT3_INTERACTABLE_IDS.has(o.id)) drawProp(c, o, f);
  }

  drawWorldAtmosphere(c, f);

  for (const d of DOORS) {
    const k = d.connector;
    c.fillStyle = 'rgba(0,0,0,.25)';
    if (d.horizontal) {
      c.fillRect(k.x, k.y, k.w, 4);
      c.fillRect(k.x, k.y + k.h - 4, k.w, 4);
      c.fillStyle = f ? 'rgba(160,140,70,.4)' : 'rgba(210,170,60,.55)';
      for (let x = k.x; x < k.x + k.w; x += 16) c.fillRect(x, k.y + 29, 8, 2);
    } else {
      c.fillRect(k.x, k.y, 4, k.h);
      c.fillRect(k.x + k.w - 4, k.y, 4, k.h);
      c.fillStyle = f ? 'rgba(160,140,70,.4)' : 'rgba(210,170,60,.55)';
      for (let y = k.y; y < k.y + k.h; y += 16) c.fillRect(k.x + 29, y, 2, 8);
    }
  }

  // Cold vs warm colour separation.
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = f ? '#e6f1f4' : '#ffe2b4';
  c.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  c.globalCompositeOperation = 'source-over';

  if (f) {
    const q = createSeededRandom(99);
    for (const r of ROOMS) {
      for (let k = 0; k < 6; k++) {
        c.fillStyle = '#4b4f55';
        c.beginPath(); c.ellipse(r.x + 30 + q() * 240, r.y + 30 + q() * 220, 8 + q() * 22, 6 + q() * 12, q(), 0, TAU); c.fill();
        c.fillStyle = 'rgba(160,170,180,.12)';
        c.beginPath(); c.ellipse(r.x + 28 + q() * 240, r.y + 28 + q() * 220, 4 + q() * 8, 2 + q() * 5, q(), 0, TAU); c.fill();
      }
      for (let k = 0; k < 7; k++) {
        c.fillStyle = `rgba(${Math.floor(35 + q() * 24)},${Math.floor(55 + q() * 30)},${Math.floor(40 + q() * 20)},.5)`;
        c.beginPath(); c.arc(r.x + q() * 300, r.y + q() * 280, 6 + q() * 16, 0, TAU); c.fill();
      }
      c.strokeStyle = 'rgba(0,0,0,.65)';
      c.beginPath();
      let x = r.x + q() * 300; let y = r.y;
      c.moveTo(x, y);
      for (let s = 0; s < 6; s++) { x += q() * 30 - 15; y += q() * 40; c.lineTo(x, y); }
      c.stroke();
      c.strokeStyle = 'rgba(30,34,30,.85)';
      c.beginPath();
      c.moveTo(r.x + q() * 300, r.y);
      c.bezierCurveTo(r.x + q() * 300, r.y + 60, r.x + q() * 300, r.y + 50, r.x + q() * 300, r.y + 90);
      c.stroke();
      c.fillStyle = 'rgba(150,185,200,.08)';
      c.beginPath(); c.ellipse(r.x + 150, r.y + 150, 60, 90, 0, 0, TAU); c.fill();
    }
  } else {
    const q = createSeededRandom(5);
    c.strokeStyle = 'rgba(105,115,105,.44)';
    for (const r of ROOMS) {
      c.beginPath();
      c.moveTo(r.x + 60 + q() * 100, r.y);
      c.lineTo(r.x + 60 + q() * 100, r.y + 30 + q() * 30);
      c.stroke();
    }
  }

  for (const r of ROOMS) drawRoomPlaque(c, r, f);

  c.fillStyle = f ? 'rgba(60,130,150,.07)' : 'rgba(170,100,40,.08)';
  c.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  return canvas;
}

/** Builds both timelines' pre-rendered worlds. Done once per engine. */
export function createWorldAssets(): WorldAssets {
  const patternCtx = get2d(makeCanvas(1, 1));
  const wallPatterns: WorldAssets['wallPatterns'] = [
    patternCtx.createPattern(wallTile(false), 'repeat'),
    patternCtx.createPattern(wallTile(true), 'repeat'),
  ];
  return {
    worlds: [buildWorld(0, wallPatterns[0]), buildWorld(1, wallPatterns[1])],
    wallPatterns,
  };
}