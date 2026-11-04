import React, { useState, useEffect } from 'react';
import type { Round4IntroState } from '../../../types/round4.types';
import { soundController } from '../../../utils/soundController';
import { DoveFlightAnimation } from './DoveFlightAnimation';
import { AncientLetter } from './AncientLetter';
import { LetterRevealDialog } from './LetterRevealDialog';
import { GoldenPortalTransition } from './GoldenPortalTransition';
import { CollegeBuildingView } from './CollegeBuildingView';

interface RoundFourIntroProps {
  onExit: () => void;
  onProceedToFloors?: (floorId: string) => void;
  initialState?: Round4IntroState;
}

export const RoundFourIntro: React.FC<RoundFourIntroProps> = ({
  onExit,
  onProceedToFloors,
  initialState = 'DOVE_ARRIVING',
}) => {
  const [state, setState] = useState<Round4IntroState>(initialState);
  const [isMuted, setIsMuted] = useState(() => soundController.isMuted());
  const [isCollegeRevealed, setIsCollegeRevealed] = useState(
    () => initialState === 'COLLEGE_REVEAL'
  );

  // Initial cinematic pause if starting from ENVIRONMENT_LOADING
  useEffect(() => {
    if (state !== 'ENVIRONMENT_LOADING') return;
    const timer = setTimeout(() => {
      setState('DOVE_ARRIVING');
    }, 700);

    return () => clearTimeout(timer);
  }, [state]);

  const handleToggleMute = () => {
    const nextMuted = soundController.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleDropComplete = () => {
    setState('LETTER_DROPPED');
  };

  const handleOpenLetter = () => {
    setState('LETTER_OPENING');
    setTimeout(() => {
      setState('LETTER_REVEALED');
    }, 400);
  };

  const handleBeginHunt = () => {
    setState('PORTAL_IGNITION');
  };

  const handlePortalAdvance = (nextState: Round4IntroState) => {
    setState(nextState);
  };

  const handlePortalComplete = () => {
    setIsCollegeRevealed(true);
  };

  const handleReplayIntro = () => {
    setIsCollegeRevealed(false);
    setState('ENVIRONMENT_LOADING');
    setTimeout(() => {
      setState('DOVE_ARRIVING');
    }, 400);
  };

  // If time-portal sequence has concluded: show the College Building Destination Screen
  if (isCollegeRevealed) {
    return (
      <CollegeBuildingView
        onExit={onExit}
        onReplayIntro={handleReplayIntro}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onProceedToFloors={onProceedToFloors}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#0a0c10] text-[#f4ecd8] flex flex-col font-sans overflow-hidden select-none">
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

        {/* Ambient Floating Golden Dust Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-[28%] left-[22%] w-1.5 h-1.5 rounded-full bg-amber-300/80 blur-[0.5px] animate-pulse [animation-duration:2.8s]" />
          <div className="absolute top-[45%] left-[38%] w-2 h-2 rounded-full bg-yellow-200/90 blur-[1px] animate-pulse [animation-duration:3.6s] [animation-delay:1.2s]" />
          <div className="absolute top-[35%] right-[25%] w-1.5 h-1.5 rounded-full bg-amber-300/80 blur-[0.5px] animate-pulse [animation-duration:2.2s] [animation-delay:0.8s]" />
          <div className="absolute top-[52%] right-[35%] w-2.5 h-2.5 rounded-full bg-amber-400/60 blur-[1px] animate-pulse [animation-duration:4s] [animation-delay:1.8s]" />
        </div>
      </div>

      {/* 2. Minimal Header (Strictly NO large title, NO statistics, NO avatar) */}
      <header className="relative z-30 w-full px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b border-amber-500/15 bg-black/30 backdrop-blur-sm">
        {/* Top-Left: Skull Emblem • FROST CARTEL • ROUND 04 */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400/30 to-amber-900/60 border border-amber-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,185,80,0.3)]">
            <span className="text-base sm:text-lg">💀</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.2em] text-amber-200">
              FROST CARTEL
            </span>
            <span className="text-amber-500/60 text-xs">―</span>
            <span className="font-sans text-[11px] sm:text-xs tracking-widest text-amber-300 font-semibold uppercase">
              ROUND 04
            </span>
          </div>
        </div>

        {/* Top-Right: Sound Toggle & Exit */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-amber-950/60 border border-amber-500/40 text-amber-200 flex items-center justify-center transition-all cursor-pointer"
          >
            <span className="text-xs">{isMuted ? '🔇' : '🔊'}</span>
          </button>

          {/* Exit Control */}
          <button
            type="button"
            onClick={onExit}
            aria-label="Exit Round 4 and return to Home"
            className="h-8 px-4 rounded-full bg-black/60 hover:bg-red-950/60 border border-red-500/40 hover:border-red-400 text-red-200 font-cinzel text-[11px] font-bold tracking-wider transition-all cursor-pointer"
          >
            EXIT
          </button>
        </div>
      </header>

      {/* 3. The Flying & Perched White Dove Animation */}
      <DoveFlightAnimation
        state={state}
        onDropComplete={handleDropComplete}
        isMuted={isMuted}
      />

      {/* 4. Interactive Sealed Ancient Letter on Pedestal */}
      <AncientLetter
        state={state}
        onOpenLetter={handleOpenLetter}
        isMuted={isMuted}
      />

      {/* 5. Opened Ancient Parchment Dialog Modal */}
      <LetterRevealDialog
        state={state}
        onBeginHunt={handleBeginHunt}
        isMuted={isMuted}
      />

      {/* 6. Multi-Stage Time-Travel Portal Transition */}
      <GoldenPortalTransition
        state={state}
        onAdvanceState={handlePortalAdvance}
        onComplete={handlePortalComplete}
      />
    </div>
  );
};
