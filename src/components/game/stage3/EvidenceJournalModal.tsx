import React from 'react';

export interface EvidenceJournalData {
  grave1Fragment?: string | null;
  grave2Fragment?: string | null;
  grave3Fragment?: string | null;
  notes: string[];
  unlockedCodes?: string[];
}

interface EvidenceJournalModalProps {
  isOpen: boolean;
  journal: EvidenceJournalData;
  collectedFragments: string[];
  onClose: () => void;
}

export const EvidenceJournalModal: React.FC<EvidenceJournalModalProps> = ({
  isOpen,
  journal,
  collectedFragments,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="journal-modal-title"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md select-none animate-fadeIn"
    >
      <div
        role="document"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#24130a] via-[#120803] to-[#080301] border-2 border-amber-600/70 p-5 sm:p-7 text-stone-100 shadow-[0_0_60px_rgba(245,158,11,0.35)] flex flex-col justify-between"
      >
        {/* 1. Header Bar */}
        <div className="flex items-center justify-between border-b border-amber-800/40 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-950 border border-amber-400 flex items-center justify-center text-xl shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              📖
            </div>
            <div>
              <div className="text-[10px] font-cinzel font-bold text-amber-400 tracking-widest uppercase">
                INVESTIGATOR ARCHIVE
              </div>
              <h2
                id="journal-modal-title"
                className="text-lg sm:text-2xl font-cinzel font-black text-amber-100 tracking-wide"
              >
                EVIDENCE JOURNAL
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="✕ Close"
            className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-cinzel text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* 2. Three Tomb Inscription Fragments Card Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Fragment I */}
          <div
            className={`p-3 rounded-2xl border text-center transition-all ${
              collectedFragments.includes('BENEATH') || collectedFragments.includes('THE') || journal.grave1Fragment
                ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-black/40 border-stone-800 opacity-60'
            }`}
          >
            <span className="text-[9px] font-cinzel font-bold text-amber-400 block mb-1">
              FRAGMENT I
            </span>
            <div className="font-cinzel text-lg sm:text-xl font-black text-amber-200">
              {journal.grave1Fragment || (collectedFragments.includes('BENEATH') ? 'BENEATH' : (collectedFragments.includes('THE') ? 'THE' : '??'))}
            </div>
            <span className="text-[9px] text-stone-400 font-mono">
              {collectedFragments.includes('BENEATH') || collectedFragments.includes('THE') || journal.grave1Fragment ? 'The Marked Remains Cleared' : 'Skeletal Sepulcher Sealed'}
            </span>
          </div>

          {/* Fragment II */}
          <div
            className={`p-3 rounded-2xl border text-center transition-all ${
              collectedFragments.includes('EMBER') || collectedFragments.includes('NIGHT') || journal.grave2Fragment
                ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-black/40 border-stone-800 opacity-60'
            }`}
          >
            <span className="text-[9px] font-cinzel font-bold text-amber-400 block mb-1">
              FRAGMENT II
            </span>
            <div className="font-cinzel text-lg sm:text-xl font-black text-amber-200">
              {journal.grave2Fragment || (collectedFragments.includes('EMBER') ? 'EMBER' : (collectedFragments.includes('NIGHT') ? 'NIGHT' : '??'))}
            </div>
            <span className="text-[9px] text-stone-400 font-mono">
              {collectedFragments.includes('EMBER') || collectedFragments.includes('NIGHT') || journal.grave2Fragment
                ? 'The Buried Diary Cleared'
                : 'Diary & Coffer Locked'}
            </span>
          </div>

          {/* Fragment III */}
          <div
            className={`p-3 rounded-2xl border text-center transition-all ${
              collectedFragments.includes('RETURNS') || journal.grave3Fragment
                ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-black/40 border-stone-800 opacity-60'
            }`}
          >
            <span className="text-[9px] font-cinzel font-bold text-cyan-400 block mb-1">
              FRAGMENT III
            </span>
            <div className="font-cinzel text-lg sm:text-xl font-black text-cyan-200">
              {collectedFragments.includes('RETURNS') || journal.grave3Fragment ? 'RETURNS' : '??'}
            </div>
            <span className="text-[9px] text-stone-400 font-mono">
              {collectedFragments.includes('RETURNS') ? 'Celestial Runes Aligned' : 'Rune Tombstone Locked'}
            </span>
          </div>
        </div>

        {/* 3. Field Notes Log */}
        <div className="rounded-2xl bg-black/70 border border-amber-900/40 p-4 mb-3">
          <h3 className="font-cinzel text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
            Chronicle of Uncovered Evidence:
          </h3>
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs text-stone-300">
            {journal.notes && journal.notes.length > 0 ? (
              journal.notes.map((note: string, idx: number) => (
                <div key={`note-${idx}-${note.slice(0, 10)}`} className="flex items-start gap-2 border-b border-stone-800/40 pb-1">
                  <span className="text-amber-500 font-bold" aria-hidden="true">✦</span>
                  <span className="leading-relaxed">{note}</span>
                </div>
              ))
            ) : (
              <div className="text-stone-500 italic text-[11px]">
                No field notes unsealed yet. Inspect the coffins across the cemetery grounds.
              </div>
            )}
          </div>
        </div>

        {/* 4. Complete Gate Cipher Guidance */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/60 via-black to-red-950/60 border border-red-500/40 text-center">
          <span className="text-[11px] font-cinzel font-bold text-amber-200">
            Assemble the three syllables in order (I → II → III) at the Arch-Lich Gate to escape.
          </span>
        </div>
      </div>
    </div>
  );
};
