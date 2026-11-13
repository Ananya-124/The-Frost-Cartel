import React, { useEffect, useRef, useState } from 'react';
import type { WinnerRecord } from '../../../types/round4Expedition.types';
import { soundController } from '../../../utils/soundController';
import './WinnerCelebrationModal.css';

interface WinnerCelebrationModalProps {
  winner: WinnerRecord | null;
  routeRomanNumeral?: string;
  isMuted?: boolean;
  onExit: () => void;
}

export const WinnerCelebrationModal: React.FC<WinnerCelebrationModalProps> = ({
  winner,
  isMuted = false,
  onExit,
}) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [prefersReducedMotion] = useState(() =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const celebrationTriggeredRef = useRef(false);

  useEffect(() => {
    if (!celebrationTriggeredRef.current && !isMuted) {
      celebrationTriggeredRef.current = true;
      try {
        soundController.playVictory();
      } catch {
        // AudioContext policy
        }
    }
  }, [isMuted]);

  if (!winner || !winner.teamName) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Verifying Championship Victory"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
      >
        <div className="text-center p-8 rounded-2xl bg-[#1a0e0d] border border-amber-500/50 shadow-2xl max-w-md w-full">
          <div className="w-12 h-12 mx-auto mb-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs uppercase tracking-[0.3em] text-amber-400 font-cinzel font-bold mb-2">
            FROST CARTEL • TOURNAMENT FINAL
          </div>
          <div className="text-sm font-serif text-amber-200/80">
            Awaiting Authoritative Winner Verification...
          </div>
        </div>
      </div>
    );
  }

  const cleanTeamName = winner.teamName.trim().toUpperCase();

  const handleEnterHallOfFame = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    soundController.playClick();

    if (typeof window !== 'undefined') {
      window.location.hash = '#/leaderboard';
    }

    onExit();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Championship Victory Announcement"
      className="winner-scene fixed inset-0 z-50 overflow-y-auto select-none"
    >
      <main className="winner-artwork">
        {videoFailed || prefersReducedMotion ? (
          <img
            className="winner-artwork-image"
            src="/assets/round-04/winner-celebration.png"
            alt="The Frost Cartel victory scene with a congratulations plaque and celebrating skeletons"
          />
        ) : (
          <video
            className="winner-artwork-video"
            data-testid="winner-celebration-video"
            src="/assets/round-04/winner-celebration.mp4"
            poster="/assets/round-04/winner-celebration.png"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
          />
        )}
        <img
          className="winner-star-cleanup winner-star-cleanup--plaque"
          src="/assets/round-04/winner-star-patch-plaque.png"
          alt=""
          aria-hidden="true"
        />
        <img
          className="winner-star-cleanup winner-star-cleanup--corner"
          src="/assets/round-04/winner-star-patch-corner.png"
          alt=""
          aria-hidden="true"
        />
        <h1 className="winner-team-name">
          <span>{cleanTeamName}</span>
        </h1>
        <div className="winner-accessible-copy">
          <span>FROST CARTEL</span>
          <span>THE RADIANT TREASURE HUNT</span>
          <span>CONGRATULATIONS!</span>
        </div>
        <button
          type="button"
          onClick={handleEnterHallOfFame}
          disabled={isNavigating}
          aria-label="Enter The Hall of Fame"
          className="winner-return"
        />
      </main>
    </div>
  );
};
