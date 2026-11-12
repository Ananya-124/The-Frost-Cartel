const API_ROOT = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

/** Uses same-origin requests by default and supports a separately hosted API in production. */
export function apiUrl(path: string): string {
  return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return (
      sessionStorage.getItem('fc_admin_token') ||
      localStorage.getItem('fc_admin_token') ||
      sessionStorage.getItem('fc_team_token') ||
      localStorage.getItem('fc_team_token') ||
      null
    );
  } catch {
    return null;
  }
}

export function setStoredToken(type: 'team' | 'admin', token: string): void {
  try {
    sessionStorage.setItem(`fc_${type}_token`, token);
    localStorage.setItem(`fc_${type}_token`, token);
  } catch {}
}

export function clearStoredToken(type?: 'team' | 'admin'): void {
  try {
    if (type) {
      sessionStorage.removeItem(`fc_${type}_token`);
      localStorage.removeItem(`fc_${type}_token`);
    } else {
      sessionStorage.removeItem('fc_team_token');
      localStorage.removeItem('fc_team_token');
      sessionStorage.removeItem('fc_admin_token');
      localStorage.removeItem('fc_admin_token');
    }
  } catch {}
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

declare global {
  interface Window {
    __fc_fetch_patched?: boolean;
  }
}

// Auto-inject Authorization header and credentials: 'include' across all API calls
// to guarantee 100% authentication reliability on systems where third-party cookies are blocked.
if (typeof window !== 'undefined' && !window.__fc_fetch_patched) {
  window.__fc_fetch_patched = true;
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (urlStr.includes('/api/')) {
      const headers = new Headers(init?.headers);
      const token = getStoredToken();
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return originalFetch.call(this, input, {
        ...init,
        credentials: init?.credentials ?? 'include',
        headers,
      });
    }
    return originalFetch.call(this, input, init);
  };
}
