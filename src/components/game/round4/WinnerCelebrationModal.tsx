import React, { useEffect, useState } from 'react';
import type { WinnerRecord } from '../../../types/round4Expedition.types';

interface WinnerCelebrationModalProps {
  winner: WinnerRecord;
  routeRomanNumeral?: string;
  onExit: () => void;
}

export const WinnerCelebrationModal: React.FC<WinnerCelebrationModalProps> = ({
  winner,
  routeRomanNumeral = 'I',
  onExit,
}) => {
  const [revealedStep, setRevealedStep] = useState(0);

  useEffect(() => {
    // Progressive line-by-line reveal animation
    const t1 = setTimeout(() => setRevealedStep(1), 600);
    const t2 = setTimeout(() => setRevealedStep(2), 1600);
    const t3 = setTimeout(() => setRevealedStep(3), 2800);
    const t4 = setTimeout(() => setRevealedStep(4), 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Championship Victory Announcement"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto"
    >
      {/* Golden Particle Canvas & Glowing Halo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/20 via-yellow-400/25 to-amber-600/10 rounded-full blur-3xl animate-pulse" />
        {/* Floating Confetti Sparks */}
        <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
          <div className="absolute top-10 left-1/4 w-3 h-3 bg-yellow-300 rounded-sm rotate-12 animate-bounce" />
          <div className="absolute top-20 right-1/4 w-2 h-4 bg-amber-400 rounded-sm rotate-45 animate-pulse" />
          <div className="absolute bottom-24 left-1/3 w-3 h-2 bg-yellow-200 rounded-sm -rotate-12 animate-bounce" />
          <div className="absolute top-1/3 right-1/6 w-2 h-3 bg-amber-300 rounded-sm rotate-60 animate-pulse" />
          <div className="absolute bottom-1/3 left-1/5 w-3 h-3 bg-yellow-400 rounded-sm rotate-30 animate-pulse" />
        </div>
      </div>

      {/* Antique Parchment Relic Chamber Frame */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#241a0d] via-[#16120b] to-[#0d0a07] border-2 border-amber-500/60 rounded-2xl p-6 sm:p-10 shadow-[0_0_80px_rgba(245,158,11,0.35)] text-center text-[#f4ecd8] font-serif transition-all duration-700">
        {/* Ornamental Header Motif */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="h-[1px] w-16 bg-gradient-to-r from-transparent via-amber-400 to-amber-200" />
          <span className="text-2xl text-amber-400 animate-spin-slow">✦</span>
          <span className="h-[1px] w-16 bg-gradient-to-l from-transparent via-amber-400 to-amber-200" />
        </div>

        {/* Crown Emblem */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-b from-amber-400/30 to-amber-900/40 border border-amber-400/60 text-3xl mb-3 shadow-[0_0_25px_rgba(251,191,36,0.5)]">
          👑
        </div>

        {/* Step 1: Main Heading */}
        <div className={`transition-all duration-700 ${revealedStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-xs uppercase tracking-[0.3em] text-amber-400 font-bold mb-1">
            FROST CARTEL • THE RADIANT TREASURE HUNT
          </div>
          <h1 className="text-2xl sm:text-4xl font-cinzel font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 tracking-wider mb-4 drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]">
            THE RELIC HAS BEEN CLAIMED
          </h1>
        </div>

        {/* Step 2: Story Excerpt */}
        <div className={`transition-all duration-700 delay-100 ${revealedStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="p-4 rounded-xl bg-black/40 border border-amber-500/20 text-xs sm:text-sm text-[#e8dcb9]/90 italic leading-relaxed mb-6">
            <p className="mb-2">
              “Seven paths were forged. Seven teams answered the call. Through forgotten corridors, hidden chambers and ancient mysteries, each team followed a trail of secrets.”
            </p>
            <p>
              “But only one reached the final chamber before the others. They deciphered the final message. They uncovered the last secret. And at last, the forgotten treasure was theirs.”
            </p>
          </div>
        </div>

        {/* Step 3: Champion Spotlight */}
        <div className={`transition-all duration-700 delay-200 ${revealedStep >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="py-4 px-6 rounded-xl bg-gradient-to-r from-amber-950/60 via-amber-800/40 to-amber-950/60 border border-amber-400/50 mb-6 shadow-inner">
            <div className="text-xs uppercase tracking-[0.25em] text-amber-300 font-bold">
              CONGRATULATIONS!
            </div>
            <div className="text-2xl sm:text-4xl font-cinzel font-black text-amber-100 my-1 tracking-wide">
              TEAM {winner.teamName.toUpperCase()}
            </div>
            <div className="text-sm font-cinzel text-amber-300 font-bold tracking-widest uppercase">
              CHAMPIONS
            </div>
            <div className="text-[11px] font-sans text-amber-200/80 tracking-wider uppercase mt-1">
              WINNERS OF THE RADIANT TREASURE HUNT • ROUTE {routeRomanNumeral}
            </div>
          </div>
        </div>

        {/* Step 4: Closing Story & Call to Action */}
        <div className={`transition-all duration-700 delay-300 ${revealedStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-xs sm:text-sm text-[#e8dcb9]/80 mb-3 leading-relaxed">
            “The journey from darkness to light is complete. The mystery has been solved. The Golden Relic belongs to you. Your name shall remain etched in the chronicles of Frost Cartel.”
          </p>
          <div className="text-xs uppercase tracking-[0.2em] text-amber-400 font-cinzel font-bold mb-6">
            THE END — THE LEGACY BEGINS.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={onExit}
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-black font-cinzel font-black text-sm tracking-widest uppercase shadow-[0_0_30px_rgba(245,158,11,0.6)] cursor-pointer transition-all duration-200 transform hover:scale-105"
            >
              Enter The Hall of Fame
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

