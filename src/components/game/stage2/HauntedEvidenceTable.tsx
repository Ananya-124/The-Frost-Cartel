import React, { useState } from 'react';
import type { HuntImage } from '../../../types/round1.types';

interface HauntedEvidenceTableProps {
  images: HuntImage[];
  activeHintImageId: string | null;
  onOpenImage: (image: HuntImage) => void;
}

export const HauntedEvidenceTable: React.FC<HauntedEvidenceTableProps> = ({
  images,
  activeHintImageId,
  onOpenImage,
}) => {
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);

  // Irregular scattered angles, offsets and depth layering for the 8 photographs
  const photoConfigs: Record<
    string,
    { rotation: number; defaultZ: number; translateOffset: string; aspect: string }
  > = {
    img_01: { rotation: -3.8, defaultZ: 10, translateOffset: 'translate-y-0 sm:translate-y-1', aspect: 'aspect-[4/3]' },
    img_02: { rotation: 2.5, defaultZ: 12, translateOffset: '-translate-y-1 sm:-translate-y-2', aspect: 'aspect-[4/3]' },
    img_03: { rotation: -1.8, defaultZ: 11, translateOffset: 'translate-y-1 sm:translate-y-2', aspect: 'aspect-[4/3]' },
    img_04: { rotation: 3.2, defaultZ: 13, translateOffset: '-translate-y-1 sm:translate-y-0', aspect: 'aspect-[4/3]' },
    img_05: { rotation: -2.8, defaultZ: 14, translateOffset: 'translate-y-2 sm:translate-y-1', aspect: 'aspect-[4/3]' },
    img_06: { rotation: 1.8, defaultZ: 15, translateOffset: '-translate-y-1 sm:-translate-y-3', aspect: 'aspect-[4/3]' },
    img_07: { rotation: -3.2, defaultZ: 13, translateOffset: 'translate-y-1 sm:translate-y-2', aspect: 'aspect-[4/3]' },
    img_08: { rotation: 2.8, defaultZ: 12, translateOffset: '-translate-y-2 sm:translate-y-0', aspect: 'aspect-[4/3]' },
  };

  return (
    <div
      aria-label="Detective Evidence Table"
      className="relative flex-1 w-full min-h-[480px] sm:min-h-[550px] md:min-h-[600px] flex flex-col justify-center px-2 sm:px-6 py-4 select-none overflow-hidden"
    >
      {/* 1. Dramatic Ambient Lighting & Table Surface Environment */}
      {/* Warm Golden Desk Lamp Radial Spotlight (shining from left desk area) */}
      <div
        aria-hidden="true"
        className="absolute -top-16 -left-16 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400/25 via-amber-600/10 to-transparent pointer-events-none filter blur-2xl z-0"
      />

      {/* Atmospheric Fog & Vignette Across Table */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none z-0"
      />

      {/* 2. Physical Detective Props on the Table Surface */}
      {/* Left Props: Brass Gooseneck Lamp Glow & Parchment Dossier */}
      <div
        aria-hidden="true"
        className="absolute -left-4 sm:left-2 bottom-6 sm:bottom-12 w-28 sm:w-36 md:w-44 opacity-80 pointer-events-none z-10 filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)]"
      >
        {/* Layered Parchment Case Files */}
        <div className="relative w-full h-20 sm:h-28 rounded-sm bg-[#cbb898] border border-[#8a7251] shadow-2xl rotate-[-8deg] -translate-x-3">
          <div className="absolute inset-1 border border-[#a48e6c] opacity-60 flex flex-col justify-between p-2">
            <span className="font-mono text-[7px] text-[#4a3b2c] tracking-widest uppercase">
              CONFIDENTIAL • CARTEL DOSSIER
            </span>
            <div className="h-0.5 w-12 bg-[#8a7251]/60" />
          </div>
        </div>
      </div>

      {/* Antique Brass Magnifying Glass (Near Case Files) */}
      <div
        aria-hidden="true"
        className="absolute left-6 sm:left-14 bottom-2 sm:bottom-4 w-20 sm:w-28 md:w-32 opacity-85 pointer-events-none z-20 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.98)]"
      >
        <img
          src="/assets/stage-02/decorations/desk_magnifying_glass.png"
          alt=""
          className="w-full h-auto object-contain -rotate-45"
        />
      </div>

      {/* Top Left: Flickering Altar Candle */}
      <div
        aria-hidden="true"
        className="absolute top-1 sm:top-2 left-2 sm:left-6 w-14 sm:w-20 md:w-24 opacity-75 pointer-events-none z-10 filter drop-shadow-[0_0_24px_rgba(245,158,11,0.7)]"
      >
        <img
          src="/assets/stage-02/decorations/desk_candle.png"
          alt=""
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Top Right: Crimson Wax Seal */}
      <div
        aria-hidden="true"
        className="absolute top-2 sm:top-4 right-4 sm:right-10 w-12 sm:w-16 opacity-85 pointer-events-none z-10 filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.95)]"
      >
        <img
          src="/assets/stage-02/decorations/desk_wax_seal.png"
          alt=""
          className="w-full h-auto object-contain rotate-12"
        />
      </div>

      {/* Bottom Right: Antique Brass Skeleton Key */}
      <div
        aria-hidden="true"
        className="absolute bottom-2 sm:bottom-4 right-6 sm:right-16 w-16 sm:w-24 opacity-80 pointer-events-none z-10 filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.95)]"
      >
        <img
          src="/assets/stage-02/decorations/desk_brass_key_clean.png"
          alt=""
          className="w-full h-auto object-contain rotate-45"
        />
      </div>

      {/* 3. Interactive Scattered Photo Arrangement (2 Rows of 4 Irregular Overlapping Photos) */}
      <div className="relative z-20 w-full max-w-[1400px] mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 py-2 sm:py-4">
        {images.map((img) => {
          const isHinted = activeHintImageId === img.id;
          const isHovered = hoveredImageId === img.id;
          const styleConfig =
            photoConfigs[img.id] || { rotation: 0, defaultZ: 10, translateOffset: '', aspect: 'aspect-[4/3]' };
          const zIndex = isHovered || isHinted ? 35 : styleConfig.defaultZ;

          return (
            <div
              key={img.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenImage(img)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenImage(img);
                }
              }}
              onMouseEnter={() => setHoveredImageId(img.id)}
              onMouseLeave={() => setHoveredImageId(null)}
              style={{
                transform: `rotate(${isHovered ? 0 : styleConfig.rotation}deg) scale(${
                  isHovered ? 1.05 : 1
                })`,
                zIndex,
              }}
              aria-label={`Inspect Evidence Photograph: ${img.title}`}
              className={`group relative p-2 sm:p-2.5 pb-4 sm:pb-6 rounded-[2px] bg-[#f5f0e6] text-stone-900 shadow-[0_14px_32px_rgba(0,0,0,0.9),0_2px_4px_rgba(0,0,0,0.4)] border border-[#d6cbbb] cursor-pointer transition-all duration-300 ease-out flex flex-col items-center select-none ${
                styleConfig.translateOffset
              } ${
                isHinted
                  ? 'ring-4 ring-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.95)] animate-pulse'
                  : 'hover:shadow-[0_26px_55px_rgba(0,0,0,0.98)] hover:border-amber-500/90'
              }`}
            >
              {/* Antique Metal Binder Clip / Brass Tack at Top Apex */}
              <div
                aria-hidden="true"
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-5 rounded-t-sm bg-gradient-to-b from-[#8a7251] via-[#5c4a32] to-[#3a2c1a] border border-[#d4af37]/70 shadow-md z-30 pointer-events-none"
              >
                <div className="w-3 h-1.5 mx-auto mt-1 rounded-full bg-[#1c140d]" />
              </div>

              {/* Distressed Photograph Inner Frame */}
              <div className="relative w-full aspect-[4/3] rounded-[1px] overflow-hidden bg-black border border-stone-800 shadow-inner">
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  loading="eager"
                  className="w-full h-full object-cover object-center filter contrast-105 saturate-[0.95] group-hover:contrast-115 group-hover:scale-105 transition-all duration-500 pointer-events-none"
                />

                {/* Subtle Polaroid Aged Tint & Edge Vignette */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-stone-950/20 pointer-events-none"
                />

                {/* Hint Indicator Badge */}
                {isHinted && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-950/90 border border-amber-400 text-amber-300 text-[9px] font-cinzel font-bold tracking-widest uppercase shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-bounce">
                    CLUE UNSEALED ✦
                  </div>
                )}
              </div>

              {/* Weathered Handwritten / Typewriter Photo Title */}
              <div className="w-full mt-2 sm:mt-2.5 px-1 text-center">
                <h3 className="font-cinzel text-[10px] sm:text-xs font-bold tracking-wider text-[#2d2417] truncate drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                  {img.title}
                </h3>
                <span className="text-[8px] sm:text-[9px] font-mono text-[#6e5d44] tracking-widest uppercase block mt-0.5">
                  Click to Inspect
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
