const API_ROOT = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

/** Uses same-origin requests by default and supports a separately hosted API in production. */
export function apiUrl(path: string): string {
  return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getStoredToken(type?: 'team' | 'admin'): string | null {
  if (typeof window === 'undefined') return null;
  try {
    if (type === 'admin') {
      return sessionStorage.getItem('fc_admin_token') || localStorage.getItem('fc_admin_token') || null;
    }
    if (type === 'team') {
      return sessionStorage.getItem('fc_team_token') || localStorage.getItem('fc_team_token') || null;
    }
    return (
      sessionStorage.getItem('fc_team_token') ||
      localStorage.getItem('fc_team_token') ||
      sessionStorage.getItem('fc_admin_token') ||
      localStorage.getItem('fc_admin_token') ||
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
      const isAdminRoute = urlStr.includes('/admin');
      const tokenType = isAdminRoute ? 'admin' : 'team';
      const token = getStoredToken(tokenType);
      const retryWithCookie = Boolean(token && !headers.has('Authorization') && !urlStr.includes('/api/auth/team-login'));
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const requestInit = {
        ...init,
        credentials: init?.credentials ?? 'include',
        headers,
      };
      return originalFetch.call(this, input, requestInit).then((response) => {
        if (response.status !== 401 || !retryWithCookie) return response;
        clearStoredToken(tokenType);
        const cookieHeaders = new Headers(headers);
        cookieHeaders.delete('Authorization');
        return originalFetch.call(this, input, { ...requestInit, headers: cookieHeaders });
      });
    }
    return originalFetch.call(this, input, init);
  };
}
