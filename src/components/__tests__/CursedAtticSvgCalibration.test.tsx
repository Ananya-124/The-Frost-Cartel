import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PhotoInspectionViewer } from '../game/stage2/PhotoInspectionViewer';
import {
  STAGE2_TARGET_DEFINITIONS,
  STAGE2_CANONICAL_IMAGES,
} from '../game/stage2/stage2TargetsConfig';

describe("Stage 2: The Cursed Attic / Witch's Hat & Spider SVG Calibration", () => {
  const hatDef = STAGE2_TARGET_DEFINITIONS.find((t) => t.targetId === 'witch_hat')!;
  const spiderDef = STAGE2_TARGET_DEFINITIONS.find((t) => t.targetId === 'spider')!;
  const atticImage = STAGE2_CANONICAL_IMAGES.find((img) => img.id === 'img_06')!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('declares exact intrinsic dimensions (1024 x 616) and master webp asset for the Cursed Attic', () => {
    expect(atticImage).toBeDefined();
    expect(atticImage.width).toBe(1024);
    expect(atticImage.height).toBe(616);
    expect(atticImage.imageUrl).toBe('/assets/stage-02/photographs/cursed-attic-master.webp');
  });

  it('calibrates new organic silhouette for the Pointed Witch Hat camouflaged in velvet folds', () => {
    expect(hatDef).toBeDefined();
    expect(hatDef.targetId).toBe('witch_hat');
    expect(hatDef.x).toBe(368);
    expect(hatDef.y).toBe(402);
    expect(hatDef.width).toBe(72);
    expect(hatDef.height).toBe(55);

    // Percentages calculated against 1024 x 616
    expect(hatDef.xPercent).toBeCloseTo(35.94, 1);
    expect(hatDef.yPercent).toBeCloseTo(65.26, 1);
    expect(hatDef.widthPercent).toBeCloseTo(7.03, 1);
    expect(hatDef.heightPercent).toBeCloseTo(8.93, 1);

    // Discards old 1200x896 coordinates
    expect(hatDef.svgPath).not.toContain('335.5,700.0');
    expect(hatDef.svgPath).not.toContain('424.5,700.0');

    // New path tightly traces cone and brim
    expect(hatDef.svgPath.startsWith('M 406 402')).toBe(true);
    expect(hatDef.svgPath.endsWith('Z')).toBe(true);
  });

  it('calibrates new organic silhouette for the Crawling Spider on picture frame in rafters', () => {
    expect(spiderDef).toBeDefined();
    expect(spiderDef.targetId).toBe('spider');
    expect(spiderDef.x).toBe(414);
    expect(spiderDef.y).toBe(140);
    expect(spiderDef.width).toBe(88);
    expect(spiderDef.height).toBe(80);

    // Percentages calculated against 1024 x 616
    expect(spiderDef.xPercent).toBeCloseTo(40.43, 1);
    expect(spiderDef.yPercent).toBeCloseTo(22.73, 1);
    expect(spiderDef.widthPercent).toBeCloseTo(8.59, 1);
    expect(spiderDef.heightPercent).toBeCloseTo(12.99, 1);

    // Discards old 1200x896 coordinates
    expect(spiderDef.svgPath).not.toContain('576.0,290.5');
    expect(spiderDef.svgPath).not.toContain('511');

    // New path traces body and eight legs
    expect(spiderDef.svgPath.startsWith('M 458 150')).toBe(true);
    expect(spiderDef.svgPath.endsWith('Z')).toBe(true);
  });

  it('verifies hat and spider targets are separated and non-overlapping', () => {
    const spiderMaxY = spiderDef.y + spiderDef.height;
    const hatMinY = hatDef.y;

    expect(hatMinY - spiderMaxY).toBeGreaterThan(150);
  });

  it('renders completely invisible hit paths with 0 pre-discovery outline or hover highlight', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={atticImage}
        foundTargetIds={[]}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    const hitHat = container.querySelector('#hit_hs_witch_hat');
    expect(hitHat).toBeInTheDocument();
    expect(hitHat).toHaveClass('opacity-0');
    expect(hitHat).toHaveClass('hover:opacity-0');

    const hitSpider = container.querySelector('#hit_hs_spider');
    expect(hitSpider).toBeInTheDocument();
    expect(hitSpider).toHaveClass('opacity-0');
    expect(hitSpider).toHaveClass('hover:opacity-0');
  });

  it('reveals golden outline and checkmark badge independently for Witch Hat and Spider', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container, rerender } = render(
      <PhotoInspectionViewer
        image={atticImage}
        foundTargetIds={['witch_hat']}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    const visualHat = container.querySelector('#visual_hs_witch_hat');
    expect(visualHat).toBeInTheDocument();
    expect(visualHat?.getAttribute('stroke')).toBe('#fbbf24');
    expect(container.querySelector('#visual_hs_spider')).not.toBeInTheDocument();

    rerender(
      <PhotoInspectionViewer
        image={atticImage}
        foundTargetIds={['witch_hat', 'spider']}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    expect(container.querySelector('#visual_hs_witch_hat')).toBeInTheDocument();
    const visualSpider = container.querySelector('#visual_hs_spider');
    expect(visualSpider).toBeInTheDocument();
    expect(visualSpider?.getAttribute('stroke')).toBe('#fbbf24');

    const checkmarks = container.querySelectorAll('svg text');
    expect(checkmarks.length).toBeGreaterThanOrEqual(2);
  });

  it('fires onHotspotClick specifically when clicking Witch Hat and Spider hit areas', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={atticImage}
        foundTargetIds={[]}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    const hitHat = container.querySelector('#hit_hs_witch_hat')!;
    fireEvent.click(hitHat);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 'witch_hat',
        id: 'hs_witch_hat',
      }),
      expect.anything()
    );

    const hitSpider = container.querySelector('#hit_hs_spider')!;
    fireEvent.click(hitSpider);
    expect(mockClick).toHaveBeenCalledTimes(2);
    expect(mockClick).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 'spider',
        id: 'hs_spider',
      }),
      expect.anything()
    );
  });
});
