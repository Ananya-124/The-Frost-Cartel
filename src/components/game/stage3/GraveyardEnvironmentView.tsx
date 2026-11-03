import React, { useState } from 'react';
import type { Stage3Config } from '../../../types/round1.types';
import { soundController } from '../../../utils/soundController';
import { FlyingBat } from '../haunted/FlyingBat';
import { FlyingCrow } from '../haunted/FlyingCrow';
import { FloatingGhost } from '../haunted/FloatingGhost';

interface GraveyardEnvironmentViewProps {
  config: Stage3Config;
  collectedFragments: string[];
  isCompleted: boolean;
  onSelectCoffin: (coffinId: 'coffin1' | 'coffin2' | 'coffin3') => void;
  onOpenJournal: () => void;
  onOpenFinalGate: () => void;
}

export const GraveyardEnvironmentView: React.FC<GraveyardEnvironmentViewProps> = ({
  config: _config,
  collectedFragments,
  isCompleted,
  onSelectCoffin,
  onOpenJournal,
  onOpenFinalGate,
}) => {
  const [hoveredCoffin, setHoveredCoffin] = useState<'coffin1' | 'coffin2' | 'coffin3' | null>(null);

  const handleCoffinClick = (coffinId: 'coffin1' | 'coffin2' | 'coffin3') => {
    soundController.playClick();
    onSelectCoffin(coffinId);
  };

  return (
    <div className="relative w-full h-[620px] sm:h-[700px] lg:h-[780px] rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.95)] select-none bg-black/40">
      {/* 1. Master High-Resolution Graveyard Art Background (Cleaned of all HUD) */}
      <img
        src="/assets/stage-3/background/graveyard_stage3_master.jpg"
        alt="The Forgotten Graveyard Grounds"
        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.94] contrast-[1.05] pointer-events-none"
      />

      {/* 2. Atmospheric Live Creatures: Flapping Bats & Gliding Crows */}
      <FlyingBat startYPercent={8} durationSeconds={16} delaySeconds={1} scale={0.7} flightDirection="right-to-left" />
      <FlyingBat startYPercent={18} durationSeconds={22} delaySeconds={9} scale={0.5} flightDirection="left-to-right" />
      <FlyingCrow startYPercent={12} durationSeconds={24} delaySeconds={4} scale={0.8} flightDirection="left-to-right" />
      <FlyingCrow startYPercent={22} durationSeconds={26} delaySeconds={14} scale={0.65} flightDirection="right-to-left" />

      {/* 3. Translucent Ghost Apparition Drifting Across Tombstones */}
      <FloatingGhost
        side="left"
        className="top-[32%] left-[12%] opacity-35 mix-blend-screen filter drop-shadow-[0_0_20px_rgba(127,229,217,0.5)] animate-ghost-drift"
      />

      {/* 4. Atmospheric Ambient Light & Volumetric Ground Mist */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/25"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-44 mist-overlay opacity-55 animate-fog-roll pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-32 pointer-events-none bg-gradient-to-t from-black via-black/40 to-transparent"
      />

      {/* 5. Three Natural Interactive Coffin Zones (Direct Mouse Investigation - NO Square Blue Boxes!) */}

      {/* COFFIN I: Left Coffin (The Marked Remains) */}
      <button
        type="button"
        aria-label="Inspect Coffin I: The Marked Remains"
        onClick={() => handleCoffinClick('coffin1')}
        onMouseEnter={() => setHoveredCoffin('coffin1')}
        onMouseLeave={() => setHoveredCoffin(null)}
        style={{ left: '24%', top: '64%' }}
        className="absolute -translate-x-1/2 -translate-y-1/2 w-48 sm:w-60 h-80 sm:h-96 z-10 cursor-pointer group bg-transparent border-0 p-0 text-left outline-none"
      >
        {/* Organic soft silhouette glow on hover */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 rounded-[35px] transition-all duration-300 pointer-events-none ${
            hoveredCoffin === 'coffin1'
              ? 'bg-amber-500/15 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]'
              : 'opacity-0'
          }`}
        />

        {/* Floating Organic Identifier Pill */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/85 border border-red-500/70 text-[10px] font-cinzel font-bold text-amber-300 whitespace-nowrap shadow-md flex items-center gap-1.5 transition-all duration-200 group-hover:scale-105 group-hover:border-amber-400">
          <span>{collectedFragments.includes('THE') ? '✅' : '💀'}</span>
          <span>COFFIN I • THE MARKED REMAINS</span>
        </div>
      </button>

      {/* COFFIN II: Center Coffin (The Forgotten Records) */}
      <button
        type="button"
        aria-label="Inspect Coffin II: The Forgotten Records"
        onClick={() => handleCoffinClick('coffin2')}
        onMouseEnter={() => setHoveredCoffin('coffin2')}
        onMouseLeave={() => setHoveredCoffin(null)}
        style={{ left: '50%', top: '60%' }}
        className="absolute -translate-x-1/2 -translate-y-1/2 w-48 sm:w-60 h-80 sm:h-96 z-10 cursor-pointer group bg-transparent border-0 p-0 text-left outline-none"
      >
        <div
          aria-hidden="true"
          className={`absolute inset-0 rounded-[35px] transition-all duration-300 pointer-events-none ${
            hoveredCoffin === 'coffin2'
              ? 'bg-amber-500/15 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]'
              : 'opacity-0'
          }`}
        />

        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/85 border border-red-500/70 text-[10px] font-cinzel font-bold text-amber-300 whitespace-nowrap shadow-md flex items-center gap-1.5 transition-all duration-200 group-hover:scale-105 group-hover:border-amber-400">
          <span>{collectedFragments.includes('NIGHT') ? '✅' : '📖'}</span>
          <span>COFFIN II • THE FORGOTTEN RECORDS</span>
        </div>
      </button>

      {/* COFFIN III: Right Coffin (The Final Testament) */}
      <button
        type="button"
        aria-label="Inspect Coffin III: The Final Testament"
        onClick={() => handleCoffinClick('coffin3')}
        onMouseEnter={() => setHoveredCoffin('coffin3')}
        onMouseLeave={() => setHoveredCoffin(null)}
        style={{ left: '76%', top: '64%' }}
        className="absolute -translate-x-1/2 -translate-y-1/2 w-48 sm:w-60 h-80 sm:h-96 z-10 cursor-pointer group bg-transparent border-0 p-0 text-left outline-none"
      >
        <div
          aria-hidden="true"
          className={`absolute inset-0 rounded-[35px] transition-all duration-300 pointer-events-none ${
            hoveredCoffin === 'coffin3'
              ? 'bg-cyan-500/15 filter drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]'
              : 'opacity-0'
          }`}
        />

        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/85 border border-cyan-500/70 text-[10px] font-cinzel font-bold text-cyan-300 whitespace-nowrap shadow-md flex items-center gap-1.5 transition-all duration-200 group-hover:scale-105 group-hover:border-cyan-400">
          <span>{collectedFragments.includes('RETURNS') ? '✅' : '☸️'}</span>
          <span>COFFIN III • THE FINAL TESTAMENT</span>
        </div>
      </button>

      {/* 4. Bottom Controls: Evidence Journal & Submit Final Answer */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="px-3.5 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-amber-900/40 text-stone-300 text-xs font-cinzel flex items-center gap-2">
          <span>🖱️</span>
          <span>Click any coffin to inspect and move relics</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <button
          type="button"
          onClick={onOpenJournal}
          className="px-4 py-2 rounded-2xl bg-black/80 hover:bg-amber-950/80 border border-amber-600/70 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span>📜</span>
          <span>FIELD ARCHIVE ({collectedFragments.length}/3)</span>
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-20">
        <button
          type="button"
          onClick={onOpenFinalGate}
          className={`px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl font-cinzel text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-300 shadow-[0_0_25px_rgba(245,158,11,0.5)] transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2.5 ${
            isCompleted
              ? 'bg-emerald-950/90 border-2 border-emerald-500 text-emerald-200'
              : 'bg-gradient-to-r from-red-950 via-[#260f06] to-amber-950 border-2 border-amber-500 text-amber-200 hover:border-amber-400 hover:text-white'
          }`}
        >
          <span>⛩️</span>
          <span>{isCompleted ? 'ARCH-LICH GATE BREACHED ✓' : 'SUBMIT FINAL ANSWER'}</span>
        </button>
      </div>
    </div>
  );
};

