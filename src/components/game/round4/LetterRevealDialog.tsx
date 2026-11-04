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
  const isRevealed = state === 'LETTER_REVEALED';
  const isTransitioning =
    state === 'PORTAL_IGNITION' ||
    state === 'SCENE_CONTRACTING' ||
    state === 'PARTICLES_FORMING' ||
    state === 'WHITE_TUNNEL' ||
    state === 'COLLEGE_REVEAL';

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
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-y-auto"
    >
      {/* 1. Backdrop Vignette with Soft Golden Radiance */}
      <div
        className={`fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-700 ${
          isOpening ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* 2. Main Ancient Parchment Container */}
      <div
        className={`relative w-full max-w-3xl sm:max-w-4xl transition-all duration-700 ease-out flex items-center justify-center ${
          isOpening
            ? 'scale-75 opacity-0 -rotate-1'
            : isTransitioning
            ? 'scale-100 filter brightness-125 transition-transform duration-1000'
            : 'scale-100 opacity-100 rotate-0'
        }`}
      >
        {/* Clean, Watermark-Free High-Res Antique Parchment Asset with Burnt Edges */}
        <div className="relative w-full drop-shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
          <img
            src="/assets/round-4/ancient_parchment_clean.png"
            alt="Antique parchment manuscript"
            className="w-full h-auto max-h-[88vh] object-contain mx-auto filter contrast-105"
          />

          {/* HTML Overlay Content positioned with high fidelity over the parchment scroll */}
          <div className="absolute inset-0 flex flex-col items-center justify-between py-8 sm:py-12 md:py-16 px-8 sm:px-16 md:px-24 text-center select-none">
            {/* Top Center Antique Compass Medallion */}
            <div className="absolute top-2 sm:top-5 left-1/2 -translate-x-1/2 w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-gradient-to-b from-[#dfb76c] via-[#b88c42] to-[#6d4d1e] p-[2px] shadow-[0_6px_20px_rgba(0,0,0,0.6)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#2a1b0c] flex items-center justify-center border border-[#efc87b]/60">
                <svg
                  className="w-7 sm:w-9 h-7 sm:h-9 text-[#eec77d] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-spin [animation-duration:60s]"
                  viewBox="0 0 100 100"
                >
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <polygon points="50,14 55,45 86,50 55,55 50,86 45,55 14,50 45,45" fill="currentColor" opacity="0.9" />
                  <circle cx="50" cy="50" r="6" fill="#fef0cd" />
                </svg>
              </div>
            </div>

            {/* Left Hanging Crimson Silk Banner with Star & FC */}
            <div className="hidden sm:block absolute top-4 sm:top-6 left-8 sm:left-14 w-11 sm:w-14 h-24 sm:h-32 bg-gradient-to-b from-[#8f1515] via-[#a82222] to-[#690d0d] shadow-[0_6px_14px_rgba(0,0,0,0.5)] border-x border-[#c99a4c] rounded-b-lg">
              <div className="w-full h-full flex flex-col items-center justify-between py-2 sm:py-3">
                <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#fed582] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]" viewBox="0 0 100 100">
                  <polygon points="50,15 54,42 81,50 54,58 50,85 46,58 19,50 46,42" fill="currentColor" />
                  <circle cx="50" cy="50" r="14" fill="none" stroke="#fed582" strokeWidth="3" />
                </svg>
                <div className="w-0.5 h-4 sm:h-6 bg-[#fed582]/40" />
                <span className="font-cinzel text-[8px] sm:text-[9px] font-bold text-[#fed582] tracking-widest uppercase">FC</span>
              </div>
            </div>

            {/* Main Letter Header with Olive Branches */}
            <div className="mt-4 sm:mt-6 w-full flex flex-col items-center">
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                <span className="text-[#8c6729] text-base sm:text-2xl opacity-90" aria-hidden="true">
                  🌿
                </span>
                <h2
                  id="letter-heading"
                  className="font-cinzel text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-[0.2em] text-[#331f0e] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] uppercase"
                >
                  THE DAWN AWAKENS
                </h2>
                <span className="text-[#8c6729] text-base sm:text-2xl opacity-90" aria-hidden="true">
                  🌿
                </span>
              </div>

              {/* Ornamental Divider Diamond */}
              <div className="flex items-center gap-2 mb-4 sm:mb-6 opacity-75">
                <div className="w-12 sm:w-20 h-px bg-gradient-to-r from-transparent to-[#8a5d24]" />
                <span className="text-xs text-[#8a5d24]">❖</span>
                <div className="w-12 sm:w-20 h-px bg-gradient-to-l from-transparent to-[#8a5d24]" />
              </div>
            </div>

            {/* Exact Verbatim Storyline Text */}
            <div className="max-w-xl md:max-w-2xl font-serif text-xs sm:text-sm md:text-base leading-relaxed text-[#352110] space-y-3 sm:space-y-4 px-2 sm:px-6">
              <p className="font-medium text-[#2a1708]">
                The darkness has finally faded.
              </p>
              <p>
                Beyond the graveyard, a new dawn awaits. Hidden within the walls of your own college lies a forgotten treasure — a relic of knowledge, mystery and unimaginable value.
              </p>
              <p>
                Explore the floors, uncover the scattered clues, and follow the ancient trail to discover the Golden Relic.
              </p>
              <p className="font-semibold italic text-[#4a2e16] pt-1">
                Your next journey begins where your own story was written.
              </p>
            </div>

            {/* Bottom Section: Watermarks, 3D Wax Seal, and Plaque Button */}
            <div className="w-full relative mt-4 sm:mt-6 flex flex-col items-center">
              {/* Antique Compass Watermark (Lower-Left) */}
              <div className="hidden sm:block absolute left-2 md:left-6 -bottom-2 w-20 md:w-28 h-20 md:h-28 opacity-25 pointer-events-none select-none">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#6b471d]">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                  <polygon points="50,10 55,45 90,50 55,55 50,90 45,55 10,50 45,45" fill="currentColor" />
                </svg>
              </div>

              {/* 3D Crimson Wax Skull Seal (Lower-Right) */}
              <div className="absolute right-2 md:right-8 -bottom-3 sm:-bottom-4 w-14 sm:w-18 h-14 sm:h-18 flex items-center justify-center select-none pointer-events-none">
                <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-gradient-to-br from-[#b81d1d] via-[#850e0e] to-[#450707] shadow-[0_6px_16px_rgba(0,0,0,0.6)] border-2 border-[#de4040]/40 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
                  <span className="text-lg sm:text-2xl opacity-90 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
                    💀
                  </span>
                </div>
              </div>

              {/* The Single Prominent 'BEGIN THE HUNT' Button */}
              <button
                type="button"
                onClick={handleBeginHuntClick}
                disabled={isSubmitting || isTransitioning}
                aria-label="Begin the hunt through time and space"
                className={`relative px-8 sm:px-12 py-3 sm:py-3.5 rounded-xl font-cinzel text-xs sm:text-sm md:text-base font-black tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.45)] cursor-pointer select-none ${
                  isTransitioning
                    ? 'opacity-80 scale-95 pointer-events-none bg-amber-900 border-amber-600'
                    : 'bg-gradient-to-b from-[#2a1a0b] via-[#1f1307] to-[#120a03] text-[#ffe29a] hover:text-white border-2 border-[#dfb158] hover:border-[#ffd67a] hover:scale-105 active:scale-95 hover:shadow-[0_0_35px_rgba(245,185,80,0.6)]'
                }`}
              >
                <div className="relative flex items-center gap-3">
                  <span className="text-[#dfb158] text-xs">✦</span>
                  <span>BEGIN THE HUNT</span>
                  <span className="text-[#dfb158] text-xs">✦</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
