import React, { useRef } from 'react';
import { BUILDING_VIEWBOX, type FloorDefinition } from './FloorConfiguration';
import { BuildingFloorOverlay } from './BuildingFloorOverlay';
import { WindowRevealAnimation } from './WindowRevealAnimation';
import { FloorCameraTransition, type CameraAnimationPhase } from './FloorCameraTransition';

interface CollegeBuildingSceneProps {
  floors: FloorDefinition[];
  hoveredFloorId: string | null;
  selectedFloor: FloorDefinition | null;
  onHoverFloor: (floorId: string | null) => void;
  onSelectFloor: (floor: FloorDefinition) => void;
  cameraPhase: CameraAnimationPhase;
  reducedMotion?: boolean;
  onMouseMoveCoords?: (coords: { x: number; y: number } | null) => void;
}

export const CollegeBuildingScene: React.FC<CollegeBuildingSceneProps> = ({
  floors,
  hoveredFloorId,
  selectedFloor,
  onHoverFloor,
  onSelectFloor,
  cameraPhase,
  reducedMotion = false,
  onMouseMoveCoords,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onMouseMoveCoords || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(BUILDING_VIEWBOX.width, ((e.clientX - rect.left) / rect.width) * BUILDING_VIEWBOX.width));
    const y = Math.max(0, Math.min(BUILDING_VIEWBOX.height, ((e.clientY - rect.top) / rect.height) * BUILDING_VIEWBOX.height));
    onMouseMoveCoords({ x, y });
  };

  const handlePointerLeave = () => {
    if (onMouseMoveCoords) {
      onMouseMoveCoords(null);
    }
  };

  const isWindowEntering =
    cameraPhase === 'APPROACHING' ||
    cameraPhase === 'WINDOW_FOCUSED' ||
    cameraPhase === 'WINDOW_ENTERING' ||
    cameraPhase === 'WINDOW_OPENING';

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-full max-h-[calc(100vh-60px)] aspect-[1629/965] overflow-hidden select-none flex items-center justify-center outline-none focus:outline-none"
      style={{ outline: 'none' }}
    >
      {/* Camera Drone-Style Zoom and Pan Transition Wrapper */}
      <FloorCameraTransition
        selectedFloor={selectedFloor}
        phase={cameraPhase}
        reducedMotion={reducedMotion}
      >
        <div className="relative w-full h-full">
          {/* 1. Original College Artwork: B. S. NARAYAN PLATINUM JUBILEE ACADEMIC BLOCK */}
          <picture className="block w-full h-full">
            <source srcSet="/assets/round-04/college_building_base.png" type="image/png" />
            <source srcSet="/assets/round-4/college_building_base.png" type="image/png" />
            <img
              src="/assets/round-04/college_building_base.png"
              alt="B. S. Narayan Platinum Jubilee Academic Block - College Building"
              className="w-full h-full object-contain object-center filter brightness-[1.02] contrast-[1.04]"
              draggable={false}
            />
          </picture>

          {/* 2. Soft Warm Atmospheric Sunlight Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-amber-950/10 pointer-events-none" />

          {/* 3. Interactive SVG Architectural Floor Contour Overlay with Curved Geometry */}
          <BuildingFloorOverlay
            floors={floors}
            hoveredFloorId={hoveredFloorId}
            selectedFloorId={selectedFloor?.id || null}
            onHoverFloor={onHoverFloor}
            onSelectFloor={onSelectFloor}
            disabled={cameraPhase !== 'IDLE'}
          />

          {/* 4. Active Target Open-Window Direct Entry Aperture Illumination */}
          {selectedFloor && isWindowEntering && (
            <WindowRevealAnimation
              windowTarget={selectedFloor.windowTarget}
              isOpen={cameraPhase === 'WINDOW_ENTERING' || cameraPhase === 'WINDOW_OPENING'}
              isOpening={cameraPhase === 'APPROACHING' || cameraPhase === 'WINDOW_FOCUSED'}
              reducedMotion={reducedMotion}
            />
          )}
        </div>
      </FloorCameraTransition>
    </div>
  );
};
