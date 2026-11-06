import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Hunt2ActionResult, Hunt2Actor, Hunt2Input, Hunt2State } from '../../../../../../types/hunt2.types';
import Hunt2Progress from './Hunt2Progress';

const makeState = (): Hunt2State => ({
  teamId: 'hunt2-ui-test', currentChallenge: 1, completed: false, subtasks: {}, objectStates: {}, observations: [], hintUses: {},
  score: 0, penalties: 0, scoreBreakdown: { identities: 0, falseManifestation: 0, exit: 0, identity: 0, memoryFragments: 0, hiddenWeakness: 0, brokenMemory: 0, reconstruction: 0, anchor: 0, final: 0, optional: 0, penalties: 0 },
  identityReconstruction: { historical: null, historicalValid: false, physical: null, physicalValid: false }, inspectedIdentityTraces: [],
  falseManifestation: { historicalClassification: null, historicalValid: false, physicalClassification: null, physicalValid: false }, inspectedFalseManifestations: [],
  memoryFragments: { archivistEvidence: [], trackerEvidence: [], historical: null, historicalValid: false, physical: null, physicalValid: false },
  hiddenWeakness: { archiveEvidence: [], experiments: [], resourcesRemaining: 5, instability: 0, stationReady: null, historicalConclusion: null, historicalValid: false, experimentalConclusion: null, experimentalValid: false, trackerActivatedAt: null, syncDeadline: null },
  brokenMemory: { archivistEvidence: [], trackerEvidence: [], historical: null, historicalValid: false, structure: null, structureValid: false, archivistSyncAt: null, syncDeadline: null, corruption: 0 },
  memoryAnchor: { archivistEvidence: [], trackerEvidence: [], nodeStates: { A: 'unknown', B: 'unknown', C: 'unknown', D: 'unknown' }, historicalConfiguration: null, historicalValid: false, physicalConfiguration: null, physicalValid: false, attemptsRemaining: 3, instability: 0, archivistSyncAt: null, syncDeadline: null, finalSequenceIndex: 0, finalSequenceDeadline: null },
  doorAnswer: null, characteristic: null, inspectedManifestations: [], originalArrangement: [], inspectedFurniture: [], anchorPattern: null,
  inspectedAnchors: [], trueAnchor: null, finalSequence: [], mechanismsActivated: [], projectorMaintained: false,
  readyBy: {}, activatedBy: {}, syncDeadline: null,
  entityState: { falseCorridorUntil: null, decoyHiddenUntil: null, trueAnchorHiddenUntil: null, memoryStable: false, deceptionSuppressed: false },
  updatedAt: new Date().toISOString(),
});

const props = (state: Hunt2State, actor: 'archivist' | 'tracker', kind: Hunt2Input, onSubmit: (actor: Hunt2Actor, kind: Hunt2Input, value: unknown) => Promise<Hunt2ActionResult>) => ({
  state, pending: { actor, kind }, message: '', working: false, onHint: vi.fn(), onSubmit, onClose: vi.fn(), onContinue: vi.fn(),
});

describe('Hunt II — Memory Fragments and Hidden Weakness', () => {
  it('renders the five-event Memory Fragments reconstruction and submits the Archivist sequence', () => {
    const state = makeState(); state.currentChallenge = 2;
    const onSubmit = vi.fn(async (_actor: Hunt2Actor, _kind: Hunt2Input, _value: unknown): Promise<Hunt2ActionResult> => ({ success: true, message: 'saved', state }));
    render(<Hunt2Progress {...props(state, 'archivist', 'memory-historical', onSubmit)} />);
    expect(screen.getByText('Hunt II · 3/7 · Show tasks')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reconstruct the historical memory' })).toBeInTheDocument();
    const selects = screen.getAllByRole('combobox');
    ['arrival', 'resonance', 'cutoff', 'answer', 'failure'].forEach((value, index) => fireEvent.change(selects[index], { target: { value } }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit for verification' }));
    expect(onSubmit).toHaveBeenCalledWith('archivist', 'memory-historical', { kind: 'memory-historical', order: ['arrival', 'resonance', 'cutoff', 'answer', 'failure'] });
  });

  it('submits an experiment condition for only the station that was activated', () => {
    const state = makeState(); state.currentChallenge = 2; state.subtasks.memoryFragmentsComplete = true;
    const onSubmit = vi.fn(async (_actor: Hunt2Actor, _kind: Hunt2Input, _value: unknown): Promise<Hunt2ActionResult> => ({ success: true, message: 'saved', state }));
    render(<Hunt2Progress {...props(state, 'tracker', 'weakness-frequency', onSubmit)} />);
    expect(screen.getByRole('heading', { name: 'Run a controlled experiment' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'low' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit for verification' }));
    expect(onSubmit).toHaveBeenCalledWith('tracker', 'weakness-frequency', { kind: 'weakness-experiment', variable: 'frequency', setting: 'low' });
  });
});

describe('Hunt II — Broken Memory', () => {
  it('presents a distinct six-component historical restoration interface', () => {
    const state = makeState(); state.currentChallenge = 3;
    const onSubmit = vi.fn(async (_actor: Hunt2Actor, _kind: Hunt2Input, _value: unknown): Promise<Hunt2ActionResult> => ({ success: true, message: 'saved', state }));
    render(<Hunt2Progress {...props(state, 'archivist', 'broken-historical', onSubmit)} />);
    expect(screen.getByRole('heading', { name: 'Reconnect the original relationships' })).toBeInTheDocument();
    const selects = screen.getAllByRole('combobox');
    const answers = ['photograph:source', 'ledger:duplicate', 'recording:fragmented-voice', 'keepsake:before-test', 'shadow:original', 'name:subject-zero'];
    answers.forEach((value, index) => fireEvent.change(selects[index], { target: { value } }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit for verification' }));
    expect(onSubmit).toHaveBeenCalledWith('archivist', 'broken-historical', { kind: 'broken-historical', order: answers });
  });
});

describe('Hunt II — Memory Anchor', () => {
  it('shows four Future node conditions and submits the Tracker repair configuration', () => {
    const state = makeState(); state.currentChallenge = 4; state.memoryAnchor.nodeStates = { A: 'unstable', B: 'reversed', C: 'disconnected', D: 'stable' }; state.memoryAnchor.attemptsRemaining = 3;
    const onSubmit = vi.fn(async (_actor: Hunt2Actor, _kind: Hunt2Input, _value: unknown): Promise<Hunt2ActionResult> => ({ success: true, message: 'saved', state }));
    render(<Hunt2Progress {...props(state, 'tracker', 'anchor-physical-config', onSubmit)} />);
    expect(screen.getByRole('heading', { name: 'Repair the Future anchor nodes' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hunt II · 6/7 · Show tasks' }));
    expect(screen.getByText(/LIVE NODES · A: unstable · B: reversed · C: disconnected · D: stable/i)).toBeInTheDocument();
    const answers = ['A:stabilize', 'B:forward', 'C:reconnect', 'D:hold'];
    screen.getAllByRole('combobox').forEach((select, index) => fireEvent.change(select, { target: { value: answers[index] } }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit for verification' }));
    expect(onSubmit).toHaveBeenCalledWith('tracker', 'anchor-physical-config', { kind: 'anchor-physical-config', order: answers });
  });
});

describe('Hunt II — The Three Identities', () => {
  it('submits the Archivist’s historical reconstruction separately', () => {
    const onSubmit = vi.fn(async (_actor: Hunt2Actor, _kind: Hunt2Input, _value: unknown): Promise<Hunt2ActionResult> => ({ success: true, message: 'saved', state: makeState() }));
    render(<Hunt2Progress {...props(makeState(), 'archivist', 'identity-historical', onSubmit)} />);
    expect(screen.getByRole('heading', { name: 'Reconstruct the historical identities' })).toBeInTheDocument();
    const selects = screen.getAllByRole('combobox');
    ['mara-voss', 'dr-s-vale', 'subject-zero'].forEach((value, index) => fireEvent.change(selects[index], { target: { value } }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit for verification' }));
    expect(onSubmit).toHaveBeenCalledWith('archivist', 'identity-historical', { kind: 'identity-historical', order: ['mara-voss', 'dr-s-vale', 'subject-zero'] });
  });

  it('submits the Tracker’s physical trace links independently', () => {
    const state = makeState();
    state.inspectedIdentityTraces = ['identityTraceA', 'identityTraceB', 'identityTraceC'];
    const onSubmit = vi.fn(async (_actor: Hunt2Actor, _kind: Hunt2Input, _value: unknown): Promise<Hunt2ActionResult> => ({ success: true, message: 'saved', state }));
    render(<Hunt2Progress {...props(state, 'tracker', 'identity-physical', onSubmit)} />);
    expect(screen.getByRole('heading', { name: 'Link the physical identity traces' })).toBeInTheDocument();
    const selects = screen.getAllByRole('combobox');
    ['patient-memory-imprint', 'researcher-transmission-signature', 'autonomous-entity-presence'].forEach((value, index) => fireEvent.change(selects[index], { target: { value } }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit for verification' }));
    expect(onSubmit).toHaveBeenCalledWith('tracker', 'identity-physical', { kind: 'identity-physical', order: ['patient-memory-imprint', 'researcher-transmission-signature', 'autonomous-entity-presence'] });
  });

  it('submits the Archivist’s private historical manifestation classification', () => {
    const state = makeState();
    state.subtasks.threeIdentitiesComplete = true;
    const onSubmit = vi.fn(async (_actor: Hunt2Actor, _kind: Hunt2Input, _value: unknown): Promise<Hunt2ActionResult> => ({ success: true, message: 'saved', state }));
    render(<Hunt2Progress {...props(state, 'archivist', 'manifestation-history', onSubmit)} />);
    expect(screen.getByRole('heading', { name: 'Classify the Past manifestation records' })).toBeInTheDocument();
    const selects = screen.getAllByRole('combobox');
    ['authenticated', 'altered', 'impossible'].forEach((value, index) => fireEvent.change(selects[index], { target: { value } }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit for verification' }));
    expect(onSubmit).toHaveBeenCalledWith('archivist', 'manifestation-history', { kind: 'manifestation-history', order: ['authenticated', 'altered', 'impossible'] });
  });

  it('submits only the Tracker’s Future classification and labels the next task Memory Fragments', () => {
    const state = makeState();
    state.subtasks.threeIdentitiesComplete = true;
    state.inspectedFalseManifestations = ['manifestationA', 'manifestationB', 'manifestationC'];
    const onSubmit = vi.fn(async (_actor: Hunt2Actor, _kind: Hunt2Input, _value: unknown): Promise<Hunt2ActionResult> => ({ success: true, message: 'saved', state }));
    render(<Hunt2Progress {...props(state, 'tracker', 'manifestation-physical', onSubmit)} />);
    expect(screen.getByRole('heading', { name: 'Classify the Future manifestations' })).toBeInTheDocument();
    expect(screen.queryByText(/historical classification is already verified/i)).not.toBeInTheDocument();
    const selects = screen.getAllByRole('combobox');
    ['fabricated', 'genuine', 'fabricated'].forEach((value, index) => fireEvent.change(selects[index], { target: { value } }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit for verification' }));
    expect(onSubmit).toHaveBeenCalledWith('tracker', 'manifestation-physical', { kind: 'manifestation-physical', order: ['fabricated', 'genuine', 'fabricated'] });
    cleanup();
    const unlockedState = makeState();
    unlockedState.currentChallenge = 2;
    render(<Hunt2Progress {...props(unlockedState, 'tracker', 'manifestation-physical', onSubmit)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hunt II · 3/7 · Show tasks' }));
    expect(screen.getAllByRole('heading', { name: 'The Memory Fragments' })).toHaveLength(2);
  });
});
