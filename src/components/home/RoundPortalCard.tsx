import React from 'react';
import type { RoundConfig } from '../../types/round.types';

interface RoundPortalCardProps {
  round: RoundConfig;
  onSelectRound: (round: RoundConfig) => void;
}

function getPortalGlowClass(roundNumber: string): string {
  switch (roundNumber) {
    case '01':
      return 'from-cartel-pumpkin/30 via-cartel-amber/15 to-transparent border-cartel-pumpkin shadow-pumpkinGlow portal-glow-pumpkin';
    case '02':
      return 'from-cartel-amber/25 via-amber-700/15 to-transparent border-cartel-amber/70 shadow-[0_0_25px_rgba(246,166,58,0.35)]';
    case '04':
      return 'from-amber-300/35 via-yellow-400/20 to-transparent border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.6)]';
    default:
      return 'from-cartel-cyan/25 via-teal-900/15 to-transparent border-cartel-cyan/70 shadow-frostGlow portal-glow-cyan';
  }
}

function getMedallionClass(roundNumber: string): string {
  switch (roundNumber) {
    case '01':
      return 'border-cartel-pumpkin text-cartel-amber shadow-pumpkinGlow bg-cartel-void';
    case '02':
      return 'border-cartel-amber text-cartel-amber shadow-[0_0_12px_rgba(246,166,58,0.3)] bg-cartel-void';
    case '04':
      return 'border-amber-300 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.7)] bg-[#120e06]';
    default:
      return 'border-cartel-cyan text-cartel-cyan shadow-frostGlow bg-cartel-void';
  }
}

function getOuterRunicClass(roundNumber: string): string {
  if (roundNumber === '03') {
    return 'border-cartel-cyan/40 animate-spin-slow';
  }
  if (roundNumber === '04') {
    return 'border-amber-300/60 animate-spin-slow';
  }
  return 'border-cartel-amber/40 animate-spin-slow';
}

function getInnerRunicClass(roundNumber: string): string {
  if (roundNumber === '03') {
    return 'border-cartel-cyan/25 animate-spin-slow-reverse';
  }
  if (roundNumber === '04') {
    return 'border-yellow-200/50 animate-spin-slow-reverse';
  }
  return 'border-cartel-pumpkin/35 animate-spin-slow-reverse';
}

export const RoundPortalCard: React.FC<RoundPortalCardProps> = ({
  round,
  onSelectRound,
}) => {
  const isAccessible = round.isAccessible;
  const portalGlowClass = getPortalGlowClass(round.number);
  const medallionClass = getMedallionClass(round.number);
  const outerRunicClass = getOuterRunicClass(round.number);
  const innerRunicClass = getInnerRunicClass(round.number);

  return (
    <div className="flex flex-col items-center text-center relative group w-full max-w-[280px] sm:max-w-[300px] mx-auto transition-transform duration-300">
      {/* 1. Magical Circular Gateway Frame (No rectangular box container!) */}
      <div className="relative w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 xl:w-52 xl:h-52 rounded-full p-1.5 mb-3 flex items-center justify-center">
        {/* Ambient Halo Glow Emanating From Portal */}
        <div
          aria-hidden="true"
          className={`absolute -inset-2 rounded-full bg-gradient-radial blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${portalGlowClass}`}
        />

        {/* Decorative Outer Rotating Runic Ring */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 rounded-full border border-dashed pointer-events-none ${outerRunicClass}`}
        />

        {/* Decorative Inner Counter-Rotating Ring */}
        <div
          aria-hidden="true"
          className={`absolute inset-1.5 rounded-full border border-dotted pointer-events-none ${innerRunicClass}`}
        />

        {/* Carved Circular Portal Image Container */}
        <div
          className={`w-full h-full rounded-full overflow-hidden border-2 sm:border-[3px] relative transition-transform duration-500 group-hover:scale-[1.03] shadow-2xl ${portalGlowClass}`}
        >
          <img
            src={round.imageSrc}
            alt={round.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-95 contrast-105"
          />
          {/* Eerie portal vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />
        </div>

        {/* Top Arch Medallion Badge 01 / 02 / 03 */}
        <div
          className={`absolute -top-1.5 sm:-top-2 border-2 text-[11px] sm:text-xs font-cinzel font-black w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${medallionClass}`}
        >
          {round.number}
        </div>
      </div>

      {/* 2. Floating Title & Runic Identity */}
      <h3 className="text-sm sm:text-base font-cinzel font-bold text-white mb-1 leading-snug tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
        {round.title}
      </h3>

      {/* 3. Status Badge Pill */}
      <div className="mb-2">
        {round.statusBadge === 'active' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cartel-pumpkin/20 border border-cartel-pumpkin text-cartel-pumpkin text-[9px] sm:text-[10px] font-cinzel font-bold uppercase tracking-widest shadow-pumpkinGlow">
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
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cartel-cyan/15 border border-cartel-cyan/50 text-cartel-cyan text-[9px] sm:text-[10px] font-cinzel font-bold uppercase tracking-widest shadow-frostGlow">
            <span className="w-1.5 h-1.5 rounded-full bg-cartel-cyan" aria-hidden="true" />
            <span>{round.statusText}</span>
          </span>
        )}
      </div>

      {/* 4. Quick Specs */}
      <div className="text-[10px] sm:text-[11px] text-cartel-silver/80 font-mono tracking-wider mb-2.5">
        <span>{round.duration}</span>
        <span className="mx-1.5 text-cartel-amber" aria-hidden="true">•</span>
        <span className="text-cartel-amber font-semibold">{round.bounty}</span>
      </div>

      {/* 5. Interactive Action Button */}
      {isAccessible ? (
        <button
          onClick={() => onSelectRound(round)}
          className={`w-full max-w-[200px] py-1.5 px-4 rounded-md font-cinzel font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:opacity-95 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer border ${
            round.number === '04'
              ? 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-black border-amber-200 shadow-[0_0_20px_rgba(245,185,80,0.6)] hover:shadow-[0_0_30px_rgba(245,185,80,0.9)]'
              : 'bg-gradient-to-r from-cartel-pumpkin via-cartel-amber to-cartel-pumpkin text-cartel-void shadow-pumpkinGlow border-cartel-amber/40'
          }`}
        >
          {round.actionText}
        </button>
      ) : (
        <button
          disabled
          aria-disabled="true"
          className="w-full max-w-[200px] py-1.5 px-4 rounded-md bg-cartel-charcoal/80 border border-white/10 text-cartel-silver/45 font-cinzel font-semibold text-[10px] uppercase tracking-wider cursor-not-allowed select-none"
        >
          {round.actionText}
        </button>
      )}
    </div>
  );
};
