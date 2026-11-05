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

  const isWindowOpening = cameraPhase === 'WINDOW_OPENING';
  const isWindowOpen = cameraPhase === 'WINDOW_ENTERING' || cameraPhase === 'COMPLETED';

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full max-w-[1200px] aspect-[1629/965] rounded-xl shadow-[0_20px_70px_rgba(0,0,0,0.85)] border border-amber-500/30 overflow-hidden bg-black select-none"
      style={{
        boxShadow: '0 0 50px rgba(245, 185, 80, 0.15), 0 25px 60px rgba(0, 0, 0, 0.9)',
      }}
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-amber-950/15 pointer-events-none" />

          {/* 3. Interactive SVG Architectural Floor Contour Overlay */}
          <BuildingFloorOverlay
            floors={floors}
            hoveredFloorId={hoveredFloorId}
            selectedFloorId={selectedFloor?.id || null}
            onHoverFloor={onHoverFloor}
            onSelectFloor={onSelectFloor}
            disabled={cameraPhase !== 'IDLE'}
            highlightWindowTarget={cameraPhase === 'WINDOW_FOCUSED'}
          />

          {/* 4. Active Target Window Opening Overlay (Triggered During Drone Approach) */}
          {selectedFloor && (cameraPhase === 'WINDOW_FOCUSED' || cameraPhase === 'WINDOW_OPENING' || cameraPhase === 'WINDOW_ENTERING') && (
            <WindowRevealAnimation
              windowTarget={selectedFloor.windowTarget}
              isOpen={isWindowOpen}
              isOpening={isWindowOpening}
              reducedMotion={reducedMotion}
            />
          )}
        </div>
      </FloorCameraTransition>

      {/* 5. Floating Sunlight Motes & Atmospheric Dust (Cinematic Depth) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-amber-300/60 shadow-[0_0_8px_rgba(255,215,0,0.8)] animate-pulse" />
        <div className="absolute top-1/2 left-2/3 w-1 h-1 rounded-full bg-amber-200/50 shadow-[0_0_6px_rgba(255,215,0,0.8)] animate-pulse delay-700" />
        <div className="absolute top-2/3 left-1/4 w-2 h-2 rounded-full bg-amber-400/40 shadow-[0_0_10px_rgba(255,215,0,0.6)] animate-pulse delay-1000" />
      </div>
    </div>
  );
};

