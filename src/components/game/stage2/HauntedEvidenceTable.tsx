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

  // Irregular scattered angles and depth layering for the 8 photographs
  const photoStyles: Record<string, { rotation: number; defaultZ: number; translateOffset: string }> = {
    img_01: { rotation: -3.8, defaultZ: 10, translateOffset: 'translate-y-0 sm:translate-y-1' },
    img_02: { rotation: 1.8, defaultZ: 12, translateOffset: '-translate-y-1 sm:-translate-y-2' },
    img_03: { rotation: -1.5, defaultZ: 11, translateOffset: 'translate-y-1 sm:translate-y-2' },
    img_04: { rotation: 3.2, defaultZ: 13, translateOffset: '-translate-y-1 sm:translate-y-0' },
    img_05: { rotation: -2.4, defaultZ: 14, translateOffset: 'translate-y-2 sm:translate-y-1' },
    img_06: { rotation: 1.2, defaultZ: 15, translateOffset: '-translate-y-1 sm:-translate-y-3' },
    img_07: { rotation: -3.0, defaultZ: 13, translateOffset: 'translate-y-1 sm:translate-y-2' },
    img_08: { rotation: 2.5, defaultZ: 12, translateOffset: '-translate-y-2 sm:translate-y-0' },
  };

  return (
    <div
      aria-label="Detective Evidence Table"
      className="relative flex-1 w-full max-w-[1400px] mx-auto min-h-[460px] sm:min-h-[540px] md:min-h-[580px] rounded-3xl border-2 border-amber-900/50 shadow-[inset_0_0_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col justify-center p-3 sm:p-6 select-none"
      style={{
        backgroundImage: "url('/assets/stage-2/evidence-board/detective-table-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 1. Deep Atmospheric Dark Wood Table Texture & Radial Vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-radial from-black/20 via-black/60 to-black/90 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-black/80 pointer-events-none"
      />

      {/* 2. Interactive Scattered Photo Arrangement (2 Rows of 4 Irregular Overlapping Photos) */}
      <div className="relative z-20 w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 py-2 sm:py-4">
        {images.map((img) => {
          const isHinted = activeHintImageId === img.id;
          const isHovered = hoveredImageId === img.id;
          const styleConfig = photoStyles[img.id] || { rotation: 0, defaultZ: 10, translateOffset: '' };
          const zIndex = isHovered || isHinted ? 30 : styleConfig.defaultZ;

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
                transform: `rotate(${isHovered ? 0 : styleConfig.rotation}deg) scale(${isHovered ? 1.05 : 1})`,
                zIndex,
              }}
              aria-label={`Inspect Evidence Photograph: ${img.title}`}
              className={`group relative p-2 sm:p-2.5 pb-5 sm:pb-7 rounded-sm bg-[#e8dec8] text-stone-900 shadow-[0_12px_28px_rgba(0,0,0,0.85)] border border-[#c4b79b] cursor-pointer transition-all duration-300 ease-out flex flex-col items-center select-none ${styleConfig.translateOffset} ${
                isHinted
                  ? 'ring-4 ring-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.9)] animate-pulse'
                  : 'hover:shadow-[0_20px_45px_rgba(0,0,0,0.95)] hover:border-amber-500/80'
              }`}
            >
              {/* Antique Metal Binder Clip at Top Apex */}
              <div
                aria-hidden="true"
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-5 rounded-t-sm bg-gradient-to-b from-[#8a7251] via-[#5c4a32] to-[#3a2c1a] border border-[#d4af37]/60 shadow-md z-30 pointer-events-none"
              >
                <div className="w-3 h-1.5 mx-auto mt-1 rounded-full bg-[#1c140d]" />
              </div>

              {/* Distressed Photograph Inner Frame */}
              <div className="relative w-full aspect-[4/3] rounded-[2px] overflow-hidden bg-black border border-stone-800 shadow-inner">
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

