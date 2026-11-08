import { describe, expect, it } from 'vitest';
import type { Hunt1State } from '../../../../../../types/hunt1.types';
import { getHunt1TaskCompletions, shouldApplyHunt1State } from './hunt1StateSync';

const state: Hunt1State = {
  modelVersion: 3, teamId: 'test', currentChallenge: 1, completed: false, score: 0, penalties: 0,
  subtasks: {},
  taskCompleted: { powerFailure: false, observationLog: false, signalReconstruction: false, incidentConclusion: false },
  taskScores: { powerFailure: 0, observationLog: 0, signalReconstruction: 0, incidentConclusion: 0 },
  optionalScores: { researchNote: 0, forgottenRecording: 0 }, objectStates: {}, availableInteractables: [],
  evidence: [], journal: [], failedSubmissions: [], hintUses: {}, updatedAt: '2026-11-07T10:00:00.000Z',
};

describe('Hunt I polling state ordering', () => {
  it('accepts fresh progress and rejects an older poll response', () => {
    const fresh = { ...state, currentChallenge: 2 as const, updatedAt: '2026-11-07T10:00:02.000Z' };
    expect(shouldApplyHunt1State(state, fresh)).toBe(true);
    expect(shouldApplyHunt1State(fresh, state)).toBe(false);
  });

  it('never rolls a completed task or Hunt I completion back', () => {
    const completedTask = {
      ...state,
      currentChallenge: 2 as const,
      subtasks: { generatorLog: true },
      taskCompleted: { ...state.taskCompleted, powerFailure: true },
      updatedAt: '2026-11-07T10:00:01.000Z',
    };
    const staleTask = { ...state, updatedAt: '2026-11-07T10:00:03.000Z' };
    expect(shouldApplyHunt1State(completedTask, staleTask)).toBe(false);
    expect(shouldApplyHunt1State(completedTask, { ...completedTask, subtasks: {}, updatedAt: completedTask.updatedAt })).toBe(false);

    const completeHunt = { ...completedTask, currentChallenge: 4 as const, completed: true };
    expect(shouldApplyHunt1State(completeHunt, { ...completeHunt, completed: false })).toBe(false);
  });

  it('reports the renumbered task and its points when it completes', () => {
    const taskOne = {
      ...state,
      currentChallenge: 2 as const,
      taskCompleted: { ...state.taskCompleted, powerFailure: true },
      taskScores: { ...state.taskScores, powerFailure: 200 },
      score: 200,
    };
    expect(getHunt1TaskCompletions(state, taskOne)).toEqual([{
      title: 'The Power Failure Verified',
      points: 200,
      message: 'Task 2 unlocked.',
    }]);

    const huntComplete = {
      ...taskOne,
      currentChallenge: 4 as const,
      taskCompleted: { ...taskOne.taskCompleted, observationLog: true, signalReconstruction: true, incidentConclusion: true },
      taskScores: { ...taskOne.taskScores, observationLog: 200, signalReconstruction: 200, incidentConclusion: 150 },
      completed: true,
    };
    expect(getHunt1TaskCompletions(taskOne, huntComplete)).toEqual([
      { title: 'The Observation Log Verified', points: 200, message: 'Task 4 unlocked.' },
      { title: 'The Signal Reconstruction Verified', points: 200, message: 'Task 4 unlocked.' },
      { title: 'The Incident Conclusion Verified', points: 150, message: 'Hunt I complete.' },
    ]);
  });
});
