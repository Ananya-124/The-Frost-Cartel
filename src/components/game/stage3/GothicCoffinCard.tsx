import React from 'react';
import { soundController } from '../../../utils/soundController';

export interface GothicCoffinCardProps {
  coffinId: 'coffin1' | 'coffin2' | 'coffin3';
  romanNumber: string;
  title: string;
  accessibleGraveName: string;
  chamberAltTitle: string;
  colorTheme: 'amber' | 'purple' | 'teal';
  artworkSrc: string;
  isCompleted: boolean;
  discoveredFragment?: string | null;
  onSelect: () => void;
}

export const GothicCoffinCard: React.FC<GothicCoffinCardProps> = ({
  romanNumber,
  title,
  accessibleGraveName,
  chamberAltTitle,
  colorTheme,
  artworkSrc,
  isCompleted,
  discoveredFragment,
  onSelect,
}) => {
  const theme = {
    amber: {
      glow: 'bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.3)_0%,transparent_70%)]',
      borderGlow: 'group-hover:drop-shadow-[0_0_26px_rgba(245,158,11,0.65)]',
      btnBg: 'bg-gradient-to-r from-[#1c0b04] via-[#2f1307] to-[#1c0b04]',
      btnBorder: 'border-amber-500/90 group-hover:border-amber-400',
      btnText: 'text-amber-200 group-hover:text-amber-100',
      btnShadow: 'shadow-[0_0_15px_rgba(245,158,11,0.45)]',
    },
    purple: {
      glow: 'bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.3)_0%,transparent_70%)]',
      borderGlow: 'group-hover:drop-shadow-[0_0_26px_rgba(168,85,247,0.65)]',
      btnBg: 'bg-gradient-to-r from-[#140520] via-[#260b3a] to-[#140520]',
      btnBorder: 'border-purple-400/90 group-hover:border-purple-300',
      btnText: 'text-purple-200 group-hover:text-purple-100',
      btnShadow: 'shadow-[0_0_15px_rgba(168,85,247,0.45)]',
    },
    teal: {
      glow: 'bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.3)_0%,transparent_70%)]',
      borderGlow: 'group-hover:drop-shadow-[0_0_26px_rgba(20,184,166,0.65)]',
      btnBg: 'bg-gradient-to-r from-[#031412] via-[#082822] to-[#031412]',
      btnBorder: 'border-teal-400/90 group-hover:border-teal-300',
      btnText: 'text-teal-200 group-hover:text-teal-100',
      btnShadow: 'shadow-[0_0_15px_rgba(20,184,166,0.45)]',
    },
  }[colorTheme];

  const handleClick = () => {
    if (isCompleted) return;
    soundController.playClick();
    onSelect();
  };

  return (
    <div
      role="region"
      aria-label={`${romanNumber}: ${title} ${isCompleted ? '(Completed)' : ''}`}
      tabIndex={isCompleted ? -1 : 0}
      onKeyDown={(e) => {
        if (!isCompleted && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      onMouseDown={(e) => {
        // Prevent mouse click from triggering browser default focus ring / outline
        e.preventDefault();
      }}
      onClick={handleClick}
      className={`coffin-card group relative flex flex-col items-center justify-center select-none transition-all duration-300 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none w-auto max-w-[240px] sm:max-w-[270px] md:max-w-[295px] lg:max-w-[320px] max-h-[min(54vh,480px)] ${
        isCompleted
          ? 'cursor-default pointer-events-none'
          : 'cursor-pointer transform hover:scale-[1.03] hover:-translate-y-1'
      }`}
      style={{
        outline: 'none',
        outlineWidth: 0,
        outlineStyle: 'none',
        boxShadow: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* 1. Ambient Atmospheric Glow behind the Coffin */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 rounded-3xl ${
          isCompleted
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.18)_0%,transparent_70%)] opacity-50'
            : `${theme.glow} opacity-60 group-hover:opacity-100`
        } transition-opacity duration-500 blur-2xl pointer-events-none`}
      />

      {/* 2. Discovered Fragment Floating Seal (if completed) */}
      {isCompleted && (
        <div className="absolute top-1 sm:top-2 z-20 pointer-events-none animate-fadeIn">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/80 bg-emerald-950/95 text-emerald-300 text-[9px] sm:text-[10px] font-cinzel font-black tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <span className="text-emerald-400">✓</span>
            <span>&ldquo;{discoveredFragment || 'COMPLETED'}&rdquo; SECURED</span>
          </span>
        </div>
      )}

      {/* 3. Freestanding Coffin Structure Artwork */}
      <div
        className={`relative transition-all duration-300 max-h-[min(54vh,480px)] flex items-center justify-center ${
          isCompleted ? 'drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)] opacity-90' : theme.borderGlow
        }`}
      >
        <img
          src={artworkSrc}
          alt={`${romanNumber}: ${title}`}
          loading="eager"
          className={`max-h-[min(54vh,480px)] w-auto max-w-full object-contain filter drop-shadow-[0_12px_30px_rgba(0,0,0,0.95)] ${
            isCompleted ? 'brightness-95 contrast-95' : ''
          }`}
        />

        {/* 4. Action Button Slot (PLAY before completion, COMPLETED when solved) */}
        <div className="coffin-card-play-slot absolute top-[88.4%] left-1/2 -translate-x-1/2 w-[52%] h-[9%] z-20 flex items-center justify-center pointer-events-none">
          {isCompleted ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              tabIndex={-1}
              aria-label={`${accessibleGraveName} completed and permanently sealed`}
              className="coffin-card-play-btn w-full h-full rounded-full cursor-default z-20 outline-none focus:outline-none flex items-center justify-center select-none pointer-events-none"
              style={{
                outline: 'none',
                outlineWidth: 0,
                outlineStyle: 'none',
                boxShadow: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div className="w-full h-full rounded-full bg-[#0a1410] border-2 border-emerald-500/70 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5 px-3">
                <span className="text-emerald-400 text-xs" aria-hidden="true">
                  ✓
                </span>
                <span className="font-cinzel text-[10px] sm:text-[11px] font-black tracking-[0.18em] uppercase text-emerald-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                  COMPLETED
                </span>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
                (e.currentTarget as HTMLElement).blur?.();
                handleClick();
              }}
              aria-label={`Enter ${accessibleGraveName}`}
              className="coffin-card-play-btn w-full h-full rounded-full cursor-pointer z-20 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none flex items-center justify-center transition-all duration-200 select-none pointer-events-auto"
              style={{
                outline: 'none',
                outlineWidth: 0,
                outlineStyle: 'none',
                boxShadow: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div
                className={`w-full h-full rounded-full ${theme.btnBg} border-2 ${theme.btnBorder} ${theme.btnShadow} flex items-center justify-center gap-1.5 px-3 transform group-hover:scale-105 transition-transform duration-200`}
              >
                <span
                  className={`font-cinzel text-[10.5px] sm:text-xs font-black tracking-[0.22em] uppercase ${theme.btnText} drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]`}
                >
                  PLAY ›
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 5. Accessible Semantic Content for Screen Readers & Automated Tests */}
      <div className="sr-only">
        <span>{chamberAltTitle}</span>
        <span>{title}</span>
        <span>{romanNumber}</span>
        {isCompleted && <span>Status: Completed</span>}
      </div>
    </div>
  );
};
