import React from 'react';

interface CandleFlameProps {
  size?: 'sm' | 'md' | 'lg';
  waxHeight?: number; // Height of the candle wax pillar in pixels
  className?: string;
}

export const CandleFlame: React.FC<CandleFlameProps> = ({
  size = 'md',
  waxHeight = 60,
  className = '',
}) => {
  const flameSizes = {
    sm: { w: 'w-2.5', h: 'h-4', glow: 'w-10 h-10', wick: 'h-1.5' },
    md: { w: 'w-3.5', h: 'h-6', glow: 'w-16 h-16', wick: 'h-2' },
    lg: { w: 'w-5', h: 'h-8', glow: 'w-24 h-24', wick: 'h-2.5' },
  };

  const { w, h, glow, wick } = flameSizes[size];

  return (
    <div className={`relative flex flex-col items-center select-none pointer-events-none ${className}`}>
      {/* Outer Ambient Light Glow */}
      <div
        aria-hidden="true"
        className={`absolute -top-4 rounded-full bg-gradient-radial from-amber-500/40 via-orange-600/15 to-transparent blur-md ${glow} animate-candle-flicker pointer-events-none`}
      />

      {/* Flame Shape */}
      <div className={`relative ${w} ${h} flex items-center justify-center`}>
        {/* Outer Orange Flame */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[50%_50%_35%_35%] bg-gradient-to-t from-orange-600 via-amber-500 to-yellow-300 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-candle-flicker origin-bottom"
        />
        {/* Inner Yellow Core */}
        <div
          aria-hidden="true"
          className="absolute w-1/2 h-2/3 bottom-0.5 rounded-[50%_50%_35%_35%] bg-gradient-to-t from-yellow-300 via-yellow-100 to-white opacity-90 animate-flame-core origin-bottom"
        />
        {/* Blue Base */}
        <div
          aria-hidden="true"
          className="absolute w-2/3 h-1 bottom-0 rounded-full bg-blue-500/60 blur-[0.5px]"
        />
      </div>

      {/* Black Thread Wick */}
      <div className={`w-0.5 ${wick} bg-stone-900 rounded-t-full`} />

      {/* Candle Wax Body with Dripping Detail */}
      <div
        style={{ height: `${waxHeight}px` }}
        className="w-5 sm:w-6 bg-gradient-to-b from-[#e5dcd0] via-[#c4b5a0] to-[#8c7a65] rounded-t-md relative shadow-lg border-x border-[#5a4836]/40"
      >
        {/* Top Wax Rim indentation */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#b5a38a] rounded-t-md shadow-inner" />

        {/* Wax Drip Left */}
        <div className="absolute top-1 -left-0.5 w-1.5 h-6 bg-[#d9cdbc] rounded-b-full shadow" />
        {/* Wax Drip Center */}
        <div className="absolute top-1 left-2 w-1.5 h-9 bg-[#e0d6c7] rounded-b-full shadow-md" />
        {/* Wax Drip Right */}
        <div className="absolute top-1 right-0 w-1.5 h-4 bg-[#cfc1ad] rounded-b-full shadow" />

        {/* Ambient Shadow Overlay on Wax */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/35 rounded-t-md" />
      </div>

      {/* Wax Pool Base */}
      <div className="w-8 h-2 bg-[#96836c] rounded-[50%] -mt-1 shadow-md border-b border-black/50" />
    </div>
  );
};

