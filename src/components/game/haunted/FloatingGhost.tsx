import React from 'react';

interface FloatingGhostProps {
  side?: 'left' | 'right';
  className?: string;
}

export const FloatingGhost: React.FC<FloatingGhostProps> = ({
  side = 'left',
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`absolute z-0 pointer-events-none select-none opacity-40 hover:opacity-60 transition-opacity duration-1000 animate-ghost-float ${
        side === 'left' ? '-left-8 sm:-left-16 top-1/4' : '-right-8 sm:-right-16 top-1/3'
      } ${className}`}
    >
      {/* Ethereal Translucent Ghost SVG */}
      <svg
        role="img"
        aria-hidden="true"
        width="110"
        height="160"
        viewBox="0 0 110 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter blur-[0.5px] drop-shadow-[0_0_20px_rgba(127,229,217,0.35)]"
      >
        <defs>
          <radialGradient id="ghostGlow" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#d1fae5" stopOpacity="0.7" />
            <stop offset="45%" stopColor="#7fe5d9" stopOpacity="0.4" />
            <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#080a0f" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ghostTail" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7fe5d9" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#080a0f" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Spectral Body */}
        <path
          d="M55 12 C32 12, 16 35, 18 65 C19 85, 12 110, 20 135 C23 145, 30 152, 38 142 C45 132, 48 145, 55 155 C62 145, 66 130, 74 140 C82 150, 88 142, 91 132 C99 108, 92 85, 93 65 C94 35, 78 12, 55 12 Z"
          fill="url(#ghostGlow)"
        />

        {/* Ethereal Wisp Trails */}
        <path
          d="M28 75 C20 95, 15 125, 24 148 C32 135, 40 148, 55 155 C70 148, 78 135, 86 148 C95 125, 90 95, 82 75"
          fill="url(#ghostTail)"
        />

        {/* Hollow Dark Spectral Eyes */}
        <ellipse cx="44" cy="48" rx="4.5" ry="6.5" fill="#050811" opacity="0.85" />
        <ellipse cx="66" cy="48" rx="4.5" ry="6.5" fill="#050811" opacity="0.85" />

        {/* Faint Ghostly Mouth */}
        <ellipse cx="55" cy="64" rx="4" ry="7" fill="#050811" opacity="0.75" />
      </svg>
    </div>
  );
};

