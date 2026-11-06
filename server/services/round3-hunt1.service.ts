import { db } from '../../database/db.ts';
import type { Hunt1ActionResult, Hunt1Actor, Hunt1Challenge, Hunt1Evidence, Hunt1State } from '../../src/types/hunt1.types.ts';

db.exec(`CREATE TABLE IF NOT EXISTS round3_hunt1_sessions (
  team_id TEXT PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`);

const HINTS: Record<Hunt1Challenge, readonly [string, string]> = {
  1: ['The note describes something with hands that stopped during the experiment.', 'Look for the clock in the Future reception area.'],
  2: ['The Past desk drawer needs the key; the Future desk has a separate fragment.', 'Combine the Archivist’s report with the Tracker’s fragment.'],
  3: ['Three tones resolve to a number between 0 and 1000 Hz.', 'The recording decodes to 740 Hz.'],
  4: ['The diagram gives the order; the panel has three missing pieces.', 'POWER → CAPACITOR → RESONANCE COIL → OUTPUT.'],
  5: ['Use the frequency and mode named by the reconstructed report.', 'Set the transmitter to 740 Hz and ANTIPHASE.'],
  6: ['The Past console and Future breaker must both be prepared.', 'After both are ready, activate each control within 10 seconds.'],
};

const isActor = (value: unknown): value is Hunt1Actor => value === 'archivist' || value === 'tracker';
const normalize = (value: unknown): string => typeof value === 'string' ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() : '';
const nowIso = (): string => new Date().toISOString();

function freshState(teamId: string): Hunt1State {
  return {
    teamId, currentChallenge: 1, completed: false, score: 0, penalties: 0, subtasks: {},
    objectStates: { desk: 'undiscovered', stoppedClock: 'hidden', reportFragment: 'hidden', rec: 'hidden', transmitter: 'hidden', circuitDiagram: 'hidden', panel: 'hidden', componentCapacitor: 'hidden', componentCoil: 'hidden', componentOutput: 'hidden', calibrationConsole: 'hidden', shutdownConsole: 'hidden', emergencyBreaker: 'hidden', optionalLog: 'hidden' },
    inventory: [], components: [], evidence: [], journal: [], frequency: null, circuitOrder: [], resonanceMode: null,
    hintUses: {}, scoreBreakdown: { evidence: 0, deductions: 0, circuit: 0, configuration: 0, shutdown: 0, optional: 0, penalties: 0 },
    scoreBreakdownByPlayer: {
      archivist: { evidence: 0, deductions: 0, circuit: 0, configuration: 0, shutdown: 0, optional: 0, penalties: 0 },
      tracker: { evidence: 0, deductions: 0, circuit: 0, configuration: 0, shutdown: 0, optional: 0, penalties: 0 },
    },
    syncDeadline: null, activatedBy: {}, updatedAt: nowIso(),
  };
}

function ensureRow(teamId: string): void {
  db.prepare('INSERT OR IGNORE INTO round3_hunt1_sessions (team_id, state_json, updated_at) VALUES (?, ?, ?)').run(teamId, JSON.stringify(freshState(teamId)), nowIso());
}

export function ensureRound3Hunt1State(teamId: string): Hunt1State {
  ensureRow(teamId);
  return getRound3Hunt1State(teamId)!;
}

export function getRound3Hunt1State(teamId: string): Hunt1State | null {
  const row = db.prepare('SELECT state_json FROM round3_hunt1_sessions WHERE team_id = ?').get(teamId) as { state_json: string } | undefined;
  if (!row) return null;
  const state = JSON.parse(row.state_json) as Hunt1State;
  state.scoreBreakdownByPlayer ??= {
    archivist: { ...state.scoreBreakdown, evidence: 0, deductions: 0, circuit: 0, configuration: 0, shutdown: 0, optional: 0, penalties: 0 },
    tracker: { ...state.scoreBreakdown, evidence: 0, deductions: 0, circuit: 0, configuration: 0, shutdown: 0, optional: 0, penalties: 0 },
  };
  return state;
}

function addEvidence(state: Hunt1State, actor: Hunt1Actor | 'team', entry: Omit<Hunt1Evidence, 'discoveredBy' | 'createdAt'>, points = 0): void {
  if (state.evidence.some((item) => item.id === entry.id)) return;
  const record: Hunt1Evidence = { ...entry, discoveredBy: actor, createdAt: nowIso() };
  state.evidence.push(record);
  state.journal.push(record);
  if (points) award(state, 'evidence', points, actor);
}

function addJournal(state: Hunt1State, title: string, content: string, relatedObjective: string, verified = true): void {
  state.journal.push({
    id: `objective-${state.currentChallenge}-${state.journal.length}`, title, location: 'Shared investigation log',
    discoveredBy: 'team', type: 'objective', content, inference: content, relatedObjective, verified, createdAt: nowIso(),
  });
}

function award(state: Hunt1State, category: keyof Hunt1State['scoreBreakdown'], points: number, actor?: Hunt1Actor | 'team'): void {
  const caps = { evidence: 150, deductions: 200, circuit: 150, configuration: 200, shutdown: 200, optional: 100, penalties: 0 };
  const remaining = Math.max(0, caps[category] - state.scoreBreakdown[category]);
  const value = Math.min(points, remaining);
  state.scoreBreakdown[category] += value;
  state.score += value;
  const recipients: Array<[Hunt1Actor, number]> = actor === 'archivist' || actor === 'tracker'
    ? [[actor, value]]
    : [['archivist', Math.floor(value / 2)], ['tracker', Math.ceil(value / 2)]];
  for (const [recipient, share] of recipients) state.scoreBreakdownByPlayer[recipient][category] += share;
}

function penalize(state: Hunt1State, points: number, actor?: Hunt1Actor | 'team'): void {
  const amount = Math.min(points, state.score);
  state.penalties += points;
  state.scoreBreakdown.penalties += points;
  state.score -= amount;
  const recipients: Array<[Hunt1Actor, number]> = actor === 'archivist' || actor === 'tracker'
    ? [[actor, points]]
    : [['archivist', Math.floor(points / 2)], ['tracker', Math.ceil(points / 2)]];
  for (const [recipient, share] of recipients) state.scoreBreakdownByPlayer[recipient].penalties += share;
}

function advance(state: Hunt1State, from: Hunt1Challenge, message: string): void {
  if (state.currentChallenge !== from) return;
  if (from === 6) {
    state.completed = true;
    state.subtasks.finalShutdown = true;
    state.objectStates.shutdownConsole = 'completed';
    state.objectStates.emergencyBreaker = 'completed';
    award(state, 'shutdown', 200, 'team');
    addJournal(state, 'Resonance transmitter disabled', message, 'Final shutdown', true);
    return;
  }
  state.currentChallenge = (from + 1) as Hunt1Challenge;
  addJournal(state, `Challenge ${from + 1} unlocked`, message, `Challenge ${from + 1}`, true);
}

function maybeAdvance(state: Hunt1State): void {
  switch (state.currentChallenge) {
    case 1:
      if (state.subtasks.riddleSolved && state.subtasks.maintenanceKeyCollected) advance(state, 1, 'The maintenance key is recovered. Reconstruct the sealed maintenance report.');
      break;
    case 2:
      if (state.subtasks.originalReportCollected && state.subtasks.reportFragmentCollected && state.subtasks.reportReconstructed) advance(state, 2, 'The report is complete. Analyze the recorder and recover the transmitter frequency.');
      break;
    case 3:
      if (state.subtasks.frequencyDecoded && state.subtasks.transmitterFrequencyEntered) advance(state, 3, 'The historical frequency is confirmed. Restore the broken circuit.');
      break;
    case 4:
      if (state.subtasks.wiringValidated && state.subtasks.componentsCollected && state.subtasks.circuitRestored) advance(state, 4, 'The transmitter circuit is restored. Configure it for shutdown.');
      break;
    case 5:
      if (state.subtasks.calibrationValidated && state.subtasks.transmitterConfigured && state.subtasks.archivistConfigurationConfirmed && state.subtasks.trackerConfigurationConfirmed) advance(state, 5, 'The transmitter is configured. Prepare the synchronized shutdown.');
      break;
    case 6:
      if (state.activatedBy.archivist && state.activatedBy.tracker) {
        const gap = Math.abs(state.activatedBy.archivist - state.activatedBy.tracker);
        if (gap <= 10_000 && state.syncDeadline && Math.max(state.activatedBy.archivist, state.activatedBy.tracker) <= state.syncDeadline) {
          state.subtasks.finalShutdown = true;
          state.objectStates.transmitter = 'completed';
          advance(state, 6, 'Both controls engaged in sync. The resonance transmitter is disabled and the entity is contained.');
        } else {
          penalize(state, 50, 'team');
          state.activatedBy = {};
          state.syncDeadline = null;
          state.subtasks.archivistReady = false;
          state.subtasks.trackerReady = false;
          addJournal(state, 'Shutdown synchronization failed', 'The controls were not activated within the synchronization window. Prepare both controls and try again.', 'Final shutdown', false);
        }
      }
      break;
  }
}

function fail(state: Hunt1State, message: string, actor: Hunt1Actor, penalizeBy = 0): string {
  if (penalizeBy) penalize(state, penalizeBy, actor);
  return message;
}

export function applyRound3Hunt1Action(
  teamId: string,
  input: { type: string; actor?: unknown; objectId?: unknown; value?: unknown; order?: unknown; mode?: unknown },
): Hunt1ActionResult | null {
  const state = getRound3Hunt1State(teamId);
  if (!state || !isActor(input.actor) || state.completed) return null;
  const actor = input.actor;
  const penaltiesBefore = state.penalties;
  let message = '';
  let inputNeeded: Hunt1ActionResult['input'];
  let hint: string | undefined;
  const objectId = typeof input.objectId === 'string' ? input.objectId : '';

  if (input.type === 'hint') {
    const key = String(state.currentChallenge);
    const count = state.hintUses[key] ?? 0;
    if (count >= 2) {
      message = 'Both hints for this challenge have already been used.';
    } else {
      state.hintUses[key] = count + 1;
      penalize(state, 25, actor);
      hint = HINTS[state.currentChallenge][count];
      message = `Hint ${count + 1} of 2.`;
    }
  } else if (input.type === 'interact') {
    if (objectId === 'optionalLog') {
      if (state.objectStates.optionalLog === 'collected') message = 'The hidden transmitter log is already in the journal.';
      else {
        state.objectStates.optionalLog = 'collected';
        addEvidence(state, actor, { id: 'optional-transmitter-log', title: 'Hidden transmitter log', location: 'Containment service alcove', type: 'observation', content: 'A maintenance log notes the transmitter’s low-frequency resonance was strongest when the output coil was isolated.', inference: 'This confirms the output stage is the final circuit component.', relatedObjective: 'Optional hidden evidence', verified: false }, 100);
        message = 'Hidden evidence recorded. +100 optional evidence points.';
      }
    } else if (state.currentChallenge === 1 && actor === 'archivist' && objectId === 'desk') {
      if (!state.subtasks.maintenanceNoteFound) {
        state.subtasks.maintenanceNoteFound = true;
        state.objectStates.desk = 'discovered';
        addEvidence(state, actor, { id: 'maintenance-riddle', title: 'Torn maintenance note', location: 'Reception desk — Past', type: 'evidence', content: '“I have hands but cannot hold. I stopped when the final experiment began. Behind me lies what you seek.”', inference: 'The riddle identifies a stopped clock.', relatedObjective: 'Challenge 1 — The Missing Key', verified: false }, 30);
        inputNeeded = 'riddle';
        message = 'The note contains a riddle. Submit your deduction.';
      } else message = 'The note is already recorded. Submit the riddle answer.';
    } else if (state.currentChallenge === 1 && actor === 'tracker' && objectId === 'stoppedClock') {
      if (!state.subtasks.riddleSolved) message = 'The clock is still sealed. Wait for the Archivist to solve the maintenance riddle.';
      else {
        state.subtasks.maintenanceKeyCollected = true;
        state.inventory = state.inventory.includes('maintenance-key') ? state.inventory : [...state.inventory, 'maintenance-key'];
        state.objectStates.stoppedClock = 'collected';
        addEvidence(state, actor, { id: 'maintenance-key', title: 'Maintenance key', location: 'Stopped wall clock — Future', type: 'evidence', content: 'A maintenance key was hidden behind the stopped clock.', inference: 'It opens the reception desk drawer in the Past.', relatedObjective: 'Challenge 1 — The Missing Key', verified: true }, 30);
        message = 'Maintenance key collected. It is now in the shared team inventory.';
        maybeAdvance(state);
      }
    } else if (state.currentChallenge === 2 && actor === 'archivist' && objectId === 'desk') {
      if (!state.inventory.includes('maintenance-key') && !state.subtasks.drawerUnlocked) message = 'The desk drawer is locked. The Tracker must recover the maintenance key first.';
      else if (!state.subtasks.drawerUnlocked) {
        state.subtasks.drawerUnlocked = true;
        state.inventory = state.inventory.filter((item) => item !== 'maintenance-key');
        state.objectStates.desk = 'unlocked';
        message = 'The Archivist uses the maintenance key. The desk drawer opens.';
      } else if (!state.subtasks.originalReportCollected) {
        state.subtasks.originalReportCollected = true;
        state.objectStates.desk = 'collected';
        addEvidence(state, actor, { id: 'original-maintenance-report', title: 'Original maintenance report', location: 'Reception desk drawer — Past', type: 'evidence', content: 'Transmitter model RT-740. Original operating frequency: 740 Hz. Circuit reference S-3. Emergency warning: ground the resonance coil before isolating the output.', inference: 'The report supplies the frequency and circuit reference; a missing fragment is still required to recover the resonance mode.', relatedObjective: 'Challenge 2 — The Sealed Report', verified: false }, 45);
        message = 'Original maintenance report recovered. The Tracker still needs to find the missing fragment.';
        maybeReconstructReport(state);
      } else message = 'The original report is already recorded.';
    } else if (state.currentChallenge === 2 && actor === 'tracker' && objectId === 'reportFragment') {
      if (!state.subtasks.reportFragmentCollected) {
        state.subtasks.reportFragmentCollected = true;
        state.objectStates.reportFragment = 'collected';
        addEvidence(state, actor, { id: 'maintenance-report-fragment', title: 'Torn report fragment', location: 'Reception desk underside — Future', type: 'evidence', content: '“S-3 cancels the witness in ANTIPHASE. Never move the ground lead while the output is live.”', inference: 'The fragment completes the report and reveals the resonance mode.', relatedObjective: 'Challenge 2 — The Sealed Report', verified: false }, 45);
        maybeReconstructReport(state);
        message = 'Report fragment collected. Compare it with the Archivist’s original report.';
      } else message = 'The fragment is already in the shared evidence record.';
    } else if (state.currentChallenge === 3 && actor === 'archivist' && objectId === 'rec') {
      if (!state.subtasks.audioInspected) {
        state.subtasks.audioInspected = true;
        state.objectStates.rec = 'discovered';
        addEvidence(state, actor, { id: 'resonance-recording', title: 'Three-tone recorder', location: 'Security control room — Past', type: 'evidence', content: 'The recording meter settles at 440 Hz, 620 Hz, then a sustained 740 Hz carrier. The final tone matches the transmitter’s operating carrier.', inference: 'Decode which stable tone carries the transmitter signal.', relatedObjective: 'Challenge 3 — The Frequency', verified: false });
      }
      inputNeeded = 'frequency';
      message = 'Analyze the recording and enter the decoded frequency in Hz.';
    } else if (state.currentChallenge === 3 && actor === 'tracker' && objectId === 'transmitter') {
      if (!state.subtasks.frequencyDecoded) message = 'The transmitter dial is scrambled. Wait for the Archivist to decode the recording.';
      else {
        state.subtasks.transmitterDialInspected = true;
        state.objectStates.transmitter = 'available';
        inputNeeded = 'frequency';
        message = 'Enter the decoded operating frequency in Hz.';
      }
    } else if (state.currentChallenge === 4 && actor === 'archivist' && objectId === 'circuitDiagram') {
      state.subtasks.circuitDiagramInspected = true;
      state.objectStates.circuitDiagram = 'discovered';
      addEvidence(state, actor, { id: 'original-circuit-diagram', title: 'Original circuit diagram', location: 'Research laboratory — Past', type: 'evidence', content: 'The surviving arrows run from the power bus into C, from C into the resonance coil, then from the coil to the terminal marked OUTPUT.', inference: 'Translate the diagram marks into the installation order and communicate it to the Tracker.', relatedObjective: 'Challenge 4 — The Broken Circuit', verified: false });
      inputNeeded = 'circuit';
      message = 'Submit the historical wiring order.';
    } else if (state.currentChallenge === 4 && actor === 'tracker' && objectId === 'panel') {
      if (!state.subtasks.wiringValidated) message = 'The panel is unsafe until the Archivist validates the original wiring diagram.';
      else {
        state.subtasks.panelOpened = true;
        state.objectStates.panel = 'unlocked';
        message = state.components.length < 3 ? 'Panel opened. Search the nearby Future service alcove for the three missing components.' : 'All components recovered. Arrange them in the validated order.';
        if (state.components.length === 3) inputNeeded = 'circuit';
      }
    } else if (state.currentChallenge === 4 && actor === 'tracker' && ['componentCapacitor', 'componentCoil', 'componentOutput'].includes(objectId)) {
      if (!state.subtasks.panelOpened) message = 'The panel is still sealed. Wait for the Archivist’s wiring deduction.';
      else {
        const component = objectId === 'componentCapacitor' ? 'capacitor' : objectId === 'componentCoil' ? 'resonance-coil' : 'output';
        if (!state.components.includes(component)) state.components.push(component);
        state.objectStates[objectId] = 'collected';
        state.subtasks.componentsCollected = state.components.length === 3;
        message = `${component.replace('-', ' ')} recovered (${state.components.length}/3).`;
        if (state.components.length === 3) message += ' Return to the panel to configure the circuit.';
      }
    } else if (state.currentChallenge === 5 && actor === 'archivist' && objectId === 'calibrationConsole') {
      if (state.subtasks.calibrationValidated && state.subtasks.transmitterConfigured) {
        state.subtasks.archivistConfigurationConfirmed = true;
        message = 'Archivist confirms the historical configuration.';
        maybeAdvance(state);
      } else {
        state.subtasks.calibrationConsoleInspected = true;
        state.objectStates.calibrationConsole = 'available';
        addEvidence(state, actor, { id: 'historical-calibration', title: 'Calibration instructions', location: 'Observation chamber console — Past', type: 'observation', content: 'The archived calibration references report S-3 and requires phase inversion before shutdown.', inference: 'Confirm the historic calibration from the combined report.', relatedObjective: 'Challenge 5 — The Resonance Configuration', verified: false });
        inputNeeded = 'configuration';
        message = 'Validate the historical calibration using the reconstructed report.';
      }
    } else if (state.currentChallenge === 5 && actor === 'tracker' && objectId === 'transmitter') {
      if (state.subtasks.transmitterConfigured) {
        state.subtasks.trackerConfigurationConfirmed = true;
        message = 'Tracker confirms the physical configuration.';
        maybeAdvance(state);
      } else if (!state.subtasks.calibrationValidated) message = 'The transmitter controls are locked until the Archivist validates the calibration.';
      else {
        state.subtasks.transmitterControlsAvailable = true;
        state.objectStates.transmitter = 'available';
        inputNeeded = 'configuration';
        message = 'Configure the transmitter using the recovered report.';
      }
    } else if (state.currentChallenge === 6 && actor === 'archivist' && objectId === 'shutdownConsole') {
      if (state.subtasks.archivistReady) message = activateShutdown(state, actor);
      else {
        state.subtasks.archivistReady = true;
        state.objectStates.shutdownConsole = 'activated';
        message = setReadyWindow(state);
      }
    } else if (state.currentChallenge === 6 && actor === 'tracker' && objectId === 'emergencyBreaker') {
      if (state.subtasks.trackerReady) message = activateShutdown(state, actor);
      else {
        state.subtasks.trackerReady = true;
        state.objectStates.emergencyBreaker = 'activated';
        message = setReadyWindow(state);
      }
    } else {
      message = `That object is not part of the current Hunt 1 challenge (${state.currentChallenge}/6).`;
    }
  } else if (input.type === 'submit') {
    switch (input.value && typeof input.value === 'object' ? (input.value as Record<string, unknown>).kind : input.objectId) {
      case 'riddle':
        if (state.currentChallenge !== 1 || actor !== 'archivist' || !state.subtasks.maintenanceNoteFound) message = 'The riddle is not available yet.';
        else if (state.subtasks.riddleSolved) message = 'That deduction is already verified.';
        else if (!['stopped wall clock', 'the stopped wall clock'].includes(normalize((input.value as Record<string, unknown>).answer))) message = fail(state, 'Not quite. Re-read the note and try again.', actor, 25);
        else {
          state.subtasks.riddleSolved = true;
          state.objectStates.stoppedClock = 'available';
          award(state, 'deductions', 50, actor);
          addEvidence(state, actor, { id: 'clock-deduction', title: 'Clock deduction', location: 'Reception — Past', type: 'deduction', content: 'The riddle points to the stopped wall clock.', inference: 'The maintenance key is hidden behind it in the Future.', relatedObjective: 'Challenge 1 — The Missing Key', verified: true });
          message = 'Correct. The Tracker can now inspect the stopped clock.';
        }
        break;
      case 'frequency-analysis':
        if (state.currentChallenge !== 3 || actor !== 'archivist' || !state.subtasks.audioInspected) message = 'The recording is not ready for analysis.';
        else if (state.subtasks.frequencyDecoded) message = 'The recording analysis is already verified.';
        else if (Number((input.value as Record<string, unknown>).frequency) !== 740) message = fail(state, 'That frequency does not match the recording. Try again.', actor, 25);
        else {
          state.subtasks.frequencyDecoded = true;
          state.frequency = 740;
          state.objectStates.rec = 'completed';
          award(state, 'deductions', 50, actor);
          addEvidence(state, actor, { id: 'decoded-frequency', title: 'Decoded carrier frequency', location: 'Security control room — Past', type: 'deduction', content: 'The recording resolves to 740 Hz.', inference: 'The Tracker can now set the transmitter dial.', relatedObjective: 'Challenge 3 — The Frequency', verified: true });
          message = '740 Hz validated. The Tracker can enter it at the transmitter.';
        }
        break;
      case 'transmitter-frequency':
        if (state.currentChallenge !== 3 || actor !== 'tracker' || !state.subtasks.frequencyDecoded || !state.subtasks.transmitterDialInspected) message = 'The frequency dial is not ready.';
        else if (state.subtasks.transmitterFrequencyEntered) message = 'The transmitter frequency is already set.';
        else if (Number((input.value as Record<string, unknown>).frequency) !== 740) message = fail(state, 'The dial rejects that value. Recheck the Archivist’s decoded frequency.', actor, 25);
        else {
          state.subtasks.transmitterFrequencyEntered = true;
          state.frequency = 740;
          state.objectStates.transmitter = 'completed';
          message = 'Transmitter frequency set to 740 Hz.';
          maybeAdvance(state);
        }
        break;
      case 'circuit-deduction': {
        const expected = ['power', 'capacitor', 'resonance-coil', 'output'];
        const submitted = (input.value as Record<string, unknown>).order;
        if (state.currentChallenge !== 4 || actor !== 'archivist' || !state.subtasks.circuitDiagramInspected || !Array.isArray(submitted)) message = 'The diagram is not ready for a deduction.';
        else if (state.subtasks.wiringValidated) message = 'The wiring deduction is already verified.';
        else if (JSON.stringify(submitted) !== JSON.stringify(expected)) message = fail(state, 'The diagram does not support that order. Review the wiring marks and try again.', actor, 25);
        else {
          state.subtasks.wiringValidated = true;
          award(state, 'deductions', 50, actor);
          addEvidence(state, actor, { id: 'validated-wiring-order', title: 'Validated wiring order', location: 'Research laboratory — Past', type: 'deduction', content: 'POWER → CAPACITOR → RESONANCE COIL → OUTPUT.', inference: 'The Tracker can install the recovered components in this order.', relatedObjective: 'Challenge 4 — The Broken Circuit', verified: true });
          message = 'Wiring order validated. The Tracker can open the Future panel.';
        }
        break;
      }
      case 'circuit-installation': {
        const expected = ['power', 'capacitor', 'resonance-coil', 'output'];
        const submitted = (input.value as Record<string, unknown>).order;
        if (state.currentChallenge !== 4 || actor !== 'tracker' || !state.subtasks.panelOpened || state.components.length !== 3 || !Array.isArray(submitted)) message = 'Collect all three parts and open the panel first.';
        else if (state.subtasks.circuitRestored) message = 'The circuit is already restored.';
        else if (JSON.stringify(submitted) !== JSON.stringify(expected)) message = fail(state, 'Short circuit. The parts are safe; rearrange them and retry.', actor, 25);
        else {
          state.subtasks.circuitRestored = true;
          state.objectStates.panel = 'activated';
          award(state, 'circuit', 150, actor);
          addEvidence(state, actor, { id: 'circuit-restored', title: 'Circuit restored', location: 'Electrical panel — Future', type: 'objective', content: 'The power, capacitor, resonance coil, and output are connected in the validated order.', inference: 'The transmitter is powered for calibration.', relatedObjective: 'Challenge 4 — The Broken Circuit', verified: true });
          message = 'Circuit restored. The transmitter is powered.';
          maybeAdvance(state);
        }
        break;
      }
      case 'calibration':
        if (state.currentChallenge !== 5 || actor !== 'archivist' || !state.subtasks.calibrationConsoleInspected) message = 'Inspect the historical calibration console first.';
        else if (state.subtasks.calibrationValidated) message = 'The historical calibration is already verified.';
        else if (Number((input.value as Record<string, unknown>).frequency) !== 740 || normalize((input.value as Record<string, unknown>).mode) !== 'antiphase') message = fail(state, 'The historical calibration does not match the recovered report. Try again.', actor, 25);
        else {
          state.subtasks.calibrationValidated = true;
          award(state, 'configuration', 100, actor);
          addEvidence(state, actor, { id: 'calibration-validated', title: 'Historical calibration verified', location: 'Observation chamber — Past', type: 'deduction', content: 'The report and calibration record agree on 740 Hz and ANTIPHASE.', inference: 'The Future transmitter can now be configured.', relatedObjective: 'Challenge 5 — The Resonance Configuration', verified: true });
          message = 'Historical calibration verified.';
        }
        break;
      case 'transmitter-configuration':
        if (state.currentChallenge !== 5 || actor !== 'tracker' || !state.subtasks.transmitterControlsAvailable) message = 'Wait for the Archivist to validate the calibration.';
        else if (state.subtasks.transmitterConfigured) message = 'The transmitter configuration is already validated.';
        else if (Number((input.value as Record<string, unknown>).frequency) !== 740 || normalize((input.value as Record<string, unknown>).mode) !== 'antiphase') message = fail(state, 'Configuration rejected. Check the recovered report and retry.', actor, 25);
        else {
          state.subtasks.transmitterConfigured = true;
          state.frequency = 740;
          state.resonanceMode = 'ANTIPHASE';
          state.objectStates.transmitter = 'activated';
          award(state, 'configuration', 100, actor);
          message = 'Transmitter configured. Both investigators must confirm the configuration.';
        }
        break;
      case 'configuration-confirmation':
        if (state.currentChallenge !== 5 || !state.subtasks.transmitterConfigured) message = 'The transmitter has not been configured yet.';
        else if (actor === 'archivist') {
          state.subtasks.archivistConfigurationConfirmed = true;
          message = 'Archivist confirms the historical configuration.';
          maybeAdvance(state);
        } else {
          state.subtasks.trackerConfigurationConfirmed = true;
          message = 'Tracker confirms the physical configuration.';
          maybeAdvance(state);
        }
        break;
      default:
        message = 'That submission does not match an active Hunt 1 challenge.';
    }
  } else {
    return null;
  }

  maybeAdvance(state);
  state.updatedAt = nowIso();
  db.prepare('UPDATE round3_hunt1_sessions SET state_json = ?, updated_at = ? WHERE team_id = ?').run(JSON.stringify(state), state.updatedAt, teamId);
  db.prepare('UPDATE round3_sessions SET score = ?, updated_at = ? WHERE team_id = ?').run(state.score, state.updatedAt, teamId);
  return { success: state.penalties === penaltiesBefore, message, state, input: inputNeeded, hint };
}

function maybeReconstructReport(state: Hunt1State): void {
  if (state.subtasks.originalReportCollected && state.subtasks.reportFragmentCollected && !state.subtasks.reportReconstructed) {
    state.subtasks.reportReconstructed = true;
    award(state, 'deductions', 50, 'team');
    addEvidence(state, 'team', { id: 'reconstructed-maintenance-report', title: 'Reconstructed transmitter report', location: 'Shared evidence board', type: 'deduction', content: 'RT-740 · 740 Hz · S-3 circuit · ANTIPHASE resonance. Ground the coil before isolating the output.', inference: 'The original operating frequency, circuit reference, mode, and emergency warning are now known.', relatedObjective: 'Challenge 2 — The Sealed Report', verified: true });
  }
}

function setReadyWindow(state: Hunt1State): string {
  if (state.subtasks.archivistReady && state.subtasks.trackerReady && state.syncDeadline === null) {
    state.syncDeadline = Date.now() + 10_000;
    addJournal(state, 'Shutdown window open', 'Both investigators are ready. Activate both controls before the countdown expires.', 'Final shutdown', false);
    return 'Both investigators are ready. The 10-second shutdown window is open; activate both controls now.';
  }
  return state.subtasks.archivistReady && state.subtasks.trackerReady
    ? 'Both controls are ready. Activate now.'
    : 'Control prepared. Waiting for the partner.';
}

function activateShutdown(state: Hunt1State, actor: Hunt1Actor): string {
  if (!state.subtasks.archivistReady || !state.subtasks.trackerReady || state.syncDeadline === null) return 'Both controls must be prepared before shutdown can begin.';
  const timestamp = Date.now();
  if (timestamp > state.syncDeadline) {
    penalize(state, 50, 'team');
    state.activatedBy = {};
    state.syncDeadline = null;
    state.subtasks.archivistReady = false;
    state.subtasks.trackerReady = false;
    return 'Synchronization window expired. Both investigators must prepare the controls again.';
  }
  state.activatedBy[actor] = timestamp;
  state.subtasks[actor === 'archivist' ? 'archivistActivated' : 'trackerActivated'] = true;
  if (state.activatedBy.archivist && state.activatedBy.tracker) {
    maybeAdvance(state);
    return state.completed ? 'Shutdown synchronized. The transmitter is disabled.' : 'The activations did not synchronize. Retry both controls.';
  }
  return 'Control activated. Waiting for the partner’s activation.';
}
