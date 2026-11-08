import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { FlyingBat } from '../haunted/FlyingBat';
import { FlyingCrow } from '../haunted/FlyingCrow';
import { FloatingGhost } from '../haunted/FloatingGhost';

export const HauntedStage3Atmosphere: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const moonGlowRef = useRef<HTMLDivElement>(null);
  const lanternRef = useRef<HTMLDivElement>(null);
  const dustRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Respect prefers-reduced-motion
      if (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }

      // 1. Gentle continuous moonlight pulsation over the blood moon
      if (moonGlowRef.current) {
        gsap.to(moonGlowRef.current, {
          opacity: 0.85,
          scale: 1.08,
          duration: 5.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
      }

      // 2. Realistic flickering distant lantern at the left cemetery gate
      if (lanternRef.current) {
        const flickerTl = gsap.timeline({ repeat: -1 });
        flickerTl
          .to(lanternRef.current, { opacity: 0.95, duration: 0.15, ease: 'rough' })
          .to(lanternRef.current, { opacity: 0.65, duration: 0.1, ease: 'rough' })
          .to(lanternRef.current, { opacity: 0.9, duration: 0.25, ease: 'power1.inOut' })
          .to(lanternRef.current, { opacity: 0.7, duration: 0.08, ease: 'rough' })
          .to(lanternRef.current, { opacity: 1.0, duration: 0.3, ease: 'power2.out' })
          .to(lanternRef.current, { opacity: 0.8, duration: 0.18, ease: 'rough' });
      }

      // 3. Floating supernatural dust particles drifting across the graveyard
      if (dustRef.current) {
        const particles = dustRef.current.children;
        Array.from(particles).forEach((particle, idx) => {
          gsap.to(particle, {
            y: `-=${45 + (idx % 4) * 15}`,
            x: `+=${(idx % 2 === 0 ? 1 : -1) * (20 + (idx % 3) * 10)}`,
            opacity: 0.15 + (idx % 3) * 0.25,
            duration: 4.5 + (idx % 5) * 1.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: idx * 0.35,
          });
        });
      }

      // 4. Slowly moving continuous ground fog
      if (fogRef.current) {
        gsap.to(fogRef.current, {
          x: '-=120',
          duration: 28,
          ease: 'linear',
          repeat: -1,
          yoyo: true,
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.65)_80%,rgba(0,0,0,0.95)_100%)] pointer-events-none" />
      </div>

      {/* 2. Moonlight Ambient Glow on Blood Moon (Top-Left) */}
      <div
        ref={moonGlowRef}
        className="absolute top-[8%] left-[16%] w-56 h-56 rounded-full bg-red-600/15 filter blur-3xl pointer-events-none opacity-50"
      />

      {/* 3. Flickering Distant Lantern Glow (Left Cemetery Gate) */}
      <div
        ref={lanternRef}
        className="absolute top-[28%] left-[12%] w-24 h-24 rounded-full bg-amber-500/25 filter blur-xl pointer-events-none opacity-80"
      />

      {/* 4. Distant Lightning Atmosphere Sky Glow */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-indigo-500/10 mix-blend-screen pointer-events-none animate-[distantLightning_14s_ease-in-out_infinite]" />

      {/* 5. Real Animated Flying Bats (Flapping wings & sweeping across the night sky) */}
      <FlyingBat startYPercent={8} durationSeconds={15} delaySeconds={0} scale={0.75} flightDirection="right-to-left" />
      <FlyingBat startYPercent={14} durationSeconds={20} delaySeconds={4} scale={0.6} flightDirection="left-to-right" />
      <FlyingBat startYPercent={22} durationSeconds={24} delaySeconds={10} scale={0.85} flightDirection="right-to-left" />
      <FlyingBat startYPercent={11} durationSeconds={18} delaySeconds={7} scale={0.5} flightDirection="left-to-right" />

      {/* 6. Real Animated Soaring & Flapping Crows / Ravens */}
      <FlyingCrow startYPercent={16} durationSeconds={22} delaySeconds={2} scale={0.9} flightDirection="left-to-right" />
      <FlyingCrow startYPercent={26} durationSeconds={28} delaySeconds={12} scale={0.7} flightDirection="right-to-left" />
      <FlyingCrow startYPercent={9} durationSeconds={25} delaySeconds={16} scale={0.8} flightDirection="left-to-right" />

      {/* 7. Translucent Ethereal Ghosts */}
      <FloatingGhost
        side="left"
        className="top-[28%] left-[8%] opacity-45 mix-blend-screen filter drop-shadow-[0_0_25px_rgba(127,229,217,0.6)] animate-ghost-drift"
      />
      <FloatingGhost
        side="right"
        className="top-[18%] right-[10%] opacity-40 mix-blend-screen filter drop-shadow-[0_0_20px_rgba(127,229,217,0.5)] animate-ghost-float"
      />
      <div className="absolute top-[48%] left-[45%] -translate-x-1/2 pointer-events-none opacity-30 animate-[ghostFloat_12s_ease-in-out_infinite_alternate] filter blur-[0.6px] drop-shadow-[0_0_22px_rgba(167,243,208,0.45)]">
        <img
          src="/assets/ghost_apparition.png"
          alt=""
          className="w-24 h-24 object-contain"
        />
      </div>

      {/* 8. Rolling Ground Fog & Volumetric Supernatural Mist */}
      <div
        ref={fogRef}
        className="absolute inset-x-0 bottom-0 h-48 mist-overlay opacity-60 pointer-events-none"
      />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-[radial-gradient(ellipse_at_50%_100%,rgba(127,229,217,0.12)_0%,rgba(5,5,10,0.7)_70%,transparent_100%)] animate-fog-roll [animation-delay:3s] pointer-events-none" />

      {/* 9. Floating Supernatural Dust Particles & Embers (Managed via GSAP) */}
      <div ref={dustRef} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[65%] left-[22%] w-1.5 h-1.5 rounded-full bg-amber-400/70 blur-[0.5px]" />
        <div className="absolute top-[72%] left-[34%] w-2 h-2 rounded-full bg-amber-300/80 blur-[0.8px]" />
        <div className="absolute top-[58%] left-[48%] w-1.5 h-1.5 rounded-full bg-purple-400/75 blur-[0.6px]" />
        <div className="absolute top-[68%] left-[62%] w-2 h-2 rounded-full bg-teal-300/80 blur-[0.7px]" />
        <div className="absolute top-[75%] left-[76%] w-1.5 h-1.5 rounded-full bg-cyan-400/70 blur-[0.5px]" />
        <div className="absolute top-[60%] left-[84%] w-2 h-2 rounded-full bg-amber-400/80 blur-[0.8px]" />
        <div className="absolute top-[80%] left-[15%] w-1 h-1 rounded-full bg-amber-200/60 blur-[0.4px]" />
        <div className="absolute top-[78%] left-[55%] w-1.5 h-1.5 rounded-full bg-purple-300/70 blur-[0.5px]" />
        <div className="absolute top-[82%] left-[70%] w-1.5 h-1.5 rounded-full bg-teal-200/70 blur-[0.5px]" />
      </div>
    </div>
  );
};
