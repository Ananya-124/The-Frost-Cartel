import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { TeamSession } from '../../types/team.types';
import type { RoundConfig } from '../../types/round.types';
import { useNativeDialog } from '../../hooks/useNativeDialog';
import { round1Api } from '../../services/round1ApiService';
import { progressionService, type TeamProgression } from '../../services/progressionService';

interface TeamDashboardViewProps {
  session: TeamSession;
  round1Config: RoundConfig;
  onLogout: () => void;
  onEnterRound1: () => void;
  onClose: () => void;
  isRound1GameActive?: boolean;
  progression?: TeamProgression | null;
}

export const TeamDashboardView: React.FC<TeamDashboardViewProps> = ({
  session,
  round1Config: _round1Config,
  onLogout,
  onEnterRound1,
  onClose,
  isRound1GameActive = false,
  progression: initialProgression = null,
}) => {
  const { dialogRef } = useNativeDialog(true, onClose);

  const [roundStatus, setRoundStatus] = useState<'not_started' | 'running' | 'paused' | 'completed'>(() => {
    const status = initialProgression?.rounds.find((round) => round.round_id === 1)?.status;
    return status === 'IN_PROGRESS' || status === 'AVAILABLE' ? 'running' : status === 'COMPLETED' ? 'completed' : 'not_started';
  });
  const progressionRef = useRef<TeamProgression | null>(initialProgression);

  useEffect(() => {
    if (initialProgression) {
      progressionRef.current = initialProgression;
      const status = initialProgression.rounds.find((round) => round.round_id === 1)?.status;
      if (status === 'IN_PROGRESS' || status === 'AVAILABLE') setRoundStatus('running');
      else if (status === 'COMPLETED') setRoundStatus('completed');
    }
  }, [initialProgression]);

  const refreshProgression = useCallback(async () => {
    try {
      const value = await progressionService.getMine();
      progressionRef.current = value;
    } catch {
      // Ignore background refresh failure
    }
  }, []);

  // Only fetch progression on mount if parent didn't already supply it
  useEffect(() => {
    if (!initialProgression) {
      void refreshProgression();
    }
  }, [initialProgression, refreshProgression, session.teamId]);

  useEffect(() => {
    if (isRound1GameActive) return;
    let disposed = false;
    let inFlight = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const syncStatus = async () => {
      if (disposed || inFlight) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      inFlight = true;
      try {
        const state = await round1Api.getState();
        if (!disposed) {
          const next = state.round.isActive ? 'running' : state.session.status === 'completed' ? 'completed' : 'paused';
          setRoundStatus(next);
          // If Round 1 is unsealed, stop polling — gates are open and ready for entry
          if (next === 'running' && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch {
        if (!disposed) {
          const status = progressionRef.current?.rounds.find((round) => round.round_id === 1)?.status;
          setRoundStatus(status === 'IN_PROGRESS' || status === 'AVAILABLE' ? 'running' : status === 'COMPLETED' ? 'completed' : 'not_started');
        }
      } finally { inFlight = false; }
    };

    void syncStatus();
    intervalId = setInterval(() => { void syncStatus(); }, 15000);
    const syncWhenVisible = () => { if (document.visibilityState === 'visible') void syncStatus(); };
    document.addEventListener('visibilitychange', syncWhenVisible);
    return () => {
      disposed = true;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, [session.teamId, isRound1GameActive]);

  const isRoundActive = isRound1GameActive || roundStatus === 'running';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dashboard-team-title"
      className="fixed inset-0 z-50 m-0 w-full h-full max-w-none max-h-none p-0 border-none outline-none bg-black overflow-hidden select-none flex items-center justify-center animate-fadeIn"
    >
      {/* ========================================================================= */}
      {/* 1. CINEMATIC HAUNTED GRAVEYARD BACKDROP */}
      {/* ========================================================================= */}
      <div
        aria-hidden="true"
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat pointer-events-none select-none transition-transform duration-1000"
        style={{
          backgroundImage: "url('/assets/halloween/background/team_dashboard_arch_void.jpg')",
        }}
      />

      {/* Atmospheric Vignette & Eerie Ground Mist */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-radial from-transparent via-black/15 to-black/70 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-teal-950/40 via-teal-900/15 to-transparent pointer-events-none"
      />


      {/* Subtle Flickering Candle Glow Accents on Foreground Rock Ledges */}
      <div
        aria-hidden="true"
        className="absolute left-[20%] bottom-[20%] w-24 h-24 rounded-full bg-amber-500/20 blur-xl animate-pulse pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute right-[20%] bottom-[20%] w-24 h-24 rounded-full bg-amber-500/20 blur-xl animate-pulse pointer-events-none"
      />

      {/* ========================================================================= */}
      {/* TOP-RIGHT CLOSE JEWEL BUTTON */}
      {/* ========================================================================= */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close portal"
        title="Return to Sanctuary"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-stone-950/90 border-2 border-orange-500/80 hover:border-amber-400 text-amber-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all shadow-[0_0_15px_rgba(242,122,26,0.6)] hover:shadow-[0_0_24px_rgba(242,122,26,0.95)] hover:scale-110 cursor-pointer z-40"
      >
        ✕
      </button>

      {/* ========================================================================= */}
      {/* CENTRAL GRAVEYARD ARCH INNER VOID (STRICTLY 7 ELEMENTS IN EXACT ORDER) */}
      {/* ========================================================================= */}
      <div className="relative z-20 w-full max-w-md sm:max-w-lg md:max-w-xl px-4 py-6 sm:py-8 flex flex-col items-center justify-center text-center">
        {/* 1. ANCIENT SKULL EMBLEM (Runic Compass Ring with Glowing Skull) */}
        <div className="relative mb-3 sm:mb-4">
          <div
            aria-hidden="true"
            className="absolute -inset-3 rounded-full bg-gradient-radial from-orange-600/50 via-amber-500/25 to-transparent blur-md animate-pulse pointer-events-none"
          />
          <img
            src="/assets/halloween/emblem_arch_ref.png"
            alt="Ancient Cursed Emblem"
            className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain filter drop-shadow-[0_0_20px_rgba(242,122,26,0.95)] animate-pulse select-none"
          />
        </div>

        {/* 2. DYNAMIC TEAM NAME (Large Chiselled Metallic Gothic Typography) */}
        <h1
          id="dashboard-team-title"
          className="text-3xl sm:text-5xl md:text-6xl font-gothic font-bold text-stone-100 tracking-wider sm:tracking-widest silver-metallic-text uppercase leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] mb-3 sm:mb-4"
        >
          {session.teamName}
        </h1>

        {/* 3. STATUS (Glowing Teal / Ethereal Flame Wisps) */}
        <div className="mb-2 sm:mb-3">
          {isRoundActive ? (
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base font-cinzel font-bold text-teal-300 tracking-[0.25em] sm:tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(45,212,191,0.95)]">
              <span className="text-teal-400/80 font-normal select-none" aria-hidden="true">~</span>
              <span>THE GATES ARE UNSEALED</span>
              <span className="text-teal-400/80 font-normal select-none" aria-hidden="true">~</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base font-cinzel font-bold text-amber-400 tracking-[0.25em] sm:tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(245,158,11,0.9)]">
              <span className="text-amber-500/80 select-none" aria-hidden="true">✦</span>
              <span>AWAITING THE SUMMONS</span>
              <span className="text-amber-500/80 select-none" aria-hidden="true">✦</span>
            </div>
          )}
        </div>

        {/* 4. SUBTITLE ("✦ THE GRAVEYARD ESCAPE ✦") */}
        <div className="text-xs sm:text-sm font-cinzel font-semibold text-amber-100/90 tracking-[0.2em] sm:tracking-[0.25em] uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] mb-3 sm:mb-4 flex items-center justify-center gap-2">
          <span className="text-amber-500/80 text-xs" aria-hidden="true">✦</span>
          <span>THE GRAVEYARD ESCAPE</span>
          <span className="text-amber-500/80 text-xs" aria-hidden="true">✦</span>
        </div>

        {/* 5. THREE SMALL METADATA ITEMS */}
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs font-cinzel font-medium text-stone-300/85 tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mb-4 sm:mb-6 px-2">
          <span className="flex items-center gap-1">
            <span aria-hidden="true">👥</span>
            <span>2 PLAYERS</span>
          </span>
          <span className="text-stone-500" aria-hidden="true">•</span>
          <span className="flex items-center gap-1">
            <span aria-hidden="true">⏳</span>
            <span>20–25 MIN</span>
          </span>
          <span className="text-stone-500" aria-hidden="true">•</span>
          <span className="flex items-center gap-1 text-amber-300 font-semibold whitespace-nowrap">
            <span aria-hidden="true">💰</span>
            <span>WALLET: {session.credits === null ? 'UNAVAILABLE' : `${session.credits} CR`}</span>
          </span>
        </div>

        {/* 6. MAIN BUTTON ("ENTER THE GRAVEYARD" with Glowing Hex-Beveled Tablet Frame) */}
        <div className="w-full max-w-[300px] sm:max-w-sm md:max-w-md mb-4 sm:mb-5">
          <button
            type="button"
            onClick={isRoundActive ? onEnterRound1 : undefined}
            disabled={!isRoundActive}
            aria-disabled={!isRoundActive}
            className={`relative group w-full h-11 sm:h-14 flex items-center justify-center transition-all duration-300 select-none ${
              isRoundActive
                ? 'hover:scale-105 active:scale-95 cursor-pointer'
                : 'opacity-70 cursor-not-allowed'
            }`}
          >
            {/* SVG Beveled Tablet Border & Glowing Flame Fill */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible filter drop-shadow-[0_0_15px_rgba(242,122,26,0.8)] group-hover:drop-shadow-[0_0_28px_rgba(242,122,26,1)] transition-all"
              viewBox="0 0 380 64"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="btnTabletGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#5c1f06" />
                  <stop offset="50%" stopColor="#1e0802" />
                  <stop offset="100%" stopColor="#481604" />
                </linearGradient>
                <linearGradient id="btnBorderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d96818" />
                  <stop offset="50%" stopColor="#ffb24d" />
                  <stop offset="100%" stopColor="#d96818" />
                </linearGradient>
                <filter id="flameGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Tablet Outer Shape */}
              <polygon
                points="16,2 364,2 378,16 378,48 364,62 16,62 2,48 2,16"
                fill="url(#btnTabletGrad)"
                stroke="url(#btnBorderGrad)"
                strokeWidth="2.5"
                filter="url(#flameGlow)"
              />

              {/* Inner Decorative Runic Border */}
              <polygon
                points="20,6 360,6 372,18 372,46 360,58 20,58 8,46 8,18"
                fill="none"
                stroke="rgba(242, 122, 26, 0.45)"
                strokeWidth="1"
                strokeDasharray="4 2"
              />

              {/* Top and Bottom Center Diamond Jewels */}
              <polygon points="190,0 193,3 190,6 187,3" fill="#ffc857" />
              <polygon points="190,58 193,61 190,64 187,61" fill="#ffc857" />
              {/* Left and Right Center Diamond Jewels */}
              <polygon points="0,32 3,29 6,32 3,35" fill="#ffc857" />
              <polygon points="374,32 377,29 380,32 377,35" fill="#ffc857" />
            </svg>

            {/* Glowing Label */}
            <span className="relative z-10 text-[11px] sm:text-sm md:text-base font-cinzel font-black tracking-[0.2em] sm:tracking-[0.28em] text-amber-100 uppercase drop-shadow-[0_0_12px_rgba(255,200,64,0.95)] flex items-center justify-center gap-2">
              {!isRoundActive && <span className="text-amber-300 text-xs" aria-hidden="true">🔒</span>}
              ENTER THE GRAVEYARD
            </span>
          </button>
        </div>

        {/* 7. SECONDARY ACTION ("— SIGN OUT —") */}
        <button
          type="button"
          onClick={onLogout}
          className="text-xs sm:text-sm font-cinzel font-semibold tracking-[0.25em] text-stone-400 hover:text-white uppercase transition-colors cursor-pointer flex items-center gap-2 group py-1"
        >
          <span className="w-4 h-[1px] bg-stone-600 group-hover:bg-amber-400 transition-colors" aria-hidden="true" />
          <span>SIGN OUT</span>
          <span className="w-4 h-[1px] bg-stone-600 group-hover:bg-amber-400 transition-colors" aria-hidden="true" />
        </button>
      </div>
    </dialog>
  );
};
