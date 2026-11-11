import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminReadService } from '../adminReadService';
import { apiUrl } from '../apiBaseUrl';

const apiTeam = {
  id: 'team-1', teamName: 'Ashen Circle', isPaused: false, score: 125, maxCredits: 500, totalCredits: 85,
  loginCount: 1, lastLoginAt: null, createdAt: '2026-01-01T00:00:00Z',
  stages: [{ stage_id: 1, status: 'COMPLETED', score: 125, max_score: 150, completed_at: '2026-01-01T00:10:00Z' }],
  rounds: [{ roundId: 1, status: 'IN_PROGRESS', completedAt: null }], hunts: [], round4: null,
};
const response = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

describe('admin PostgreSQL read service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      if (path === apiUrl('/api/admin/teams')) return response({ success: true, teams: [apiTeam] });
      if (path === apiUrl('/api/admin/dashboard')) return response({ success: true, data: { stats: { totalTeams: 1, activeTeams: 1, pausedTeams: 0, averageScore: 125, round1Active: true }, recentLogs: [] } });
      if (path === apiUrl('/api/round1/admin/config')) return response({ success: true, configuration: { lifecycle: 'running' } });
      if (path === apiUrl('/api/admin/results')) return response({ success: true, results: [{ id: 'team-1', teamName: 'Ashen Circle', score: 125, rank: 1, maxCredits: 500, last_login_at: null, completedStages: 1 }] });
      return response({ success: false, message: 'not found' }, 404);
    }));
  });

  it('uses authenticated API reads and keeps official score separate from wallet credits', async () => {
    const [teams, dashboard, results] = await Promise.all([
      adminReadService.getTeams(), adminReadService.getDashboardMetrics(), adminReadService.getResults(),
    ]);
    expect(teams[0]).toMatchObject({ officialScore: 125, credits: 85, currentRound: 'Round 1' });
    expect(teams[0].stages['stage-1']).toMatchObject({ earnedCredits: 125, rewardCredits: 150, status: 'completed' });
    expect(dashboard).toMatchObject({ totalTeams: 1, activeTeams: 1, round1Status: 'running' });
    expect(results[0]).toMatchObject({ rank: 1, officialScore: 125, credits: 85 });
    expect(vi.mocked(fetch).mock.calls.every(([, init]) => (init as RequestInit).credentials === 'include')).toBe(true);
  });

  it('surfaces API failures instead of falling back to sample data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ success: false, message: 'Admin session expired.' }, 401)));
    await expect(adminReadService.getTeams()).rejects.toThrow('Admin session expired.');
  });

  it('sends admin team writes through credentialed server APIs', async () => {
    const fetchMock = vi.fn(async () => response({ success: true, newPassword: 'server-issued' }));
    vi.stubGlobal('fetch', fetchMock);
    await adminReadService.createTeam('New Circle', 'pass-1234');
    await adminReadService.renameTeam('team-1', 'Renamed Circle');
    await adminReadService.setTeamPaused('team-1', true);
    await adminReadService.resetTeamPassword('team-1');
    await adminReadService.deleteTeam('team-1');

    const calls = fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit]>;
    expect(calls.map(([url, init]) => [String(url), init.method, init.credentials])).toEqual([
      [apiUrl('/api/admin/teams'), 'POST', 'include'],
      [apiUrl('/api/admin/teams/team-1'), 'PUT', 'include'],
      [apiUrl('/api/admin/teams/team-1/pause'), 'POST', 'include'],
      [apiUrl('/api/admin/teams/team-1/reset-password'), 'POST', 'include'],
      [apiUrl('/api/admin/teams/team-1'), 'DELETE', 'include'],
    ]);
    expect(JSON.parse(String(calls[2][1].body))).toEqual({ isPaused: true });
  });
});
