import React from 'react';
import type { TeamSession } from '../../../types/team.types';

interface GothicRound1HUDProps {
  session: TeamSession;
  secondsRemaining: number;
  isTeamStarted: boolean;
  credits: number;
  isMuted: boolean;
  durationMinutes: number;
  onToggleMute: () => void;
  onReturnHome: () => void;
}

export const GothicRound1HUD: React.FC<GothicRound1HUDProps> = ({
  session,
  secondsRemaining,
  isTeamStarted,
  credits,
  isMuted,
  durationMinutes,
  onToggleMute,
  onReturnHome,
}) => {
  const formatTimer = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = secondsRemaining < 180 && isTeamStarted;

  return (
    <header className="relative z-30 w-full px-2.5 sm:px-6 md:px-8 pt-2.5 sm:pt-4 pb-1.5 sm:pb-2 flex items-center justify-between select-none">
      {/* 1. Left: Compact Squad Identity */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Small Skull Emblem Medallion */}
        <div className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-amber-600/60 bg-gradient-to-b from-[#220a0a] via-black to-[#140505] flex items-center justify-center shadow-[0_0_12px_rgba(242,122,26,0.4)] shrink-0">
          <img
            src="/assets/gothic_skull_emblem.png"
            alt=""
            aria-hidden="true"
            className="w-4 h-4 sm:w-5.5 sm:h-5.5 object-contain filter drop-shadow-[0_0_6px_rgba(242,122,26,0.9)]"
          />
        </div>

        {/* Team Title & Compact Tag */}
        <div className="flex flex-col text-left">
          <h2 className="text-[11px] sm:text-sm md:text-base font-bold font-gothic tracking-wider text-stone-100 uppercase leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] line-clamp-1">
            {session.teamName}
          </h2>
          <span className="text-[7.5px] sm:text-[9px] font-cinzel text-amber-500/90 font-semibold tracking-wider uppercase flex items-center gap-0.5 sm:gap-1 drop-shadow-[0_1px_3px_rgba(242,122,26,0.4)]">
            <span aria-hidden="true">👥</span>
            <span>AUTHENTICATED</span>
          </span>
        </div>
      </div>

      {/* 2. Right: Compact Floating Stats Pills, Audio & Exit */}
      <div className="flex items-center space-x-1 sm:space-x-2.5 shrink-0">
        {/* Countdown Timer Pill */}
        <div
          className={`flex items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-3 py-1 rounded-md border text-[9px] sm:text-xs font-mono font-bold transition-all shadow-md backdrop-blur-md ${
            isLowTime
              ? 'bg-red-950/90 border-red-500 text-red-200 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]'
              : 'bg-black/85 border-amber-500/50 text-amber-300 shadow-[0_0_8px_rgba(246,166,58,0.25)]'
          }`}
          title="Round 1 Remaining Time"
        >
          <span aria-hidden="true">⏳</span>
          <span className="tracking-wider">
            {isTeamStarted ? formatTimer(secondsRemaining) : `${durationMinutes}:00`}
          </span>
        </div>

        {/* Bounty Credits Pill */}
        <div
          className="flex items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-3 py-1 rounded-md bg-black/85 border border-amber-500/50 text-[9px] sm:text-xs font-mono font-bold text-amber-300 shadow-[0_0_8px_rgba(246,166,58,0.25)] backdrop-blur-md"
          title="Round 1 Credit Yield"
        >
          <span aria-hidden="true">💰</span>
          <span className="tracking-wider">{credits} / 500 CR</span>
        </div>

        {/* Audio Mute Toggle Button */}
        <button
          type="button"
          onClick={onToggleMute}
          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/85 hover:bg-stone-900 border border-stone-700/80 hover:border-amber-500/70 text-stone-300 hover:text-white transition-all cursor-pointer flex items-center justify-center text-[10px] sm:text-xs backdrop-blur-md shadow-md"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          <span aria-hidden="true">{isMuted ? '🔇' : '🔊'}</span>
        </button>

        {/* Exit Button */}
        <button
          type="button"
          onClick={onReturnHome}
          className="h-6 sm:h-8 px-2 sm:px-3 rounded-md bg-black/85 hover:bg-stone-900 border border-stone-700/80 hover:border-red-500/70 text-stone-300 hover:text-white font-cinzel text-[9px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center backdrop-blur-md shadow-md"
          title="Exit to Sanctuary"
          aria-label="Exit"
        >
          <span>EXIT</span>
        </button>
      </div>
    </header>
  );
};
