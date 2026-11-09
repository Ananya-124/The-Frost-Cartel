import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Hunt2ActionResult, Hunt2Actor, Hunt2Input, Hunt2State } from '../../../../../../types/hunt2.types';
import Hunt2Progress from './Hunt2Progress';

const makeState = (currentChallenge: Hunt2State['currentChallenge']): Hunt2State => ({
  teamId: 'hunt2-ui-test',
  currentChallenge,
  completed: false,
  subtasks: {},
  objectStates: {},
  observations: [],
  hintUses: {},
  score: 0,
  penalties: 0,
  scoreBreakdown: { hiddenWeakness: 0, brokenMemory: 0, anchor: 0, final: 0, optional: 0, penalties: 0 },
  hiddenWeakness: { archiveEvidence: [], experiments: [], resourcesRemaining: 5, instability: 0, stationReady: null, historicalConclusion: null, historicalValid: false, experimentalConclusion: null, experimentalValid: false, trackerActivatedAt: null, syncDeadline: null },
  brokenMemory: { archivistEvidence: [], trackerEvidence: [], historical: null, historicalValid: false, structure: null, structureValid: false, archivistSyncAt: null, syncDeadline: null, corruption: 0 },
  memoryAnchor: { archivistEvidence: [], trackerEvidence: [], nodeStates: { A: 'unknown', B: 'unknown', C: 'unknown', D: 'unknown' }, historicalConfiguration: null, historicalValid: false, physicalConfiguration: null, physicalValid: false, attemptsRemaining: 3, instability: 0, archivistSyncAt: null, syncDeadline: null, finalSequenceIndex: 0, finalSequenceDeadline: null },
  finalSequence: [],
  mechanismsActivated: [],
  projectorMaintained: false,
  readyBy: {},
  activatedBy: {},
  syncDeadline: null,
  entityState: { falseCorridorUntil: null, trueAnchorHiddenUntil: null, memoryStable: false, deceptionSuppressed: false },
  updatedAt: new Date().toISOString(),
});

const props = (state: Hunt2State, actor: Hunt2Actor, kind: Hunt2Input | null, onSubmit: (actor: Hunt2Actor, kind: Hunt2Input, value: unknown) => Promise<Hunt2ActionResult>) => ({
  state,
  pending: kind ? { actor, kind } : null,
  message: '',
  working: false,
  onHint: vi.fn(),
  onOpenInput: vi.fn(),
  onSubmit,
  onClose: vi.fn(),
  onContinue: vi.fn(),
});

afterEach(cleanup);

describe('Hunt II progress', () => {
  it('opens the Tracker task panel when the required trial clues are collected', async () => {
    const state = makeState(2);
    const view = render(<Hunt2Progress {...props(state, 'tracker', null, vi.fn())} />);
    expect(screen.getByRole('button', { name: 'Hunt II · 1/4 · Show Tracker tasks' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hunt II · 1/4 · Show Tracker tasks' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hunt II · 1/4 · Hide Tracker tasks' }));
    expect(screen.getByRole('button', { name: 'Hunt II · 1/4 · Show Tracker tasks' })).toBeInTheDocument();
    const cluesCollected = { ...state, hiddenWeakness: { ...state.hiddenWeakness, experiments: Array.from({ length: 4 }, (_, index) => ({ variable: 'frequency', setting: String(index), result: 'recorded' })) } };
    view.rerender(<Hunt2Progress {...props(cluesCollected, 'tracker', null, vi.fn())} />);
    expect(await screen.findByRole('button', { name: 'Hunt II · 1/4 · Hide Tracker tasks' })).toBeInTheDocument();
    expect(screen.getByText(/Submit the three-part experimental profile/)).toBeInTheDocument();
  });

  it.each([
    [2, 'The Hidden Weakness'],
    [3, 'The Broken Memory'],
    [4, 'The Memory Anchor'],
    [5, 'The Final Memory'],
  ] as const)('shows retained task %i as task %i of four', (challenge, title) => {
    render(<Hunt2Progress {...props(makeState(challenge), 'archivist', null, vi.fn())} />);
    fireEvent.click(screen.getByRole('button', { name: `Hunt II · ${challenge - 1}/4 · Show Archivist tasks` }));
    fireEvent.click(screen.getByRole('button', { name: `Hunt II · ${challenge - 1}/4 · Show Tracker tasks` }));
    expect(screen.getAllByText(`HUNT II · THE FALSE MEMORY · TASK ${challenge - 1}/4`)).toHaveLength(2);
    expect(screen.getAllByRole('heading', { name: title })).toHaveLength(2);
  });

  it('keeps the Hidden Weakness experiment form as the first task', () => {
    const state = makeState(2);
    const onSubmit = vi.fn(async (_actor: Hunt2Actor, _kind: Hunt2Input, _value: unknown): Promise<Hunt2ActionResult> => ({ success: true, message: 'saved', state }));
    render(<Hunt2Progress {...props(state, 'tracker', 'weakness-frequency', onSubmit)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hunt II · 1/4 · Show Tracker tasks' }));
    expect(screen.getByRole('button', { name: 'Hunt II · 1/4 · Hide Tracker tasks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Run a controlled experiment' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'low' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit for verification' }));
    expect(onSubmit).toHaveBeenCalledWith('tracker', 'weakness-frequency', { kind: 'weakness-experiment', variable: 'frequency', setting: 'low' });
  });

  it('lets the Tracker reopen the profile form after completing the trials', () => {
    const state = makeState(2);
    state.hiddenWeakness.experiments = Array.from({ length: 4 }, (_, index) => ({
      variable: ['frequency', 'light', 'temperature', 'frequency'][index],
      setting: ['low', 'dark', 'cold', 'high'][index],
      result: 'recorded',
    }));
    const onOpenInput = vi.fn();
    render(<Hunt2Progress {...props(state, 'tracker', null, vi.fn())} onOpenInput={onOpenInput} />);
    fireEvent.click(screen.getByRole('button', { name: 'Submit experimental profile' }));
    expect(onOpenInput).toHaveBeenCalledWith('tracker', 'weakness-conclusion');
  });

  it('explains the Archivist archive retry and the timed Past calibration action', () => {
    render(<Hunt2Progress {...props(makeState(2), 'archivist', null, vi.fn())} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hunt II · 1/4 · Show Archivist tasks' }));
    expect(screen.getByText(/wait for the Tracker to finish 2 trials, then inspect the archive again/i)).toBeInTheDocument();
    expect(screen.getByText(/press E at the Historical Calibration Console within 10 seconds/i)).toBeInTheDocument();
    expect(screen.getByText(/No clock time is entered/i)).toBeInTheDocument();
  });
});
