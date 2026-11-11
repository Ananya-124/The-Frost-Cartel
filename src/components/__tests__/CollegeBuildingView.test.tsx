import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CollegeBuildingView } from '../game/round4/CollegeBuildingView';
import { COLLEGE_FLOORS } from '../game/round4/FloorConfiguration';

describe('Round 04 College Building View & Drone Window Entry', () => {
  const mockExit = vi.fn();
  const mockReplay = vi.fn();
  const mockToggleMute = vi.fn();
  const mockProceedToFloors = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.includes('/api/round4/status')
        ? { success: true, qualified: true, isReleased: true, assignedRouteId: 'route-7', routeNumber: 7, winner: null }
        : { success: true, route: { routeId: 'route-7', routeNumber: 7, romanNumeral: 'VII', routeName: 'Seventh Route', routeSubtitle: 'The seventh route' }, progress: { currentStepIndex: 0, targetDiscovered: false, solvedStepIds: [], commonRoomArrived: false, isFinished: false, finishedAt: null }, activeStep: { stepId: 'route7_step1', clueIndex: 1, floorId: 'floor-7', locationName: 'Seventh Floor', targetPoint: { x: 400, y: 160 }, triggerRadius: 35, riddle: 'Field Riddle', fieldLocationHint: '', isCommonFinal: false }, totalSteps: 5, winner: null, isWinner: false };
      return { ok: true, status: 200, json: async () => body };
    }));
  });

  it('renders the original college photograph, minimal HUD, and mandatory vertical relic instruction', () => {
    render(
      <CollegeBuildingView
        onExit={mockExit}
        onReplayIntro={mockReplay}
        isMuted={false}
        onToggleMute={mockToggleMute}
        onProceedToFloors={mockProceedToFloors}
      />
    );

    // Header Removal Verification (Requirement 3: Large black title bar & FROST CARTEL removed)
    expect(screen.queryByText('FROST CARTEL')).not.toBeInTheDocument();

    // Floating Minimal Top Controls Verification (Requirement 4)
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /letter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exit/i })).toBeInTheDocument();

    // Mandatory Relic Instruction Banner (Requirement 2)
    expect(screen.getByAltText(/Ancient Relic Floor Selector/i)).toBeInTheDocument();

    // Original College Building Artwork
    const buildingImg = screen.getByAltText(/B\. S\. Narayan Platinum Jubilee Academic Block/i);
    expect(buildingImg).toBeInTheDocument();
    expect(buildingImg).toHaveAttribute('src', '/assets/round-04/college_building_base.png');

    // Interactive Floor Overlays (all 8 floors present)
    expect(COLLEGE_FLOORS.length).toBe(8);
    for (const floor of COLLEGE_FLOORS) {
      expect(screen.getByRole('button', { name: new RegExp(floor.label, 'i') })).toBeInTheDocument();
    }
  });

  it('orchestrates continuous drone camera upward flight and direct window entry into interior ancient map', async () => {
    vi.useFakeTimers();

    render(
      <CollegeBuildingView
        onExit={mockExit}
        onReplayIntro={mockReplay}
        isMuted={false}
        onToggleMute={mockToggleMute}
        onProceedToFloors={mockProceedToFloors}
      />
    );

    // Click Seventh Floor
    const seventhFloorBtn = screen.getByRole('button', { name: /Seventh Floor/i });
    fireEvent.click(seventhFloorBtn);

    // Stage B & C: Continuous upward drone flight towards Seventh Floor open window (1050ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    // Stage D & E: Direct forward entry through the open window into the Interior (~420ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    await act(async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); });

    // Interior view should now be displayed directly with Campus Floor Map, Routes, and Field Riddle
    expect(screen.getByText(/ROUND 04 • SEVENTH FLOOR/i)).toBeInTheDocument();
    expect(screen.getByText(/CAMPUS FLOOR MAP/i)).toBeInTheDocument();
    expect(screen.getByText(/FIELD RIDDLE/i)).toBeInTheDocument();
    expect(screen.getByText(/PARTNER HANDOFF/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return/i })).toBeInTheDocument();

    // Verify proceed callback was fired with floor id
    expect(mockProceedToFloors).toHaveBeenCalledWith('floor-7');

    // Test Returning to Exterior
    const returnBtn = screen.getByRole('button', { name: /Return to Exterior/i });
    fireEvent.click(returnBtn);

    // Exterior building and instruction banner should be back
    expect(screen.getByText('PLEASE SELECT YOUR FLOOR')).toBeInTheDocument();
    expect(screen.getByAltText(/B\. S\. Narayan Platinum Jubilee Academic Block/i)).toBeInTheDocument();

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});

