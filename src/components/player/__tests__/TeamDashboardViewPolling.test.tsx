import '@testing-library/jest-dom/vitest';
import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TeamDashboardView } from '../TeamDashboardView';
import { round1Api } from '../../../services/round1ApiService';
import type { TeamSession } from '../../../types/team.types';

vi.mock('../../../services/progressionService', () => ({
  progressionService: { getMine: vi.fn().mockResolvedValue({ rounds: [] }) },
  errorStatus: vi.fn(() => 0),
}));
vi.mock('../../../services/round1ApiService', () => ({ round1Api: { getState: vi.fn() } }));
vi.mock('../TeamProgressionSummary', () => ({ TeamProgressionSummary: () => null }));

describe('team dashboard Round 1 status polling', () => {
  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

  const renderDashboard = (isRound1GameActive: boolean) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    return render(
      <TeamDashboardView
      session={{ teamId: 'team-poll', teamName: 'Polling Team', credits: 500 } as TeamSession}
      round1Config={{} as never}
      onLogout={() => undefined}
      onEnterRound1={() => undefined}
      onClose={() => undefined}
      isRound1GameActive={isRound1GameActive}
      />
    );
  };

  it('stops dashboard status requests while Round 1 is actively open', async () => {
    vi.useFakeTimers();
    vi.mocked(round1Api.getState).mockResolvedValue({} as never);
    renderDashboard(true);
    await act(async () => { await Promise.resolve(); await vi.advanceTimersByTimeAsync(60_000); });
    expect(round1Api.getState).not.toHaveBeenCalled();
  });

  it('stops status polling after the server confirms Round 1 is running', async () => {
    vi.useFakeTimers();
    vi.mocked(round1Api.getState).mockResolvedValue({ round: { isActive: true } } as never);
    renderDashboard(false);
    expect(document.visibilityState).toBe('visible');
    await act(async () => { await Promise.resolve(); await vi.advanceTimersByTimeAsync(60_000); });
    expect(round1Api.getState).toHaveBeenCalledTimes(1);
  });

  it('adapts to Round 2: The Haunted Auction when Round 2 is unlocked or in progress', () => {
    const onSelectRound = vi.fn();
    const progression = {
      rounds: [
        { round_id: 1, status: 'COMPLETED' as const, eligible_at: null, started_at: null, completed_at: null, score: 0, max_score: 500 },
        { round_id: 2, status: 'AVAILABLE' as const, eligible_at: '2026-11-12T00:00:00Z', started_at: null, completed_at: null, score: 0, max_score: 500 },
        { round_id: 3, status: 'LOCKED' as const, eligible_at: null, started_at: null, completed_at: null, score: 0, max_score: 500 },
        { round_id: 4, status: 'LOCKED' as const, eligible_at: null, started_at: null, completed_at: null, score: 0, max_score: 500 },
      ],
      hunts: [],
    };

    const { getByText, getByRole } = render(
      <TeamDashboardView
        session={{ teamId: 'team-r2', teamName: 'Auction Squad', credits: 400 } as TeamSession}
        onLogout={() => undefined}
        onEnterRound1={() => undefined}
        onSelectRound={onSelectRound}
        onClose={() => undefined}
        progression={progression}
      />
    );

    expect(getByText('THE HAUNTED AUCTION')).toBeInTheDocument();
    expect(getByText('AUCTION FLOOR IS UNSEALED')).toBeInTheDocument();
    const enterAuctionBtn = getByRole('button', { name: /ENTER THE AUCTION/i });
    expect(enterAuctionBtn).not.toBeDisabled();
    enterAuctionBtn.click();
    expect(onSelectRound).toHaveBeenCalledWith(2);
  });
});
