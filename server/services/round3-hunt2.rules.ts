import type { Hunt2ActionResult, Hunt2Actor, Hunt2Challenge, Hunt2Input, Hunt2State, Hunt2Observation } from '../../src/types/hunt2.types.ts';

const HINTS: Record<Hunt2Challenge, readonly [string, string]> = {
  2: ['Compare the controlled Future trials with the failed bright and warm readings in the Past archive.', 'The conditions that stabilize the field are low resonance, darkness, and cold.'],
  3: ['Cross-check apparently authentic records against displaced Future traces before submitting the relationships.', 'The repeated symbol is a substituted caption; match the keepsake to its pre-test position, not the duplicated ledger.'],
  4: ['The flow record becomes readable only after the Tracker has mapped the north and west nodes.', 'Compare the reversed and disconnected Future readings with the east-feed, west-return, ground, and final-loop design.'],
  5: ['Reconstruct the event order before touching the containment mechanisms.', 'Use the verified event order to reason through the three mechanism labels before readying both investigators.'],
};
const isActor = (value: unknown): value is Hunt2Actor => value === 'archivist' || value === 'tracker';
const normalize = (value: unknown): string => typeof value === 'string' ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() : '';
const nowIso = (): string => new Date().toISOString();
const freshBreakdown = () => ({ hiddenWeakness: 0, brokenMemory: 0, anchor: 0, final: 0, optional: 0, penalties: 0 });
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

export function createFreshRound3Hunt2State(teamId: string): Hunt2State {
  return {
    teamId, currentChallenge: 2, completed: false, subtasks: {}, objectStates: {}, observations: [], hintUses: {},
    score: 0, penalties: 0, scoreBreakdown: freshBreakdown(),
    hiddenWeakness: { archiveEvidence: [], experiments: [], resourcesRemaining: 5, instability: 0, stationReady: null, historicalConclusion: null, historicalValid: false, experimentalConclusion: null, experimentalValid: false, trackerActivatedAt: null, syncDeadline: null },
    brokenMemory: { archivistEvidence: [], trackerEvidence: [], historical: null, historicalValid: false, structure: null, structureValid: false, archivistSyncAt: null, syncDeadline: null, corruption: 0 },
    memoryAnchor: freshAnchor(),
    finalSequence: [], mechanismsActivated: [], projectorMaintained: false,
    readyBy: {}, activatedBy: {}, syncDeadline: null,
    entityState: { falseCorridorUntil: null, trueAnchorHiddenUntil: null, memoryStable: false, deceptionSuppressed: false },
    updatedAt: nowIso(),
  };
}

export function normalizeRound3Hunt2State(input: unknown, teamId: string): Hunt2State | null {
  if (!input || typeof input !== 'object' || Array.isArray(input) || (input as { teamId?: unknown }).teamId !== teamId) return null;
  const state = structuredClone(input) as Hunt2State & {
    identityReconstruction?: unknown;
    inspectedIdentityTraces?: unknown;
    falseManifestation?: unknown;
    inspectedFalseManifestations?: unknown;
    memoryFragments?: unknown;
    scoreBreakdown: Hunt2State['scoreBreakdown'] & {
      identities?: number;
      falseManifestation?: number;
      exit?: number;
      identity?: number;
      memoryFragments?: number;
    };
    entityState: Hunt2State['entityState'] & { decoyHiddenUntil?: number | null };
  };
  const legacyTaskState = 'identityReconstruction' in state || 'falseManifestation' in state || 'memoryFragments' in state ||
    'identities' in state.scoreBreakdown || 'falseManifestation' in state.scoreBreakdown || 'memoryFragments' in state.scoreBreakdown;
  if (legacyTaskState) {
    const storedChallenge = state.currentChallenge as number;
    state.currentChallenge = (storedChallenge <= 3 ? 2 : Math.min(5, storedChallenge - 2)) as Hunt2Challenge;
  }
  if ((state.currentChallenge as number) === 1) state.currentChallenge = 2;
  delete state.identityReconstruction;
  delete state.inspectedIdentityTraces;
  delete state.falseManifestation;
  delete state.inspectedFalseManifestations;
  delete state.memoryFragments;
  for (const key of ['threeIdentitiesComplete', 'falseManifestationComplete', 'memoryFragmentsComplete', 'genuineExitOpened']) {
    delete state.subtasks[key];
  }
  for (const key of ['identityPatientFile', 'identityTraceA', 'identityTraceB', 'identityTraceC', 'manifestationRecords', 'manifestationA', 'manifestationB', 'manifestationC', 'memoryDiary', 'memoryPhotograph', 'memoryIncidentReport', 'memoryEcho', 'memoryReel', 'memoryResidualMark', 'falseDoor1', 'falseDoor2', 'falseDoor3', 'falseDoor4', 'identityMemory', 'layoutMemory', 'layoutChair', 'layoutMirror', 'layoutTable', 'layoutLamp', 'memoryDoorRoom']) {
    delete state.objectStates[key];
  }
  delete state.scoreBreakdown.identities;
  delete state.scoreBreakdown.falseManifestation;
  delete state.scoreBreakdown.exit;
  delete state.scoreBreakdown.identity;
  delete state.scoreBreakdown.memoryFragments;
  delete state.entityState.decoyHiddenUntil;
  state.hiddenWeakness ??= { archiveEvidence: [], experiments: [], resourcesRemaining: 5, instability: 0, stationReady: null, historicalConclusion: null, historicalValid: false, experimentalConclusion: null, experimentalValid: false, trackerActivatedAt: null, syncDeadline: null };
  state.hiddenWeakness.archiveEvidence ??= []; state.hiddenWeakness.experiments ??= []; state.hiddenWeakness.resourcesRemaining ??= 5; state.hiddenWeakness.instability ??= 0; state.hiddenWeakness.stationReady ??= null;
  state.brokenMemory ??= { archivistEvidence: [], trackerEvidence: [], historical: null, historicalValid: false, structure: null, structureValid: false, archivistSyncAt: null, syncDeadline: null, corruption: 0 };
  state.brokenMemory.archivistEvidence ??= []; state.brokenMemory.trackerEvidence ??= []; state.brokenMemory.corruption ??= 0;
  state.memoryAnchor ??= freshAnchor();
  state.memoryAnchor.archivistEvidence ??= []; state.memoryAnchor.trackerEvidence ??= []; state.memoryAnchor.nodeStates ??= { A: 'unknown', B: 'unknown', C: 'unknown', D: 'unknown' }; state.memoryAnchor.attemptsRemaining ??= 3; state.memoryAnchor.instability ??= 0; state.memoryAnchor.finalSequenceIndex ??= 0;
  state.scoreBreakdown.hiddenWeakness ??= 0; state.scoreBreakdown.brokenMemory ??= 0;
  return state;
}

function award(state: Hunt2State, category: Exclude<keyof Hunt2State['scoreBreakdown'], 'penalties'>, points: number): void {
  const caps = { hiddenWeakness: 200, brokenMemory: 300, anchor: 200, final: 150, optional: 100 };
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
  addObservation(state, 'team', `task-${state.currentChallenge - 1}-unlocked`, `Task ${state.currentChallenge - 1} unlocked`, 'Shared memory board', message, true);
}

function maybeAdvance(state: Hunt2State): void {
  if (state.currentChallenge === 2 && state.subtasks.hiddenWeaknessComplete) advance(state, 2, 'The weakness is contained. Reconstruct the original relationships from the damaged archive and Future chambers.');
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
  const hiddenWeakness = { ...state.hiddenWeakness };
  const brokenMemory = { ...state.brokenMemory };
  const memoryAnchor = { ...state.memoryAnchor };
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
  const removedTaskObservation = (id: string) => id.startsWith('identity-') || id.startsWith('physical-identityTrace') ||
    id.startsWith('manifestation-') || id.startsWith('physical-manifestation') || id.startsWith('false-manifestation') ||
    id.startsWith('memory-archivist-') || id.startsWith('memory-tracker-') || id === 'three-identities-reconstructed' ||
    id === 'false-manifestation-resolved' || id === 'memory-fragments-reconstructed';
  const observations = state.observations.filter((entry) => !removedTaskObservation(entry.id));
  const subtasks = { ...state.subtasks };
  if (!state.subtasks.hiddenWeaknessComplete) {
    if (actor === 'archivist') subtasks.weaknessExperimentalSubmitted = false;
    else subtasks.weaknessHistoricalSubmitted = false;
  }
  if (!state.subtasks.brokenMemoryComplete) subtasks[actor === 'archivist' ? 'brokenStructureSubmitted' : 'brokenHistoricalSubmitted'] = false;
  if (!state.subtasks.memoryAnchorComplete) subtasks[actor === 'archivist' ? 'anchorTrackerConfigured' : 'anchorArchivistConfigured'] = false;
  if (!state.subtasks.memoryAnchorComplete) subtasks.anchorConfigurationComplete = false;
  const privateObservations = observations.filter((entry) => state.subtasks.brokenMemoryComplete || !entry.id.startsWith(actor === 'archivist' ? 'broken-tracker-' : 'broken-archivist-'))
    .filter((entry) => state.subtasks.memoryAnchorComplete || !entry.id.startsWith(actor === 'archivist' ? 'anchor-tracker-' : 'anchor-archivist-'));
  return { ...state, subtasks, observations: privateObservations, hiddenWeakness, brokenMemory, memoryAnchor };
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
  maybeAdvance(state);
  return state.completed ? 'The genuine anchor is destroyed.' : 'Final control engaged. Waiting for the other investigator.';
}

export interface Hunt2Evaluation extends Hunt2ActionResult { scoreDelta: number }

export function applyRound3Hunt2ActionToState(state: Hunt2State, input: { type: string; actor?: unknown; objectId?: unknown; value?: unknown }): Hunt2Evaluation | null {
  if (!isActor(input.actor) || state.completed) return null;
  const scoreBefore = state.score;
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
      hint = HINTS[state.currentChallenge][count];
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
    } else if (state.currentChallenge === 2 && !state.subtasks.hiddenWeaknessComplete && actor === 'archivist' && objectId === 'weaknessArchive') {
      const entries: Record<string, string> = {
        'weakness-archive-baseline': 'Baseline memo: the entity’s response was recorded after a calibrated resonance pass.',
        'weakness-archive-bright': 'Investigator claim: bright exposure “dissolved” the presence; the attached control reading shows the lamp was disconnected.',
        'weakness-archive-warm': 'Investigator claim: warmth weakened the entity; the log was written during a temperature sensor fault.',
      };
      if (!state.hiddenWeakness.archiveEvidence.includes('baseline')) state.hiddenWeakness.archiveEvidence.push('baseline');
      if (state.hiddenWeakness.experiments.length >= 2 && !state.hiddenWeakness.archiveEvidence.includes('contradictions')) state.hiddenWeakness.archiveEvidence.push('contradictions');
      state.objectStates.weaknessArchive = 'inspected';
      addObservation(state, actor, 'weakness-archive-baseline', 'Containment archive', 'Containment laboratory — Past', entries['weakness-archive-baseline']);
      if (state.hiddenWeakness.archiveEvidence.includes('contradictions')) {
        addObservation(state, actor, 'weakness-archive-contradictions', 'Two failed conclusions', 'Containment laboratory — Past', `${entries['weakness-archive-bright']} ${entries['weakness-archive-warm']}`);
        inputNeeded = 'weakness-history';
        message = 'The failed bright and warm reports are now available. Submit “bright and warm” to reject both conclusions.';
      } else {
        message = 'Baseline memo recorded. Wait until the Tracker completes at least two controlled trials, then inspect this archive again to reveal the failed bright and warm reports.';
      }
    } else if (state.currentChallenge === 2 && ['weaknessFrequencyStation', 'weaknessLightStation', 'weaknessTemperatureStation', 'weaknessContainmentConsole'].includes(objectId) && actor !== 'tracker') {
      actionAccepted = false; message = 'Only the Tracker can operate Future laboratory equipment.';
    } else if (state.currentChallenge === 2 && objectId === 'weaknessCalibrationConsole' && actor !== 'archivist') {
      actionAccepted = false; message = 'Only the Archivist can operate the historical calibration console.';
    } else if (state.currentChallenge === 2 && objectId === 'weaknessArchive' && actor !== 'archivist') {
      actionAccepted = false; message = 'Only the Archivist can examine the historical experiment archive.';
    } else if (state.currentChallenge === 2 && !state.subtasks.hiddenWeaknessComplete && actor === 'tracker' && ['weaknessFrequencyStation', 'weaknessLightStation', 'weaknessTemperatureStation'].includes(objectId)) {
      const variable = objectId === 'weaknessFrequencyStation' ? 'frequency' : objectId === 'weaknessLightStation' ? 'light' : 'temperature';
      const tested = state.hiddenWeakness.experiments.filter((entry) => entry.variable === variable).length;
      if (state.hiddenWeakness.experiments.length >= 4) { inputNeeded = 'weakness-conclusion'; message = 'Controlled trials are complete. Submit the observed frequency, light and temperature profile.'; }
      else if (tested >= 2) { actionAccepted = false; message = 'Both controlled conditions at this station are already recorded.'; }
      else { state.hiddenWeakness.stationReady = variable; inputNeeded = variable === 'frequency' ? 'weakness-frequency' : variable === 'light' ? 'weakness-light' : 'weakness-temperature'; message = `Choose an untested ${variable} condition. ${state.hiddenWeakness.resourcesRemaining} experiment charges remain.`; }
    } else if (state.currentChallenge === 2 && !state.subtasks.hiddenWeaknessComplete && actor === 'tracker' && objectId === 'weaknessContainmentConsole') {
      if (!state.hiddenWeakness.historicalValid || !state.hiddenWeakness.experimentalValid) {
        if (!state.hiddenWeakness.experimentalValid && state.hiddenWeakness.experiments.length >= 4) inputNeeded = 'weakness-conclusion';
        const missing = [!state.hiddenWeakness.historicalValid ? 'Archivist: submit the Past report interpretation.' : '', !state.hiddenWeakness.experimentalValid ? 'Tracker: submit the controlled-trial profile.' : ''].filter(Boolean).join(' ');
        message = `Containment is not ready. ${missing}`;
      }
      else if (state.hiddenWeakness.trackerActivatedAt && state.hiddenWeakness.syncDeadline && Date.now() <= state.hiddenWeakness.syncDeadline) { message = 'Containment is already armed. The Archivist must calibrate it now.'; }
      else {
        state.hiddenWeakness.trackerActivatedAt = Date.now(); state.hiddenWeakness.syncDeadline = Date.now() + 10_000;
        message = 'Containment armed. Archivist: calibrate the historical sequence within 10 seconds.';
      }
    } else if (state.currentChallenge === 2 && !state.subtasks.hiddenWeaknessComplete && actor === 'archivist' && objectId === 'weaknessCalibrationConsole') {
      if (!state.hiddenWeakness.trackerActivatedAt || !state.hiddenWeakness.syncDeadline) {
        message = state.hiddenWeakness.historicalValid && state.hiddenWeakness.experimentalValid
          ? 'Both profiles are verified. Tracker: arm the Future containment console, then return here within 10 seconds.'
          : 'This Past console is locked. Both vulnerability profiles must be verified before the Tracker can arm containment.';
        if (!state.hiddenWeakness.historicalValid && state.hiddenWeakness.archiveEvidence.includes('contradictions')) inputNeeded = 'weakness-history';
      }
      else if (Date.now() > state.hiddenWeakness.syncDeadline) { penalize(state, 50); state.hiddenWeakness.trackerActivatedAt = null; state.hiddenWeakness.syncDeadline = null; message = 'Calibration window expired. The entity destabilizes; reconfirm the evidence and arm containment again.'; }
      else if (!state.hiddenWeakness.historicalValid || !state.hiddenWeakness.experimentalValid) { actionAccepted = false; message = 'Both conclusions must be verified before calibration.'; }
      else {
        state.subtasks.hiddenWeaknessComplete = true; state.objectStates.weaknessContainmentConsole = 'activated'; state.objectStates.weaknessCalibrationConsole = 'activated';
        award(state, 'hiddenWeakness', 200); addObservation(state, 'team', 'hidden-weakness-contained', 'The Hidden Weakness', 'Containment laboratory', 'The paired resonance, darkness, and cold conditions collapse the entity’s unstable memory shell.', true);
        message = 'The entity is contained · +200 points. The Broken Memory is unlocked.'; maybeAdvance(state);
      }
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
    } else { actionAccepted = false; message = `That object is not available for the active Hunt 2 task (${state.currentChallenge - 1}/4).`; }
  } else if (input.type === 'submit') {
    switch (value.kind) {
      case 'weakness-history':
        if (state.currentChallenge !== 2 || state.subtasks.hiddenWeaknessComplete || actor !== 'archivist' || !state.hiddenWeakness.archiveEvidence.includes('baseline') || !state.hiddenWeakness.archiveEvidence.includes('contradictions')) { actionAccepted = false; message = 'The Archivist must review the baseline and two contradictory reports after the Tracker has run at least two trials.'; }
        else if (state.hiddenWeakness.historicalValid) { actionAccepted = false; message = 'The historical interpretation is already verified.'; }
        else if (normalize(value.conclusion) !== 'bright and warm') { state.hiddenWeakness.historicalConclusion = String(value.conclusion ?? ''); penalize(state, 25); message = 'That interpretation is not supported by the archive controls. Compare the failed bright and warm reports against their fault notes.'; }
        else { state.hiddenWeakness.historicalConclusion = 'bright and warm'; state.hiddenWeakness.historicalValid = true; state.subtasks.weaknessHistoricalSubmitted = true; state.hiddenWeakness.archiveEvidence = [...new Set([...state.hiddenWeakness.archiveEvidence, 'contradictions'])]; addObservation(state, actor, 'weakness-archive-interpretation', 'Contradictions isolated', 'Containment laboratory — Past', 'The bright and warm conclusions are unreliable because their control readings failed.', true); message = 'The misleading historical conclusions are discounted. Waiting for the Tracker’s controlled trials.'; }
        break;
      case 'weakness-experiment': {
        if (state.currentChallenge !== 2 || state.subtasks.hiddenWeaknessComplete || actor !== 'tracker') { actionAccepted = false; message = 'Only the Tracker can run experiments during The Hidden Weakness.'; break; }
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
        if (state.currentChallenge !== 2 || state.subtasks.hiddenWeaknessComplete || actor !== 'tracker' || state.hiddenWeakness.experiments.length < 4) { actionAccepted = false; message = 'Complete at least four controlled trials before submitting the observed profile.'; }
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
        actionAccepted = false;
        message = 'That submission is not valid for the current Hunt 2 challenge.';
    }
  } else return null;

  if (state.currentChallenge === 4 && state.memoryAnchor.historicalValid && state.memoryAnchor.physicalValid && !state.subtasks.anchorConfigurationComplete) {
    state.subtasks.anchorConfigurationComplete = true;
    message = 'Both anchor configurations are validated. The Archivist must now start synchronization.';
  }
  maybeAdvance(state);
  state.updatedAt = nowIso();
  return { success: actionAccepted && state.penalties === penaltiesBefore, message, state, input: inputNeeded, hint, scoreDelta: state.score - scoreBefore };
}
