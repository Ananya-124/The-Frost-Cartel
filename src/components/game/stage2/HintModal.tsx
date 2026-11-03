import React from 'react';
import { useNativeDialog } from '../../../hooks/useNativeDialog';

interface HintModalProps {
  isOpen: boolean;
  deductionCredits: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export const HintModal: React.FC<HintModalProps> = ({
  isOpen,
  deductionCredits,
  onCancel,
  onConfirm,
}) => {
  const { dialogRef } = useNativeDialog(isOpen, onCancel);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="hint-modal-title"
      aria-describedby="hint-modal-desc"
      className="fixed inset-0 m-auto z-50 p-0 bg-transparent backdrop:bg-black/85 backdrop:backdrop-blur-sm max-w-md w-[92vw] focus:outline-none"
    >
      <div className="bg-[#140b05] border-2 border-amber-500/80 rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.35)] text-stone-100 flex flex-col">
        {/* Header Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-950 border border-amber-400 flex items-center justify-center text-amber-300 text-xl shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            🕯️
          </div>
          <div>
            <div className="text-[10px] font-cinzel text-amber-400 font-bold tracking-widest uppercase">
              OCCULT DIVINATION
            </div>
            <h2 id="hint-modal-title" className="text-xl font-cinzel font-black text-amber-100 tracking-wide">
              SEEK AN OCCULT CLUE?
            </h2>
          </div>
        </div>

        {/* Informative Body */}
        <div id="hint-modal-desc" className="text-xs text-stone-300 space-y-2.5 mb-6 font-sans leading-relaxed">
          <p>
            Consulting the crystal seer will pinpoint which evidence photograph conceals an undiscovered relic.
          </p>
          <div className="p-3 rounded-lg bg-black/60 border border-amber-600/30 text-amber-300/90 font-mono text-[11px]">
            ⚡ Cost: <span className="font-bold text-amber-200">{deductionCredits} credits</span> will be deducted from your squad balance.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-900/40">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-cinzel text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 border border-amber-300 text-stone-950 font-cinzel text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.6)] cursor-pointer"
          >
            Accept (-{deductionCredits} CR)
          </button>
        </div>
      </div>
    </dialog>
  );
};

