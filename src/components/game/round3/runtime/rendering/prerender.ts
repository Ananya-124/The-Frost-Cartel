import { RUNES, WORLD_HEIGHT, WORLD_WIDTH } from '../config/constants';
import { HUNT1_INTERACTABLE_IDS, HUNT2_INTERACTABLE_IDS, HUNT3_INTERACTABLE_IDS, INTERACTABLES } from '../config/interactables';
import { ROOMS } from '../config/rooms';
import { DOORS, WALKABLE_RECTS } from '../engine/world/geometry';
import type { InteractableObject, PlayerIndex, Room } from '../types';
import { randomInt } from '../utils/math';
import { createSeededRandom } from '../utils/rng';

type Ctx = CanvasRenderingContext2D;

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

/** Furniture block with shadow, top face and outline. */
function box(c: Ctx, x: number, y: number, w: number, h: number, col: string, depth = 7): void {
  c.fillStyle = 'rgba(0,0,0,.4)';
  c.fillRect(x + 5, y + 5, w, h);
  c.fillStyle = col;
  c.fillRect(x, y, w, h - depth);
  c.fillStyle = 'rgba(0,0,0,.4)';
  c.fillRect(x, y + h - depth, w, depth);
  c.fillStyle = 'rgba(255,255,255,.14)';
  c.fillRect(x, y, w, 2);
  c.strokeStyle = 'rgba(0,0,0,.65)';
  c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function floorTile(future: boolean): HTMLCanvasElement {
  const canvas = makeCanvas(64, 64);
  const x = get2d(canvas);
  const r = createSeededRandom(future ? 105 : 109);
  const base = future ? '#171b29' : '#77745e';
  x.fillStyle = base;
  x.fillRect(0, 0, 64, 64);

  // Large, worn stone slabs with recessed grout.
  x.fillStyle = future ? 'rgba(0,0,0,.22)' : 'rgba(25,20,10,.18)';
  x.fillRect(0, 0, 64, 64);
  x.strokeStyle = future ? 'rgba(125,145,190,.12)' : 'rgba(235,220,175,.13)';
  x.lineWidth = 1;
  x.strokeRect(2, 2, 60, 60);
  x.beginPath();
  x.moveTo(32, 2); x.lineTo(32, 62);
  x.moveTo(2, 32); x.lineTo(62, 32);
  x.stroke();

  for (let k = 0; k < 95; k++) {
    const alpha = 0.025 + r() * 0.11;
    x.fillStyle = future
      ? `rgba(${r() > .5 ? '115,130,175' : '0,0,0'},${alpha})`
      : `rgba(${r() > .5 ? '235,220,175' : '20,15,8'},${alpha})`;
    x.fillRect(r() * 64, r() * 64, 1 + r() * 10, 1 + r() * 4);
  }

  // Hairline cracks and chipped edges.
  x.strokeStyle = future ? 'rgba(5,8,18,.7)' : 'rgba(35,28,15,.48)';
  x.lineWidth = 1;
  for (let k = 0; k < 3; k++) {
    const sx = 7 + r() * 48;
    const sy = 7 + r() * 48;
    x.beginPath();
    x.moveTo(sx, sy);
    x.lineTo(sx + (r() - .5) * 9, sy + 5 + r() * 7);
    x.lineTo(sx + (r() - .5) * 15, sy + 9 + r() * 12);
    x.stroke();
  }

  // Subtle stains; stronger and colder in the corrupted timeline.
  x.fillStyle = future ? 'rgba(92,20,45,.16)' : 'rgba(55,34,18,.12)';
  x.beginPath();
  x.ellipse(15 + r() * 34, 14 + r() * 36, 5 + r() * 9, 3 + r() * 6, r() * 3, 0, Math.PI * 2);
  x.fill();
  return canvas;
}

function wallTile(future: boolean): HTMLCanvasElement {
  const canvas = makeCanvas(96, 64);
  const x = get2d(canvas);
  const r = createSeededRandom(future ? 221 : 222);
  x.fillStyle = future ? '#111624' : '#454536';
  x.fillRect(0, 0, 96, 64);

  const brick = future ? ['#20283a', '#252d40', '#1b2233'] : ['#69634d', '#756c52', '#5d5947'];
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 ? -24 : 0;
    for (let col = 0; col < 3; col++) {
      const bx = offset + col * 48;
      const by = row * 16;
      x.fillStyle = brick[Math.floor(r() * brick.length)];
      x.fillRect(bx + 1, by + 1, 46, 14);
      x.fillStyle = future ? 'rgba(0,0,0,.28)' : 'rgba(0,0,0,.2)';
      x.fillRect(bx + 1, by + 13, 46, 2);
      x.fillStyle = future ? 'rgba(155,175,220,.07)' : 'rgba(255,235,190,.1)';
      x.fillRect(bx + 2, by + 1, 44, 1);
    }
  }

  for (let k = 0; k < 42; k++) {
    x.fillStyle = `rgba(0,0,0,${r() * .18})`;
    x.fillRect(r() * 96, r() * 64, 2 + r() * 12, 1 + r() * 5);
  }
  if (future) {
    x.strokeStyle = 'rgba(112,130,190,.22)';
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(13, 4); x.lineTo(20, 18); x.lineTo(12, 29); x.lineTo(24, 43);
    x.moveTo(77, 20); x.lineTo(69, 31); x.lineTo(81, 44);
    x.stroke();
  }
  return canvas;
}

/** Room furniture, clutter and decoration. */
function drawRoom(c: Ctx, room: Room, future: boolean): void {
  const X = room.x;
  const Y = room.y;
  const id = room.id;
  const q = createSeededRandom(room.gx * 7 + room.gy * 13 + 3);

  if (['lab', 'exam', 'con'].includes(id)) {
    c.fillStyle = 'rgba(80,125,80,.2)';
    c.fillRect(X, Y, room.w, room.h);
  }
  if (['dir', 'rec', 'hall'].includes(id)) {
    c.fillStyle = 'rgba(110,30,30,.4)';
    c.fillRect(X + 40, Y + 60, 220, 160);
    c.strokeStyle = 'rgba(200,170,90,.4)';
    c.strokeRect(X + 48, Y + 68, 204, 144);
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
      c.arc(X + 55 + k * 28, Y + 157, 5, 0, 7);
      c.fill();
    }
    box(c, X + 30, Y + 215, 60, 45, '#555f5c');
  }
  if (id === 'sec') {
    box(c, X + 30, Y + 30, 120, 40, '#3a3d40');
    for (let k = 0; k < 3; k++) {
      c.fillStyle = '#1c2a22';
      c.fillRect(X + 38 + k * 36, Y + 34, 28, 18);
    }
    box(c, X + 240, Y + 150, 40, 90, '#55595c');
    box(c, X + 40, Y + 200, 100, 36, '#4a3a28');
  }
  if (id === 'gen') {
    for (let k = 0; k < 2; k++) {
      c.fillStyle = '#4a5048';
      c.beginPath();
      c.arc(X + 50 + k * 200, Y + 190, 38, 0, 7);
      c.fill();
      c.strokeStyle = '#222';
      c.stroke();
    }
    c.strokeStyle = '#6a5a3a';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(X, Y + 40);
    c.lineTo(X + 300, Y + 40);
    c.stroke();
    c.lineWidth = 1;
  }
  if (id === 'con') {
    c.strokeStyle = '#2a2a2a';
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
    c.strokeStyle = 'rgba(200,70,60,.55)';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(X + 150, Y + 145, 92, 0, 7);
    c.stroke();
    c.beginPath();
    c.arc(X + 150, Y + 145, 70, 0, 7);
    c.stroke();
    c.lineWidth = 1;
    c.font = '16px serif';
    c.fillStyle = 'rgba(200,70,60,.7)';
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * 6.28;
      c.fillText(RUNES[k % 4], X + 150 + Math.cos(a) * 81 - 5, Y + 145 + Math.sin(a) * 81 + 5);
    }
  }
  if (id === 'hall') {
    for (const [a, b] of [
      [40, 40],
      [260, 40],
      [40, 240],
      [260, 240],
    ] as const) {
      c.fillStyle = '#8a8670';
      c.beginPath();
      c.arc(X + a, Y + b, 16, 0, 7);
      c.fill();
      c.strokeStyle = '#000';
      c.stroke();
    }
  }
  if (id === 'rec') {
    box(c, X + 20, Y + 30, 130, 32, '#5a3d22');
    box(c, X + 30, Y + 220, 90, 38, '#4a3c5a');
  }

  // Scattered papers, glass, a stain and a crate.
  for (let k = 0; k < 9; k++) {
    c.save();
    c.translate(X + 30 + q() * 240, Y + 30 + q() * 220);
    c.rotate(q() * 6);
    c.fillStyle = future ? 'rgba(170,160,120,.5)' : 'rgba(240,235,215,.85)';
    c.fillRect(0, 0, 12, 16);
    c.restore();
  }
  for (let k = 0; k < 5; k++) {
    const x = X + 30 + q() * 240;
    const y = Y + 30 + q() * 220;
    c.fillStyle = 'rgba(190,230,250,.55)';
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 7, y + 3);
    c.lineTo(x + 2, y + 8);
    c.fill();
  }
  c.fillStyle = future ? 'rgba(70,0,10,.5)' : 'rgba(120,10,10,.45)';
  c.beginPath();
  c.ellipse(X + 40 + q() * 220, Y + 60 + q() * 160, 14 + q() * 18, 8 + q() * 10, q(), 0, 7);
  c.fill();
  c.save();
  c.translate(X + 30 + q() * 240, Y + 190 + q() * 60);
  c.rotate(q() * 3);
  box(c, 0, 0, 16, 16, '#6b4a2a', 4);
  c.restore();
  c.fillStyle = 'rgba(245,235,200,.8)';
  c.font = '11px monospace';
  c.fillText(room.name.toUpperCase(), X + 4, Y - 12);
}

/** One interactable prop, drawn at its position (slightly crooked in the Future). */
export function drawProp(c: Ctx, o: InteractableObject, future: boolean): void {
  const q = createSeededRandom(o.x * 3 + o.y);
  c.save();
  c.translate(o.x, o.y);
  if (future) c.rotate((q() - 0.5) * 0.3);
  switch (o.kind) {
    case 'desk':
      box(c, -38, -18, 76, 36, '#6b4a2a');
      c.fillStyle = '#e8e0c8';
      c.fillRect(-26, -12, 16, 12);
      c.fillRect(-4, -14, 14, 10);
      c.fillStyle = '#c9a24a';
      c.beginPath();
      c.arc(24, -8, 5, 0, 7);
      c.fill();
      break;
    case 'shelf':
      box(c, -44, -12, 88, 26, '#5a3d22');
      for (let b = 0; b < 8; b++) {
        c.fillStyle = ['#8a2d2d', '#2d4a8a', '#6b6b2d', '#3d6b3d'][b % 4];
        c.fillRect(-40 + b * 10, -9, 7, 16);
      }
      break;
    case 'mach':
      box(c, -36, -28, 72, 56, '#59605a');
      for (let g = 0; g < 2; g++) {
        c.fillStyle = '#d8d8c0';
        c.beginPath();
        c.arc(-14 + g * 28, -12, 8, 0, 7);
        c.fill();
        c.strokeStyle = '#a22';
        c.beginPath();
        c.moveTo(-14 + g * 28, -12);
        c.lineTo(-10 + g * 28, -17);
        c.stroke();
      }
      c.fillStyle = '#e0a030';
      c.fillRect(-26, 6, 52, 5);
      break;
    case 'bed':
      box(c, -38, -20, 76, 42, '#cfcab8');
      c.fillStyle = '#8a6a4a';
      c.fillRect(-26, -20, 5, 36);
      c.fillRect(14, -20, 5, 36);
      break;
    case 'cab':
      box(c, -24, -20, 48, 40, '#6d7468');
      for (let d = 0; d < 3; d++) {
        c.fillStyle = 'rgba(0,0,0,.35)';
        c.fillRect(-20, -16 + d * 11, 40, 1);
        c.fillStyle = '#c9c9c9';
        c.fillRect(-4, -12 + d * 11, 8, 2);
      }
      break;
    case 'door':
      box(c, -19, -29, 38, 58, future ? '#292b35' : '#5e4931', 3);
      c.fillStyle = future ? '#7b879a' : '#b99a5d';
      c.fillRect(-14, -24, 28, 48);
      c.strokeStyle = future ? 'rgba(175,190,220,.45)' : 'rgba(230,205,150,.5)';
      c.lineWidth = 1;
      c.strokeRect(-10, -19, 20, 38);
      c.fillStyle = '#d6bf80';
      c.beginPath();
      c.arc(9, 1, 2, 0, 7);
      c.fill();
      break;
    case 'tape':
      box(c, -22, -14, 44, 28, '#2a2a2a');
      c.strokeStyle = '#bbb';
      for (const x of [-9, 9]) {
        c.beginPath();
        c.arc(x, -3, 6, 0, 7);
        c.stroke();
      }
      break;
    case 'clock':
      c.fillStyle = '#e8e0c8';
      c.beginPath();
      c.arc(0, 0, 14, 0, 7);
      c.fill();
      c.strokeStyle = '#111';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, -10);
      c.moveTo(0, 0);
      c.lineTo(8, 3);
      c.stroke();
      break;
    case 'crack':
      c.strokeStyle = '#05060a';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-30, -14);
      c.lineTo(-8, 6);
      c.lineTo(-14, 18);
      c.moveTo(-8, 6);
      c.lineTo(22, 12);
      c.stroke();
      c.fillStyle = '#5a4a30';
      c.fillRect(8, -18, 18, 14);
      break;
    case 'term':
      box(c, -22, -18, 44, 34, '#4a4f55');
      c.fillStyle = future ? '#101a1a' : '#2a5a3a';
      c.fillRect(-16, -14, 32, 16);
      if (future) {
        c.strokeStyle = '#223';
        c.beginPath();
        c.moveTo(-10, -14);
        c.lineTo(4, 2);
        c.stroke();
      }
      break;
    case 'node': {
      const col = future ? '#8f7cff' : '#e0a458';
      c.strokeStyle = col;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, 0, 22, 0, 7);
      c.stroke();
      c.lineWidth = 1;
      c.fillStyle = col;
      c.font = '11px serif';
      (
        [
          [0, -30],
          [30, 4],
          [0, 36],
          [-30, 4],
        ] as const
      ).forEach(([x, y], i) => c.fillText(RUNES[i], x - 4, y));
      break;
    }
    case 'prints':
      c.fillStyle = 'rgba(20,30,50,.6)';
      for (let s = 0; s < 14; s++) {
        c.beginPath();
        c.ellipse(-60 + s * 9, Math.sin(s * 0.7) * 26 + (s % 2) * 6, 4, 7, 0.4, 0, 7);
        c.fill();
      }
      break;
    case 'mirror':
      box(c, -18, -26, 36, 52, '#7a6a4a', 4);
      c.fillStyle = '#9ab8c8';
      c.fillRect(-14, -22, 28, 40);
      c.strokeStyle = '#fff';
      c.beginPath();
      c.moveTo(-8, -22);
      c.lineTo(4, 0);
      c.lineTo(-6, 18);
      c.stroke();
      break;
  }
  c.restore();
}


/** Atmospheric dressing drawn into the static world: stains, lamps, cracks and timeline haze. */
function drawWorldAtmosphere(c: Ctx, future: boolean): void {
  const q = createSeededRandom(future ? 903 : 407);

  // Darkened perimeter makes the walkable spaces read as a physical interior.
  const edge = c.createRadialGradient(
    WORLD_WIDTH / 2, WORLD_HEIGHT / 2, Math.min(WORLD_WIDTH, WORLD_HEIGHT) * 0.18,
    WORLD_WIDTH / 2, WORLD_HEIGHT / 2, Math.max(WORLD_WIDTH, WORLD_HEIGHT) * 0.72,
  );
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(1, future ? 'rgba(0,0,0,.48)' : 'rgba(20,12,4,.34)');
  c.fillStyle = edge;
  c.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  for (const room of ROOMS) {
    // A beveled room border and subtle pools of light.
    c.save();
    c.strokeStyle = future ? 'rgba(112,132,190,.22)' : 'rgba(232,205,145,.22)';
    c.lineWidth = 3;
    c.strokeRect(room.x - 5, room.y - 5, room.w + 10, room.h + 10);
    c.strokeStyle = 'rgba(0,0,0,.42)';
    c.lineWidth = 1;
    c.strokeRect(room.x - 2, room.y - 2, room.w + 4, room.h + 4);

    const lamp = c.createRadialGradient(room.x + room.w / 2, room.y + 22, 4, room.x + room.w / 2, room.y + 22, 118);
    lamp.addColorStop(0, future ? 'rgba(112,130,210,.10)' : 'rgba(255,211,130,.12)');
    lamp.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = lamp;
    c.fillRect(room.x - 90, room.y - 95, room.w + 180, room.h + 190);
    c.restore();

    // Scattered debris and old scrape marks.
    for (let k = 0; k < 8; k++) {
      const x = room.x + 18 + q() * (room.w - 36);
      const y = room.y + 22 + q() * (room.h - 44);
      c.fillStyle = future ? 'rgba(8,10,18,.34)' : 'rgba(35,25,12,.22)';
      c.beginPath();
      c.ellipse(x, y, 3 + q() * 9, 1 + q() * 3, q() * Math.PI, 0, Math.PI * 2);
      c.fill();
    }
  }

  // Fine drifting-looking dust specks are static in the pre-rendered layer.
  for (let k = 0; k < 180; k++) {
    c.fillStyle = future ? 'rgba(170,190,255,.13)' : 'rgba(255,230,175,.12)';
    c.fillRect(q() * WORLD_WIDTH, q() * WORLD_HEIGHT, 1 + q() * 2, 1 + q() * 2);
  }
}

/** High-contrast room plaques improve navigation without changing collision or gameplay. */
function drawRoomPlaque(c: Ctx, room: Room, future: boolean): void {
  const x = room.x + 8;
  const y = room.y - 28;
  c.save();
  c.fillStyle = future ? 'rgba(12,16,29,.88)' : 'rgba(25,20,12,.82)';
  c.fillRect(x - 4, y - 13, Math.max(96, room.name.length * 8 + 16), 22);
  c.strokeStyle = future ? 'rgba(151,169,230,.55)' : 'rgba(226,190,112,.55)';
  c.lineWidth = 1;
  c.strokeRect(x - 4, y - 13, Math.max(96, room.name.length * 8 + 16), 22);
  c.fillStyle = future ? '#c5c9ed' : '#f0d69a';
  c.font = 'bold 10px monospace';
  c.textBaseline = 'middle';
  c.fillText(room.name.toUpperCase(), x + 3, y - 2);
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
  c.fillStyle = f ? '#141824' : '#58563f';
  for (const r of WALKABLE_RECTS) c.fillRect(r.x - 16, r.y - 34, r.w + 32, r.h + 52);

  for (const r of ROOMS) {
    const g = c.createLinearGradient(0, r.y - 34, 0, r.y);
    g.addColorStop(0, f ? '#1e2433' : '#7a785a');
    g.addColorStop(1, f ? '#141824' : '#5b5a44');
    c.fillStyle = g;
    c.fillRect(r.x - 16, r.y - 34, r.w + 32, 34);
    c.strokeStyle = 'rgba(0,0,0,.25)';
    for (let y = r.y - 34; y < r.y; y += 11) {
      c.beginPath();
      c.moveTo(r.x - 16, y);
      c.lineTo(r.x + r.w + 16, y);
      c.stroke();
      for (let x = r.x - 16 + ((Math.floor(y / 11)) % 2) * 14; x < r.x + r.w + 16; x += 28) {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, y + 11);
        c.stroke();
      }
    }
    if (!f) {
      c.fillStyle = 'rgba(90,135,90,.4)';
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
    c.fillStyle = 'rgba(0,0,0,.2)';
    if (d.horizontal) {
      c.fillRect(k.x, k.y, k.w, 4);
      c.fillRect(k.x, k.y + k.h - 4, k.w, 4);
      c.fillStyle = 'rgba(210,170,60,.55)';
      for (let x = k.x; x < k.x + k.w; x += 16) c.fillRect(x, k.y + 29, 8, 2);
    } else {
      c.fillRect(k.x, k.y, 4, k.h);
      c.fillRect(k.x + k.w - 4, k.y, 4, k.h);
      c.fillStyle = 'rgba(210,170,60,.55)';
      for (let y = k.y; y < k.y + k.h; y += 16) c.fillRect(k.x + 29, y, 2, 8);
    }
  }

  c.globalCompositeOperation = 'multiply';
  c.fillStyle = f ? '#9aa8e6' : '#fff0cc';
  c.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  c.globalCompositeOperation = 'source-over';

  if (f) {
    const q = createSeededRandom(99);
    for (const r of ROOMS) {
      for (let k = 0; k < 6; k++) {
        c.fillStyle = '#5b5f68';
        c.beginPath();
        c.ellipse(r.x + 30 + q() * 240, r.y + 30 + q() * 220, 8 + q() * 22, 6 + q() * 12, q(), 0, 7);
        c.fill();
      }
      for (let k = 0; k < 7; k++) {
        c.fillStyle = `rgba(60,${Math.floor(110 + q() * 60)},80,.55)`;
        c.beginPath();
        c.arc(r.x + q() * 300, r.y + q() * 280, 6 + q() * 16, 0, 7);
        c.fill();
      }
      c.strokeStyle = 'rgba(0,0,0,.6)';
      c.beginPath();
      let x = r.x + q() * 300;
      let y = r.y;
      c.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += q() * 30 - 15;
        y += q() * 40;
        c.lineTo(x, y);
      }
      c.stroke();
      c.strokeStyle = '#c96a22';
      c.beginPath();
      c.moveTo(r.x + q() * 300, r.y);
      c.bezierCurveTo(r.x + q() * 300, r.y + 60, r.x + q() * 300, r.y + 50, r.x + q() * 300, r.y + 90);
      c.stroke();
      c.fillStyle = 'rgba(140,170,255,.1)';
      c.beginPath();
      c.ellipse(r.x + 150, r.y + 150, 60, 90, 0, 0, 7);
      c.fill();
    }
  } else {
    const q = createSeededRandom(5);
    c.strokeStyle = 'rgba(90,130,200,.6)';
    for (const r of ROOMS) {
      c.beginPath();
      c.moveTo(r.x + 60 + q() * 100, r.y);
      c.lineTo(r.x + 60 + q() * 100, r.y + 30 + q() * 30);
      c.stroke();
    }
  }

  for (const r of ROOMS) drawRoomPlaque(c, r, f);

  // Final color grade separates the timelines at a glance.
  c.fillStyle = f ? 'rgba(70,82,150,.075)' : 'rgba(166,105,42,.045)';
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
