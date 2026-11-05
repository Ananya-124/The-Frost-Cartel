import React from 'react';
import { BUILDING_VIEWBOX, type WindowTarget } from './FloorConfiguration';

interface WindowRevealAnimationProps {
  windowTarget: WindowTarget;
  isOpen: boolean;
  isOpening: boolean;
  reducedMotion?: boolean;
}

export const WindowRevealAnimation: React.FC<WindowRevealAnimationProps> = ({
  windowTarget,
  isOpen,
  isOpening,
  reducedMotion = false,
}) => {
  const { x, y, width, height } = windowTarget;

  // Window frame styles in 0..1629 x 0..965 coordinate system
  const leftSashStyle: React.CSSProperties = reducedMotion
    ? {
        opacity: isOpen ? 0.2 : 1,
        transition: 'opacity 300ms ease',
      }
    : {
        transformOrigin: 'left center',
        transform: isOpen || isOpening ? 'perspective(600px) rotateY(-82deg)' : 'perspective(600px) rotateY(0deg)',
        transition: 'transform 850ms cubic-bezier(0.2, 0.9, 0.3, 1)',
      };

  const rightSashStyle: React.CSSProperties = reducedMotion
    ? {
        opacity: isOpen ? 0.2 : 1,
        transition: 'opacity 300ms ease',
      }
    : {
        transformOrigin: 'right center',
        transform: isOpen || isOpening ? 'perspective(600px) rotateY(82deg)' : 'perspective(600px) rotateY(0deg)',
        transition: 'transform 850ms cubic-bezier(0.2, 0.9, 0.3, 1)',
      };

  const lightBeamOpacity = isOpen ? 0.95 : isOpening ? 0.75 : 0;

  return (
    <div
      className="absolute pointer-events-none select-none z-30 overflow-visible"
      style={{
        left: `${(x / BUILDING_VIEWBOX.width) * 100}%`,
        top: `${(y / BUILDING_VIEWBOX.height) * 100}%`,
        width: `${(width / BUILDING_VIEWBOX.width) * 100}%`,
        height: `${(height / BUILDING_VIEWBOX.height) * 100}%`,
      }}
    >
      {/* 1. Volumetric Golden Sunlight Spill from Interior */}
      <div
        className="absolute inset-[-120%] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,220,120,0.95)_0%,rgba(245,160,30,0.65)_40%,transparent_75%)] pointer-events-none transition-opacity duration-700 ease-out filter blur-md"
        style={{ opacity: lightBeamOpacity }}
      />

      {/* 2. Window Frame Outer Casement */}
      <div className="relative w-full h-full border border-amber-300/80 bg-black/40 shadow-[0_0_20px_rgba(255,215,0,0.6)] rounded-[2px] overflow-visible flex">
        {/* Left Window Casement / Glass Sash */}
        <div
          className="relative h-full border-r border-amber-200/60 bg-gradient-to-br from-amber-100/40 via-sky-300/30 to-amber-600/50 backdrop-blur-[1px] shadow-lg flex items-center justify-center"
          style={{
            width: '50%',
            ...leftSashStyle,
          }}
        >
          {/* Glass Glazing Bar / Mullion */}
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-amber-200/70" />
          {/* Antique Brass Handle */}
          <div className="absolute right-[2px] w-[3px] h-[8px] rounded-[1px] bg-amber-400 border border-amber-600 shadow-sm" />
        </div>

        {/* Right Window Casement / Glass Sash */}
        <div
          className="relative h-full bg-gradient-to-bl from-amber-100/40 via-sky-300/30 to-amber-600/50 backdrop-blur-[1px] shadow-lg flex items-center justify-center"
          style={{
            width: '50%',
            ...rightSashStyle,
          }}
        >
          {/* Glass Glazing Bar / Mullion */}
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-amber-200/70" />
          {/* Antique Brass Handle */}
          <div className="absolute left-[2px] w-[3px] h-[8px] rounded-[1px] bg-amber-400 border border-amber-600 shadow-sm" />
        </div>
      </div>
    </div>
  );
};

