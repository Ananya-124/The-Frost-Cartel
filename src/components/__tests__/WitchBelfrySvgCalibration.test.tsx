import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PhotoInspectionViewer } from '../game/stage2/PhotoInspectionViewer';
import {
  STAGE2_TARGET_DEFINITIONS,
  STAGE2_CANONICAL_IMAGES,
} from '../game/stage2/stage2TargetsConfig';

describe("Stage 2: The Witch's Belfry / Bat & Candle SVG Calibration", () => {
  const batDef = STAGE2_TARGET_DEFINITIONS.find((t) => t.targetId === 'bat')!;
  const candleDef = STAGE2_TARGET_DEFINITIONS.find((t) => t.targetId === 'candle')!;
  const belfryImage = STAGE2_CANONICAL_IMAGES.find((img) => img.id === 'img_04')!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("declares exact intrinsic dimensions (1024 x 624) for the redesigned Witch's Belfry", () => {
    expect(belfryImage).toBeDefined();
    expect(belfryImage.width).toBe(1024);
    expect(belfryImage.height).toBe(624);
    expect(belfryImage.imageUrl).toBe('/assets/stage-02/photographs/witch-belfry-master.webp');
  });

  it('calibrates new organic cubic Bézier silhouette for the Nocturnal Bat in upper masonry', () => {
    expect(batDef).toBeDefined();
    expect(batDef.targetId).toBe('bat');
    expect(batDef.x).toBe(468);
    expect(batDef.y).toBe(100);
    expect(batDef.width).toBe(125);
    expect(batDef.height).toBe(20);

    // Percentages calculated against 1024 x 624
    expect(batDef.xPercent).toBeCloseTo(45.7, 1);
    expect(batDef.yPercent).toBeCloseTo(16.03, 1);
    expect(batDef.widthPercent).toBeCloseTo(12.21, 1);
    expect(batDef.heightPercent).toBeCloseTo(3.21, 1);

    // Old coordinates from Image A (1280x1920) must be completely removed
    expect(batDef.svgPath).not.toContain('638.0,299.5');
    expect(batDef.svgPath).not.toContain('719.0,219.5');

    // New path starts at wing edge and uses smooth cubic Béziers
    expect(batDef.svgPath.startsWith('M 468 110')).toBe(true);
    expect(batDef.svgPath).toContain('C 524 105 528 103 531 102');
    expect(batDef.svgPath.endsWith('Z')).toBe(true);
  });

  it('calibrates new organic cubic Bézier silhouette for the Altar Candle on pillar sconce', () => {
    expect(candleDef).toBeDefined();
    expect(candleDef.targetId).toBe('candle');
    expect(candleDef.x).toBe(402);
    expect(candleDef.y).toBe(376);
    expect(candleDef.width).toBe(13);
    expect(candleDef.height).toBe(25);

    // Percentages calculated against 1024 x 624
    expect(candleDef.xPercent).toBeCloseTo(39.26, 1);
    expect(candleDef.yPercent).toBeCloseTo(60.26, 1);
    expect(candleDef.widthPercent).toBeCloseTo(1.27, 1);
    expect(candleDef.heightPercent).toBeCloseTo(4.01, 1);

    // Old coordinates from Image A (1280x1920) must be completely removed
    expect(candleDef.svgPath).not.toContain('511.0,1274.5');
    expect(candleDef.svgPath).not.toContain('497.5,1215.0');

    // New path starts at candle tip and uses smooth cubic Béziers
    expect(candleDef.svgPath.startsWith('M 408 376')).toBe(true);
    expect(candleDef.svgPath).toContain('C 414.5 388');
    expect(candleDef.svgPath.endsWith('Z')).toBe(true);
  });

  it('verifies bat and candle targets have zero geometric overlap and maintain distinct coordinate domains', () => {
    // Bat is in upper arch apex
    const batMaxY = batDef.y + batDef.height;

    // Candle is on mid pillar sconce
    const candleMinY = candleDef.y;

    // Minimum vertical separation > 200px
    expect(candleMinY - batMaxY).toBeGreaterThan(200);

    // Horizontal positions are distinct
    expect(candleDef.x + candleDef.width).toBeLessThan(batDef.x);
  });

  it('renders completely invisible hit paths with 0 pre-discovery outline or hover highlight', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={belfryImage}
        foundTargetIds={[]}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    // Hit paths exist with opacity-0
    const hitBat = container.querySelector('#hit_hs_bat');
    expect(hitBat).toBeInTheDocument();
    expect(hitBat).toHaveClass('opacity-0');
    expect(hitBat).toHaveClass('hover:opacity-0');

    const hitCandle = container.querySelector('#hit_hs_candle');
    expect(hitCandle).toBeInTheDocument();
    expect(hitCandle).toHaveClass('opacity-0');
    expect(hitCandle).toHaveClass('hover:opacity-0');

    // Discovered visual paths do NOT exist before discovery
    expect(container.querySelector('#visual_hs_bat')).not.toBeInTheDocument();
    expect(container.querySelector('#visual_hs_candle')).not.toBeInTheDocument();

    // No golden stroke before discovery
    const goldPaths = container.querySelectorAll('svg path[stroke="#fbbf24"]');
    expect(goldPaths).toHaveLength(0);
  });

  it('reveals golden outline and checkmark badge independently for Bat and Candle', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    // Case 1: Only Bat discovered
    const { container: containerBat, rerender } = render(
      <PhotoInspectionViewer
        image={belfryImage}
        foundTargetIds={['bat']}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    const visualBat = containerBat.querySelector('#visual_hs_bat');
    expect(visualBat).toBeInTheDocument();
    expect(visualBat?.getAttribute('stroke')).toBe('#fbbf24');
    expect(containerBat.querySelector('#visual_hs_candle')).not.toBeInTheDocument();

    // Case 2: Both Bat and Candle discovered
    rerender(
      <PhotoInspectionViewer
        image={belfryImage}
        foundTargetIds={['bat', 'candle']}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    expect(containerBat.querySelector('#visual_hs_bat')).toBeInTheDocument();
    const visualCandle = containerBat.querySelector('#visual_hs_candle');
    expect(visualCandle).toBeInTheDocument();
    expect(visualCandle?.getAttribute('stroke')).toBe('#fbbf24');

    // Checkmarks present for both
    const checkmarks = containerBat.querySelectorAll('svg text');
    expect(checkmarks.length).toBeGreaterThanOrEqual(2);
  });

  it('fires onHotspotClick specifically when clicking Bat and Candle hit areas', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={belfryImage}
        foundTargetIds={[]}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    const hitBat = container.querySelector('#hit_hs_bat')!;
    fireEvent.click(hitBat);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 'bat',
        id: 'hs_bat',
      }),
      expect.anything()
    );

    const hitCandle = container.querySelector('#hit_hs_candle')!;
    fireEvent.click(hitCandle);
    expect(mockClick).toHaveBeenCalledTimes(2);
    expect(mockClick).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 'candle',
        id: 'hs_candle',
      }),
      expect.anything()
    );
  });
});
