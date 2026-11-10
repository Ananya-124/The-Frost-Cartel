export const ROUTES = {
  PUBLIC: '/',
  ADMIN: '/admin',
  ADMIN_HASH: '#/admin',
  ADMIN_DASHBOARD: '#/admin/dashboard',
  ADMIN_TEAMS: '#/admin/teams',
  ADMIN_ROUNDS: '#/admin/rounds',
  ADMIN_RESULTS: '#/admin/results',
  ROUND_1: '#/round-1',
  ROUND_2: '#/round-2',
  ROUND_3: '#/round-3',
  ROUND_4: '#/round-4',
} as const;

export function isAdminRoute(
  hash: string = window.location.hash,
  pathname: string = window.location.pathname
): boolean {
  return hash.startsWith('#/admin') || pathname === '/admin' || pathname.startsWith('/admin/');
}

export function isRound1Route(
  hash: string = window.location.hash,
  search: string = window.location.search
): boolean {
  if (hash === '#/round-1' || hash === '#/round-01') return true;
  if (typeof search === 'string' && search.length > 0) {
    const params = new URLSearchParams(search);
    return params.get('round') === '1' || params.get('round') === '01';
  }
  return false;
}

export function isRound2Route(hash: string = window.location.hash): boolean {
  return hash === '#/round-2' || hash === '#/round-02';
}

export function isRound3Route(hash: string = window.location.hash, search: string = window.location.search): boolean {
  if (hash === '#/round-3' || hash === '#/round-03') return true;
  if (typeof search === 'string' && search.length > 0) {
    const params = new URLSearchParams(search);
    return params.get('round') === '3' || params.get('round') === '03';
  }
  return false;
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
