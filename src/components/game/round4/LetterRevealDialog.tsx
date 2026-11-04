import React from 'react';
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
  const isOpening = state === 'LETTER_OPENING';
  const isRevealed = state === 'LETTER_REVEALED';
  const isTransitioning =
    state === 'PORTAL_IGNITION' ||
    state === 'SCREEN_CONTRACTION' ||
    state === 'PARTICLE_FRAGMENTATION' ||
    state === 'WHITE_PORTAL' ||
    state === 'TUNNEL_TRAVEL' ||
    state === 'COLLEGE_REVEAL';

  if (!isOpening && !isRevealed && !isTransitioning) {
    return null;
  }

  const handleBeginHuntClick = () => {
    if (isTransitioning) return;
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
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-700 ${
          isOpening ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* 2. Main Ancient Parchment Scroll Container */}
      <div
        className={`relative w-full max-w-4xl bg-[#f5ebd2] text-[#2c1d11] rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_40px_rgba(235,185,90,0.35)] border-4 border-[#b88c42] p-6 sm:p-8 lg:p-10 transition-all duration-700 ease-out ${
          isOpening
            ? 'scale-75 opacity-0 rotate-1'
            : isTransitioning
            ? 'scale-100 filter brightness-125 transition-transform duration-1000'
            : 'scale-100 opacity-100 rotate-0'
        }`}
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, rgba(230,205,160,0.45) 75%, rgba(185,150,95,0.7) 100%),
            repeating-linear-gradient(45deg, rgba(160,115,50,0.03) 0px, rgba(160,115,50,0.03) 2px, transparent 2px, transparent 6px)
          `,
          boxShadow: 'inset 0 0 45px rgba(120,80,30,0.35), 0 20px 50px rgba(0,0,0,0.75)',
        }}
      >
        {/* Antique Gold Filigree Corner Accents */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#b88c42]/80 pointer-events-none" />
        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#b88c42]/80 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#b88c42]/80 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#b88c42]/80 pointer-events-none" />

        {/* 3. Top Center Antique Compass Medallion */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-gradient-to-b from-[#dfb76c] via-[#b88c42] to-[#6d4d1e] p-[2px] shadow-[0_6px_20px_rgba(0,0,0,0.6)] flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-[#2a1b0c] flex items-center justify-center border border-[#efc87b]/60">
            <svg className="w-8 h-8 text-[#eec77d] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-spin [animation-duration:60s]" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <polygon points="50,14 55,45 86,50 55,55 50,86 45,55 14,50 45,45" fill="currentColor" opacity="0.9" />
              <circle cx="50" cy="50" r="6" fill="#fef0cd" />
            </svg>
          </div>
        </div>

        {/* 4. Left Hanging Crimson Silk Banner */}
        <div className="hidden sm:block absolute top-0 left-6 sm:left-8 w-12 sm:w-14 h-28 sm:h-36 bg-gradient-to-b from-[#8f1515] via-[#a82222] to-[#690d0d] shadow-[0_6px_14px_rgba(0,0,0,0.5)] border-x border-[#c99a4c] rounded-b-lg">
          <div className="w-full h-full flex flex-col items-center justify-between py-3">
            <svg className="w-6 h-6 text-[#fed582] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]" viewBox="0 0 100 100">
              <polygon points="50,15 54,42 81,50 54,58 50,85 46,58 19,50 46,42" fill="currentColor" />
              <circle cx="50" cy="50" r="14" fill="none" stroke="#fed582" strokeWidth="3" />
            </svg>
            <div className="w-0.5 h-6 bg-[#fed582]/40" />
            <span className="font-cinzel text-[9px] font-bold text-[#fed582] tracking-widest uppercase">FC</span>
          </div>
          {/* Banner swallowtail bottom cut */}
          <div className="absolute -bottom-3 left-0 right-0 h-3 bg-gradient-to-r from-transparent via-[#690d0d] to-transparent clip-path-v" />
        </div>

        {/* 5. Letter Content Area */}
        <div className="sm:pl-16 sm:pr-8 py-2 flex flex-col items-center text-center">
          {/* Heading with Laurel Ornaments */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <span className="text-[#a47b35] text-lg sm:text-2xl opacity-80" aria-hidden="true">
              🌿
            </span>
            <h2
              id="letter-heading"
              className="font-cinzel text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[0.18em] text-[#3b2410] drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)] uppercase"
            >
              THE DAWN AWAKENS
            </h2>
            <span className="text-[#a47b35] text-lg sm:text-2xl opacity-80" aria-hidden="true">
              🌿
            </span>
          </div>

          {/* Ornamental Divider */}
          <div className="flex items-center gap-2 mb-5 sm:mb-6 opacity-75">
            <div className="w-12 sm:w-20 h-px bg-gradient-to-r from-transparent to-[#8a5d24]" />
            <span className="text-xs text-[#8a5d24]">❖</span>
            <div className="w-12 sm:w-20 h-px bg-gradient-to-l from-transparent to-[#8a5d24]" />
          </div>

          {/* Exact Storyline Body Paragraphs */}
          <div className="max-w-2xl font-serif text-sm sm:text-base lg:text-[17px] leading-relaxed text-[#3a2717] space-y-4 px-2 sm:px-4">
            <p className="font-medium text-[#2f1f12]">
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

          {/* 6. Decorative Watermarks & Bottom Relics */}
          <div className="w-full relative mt-8 sm:mt-10 flex flex-col items-center">
            {/* Background Compass Watermark (Left) */}
            <div className="absolute left-2 -bottom-2 w-24 sm:w-32 h-24 sm:h-32 opacity-20 pointer-events-none select-none">
              <svg viewBox="0 0 100 100" className="w-full h-full text-[#6b471d]">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                <polygon points="50,10 55,45 90,50 55,55 50,90 45,55 10,50 45,45" fill="currentColor" />
              </svg>
            </div>

            {/* 7. Crimson Wax Seal with Skull Sigil (Bottom Right) */}
            <div className="absolute right-0 sm:right-2 -bottom-4 sm:-bottom-6 w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center select-none pointer-events-none">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-gradient-to-br from-[#b81d1d] via-[#850e0e] to-[#450707] shadow-[0_6px_16px_rgba(0,0,0,0.6)] border-2 border-[#de4040]/40 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
                <span className="text-xl sm:text-2xl opacity-90 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
                  💀
                </span>
              </div>
            </div>

            {/* 8. The Prominent 'BEGIN THE HUNT' Button */}
            <button
              type="button"
              onClick={handleBeginHuntClick}
              disabled={isTransitioning}
              aria-label="Begin the hunt through time and space"
              className={`relative px-8 sm:px-12 py-3.5 sm:py-4 rounded-xl font-cinzel text-sm sm:text-base lg:text-lg font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.45)] cursor-pointer select-none ${
                isTransitioning
                  ? 'opacity-80 scale-95 pointer-events-none bg-amber-900 border-amber-600'
                  : 'bg-gradient-to-b from-[#2a1a0b] via-[#1f1307] to-[#120a03] text-[#ffe29a] hover:text-white border-2 border-[#dfb158] hover:border-[#ffd67a] hover:scale-105 active:scale-95 hover:shadow-[0_0_35px_rgba(245,185,80,0.6)]'
              }`}
            >
              {/* Inner Golden Glow Ring */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0 opacity-0 hover:opacity-100 transition-opacity duration-300" />
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
  );
};
