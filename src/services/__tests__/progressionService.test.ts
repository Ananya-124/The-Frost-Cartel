import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminAuthService, progressionService, errorStatus } from '../progressionService';
import { apiUrl } from '../apiBaseUrl';

describe('progressionService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('loads only the authenticated team progression with cookies and no team id', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ success: true, teamId: 'server-team', rounds: [], hunts: [] }), { status: 200 }));
    await progressionService.getMine();
    expect(fetchMock).toHaveBeenCalledWith(apiUrl('/api/progression/me'), expect.objectContaining({ credentials: 'include' }));
  });

  it('starts a round through the authenticated progression endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ success: true, rounds: [], hunts: [] }), { status: 200 }));
    await progressionService.startRound(3);
    expect(fetchMock).toHaveBeenCalledWith(apiUrl('/api/progression/me/rounds/3/start'), expect.objectContaining({ method: 'POST', credentials: 'include' }));
  });

  it('surfaces expired sessions and backend failures for retry UI', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: 'Admin session expired.' }), { status: 401 }));
    await expect(progressionService.getMine()).rejects.toMatchObject({ message: 'Admin session expired.', status: 401 });
    try { await progressionService.getMine(); } catch (error) { expect(errorStatus(error)).toBe(401); }
  });

  it('sends admin actions with a reason and the authenticated cookie', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ success: true, rounds: [], hunts: [] }), { status: 200 }));
    await progressionService.adminAction('team-1', 'HUNT', 2, 'unlock', 'Hunt I verified');
    expect(fetchMock).toHaveBeenCalledWith(apiUrl('/api/admin/progression/team-1/HUNT/2/unlock'), expect.objectContaining({
      method: 'POST', credentials: 'include', body: JSON.stringify({ reason: 'Hunt I verified' }),
    }));
  });

  it.each(['unlock', 'lock', 'complete', 'reset'] as const)('supports admin %s action through the authenticated API', async (action) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ success: true, rounds: [], hunts: [] }), { status: 200 }));
    await progressionService.adminAction('team-a', 'ROUND', 2, action);
    expect(fetchMock).toHaveBeenCalledWith(apiUrl(`/api/admin/progression/team-a/ROUND/2/${action}`), expect.objectContaining({ method: 'POST', credentials: 'include' }));
  });

  it('authenticates administrator credentials through the existing login route', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ success: true, admin: { username: 'warden', mustChangePassword: false } }), { status: 200 }));
    await expect(adminAuthService.login('warden', 'secret')).resolves.toEqual({ username: 'warden', mustChangePassword: false });
    expect(fetchMock).toHaveBeenCalledWith(apiUrl('/api/admin/login'), expect.objectContaining({ method: 'POST', credentials: 'include', body: JSON.stringify({ username: 'warden', password: 'secret' }) }));
  });
});
