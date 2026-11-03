import React from 'react';
import type { StageProgressStatus } from '../../../types/round1.types';

interface HauntedPortalCardProps {
  stageId: string;
  stageNumber: number;
  title: string;
  rewardCredits: number;
  status: StageProgressStatus | 'locked';
  colorTheme: 'orange' | 'purple' | 'emerald';
  artworkUrl: string;
  progressText?: string;
  isExpired: boolean;
  onEnterStage: () => void;
}

export const HauntedPortalCard: React.FC<HauntedPortalCardProps> = ({
  stageId: _stageId,
  stageNumber,
  title,
  rewardCredits,
  status,
  colorTheme,
  artworkUrl,
  progressText,
  isExpired: _isExpired,
  onEnterStage,
}) => {
  // Theme color maps for borders, glows, text, and capsules
  const themeStyles = {
    orange: {
      border: 'border-orange-500/80',
      runeColor: '#f97316',
      glow: 'shadow-[0_0_28px_rgba(249,115,22,0.35)]',
      hoverGlow: 'group-hover:shadow-[0_0_50px_rgba(249,115,22,0.9)]',
      apexGlow: 'filter drop-shadow-[0_0_12px_rgba(249,115,22,0.95)]',
      pillBorder: 'border-orange-500/70',
      pillBg: 'bg-black/90 text-amber-300',
      pillShadow: 'shadow-[0_0_15px_rgba(249,115,22,0.4)]',
      titleColor: 'text-stone-100 group-hover:text-amber-200',
      bgGradient: 'from-[#240e04] via-[#120702] to-[#080301]',
    },
    purple: {
      border: 'border-purple-500/80',
      runeColor: '#a855f7',
      glow: 'shadow-[0_0_28px_rgba(168,85,247,0.35)]',
      hoverGlow: 'group-hover:shadow-[0_0_50px_rgba(168,85,247,0.9)]',
      apexGlow: 'filter drop-shadow-[0_0_12px_rgba(168,85,247,0.95)]',
      pillBorder: 'border-purple-500/70',
      pillBg: 'bg-black/90 text-purple-200',
      pillShadow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
      titleColor: 'text-stone-100 group-hover:text-purple-200',
      bgGradient: 'from-[#1c0828] via-[#0e0414] to-[#07020a]',
    },
    emerald: {
      border: 'border-teal-500/80',
      runeColor: '#14b8a6',
      glow: 'shadow-[0_0_28px_rgba(20,184,166,0.35)]',
      hoverGlow: 'group-hover:shadow-[0_0_50px_rgba(20,184,166,0.9)]',
      apexGlow: 'filter drop-shadow-[0_0_12px_rgba(20,184,166,0.95)]',
      pillBorder: 'border-teal-500/70',
      pillBg: 'bg-black/90 text-teal-200',
      pillShadow: 'shadow-[0_0_15px_rgba(20,184,166,0.4)]',
      titleColor: 'text-stone-100 group-hover:text-teal-200',
      bgGradient: 'from-[#041e1b] via-[#020e0d] to-[#010606]',
    },
  }[colorTheme];

  const isNotConfigured = status === 'not_configured';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEnterStage}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEnterStage();
        }
      }}
      aria-label={`Enter Stage ${stageNumber}: ${title}`}
      className={`group relative flex flex-col items-center justify-between w-[220px] sm:w-[240px] md:w-[255px] lg:w-[265px] h-[320px] sm:h-[340px] md:h-[355px] p-2.5 sm:p-3 rounded-t-[5.5rem] rounded-b-xl bg-gradient-to-b ${themeStyles.bgGradient} border-2 ${themeStyles.border} ${themeStyles.glow} ${themeStyles.hoverGlow} transition-all duration-300 hover:scale-105 active:scale-95 select-none cursor-pointer backdrop-blur-md overflow-visible`}
    >
      {/* 1. Ornamental Gothic Stone Arch Finial Crest at Apex */}
      <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <svg
          className={`w-7 h-7 sm:w-8 sm:h-8 ${themeStyles.apexGlow}`}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Gothic Pointed Spear Finial with Wing Flourishes */}
          <path
            d="M20 2L24 14L34 20L24 24L20 38L16 24L6 20L16 14L20 2Z"
            fill={`url(#apexGrad-${colorTheme})`}
            stroke="#1c1917"
            strokeWidth="1.5"
          />
          <circle cx="20" cy="20" r="3" fill="#ffffff" />
          <defs>
            <linearGradient id={`apexGrad-${colorTheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor={themeStyles.runeColor} />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Outer Carved Stone Rim Inner Shadow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-t-[5.5rem] rounded-b-xl border border-white/10 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]"
      />

      {/* 2. Top Stage & Portal Label */}
      <div className="relative z-10 flex flex-col items-center pt-2 sm:pt-2.5">
        <div className="text-[10px] sm:text-xs font-cinzel font-bold text-amber-200/90 tracking-[0.2em] uppercase flex items-center justify-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          <span>STAGE {stageNumber}</span>
          <span className="sr-only">PORTAL 0{stageNumber}</span>
        </div>
      </div>

      {/* 3. Arched Chamber Artwork Viewport */}
      <div className="relative z-10 w-full h-36 sm:h-40 rounded-t-[4.5rem] rounded-b-md overflow-hidden border border-white/15 bg-black shadow-[inset_0_0_20px_rgba(0,0,0,0.95)]">
        <img
          src={artworkUrl}
          alt={title}
          className="w-full h-full object-cover object-center filter brightness-[0.9] contrast-110 saturate-[1.05] group-hover:scale-108 transition-transform duration-700 pointer-events-none"
          loading="eager"
        />
        {/* Subtle Vignette & Theme Tint Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* 4. Chamber Title (Never Truncated) */}
      <div className="relative z-10 w-full px-1.5 flex flex-col items-center text-center">
        <h3
          className={`text-[11px] sm:text-xs md:text-sm font-cinzel font-bold uppercase tracking-wider ${themeStyles.titleColor} transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] leading-tight text-center`}
        >
          {title}
        </h3>
      </div>

      {/* 5. Bottom Capsule: Reward Badge & Configured Status */}
      <div className="relative z-10 w-full pb-1 flex flex-col items-center gap-1">
        {isNotConfigured ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/95 border border-stone-700 text-[10px] sm:text-xs font-cinzel font-bold text-stone-400 uppercase tracking-wider shadow-inner">
            <span aria-hidden="true">🔒</span>
            <span>NOT CONFIGURED</span>
          </div>
        ) : (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${themeStyles.pillBorder} ${themeStyles.pillBg} ${themeStyles.pillShadow} text-[10px] sm:text-xs font-mono font-bold tracking-wider`}
          >
            <span aria-hidden="true" className="text-amber-400 text-xs">👑</span>
            <span>{rewardCredits} CR</span>
          </div>
        )}

        {/* Live Progress or Status Subtext */}
        {progressText && !isNotConfigured && (
          <div className="text-[9px] font-mono text-stone-400 tracking-wider font-semibold">
            {progressText}
          </div>
        )}

        {status === 'completed' && (
          <span className="text-[9px] font-cinzel font-bold text-emerald-400 uppercase tracking-wider">
            COMPLETED ✓
          </span>
        )}
      </div>
    </div>
  );
};
