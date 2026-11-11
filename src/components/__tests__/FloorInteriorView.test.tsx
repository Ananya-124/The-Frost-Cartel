import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FloorInteriorView } from '../game/round4/FloorInteriorView';
import { COLLEGE_FLOORS } from '../game/round4/FloorConfiguration';
import { apiUrl } from '../../services/apiBaseUrl';

const assignedState = {
  success: true,
  route: { routeId: 'route-3', routeNumber: 3, romanNumeral: 'III', routeName: 'Server Assigned Route', routeSubtitle: 'Assigned from PostgreSQL' },
  progress: { currentStepIndex: 1, targetDiscovered: false, solvedStepIds: ['r3_s1'], commonRoomArrived: false, isFinished: false, finishedAt: null },
  activeStep: { stepId: 'r3_s2', clueIndex: 2, floorId: 'floor-6', locationName: 'Server Hall', targetPoint: { x: 400, y: 160 }, triggerRadius: 35, riddle: '', fieldLocationHint: '', isCommonFinal: false },
  totalSteps: 5, winner: null, isWinner: false,
};
const response = (data: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });

describe('Round 04 floor server state', () => {
  const props = { floor: COLLEGE_FLOORS[0], onReturnToExterior: vi.fn(), isMuted: true, onToggleMute: vi.fn(), onExit: vi.fn() };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === apiUrl('/api/round4/status')) return response({ success: true, qualified: true, isReleased: true, assignedRouteId: 'route-3', winner: null });
      if (url === apiUrl('/api/round4/my-route')) return response(assignedState);
      return response({ success: false, message: 'Unexpected request' }, 404);
    }));
  });

  it('renders server-assigned route and persisted clue progress', async () => {
    render(<FloorInteriorView {...props} />);
    expect((await screen.findAllByText(/Server Assigned Route/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/CLUE 2 OF 5/i)).toBeInTheDocument();
    expect(screen.getByText('1 / 5 SOLVED')).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.map(([url]) => String(url))).toEqual([
      apiUrl('/api/round4/status'), apiUrl('/api/round4/my-route'),
    ]);
    expect(vi.mocked(fetch).mock.calls.every(([, init]) => (init as RequestInit).credentials === 'include')).toBe(true);
  });

  it('denies entry while the server says Round 04 is unreleased', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({ success: true, qualified: true, isReleased: false, assignedRouteId: 'route-3', winner: null, message: 'Round 04 is sealed.' })));
    render(<FloorInteriorView {...props} />);
    expect(await screen.findByText('Round 04 is sealed.')).toBeInTheDocument();
    expect(screen.getByText('ACCESS RESTRICTED')).toBeInTheDocument();
  });

  it('shows a retry error instead of granting local route access when the API fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({ message: 'Service unavailable.' }, 503)));
    render(<FloorInteriorView {...props} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable.');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('ACCESS RESTRICTED')).not.toBeInTheDocument());
  });
});
