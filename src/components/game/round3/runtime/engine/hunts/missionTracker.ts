import { getHunt } from '../../config/hunts';
import type { GameState, MissionCondition, Timeline } from '../../types';

export function isConditionMet(state: GameState, condition: MissionCondition): boolean {
  return condition === 'entityMarked' ? state.entityMarked : !!state.flags[condition];
}

/** The objective a player sees: the first step whose condition is not yet met. */
export function getObjective(state: GameState, timeline: Timeline): string {
  const mission = getHunt(state.huntIndex).missions[timeline];
  const step = mission.steps.find((s) => !isConditionMet(state, s.completedWhen));
  return step ? step.objective : mission.finalObjective;
}
