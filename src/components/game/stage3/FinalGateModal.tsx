import React, { useState } from 'react';
import { round1Service } from '../../../services/round1Service';
import { soundController } from '../../../utils/soundController';
import { HorrorJumpscareModal } from './HorrorJumpscareModal';

interface FinalGateModalProps {
  isOpen: boolean;
  teamId: string;
  collectedFragments: string[];
  isCompleted: boolean;
  onGateUnlocked: () => void;
  onClose: () => void;
}

export const FinalGateModal: React.FC<FinalGateModalProps> = ({
  isOpen,
  teamId,
  collectedFragments,
  isCompleted,
  onGateUnlocked,
  onClose,
}) => {
  const [incantation, setIncantation] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isJumpscareActive, setIsJumpscareActive] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(
    isCompleted ? 'Arch-Lich Gate Shattered • Escaped!' : null
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    const { success, message } = round1Service.submitFinalEscapeAnswer(teamId, incantation);
    if (success) {
      setIsJumpscareActive(true);
      setSuccessNotice('Arch-Lich Gate Shattered • Escaped!');
      onGateUnlocked();
    } else {
      soundController.playError();
      setErrorNotice(message);
    }
  };

  const handleQuickInsert = () => {
    soundController.playClick();
    setIncantation('THE NIGHT RETURNS');
  };

  const hasAllFragments =
    collectedFragments.includes('THE') &&
    collectedFragments.includes('NIGHT') &&
    collectedFragments.includes('RETURNS');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-modal-title"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none animate-fadeIn"
    >
      <div
        role="document"
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#1b0805] via-[#0f0403] to-[#050100] border-2 border-red-600/70 p-5 sm:p-7 text-stone-100 shadow-[0_0_70px_rgba(220,38,38,0.4)] flex flex-col justify-between"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-900/50 pb-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-red-950 border border-red-500/80 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              ⛩️
            </div>
            <div>
              <div className="text-[10px] font-cinzel font-bold text-amber-400 tracking-widest uppercase">
                FINAL SANCTUM • ESCAPE PORTAL
              </div>
              <h2
                id="gate-modal-title"
                className="text-lg sm:text-2xl font-cinzel font-black text-stone-100 tracking-wide"
              >
                The Arch-Lich Escape Gate
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

        {/* 3 Fragment Plaques */}
        <div className="mb-5">
          <div className="text-center text-xs font-cinzel font-bold text-stone-400 uppercase tracking-widest mb-3">
            Grave Inscriptions Unsealed ({collectedFragments.length}/3)
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Syllable 1 */}
            <div
              className={`p-3 rounded-xl border text-center transition-all ${
                collectedFragments.includes('THE')
                  ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-black/40 border-stone-800 text-stone-600'
              }`}
            >
              <div className="text-[9px] font-cinzel font-bold tracking-widest uppercase mb-1">
                Grave I
              </div>
              <div className="font-cinzel text-base sm:text-xl font-black">
                {collectedFragments.includes('THE') ? 'THE' : '???'}
              </div>
            </div>

            {/* Syllable 2 */}
            <div
              className={`p-3 rounded-xl border text-center transition-all ${
                collectedFragments.includes('NIGHT')
                  ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-black/40 border-stone-800 text-stone-600'
              }`}
            >
              <div className="text-[9px] font-cinzel font-bold tracking-widest uppercase mb-1">
                Grave II
              </div>
              <div className="font-cinzel text-base sm:text-xl font-black">
                {collectedFragments.includes('NIGHT') ? 'NIGHT' : '???'}
              </div>
            </div>

            {/* Syllable 3 */}
            <div
              className={`p-3 rounded-xl border text-center transition-all ${
                collectedFragments.includes('RETURNS')
                  ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-black/40 border-stone-800 text-stone-600'
              }`}
            >
              <div className="text-[9px] font-cinzel font-bold tracking-widest uppercase mb-1">
                Grave III
              </div>
              <div className="font-cinzel text-base sm:text-xl font-black">
                {collectedFragments.includes('RETURNS') ? 'RETURNS' : '???'}
              </div>
            </div>
          </div>

          {hasAllFragments && !successNotice && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={handleQuickInsert}
                className="text-[11px] font-cinzel font-bold text-amber-400 hover:text-amber-300 underline tracking-wider cursor-pointer"
              >
                ✦ Click to Chant Discovered Fragments ("THE NIGHT RETURNS") ✦
              </button>
            </div>
          )}
        </div>

        {/* Input Form or Success State */}
        {successNotice ? (
          <div className="my-3 p-5 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500 text-center shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-fadeIn">
            <div className="text-3xl mb-2">⚡ 🏆 ⚡</div>
            <div className="text-xl sm:text-2xl font-cinzel font-black text-emerald-300 tracking-wider mb-2">
              Arch-Lich Gate Shattered • Escaped!
            </div>
            <p className="text-xs sm:text-sm text-stone-300 font-serif max-w-md mx-auto mb-4 leading-relaxed">
              The ancient spectral seal ruptures with an ear-splitting howl. The cemetery fog parts as your operative team breaches the final boundary into the cartel safehouse.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-400 text-emerald-200 text-xs font-cinzel font-bold tracking-widest uppercase">
              <span>💰 +250 CREDITS SECURED</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 my-2">
            <div>
              <label
                htmlFor="final-phrase-input"
                className="block text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider mb-2"
              >
                Speak the Arch-Lich Incantation:
              </label>
              <input
                id="final-phrase-input"
                type="text"
                value={incantation}
                onChange={(e) => setIncantation(e.target.value)}
                placeholder="ENTER COMPLETE RUNIC PHRASE"
                className="w-full px-4 py-3 rounded-xl bg-black/70 border border-red-600/60 text-stone-100 placeholder-stone-600 font-cinzel text-center text-sm sm:text-base font-bold tracking-widest uppercase focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/40"
              />
            </div>

            {errorNotice && (
              <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/80 text-red-200 text-xs font-cinzel text-center">
                {errorNotice}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-800 via-red-600 to-amber-700 hover:from-red-700 hover:to-amber-600 border border-amber-500/60 font-cinzel text-sm sm:text-base font-black text-white tracking-widest uppercase shadow-[0_0_25px_rgba(220,38,38,0.5)] transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              Speak Incantation & Break Gate
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-red-900/40 text-center text-[10px] font-cinzel text-stone-500 tracking-wider uppercase">
          Frost Cartel • Round 01 Final Trial • Stage 03
        </div>
      </div>

      {/* Horror Jumpscare Cinematic on Unlocking Arch-Lich Gate */}
      <HorrorJumpscareModal
        isOpen={isJumpscareActive}
        onComplete={() => setIsJumpscareActive(false)}
      />
    </div>
  );
};
