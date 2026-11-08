import React from 'react';
import { soundController } from '../../../utils/soundController';

interface Stage3HUDProps {
  secondsRemaining: number;
  stageCleared: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onReturnDashboard: () => void;
}

export const Stage3HUD: React.FC<Stage3HUDProps> = ({
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
    <header className="relative z-30 w-full px-3 sm:px-6 pt-3 pb-2 flex flex-col md:flex-row items-center justify-between gap-3 select-none">
      {/* 1. Left Emblem & Subtitle */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center shrink-0">
          <img
            src="/assets/cartel_skull_crossbones_gold.png"
            alt="Frost Cartel Sigil"
            aria-hidden="true"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.7)] hover:scale-105 transition-transform select-none"
          />
        </div>
        <div>
          <div className="font-cinzel text-xs font-black tracking-[0.2em] text-stone-100 uppercase">
            FROST CARTEL
          </div>
          <div className="text-[9px] font-cinzel font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1.5">
            <span>STAGE 03 OF 03 • 250 CREDITS</span>
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
        <div className="flex items-center gap-2">
          <span className="h-[1px] w-6 sm:w-10 bg-gradient-to-r from-transparent to-red-600" aria-hidden="true" />
          <span className="text-[9px] font-cinzel font-bold tracking-[0.3em] text-red-500 uppercase">
            ✦ ROUND 01 • STAGE 03 ✦
          </span>
          <span className="h-[1px] w-6 sm:w-10 bg-gradient-to-l from-transparent to-red-600" aria-hidden="true" />
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-cinzel font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-stone-100 via-stone-200 to-red-200 drop-shadow-[0_2px_18px_rgba(220,38,38,0.8)] flex items-center justify-center gap-2">
          <span>THE FORGOTTEN GRAVEYARD</span>
        </h1>

        {/* Small Ruby Skull Divider */}
        <div className="flex items-center gap-2 my-0.5" aria-hidden="true">
          <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          <span className="text-xs text-red-500 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]">
            💀
          </span>
          <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent via-red-500 to-transparent" />
        </div>

        <p className="text-[10px] sm:text-xs font-sans italic text-amber-200/90 tracking-wide">
          ✦ Uncover the clues, study the remains, and decode the final answer. ✦
        </p>
      </div>

      {/* 3. Right Status Badges & Quick Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Remaining Timer Capsule */}
        <div className="px-3.5 py-1.5 rounded-full bg-black/80 border border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 backdrop-blur-sm">
          <span aria-hidden="true">⏳</span>
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        {/* Credits Reward Pill */}
        <div className="px-3.5 py-1.5 rounded-full bg-black/80 border border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 backdrop-blur-sm">
          <span aria-hidden="true">💰</span>
          <span>250 CR</span>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="w-8 h-8 rounded-full bg-black/80 border border-amber-600/70 hover:border-amber-400 text-amber-300 flex items-center justify-center text-xs transition-colors cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.8)] backdrop-blur-sm"
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
          className="px-4 py-1.5 rounded-full bg-black/80 hover:bg-red-950/80 border border-stone-600 hover:border-red-500 text-stone-200 hover:text-white font-cinzel text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md backdrop-blur-sm"
        >
          EXIT
        </button>
      </div>
    </header>
  );
};

