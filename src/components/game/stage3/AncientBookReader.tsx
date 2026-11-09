import React, { useState, useEffect } from 'react';
import { soundController } from '../../../utils/soundController';

interface AncientBookReaderProps {
  isOpen: boolean;
  onClose: () => void;
  onAllPagesRead: () => void;
}

interface PageData {
  romanNumber: string;
  title: string;
  subtitle: string;
  content: string;
  clueHint: string;
  ornament: string;
}

const BOOK_PAGES: PageData[] = [
  {
    romanNumber: 'PAGE I',
    title: 'THE THREE WITNESSES',
    subtitle: 'THE FIRST TESTAMENT OF THE SEPULCHER',
    content:
      'Three marks were left for the living: a numeral upon the crown, a sun upon the cage, and crimson upon the longest witness.',
    clueHint: 'Notice the Roman numeral "I" on the cranium, the golden sun medallion on the ribs, and the red ribbons bound around the femur.',
    ornament: '✦ ❖ ✦',
  },
  {
    romanNumber: 'PAGE II',
    title: 'THE FORGOTTEN INSTRUCTION',
    subtitle: 'WARNING OF THE ANCIENT WARDEN',
    content:
      'Trust not the crowned skull, nor the sun-bound ribs. The truth sleeps beneath the long bone whose red binding survives the grave. Shift the sleeper; uncover the word.',
    clueHint: 'The secret is not on the skull or ribs. You must physically move the skeletal remains to reveal what is concealed beneath the crimson-bound bone.',
    ornament: '💀 ── ❖ ── 💀',
  },
  {
    romanNumber: 'PAGE III',
    title: 'THE FINAL RIDDLE',
    subtitle: 'THE KEEPER’S CIPHER',
    content:
      'Born when flame is spent, pale when all light has fled; I am the last trace of fire, yet I hold no heat. What am I?',
    clueHint: 'Uncover the hidden word under the remains to verify your answer to this ancient riddle.',
    ornament: '🔥 ── ❖ ── 🔥',
  },
];

export const AncientBookReader: React.FC<AncientBookReaderProps> = ({
  isOpen,
  onClose,
  onAllPagesRead,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [hasCompletedAll, setHasCompletedAll] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && currentPage === BOOK_PAGES.length - 1 && !hasCompletedAll) {
      setHasCompletedAll(true);
      onAllPagesRead();
      soundController.playDiscover();
    }
  }, [isOpen, currentPage, hasCompletedAll, onAllPagesRead]);

  if (!isOpen) return null;

  const page = BOOK_PAGES[currentPage];

  const handleNext = () => {
    if (currentPage < BOOK_PAGES.length - 1) {
      soundController.playParchmentOpen();
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      soundController.playParchmentOpen();
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ancient-book-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        role="document"
        className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-b from-[#241209] via-[#160a05] to-[#0d0502] border-2 border-amber-600/80 p-5 sm:p-8 text-stone-100 shadow-[0_0_90px_rgba(245,158,11,0.5)] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-amber-800/50 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              📖
            </div>
            <div>
              <div className="text-[10px] sm:text-xs font-cinzel font-bold text-amber-400 tracking-widest uppercase">
                ANCIENT LEATHER GRIMOIRE • EXHUMED 1891
              </div>
              <h2
                id="ancient-book-title"
                className="text-base sm:text-xl font-cinzel font-black text-amber-100 tracking-wide"
              >
                THE CARTEL EXEQUIES
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Book"
            className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-cinzel text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Realistic Book Open Spread */}
        <div className="relative flex-1 min-h-[300px] sm:min-h-[340px] my-2 p-5 sm:p-7 rounded-2xl bg-[#f5ecd7] text-stone-950 shadow-[inset_0_0_40px_rgba(115,75,30,0.35),0_15px_35px_rgba(0,0,0,0.85)] border-4 border-[#522915] flex flex-col justify-between">
          {/* Subtle Page Crease Center Shadow */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-stone-800/15 to-transparent pointer-events-none"
          />

          {/* Page Top Header */}
          <div className="text-center border-b border-[#a68c6a]/60 pb-2.5">
            <span className="font-cinzel text-xs font-black tracking-[0.25em] text-[#8b1c1c] uppercase block">
              {page.romanNumber}
            </span>
            <h3 className="font-cinzel text-base sm:text-xl font-black tracking-wider text-[#26140b] mt-0.5 uppercase">
              {page.title}
            </h3>
            <span className="text-[9px] font-serif italic text-stone-600 tracking-wider block mt-0.5">
              {page.subtitle}
            </span>
          </div>

          {/* Page Manuscript Text */}
          <div className="py-4 sm:py-6 px-2 sm:px-4 flex flex-col items-center justify-center text-center">
            <p className="font-serif text-base sm:text-xl md:text-2xl italic leading-relaxed text-[#1f0d06] max-w-lg font-medium drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
              &ldquo;{page.content}&rdquo;
            </p>

            {/* Ornamental Divider */}
            <div className="mt-4 text-xs font-serif text-[#8b1c1c]/80 tracking-widest" aria-hidden="true">
              {page.ornament}
            </div>

            {/* Supporting Note */}
            <p className="mt-3 text-[10px] sm:text-xs font-sans text-stone-700 bg-[#e8dcbf]/70 px-3 py-1.5 rounded-lg border border-[#c4ae8d] max-w-md">
              💡 <span className="font-semibold text-stone-900">Investigator Note:</span> {page.clueHint}
            </p>
          </div>

          {/* Page Bottom Pagination */}
          <div className="flex items-center justify-between border-t border-[#a68c6a]/60 pt-2 text-stone-700 font-cinzel text-xs">
            <span className="text-[10px] text-stone-600 font-mono">
              Folio {currentPage + 1} of {BOOK_PAGES.length}
            </span>
            {hasCompletedAll && (
              <span className="text-[10px] font-bold text-emerald-800 font-mono">
                ✓ Scripture Deciphered • Remains Unlocked
              </span>
            )}
          </div>
        </div>

        {/* Bottom Navigation Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-amber-900/40">
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={handlePrev}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-700 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Previous Page</span>
          </button>

          {currentPage < BOOK_PAGES.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 border border-amber-400 text-stone-950 font-cinzel text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Next Page</span>
              <span>→</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-800 via-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-500 border border-emerald-400 text-emerald-50 font-cinzel text-xs font-black uppercase tracking-wider shadow-[0_0_18px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Close & Inspect Remains</span>
              <span>✓</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

