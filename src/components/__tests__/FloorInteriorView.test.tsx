import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FloorInteriorView } from '../game/round4/FloorInteriorView';
import { COLLEGE_FLOORS } from '../game/round4/FloorConfiguration';
import { round4Service } from '../../services/round4Service';
import { EXPEDITION_ROUTES } from '../game/round4/ExpeditionRouteConfiguration';

describe('Round 04 Floor Interior: The Campus Expedition Map & Cooperative Treasure Hunt', () => {
  const mockReturn = vi.fn();
  const mockToggleMute = vi.fn();
  const mockExit = vi.fn();
  const testFloor = COLLEGE_FLOORS[0]; // Seventh Floor

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the complete cooperative treasure hunt map interface matching the reference design', () => {
    render(
      <FloorInteriorView
        floor={testFloor}
        onReturnToExterior={mockReturn}
        isMuted={false}
        onToggleMute={mockToggleMute}
        onExit={mockExit}
      />
    );

    // Top Header Elements
    expect(screen.getByText('FROST CARTEL')).toBeInTheDocument();
    expect(screen.getByText(/ROUND 04/i)).toBeInTheDocument();
    expect(screen.getByText('02:58')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Exterior/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exit Round 04/i })).toBeInTheDocument();

    // Exactly 5 Secret Routes in authoritative system
    expect(EXPEDITION_ROUTES.length).toBe(5);

    // Left Telemetry: Confidential Squad Progress
    expect(screen.getByText('SQUAD TELEMETRY')).toBeInTheDocument();
    expect(screen.getByText(/OBJECTIVE 1 OF 5/i)).toBeInTheDocument();

    // Central Map Area
    expect(screen.getByText(/✦ CAMPUS FLOOR MAP/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zoom Map In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zoom Map Out/i })).toBeInTheDocument();

    // Right Gameplay Panel: FIELD RIDDLE & PARTNER HANDOFF
    expect(screen.getByText('FIELD RIDDLE')).toBeInTheDocument();
    expect(screen.getByText(/Reach the marked point on the map/i)).toBeInTheDocument();
    expect(screen.getByText('PARTNER HANDOFF')).toBeInTheDocument();
    expect(screen.getByText('MAP EXPLORER')).toBeInTheDocument();
    expect(screen.getByText('FIELD PARTNER')).toBeInTheDocument();
    expect(screen.getByText(/Share the clue with your partner by call/i)).toBeInTheDocument();

    // Answer input starts disabled before target discovery
    const input = screen.getByLabelText(/Enter Field Code or Answer/i);
    expect(input).toBeDisabled();
  });

  it('unlocks the field riddle and enables the answer input when the map explorer touches the target point', () => {
    render(
      <FloorInteriorView
        floor={testFloor}
        onReturnToExterior={mockReturn}
        isMuted={false}
        onToggleMute={mockToggleMute}
        onExit={mockExit}
      />
    );

    // Simulate avatar reaching the target point via round4Service
    act(() => {
      round4Service.markTargetDiscovered('fc_team_001');
    });

    // Riddle should now be revealed
    const riddleText = EXPEDITION_ROUTES[0].steps[0].riddle;
    expect(screen.getByText(new RegExp(riddleText.slice(0, 30), 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(EXPEDITION_ROUTES[0].steps[0].fieldLocationHint.slice(0, 20), 'i'))).toBeInTheDocument();

    // Answer input and submit button should now be enabled
    const input = screen.getByLabelText(/Enter Field Code or Answer/i);
    expect(input).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /SUBMIT/i })).toBeInTheDocument();
  });

  it('handles incorrect and correct answer submissions and advances to subsequent clue targets', async () => {
    render(
      <FloorInteriorView
        floor={testFloor}
        onReturnToExterior={mockReturn}
        isMuted={false}
        onToggleMute={mockToggleMute}
        onExit={mockExit}
      />
    );

    // 1. Discover target
    act(() => {
      round4Service.markTargetDiscovered('fc_team_001');
    });

    const input = screen.getByLabelText(/Enter Field Code or Answer/i);
    const submitBtn = screen.getByRole('button', { name: /SUBMIT/i });

    // 2. Submit wrong answer
    fireEvent.change(input, { target: { value: 'WRONGCODE99' } });
    await act(async () => {
      fireEvent.click(submitBtn);
      await Promise.resolve();
    });

    // Shows error feedback and keeps Clue 1
    expect(screen.getByText(/Incorrect code or cipher/i)).toBeInTheDocument();
    expect(screen.getByText(/OBJECTIVE 1 OF 5/i)).toBeInTheDocument();

    // 3. Submit correct answer ("WRAITH")
    fireEvent.change(input, { target: { value: 'WRAITH' } });
    await act(async () => {
      fireEvent.click(submitBtn);
      await Promise.resolve();
    });

    // Should advance to Objective 2 of 5
    expect(screen.getByText(/OBJECTIVE 2 OF 5/i)).toBeInTheDocument();
    expect(screen.getByText('1 / 5 SOLVED')).toBeInTheDocument();
  });

  it('completes the entire route when all 5 clues are verified and declares champion', () => {
    render(
      <FloorInteriorView
        floor={testFloor}
        onReturnToExterior={mockReturn}
        isMuted={false}
        onToggleMute={mockToggleMute}
        onExit={mockExit}
      />
    );

    const teamId = 'fc_team_001';
    const route1 = EXPEDITION_ROUTES[0];

    // Solve all 5 clues sequentially
    for (let i = 0; i < 5; i++) {
      act(() => {
        round4Service.markTargetDiscovered(teamId);
      });
      const validCode = route1.steps[i].acceptedCodes[0];
      act(() => {
        round4Service.submitAnswer(teamId, validCode);
      });
    }

    const updated = round4Service.getProgress(teamId);
    expect(updated.completedRouteIds).toContain('route-1');
    expect(updated.activeStepIndex).toBe(4);
    expect(round4Service.getWinner()?.teamId).toBe(teamId);
  });

  it('persists progress across reloads using localStorage', () => {
    const teamId = 'fc_team_001';
    round4Service.markTargetDiscovered(teamId);
    round4Service.submitAnswer(teamId, 'WRAITH');

    // Verify stored progress
    const reloaded = round4Service.getProgress(teamId);
    expect(reloaded.activeStepIndex).toBe(1);
    expect(reloaded.solvedStepIds).toContain('r1_s1');
  });
});
