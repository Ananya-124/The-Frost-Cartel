import { afterEach, describe, expect, it, vi } from 'vitest';

describe('API bearer token recovery', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    sessionStorage.clear();
    localStorage.clear();
    delete window.__fc_fetch_patched;
    vi.resetModules();
  });

  it('retries once with the session cookie after a stale stored token receives 401', async () => {
    delete window.__fc_fetch_patched;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Invalid squad session.' }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    window.fetch = fetchMock;

    const { apiUrl, setStoredToken } = await import('../apiBaseUrl');
    setStoredToken('team', 'stale-team-token');

    const response = await window.fetch(apiUrl('/api/round4/status'), { credentials: 'include' });
    const firstInit = fetchMock.mock.calls[0][1] as RequestInit;
    const retryInit = fetchMock.mock.calls[1][1] as RequestInit;

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new Headers(firstInit.headers).get('Authorization')).toBe('Bearer stale-team-token');
    expect(new Headers(retryInit.headers).has('Authorization')).toBe(false);
    expect(retryInit.credentials).toBe('include');
    expect(sessionStorage.getItem('fc_team_token')).toBeNull();
    expect(localStorage.getItem('fc_team_token')).toBeNull();
  });
});
