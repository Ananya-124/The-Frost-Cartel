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
        team: { id: 'team-123', teamName: 'TEAM AI', score: 42, isPaused: false },
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
});
