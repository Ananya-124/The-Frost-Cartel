import React from 'react';
import { BUILDING_VIEWBOX, type WindowTarget } from './FloorConfiguration';

interface WindowRevealAnimationProps {
  windowTarget: WindowTarget;
  isOpen: boolean;
  isOpening: boolean;
  reducedMotion?: boolean;
}

/**
 * Direct Open-Window Interior Aperture Illumination
 * Strictly NO artificial shutters or swinging sashes.
 * Emits a warm volumetric golden sunlight spill as the camera passes through the already-open window.
 */
export const WindowRevealAnimation: React.FC<WindowRevealAnimationProps> = ({
  windowTarget,
  isOpen,
  isOpening,
  reducedMotion = false,
}) => {
  const { x, y, width, height } = windowTarget;

  if (reducedMotion) {
    return null;
  }

  const opacity = isOpen ? 0.95 : isOpening ? 0.6 : 0;

  return (
    <div
      aria-hidden="true"
      className="absolute pointer-events-none select-none z-30 overflow-visible transition-opacity duration-300"
      style={{
        left: `${(x / BUILDING_VIEWBOX.width) * 100}%`,
        top: `${(y / BUILDING_VIEWBOX.height) * 100}%`,
        width: `${(width / BUILDING_VIEWBOX.width) * 100}%`,
        height: `${(height / BUILDING_VIEWBOX.height) * 100}%`,
        opacity,
      }}
    >
      {/* Volumetric Golden Sunlight Spill from Interior through the Open Window Aperture */}
      <div className="absolute inset-[-140%] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,225,130,0.92)_0%,rgba(245,170,40,0.65)_35%,rgba(215,130,10,0.2)_60%,transparent_80%)] filter blur-md animate-pulse [animation-duration:1.5s]" />
      
      {/* Aperture Entry Frame Soft Glow */}
      <div className="absolute inset-0 rounded-[2px] border border-amber-300/60 shadow-[0_0_24px_rgba(255,215,0,0.8),inset_0_0_12px_rgba(255,230,150,0.6)]" />
    </div>
  );
};


