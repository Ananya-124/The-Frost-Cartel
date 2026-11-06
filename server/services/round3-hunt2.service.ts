import { db } from '../../database/db.ts';
import type { Hunt2ActionResult, Hunt2Actor, Hunt2Challenge, Hunt2Input, Hunt2State, Hunt2Observation } from '../../src/types/hunt2.types.ts';

db.exec(`CREATE TABLE IF NOT EXISTS round3_hunt2_sessions (
  team_id TEXT PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`);

const HINTS: Record<Hunt2Challenge, readonly [string, string]> = {
  1: ['Compare the original room outline with the four Future doors.', 'Inspect the thresholds and wall breaks; only the genuine doorway interrupts the original masonry pattern.'],
  2: ['Compare movement in the original projection with the three physical traces.', 'Focus on how an image behaves relative to its source, not on the figures’ appearance.'],
  3: ['Use the Archivist’s positions as the four-item order.', 'Use the entry and opposite wall as landmarks before placing the central furniture.'],
  4: ['Observe the rhythm in the original experiment, then compare all three reactions.', 'The genuine signal contains a pause, and its final portion repeats.'],
  5: ['Reconstruct the event order before touching the containment mechanisms.', 'Use the verified event order to reason through the three mechanism labels before readying both investigators.'],
};
const isActor = (value: unknown): value is Hunt2Actor => value === 'archivist' || value === 'tracker';
const normalize = (value: unknown): string => typeof value === 'string' ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() : '';
const nowIso = (): string => new Date().toISOString();
const freshBreakdown = () => ({ exit: 0, identity: 0, reconstruction: 0, anchor: 0, final: 0, optional: 0, penalties: 0 });

function freshState(teamId: string): Hunt2State {
  return {
    teamId, currentChallenge: 1, completed: false, subtasks: {}, objectStates: {}, observations: [], hintUses: {},
    score: 0, penalties: 0, scoreBreakdown: freshBreakdown(), doorAnswer: null, characteristic: null,
    inspectedManifestations: [], originalArrangement: [], inspectedFurniture: [], anchorPattern: null,
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
  return row ? JSON.parse(row.state_json) as Hunt2State : null;
}

function award(state: Hunt2State, category: Exclude<keyof Hunt2State['scoreBreakdown'], 'penalties'>, points: number): void {
  const caps = { exit: 150, identity: 200, reconstruction: 200, anchor: 200, final: 150, optional: 100 };
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
  if (state.currentChallenge === 1 && state.subtasks.genuineDoorIdentified && state.subtasks.genuineExitOpened) advance(state, 1, 'The genuine passage opens. Compare the three manifestations and identify the one that belongs to the original memory.');
  else if (state.currentChallenge === 2 && state.subtasks.characteristicValidated && state.subtasks.genuineManifestationSelected) advance(state, 2, 'The real manifestation is exposed. Reconstruct the original experimental room layout.');
  else if (state.currentChallenge === 3 && state.subtasks.originalArrangementSubmitted && state.subtasks.roomReconstructed) advance(state, 3, 'The room returns to its original shape. Find the genuine memory anchor.');
  else if (state.currentChallenge === 4 && state.subtasks.activationPatternValidated && state.subtasks.trueAnchorActivated) advance(state, 4, 'The entity’s true anchor is exposed. Stabilize the final memory and destroy it together.');
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

export function applyRound3Hunt2Action(teamId: string, input: { type: string; actor?: unknown; objectId?: unknown; value?: unknown }): Hunt2ActionResult | null {
  const state = getRound3Hunt2State(teamId);
  if (!state || !isActor(input.actor) || state.completed) return null;
  const penaltiesBefore = state.penalties;
  const actor = input.actor;
  const objectId = typeof input.objectId === 'string' ? input.objectId : '';
  const value = input.value && typeof input.value === 'object' ? input.value as Record<string, unknown> : {};
  let message = '';
  let inputNeeded: Hunt2Input | undefined;
  let hint: string | undefined;

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
    if (objectId === 'optionalAnomaly') {
      if (state.objectStates.optionalAnomaly === 'inspected') message = 'This anomaly is already recorded.';
      else {
        state.objectStates.optionalAnomaly = 'inspected';
        award(state, 'optional', 100);
        addObservation(state, 'tracker', 'optional-shadow-anomaly', 'Shadow without a source', 'Main hall — Future', 'A shadow crosses the floor while every nearby object remains still.', false);
        message = 'Optional anomaly recorded. +100 points.';
      }
    } else if (state.currentChallenge === 1 && actor === 'archivist' && objectId === 'memoryDoorRoom') {
      state.subtasks.originalDoorRoomInspected = true;
      state.objectStates.memoryDoorRoom = 'inspected';
      addObservation(state, actor, 'original-door-layout', 'Original room outline', 'Main hall — Past', 'The memory shows one working passage at position 3. The other wall panels are continuous masonry.', false);
      inputNeeded = 'door';
      message = 'Inspect the original layout and submit which of the four Future doors is genuine.';
    } else if (state.currentChallenge === 1 && actor === 'tracker' && /^falseDoor[1-4]$/.test(objectId)) {
      if (!state.subtasks.genuineDoorIdentified) message = 'The doors are indistinguishable. Wait for the Archivist to validate the original room layout.';
      else if (Number(objectId.slice(-1)) === state.doorAnswer) {
        state.subtasks.genuineExitOpened = true;
        state.objectStates[objectId] = 'opened';
        award(state, 'exit', 150);
        addObservation(state, actor, 'genuine-exit-opened', 'Genuine passage', 'Main hall — Future', 'The selected doorway opens onto the facility corridor; its geometry matches the Past memory.', true);
        message = 'The genuine passage opens. The false doors collapse.';
        maybeAdvance(state);
      } else {
        state.objectStates[objectId] = 'dispelled';
        state.entityState.falseCorridorUntil = Date.now() + 2_500;
        penalize(state, 25);
        message = 'The doorway unfolds into a false corridor, then folds back into the room. Try another door.';
      }
    } else if (state.currentChallenge === 2 && actor === 'archivist' && objectId === 'identityMemory') {
      state.subtasks.manifestationMemoryViewed = true;
      state.objectStates.identityMemory = 'inspected';
      addObservation(state, actor, 'manifestation-memory', 'Movement in the projection', 'Security control room — Past', 'In the original projection, one figure moves normally while its reflected movement reverses direction.', false);
      inputNeeded = 'characteristic';
      message = 'Submit the characteristic that distinguishes the real manifestation.';
    } else if (state.currentChallenge === 2 && actor === 'tracker' && ['manifestationA', 'manifestationB', 'manifestationC'].includes(objectId)) {
      const traces: Record<string, string> = { manifestationA: 'No shadow falls beneath this figure.', manifestationB: 'Its reflection moves in the opposite direction.', manifestationC: 'A normal footprint trail continues behind it.' };
      if (!state.inspectedManifestations.includes(objectId)) state.inspectedManifestations.push(objectId);
      state.objectStates[objectId] = 'inspected';
      addObservation(state, actor, `trace-${objectId}`, `Trace at manifestation ${objectId.slice(-1)}`, 'Experiment chamber — Future', traces[objectId], false);
      if (state.subtasks.characteristicValidated && state.inspectedManifestations.length === 3) inputNeeded = 'manifestation';
      message = state.inspectedManifestations.length === 3 ? 'All three traces are recorded. Match the verified characteristic to one manifestation.' : `Physical trace recorded (${state.inspectedManifestations.length}/3). Inspect the others.`;
    } else if (state.currentChallenge === 3 && actor === 'archivist' && objectId === 'layoutMemory') {
      state.subtasks.originalLayoutViewed = true;
      state.objectStates.layoutMemory = 'inspected';
      addObservation(state, actor, 'original-furniture-layout', 'Original furniture positions', 'Experimental room — Past', 'The chair stood by the entry, the mirror opposite it, the table in the center, and the experimental lamp at the far wall.', false);
      inputNeeded = 'arrangement';
      message = 'Confirm the original four-object arrangement.';
    } else if (state.currentChallenge === 3 && actor === 'tracker' && ['layoutChair', 'layoutMirror', 'layoutTable', 'layoutLamp'].includes(objectId)) {
      if (!state.inspectedFurniture.includes(objectId)) state.inspectedFurniture.push(objectId);
      state.objectStates[objectId] = 'inspected';
      const label = objectId.replace('layout', '');
      addObservation(state, actor, `displaced-${objectId}`, `Displaced ${label.toLowerCase()}`, 'Experimental room — Future', 'This object is displaced from its original floor mark.', false);
      message = `Displaced object inspected (${state.inspectedFurniture.length}/4).`;
      if (state.subtasks.originalArrangementSubmitted && state.inspectedFurniture.length === 4) inputNeeded = 'arrangement';
    } else if (state.currentChallenge === 4 && actor === 'archivist' && objectId === 'anchorMemory') {
      state.subtasks.anchorSequenceViewed = true;
      state.objectStates.anchorMemory = 'inspected';
      addObservation(state, actor, 'original-anchor-pattern', 'Original activation rhythm', 'Containment chamber — Past', 'One anchor in the experiment emitted a repeated signal with a pause in the middle.', false);
      inputNeeded = 'anchor-pattern';
      message = 'Identify the activation pattern from the original experiment.';
    } else if (state.currentChallenge === 4 && actor === 'tracker' && ['memoryAnchorA', 'memoryAnchorB', 'memoryAnchorC'].includes(objectId)) {
      if (state.entityState.trueAnchorHiddenUntil && state.entityState.trueAnchorHiddenUntil > Date.now()) message = 'The room distortion is still settling. The anchors will become inspectable again shortly.';
      else {
        if (!state.inspectedAnchors.includes(objectId)) state.inspectedAnchors.push(objectId);
        state.objectStates[objectId] = 'inspected';
        const reactions: Record<string, string> = { memoryAnchorA: 'A single flash fades without a return pulse.', memoryAnchorB: 'Two quick flashes arrive without a pause.', memoryAnchorC: 'A pulse repeats, pauses, then returns twice.' };
        addObservation(state, actor, `anchor-reaction-${objectId}`, `Anchor ${objectId.slice(-1)} reaction`, 'Hidden chamber — Future', reactions[objectId], false);
        message = `Anchor reaction recorded (${state.inspectedAnchors.length}/3).`;
        if (state.subtasks.activationPatternValidated && state.inspectedAnchors.length === 3) inputNeeded = 'anchor';
      }
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
      case 'door':
        if (state.currentChallenge !== 1 || actor !== 'archivist' || !state.subtasks.originalDoorRoomInspected) message = 'Inspect the original room memory first.';
        else if (state.subtasks.genuineDoorIdentified) message = 'The genuine exit is already identified.';
        else if (Number(value.door) !== 3) { penalize(state, 25); message = 'That door position does not match the original memory. Compare the room outlines and retry.'; }
        else {
          state.doorAnswer = 3;
          state.subtasks.genuineDoorIdentified = true;
          state.objectStates.falseDoor3 = 'identified';
          award(state, 'exit', 150);
          addObservation(state, actor, 'validated-exit-position', 'Genuine exit identified', 'Main hall — Past', 'The Archivist matched the original passage position to the Future room.', true);
          message = 'Door position validated. Tracker can test that passage in the Future.';
        }
        break;
      case 'characteristic':
        if (state.currentChallenge !== 2 || actor !== 'archivist' || !state.subtasks.manifestationMemoryViewed) message = 'View the original manifestation memory first.';
        else if (state.subtasks.characteristicValidated) message = 'The identifying characteristic is already verified.';
        else if (normalize(value.characteristic) !== 'reversed reflection') { penalize(state, 25); message = 'That property does not fit the original movement. Rewatch the projection.'; }
        else {
          state.characteristic = 'reversed-reflection';
          state.subtasks.characteristicValidated = true;
          addObservation(state, actor, 'validated-identity-trait', 'Identity trait verified', 'Security control room — Past', 'The original memory verifies that the genuine entity has a reversed reflection.', true);
          message = 'Characteristic verified. Tracker can compare it with all three physical manifestations.';
          if (state.inspectedManifestations.length === 3) inputNeeded = 'manifestation';
        }
        break;
      case 'manifestation':
        if (state.currentChallenge !== 2 || actor !== 'tracker' || !state.subtasks.characteristicValidated || state.inspectedManifestations.length !== 3) message = 'Inspect all three manifestations and wait for the Archivist’s verified trait.';
        else if (state.subtasks.genuineManifestationSelected) message = 'The genuine manifestation is already identified.';
        else if (value.manifestation !== 'manifestationB') {
          penalize(state, 25);
          state.objectStates[String(value.manifestation)] = 'dispelled';
          state.entityState.decoyHiddenUntil = Date.now() + 2_500;
          message = 'The chosen figure dissolves into a decoy. Its place remains empty briefly; compare the verified trait again.';
        } else {
          state.subtasks.genuineManifestationSelected = true;
          state.objectStates.manifestationB = 'identified';
          award(state, 'identity', 200);
          addObservation(state, actor, 'genuine-manifestation-confirmed', 'Genuine manifestation confirmed', 'Experiment chamber — Future', 'Manifestation B matches the verified reversed-reflection trait.', true);
          message = 'The genuine entity is identified. The false figures fade.';
          maybeAdvance(state);
        }
        break;
      case 'arrangement': {
        const order = value.order;
        const expected = ['chair', 'mirror', 'table', 'lamp'];
        if (state.currentChallenge !== 3 || !Array.isArray(order)) message = 'The room arrangement is not ready for submission.';
        else if (actor === 'archivist') {
          if (!state.subtasks.originalLayoutViewed) message = 'Inspect the original room memory first.';
          else if (JSON.stringify(order) !== JSON.stringify(expected)) { penalize(state, 25); message = 'That arrangement does not match the Past memory. Review the positions and retry.'; }
          else {
            state.originalArrangement = expected;
            state.subtasks.originalArrangementSubmitted = true;
            addObservation(state, actor, 'layout-order-verified', 'Original layout verified', 'Experimental room — Past', 'The chair, mirror, table, and lamp positions are confirmed.', true);
            message = 'Original arrangement verified. Tracker can now place the four Future objects.';
            if (state.inspectedFurniture.length === 4) inputNeeded = 'arrangement';
          }
        } else if (!state.subtasks.originalArrangementSubmitted || state.inspectedFurniture.length !== 4) message = 'Inspect all four displaced objects and wait for the original arrangement.';
        else if (JSON.stringify(order) !== JSON.stringify(expected)) { penalize(state, 25); state.entityState.falseCorridorUntil = Date.now() + 1_800; message = 'The objects shift out of place. The room resets safely; use the Archivist’s verified order and retry.'; }
        else {
          state.subtasks.roomReconstructed = true;
          for (const id of ['layoutChair', 'layoutMirror', 'layoutTable', 'layoutLamp']) state.objectStates[id] = 'restored';
          award(state, 'reconstruction', 200);
          addObservation(state, actor, 'room-reconstructed', 'Original room restored', 'Experimental room — Future', 'All four objects now match their original positions. A concealed passage opens.', true);
          message = 'The original arrangement is restored. A concealed passage opens.';
          maybeAdvance(state);
        }
        break;
      }
      case 'anchor-pattern':
        if (state.currentChallenge !== 4 || actor !== 'archivist' || !state.subtasks.anchorSequenceViewed) message = 'View the original anchor sequence first.';
        else if (state.subtasks.activationPatternValidated) message = 'The activation pattern is already verified.';
        else if (normalize(value.pattern) !== 'pulse pause double pulse') { penalize(state, 25); message = 'That rhythm does not match the original event. Review the memory.'; }
        else {
          state.anchorPattern = 'pulse-pause-double-pulse';
          state.subtasks.activationPatternValidated = true;
          addObservation(state, actor, 'anchor-pattern-verified', 'Anchor pattern verified', 'Containment chamber — Past', 'The original activation rhythm is pulse, pause, then two pulses.', true);
          message = 'Pattern verified. Tracker can compare the three physical anchors.';
          if (state.inspectedAnchors.length === 3) inputNeeded = 'anchor';
        }
        break;
      case 'anchor':
        if (state.currentChallenge !== 4 || actor !== 'tracker' || !state.subtasks.activationPatternValidated || state.inspectedAnchors.length !== 3) message = 'Inspect all three anchors and wait for the Archivist’s verified pattern.';
        else if (state.subtasks.trueAnchorActivated) message = 'The true anchor has already been exposed.';
        else if (value.anchor !== 'memoryAnchorC') {
          penalize(state, 25);
          state.objectStates[String(value.anchor)] = 'dispelled';
          state.entityState.trueAnchorHiddenUntil = Date.now() + 2_500;
          message = 'The false anchor vanishes in a controlled distortion. It will reform shortly; compare its reaction to the verified pattern.';
        } else {
          state.trueAnchor = 'memoryAnchorC';
          state.subtasks.trueAnchorActivated = true;
          state.objectStates.memoryAnchorC = 'activated';
          state.objectStates.trueMemoryAnchor = 'visible';
          award(state, 'anchor', 200);
          addObservation(state, actor, 'true-anchor-exposed', 'True memory anchor exposed', 'Hidden chamber — Future', 'The anchor’s reaction matches the Past activation pattern. The entity’s true form emerges.', true);
          message = 'The true anchor is exposed. The entity’s false disguises collapse.';
          maybeAdvance(state);
        }
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

  maybeAdvance(state);
  state.updatedAt = nowIso();
  db.prepare('UPDATE round3_hunt2_sessions SET state_json = ?, updated_at = ? WHERE team_id = ?').run(JSON.stringify(state), state.updatedAt, teamId);
  return { success: state.penalties === penaltiesBefore, message, state, input: inputNeeded, hint };
}
