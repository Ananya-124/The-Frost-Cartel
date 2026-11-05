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
    return '3.5';
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

function getGroupClassName(isActive: boolean, disabled: boolean): string {
  const activeClass = isActive ? 'is-active' : '';
  const cursorClass = disabled ? 'cursor-default pointer-events-none' : 'cursor-pointer';
  return `floor-group ${activeClass} ${cursorClass}`.trim();
}

function getRibbonBadgePath(cx: number, cy: number, halfW: number, halfH: number): string {
  const left = cx - halfW;
  const right = cx + halfW;
  const top = cy - halfH;
  const bottom = cy + halfH;
  const tipExtend = 12;

  return `M ${left},${top} L ${right},${top} L ${right + tipExtend},${cy} L ${right},${bottom} L ${left},${bottom} L ${left - tipExtend},${cy} Z`;
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
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-visible"
    >
      <svg
        className="w-full h-full pointer-events-auto select-none overflow-visible"
        viewBox={`0 0 ${BUILDING_VIEWBOX.width} ${BUILDING_VIEWBOX.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle Warm Golden Ambient Glow for Hovered Floors */}
          <filter id="relicGoldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Badge Drop Shadow */}
          <filter id="badgeDropShadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.85" />
          </filter>

          {/* Radiant Antique Gold Linear Gradient */}
          <linearGradient id="antiqueGoldStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="25%" stopColor="#ffd866" />
            <stop offset="50%" stopColor="#fff2a8" />
            <stop offset="75%" stopColor="#ffd866" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>

          {/* Selected Locked Gold Linear Gradient */}
          <linearGradient id="selectedGoldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#ffe066" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Translucent Golden Sunlight Fill Gradient */}
          <radialGradient id="sunlightFloorFill" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0.12" />
          </radialGradient>

          {/* Ribbon Plaque Dark Mahogany Fill */}
          <linearGradient id="ribbonPlaqueFill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e1108" />
            <stop offset="50%" stopColor="#2c170b" />
            <stop offset="100%" stopColor="#1e1108" />
          </linearGradient>

          {/* Hardware-accelerated floor illumination transition */}
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
              stroke-width: 3.5px !important;
            }
          `}</style>
        </defs>

        {/* Render All Traced Curved Architectural Floor Regions */}
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
              {/* Visual Floor Highlight Layer (Illuminates calibrated curved architectural band) */}
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
                    strokeWidth={isSelected ? '6' : '4'}
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

              {/* 4. Active Floor Marker Ribbon / Badge on Building (Requirement 5) */}
              {isActive && (
                <g className="pointer-events-none transition-all duration-300">
                  {/* Outer Drop Shadow */}
                  <path
                    d={getRibbonBadgePath(floor.badgePosition.x, floor.badgePosition.y, 115, 20)}
                    fill="rgba(0,0,0,0.8)"
                    filter="url(#badgeDropShadow)"
                  />
                  {/* Mahogany Fill with Antique Gold Stroke */}
                  <path
                    d={getRibbonBadgePath(floor.badgePosition.x, floor.badgePosition.y, 115, 20)}
                    fill="url(#ribbonPlaqueFill)"
                    stroke="url(#antiqueGoldStroke)"
                    strokeWidth="2.5"
                  />
                  {/* Inner Gold Inset Line */}
                  <path
                    d={getRibbonBadgePath(floor.badgePosition.x, floor.badgePosition.y, 107, 15)}
                    fill="none"
                    stroke="#ffd700"
                    strokeWidth="0.8"
                    opacity="0.85"
                  />
                  {/* Engraved Typography */}
                  <text
                    x={floor.badgePosition.x}
                    y={floor.badgePosition.y + 5}
                    textAnchor="middle"
                    fill="#fef08a"
                    style={{
                      fontFamily: 'Cinzel, Georgia, serif',
                      fontSize: '15px',
                      fontWeight: 700,
                      letterSpacing: '0.22em',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
                    }}
                  >
                    {`✦ ${floor.label.toUpperCase()} ✦`}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </section>
  );
};
