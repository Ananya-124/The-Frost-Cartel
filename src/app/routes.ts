export const ROUTES = {
  PUBLIC: '/',
  ADMIN: '/admin',
  ADMIN_HASH: '#/admin',
  ADMIN_DASHBOARD: '#/admin/dashboard',
  ADMIN_TEAMS: '#/admin/teams',
  ADMIN_ROUNDS: '#/admin/rounds',
  ADMIN_RESULTS: '#/admin/results',
} as const;

export function isAdminRoute(
  hash: string = window.location.hash,
  pathname: string = window.location.pathname
): boolean {
  return hash.startsWith('#/admin') || pathname === '/admin' || pathname.startsWith('/admin/');
}
