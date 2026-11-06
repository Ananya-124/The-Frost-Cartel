import React, { useState, useEffect } from 'react';
import type { Round4IntroState } from '../../../types/round4.types';
import { soundController } from '../../../utils/soundController';

interface AncientLetterProps {
  state: Round4IntroState;
  onOpenLetter: () => void;
  onDropFinished: () => void;
  isMuted: boolean;
}

export const AncientLetter: React.FC<AncientLetterProps> = ({
  state,
  onOpenLetter,
  onDropFinished,
  isMuted,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dropProgress, setDropProgress] = useState(0); // 0 = at release point, 1 = landed on pedestal
  const [letterImgError, setLetterImgError] = useState(false);

  // Handle letter drop fall animation when in LETTER_DROPPING
  useEffect(() => {
    if (state !== 'LETTER_DROPPING') return;

    if (!isMuted) {
      soundController.playLetterDrop();
    }

    const duration = 850; // 850ms natural drop with bounce
    const startTime = performance.now();

    const animateDrop = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      // Bounce-out easing for realistic soft landing
      const easeBounce = (x: number): number => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (x < 1 / d1) {
          return n1 * x * x;
        } else if (x < 2 / d1) {
          return n1 * (x -= 1.5 / d1) * x + 0.75;
        } else if (x < 2.5 / d1) {
          return n1 * (x -= 2.25 / d1) * x + 0.9375;
        } else {
          return n1 * (x -= 2.625 / d1) * x + 0.984375;
        }
      };

      setDropProgress(easeBounce(t));

      if (t < 1) {
        requestAnimationFrame(animateDrop);
      } else {
        onDropFinished();
      }
    };

    const frameId = requestAnimationFrame(animateDrop);
    return () => cancelAnimationFrame(frameId);
  }, [state, onDropFinished, isMuted]);

  // Don't render if before the dove drops it
  const isVisible =
    state === 'LETTER_DROPPING' ||
    state === 'LETTER_DROPPED' ||
    state === 'DOVE_LANDING' ||
    state === 'LETTER_AVAILABLE' ||
    state === 'LETTER_OPENING' ||
    state === 'LETTER_REVEALED' ||
    state === 'LETTER_OPENED' ||
    state === 'HUNT_REQUESTED' ||
    state === 'OUTGOING_BLUR' ||
    state === 'PORTAL_IGNITION' ||
    state === 'SCENE_CONTRACTING' ||
    state === 'PARTICLES_FORMING';

  if (!isVisible) {
    return null;
  }

  const isClickable = state === 'LETTER_AVAILABLE';

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

  // Interpolate falling height & rotation: releases at 68% and settles on pedestal top at 73.5%
  const isDropping = state === 'LETTER_DROPPING';
  const currentY = isDropping ? 68 + dropProgress * 5.5 : 73.5;
  const currentRotation = isDropping ? (1 - dropProgress) * 12 : 0;
  const currentScale = isDropping ? 0.75 + dropProgress * 0.25 : isHovered ? 1.05 : 1.0;

  return (
    <>
      {/* 1. Luminous Runic Floor Compass resting directly on Pedestal Surface */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-24 pointer-events-none w-64 sm:w-80 lg:w-96 h-28 sm:h-36 flex items-center justify-center select-none"
        style={{ top: '74%' }}
      >
        {/* Soft Radial Golden Floor Glow */}
        <div className="absolute inset-x-8 inset-y-4 rounded-full bg-amber-400/30 blur-2xl animate-pulse [animation-duration:3s]" />

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

        {/* Impact Golden Spark Particles upon Landing */}
        {isDropping && dropProgress > 0.8 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-amber-300/60 animate-ping" />
            <div className="absolute -top-4 -left-6 w-2 h-2 rounded-full bg-yellow-200 animate-ping [animation-duration:0.6s]" />
            <div className="absolute -bottom-3 -right-6 w-2 h-2 rounded-full bg-yellow-100 animate-ping [animation-duration:0.8s]" />
          </div>
        )}
      </div>

      {/* 2. Interactive Sealed Ancient Letter Prop */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-26 flex flex-col items-center select-none"
        style={{
          top: `${currentY}%`,
          transform: `translate(-50%, -50%) rotate(${currentRotation}deg) scale(${currentScale})`,
          transition: isDropping ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <button
          type="button"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={!isClickable}
          aria-label="OPEN THE ANCIENT LETTER"
          className={`relative group focus:outline-none transition-transform duration-300 ${
            isClickable ? 'hover:-translate-y-2 focus:-translate-y-2 cursor-pointer' : 'cursor-default'
          }`}
        >
          {/* Golden Outline Radiance on Hover */}
          <div
            className={`absolute -inset-4 rounded-xl transition-opacity duration-300 blur-lg pointer-events-none ${
              isHovered && isClickable
                ? 'bg-amber-400/50 opacity-100'
                : isClickable
                ? 'bg-amber-400/25 opacity-70 group-hover:opacity-100'
                : 'opacity-0'
            }`}
          />

          {/* High-Resolution Sealed Letter Image or SVG Fallback */}
          <div className="relative w-48 sm:w-56 lg:w-64 drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]">
            {!letterImgError ? (
              <img
                src="/assets/round-4/sealed_ancient_letter.png"
                alt="Sealed ancient letter on stone pedestal"
                onError={() => setLetterImgError(true)}
                className="w-full h-auto object-contain filter brightness-105"
              />
            ) : (
              /* High-Fidelity Antique Wax-Sealed Parchment Envelope SVG Fallback */
              <svg viewBox="0 0 240 160" className="w-full h-auto drop-shadow-[0_14px_28px_rgba(0,0,0,0.8)]">
                <defs>
                  <linearGradient id="parchmentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#faf2de" />
                    <stop offset="50%" stopColor="#eedcb4" />
                    <stop offset="100%" stopColor="#d4be88" />
                  </linearGradient>
                  <radialGradient id="waxSeal" cx="40%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#c53030" />
                    <stop offset="60%" stopColor="#821818" />
                    <stop offset="100%" stopColor="#4a0e0e" />
                  </radialGradient>
                  <linearGradient id="goldFiligree" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#d4af37" />
                    <stop offset="50%" stopColor="#f5e6a3" />
                    <stop offset="100%" stopColor="#aa820a" />
                  </linearGradient>
                </defs>
                {/* Envelope Body */}
                <rect x="10" y="10" width="220" height="140" rx="8" fill="url(#parchmentGrad)" stroke="#c2a76f" strokeWidth="2" />
                {/* Engraved Border Lines */}
                <rect x="16" y="16" width="208" height="128" rx="5" fill="none" stroke="url(#goldFiligree)" strokeWidth="1.2" strokeDasharray="6 3" />
                {/* Fold Flaps */}
                <path d="M10 10 L120 90 L230 10" fill="none" stroke="#b89a5c" strokeWidth="1.8" />
                <path d="M10 150 L85 85" fill="none" stroke="#c4a86e" strokeWidth="1.2" />
                <path d="M230 150 L155 85" fill="none" stroke="#c4a86e" strokeWidth="1.2" />
                {/* Ornate Gold Corner Accents */}
                <polygon points="18,18 28,18 18,28" fill="#d4af37" />
                <polygon points="222,18 212,18 222,28" fill="#d4af37" />
                <polygon points="18,142 28,142 18,132" fill="#d4af37" />
                <polygon points="222,142 212,142 222,132" fill="#d4af37" />
                {/* Royal Wax Seal */}
                <circle cx="120" cy="88" r="24" fill="url(#waxSeal)" stroke="#3a0b0b" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))" />
                <circle cx="120" cy="88" r="19" fill="none" stroke="#d4af37" strokeWidth="1" strokeDasharray="3 2" />
                {/* Skull / Cartel Emblem on Seal */}
                <path d="M114 83 C114 77, 126 77, 126 83 C126 87, 124 90, 122 91 L122 94 L118 94 L118 91 C116 90, 114 87, 114 83 Z" fill="#ffd700" />
                <circle cx="118" cy="84" r="1.2" fill="#821818" />
                <circle cx="122" cy="84" r="1.2" fill="#821818" />
              </svg>
            )}

            {/* Golden Light Shimmer Overlay on Letter */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-200/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        </button>

        {/* 3. Subtle Atmospheric Hover Call-To-Action Prompt */}
        {isClickable && (
          <div className="mt-2 sm:mt-3 flex flex-col items-center gap-1 text-center animate-fadeIn pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-xs animate-pulse">◆</span>
              <span className="font-cinzel text-xs sm:text-sm tracking-[0.25em] text-amber-200 font-bold uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                OPEN THE ANCIENT LETTER
              </span>
              <span className="text-amber-400 text-xs animate-pulse">◆</span>
            </div>
            <span className="font-serif italic text-[11px] sm:text-xs text-amber-100/80 tracking-wider drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              Click to unseal and read the ancient storyline
            </span>
          </div>
        )}
      </div>
    </>
  );
};
