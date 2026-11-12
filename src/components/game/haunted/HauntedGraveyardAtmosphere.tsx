import React from 'react';
import { FlyingBat } from './FlyingBat';
import { FloatingGhost } from './FloatingGhost';

export const HauntedGraveyardAtmosphere: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none"
    >
      {/* 1. Base High-Resolution Cinematic Graveyard Backdrop */}
      <div className="absolute inset-0 w-full h-full bg-black">
        <img
          src="/assets/halloween/background/graveyard_master_bg.jpg"
          alt=""
          loading="eager"
          className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-105"
        />
        {/* Subtle Vignette & Dark Readability Overlay - Zero bottom black wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_35%,rgba(0,0,0,0.45)_85%)] pointer-events-none" />
      </div>

      {/* 2. Occasional Distant Lightning Sky Glow */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-indigo-400/10 mix-blend-screen pointer-events-none animate-[distantLightning_16s_ease-in-out_infinite]" />

      {/* 3. Blood Moon Atmospheric Glow & Slow Drifting Clouds */}
      <div className="absolute top-[3%] left-[23.5%] w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-red-600/15 blur-2xl animate-pulse [animation-duration:8s] pointer-events-none" />
      <div className="absolute top-[4%] left-[20%] w-56 h-28 bg-gradient-to-r from-transparent via-red-950/20 to-transparent blur-xl animate-[cloudDrift_32s_linear_infinite] pointer-events-none" />

      {/* 4. Cemetery Lantern Flame Glow on Left Lamp Post */}
      <div className="absolute top-[17%] left-[6.8%] w-14 h-14 rounded-full bg-gradient-radial from-amber-400/50 via-orange-500/20 to-transparent blur-md animate-candle-flicker pointer-events-none" />

      {/* 5. Tombstone Candlelights Glow on Right Pedestal */}
      <div className="absolute bottom-[16%] right-[6.8%] w-12 h-12 rounded-full bg-gradient-radial from-amber-400/45 via-orange-600/20 to-transparent blur-sm animate-candle-flicker [animation-delay:1.4s] pointer-events-none" />

      {/* 6. Distant Flying Bats High in the Night Sky (Kept clear of central heading) */}
      {/* Two bats instead of four — reduces concurrent wing-flap animation cost */}
      <FlyingBat startYPercent={5} durationSeconds={18} delaySeconds={0} scale={0.65} flightDirection="right-to-left" />
      <FlyingBat startYPercent={10} durationSeconds={24} delaySeconds={8} scale={0.5} flightDirection="left-to-right" />

      {/* 7. Translucent Floating Ghost Drifting near Castle Spires (Upper Right) */}
      <FloatingGhost side="right" className="hidden lg:block top-[18%] right-[12%] opacity-35 mix-blend-screen filter drop-shadow-[0_0_20px_rgba(127,229,217,0.5)]" />

      {/* 8. Subtle, Low-Lying Ground Mist (Crisp pumpkins & tombstones remain visible) */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-teal-500/5 via-cyan-500/5 to-transparent animate-fog-roll opacity-40 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-[radial-gradient(ellipse_at_50%_100%,rgba(140,180,195,0.08)_0%,transparent_75%)] animate-fog-roll [animation-delay:6s] opacity-35 pointer-events-none" />

      {/* 9. Floating Fiery Embers & Supernatural Ash */}
      <div className="absolute bottom-12 left-[18%] w-1.5 h-1.5 rounded-full bg-amber-400/80 blur-[0.5px] animate-[emberFloat_6s_ease-out_infinite]" />
      <div className="absolute bottom-16 left-[38%] w-1 h-1 rounded-full bg-orange-400/70 blur-[0.5px] animate-[emberFloat_8s_ease-out_infinite_1.2s]" />
      <div className="absolute bottom-14 right-[32%] w-1.5 h-1.5 rounded-full bg-red-500/70 blur-[0.5px] animate-[emberFloat_7s_ease-out_infinite_2.4s]" />
      <div className="absolute bottom-20 right-[15%] w-1 h-1 rounded-full bg-amber-300/80 blur-[0.5px] animate-[emberFloat_9s_ease-out_infinite_0.8s]" />
    </div>
  );
};
