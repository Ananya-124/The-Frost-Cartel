import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { createEngineRefs, useGameEngine } from '../../hooks/useGameEngine';
import { useGameSnapshot } from '../../hooks/useGameSnapshot';
import { GameStore } from '../../engine/state/store';
import { restoreGameState } from '../../engine/state/restoreGameState';
import SplitScreen from '../canvas/SplitScreen';
import HuntIntro from '../overlays/HuntIntro';
import EndScreen from './EndScreen';
import MenuScreen from './MenuScreen';
import { CompletionToast, type ToastData } from '../hud/CompletionToast';
import { soundFx } from '../../audio/soundfx';
import type { Round3InventoryItem, Round3RunState } from '../../../../../../types/round3.types';
import type { HuntProgress } from '../../../../../../services/progressionService';
import type { ClueRecord, PowerCard, GameState, InteractableObject, PlayerIndex } from '../../types';
import type { Round3CardId } from '../../../../../../constants/round3.cards';
import { round3Service } from '../../../../../../services/round3Service';
import type { Hunt1ActionResult, Hunt1Actor, Hunt1Evidence, Hunt1State } from '../../../../../../types/hunt1.types';
import Hunt1Progress from '../hunt1/Hunt1Progress';
import { getHunt1TaskCompletions, shouldApplyHunt1State } from '../hunt1/hunt1StateSync';
import type { Hunt2ActionResult, Hunt2Actor, Hunt2Input, Hunt2Observation, Hunt2State } from '../../../../../../types/hunt2.types';
import Hunt2Progress from './Hunt2Progress';
import type { Hunt3ActionResult, Hunt3Actor, Hunt3Evidence, Hunt3State } from '../../../../../../types/hunt3.types';
import Hunt3Progress from './Hunt3Progress';
import { useRound3RunTimer } from '../../hooks/useRound3RunTimer';
import type { TestPowerCardId } from '../../testingCards';
import { markTeamCardUsed } from '../../usedCardsStore';
import { HUNT1_CLUES, HUNT2_CLUES, HUNT3_CLUES } from '../../config/clueCatalog';

interface GameScreenProps {
  teamId: string;
  teamName: string;
  cards: PowerCard[];
  inventory: readonly Round3InventoryItem[];
  savedGameState: unknown;
  initialRun: Round3RunState;
  huntProgression: readonly HuntProgress[];
  onProgressionRefresh?: () => void | Promise<unknown>;
  onExit: () => void;
  onSaveGameState: (gameState: GameState) => Promise<unknown>;
  onComplete: () => Promise<unknown>;
  externalError?: string;
  testingCardIds: readonly TestPowerCardId[];
  onToggleTestingCard: (id: TestPowerCardId) => void;
  onTestingCardUsed: (id: TestPowerCardId) => void;
}

const GAME_STATE_CHECKPOINT_INTERVAL_MS = 45_000;

export default function GameScreen({
  teamId,
  teamName,
  cards,
  inventory,
  savedGameState,
  initialRun,
  huntProgression,
  onProgressionRefresh,
  onExit,
  onSaveGameState,
  onComplete,
  externalError = '',
  testingCardIds,
  onToggleTestingCard,
  onTestingCardUsed,
}: GameScreenProps) {
  const [store] = useState(() => new GameStore());
  const [refs] = useState(createEngineRefs);
  const [initialState] = useState(() => restoreGameState(savedGameState, teamName, cards));
  const [cardError, setCardError] = useState('');
  const [chronoFreezeActive, setChronoFreezeActive] = useState(false);
  const chronoTimeout = useRef<number | null>(null);

  // Hunt states
  const [hunt1, setHunt1] = useState<Hunt1State | null>(null);
  const [hunt1Message, setHunt1Message] = useState('');
  const [hunt1Working, setHunt1Working] = useState(false);

  const [hunt2, setHunt2] = useState<Hunt2State | null>(null);
  const [hunt2Message, setHunt2Message] = useState('');
  const [hunt2Working, setHunt2Working] = useState(false);
  const [pendingHunt2Input, setPendingHunt2Input] = useState<{ actor: Hunt2Actor; kind: Hunt2Input } | null>(null);

  const [hunt3, setHunt3] = useState<Hunt3State | null>(null);
  const [hunt3Message, setHunt3Message] = useState('');
  const [hunt3Working, setHunt3Working] = useState<[boolean, boolean]>([false, false]);

  // HUD feedback toasts
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const timer = useRound3RunTimer(initialRun);
  const timerStatusRef = useRef(timer.run.status);
  timerStatusRef.current = timer.run.status;

  const hunt3InFlight = useRef<[boolean, boolean]>([false, false]);

  const prevHunt2Score = useRef(0);
  const prevHunt3Score = useRef(0);
  const hunt1StateRef = useRef<Hunt1State | null>(null);
  const progressionCompletionSeen = useRef([false, false, false]);

  const hunt3CompletionHandled = useRef(false);
  const completionStarted = useRef(false);
  const terminalRequestInFlight = useRef(false);
  const timerEndedByServer = useRef(false);
  const firstEntryHandled = useRef(false);
  const previousIntro = useRef(false);
  const resumeAfterTransition = useRef(false);

  const cardUseHandler = useCallback((slot: number, execute: () => boolean) => {
    const card = store.state.cards[slot];
    if (card?.effect === 'chrono-freeze') {
      if (timerStatusRef.current !== 'running') { setCardError('Chrono Freeze requires a running Round 3 task timer.'); return; }
      void timer.pause().then(() => {
        if (!execute()) { void timer.resume(); return; }
        if (card.cardId) markTeamCardUsed(teamName, card.cardId);
        setCardError('');
        setChronoFreezeActive(true);
        chronoTimeout.current = window.setTimeout(() => {
          void timer.resume().finally(() => setChronoFreezeActive(false));
          chronoTimeout.current = null;
        }, 10_000);
      }).catch(() => setCardError('Chrono Freeze could not pause the task timer. The card was not spent.'));
      return;
    }
    if (!execute()) return;
    if (card?.cardId) {
      markTeamCardUsed(teamName, card.cardId);
    }
    if (card?.source === 'testing') {
      if (card.cardId) onTestingCardUsed(card.cardId as TestPowerCardId);
      return;
    }
    if (!card?.cardId) return;
    setCardError('');
    // Notify server asynchronously if item is a server inventory item, but never cancel client effect
    void round3Service.activateCard(card.cardId as Round3CardId, card.source).catch(() => undefined);
  }, [onTestingCardUsed, store, teamName, timer.pause, timer.resume]);

  const syncHunt1State = useCallback((next: Hunt1State) => {
    const previous = hunt1StateRef.current;
    if (!shouldApplyHunt1State(previous, next)) return;
    hunt1StateRef.current = next;
    setHunt1(next);
    if (next.completed && !progressionCompletionSeen.current[0]) { progressionCompletionSeen.current[0] = true; void onProgressionRefresh?.(); }
    for (const completion of getHunt1TaskCompletions(previous, next)) {
      soundFx.taskComplete();
      addToast({ type: 'task', ...completion });
    }

    if (store.state.huntIndex !== 0) return;
    const journal = next.journal.map((entry) => ({
      title: entry.title,
      text: `${entry.content}\nWhy it matters: ${entry.inference}`,
      huntIndex: 0 as const,
      discoveredBy: entry.discoveredBy === 'tracker' ? ('Tracker' as const) : ('Archivist' as const),
      timeline: entry.discoveredBy === 'tracker' ? ('future' as const) : ('past' as const),
      timestamp: new Date(entry.createdAt).toLocaleTimeString(),
    }));
    const powered = next.subtasks.circuitRestored === true && !next.completed;
    const hasDecodedTape = next.subtasks.frequencyDecoded === true;

    if (
      store.state.score !== next.score ||
      JSON.stringify(store.state.journal) !== JSON.stringify(journal) ||
      store.state.flags.power !== powered ||
      store.state.flags.tape !== hasDecodedTape ||
      store.state.hunt1Challenge !== next.currentChallenge ||
      JSON.stringify(store.state.hunt1AvailableInteractables ?? []) !== JSON.stringify(next.availableInteractables) ||
      (next.completed && store.state.entities.some((entity) => !entity.gone))
    ) {
      store.replaceState({
        ...store.state,
        score: next.score,
        huntScores: [next.score, store.state.huntScores[1], store.state.huntScores[2]],
        hunt1Challenge: next.currentChallenge,
        hunt1AvailableInteractables: next.availableInteractables,
        flags: { ...store.state.flags, power: powered, tape: hasDecodedTape },
        surgeTimer: next.completed ? 0 : store.state.surgeTimer,
        distortion: next.completed ? 0 : store.state.distortion,
        journal,
        entities: next.completed ? store.state.entities.map((entity) => ({ ...entity, gone: true })) : store.state.entities,
      });
    }
  }, [addToast, onProgressionRefresh, store]);

  const hunt1Interaction = useCallback((index: PlayerIndex, object: InteractableObject) => {
    const actor: Hunt1Actor = index === 0 ? 'archivist' : 'tracker';
    const clueDef = HUNT1_CLUES[object.id];
    const clueTitle = clueDef?.title ?? object.name;
    const clueContent = clueDef?.content ?? 'Inspected clue item.';
    const clueInference = clueDef?.inference ?? 'Provides historical context on the incident.';
    const clueLocation = clueDef?.location ?? `${object.name} · ${object.timeline}`;

    soundFx.clueFound();

    // 1. Immediately update hunt1 state locally with ZERO latency
    setHunt1((prev) => {
      if (!prev) return prev;
      const alreadyExamined = prev.subtasks[object.id] === true;
      const pointsDelta = (!alreadyExamined && clueDef?.points) ? clueDef.points : 0;
      const newScore = prev.score + pointsDelta;
      const updatedSubtasks: Record<string, boolean> = { ...prev.subtasks, [object.id]: true };
      const updatedObjectStates: Record<string, 'hidden' | 'available' | 'examined' | 'completed'> = {
        ...prev.objectStates,
        [object.id]: 'examined',
      };
      const journalEntry: Hunt1Evidence = {
        id: object.id,
        title: clueTitle,
        location: clueLocation,
        content: clueContent,
        inference: clueInference,
        discoveredBy: actor,
        type: 'evidence',
        relatedObjective: 'task',
        verified: true,
        createdAt: new Date().toISOString(),
      };
      const updatedJournal: Hunt1Evidence[] = prev.journal.some((e) => e.id === object.id)
        ? prev.journal
        : [...prev.journal, journalEntry];

      return {
        ...prev,
        score: newScore,
        subtasks: updatedSubtasks,
        objectStates: updatedObjectStates,
        journal: updatedJournal,
      };
    });

    // 2. Immediately add to shared store journal for Q/P instant viewing
    const journalRecord: ClueRecord = {
      title: clueTitle,
      text: `${clueContent}\nWhy it matters: ${clueInference}`,
      huntIndex: 0,
      discoveredBy: actor === 'tracker' ? 'Tracker' : 'Archivist',
      timeline: actor === 'tracker' ? 'future' : 'past',
      timestamp: new Date().toLocaleTimeString(),
    };
    if (!store.state.journal.some((e) => e.title === clueTitle)) {
      store.state.journal.push(journalRecord);
      store.emit();
    }

    // 3. Immediately show toast and message
    setHunt1Message(clueContent);
    addToast({
      type: 'clue',
      title: object.name,
      message: clueContent,
    });

    // 4. Background fire-and-forget sync to server (never locks user input)
    void round3Service.hunt1Action({ type: 'interact', actor, objectId: object.id }).then((result) => {
      if (result.state) syncHunt1State(result.state);
    }).catch(() => undefined);
  }, [addToast, store, syncHunt1State]);

  const syncHunt2State = useCallback((next: Hunt2State) => {
    setHunt2(next);
    if (next.completed && !progressionCompletionSeen.current[1]) { progressionCompletionSeen.current[1] = true; void onProgressionRefresh?.(); }
    if (next.score > prevHunt2Score.current) {
      const delta = next.score - prevHunt2Score.current;
      soundFx.taskComplete();
      addToast({
        type: 'task',
        title: 'Hunt II Memory Reconstructed',
        points: delta,
        message: 'Synchronized memory recorded on server.',
      });
      prevHunt2Score.current = next.score;
    }

    const hunt2Journal: ClueRecord[] = next.observations
      .filter((entry) => entry.discoveredBy !== 'team')
      .map((entry) => ({
        id: `hunt2-${entry.id}`,
        title: entry.title,
        text: entry.content,
        huntIndex: 1,
        discoveredBy: entry.discoveredBy === 'tracker' ? 'Tracker' : 'Archivist',
        timeline: entry.discoveredBy === 'tracker' ? 'future' : 'past',
        timestamp: new Date(entry.createdAt).toLocaleTimeString(),
      }));
    const journal: ClueRecord[] = [
      ...store.state.journal.filter((entry) => entry.huntIndex !== 1),
      ...hunt2Journal,
    ];

    if (store.state.huntIndex !== 1) return;
    const baseScore = store.state.score - (store.state.huntScores[1] ?? 0);
    const flags = {
      ...store.state.flags,
      power: true,
      shelf: next.subtasks.roomReconstructed === true,
      anchor: next.subtasks.trueAnchorActivated === true,
    };
    const hidden: Record<string, number> = {};
    for (const [id, objectState] of Object.entries(next.objectStates)) {
      const until = id.startsWith('memoryAnchor') ? next.entityState.trueAnchorHiddenUntil : null;
      if (objectState === 'dispelled' && until && until > Date.now()) {
        hidden[id] = store.state.time + (until - Date.now()) / 1000;
      }
    }
    if (
      store.state.huntScores[1] !== next.score ||
      JSON.stringify(store.state.flags) !== JSON.stringify(flags) ||
      JSON.stringify(store.state.hunt2HiddenInteractablesUntil ?? {}) !== JSON.stringify(hidden) ||
      JSON.stringify(store.state.hunt2ObjectStates ?? {}) !== JSON.stringify(next.objectStates) ||
      JSON.stringify(store.state.hunt2Subtasks ?? {}) !== JSON.stringify(next.subtasks) ||
      JSON.stringify(store.state.journal) !== JSON.stringify(journal) ||
      store.state.hunt2Challenge !== next.currentChallenge ||
      store.state.hunt2Complete !== next.completed ||
      (next.completed && store.state.entities.some((entity) => !entity.gone))
    ) {
      store.replaceState({
        ...store.state,
        score: baseScore + next.score,
        huntScores: [store.state.huntScores[0], next.score, store.state.huntScores[2]],
        flags,
        hunt2HiddenInteractablesUntil: hidden,
        hunt2ObjectStates: next.objectStates,
        hunt2Subtasks: next.subtasks,
        hunt2Challenge: next.currentChallenge,
        hunt2Complete: next.completed,
        journal,
        distortion: next.completed ? 0 : store.state.distortion,
        entities: next.completed ? store.state.entities.map((entity) => ({ ...entity, gone: true })) : store.state.entities,
      });
    }
  }, [addToast, onProgressionRefresh, store]);

  const hunt2Interaction = useCallback((index: PlayerIndex, object: InteractableObject) => {
    const actor: Hunt2Actor = index === 0 ? 'archivist' : 'tracker';
    const clueDef = HUNT2_CLUES[object.id];
    const clueTitle = clueDef?.title ?? object.name;
    const clueContent = clueDef?.content ?? 'Inspected memory archive item.';
    const clueLocation = clueDef?.location ?? `${object.name} · ${object.timeline}`;

    soundFx.clueFound();

    // 1. Immediately update hunt2 state locally with ZERO latency
    setHunt2((prev) => {
      if (!prev) return prev;
      const updatedSubtasks: Record<string, boolean> = { ...prev.subtasks, [object.id]: true };
      const updatedObjectStates: Record<string, 'hidden' | 'visible' | 'inspected' | 'identified' | 'opened' | 'restored' | 'activated' | 'destroyed' | 'dispelled'> = {
        ...prev.objectStates,
        [object.id]: 'inspected',
      };
      const newObs: Hunt2Observation = {
        id: object.id,
        title: clueTitle,
        location: clueLocation,
        content: clueContent,
        discoveredBy: actor,
        verified: false,
        challenge: prev.currentChallenge,
        createdAt: new Date().toISOString(),
      };
      const updatedObservations: Hunt2Observation[] = prev.observations.some((o) => o.id === object.id)
        ? prev.observations
        : [...prev.observations, newObs];

      const brokenMemory = { ...prev.brokenMemory };
      if (object.id.startsWith('brokenArchive') && !brokenMemory.archivistEvidence.includes(object.id)) {
        brokenMemory.archivistEvidence = [...brokenMemory.archivistEvidence, object.id];
      }
      if ((object.id.startsWith('brokenMemory') || object.id.startsWith('brokenProjection') || object.id.startsWith('brokenKeepsake')) && !brokenMemory.trackerEvidence.includes(object.id)) {
        brokenMemory.trackerEvidence = [...brokenMemory.trackerEvidence, object.id];
      }

      const memoryAnchor = { ...prev.memoryAnchor };
      if (object.id === 'anchorFlowRecord' && !memoryAnchor.archivistEvidence.includes('flow')) {
        memoryAnchor.archivistEvidence = [...memoryAnchor.archivistEvidence, 'flow'];
      }
      if (object.id.startsWith('memoryAnchor') || object.id === 'anchorNodeD') {
        const nodeLetter = object.id.slice(-1);
        if (!memoryAnchor.trackerEvidence.includes(nodeLetter)) {
          memoryAnchor.trackerEvidence = [...memoryAnchor.trackerEvidence, nodeLetter];
        }
      }

      return {
        ...prev,
        subtasks: updatedSubtasks,
        objectStates: updatedObjectStates,
        observations: updatedObservations,
        brokenMemory,
        memoryAnchor,
      };
    });

    // 2. Immediately add to shared store journal
    const journalRecord: ClueRecord = {
      id: `hunt2-${object.id}`,
      title: clueTitle,
      text: clueContent,
      huntIndex: 1,
      discoveredBy: actor === 'tracker' ? 'Tracker' : 'Archivist',
      timeline: actor === 'tracker' ? 'future' : 'past',
      timestamp: new Date().toLocaleTimeString(),
    };
    if (!store.state.journal.some((e) => e.title === clueTitle)) {
      store.state.journal.push(journalRecord);
      store.emit();
    }

    // 3. Immediately show toast and message
    setHunt2Message(clueContent);
    addToast({
      type: 'clue',
      title: object.name,
      message: clueContent,
    });

    // 4. Background fire-and-forget sync to backend
    void round3Service.hunt2Action({ type: 'interact', actor, objectId: object.id }).then((result) => {
      if (result.state) syncHunt2State(result.state);
      if (result.input) setPendingHunt2Input({ actor, kind: result.input });
      if (result.message) setHunt2Message(result.message);
    }).catch(() => undefined);
  }, [addToast, store, syncHunt2State]);

  const syncHunt3State = useCallback((next: Hunt3State) => {
    setHunt3(next);
    if (next.completed && !progressionCompletionSeen.current[2]) { progressionCompletionSeen.current[2] = true; void onProgressionRefresh?.(); }
    if (next.score > prevHunt3Score.current) {
      const delta = next.score - prevHunt3Score.current;
      soundFx.taskComplete();
      addToast({
        type: 'stage',
        title: `Hunt III Stage ${next.stage} Advanced`,
        points: delta,
        message: 'Containment sequence updated on server.',
      });
      prevHunt3Score.current = next.score;
    }

    if (store.state.huntIndex !== 2) return;
    const hunt3Journal: ClueRecord[] = next.journal
      .filter((entry) => entry.actor !== 'team')
      .map((entry) => ({
        id: `hunt3-${entry.id}`,
        title: entry.title,
        text: `${entry.content}${entry.verified ? '\nVerified evidence.' : ''}`,
        huntIndex: 2,
        discoveredBy: entry.actor === 'tracker' ? 'Tracker' : 'Archivist',
        timeline: entry.actor === 'tracker' ? 'future' : 'past',
        timestamp: new Date(entry.createdAt ?? next.updatedAt).toLocaleTimeString(),
      }));
    // Older Hunt III saves can contain inspected evidence without journal rows.
    // Rebuild those entries from the server-confirmed evidence lists so clues
    // already collected before this journal sync was added are not lost.
    for (const actor of ['archivist', 'tracker'] as const) {
      for (const id of next.evidence[actor]) {
        if (hunt3Journal.some((entry) => entry.id === `hunt3-${id}`)) continue;
        const title = id
          .split('-')
          .map((word) => word ? word[0].toUpperCase() + word.slice(1) : word)
          .join(' ');
        hunt3Journal.push({
          id: `hunt3-${id}`,
          title,
          text: 'This clue was inspected and recorded during the Hunt III investigation.',
          huntIndex: 2,
          discoveredBy: actor === 'tracker' ? 'Tracker' : 'Archivist',
          timeline: actor === 'tracker' ? 'future' : 'past',
          timestamp: new Date(next.updatedAt).toLocaleTimeString(),
        });
      }
    }
    const journal: ClueRecord[] = [
      ...store.state.journal.filter((entry) => entry.huntIndex !== 2),
      ...hunt3Journal,
    ];
    const base = store.state.score - (store.state.huntScores[2] ?? 0);
    const entityVisible = next.trail.resolved || next.stage > 1;
    const entities = store.state.entities.map((entity) => ({ ...entity, gone: !entityVisible }));
    if (
      store.state.huntScores[2] !== next.score ||
      JSON.stringify(store.state.entities) !== JSON.stringify(entities) ||
      JSON.stringify(store.state.journal) !== JSON.stringify(journal) ||
      store.state.hunt3Stage !== next.stage ||
      store.state.hunt3Complete !== next.completed ||
      store.state.hunt3LureActive !== (next.weakness.lure > 0)
    ) {
      store.replaceState({
        ...store.state,
        score: base + next.score,
        huntScores: [store.state.huntScores[0], store.state.huntScores[1], next.score],
        journal,
        entities,
        hunt3Stage: next.stage,
        hunt3Complete: next.completed,
        hunt3EntityVisible: entityVisible,
        hunt3LureActive: next.weakness.lure > 0,
      });
    }
  }, [addToast, onProgressionRefresh, store]);

  const hunt3Interaction = useCallback((index: PlayerIndex, object: InteractableObject) => {
    const actor: Hunt3Actor = index === 0 ? 'archivist' : 'tracker';
    const clueDef = HUNT3_CLUES[object.id];
    const clueTitle = clueDef?.title ?? object.name;
    const clueContent = clueDef?.content ?? 'Inspected containment seal station.';

    soundFx.clueFound();

    // 1. Immediately update hunt3 state locally with ZERO latency
    setHunt3((prev) => {
      if (!prev) return prev;
      const currentActorEvidence = prev.evidence[actor] ?? [];
      const updatedActorEvidence = currentActorEvidence.includes(object.id)
        ? currentActorEvidence
        : [...currentActorEvidence, object.id];
      const updatedEvidence = {
        ...prev.evidence,
        [actor]: updatedActorEvidence,
      };
      const newJournalEntry: Hunt3Evidence = {
        id: object.id,
        stage: prev.stage,
        actor,
        title: clueTitle,
        location: object.name,
        content: clueContent,
        relatedObjective: 'containment',
        verified: true,
        createdAt: new Date().toISOString(),
      };
      const updatedJournal: Hunt3Evidence[] = prev.journal.some((j) => j.id === object.id)
        ? prev.journal
        : [...prev.journal, newJournalEntry];

      return {
        ...prev,
        evidence: updatedEvidence,
        journal: updatedJournal,
      };
    });

    // 2. Immediately add to shared store journal
    const journalRecord: ClueRecord = {
      id: `hunt3-${object.id}`,
      title: clueTitle,
      text: `${clueContent}\nVerified evidence.`,
      huntIndex: 2,
      discoveredBy: actor === 'tracker' ? 'Tracker' : 'Archivist',
      timeline: actor === 'tracker' ? 'future' : 'past',
      timestamp: new Date().toLocaleTimeString(),
    };
    if (!store.state.journal.some((e) => e.title === clueTitle)) {
      store.state.journal.push(journalRecord);
      store.emit();
    }

    // 3. Immediately show toast and message
    setHunt3Message(clueContent);
    addToast({
      type: 'clue',
      title: object.name,
      message: clueContent,
    });

    // 4. Background fire-and-forget sync to backend
    void round3Service.hunt3Action(actor, { type: 'interact', id: object.id }).then((result) => {
      if (result.state) syncHunt3State(result.state);
      if (result.message) setHunt3Message(result.message);
    }).catch(() => undefined);
  }, [addToast, store, syncHunt3State]);

  const engine = useGameEngine(store, refs, cardUseHandler, initialState, hunt1Interaction, hunt2Interaction, hunt3Interaction);
  const snapshot = useGameSnapshot(store);

  useEffect(() => {
    engine?.setGameplayEnabled(snapshot.phase === 'playing' && !snapshot.huntIntro && (timer.gameplayEnabled || chronoFreezeActive));
  }, [engine, snapshot.phase, snapshot.huntIntro, timer.gameplayEnabled, chronoFreezeActive]);

  useEffect(() => () => {
    if (chronoTimeout.current !== null) window.clearTimeout(chronoTimeout.current);
  }, []);

  const enterGameplay = useCallback(async () => {
    try {
      await timer.ensureRunning();
    } catch {
      /* The timer hook keeps controls locked and exposes a reconnect action. */
    }
  }, [timer.ensureRunning]);

  useEffect(() => {
    const introShowing = snapshot.phase === 'playing' && snapshot.huntIntro !== null;
    if (snapshot.phase === 'playing' && !introShowing && !firstEntryHandled.current) {
      firstEntryHandled.current = true;
      if (timer.run.status !== 'paused') void enterGameplay();
    } else if (previousIntro.current && !introShowing && snapshot.phase === 'playing' && resumeAfterTransition.current) {
      resumeAfterTransition.current = false;
      void enterGameplay();
    }
    previousIntro.current = introShowing;
  }, [snapshot.phase, snapshot.huntIntro, enterGameplay, timer.run.status]);

  useEffect(() => {
    if (timer.run.status !== 'expired' || !engine || terminalRequestInFlight.current || timerEndedByServer.current) return;
    engine.setGameplayEnabled(false);
    terminalRequestInFlight.current = true;
    void round3Service
      .getState()
      .then((result) => {
        timerEndedByServer.current = true;
        engine.endWithServerScore(result.session.score);
      })
      .catch((reason: unknown) => {
        timer.setError(
          reason instanceof Error
            ? `Time expired. Reconnecting to preserve the final score: ${reason.message}`
            : 'Time expired. Reconnecting to preserve the final score.'
        );
      })
      .finally(() => {
        terminalRequestInFlight.current = false;
      });
  }, [engine, timer.run.status, timer.refreshVersion, timer.setError]);

  const startGame = useCallback(async () => {
    if (!engine) return;
    engine.setGameplayEnabled(false);
    try {
      const run = (timer.run.status === 'running' ? await timer.pause() : timer.run) ?? timer.run;
      if (run.status === 'expired' || run.status === 'completed') return;
      engine.startGame(teamName, cards);
    } catch {
      /* Keep the menu available and show the timer hook's reconnect error. */
    }
  }, [cards, engine, teamName, timer.pause, timer.run.status]);

  const advanceHunt = useCallback(async (hunt: 1 | 2) => {
    if (!engine) return;
    engine.setGameplayEnabled(false);
    soundFx.huntComplete();
    try {
      const run = (timer.run.status === 'running' ? await timer.pause() : timer.run) ?? timer.run;
      if (run?.status === 'expired' || run?.status === 'completed') return;
      resumeAfterTransition.current = run.status === 'paused' && timer.run.status === 'running';
      if (hunt === 1) engine.advanceAfterHunt1();
      else engine.advanceAfterHunt2();
    } catch {
      /* A hunt transition waits until the server has paused the shared timer. */
    }
  }, [engine, timer.pause, timer.run]);

  const exitGame = useCallback(async () => {
    try {
      if (timer.run.status === 'running') await timer.pause();
      onExit();
    } catch {
      /* Keep this screen open if the shared run could not be paused. */
    }
  }, [onExit, timer.pause, timer.run.status]);

  useEffect(() => {
    if (snapshot.phase !== 'playing' || snapshot.huntNumber !== 1) return;
    let active = true;
    let loading = false;
    const refresh = async (open: boolean) => {
      if (loading) return;
      loading = true;
      try {
        const result = open ? await round3Service.openHunt1Session() : await round3Service.getHunt1State();
        if (active) { syncHunt1State(result.state); if (open) void onProgressionRefresh?.(); }
      } catch (reason) {
        if (active) setHunt1Message(reason instanceof Error ? reason.message : 'Could not load Hunt 1 progress.');
      } finally {
        loading = false;
      }
    };
    void refresh(true);
    return () => {
      active = false;
    };
  }, [onProgressionRefresh, snapshot.huntNumber, snapshot.phase, syncHunt1State]);

  useEffect(() => {
    if (snapshot.phase !== 'playing' || snapshot.huntNumber !== 2) return;
    let active = true;
    let loading = false;
    const refresh = async (open: boolean) => {
      if (loading) return;
      loading = true;
      try {
        const result = open ? await round3Service.openHunt2Session() : await round3Service.getHunt2State();
        if (active) { syncHunt2State(result.state); if (open) void onProgressionRefresh?.(); }
      } catch (reason) {
        if (active) setHunt2Message(reason instanceof Error ? reason.message : 'Could not load Hunt 2 progress.');
      } finally {
        loading = false;
      }
    };
    void refresh(true);
    return () => {
      active = false;
    };
  }, [onProgressionRefresh, snapshot.phase, snapshot.huntNumber, syncHunt2State]);

  useEffect(() => {
    if (snapshot.phase !== 'playing' || snapshot.huntNumber !== 3) return;
    let active = true;
    let loading = false;
    let sessionReady = false;
    const refresh = async () => {
      if (loading) return;
      loading = true;
      try {
        const openingSession = !sessionReady;
        const result = sessionReady ? await round3Service.getHunt3State() : await round3Service.openHunt3Session();
        sessionReady = true;
        if (active) { syncHunt3State(result.state); if (openingSession) void onProgressionRefresh?.(); }
      } catch (reason) {
        sessionReady = false;
        if (active)
          setHunt3Message(reason instanceof Error ? reason.message : 'Could not load Hunt III progress. Reconnect to restore the investigation.');
      } finally {
        loading = false;
      }
    };
    void refresh();
    return () => {
      active = false;
    };
  }, [onProgressionRefresh, snapshot.phase, snapshot.huntNumber, syncHunt3State]);

  // Submissions without arbitrary playerNumber restrictions for true split-screen co-op
  const submitHunt1 = useCallback(
    async (actor: Hunt1Actor, sequence: string[]): Promise<Hunt1ActionResult> => {
      if (hunt1Working || !hunt1) throw new Error('Hunt 1 progress is still loading.');
      setHunt1Working(true);
      try {
        const result = await round3Service.hunt1Action({ type: 'submit', actor, value: { sequence } });
        syncHunt1State(result.state);
        setHunt1Message(result.message);
        if (!result.success) {
          soundFx.error();
        }
        return result;
      } catch (reason) {
        soundFx.error();
        const message = reason instanceof Error ? reason.message : 'Could not validate the submission.';
        setHunt1Message(message);
        return { success: false, message, state: hunt1 };
      } finally {
        setHunt1Working(false);
      }
    },
    [hunt1, hunt1Working, syncHunt1State]
  );

  const specialHunt1Action = useCallback(
    async (actor: Hunt1Actor, type: string, value: unknown): Promise<Hunt1ActionResult> => {
      if (hunt1Working || !hunt1) throw new Error('Hunt 1 progress is still loading.');
      setHunt1Working(true);
      try {
        const result = await round3Service.hunt1Action({ type, actor, value });
        syncHunt1State(result.state);
        setHunt1Message(result.message);
        if (!result.success) {
          soundFx.error();
        }
        return result;
      } catch (reason) {
        soundFx.error();
        const errorMessage = reason instanceof Error ? reason.message : 'Could not validate the report reconstruction.';
        setHunt1Message(errorMessage);
        return { success: false, message: errorMessage, state: hunt1 };
      } finally {
        setHunt1Working(false);
      }
    },
    [hunt1, hunt1Working, syncHunt1State]
  );

  const requestHunt1Hint = useCallback((actor: Hunt1Actor) => {
    if (hunt1Working) return;
    setHunt1Working(true);
    void round3Service
      .hunt1Action({ type: 'hint', actor })
      .then((result) => {
        syncHunt1State(result.state);
        setHunt1Message(result.hint ? `${result.message} ${result.hint}` : result.message);
        if (result.hint) {
          addToast({ type: 'clue', title: 'Investigation Hint', message: result.hint });
        }
      })
      .catch((reason: unknown) => setHunt1Message(reason instanceof Error ? reason.message : 'Could not load a hint.'))
      .finally(() => setHunt1Working(false));
  }, [addToast, hunt1Working, syncHunt1State]);

  const submitHunt2 = useCallback(
    async (actor: Hunt2Actor, _kind: Hunt2Input, value: unknown): Promise<Hunt2ActionResult> => {
      if (hunt2Working || !hunt2) return { success: false, message: 'Hunt 2 progress is still loading.', state: hunt2! };
      setHunt2Working(true);
      try {
        const result = await round3Service.hunt2Action({ type: 'submit', actor, value });
        syncHunt2State(result.state);
        setHunt2Message(result.message);
        if (result.input) setPendingHunt2Input({ actor, kind: result.input });
        else if (result.success) setPendingHunt2Input(null);
        if (result.success) {
          if (result.input) {
            soundFx.clueFound();
            addToast({ type: 'clue', title: 'Trials Recorded', message: result.message });
          } else {
            soundFx.taskComplete();
            addToast({ type: 'task', title: 'Memory Verified', message: result.message });
          }
        } else {
          soundFx.error();
          store.replaceState({ ...store.state, distortion: Math.max(store.state.distortion, 1.5) });
        }
        return result;
      } catch (reason) {
        soundFx.error();
        const message = reason instanceof Error ? reason.message : 'Could not validate the Hunt 2 submission.';
        setHunt2Message(message);
        return { success: false, message, state: hunt2 };
      } finally {
        setHunt2Working(false);
      }
    },
    [addToast, hunt2, hunt2Working, store, syncHunt2State]
  );

  const requestHunt2Hint = useCallback(
    (actor: Hunt2Actor) => {
      if (hunt2Working) return;
      setHunt2Working(true);
      void round3Service
        .hunt2Action({ type: 'hint', actor })
        .then((result) => {
          syncHunt2State(result.state);
          setHunt2Message(result.hint ? `${result.message} ${result.hint}` : result.message);
          if (result.hint) {
            addToast({ type: 'clue', title: 'Memory Hint', message: result.hint });
          }
        })
        .catch((reason: unknown) => setHunt2Message(reason instanceof Error ? reason.message : 'Could not load a Hunt 2 hint.'))
        .finally(() => setHunt2Working(false));
    },
    [addToast, hunt2Working, syncHunt2State]
  );

  const submitHunt3 = useCallback(
    async (actor: Hunt3Actor, action: { type: string; id: string; value?: unknown }): Promise<Hunt3ActionResult> => {
      const index: PlayerIndex = actor === 'archivist' ? 0 : 1;
      if (!hunt3) return { success: false, message: 'Hunt III progress is still loading.', state: {} as Hunt3State };
      if (hunt3InFlight.current[index]) return { success: false, message: 'That investigator already has an action in progress.', state: hunt3 };
      hunt3InFlight.current[index] = true;
      setHunt3Working((working) => working.map((value, player) => player === index ? true : value) as [boolean, boolean]);
      try {
        const result = await round3Service.hunt3Action(actor, action);
        syncHunt3State(result.state);
        setHunt3Message(result.message);
        if (result.success) {
          soundFx.taskComplete();
          addToast({
            type: 'stage',
            title: 'Containment Action Verified',
            message: result.message,
          });
        } else {
          soundFx.error();
        }
        return result;
      } catch (reason) {
        soundFx.error();
        const message = reason instanceof Error ? reason.message : 'Could not validate the Hunt III action.';
        setHunt3Message(message);
        return { success: false, message, state: hunt3 };
      } finally {
        hunt3InFlight.current[index] = false;
        setHunt3Working((working) => working.map((value, player) => player === index ? false : value) as [boolean, boolean]);
      }
    },
    [addToast, hunt3, syncHunt3State]
  );

  useEffect(() => {
    if (!hunt3?.completed || hunt3CompletionHandled.current || snapshot.phase !== 'playing') return;
    hunt3CompletionHandled.current = true;
    soundFx.huntComplete();
    void round3Service
      .getState()
      .then(async (result) => {
        engine?.endWithServerScore(result.session.score);
        await onComplete();
      })
      .catch((reason: unknown) => {
        hunt3CompletionHandled.current = false;
        setHunt3Message(reason instanceof Error ? `Capture secured, but final score sync failed: ${reason.message}` : 'Capture secured, but final score sync failed. Reconnect.');
      });
  }, [engine, hunt3?.completed, onComplete, snapshot.phase]);

  useEffect(() => {
    if (snapshot.phase === 'menu' && engine) engine.setCards(cards);
  }, [cards, engine, snapshot.phase]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let latest: GameState | null = null;
    let lastSavedAt = Date.now();
    let saveInFlight = false;
    let disposed = false;
    let lastSignificantHash = '';

    const getSignificantHash = (st: GameState) =>
      `${st.huntIndex}:${st.score}:${Object.keys(st.flags).sort().join(',')}:${st.journal.length}:${st.phase}`;

    const saveLatest = async () => {
      timeout = undefined;
      if (!latest || saveInFlight || disposed) return;
      const source = latest;
      latest = null;
      const snapshot = JSON.parse(JSON.stringify(source)) as GameState;
      saveInFlight = true;
      try {
        await onSaveGameState(snapshot);
        lastSavedAt = Date.now();
        lastSignificantHash = getSignificantHash(snapshot);
      } catch {
        // Back off on save error so we never spam the server in a tight retry loop
        lastSavedAt = Date.now() - (GAME_STATE_CHECKPOINT_INTERVAL_MS - 20_000);
      } finally {
        saveInFlight = false;
        if (latest && !disposed) scheduleSave();
      }
    };

    const scheduleSave = (forcedDelay?: number) => {
      if (timeout || disposed || saveInFlight || !latest) return;
      const delay = forcedDelay ?? Math.max(0, GAME_STATE_CHECKPOINT_INTERVAL_MS - (Date.now() - lastSavedAt));
      timeout = setTimeout(() => { void saveLatest(); }, delay);
    };

    const queueSave = () => {
      if (store.state.phase === 'menu' || disposed) return;
      const currentHash = getSignificantHash(store.state);
      // Pure movement does not change milestones (hunt, score, flags, journal, phase).
      // Skip network saves during walking so gameplay never stutters or spams the backend.
      if (currentHash === lastSignificantHash) return;
      latest = store.state;
      if (lastSignificantHash !== '') {
        scheduleSave(3_000);
      } else {
        lastSignificantHash = currentHash;
        lastSavedAt = Date.now();
      }
    };

    const unsubscribe = store.subscribe(queueSave);
    return () => {
      disposed = true;
      unsubscribe();
      if (timeout) clearTimeout(timeout);
      if (latest && store.state.phase !== 'ended') {
        const snapshot = JSON.parse(JSON.stringify(store.state)) as GameState;
        void onSaveGameState(snapshot).catch(() => undefined);
      }
    };
  }, [onSaveGameState, store]);

  useEffect(() => {
    if (snapshot.phase !== 'ended' || completionStarted.current || timerEndedByServer.current) return;
    completionStarted.current = true;
    const completedState = JSON.parse(JSON.stringify(store.state)) as GameState;
    void onSaveGameState(completedState)
      .then(() => onComplete())
      .catch(() => {
        setCardError('The hunt ended, but the final result could not be saved. Reconnect and return to the hunt.');
      });
  }, [onComplete, onSaveGameState, snapshot.phase, store]);

  return (
    <>
      <CompletionToast toasts={toasts} onDismiss={dismissToast} />

      <MenuScreen
        visible={snapshot.phase === 'menu'}
        canvasRef={refs.menuCanvas}
        teamName={teamName}
        cards={cards}
        inventory={inventory}
        testingCardIds={testingCardIds}
        onToggleTestingCard={onToggleTestingCard}
        onStart={() => {
          void startGame();
        }}
        onExit={() => {
          void exitGame();
        }}
      />
      <SplitScreen
        snapshot={snapshot}
        refs={refs}
        onPuzzleKey={(player, key) => engine?.pressPuzzle(player, key)}
        onToggleJournal={(player) => {
          store.state.journalOpen[player] = !store.state.journalOpen[player];
          store.emit();
        }}
        onUseCard={(slot) => engine?.useCardSlot(slot)}
        onAction={(player) => engine?.triggerAction(player)}
        remainingSeconds={timer.remainingSeconds}
        huntProgression={huntProgression}
      />
      {snapshot.phase === 'playing' && snapshot.huntNumber === 1 && (
        <>
          <Hunt1Progress
            state={hunt1}
            playerNumber={1}
            showOverview
            message={hunt1Message}
            working={hunt1Working}
            onHint={requestHunt1Hint}
            onSubmit={submitHunt1}
            onSpecialAction={specialHunt1Action}
            onContinue={() => {
              void advanceHunt(1);
            }}
          />
          <Hunt1Progress
            state={hunt1}
            playerNumber={2}
            showOverview={false}
            message={hunt1Message}
            working={hunt1Working}
            onHint={requestHunt1Hint}
            onSubmit={submitHunt1}
            onSpecialAction={specialHunt1Action}
            onContinue={() => {
              void advanceHunt(1);
            }}
          />
        </>
      )}
      {snapshot.phase === 'playing' && snapshot.huntNumber === 2 && (
        <Hunt2Progress
          state={hunt2}
          pending={pendingHunt2Input}
          message={hunt2Message}
          working={hunt2Working}
          onHint={requestHunt2Hint}
          onOpenInput={(actor, kind) => setPendingHunt2Input({ actor, kind })}
          onSubmit={submitHunt2}
          onClose={() => setPendingHunt2Input(null)}
          onContinue={() => {
            void advanceHunt(2);
          }}
        />
      )}
      {snapshot.phase === 'playing' && snapshot.huntNumber === 3 && (
        <Fragment key="hunt3-task-panels">
          <Hunt3Progress
            state={hunt3}
            actor="archivist"
            message={hunt3Message}
            working={hunt3Working[0]}
            onAction={(action) => submitHunt3('archivist', action)}
          />
          <Hunt3Progress
            state={hunt3}
            actor="tracker"
            message={hunt3Message}
            working={hunt3Working[1]}
            onAction={(action) => submitHunt3('tracker', action)}
          />
        </Fragment>
      )}
      {snapshot.phase === 'playing' && snapshot.huntIntro && <HuntIntro intro={snapshot.huntIntro} />}
      {snapshot.phase === 'ended' && snapshot.summary && (
        <EndScreen
          summary={snapshot.summary}
          teamId={teamId}
          onNewSession={() => {
            void exitGame();
          }}
          expired={timer.run.status === 'expired'}
          storyReveal={hunt3?.completed === true && timer.run.status !== 'expired'}
        />
      )}
      {snapshot.phase !== 'menu' && (() => {
        const canExit = snapshot.phase === 'ended' || timer.run.status === 'expired' || timer.remainingMs <= 0 || hunt3?.completed === true;
        return canExit ? (
          <button
            className="ph-exit"
            onClick={() => {
              void exitGame();
            }}
          >
            RETURN TO CARTEL
          </button>
        ) : (
          <button
            className="ph-exit ph-exit-locked"
            disabled
            aria-disabled="true"
            title="Return to Cartel is locked until the timer expires or all hunts are completed."
          >
            RETURN TO CARTEL (LOCKED)
          </button>
        );
      })()}
      {(cardError || externalError || timer.error) && (
        <div className="ph-card-error" role="alert">
          {timer.error || cardError || externalError}
          {timer.error && (
            <button
              type="button"
              onClick={() => {
                void (timer.run.status === 'not_started' || timer.run.status === 'paused' ? timer.ensureRunning() : timer.refresh());
              }}
            >
              RECONNECT
            </button>
          )}
        </div>
      )}
    </>
  );
}
