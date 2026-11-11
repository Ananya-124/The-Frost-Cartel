import { afterEach, describe, expect, it, vi } from 'vitest';
import { authService } from '../authService';

describe('AuthService backend session', () => {
  afterEach(() => {
    authService.logout();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('uses the same-origin API proxy and stores the authenticated team profile', async () => {
    vi.stubEnv('MODE', 'development');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        token: 'team-token',
        team: { id: 'team-123', teamName: 'TEAM AI', score: 240, totalCredits: 42, isPaused: false },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await authService.loginTeam('TEAM AI', 'secret-pass');

    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL ?? ''}/api/auth/team-login`,
      expect.objectContaining({
        credentials: 'include',
        body: JSON.stringify({ teamName: 'TEAM AI', password: 'secret-pass' }),
      }),
    );
    expect(result.success).toBe(true);
    expect(authService.getCurrentSession()).toMatchObject({ teamId: 'team-123', teamName: 'TEAM AI', credits: 42 });
  });

  it('does not trust cached profile data and revalidates its session with the server', async () => {
    vi.stubEnv('MODE', 'development');
    sessionStorage.setItem('frost_cartel_session', JSON.stringify({ teamId: 'forged-team', teamName: 'Forged', credits: 999, loginTime: 'old' }));
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, playerNumber: 2, team: { id: 'team-server', teamName: 'Server Team', score: 800, totalCredits: 17, isPaused: false } }) });
    vi.stubGlobal('fetch', fetchMock);
    const restored = await authService.restoreSession();
    expect(fetchMock).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL ?? ''}/api/auth/session`, expect.objectContaining({ credentials: 'include', signal: expect.any(AbortSignal) }));
    expect(restored).toMatchObject({ teamId: 'team-server', teamName: 'Server Team', credits: 17, playerNumber: 2 });
  });

  it('clears the cached profile when the server rejects the session', async () => {
    sessionStorage.setItem('frost_cartel_session', JSON.stringify({ teamId: 'forged-team', teamName: 'Forged', credits: 999 }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ success: false }) }));
    await expect(authService.restoreSession()).resolves.toBeNull();
    expect(authService.getCurrentSession()).toBeNull();
    expect(sessionStorage.getItem('frost_cartel_session')).toBeNull();
  });
});
