import React, { useCallback, useEffect, useState } from 'react';
import type { TeamSession } from '../../../types/team.types';
import type { Round3StateResponse } from '../../../types/round3.types';
import type { Round3RunState } from '../../../types/round3.types';
import { round3Service } from '../../../services/round3Service';
import { authService } from '../../../services/authService';
import { inventoryToPowerCards } from './runtime/inventoryCards';
import GameScreen from './runtime/components/screens/GameScreen';
import './runtime/styles/game.css';

interface ParadoxHuntProps {
  session: TeamSession;
  onReturnHome: () => void;
}

export const ParadoxHunt: React.FC<ParadoxHuntProps> = ({ session, onReturnHome }) => {
  const [state, setState] = useState<Round3StateResponse | null>(null);
  const [run, setRun] = useState<Round3RunState | null>(null);
  const [playerNumber, setPlayerNumber] = useState<1 | 2>(session.playerNumber ?? 1);
  const [error, setError] = useState('');

  const connect = useCallback(async () => {
    setError('');
    try {
      const [sessionState, runState, authenticatedPlayer] = await Promise.all([
        round3Service.openSession(), round3Service.getRun(),
        authService.getPlayerNumber(),
      ]);
      setState(sessionState);
      setRun(runState.run);
      if (authenticatedPlayer === 1 || authenticatedPlayer === 2) setPlayerNumber(authenticatedPlayer);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not open the Round 3 session.';
      setError(message.includes('No squad token') || message.includes('Authentication required')
        ? 'Your browser session is not connected to the game server. Sign out, then log in again with the backend running.'
        : message);
    }
  }, []);

  useEffect(() => { void connect(); }, [connect]);

  const loadDevelopmentSample = async () => {
    setError('');
    try { setState(await round3Service.loadDevelopmentSample()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Round 3 action failed.'); }
  };

  const saveGameState = useCallback((gameState: unknown) => round3Service.saveGameState(gameState), []);
  const completeHunt = useCallback(() => round3Service.completeHunt(), []);

  if (state && run) {
    return (
      <div className="ph-game-root">
        <GameScreen
          teamName={session.teamName}
          cards={inventoryToPowerCards(state.inventory)}
          inventory={state.inventory}
          savedGameState={state.session.playerProgress.engine}
          initialRun={run}
          playerNumber={playerNumber}
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
          <div className="text-right"><div className="font-cinzel text-xs text-cartel-silver/70">{session.teamName}</div><div className="font-gothic text-3xl sm:text-4xl text-cartel-cyan">PARADOX HUNT</div></div>
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
