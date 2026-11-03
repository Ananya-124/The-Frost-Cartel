import React from 'react';

interface FlyingCrowProps {
  delaySeconds?: number;
  durationSeconds?: number;
  scale?: number;
  startYPercent?: number; // 0 - 100
  flightDirection?: 'left-to-right' | 'right-to-left';
  className?: string;
}

export const FlyingCrow: React.FC<FlyingCrowProps> = ({
  delaySeconds = 0,
  durationSeconds = 22,
  scale = 1,
  startYPercent = 18,
  flightDirection = 'left-to-right',
  className = '',
}) => {
  const isL2R = flightDirection === 'left-to-right';

  return (
    <div
      style={{
        top: `${startYPercent}%`,
        animationDuration: `${durationSeconds}s`,
        animationDelay: `${delaySeconds}s`,
        transform: `scale(${scale}) ${isL2R ? '' : 'scaleX(-1)'}`,
      }}
      className={`absolute z-10 pointer-events-none select-none opacity-90 ${
        isL2R ? 'animate-bat-fly-l2r' : 'animate-bat-fly-r2l'
      } ${className}`}
      aria-hidden="true"
    >
      {/* SVG Animated Raven / Crow with soaring & flapping wings */}
      <svg
        role="img"
        aria-hidden="true"
        width="54"
        height="32"
        viewBox="0 0 54 32"
        fill="currentColor"
        className="text-[#080709] filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]"
      >
        {/* Left Wing with Feather Fingers */}
        <g className="animate-bat-wing-left origin-right">
          <path d="M26 16 C20 8, 14 2, 2 3 C1 8, 4 13, 10 16 C5 19, 8 24, 15 22 C19 21, 23 18, 26 16 Z" />
          <path d="M2 3 C5 1, 9 2, 12 5" stroke="#161214" strokeWidth="1" />
          <path d="M1 6 C4 4, 8 5, 11 8" stroke="#161214" strokeWidth="1" />
        </g>

        {/* Crow Body, Head with Pointed Beak & Wedge Tail */}
        <ellipse cx="27" cy="16" rx="4" ry="6.5" />
        {/* Sharp Raven Beak */}
        <polygon points="26,12 28,12 34,13 28,15" fill="#030203" />
        {/* Crow Eye */}
        <circle cx="28.5" cy="13.5" r="0.8" fill="#e5e5e5" opacity="0.8" />
        {/* Wedge-shaped Tail Feathers */}
        <polygon points="25,21 29,21 31,29 27,31 23,29" fill="#0c0a0c" />

        {/* Right Wing with Feather Fingers */}
        <g className="animate-bat-wing-right origin-left">
          <path d="M28 16 C34 8, 40 2, 52 3 C53 8, 50 13, 44 16 C49 19, 46 24, 39 22 C35 21, 31 18, 28 16 Z" />
          <path d="M52 3 C49 1, 45 2, 42 5" stroke="#161214" strokeWidth="1" />
          <path d="M53 6 C50 4, 46 5, 43 8" stroke="#161214" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
};

