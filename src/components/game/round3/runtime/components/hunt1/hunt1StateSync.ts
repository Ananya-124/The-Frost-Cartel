import type { Hunt1State } from '../../../../../../types/hunt1.types';

const TASK_TITLES: Record<keyof Hunt1State['taskCompleted'], string> = {
  lastVisitor: 'The Last Visitor',
  missingReport: 'The Missing Report',
  powerFailure: 'The Power Failure',
  observationLog: 'The Observation Log',
  signalReconstruction: 'The Signal Reconstruction',
  incidentConclusion: 'The Incident Conclusion',
};

export interface Hunt1TaskCompletion {
  title: string;
  points: number;
  message: string;
}

export function shouldApplyHunt1State(current: Hunt1State | null, next: Hunt1State): boolean {
  if (!current) return true;

  const currentUpdatedAt = Date.parse(current.updatedAt);
  const nextUpdatedAt = Date.parse(next.updatedAt);
  if (Number.isFinite(currentUpdatedAt) && Number.isFinite(nextUpdatedAt) && nextUpdatedAt < currentUpdatedAt) {
    return false;
  }
  if (next.currentChallenge < current.currentChallenge || (current.completed && !next.completed)) {
    return false;
  }
  if (Object.entries(current.taskCompleted).some(
    ([key, completed]) => completed && !next.taskCompleted[key as keyof Hunt1State['taskCompleted']],
  )) return false;
  if (Object.entries(current.subtasks).some(([key, completed]) => completed && !next.subtasks[key])) return false;
  if (Object.entries(current.taskScores).some(([key, points]) => points > next.taskScores[key as keyof Hunt1State['taskScores']])) return false;
  if (Object.entries(current.optionalScores).some(([key, points]) => points > next.optionalScores[key as keyof Hunt1State['optionalScores']])) return false;
  if (current.penalties > next.penalties) return false;
  if (current.evidence.some(({ id }) => !next.evidence.some((entry) => entry.id === id))) return false;
  return !Object.entries(current.objectStates).some(([id, status]) => status === 'examined' && next.objectStates[id] !== 'examined');
}

export function getHunt1TaskCompletions(current: Hunt1State | null, next: Hunt1State): Hunt1TaskCompletion[] {
  if (!current) return [];
  return (Object.entries(next.taskCompleted) as Array<[keyof Hunt1State['taskCompleted'], boolean]>)
    .filter(([key, completed]) => completed && !current.taskCompleted[key])
    .map(([key]) => ({
      title: `${TASK_TITLES[key]} Verified`,
      points: next.taskScores[key] - current.taskScores[key],
      message: key === 'incidentConclusion' ? 'Hunt I complete.' : `Task ${next.currentChallenge} unlocked.`,
    }));
}
