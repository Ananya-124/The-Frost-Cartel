import React from 'react';
import { soundController } from '../../../utils/soundController';

interface CoffinHeaderHUDProps {
  graveNumber: 'GRAVE I' | 'GRAVE II' | 'GRAVE III';
  title: 'THE MARKED REMAINS' | 'THE BURIED DIARY' | 'THE FINAL TESTAMENT';
  secondsRemaining: number;
  stageCleared: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onReturnDashboard: () => void;
}

export const CoffinHeaderHUD: React.FC<CoffinHeaderHUDProps> = ({
  graveNumber,
  title,
  secondsRemaining,
  stageCleared: _stageCleared,
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
    <header className="relative z-30 w-full px-3 sm:px-6 pt-3 pb-2 flex items-center justify-between select-none">
      {/* 1. Accessible Headings (Preserves semantic DOM hierarchy while letting master artwork shine) */}
      <div className="sr-only">
        <h1>FROST CARTEL • {graveNumber}</h1>
        <h2>{title}</h2>
      </div>

      {/* Flexible Spacer */}
      <div className="flex-1" />

      {/* 2. Top-Right: Live Interactive Timer, Credits, Audio, Exit (Overlay over image control slot) */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Live Timer */}
        <div className="px-3.5 py-1.5 rounded-full bg-black/80 border border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 backdrop-blur-sm">
          <span aria-hidden="true">⏳</span>
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        {/* 250 CR Stage Reward */}
        <div className="px-3.5 py-1.5 rounded-full bg-black/80 border border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 hidden sm:flex backdrop-blur-sm">
          <span aria-hidden="true">💰</span>
          <span>250 CR STAGE REWARD</span>
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

        {/* Exit Stage */}
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
