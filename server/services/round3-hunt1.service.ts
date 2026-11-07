import { db } from '../../database/db.ts';
import { round3GameplayAllowed } from './round3.service.ts';
import type { Hunt1ActionResult, Hunt1Actor, Hunt1Evidence, Hunt1State, Hunt1TaskKey, IncidentConclusionPuzzle, MissingReportPuzzle, ObservationTimelinePuzzle, PowerFailurePuzzle, SignalReconstructionPuzzle } from '../../src/types/hunt1.types.ts';

db.exec(`CREATE TABLE IF NOT EXISTS round3_hunt1_sessions (
  team_id TEXT PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`);

const MODEL_VERSION = 2;
const MISSING_REPORT_ANSWER = ['purpose', 'apparatus', 'safeguards', 'result'];
const POWER_FAILURE_ANSWER = ['generator-relay', 'relay-load', 'load-ground', 'ground-frame'];
const OBSERVATION_ANSWER = ['alarm', 'lights-fail', 'subject-appears', 'observer-vanishes'];
const SIGNAL_ANSWER = ['intake', 'ground', 'observer', 'transmit'];
const CONCLUSION_ARCHIVIST_ANSWER = ['temporal-resonance-reconstructs-human-memories', 'resonance-limited-to-recorded-imprints'];
const CONCLUSION_TRACKER_ANSWER = ['omitted-ground-and-relay-bypass-exceeded-limits', 'a-reconstructed-memory-became-conscious-after-transmission', 'that-consciousness-manifested-as-the-entity'];
const TASKS: Record<Hunt1TaskKey, { number: number; title: string; points: number; submitter: Hunt1Actor | 'team'; objects: Record<string, Hunt1Actor>; required: string[]; answer: string[] }> = {
  lastVisitor: { number: 1, title: 'The Last Visitor', points: 100, submitter: 'archivist', objects: { visitorLedger: 'archivist', visitorTracks: 'tracker' }, required: ['visitorLedger', 'visitorTracks'], answer: ['technician', 'director', 'visitor'] },
  missingReport: { number: 2, title: 'The Missing Report', points: 150, submitter: 'team', objects: { archiveIndex: 'archivist', shreddedReport: 'tracker' }, required: ['archiveIndex', 'shreddedReport'], answer: MISSING_REPORT_ANSWER },
  powerFailure: { number: 3, title: 'The Power Failure', points: 200, submitter: 'team', objects: { generatorLog: 'archivist', burntRelay: 'tracker', openGround: 'tracker' }, required: ['generatorLog', 'burntRelay', 'openGround'], answer: POWER_FAILURE_ANSWER },
  observationLog: { number: 4, title: 'The Observation Log', points: 200, submitter: 'team', objects: { observationLog: 'archivist', cameraBuffer: 'tracker' }, required: ['observationLog', 'cameraBuffer'], answer: OBSERVATION_ANSWER },
  signalReconstruction: { number: 5, title: 'The Signal Reconstruction', points: 200, submitter: 'team', objects: { signalChart: 'archivist', cableJunction: 'tracker' }, required: ['signalChart', 'cableJunction'], answer: SIGNAL_ANSWER },
  incidentConclusion: { number: 6, title: 'The Incident Conclusion', points: 150, submitter: 'team', objects: { incidentBoardPast: 'archivist', incidentBoardFuture: 'tracker' }, required: ['incidentBoardPast', 'incidentBoardFuture'], answer: [...CONCLUSION_ARCHIVIST_ANSWER, ...CONCLUSION_TRACKER_ANSWER] },
};
const OPTIONAL_OBJECTS: Record<string, { actor: Hunt1Actor; key: 'researchNote' | 'forgottenRecording'; title: string; content: string }> = {
  optionalResearchNote: { actor: 'archivist', key: 'researchNote', title: 'Hidden Research Note', content: 'A pencilled note behind the archive index warns that the grounding strap was removed before the final subject observation.' },
  optionalForgottenRecording: { actor: 'tracker', key: 'forgottenRecording', title: 'Forgotten Recording', content: 'The damaged channel preserves a quiet warning: “Keep the carrier outside the observer room.” The last tone continues after the camera feed ends.' },
};
const HINTS: Record<number, readonly [string, string]> = {
  1: ['Compare the time order in the Past register with the direction of the Future tracks.', 'Place the three arrivals from earliest to latest.'],
  2: ['The Archivist has the section order; the Tracker has the four torn headings.', 'Rebuild the document from purpose through result.'],
  3: ['Trace current from generator output through control, load, ground, and frame.', 'The grounded return closes the circuit at the generator frame.'],
  4: ['The printed timecodes come from two clocks. Compare their calibration marks against the room’s physical traces.', 'Trust the first alarm note, but use the lamp soot and chair marks to resolve the disputed sequence.'],
  5: ['Use the blueprint legend to distinguish signal path from shielding and bypass marks.', 'The console’s break marks show where the damaged route must be rebuilt.'],
  6: ['Compare the historical experiment mandate with the physical signal aftermath.', 'Each investigator holds different parts of the final explanation.'],
};
const isActor = (value: unknown): value is Hunt1Actor => value === 'archivist' || value === 'tracker';
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const nowIso = () => new Date().toISOString();
const emptyTaskScores = (): Record<Hunt1TaskKey, number> => ({ lastVisitor: 0, missingReport: 0, powerFailure: 0, observationLog: 0, signalReconstruction: 0, incidentConclusion: 0 });
const emptyOptionalScores = (): Hunt1State['optionalScores'] => ({ researchNote: 0, forgottenRecording: 0 });
const emptyMissingReport = (): MissingReportPuzzle => ({ reconstructionVersion: 1, archivistOrder: null, archivistValid: false, trackerOrder: null, trackerValid: false, confirmations: {} });
const emptyPowerFailure = (): PowerFailurePuzzle => ({ archivistConnections: null, archivistValid: false, trackerConnections: null, trackerValid: false });
const emptyObservationTimeline = (): ObservationTimelinePuzzle => ({ archivistTimeline: null, archivistValid: false, trackerTimeline: null, trackerValid: false });
const emptySignalReconstruction = (): SignalReconstructionPuzzle => ({ archivistRoute: null, archivistValid: false, trackerRoute: null, trackerValid: false });
const emptyIncidentConclusion = (): IncidentConclusionPuzzle => ({ archivistInterpretation: null, archivistValid: false, trackerInterpretation: null, trackerValid: false });

function freshState(teamId: string): Hunt1State {
  const state: Hunt1State = {
    modelVersion: MODEL_VERSION, teamId, currentChallenge: 1, completed: false, score: 0, penalties: 0,
    subtasks: {}, taskCompleted: { lastVisitor: false, missingReport: false, powerFailure: false, observationLog: false, signalReconstruction: false, incidentConclusion: false },
    taskScores: emptyTaskScores(), optionalScores: emptyOptionalScores(), objectStates: {}, availableInteractables: [],
    evidence: [], journal: [], failedSubmissions: [], hintUses: {}, missingReport: emptyMissingReport(), powerFailure: emptyPowerFailure(), observationTimeline: emptyObservationTimeline(), signalReconstruction: emptySignalReconstruction(), incidentConclusion: emptyIncidentConclusion(), updatedAt: nowIso(),
  };
  refreshAvailable(state);
  return state;
}

function refreshAvailable(state: Hunt1State): void {
  const task = Object.values(TASKS).find((candidate) => candidate.number === state.currentChallenge);
  state.availableInteractables = [
    ...(task ? Object.keys(task.objects) : []),
    ...Object.keys(OPTIONAL_OBJECTS).filter((id) => state.objectStates[id] !== 'examined'),
  ];
}

function ensureRow(teamId: string): void {
  const now = nowIso();
  db.prepare('INSERT OR IGNORE INTO round3_hunt1_sessions (team_id, state_json, updated_at) VALUES (?, ?, ?)').run(teamId, JSON.stringify(freshState(teamId)), now);
  const row = db.prepare('SELECT state_json FROM round3_hunt1_sessions WHERE team_id=?').get(teamId) as { state_json: string };
  const parsed = JSON.parse(row.state_json) as Partial<Hunt1State>;
  if (parsed.modelVersion !== MODEL_VERSION) {
    // The previous Hunt I was the transmitter shutdown sequence; its state cannot represent these incident tasks.
    const state = freshState(teamId);
    db.prepare('UPDATE round3_hunt1_sessions SET state_json=?, updated_at=? WHERE team_id=?').run(JSON.stringify(state), now, teamId);
  } else if (!parsed.missingReport || !parsed.powerFailure || !parsed.observationTimeline || !parsed.signalReconstruction || !parsed.incidentConclusion) {
    const state = {
      ...parsed,
      missingReport: parsed.missingReport ?? emptyMissingReport(),
      powerFailure: parsed.powerFailure ?? emptyPowerFailure(),
      observationTimeline: parsed.observationTimeline ?? emptyObservationTimeline(),
      signalReconstruction: parsed.signalReconstruction ?? emptySignalReconstruction(),
      incidentConclusion: parsed.incidentConclusion ?? emptyIncidentConclusion(),
    } as Hunt1State;
    db.prepare('UPDATE round3_hunt1_sessions SET state_json=?, updated_at=? WHERE team_id=?').run(JSON.stringify(state), now, teamId);
  }
}

export function ensureRound3Hunt1State(teamId: string, playerNumber?: number): Hunt1State {
  ensureRow(teamId);
  return getRound3Hunt1State(teamId, playerNumber)!;
}

export function getRound3Hunt1State(teamId: string, playerNumber?: number): Hunt1State | null {
  const row = db.prepare('SELECT state_json FROM round3_hunt1_sessions WHERE team_id=?').get(teamId) as { state_json: string } | undefined;
  if (!row) return null;
  const state = JSON.parse(row.state_json) as Hunt1State;
  state.missingReport ??= emptyMissingReport();
  state.powerFailure ??= emptyPowerFailure();
  state.observationTimeline ??= emptyObservationTimeline();
  state.signalReconstruction ??= emptySignalReconstruction();
  state.incidentConclusion ??= emptyIncidentConclusion();
  refreshAvailable(state);
  if (state.currentChallenge === 4) {
    const observationTimeline = { ...state.observationTimeline };
    const archivistSubmitted = state.observationTimeline.archivistTimeline !== null;
    const trackerSubmitted = state.observationTimeline.trackerTimeline !== null;
    const bothSubmitted = archivistSubmitted && trackerSubmitted;
    observationTimeline.archivistSubmitted = archivistSubmitted;
    observationTimeline.trackerSubmitted = trackerSubmitted;
    observationTimeline.investigationsAgree = bothSubmitted
      ? sameSequence(state.observationTimeline.archivistTimeline, state.observationTimeline.trackerTimeline ?? [])
      : null;
    observationTimeline.investigationsVerified = bothSubmitted && state.observationTimeline.archivistValid
      && state.observationTimeline.trackerValid && observationTimeline.investigationsAgree === true;
    if (playerNumber === 1) {
      observationTimeline.trackerTimeline = null;
      observationTimeline.trackerValid = false;
    } else if (playerNumber === 2) {
      observationTimeline.archivistTimeline = null;
      observationTimeline.archivistValid = false;
    }
    // Before completion, players get comparison status but not the other role's submitted answer.
    return { ...state, observationTimeline };
  }
  if (state.currentChallenge === 5) {
    const signalReconstruction = { ...state.signalReconstruction };
    if (playerNumber === 1) {
      signalReconstruction.trackerRoute = null;
      signalReconstruction.trackerValid = false;
    } else if (playerNumber === 2) {
      if (!signalReconstruction.archivistValid) signalReconstruction.archivistRoute = null;
    }
    return { ...state, signalReconstruction };
  }
  if (state.currentChallenge === 6 && !state.completed) {
    const incidentConclusion = { ...state.incidentConclusion };
    if (playerNumber === 1) {
      incidentConclusion.trackerInterpretation = null;
      incidentConclusion.trackerValid = false;
    } else if (playerNumber === 2) {
      incidentConclusion.archivistInterpretation = null;
      incidentConclusion.archivistValid = false;
    }
    return { ...state, incidentConclusion };
  }
  return state;
}

function addEvidence(state: Hunt1State, entry: Omit<Hunt1Evidence, 'createdAt'>): void {
  if (state.evidence.some((item) => item.id === entry.id)) return;
  const record = { ...entry, createdAt: nowIso() };
  state.evidence.push(record);
  state.journal.push(record);
}

function awardTask(state: Hunt1State, key: Hunt1TaskKey): void {
  if (state.taskCompleted[key]) return;
  state.taskCompleted[key] = true;
  state.taskScores[key] = TASKS[key].points;
  state.score = Math.max(0, Object.values(state.taskScores).reduce((sum, points) => sum + points, 0)
    + Object.values(state.optionalScores).reduce((sum, points) => sum + points, 0) - state.penalties);
  if (key === 'incidentConclusion') state.completed = true;
  else state.currentChallenge = Math.min(6, state.currentChallenge + 1) as Hunt1State['currentChallenge'];
  const task = TASKS[key];
  addEvidence(state, {
    id: `objective-complete-${key}`, title: `${task.title} reconstructed`, location: task.title,
    discoveredBy: 'team', type: 'objective', content: `Both timelines support the reconstruction. ${task.title} is verified.`,
    inference: `Task completed for ${task.points} points.`, relatedObjective: task.title, verified: true,
  });
}

function penalize(state: Hunt1State, actor: Hunt1Actor, attempt: unknown): void {
  const key = `${state.currentChallenge}:${actor}:${JSON.stringify(attempt)}`;
  if (state.failedSubmissions.includes(key)) return;
  state.failedSubmissions.push(key);
  state.penalties += 10;
  state.score = Math.max(0, Object.values(state.taskScores).reduce((sum, points) => sum + points, 0)
    + Object.values(state.optionalScores).reduce((sum, points) => sum + points, 0) - state.penalties);
}

function getTaskKey(challenge: number): Hunt1TaskKey | null {
  return Object.entries(TASKS).find(([, task]) => task.number === challenge)?.[0] as Hunt1TaskKey | undefined ?? null;
}

function normalizeSequence(value: unknown): string[] | null {
  return Array.isArray(value) && value.length <= 10 && value.every((item) => typeof item === 'string') ? value as string[] : null;
}

function sameSequence(left: string[] | null, right: string[]): boolean {
  return !!left && left.length === right.length && left.every((item, index) => item === right[index]);
}

function updateState(teamId: string, state: Hunt1State): void {
  state.score = Math.max(0, Object.values(state.taskScores).reduce((sum, points) => sum + points, 0)
    + Object.values(state.optionalScores).reduce((sum, points) => sum + points, 0) - state.penalties);
  refreshAvailable(state);
  state.updatedAt = nowIso();
  db.prepare('UPDATE round3_hunt1_sessions SET state_json=?, updated_at=? WHERE team_id=?').run(JSON.stringify(state), state.updatedAt, teamId);
  db.prepare('UPDATE round3_sessions SET score=?, updated_at=? WHERE team_id=?').run(state.score, state.updatedAt, teamId);
}

export function applyRound3Hunt1Action(
  teamId: string,
  input: { type: string; actor?: unknown; objectId?: unknown; value?: unknown },
): Hunt1ActionResult | null {
  if (!round3GameplayAllowed(teamId)) return null;
  if (!isActor(input.actor)) return null;
  db.exec('BEGIN IMMEDIATE');
  try {
    const row = db.prepare('SELECT state_json FROM round3_hunt1_sessions WHERE team_id=?').get(teamId) as { state_json: string } | undefined;
    if (!row) { db.exec('ROLLBACK'); return null; }
    const state = JSON.parse(row.state_json) as Hunt1State;
    if (state.modelVersion !== MODEL_VERSION || state.completed) { db.exec('ROLLBACK'); return null; }
    const actor = input.actor;
    state.missingReport ??= emptyMissingReport();
    state.powerFailure ??= emptyPowerFailure();
    state.observationTimeline ??= emptyObservationTimeline();
    state.signalReconstruction ??= emptySignalReconstruction();
    state.incidentConclusion ??= emptyIncidentConclusion();
    let actionSuccess = true;
    let message = '';
    let hint: string | undefined;
    if (input.type === 'interact') {
      const objectId = typeof input.objectId === 'string' ? input.objectId : '';
      const optional = OPTIONAL_OBJECTS[objectId];
      if (optional && optional.actor === actor) {
        if (state.objectStates[objectId] === 'examined') message = `${optional.title} was already added to the evidence file.`;
        else {
          state.objectStates[objectId] = 'examined';
          state.optionalScores[optional.key] = 50;
          addEvidence(state, { id: objectId, title: optional.title, location: objectId === 'optionalResearchNote' ? 'Archive' : 'Communication room', discoveredBy: actor, type: 'evidence', content: optional.content, inference: 'This hidden record supports the reconstructed incident.', relatedObjective: 'Optional evidence', verified: false });
          message = `${optional.title} examined · +50 points.`;
        }
      } else {
        const taskKey = getTaskKey(state.currentChallenge);
        const task = taskKey ? TASKS[taskKey] : null;
        const expectedActor = task?.objects[objectId];
        if (!task || !expectedActor) { actionSuccess = false; message = 'That evidence is sealed until its investigation task is unlocked.'; }
        else if (expectedActor !== actor) { actionSuccess = false; message = `The ${actor === 'archivist' ? 'Tracker' : 'Archivist'} must examine this evidence in their timeline.`; }
        else if (state.subtasks[objectId]) message = 'This evidence is already in the shared incident file.';
        else {
          state.subtasks[objectId] = true;
          state.objectStates[objectId] = 'examined';
          const clue = EVIDENCE[objectId];
          addEvidence(state, { id: objectId, title: clue.title, location: clue.location, discoveredBy: actor, type: 'evidence', content: clue.content, inference: clue.inference, relatedObjective: task.title, verified: false });
          message = `${clue.title} added to the shared incident file. Examine it in the journal.`;
        }
      }
    } else if (input.type === 'hint') {
      const taskKey = getTaskKey(state.currentChallenge)!;
      const key = String(state.currentChallenge);
      const used = state.hintUses[key] ?? 0;
      if (used >= 2) { actionSuccess = false; message = 'Both reconstruction hints have already been used.'; }
      else {
        state.hintUses[key] = used + 1;
        hint = HINTS[state.currentChallenge][used];
        state.penalties += 10;
        state.score = Math.max(0, Object.values(state.taskScores).reduce((sum, points) => sum + points, 0) + Object.values(state.optionalScores).reduce((sum, points) => sum + points, 0) - state.penalties);
        message = `Field note ${used + 1}/2 · −10 points. ${taskKey ? TASKS[taskKey].title : ''}`;
      }
    } else if (input.type.startsWith('powerFailure') && isRecord(input.value)) {
      const puzzle = state.powerFailure;
      const correctTask = state.currentChallenge === 3 && !state.taskCompleted.powerFailure;
      const evidenceReady = TASKS.powerFailure.required.every((id) => state.subtasks[id]);
      const sequence = normalizeSequence(input.value.sequence);
      if (!correctTask || !evidenceReady) { actionSuccess = false; message = 'The generator circuit is not ready for reconstruction.'; }
      else if (input.type === 'powerFailureArchivist' && actor === 'archivist') {
        if (!sequence) { actionSuccess = false; message = 'Arrange all four wiring connections before submitting the diagram.'; }
        else {
          puzzle.archivistConnections = sequence;
          puzzle.archivistValid = sameSequence(sequence, POWER_FAILURE_ANSWER);
          if (!puzzle.archivistValid) { penalize(state, actor, sequence); actionSuccess = false; message = 'That wiring interpretation breaks the original circuit. Recheck the Past diagram.'; }
          else message = 'Original wiring decoded and shared with the Tracker. The generator is still disconnected in the Future.';
        }
      } else if (input.type === 'powerFailureTracker' && actor === 'tracker') {
        if (!puzzle.archivistValid || !sameSequence(puzzle.archivistConnections, POWER_FAILURE_ANSWER)) { actionSuccess = false; message = 'Wait for the Archivist to decode the original wiring diagram.'; }
        else if (!sequence) { actionSuccess = false; message = 'Reconnect all four leads before testing the generator.'; }
        else {
          puzzle.trackerConnections = sequence;
          puzzle.trackerValid = sameSequence(sequence, POWER_FAILURE_ANSWER)
            && sameSequence(sequence, puzzle.archivistConnections ?? []);
          if (!puzzle.trackerValid) { penalize(state, actor, sequence); actionSuccess = false; message = 'The generator circuit is still unstable. Check each physical connection and try again.'; }
          else {
            awardTask(state, 'powerFailure');
            message = 'The Tracker reconnects the generator from the original diagram. Power restored · +200 points.';
          }
        }
      } else { actionSuccess = false; message = 'This authenticated role cannot operate that generator station.'; }
    } else if (input.type.startsWith('observation') && isRecord(input.value)) {
      const puzzle = state.observationTimeline;
      const correctTask = state.currentChallenge === 4 && !state.taskCompleted.observationLog;
      const evidenceReady = TASKS.observationLog.required.every((id) => state.subtasks[id]);
      const sequence = normalizeSequence(input.value.sequence);
      if (!correctTask || !evidenceReady) { actionSuccess = false; message = 'Both Observation Room investigations must be opened before timelines can be compared.'; }
      else if (input.type === 'observationArchivist' && actor === 'archivist') {
        if (!sequence) { actionSuccess = false; message = 'Arrange the four historical events before submitting the Past timeline.'; }
        else {
          puzzle.archivistTimeline = sequence;
          puzzle.archivistValid = sameSequence(sequence, OBSERVATION_ANSWER);
          if (!puzzle.archivistValid) { penalize(state, actor, sequence); actionSuccess = false; message = 'The historical entries still conflict. Recheck the time correction and submit the timeline again.'; }
          else if (puzzle.trackerValid && sameSequence(puzzle.trackerTimeline, OBSERVATION_ANSWER)) {
            awardTask(state, 'observationLog');
            message = 'The archival timeline agrees with the physical sequence. Observation Log reconstructed · +200 points.';
          } else message = 'Past timeline submitted. The Tracker must reconcile the physical evidence before the incident can be verified.';
        }
      } else if (input.type === 'observationTracker' && actor === 'tracker') {
        if (!sequence) { actionSuccess = false; message = 'Arrange the physical events before submitting the Future timeline.'; }
        else {
          puzzle.trackerTimeline = sequence;
          puzzle.trackerValid = sameSequence(sequence, OBSERVATION_ANSWER);
          if (!puzzle.trackerValid) { penalize(state, actor, sequence); actionSuccess = false; message = 'The physical traces do not support that sequence. Re-examine the room evidence and try again.'; }
          else if (puzzle.archivistValid && sameSequence(puzzle.archivistTimeline, OBSERVATION_ANSWER)) {
            awardTask(state, 'observationLog');
            message = 'The physical sequence agrees with the archival timeline. Observation Log reconstructed · +200 points.';
          } else message = 'Future timeline submitted. The Archivist must resolve the historical record before the incident can be verified.';
        }
      } else { actionSuccess = false; message = 'This authenticated role cannot submit that Observation Room timeline.'; }
    } else if (input.type.startsWith('incidentConclusion') && isRecord(input.value)) {
      const puzzle = state.incidentConclusion;
      const correctTask = state.currentChallenge === 6 && !state.taskCompleted.incidentConclusion && !state.completed;
      const priorTasksReady = Object.entries(state.taskCompleted)
        .filter(([key]) => key !== 'incidentConclusion')
        .every(([, done]) => done);
      const evidenceReady = TASKS.incidentConclusion.required.every((id) => state.subtasks[id]);
      const sequence = normalizeSequence(input.value.sequence);
      if (!correctTask || !priorTasksReady || !evidenceReady) { actionSuccess = false; message = 'Complete the five investigations and examine both final boards before submitting the conclusion.'; }
      else if (input.type === 'incidentConclusionArchivist' && actor === 'archivist') {
        if (!sequence) { actionSuccess = false; message = 'Arrange the historical purpose and procedure before submitting.'; }
        else {
          puzzle.archivistInterpretation = sequence;
          puzzle.archivistValid = sameSequence(sequence, CONCLUSION_ARCHIVIST_ANSWER);
          state.subtasks.conclusionArchivist = puzzle.archivistValid;
          if (!puzzle.archivistValid) { penalize(state, actor, sequence); actionSuccess = false; message = 'The historical purpose or intended procedure does not match the recovered records.'; }
          else if (puzzle.trackerValid && sameSequence(puzzle.trackerInterpretation, CONCLUSION_TRACKER_ANSWER)) {
            awardTask(state, 'incidentConclusion');
            message = 'The historical mandate and physical aftermath form one verified report. Hunt I complete · +150 points.';
          } else message = 'Historical conclusion recorded. The Tracker must submit the physical cause and aftermath.';
        }
      } else if (input.type === 'incidentConclusionTracker' && actor === 'tracker') {
        if (!sequence) { actionSuccess = false; message = 'Arrange the physical failure and transmission aftermath before submitting.'; }
        else {
          puzzle.trackerInterpretation = sequence;
          puzzle.trackerValid = sameSequence(sequence, CONCLUSION_TRACKER_ANSWER);
          state.subtasks.conclusionTracker = puzzle.trackerValid;
          if (!puzzle.trackerValid) { penalize(state, actor, sequence); actionSuccess = false; message = 'The physical cause or transmission aftermath conflicts with the recovered traces.'; }
          else if (puzzle.archivistValid && sameSequence(puzzle.archivistInterpretation, CONCLUSION_ARCHIVIST_ANSWER)) {
            awardTask(state, 'incidentConclusion');
            message = 'The physical aftermath completes the historical report. Hunt I complete · +150 points.';
          } else message = 'Physical conclusion recorded. The Archivist must submit the experiment’s purpose and intended procedure.';
        }
      } else { actionSuccess = false; message = 'This authenticated role cannot submit that part of the incident conclusion.'; }
    } else if (input.type.startsWith('signal') && isRecord(input.value)) {
      const puzzle = state.signalReconstruction;
      const correctTask = state.currentChallenge === 5 && !state.taskCompleted.signalReconstruction;
      const evidenceReady = TASKS.signalReconstruction.required.every((id) => state.subtasks[id]);
      const sequence = normalizeSequence(input.value.sequence);
      if (!correctTask || !evidenceReady) { actionSuccess = false; message = 'Both communication investigations must be opened before the signal can be restored.'; }
      else if (input.type === 'signalArchivist' && actor === 'archivist') {
        if (!sequence) { actionSuccess = false; message = 'Arrange all four routing stations before submitting the Past blueprint.'; }
        else {
          puzzle.archivistRoute = sequence;
          puzzle.archivistValid = sameSequence(sequence, SIGNAL_ANSWER);
          if (!puzzle.archivistValid) { penalize(state, actor, sequence); actionSuccess = false; message = 'That route conflicts with the original routing marks. Recheck the historical blueprint.'; }
          else message = 'Original route decoded and shared with the Tracker. The damaged console remains disconnected.';
        }
      } else if (input.type === 'signalTracker' && actor === 'tracker') {
        if (!puzzle.archivistValid || !sameSequence(puzzle.archivistRoute, SIGNAL_ANSWER)) { actionSuccess = false; message = 'Wait for the Archivist to decode the original signal route.'; }
        else if (!sequence) { actionSuccess = false; message = 'Reconnect all four console stations before testing transmission.'; }
        else {
          puzzle.trackerRoute = sequence;
          puzzle.trackerValid = sameSequence(sequence, SIGNAL_ANSWER)
            && sameSequence(sequence, puzzle.archivistRoute ?? []);
          if (!puzzle.trackerValid) { penalize(state, actor, sequence); actionSuccess = false; message = 'The signal still breaks or bypasses a required station. Reconnect the console and retry.'; }
          else {
            awardTask(state, 'signalReconstruction');
            message = 'The Tracker restores the console using the decoded route. Transmission restored · +200 points.';
          }
        }
      } else { actionSuccess = false; message = 'This authenticated role cannot operate that communication station.'; }
    } else if (input.type.startsWith('missingReport') && isRecord(input.value)) {
      const puzzle = state.missingReport;
      const correctTask = state.currentChallenge === 2 && !state.taskCompleted.missingReport;
      const evidenceReady = state.subtasks.archiveIndex && state.subtasks.shreddedReport;
      const sequence = normalizeSequence(input.value.sequence);
      if (!correctTask || !evidenceReady) { actionSuccess = false; message = 'The report reconstruction is not ready.'; }
      else if (input.type === 'missingReportArchivist' && actor === 'archivist') {
        if (!sequence) { actionSuccess = false; message = 'Arrange all four index entries before submitting.'; }
        else {
          const changed = !sameSequence(puzzle.archivistOrder, sequence);
          if (changed) { puzzle.reconstructionVersion += 1; puzzle.confirmations = {}; }
          puzzle.archivistOrder = sequence;
          puzzle.archivistValid = sameSequence(sequence, MISSING_REPORT_ANSWER);
          if (!puzzle.archivistValid) { penalize(state, actor, sequence); actionSuccess = false; message = 'The index entries conflict with the historical filing marks. Reorder them and try again.'; }
          else message = 'Historical index decoded and shared with the Tracker. The order is recorded for joint reconstruction.';
        }
      } else if (input.type === 'missingReportTracker' && actor === 'tracker') {
        if (!sequence) { actionSuccess = false; message = 'Place all four report fragments before submitting.'; }
        else {
          const changed = !sameSequence(puzzle.trackerOrder, sequence);
          if (changed) { puzzle.reconstructionVersion += 1; puzzle.confirmations = {}; }
          puzzle.trackerOrder = sequence;
          puzzle.trackerValid = sameSequence(sequence, MISSING_REPORT_ANSWER);
          if (!puzzle.trackerValid) { penalize(state, actor, sequence); actionSuccess = false; message = 'The torn edges and report contents do not align. Reorder the fragments and try again.'; }
          else message = 'Physical report reconstructed. Both investigators can now compare and confirm the arrangement.';
        }
      } else if (input.type === 'missingReportConfirm') {
        const submittedVersion = input.value.reconstructionVersion;
        const sameArrangement = sameSequence(puzzle.archivistOrder, puzzle.trackerOrder ?? []);
        const bothCorrect = puzzle.archivistValid && puzzle.trackerValid
          && sameSequence(puzzle.archivistOrder, MISSING_REPORT_ANSWER)
          && sameSequence(puzzle.trackerOrder, MISSING_REPORT_ANSWER);
        if (state.taskCompleted.missingReport) { actionSuccess = false; message = 'The Missing Report is already complete.'; }
        else if (submittedVersion !== puzzle.reconstructionVersion) { actionSuccess = false; message = 'The reconstruction changed. Review the current arrangement before confirming.'; }
        else if (!puzzle.archivistOrder || !puzzle.trackerOrder || !sameArrangement || !bothCorrect) { actionSuccess = false; message = 'The two reconstructions must match and be correct before confirmation.'; }
        else if (puzzle.confirmations[actor] === puzzle.reconstructionVersion) { actionSuccess = false; message = 'Your confirmation for this reconstruction is already recorded.'; }
        else {
          puzzle.confirmations[actor] = puzzle.reconstructionVersion;
          if (puzzle.confirmations.archivist === puzzle.reconstructionVersion && puzzle.confirmations.tracker === puzzle.reconstructionVersion) {
            awardTask(state, 'missingReport');
            message = 'Both investigators confirmed reconstruction v' + puzzle.reconstructionVersion + '. The Missing Report is complete · +150 points.';
          } else message = 'Confirmation recorded. Waiting for the other authenticated investigator.';
        }
      } else { actionSuccess = false; message = 'This authenticated role cannot perform that report action.'; }
    } else if (input.type === 'submit' && isRecord(input.value)) {
      const taskKey = getTaskKey(state.currentChallenge);
      if (!taskKey) { actionSuccess = false; message = 'No incident task is currently available.'; }
      else {
        const task = TASKS[taskKey];
        const sequence = normalizeSequence(input.value.sequence);
        const priorTasksReady = taskKey !== 'incidentConclusion'
          || Object.entries(state.taskCompleted).filter(([key]) => key !== 'incidentConclusion').every(([, done]) => done);
        const evidenceReady = task.required.every((id) => state.subtasks[id]) && priorTasksReady;
        const allowedSubmitter = task.submitter === 'team' ? true : actor === task.submitter;
        if (taskKey === 'missingReport') { actionSuccess = false; message = 'Use the separate index decoding and fragment reconstruction actions.'; }
        else if (taskKey === 'powerFailure') { actionSuccess = false; message = 'Use the wiring diagram and generator reconnection stations.'; }
        else if (taskKey === 'observationLog') { actionSuccess = false; message = 'Submit the separate Past and Future investigation timelines.'; }
        else if (taskKey === 'signalReconstruction') { actionSuccess = false; message = 'Use the separate blueprint decoder and console restoration stations.'; }
        else if (taskKey === 'incidentConclusion') { actionSuccess = false; message = 'Submit the separate historical and physical conclusions.'; }
        else if (!allowedSubmitter) { actionSuccess = false; message = `The ${task.submitter} must operate this reconstruction board.`; }
        else if (!evidenceReady) { actionSuccess = false; message = 'The reconstruction board is missing evidence from one or both timelines.'; }
        else if (!sequence) { actionSuccess = false; message = 'The reconstruction sequence is incomplete.'; }
        else if (state.taskCompleted[taskKey]) { actionSuccess = false; message = `${task.title} is already complete.`; }
        else if (JSON.stringify(sequence) !== JSON.stringify(task.answer)) {
          penalize(state, actor, sequence);
          actionSuccess = false;
          message = 'That reconstruction conflicts with the evidence. Reorder the pieces and try again.';
        } else {
          awardTask(state, taskKey);
          message = `${task.title} verified · +${task.points} points. ${state.completed ? '' : `Task ${state.currentChallenge} is now unlocked.`}`;
        }
      }
    } else { db.exec('ROLLBACK'); return null; }
    updateState(teamId, state);
    db.exec('COMMIT');
    const responseState = getRound3Hunt1State(teamId) ?? state;
    return { success: actionSuccess, message, state: responseState, hint };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

const EVIDENCE: Record<string, { title: string; location: string; content: string; inference: string }> = {
  visitorLedger: { title: 'Reception visitor ledger', location: 'Reception — Past', content: 'E. Marr, facilities technician, signed in first. Director S. Vale followed. At 18:21 the final line reads “visitor — no badge”; no departure was recorded.', inference: 'The unregistered visitor was the last person admitted before the incident.' },
  visitorTracks: { title: 'Tracks beneath the reception glass', location: 'Reception — Future', content: 'One set of wet prints approaches from the generator corridor and continues toward the observation wing. No matching prints return to the entrance.', inference: 'The last visitor entered the facility and never left by the reception route.' },
  archiveIndex: { title: 'Archive report index', location: 'Archive — Past', content: 'The index contains four damaged filing entries. The Archivist must compare their historical cues and submit the recovered order; the decoded order is shared only after that submission.', inference: 'The safeguard entry was mandatory before an observation run.' },
  shreddedReport: { title: 'Shredded incident report', location: 'Archive — Future', content: 'Four pieces retain torn-edge symbols and headings: PURPOSE, APPARATUS, SAFEGUARDS, RESULT. The safeguards paragraph begins “ground strap must remain bonded.”', inference: 'Reassemble the four sections in the archive’s numbered order to reveal the omitted safeguard.' },
  generatorLog: { title: 'Original generator wiring diagram', location: 'Generator room — Past', content: 'The original diagram contains four labeled connection segments and a current-flow legend. The numbered endpoint marks are faded; the maintenance log notes that a stable load test preceded the R-4 bypass and ground failure.', inference: 'Decode the wiring path from source to frame before attempting to restore the damaged generator.' },
  burntRelay: { title: 'Burned relay jumper', location: 'Generator room — Future', content: 'A loose copper jumper lies beside the bypassed R-4 safety relay. The cable markers identify its two endpoints as generator output and relay input.', inference: 'Reconnect the lead to restore the first protected circuit link.' },
  openGround: { title: 'Open ground lead', location: 'Generator room — Future', content: 'The load bus and frame return are disconnected from the ground bus. The open lug is scorched from an ungrounded surge.', inference: 'The ground braid bonds the load bus to the ground bus, and the return lead meets the generator frame.' },
  observationLog: { title: 'Observation room logbook', location: 'Observation room — Past', content: 'The logbook contains conflicting wall-clock and camera-channel times, a final interrupted observer entry, and a handwritten correction beside the relay record.', inference: 'Reconcile the time sources; one historical channel was not synchronized with the room clock.' },
  cameraBuffer: { title: 'Camera buffer fragments', location: 'Observation room — Future', content: 'The buffer preserves four physical traces: soot beneath the lamp relay, a figure-shaped afterimage on the glass, a chair dragged toward the viewing pane, and an empty seat in the final frame.', inference: 'Compare the lamp, glass and chair traces to reconstruct the room’s physical sequence.' },
  signalChart: { title: 'Original signal routing blueprint', location: 'Communication room — Past', content: 'The blueprint contains a terminal legend, shield markings and a faded route key. Its sequence column is water-damaged and must be decoded from the routing symbols.', inference: 'Use the historical legend to distinguish the signal route from the shielding marks.' },
  cableJunction: { title: 'Damaged communication console', location: 'Communication room — Future', content: 'Four loose connectors lie beside the intake, ground, observer and transmit terminals. The console carries a scorched bypass bridge and a broken continuity seal.', inference: 'The physical console must be reconnected by hand; the bypass damaged its original continuity.' },
  incidentBoardPast: { title: 'Past incident board', location: 'Investigation board — Past', content: 'The archive, generator, and observation records have been pinned together. The report’s grounding safeguard is missing from the signed copy.', inference: 'Use each verified task to construct the cause chain.' },
  incidentBoardFuture: { title: 'Future incident board', location: 'Investigation board — Future', content: 'The relay jumper, open ground, and rerouted cable share the same copper braid. The tracks end beyond the observation glass.', inference: 'The physical evidence confirms the incident sequence and final manifestation.' },
};
