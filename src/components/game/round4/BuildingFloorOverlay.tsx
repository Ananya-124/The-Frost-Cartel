import React from 'react';
import type { FloorDefinition } from './FloorConfiguration';
import { BUILDING_VIEWBOX } from './FloorConfiguration';

interface BuildingFloorOverlayProps {
  floors: FloorDefinition[];
  hoveredFloorId: string | null;
  selectedFloorId: string | null;
  onHoverFloor: (floorId: string | null) => void;
  onSelectFloor: (floor: FloorDefinition) => void;
  disabled?: boolean;
}

function getGroupClassName(isActive: boolean, disabled: boolean): string {
  const activeClass = isActive ? 'is-active' : '';
  const cursorClass = disabled ? 'cursor-default pointer-events-none' : 'cursor-pointer';
  return `floor-group ${activeClass} ${cursorClass} outline-none focus:outline-none focus:ring-0 focus-visible:outline-none select-none`.trim();
}

export const BuildingFloorOverlay: React.FC<BuildingFloorOverlayProps> = ({
  floors,
  hoveredFloorId,
  selectedFloorId,
  onHoverFloor,
  onSelectFloor,
  disabled = false,
}) => {
  return (
    <section
      aria-label="Interactive College Building Floor Selection Map"
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-visible outline-none focus:outline-none"
      style={{ outline: 'none' }}
    >
      <svg
        className="w-full h-full pointer-events-auto select-none overflow-visible outline-none focus:outline-none focus:ring-0"
        viewBox={`0 0 ${BUILDING_VIEWBOX.width} ${BUILDING_VIEWBOX.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="College Building Floor Selection Map"
        style={{ outline: 'none' }}
      >
        <defs>
          <style>{`
            .floor-group,
            .floor-group:focus,
            .floor-group:focus-visible,
            .floor-group:active,
            .floor-group:focus-within,
            .floor-group * {
              outline: none !important;
              outline-width: 0 !important;
              outline-style: none !important;
              box-shadow: none !important;
              -webkit-tap-highlight-color: transparent !important;
            }
          `}</style>
        </defs>

        {/* Render All Hit Detection Floor Regions */}
        {floors.map((floor) => {
          const isHovered = hoveredFloorId === floor.id;
          const isSelected = selectedFloorId === floor.id;
          const isActive = isHovered || isSelected;

          return (
            <g
              key={floor.id}
              id={`svg-${floor.id}`}
              data-floor-id={floor.id}
              className={getGroupClassName(isActive, disabled)}
              onMouseEnter={() => !disabled && onHoverFloor(floor.id)}
              onMouseLeave={() => !disabled && onHoverFloor(null)}
              onMouseDown={(e) => {
                // Prevent mouse click from triggering browser default focus ring outline
                e.preventDefault();
              }}
              onClick={(e) => {
                if (!disabled) {
                  (e.currentTarget as SVGElement).blur?.();
                  onSelectFloor(floor);
                }
              }}
              onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelectFloor(floor);
                }
              }}
              tabIndex={disabled ? -1 : 0}
              role="button"
              aria-label={`${floor.label}: ${floor.subtitle}`}
              aria-pressed={isSelected}
              style={{
                pointerEvents: disabled ? 'none' : 'auto',
                outline: 'none',
              }}
            >
              {/* Invisible Hit Detection Layer (Always active and clickable across entire floor) */}
              {floor.hitAreaPaths.map((hitD) => (
                <path
                  key={`hit-path-${floor.id}-${hitD.slice(0, 20)}`}
                  d={hitD}
                  fill="rgba(255, 215, 0, 0.001)"
                  stroke="transparent"
                  strokeWidth="12"
                  className="outline-none focus:outline-none"
                  style={{ pointerEvents: 'all', outline: 'none' }}
                />
              ))}
            </g>
          );
        })}
      </svg>
    </section>
  );
};
