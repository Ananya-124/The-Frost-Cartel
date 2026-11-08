/** Pure game logic for Stage 1 — the Pumpkin Shuffle. No React, no timers: easy to test. */

export type Swap = [number, number];

export const MIN_PUMPKINS = 3;
export const MAX_PUMPKINS = 9;

export const clampPumpkinCount = (n: number | undefined): number =>
  Math.min(MAX_PUMPKINS, Math.max(MIN_PUMPKINS, Math.round(Number.isFinite(n) ? (n as number) : MIN_PUMPKINS)));

export const clampSeconds = (n: number | undefined, fallback: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Number.isFinite(n) ? (n as number) : fallback));

/**
 * How long each swap lasts. Starts slow, speeds up, and always adds up to exactly `totalMs`.
 * Example: 20000 ms -> about 30 swaps, from 900 ms down to 360 ms each.
 */
export function buildShufflePlan(totalMs: number, startMs = 900, endMs = 360): number[] {
  const plan: number[] = [];
  if (!(totalMs > 0)) return plan;
  let t = 0;
  while (t < totalMs) {
    const d = Math.round(startMs + (endMs - startMs) * Math.min(1, t / totalMs));
    const step = Math.min(d, totalMs - t);
    if (step < 200 && plan.length > 0) {
      plan[plan.length - 1] += step; // fold a tiny remainder into the previous swap
      break;
    }
    plan.push(step);
    t += step;
  }
  return plan;
}

/**
 * Pick `steps` swaps of two different positions each. Most swaps are between pumpkins that are close
 * together (like a real shell game), some jump further. The same pair never repeats back to back.
 */
export function planSwaps(count: number, steps: number, rng: () => number): Swap[] {
  const swaps: Swap[] = [];
  if (count < 2) return swaps;
  let prev: Swap | null = null;
  for (let i = 0; i < steps; i++) {
    let pair: Swap = [0, 1];
    for (let tries = 0; tries < 8; tries++) {
      const a = Math.min(count - 1, Math.floor(rng() * count));
      let b: number;
      if (rng() < 0.7) {
        const dist = 1 + Math.floor(rng() * 2);
        const dir = rng() < 0.5 ? -1 : 1;
        b = a + dir * dist;
        if (b < 0 || b >= count) b = a - dir * dist;
        if (b < 0 || b >= count) b = (a + 1) % count;
      } else {
        b = Math.min(count - 2, Math.floor(rng() * (count - 1)));
        if (b >= a) b += 1; // guarantees b !== a
      }
      pair = [Math.min(a, b), Math.max(a, b)];
      if (!(prev && count > 2 && prev[0] === pair[0] && prev[1] === pair[1])) break;
    }
    swaps.push(pair);
    prev = pair;
  }
  return swaps;
}

/** `slots[pumpkinId]` is the position of that pumpkin. Swapping two positions exchanges their pumpkins. */
export const swapSlots = (slots: number[], a: number, b: number): number[] =>
  slots.map((s) => {
    if (s === a) return b;
    if (s === b) return a;
    return s;
  });

export const identitySlots = (count: number): number[] => Array.from({ length: count }, (_, i) => i);

export const pumpkinAtSlot = (slots: number[], slot: number): number => slots.indexOf(slot);
