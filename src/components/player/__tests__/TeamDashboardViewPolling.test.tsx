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

  const renderDashboard = (isRound1GameActive: boolean) => render(
    <TeamDashboardView
      session={{ teamId: 'team-poll', teamName: 'Polling Team', credits: 500 } as TeamSession}
      round1Config={{} as never}
      onLogout={() => undefined}
      onEnterRound1={() => undefined}
      onClose={() => undefined}
      isRound1GameActive={isRound1GameActive}
    />,
  );

  it('stops dashboard status requests while Round 1 is actively open', async () => {
    vi.useFakeTimers();
    vi.mocked(round1Api.getState).mockResolvedValue({} as never);
    renderDashboard(true);
    await act(async () => { await Promise.resolve(); await vi.advanceTimersByTimeAsync(60_000); });
    expect(round1Api.getState).not.toHaveBeenCalled();
  });

  it('retains the 10-second status check while the team dashboard is outside gameplay', async () => {
    vi.useFakeTimers();
    vi.mocked(round1Api.getState).mockResolvedValue({ round: { isActive: true } } as never);
    renderDashboard(false);
    await act(async () => { await Promise.resolve(); await vi.advanceTimersByTimeAsync(60_000); });
    expect(round1Api.getState).toHaveBeenCalledTimes(7);
  });
});
