import React from 'react';
import type { WinnerRecord } from '../../../types/round4Expedition.types';
import { soundController } from '../../../utils/soundController';

interface NonWinnerModalProps {
  mySolvedCount: number;
  myRouteRomanNumeral: string;
  winner?: WinnerRecord | null;
  onExit: () => void;
}

export const NonWinnerModal: React.FC<NonWinnerModalProps> = ({
  mySolvedCount,
  myRouteRomanNumeral,
  winner,
  onExit,
}) => {
  const handleExit = () => {
    try {
      soundController.playClick();
    } catch {
      // AudioContext policy
    }
    if (typeof window !== 'undefined') {
      window.location.hash = '#/leaderboard';
    }
    onExit();
  };

  const winningTeam = winner?.teamName?.trim().toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tournament Finished Notice"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md select-none animate-fadeIn"
    >
      <div className="relative max-w-xl w-full rounded-2xl border-2 border-amber-600/50 bg-gradient-to-b from-[#1c120c] via-[#100a06] to-black p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden">
        {/* Subtle decorative gold corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-amber-500/10 to-transparent pointer-events-none" />

        {/* Cartel Emblem & Header */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 rounded-full bg-black/80 border-2 border-amber-500/60 p-2.5 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center">
            <img
              src="/assets/cartel_skull_crossbones_gold.png"
              alt="Frost Cartel Sigil"
              className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]"
            />
          </div>

          <span className="font-cinzel text-[11px] sm:text-xs font-bold tracking-[0.3em] text-amber-400 uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            ROUND 04 • THE CAMPUS EXPEDITION
          </span>

          <h2 className="mt-1 font-gothic text-2xl sm:text-3xl md:text-4xl font-bold text-stone-100 tracking-wide uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            THE HUNT HAS BEEN CONCLUDED
          </h2>

          <div className="my-4 h-px w-36 bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" />

          {/* Winner announcement or completion status */}
          {winningTeam ? (
            <div className="w-full p-4 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200 mb-4 shadow-inner">
              <span className="text-[10px] font-cinzel tracking-widest text-amber-400/90 uppercase block font-semibold">
                CHAMPION SQUAD DECLARED
              </span>
              <div className="mt-1 font-cinzel text-lg sm:text-xl font-black text-amber-100 tracking-wider">
                👑 {winningTeam}
              </div>
              <p className="mt-1 text-xs font-sans text-amber-200/80">
                The Golden Relic has been discovered and claimed. The expedition race is officially sealed!
              </p>
            </div>
          ) : (
            <div className="w-full p-4 rounded-xl border border-stone-700/60 bg-stone-900/40 text-stone-300 mb-4 shadow-inner">
              <span className="text-[10px] font-cinzel tracking-widest text-amber-400/90 uppercase block font-semibold">
                EXPEDITION NOTICE
              </span>
              <p className="mt-1 text-xs font-sans text-stone-200">
                The final expedition objectives have been sealed. All campus sectors are now closed.
              </p>
            </div>
          )}

          {/* Team's own route & progress summary */}
          <div className="w-full p-3 sm:p-4 rounded-xl border border-stone-800 bg-black/60 flex items-center justify-around gap-2 text-center mb-6">
            <div>
              <span className="text-[9px] font-cinzel text-stone-400 uppercase tracking-widest block">Assigned Sector</span>
              <span className="text-sm sm:text-base font-cinzel font-bold text-amber-300">Route {myRouteRomanNumeral}</span>
            </div>
            <div className="h-8 w-px bg-stone-800" />
            <div>
              <span className="text-[9px] font-cinzel text-stone-400 uppercase tracking-widest block">Clues Solved</span>
              <span className="text-sm sm:text-base font-mono font-bold text-amber-300">{mySolvedCount} / 5</span>
            </div>
            <div className="h-8 w-px bg-stone-800" />
            <div>
              <span className="text-[9px] font-cinzel text-stone-400 uppercase tracking-widest block">Tournament Status</span>
              <span className="text-xs sm:text-sm font-cinzel font-bold text-emerald-400">RECORDED</span>
            </div>
          </div>

          <p className="text-xs text-stone-400 font-sans italic max-w-md mx-auto mb-6">
            The Cartel thanks all operative squads for their grit and tenacity throughout the tournament.
          </p>

          {/* Action button */}
          <button
            type="button"
            onClick={handleExit}
            aria-label={`Return to Exterior from route ${myRouteRomanNumeral}, ${mySolvedCount} clues completed`}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-cinzel text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer"
          >
            VIEW FINAL STANDINGS
          </button>
        </div>
      </div>
    </div>
  );
};
