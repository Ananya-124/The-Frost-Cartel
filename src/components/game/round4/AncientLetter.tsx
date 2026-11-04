import React, { useState } from 'react';
import type { Round4IntroState } from '../../../types/round4.types';
import { soundController } from '../../../utils/soundController';

interface AncientLetterProps {
  state: Round4IntroState;
  onOpenLetter: () => void;
  isMuted: boolean;
}

export const AncientLetter: React.FC<AncientLetterProps> = ({
  state,
  onOpenLetter,
  isMuted,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Render only after the dove has arrived and dropped the letter
  const isVisible =
    state === 'LETTER_DROPPED' ||
    state === 'LETTER_OPENING' ||
    state === 'LETTER_REVEALED';

  if (!isVisible && state !== 'DOVE_ARRIVING') {
    return null;
  }

  const isClickable = state === 'LETTER_DROPPED';

  const handleClick = () => {
    if (!isClickable) return;
    if (!isMuted) {
      soundController.playClick();
      soundController.playParchmentOpen();
    }
    onOpenLetter();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`absolute bottom-[16%] sm:bottom-[18%] lg:bottom-[20%] left-1/2 -translate-x-1/2 z-25 flex flex-col items-center select-none transition-all duration-700 ${
        state === 'DOVE_ARRIVING'
          ? 'opacity-0 scale-75 translate-y-8'
          : 'opacity-100 scale-100 translate-y-0'
      }`}
    >
      {/* 1. Luminous Runic Compass Ring on Stone Pedestal Floor */}
      <div className="relative w-64 sm:w-80 lg:w-96 h-28 sm:h-36 flex items-center justify-center pointer-events-none">
        {/* Soft Radial Golden Floor Glow */}
        <div className="absolute inset-x-8 inset-y-4 rounded-full bg-amber-400/25 blur-2xl animate-pulse [animation-duration:3s]" />

        {/* Concentric Decorative SVG Runic Compass Rings */}
        <svg
          className="w-full h-full opacity-80 filter drop-shadow-[0_0_12px_rgba(245,190,80,0.6)] animate-spin [animation-duration:40s]"
          viewBox="0 0 300 120"
        >
          <ellipse cx="150" cy="60" rx="140" ry="50" fill="none" stroke="rgba(246,190,80,0.4)" strokeWidth="1.5" />
          <ellipse cx="150" cy="60" rx="120" ry="42" fill="none" stroke="rgba(255,235,160,0.6)" strokeWidth="1" strokeDasharray="4 6" />
          <ellipse cx="150" cy="60" rx="90" ry="32" fill="none" stroke="rgba(246,190,80,0.5)" strokeWidth="1.5" strokeDasharray="10 8" />
          {/* Radial Axis Rays */}
          <line x1="150" y1="10" x2="150" y2="110" stroke="rgba(255,225,120,0.4)" strokeWidth="1" strokeDasharray="2 4" />
          <line x1="10" y1="60" x2="290" y2="60" stroke="rgba(255,225,120,0.4)" strokeWidth="1" strokeDasharray="2 4" />
          {/* Compass Diamonds */}
          <polygon points="150,15 153,24 150,33 147,24" fill="rgba(255,215,80,0.85)" />
          <polygon points="150,87 153,96 150,105 147,96" fill="rgba(255,215,80,0.85)" />
          <polygon points="25,60 34,63 43,60 34,57" fill="rgba(255,215,80,0.85)" />
          <polygon points="257,60 266,63 275,60 266,57" fill="rgba(255,215,80,0.85)" />
        </svg>

        {/* Floating Sparkle Particles */}
        <div className="absolute top-2 left-10 w-1.5 h-1.5 rounded-full bg-amber-200/80 animate-ping [animation-duration:2.5s]" />
        <div className="absolute top-8 right-12 w-2 h-2 rounded-full bg-amber-300/80 animate-ping [animation-duration:3.2s] [animation-delay:1s]" />
      </div>

      {/* 2. Interactive Sealed Ancient Letter Prop */}
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={!isClickable}
        aria-label="Inspect and unseal ancient letter"
        className={`relative -mt-24 sm:-mt-28 lg:-mt-32 group cursor-pointer focus:outline-none transition-transform duration-300 ${
          isClickable ? 'hover:-translate-y-2 focus:-translate-y-2' : 'cursor-default'
        } ${isHovered ? 'scale-105' : 'scale-100'}`}
      >
        {/* Golden Outline Glow on Hover */}
        <div
          className={`absolute -inset-4 rounded-xl transition-opacity duration-300 blur-lg pointer-events-none ${
            isHovered
              ? 'bg-amber-400/40 opacity-100'
              : 'bg-amber-400/20 opacity-70 group-hover:opacity-100'
          }`}
        />

        {/* High-Resolution Sealed Letter Image */}
        <div className="relative w-48 sm:w-56 lg:w-64 drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]">
          <img
            src="/assets/round-4/sealed_ancient_letter.png"
            alt="Sealed ancient letter on stone pedestal"
            className="w-full h-auto object-contain filter brightness-105"
          />

          {/* Golden Light Shimmer Overlay on Letter */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-200/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
      </button>

      {/* 3. Subtle Atmospheric Hover Call-To-Action Prompt */}
      {isClickable && (
        <div className="mt-4 sm:mt-5 flex flex-col items-center gap-1.5 text-center animate-fadeIn pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-xs animate-pulse">◆</span>
            <span className="font-cinzel text-xs sm:text-sm tracking-[0.25em] text-amber-200 font-bold uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              A LETTER AWAITS...
            </span>
            <span className="text-amber-400 text-xs animate-pulse">◆</span>
          </div>
          <span className="font-serif italic text-[11px] sm:text-xs text-amber-100/75 tracking-wider">
            Click to unseal and read the ancient storyline
          </span>
        </div>
      )}
    </div>
  );
};
