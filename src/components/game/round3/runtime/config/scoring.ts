export const SCORE = {
  clue: 100,
  dangerousClue: 150,
  deduction: 200,
  prediction: 200,
  disruption: 300,
  capture: 500,
  perfectSync: 200,
  wrongAnswer: -75,
  wrongSequence: -75,
  falseManifestation: -100,
  failedSync: -150,
  entityContact: -50,
} as const;

/** Seconds within which both players must arm the capture. */
export const SYNC_WINDOW = 0.9;
export const SYNC_WINDOW_WIDE = 2;
export const PERFECT_SYNC_WINDOW = 0.35;

export const CONTACT_COOLDOWN = 5;
export const SURGE_DURATION = 7;
export const REVEAL_DURATION = 9;
export const CHRONO_SAND_DURATION = 25;
export const UNLOCK_CARD_RANGE = 320;

/** Leaderboard settings. */
export const LEADERBOARD_STORAGE_KEY = 'ph_lb';
export const LEADERBOARD_SIZE = 10;
export const LEADERBOARD_QUALIFYING_RANKS = 3;
