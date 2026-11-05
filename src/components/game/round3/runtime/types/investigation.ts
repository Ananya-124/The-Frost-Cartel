import type { ClueRequirement, ProgressFlag } from './flags';
import type { RoleName, Timeline } from './player';
import type { SequencePuzzle, VerificationPuzzle } from './puzzle';
import type { InteractableId } from './world';

export type HuntIndex = 0 | 1 | 2;

/** A discoverable piece of evidence attached to one interactable in one timeline. */
export interface Clue {
  timeline: Timeline;
  objectId: InteractableId;
  requires: ClueRequirement | null;
  title: string;
  text: string;
  /** Flag set when the clue is first examined. */
  grants: ProgressFlag | null;
  /** Dangerous evidence scores more but triggers a surge. */
  dangerous: boolean;
}

/** An entry in the shared investigation journal. */
export interface ClueRecord {
  title: string;
  text: string;
  huntIndex: HuntIndex;
  discoveredBy: RoleName;
  timeline: Timeline;
  timestamp: string;
}

/** Condition that completes a mission step. */
export type MissionCondition = ProgressFlag | 'entityMarked';

export interface MissionStep {
  objective: string;
  /** The step is shown until this condition is met. */
  completedWhen: MissionCondition;
}

/** Ordered objectives for one timeline. */
export interface Mission {
  timeline: Timeline;
  steps: readonly MissionStep[];
  /** Shown once every step is complete. */
  finalObjective: string;
}

export interface Hunt {
  index: HuntIndex;
  title: string;
  numeral: 'I' | 'II' | 'III';
  premise: string;
  clues: readonly Clue[];
  verification: Record<Timeline, VerificationPuzzle>;
  sequence: Record<Timeline, SequencePuzzle>;
  missions: Record<Timeline, Mission>;
}
