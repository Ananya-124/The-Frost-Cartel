import { describe, it, expect } from 'vitest';
import {
  buildShufflePlan,
  clampPumpkinCount,
  clampSeconds,
  identitySlots,
  planSwaps,
  pumpkinAtSlot,
  swapSlots,
} from './pumpkinShuffle';

const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

describe('pumpkin shuffle logic', () => {
  it('builds a plan that lasts exactly the requested time and speeds up', () => {
    const plan = buildShufflePlan(20000);
    expect(plan.reduce((a, b) => a + b, 0)).toBe(20000);
    expect(plan.length).toBeGreaterThan(20);
    expect(plan[0]).toBeGreaterThan(plan[plan.length - 2]);
    expect(Math.min(...plan)).toBeGreaterThanOrEqual(200);
  });

  it('handles tiny and invalid durations', () => {
    expect(buildShufflePlan(0)).toEqual([]);
    expect(buildShufflePlan(100)).toEqual([100]);
  });

  it('plans valid swaps of two different positions', () => {
    for (const count of [3, 4, 6]) {
      const swaps = planSwaps(count, 200, seeded(count));
      expect(swaps).toHaveLength(200);
      for (const [a, b] of swaps) {
        expect(a).toBeLessThan(b);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThan(count);
      }
    }
    expect(planSwaps(1, 5, Math.random)).toEqual([]);
  });

  it('never repeats the same pair back to back (with 3+ pumpkins)', () => {
    const swaps = planSwaps(3, 300, seeded(9));
    for (let i = 1; i < swaps.length; i++) expect(swaps[i]).not.toEqual(swaps[i - 1]);
  });

  it('keeps every pumpkin in exactly one position, and the skull moves with its pumpkin', () => {
    let slots = identitySlots(4);
    const skullPumpkin = 2;
    for (const [a, b] of planSwaps(4, 100, seeded(3))) slots = swapSlots(slots, a, b);
    expect([...slots].sort()).toEqual([0, 1, 2, 3]);
    expect(pumpkinAtSlot(slots, slots[skullPumpkin])).toBe(skullPumpkin);
  });

  it('keeps settings in a safe range', () => {
    expect(clampPumpkinCount(1)).toBe(3);
    expect(clampPumpkinCount(99)).toBe(6);
    expect(clampPumpkinCount(undefined)).toBe(3);
    expect(clampSeconds(500, 20, 5, 60)).toBe(60);
    expect(clampSeconds(undefined, 20, 5, 60)).toBe(20);
  });
});
