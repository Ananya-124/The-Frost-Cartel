import React from 'react';
import type { TargetItem } from '../../../types/round1.types';
import { RelicIcon } from './RelicIcon';
import { normalizeTargetId } from './stage2TargetsConfig';

interface RelicChecklistBarProps {
  targets: TargetItem[];
  foundIds: string[];
}

export const RelicChecklistBar: React.FC<RelicChecklistBarProps> = ({ targets, foundIds }) => {
  const total = targets.length;
  // Normalize found IDs set for fast lookup
  const normalizedFoundSet = new Set(foundIds.map(normalizeTargetId));
  const count = targets.filter(
    (t) => normalizedFoundSet.has(normalizeTargetId(t.id)) || foundIds.includes(t.id)
  ).length;

  return (
    <section
      aria-label="Cursed Relics Checklist"
      className="relative z-20 w-full max-w-[1440px] mx-auto mb-1 sm:mb-1.5 px-2 sm:px-4 shrink-0"
    >
      {/* Gothic Occult Reliquary Band */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0d0704]/98 via-[#180d07]/98 to-[#0d0704]/98 border-2 border-[#8b4513]/60 p-1.5 sm:p-2 shadow-[0_12px_40px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(245,158,11,0.25)] backdrop-blur-md overflow-hidden">
        {/* Antique Gold/Crimson Top Filigree Line */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#dc2626]/70 via-[#f59e0b]/80 to-transparent pointer-events-none"
        />

        {/* Hidden screen-reader text for accessibility and test suites */}
        <div className="sr-only">
          OBJECTS DISCOVERED: {count} / {total}
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-1.5 sm:gap-2">
          {/* Left: Antiqued Brass Talisman Counter Plaque */}
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-b from-[#220d04] via-[#140602] to-[#080201] border border-amber-600/70 shadow-[inset_0_1px_6px_rgba(245,158,11,0.3),0_4px_12px_rgba(0,0,0,0.85)]">
            {/* Pulsing Occult Blood Ruby */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-br from-red-500 to-amber-600 border border-amber-300 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
            </span>
            <div className="flex flex-col">
              <span className="text-[8.5px] font-mono tracking-widest text-amber-500/90 uppercase font-bold">
                CURSED RELICS
              </span>
              <span className="font-cinzel text-xs sm:text-sm font-black tracking-[0.2em] text-amber-200 drop-shadow-[0_1px_8px_rgba(245,158,11,0.8)]">
                {count} / {total} FOUND
              </span>
            </div>
          </div>

          {/* Right: 12 Antique Occult Relic Talismans */}
          <div className="w-full flex-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-amber-800/40">
            <div className="flex items-center justify-between min-w-[780px] sm:min-w-0 gap-1.5 sm:gap-2 px-1">
              {targets.map((tgt) => {
                const isFound =
                  normalizedFoundSet.has(normalizeTargetId(tgt.id)) || foundIds.includes(tgt.id);
                return (
                  <div
                    key={tgt.id}
                    title={isFound ? `${tgt.name} (Banished)` : `${tgt.name} (Hidden in the shadows)`}
                    className={`group relative flex-1 min-w-[52px] sm:min-w-[60px] py-0.5 px-0.5 sm:py-1 sm:px-1 rounded-xl transition-all duration-300 flex flex-col items-center justify-center text-center cursor-default select-none ${
                      isFound
                        ? 'bg-gradient-to-b from-[#3a0d05]/80 via-[#220703]/80 to-[#100301]/90 border border-amber-500/80 shadow-[0_0_16px_rgba(239,68,68,0.4),inset_0_1px_4px_rgba(251,191,36,0.3)]'
                        : 'bg-gradient-to-b from-[#140b06]/80 to-[#070402]/90 border border-stone-800/80 hover:border-amber-700/60 hover:bg-[#1c0f08]/80'
                    }`}
                  >
                    {/* Antique Forged Talisman Medallion */}
                    <div
                      className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isFound
                          ? 'bg-gradient-to-br from-[#7f1d1d] via-[#b45309] to-[#451a03] border-2 border-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.85)] scale-105'
                          : 'bg-gradient-to-br from-[#241710] via-[#180e0a] to-[#0c0704] border-2 border-stone-700/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] group-hover:border-amber-600/70'
                      }`}
                    >
                      <RelicIcon
                        relicId={tgt.id}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110"
                        isFound={isFound}
                      />
                      {/* Occult Blood-Seal Checkmark */}
                      {isFound && (
                        <span
                          aria-hidden="true"
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gradient-to-r from-red-600 to-amber-600 border border-amber-200 text-[8px] text-stone-950 font-black flex items-center justify-center shadow-[0_0_8px_rgba(245,158,11,0.95)]"
                        >
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Relic Label */}
                    <span
                      className={`text-[7.5px] sm:text-[8.5px] font-cinzel font-bold tracking-wider uppercase mt-0.5 line-clamp-1 transition-colors ${
                        isFound
                          ? 'text-amber-200 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                          : 'text-stone-400 group-hover:text-amber-300'
                      }`}
                    >
                      {tgt.name}
                    </span>

                    {/* Sub-status label */}
                    <span
                      className={`text-[7px] font-mono tracking-widest uppercase transition-colors ${
                        isFound
                          ? 'text-amber-400 font-extrabold tracking-widest drop-shadow-[0_0_4px_rgba(245,158,11,0.7)]'
                          : 'text-stone-600'
                      }`}
                    >
                      {isFound ? 'BANISHED' : 'HIDDEN'}
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
