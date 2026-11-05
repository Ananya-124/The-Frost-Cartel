import React from 'react';
import type { FloorDefinition } from './FloorConfiguration';

interface AncientMapPlaceholderProps {
  floor: FloorDefinition;
}

export const AncientMapPlaceholder: React.FC<AncientMapPlaceholderProps> = ({ floor }) => {
  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-lg border-2 border-amber-600/60 bg-gradient-to-b from-[#2b2014]/95 via-[#1a140d]/95 to-[#0f0b07]/95 p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_40px_rgba(245,185,80,0.12)] overflow-hidden">
      {/* Decorative Antique Brass Corner Plates */}
      <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
      <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />

      {/* Subtle Atmospheric Relic Watermark */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full border border-amber-500/10 pointer-events-none flex items-center justify-center">
        <div className="w-48 h-48 rounded-full border border-amber-500/10" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        {/* Top Relic Emblem & Floor Level Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs tracking-[0.25em] font-cinzel font-semibold uppercase shadow-inner">
          <span>🏛️</span>
          <span>{floor.label} • LEVEL {floor.romanNumeral}</span>
          <span>✦</span>
        </div>

        {/* Mandatory Title */}
        <div className="space-y-2">
          <h2 className="font-cinzel text-2xl sm:text-4xl font-bold tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 drop-shadow-[0_2px_10px_rgba(245,185,80,0.4)]">
            ANCIENT MAP — CONTENT AWAITS
          </h2>
          <p className="font-serif italic text-amber-200/80 text-sm sm:text-base max-w-xl">
            "{floor.subtitle}"
          </p>
        </div>

        {/* Central Map Parchment Display Area */}
        <div className="relative w-full h-64 sm:h-80 rounded border border-amber-500/30 bg-[#16120b] flex flex-col items-center justify-center p-6 shadow-inner overflow-hidden">
          {/* Subtle Survey Grid Lines */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Compass Rose Watermark */}
          <div className="relative z-10 flex flex-col items-center space-y-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-amber-500/40 flex items-center justify-center text-amber-400 text-3xl sm:text-4xl shadow-[0_0_25px_rgba(245,185,80,0.2)] animate-pulse">
              🧭
            </div>
            <div className="space-y-1 text-center">
              <span className="block font-cinzel text-xs sm:text-sm tracking-[0.2em] text-amber-300 font-semibold uppercase">
                CAMPUS SURVEY QUADRANT {floor.romanNumeral}
              </span>
              <span className="block font-mono text-[11px] tracking-wider text-amber-400/60">
                LAT 12°56'24" N • LONG 77°34'12" E • ALT LVL-0{floor.floorNumber}
              </span>
            </div>
          </div>

          {/* Clue Notice Banner */}
          <div className="relative z-10 mt-6 px-4 py-2 rounded bg-amber-950/60 border border-amber-500/30 text-amber-200/90 text-xs sm:text-sm font-serif italic max-w-md">
            {floor.interiorClueHint}
          </div>
        </div>

        {/* Footer Metadata */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs tracking-widest text-amber-400/60 font-sans uppercase">
          <span>ARCHITECTURAL BLOCK: B. S. NARAYAN</span>
          <span>•</span>
          <span>EXPLORATION STATUS: STAGED</span>
          <span>•</span>
          <span>CARTOGRAPHY: PREPARED</span>
        </div>
      </div>
    </div>
  );
};

