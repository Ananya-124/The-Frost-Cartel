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

  it('orchestrates continuous drone camera upward flight and direct window entry into interior ancient map', () => {
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
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    // Stage D & E: Direct forward entry through the open window into the Interior (~420ms)
    act(() => {
      vi.advanceTimersByTime(450);
    });

    // Interior view should now be displayed directly without artificial pauses or swinging sashes
    expect(screen.getByText('SEVENTH FLOOR — THE CELESTIAL ARCHIVES & OBSERVATORY')).toBeInTheDocument();
    expect(screen.getByText('ANCIENT MAP — CONTENT AWAITS')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Exterior/i })).toBeInTheDocument();

    // Verify proceed callback was fired with floor id
    expect(mockProceedToFloors).toHaveBeenCalledWith('floor-7');

    // Test Returning to Exterior
    const returnBtn = screen.getByRole('button', { name: /Return to Exterior/i });
    fireEvent.click(returnBtn);

    // Exterior building and instruction banner should be back
    expect(screen.getByText('PLEASE SELECT YOUR FLOOR')).toBeInTheDocument();
    expect(screen.getByAltText(/B\. S\. Narayan Platinum Jubilee Academic Block/i)).toBeInTheDocument();

    vi.useRealTimers();
  });
});

