import React from 'react';

interface FloatingGhostProps {
  side?: 'left' | 'right';
  className?: string;
  src?: string;
}

export const FloatingGhost: React.FC<FloatingGhostProps> = ({
  side = 'left',
  className = '',
  src,
}) => {
  const defaultSrc =
    side === 'left'
      ? '/assets/stage-3/atmosphere/ghost_spectral_left.png'
      : '/assets/stage-3/atmosphere/ghost_spectral_right.png';

  const imageSrc = src || defaultSrc;

  return (
    <div
      aria-hidden="true"
      className={`absolute z-0 pointer-events-none select-none transition-opacity duration-700 ${
        side === 'left' ? 'left-2 sm:left-6 top-[22%]' : 'right-2 sm:right-6 top-[18%]'
      } ${className}`}
    >
      {/* Real Photorealistic Gothic Ghost Apparition */}
      <div className="relative w-36 sm:w-48 md:w-56 lg:w-64 aspect-[3/4] filter drop-shadow-[0_0_30px_rgba(45,212,191,0.4)]">
        <img
          src={imageSrc}
          alt=""
          loading="eager"
          className="w-full h-full object-contain filter brightness-110 contrast-110 opacity-75 hover:opacity-90 transition-opacity duration-1000 animate-ghost-float mix-blend-screen"
        />
        {/* Supernatural Ethereal Cyan Vapor Glow — static, no animated blur repaint */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.18)_0%,rgba(56,189,248,0.08)_50%,transparent_75%)] pointer-events-none -z-10" />
      </div>
    </div>
  );
};
