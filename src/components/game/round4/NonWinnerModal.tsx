import React from 'react';
import type { WinnerRecord } from '../../../types/round4Expedition.types';

interface NonWinnerModalProps {
  winner: WinnerRecord;
  mySolvedCount: number;
  myRouteRomanNumeral: string;
  onExit: () => void;
}

export const NonWinnerModal: React.FC<NonWinnerModalProps> = ({
  winner,
  mySolvedCount,
  myRouteRomanNumeral,
  onExit,
}) => {
  const formattedTime = winner.solvedAt
    ? new Date(winner.solvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Recently';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tournament Finished Notice"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#1c1813] to-[#0c0a08] border border-amber-600/40 rounded-2xl p-6 sm:p-8 shadow-2xl text-center text-[#e8dcb9] font-serif">
        {/* Subtle Antique Icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-2xl text-amber-400">
          📜
        </div>

        <div className="text-xs uppercase tracking-[0.25em] text-amber-500/90 font-bold mb-1">
          FROST CARTEL • EXPEDITION CONCLUDED
        </div>

        <h2 className="text-xl sm:text-3xl font-cinzel font-black text-amber-200 tracking-wide mb-4">
          THE TREASURE HAS BEEN CLAIMED
        </h2>

        <div className="p-4 rounded-xl bg-black/50 border border-white/10 text-xs sm:text-sm text-[#d4c6a0] italic leading-relaxed mb-6">
          <p>
            “Your path was completed. The clues were uncovered and the final chamber was reached, but another team claimed the Golden Relic first.
            The journey was not without meaning. Every mystery you solved became part of the legend of Frost Cartel.”
          </p>
        </div>

        {/* Winner Summary Card */}
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 mb-6 text-left">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-amber-400/80 uppercase font-sans font-semibold">Champions:</span>
            <span className="font-cinzel text-amber-200 font-bold text-sm">TEAM {winner.teamName.toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-amber-400/80 uppercase font-sans font-semibold">Victory Recorded:</span>
            <span className="font-mono text-amber-300 text-xs">{formattedTime}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
            <span className="text-amber-400/80 uppercase font-sans font-semibold">Your Squad Route:</span>
            <span className="text-white font-cinzel font-bold">ROUTE {myRouteRomanNumeral} • {mySolvedCount} / 5 Clues Completed</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="px-6 py-2.5 rounded-lg bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/50 text-amber-200 hover:text-white font-cinzel text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Return to Exterior
        </button>
      </div>
    </div>
  );
};
