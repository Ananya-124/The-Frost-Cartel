import React from 'react';
import type { FloorDefinition } from './FloorConfiguration';
import { AncientMapPlaceholder } from './AncientMapPlaceholder';
import { soundController } from '../../../utils/soundController';

interface FloorInteriorViewProps {
  floor: FloorDefinition;
  onReturnToExterior: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
}

export const FloorInteriorView: React.FC<FloorInteriorViewProps> = ({
  floor,
  onReturnToExterior,
  isMuted,
  onToggleMute,
  onExit,
}) => {
  const handleReturn = () => {
    if (!isMuted) {
      soundController.playClick();
    }
    onReturnToExterior();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0d0906] text-[#f4ecd8] flex flex-col font-sans overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* 1. Atmospheric Interior Stone Wall Background */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#241a10] via-[#120d08] to-[#080503]">
        {/* Subtle Architectural Texture Overlay */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#f59e0b_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b_1px,transparent_1px)] [background-size:60px_60px]" />
        {/* Warm Golden Sunlight Beams from Window */}
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-amber-400/20 via-amber-600/5 to-transparent blur-3xl pointer-events-none" />
      </div>

      {/* 2. Top Header Navigation */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-amber-500/20 bg-black/50 backdrop-blur-md">
        {/* Top-Left: Frost Cartel Emblem & Floor Badge */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400/30 to-amber-900/60 border border-amber-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,185,80,0.3)]">
            <span className="text-base sm:text-lg">💀</span>
          </div>
          <div className="flex flex-col">
            <span className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.2em] text-amber-200">
              FROST CARTEL
            </span>
            <span className="font-sans text-[10px] tracking-widest text-amber-400/80 font-semibold uppercase">
              ROUND 04 — {floor.label.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Top-Right: Sound Toggle, Return to Campus Exterior, and Exit */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onToggleMute}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-amber-500/30 bg-black/40 hover:bg-amber-950/40 text-amber-300 flex items-center justify-center text-xs transition-all hover:border-amber-400"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            onClick={handleReturn}
            className="group px-3 sm:px-4 py-1.5 sm:py-2 rounded border border-amber-500/50 bg-gradient-to-r from-amber-950/70 via-black/80 to-amber-950/70 hover:from-amber-900/80 hover:to-amber-900/80 text-amber-200 font-cinzel text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(245,185,80,0.2)] transition-all hover:border-amber-300 hover:shadow-[0_0_20px_rgba(245,185,80,0.4)]"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span>Return to Exterior</span>
          </button>

          <button
            onClick={onExit}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded border border-red-500/30 bg-red-950/30 hover:bg-red-950/60 text-red-300 font-cinzel text-xs sm:text-sm tracking-wider uppercase transition-all"
          >
            Exit
          </button>
        </div>
      </header>

      {/* 3. Main Stage Content: Mounted Wall & Ancient Map */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-8 space-y-6 max-w-6xl mx-auto w-full">
        {/* Floor Location Header */}
        <div className="text-center space-y-2 select-none">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-[11px] tracking-[0.25em] text-amber-300 uppercase font-cinzel">
            B. S. NARAYAN PLATINUM JUBILEE ACADEMIC BLOCK
          </div>
          <h1 className="font-cinzel text-xl sm:text-3xl font-bold tracking-[0.15em] text-amber-100">
            {floor.interiorTitle}
          </h1>
          <p className="font-serif italic text-amber-300/80 text-xs sm:text-sm max-w-2xl mx-auto">
            {floor.interiorDescription}
          </p>
        </div>

        {/* Mounted Wall Map Placeholder */}
        <AncientMapPlaceholder floor={floor} />
      </main>
    </div>
  );
};

