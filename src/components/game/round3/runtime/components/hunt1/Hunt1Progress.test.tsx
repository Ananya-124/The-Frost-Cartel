import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Hunt1State } from '../../../../../../types/hunt1.types';
import Hunt1Progress from './Hunt1Progress';

const state: Hunt1State = {
  modelVersion: 3, teamId: 'test', currentChallenge: 1, completed: false, score: 0, penalties: 0,
  subtasks: { generatorLog: true, burntRelay: true, openGround: true },
  taskCompleted: { powerFailure: false, observationLog: false, signalReconstruction: false, incidentConclusion: false },
  taskScores: { powerFailure: 0, observationLog: 0, signalReconstruction: 0, incidentConclusion: 0 },
  optionalScores: { researchNote: 0, forgottenRecording: 0 }, objectStates: {}, availableInteractables: ['generatorLog', 'burntRelay', 'openGround'],
  evidence: [], journal: [], failedSubmissions: [], hintUses: {},
  powerFailure: { archivistConnections: null, archivistValid: false, trackerConnections: null, trackerValid: false },
  observationTimeline: { archivistTimeline: null, archivistValid: false, trackerTimeline: null, trackerValid: false },
  signalReconstruction: { archivistRoute: null, archivistValid: false, trackerRoute: null, trackerValid: false },
  incidentConclusion: { archivistInterpretation: null, archivistValid: false, trackerInterpretation: null, trackerValid: false },
  updatedAt: new Date().toISOString(),
};

const renderPanel = (value: Hunt1State, playerNumber: 1 | 2, onSpecialAction = vi.fn()) => render(
  <Hunt1Progress state={value} playerNumber={playerNumber} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={onSpecialAction} onContinue={() => {}} />,
);

describe('Hunt I renumbered task interface', () => {
  it('reopens the task brief when the required clues become ready', () => {
    const incomplete = { ...state, subtasks: { generatorLog: false, burntRelay: true, openGround: true } };
    const view = renderPanel(incomplete, 1);
    expect(screen.getByRole('button', { name: 'TASK BRIEF · The Power Failure' })).toBeInTheDocument();
    view.rerender(<Hunt1Progress state={state} playerNumber={1} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    expect(screen.getByLabelText('archivist The Power Failure reconstruction')).toBeInTheDocument();
    expect(screen.getByText(/Arrange the four wiring connections/)).toBeInTheDocument();
  });

  it('starts at The Power Failure, shows four tasks, and removes the first two tasks', () => {
    renderPanel(state, 1);
    expect(screen.getByText('HUNT I · 1/4 · Investigation progress')).toBeInTheDocument();
    fireEvent.click(screen.getByText('HUNT I · 1/4 · Investigation progress'));
    expect(screen.getByText('TASK 1 · THE POWER FAILURE')).toBeInTheDocument();
    expect(screen.getByText('TASK 4 · THE INCIDENT CONCLUSION')).toBeInTheDocument();
    expect(screen.queryByText(/Last Visitor|Missing Report|visitor ledger|shredded report/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('archivist The Power Failure reconstruction')).toBeInTheDocument();
  });

  it('lets the Archivist submit the original circuit and keeps the Tracker gated on that decode', async () => {
    const onSpecialAction = vi.fn().mockResolvedValue({ success: true, message: 'decoded', state });
    renderPanel(state, 1, onSpecialAction);
    fireEvent.click(screen.getByRole('button', { name: 'Move Amber lead · Output / R-4 earlier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Amber lead · Output / R-4 earlier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Copper lead · R-4 / Load earlier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Copper lead · R-4 / Load earlier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Braided lead · Load / Ground earlier' }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Submit decoded wiring' })); await Promise.resolve(); });
    expect(onSpecialAction).toHaveBeenCalledWith('archivist', 'powerFailureArchivist', { sequence: ['generator-relay', 'relay-load', 'load-ground', 'ground-frame'] });

    const trackerRender = renderPanel(state, 2);
    expect(trackerRender.getByRole('button', { name: 'Reconnect and test generator' })).toBeDisabled();
  });

  it('shows Task 2 after power failure and submits the Past observation timeline', () => {
    const observationState: Hunt1State = {
      ...state,
      currentChallenge: 2,
      taskCompleted: { ...state.taskCompleted, powerFailure: true },
      taskScores: { ...state.taskScores, powerFailure: 200 },
      subtasks: { observationLog: true, cameraBuffer: true },
      availableInteractables: ['observationLog', 'cameraBuffer'],
    };
    const onSpecialAction = vi.fn().mockResolvedValue({ success: true, message: 'saved', state: observationState });
    renderPanel(observationState, 1, onSpecialAction);
    expect(screen.getByText('HUNT I · 2/4 · Investigation progress')).toBeInTheDocument();
    expect(screen.getByText(/18:23/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit Past timeline' }));
    expect(onSpecialAction).toHaveBeenCalledWith('archivist', 'observationArchivist', { sequence: ['subject-appears', 'alarm', 'observer-vanishes', 'lights-fail'] });
  });

  it('shows Task 3 as the signal reconstruction and preserves Tracker wiring submission', () => {
    const signalState: Hunt1State = {
      ...state,
      currentChallenge: 3,
      taskCompleted: { ...state.taskCompleted, powerFailure: true, observationLog: true },
      taskScores: { ...state.taskScores, powerFailure: 200, observationLog: 200 },
      subtasks: { signalChart: true, cableJunction: true },
      availableInteractables: ['signalChart', 'cableJunction'],
      signalReconstruction: { archivistRoute: ['intake', 'ground', 'observer', 'transmit'], archivistValid: true, trackerRoute: null, trackerValid: false },
    };
    const onSpecialAction = vi.fn().mockResolvedValue({ success: true, message: 'restored', state: signalState });
    renderPanel(signalState, 2, onSpecialAction);
    fireEvent.click(screen.getByText('HUNT I · 3/4 · Investigation progress'));
    expect(screen.getByText('TASK 3 · THE SIGNAL RECONSTRUCTION')).toBeInTheDocument();
    expect(screen.getByText(/ARCHIVIST’S DECODED ROUTE/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reconnect and restore signal' }));
    expect(onSpecialAction).toHaveBeenCalledWith('tracker', 'signalTracker', { sequence: ['transmit', 'intake', 'observer', 'ground'] });
  });

  it('keeps the final conclusion as Task 4 and presents the final report after completion', () => {
    const finished: Hunt1State = {
      ...state,
      currentChallenge: 4,
      completed: true,
      score: 850,
      taskCompleted: { powerFailure: true, observationLog: true, signalReconstruction: true, incidentConclusion: true },
      taskScores: { powerFailure: 200, observationLog: 200, signalReconstruction: 200, incidentConclusion: 150 },
      optionalScores: { researchNote: 50, forgottenRecording: 50 },
    };
    const onContinue = vi.fn();
    render(<Hunt1Progress state={finished} playerNumber={2} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={onContinue} />);
    fireEvent.click(screen.getByText('HUNT I · 4/4 · Investigation progress'));
    expect(screen.getByText('TASK 4 · THE INCIDENT CONCLUSION')).toBeInTheDocument();
    expect(screen.queryByText(/TASK 5/)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'FINAL INCIDENT REPORT' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Hunt II' }));
    expect(onContinue).toHaveBeenCalledOnce();
  });
});
