import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Hunt1State } from '../../../../../../types/hunt1.types';
import Hunt1Progress from './Hunt1Progress';

const state: Hunt1State = {
  modelVersion: 2, teamId: 'test', currentChallenge: 1, completed: false, score: 0, penalties: 0,
  subtasks: { visitorLedger: true, visitorTracks: true },
  taskCompleted: { lastVisitor: false, missingReport: false, powerFailure: false, observationLog: false, signalReconstruction: false, incidentConclusion: false },
  taskScores: { lastVisitor: 0, missingReport: 0, powerFailure: 0, observationLog: 0, signalReconstruction: 0, incidentConclusion: 0 },
  optionalScores: { researchNote: 0, forgottenRecording: 0 }, objectStates: {}, availableInteractables: [],
  evidence: [], journal: [], failedSubmissions: [], hintUses: {}, updatedAt: new Date().toISOString(),
};

describe('Hunt I reconstruction interface', () => {
  it('keeps task instructions visible without an incident evidence panel', () => {
    const evidenceState: Hunt1State = {
      ...state,
      evidence: [{
        id: 'visitorLedger', title: 'Reception visitor ledger', location: 'Reception — Past', discoveredBy: 'archivist',
        type: 'evidence', content: 'The last visitor had no badge.', inference: 'Compare this entry with the Future tracks.',
        relatedObjective: 'The Last Visitor', verified: false, createdAt: new Date().toISOString(),
      }],
    };
    render(<Hunt1Progress state={evidenceState} playerNumber={1} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    expect(screen.getByText(/Move to each listed object in your timeline and press E/i)).toBeInTheDocument();
    expect(screen.getByText(/Review findings in the shared journal \(Q\)/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Incident evidence/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/The last visitor had no badge/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Examine evidence' })).not.toBeInTheDocument();
  });

  it('does not render a separate evidence tray over the room', () => {
    const evidenceState: Hunt1State = {
      ...state,
      evidence: [{
        id: 'visitorLedger', title: 'Reception visitor ledger', location: 'Reception — Past', discoveredBy: 'archivist',
        type: 'evidence', content: 'The last visitor had no badge.', inference: 'Compare this entry with the Future tracks.',
        relatedObjective: 'The Last Visitor', verified: false, createdAt: new Date().toISOString(),
      }],
    };
    render(<Hunt1Progress state={evidenceState} playerNumber={1} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    expect(screen.queryByRole('button', { name: /Incident evidence/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/evidence details/i)).not.toBeInTheDocument();
  });

  it('lets players hide and reopen the task brief to clear the room view', () => {
    render(<Hunt1Progress state={state} playerNumber={1} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hide task brief' }));
    expect(screen.queryByLabelText('archivist The Last Visitor reconstruction')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'TASK BRIEF · The Last Visitor' }));
    expect(screen.getByLabelText('archivist The Last Visitor reconstruction')).toBeInTheDocument();
  });

  it('lets the Archivist reorder evidence tiles and submit the reconstruction', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: true, message: 'verified', state });
    render(<Hunt1Progress state={state} playerNumber={1} message="" working={false} onHint={() => {}} onSubmit={onSubmit} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Move E. Marr · Technician earlier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move E. Marr · Technician earlier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reconstruct from both timelines' }));
    expect(onSubmit).toHaveBeenCalledWith('archivist', ['technician', 'director', 'visitor']);
  });

  it('keeps the reconstruction board read-only for the other authenticated role', () => {
    render(<Hunt1Progress state={state} playerNumber={2} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    expect(screen.getByRole('button', { name: 'Waiting for archivist' })).toBeDisabled();
  });

  it('shows a completed task as verified instead of waiting for the Archivist', () => {
    const completedState: Hunt1State = {
      ...state,
      taskCompleted: { ...state.taskCompleted, lastVisitor: true },
    };
    render(<Hunt1Progress state={completedState} playerNumber={2} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    expect(screen.getByRole('button', { name: 'Task verified' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Waiting for archivist' })).not.toBeInTheDocument();
  });

  it('shows the Archivist a decodable index and sends an authenticated-role submission', () => {
    const reportState: Hunt1State = { ...state, currentChallenge: 2, subtasks: { archiveIndex: true, shreddedReport: true }, missingReport: { reconstructionVersion: 1, archivistOrder: null, archivistValid: false, trackerOrder: null, trackerValid: false, confirmations: {} } };
    const onSpecialAction = vi.fn().mockResolvedValue({ success: true, message: 'decoded', state: reportState });
    render(<Hunt1Progress state={reportState} playerNumber={1} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={onSpecialAction} onContinue={() => {}} />);
    expect(screen.getByText(/historical index/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit decoded index' }));
    expect(onSpecialAction).toHaveBeenCalledWith('archivist', 'missingReportArchivist', { sequence: ['result', 'safeguards', 'purpose', 'apparatus'] });
  });

  it('explains that the Tracker submits from the other panel in the same session', () => {
    const reportState: Hunt1State = {
      ...state,
      currentChallenge: 2,
      score: 150,
      subtasks: { archiveIndex: true, shreddedReport: true },
      missingReport: {
        reconstructionVersion: 2,
        archivistOrder: ['purpose', 'apparatus', 'safeguards', 'result'],
        archivistValid: true,
        trackerOrder: null,
        trackerValid: false,
        confirmations: {},
      },
    };
    render(<Hunt1Progress state={reportState} playerNumber={1} message="Historical index decoded." working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    expect(screen.getByText(/use the Tracker panel on the left .* same team session/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Index submitted · waiting for Tracker' })).toBeDisabled();
    expect(screen.getByText('HUNT I SCORE 150 · PENALTIES −0')).toBeInTheDocument();
    expect(screen.getAllByRole('status').some((status) => status.textContent === 'Historical index decoded.')).toBe(true);
  });

  it('marks Task 2 complete and Task 3 active after the joint confirmation state arrives', () => {
    const completedState: Hunt1State = {
      ...state,
      currentChallenge: 3,
      score: 250,
      subtasks: { archiveIndex: true, shreddedReport: true },
      taskCompleted: { ...state.taskCompleted, lastVisitor: true, missingReport: true },
      taskScores: { ...state.taskScores, lastVisitor: 100, missingReport: 150 },
    };
    render(<Hunt1Progress state={completedState} playerNumber={1} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    const task2 = screen.getByText('TASK 2 · THE MISSING REPORT').closest('section');
    const task3 = screen.getByText('TASK 3 · THE POWER FAILURE').closest('section');
    expect(task2).toHaveTextContent('+150');
    expect(task2).toHaveTextContent('✓');
    expect(task3).toHaveTextContent('ACTIVE');
  });

  it('shows the Tracker arrangement when both clues are found without filling in the answer', () => {
    const reportState: Hunt1State = { ...state, currentChallenge: 2, subtasks: { archiveIndex: false, shreddedReport: false }, missingReport: { reconstructionVersion: 4, archivistOrder: null, archivistValid: false, trackerOrder: null, trackerValid: false, confirmations: {} } };
    const view = render(<Hunt1Progress state={reportState} playerNumber={2} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    expect(screen.queryByLabelText('Missing Report cooperative reconstruction')).not.toBeInTheDocument();

    view.rerender(<Hunt1Progress state={{ ...reportState, subtasks: { archiveIndex: true, shreddedReport: true } }} playerNumber={2} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    expect(screen.getByLabelText('Missing Report cooperative reconstruction')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit reconstructed report' })).toBeDisabled();

    const verifiedReportState: Hunt1State = {
      ...reportState,
      subtasks: { archiveIndex: true, shreddedReport: true },
      missingReport: { ...reportState.missingReport!, archivistOrder: ['purpose', 'apparatus', 'safeguards', 'result'], archivistValid: true },
    };
    view.rerender(<Hunt1Progress state={verifiedReportState} playerNumber={2} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    expect(screen.getByText(/ARCHIVIST’S DECODED INDEX:/)).toBeInTheDocument();
    const fragmentList = screen.getByRole('list', { name: 'Shredded report fragments' });
    expect(Array.from(fragmentList.querySelectorAll('li span')).map((item) => item.textContent)).toEqual([
      'Result fragment',
      'Safeguards fragment',
      'Purpose fragment',
      'Apparatus fragment',
    ]);
    expect(screen.getByRole('button', { name: 'Submit reconstructed report' })).toBeEnabled();
  });

  it('shows the Archivist circuit as a starting arrangement without automatically restoring power', () => {
    const circuitState: Hunt1State = {
      ...state, currentChallenge: 3, subtasks: { generatorLog: true, burntRelay: true, openGround: true },
      powerFailure: { archivistConnections: ['generator-relay', 'relay-load', 'load-ground', 'ground-frame'], archivistValid: true, trackerConnections: null, trackerValid: false },
    };
    const onSpecialAction = vi.fn().mockResolvedValue({ success: true, message: 'restored', state: circuitState });
    render(<Hunt1Progress state={circuitState} playerNumber={2} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={onSpecialAction} onContinue={() => {}} />);
    expect(screen.getByText(/ARCHIVIST’S DECODED WIRING/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Return lead · Ground / Frame earlier' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reconnect and test generator' })).toBeEnabled();
  });

  it('restores a previously submitted Tracker circuit after refresh', () => {
    const circuitState: Hunt1State = {
      ...state, currentChallenge: 3, subtasks: { generatorLog: true, burntRelay: true, openGround: true },
      powerFailure: { archivistConnections: ['generator-relay', 'relay-load', 'load-ground', 'ground-frame'], archivistValid: true, trackerConnections: ['generator-relay', 'relay-load', 'load-ground', 'ground-frame'], trackerValid: false },
    };
    render(<Hunt1Progress state={circuitState} playerNumber={2} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    expect(screen.getByRole('button', { name: 'Move Amber lead · Output / R-4 earlier' })).toBeDisabled();
  });

  it('gives the Archivist conflicting historical timestamps without revealing the full answer', () => {
    const logState: Hunt1State = {
      ...state, currentChallenge: 4, subtasks: { observationLog: true, cameraBuffer: true },
      observationTimeline: { archivistTimeline: null, archivistValid: false, trackerTimeline: null, trackerValid: false },
    };
    const onSpecialAction = vi.fn().mockResolvedValue({ success: true, message: 'saved', state: logState });
    render(<Hunt1Progress state={logState} playerNumber={1} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={onSpecialAction} onContinue={() => {}} />);
    expect(screen.getByText(/18:23/)).toBeInTheDocument();
    expect(screen.queryByText('alarm → lights-fail → subject-appears → observer-vanishes')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit Past timeline' }));
    expect(onSpecialAction).toHaveBeenCalledWith('archivist', 'observationArchivist', { sequence: ['subject-appears', 'alarm', 'observer-vanishes', 'lights-fail'] });
  });

  it('gives the Tracker physical traces and restores its submitted timeline', () => {
    const logState: Hunt1State = {
      ...state, currentChallenge: 4, subtasks: { observationLog: true, cameraBuffer: true },
      observationTimeline: { archivistTimeline: null, archivistValid: false, trackerTimeline: ['alarm', 'lights-fail', 'subject-appears', 'observer-vanishes'], trackerValid: false },
    };
    render(<Hunt1Progress state={logState} playerNumber={2} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={() => {}} />);
    expect(screen.getByText(/soot beneath the lamp relay/i)).toBeInTheDocument();
    expect(screen.queryByText(/18:23/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Alarm acknowledged earlier' })).toBeDisabled();
  });

  it('lets the Archivist submit a route decoded from the Past blueprint', () => {
    const signalState: Hunt1State = {
      ...state, currentChallenge: 5, subtasks: { signalChart: true, cableJunction: true },
      signalReconstruction: { archivistRoute: null, archivistValid: false, trackerRoute: null, trackerValid: false },
    };
    const onSpecialAction = vi.fn().mockResolvedValue({ success: true, message: 'decoded', state: signalState });
    render(<Hunt1Progress state={signalState} playerNumber={1} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={onSpecialAction} onContinue={() => {}} />);
    expect(screen.getByText(/Follow the flow arrows/i)).toBeInTheDocument();
    expect(screen.queryByText(/ARCHIVIST’S DECODED ROUTE/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit decoded route' }));
    expect(onSpecialAction).toHaveBeenCalledWith('archivist', 'signalArchivist', { sequence: ['transmit', 'intake', 'observer', 'ground'] });
  });

  it('shows the Tracker the Archivist route without auto-connecting the Future console', () => {
    const signalState: Hunt1State = {
      ...state, currentChallenge: 5, subtasks: { signalChart: true, cableJunction: true },
      signalReconstruction: { archivistRoute: ['intake', 'ground', 'observer', 'transmit'], archivistValid: true, trackerRoute: null, trackerValid: false },
    };
    const onSpecialAction = vi.fn().mockResolvedValue({ success: true, message: 'restored', state: signalState });
    render(<Hunt1Progress state={signalState} playerNumber={2} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={onSpecialAction} onContinue={() => {}} />);
    expect(screen.getByText(/ARCHIVIST’S DECODED ROUTE/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move TRANSMIT output earlier' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reconnect and restore signal' }));
    expect(onSpecialAction).toHaveBeenCalledWith('tracker', 'signalTracker', { sequence: ['transmit', 'intake', 'observer', 'ground'] });
  });

  it('gives the Archivist a distinct historical conclusion and restores its saved interpretation', () => {
    const conclusionState: Hunt1State = {
      ...state, currentChallenge: 6,
      subtasks: { incidentBoardPast: true, incidentBoardFuture: true },
      taskCompleted: { lastVisitor: true, missingReport: true, powerFailure: true, observationLog: true, signalReconstruction: true, incidentConclusion: false },
      incidentConclusion: { archivistInterpretation: ['resonance-limited-to-recorded-imprints', 'temporal-resonance-reconstructs-human-memories'], archivistValid: false, trackerInterpretation: null, trackerValid: false },
    };
    const onSpecialAction = vi.fn().mockResolvedValue({ success: true, message: 'saved', state: conclusionState });
    render(<Hunt1Progress state={conclusionState} playerNumber={1} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={onSpecialAction} onContinue={() => {}} />);
    expect(screen.getByText(/original proposal describes a temporal resonance apparatus/i)).toBeInTheDocument();
    expect(screen.getByText(/Arrange the two historical findings/i)).toBeInTheDocument();
    expect(screen.queryByText(/omitted grounding safeguard and relay bypass/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Move Temporal resonance was used to reconstruct human memories later/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Submit historical conclusion' }));
    expect(onSpecialAction).toHaveBeenCalledWith('archivist', 'incidentConclusionArchivist', { sequence: ['resonance-limited-to-recorded-imprints', 'temporal-resonance-reconstructs-human-memories'] });
  });

  it('gives the Tracker a separate physical conclusion and submits only that role’s findings', () => {
    const conclusionState: Hunt1State = {
      ...state, currentChallenge: 6,
      subtasks: { incidentBoardPast: true, incidentBoardFuture: true },
      taskCompleted: { lastVisitor: true, missingReport: true, powerFailure: true, observationLog: true, signalReconstruction: true, incidentConclusion: false },
      incidentConclusion: { archivistInterpretation: null, archivistValid: false, trackerInterpretation: null, trackerValid: false },
    };
    const onSpecialAction = vi.fn().mockResolvedValue({ success: true, message: 'saved', state: conclusionState });
    render(<Hunt1Progress state={conclusionState} playerNumber={2} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={onSpecialAction} onContinue={() => {}} />);
    expect(screen.getByText(/grounding strap is absent and the safety relay was bridged/i)).toBeInTheDocument();
    expect(screen.getByText(/Arrange the physical cause and aftermath/i)).toBeInTheDocument();
    expect(screen.queryByText(/Temporal resonance was used to reconstruct human memories/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit physical conclusion' }));
    expect(onSpecialAction).toHaveBeenCalledWith('tracker', 'incidentConclusionTracker', { sequence: ['omitted-ground-and-relay-bypass-exceeded-limits', 'a-reconstructed-memory-became-conscious-after-transmission', 'that-consciousness-manifested-as-the-entity'] });
  });

  it('shows the atmospheric report and Hunt II transition after refresh of a completed Hunt I', () => {
    const completeState: Hunt1State = {
      ...state, currentChallenge: 6, completed: true, score: 1100,
      taskCompleted: { lastVisitor: true, missingReport: true, powerFailure: true, observationLog: true, signalReconstruction: true, incidentConclusion: true },
      taskScores: { lastVisitor: 100, missingReport: 150, powerFailure: 200, observationLog: 200, signalReconstruction: 200, incidentConclusion: 150 },
      incidentConclusion: { archivistInterpretation: ['temporal-resonance-reconstructs-human-memories', 'resonance-limited-to-recorded-imprints'], archivistValid: true, trackerInterpretation: ['omitted-ground-and-relay-bypass-exceeded-limits', 'a-reconstructed-memory-became-conscious-after-transmission', 'that-consciousness-manifested-as-the-entity'], trackerValid: true },
    };
    const onContinue = vi.fn();
    render(<Hunt1Progress state={completeState} playerNumber={2} message="" working={false} onHint={() => {}} onSubmit={vi.fn()} onSpecialAction={vi.fn()} onContinue={onContinue} />);
    expect(screen.getByRole('heading', { name: 'FINAL INCIDENT REPORT' })).toBeInTheDocument();
    expect(screen.getByText(/Scientists used temporal resonance to reconstruct human memories/i)).toBeInTheDocument();
    expect(screen.getByText(/became conscious/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Hunt II' }));
    expect(onContinue).toHaveBeenCalledOnce();
  });
});
