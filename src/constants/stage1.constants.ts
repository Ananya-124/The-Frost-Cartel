import type { Stage1TrialConfig } from '../types/round1.types';

/** Stage 1 (The Pumpkin Shuffle) has two trials. Rewards add up to the stage's 100 credits. */
export const DEFAULT_STAGE1_TRIALS: Stage1TrialConfig[] = [
  { pumpkins: 5, tries: 2, reward: 40, shuffleSeconds: 20 },
  { pumpkins: 7, tries: 2, reward: 60, shuffleSeconds: 20 },
];
