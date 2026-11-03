import React from 'react';
import type { TargetItem } from '../../../types/round1.types';
import { RelicIcon } from './RelicIcon';

interface RelicChecklistBarProps {
  targets: TargetItem[];
  foundIds: string[];
}

export const RelicChecklistBar: React.FC<RelicChecklistBarProps> = ({ targets, foundIds }) => {
  const total = targets.length;
  const count = foundIds.length;

  return (
    <section
      aria-label="Cursed Relics Checklist"
      className="relative z-20 w-full max-w-[1400px] mx-auto mb-2 sm:mb-3 px-2 sm:px-4"
    >
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0d0703]/95 via-[#1a0e05]/95 to-[#0d0703]/95 border-2 border-amber-600/40 p-2 sm:p-2.5 shadow-[0_4px_30px_rgba(0,0,0,0.85)] backdrop-blur-md overflow-hidden">
        {/* Subtle Ornamental Top Gold Border Line */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none"
        />

        {/* Hidden screen-reader text for accessibility and test suites */}
        <div className="sr-only">
          OBJECTS DISCOVERED: {count} / {total}
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-2 sm:gap-3">
          {/* 1. Left Beveled Gold Progress Plaque */}
          <div className="flex-shrink-0 flex items-center justify-center px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-b from-[#2a1306] via-[#150802] to-[#0a0301] border border-amber-500/80 shadow-[inset_0_1px_8px_rgba(245,158,11,0.3)]">
            <span className="font-cinzel text-xs sm:text-sm font-black tracking-[0.2em] text-amber-300 drop-shadow-[0_1px_6px_rgba(245,158,11,0.7)]">
              {count} / {total} FOUND
            </span>
          </div>

          {/* 2. 12 Horizontal Target Relic Cards */}
          <div className="w-full flex-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-amber-700/40">
            <div className="flex items-center justify-between min-w-[780px] sm:min-w-0 gap-1.5 sm:gap-2">
              {targets.map((tgt) => {
                const isFound = foundIds.includes(tgt.id);
                return (
                  <div
                    key={tgt.id}
                    title={isFound ? `${tgt.name} (Discovered)` : `${tgt.name} (Hidden in the shadows)`}
                    className={`flex-1 min-w-[58px] sm:min-w-[70px] py-1 sm:py-1.5 px-1 rounded-lg border transition-all duration-300 flex flex-col items-center justify-center text-center select-none ${
                      isFound
                        ? 'bg-gradient-to-b from-emerald-950/70 to-emerald-900/40 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                        : 'bg-stone-950/60 border-stone-800/80 hover:border-amber-700/50'
                    }`}
                  >
                    {/* Relic Silhouette Icon */}
                    <div className="relative mb-0.5 sm:mb-1">
                      <RelicIcon relicId={tgt.id} className="w-4 h-4 sm:w-5 sm:h-5 transition-transform" isFound={isFound} />
                      {isFound && (
                        <span
                          aria-hidden="true"
                          className="absolute -top-1 -right-1 text-[8px] sm:text-[9px] text-emerald-300 font-bold"
                        >
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Relic Title */}
                    <span
                      className={`text-[8.5px] sm:text-[10px] font-cinzel font-bold tracking-wider uppercase leading-tight line-clamp-1 ${
                        isFound ? 'text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'text-stone-300'
                      }`}
                    >
                      {tgt.name}
                    </span>

                    {/* Status Pill */}
                    <span
                      className={`text-[7px] sm:text-[8px] font-mono tracking-widest uppercase mt-0.5 ${
                        isFound ? 'text-emerald-400 font-semibold' : 'text-stone-500'
                      }`}
                    >
                      {isFound ? 'FOUND' : 'HIDDEN'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

