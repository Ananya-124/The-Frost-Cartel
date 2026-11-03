import React from 'react';
import { soundController } from '../../../utils/soundController';

interface Stage2HUDProps {
  secondsRemaining: number;
  stageCleared: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onReturnDashboard: () => void;
}

export const Stage2HUD: React.FC<Stage2HUDProps> = ({
  secondsRemaining,
  stageCleared,
  isMuted,
  onToggleMute,
  onReturnDashboard,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="relative z-30 w-full max-w-[1400px] mx-auto px-2 sm:px-4 pt-2 sm:pt-3 pb-2 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-amber-900/40">
      {/* 1. Left Emblem & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-stone-950 border-2 border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center text-lg">
          💀
        </div>
        <div>
          <div className="font-cinzel text-xs sm:text-sm font-black tracking-[0.2em] text-stone-100 uppercase">
            FROST CARTEL
          </div>
          <div className="text-[9px] sm:text-[10px] font-cinzel font-bold text-amber-400/90 tracking-widest uppercase flex items-center gap-1.5">
            <span>STAGE 02 OF 03 • 150 CREDITS</span>
            {stageCleared && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 text-[8px] font-bold">
                COMPLETED ✓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Center Header Title & Tagline */}
      <div className="flex flex-col items-center text-center">
        <div className="text-[10px] sm:text-[11px] font-cinzel font-bold tracking-[0.3em] text-amber-400 uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          ✦ STAGE 02 ✦
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-cinzel font-black tracking-wider text-stone-100 drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]">
          The Haunted Image Hunt
        </h1>
        <p className="text-[10px] sm:text-xs font-sans italic text-amber-200/80 tracking-wide mt-0.5">
          ✦ Search the evidence. Find the 12 cursed relics. ✦
        </p>
      </div>

      {/* 3. Right Status Badges & Quick Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Remaining Timer Capsule */}
        <div className="px-3 py-1.5 rounded-full bg-stone-950/90 border border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300">
          <span aria-hidden="true">⏳</span>
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        {/* Credits Reward Pill */}
        <div className="px-3 py-1.5 rounded-full bg-stone-950/90 border border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300">
          <span aria-hidden="true">💰</span>
          <span>150 CR</span>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="w-8 h-8 rounded-full bg-stone-950 border border-amber-600/60 hover:border-amber-400 text-amber-300 flex items-center justify-center text-xs transition-colors cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.8)]"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Exit to Round Dashboard */}
        <button
          type="button"
          onClick={() => {
            soundController.playClick();
            onReturnDashboard();
          }}
          aria-label="Exit Stage"
          className="px-3 py-1.5 rounded-full bg-stone-950/90 hover:bg-red-950/60 border border-stone-700 hover:border-red-500/80 text-stone-300 hover:text-white font-cinzel text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
        >
          EXIT
        </button>
      </div>
    </header>
  );
};

