import React from 'react';
import type { Stage3Config } from '../../../types/round1.types';
import { soundController } from '../../../utils/soundController';
import { GothicCoffinCard } from './GothicCoffinCard';

interface GraveyardEnvironmentViewProps {
  config: Stage3Config;
  collectedFragments: string[];
  isCompleted: boolean;
  onSelectCoffin: (coffinId: 'coffin1' | 'coffin2' | 'coffin3') => void;
  onOpenJournal: () => void;
  onOpenFinalGate: () => void;
  onReturnDashboard: () => void;
  onSkipStage?: () => void;
}

export const GraveyardEnvironmentView: React.FC<GraveyardEnvironmentViewProps> = ({
  config: _config,
  collectedFragments,
  isCompleted,
  onSelectCoffin,
  onOpenJournal,
  onOpenFinalGate,
  onReturnDashboard,
  onSkipStage,
}) => {
  // Extract button styles and text to satisfy SonarQube rule S3358 (no nested ternaries)
  const getGateButtonStyles = () => {
    if (isCompleted) {
      return 'bg-emerald-950/90 border border-emerald-500 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.5)]';
    }
    if (collectedFragments.length === 3) {
      return 'bg-gradient-to-r from-red-950 via-[#351008] to-amber-950 border border-amber-400 text-amber-100 shadow-[0_0_22px_rgba(245,158,11,0.7)] animate-pulse';
    }
    return 'bg-black/85 hover:bg-red-950/70 border border-red-700/60 text-stone-200 shadow-md';
  };

  const getGateButtonText = () => {
    if (isCompleted) {
      return 'Gate Breached ✓';
    }
    return 'Final Escape Gate';
  };

  return (
    <div className="relative z-10 w-full flex-1 min-h-0 flex flex-col justify-between items-center px-3 sm:px-6 py-1 select-none overflow-hidden">
      {/* 1. Main Heading Section (Compact, perfectly proportioned above the coffins) */}
      <div className="flex flex-col items-center text-center mt-0.5 sm:mt-1 mb-1 sm:mb-2 shrink-0 animate-fadeIn">
        {/* Stage 03 Top Ornament */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-amber-500/80 text-[10px] sm:text-xs font-serif" aria-hidden="true">
            ❖ ──
          </span>
          <span className="font-cinzel text-[10px] sm:text-xs font-bold tracking-[0.3em] text-amber-400 uppercase drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">
            STAGE 03
          </span>
          <span className="text-amber-500/80 text-[10px] sm:text-xs font-serif" aria-hidden="true">
            ── ❖
          </span>
        </div>

        {/* Grand Gothic Title */}
        <h1 className="font-cinzel text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-[0.06em] text-transparent bg-clip-text bg-gradient-to-b from-stone-100 via-stone-200 to-red-100 drop-shadow-[0_2px_18px_rgba(220,38,38,0.7)] uppercase leading-tight">
          The Forgotten Graveyard
        </h1>

        {/* Elegant Gothic Subtitle */}
        <p className="mt-0.5 text-[10px] sm:text-[11px] font-serif italic text-amber-200/90 tracking-wide max-w-xl">
          ✦ Uncover the clues, study the remains, and decode the final answer. ✦
        </p>

        {/* Semantic Grounds Description */}
        <span className="sr-only">The Cursed Sepulcher Grounds</span>

        {/* Restrained Ornamental Skull Divider */}
        <div className="flex items-center gap-2 mt-1 sm:mt-1.5" aria-hidden="true">
          <span className="h-[1px] w-10 sm:w-20 bg-gradient-to-r from-transparent via-amber-500/70 to-red-600/90" />
          <span className="text-xs text-red-500 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]">
            💀
          </span>
          <span className="h-[1px] w-10 sm:w-20 bg-gradient-to-l from-transparent via-amber-500/70 to-red-600/90" />
        </div>
      </div>

      {/* 2. The Three Freestanding Gothic Coffin Structures */}
      <div className="w-full max-w-5xl mx-auto flex-1 min-h-0 flex items-center justify-center py-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 w-full justify-items-center items-center h-full max-h-full">
          {/* COFFIN I: The Marked Remains (Amber Theme) */}
          <GothicCoffinCard
            coffinId="coffin1"
            romanNumber="COFFIN I"
            title="THE MARKED REMAINS"
            accessibleGraveName="Grave 1: Bone Chamber"
            chamberAltTitle="The Bone Chamber"
            colorTheme="amber"
            artworkSrc="/assets/stage-3/coffins/coffin_hd_1.png"
            isDiscovered={collectedFragments.includes('BENEATH') || collectedFragments.includes('THE')}
            discoveredFragment={collectedFragments.includes('BENEATH') ? 'BENEATH' : 'THE'}
            onSelect={() => onSelectCoffin('coffin1')}
          />

          {/* COFFIN II: The Shadow Library / Buried Diary (Purple Theme) */}
          <GothicCoffinCard
            coffinId="coffin2"
            romanNumber="COFFIN II"
            title="THE SHADOW LIBRARY"
            accessibleGraveName="Grave 2: Buried Diary"
            chamberAltTitle="The Buried Diary"
            colorTheme="purple"
            artworkSrc="/assets/stage-3/coffins/coffin_hd_2.png"
            isDiscovered={collectedFragments.includes('NIGHT')}
            discoveredFragment="NIGHT"
            onSelect={() => onSelectCoffin('coffin2')}
          />

          {/* COFFIN III: The Cursed Sanctuary / Rune Tombstone (Teal Theme) */}
          <GothicCoffinCard
            coffinId="coffin3"
            romanNumber="COFFIN III"
            title="THE CURSED SANCTUARY"
            accessibleGraveName="Grave 3: Rune Tombstone"
            chamberAltTitle="The Rune Tombstone"
            colorTheme="teal"
            artworkSrc="/assets/stage-3/coffins/coffin_hd_3.png"
            isDiscovered={collectedFragments.includes('RETURNS')}
            discoveredFragment="RETURNS"
            onSelect={() => onSelectCoffin('coffin3')}
          />
        </div>
      </div>

      {/* 3. Bottom Section: Minimal Ornamental Footer & Quick Actions */}
      <footer className="w-full max-w-6xl mx-auto mt-1 sm:mt-2 pt-1.5 pb-1 flex flex-col md:flex-row items-center justify-between gap-2 shrink-0">
        {/* Left: Evidence Journal & Final Escape Gate */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Evidence Journal Drawer Trigger */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onOpenJournal}
            aria-label="Evidence Journal"
            className="px-3.5 sm:px-4 py-1.5 rounded-full bg-black/85 hover:bg-amber-950/80 border border-amber-600/70 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 backdrop-blur-md outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none select-none"
            style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            <span aria-hidden="true">📜</span>
            <span>Evidence Journal ({collectedFragments.length}/3)</span>
          </button>

          {/* Final Escape Gate Modal Trigger */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onOpenFinalGate}
            aria-label="Final Escape Gate"
            className={`px-3.5 sm:px-4 py-1.5 rounded-full font-cinzel text-xs font-black uppercase tracking-widest transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 backdrop-blur-md outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none select-none ${getGateButtonStyles()}`}
            style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            <span aria-hidden="true">⛩️</span>
            <span>{getGateButtonText()}</span>
          </button>
        </div>

        {/* Right: Round Dashboard Action & Skip */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onSkipStage && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onSkipStage}
              className="px-3 py-1.5 rounded-full bg-stone-900/70 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 text-xs font-cinzel uppercase tracking-wider transition-all cursor-pointer backdrop-blur-md outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none select-none"
              style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
            >
              Skip Stage
            </button>
          )}

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              soundController.playClick();
              onReturnDashboard();
            }}
            aria-label="Round Dashboard"
            className="px-4 sm:px-5 py-1.5 rounded-full bg-black/85 hover:bg-amber-950/80 border border-amber-500/80 hover:border-amber-400 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 backdrop-blur-md outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none select-none"
            style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            <span aria-hidden="true">🏆</span>
            <span>ROUND DASHBOARD</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
