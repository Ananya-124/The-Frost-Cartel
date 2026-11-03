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
          className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-105"
        />
        {/* Subtle Vignette & Dark Readability Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/75 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50 pointer-events-none" />
      </div>

      {/* 2. Occasional Distant Lightning Sky Glow */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-indigo-400/10 mix-blend-screen pointer-events-none animate-[distantLightning_16s_ease-in-out_infinite]" />

      {/* 3. Animated Flying Bats Across the Night Sky */}
      <FlyingBat startYPercent={8} durationSeconds={16} delaySeconds={0} scale={0.7} flightDirection="right-to-left" />
      <FlyingBat startYPercent={15} durationSeconds={24} delaySeconds={6} scale={0.55} flightDirection="left-to-right" />
      <FlyingBat startYPercent={22} durationSeconds={28} delaySeconds={12} scale={0.8} flightDirection="right-to-left" />

      {/* 4. Translucent Floating Ghost Drifting near Castle Spires (Upper Right) */}
      <FloatingGhost side="right" className="hidden lg:block top-[18%] right-[12%] opacity-35 mix-blend-screen filter drop-shadow-[0_0_20px_rgba(127,229,217,0.5)]" />

      {/* 5. Dense Rolling Ground Mist & Fog */}
      <div className="absolute inset-x-0 bottom-0 h-44 mist-overlay opacity-55 animate-fog-roll pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(ellipse_at_50%_100%,rgba(127,229,217,0.1)_0%,rgba(8,10,15,0.65)_65%,transparent_100%)] animate-fog-roll [animation-delay:4s] pointer-events-none" />

      {/* 6. Subtle Floating Supernatural Embers */}
      <div className="absolute bottom-20 left-[22%] w-1.5 h-1.5 rounded-full bg-amber-400/70 blur-[0.5px] animate-[emberFloat_7s_ease-out_infinite]" />
      <div className="absolute bottom-24 right-[25%] w-1.5 h-1.5 rounded-full bg-amber-300/70 blur-[0.5px] animate-[emberFloat_8s_ease-out_infinite_1.5s]" />
    </div>
  );
};
