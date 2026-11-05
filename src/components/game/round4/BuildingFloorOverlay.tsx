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
  highlightWindowTarget?: boolean;
}

function getGlowBorderOpacity(isSelected: boolean, isActive: boolean): number {
  if (isSelected) {
    return 0.95;
  }
  if (isActive) {
    return 0.8;
  }
  return 0;
}

function getContourStroke(isSelected: boolean, isActive: boolean): string {
  if (isSelected) {
    return 'url(#selectedGoldStroke)';
  }
  if (isActive) {
    return 'url(#antiqueGoldStroke)';
  }
  return 'rgba(255, 215, 0, 0.12)';
}

function getContourStrokeWidth(isSelected: boolean, isActive: boolean): string {
  if (isSelected) {
    return '3';
  }
  if (isActive) {
    return '2.5';
  }
  return '0.8';
}

function getContourDashArray(isSelected: boolean, isActive: boolean): string {
  if (isActive && !isSelected) {
    return '6 2';
  }
  return 'none';
}

function getBeaconOpacity(isSelected: boolean, isHovered: boolean): number {
  if (isSelected) {
    return 1;
  }
  if (isHovered) {
    return 0.9;
  }
  return 0.4;
}

function getGroupClassName(isActive: boolean, disabled: boolean): string {
  const activeClass = isActive ? 'is-active' : '';
  const cursorClass = disabled ? 'cursor-default pointer-events-none' : 'cursor-pointer';
  return `floor-group ${activeClass} ${cursorClass}`.trim();
}

export const BuildingFloorOverlay: React.FC<BuildingFloorOverlayProps> = ({
  floors,
  hoveredFloorId,
  selectedFloorId,
  onHoverFloor,
  onSelectFloor,
  disabled = false,
  highlightWindowTarget = false,
}) => {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-auto select-none overflow-visible"
      viewBox={`0 0 ${BUILDING_VIEWBOX.width} ${BUILDING_VIEWBOX.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="region"
      aria-label="Interactive College Building Floor Selection Map"
    >
      <defs>
        {/* Subtle Warm Golden Ambient Glow for Hovered Floors */}
        <filter id="relicGoldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Focused Golden Window Beacon Filter */}
        <filter id="beaconWindowGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="
              1 0 0 0 1
              0 0.85 0 0 0.8
              0 0 0.3 0 0.3
              0 0 0 18 -7
            "
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Radiant Antique Gold Linear Gradient */}
        <linearGradient id="antiqueGoldStroke" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f5d77f" />
          <stop offset="50%" stopColor="#ffd866" />
          <stop offset="100%" stopColor="#d4af37" />
        </linearGradient>

        {/* Selected Locked Gold Linear Gradient */}
        <linearGradient id="selectedGoldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        {/* Translucent Golden Sunlight Fill Gradient */}
        <radialGradient id="sunlightFloorFill" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#ffd700" stopOpacity="0.32" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#b45309" stopOpacity="0.12" />
        </radialGradient>

        {/* Embedded CSS rules for instantaneous hardware-accelerated floor illumination */}
        <style>{`
          .floor-group {
            transition: all 250ms ease-out;
          }
          .floor-group:hover .floor-glow-path,
          .floor-group.is-active .floor-glow-path {
            opacity: 0.85 !important;
          }
          .floor-group:hover .floor-fill-path,
          .floor-group.is-active .floor-fill-path {
            fill: url(#sunlightFloorFill) !important;
          }
          .floor-group:hover .floor-contour-path,
          .floor-group.is-active .floor-contour-path {
            stroke: url(#antiqueGoldStroke) !important;
            stroke-width: 3px !important;
          }
        `}</style>
      </defs>

      {/* Render All Traced Architectural Floor Regions */}
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
            onClick={() => !disabled && onSelectFloor(floor)}
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
            style={{ pointerEvents: disabled ? 'none' : 'auto' }}
          >
            {/* Visual Floor Highlight Layer (Illuminates ALL architectural paths together) */}
            {floor.outlinePaths.map((pathD) => (
              <React.Fragment key={`visual-path-${floor.id}-${pathD.slice(0, 20)}`}>
                {/* 1. Translucent Golden Sunlight Fill */}
                <path
                  d={pathD}
                  fill={isActive ? 'url(#sunlightFloorFill)' : 'transparent'}
                  className="floor-fill-path transition-colors duration-250 pointer-events-none"
                />

                {/* 2. Soft Outer Glowing Architectural Border */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSelected ? '#ffd700' : '#f5d77f'}
                  strokeWidth={isSelected ? '5' : '3.5'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#relicGoldGlow)"
                  opacity={getGlowBorderOpacity(isSelected, isActive)}
                  className="floor-glow-path transition-opacity duration-250 pointer-events-none"
                />

                {/* 3. Crisp Inner Architectural Contour Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={getContourStroke(isSelected, isActive)}
                  strokeWidth={getContourStrokeWidth(isSelected, isActive)}
                  strokeDasharray={getContourDashArray(isSelected, isActive)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="floor-contour-path transition-all duration-250 pointer-events-none"
                />
              </React.Fragment>
            ))}

            {/* Generous Hit Detection Layer (Always active and clickable across entire floor) */}
            {floor.hitAreaPaths.map((hitD) => (
              <path
                key={`hit-path-${floor.id}-${hitD.slice(0, 20)}`}
                d={hitD}
                fill="rgba(255, 215, 0, 0.001)"
                stroke="transparent"
                strokeWidth="12"
                style={{ pointerEvents: 'all' }}
              />
            ))}

            {/* Highlighted Target Window Beacon on Selected or Hovered Floor */}
            {(isActive || highlightWindowTarget) && (
              <g
                className="transition-opacity duration-300 pointer-events-none"
                opacity={getBeaconOpacity(isSelected, isHovered)}
              >
                {/* Outer Window Glow */}
                <rect
                  x={floor.windowTarget.x - 3}
                  y={floor.windowTarget.y - 3}
                  width={floor.windowTarget.width + 6}
                  height={floor.windowTarget.height + 6}
                  rx="3"
                  fill="none"
                  stroke="#ffd700"
                  strokeWidth="2.5"
                  filter="url(#beaconWindowGlow)"
                />
                {/* Golden Target Crosshairs */}
                <circle
                  cx={floor.windowTarget.x + floor.windowTarget.width / 2}
                  cy={floor.windowTarget.y + floor.windowTarget.height / 2}
                  r="4"
                  fill="#ffffff"
                  filter="url(#beaconWindowGlow)"
                />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
