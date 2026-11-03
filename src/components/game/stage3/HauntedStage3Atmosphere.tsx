import React from 'react';
import { FlyingBat } from '../haunted/FlyingBat';
import { FlyingCrow } from '../haunted/FlyingCrow';
import { FloatingGhost } from '../haunted/FloatingGhost';

export const HauntedStage3Atmosphere: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none"
    >
      {/* 1. Master High-Resolution Haunted Mansion on Cliff with Cemetery Foreground */}
      <div className="absolute inset-0 w-full h-full bg-black">
        <img
          src="/assets/cinematic_haunted_bg.jpg"
          alt=""
          loading="eager"
          className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.08]"
        />
        {/* Cinematic Vignette & Deep Night Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.7)_80%,rgba(0,0,0,0.95)_100%)] pointer-events-none" />
      </div>

      {/* 2. Distant Lightning Atmosphere Sky Glow */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-indigo-500/10 mix-blend-screen pointer-events-none animate-[distantLightning_14s_ease-in-out_infinite]" />

      {/* 3. Real Animated Flying Bats (Flapping wings & sweeping across the night sky) */}
      <FlyingBat startYPercent={8} durationSeconds={15} delaySeconds={0} scale={0.75} flightDirection="right-to-left" />
      <FlyingBat startYPercent={14} durationSeconds={20} delaySeconds={4} scale={0.6} flightDirection="left-to-right" />
      <FlyingBat startYPercent={22} durationSeconds={24} delaySeconds={10} scale={0.85} flightDirection="right-to-left" />
      <FlyingBat startYPercent={11} durationSeconds={18} delaySeconds={7} scale={0.5} flightDirection="left-to-right" />

      {/* 4. Real Animated Soaring & Flapping Crows / Ravens (Gliding past moon and mansion spires) */}
      <FlyingCrow startYPercent={16} durationSeconds={22} delaySeconds={2} scale={0.9} flightDirection="left-to-right" />
      <FlyingCrow startYPercent={26} durationSeconds={28} delaySeconds={12} scale={0.7} flightDirection="right-to-left" />
      <FlyingCrow startYPercent={9} durationSeconds={25} delaySeconds={16} scale={0.8} flightDirection="left-to-right" />

      {/* 5. Translucent Ethereal Ghosts Moving Here and There */}
      {/* Ghost 1: Gliding across the cemetery grounds on the left */}
      <FloatingGhost
        side="left"
        className="top-[28%] left-[8%] opacity-45 mix-blend-screen filter drop-shadow-[0_0_25px_rgba(127,229,217,0.6)] animate-ghost-drift"
      />

      {/* Ghost 2: Drifting high near the haunted mansion spires on the right */}
      <FloatingGhost
        side="right"
        className="top-[18%] right-[10%] opacity-40 mix-blend-screen filter drop-shadow-[0_0_20px_rgba(127,229,217,0.5)] animate-ghost-float"
      />

      {/* Ghost 3: Wandering spirit rising from central cemetery gravestones */}
      <div
        className="absolute top-[48%] left-[45%] -translate-x-1/2 pointer-events-none opacity-30 animate-[ghostFloat_12s_ease-in-out_infinite_alternate] filter blur-[0.6px] drop-shadow-[0_0_22px_rgba(167,243,208,0.45)]"
      >
        <img
          src="/assets/ghost_apparition.png"
          alt=""
          className="w-24 h-24 object-contain"
        />
      </div>

      {/* 6. Rolling Ground Fog & Volumetric Supernatural Mist */}
      <div className="absolute inset-x-0 bottom-0 h-48 mist-overlay opacity-60 animate-fog-roll pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-[radial-gradient(ellipse_at_50%_100%,rgba(127,229,217,0.12)_0%,rgba(5,5,10,0.7)_70%,transparent_100%)] animate-fog-roll [animation-delay:3s] pointer-events-none" />

      {/* 7. Floating Supernatural Embers & Spirits */}
      <div className="absolute bottom-24 left-[18%] w-2 h-2 rounded-full bg-amber-400/80 blur-[0.5px] animate-[emberFloat_6s_ease-out_infinite]" />
      <div className="absolute bottom-28 right-[22%] w-2 h-2 rounded-full bg-cyan-300/80 blur-[0.5px] animate-[emberFloat_8s_ease-out_infinite_2s]" />
      <div className="absolute bottom-20 left-[52%] w-1.5 h-1.5 rounded-full bg-amber-300/70 blur-[0.5px] animate-[emberFloat_7s_ease-out_infinite_4s]" />
    </div>
  );
};

