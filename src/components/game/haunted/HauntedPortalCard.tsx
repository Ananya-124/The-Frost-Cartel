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
  artworkUrl: _artworkUrl,
  progressText,
  isExpired: _isExpired,
  onEnterStage,
}) => {
  // Theme color maps for ambient glow, aura, borders, and pills
  const themeStyles = {
    orange: {
      relicImg: '/assets/halloween/portals/relic_full_stage1.png',
      auraBg: 'bg-[radial-gradient(ellipse_at_50%_45%,rgba(249,115,22,0.45)_0%,rgba(194,65,12,0.2)_50%,transparent_75%)]',
      hoverGlow: 'group-hover:drop-shadow-[0_0_28px_rgba(249,115,22,0.85)]',
      pillBorder: 'border-orange-500/70',
      pillBg: 'bg-black/90 text-amber-300',
      pillShadow: 'shadow-[0_0_15px_rgba(249,115,22,0.4)]',
      titleColor: 'text-stone-100 group-hover:text-amber-200',
      completedBg: 'bg-gradient-to-r from-[#1c0b04] via-[#2f1307] to-[#1c0b04]',
      completedBorder: 'border-amber-500/90',
      completedText: 'text-amber-200',
      completedShadow: 'shadow-[0_0_16px_rgba(245,158,11,0.5)]',
    },
    purple: {
      relicImg: '/assets/halloween/portals/relic_full_stage2.png',
      auraBg: 'bg-[radial-gradient(ellipse_at_50%_45%,rgba(168,85,247,0.45)_0%,rgba(126,34,206,0.2)_50%,transparent_75%)]',
      hoverGlow: 'group-hover:drop-shadow-[0_0_28px_rgba(168,85,247,0.85)]',
      pillBorder: 'border-purple-500/70',
      pillBg: 'bg-black/90 text-purple-200',
      pillShadow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
      titleColor: 'text-stone-100 group-hover:text-purple-200',
      completedBg: 'bg-gradient-to-r from-[#140520] via-[#260b3a] to-[#140520]',
      completedBorder: 'border-purple-400/90',
      completedText: 'text-purple-200',
      completedShadow: 'shadow-[0_0_16px_rgba(168,85,247,0.6)]',
    },
    emerald: {
      relicImg: '/assets/halloween/portals/relic_full_stage3.png',
      auraBg: 'bg-[radial-gradient(ellipse_at_50%_45%,rgba(20,184,166,0.45)_0%,rgba(13,148,136,0.2)_50%,transparent_75%)]',
      hoverGlow: 'group-hover:drop-shadow-[0_0_28px_rgba(20,184,166,0.85)]',
      pillBorder: 'border-teal-500/70',
      pillBg: 'bg-black/90 text-teal-200',
      pillShadow: 'shadow-[0_0_15px_rgba(20,184,166,0.4)]',
      titleColor: 'text-stone-100 group-hover:text-teal-200',
      completedBg: 'bg-gradient-to-r from-[#031412] via-[#082822] to-[#031412]',
      completedBorder: 'border-teal-400/90',
      completedText: 'text-teal-200',
      completedShadow: 'shadow-[0_0_16px_rgba(20,184,166,0.6)]',
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
      className="group relative flex flex-col items-center justify-center w-[230px] xs:w-[250px] sm:w-[270px] md:w-[285px] lg:w-[305px] select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-3xl"
    >
      {/* 1. Supernatural Ambient Atmospheric Vapors / Back-Aura */}
      <div
        aria-hidden="true"
        className={`absolute -inset-4 rounded-3xl ${themeStyles.auraBg} blur-xl opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 pointer-events-none`}
      />

      {/* 2. Freestanding Gothic Reliquary Structure & Frame */}
      <div className="relative w-full z-10 transition-all duration-300 group-hover:scale-[1.03] group-hover:brightness-110 active:scale-[0.98]">
        <img
          src={themeStyles.relicImg}
          alt={`Stage ${stageNumber}: ${title}`}
          className={`w-full h-auto object-contain filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)] ${themeStyles.hoverGlow} transition-all duration-300 pointer-events-none`}
          loading="eager"
        />

        {/* 3. Dynamic Status Overlays: Seamlessly replaces the reward button on the relic frame */}
        {status === 'completed' && (
          <div className="absolute top-[77.1%] left-1/2 -translate-x-1/2 w-[48%] h-[9.8%] z-20 pointer-events-none flex items-center justify-center">
            <div
              className={`w-full h-full rounded-full ${themeStyles.completedBg} border-2 ${themeStyles.completedBorder} ${themeStyles.completedShadow} flex items-center justify-center gap-1 sm:gap-1.5 px-2`}
            >
              <span className={`font-cinzel text-[9px] xs:text-[9.5px] sm:text-[10.5px] font-black tracking-widest uppercase ${themeStyles.completedText} drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]`}>
                COMPLETED ✓
              </span>
            </div>
          </div>
        )}

        {progressText && !isNotConfigured && status !== 'completed' && (
          <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap">
            <span className="text-[8px] sm:text-[9px] font-mono text-stone-300/80 tracking-wider font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {progressText}
            </span>
          </div>
        )}
      </div>

      {/* Screen-reader accessible portal label & announcement */}
      <span className="sr-only">PORTAL 0{stageNumber}</span>
      <span className="sr-only">
        Stage {stageNumber}: {title} — {isNotConfigured ? 'Not Configured' : `${rewardCredits} Credits`}
      </span>
    </div>
  );
};
