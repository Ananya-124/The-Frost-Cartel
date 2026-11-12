import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Round1Dashboard } from '../game/Round1Dashboard';
import { Round1Service } from '../../services/round1Service';
import { round1Api, type Round1StateResponse } from '../../services/round1ApiService';
import type { TeamSession } from '../../types/team.types';

vi.mock('../../services/round1ApiService', () => ({ round1Api: { getState: vi.fn(), action: vi.fn() } }));

describe('Round 1 state polling', () => {
  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

  it('keeps one thirty-second recovery poll even when the parent recreates the credit callback', async () => {
    vi.useFakeTimers();
    const game = new Round1Service();
    const gameSession = game.getTeamSession('poll-team', 'Polling Team');
    const state = {
      success: true,
      round: { id: 1, name: 'The Graveyard Escape', isActive: true, totalDurationSeconds: 1320, remainingSeconds: 1320, endsAt: null },
      team: { score: 0, totalCredits: 500, maxCredits: 500, isPaused: false },
      session: gameSession,
      config: { stage1: game.getStage1Config(), stage2: game.getStage2Config(), stage3: game.getStage3Config() },
    } as Round1StateResponse;
    vi.mocked(round1Api.getState).mockResolvedValue(state);

    const Wrapper = () => {
      const [session, setSession] = useState({ teamId: 'poll-team', teamName: 'Polling Team', credits: 500 } as TeamSession);
      return <Round1Dashboard session={session} onReturnHome={() => undefined} onUpdateCredits={(credits) => setSession((current) => ({ ...current, credits }))} />;
    };

    render(<Wrapper />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
    expect(round1Api.getState).toHaveBeenCalledTimes(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(29_999); });
    expect(round1Api.getState).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(round1Api.getState).toHaveBeenCalledTimes(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(round1Api.getState).toHaveBeenCalledTimes(3);
  });

  it('renders from the server deadline and catches up after browser timer throttling without API calls', async () => {
    vi.useFakeTimers();
    const game = new Round1Service();
    const gameSession = game.beginRound1('timer-team', 'Timer Team');
    const endsAt = new Date(Date.now() + 60_000).toISOString();
    gameSession.roundDeadline = endsAt;
    const state = {
      success: true,
      round: { id: 1, name: 'The Graveyard Escape', isActive: true, totalDurationSeconds: 1320, remainingSeconds: 60, endsAt },
      team: { score: 0, totalCredits: 500, maxCredits: 500, isPaused: false },
      session: gameSession,
      config: { stage1: game.getStage1Config(), stage2: game.getStage2Config(), stage3: game.getStage3Config() },
    } as Round1StateResponse;
    vi.mocked(round1Api.getState).mockResolvedValue(state);
    render(<Round1Dashboard session={{ teamId: 'timer-team', teamName: 'Timer Team' } as TeamSession} onReturnHome={() => undefined} onUpdateCredits={() => undefined} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(screen.getByText(/01:00/)).toBeInTheDocument();

    // Simulate a suspended tab: wall time advances while interval callbacks do not.
    act(() => { vi.setSystemTime(Date.now() + 5_000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
    expect(screen.getByText(/00:54/)).toBeInTheDocument();
    expect(round1Api.getState).toHaveBeenCalledTimes(1);
  });

  it('shows server wallet credits and forwards confirmed action balances to the team session', async () => {
    const game = new Round1Service();
    const gameSession = game.beginRound1('wallet-team', 'Wallet Team');
    gameSession.credits = 20; // Official score is distinct from the spendable wallet.
    const state = {
      success: true,
      round: { id: 1, name: 'The Graveyard Escape', isActive: true, totalDurationSeconds: 1320, remainingSeconds: 1320, endsAt: gameSession.roundDeadline },
      team: { score: 20, totalCredits: 545, maxCredits: 500, isPaused: false },
      session: gameSession,
      config: { stage1: game.getStage1Config(), stage2: game.getStage2Config(), stage3: game.getStage3Config() },
    } as Round1StateResponse;
    vi.mocked(round1Api.getState).mockResolvedValue(state);
    const updatedSession = { ...gameSession, credits: 60 };
    vi.mocked(round1Api.action).mockResolvedValue({ success: true, session: updatedSession, score: 60, totalCredits: 585, completed: false });
    const onUpdateCredits = vi.fn();
    render(<Round1Dashboard session={{ teamId: 'wallet-team', teamName: 'Wallet Team' } as TeamSession} onReturnHome={() => undefined} onUpdateCredits={onUpdateCredits} />);

    expect(await screen.findByText('WALLET 545 CR')).toBeInTheDocument();
    await act(async () => { screen.getByRole('button', { name: /Enter Stage 1:/i }).click(); });
    expect(round1Api.action).toHaveBeenCalledWith('enter', { stageId: 'stage-1' });
    expect(onUpdateCredits).toHaveBeenCalledWith(585);
  });

  it('shows a retryable error instead of crashing on an incomplete state response', async () => {
    vi.mocked(round1Api.getState).mockResolvedValue({ success: true } as Round1StateResponse);
    const session = { teamId: 'bad-state-team', teamName: 'Incomplete Response' } as TeamSession;
    render(<Round1Dashboard session={session} onReturnHome={() => undefined} onUpdateCredits={() => undefined} />);
    expect(await screen.findByText(/server returned incomplete game state/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
