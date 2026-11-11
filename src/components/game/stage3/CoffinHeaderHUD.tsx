import React from 'react';
import { soundController } from '../../../utils/soundController';
import { type Round1TimerStore, useRound1TimerSeconds } from '../round1TimerStore';

interface CoffinHeaderHUDProps {
  graveNumber?: 'GRAVE I' | 'GRAVE II' | 'GRAVE III' | null;
  title: 'THE MARKED REMAINS' | 'THE BURIED DIARY' | 'THE FINAL TESTAMENT';
  timerStore: Round1TimerStore;
  stageCleared: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onReturnDashboard: () => void;
}

export const CoffinHeaderHUD: React.FC<CoffinHeaderHUDProps> = ({
  graveNumber,
  title,
  timerStore,
  stageCleared: _stageCleared,
  isMuted,
  onToggleMute,
  onReturnDashboard,
}) => {
  const secondsRemaining=useRound1TimerSeconds(timerStore);
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="relative z-30 w-full px-4 sm:px-6 py-2 grid grid-cols-[1fr_auto_1fr] items-center select-none">
      {/* 1. Top-Left: Frost Cartel Skull Crest & Stage Indicator */}
      <div className="justify-self-start flex items-center gap-2.5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-amber-600/30 to-black/80 border border-amber-500/60 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.25)] flex-shrink-0">
          <span className="text-sm sm:text-base filter drop-shadow">💀</span>
        </div>
        <div className="flex flex-col">
          <span className="font-cinzel text-[11px] sm:text-xs font-black tracking-widest text-amber-100 uppercase whitespace-nowrap">
            FROST CARTEL
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono tracking-wider text-amber-400/80 whitespace-nowrap">
            STAGE 03 OF 03 • 250 CREDITS
          </span>
        </div>
      </div>

      {/* 2. Top-Center: Single Approved Page Title (Truly Centered via CSS Grid) */}
      <div className="justify-self-center flex flex-col items-center justify-center text-center px-2 pointer-events-none">
        {graveNumber && (
          <span className="text-[10px] font-cinzel font-bold text-amber-400 tracking-widest uppercase mb-0.5">
            {graveNumber}
          </span>
        )}
        <h2 className="font-cinzel text-sm sm:text-base md:text-lg font-black tracking-[0.2em] text-amber-200 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] whitespace-nowrap">
          {title}
        </h2>
        <div className="flex items-center gap-1.5 text-amber-500/70 text-[10px] mt-0.5" aria-hidden="true">
          <span className="w-8 sm:w-12 h-[1px] bg-gradient-to-r from-transparent to-amber-500/60" />
          <span>💀</span>
          <span className="w-8 sm:w-12 h-[1px] bg-gradient-to-l from-transparent to-amber-500/60" />
        </div>
      </div>

      {/* 3. Top-Right: Live Timer, Credits, Audio, Exit */}
      <div className="justify-self-end flex items-center gap-2 sm:gap-2.5">
        <div className="px-3 py-1 rounded-full bg-black/80 border border-amber-500/70 shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 backdrop-blur-sm whitespace-nowrap">
          <span aria-hidden="true">⏳</span>
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        <div className="px-3 py-1 rounded-full bg-black/80 border border-amber-500/70 shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 hidden sm:flex backdrop-blur-sm whitespace-nowrap">
          <span aria-hidden="true">🪙</span>
          <span>250 CR</span>
        </div>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="w-8 h-8 rounded-full bg-black/80 border border-amber-600/70 hover:border-amber-400 text-amber-300 flex items-center justify-center text-xs transition-colors cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.8)] backdrop-blur-sm outline-none"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            soundController.playClick();
            onReturnDashboard();
          }}
          aria-label="Exit Stage"
          className="px-3.5 sm:px-4 py-1 rounded-full bg-black/80 hover:bg-red-950/80 border border-stone-600 hover:border-red-500 text-stone-200 hover:text-white font-cinzel text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md backdrop-blur-sm outline-none whitespace-nowrap"
        >
          EXIT
        </button>
      </div>
    </header>
  );
};
