import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Grave1MarkedRemains,
  COFFIN_ORIGINAL_WIDTH,
  COFFIN_ORIGINAL_HEIGHT,
  COFFIN_VIEWBOX,
  COFFIN_SVG_PATHS,
} from '../game/stage3/Grave1MarkedRemains';
import { round1Service } from '../../services/round1Service';

describe('Coffin I: SVG Precision Geometry and Coordinate Calibration', () => {
  const mockReturnDashboard = vi.fn();
  const mockReturnCemetery = vi.fn();
  const mockToggleMute = vi.fn();
  const mockUpdatePlacedBones = vi.fn();
  const mockFragmentUnlocked = vi.fn();
  const mockOpenJournal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    round1Service.beginRound1('team_test_calib', 'Calibration Squad');
  });

  it('declares exact intrinsic 1024 x 576 coordinate space and viewBox', () => {
    expect(COFFIN_ORIGINAL_WIDTH).toBe(1024);
    expect(COFFIN_ORIGINAL_HEIGHT).toBe(576);
    expect(COFFIN_VIEWBOX).toBe('0 0 1024 576');
  });

  it('provides precise non-rectangular silhouette paths for all key artifacts', () => {
    // 1. Ancient Book
    expect(COFFIN_SVG_PATHS.ancient_book).toContain('M 430,255');
    expect(COFFIN_SVG_PATHS.ancient_book).toContain('547,271');
    expect(COFFIN_SVG_PATHS.ancient_book).toContain('508,362');
    expect(COFFIN_SVG_PATHS.ancient_book.startsWith('M')).toBe(true);
    expect(COFFIN_SVG_PATHS.ancient_book.endsWith('Z')).toBe(true);

    // 2. Letter & Envelope
    expect(COFFIN_SVG_PATHS.envelope).toContain('382,412');
    expect(COFFIN_SVG_PATHS.parchment).toContain('354,396');

    // 3. Anatomical Skeleton Regions
    expect(COFFIN_SVG_PATHS.skull).toContain('645,88');
    expect(COFFIN_SVG_PATHS.ribcage).toContain('545,188');
    expect(COFFIN_SVG_PATHS.left_arm).toContain('495,195');
    expect(COFFIN_SVG_PATHS.femur).toContain('605,385');
  });

  it('renders dual invisible hit-areas and visible discovery paths without generic rectangles', () => {
    const config = round1Service.getStage3Config();
    const { container } = render(
      <Grave1MarkedRemains
        teamId="team_test_calib"
        config={config}
        collectedFragments={[]}
        placedBones={{}}
        secondsRemaining={1185}
        stageCleared={false}
        isMuted={false}
        onToggleMute={mockToggleMute}
        onReturnDashboard={mockReturnDashboard}
        onReturnCemetery={mockReturnCemetery}
        onUpdatePlacedBones={mockUpdatePlacedBones}
        onFragmentUnlocked={mockFragmentUnlocked}
        onOpenJournal={mockOpenJournal}
      />
    );

    // Verify SVG viewBox matches image coordinate system
    const svgEl = container.querySelector('svg[viewBox="0 0 1024 576"]');
    expect(svgEl).toBeInTheDocument();
    expect(svgEl?.getAttribute('viewBox')).toBe('0 0 1024 576');

    // Verify paths are rendered
    const paths = container.querySelectorAll('svg path');
    expect(paths.length).toBeGreaterThanOrEqual(10);

    // Verify no harsh dashed rectangles are active by default
    const yellowRectangles = container.querySelectorAll('svg polygon[stroke="#f59e0b"]');
    expect(yellowRectangles.length).toBe(0);
  });

  it('supports developer calibration mode toggled via Alt+C', () => {
    const config = round1Service.getStage3Config();
    render(
      <Grave1MarkedRemains
        teamId="team_test_calib"
        config={config}
        collectedFragments={[]}
        placedBones={{}}
        secondsRemaining={1185}
        stageCleared={false}
        isMuted={false}
        onToggleMute={mockToggleMute}
        onReturnDashboard={mockReturnDashboard}
        onReturnCemetery={mockReturnCemetery}
        onUpdatePlacedBones={mockUpdatePlacedBones}
        onFragmentUnlocked={mockFragmentUnlocked}
        onOpenJournal={mockOpenJournal}
      />
    );

    expect(screen.queryByText(/✦ SVG CALIBRATION MODE ✦/i)).not.toBeInTheDocument();

    // Trigger Alt+C
    fireEvent.keyDown(window, { key: 'c', altKey: true });
    expect(screen.getByText(/✦ SVG CALIBRATION MODE ✦/i)).toBeInTheDocument();
    expect(screen.getByText(/1024 × 576/i)).toBeInTheDocument();

    // Toggle zoom level
    const zoomBtn = screen.getByRole('button', { name: '2x' });
    fireEvent.click(zoomBtn);
    expect(zoomBtn).toHaveClass('bg-amber-600');

    // Close calibration
    const closeBtn = screen.getByRole('button', { name: /✕ Close/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/✦ SVG CALIBRATION MODE ✦/i)).not.toBeInTheDocument();
  });
});
