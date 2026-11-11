import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GothicLeaderboardModal } from '../leaderboard/GothicLeaderboardModal';
import { apiUrl } from '../../services/apiBaseUrl';

describe('public PostgreSQL leaderboard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, leaderboard: [
        { team_id: 'team-a', team_name: 'Ashen Circle', score: 240, rank: 1, updated_at: '2026-01-01T00:00:00Z' },
        { team_id: 'team-b', team_name: 'Night Watch', score: 180, rank: 2, updated_at: '2026-01-01T00:00:00Z' },
      ] }),
    }));
  });

  it('shows server official scores and preserves server rank', async () => {
    render(<GothicLeaderboardModal isOpen onClose={vi.fn()} />);
    expect(await screen.findByText('Ashen Circle')).toBeInTheDocument();
    expect(screen.getByText('240')).toBeInTheDocument();
    expect(screen.getByText(/Ranked by Official Score/)).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === '#2')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(apiUrl('/api/leaderboard'), expect.objectContaining({ credentials: 'include' }));
  });

  it('shows an API error instead of fabricated standings', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ message: 'Leaderboard service is unavailable.' }) }));
    render(<GothicLeaderboardModal isOpen onClose={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Leaderboard service is unavailable.');
    expect(screen.queryByText('Phantom Crypt')).not.toBeInTheDocument();
  });
});
