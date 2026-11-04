import React, { useEffect, useState } from 'react';
import type { Round4IntroState } from '../../../types/round4.types';
import { soundController } from '../../../utils/soundController';

interface DoveFlightAnimationProps {
  state: Round4IntroState;
  onDropComplete: () => void;
  isMuted: boolean;
}

export const DoveFlightAnimation: React.FC<DoveFlightAnimationProps> = ({
  state,
  onDropComplete,
  isMuted,
}) => {
  const [flightPhase, setFlightPhase] = useState<'approaching' | 'descending' | 'dropped' | 'perched'>('approaching');

  useEffect(() => {
    if (state !== 'DOVE_ARRIVING') return;

    if (!isMuted) {
      soundController.playDoveFlutter();
    }

    // Step 1: Approaching from distance (0 -> 1.4s)
    const t1 = setTimeout(() => {
      setFlightPhase('descending');
      if (!isMuted) {
        soundController.playDoveFlutter();
      }
    }, 1200);

    // Step 2: Reaching pedestal and releasing letter (2.3s)
    const t2 = setTimeout(() => {
      setFlightPhase('dropped');
      if (!isMuted) {
        soundController.playLetterDrop();
      }
      onDropComplete();
    }, 2300);

    // Step 3: Banking away and perching on stone arch (3.4s)
    const t3 = setTimeout(() => {
      setFlightPhase('perched');
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [state, onDropComplete, isMuted]);

  // If before dove arrives, don't render
  if (state === 'ENVIRONMENT_LOADING') {
    return null;
  }

  // Once perched or in letter stages: render the serene perched dove on the right column
  const isPerched = flightPhase === 'perched' || state === 'LETTER_DROPPED' || state === 'LETTER_OPENING' || state === 'LETTER_REVEALED';

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none">
      {/* 1. Flying Dove & Golden Particle Trail */}
      {!isPerched && (
        <div
          className={`absolute transition-all duration-[1200ms] ease-out ${
            flightPhase === 'approaching'
              ? 'top-[16%] left-[50%] -translate-x-1/2 -translate-y-1/2 scale-[0.28] opacity-90'
              : flightPhase === 'descending'
              ? 'top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 scale-[0.75] opacity-100'
              : 'top-[12%] left-[84%] -translate-x-1/2 -translate-y-1/2 scale-[0.45] opacity-95'
          }`}
        >
          {/* Swirling Golden Magic Particle Trail */}
          <div className="absolute -inset-10 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
            <div className="absolute w-12 h-12 rounded-full border border-amber-300/60 animate-ping opacity-40" />
            <svg className="w-32 h-32 absolute animate-spin [animation-duration:8s] opacity-75" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(245,215,130,0.6)" strokeWidth="1.5" strokeDasharray="6 8" />
              <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(255,240,180,0.4)" strokeWidth="1" strokeDasharray="3 5" />
            </svg>
          </div>

          {/* Animated Flying Dove Sprite */}
          <div className="relative animate-bounce [animation-duration:0.6s]">
            <img
              src="/assets/round-4/white_dove_flying.png"
              alt="White messenger dove delivering sealed letter"
              className="w-56 h-auto drop-shadow-[0_10px_25px_rgba(255,225,120,0.5)] filter brightness-110"
            />
          </div>
        </div>
      )}

      {/* 2. Perched Dove Resting Gracefully on Right Stone Arch Column */}
      {isPerched && (
        <div
          className="absolute top-[6%] sm:top-[8%] lg:top-[9%] right-[8%] sm:right-[11%] lg:right-[13%] w-24 sm:w-28 lg:w-32 animate-fadeIn transition-transform duration-700 hover:scale-105"
          style={{ animationDuration: '0.9s' }}
        >
          <div className="relative animate-pulse [animation-duration:4s]">
            {/* Subtle soft sunlight halo */}
            <div className="absolute -inset-4 rounded-full bg-amber-300/15 blur-lg pointer-events-none" />
            <img
              src="/assets/round-4/white_dove_perched.png"
              alt="Perched White Dove"
              className="w-full h-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] filter brightness-105"
            />
          </div>
        </div>
      )}
    </div>
  );
};
