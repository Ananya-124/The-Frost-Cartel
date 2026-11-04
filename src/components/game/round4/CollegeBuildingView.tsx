import React, { useState } from 'react';
import { soundController } from '../../../utils/soundController';

interface CollegeBuildingViewProps {
  onExit: () => void;
  onReplayIntro: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onProceedToFloors?: (floorId: string) => void;
}

export const CollegeBuildingView: React.FC<CollegeBuildingViewProps> = ({
  onExit,
  onReplayIntro,
  isMuted,
  onToggleMute,
  onProceedToFloors,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [floorNotice, setFloorNotice] = useState<string | null>(null);

  const floors = [
    {
      id: 'floor-0',
      level: 'LEVEL 00',
      title: 'Grand Foyer & Marble Colonnade',
      status: 'AVAILABLE',
      description: 'The monumental entrance hall where the first ancient clues are whispered.',
      icon: '🏛️',
    },
    {
      id: 'floor-1',
      level: 'LEVEL 01',
      title: 'The Antiquities & Map Archives',
      status: 'LOCKED',
      description: 'Ancient parchment vaults, cartography desks, and historic treatises.',
      icon: '📜',
    },
    {
      id: 'floor-2',
      level: 'LEVEL 02',
      title: 'The Alchemical Laboratories',
      status: 'LOCKED',
      description: 'Historic chemistry tables, relic balance scales, and hidden cipher scrolls.',
      icon: '⚗️',
    },
    {
      id: 'floor-3',
      level: 'LEVEL 03',
      title: 'The Astronomer’s Cupola & Observatory',
      status: 'LOCKED',
      description: 'The high domed rooftop overlooking the campus, where the final Golden Relic is secured.',
      icon: '🔭',
    },
  ];

  const handleSelectFloor = (floorId: string, status: string) => {
    if (!isMuted) {
      soundController.playClick();
    }
    setSelectedFloor(floorId);
    if (status === 'LOCKED') {
      setFloorNotice('This floor is sealed until prior campus clues are documented.');
    } else {
      setFloorNotice('Floor 00 investigation unlocked. Ground reconnaissance is prepared.');
      onProceedToFloors?.(floorId);
    }
    setTimeout(() => setFloorNotice(null), 3500);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0a0d14] text-[#f4ecd8] flex flex-col font-sans overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* 1. Full-Screen Cinematic College Exterior Background */}
      <div className="fixed inset-0 z-0">
        <img
          src="/assets/round-4/college_building_exterior.jpg"
          alt="Historic College Building Campus"
          className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-105"
        />
        {/* Soft Golden Morning Sunlight Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/60" />
      </div>

      {/* 2. Minimalist Header */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b border-amber-500/20 bg-black/40 backdrop-blur-md">
        {/* Top-Left: Frost Cartel Skull & Round 04 */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400/30 to-amber-900/60 border border-amber-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,185,80,0.3)]">
            <span className="text-base sm:text-lg">💀</span>
          </div>
          <div className="flex flex-col">
            <span className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.2em] text-amber-200">
              FROST CARTEL
            </span>
            <span className="font-sans text-[10px] tracking-widest text-amber-400/80 font-semibold uppercase">
              ROUND 04 — THE CAMPUS HUNT
            </span>
          </div>
        </div>

        {/* Top-Right: Replay, Sound, Exit */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Replay Intro Transition */}
          <button
            type="button"
            onClick={onReplayIntro}
            aria-label="Replay the Messenger Dove Intro"
            className="h-8 px-3 rounded-full bg-black/60 hover:bg-amber-950/60 border border-amber-500/40 text-amber-200 font-cinzel text-[11px] font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🕊️</span>
            <span className="hidden sm:inline">Intro</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-amber-950/60 border border-amber-500/40 text-amber-200 flex items-center justify-center transition-all cursor-pointer"
          >
            <span className="text-xs">{isMuted ? '🔇' : '🔊'}</span>
          </button>

          {/* Exit Control */}
          <button
            type="button"
            onClick={onExit}
            aria-label="Exit Round 4 and return to Home"
            className="h-8 px-4 rounded-full bg-black/60 hover:bg-red-950/60 border border-red-500/40 hover:border-red-400 text-red-200 font-cinzel text-[11px] font-bold tracking-wider transition-all cursor-pointer"
          >
            EXIT
          </button>
        </div>
      </header>

      {/* Temporary Notice Pill */}
      {floorNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-black/90 border border-amber-400 text-xs font-cinzel text-amber-200 shadow-[0_0_20px_rgba(245,185,80,0.4)] animate-fadeIn">
          {floorNotice}
        </div>
      )}

      {/* 3. Main Campus Hub Content */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-between">
        {/* Title & Lore Banner */}
        <div className="text-center max-w-2xl mx-auto mb-8 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 font-cinzel text-[10px] tracking-widest uppercase mb-3">
            <span>✨</span>
            <span>DESTINATION REACHED • TIME PORTAL SYNCHRONIZED</span>
          </div>
          <h1 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[0.18em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] uppercase">
            THE COLLEGE OF OCCULT SCIENCES
          </h1>
          <p className="mt-3 font-serif italic text-sm sm:text-base text-amber-100/80 leading-relaxed">
            Four floors of lost lore. The Golden Relic is hidden somewhere within these sacred academic halls.
          </p>
        </div>

        {/* 4 Floor Selection Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 my-auto">
          {floors.map((fl) => {
            const isSelected = selectedFloor === fl.id;
            const isAvailable = fl.status === 'AVAILABLE';

            return (
              <div
                key={fl.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectFloor(fl.id, fl.status)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectFloor(fl.id, fl.status);
                  }
                }}
                className={`relative rounded-xl p-5 border transition-all duration-300 text-left flex flex-col justify-between cursor-pointer select-none ${
                  isSelected
                    ? 'bg-amber-950/80 border-amber-400 shadow-[0_0_30px_rgba(245,185,80,0.4)] scale-102'
                    : isAvailable
                    ? 'bg-black/65 hover:bg-black/80 border-amber-500/50 hover:border-amber-400 hover:scale-102 shadow-lg'
                    : 'bg-black/50 border-amber-900/30 opacity-70 hover:opacity-90 hover:border-amber-700/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{fl.icon}</span>
                    <span
                      className={`text-[10px] font-cinzel font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isAvailable
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                          : 'bg-stone-900/80 text-stone-400 border border-stone-700/40'
                      }`}
                    >
                      {fl.status}
                    </span>
                  </div>
                  <span className="text-[10px] font-cinzel tracking-widest text-amber-400/80 uppercase block">
                    {fl.level}
                  </span>
                  <h3 className="font-cinzel text-base font-bold text-amber-100 mt-1 leading-snug">
                    {fl.title}
                  </h3>
                  <p className="text-xs font-serif text-stone-300/80 mt-2 line-clamp-3">
                    {fl.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-500/15 flex items-center justify-between text-[11px] font-cinzel text-amber-300/90 font-semibold">
                  <span>{isAvailable ? 'INVESTIGATE FLOOR' : 'SEALED PROTOCOL'}</span>
                  <span>{isAvailable ? '→' : '🔒'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center pt-8 text-xs text-amber-200/50 font-serif">
          Campus floor map puzzles are configured for Phase 2 tournament deployment.
        </div>
      </main>
    </div>
  );
};
