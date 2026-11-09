import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { soundController } from '../../../utils/soundController';

interface CinematicCoffinOpeningProps {
  onComplete: () => void;
}

export const CinematicCoffinOpening: React.FC<CinematicCoffinOpeningProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const coffinRef = useRef<HTMLDivElement | null>(null);
  const lidRef = useRef<HTMLImageElement | null>(null);
  const flareRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    soundController.playPortalWhoosh();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          onComplete();
        },
      });

      // 1. Camera approach (350–500ms)
      tl.fromTo(
        coffinRef.current,
        { scale: 0.9, opacity: 0.7 },
        { scale: 1.15, opacity: 1, duration: 0.45, ease: 'power2.inOut' }
      );

      // 2. Coffin lid begins unsealing & physical rotation (700–900ms)
      tl.to(
        lidRef.current,
        {
          transformPerspective: 1000,
          rotateY: -80,
          rotateZ: -12,
          x: -120,
          opacity: 0.85,
          duration: 0.8,
          ease: 'power3.inOut',
        },
        '+=0.05'
      );

      // 3. White-golden light burst emerges from inside (160–220ms)
      tl.fromTo(
        flareRef.current,
        { scale: 0.2, opacity: 0 },
        {
          scale: 3.5,
          opacity: 0.95,
          duration: 0.2,
          ease: 'power4.out',
          onStart: () => soundController.playDiscover(),
        },
        '-=0.3'
      );

      // 4. Light intensity settles into ambient candlelight (250–350ms)
      tl.to(flareRef.current, {
        opacity: 0,
        scale: 4.2,
        duration: 0.32,
        ease: 'power2.inOut',
      });
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 overflow-hidden select-none"
    >
      {/* Background Dimmed Cemetery Atmosphere */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(60,20,5,0.4)_0%,rgba(0,0,0,0.98)_80%)] pointer-events-none"
      />

      {/* Skip Button */}
      <button
        type="button"
        onClick={() => {
          soundController.playClick();
          onComplete();
        }}
        className="absolute top-4 right-4 z-50 px-4 py-1.5 rounded-full bg-black/80 hover:bg-amber-950/80 border border-amber-500/80 text-amber-300 font-cinzel text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
      >
        Skip Opening ✕
      </button>

      {/* Center Coffin Container */}
      <div
        ref={coffinRef}
        className="relative flex flex-col items-center justify-center max-w-sm sm:max-w-md w-full"
      >
        {/* Closed Coffin Artwork acting as the heavy Lid */}
        <img
          ref={lidRef}
          src="/assets/stage-3/coffins/coffin_hd_1.png"
          alt="Coffin I: The Marked Remains"
          className="w-auto h-[60vh] max-h-[520px] object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]"
        />

        {/* White-Golden Light Flare Burst */}
        <div
          ref={flareRef}
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(254,240,138,0.9)_30%,rgba(245,158,11,0.6)_60%,transparent_80%)] filter blur-md pointer-events-none opacity-0"
        />
      </div>

      {/* Bottom Subtitle */}
      <div className="absolute bottom-6 inset-x-0 text-center font-cinzel text-xs sm:text-sm font-bold tracking-[0.3em] text-amber-400 uppercase drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse">
        ✦ UNSEALING COFFIN I: THE MARKED REMAINS ✦
      </div>
    </div>
  );
};
