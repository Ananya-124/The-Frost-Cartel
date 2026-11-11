import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PhotoInspectionViewer } from '../game/stage2/PhotoInspectionViewer';
import {
  STAGE2_TARGET_DEFINITIONS,
  STAGE2_CANONICAL_IMAGES,
} from '../game/stage2/stage2TargetsConfig';

describe("Stage 2: The Haunted Mansion / Ghost & Spider Web SVG Calibration", () => {
  const ghostDef = STAGE2_TARGET_DEFINITIONS.find((t) => t.targetId === 'ghost')!;
  const webDef = STAGE2_TARGET_DEFINITIONS.find((t) => t.targetId === 'spider_web')!;
  const mansionImage = STAGE2_CANONICAL_IMAGES.find((img) => img.id === 'img_05')!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("declares exact intrinsic dimensions (1024 x 629) for the redesigned Haunted Mansion", () => {
    expect(mansionImage).toBeDefined();
    expect(mansionImage.width).toBe(1024);
    expect(mansionImage.height).toBe(629);
    expect(mansionImage.imageUrl).toBe('/assets/stage-02/photographs/haunted-mansion-master.webp');
  });

  it('calibrates new organic cubic Bézier silhouette for the Ghost inside the oval portrait above the clock', () => {
    expect(ghostDef).toBeDefined();
    expect(ghostDef.targetId).toBe('ghost');
    expect(ghostDef.x).toBe(399);
    expect(ghostDef.y).toBe(388);
    expect(ghostDef.width).toBe(27);
    expect(ghostDef.height).toBe(58);

    // Percentages calculated against 1024 x 629
    expect(ghostDef.xPercent).toBeCloseTo(38.96, 1);
    expect(ghostDef.yPercent).toBeCloseTo(61.69, 1);
    expect(ghostDef.widthPercent).toBeCloseTo(2.64, 1);
    expect(ghostDef.heightPercent).toBeCloseTo(9.22, 1);

    // Old coordinates from Image A (1200x896) must be completely discarded
    expect(ghostDef.svgPath).not.toContain('518.0,464.5');
    expect(ghostDef.svgPath).not.toContain('479.5,456.0');

    // New path starts at head crown and uses smooth cubic Béziers
    expect(ghostDef.svgPath.startsWith('M 413 388')).toBe(true);
    expect(ghostDef.svgPath).toContain('C 426 426 425 434 423 440');
    expect(ghostDef.svgPath.endsWith('Z')).toBe(true);
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

  it('verifies ghost and spider web targets maintain complete spatial isolation and non-overlapping domains', () => {
    // Spider web is in upper-right arch
    const webMaxY = webDef.y + webDef.height;

    // Ghost is in oval portrait above grandfather clock
    const ghostMinY = ghostDef.y;

    // Vertical separation > 200px
    expect(ghostMinY - webMaxY).toBeGreaterThan(200);

    // Horizontal separation > 400px
    expect(webDef.x - (ghostDef.x + ghostDef.width)).toBeGreaterThan(400);
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

    // Hit paths exist with opacity-0
    const hitGhost = container.querySelector('#hit_hs_ghost');
    expect(hitGhost).toBeInTheDocument();
    expect(hitGhost).toHaveClass('opacity-0');
    expect(hitGhost).toHaveClass('hover:opacity-0');

    const hitWeb = container.querySelector('#hit_hs_web');
    expect(hitWeb).toBeInTheDocument();
    expect(hitWeb).toHaveClass('opacity-0');
    expect(hitWeb).toHaveClass('hover:opacity-0');

    // Discovered visual paths do NOT exist before discovery
    expect(container.querySelector('#visual_hs_ghost')).not.toBeInTheDocument();
    expect(container.querySelector('#visual_hs_web')).not.toBeInTheDocument();

    // No golden stroke before discovery
    const goldPaths = container.querySelectorAll('svg path[stroke="#fbbf24"]');
    expect(goldPaths).toHaveLength(0);
  });

  it('reveals golden outline and checkmark badge independently for Ghost and Spider Web', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    // Case 1: Only Ghost discovered
    const { container: containerMansion, rerender } = render(
      <PhotoInspectionViewer
        image={mansionImage}
        foundTargetIds={['ghost']}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    const visualGhost = containerMansion.querySelector('#visual_hs_ghost');
    expect(visualGhost).toBeInTheDocument();
    expect(visualGhost?.getAttribute('stroke')).toBe('#fbbf24');
    expect(containerMansion.querySelector('#visual_hs_web')).not.toBeInTheDocument();

    // Case 2: Both Ghost and Spider Web discovered
    rerender(
      <PhotoInspectionViewer
        image={mansionImage}
        foundTargetIds={['ghost', 'spider_web']}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    expect(containerMansion.querySelector('#visual_hs_ghost')).toBeInTheDocument();
    const visualWeb = containerMansion.querySelector('#visual_hs_web');
    expect(visualWeb).toBeInTheDocument();
    expect(visualWeb?.getAttribute('stroke')).toBe('#fbbf24');

    // Checkmarks present for both
    const checkmarks = containerMansion.querySelectorAll('svg text');
    expect(checkmarks.length).toBeGreaterThanOrEqual(2);
  });

  it('fires onHotspotClick specifically when clicking Ghost and Spider Web hit areas', () => {
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

    const hitGhost = container.querySelector('#hit_hs_ghost')!;
    fireEvent.click(hitGhost);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 'ghost',
        id: 'hs_ghost',
      }),
      expect.anything()
    );

    const hitWeb = container.querySelector('#hit_hs_web')!;
    fireEvent.click(hitWeb);
    expect(mockClick).toHaveBeenCalledTimes(2);
    expect(mockClick).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 'spider_web',
        id: 'hs_web',
      }),
      expect.anything()
    );
  });
});
