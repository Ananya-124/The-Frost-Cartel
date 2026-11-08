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
  isDiscovered: boolean;
  discoveredFragment?: string;
  onSelect: () => void;
}

export const GothicCoffinCard: React.FC<GothicCoffinCardProps> = ({
  romanNumber,
  title,
  accessibleGraveName,
  chamberAltTitle,
  colorTheme,
  artworkSrc,
  isDiscovered,
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
      fragmentBadge: 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.6)]',
    },
    purple: {
      glow: 'bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.3)_0%,transparent_70%)]',
      borderGlow: 'group-hover:drop-shadow-[0_0_26px_rgba(168,85,247,0.65)]',
      btnBg: 'bg-gradient-to-r from-[#140520] via-[#260b3a] to-[#140520]',
      btnBorder: 'border-purple-400/90 group-hover:border-purple-300',
      btnText: 'text-purple-200 group-hover:text-purple-100',
      btnShadow: 'shadow-[0_0_15px_rgba(168,85,247,0.45)]',
      fragmentBadge: 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.6)]',
    },
    teal: {
      glow: 'bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.3)_0%,transparent_70%)]',
      borderGlow: 'group-hover:drop-shadow-[0_0_26px_rgba(20,184,166,0.65)]',
      btnBg: 'bg-gradient-to-r from-[#031412] via-[#082822] to-[#031412]',
      btnBorder: 'border-teal-400/90 group-hover:border-teal-300',
      btnText: 'text-teal-200 group-hover:text-teal-100',
      btnShadow: 'shadow-[0_0_15px_rgba(20,184,166,0.45)]',
      fragmentBadge: 'bg-teal-950/90 border-teal-400 text-teal-200 shadow-[0_0_12px_rgba(20,184,166,0.6)]',
    },
  }[colorTheme];

  const handleClick = () => {
    soundController.playClick();
    onSelect();
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 focus:outline-none w-auto max-w-[240px] sm:max-w-[270px] md:max-w-[295px] lg:max-w-[320px] max-h-[min(54vh,480px)]"
    >
      {/* 1. Ambient Atmospheric Glow behind the Coffin */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 rounded-3xl ${theme.glow} opacity-60 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none`}
      />

      {/* 2. Discovered Fragment Floating Seal (if clue unsealed) */}
      {isDiscovered && discoveredFragment && (
        <div className="absolute top-1 sm:top-2 z-20 pointer-events-none animate-fadeIn">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border text-[8.5px] sm:text-[9.5px] font-cinzel font-black tracking-widest uppercase ${theme.fragmentBadge}`}
          >
            <span>📜</span>
            <span>&ldquo;{discoveredFragment}&rdquo; FOUND</span>
          </span>
        </div>
      )}

      {/* 3. Freestanding Coffin Structure Artwork */}
      <div className={`relative transition-all duration-300 max-h-[min(54vh,480px)] flex items-center justify-center ${theme.borderGlow}`}>
        <img
          src={artworkSrc}
          alt={`${romanNumber}: ${title}`}
          loading="eager"
          className="max-h-[min(54vh,480px)] w-auto max-w-full object-contain filter drop-shadow-[0_12px_30px_rgba(0,0,0,0.95)]"
        />

        {/* 4. Interactive PLAY / INSPECT Button Slot (Seamlessly aligns with the artwork's carved action slot) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          aria-label={accessibleGraveName}
          className="absolute top-[88.4%] left-1/2 -translate-x-1/2 w-[50%] h-[8.8%] rounded-full cursor-pointer z-20 focus:outline-none flex items-center justify-center transition-all duration-200"
        >
          {isDiscovered && (
            <div
              className={`w-full h-full rounded-full ${theme.btnBg} border-2 ${theme.btnBorder} ${theme.btnShadow} flex items-center justify-center gap-1 px-2`}
            >
              <span
                className={`font-cinzel text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase ${theme.btnText} drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]`}
              >
                INSPECT ›
              </span>
            </div>
          )}
        </button>
      </div>

      {/* 5. Accessible Semantic Content for Screen Readers & Automated Tests */}
      <div className="sr-only">
        <span>{chamberAltTitle}</span>
        <span>{title}</span>
        <span>{romanNumber}</span>
      </div>
    </div>
  );
};
