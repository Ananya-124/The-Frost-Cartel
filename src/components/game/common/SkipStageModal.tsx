import React from 'react';
import { useNativeDialog } from '../../../hooks/useNativeDialog';

interface SkipStageModalProps {
  isOpen: boolean;
  stageNumber: number;
  stageTitle: string;
  rewardCredits: number;
  onContinue: () => void;
  onConfirmSkip: () => void;
}

export const SkipStageModal: React.FC<SkipStageModalProps> = ({
  isOpen,
  stageNumber,
  stageTitle,
  rewardCredits,
  onContinue,
  onConfirmSkip,
}) => {
  const { dialogRef } = useNativeDialog(isOpen, onContinue);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="skip-stage-title"
      aria-describedby="skip-stage-desc"
      className="fixed inset-0 m-auto z-50 p-0 bg-transparent backdrop:bg-black/85 backdrop:backdrop-blur-sm max-w-md w-[92vw] focus:outline-none"
    >
      <div className="bg-cartel-void border-2 border-amber-600/60 rounded-xl p-6 shadow-[0_0_50px_rgba(217,119,6,0.25)] text-cartel-bone flex flex-col">
        {/* Header Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 text-lg">
            ⚠️
          </div>
          <div>
            <div className="text-[10px] font-cinzel text-amber-500 font-bold tracking-widest uppercase">
              TACTICAL DECISION
            </div>
            <h2 id="skip-stage-title" className="text-xl font-cinzel font-bold text-white tracking-wide">
              SKIP THIS STAGE?
            </h2>
          </div>
        </div>

        {/* Informative Body as requested in Phase 2 */}
        <div id="skip-stage-desc" className="text-xs text-cartel-silver/90 space-y-3 mb-6 font-sans leading-relaxed">
          <p>
            You are about to leave <strong className="text-white">Stage {stageNumber} — {stageTitle}</strong>.
          </p>
          <div className="p-3 rounded bg-amber-950/30 border border-amber-500/30 text-amber-200">
            Completing this stage awards <strong className="text-amber-400 font-bold">{rewardCredits} credits</strong>.
            If you skip it and do not complete it before your Round 1 timer expires, you will receive zero credits for this stage.
          </div>
          <p className="text-[11px] text-cartel-silver/70">
            You may return and complete it later while Round 1 is still active.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-auto px-4 py-2 rounded bg-cartel-charcoal hover:bg-white/10 border border-white/15 text-white font-cinzel text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            CONTINUE PLAYING
          </button>
          <button
            type="button"
            onClick={onConfirmSkip}
            className="w-full sm:w-auto px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-cartel-void font-cinzel text-xs font-black uppercase tracking-wider shadow-lg transition-transform hover:scale-102 cursor-pointer"
          >
            CONFIRM SKIP
          </button>
        </div>
      </div>
    </dialog>
  );
};
