import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PhotoInspectionViewer } from '../game/stage2/PhotoInspectionViewer';
import {
  STAGE2_TARGET_DEFINITIONS,
  STAGE2_CANONICAL_IMAGES,
} from '../game/stage2/stage2TargetsConfig';

describe('Stage 2: The Mausoleum Vault / Hidden Skull SVG Calibration', () => {
  const skullDef = STAGE2_TARGET_DEFINITIONS.find((t) => t.targetId === 'skull')!;
  const coffinDef = STAGE2_TARGET_DEFINITIONS.find((t) => t.targetId === 'coffin')!;
  const mausoleumImage = STAGE2_CANONICAL_IMAGES.find((img) => img.id === 'img_03')!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('declares exact intrinsic dimensions (1024 x 620) for the redesigned Mausoleum Vault', () => {
    expect(mausoleumImage).toBeDefined();
    expect(mausoleumImage.width).toBe(1024);
    expect(mausoleumImage.height).toBe(620);
    expect(mausoleumImage.imageUrl).toBe('/assets/stage-02/photographs/mausoleum-vault-master.webp');
  });

  it('calibrates new organic cubic Bézier silhouette for the hidden skull behind burgundy cloth', () => {
    expect(skullDef).toBeDefined();
    expect(skullDef.targetId).toBe('skull');
    expect(skullDef.x).toBe(282);
    expect(skullDef.y).toBe(444);
    expect(skullDef.width).toBe(32);
    expect(skullDef.height).toBe(40);

    // Percentages calculated against 1024 x 620
    expect(skullDef.xPercent).toBeCloseTo(27.54, 1);
    expect(skullDef.yPercent).toBeCloseTo(71.61, 1);
    expect(skullDef.widthPercent).toBeCloseTo(3.12, 1);
    expect(skullDef.heightPercent).toBeCloseTo(6.45, 1);

    // Old coordinates from Image A (1280x987) must be completely removed
    expect(skullDef.svgPath).not.toContain('535.0,809.5');
    expect(skullDef.svgPath).not.toContain('484.5,798.0');

    // New path starts at skull cranium and tightly outlines skull anatomy
    expect(skullDef.svgPath.startsWith('M 298 444')).toBe(true);
    expect(skullDef.svgPath.endsWith('Z')).toBe(true);
  });

  it('calibrates the stone sarcophagus coffin within the 1024 x 620 coordinate space', () => {
    expect(coffinDef).toBeDefined();
    expect(coffinDef.targetId).toBe('coffin');
    expect(coffinDef.x).toBe(233);
    expect(coffinDef.y).toBe(384);
    expect(coffinDef.width).toBe(525);
    expect(coffinDef.height).toBe(161);

    // Percentages calculated against 1024 x 620
    expect(coffinDef.xPercent).toBeCloseTo(22.75, 1);
    expect(coffinDef.yPercent).toBeCloseTo(61.94, 1);
    expect(coffinDef.widthPercent).toBeCloseTo(51.27, 1);
    expect(coffinDef.heightPercent).toBeCloseTo(25.97, 1);

    // Discards old 1280x987 coordinates and floor polygon
    expect(coffinDef.svgPath).not.toContain('840.0,820.5');
    expect(coffinDef.svgPath).not.toContain('595');
    expect(coffinDef.svgPath.startsWith('M 368 414')).toBe(true);
    expect(coffinDef.svgPath.endsWith('Z')).toBe(true);
  });

  it('renders completely invisible skull hit path with 0 pre-discovery outline or hover highlight', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={mausoleumImage}
        foundTargetIds={[]}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    // Hit path exists with opacity-0
    const hitSkull = container.querySelector('#hit_hs_skull');
    expect(hitSkull).toBeInTheDocument();
    expect(hitSkull).toHaveClass('opacity-0');
    expect(hitSkull).toHaveClass('hover:opacity-0');

    // Visual discovered path does NOT exist before discovery
    const visualSkull = container.querySelector('#visual_hs_skull');
    expect(visualSkull).not.toBeInTheDocument();

    // No golden stroke on skull before discovery
    const goldPaths = container.querySelectorAll('svg path[stroke="#fbbf24"]');
    expect(goldPaths).toHaveLength(0);
  });

  it('reveals golden outline and checkmark badge only upon discovery of the skull', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={mausoleumImage}
        foundTargetIds={['skull']}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    // Visual path is now rendered with golden stroke and filter
    const visualSkull = container.querySelector('#visual_hs_skull');
    expect(visualSkull).toBeInTheDocument();
    expect(visualSkull).toHaveAttribute('stroke', '#fbbf24');
    expect(visualSkull).toHaveAttribute('filter', 'url(#gold-glow)');

    // Checkmark circle badge is rendered
    const checkBadge = container.querySelector('circle[stroke="#34d399"]');
    expect(checkBadge).toBeInTheDocument();
  });

  it('handles click interaction on the skull hit path and triggers hotspot callback', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={mausoleumImage}
        foundTargetIds={[]}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    const hitSkull = container.querySelector('#hit_hs_skull')!;
    fireEvent.click(hitSkull);

    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'hs_skull',
        targetId: 'skull',
      }),
      expect.anything()
    );
  });

  it('ensures SVG overlay and image share exact identical viewBox (1024 x 620)', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={mausoleumImage}
        foundTargetIds={[]}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 1024 620');

    const img = container.querySelector('img[alt="The Mausoleum Vault"]');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/assets/stage-02/photographs/mausoleum-vault-master.webp');
  });
});
