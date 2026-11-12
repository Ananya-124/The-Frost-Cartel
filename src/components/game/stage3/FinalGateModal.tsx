import React, { useState, useEffect, useRef } from 'react';
import { round1Service } from '../../../services/round1Service';
import { soundController } from '../../../utils/soundController';

interface FinalGateModalProps {
  isOpen: boolean;
  teamId: string;
  collectedFragments: string[];
  completedCount?: number;
  isCompleted: boolean;
  onGateUnlocked: () => void;
  onClose: () => void;
}

export const FinalGateModal: React.FC<FinalGateModalProps> = ({
  isOpen,
  teamId,
  collectedFragments,
  completedCount,
  isCompleted,
  onGateUnlocked,
  onClose,
}) => {
  const [incantation, setIncantation] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition
    );
  });
  const [successNotice, setSuccessNotice] = useState<string | null>(
    isCompleted ? 'Arch-Lich Gate Shattered • Escaped!' : null
  );

  const speechRecognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Authoritative grave completion state
  const comp = round1Service.getStage3GraveCompletion(teamId);
  const count = completedCount ?? comp.completedCount;

  const f1 = comp.fragments.grave1 || (collectedFragments.includes('BENEATH') ? 'BENEATH' : (collectedFragments.includes('THE') ? 'THE' : null));
  const f2 = comp.fragments.grave2 || (collectedFragments.includes('EMBER') ? 'EMBER' : (collectedFragments.includes('NIGHT') ? 'NIGHT' : null));
  const f3 = comp.fragments.grave3 || (collectedFragments.includes('RETURNS') ? 'RETURNS' : null);

  const hasAllFragments = count >= 3 || (Boolean(f1) && Boolean(f2) && Boolean(f3));
  const canonicalPhrase = `${f1 || 'BENEATH'} ${f2 || 'EMBER'} ${f3 || 'RETURNS'}`;

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
            const cleaned = transcript.trim().toUpperCase();
            setIncantation(cleaned);
            soundController.playDiscover();
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        speechRecognitionRef.current = recognition;
      } catch {
        // Speech recognition initialization unavailable in this environment
      }
    }

    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleToggleVoice = () => {
    if (!speechRecognitionRef.current) return;
    soundController.playClick();
    if (isListening) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      setErrorNotice(null);
      try {
        speechRecognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || successNotice) return;
    setErrorNotice(null);

    const clean = incantation.trim();
    if (!clean) {
      setErrorNotice('Enter or speak the complete runic phrase to unseal the gate.');
      soundController.playWrongAnswer();
      return;
    }

    setIsSubmitting(true);
    soundController.playClick();

    const { success, message } = round1Service.submitFinalEscapeAnswer(teamId, clean);
    setIsSubmitting(false);

    if (success) {
      soundController.playSecretFound();
      soundController.playVictory();
      setSuccessNotice('Arch-Lich Gate Shattered • Escaped!');
      onGateUnlocked();
    } else {
      soundController.playWrongAnswer();
      setErrorNotice(message || 'The ancient runes reject your phrase. The gate remains sealed.');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleQuickInsert = () => {
    soundController.playClick();
    setIncantation(canonicalPhrase);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

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
        {/* 1. Master Header Section (Single clear heading, no duplication) */}
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
                className="text-lg sm:text-2xl font-cinzel font-black text-stone-100 tracking-wide uppercase drop-shadow-[0_2px_12px_rgba(220,38,38,0.7)]"
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

        {/* 2. Discovered Inscriptions Panel (3 Connected Tablets) */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-cinzel font-bold text-stone-400 uppercase tracking-widest">
              Grave Inscriptions Unsealed ({count}/3)
            </span>
            <span className="text-[10px] font-mono text-amber-400/90 tracking-wide">
              {hasAllFragments ? '✦ ALL 3 GRAVES SOLVED' : '✦ COMPLETE GRAVES TO REVEAL'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 items-center">
            {/* Tablet 1 */}
            <div
              className={`p-3 rounded-xl border text-center transition-all relative ${
                f1
                  ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-black/40 border-stone-800 text-stone-600'
              }`}
            >
              <div className="text-[9px] font-cinzel font-bold tracking-widest uppercase mb-1 text-stone-400">
                GRAVE I — THE MARKED REMAINS
              </div>
              <div className="font-cinzel text-base sm:text-xl font-black text-amber-100">
                {f1 || '???'}
              </div>
            </div>

            {/* Tablet 2 */}
            <div
              className={`p-3 rounded-xl border text-center transition-all relative ${
                f2
                  ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-black/40 border-stone-800 text-stone-600'
              }`}
            >
              <div className="text-[9px] font-cinzel font-bold tracking-widest uppercase mb-1 text-stone-400">
                GRAVE II — THE BURIED DIARY
              </div>
              <div className="font-cinzel text-base sm:text-xl font-black text-amber-100">
                {f2 || '???'}
              </div>
            </div>

            {/* Tablet 3 */}
            <div
              className={`p-3 rounded-xl border text-center transition-all relative ${
                f3
                  ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-black/40 border-stone-800 text-stone-600'
              }`}
            >
              <div className="text-[9px] font-cinzel font-bold tracking-widest uppercase mb-1 text-stone-400">
                GRAVE III — THE FINAL TESTAMENT
              </div>
              <div className="font-cinzel text-base sm:text-xl font-black text-amber-100">
                {f3 || '???'}
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
                ✦ Click to Chant Discovered Phrase (&ldquo;{canonicalPhrase}&rdquo;) ✦
              </button>
            </div>
          )}
        </div>

        {/* 3. Input Form or Success / Unsealed State */}
        {successNotice ? (
          <div className="my-3 p-5 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500 text-center shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-fadeIn">
            <div className="text-3xl mb-2">⚡ 🏆 ⚡</div>
            <div className="text-xl sm:text-2xl font-cinzel font-black text-emerald-300 tracking-wider mb-2 uppercase">
              ARCH-LICH GATE SHATTERED • ESCAPED!
            </div>
            <p className="text-xs sm:text-sm text-stone-300 font-serif max-w-md mx-auto mb-4 leading-relaxed">
              The ancient spectral seal ruptures with an ear-splitting howl. The cemetery fog dissolves as your squad breaches the final boundary into the cartel safehouse.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-400 text-emerald-200 text-xs font-cinzel font-bold tracking-widest uppercase">
              <span>💰 +250 CREDITS SECURED</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 my-2">
            {!hasAllFragments && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200/90 text-xs font-serif italic text-center">
                ✦ Notice: Solve all three open graves across the cemetery to reveal the complete sacred phrase. ({count}/3 completed) ✦
              </div>
            )}

            <div>
              <label
                htmlFor="final-phrase-input"
                className="block text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider mb-2 text-center sm:text-left"
              >
                ENTER COMPLETE RUNIC PHRASE:
              </label>

              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  id="final-phrase-input"
                  type="text"
                  value={incantation}
                  onChange={(e) => setIncantation(e.target.value)}
                  placeholder="ENTER COMPLETE RUNIC PHRASE"
                  className="w-full px-4 py-3.5 pr-14 rounded-xl bg-black/80 border-2 border-red-700/70 text-stone-100 placeholder-stone-600 font-cinzel text-center text-sm sm:text-base font-bold tracking-widest uppercase focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/40 shadow-inner"
                />

                {/* Optional Voice / Microphone Button */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    title={isListening ? 'Listening... click to stop' : 'Click to speak phrase'}
                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                    className={`absolute right-2 px-2.5 py-1.5 rounded-lg border text-sm transition-all cursor-pointer ${
                      isListening
                        ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                        : 'bg-stone-900/90 hover:bg-stone-800 border-stone-700 text-amber-300'
                    }`}
                  >
                    🎤
                  </button>
                )}
              </div>

              {isListening && (
                <div className="mt-1 text-center text-xs font-cinzel text-red-400 font-bold animate-pulse">
                  ● Listening... Speak the runic phrase into your microphone
                </div>
              )}
            </div>

            {errorNotice && (
              <div className="p-3 rounded-lg bg-red-950/90 border border-red-500 text-red-200 text-xs font-cinzel text-center animate-shake">
                {errorNotice}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              aria-label="UNSEAL THE FINAL GATE • Speak Incantation & Break Gate"
              className={`w-full py-3.5 px-4 rounded-xl font-cinzel text-sm sm:text-base font-black tracking-widest uppercase shadow-[0_0_30px_rgba(220,38,38,0.55)] transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                isSubmitting
                  ? 'bg-stone-800 border border-stone-600 text-stone-400 cursor-wait'
                  : 'bg-gradient-to-r from-red-800 via-red-600 to-amber-700 hover:from-red-700 hover:to-amber-600 border border-amber-500/80 text-white'
              }`}
            >
              <span>{isSubmitting ? 'UNSEALING ANCIENT SANCTUM...' : 'UNSEAL THE FINAL GATE'}</span>
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-red-900/40 text-center text-[10px] font-cinzel text-stone-500 tracking-wider uppercase">
          Frost Cartel • Round 01 Final Trial • Stage 03
        </div>
      </div>
    </div>
  );
};
