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
    expect(batDef.x).toBe(466);
    expect(batDef.y).toBe(68);
    expect(batDef.width).toBe(128);
    expect(batDef.height).toBe(58);

    // Percentages calculated against 1024 x 624
    expect(batDef.xPercent).toBeCloseTo(45.51, 1);
    expect(batDef.yPercent).toBeCloseTo(10.9, 1);
    expect(batDef.widthPercent).toBeCloseTo(12.5, 1);
    expect(batDef.heightPercent).toBeCloseTo(9.29, 1);

    // Old coordinates from Image A (1280x1920) must be completely removed
    expect(batDef.svgPath).not.toContain('638.0,299.5');
    expect(batDef.svgPath).not.toContain('719.0,219.5');

    // New path starts at wing edge and encloses full wingspan
    expect(batDef.svgPath.startsWith('M 530 75')).toBe(true);
    expect(batDef.svgPath.endsWith('Z')).toBe(true);
  });

  it('calibrates new organic cubic Bézier silhouette for the Altar Candle on pillar sconce', () => {
    expect(candleDef).toBeDefined();
    expect(candleDef.targetId).toBe('candle');
    expect(candleDef.x).toBe(382);
    expect(candleDef.y).toBe(417);
    expect(candleDef.width).toBe(28);
    expect(candleDef.height).toBe(51);

    // Percentages calculated against 1024 x 624
    expect(candleDef.xPercent).toBeCloseTo(37.3, 1);
    expect(candleDef.yPercent).toBeCloseTo(66.83, 1);
    expect(candleDef.widthPercent).toBeCloseTo(2.73, 1);
    expect(candleDef.heightPercent).toBeCloseTo(8.17, 1);

    // Old coordinates from Image A (1280x1920) must be completely removed
    expect(candleDef.svgPath).not.toContain('511.0,1274.5');
    expect(candleDef.svgPath).not.toContain('497.5,1215.0');

    // New path starts at lantern pinnacle and wraps Gothic fixture
    expect(candleDef.svgPath.startsWith('M 396 417')).toBe(true);
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
