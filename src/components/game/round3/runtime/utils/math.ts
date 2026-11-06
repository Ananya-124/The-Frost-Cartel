import type { Vec2 } from '../types';

export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Random integer in [0, n). */
export const randomInt = (n: number): number => Math.floor(Math.random() * n);

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));
