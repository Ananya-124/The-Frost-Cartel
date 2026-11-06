import type { ProgressFlag } from './flags';
import type { Timeline } from './player';

export interface Question {
  prompt: string;
  options: readonly string[];
  /** Index into `options`. */
  correctIndex: number;
}

/** "Verify your findings" multiple-choice question at a terminal. */
export interface VerificationPuzzle {
  kind: 'verification';
  timeline: Timeline;
  question: Question;
}

/** Rune or breaker sequence entered at the Experiment Chamber node. */
export interface SequencePuzzle {
  kind: 'sequence';
  timeline: Timeline;
  /** Symbol indices (0-3) in the order they must be entered. */
  steps: readonly number[];
  /** If set and the flag is active, the steps must be entered in reverse. */
  reversedWhenFlag: ProgressFlag | null;
}

export type Puzzle = VerificationPuzzle | SequencePuzzle;

/** Puzzle panel currently open for a player. */
export type ActivePuzzle =
  | { kind: 'verification'; question: Question }
  | { kind: 'sequence'; length: number; input: number[] };
