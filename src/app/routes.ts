export const ROUTES = {
  PUBLIC: '/',
  ADMIN: '/admin',
  ADMIN_HASH: '#/admin',
  ADMIN_DASHBOARD: '#/admin/dashboard',
  ADMIN_TEAMS: '#/admin/teams',
  ADMIN_ROUNDS: '#/admin/rounds',
  ADMIN_RESULTS: '#/admin/results',
  ROUND_4: '#/round-4',
} as const;

export function isAdminRoute(
  hash: string = window.location.hash,
  pathname: string = window.location.pathname
): boolean {
  return hash.startsWith('#/admin') || pathname === '/admin' || pathname.startsWith('/admin/');
}

export function isRound4Route(
  hash: string = window.location.hash,
  search: string = window.location.search
): boolean {
  if (hash === '#/round-4' || hash === '#/round-04') return true;
  if (typeof search === 'string' && search.length > 0) {
    const params = new URLSearchParams(search);
    return params.get('round') === '4' || params.get('round') === '04';
  }
  return false;
}
