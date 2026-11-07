import { describe, expect, it } from 'vitest';
import type { Hunt1State } from '../../../../../../types/hunt1.types';
import { getHunt1TaskCompletions, shouldApplyHunt1State } from './hunt1StateSync';

const state: Hunt1State = {
  modelVersion: 2, teamId: 'test', currentChallenge: 1, completed: false, score: 0, penalties: 0,
  subtasks: {},
  taskCompleted: { lastVisitor: false, missingReport: false, powerFailure: false, observationLog: false, signalReconstruction: false, incidentConclusion: false },
  taskScores: { lastVisitor: 0, missingReport: 0, powerFailure: 0, observationLog: 0, signalReconstruction: 0, incidentConclusion: 0 },
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
      subtasks: { visitorLedger: true },
      taskCompleted: { ...state.taskCompleted, lastVisitor: true },
      updatedAt: '2026-11-07T10:00:01.000Z',
    };
    const staleTask = { ...state, updatedAt: '2026-11-07T10:00:03.000Z' };
    expect(shouldApplyHunt1State(completedTask, staleTask)).toBe(false);
    expect(shouldApplyHunt1State(completedTask, { ...completedTask, subtasks: {}, updatedAt: completedTask.updatedAt })).toBe(false);

    const completeHunt = {
      ...completedTask,
      currentChallenge: 6 as const,
      completed: true,
    };
    expect(shouldApplyHunt1State(completeHunt, { ...completeHunt, completed: false })).toBe(false);
  });

  it('creates one correctly scored completion popup and reports the next objective', () => {
    const task1 = {
      ...state,
      currentChallenge: 2 as const,
      taskCompleted: { ...state.taskCompleted, lastVisitor: true },
      taskScores: { ...state.taskScores, lastVisitor: 100 },
      score: 100,
    };
    expect(getHunt1TaskCompletions(state, task1)).toEqual([{
      title: 'The Last Visitor Verified',
      points: 100,
      message: 'Task 2 unlocked.',
    }]);

    const huntComplete = {
      ...task1,
      currentChallenge: 6 as const,
      taskCompleted: { ...task1.taskCompleted, incidentConclusion: true },
      taskScores: { ...task1.taskScores, incidentConclusion: 150 },
      completed: true,
    };
    expect(getHunt1TaskCompletions(task1, huntComplete)).toEqual([{
      title: 'The Incident Conclusion Verified',
      points: 150,
      message: 'Hunt I complete.',
    }]);
  });
});
