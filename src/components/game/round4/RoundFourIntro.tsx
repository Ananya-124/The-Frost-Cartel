import React, { useState, useEffect } from 'react';
import type { Round4IntroState } from '../../../types/round4.types';
import { useRoundFourIntro } from './useRoundFourIntro';
import { CinematicBlurTransition } from './CinematicBlurTransition';
import { DoveFlightAnimation } from './DoveFlightAnimation';
import { AncientLetter } from './AncientLetter';
import { LetterRevealDialog } from './LetterRevealDialog';
import { CollegeBuildingView } from './CollegeBuildingView';

interface RoundFourIntroProps {
  onExit: () => void;
  onProceedToFloors?: (floorId: string) => void;
  initialState?: Round4IntroState;
}

export const RoundFourIntro: React.FC<RoundFourIntroProps> = ({
  onExit,
  onProceedToFloors,
  initialState = 'INITIAL_REVEAL',
}) => {
  const {
    state,
    isMuted,
    handleToggleMute,
    initialFocused,
    reducedMotion,
    handleLetterDrop,
    handleDropFinished,
    handleDovePerched,
    handleOpenLetter,
    handleBeginHunt,
    handleReplayIntro,
  } = useRoundFourIntro({ initialState, onExit, onProceedToFloors });

  const isCrossfading =
    state === 'HUNT_REQUESTED' ||
    state === 'OUTGOING_BLUR' ||
    state === 'INCOMING_COLLEGE_REVEAL' ||
    state === 'PORTAL_IGNITION' ||
    state === 'SCENE_CONTRACTING' ||
    state === 'PARTICLES_FORMING' ||
    state === 'WHITE_TUNNEL';

  const isCollegeReady = state === 'COLLEGE_READY' || state === 'COLLEGE_REVEAL';

  const [incomingFocused, setIncomingFocused] = useState(
    () => isCollegeReady
  );

  useEffect(() => {
    if (isCrossfading) {
      const frameId = requestAnimationFrame(() => {
        setIncomingFocused(true);
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [isCrossfading]);

  // Support ESC key to exit back to Home seamlessly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  // If already reached college ready without intro, render college directly
  if (isCollegeReady && !isCrossfading) {
    return (
      <CollegeBuildingView
        onExit={onExit}
        onBack={handleReplayIntro}
        onReplayIntro={handleReplayIntro}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onProceedToFloors={onProceedToFloors}
      />
    );
  }

  // Incoming College Screen style during crossfade
  const incomingStyle: React.CSSProperties = reducedMotion
    ? {
        opacity: incomingFocused ? 1 : 0,
        transition: 'opacity 500ms ease',
      }
    : {
        filter: incomingFocused ? 'blur(0px)' : 'blur(14px)',
        opacity: incomingFocused ? 1 : 0,
        transform: incomingFocused ? 'scale(1)' : 'scale(1.025)',
        transition:
          'filter 1400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 1400ms cubic-bezier(0.4, 0, 0.2, 1), transform 1400ms cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'filter, opacity, transform',
      };

  return (
    <div className="relative min-h-screen w-full bg-[#0a0c10] text-[#f4ecd8] font-sans overflow-hidden select-none">
      {/* Layer 1 (Underneath): Incoming College Destination Screen mounted during crossfade */}
      {isCrossfading && (
        <div
          className="absolute inset-0 z-0 origin-center pointer-events-auto"
          style={incomingStyle}
        >
          <CollegeBuildingView
            onExit={onExit}
            onBack={handleReplayIntro}
            onReplayIntro={handleReplayIntro}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onProceedToFloors={onProceedToFloors}
          />
        </div>
      )}

      {/* Layer 2 (Foreground): Outgoing / Initial Intro Scene with Blur-to-Clear Lens focus */}
      <CinematicBlurTransition
        isInitialFocused={initialFocused}
        isOutgoing={isCrossfading}
        reducedMotion={reducedMotion}
      >
        <div className="relative min-h-screen w-full flex flex-col justify-between">
          {/* 1. Full-Screen Cinematic Dawn Stone Archway Backdrop */}
          <div className="fixed inset-0 z-0">
            <img
              src="/assets/round-4/round4_arch_dawn_bg.jpg"
              alt="Ancient Stone Archway overlooking Neoclassical College at Dawn"
              className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-105"
            />

            {/* Golden Sunbeams & Morning Mist Atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/35 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,220,120,0.18)_0%,transparent_65%)] pointer-events-none" />

            {/* Ambient Floating Golden Dust Particles & Wind Leaves */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
              <div className="absolute top-[28%] left-[22%] w-1.5 h-1.5 rounded-full bg-amber-300/80 blur-[0.5px] animate-pulse [animation-duration:2.8s]" />
              <div className="absolute top-[45%] left-[38%] w-2 h-2 rounded-full bg-yellow-200/90 blur-[1px] animate-pulse [animation-duration:3.6s] [animation-delay:1.2s]" />
              <div className="absolute top-[35%] right-[25%] w-1.5 h-1.5 rounded-full bg-amber-300/80 blur-[0.5px] animate-pulse [animation-duration:2.2s] [animation-delay:0.8s]" />
              <div className="absolute top-[52%] right-[35%] w-2.5 h-2.5 rounded-full bg-amber-400/60 blur-[1px] animate-pulse [animation-duration:4s] [animation-delay:1.8s]" />
              {/* Subtle floating leaves */}
              <div className="absolute top-[30%] left-[15%] text-xs text-amber-500/40 animate-spin [animation-duration:14s]">🍃</div>
              <div className="absolute top-[40%] right-[18%] text-xs text-amber-400/40 animate-spin [animation-duration:18s]">🍂</div>
            </div>
          </div>

          {/* 2. The Flying & Perched White Dove Animation (Slow 6.2s total flight, Bezier trajectory) */}
          <DoveFlightAnimation
            state={state}
            onDropComplete={handleLetterDrop}
            onDovePerched={handleDovePerched}
            isMuted={isMuted}
          />

          {/* 4. Interactive Sealed Ancient Letter on Pedestal (Drop physics, impact sparks, hover glow) */}
          <AncientLetter
            state={state}
            onOpenLetter={handleOpenLetter}
            onDropFinished={handleDropFinished}
            isMuted={isMuted}
          />

          {/* 5. Opened Ancient Parchment Dialog Modal (Parchment scroll, exact text, BEGIN THE HUNT) */}
          <LetterRevealDialog
            state={state}
            onBeginHunt={handleBeginHunt}
            isMuted={isMuted}
          />
        </div>
      </CinematicBlurTransition>
    </div>
  );
};
