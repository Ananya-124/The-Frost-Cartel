import { db } from '../../database/db.ts';
import { round3GameplayAllowed } from './round3.service.ts';
import type { Hunt2ActionResult, Hunt2Actor, Hunt2Challenge, Hunt2Input, Hunt2State, Hunt2Observation } from '../../src/types/hunt2.types.ts';

db.exec(`CREATE TABLE IF NOT EXISTS round3_hunt2_sessions (
  team_id TEXT PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`);

const HINTS: Record<Hunt2Challenge, readonly [string, string]> = {
  1: ['Compare the case-file dates and seals before assigning identities.', 'A record can be historically authentic without proving that every reported manifestation was genuine.'],
  2: ['Compare movement in the original projection with the three physical traces.', 'Focus on how an image behaves relative to its source, not on the figures’ appearance.'],
  3: ['Cross-check apparently authentic records against displaced Future traces before submitting the relationships.', 'The repeated symbol is a substituted caption; match the keepsake to its pre-test position, not the duplicated ledger.'],
  4: ['The flow record becomes readable only after the Tracker has mapped the north and west nodes.', 'Compare the reversed and disconnected Future readings with the east-feed, west-return, ground, and final-loop design.'],
  5: ['Reconstruct the event order before touching the containment mechanisms.', 'Use the verified event order to reason through the three mechanism labels before readying both investigators.'],
};
const FALSE_MANIFESTATION_HINTS: readonly [string, string] = [
  'The archive can establish whether a record was altered or impossible; the Tracker must verify whether the matching trace exists in the Future.',
  'The reversed reflection persists in separate glass. A blocked light can fake a missing shadow, and footprints cannot cross an intact wall.',
];
const isActor = (value: unknown): value is Hunt2Actor => value === 'archivist' || value === 'tracker';
const normalize = (value: unknown): string => typeof value === 'string' ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() : '';
const nowIso = (): string => new Date().toISOString();
const IDENTITY_HISTORICAL = ['mara-voss', 'dr-s-vale', 'subject-zero'];
const IDENTITY_PHYSICAL = ['patient-memory-imprint', 'researcher-transmission-signature', 'autonomous-entity-presence'];
const MANIFESTATION_HISTORY = ['authenticated', 'altered', 'impossible'];
const MANIFESTATION_PHYSICAL = ['fabricated', 'genuine', 'fabricated'];
const freshBreakdown = () => ({ identities: 0, falseManifestation: 0, exit: 0, identity: 0, memoryFragments: 0, hiddenWeakness: 0, brokenMemory: 0, reconstruction: 0, anchor: 0, final: 0, optional: 0, penalties: 0 });
const MEMORY_ORDER = ['arrival', 'resonance', 'cutoff', 'answer', 'failure'];
const MEMORY_ARCHIVE = ['diary', 'photograph', 'incident-report'];
const MEMORY_TRACES = ['echo', 'displaced-reel', 'residual-mark'];
const WEAKNESS_PROFILE = { frequency: 'low', light: 'dark', temperature: 'cold' } as const;
const BROKEN_HISTORICAL = ['photograph:source', 'ledger:duplicate', 'recording:fragmented-voice', 'keepsake:before-test', 'shadow:original', 'name:subject-zero'];
const BROKEN_STRUCTURE = ['photograph:entry', 'ledger:archive', 'recording:resonance', 'keepsake:center', 'shadow:mirror', 'name:anchor'];
const ANCHOR_HISTORICAL = ['A:east', 'B:west', 'C:ground', 'D:loop'];
const ANCHOR_PHYSICAL = ['A:stabilize', 'B:forward', 'C:reconnect', 'D:hold'];
const ANCHOR_NODE_STATES = { A: 'unstable', B: 'reversed', C: 'disconnected', D: 'stable' } as const;
const ANCHOR_FINAL_SEQUENCE = [
  { actor: 'tracker', objectId: 'memoryAnchorA' },
  { actor: 'archivist', objectId: 'anchorNodePastB' },
  { actor: 'tracker', objectId: 'memoryAnchorC' },
  { actor: 'archivist', objectId: 'anchorNodePastD' },
] as const;
const freshAnchor = (): Hunt2State['memoryAnchor'] => ({ archivistEvidence: [], trackerEvidence: [], nodeStates: { A: 'unknown', B: 'unknown', C: 'unknown', D: 'unknown' }, historicalConfiguration: null, historicalValid: false, physicalConfiguration: null, physicalValid: false, attemptsRemaining: 3, instability: 0, archivistSyncAt: null, syncDeadline: null, finalSequenceIndex: 0, finalSequenceDeadline: null });

function freshState(teamId: string): Hunt2State {
  return {
    teamId, currentChallenge: 1, completed: false, subtasks: {}, objectStates: {}, observations: [], hintUses: {},
    score: 0, penalties: 0, scoreBreakdown: freshBreakdown(), identityReconstruction: { historical: null, historicalValid: false, physical: null, physicalValid: false }, inspectedIdentityTraces: [],
    falseManifestation: { historicalClassification: null, historicalValid: false, physicalClassification: null, physicalValid: false }, inspectedFalseManifestations: [],
    memoryFragments: { archivistEvidence: [], trackerEvidence: [], historical: null, historicalValid: false, physical: null, physicalValid: false },
    hiddenWeakness: { archiveEvidence: [], experiments: [], resourcesRemaining: 5, instability: 0, stationReady: null, historicalConclusion: null, historicalValid: false, experimentalConclusion: null, experimentalValid: false, trackerActivatedAt: null, syncDeadline: null },
    brokenMemory: { archivistEvidence: [], trackerEvidence: [], historical: null, historicalValid: false, structure: null, structureValid: false, archivistSyncAt: null, syncDeadline: null, corruption: 0 },
    memoryAnchor: freshAnchor(),
    doorAnswer: null, characteristic: null, inspectedManifestations: [], originalArrangement: [], inspectedFurniture: [], anchorPattern: null,
    inspectedAnchors: [], trueAnchor: null, finalSequence: [], mechanismsActivated: [], projectorMaintained: false,
    readyBy: {}, activatedBy: {}, syncDeadline: null,
    entityState: { falseCorridorUntil: null, decoyHiddenUntil: null, trueAnchorHiddenUntil: null, memoryStable: false, deceptionSuppressed: false },
    updatedAt: nowIso(),
  };
}

function ensureRow(teamId: string): void {
  const now = nowIso();
  db.prepare('INSERT OR IGNORE INTO round3_hunt2_sessions (team_id, state_json, updated_at) VALUES (?, ?, ?)').run(teamId, JSON.stringify(freshState(teamId)), now);
}

export function ensureRound3Hunt2State(teamId: string): Hunt2State {
  ensureRow(teamId);
  return getRound3Hunt2State(teamId)!;
}

export function getRound3Hunt2State(teamId: string): Hunt2State | null {
  const row = db.prepare('SELECT state_json FROM round3_hunt2_sessions WHERE team_id = ?').get(teamId) as { state_json: string } | undefined;
  if (!row) return null;
  const state = JSON.parse(row.state_json) as Hunt2State;
  state.identityReconstruction ??= { historical: null, historicalValid: false, physical: null, physicalValid: false };
  state.inspectedIdentityTraces ??= [];
  state.falseManifestation ??= { historicalClassification: null, historicalValid: false, physicalClassification: null, physicalValid: false };
  state.inspectedFalseManifestations ??= [];
  state.memoryFragments ??= { archivistEvidence: [], trackerEvidence: [], historical: null, historicalValid: false, physical: null, physicalValid: false };
  state.memoryFragments.archivistEvidence ??= []; state.memoryFragments.trackerEvidence ??= [];
  state.hiddenWeakness ??= { archiveEvidence: [], experiments: [], resourcesRemaining: 5, instability: 0, stationReady: null, historicalConclusion: null, historicalValid: false, experimentalConclusion: null, experimentalValid: false, trackerActivatedAt: null, syncDeadline: null };
  state.hiddenWeakness.archiveEvidence ??= []; state.hiddenWeakness.experiments ??= []; state.hiddenWeakness.resourcesRemaining ??= 5; state.hiddenWeakness.instability ??= 0; state.hiddenWeakness.stationReady ??= null;
  state.brokenMemory ??= { archivistEvidence: [], trackerEvidence: [], historical: null, historicalValid: false, structure: null, structureValid: false, archivistSyncAt: null, syncDeadline: null, corruption: 0 };
  state.brokenMemory.archivistEvidence ??= []; state.brokenMemory.trackerEvidence ??= []; state.brokenMemory.corruption ??= 0;
  state.memoryAnchor ??= freshAnchor();
  state.memoryAnchor.archivistEvidence ??= []; state.memoryAnchor.trackerEvidence ??= []; state.memoryAnchor.nodeStates ??= { A: 'unknown', B: 'unknown', C: 'unknown', D: 'unknown' }; state.memoryAnchor.attemptsRemaining ??= 3; state.memoryAnchor.instability ??= 0; state.memoryAnchor.finalSequenceIndex ??= 0;
  state.scoreBreakdown.memoryFragments ??= 0; state.scoreBreakdown.hiddenWeakness ??= 0; state.scoreBreakdown.brokenMemory ??= 0;
  state.scoreBreakdown.identities ??= 0;
  state.scoreBreakdown.falseManifestation ??= 0;
  return state;
}

function award(state: Hunt2State, category: Exclude<keyof Hunt2State['scoreBreakdown'], 'penalties'>, points: number): void {
  const caps = { identities: 150, falseManifestation: 150, exit: 150, identity: 200, memoryFragments: 200, hiddenWeakness: 200, brokenMemory: 300, reconstruction: 200, anchor: 200, final: 150, optional: 100 };
  const gained = Math.min(points, Math.max(0, caps[category] - state.scoreBreakdown[category]));
  state.scoreBreakdown[category] += gained;
  state.score += gained;
}

function penalize(state: Hunt2State, points: number): void {
  state.penalties += points;
  state.scoreBreakdown.penalties += points;
  state.score = Math.max(0, state.score - points);
}

function addObservation(state: Hunt2State, actor: Hunt2Actor | 'team', id: string, title: string, location: string, content: string, verified = false): void {
  if (state.observations.some((entry) => entry.id === id)) return;
  const observation: Hunt2Observation = { id, title, location, discoveredBy: actor, content, verified, challenge: state.currentChallenge, createdAt: nowIso() };
  state.observations.push(observation);
}

function advance(state: Hunt2State, from: Hunt2Challenge, message: string): void {
  if (state.currentChallenge !== from) return;
  if (from === 5) {
    state.completed = true;
    state.entityState.deceptionSuppressed = true;
    state.entityState.memoryStable = true;
    state.objectStates.trueMemoryAnchor = 'destroyed';
    award(state, 'final', 150);
    addObservation(state, 'team', 'entity-anchor-destroyed', 'True memory anchor destroyed', 'Containment chamber', message, true);
    return;
  }
  state.currentChallenge = (from + 1) as Hunt2Challenge;
  addObservation(state, 'team', `challenge-${state.currentChallenge}-unlocked`, `Challenge ${state.currentChallenge} unlocked`, 'Shared memory board', message, true);
}

function maybeAdvance(state: Hunt2State): void {
  if (state.currentChallenge === 1 && state.subtasks.threeIdentitiesComplete && state.subtasks.falseManifestationComplete) advance(state, 1, 'The false manifestations are exposed. Match the fractured memory traces against the original movement record.');
  else if (state.currentChallenge === 2 && state.subtasks.memoryFragmentsComplete && state.subtasks.hiddenWeaknessComplete) advance(state, 2, 'The weakness is contained. Reconstruct the original experimental room layout.');
  else if (state.currentChallenge === 3 && state.subtasks.brokenMemoryComplete) advance(state, 3, 'The restored identity holds. Find the genuine memory anchor.');
  else if (state.currentChallenge === 4 && state.subtasks.memoryAnchorComplete) advance(state, 4, 'The original memory anchor holds. Stabilize the final memory and destroy the corrupted imprint together.');
  else if (state.currentChallenge === 5 && state.activatedBy.archivist && state.activatedBy.tracker && state.syncDeadline !== null) {
    const values = [state.activatedBy.archivist, state.activatedBy.tracker];
    if (Math.max(...values) - Math.min(...values) <= 10_000 && Math.max(...values) <= state.syncDeadline) advance(state, 5, 'The anchor shatters. The false memories collapse, and the entity can no longer distort reality.');
    else {
      penalize(state, 50);
      state.activatedBy = {};
      state.readyBy = {};
      state.syncDeadline = null;
      state.subtasks.archivistReady = false;
      state.subtasks.trackerReady = false;
      addObservation(state, 'team', `sync-failed-${state.observations.length}`, 'Synchronization failed', 'Containment chamber', 'The final actions did not align. Completed challenges, sequence, and mechanisms remain in place; prepare both controls and retry.', false);
    }
  }
}

function applyAnchorPulse(state: Hunt2State, actor: Hunt2Actor, objectId: string): { accepted: boolean; message: string } {
  const anchor = state.memoryAnchor;
  if (anchor.finalSequenceDeadline === null) return { accepted: false, message: 'The final stabilization cadence is not active.' };
  if (Date.now() > anchor.finalSequenceDeadline) {
    anchor.finalSequenceIndex = 0; anchor.finalSequenceDeadline = null; anchor.archivistSyncAt = null; anchor.syncDeadline = null;
    anchor.attemptsRemaining -= 1; anchor.instability += 1; penalize(state, 50); state.entityState.falseCorridorUntil = Date.now() + 2_500;
    if (anchor.attemptsRemaining <= 0) anchor.attemptsRemaining = 3;
    return { accepted: false, message: 'The final cadence timed out and the chamber distorts. Your verified configuration remains; restart synchronization to try again.' };
  }
  const expected = ANCHOR_FINAL_SEQUENCE[anchor.finalSequenceIndex];
  if (!expected || expected.actor !== actor || expected.objectId !== objectId) {
    anchor.finalSequenceIndex = 0; anchor.attemptsRemaining -= 1; anchor.instability += 1; penalize(state, 25); state.entityState.falseCorridorUntil = Date.now() + 2_500;
    if (anchor.attemptsRemaining <= 0) { penalize(state, 50); anchor.attemptsRemaining = 3; anchor.finalSequenceDeadline = Date.now() + 20_000; return { accepted: false, message: 'The pulse chain collapses. The chamber distorts, then resets for another attempt; your verified node map remains.' }; }
    return { accepted: false, message: 'That node is out of cadence. The pulse chain resets; follow the Future–Past–Future–Past order.' };
  }
  anchor.finalSequenceIndex += 1; state.objectStates[objectId] = 'activated';
  if (anchor.finalSequenceIndex === ANCHOR_FINAL_SEQUENCE.length) {
    state.subtasks.memoryAnchorComplete = true; state.objectStates.anchorPastControl = 'activated'; state.objectStates.anchorFutureControl = 'activated';
    state.entityState.memoryStable = true; state.entityState.deceptionSuppressed = true; state.entityState.falseCorridorUntil = null;
    award(state, 'anchor', 200); addObservation(state, 'team', 'memory-anchor-stabilized', 'Memory Anchor stabilized', 'Anchor chamber', 'The four pulses hold the original east–west circuit and central ground. The facility’s distortions recede.', true);
    anchor.finalSequenceDeadline = null; maybeAdvance(state);
    return { accepted: true, message: 'The Memory Anchor holds · +200 points. The Final Memory is unlocked.' };
  }
  return { accepted: true, message: `Anchor pulse ${anchor.finalSequenceIndex}/4 holds. Continue the historical cadence.` };
}

function anchorConfigurationFailure(state: Hunt2State, message: string): string {
  const anchor = state.memoryAnchor;
  anchor.attemptsRemaining -= 1; anchor.instability += 1; penalize(state, 25); state.entityState.falseCorridorUntil = Date.now() + 2_500;
  if (anchor.attemptsRemaining <= 0) { penalize(state, 50); anchor.attemptsRemaining = 3; return `${message} The chamber distorts after the third failed attempt, then stabilizes for another round of diagnosis.`; }
  return `${message} ${anchor.attemptsRemaining} stabilization attempts remain.`;
}

export function round3Hunt2StateForActor(state: Hunt2State, actor: Hunt2Actor): Hunt2State {
  if (state.completed) return state;
  const identityReconstruction = { ...state.identityReconstruction };
  const falseManifestation = { ...state.falseManifestation };
  const memoryFragments = { ...state.memoryFragments };
  const hiddenWeakness = { ...state.hiddenWeakness };
  const brokenMemory = { ...state.brokenMemory };
  const memoryAnchor = { ...state.memoryAnchor };
  if (!state.subtasks.threeIdentitiesComplete) {
    if (actor === 'archivist') { identityReconstruction.physical = null; identityReconstruction.physicalValid = false; }
    else { identityReconstruction.historical = null; identityReconstruction.historicalValid = false; }
  }
  if (!state.subtasks.falseManifestationComplete) {
    if (actor === 'archivist') { falseManifestation.physicalClassification = null; falseManifestation.physicalValid = false; }
    else { falseManifestation.historicalClassification = null; falseManifestation.historicalValid = false; }
  }
  if (!state.subtasks.memoryFragmentsComplete) {
    if (actor === 'archivist') { memoryFragments.physical = null; memoryFragments.physicalValid = false; }
    else { memoryFragments.historical = null; memoryFragments.historicalValid = false; }
  }
  if (!state.subtasks.hiddenWeaknessComplete) {
    if (actor === 'archivist') { hiddenWeakness.experimentalConclusion = null; hiddenWeakness.experimentalValid = false; hiddenWeakness.experiments = []; }
    else { hiddenWeakness.historicalConclusion = null; hiddenWeakness.historicalValid = false; hiddenWeakness.archiveEvidence = []; }
  }
  if (!state.subtasks.brokenMemoryComplete) {
    if (actor === 'archivist') { brokenMemory.structure = null; brokenMemory.structureValid = false; }
    else { brokenMemory.historical = null; brokenMemory.historicalValid = false; }
  }
  if (!state.subtasks.memoryAnchorComplete) {
    if (actor === 'archivist') { memoryAnchor.physicalConfiguration = null; memoryAnchor.physicalValid = false; }
    else { memoryAnchor.historicalConfiguration = null; memoryAnchor.historicalValid = false; }
    if (actor === 'archivist') { memoryAnchor.trackerEvidence = []; memoryAnchor.nodeStates = { A: 'unknown', B: 'unknown', C: 'unknown', D: 'unknown' }; }
    else memoryAnchor.archivistEvidence = [];
  }
  const observations = state.observations.filter((entry) => state.subtasks.memoryFragmentsComplete || !entry.id.startsWith(actor === 'archivist' ? 'memory-tracker-' : 'memory-archivist-'))
    .filter((entry) => state.subtasks.hiddenWeaknessComplete || !entry.id.startsWith(actor === 'archivist' ? 'weakness-experiment-' : 'weakness-archive-'));
  const subtasks = { ...state.subtasks };
  if (!state.subtasks.memoryFragmentsComplete) {
    subtasks[actor === 'archivist' ? 'memoryPhysicalSubmitted' : 'memoryHistoricalSubmitted'] = false;
  }
  if (!state.subtasks.hiddenWeaknessComplete) {
    if (actor === 'archivist') subtasks.weaknessExperimentalSubmitted = false;
    else subtasks.weaknessHistoricalSubmitted = false;
  }
  if (!state.subtasks.brokenMemoryComplete) subtasks[actor === 'archivist' ? 'brokenStructureSubmitted' : 'brokenHistoricalSubmitted'] = false;
  if (!state.subtasks.memoryAnchorComplete) subtasks[actor === 'archivist' ? 'anchorTrackerConfigured' : 'anchorArchivistConfigured'] = false;
  if (!state.subtasks.memoryAnchorComplete) subtasks.anchorConfigurationComplete = false;
  const privateObservations = observations.filter((entry) => state.subtasks.brokenMemoryComplete || !entry.id.startsWith(actor === 'archivist' ? 'broken-tracker-' : 'broken-archivist-'))
    .filter((entry) => state.subtasks.memoryAnchorComplete || !entry.id.startsWith(actor === 'archivist' ? 'anchor-tracker-' : 'anchor-archivist-'));
  return { ...state, subtasks, observations: privateObservations, identityReconstruction, falseManifestation, memoryFragments, hiddenWeakness, brokenMemory, memoryAnchor };
}

function setReady(state: Hunt2State, actor: Hunt2Actor): string {
  state.readyBy[actor] = true;
  state.subtasks[actor === 'archivist' ? 'archivistReady' : 'trackerReady'] = true;
  if (state.readyBy.archivist && state.readyBy.tracker && state.syncDeadline === null) {
    state.syncDeadline = Date.now() + 10_000;
    addObservation(state, 'team', 'final-sync-window', 'Final synchronization window', 'Containment chamber', 'Both investigators are ready. Activate both controls before the 10-second window closes.', true);
    return 'Both investigators are ready. The 10-second synchronization window is open.';
  }
  return state.readyBy.archivist && state.readyBy.tracker ? 'Both controls are ready. Activate now.' : 'Control prepared. Waiting for the partner.';
}

function activate(state: Hunt2State, actor: Hunt2Actor): string {
  if (!state.readyBy.archivist || !state.readyBy.tracker || state.syncDeadline === null) return 'Both investigators must prepare their controls first.';
  const timestamp = Date.now();
  if (timestamp > state.syncDeadline) {
    penalize(state, 50);
    state.activatedBy = {};
    state.readyBy = {};
    state.syncDeadline = null;
    state.subtasks.archivistReady = false;
    state.subtasks.trackerReady = false;
    return 'The synchronization window expired. The validated memory and mechanisms remain stable; prepare both controls again.';
  }
  state.activatedBy[actor] = timestamp;
  state.subtasks[actor === 'archivist' ? 'archivistActivated' : 'trackerActivated'] = true;
  if (state.currentChallenge === 2 && state.memoryFragments.historicalValid && state.memoryFragments.physicalValid && !state.subtasks.memoryFragmentsComplete) {
    state.subtasks.memoryFragmentsComplete = true; award(state, 'memoryFragments', 200);
    addObservation(state, 'team', 'memory-fragments-reconstructed', 'The Memory Fragments', 'Shared memory board', 'Both timelines establish: the subject arrived, resonance began, the observer reached cutoff, an echo answered, and containment failed.', true);
    message = 'Both reconstructions align · +200 points. The Hidden Weakness is unlocked.';
  }
  maybeAdvance(state);
  return state.completed ? 'The genuine anchor is destroyed.' : 'Final control engaged. Waiting for the other investigator.';
}

export function applyRound3Hunt2Action(teamId: string, input: { type: string; actor?: unknown; objectId?: unknown; value?: unknown }): Hunt2ActionResult | null {
  const hunt1Row = db.prepare('SELECT state_json FROM round3_hunt1_sessions WHERE team_id=?').get(teamId) as { state_json: string } | undefined;
  if (!hunt1Row || !(JSON.parse(hunt1Row.state_json) as { completed?: boolean }).completed) return null;
  if (!round3GameplayAllowed(teamId)) return null;
  const state = getRound3Hunt2State(teamId);
  if (!state || !isActor(input.actor) || state.completed) return null;
  const penaltiesBefore = state.penalties;
  const actor = input.actor;
  const objectId = typeof input.objectId === 'string' ? input.objectId : '';
  const value = input.value && typeof input.value === 'object' ? input.value as Record<string, unknown> : {};
  let message = '';
  let inputNeeded: Hunt2Input | undefined;
  let hint: string | undefined;
  let actionAccepted = true;

  if (input.type === 'hint') {
    const count = state.hintUses[String(state.currentChallenge)] ?? 0;
    if (count >= 2) message = 'Both hints for this challenge have already been used.';
    else {
      state.hintUses[String(state.currentChallenge)] = count + 1;
      penalize(state, 25);
      hint = state.currentChallenge === 1 && state.subtasks.threeIdentitiesComplete
        ? FALSE_MANIFESTATION_HINTS[count]
        : HINTS[state.currentChallenge][count];
      message = `Hint ${count + 1} of 2.`;
    }
  } else if (input.type === 'interact') {
    if (state.currentChallenge === 4 && !state.subtasks.memoryAnchorComplete && state.memoryAnchor.finalSequenceDeadline !== null) {
      const pulse = applyAnchorPulse(state, actor, objectId); actionAccepted = pulse.accepted; message = pulse.message;
    } else if (objectId === 'optionalAnomaly') {
      if (state.objectStates.optionalAnomaly === 'inspected') message = 'This anomaly is already recorded.';
      else {
        state.objectStates.optionalAnomaly = 'inspected';
        award(state, 'optional', 100);
        addObservation(state, 'tracker', 'optional-shadow-anomaly', 'Shadow without a source', 'Main hall — Future', 'A shadow crosses the floor while every nearby object remains still.', false);
        message = 'Optional anomaly recorded. +100 points.';
      }
    } else if (state.currentChallenge === 1 && !state.subtasks.threeIdentitiesComplete && actor === 'archivist' && objectId === 'identityPatientFile') {
      state.subtasks.identityRecordsInspected = true;
      state.objectStates.identityPatientFile = 'inspected';
      addObservation(state, actor, 'identity-historical-records', 'Three names in one case file', 'Medical archive — Past', 'Patient register: Mara Voss, memory-source patient. Transfer order: Dr. S. Vale, lead researcher. A sealed addendum names “Subject Zero” as the identity assigned to the reconstructed imprint, distinct from the patient.', false);
      inputNeeded = 'identity-historical';
      message = 'The medical file gives three names and their historical relationships. Reconstruct the identity sequence and submit it.';
    } else if (state.currentChallenge === 1 && !state.subtasks.threeIdentitiesComplete && actor === 'tracker' && /^identityTrace[ABC]$/.test(objectId)) {
      const physicalClues: Record<string, { title: string; content: string }> = {
        identityTraceA: { title: 'Imprint at the treatment bed', content: 'A patient memory imprint repeats from the treatment bed. Its identifying name is absent from the damaged equipment.' },
        identityTraceB: { title: 'Signature in the transmission coil', content: 'A scorched calibration mark preserves the researcher’s initials, S.V., on the transmission side of the apparatus.' },
        identityTraceC: { title: 'A presence beyond the glass', content: 'A new pulse answers from the abandoned channel after both human signatures end. It behaves as an autonomous presence, not a patient recording.' },
      };
      if (!state.inspectedIdentityTraces.includes(objectId)) state.inspectedIdentityTraces.push(objectId);
      state.objectStates[objectId] = 'inspected';
      const clue = physicalClues[objectId];
      addObservation(state, actor, `physical-${objectId}`, clue.title, 'Experiment chamber — Future', clue.content, false);
      message = `Physical identity trace recorded (${state.inspectedIdentityTraces.length}/3).`;
      if (state.inspectedIdentityTraces.length === 3) {
        inputNeeded = 'identity-physical';
        message = 'All three traces are recorded. Reconstruct which physical signature belongs to each identity and submit.';
      }
    } else if (state.currentChallenge === 1 && !state.subtasks.threeIdentitiesComplete && objectId === 'identityPatientFile') {
      actionAccepted = false;
      message = 'Only the Archivist can inspect the historical identity file.';
    } else if (state.currentChallenge === 1 && !state.subtasks.threeIdentitiesComplete && /^identityTrace[ABC]$/.test(objectId)) {
      actionAccepted = false;
      message = 'Only the Tracker can examine the Future identity traces.';
    } else if (state.currentChallenge === 1 && state.subtasks.threeIdentitiesComplete && actor === 'archivist' && objectId === 'manifestationRecords') {
      state.subtasks.manifestationRecordsInspected = true;
      state.objectStates.manifestationRecords = 'inspected';
      addObservation(state, actor, 'manifestation-historical-records', 'Three contradictory manifestation records', 'Security archive — Past', 'Record A is countersigned by both observers during the original exposure. Record B was inserted after the archive seal and its photo date precedes the logged event. Record C claims a north corridor sighting after the corridor was permanently bricked in.', false);
      inputNeeded = 'manifestation-history';
      message = 'Compare the signatures, seal and dates. Classify each historical record as authenticated, altered, or impossible.';
    } else if (state.currentChallenge === 1 && state.subtasks.threeIdentitiesComplete && actor === 'tracker' && ['manifestationA', 'manifestationB', 'manifestationC'].includes(objectId)) {
      const traces: Record<string, string> = {
        manifestationA: 'The figure casts no shadow, but the light source is physically blocked; its silhouette does not persist when the light moves.',
        manifestationB: 'A reversed reflection remains visible in separate glass shards, independent of the figure’s position.',
        manifestationC: 'Footprints appear to leave the room, but the print pattern ends against a continuous wall with no floor dust beyond it.',
      };
      if (!state.inspectedFalseManifestations.includes(objectId)) state.inspectedFalseManifestations.push(objectId);
      state.objectStates[objectId] = 'inspected';
      addObservation(state, actor, `false-${objectId}`, `Future anomaly at manifestation ${objectId.slice(-1)}`, 'Experiment chamber — Future', traces[objectId], false);
      message = `Future manifestation trace recorded (${state.inspectedFalseManifestations.length}/3).`;
      if (state.inspectedFalseManifestations.length === 3) {
        inputNeeded = 'manifestation-physical';
        message = 'All three Future traces are recorded. Classify each as genuine or fabricated.';
      }
    } else if (state.currentChallenge === 1 && objectId === 'manifestationRecords') {
      actionAccepted = false;
      message = !state.subtasks.threeIdentitiesComplete ? 'Complete The Three Identities before opening the manifestation archive.' : 'Only the Archivist can classify the historical manifestation records.';
    } else if (state.currentChallenge === 1 && ['manifestationA', 'manifestationB', 'manifestationC'].includes(objectId)) {
      actionAccepted = false;
      message = !state.subtasks.threeIdentitiesComplete ? 'Complete The Three Identities before examining manifestations.' : 'Only the Tracker can classify the Future manifestation traces.';
    } else if (state.currentChallenge === 2 && !state.subtasks.memoryFragmentsComplete && actor === 'archivist' && ['memoryDiary', 'memoryPhotograph', 'memoryIncidentReport'].includes(objectId)) {
      const evidence: Record<string, [string, string]> = {
        memoryDiary: ['Diary with a false midnight stamp', 'The diary margin says the subject entered before the resonance test, though the clock stamp reads 00:14. A power-reset note proves that clock was twelve minutes fast.'],
        memoryPhotograph: ['Photograph with a misleading date', 'The emulsion is dated one day later than the event, but the archive envelope was resealed after exposure. Compare the Tracker’s physical trace at the threshold.'],
        memoryIncidentReport: ['Cut incident report', 'The report says the observer stopped the sequence at the cutoff. Its final line is missing; the Tracker’s echo may establish whether a response followed.'],
      };
      const key = objectId.replace('memory', '').replace(/^./, (v) => v.toLowerCase());
      if (!state.memoryFragments.archivistEvidence.includes(key)) state.memoryFragments.archivistEvidence.push(key);
      state.objectStates[objectId] = 'inspected';
      const clue = evidence[objectId]; addObservation(state, actor, `memory-archivist-${key}`, clue[0], 'Memory archive — Past', clue[1]);
      message = `Historical fragment recorded (${state.memoryFragments.archivistEvidence.length}/3). Cross-reference the Future traces before reconstructing the sequence.`;
      if (state.memoryFragments.archivistEvidence.length === 3 && state.memoryFragments.trackerEvidence.length === 3) inputNeeded = 'memory-historical';
    } else if (state.currentChallenge === 2 && !state.subtasks.memoryFragmentsComplete && actor === 'tracker' && ['memoryEcho', 'memoryReel', 'memoryResidualMark'].includes(objectId)) {
      const clues: Record<string, [string, string]> = {
        memoryEcho: ['Answering echo', 'A second voice answers only after the observer reaches the marked cutoff; the damaged speaker timestamp is unreliable.'],
        memoryReel: ['Reel displaced from the recorder', 'The final reel was pulled outward after a resonance pulse, contradicting the report’s claim that the apparatus was shut down first.'],
        memoryResidualMark: ['Residual mark at the threshold', 'A fresh pressure mark records the subject entering before the test, despite the photograph’s later filing date.'],
      };
      const key = objectId === 'memoryEcho' ? 'echo' : objectId === 'memoryReel' ? 'reel' : 'mark';
      if (!state.memoryFragments.trackerEvidence.includes(key)) state.memoryFragments.trackerEvidence.push(key);
      state.objectStates[objectId] = 'inspected';
      const clue = clues[objectId]; addObservation(state, actor, `memory-tracker-${key}`, clue[0], 'Incident site — Future', clue[1]);
      message = `Physical memory trace recorded (${state.memoryFragments.trackerEvidence.length}/3). The archive contains the context for its misleading timestamps.`;
      if (state.memoryFragments.archivistEvidence.length === 3 && state.memoryFragments.trackerEvidence.length === 3) inputNeeded = 'memory-physical';
    } else if (state.currentChallenge === 2 && !state.subtasks.memoryFragmentsComplete && ['memoryDiary', 'memoryPhotograph', 'memoryIncidentReport'].includes(objectId)) {
      actionAccepted = false; message = 'Only the Archivist can examine the historical memory archive.';
    } else if (state.currentChallenge === 2 && !state.subtasks.memoryFragmentsComplete && ['memoryEcho', 'memoryReel', 'memoryResidualMark'].includes(objectId)) {
      actionAccepted = false; message = 'Only the Tracker can examine the Future memory traces.';
    } else if (state.currentChallenge === 2 && state.subtasks.memoryFragmentsComplete && !state.subtasks.hiddenWeaknessComplete && actor === 'archivist' && objectId === 'weaknessArchive') {
      const entries: Record<string, string> = {
        'weakness-archive-baseline': 'Baseline memo: the entity’s response was recorded after a calibrated resonance pass.',
        'weakness-archive-bright': 'Investigator claim: bright exposure “dissolved” the presence; the attached control reading shows the lamp was disconnected.',
        'weakness-archive-warm': 'Investigator claim: warmth weakened the entity; the log was written during a temperature sensor fault.',
      };
      if (!state.hiddenWeakness.archiveEvidence.includes('baseline')) state.hiddenWeakness.archiveEvidence.push('baseline');
      if (state.hiddenWeakness.experiments.length >= 2 && !state.hiddenWeakness.archiveEvidence.includes('contradictions')) state.hiddenWeakness.archiveEvidence.push('contradictions');
      state.objectStates.weaknessArchive = 'inspected';
      addObservation(state, actor, 'weakness-archive-baseline', 'Containment archive', 'Containment laboratory — Past', entries['weakness-archive-baseline']);
      if (state.hiddenWeakness.archiveEvidence.includes('contradictions')) addObservation(state, actor, 'weakness-archive-contradictions', 'Two failed conclusions', 'Containment laboratory — Past', `${entries['weakness-archive-bright']} ${entries['weakness-archive-warm']}`);
      inputNeeded = 'weakness-history';
      message = 'The archive contains two misleading conclusions. Compare them with controlled Future experiments.';
    } else if (state.currentChallenge === 2 && state.subtasks.memoryFragmentsComplete && ['weaknessFrequencyStation', 'weaknessLightStation', 'weaknessTemperatureStation', 'weaknessContainmentConsole'].includes(objectId) && actor !== 'tracker') {
      actionAccepted = false; message = 'Only the Tracker can operate Future laboratory equipment.';
    } else if (state.currentChallenge === 2 && state.subtasks.memoryFragmentsComplete && objectId === 'weaknessCalibrationConsole' && actor !== 'archivist') {
      actionAccepted = false; message = 'Only the Archivist can operate the historical calibration console.';
    } else if (state.currentChallenge === 2 && state.subtasks.memoryFragmentsComplete && objectId === 'weaknessArchive' && actor !== 'archivist') {
      actionAccepted = false; message = 'Only the Archivist can examine the historical experiment archive.';
    } else if (state.currentChallenge === 2 && state.subtasks.memoryFragmentsComplete && !state.subtasks.hiddenWeaknessComplete && actor === 'tracker' && ['weaknessFrequencyStation', 'weaknessLightStation', 'weaknessTemperatureStation'].includes(objectId)) {
      const variable = objectId === 'weaknessFrequencyStation' ? 'frequency' : objectId === 'weaknessLightStation' ? 'light' : 'temperature';
      const tested = state.hiddenWeakness.experiments.filter((entry) => entry.variable === variable).length;
      if (tested >= 2) { actionAccepted = false; message = 'Both controlled conditions at this station are already recorded.'; }
      else { state.hiddenWeakness.stationReady = variable; inputNeeded = variable === 'frequency' ? 'weakness-frequency' : variable === 'light' ? 'weakness-light' : 'weakness-temperature'; message = `Choose an untested ${variable} condition. ${state.hiddenWeakness.resourcesRemaining} experiment charges remain.`; }
    } else if (state.currentChallenge === 2 && state.subtasks.memoryFragmentsComplete && !state.subtasks.hiddenWeaknessComplete && actor === 'tracker' && objectId === 'weaknessContainmentConsole') {
      if (!state.hiddenWeakness.historicalValid || !state.hiddenWeakness.experimentalValid) { actionAccepted = false; message = 'The combined vulnerability must be verified before containment can be armed.'; }
      else if (state.hiddenWeakness.trackerActivatedAt && state.hiddenWeakness.syncDeadline && Date.now() <= state.hiddenWeakness.syncDeadline) { actionAccepted = false; message = 'Containment is already armed. The Archivist must calibrate it now.'; }
      else {
        state.hiddenWeakness.trackerActivatedAt = Date.now(); state.hiddenWeakness.syncDeadline = Date.now() + 10_000;
        message = 'Containment armed. Archivist: calibrate the historical sequence within 10 seconds.';
      }
    } else if (state.currentChallenge === 2 && state.subtasks.memoryFragmentsComplete && !state.subtasks.hiddenWeaknessComplete && actor === 'archivist' && objectId === 'weaknessCalibrationConsole') {
      if (!state.hiddenWeakness.trackerActivatedAt || !state.hiddenWeakness.syncDeadline) { actionAccepted = false; message = 'The Tracker must arm containment first.'; }
      else if (Date.now() > state.hiddenWeakness.syncDeadline) { penalize(state, 50); state.hiddenWeakness.trackerActivatedAt = null; state.hiddenWeakness.syncDeadline = null; message = 'Calibration window expired. The entity destabilizes; reconfirm the evidence and arm containment again.'; }
      else if (!state.hiddenWeakness.historicalValid || !state.hiddenWeakness.experimentalValid) { actionAccepted = false; message = 'Both conclusions must be verified before calibration.'; }
      else {
        state.subtasks.hiddenWeaknessComplete = true; state.objectStates.weaknessContainmentConsole = 'activated'; state.objectStates.weaknessCalibrationConsole = 'activated';
        award(state, 'hiddenWeakness', 200); addObservation(state, 'team', 'hidden-weakness-contained', 'The Hidden Weakness', 'Containment laboratory', 'The paired resonance, darkness, and cold conditions collapse the entity’s unstable memory shell.', true);
        message = 'The entity is contained · +200 points. The Broken Memory is unlocked.'; maybeAdvance(state);
      }
    } else if (state.currentChallenge === 2 && ['identityMemory', 'manifestationA', 'manifestationB', 'manifestationC'].includes(objectId)) {
      actionAccepted = false; message = 'That manifestation investigation is complete. Examine the active memory or containment evidence instead.';
    } else if (state.currentChallenge === 3 && !state.subtasks.brokenMemoryComplete && actor === 'archivist' && ['brokenArchivePhoto', 'brokenArchiveLedger', 'brokenArchiveRecording'].includes(objectId)) {
      const evidence: Record<string, { key: string; title: string; content: string; dependency?: string }> = {
        brokenArchivePhoto: { key: 'photo', title: 'Photograph that survived the fire', content: 'The emulsion and archive seal are original. The portrait appears to show one person, and the caption identifies her as Mara.' },
        brokenArchiveLedger: { key: 'ledger', title: 'Duplicated memory ledger', content: 'Two copies name the same subject in adjacent entries. Tracker’s displaced portrait mark confirms one copy was inserted after the chamber was altered.', dependency: 'chamber' },
        brokenArchiveRecording: { key: 'recording', title: 'Fragmented voice cylinder', content: 'A cut-out hides the speaker’s last words. The Future projection carries the matching second voice; the recording was fragmented, not a second person.', dependency: 'symbols' },
      };
      const clue = evidence[objectId];
      if (clue.dependency && !state.brokenMemory.trackerEvidence.includes(clue.dependency)) { actionAccepted = false; message = 'This fragment cannot be interpreted yet. Ask the Tracker to examine the matching Future trace.'; }
      else {
        if (!state.brokenMemory.archivistEvidence.includes(clue.key)) state.brokenMemory.archivistEvidence.push(clue.key);
        state.objectStates[objectId] = 'inspected'; addObservation(state, actor, `broken-archivist-${clue.key}`, clue.title, 'Memory archive — Past', clue.content);
        if (objectId === 'brokenArchivePhoto' && state.brokenMemory.trackerEvidence.includes('symbols')) addObservation(state, actor, 'broken-archivist-photo-crosscheck', 'Caption substituted after the exposure', 'Memory archive — Past', 'The Future projection repeats the face under a different name-symbol. The photograph itself is authentic, but its caption was substituted; the apparent identity was never part of the original image.');
        message = `Historical component examined (${state.brokenMemory.archivistEvidence.length}/3). Cross-check suspect alterations against the Future chambers.`;
      }
    } else if (state.currentChallenge === 3 && !state.subtasks.brokenMemoryComplete && actor === 'tracker' && ['brokenMemoryChamber', 'brokenProjectionSymbols', 'brokenKeepsakeMechanism'].includes(objectId)) {
      const evidence: Record<string, { key: string; title: string; content: string; dependency?: string }> = {
        brokenMemoryChamber: { key: 'chamber', title: 'Portrait displaced inside the chamber', content: 'The Future portrait is bolted beside the entry. Dust under its frame marks a second position by the mirror; the room has been displaced.' },
        brokenProjectionSymbols: { key: 'symbols', title: 'Symbols repeated across the projection', content: 'The same face-symbol appears twice, while a name-symbol flickers in its place. The archive photograph can distinguish the copied symbol from the original.', dependency: 'photo' },
        brokenKeepsakeMechanism: { key: 'keepsake', title: 'Keepsake reconnect mechanism', content: 'Three notches connect a pre-test keepsake to the central memory node. The ledger’s duplicate is the substituted component; the mechanism can now be reconstructed.', dependency: 'ledger' },
      };
      const clue = evidence[objectId];
      if (clue.dependency && !state.brokenMemory.archivistEvidence.includes(clue.dependency)) { actionAccepted = false; message = 'The projection is incomplete. Ask the Archivist to examine the matching Past record first.'; }
      else {
        if (!state.brokenMemory.trackerEvidence.includes(clue.key)) state.brokenMemory.trackerEvidence.push(clue.key);
        state.objectStates[objectId] = 'inspected'; addObservation(state, actor, `broken-tracker-${clue.key}`, clue.title, 'Corrupted memory chambers — Future', clue.content);
        if (clue.key !== 'chamber') state.brokenMemory.corruption += 1;
        message = `Physical corruption examined (${state.brokenMemory.trackerEvidence.length}/3). Identify displacement, duplication and substitution before restoring.`;
      }
    } else if (state.currentChallenge === 3 && !state.subtasks.brokenMemoryComplete && ['brokenArchivePhoto', 'brokenArchiveLedger', 'brokenArchiveRecording'].includes(objectId)) {
      actionAccepted = false; message = 'Only the Archivist can access the historical archive.';
    } else if (state.currentChallenge === 3 && !state.subtasks.brokenMemoryComplete && ['brokenMemoryChamber', 'brokenProjectionSymbols', 'brokenKeepsakeMechanism'].includes(objectId)) {
      actionAccepted = false; message = 'Only the Tracker can inspect the Future memory chambers.';
    } else if (state.currentChallenge === 3 && !state.subtasks.brokenMemoryComplete && ['brokenRestorationBoard', 'brokenRestorationBoardFuture'].includes(objectId)) {
      if (state.brokenMemory.archivistEvidence.length < 3 || state.brokenMemory.trackerEvidence.length < 3) { actionAccepted = false; message = `The restoration board needs all six discoveries (${state.brokenMemory.archivistEvidence.length}/3 Past · ${state.brokenMemory.trackerEvidence.length}/3 Future).`; }
      else { state.objectStates[objectId] = 'visible'; inputNeeded = actor === 'archivist' ? 'broken-historical' : 'broken-structure'; message = actor === 'archivist' ? 'Restore the historical relationships between the six components.' : 'Place the components in the six Future memory positions using the cross-referenced clues.'; }
    } else if (state.currentChallenge === 3 && !state.subtasks.brokenMemoryComplete && actor === 'archivist' && objectId === 'brokenSyncConsole') {
      if (!state.brokenMemory.historicalValid || !state.brokenMemory.structureValid) { actionAccepted = false; message = 'Both private reconstructions must be verified before synchronization.'; }
      else if (state.brokenMemory.archivistSyncAt && state.brokenMemory.syncDeadline && Date.now() <= state.brokenMemory.syncDeadline) { actionAccepted = false; message = 'Historical synchronization is already active. Tracker must restore the Future chamber now.'; }
      else { state.brokenMemory.archivistSyncAt = Date.now(); state.brokenMemory.syncDeadline = Date.now() + 10_000; message = 'Historical synchronization initiated. Tracker: activate the environmental restoration mechanism within 10 seconds.'; }
    } else if (state.currentChallenge === 3 && !state.subtasks.brokenMemoryComplete && actor === 'tracker' && objectId === 'brokenRestoreMechanism') {
      if (!state.brokenMemory.archivistSyncAt || !state.brokenMemory.syncDeadline) { actionAccepted = false; message = 'The Archivist must initiate historical synchronization first.'; }
      else if (Date.now() > state.brokenMemory.syncDeadline) { penalize(state, 50); state.brokenMemory.archivistSyncAt = null; state.brokenMemory.syncDeadline = null; state.brokenMemory.corruption += 1; state.entityState.falseCorridorUntil = Date.now() + 2_000; message = 'The memories desynchronize and distort the chamber. The verified structure remains; initiate synchronization again.'; }
      else {
        state.subtasks.brokenMemoryComplete = true; state.objectStates.brokenRestoreMechanism = 'activated'; state.objectStates.brokenSyncConsole = 'activated';
        state.entityState.memoryStable = true; state.entityState.deceptionSuppressed = true; state.entityState.falseCorridorUntil = null;
        for (const id of ['brokenArchivePhoto', 'brokenArchiveLedger', 'brokenArchiveRecording', 'brokenMemoryChamber', 'brokenProjectionSymbols', 'brokenKeepsakeMechanism', 'brokenRestorationBoard', 'brokenRestorationBoardFuture']) state.objectStates[id] = 'restored';
        award(state, 'brokenMemory', 300); addObservation(state, 'team', 'broken-memory-restored', 'Broken Memory restored', 'Shared memory archive', 'The duplicated and displaced records resolve around one original identity. The entity’s true memory structure stabilizes.', true);
        message = 'The original memory structure stabilizes · +300 points. The Memory Anchor is unlocked.'; maybeAdvance(state);
      }
    } else if (state.currentChallenge === 3 && objectId === 'brokenSyncConsole' && actor !== 'archivist') {
      actionAccepted = false; message = 'Only the Archivist can initiate synchronization from the Past.';
    } else if (state.currentChallenge === 3 && objectId === 'brokenRestoreMechanism' && actor !== 'tracker') {
      actionAccepted = false; message = 'Only the Tracker can activate the Future restoration mechanism.';
    } else if (state.currentChallenge === 3 && objectId.startsWith('layout')) {
      actionAccepted = false; message = 'The old room-layout projection is no longer part of this investigation. Use the memory restoration board.';
    } else if (state.currentChallenge === 3 && ['layoutMemory', 'layoutChair', 'layoutMirror', 'layoutTable', 'layoutLamp'].includes(objectId)) {
      actionAccepted = false; message = 'The old room-layout projection is no longer part of this investigation. Use the memory restoration board.';
    } else if (state.currentChallenge === 4 && !state.subtasks.memoryAnchorComplete && actor === 'archivist' && objectId === 'anchorMemory') {
      if (!state.memoryAnchor.archivistEvidence.includes('diagram')) state.memoryAnchor.archivistEvidence.push('diagram');
      state.subtasks.anchorDiagramInspected = true; state.objectStates.anchorMemory = 'inspected';
      addObservation(state, actor, 'anchor-archivist-diagram', 'Original anchor containment diagram', 'Anchor chamber — Past', 'The design routes the east lead inward, returns through the west lead, grounds the central node, then closes the outer loop. The drawing cannot show which Future connections have failed.');
      message = 'The original configuration is recorded. The Tracker must map live node conditions before the Past alignment can be finalized.';
    } else if (state.currentChallenge === 4 && !state.subtasks.memoryAnchorComplete && actor === 'archivist' && objectId === 'anchorFlowRecord') {
      if (!state.memoryAnchor.trackerEvidence.includes('A') || !state.memoryAnchor.trackerEvidence.includes('B')) { actionAccepted = false; message = 'The flow record remains unreadable until the Tracker examines the north and west nodes.'; }
      else {
        if (!state.memoryAnchor.archivistEvidence.includes('flow')) state.memoryAnchor.archivistEvidence.push('flow');
        state.subtasks.anchorFlowInspected = true; state.objectStates.anchorFlowRecord = 'inspected';
        addObservation(state, actor, 'anchor-archivist-flow', 'Historical energy-flow cadence', 'Anchor chamber — Past', 'The final stabilization cadence alternates Future north → Past west → Future central ground → Past outer loop. Each pulse depends on the previous connection holding.');
        message = 'The historical pulse cadence is recovered. Combine it with the Tracker’s live state report.';
      }
    } else if (state.currentChallenge === 4 && !state.subtasks.memoryAnchorComplete && actor === 'archivist' && ['anchorNodePastB', 'anchorNodePastD'].includes(objectId)) {
      const node = objectId === 'anchorNodePastB' ? 'B' : 'D'; const required = node === 'B' ? 'diagram' : 'flow';
      if (!state.memoryAnchor.archivistEvidence.includes(required)) { actionAccepted = false; message = `The Past node ${node} is still obscured. Examine its original ${required} record first.`; }
      else {
        if (!state.memoryAnchor.archivistEvidence.includes(`node-${node}`)) state.memoryAnchor.archivistEvidence.push(`node-${node}`);
        state.objectStates[objectId] = 'inspected'; addObservation(state, actor, `anchor-archivist-node-${node}`, `Past alignment mark — node ${node}`, 'Anchor chamber — Past', node === 'B' ? 'The return relay is engraved westward, opposite the failed live current.' : 'The outer loop was designed to close last, after the central ground is secured.');
        message = `Past alignment mark ${node} recorded.`;
      }
    } else if (state.currentChallenge === 4 && !state.subtasks.memoryAnchorComplete && actor === 'tracker' && ['memoryAnchorA', 'memoryAnchorB', 'memoryAnchorC', 'anchorNodeD'].includes(objectId)) {
      const node = objectId === 'memoryAnchorA' ? 'A' : objectId === 'memoryAnchorB' ? 'B' : objectId === 'memoryAnchorC' ? 'C' : 'D';
      const neededArchive = node === 'C' ? 'diagram' : node === 'D' ? 'flow' : null;
      if (neededArchive && !state.memoryAnchor.archivistEvidence.includes(neededArchive)) { actionAccepted = false; message = 'This node is veiled. Ask the Archivist to inspect the matching Past diagram or flow record.'; }
      else if (state.memoryAnchor.trackerEvidence.includes(node) && !state.memoryAnchor.finalSequenceDeadline) message = `Node ${node} is already mapped. Its reading is saved.`;
      else if (state.memoryAnchor.finalSequenceDeadline !== null) {
        const expected = ANCHOR_FINAL_SEQUENCE[state.memoryAnchor.finalSequenceIndex];
        if (!expected || expected.actor !== actor || expected.objectId !== objectId) {
          state.memoryAnchor.finalSequenceIndex = 0; state.memoryAnchor.finalSequenceDeadline = null; state.memoryAnchor.attemptsRemaining -= 1; state.memoryAnchor.instability += 1; penalize(state, 25); state.entityState.falseCorridorUntil = Date.now() + 2_500;
          if (state.memoryAnchor.attemptsRemaining <= 0) { penalize(state, 50); state.memoryAnchor.attemptsRemaining = 3; message = 'The pulse chain collapses. The chamber distorts, then resets for another attempt; your verified node map remains.'; }
          else message = 'That node is out of cadence. The pulse chain resets; use the recovered Future–Past–Future–Past order.';
        } else {
          state.memoryAnchor.finalSequenceIndex += 1; state.objectStates[objectId] = 'activated';
          if (state.memoryAnchor.finalSequenceIndex === ANCHOR_FINAL_SEQUENCE.length) {
            state.subtasks.memoryAnchorComplete = true; state.objectStates.anchorPastControl = 'activated'; state.objectStates.anchorFutureControl = 'activated';
            state.entityState.memoryStable = true; state.entityState.deceptionSuppressed = true; state.entityState.falseCorridorUntil = null;
            award(state, 'anchor', 200); addObservation(state, 'team', 'memory-anchor-stabilized', 'Memory Anchor stabilized', 'Anchor chamber', 'The four pulses hold the original east–west circuit and the central ground. The facility’s distortions recede.', true);
            state.memoryAnchor.finalSequenceDeadline = null; message = 'The Memory Anchor holds · +200 points. The Final Memory is unlocked.'; maybeAdvance(state);
          } else message = `Anchor pulse ${state.memoryAnchor.finalSequenceIndex}/4 holds. Continue the historical cadence.`;
        }
      } else {
        const states: Record<string, Hunt2State['memoryAnchor']['nodeStates'][keyof Hunt2State['memoryAnchor']['nodeStates']]> = { memoryAnchorA: 'unstable', memoryAnchorB: 'reversed', memoryAnchorC: 'disconnected', anchorNodeD: 'stable' };
        state.memoryAnchor.nodeStates[node] = states[objectId];
        if (!state.memoryAnchor.trackerEvidence.includes(node)) state.memoryAnchor.trackerEvidence.push(node);
        state.objectStates[objectId] = 'inspected';
        const descriptions: Record<string, string> = { memoryAnchorA: 'North node: the incoming field surges, then drops. Condition: unstable.', memoryAnchorB: 'West node: the return current flows against its engraved arrow. Condition: reversed.', memoryAnchorC: 'Central node: no grounding current reaches the housing. Condition: disconnected.', anchorNodeD: 'South node: the outer loop is intact and quiet. Condition: stable.' };
        addObservation(state, actor, `anchor-tracker-${node}`, `Live reading — node ${node}`, 'Anchor chamber — Future', descriptions[objectId]);
        message = `Node ${node} condition recorded (${state.memoryAnchor.trackerEvidence.length}/4). Compare live states with the Past design.`;
      }
    } else if (state.currentChallenge === 4 && !state.subtasks.memoryAnchorComplete && objectId === 'anchorPastControl' && actor === 'archivist') {
      if (state.memoryAnchor.archivistEvidence.length < 2 || state.memoryAnchor.trackerEvidence.length < 4) { actionAccepted = false; message = 'The Past control needs both historical records and all four Future node readings.'; }
      else if (state.memoryAnchor.historicalValid && state.memoryAnchor.physicalValid) {
        if (state.memoryAnchor.archivistSyncAt && state.memoryAnchor.syncDeadline && Date.now() <= state.memoryAnchor.syncDeadline) { actionAccepted = false; message = 'Past synchronization is already active. The Tracker must engage the Future control.'; }
        else { state.memoryAnchor.archivistSyncAt = Date.now(); state.memoryAnchor.syncDeadline = Date.now() + 10_000; message = 'Past synchronization initiated. Tracker: engage the Future control within 10 seconds.'; }
      } else { inputNeeded = 'anchor-history-config'; message = 'Configure the historical east, return, ground and loop alignments from the recovered diagram.'; }
    } else if (state.currentChallenge === 4 && !state.subtasks.memoryAnchorComplete && objectId === 'anchorFutureControl' && actor === 'tracker') {
      if (state.memoryAnchor.trackerEvidence.length < 4 || state.memoryAnchor.archivistEvidence.length < 2) { actionAccepted = false; message = 'The Future control needs all four live node readings and both Past records.'; }
      else if (state.memoryAnchor.historicalValid && state.memoryAnchor.physicalValid) {
        if (!state.memoryAnchor.archivistSyncAt || !state.memoryAnchor.syncDeadline) { actionAccepted = false; message = 'The Archivist must initiate the Past synchronization first.'; }
        else if (Date.now() > state.memoryAnchor.syncDeadline) { state.memoryAnchor.archivistSyncAt = null; state.memoryAnchor.syncDeadline = null; state.memoryAnchor.instability += 1; state.entityState.falseCorridorUntil = Date.now() + 2_500; penalize(state, 50); message = 'The synchronization window collapsed. The node configuration remains; Archivist must restart the Past pulse.'; }
        else { state.memoryAnchor.finalSequenceIndex = 0; state.memoryAnchor.syncDeadline = null; state.memoryAnchor.finalSequenceDeadline = Date.now() + 20_000; message = 'The anchor responds. Complete the four-node Future–Past–Future–Past pulse cadence before it destabilizes.'; }
      } else { inputNeeded = 'anchor-physical-config'; message = `Set all four physical node controls. ${state.memoryAnchor.attemptsRemaining} stabilization attempts remain.`; }
    } else if (state.currentChallenge === 4 && !state.subtasks.memoryAnchorComplete && ['anchorPastControl', 'anchorMemory', 'anchorFlowRecord', 'anchorNodePastB', 'anchorNodePastD'].includes(objectId) && actor !== 'archivist') {
      actionAccepted = false; message = 'Only the Archivist can operate Past anchor records and controls.';
    } else if (state.currentChallenge === 4 && !state.subtasks.memoryAnchorComplete && ['anchorFutureControl', 'memoryAnchorA', 'memoryAnchorB', 'memoryAnchorC', 'anchorNodeD'].includes(objectId) && actor !== 'tracker') {
      actionAccepted = false; message = 'Only the Tracker can operate Future anchor nodes and controls.';
    } else if (state.currentChallenge === 4 && ['memoryAnchorA', 'memoryAnchorB', 'memoryAnchorC', 'anchorNodeD', 'anchorFlowRecord', 'anchorNodePastB', 'anchorNodePastD'].includes(objectId)) {
      actionAccepted = false; message = 'Only the assigned investigator can access this side of the anchor chamber.';
    } else if (state.currentChallenge === 5 && actor === 'archivist' && objectId === 'finalSequenceMemory') {
      if (!state.subtasks.finalSequenceValidated) {
        state.subtasks.finalMemoryViewed = true;
        state.objectStates.finalSequenceMemory = 'inspected';
        addObservation(state, actor, 'final-event-memory', 'Three events before containment failed', 'Observation chamber — Past', 'The original sequence shows the subject arrive, the warning alarm begin, then containment fail.', false);
        inputNeeded = 'final-sequence';
        message = 'Submit the original event sequence.';
      } else if (!state.projectorMaintained) {
        state.projectorMaintained = true;
        state.entityState.memoryStable = true;
        state.subtasks.memoryMaintained = true;
        state.objectStates.finalSequenceMemory = 'activated';
        message = 'Original memory stabilized. Maintain the projection while the Tracker completes the physical sequence.';
      } else {
        message = setReady(state, actor);
      }
    } else if (state.currentChallenge === 5 && actor === 'tracker' && ['mechanismA', 'mechanismB', 'mechanismC'].includes(objectId)) {
      if (!state.subtasks.finalSequenceValidated || !state.projectorMaintained) message = 'The mechanisms are locked until the Archivist validates and stabilizes the original memory.';
      else {
        const expected = ['mechanismB', 'mechanismA', 'mechanismC'];
        const next = expected[state.mechanismsActivated.length];
        if (objectId !== next) {
          penalize(state, 25);
          state.mechanismsActivated = [];
          state.entityState.falseCorridorUntil = Date.now() + 1_800;
          message = 'The mechanisms shift out of sequence. They reset to their safe state; use the stabilized memory and retry.';
        } else {
          state.mechanismsActivated.push(objectId);
          state.objectStates[objectId] = 'activated';
          message = `Mechanism engaged (${state.mechanismsActivated.length}/3).`;
          if (state.mechanismsActivated.length === 3) state.subtasks.containmentMechanismsReady = true;
        }
      }
    } else if (state.currentChallenge === 5 && actor === 'tracker' && objectId === 'trueMemoryAnchor') {
      if (!state.subtasks.containmentMechanismsReady) message = 'Complete the three containment mechanisms first.';
      else if (state.readyBy.tracker) message = activate(state, actor);
      else {
        state.objectStates.trueMemoryAnchor = 'visible';
        message = setReady(state, actor);
      }
    } else if (state.currentChallenge === 5 && actor === 'archivist' && objectId === 'finalMemoryConsole') {
      if (!state.projectorMaintained) message = 'Stabilize the validated memory projection first.';
      else if (state.readyBy.archivist) message = activate(state, actor);
      else message = setReady(state, actor);
    } else message = `That object is not available for the active Hunt 2 challenge (${state.currentChallenge}/5).`;
  } else if (input.type === 'submit') {
    switch (value.kind) {
      case 'identity-historical':
        if (state.currentChallenge !== 1 || state.subtasks.threeIdentitiesComplete || actor !== 'archivist' || !state.subtasks.identityRecordsInspected || !Array.isArray(value.order)) { actionAccepted = false; message = 'Only the Archivist can submit the historical reconstruction after inspecting the identity records.'; }
        else if (state.identityReconstruction.historicalValid) { actionAccepted = false; message = 'The historical identity reconstruction is already verified.'; }
        else if (JSON.stringify(value.order) !== JSON.stringify(IDENTITY_HISTORICAL)) {
          state.identityReconstruction.historical = value.order.filter((item): item is string => typeof item === 'string');
          state.identityReconstruction.historicalValid = false;
          penalize(state, 25);
          message = 'That historical relationship conflicts with the records. Re-examine the dates and case addendum.';
        } else {
          state.identityReconstruction.historical = IDENTITY_HISTORICAL;
          state.identityReconstruction.historicalValid = true;
          state.subtasks.historicalIdentitiesSubmitted = true;
          addObservation(state, actor, 'historical-identities-verified', 'Historical identities reconstructed', 'Medical archive — Past', 'The patient, lead researcher, and reconstructed identity are distinguished in the correct historical relationship.', true);
          message = state.identityReconstruction.physicalValid ? 'Historical identities verified. The Tracker’s Future links complete the reconstruction.' : 'Historical identities verified. Waiting for the Tracker’s physical identity links.';
        }
        break;
      case 'identity-physical':
        if (state.currentChallenge !== 1 || state.subtasks.threeIdentitiesComplete || actor !== 'tracker' || state.inspectedIdentityTraces.length !== 3 || !Array.isArray(value.order)) { actionAccepted = false; message = 'Only the Tracker can submit the physical reconstruction after inspecting all three traces.'; }
        else if (state.identityReconstruction.physicalValid) { actionAccepted = false; message = 'The physical identity reconstruction is already verified.'; }
        else if (JSON.stringify(value.order) !== JSON.stringify(IDENTITY_PHYSICAL)) {
          state.identityReconstruction.physical = value.order.filter((item): item is string => typeof item === 'string');
          state.identityReconstruction.physicalValid = false;
          penalize(state, 25);
          message = 'Those physical links do not match the traces. Compare the treatment imprint, transmission signature, and answering presence.';
        } else {
          state.identityReconstruction.physical = IDENTITY_PHYSICAL;
          state.identityReconstruction.physicalValid = true;
          state.subtasks.physicalIdentitiesSubmitted = true;
          addObservation(state, actor, 'physical-identities-verified', 'Physical identity links reconstructed', 'Experiment chamber — Future', 'The three traces distinguish the memory source, the researcher’s transmission signature, and the autonomous presence.', true);
          message = state.identityReconstruction.historicalValid ? 'Physical identity links verified. The historical record completes the reconstruction.' : 'Physical identity links verified. Waiting for the Archivist’s historical reconstruction.';
        }
        if (state.identityReconstruction.historicalValid && state.identityReconstruction.physicalValid && !state.subtasks.threeIdentitiesComplete) {
          state.subtasks.threeIdentitiesComplete = true;
          award(state, 'identities', 150);
          addObservation(state, 'team', 'three-identities-reconstructed', 'The Three Identities', 'Shared memory board', 'Mara Voss was the memory source; Dr. S. Vale conducted the transmission; Subject Zero became an autonomous identity within the reconstructed memory. The false passage now resolves into a real manifestation.', true);
          message = 'Both identity reconstructions agree. The Three Identities complete · +150 points. The False Manifestation is unlocked.';
        }
        break;
      case 'manifestation-history':
        if (state.currentChallenge !== 1 || !state.subtasks.threeIdentitiesComplete || state.subtasks.falseManifestationComplete || actor !== 'archivist' || !state.subtasks.manifestationRecordsInspected || !Array.isArray(value.order)) { actionAccepted = false; message = 'Only the Archivist can classify the historical records after examining them.'; }
        else if (state.falseManifestation.historicalValid) { actionAccepted = false; message = 'The historical classification is already verified.'; }
        else if (JSON.stringify(value.order) !== JSON.stringify(MANIFESTATION_HISTORY)) {
          state.falseManifestation.historicalClassification = value.order.filter((item): item is string => typeof item === 'string');
          state.falseManifestation.historicalValid = false;
          penalize(state, 25);
          message = 'The historical classification conflicts with the seals, signatures or recorded dates. Review the Past file.';
        } else {
          state.falseManifestation.historicalClassification = MANIFESTATION_HISTORY;
          state.falseManifestation.historicalValid = true;
          state.subtasks.historicalManifestationsSubmitted = true;
          addObservation(state, actor, 'historical-manifestations-classified', 'Historical records classified', 'Security archive — Past', 'One record is authenticated, one altered after sealing, and one impossible against the facility chronology.', true);
          message = state.falseManifestation.physicalValid ? 'Historical classifications verified. The Tracker’s evidence completes the joint review.' : 'Historical classifications verified. Waiting for the Tracker’s Future classification.';
        }
        break;
      case 'manifestation-physical':
        if (state.currentChallenge !== 1 || !state.subtasks.threeIdentitiesComplete || state.subtasks.falseManifestationComplete || actor !== 'tracker' || state.inspectedFalseManifestations.length !== 3 || !Array.isArray(value.order)) { actionAccepted = false; message = 'Only the Tracker can classify the Future manifestations after examining all three traces.'; }
        else if (state.falseManifestation.physicalValid) { actionAccepted = false; message = 'The Future classification is already verified.'; }
        else if (JSON.stringify(value.order) !== JSON.stringify(MANIFESTATION_PHYSICAL)) {
          state.falseManifestation.physicalClassification = value.order.filter((item): item is string => typeof item === 'string');
          state.falseManifestation.physicalValid = false;
          penalize(state, 25);
          message = 'The trace classification is inconsistent with the physical evidence. Re-examine the light, glass shards and blocked wall.';
        } else {
          state.falseManifestation.physicalClassification = MANIFESTATION_PHYSICAL;
          state.falseManifestation.physicalValid = true;
          state.subtasks.physicalManifestationsSubmitted = true;
          addObservation(state, actor, 'physical-manifestations-classified', 'Future manifestations classified', 'Experiment chamber — Future', 'The reversed reflection is genuine; the blocked-light shadow and impossible footprints are fabricated traces.', true);
          message = state.falseManifestation.historicalValid ? 'Future classifications verified. The historical archive completes the joint review.' : 'Future classifications verified. Waiting for the Archivist’s historical classification.';
        }
        if (state.falseManifestation.historicalValid && state.falseManifestation.physicalValid && !state.subtasks.falseManifestationComplete) {
          state.subtasks.falseManifestationComplete = true;
          award(state, 'falseManifestation', 150);
          addObservation(state, 'team', 'false-manifestation-resolved', 'The False Manifestation', 'Shared memory board', 'The sealed reflection record agrees with the persistent reversed reflection. The later shadow report and impossible corridor report are fabrications.', true);
          message = 'Both classifications agree with the evidence. The False Manifestation is resolved · +150 points. The Memory Fragments are unlocked.';
        }
        break;
      case 'door':
        actionAccepted = false;
        message = 'Door selection is not part of the active Hunt II investigation.';
        break;
      case 'characteristic':
        actionAccepted = false; message = 'The completed False Manifestation investigation does not accept further submissions.';
        break;
      case 'manifestation':
        actionAccepted = false; message = 'The completed False Manifestation investigation does not accept further submissions.';
        break;
      case 'memory-historical': {
        const order = value.order;
        if (state.currentChallenge !== 2 || state.subtasks.memoryFragmentsComplete || actor !== 'archivist' || state.memoryFragments.archivistEvidence.length !== 3 || state.memoryFragments.trackerEvidence.length !== 3 || !Array.isArray(order)) { actionAccepted = false; message = 'The Archivist can submit after both roles discover all three memory fragments.'; }
        else if (state.memoryFragments.historicalValid) { actionAccepted = false; message = 'Your historical sequence is already verified.'; }
        else if (JSON.stringify(order) !== JSON.stringify(MEMORY_ORDER)) { state.memoryFragments.historical = order.filter((item): item is string => typeof item === 'string'); penalize(state, 25); message = 'The archive order conflicts with the corrected clock and physical traces. Reconcile the entry, resonance, cutoff, answer, and failure.'; }
        else { state.memoryFragments.historical = MEMORY_ORDER; state.memoryFragments.historicalValid = true; state.subtasks.memoryHistoricalSubmitted = true; message = 'Historical interpretation verified. Waiting for the Tracker’s physical sequence.'; }
        break;
      }
      case 'memory-physical': {
        const order = value.order;
        if (state.currentChallenge !== 2 || state.subtasks.memoryFragmentsComplete || actor !== 'tracker' || state.memoryFragments.trackerEvidence.length !== 3 || state.memoryFragments.archivistEvidence.length !== 3 || !Array.isArray(order)) { actionAccepted = false; message = 'The Tracker can submit after both roles discover all three memory fragments.'; }
        else if (state.memoryFragments.physicalValid) { actionAccepted = false; message = 'Your physical sequence is already verified.'; }
        else if (JSON.stringify(order) !== JSON.stringify(MEMORY_ORDER)) { state.memoryFragments.physical = order.filter((item): item is string => typeof item === 'string'); penalize(state, 25); message = 'The physical traces contradict that sequence. Compare the answering echo with the reel and threshold mark.'; }
        else { state.memoryFragments.physical = MEMORY_ORDER; state.memoryFragments.physicalValid = true; state.subtasks.memoryPhysicalSubmitted = true; message = 'Physical sequence verified. Waiting for the Archivist’s historical interpretation.'; }
        if (state.memoryFragments.historicalValid && state.memoryFragments.physicalValid && !state.subtasks.memoryFragmentsComplete) { state.subtasks.memoryFragmentsComplete = true; award(state, 'memoryFragments', 200); addObservation(state, 'team', 'memory-fragments-reconstructed', 'The Memory Fragments', 'Shared memory board', 'Both timelines establish: the subject arrived, resonance began, the observer reached cutoff, an echo answered, and containment failed.', true); message = 'Both reconstructions align · +200 points. The Hidden Weakness is unlocked.'; }
        break;
      }
      case 'weakness-history':
        if (state.currentChallenge !== 2 || !state.subtasks.memoryFragmentsComplete || state.subtasks.hiddenWeaknessComplete || actor !== 'archivist' || !state.hiddenWeakness.archiveEvidence.includes('baseline') || !state.hiddenWeakness.archiveEvidence.includes('contradictions')) { actionAccepted = false; message = 'The Archivist must review the baseline and two contradictory reports after the Tracker has run at least two trials.'; }
        else if (state.hiddenWeakness.historicalValid) { actionAccepted = false; message = 'The historical interpretation is already verified.'; }
        else if (normalize(value.conclusion) !== 'bright and warm') { state.hiddenWeakness.historicalConclusion = String(value.conclusion ?? ''); penalize(state, 25); message = 'That interpretation is not supported by the archive controls. Compare the failed bright and warm reports against their fault notes.'; }
        else { state.hiddenWeakness.historicalConclusion = 'bright and warm'; state.hiddenWeakness.historicalValid = true; state.subtasks.weaknessHistoricalSubmitted = true; state.hiddenWeakness.archiveEvidence = [...new Set([...state.hiddenWeakness.archiveEvidence, 'contradictions'])]; addObservation(state, actor, 'weakness-archive-interpretation', 'Contradictions isolated', 'Containment laboratory — Past', 'The bright and warm conclusions are unreliable because their control readings failed.', true); message = 'The misleading historical conclusions are discounted. Waiting for the Tracker’s controlled trials.'; }
        break;
      case 'weakness-experiment': {
        if (state.currentChallenge !== 2 || !state.subtasks.memoryFragmentsComplete || state.subtasks.hiddenWeaknessComplete || actor !== 'tracker') { actionAccepted = false; message = 'Only the Tracker can run experiments during The Hidden Weakness.'; break; }
        const variable = String(value.variable ?? ''); const setting = String(value.setting ?? '');
        const allowed: Record<string, string[]> = { frequency: ['low', 'high'], light: ['dark', 'bright'], temperature: ['cold', 'warm'] };
        if (state.hiddenWeakness.stationReady !== variable) { actionAccepted = false; message = 'Inspect the matching physical station before running this trial.'; }
        else if (!allowed[variable]?.includes(setting)) { actionAccepted = false; message = 'Select a valid untested station condition.'; }
        else if (state.hiddenWeakness.experiments.some((entry) => entry.variable === variable && entry.setting === setting)) { actionAccepted = false; message = 'That controlled condition has already been recorded; no resource was spent.'; }
        else if (state.hiddenWeakness.resourcesRemaining <= 0) { actionAccepted = false; message = 'No experiment charges remain.'; }
        else {
          const effective = (WEAKNESS_PROFILE as Record<string, string>)[variable] === setting;
          const result = effective ? 'The readings stabilize and the entity withdraws from the field.' : 'The field surges; the entity presses closer to the containment boundary.';
          state.hiddenWeakness.experiments.push({ variable, setting, result }); state.hiddenWeakness.resourcesRemaining -= 1; state.hiddenWeakness.stationReady = null;
          if (!effective) { state.hiddenWeakness.instability += 1; state.entityState.falseCorridorUntil = Date.now() + 1_800; }
          addObservation(state, actor, `weakness-experiment-${variable}-${setting}`, `${variable} trial: ${setting}`, 'Containment laboratory — Future', result, effective);
          message = `${result} ${state.hiddenWeakness.resourcesRemaining} charges remain.`;
          if (state.hiddenWeakness.experiments.length >= 4) inputNeeded = 'weakness-conclusion';
        }
        break;
      }
      case 'weakness-conclusion':
        if (state.currentChallenge !== 2 || !state.subtasks.memoryFragmentsComplete || state.subtasks.hiddenWeaknessComplete || actor !== 'tracker' || state.hiddenWeakness.experiments.length < 4) { actionAccepted = false; message = 'Complete at least four controlled trials before submitting the observed profile.'; }
        else if (state.hiddenWeakness.experimentalValid) { actionAccepted = false; message = 'The experimental conclusion is already verified.'; }
        else {
          const profile = value.profile && typeof value.profile === 'object' ? value.profile as Record<string, unknown> : {};
          const correct = Object.entries(WEAKNESS_PROFILE).every(([key, expected]) => profile[key] === expected) && Object.entries(WEAKNESS_PROFILE).every(([variable, setting]) => state.hiddenWeakness.experiments.some((entry) => entry.variable === variable && entry.setting === setting));
          state.hiddenWeakness.experimentalConclusion = JSON.stringify(profile);
          if (!correct) { penalize(state, 25); message = 'The live response pattern does not support that combined profile. Test the conditions and cross-reference the historical fault notes.'; }
          else { state.hiddenWeakness.experimentalValid = true; state.subtasks.weaknessExperimentalSubmitted = true; message = state.hiddenWeakness.historicalValid ? 'Experimental profile verified. Both records support containment.' : 'Experimental profile verified. Waiting for the Archivist’s historical interpretation.'; }
        }
        break;
      case 'broken-historical': {
        const order = value.order;
        if (state.currentChallenge !== 3 || state.subtasks.brokenMemoryComplete || actor !== 'archivist' || state.brokenMemory.archivistEvidence.length !== 3 || state.brokenMemory.trackerEvidence.length !== 3 || !Array.isArray(order)) { actionAccepted = false; message = 'The Archivist can submit after all Past and Future components have been discovered.'; }
        else if (state.brokenMemory.historicalValid) { actionAccepted = false; message = 'The historical relationships are already verified.'; }
        else if (JSON.stringify(order) !== JSON.stringify(BROKEN_HISTORICAL)) { state.brokenMemory.historical = order.filter((entry): entry is string => typeof entry === 'string'); state.brokenMemory.corruption += 1; penalize(state, 25); message = 'That relationship conflicts with the surviving archive. Recheck the photograph, duplicated ledger and fragmented recording without assuming every caption is original.'; }
        else { state.brokenMemory.historical = BROKEN_HISTORICAL; state.brokenMemory.historicalValid = true; state.subtasks.brokenHistoricalSubmitted = true; message = 'Historical relationships verified. Waiting for the Tracker’s Future placement structure.'; }
        break;
      }
      case 'broken-structure': {
        const order = value.order;
        if (state.currentChallenge !== 3 || state.subtasks.brokenMemoryComplete || actor !== 'tracker' || state.brokenMemory.trackerEvidence.length !== 3 || state.brokenMemory.archivistEvidence.length !== 3 || !Array.isArray(order)) { actionAccepted = false; message = 'The Tracker can submit after all Past and Future components have been discovered.'; }
        else if (state.brokenMemory.structureValid) { actionAccepted = false; message = 'The Future placement structure is already verified.'; }
        else if (JSON.stringify(order) !== JSON.stringify(BROKEN_STRUCTURE) || new Set(order).size !== 6) { state.brokenMemory.structure = order.filter((entry): entry is string => typeof entry === 'string'); state.brokenMemory.corruption += 1; state.entityState.falseCorridorUntil = Date.now() + 1_800; penalize(state, 25); message = 'The chamber rejects one or more connections. Check the duplicated symbol, displaced portrait and central keepsake links; only affected projections reset.'; }
        else { state.brokenMemory.structure = BROKEN_STRUCTURE; state.brokenMemory.structureValid = true; state.subtasks.brokenStructureSubmitted = true; message = 'Future placements verified. The Archivist must also confirm the historical relationships before synchronization.'; }
        break;
      }
      case 'arrangement': {
        actionAccepted = false; message = 'The former four-object layout is not accepted for Broken Memory. Use the six-component restoration board.';
        break;
      }
      case 'anchor-history-config': {
        const configuration = value.order;
        if (state.currentChallenge !== 4 || actor !== 'archivist' || !Array.isArray(configuration) || !state.memoryAnchor.archivistEvidence.includes('diagram') || !state.memoryAnchor.archivistEvidence.includes('flow') || state.memoryAnchor.trackerEvidence.length !== 4) { actionAccepted = false; message = 'The Archivist must examine both Past records and wait for all four Future node readings.'; }
        else if (state.memoryAnchor.historicalValid) { actionAccepted = false; message = 'Historical anchor alignment is already confirmed.'; }
        else if (JSON.stringify(configuration) !== JSON.stringify(ANCHOR_HISTORICAL)) { state.memoryAnchor.historicalConfiguration = configuration.filter((entry): entry is string => typeof entry === 'string'); message = anchorConfigurationFailure(state, 'The historical circuit does not match the flow diagram. Recheck the return, ground and final loop relationships.'); }
        else { state.memoryAnchor.historicalConfiguration = ANCHOR_HISTORICAL; state.memoryAnchor.historicalValid = true; state.subtasks.anchorArchivistConfigured = true; message = 'Past alignment verified. The Tracker’s physical configuration is still required.'; }
        break;
      }
      case 'anchor-physical-config': {
        const configuration = value.order;
        if (state.currentChallenge !== 4 || actor !== 'tracker' || !Array.isArray(configuration) || state.memoryAnchor.trackerEvidence.length !== 4 || !state.memoryAnchor.archivistEvidence.includes('diagram') || !state.memoryAnchor.archivistEvidence.includes('flow')) { actionAccepted = false; message = 'The Tracker must map all four Future nodes and wait for both Past records.'; }
        else if (state.memoryAnchor.physicalValid) { actionAccepted = false; message = 'Future node configuration is already confirmed.'; }
        else if (JSON.stringify(configuration) !== JSON.stringify(ANCHOR_PHYSICAL) || Object.entries(ANCHOR_NODE_STATES).some(([node, condition]) => state.memoryAnchor.nodeStates[node as keyof typeof ANCHOR_NODE_STATES] !== condition)) { state.memoryAnchor.physicalConfiguration = configuration.filter((entry): entry is string => typeof entry === 'string'); message = anchorConfigurationFailure(state, 'The physical settings conflict with the live node readings. A reversed current and disconnected ground remain unstable.'); }
        else { state.memoryAnchor.physicalConfiguration = ANCHOR_PHYSICAL; state.memoryAnchor.physicalValid = true; state.subtasks.anchorTrackerConfigured = true; message = 'Future node settings verified. The Archivist must initiate synchronization.'; }
        break;
      }
      case 'anchor-pattern':
      case 'anchor':
        actionAccepted = false; message = 'The former single-pattern anchor quiz is replaced by the cooperative four-node stabilization system.';
        break;
      case 'final-sequence': {
        const expected = ['arrival', 'alarm', 'containment-failure'];
        if (state.currentChallenge !== 5 || actor !== 'archivist' || !state.subtasks.finalMemoryViewed || !Array.isArray(value.order)) message = 'Inspect the original final memory first.';
        else if (JSON.stringify(value.order) !== JSON.stringify(expected)) { penalize(state, 25); message = 'The sequence does not match the recorded event. The memory remains stable; review and retry.'; }
        else {
          state.finalSequence = expected;
          state.subtasks.finalSequenceValidated = true;
          addObservation(state, actor, 'final-sequence-verified', 'Original event sequence restored', 'Observation chamber — Past', 'Arrival → warning alarm → containment failure.', true);
          message = 'Sequence validated. Maintain the projection while the Tracker operates the mechanisms.';
        }
        break;
      }
      default:
        message = 'That submission is not valid for the current Hunt 2 challenge.';
    }
  } else return null;

  if (state.currentChallenge === 4 && state.memoryAnchor.historicalValid && state.memoryAnchor.physicalValid && !state.subtasks.anchorConfigurationComplete) {
    state.subtasks.anchorConfigurationComplete = true;
    message = 'Both anchor configurations are validated. The Archivist must now start synchronization.';
  }
  maybeAdvance(state);
  state.updatedAt = nowIso();
  db.prepare('UPDATE round3_hunt2_sessions SET state_json = ?, updated_at = ? WHERE team_id = ?').run(JSON.stringify(state), state.updatedAt, teamId);
  return { success: actionAccepted && state.penalties === penaltiesBefore, message, state, input: inputNeeded, hint };
}
