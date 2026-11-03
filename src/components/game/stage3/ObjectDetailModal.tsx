import React, { useState } from 'react';
import { soundController } from '../../../utils/soundController';

export type DetailObjectType =
  | 'grimoire'
  | 'diary'
  | 'book'
  | 'letter'
  | 'scroll'
  | 'skull'
  | 'crystal'
  | 'potion'
  | 'key'
  | 'generic';

export interface ObjectDetailData {
  id: string;
  name: string;
  type: DetailObjectType;
  title: string;
  subtitle?: string;
  pages?: { title: string; content: string; clue?: string }[];
  text?: string;
  clue?: string;
  markings?: string;
  rotationDeg?: number;
  revealedSecret?: string;
}

interface ObjectDetailModalProps {
  isOpen: boolean;
  data: ObjectDetailData | null;
  onClose: () => void;
  onDiscoverClue?: (clue: string) => void;
}

export const ObjectDetailModal: React.FC<ObjectDetailModalProps> = ({
  isOpen,
  data,
  onClose,
  onDiscoverClue,
}) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen || !data) return null;

  const handleNextPage = () => {
    if (data.pages && pageIndex < data.pages.length - 1) {
      soundController.playClick();
      setPageIndex(pageIndex + 1);
    }
  };

  const handlePrevPage = () => {
    if (data.pages && pageIndex > 0) {
      soundController.playClick();
      setPageIndex(pageIndex - 1);
    }
  };

  const handleRotate = () => {
    soundController.playClick();
    setRotation((prev) => (prev + 90) % 360);
    if (data.clue && onDiscoverClue) {
      onDiscoverClue(data.clue);
    }
  };

  const handleFlip = () => {
    soundController.playClick();
    setIsFlipped(!isFlipped);
    if (data.clue && onDiscoverClue) {
      onDiscoverClue(data.clue);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="object-detail-title"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        role="document"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#1c0f0a] via-[#100704] to-[#080302] border-2 border-amber-600/70 p-5 sm:p-8 text-stone-100 shadow-[0_0_80px_rgba(245,158,11,0.4)] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-amber-800/40 pb-3 mb-5">
          <div>
            <div className="text-[10px] font-cinzel font-bold text-amber-400 tracking-widest uppercase">
              {data.subtitle || 'CLOSE-UP EVIDENCE INSPECTION'}
            </div>
            <h2
              id="object-detail-title"
              className="text-lg sm:text-2xl font-cinzel font-black text-amber-100 tracking-wide"
            >
              {data.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="✕ Close Inspection"
            className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-cinzel text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Dynamic Reader Content based on Type */}

        {/* 1. BOOKS & DIARIES (with Page Turning) */}
        {(data.type === 'grimoire' || data.type === 'diary') && data.pages && (
          <div className="flex flex-col justify-between min-h-[300px]">
            {/* Antique Leather Binder Frame */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-[#efe3c8] text-[#2b180d] border-4 border-[#52331c] shadow-2xl">
              {/* Bookmark Ribbon */}
              <div
                aria-hidden="true"
                className="absolute top-0 right-10 w-5 h-20 bg-red-800 border-x border-b border-red-950 shadow-md transform -translate-y-2 rounded-b"
              />

              <div className="flex items-center justify-between border-b border-[#c2aa83] pb-2 mb-4">
                <span className="font-cinzel text-xs font-black uppercase tracking-wider text-[#684120]">
                  {data.pages[pageIndex].title}
                </span>
                <span className="font-mono text-[11px] text-[#7d5631]">
                  Page {pageIndex + 1} of {data.pages.length}
                </span>
              </div>

              <div className="font-serif text-sm sm:text-base leading-relaxed italic text-[#301a0e] min-h-[140px]">
                "{data.pages[pageIndex].content}"
              </div>

              {data.pages[pageIndex].clue && (
                <div className="mt-4 p-3 rounded-xl bg-amber-900/20 border border-amber-800/40 text-center font-cinzel font-bold text-xs text-[#703b0c]">
                  ✦ Uncovered Clue Note: {data.pages[pageIndex].clue} ✦
                </div>
              )}
            </div>

            {/* Page Navigation Controls */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-amber-900/40">
              <button
                type="button"
                disabled={pageIndex === 0}
                onClick={handlePrevPage}
                className="px-4 py-2 rounded-xl bg-stone-900 disabled:opacity-30 border border-stone-700 text-xs font-cinzel text-stone-200 hover:text-white cursor-pointer"
              >
                ← Previous Page
              </button>

              <span className="text-xs font-mono text-stone-400">
                Turn pages to investigate clues
              </span>

              <button
                type="button"
                disabled={pageIndex === data.pages.length - 1}
                onClick={handleNextPage}
                className="px-4 py-2 rounded-xl bg-stone-900 disabled:opacity-30 border border-stone-700 text-xs font-cinzel text-stone-200 hover:text-white cursor-pointer"
              >
                Next Page →
              </button>
            </div>
          </div>
        )}

        {/* 2. LETTERS & SCROLLS (Unfolded Parchment) */}
        {(data.type === 'letter' || data.type === 'scroll') && (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#f7efdc] text-[#241408] border-2 border-[#82613d] shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#cca977] pb-2 mb-3">
              <span className="font-cinzel text-xs font-black uppercase tracking-wider text-[#734316]">
                {data.title}
              </span>
              <button
                type="button"
                onClick={handleFlip}
                className="px-2.5 py-1 rounded bg-[#d9c099] border border-[#a67c48] text-[10px] font-cinzel font-bold text-[#452309] hover:bg-[#c9ad84] cursor-pointer"
              >
                {isFlipped ? 'Flip to Front ↩' : 'Flip to Reverse ↪'}
              </button>
            </div>

            {!isFlipped ? (
              <div className="font-serif text-sm sm:text-base leading-relaxed italic text-[#261509] min-h-[120px]">
                {data.text}
              </div>
            ) : (
              <div className="font-mono text-xs leading-relaxed text-[#593417] p-3 rounded-lg bg-[#ebd9b9] border border-[#bfa37e]">
                <div className="font-bold text-[11px] mb-1">REVERSE INSCRIPTION / WAX IMPRINT:</div>
                <div>{data.clue || 'A ciphered seal bearing the Cartel mark and Year 1891.'}</div>
              </div>
            )}
          </div>
        )}

        {/* 3. SKULL & RELIC ROTATION INSPECTION */}
        {(data.type === 'skull' || data.type === 'crystal' || data.type === 'potion' || data.type === 'generic') && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            {/* Rotatable Object Visual */}
            <button
              type="button"
              style={{ transform: `rotate(${rotation}deg)` }}
              className="text-7xl sm:text-8xl my-4 transition-transform duration-300 filter drop-shadow-[0_10px_20px_rgba(245,158,11,0.5)] cursor-pointer bg-transparent border-0 outline-none"
              onClick={handleRotate}
              title="Click to Rotate"
              aria-label="Click to Rotate Object"
            >
              {data.type === 'skull' && '💀'}
              {data.type === 'crystal' && '💎'}
              {data.type === 'potion' && '🧪'}
              {data.type === 'generic' && '🪙'}
            </button>

            <div className="text-xs font-mono text-stone-400 mb-3">
              Rotation: {rotation}° • Click icon or button below to turn
            </div>

            <button
              type="button"
              onClick={handleRotate}
              className="px-4 py-2 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-600/70 text-xs font-cinzel text-amber-200 font-bold uppercase tracking-wider transition-all cursor-pointer mb-4"
            >
              Rotate Object 🔄
            </button>

            {/* Inscription Details */}
            <div className="w-full p-4 rounded-2xl bg-black/70 border border-amber-900/40 text-left">
              <div className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider mb-1">
                Visible Carvings & Markings:
              </div>
              <p className="font-serif italic text-sm text-stone-200 leading-relaxed mb-2">
                "{data.text || data.markings}"
              </p>
              {data.clue && (
                <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/60 text-xs font-cinzel font-bold text-amber-200 text-center">
                  ✦ Inscribed Secret: {data.clue} ✦
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-amber-900/40 text-center text-[10px] font-cinzel text-stone-500 tracking-wider uppercase">
          Frost Cartel • Physical Coffin Investigation
        </div>
      </div>
    </div>
  );
};

