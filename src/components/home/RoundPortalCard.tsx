import React from 'react';
import type { RoundConfig } from '../../types/round.types';

interface RoundPortalCardProps {
  round: RoundConfig;
  onSelectRound: (round: RoundConfig) => void;
}

export const RoundPortalCard: React.FC<RoundPortalCardProps> = ({
  round,
  onSelectRound,
}) => {
  const isAccessible = round.isAccessible;

  return (
    <div className="flex flex-col items-center text-center relative group w-full max-w-[280px] sm:max-w-[300px] h-full mx-auto transition-transform duration-300">
      {/* 1. Unified Circular Gateway Frame — Identical White/Silver Default for All 4 Rounds */}
      <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-40 lg:h-40 xl:w-44 xl:h-44 rounded-full p-1.5 mb-2.5 flex items-center justify-center shrink-0 aspect-square select-none">
        {/* Ambient Halo Glow — Hidden by default, smooth antique gold glow on hover / focus */}
        <div
          aria-hidden="true"
          className="absolute -inset-2.5 rounded-full bg-gradient-radial from-amber-400/25 via-amber-600/10 to-transparent blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[0_0_30px_rgba(245,158,11,0.45)]"
        />

        {/* Outer Rotating Runic Ring — Silver default, antique gold on hover / focus */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-dashed border-white/20 group-hover:border-amber-400/50 group-focus-within:border-amber-400/50 animate-spin-slow transition-colors duration-500 pointer-events-none"
        />

        {/* Inner Counter-Rotating Ring — Soft white default, warm amber on hover / focus */}
        <div
          aria-hidden="true"
          className="absolute inset-1.5 rounded-full border border-dotted border-white/15 group-hover:border-amber-300/40 group-focus-within:border-amber-300/40 animate-spin-slow-reverse transition-colors duration-500 pointer-events-none"
        />

        {/* Carved Circular Portal Image Container — Crisp white/silver frame, antique gold on hover */}
        <div className="w-full h-full rounded-full overflow-hidden border-2 sm:border-[3px] border-white/35 group-hover:border-amber-400 group-focus-within:border-amber-400 relative transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.85)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]">
          <img
            src={round.imageSrc}
            alt={round.title}
            loading="eager"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95 contrast-105 group-hover:brightness-100"
          />
          {/* Eerie portal vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20 group-hover:from-black/75 transition-colors duration-500" />
        </div>

        {/* Top Arch Medallion Badge (01 / 02 / 03 / 04) — White/silver default, antique gold on hover */}
        <div className="absolute -top-1.5 sm:-top-2 border-2 border-white/40 group-hover:border-amber-400 group-focus-within:border-amber-400 text-white/90 group-hover:text-amber-300 group-focus-within:text-amber-300 bg-[#090b0e] text-[11px] sm:text-xs font-cinzel font-black w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-[0_0_14px_rgba(245,158,11,0.6)] group-focus-within:shadow-[0_0_14px_rgba(245,158,11,0.6)] transition-all duration-300 group-hover:scale-110">
          {round.number}
        </div>
      </div>

      {/* 2. Floating Title (Fixed Reserved Height for Horizontal Baseline Alignment) */}
      <div className="w-full h-12 sm:h-14 flex items-center justify-center px-1 mb-1.5">
        <h3 className="text-sm sm:text-base font-cinzel font-bold text-white group-hover:text-amber-200 transition-colors duration-300 leading-snug tracking-wider text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] line-clamp-2">
          {round.title}
        </h3>
      </div>

      {/* 3. Status Badge Pill (Fixed Reserved Height for Horizontal Baseline Alignment) */}
      <div className="w-full h-7 sm:h-8 flex items-center justify-center mb-1.5">
        {round.statusBadge === 'active' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cartel-pumpkin/20 border border-cartel-pumpkin/70 text-cartel-pumpkin text-[9px] sm:text-[10px] font-cinzel font-bold uppercase tracking-widest shadow-pumpkinGlow">
            <span className="w-1.5 h-1.5 rounded-full bg-cartel-pumpkin animate-ping" aria-hidden="true" />
            <span>{round.statusText}</span>
          </span>
        )}
        {round.statusBadge === 'upcoming' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cartel-amber/15 border border-cartel-amber/50 text-cartel-amber text-[9px] sm:text-[10px] font-cinzel font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(246,166,58,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cartel-amber" aria-hidden="true" />
            <span>{round.statusText}</span>
          </span>
        )}
        {round.statusBadge === 'locked' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/60 text-[9px] sm:text-[10px] font-cinzel font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" aria-hidden="true" />
            <span>{round.statusText}</span>
          </span>
        )}
        {round.statusBadge === 'completed' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-[9px] sm:text-[10px] font-cinzel font-bold uppercase tracking-widest">
            <span aria-hidden="true">✓</span><span>{round.statusText}</span>
          </span>
        )}
      </div>

      {/* 4. Quick Specs / Metadata (Fixed Reserved Height for Horizontal Baseline Alignment) */}
      <div className="w-full h-9 sm:h-10 flex items-center justify-center text-[10px] sm:text-[11px] text-cartel-silver/85 font-mono tracking-wider px-1 text-center mb-3">
        <span className="leading-tight">
          <span>{round.duration}</span>
          <span className="mx-1.5 text-cartel-amber" aria-hidden="true">•</span>
          <span className="text-cartel-amber font-semibold">{round.bounty}</span>
        </span>
      </div>

      {/* 5. Primary Action Button (Pinned to Bottom with mt-auto — Identical Across All Rounds) */}
      <div className="w-full flex justify-center mt-auto">
        {isAccessible ? (
          <button
            type="button"
            onClick={() => onSelectRound(round)}
            className="w-full max-w-[200px] h-10 py-1.5 px-4 rounded-md font-cinzel font-black text-[10.5px] sm:text-xs uppercase tracking-widest flex items-center justify-center bg-gradient-to-r from-cartel-pumpkin via-cartel-amber to-cartel-pumpkin text-cartel-void shadow-pumpkinGlow border border-cartel-amber/50 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            {round.actionText}
          </button>
        ) : (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="w-full max-w-[200px] h-10 py-1.5 px-4 rounded-md bg-cartel-charcoal/80 border border-white/10 text-cartel-silver/45 font-cinzel font-semibold text-[10.5px] sm:text-xs uppercase tracking-wider flex items-center justify-center cursor-not-allowed select-none"
          >
            {round.actionText}
          </button>
        )}
      </div>
    </div>
  );
};
