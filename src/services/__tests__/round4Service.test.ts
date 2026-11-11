import { afterEach, describe, expect, it, vi } from 'vitest';
import { round4Service } from '../round4Service';
import { apiUrl } from '../apiBaseUrl';

const response = (data: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const state = (index: number, discovered: boolean) => ({
  success: true,
  route: { routeId: 'route-4', routeNumber: 4, romanNumeral: 'IV', routeName: 'Assigned Route', routeSubtitle: 'Server route' },
  progress: { currentStepIndex: index, targetDiscovered: discovered, solvedStepIds: index ? ['r4_s1'] : [], commonRoomArrived: false, isFinished: false, finishedAt: null },
  activeStep: { stepId: `r4_s${index + 1}`, clueIndex: index + 1, floorId: 'floor-5', locationName: 'Server Clue', targetPoint: { x: 10, y: 20 }, triggerRadius: 30, riddle: discovered ? 'Server riddle' : '', fieldLocationHint: discovered ? 'Server hint' : '', isCommonFinal: false },
  totalSteps: 5, winner: null, isWinner: false,
});

describe('Round 04 PostgreSQL service', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('uses authenticated server status and route state without client-supplied team identity', async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => String(url) === apiUrl('/api/round4/status')
      ? response({ success: true, qualified: true, isReleased: true, assignedRouteId: 'route-4', winner: null })
      : response(state(0, false)));
    vi.stubGlobal('fetch', fetchMock);
    await expect(round4Service.getStatus()).resolves.toMatchObject({ qualified: true, isReleased: true, assignedRouteId: 'route-4' });
    await round4Service.fetchMyRouteState();
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([apiUrl('/api/round4/status'), apiUrl('/api/round4/my-route')]);
    expect(fetchMock.mock.calls.every(([, init]) => (init as RequestInit).credentials === 'include')).toBe(true);
  });

  it('updates discovery and answer progress only from server-confirmed responses', async () => {
    let confirmed = state(0, false);
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path === apiUrl('/api/round4/discover-target')) { confirmed = state(0, true); return response({ success: true, targetDiscovered: true, state: confirmed }); }
      if (path === apiUrl('/api/round4/submit-clue')) { confirmed = state(1, false); return response({ success: true, message: 'Clue solved.', state: confirmed }); }
      if (path === apiUrl('/api/round4/my-route')) return response(confirmed);
      return response({ message: 'Unexpected request' }, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    const discovered = await round4Service.markTargetDiscovered();
    expect(discovered.progress.targetDiscovered).toBe(true);
    const submitted = await round4Service.submitAnswer('r4_s1', 'verified answer');
    expect(submitted.success).toBe(true);
    expect(submitted.state?.progress.currentStepIndex).toBe(1);
    const mutationCalls = fetchMock.mock.calls.filter(([url]) => String(url) !== apiUrl('/api/round4/my-route'));
    expect(mutationCalls.map(([url]) => String(url))).toEqual([apiUrl('/api/round4/discover-target'), apiUrl('/api/round4/submit-clue')]);
    for (const [, init] of mutationCalls) {
      expect((init as RequestInit).credentials).toBe('include');
      expect(JSON.parse(String((init as RequestInit).body))).not.toHaveProperty('teamId');
      expect(JSON.parse(String((init as RequestInit).body)).requestId).toBeTruthy();
    }
  });

  it('rejects qualification status API failures instead of granting access', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({ message: 'Administrator session required.' }, 401)));
    await expect(round4Service.getStatus()).rejects.toThrow('Administrator session required.');
  });
});
