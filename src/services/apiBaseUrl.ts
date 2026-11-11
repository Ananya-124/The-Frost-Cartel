const API_ROOT = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

/** Uses same-origin requests by default and supports a separately hosted API in production. */
export function apiUrl(path: string): string {
  return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
}
