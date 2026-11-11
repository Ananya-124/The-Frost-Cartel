import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadLeaderboard } from './leaderboardStorage';
import { apiUrl } from '../../../../../services/apiBaseUrl';

describe('Round 3 official leaderboard source', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('reads official score and rank from the shared API with credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, leaderboard: [{ team_id: 'team-1', team_name: 'Circle', score: 432, rank: 1 }] }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadLeaderboard()).resolves.toEqual([{ team_id: 'team-1', team_name: 'Circle', score: 432, rank: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith(apiUrl('/api/leaderboard'), { credentials: 'include' });
  });

  it('rejects API failures instead of returning locally stored rankings', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ message: 'Unavailable' }) }));
    await expect(loadLeaderboard()).rejects.toThrow('Unavailable');
  });
});
