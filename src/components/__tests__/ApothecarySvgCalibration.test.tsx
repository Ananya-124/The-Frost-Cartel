import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PhotoInspectionViewer } from '../game/stage2/PhotoInspectionViewer';
import {
  STAGE2_TARGET_DEFINITIONS,
  STAGE2_CANONICAL_IMAGES,
} from '../game/stage2/stage2TargetsConfig';

describe('Stage 2: The Alchemist\'s Crypt / Apothecary SVG Calibration', () => {
  const apothecaryDef = STAGE2_TARGET_DEFINITIONS.find((t) => t.targetId === 'potion_bottle')!;
  const apothecaryImage = STAGE2_CANONICAL_IMAGES.find((img) => img.id === 'img_02')!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('declares exact cropped intrinsic dimensions (1024 x 561) without letterbox strips', () => {
    expect(apothecaryImage).toBeDefined();
    expect(apothecaryImage.width).toBe(1024);
    expect(apothecaryImage.height).toBe(561);
    expect(apothecaryImage.imageUrl).toBe('/assets/stage-02/photographs/apothecary-hidden-potion-master.webp');
  });

  it('calibrates new organic cubic Bézier silhouette for potion bottle and discards old coordinates', () => {
    expect(apothecaryDef).toBeDefined();
    expect(apothecaryDef.targetId).toBe('potion_bottle');
    expect(apothecaryDef.x).toBe(370);
    expect(apothecaryDef.y).toBe(122);
    expect(apothecaryDef.width).toBe(55);
    expect(apothecaryDef.height).toBe(202);

    // Percentages calculated against 1024 x 561
    expect(apothecaryDef.xPercent).toBeCloseTo(36.13, 1);
    expect(apothecaryDef.yPercent).toBeCloseTo(21.75, 1);
    expect(apothecaryDef.widthPercent).toBeCloseTo(5.37, 1);
    expect(apothecaryDef.heightPercent).toBeCloseTo(36.01, 1);

    // Old coordinates from Image A (1280x853) must be completely removed
    expect(apothecaryDef.svgPath).not.toContain('518.0,555.0');
    expect(apothecaryDef.svgPath).not.toContain('411.5,365.0');

    // New path starts at cork and uses smooth cubic Bézier curves
    expect(apothecaryDef.svgPath.startsWith('M 388 126')).toBe(true);
    expect(apothecaryDef.svgPath).toContain('C 424.5 255 424.5 275 424 295');
    expect(apothecaryDef.svgPath.endsWith('Z')).toBe(true);
  });

  it('renders completely invisible hit path with 0 pre-discovery outline or hover highlight', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={apothecaryImage}
        foundTargetIds={[]}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    // Hit path exists
    const hitPath = container.querySelector('#hit_hs_potion');
    expect(hitPath).toBeInTheDocument();
    expect(hitPath).toHaveClass('opacity-0');
    expect(hitPath).toHaveClass('hover:opacity-0');

    // Visual discovered path does NOT exist before discovery
    const visualPath = container.querySelector('#visual_hs_potion');
    expect(visualPath).not.toBeInTheDocument();

    // No golden stroke before discovery
    const goldPaths = container.querySelectorAll('svg path[stroke="#fbbf24"]');
    expect(goldPaths).toHaveLength(0);
  });

  it('reveals golden outline and checkmark badge only upon discovery', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={apothecaryImage}
        foundTargetIds={['potion_bottle']}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    // Visual path is now rendered with golden stroke and filter
    const visualPath = container.querySelector('#visual_hs_potion');
    expect(visualPath).toBeInTheDocument();
    expect(visualPath).toHaveAttribute('stroke', '#fbbf24');
    expect(visualPath).toHaveAttribute('filter', 'url(#gold-glow)');

    // Checkmark circle badge is rendered
    const checkBadge = container.querySelector('circle[stroke="#34d399"]');
    expect(checkBadge).toBeInTheDocument();
  });

  it('handles click interaction on the hit path and triggers hotspot callback', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={apothecaryImage}
        foundTargetIds={[]}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    const hitPath = container.querySelector('#hit_hs_potion')!;
    fireEvent.click(hitPath);

    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'hs_potion',
        targetId: 'potion_bottle',
      }),
      expect.anything()
    );
  });

  it('ensures SVG overlay and image share exact identical viewBox (1024 x 561)', () => {
    const mockClick = vi.fn();
    const mockClose = vi.fn();
    const mockMiss = vi.fn();

    const { container } = render(
      <PhotoInspectionViewer
        image={apothecaryImage}
        foundTargetIds={[]}
        stageCleared={false}
        onClose={mockClose}
        onHotspotClick={mockClick}
        onMissedClick={mockMiss}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 1024 561');

    const img = container.querySelector('img[alt="The Alchemist\'s Crypt"]');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/assets/stage-02/photographs/apothecary-hidden-potion-master.webp');
  });
});
