import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EndScreen from './EndScreen';
import { apiUrl } from '../../../../../../services/apiBaseUrl';

const summary = { teamName: 'Circle', totalScore: 900, huntScores: [300, 300, 300] as [number, number, number], evidence: 4, captures: 1, bonus: 0, penalties: 0, rank: null, leaderboard: [] };

describe('Round 3 final result', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('shows server-confirmed team score and ranking, never the local run score as official', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, leaderboard: [{ team_id: 'team-1', team_name: 'Circle', score: 1250, rank: 3 }] }) }));
    render(<EndScreen summary={summary} teamId="team-1" onNewSession={vi.fn()} />);
    expect(await screen.findByText('Official team score: 1250')).toBeInTheDocument();
    expect(screen.getByText('Official rank #3')).toBeInTheDocument();
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(apiUrl('/api/leaderboard'), { credentials: 'include' });
  });

  it('does not fabricate a score or rank when the leaderboard is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ message: 'Leaderboard unavailable.' }) }));
    render(<EndScreen summary={summary} teamId="team-1" onNewSession={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Leaderboard unavailable.');
    expect(screen.getByText('Official rank unavailable')).toBeInTheDocument();
    expect(screen.getByText('Official team score: Unavailable')).toBeInTheDocument();
  });
});
