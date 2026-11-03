import React from 'react';

export const HauntedAtmosphere: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none"
    >
      {/* 1. Primary Cinematic Gothic Cathedral & Full Moon Widescreen Backdrop */}
      <div className="absolute inset-0 bg-cartel-void">
        <img
          src="/assets/cinematic_haunted_bg.jpg"
          alt=""
          loading="eager"
          className="w-full h-full object-cover object-center filter brightness-[0.78] contrast-110 saturate-[0.95]"
        />
        {/* Layered Vignettes for UI Contrast and Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-cartel-bg/95 via-transparent to-cartel-void/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_25%,rgba(5,7,10,0.85)_80%)]" />
      </div>

      {/* 2. Castle Spire Window Candlelight Accents */}
      <div className="absolute top-[28%] left-[53%] w-2 h-3.5 bg-amber-400/80 rounded-full blur-[2px] animate-window-candle shadow-[0_0_12px_rgba(246,166,58,0.9)]" />
      <div className="absolute top-[32%] left-[48%] w-2 h-3 bg-amber-300/75 rounded-full blur-[1.5px] animate-window-candle [animation-delay:1.4s] shadow-[0_0_10px_rgba(246,166,58,0.8)]" />
      <div className="absolute top-[42%] left-[42%] w-2.5 h-4 bg-amber-500/70 rounded-full blur-[2px] animate-window-candle [animation-delay:2.2s] shadow-[0_0_14px_rgba(242,122,26,0.85)]" />

      {/* 3. Distant Flying Bats Moving Across Moonlit Sky */}
      <div className="absolute top-[8%] left-0 w-36 h-20 animate-bat-flight opacity-85">
        <svg
          viewBox="0 0 120 60"
          fill="currentColor"
          className="text-black/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
        >
          {/* Bat 1 */}
          <path d="M 20 25 Q 12 10 0 15 Q 8 28 20 25 Q 24 20 28 25 Q 40 28 48 15 Q 36 10 28 25 Z" />
          {/* Bat 2 */}
          <path d="M 60 18 Q 54 8 46 12 Q 52 20 60 18 Q 63 15 66 18 Q 74 20 80 12 Q 72 8 66 18 Z" />
          {/* Bat 3 */}
          <path d="M 95 32 Q 90 24 84 27 Q 88 34 95 32 Q 97 30 100 32 Q 106 34 110 27 Q 105 24 100 32 Z" />
        </svg>
      </div>

      {/* 4. Ethereal Spectral Ghost Floating Across Midground Cemetery */}
      <div className="absolute top-[35%] left-[8%] sm:left-[14%] w-36 sm:w-48 lg:w-56 h-auto animate-ghost-drift mix-blend-screen opacity-50 filter drop-shadow-[0_0_20px_rgba(127,229,217,0.4)] pointer-events-none">
        <img
          src="/assets/ghost_apparition.png"
          alt=""
          loading="lazy"
          className="w-full h-auto object-contain filter brightness-125"
        />
      </div>

      {/* 5. Rolling Cobblestone Fog & Graveyard Mist */}
      <div className="absolute inset-x-0 bottom-0 h-64 mist-overlay opacity-75 animate-fog-roll pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-[radial-gradient(ellipse_at_50%_100%,rgba(127,229,217,0.12)_0%,rgba(8,10,15,0.75)_65%,transparent_100%)] animate-fog-roll [animation-delay:4s] pointer-events-none" />

      {/* 6. Dynamic Foreground Candle & Pumpkin Flame Glow Lights */}
      {/* Bottom-Left Warm Pumpkin Glow Field */}
      <div className="absolute bottom-4 left-6 w-56 h-40 bg-[radial-gradient(circle_at_45%_55%,rgba(242,122,26,0.35)_0%,transparent_70%)] blur-2xl animate-pumpkin-flicker pointer-events-none" />

      {/* Bottom-Right Warm Pumpkin Glow Field */}
      <div className="absolute bottom-4 right-6 w-56 h-40 bg-[radial-gradient(circle_at_55%_55%,rgba(242,122,26,0.35)_0%,transparent_70%)] blur-2xl animate-pumpkin-flicker [animation-delay:1.6s] pointer-events-none" />

      {/* 7. Subtle Floating Ash / Ember Motes */}
      <div className="absolute bottom-20 left-[18%] w-1.5 h-1.5 rounded-full bg-amber-400/60 blur-[0.5px] animate-pulse" />
      <div className="absolute bottom-32 left-[25%] w-1 h-1 rounded-full bg-orange-400/50 blur-[0.5px] animate-pulse [animation-delay:1.8s]" />
      <div className="absolute bottom-24 right-[22%] w-1.5 h-1.5 rounded-full bg-amber-400/60 blur-[0.5px] animate-pulse [animation-delay:2.6s]" />
      <div className="absolute bottom-36 right-[28%] w-1 h-1 rounded-full bg-orange-300/50 blur-[0.5px] animate-pulse [animation-delay:0.9s]" />
    </div>
  );
};
