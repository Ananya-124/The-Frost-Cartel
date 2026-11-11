import React, { useEffect, useState, useRef } from 'react';
import type { WinnerRecord } from '../../../types/round4Expedition.types';
import { soundController } from '../../../utils/soundController';
import { ConfettiCannonCanvas } from './ConfettiCannonCanvas';

interface WinnerCelebrationModalProps {
  winner: WinnerRecord | null;
  routeRomanNumeral?: string;
  isMuted?: boolean;
  onExit: () => void;
}

export const WinnerCelebrationModal: React.FC<WinnerCelebrationModalProps> = ({
  winner,
  isMuted = false,
  onExit,
}) => {
  const [revealedStep, setRevealedStep] = useState(0);
  const [cannonsFired, setCannonsFired] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const celebrationTriggeredRef = useRef(false);

  // Check prefers-reduced-motion
  const [reducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    // Trigger celebratory audio once
    if (!celebrationTriggeredRef.current && !isMuted) {
      celebrationTriggeredRef.current = true;
      try {
        soundController.playVictory();
      } catch {
        // AudioContext policy
      }
    }

    if (reducedMotion) {
      setCannonsFired(true);
      setRevealedStep(5);
      return;
    }

    // Coordinated cinematic reveal sequence
    const t0 = setTimeout(() => setCannonsFired(true), 100);
    const t1 = setTimeout(() => setRevealedStep(1), 250);  // Header & Crown
    const t2 = setTimeout(() => setRevealedStep(2), 450);  // Congratulations ribbon
    const t3 = setTimeout(() => setRevealedStep(3), 700);  // Winner nameplate
    const t4 = setTimeout(() => setRevealedStep(4), 950);  // Glowing chest
    const t5 = setTimeout(() => setRevealedStep(5), 1200); // Hall of Fame button

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isMuted, reducedMotion]);

  // Controlled loading or invalid winner state
  if (!winner || !winner.teamName) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Verifying Championship Victory"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
      >
        <div className="text-center p-8 rounded-2xl bg-[#1a0e0d] border border-amber-500/50 shadow-2xl max-w-md w-full">
          <div className="w-12 h-12 mx-auto mb-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs uppercase tracking-[0.3em] text-amber-400 font-cinzel font-bold mb-2">
            FROST CARTEL • TOURNAMENT FINAL
          </div>
          <div className="text-sm font-serif text-amber-200/80">
            Awaiting Authoritative Winner Verification...
          </div>
        </div>
      </div>
    );
  }

  // Exact single dynamic team name (strictly prevents duplicate "TEAM" prefix)
  const cleanTeamName = winner.teamName.trim().toUpperCase();

  const handleEnterHallOfFame = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    soundController.playClick();

    if (typeof window !== 'undefined') {
      window.location.hash = '#/leaderboard';
    }

    onExit();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Championship Victory Announcement"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#080604]/95 backdrop-blur-2xl overflow-y-auto select-none"
    >
      {/* 1. Animated Canvas Confetti System from Dual Cannons */}
      <ConfettiCannonCanvas trigger={cannonsFired} reducedMotion={reducedMotion} />

      {/* 2. Ambient Golden & Deep Burgundy Atmosphere Radial Rays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-to-tr from-amber-600/15 via-[#681324]/25 to-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />
      </div>

      {/* 3. Outer Ornate Gold Frame & Filigree Flourishes */}
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#1c080b]/90 via-[#0e0506]/95 to-[#080304]/98 border-2 border-[#d4af37]/60 rounded-3xl p-6 sm:p-10 shadow-[0_0_90px_rgba(212,175,55,0.25)] text-center text-[#f4ecd8] font-serif transition-all duration-700 my-auto">
        {/* Ornate Corner Filigrees */}
        <svg className="absolute top-3 left-3 w-10 h-10 text-[#d4af37]/70 pointer-events-none" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">
          <path d="M0,0 L20,0 C10,0 0,10 0,20 Z M4,4 L16,4 C10,4 4,10 4,16 Z M2,2 L38,2 L38,6 L6,6 L6,38 L2,38 Z" />
        </svg>
        <svg className="absolute top-3 right-3 w-10 h-10 text-[#d4af37]/70 pointer-events-none rotate-90" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">
          <path d="M0,0 L20,0 C10,0 0,10 0,20 Z M4,4 L16,4 C10,4 4,10 4,16 Z M2,2 L38,2 L38,6 L6,6 L6,38 L2,38 Z" />
        </svg>
        <svg className="absolute bottom-3 left-3 w-10 h-10 text-[#d4af37]/70 pointer-events-none -rotate-90" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">
          <path d="M0,0 L20,0 C10,0 0,10 0,20 Z M4,4 L16,4 C10,4 4,10 4,16 Z M2,2 L38,2 L38,6 L6,6 L6,38 L2,38 Z" />
        </svg>
        <svg className="absolute bottom-3 right-3 w-10 h-10 text-[#d4af37]/70 pointer-events-none rotate-180" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">
          <path d="M0,0 L20,0 C10,0 0,10 0,20 Z M4,4 L16,4 C10,4 4,10 4,16 Z M2,2 L38,2 L38,6 L6,6 L6,38 L2,38 Z" />
        </svg>

        {/* Top-Left & Top-Right Royal Velvet Banners with Compass Rose */}
        <div className="absolute -top-3 left-8 sm:left-14 w-10 sm:w-12 h-20 sm:h-24 bg-gradient-to-b from-[#6b1424] to-[#3a0a13] border-x border-b border-[#d4af37]/60 rounded-b-lg shadow-lg flex flex-col items-center justify-end pb-3 pointer-events-none hidden sm:flex">
          <span className="text-[#ffd700] text-sm animate-pulse">✦</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700] mt-1" />
        </div>
        <div className="absolute -top-3 right-8 sm:right-14 w-10 sm:w-12 h-20 sm:h-24 bg-gradient-to-b from-[#6b1424] to-[#3a0a13] border-x border-b border-[#d4af37]/60 rounded-b-lg shadow-lg flex flex-col items-center justify-end pb-3 pointer-events-none hidden sm:flex">
          <span className="text-[#ffd700] text-sm animate-pulse">✦</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700] mt-1" />
        </div>

        {/* Phase 2 Item 1 & 2: Small Brand Label & Event Label */}
        <header className={`transition-all duration-700 ${revealedStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
          <div className="text-[11px] sm:text-xs font-cinzel font-bold tracking-[0.35em] text-amber-200/90 uppercase mb-1 drop-shadow-md">
            FROST CARTEL
          </div>
          <div className="text-[10px] sm:text-[11px] font-cinzel font-semibold tracking-[0.25em] text-amber-400 uppercase drop-shadow">
            THE RADIANT TREASURE HUNT
          </div>
          <div className="flex items-center justify-center gap-3 my-2">
            <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
            <span className="text-amber-400 text-xs">✦</span>
            <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent via-[#d4af37] to-transparent" />
          </div>
        </header>

        {/* Phase 2 Item 3: Crown & Congratulations Heading */}
        <section
          aria-label="Celebration Banner"
          className={`flex flex-col items-center justify-center transition-all duration-700 ${revealedStep >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
        >
          {/* Royal Crown with Golden Sunburst */}
          <div className="relative flex items-center justify-center mb-1">
            <div className="absolute inset-0 bg-gradient-to-t from-amber-400/50 via-yellow-300/25 to-transparent rounded-full blur-2xl animate-pulse" />
            <svg
              className="relative w-16 h-16 sm:w-20 sm:h-20 text-[#ffd700] drop-shadow-[0_0_25px_rgba(255,215,0,0.8)]"
              viewBox="0 0 64 64"
              fill="currentColor"
              aria-hidden="true"
            >
              {/* Ornate Royal Crown */}
              <path d="M8 46 L12 22 L24 33 L32 12 L40 33 L52 22 L56 46 Z" fill="url(#crownGoldGradient)" stroke="#d4af37" strokeWidth="1.5" />
              <rect x="8" y="46" width="48" height="7" rx="2" fill="url(#crownBandGradient)" stroke="#d4af37" strokeWidth="1.5" />
              {/* Rubies & Jewels */}
              <circle cx="32" cy="12" r="3.5" fill="#e11d48" stroke="#ffd700" strokeWidth="1" />
              <circle cx="12" cy="22" r="2.8" fill="#e11d48" stroke="#ffd700" strokeWidth="1" />
              <circle cx="52" cy="22" r="2.8" fill="#e11d48" stroke="#ffd700" strokeWidth="1" />
              <circle cx="20" cy="49.5" r="1.8" fill="#e11d48" />
              <circle cx="32" cy="49.5" r="2" fill="#38bdf8" />
              <circle cx="44" cy="49.5" r="1.8" fill="#e11d48" />
              <defs>
                <linearGradient id="crownGoldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fff8cc" />
                  <stop offset="45%" stopColor="#ffd700" />
                  <stop offset="100%" stopColor="#b38600" />
                </linearGradient>
                <linearGradient id="crownBandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#681023" />
                  <stop offset="50%" stopColor="#9e1836" />
                  <stop offset="100%" stopColor="#681023" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Curved Royal Ribbon with Golden Laurels */}
          <div className="relative flex items-center justify-center max-w-full my-2">
            {/* Left Laurel Branch */}
            <svg className="w-8 h-8 sm:w-14 sm:h-14 text-[#ffd700] drop-shadow-[0_0_10px_rgba(255,215,0,0.6)] -mr-2 sm:-mr-4 pointer-events-none" viewBox="0 0 36 36" fill="currentColor" aria-hidden="true">
              <path d="M18 4 C16 8 13 14 8 16 C12 17 16 16 18 12 C18 16 14 22 9 24 C14 25 18 23 20 18 C20 22 17 28 11 31 C16 31 20 28 22 23 C22 27 20 32 15 35 C20 35 24 31 25 26 C26 21 24 10 18 4 Z" />
            </svg>

            {/* Ribbon Body */}
            <div className="relative px-6 sm:px-14 py-2 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#400812] via-[#751426] to-[#400812] border-y-2 border-[#ffd700] shadow-[0_6px_30px_rgba(0,0,0,0.85),0_0_25px_rgba(212,175,55,0.45)]">
              <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-cinzel font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fffbe8] via-[#fff0b3] to-[#ffd700] tracking-[0.18em] uppercase drop-shadow-[0_2px_14px_rgba(255,215,0,0.6)]">
                CONGRATULATIONS!
              </h2>
            </div>

            {/* Right Laurel Branch */}
            <svg className="w-8 h-8 sm:w-14 sm:h-14 text-[#ffd700] drop-shadow-[0_0_10px_rgba(255,215,0,0.6)] -ml-2 sm:-ml-4 pointer-events-none scale-x-[-1]" viewBox="0 0 36 36" fill="currentColor" aria-hidden="true">
              <path d="M18 4 C16 8 13 14 8 16 C12 17 16 16 18 12 C18 16 14 22 9 24 C14 25 18 23 20 18 C20 22 17 28 11 31 C16 31 20 28 22 23 C22 27 20 32 15 35 C20 35 24 31 25 26 C26 21 24 10 18 4 Z" />
            </svg>
          </div>

          <div className="text-center text-amber-400 text-xs my-1">✦</div>
        </section>

        {/* Phase 2 Item 4: Single Dynamic Winning Team Nameplate */}
        <section
          aria-label="Winner Plaque"
          className={`transition-all duration-700 my-4 sm:my-6 ${revealedStep >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          <div className="relative inline-flex items-center justify-center max-w-full">
            {/* Left Gold Wreath */}
            <svg className="w-10 h-16 sm:w-14 sm:h-20 text-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.4)] -mr-3 sm:-mr-4 pointer-events-none" viewBox="0 0 40 60" fill="currentColor" aria-hidden="true">
              <path d="M22 6 C18 14 12 24 4 28 C10 29 16 27 20 20 C19 27 13 36 6 41 C13 41 19 37 22 29 C22 36 17 46 9 52 C16 51 22 46 24 38 C25 29 24 16 22 6 Z" />
            </svg>

            {/* Responsive Adaptive Width Nameplate Plaque */}
            <div className="relative min-w-[280px] sm:min-w-[440px] max-w-2xl px-6 sm:px-14 py-4 sm:py-6 rounded-2xl bg-gradient-to-r from-[#200508] via-[#3d0b13] to-[#200508] border-2 border-[#d4af37] shadow-[inset_0_2px_15px_rgba(0,0,0,0.8),0_0_40px_rgba(212,175,55,0.3)]">
              {/* Inner Hairline Gold Border */}
              <div className="absolute inset-1.5 rounded-xl border border-amber-400/40 pointer-events-none" />

              {/* Stepped Corner Ornaments */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#ffd700]" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#ffd700]" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#ffd700]" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#ffd700]" />

              {/* EXACT ONE WINNING TEAM NAME FIELD */}
              <h1 className="font-cinzel font-black text-2xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#ffe082] to-[#d4af37] tracking-wider drop-shadow-[0_2px_14px_rgba(212,175,55,0.6)] break-words text-center">
                {cleanTeamName}
              </h1>
            </div>

            {/* Right Gold Wreath */}
            <svg className="w-10 h-16 sm:w-14 sm:h-20 text-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.4)] -ml-3 sm:-ml-4 pointer-events-none scale-x-[-1]" viewBox="0 0 40 60" fill="currentColor" aria-hidden="true">
              <path d="M22 6 C18 14 12 24 4 28 C10 29 16 27 20 20 C19 27 13 36 6 41 C13 41 19 37 22 29 C22 36 17 46 9 52 C16 51 22 46 24 38 C25 29 24 16 22 6 Z" />
            </svg>
          </div>
        </section>

        {/* Radiant Ancient Treasure Chest Motif */}
        <div
          aria-hidden="true"
          className={`relative flex flex-col items-center justify-center my-3 sm:my-4 transition-all duration-700 ${revealedStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Volumetric Vertical Light Beams */}
          <div className="absolute bottom-6 w-48 sm:w-64 h-28 bg-gradient-to-t from-amber-400/35 via-yellow-300/15 to-transparent blur-xl pointer-events-none animate-pulse" />

          {/* SVG Ancient Golden Relic Chest */}
          <svg className="relative w-28 h-20 sm:w-36 sm:h-24 text-[#ffd700] drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]" viewBox="0 0 100 70" fill="currentColor">
            {/* Open Lid */}
            <path d="M14 26 L22 10 L78 10 L86 26 Z" fill="url(#chestLidGradient)" stroke="#854d0e" strokeWidth="1.5" />
            <ellipse cx="50" cy="18" rx="28" ry="6" fill="#fef08a" opacity="0.6" />
            {/* Chest Body */}
            <rect x="16" y="26" width="68" height="36" rx="3" fill="url(#chestBodyGradient)" stroke="#854d0e" strokeWidth="2" />
            {/* Iron Metal Straps */}
            <rect x="28" y="26" width="6" height="36" fill="#713f12" />
            <rect x="66" y="26" width="6" height="36" fill="#713f12" />
            {/* Glowing Golden Compass Rose Seal */}
            <circle cx="50" cy="42" r="9" fill="#1c070a" stroke="#ffd700" strokeWidth="1.5" />
            <path d="M50 35 L52 41 L57 42 L52 43 L50 49 L48 43 L43 42 L48 41 Z" fill="#ffd700" />
            <defs>
              <linearGradient id="chestLidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#713f12" />
              </linearGradient>
              <linearGradient id="chestBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#854d0e" />
                <stop offset="50%" stopColor="#451a03" />
                <stop offset="100%" stopColor="#1c070a" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Phase 2 Item 5: Bottom Action Button */}
        <footer className={`mt-4 sm:mt-6 transition-all duration-700 ${revealedStep >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            type="button"
            onClick={handleEnterHallOfFame}
            disabled={isNavigating}
            className="group relative inline-flex items-center justify-center gap-3 px-8 sm:px-14 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#4a0d17] via-[#6d1323] to-[#4a0d17] hover:from-[#5c111e] hover:via-[#85182d] hover:to-[#5c111e] active:from-[#350910] active:to-[#350910] border-2 border-[#d4af37] hover:border-[#ffe082] text-[#fff8e7] font-cinzel font-bold text-xs sm:text-sm tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(212,175,55,0.4),inset_0_1px_8px_rgba(255,255,255,0.2)] hover:shadow-[0_0_45px_rgba(212,175,55,0.7)] cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>ENTER THE HALL OF FAME</span>
            <span className="text-base font-black text-amber-300 transition-transform duration-300 group-hover:translate-x-1.5">
              →
            </span>
          </button>
        </footer>
      </div>

      {/* 4. Left Party Popper Cannon Visual (Fixed Lower-Left Viewport Edge) */}
      <div
        aria-hidden="true"
        className={`fixed bottom-2 left-2 sm:bottom-6 sm:left-6 w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 z-40 pointer-events-none transition-transform duration-300 ${cannonsFired ? 'scale-110 -rotate-3' : 'scale-100 rotate-0'}`}
      >
        <svg className="w-full h-full drop-shadow-[0_0_20px_rgba(245,158,11,0.7)]" viewBox="0 0 100 100" fill="none">
          {/* Cannon Body with Spiral Burgundy/Gold Striping */}
          <path d="M15 90 L65 40 L82 57 L32 107 Z" fill="#751426" stroke="#d4af37" strokeWidth="2.5" />
          <path d="M28 77 L45 60 L54 69 L37 86 Z" fill="#ffd700" />
          <path d="M48 57 L65 40 L74 49 L57 66 Z" fill="#ffd700" />
          {/* Cannon Nozzle Flared Collar */}
          <ellipse cx="73" cy="49" rx="16" ry="8" transform="rotate(-45 73 49)" fill="#ca8a04" stroke="#ffe082" strokeWidth="2.5" />
          {/* Muzzle Burst Star */}
          {cannonsFired && (
            <g className="animate-ping origin-center">
              <circle cx="80" cy="42" r="14" fill="#ffffff" opacity="0.9" />
              <polygon points="80,26 84,39 96,42 84,45 80,58 76,45 64,42 76,39" fill="#ffd700" />
            </g>
          )}
        </svg>
      </div>

      {/* 5. Right Party Popper Cannon Visual (Fixed Lower-Right Viewport Edge) */}
      <div
        aria-hidden="true"
        className={`fixed bottom-2 right-2 sm:bottom-6 sm:right-6 w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 z-40 pointer-events-none transition-transform duration-300 ${cannonsFired ? 'scale-110 rotate-3' : 'scale-100 rotate-0'}`}
      >
        <svg className="w-full h-full drop-shadow-[0_0_20px_rgba(245,158,11,0.7)] scale-x-[-1]" viewBox="0 0 100 100" fill="none">
          {/* Cannon Body with Spiral Burgundy/Gold Striping */}
          <path d="M15 90 L65 40 L82 57 L32 107 Z" fill="#751426" stroke="#d4af37" strokeWidth="2.5" />
          <path d="M28 77 L45 60 L54 69 L37 86 Z" fill="#ffd700" />
          <path d="M48 57 L65 40 L74 49 L57 66 Z" fill="#ffd700" />
          {/* Cannon Nozzle Flared Collar */}
          <ellipse cx="73" cy="49" rx="16" ry="8" transform="rotate(-45 73 49)" fill="#ca8a04" stroke="#ffe082" strokeWidth="2.5" />
          {/* Muzzle Burst Star */}
          {cannonsFired && (
            <g className="animate-ping origin-center">
              <circle cx="80" cy="42" r="14" fill="#ffffff" opacity="0.9" />
              <polygon points="80,26 84,39 96,42 84,45 80,58 76,45 64,42 76,39" fill="#ffd700" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
