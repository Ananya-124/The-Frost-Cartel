import { useCallback, useEffect, useRef, useState } from 'react';
import { createEngineRefs, useGameEngine } from '../../hooks/useGameEngine';
import { useGameSnapshot } from '../../hooks/useGameSnapshot';
import { GameStore } from '../../engine/state/store';
import { restoreGameState } from '../../engine/state/restoreGameState';
import SplitScreen from '../canvas/SplitScreen';
import HuntIntro from '../overlays/HuntIntro';
import EndScreen from './EndScreen';
import MenuScreen from './MenuScreen';
import type { Round3InventoryItem } from '../../../../../../types/round3.types';
import type { Round3RunState } from '../../../../../../types/round3.types';
import type { PowerCard, GameState } from '../../types';
import type { Round3CardId } from '../../../../../../constants/round3.cards';
import { round3Service } from '../../../../../../services/round3Service';
import type { InteractableObject, PlayerIndex } from '../../types';
import type { Hunt1ActionResult, Hunt1Actor, Hunt1State } from '../../../../../../types/hunt1.types';
import Hunt1Progress from '../hunt1/Hunt1Progress';
import type { Hunt2ActionResult, Hunt2Actor, Hunt2Input, Hunt2State } from '../../../../../../types/hunt2.types';
import Hunt2Progress from './Hunt2Progress';
import type { Hunt3ActionResult, Hunt3Actor, Hunt3State } from '../../../../../../types/hunt3.types';
import Hunt3Progress from './Hunt3Progress';
import { ROOM_BY_ID } from '../../config/rooms';
import { useRound3RunTimer } from '../../hooks/useRound3RunTimer';

interface GameScreenProps {
  teamName: string;
  cards: PowerCard[];
  inventory: readonly Round3InventoryItem[];
  savedGameState: unknown;
  initialRun: Round3RunState;
  playerNumber: 1 | 2;
  onExit: () => void;
  onSaveGameState: (gameState: GameState) => Promise<unknown>;
  onComplete: () => Promise<unknown>;
  onLoadDevelopmentSample: () => void;
  externalError?: string;
}

/** Integrated screen: Round 3's canvas engine is hosted inside the main player portal. */
export default function GameScreen({ teamName, cards, inventory, savedGameState, initialRun, playerNumber, onExit, onSaveGameState, onComplete, onLoadDevelopmentSample, externalError = '' }: GameScreenProps) {
  const [store] = useState(() => new GameStore());
  const [refs] = useState(createEngineRefs);
  const [initialState] = useState(() => restoreGameState(savedGameState, teamName, cards));
  const [cardError, setCardError] = useState('');
  const [hunt1, setHunt1] = useState<Hunt1State | null>(null);
  const [hunt1Message, setHunt1Message] = useState('');
  const [hunt1Working, setHunt1Working] = useState(false);
  const [hunt2, setHunt2] = useState<Hunt2State | null>(null);
  const [hunt2Message, setHunt2Message] = useState('');
  const [hunt2Working, setHunt2Working] = useState(false);
  const [pendingHunt2Input, setPendingHunt2Input] = useState<{ actor: Hunt2Actor; kind: Hunt2Input } | null>(null);
  const [hunt3, setHunt3] = useState<Hunt3State | null>(null);
  const [hunt3Message, setHunt3Message] = useState('');
  const [hunt3Working, setHunt3Working] = useState(false);
  const timer = useRound3RunTimer(initialRun);
  const hunt1ActionInFlight = useRef(false);
  const hunt2ActionInFlight = useRef(false);
  const hunt3ActionInFlight = useRef(false);
  const hunt3CompletionHandled = useRef(false);
  const completionStarted = useRef(false);
  const terminalRequestInFlight = useRef(false);
  const timerEndedByServer = useRef(false);
  const firstEntryHandled = useRef(false);
  const previousIntro = useRef(false);
  const resumeAfterTransition = useRef(false);
  const cardUseHandler = useCallback((slot: number, execute: () => boolean) => {
    const card = store.state.cards[slot];
    const before = JSON.parse(JSON.stringify(store.state)) as GameState;
    if (!execute()) return;
    if (!card?.cardId) return;
    setCardError('');
    void round3Service.activateCard(card.cardId as Round3CardId, card.source).catch((reason: unknown) => {
      store.replaceState(before);
      setCardError(reason instanceof Error ? reason.message : 'Could not confirm card activation.');
    });
  }, [store]);

  const syncHunt1State = useCallback((next: Hunt1State) => {
    setHunt1(next);
    if (store.state.huntIndex !== 0) return;
    const journal = next.journal.map((entry) => ({
      title: entry.title,
      text: entry.content,
      huntIndex: 0 as const,
      discoveredBy: entry.discoveredBy === 'tracker' ? 'Tracker' as const : 'Archivist' as const,
      timeline: entry.discoveredBy === 'tracker' ? 'future' as const : 'past' as const,
      timestamp: new Date(entry.createdAt).toLocaleTimeString(),
    }));
    const powered = next.subtasks.circuitRestored === true && !next.completed;
    const hasDecodedTape = next.subtasks.frequencyDecoded === true;
    if (store.state.score !== next.score || JSON.stringify(store.state.journal) !== JSON.stringify(journal)
      || store.state.flags.power !== powered || store.state.flags.tape !== hasDecodedTape
        || store.state.hunt1Challenge !== next.currentChallenge
        || JSON.stringify(store.state.hunt1AvailableInteractables ?? []) !== JSON.stringify(next.availableInteractables)
      || (next.completed && store.state.entities.some((entity) => !entity.gone))) {
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
  }, [store]);

  const hunt1Interaction = useCallback(async (index: PlayerIndex, object: InteractableObject) => {
    if (hunt1ActionInFlight.current) return;
    if (playerNumber !== index + 1) return;
    const actor: Hunt1Actor = index === 0 ? 'archivist' : 'tracker';
    hunt1ActionInFlight.current = true;
    setHunt1Working(true);
    try {
      const result = await round3Service.hunt1Action({ type: 'interact', actor, objectId: object.id });
      syncHunt1State(result.state);
      setHunt1Message(result.message);
    } catch (reason) {
      setHunt1Message(reason instanceof Error ? reason.message : 'Could not validate that Hunt 1 interaction.');
    } finally { hunt1ActionInFlight.current = false; setHunt1Working(false); }
  }, [playerNumber, syncHunt1State]);

  const syncHunt2State = useCallback((next: Hunt2State) => {
    setHunt2(next);
    if (store.state.huntIndex !== 1) return;
    const baseScore = store.state.score - (store.state.huntScores[1] ?? 0);
    const flags = { ...store.state.flags, power: true, shelf: next.subtasks.roomReconstructed === true, anchor: next.subtasks.trueAnchorActivated === true };
    const lab = ROOM_BY_ID.lab;
    const positions = next.subtasks.roomReconstructed ? {
      layoutChair: { x: lab.x + 55, y: lab.y + 165 }, layoutMirror: { x: lab.x + 240, y: lab.y + 70 },
      layoutTable: { x: lab.x + 150, y: lab.y + 145 }, layoutLamp: { x: lab.x + 235, y: lab.y + 235 },
    } : store.state.hunt2ObjectPositions;
    const hidden: Record<string, number> = {};
    for (const [id, objectState] of Object.entries(next.objectStates)) {
      const until = id.startsWith('manifestation') ? next.entityState.decoyHiddenUntil : id.startsWith('memoryAnchor') ? next.entityState.trueAnchorHiddenUntil : null;
      if (objectState === 'dispelled' && until && until > Date.now()) hidden[id] = store.state.time + (until - Date.now()) / 1000;
    }
    if (store.state.huntScores[1] !== next.score || JSON.stringify(store.state.flags) !== JSON.stringify(flags)
      || JSON.stringify(store.state.hunt2HiddenInteractablesUntil ?? {}) !== JSON.stringify(hidden)
      || JSON.stringify(store.state.hunt2ObjectStates ?? {}) !== JSON.stringify(next.objectStates)
      || JSON.stringify(store.state.hunt2Subtasks ?? {}) !== JSON.stringify(next.subtasks)
      || JSON.stringify(store.state.hunt2ObjectPositions ?? {}) !== JSON.stringify(positions ?? {})
      || (next.completed && store.state.entities.some((entity) => !entity.gone))) {
      store.replaceState({
        ...store.state,
        score: baseScore + next.score,
        huntScores: [store.state.huntScores[0], next.score, store.state.huntScores[2]],
        flags,
        hunt2HiddenInteractablesUntil: hidden,
        hunt2ObjectStates: next.objectStates,
        hunt2Subtasks: next.subtasks,
        hunt2ObjectPositions: positions,
        hunt2OpenedInteractables: next.subtasks.genuineExitOpened ? ['falseDoor3'] : [],
        distortion: next.completed ? 0 : store.state.distortion,
        entities: next.completed ? store.state.entities.map((entity) => ({ ...entity, gone: true })) : store.state.entities,
      });
    }
  }, [store]);

  const hunt2Interaction = useCallback(async (index: PlayerIndex, object: InteractableObject) => {
    if (hunt2ActionInFlight.current) return;
    const actor: Hunt2Actor = index === 0 ? 'archivist' : 'tracker';
    hunt2ActionInFlight.current = true;
    setHunt2Working(true);
    try {
      const result = await round3Service.hunt2Action({ type: 'interact', actor, objectId: object.id });
      syncHunt2State(result.state);
      setHunt2Message(result.message);
      if (result.input) setPendingHunt2Input({ actor, kind: result.input });
      if (!result.success) {
        const players = [...store.state.players] as GameState['players'];
        if (index === 1 && object.id.startsWith('falseDoor')) {
          players[1] = { ...players[1], x: ROOM_BY_ID.hall.x + 150, y: ROOM_BY_ID.hall.y + 230 };
        }
        store.replaceState({ ...store.state, players, distortion: Math.max(store.state.distortion, 1.5) });
      }
    } catch (reason) {
      setHunt2Message(reason instanceof Error ? reason.message : 'Could not validate that Hunt 2 interaction.');
    } finally { hunt2ActionInFlight.current = false; setHunt2Working(false); }
  }, [store, syncHunt2State]);

  const syncHunt3State = useCallback((next: Hunt3State) => {
    setHunt3(next);
    if (store.state.huntIndex !== 2) return;
    const base = store.state.score - (store.state.huntScores[2] ?? 0);
    const entityVisible = next.trail.resolved || next.stage > 1;
    const entities = store.state.entities.map((entity) => ({ ...entity, gone: !entityVisible }));
    if (store.state.huntScores[2] !== next.score || JSON.stringify(store.state.entities) !== JSON.stringify(entities)
      || store.state.hunt3Stage !== next.stage || store.state.hunt3LureActive !== (next.weakness.lure > 0)) {
      store.replaceState({ ...store.state, score: base + next.score, huntScores: [store.state.huntScores[0], store.state.huntScores[1], next.score], entities, hunt3Stage: next.stage, hunt3EntityVisible: entityVisible, hunt3LureActive: next.weakness.lure > 0 });
    }
  }, [store]);

  const hunt3Interaction = useCallback(async (index: PlayerIndex, object: InteractableObject) => {
    if (playerNumber !== index + 1 || hunt3ActionInFlight.current) return;
    const actor: Hunt3Actor = index === 0 ? 'archivist' : 'tracker';
    hunt3ActionInFlight.current = true; setHunt3Working(true);
    try {
      const result = await round3Service.hunt3Action(actor, { type: 'interact', id: object.id });
      syncHunt3State(result.state); setHunt3Message(result.message);
    } catch (reason) { setHunt3Message(reason instanceof Error ? reason.message : 'Could not validate that Hunt III interaction.'); }
    finally { hunt3ActionInFlight.current = false; setHunt3Working(false); }
  }, [playerNumber, syncHunt3State]);

  const engine = useGameEngine(store, refs, cardUseHandler, initialState, hunt1Interaction, hunt2Interaction, hunt3Interaction);
  const snapshot = useGameSnapshot(store);

  useEffect(() => {
    engine?.setGameplayEnabled(snapshot.phase === 'playing' && !snapshot.huntIntro && timer.gameplayEnabled);
  }, [engine, snapshot.phase, snapshot.huntIntro, timer.gameplayEnabled]);

  const enterGameplay = useCallback(async () => {
    try { await timer.ensureRunning(); }
    catch { /* The timer hook keeps controls locked and exposes a reconnect action. */ }
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
    void round3Service.getState().then((result) => {
      timerEndedByServer.current = true;
      engine.endWithServerScore(result.session.score);
    }).catch((reason: unknown) => {
      timer.setError(reason instanceof Error ? `Time expired. Reconnecting to preserve the final score: ${reason.message}` : 'Time expired. Reconnecting to preserve the final score.');
    }).finally(() => { terminalRequestInFlight.current = false; });
  }, [engine, timer.run.status, timer.refreshVersion, timer.setError]);

  const startGame = useCallback(async () => {
    if (!engine) return;
    engine.setGameplayEnabled(false);
    try {
      const run = (timer.run.status === 'running' ? await timer.pause() : timer.run) ?? timer.run;
      if (run.status === 'expired' || run.status === 'completed') return;
      engine.startGame(teamName, cards);
    } catch { /* Keep the menu available and show the timer hook's reconnect error. */ }
  }, [cards, engine, teamName, timer.pause, timer.run.status]);

  const advanceHunt = useCallback(async (hunt: 1 | 2) => {
    if (!engine) return;
    engine.setGameplayEnabled(false);
    try {
      const run = (timer.run.status === 'running' ? await timer.pause() : timer.run) ?? timer.run;
      if (run?.status === 'expired' || run?.status === 'completed') return;
      resumeAfterTransition.current = run.status === 'paused' && timer.run.status === 'running';
      if (hunt === 1) engine.advanceAfterHunt1(); else engine.advanceAfterHunt2();
    } catch { /* A hunt transition waits until the server has paused the shared timer. */ }
  }, [engine, timer.pause, timer.run]);

  const toggleRun = useCallback(async () => {
    if (snapshot.huntIntro) return;
    engine?.setGameplayEnabled(false);
    try {
      if (timer.run.status === 'paused') await timer.resume();
      else if (timer.run.status === 'running') await timer.pause();
    } catch { /* The timer hook reports the failed request and allows a retry. */ }
  }, [engine, snapshot.huntIntro, timer.pause, timer.resume, timer.run.status]);

  const exitGame = useCallback(async () => {
    try {
      if (timer.run.status === 'running') await timer.pause();
      onExit();
    } catch { /* Keep this screen open if the shared run could not be paused. */ }
  }, [onExit, timer.pause, timer.run.status]);

  useEffect(() => {
    let active = true;
    let loading = false;
    const refresh = async (open: boolean) => {
      if (loading) return;
      loading = true;
      try {
        const result = open ? await round3Service.openHunt1Session() : await round3Service.getHunt1State();
        if (active) syncHunt1State(result.state);
      } catch (reason) {
        if (active) setHunt1Message(reason instanceof Error ? reason.message : 'Could not load Hunt 1 progress.');
      } finally { loading = false; }
    };
    void refresh(true);
    const interval = window.setInterval(() => { void refresh(false); }, 2500);
    return () => { active = false; window.clearInterval(interval); };
  }, [syncHunt1State]);

  useEffect(() => {
    if (snapshot.phase !== 'playing' || snapshot.huntNumber !== 2) return;
    let active = true;
    let loading = false;
    const refresh = async (open: boolean) => {
      if (loading) return;
      loading = true;
      try {
        const result = open ? await round3Service.openHunt2Session() : await round3Service.getHunt2State();
        if (active) syncHunt2State(result.state);
      } catch (reason) {
        if (active) setHunt2Message(reason instanceof Error ? reason.message : 'Could not load Hunt 2 progress.');
      } finally { loading = false; }
    };
    void refresh(true);
    const interval = window.setInterval(() => { void refresh(false); }, 2500);
    return () => { active = false; window.clearInterval(interval); };
  }, [snapshot.phase, snapshot.huntNumber, syncHunt2State]);

  useEffect(() => {
    if (snapshot.phase !== 'playing' || snapshot.huntNumber !== 3) return;
    let active = true; let loading = false;
    const refresh = async (open: boolean) => {
      if (loading) return; loading = true;
      try {
        const result = open ? await round3Service.openHunt3Session() : await round3Service.getHunt3State();
        if (active) syncHunt3State(result.state);
      } catch (reason) { if (active) setHunt3Message(reason instanceof Error ? reason.message : 'Could not load Hunt III progress. Reconnect to restore the investigation.'); }
      finally { loading = false; }
    };
    void refresh(true); const interval = window.setInterval(() => { void refresh(false); }, 2500);
    return () => { active = false; window.clearInterval(interval); };
  }, [snapshot.phase, snapshot.huntNumber, syncHunt3State]);

  const submitHunt1 = useCallback(async (actor: Hunt1Actor, sequence: string[]): Promise<Hunt1ActionResult> => {
    if ((actor === 'archivist' ? 1 : 2) !== playerNumber) return { success: false, message: 'Only your authenticated investigator can operate this reconstruction board.', state: hunt1! };
    if (hunt1Working || !hunt1) throw new Error('Hunt 1 progress is still loading.');
    setHunt1Working(true);
    try {
      const result = await round3Service.hunt1Action({ type: 'submit', actor, value: { sequence } });
      syncHunt1State(result.state);
      setHunt1Message(result.message);
      return result;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not validate the submission.';
      setHunt1Message(message);
      return { success: false, message, state: hunt1 };
    } finally { setHunt1Working(false); }
  }, [hunt1, hunt1Working, playerNumber, syncHunt1State]);

  const specialHunt1Action = useCallback(async (actor: Hunt1Actor, type: string, value: unknown): Promise<Hunt1ActionResult> => {
    if ((actor === 'archivist' ? 1 : 2) !== playerNumber) return { success: false, message: 'Only your authenticated investigator can perform this report action.', state: hunt1! };
    if (hunt1Working || !hunt1) throw new Error('Hunt 1 progress is still loading.');
    setHunt1Working(true);
    try {
      const result = await round3Service.hunt1Action({ type, actor, value });
      syncHunt1State(result.state);
      setHunt1Message(result.message);
      return result;
    } catch (reason) {
      const errorMessage = reason instanceof Error ? reason.message : 'Could not validate the report reconstruction.';
      setHunt1Message(errorMessage);
      return { success: false, message: errorMessage, state: hunt1 };
    } finally { setHunt1Working(false); }
  }, [hunt1, hunt1Working, playerNumber, syncHunt1State]);

  const requestHunt1Hint = useCallback(() => {
    if (hunt1Working) return;
    setHunt1Working(true);
    void round3Service.hunt1Action({ type: 'hint', actor: playerNumber === 1 ? 'archivist' : 'tracker' })
      .then((result) => { syncHunt1State(result.state); setHunt1Message(result.hint ? `${result.message} ${result.hint}` : result.message); })
      .catch((reason: unknown) => setHunt1Message(reason instanceof Error ? reason.message : 'Could not load a hint.'))
      .finally(() => setHunt1Working(false));
  }, [hunt1Working, playerNumber, syncHunt1State]);

  const submitHunt2 = useCallback(async (actor: Hunt2Actor, _kind: Hunt2Input, value: unknown): Promise<Hunt2ActionResult> => {
    if (hunt2Working || !hunt2) return { success: false, message: 'Hunt 2 progress is still loading.', state: hunt2! };
    setHunt2Working(true);
    try {
      const result = await round3Service.hunt2Action({ type: 'submit', actor, value });
      syncHunt2State(result.state);
      setHunt2Message(result.message);
      if (result.success) setPendingHunt2Input(null);
      else store.replaceState({ ...store.state, distortion: Math.max(store.state.distortion, 1.5) });
      return result;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not validate the Hunt 2 submission.';
      setHunt2Message(message);
      return { success: false, message, state: hunt2 };
    } finally { setHunt2Working(false); }
  }, [hunt2, hunt2Working, store, syncHunt2State]);

  const requestHunt2Hint = useCallback((actor: Hunt2Actor) => {
    if (hunt2Working) return;
    setHunt2Working(true);
    void round3Service.hunt2Action({ type: 'hint', actor })
      .then((result) => { syncHunt2State(result.state); setHunt2Message(result.hint ? `${result.message} ${result.hint}` : result.message); })
      .catch((reason: unknown) => setHunt2Message(reason instanceof Error ? reason.message : 'Could not load a Hunt 2 hint.'))
      .finally(() => setHunt2Working(false));
  }, [hunt2Working, syncHunt2State]);

  const submitHunt3 = useCallback(async (actor: Hunt3Actor, action: { type: string; id: string; value?: unknown }): Promise<Hunt3ActionResult> => {
    if ((actor === 'archivist' ? 1 : 2) !== playerNumber) return { success: false, message: 'Only your authenticated investigator can use this control.', state: hunt3! };
    if (hunt3Working || !hunt3) return { success: false, message: 'Hunt III progress is still loading.', state: hunt3! };
    setHunt3Working(true);
    try { const result = await round3Service.hunt3Action(actor, action); syncHunt3State(result.state); setHunt3Message(result.message); return result; }
    catch (reason) { const message = reason instanceof Error ? reason.message : 'Could not validate the Hunt III action.'; setHunt3Message(message); return { success: false, message, state: hunt3 }; }
    finally { setHunt3Working(false); }
  }, [hunt3, hunt3Working, playerNumber, syncHunt3State]);

  useEffect(() => {
    if (!hunt3?.completed || hunt3CompletionHandled.current || snapshot.phase !== 'playing') return;
    hunt3CompletionHandled.current = true;
    void round3Service.getState().then(async (result) => {
      engine?.endWithServerScore(result.session.score);
      await onComplete();
    }).catch((reason: unknown) => {
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
    const queueSave = () => {
      if (store.state.phase === 'menu') return;
      latest = JSON.parse(JSON.stringify(store.state)) as GameState;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (latest) void onSaveGameState(latest).catch((reason: unknown) => {
          setCardError(reason instanceof Error ? `Progress save failed: ${reason.message}` : 'Progress save failed.');
        });
      }, 800);
    };
    const unsubscribe = store.subscribe(queueSave);
    return () => {
      unsubscribe();
      if (timeout) clearTimeout(timeout);
      if (latest) void onSaveGameState(latest);
    };
  }, [onSaveGameState, store]);

  useEffect(() => {
    if (snapshot.phase !== 'ended' || completionStarted.current || timerEndedByServer.current) return;
    completionStarted.current = true;
    const completedState = JSON.parse(JSON.stringify(store.state)) as GameState;
    void onSaveGameState(completedState).then(() => onComplete()).catch(() => {
      setCardError('The hunt ended, but the final result could not be saved. Reconnect and return to the hunt.');
    });
  }, [onComplete, onSaveGameState, snapshot.phase, store]);

  return (
    <>
      <MenuScreen
        visible={snapshot.phase === 'menu'}
        canvasRef={refs.menuCanvas}
        teamName={teamName}
        cards={cards}
        inventory={inventory}
        onStart={() => { void startGame(); }}
        onExit={() => { void exitGame(); }}
        onLoadDevelopmentSample={onLoadDevelopmentSample}
      />
      <SplitScreen
        snapshot={snapshot}
        refs={refs}
        onPuzzleKey={(player, key) => engine?.pressPuzzle(player, key)}
        onUseCard={(slot) => engine?.useCardSlot(slot)}
        remainingSeconds={timer.remainingSeconds}
        runStatus={timer.run.status}
        runBusy={timer.busy}
        canToggleRun={!snapshot.huntIntro && snapshot.phase === 'playing'}
        onToggleRun={() => { void toggleRun(); }}
      />
      {snapshot.phase === 'playing' && snapshot.huntNumber === 1 && <Hunt1Progress
        state={hunt1}
        playerNumber={playerNumber}
        message={hunt1Message}
        working={hunt1Working}
        onHint={requestHunt1Hint}
        onSubmit={submitHunt1}
        onSpecialAction={specialHunt1Action}
        onContinue={() => { void advanceHunt(1); }}
      />}
      {snapshot.phase === 'playing' && snapshot.huntNumber === 2 && <Hunt2Progress
        state={hunt2}
        pending={pendingHunt2Input}
        message={hunt2Message}
        working={hunt2Working}
        onHint={requestHunt2Hint}
        onSubmit={submitHunt2}
        onClose={() => setPendingHunt2Input(null)}
        onContinue={() => { void advanceHunt(2); }}
      />}
      {snapshot.phase === 'playing' && snapshot.huntNumber === 3 && <Hunt3Progress
        state={hunt3}
        actor={playerNumber === 1 ? 'archivist' : 'tracker'}
        message={hunt3Message}
        working={hunt3Working}
        onAction={(action) => submitHunt3(playerNumber === 1 ? 'archivist' : 'tracker', action)}
      />}
      {snapshot.phase === 'playing' && snapshot.huntIntro && <HuntIntro intro={snapshot.huntIntro} />}
      {snapshot.phase === 'ended' && snapshot.summary && (
        <EndScreen summary={snapshot.summary} onNewSession={() => { void exitGame(); }} expired={timer.run.status === 'expired'} storyReveal={hunt3?.completed === true && timer.run.status !== 'expired'} />
      )}
      {snapshot.phase !== 'menu' && <button className="ph-exit" onClick={() => { void exitGame(); }}>RETURN TO CARTEL</button>}
      {(cardError || externalError || timer.error) && <div className="ph-card-error" role="alert">
        {timer.error || cardError || externalError}
        {timer.error && <button type="button" onClick={() => { void (timer.run.status === 'not_started' || timer.run.status === 'paused' ? timer.ensureRunning() : timer.refresh()); }}>RECONNECT</button>}
      </div>}
    </>
  );
}
