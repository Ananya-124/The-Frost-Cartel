/** Deterministic generator (Lehmer / Park-Miller), identical to the original `rng`. */
export const createSeededRandom = (seed: number): (() => number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};
