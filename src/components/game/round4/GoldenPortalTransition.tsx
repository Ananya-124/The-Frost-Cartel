import React, { useEffect, useState } from 'react';
import type { Round4IntroState } from '../../../types/round4.types';

interface GoldenPortalTransitionProps {
  state: Round4IntroState;
  onAdvanceState: (nextState: Round4IntroState) => void;
  onComplete: () => void;
}

export const GoldenPortalTransition: React.FC<GoldenPortalTransitionProps> = ({
  state,
  onAdvanceState,
  onComplete,
}) => {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  // Sequence orchestrator for the 5 transition stages
  useEffect(() => {
    // Reduced motion fast-path
    if (reducedMotion && state === 'PORTAL_IGNITION') {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }

    let timer: ReturnType<typeof setTimeout> | undefined;

    switch (state) {
      case 'PORTAL_IGNITION':
        timer = setTimeout(() => {
          onAdvanceState('SCENE_CONTRACTING');
        }, 900);
        break;

      case 'SCENE_CONTRACTING':
        timer = setTimeout(() => {
          onAdvanceState('PARTICLES_FORMING');
        }, 1100);
        break;

      case 'PARTICLES_FORMING':
        timer = setTimeout(() => {
          onAdvanceState('WHITE_TUNNEL');
        }, 1100);
        break;

      case 'WHITE_TUNNEL':
        timer = setTimeout(() => {
          onAdvanceState('COLLEGE_REVEAL');
        }, 1400);
        break;

      case 'COLLEGE_REVEAL':
        timer = setTimeout(() => {
          onComplete();
        }, 900);
        break;

      default:
        break;
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [state, onAdvanceState, onComplete, reducedMotion]);

  const isTransitionActive =
    state === 'PORTAL_IGNITION' ||
    state === 'SCENE_CONTRACTING' ||
    state === 'PARTICLES_FORMING' ||
    state === 'WHITE_TUNNEL' ||
    state === 'COLLEGE_REVEAL';

  if (!isTransitionActive) {
    return null;
  }

  // Reduced motion: Clean accessible fade
  if (reducedMotion) {
    return (
      <div className="fixed inset-0 z-50 bg-amber-100/95 transition-opacity duration-1000 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      {/* 1. Stage A: Portal Ignition (Golden Energy Vortex Expansion) */}
      {state === 'PORTAL_IGNITION' && (
        <div className="absolute inset-0 flex items-center justify-center animate-fadeIn duration-500">
          <div className="w-96 h-96 rounded-full bg-amber-400/40 blur-3xl animate-ping [animation-duration:1s]" />
          <div className="w-[500px] h-[500px] rounded-full border-4 border-amber-300/80 animate-spin [animation-duration:3s] shadow-[0_0_80px_rgba(255,220,100,0.9)]" />
          <div className="w-[300px] h-[300px] rounded-full bg-gradient-to-r from-amber-300 via-white to-amber-200 blur-xl opacity-90 animate-pulse" />
        </div>
      )}

      {/* 2. Stage B: Full-Screen Contraction (Scene shrinks into central singularity) */}
      {state === 'SCENE_CONTRACTING' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
          <div className="w-full h-full border-[60px] sm:border-[120px] border-black/80 rounded-[50%] transition-transform duration-1000 scale-50 opacity-90 filter blur-md" />
          <div className="relative w-80 h-80 rounded-full bg-gradient-to-tr from-amber-400 via-white to-yellow-200 animate-spin [animation-duration:1.5s] shadow-[0_0_120px_rgba(255,255,255,1)]" />
        </div>
      )}

      {/* 3. Stage C: Particle Fragmentation (Screen Breaks Into Converging Golden Shards) */}
      {state === 'PARTICLES_FORMING' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <svg className="w-full h-full absolute inset-0 animate-spin [animation-duration:4s]" viewBox="0 0 800 800">
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24;
              const rad = (angle * Math.PI) / 180;
              const x2 = 400 + Math.cos(rad) * 450;
              const y2 = 400 + Math.sin(rad) * 450;
              return (
                <line
                  key={`streak-${angle}`}
                  x1="400"
                  y1="400"
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,230,140,0.8)"
                  strokeWidth="2.5"
                  strokeDasharray="15 35"
                />
              );
            })}
          </svg>
          <div className="w-48 h-48 rounded-full bg-white shadow-[0_0_160px_rgba(255,255,255,1)] scale-150 transition-transform duration-700 animate-pulse" />
        </div>
      )}

      {/* 4. Stage D: White Tunnel (Luminous forward warp tunnel with geometric patterns) */}
      {state === 'WHITE_TUNNEL' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-amber-100/95 via-white to-amber-50/90 transition-opacity duration-500">
          <div className="relative w-[600px] h-[600px] flex items-center justify-center" style={{ perspective: '900px' }}>
            <div className="w-[500px] h-[500px] rounded-full border-4 border-amber-400/70 animate-spin [animation-duration:6s] shadow-[0_0_50px_rgba(245,190,80,0.7)]" />
            <div className="absolute w-[360px] h-[360px] rounded-full border-2 border-dashed border-amber-600/60 animate-spin [animation-duration:4s] [animation-direction:reverse]" />
            <div className="absolute w-[220px] h-[220px] rounded-full border-4 border-amber-300 animate-ping [animation-duration:1.5s]" />
            <div className="absolute w-24 h-24 rounded-full bg-white shadow-[0_0_80px_rgba(255,255,255,1)]" />
          </div>
          <svg className="w-full h-full absolute inset-0 animate-spin [animation-duration:2s]" viewBox="0 0 1000 1000">
            {Array.from({ length: 32 }).map((_, i) => {
              const angle = (i * 360) / 32;
              const rad = (angle * Math.PI) / 180;
              const x2 = 500 + Math.cos(rad) * 600;
              const y2 = 500 + Math.sin(rad) * 600;
              return (
                <line
                  key={`warp-${angle}`}
                  x1="500"
                  y1="500"
                  x2={x2}
                  y2={y2}
                  stroke="rgba(240,195,90,0.9)"
                  strokeWidth="3.5"
                  strokeDasharray="40 20"
                />
              );
            })}
          </svg>
        </div>
      )}

      {/* 5. Stage E: College Reveal (Smooth Light Dissolve into Destination) */}
      {state === 'COLLEGE_REVEAL' && (
        <div className="absolute inset-0 bg-white transition-opacity duration-1000 opacity-0 pointer-events-none" />
      )}
    </div>
  );
};
