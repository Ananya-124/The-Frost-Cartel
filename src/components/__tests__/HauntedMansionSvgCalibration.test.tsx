import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PhotoInspectionViewer } from '../game/stage2/PhotoInspectionViewer';
import {
  STAGE2_TARGET_DEFINITIONS,
  STAGE2_CANONICAL_IMAGES,
} from '../game/stage2/stage2TargetsConfig';

describe("Stage 2: The Haunted Mansion / Spider Web SVG Calibration (Ghost Removed)", () => {
  const webDef = STAGE2_TARGET_DEFINITIONS.find((t) => t.targetId === 'spider_web')!;
  const mansionImage = STAGE2_CANONICAL_IMAGES.find((img) => img.id === 'img_05')!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("declares exact intrinsic dimensions (1024 x 629) for the redesigned Haunted Mansion with ghost removed", () => {
    expect(mansionImage).toBeDefined();
    expect(mansionImage.width).toBe(1024);
    expect(mansionImage.height).toBe(629);
    expect(mansionImage.imageUrl).toBe('/assets/stage-02/photographs/haunted-mansion-master.webp');
    // Ghost is removed from Stage 2 and UI
    expect(mansionImage.hotspots).toHaveLength(1);
    expect(mansionImage.hotspots[0].targetId).toBe('spider_web');
    expect(STAGE2_TARGET_DEFINITIONS.find((t) => t.targetId === 'ghost')).toBeUndefined();
  });

  it('calibrates new organic cubic Bézier silhouette for the Spider Web in the upper-right ceiling arch', () => {
    expect(webDef).toBeDefined();
    expect(webDef.targetId).toBe('spider_web');
    expect(webDef.x).toBe(830);
    expect(webDef.y).toBe(61);
    expect(webDef.width).toBe(108);
    expect(webDef.height).toBe(107);

    // Percentages calculated against 1024 x 629
    expect(webDef.xPercent).toBeCloseTo(81.05, 1);
    expect(webDef.yPercent).toBeCloseTo(9.70, 1);
    expect(webDef.widthPercent).toBeCloseTo(10.55, 1);
    expect(webDef.heightPercent).toBeCloseTo(17.01, 1);

    // Old coordinates from Image A (1200x896) must be completely discarded
    expect(webDef.svgPath).not.toContain('988.0,162.5');
    expect(webDef.svgPath).not.toContain('1122.0,26.5');

    // New path follows web arch structure with cubic Béziers
    expect(webDef.svgPath.startsWith('M 870 61')).toBe(true);
    expect(webDef.svgPath).toContain('C 938 132 931 148 920 160');
    expect(webDef.svgPath.endsWith('Z')).toBe(true);
  });

  it('renders completely invisible hit paths with 0 pre-discovery outline or hover highlight', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={mansionImage}
        foundTargetIds={[]}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    // Ghost hit path does NOT exist
    expect(container.querySelector('#hit_hs_ghost')).not.toBeInTheDocument();

    const hitWeb = container.querySelector('#hit_hs_web');
    expect(hitWeb).toBeInTheDocument();
    expect(hitWeb).toHaveClass('opacity-0');
    expect(hitWeb).toHaveClass('hover:opacity-0');

    // Discovered visual paths do NOT exist before discovery
    expect(container.querySelector('#visual_hs_web')).not.toBeInTheDocument();

    // No golden stroke before discovery
    const goldPaths = container.querySelectorAll('svg path[stroke="#fbbf24"]');
    expect(goldPaths).toHaveLength(0);
  });

  it('reveals golden outline and checkmark badge for Spider Web upon discovery', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={mansionImage}
        foundTargetIds={['spider_web']}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    const visualWeb = container.querySelector('#visual_hs_web');
    expect(visualWeb).toBeInTheDocument();
    expect(visualWeb?.getAttribute('stroke')).toBe('#fbbf24');

    // Checkmark present
    const checkmarks = container.querySelectorAll('svg text');
    expect(checkmarks.length).toBeGreaterThanOrEqual(1);
  });

  it('fires onHotspotClick specifically when clicking Spider Web hit area', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={mansionImage}
        foundTargetIds={[]}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    const hitWeb = container.querySelector('#hit_hs_web')!;
    fireEvent.click(hitWeb);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 'spider_web',
        id: 'hs_web',
      }),
      expect.anything()
    );
  });
});

