import React, { useState } from 'react';
import type { Round4IntroState } from '../../../types/round4.types';
import { soundController } from '../../../utils/soundController';

interface LetterRevealDialogProps {
  state: Round4IntroState;
  onBeginHunt: () => void;
  isMuted: boolean;
}

export const LetterRevealDialog: React.FC<LetterRevealDialogProps> = ({
  state,
  onBeginHunt,
  isMuted,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpening = state === 'LETTER_OPENING';
  const isRevealed = state === 'LETTER_REVEALED' || state === 'LETTER_OPENED';
  const isTransitioning =
    state === 'HUNT_REQUESTED' ||
    state === 'OUTGOING_BLUR' ||
    state === 'INCOMING_COLLEGE_REVEAL' ||
    state === 'COLLEGE_REVEAL' ||
    state === 'COLLEGE_READY' ||
    state === 'PORTAL_IGNITION' ||
    state === 'SCENE_CONTRACTING' ||
    state === 'PARTICLES_FORMING' ||
    state === 'WHITE_TUNNEL';

  if (!isOpening && !isRevealed && !isTransitioning) {
    return null;
  }

  const handleBeginHuntClick = () => {
    if (isSubmitting || isTransitioning) return;
    setIsSubmitting(true);
    if (!isMuted) {
      soundController.playClick();
      soundController.playPortalWhoosh();
    }
    onBeginHunt();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="letter-heading"
      className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none"
    >
      {/* 1. Backdrop Vignette with Soft Golden Radiance */}
      <div
        className={`fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-700 ${
          isOpening ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* 2. Perfectly Centered, Aspect-Locked Antique Parchment Scroll */}
      <div
        className={`relative transition-all duration-700 ease-out drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)] ${
          isOpening
            ? 'scale-75 opacity-0 -rotate-1'
            : isTransitioning
            ? 'scale-105 filter brightness-125 transition-transform duration-1000'
            : 'scale-100 opacity-100 rotate-0'
        }`}
        style={{
          width: 'min(560px, calc(78vh * 896 / 1200), 90vw)',
          aspectRatio: '896 / 1200',
          backgroundImage: "url('/assets/round-4/ancient_parchment_clean.png?v=2')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        {/* Printable Scroll Content - Strictly confined inside parchment edges */}
        <div className="w-full h-full pt-[15%] pb-[12%] px-[13%] sm:px-[14%] flex flex-col justify-between items-center text-center">
          
          {/* Header Section: Antique Compass Medallion & Title */}
          <div className="w-full flex flex-col items-center flex-shrink-0">
            {/* Top Ornamental Antique Compass Medallion */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-[#dfb76c] via-[#b88c42] to-[#6d4d1e] p-[1.5px] shadow-[0_3px_10px_rgba(0,0,0,0.6)] flex items-center justify-center mb-1">
              <div className="w-full h-full rounded-full bg-[#2a1b0c] flex items-center justify-center border border-[#efc87b]/60">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-[#eec77d] filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] animate-spin [animation-duration:60s]"
                  viewBox="0 0 100 100"
                >
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <polygon points="50,14 55,45 86,50 55,55 50,86 45,55 14,50 45,45" fill="currentColor" opacity="0.9" />
                  <circle cx="50" cy="50" r="6" fill="#fef0cd" />
                </svg>
              </div>
            </div>

            {/* Regal Antique Manuscript Heading (Single Line, NO leaf emojis) */}
            <h2
              id="letter-heading"
              className="font-manuscript text-[clamp(16px,2.2vw,24px)] font-bold tracking-[0.14em] text-[#2c1a0e] drop-shadow-[0_1px_1px_rgba(255,255,255,0.45)] uppercase leading-tight whitespace-nowrap"
            >
              THE DAWN AWAKENS
            </h2>

            {/* Subtle Antique Diamond Divider */}
            <div className="flex items-center justify-center gap-2 my-1 opacity-70">
              <div className="w-10 sm:w-14 h-px bg-gradient-to-r from-transparent to-[#8a5d24]" />
              <span className="text-[10px] text-[#8a5d24]">❖</span>
              <div className="w-10 sm:w-14 h-px bg-gradient-to-l from-transparent to-[#8a5d24]" />
            </div>
          </div>

          {/* Storyline Narrative Body - Perfectly fitted with elegant manuscript font */}
          <div className="w-full flex-1 flex flex-col justify-center font-garamond text-[clamp(11.5px,1.4vw,14.5px)] leading-[1.38] sm:leading-[1.45] text-[#342010] space-y-1.5 sm:space-y-2 px-1">
            <p className="font-semibold text-[#271507]">
              The darkness has finally faded.
            </p>
            <p>
              Beyond the graveyard, a new dawn awaits. Hidden within the walls of your own college lies a forgotten treasure — a relic of knowledge, mystery and unimaginable value.
            </p>
            <p>
              Explore the floors, uncover the scattered clues, and follow the ancient trail to discover the Golden Relic.
            </p>
            <p className="font-semibold italic text-[#291608] pt-0.5">
              Your next journey begins where your own story was written.
            </p>
          </div>

          {/* Bottom Section: Redesigned Antique Relic Plaque Button */}
          <div className="w-full flex-shrink-0 pt-1.5 sm:pt-2 flex flex-col items-center">
            <button
              type="button"
              onClick={handleBeginHuntClick}
              disabled={isSubmitting || isTransitioning}
              aria-label="Begin the hunt through time and space"
              className={`group relative px-6 sm:px-8 py-2 rounded-lg font-cinzel text-[clamp(10.5px,1.2vw,13px)] font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,235,160,0.4)] cursor-pointer select-none ${
                isTransitioning
                  ? 'opacity-80 scale-95 pointer-events-none bg-amber-900 border-amber-600'
                  : 'bg-gradient-to-b from-[#2e1c0e] via-[#211409] to-[#140b04] text-[#fce5a3] hover:text-white border-2 border-[#d4af37] hover:border-[#ffe082] hover:scale-105 active:scale-95 hover:shadow-[0_0_24px_rgba(245,190,60,0.65),inset_0_1px_2px_rgba(255,240,180,0.6)]'
              }`}
            >
              {/* Inner Decorative Plaque Frame Accent */}
              <div className="relative flex items-center justify-center gap-2">
                <span className="text-[#dfb158] text-[9px] transition-transform group-hover:rotate-45">✦</span>
                <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">BEGIN THE HUNT</span>
                <span className="text-[#dfb158] text-[9px] transition-transform group-hover:-rotate-45">✦</span>
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
