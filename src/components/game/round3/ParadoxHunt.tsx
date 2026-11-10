import React, { useCallback, useEffect, useState } from 'react';
import type { TeamSession } from '../../../types/team.types';
import type { Round3StateResponse } from '../../../types/round3.types';
import type { Round3RunState } from '../../../types/round3.types';
import { round3Service } from '../../../services/round3Service';
import { authService } from '../../../services/authService';
import { inventoryToPowerCards } from './runtime/inventoryCards';
import GameScreen from './runtime/components/screens/GameScreen';
import './runtime/styles/game.css';
import { cardsFromTestingInventory, markTestingCardUsed, readTestingInventory, readUsedTestingCards, writeTestingInventory, writeUsedTestingCards, type TestPowerCardId } from './runtime/testingCards';

interface ParadoxHuntProps {
  session: TeamSession;
  onReturnHome: () => void;
}

const createDefaultRun = (): Round3RunState => ({
  status: 'not_started',
  remainingMs: 25 * 60 * 1000,
  remainingSeconds: 25 * 60,
  startedAt: null,
  updatedAt: new Date().toISOString(),
});

const parseRunState = (value: unknown): Round3RunState => {
  const candidate = value && typeof value === 'object' && 'run' in value
    ? (value as { run?: unknown }).run
    : value;

  if (!candidate || typeof candidate !== 'object') {
    return createDefaultRun();
  }

  const source = candidate as Partial<Round3RunState>;
  const status = source.status === 'running' || source.status === 'paused' || source.status === 'completed' || source.status === 'expired'
    ? source.status
    : 'not_started';
  const remainingMs = typeof source.remainingMs === 'number' ? source.remainingMs : 25 * 60 * 1000;

  return {
    status,
    remainingMs,
    remainingSeconds: typeof source.remainingSeconds === 'number' ? source.remainingSeconds : Math.ceil(remainingMs / 1000),
    startedAt: typeof source.startedAt === 'string' ? source.startedAt : null,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : new Date().toISOString(),
  };
};

export const ParadoxHunt: React.FC<ParadoxHuntProps> = ({ session, onReturnHome }) => {
  const [state, setState] = useState<Round3StateResponse | null>(null);
  const [run, setRun] = useState<Round3RunState | null>(null);
  const [playerNumber, setPlayerNumber] = useState<1 | 2 | null>(session.playerNumber ?? null);
  const [error, setError] = useState('');
  const [testCardIds, setTestCardIds] = useState<TestPowerCardId[]>(() => readTestingInventory(session.teamName));
  const [usedTestCards, setUsedTestCards] = useState<TestPowerCardId[]>(() => readUsedTestingCards(session.teamName));

  const connect = useCallback(async () => {
    setError('');
    try {
      const [sessionState, runState, authenticatedPlayer] = await Promise.all([
        round3Service.openSession(),
        round3Service.getRun().catch(() => ({ success: false, run: createDefaultRun() })),
        session.playerNumber ? Promise.resolve(session.playerNumber) : authService.getPlayerNumber(),
      ]);
      setState(sessionState);
      setRun(parseRunState(runState));
      setPlayerNumber(authenticatedPlayer);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not open the Round 3 session.';
      setError(message.includes('No squad token') || message.includes('Authentication required')
        ? 'Your browser session is not connected to the game server. Sign out, then log in again with the backend running.'
        : message);
    }
  }, [session.playerNumber]);

  useEffect(() => {
    let isCancelled = false;
    const runConnect = async () => {
      try {
        const [sessionState, runState, authenticatedPlayer] = await Promise.all([
          round3Service.openSession(),
          round3Service.getRun().catch(() => ({ success: false, run: createDefaultRun() })),
          session.playerNumber ? Promise.resolve(session.playerNumber) : authService.getPlayerNumber(),
        ]);
        if (!isCancelled) {
          setState(sessionState);
          setRun(parseRunState(runState));
          setPlayerNumber(authenticatedPlayer);
        }
      } catch (reason) {
        if (!isCancelled) {
          const message = reason instanceof Error ? reason.message : 'Could not open the Round 3 session.';
          setError(
            message.includes('No squad token') || message.includes('Authentication required')
              ? 'Your browser session is not connected to the game server. Sign out, then log in again with the backend running.'
              : message
          );
        }
      }
    };
    void runConnect();
    return () => {
      isCancelled = true;
    };
  }, [session.playerNumber]);

  const loadDevelopmentSample = async () => {
    setError('');
    try { setState(await round3Service.loadDevelopmentSample()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Round 3 action failed.'); }
  };

  const saveGameState = useCallback((gameState: unknown) => round3Service.saveGameState(gameState), []);
  const completeHunt = useCallback(() => round3Service.completeHunt(), []);
  const handleTestingCardUsed = useCallback((id: TestPowerCardId) => {
    setUsedTestCards(markTestingCardUsed(session.teamName, id));
  }, [session.teamName]);

  if (state && run && playerNumber) {
    return (
      <div className="ph-game-root">
        <GameScreen
          teamName={session.teamName}
          cards={testCardIds.length ? cardsFromTestingInventory(testCardIds, usedTestCards) : inventoryToPowerCards(state.inventory)}
          testingCardIds={testCardIds}
          onTestingCardUsed={handleTestingCardUsed}
          onToggleTestingCard={(id) => setTestCardIds((current) => {
            const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
            if (!next.includes(id)) setUsedTestCards((used) => {
              const nextUsed = used.filter((value) => value !== id);
              writeUsedTestingCards(session.teamName, nextUsed);
              return nextUsed;
            });
            writeTestingInventory(session.teamName, next);
            return next;
          })}
          inventory={state.inventory}
          savedGameState={state.session.playerProgress.engine}
          initialRun={run}
          externalError={error}
          onExit={onReturnHome}
          onSaveGameState={saveGameState}
          onComplete={completeHunt}
          onLoadDevelopmentSample={() => { void loadDevelopmentSample(); }}
        />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-cartel-void text-cartel-bone font-sans px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between gap-4 mb-8">
          <button onClick={onReturnHome} className="font-cinzel text-xs tracking-widest text-cartel-silver/70 hover:text-white cursor-pointer">← RETURN</button>
          <div className="text-right"><div className="font-cinzel text-xs text-cartel-silver/70">{session.teamName}</div><div className="font-gothic text-3xl sm:text-4xl text-cartel-cyan">PARADOX LAB</div></div>
        </header>

        <section className="stone-panel rounded-xl p-5 sm:p-7">
          <h1 className="font-cinzel text-lg text-cartel-amber">ROUND 3 FOUNDATION</h1>
          <p className="mt-2 text-cartel-silver/80">Connecting to the team’s saved Round 3 run and timer.</p>
          {error && <p role="alert" className="mt-4 rounded border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
          {error && <button className="mt-4 rounded border border-cartel-amber/50 px-4 py-2 text-sm text-cartel-amber" onClick={() => { void connect(); }}>RECONNECT</button>}
          {!state && !error && <p className="mt-5 text-cartel-silver/70">Connecting to the authenticated Round 3 session…</p>}

        </section>
      </div>
    </main>
  );
};
