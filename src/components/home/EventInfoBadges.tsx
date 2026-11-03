import React from 'react';

export const EventInfoBadges: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 text-[9px] sm:text-xs font-cinzel font-semibold tracking-wider max-w-2xl mx-auto">
      {/* Halloween Seasonal Badge */}
      <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-black/60 border border-cartel-amber/50 text-cartel-amber shadow-sm backdrop-blur-md">
        <span className="text-xs sm:text-sm" aria-hidden="true">🎃</span>
        <span>HALLOWEEN EDITION</span>
      </div>

      {/* 2 Players Per Team */}
      <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-black/60 border border-cartel-frostBorder/70 text-cartel-cyan shadow-sm backdrop-blur-md">
        <span className="text-xs sm:text-sm" aria-hidden="true">👥</span>
        <span>2 PLAYERS PER TEAM</span>
      </div>

      {/* 3 Rounds */}
      <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-black/60 border border-cartel-amber/50 text-cartel-amber shadow-sm backdrop-blur-md">
        <span className="text-xs sm:text-sm" aria-hidden="true">⚔️</span>
        <span>3 ROUNDS</span>
      </div>

      {/* Round 01: 20-25 Minutes */}
      <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-black/60 border border-white/15 text-cartel-silver shadow-sm backdrop-blur-md">
        <span className="text-xs sm:text-sm" aria-hidden="true">⏳</span>
        <span>ROUND 01: 20–25 MINS</span>
      </div>

      {/* Up to 500 Credits */}
      <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-black/60 border border-cartel-pumpkin/60 text-cartel-pumpkin shadow-sm backdrop-blur-md">
        <span className="text-xs sm:text-sm" aria-hidden="true">💰</span>
        <span>UP TO 500 CREDITS</span>
      </div>
    </div>
  );
};
