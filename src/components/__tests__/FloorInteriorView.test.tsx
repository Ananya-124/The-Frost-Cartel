import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('shows the victory page when the server verifies this team as the first winner', async () => {
    const winner = {
      teamId: 'team-ai',
      teamName: 'Team AI',
      routeId: 'route-3',
      solvedAt: '2026-11-13T06:45:00.000Z',
    };
    const completedState = {
      ...assignedState,
      progress: { ...assignedState.progress, currentStepIndex: 5, isFinished: true, finishedAt: winner.solvedAt },
      activeStep: null,
      winner,
      isWinner: true,
    };
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === apiUrl('/api/round4/status')) return response({ success: true, qualified: true, isReleased: true, assignedRouteId: 'route-3', winner });
      if (url === apiUrl('/api/round4/my-route')) return response(completedState);
      return response({ success: false, message: 'Unexpected request' }, 404);
    }));

    render(<FloorInteriorView {...props} />);

    expect(await screen.findByRole('dialog', { name: /Championship Victory Announcement/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'TEAM AI' })).toBeInTheDocument();
    expect(screen.getByTestId('winner-celebration-video')).toHaveAttribute(
      'src',
      '/assets/round-04/winner-celebration.mp4',
    );
  });

  it('automatically shows the victory page from the successful final-answer response', async () => {
    const winner = {
      teamId: 'team-ai',
      teamName: 'Team AI',
      routeId: 'route-3',
      solvedAt: '2026-11-13T06:50:00.000Z',
    };
    const finalClueState = {
      ...assignedState,
      progress: { currentStepIndex: 4, targetDiscovered: true, solvedStepIds: ['r3_s1', 'r3_s2', 'r3_s3', 'r3_s4'], commonRoomArrived: true, isFinished: false, finishedAt: null },
      activeStep: { ...assignedState.activeStep, stepId: 'r3_s5', clueIndex: 5, riddle: 'Final riddle', fieldLocationHint: 'Final chamber', isCommonFinal: true },
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === apiUrl('/api/round4/status')) return response({ success: true, qualified: true, isReleased: true, assignedRouteId: 'route-3', winner: null });
      if (url === apiUrl('/api/round4/my-route')) return response(finalClueState);
      if (url === apiUrl('/api/round4/submit-clue')) return response({
        success: true, correct: true, isFinal: true, isWinner: true, ...winner, winner,
        message: 'Congratulations! Your squad won.',
      });
      return response({ success: false, message: 'Unexpected request' }, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FloorInteriorView {...props} />);
    const answerInput = await screen.findByRole('textbox', { name: 'Enter Field Code or Answer' });
    fireEvent.change(answerInput, { target: { value: 'final answer' } });
    fireEvent.click(screen.getByRole('button', { name: 'SUBMIT' }));

    expect(await screen.findByRole('dialog', { name: /Championship Victory Announcement/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'TEAM AI' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) => String(url) === apiUrl('/api/round4/my-route'))).toHaveLength(1);
  });

  it('denies entry while the server says Round 04 is unreleased', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({ success: true, qualified: true, isReleased: false, assignedRouteId: 'route-3', winner: null, message: 'Round 04 is sealed.' })));
    render(<FloorInteriorView {...props} />);
    expect(await screen.findByText('Round 04 is sealed.')).toBeInTheDocument();
    expect(screen.getByText('ACCESS RESTRICTED')).toBeInTheDocument();
  });

  it('offers sign-in instead of retrying an invalid squad session indefinitely', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({ success: false, message: 'Invalid squad session.' }, 401)));
    render(<FloorInteriorView {...props} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Your squad session is invalid or expired.');
    fireEvent.click(screen.getByRole('button', { name: 'Return to Sign In' }));
    expect(props.onExit).toHaveBeenCalled();
  });

  it('switches to the sign-in path when a clue submission returns 401', async () => {
    const discoveredState = {
      ...assignedState,
      progress: { ...assignedState.progress, targetDiscovered: true },
      activeStep: { ...assignedState.activeStep, riddle: 'The final cipher', fieldLocationHint: 'The final chamber' },
    };
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === apiUrl('/api/round4/status')) return response({ success: true, qualified: true, isReleased: true, assignedRouteId: 'route-3', winner: null });
      if (url === apiUrl('/api/round4/my-route')) return response(discoveredState);
      if (url === apiUrl('/api/round4/submit-clue')) return response({ success: false, message: 'Invalid squad session.' }, 401);
      return response({ success: false, message: 'Unexpected request' }, 404);
    }));
    render(<FloorInteriorView {...props} />);

    fireEvent.change(await screen.findByRole('textbox', { name: 'Enter Field Code or Answer' }), { target: { value: 'answer' } });
    fireEvent.click(screen.getByRole('button', { name: 'SUBMIT' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your squad session is invalid or expired.');
    expect(screen.getByRole('button', { name: 'Return to Sign In' })).toBeInTheDocument();
  });

  it('shows a retry error instead of granting local route access when the API fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({ message: 'Service unavailable.' }, 503)));
    render(<FloorInteriorView {...props} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable.');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('ACCESS RESTRICTED')).not.toBeInTheDocument());
  });
});
