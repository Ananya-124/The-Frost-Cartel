import React from 'react';
import { soundController } from '../../../utils/soundController';

interface Stage3HUDProps {
  secondsRemaining: number;
  stageCleared: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onReturnDashboard: () => void;
  teamName?: string;
  credits?: number;
}

export const Stage3HUD: React.FC<Stage3HUDProps> = ({
  secondsRemaining,
  stageCleared,
  isMuted,
  onToggleMute,
  onReturnDashboard,
  teamName = 'FROST CARTEL',
  credits = 250,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="relative z-30 w-full px-4 sm:px-8 py-3 flex items-center justify-between select-none">
      {/* 1. Left: Frost Cartel Coin Emblem, Team Name, Stage 03 of 03 & Credits */}
      <div className="flex items-center gap-3">
        {/* Ornate Circular Skull Medal / Emblem */}
        <div className="relative flex items-center justify-center shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#2a1708] via-[#120a04] to-[#050201] border border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.4)] p-1.5">
          <img
            src="/assets/cartel_skull_crossbones_gold.png"
            alt="Frost Cartel Sigil"
            aria-hidden="true"
            className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]"
          />
        </div>

        <div className="flex flex-col">
          <div className="font-cinzel text-xs sm:text-sm font-black tracking-[0.2em] text-stone-100 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {teamName}
          </div>
          <div className="text-[9px] sm:text-[10px] font-cinzel font-bold text-amber-400/90 tracking-widest uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span>STAGE 03 OF 03 • {credits} CREDITS</span>
            {stageCleared && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 text-[8px] font-bold shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                COMPLETED ✓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Right: Timer, Credits Capsule, Audio Mute Toggle, Exit Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Countdown Timer Pill */}
        <div className="px-3.5 py-1.5 rounded-full bg-black/85 border border-amber-600/70 shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 backdrop-blur-md">
          <span aria-hidden="true" className="text-amber-400 text-xs">⏳</span>
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        {/* Current Credits Indicator Pill */}
        <div className="px-3.5 py-1.5 rounded-full bg-black/85 border border-amber-600/70 shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-1.5 text-xs font-cinzel font-bold text-amber-300 backdrop-blur-md">
          <span aria-hidden="true" className="text-amber-400 text-xs">👑</span>
          <span>{credits} CR</span>
        </div>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="w-8 h-8 rounded-full bg-black/85 border border-amber-600/70 hover:border-amber-400 text-amber-300 flex items-center justify-center text-xs transition-all cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.8)] backdrop-blur-md hover:scale-105 active:scale-95"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Exit Button */}
        <button
          type="button"
          onClick={() => {
            soundController.playClick();
            onReturnDashboard();
          }}
          aria-label="Exit Stage"
          className="px-4 py-1.5 rounded-full bg-black/85 hover:bg-red-950/80 border border-stone-600 hover:border-red-500 text-stone-200 hover:text-white font-cinzel text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md backdrop-blur-md hover:scale-105 active:scale-95"
        >
          EXIT
        </button>
      </div>
    </header>
  );
};
