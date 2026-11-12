import React from 'react';

interface FlyingBatProps {
  delaySeconds?: number;
  durationSeconds?: number;
  scale?: number;
  opacity?: number;
  startYPercent?: number; // 0 - 100
  flightDirection?: 'left-to-right' | 'right-to-left';
  className?: string;
}

export const FlyingBat: React.FC<FlyingBatProps> = ({
  delaySeconds = 0,
  durationSeconds = 18,
  scale = 1,
  opacity = 0.85,
  startYPercent = 20,
  flightDirection = 'right-to-left',
  className = '',
}) => {
  const isL2R = flightDirection === 'left-to-right';

  return (
    <div
      style={{
        top: `${startYPercent}%`,
        animationDuration: `${durationSeconds}s`,
        animationDelay: `${delaySeconds}s`,
        transform: `scale(${scale}) ${isL2R ? 'scaleX(-1)' : ''}`,
        opacity,
        willChange: 'transform',
      }}
      className={`absolute z-0 pointer-events-none select-none ${
        isL2R ? 'animate-bat-fly-l2r' : 'animate-bat-fly-r2l'
      } ${className}`}
      aria-hidden="true"
    >
      {/* SVG Animated Bat with flapping wings */}
      <svg
        role="img"
        aria-hidden="true"
        width="44"
        height="26"
        viewBox="0 0 44 26"
        fill="currentColor"
        className="text-[#0d090a] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
      >
        {/* Left Wing Flapping Group */}
        <g className="animate-bat-wing-left origin-right" style={{ willChange: 'transform' }}>
          <path d="M22 13 C18 6, 12 1, 2 2 C1 7, 5 12, 10 14 C6 16, 7 21, 13 20 C16 19, 19 16, 22 13 Z" />
        </g>
        {/* Bat Body & Head */}
        <ellipse cx="22" cy="14" rx="3.5" ry="5.5" />
        <polygon points="20,10 21,6 22,9" />
        <polygon points="24,10 23,6 22,9" />
        {/* Right Wing Flapping Group */}
        <g className="animate-bat-wing-right origin-left" style={{ willChange: 'transform' }}>
          <path d="M22 13 C26 6, 32 1, 42 2 C43 7, 39 12, 34 14 C38 16, 37 21, 31 20 C28 19, 25 16, 22 13 Z" />
        </g>
      </svg>
    </div>
  );
};
