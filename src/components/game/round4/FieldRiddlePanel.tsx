import React, { useState } from 'react';
import type { ClueStep, ExpeditionProgress, ExpeditionRoute } from '../../../types/round4Expedition.types';
import { soundController } from '../../../utils/soundController';

interface FieldRiddlePanelProps {
  currentRoute: ExpeditionRoute;
  currentStep: ClueStep;
  progress: ExpeditionProgress;
  isTargetDiscovered: boolean;
  onSubmitAnswer: (answer: string) => Promise<{ success: boolean; message: string }>;
  onOpenScanner?: () => void;
  scannedValidationWord?: string | null;
  isMuted: boolean;
}

export const FieldRiddlePanel: React.FC<FieldRiddlePanelProps> = ({
  currentRoute,
  currentStep,
  progress,
  isTargetDiscovered,
  onSubmitAnswer,
  onOpenScanner,
  scannedValidationWord,
  isMuted,
}) => {
  const [answerInput, setAnswerInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Sync scanned validation word if provided
  React.useEffect(() => {
    if (scannedValidationWord) {
      setAnswerInput(scannedValidationWord);
      setFeedback({
        type: 'success',
        message: `Checkpoint confirmed! Validation word: ${scannedValidationWord}`,
      });
    }
  }, [scannedValidationWord]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!answerInput.trim() || isSubmitting || !isTargetDiscovered) return;

    setIsSubmitting(true);
    setFeedback(null);

    const result = await onSubmitAnswer(answerInput);
    setIsSubmitting(false);

    if (result.success) {
      if (!isMuted) {
        soundController.playVictory();
      }
      setFeedback({ type: 'success', message: result.message });
      setAnswerInput('');
    } else {
      if (!isMuted) {
        soundController.playError();
      }
      setFeedback({ type: 'error', message: result.message });
    }
  };

  const handleCopyRiddle = () => {
    if (!navigator.clipboard || !isTargetDiscovered) return;
    const textToCopy = `[FROST CARTEL ROUND 04 - ${currentRoute.routeName} CLUE ${currentStep.clueIndex}]\nLocation: ${currentStep.fieldLocationHint}\nRiddle: "${currentStep.riddle}"`;
    void navigator.clipboard.writeText(textToCopy).catch(() => {});
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Calculate solved clues count for current route
  const solvedCountInRoute = progress.solvedStepIds.length;

  return (
    <aside
      aria-label="Field Riddle & Partner Handoff Console"
      className="relative w-full max-w-[340px] select-none flex flex-col"
    >
      {/* 1. Authentic Antique Gilded Parchment Scroll Container */}
      <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#fdf7ea] via-[#f7ecd6] to-[#ebdcc4] p-5 sm:p-6 border-2 border-[#d4af37]/80 shadow-[0_16px_40px_rgba(75,50,20,0.35),inset_0_2px_6px_rgba(255,255,255,0.7)] flex flex-col justify-between overflow-hidden">
        
        {/* Ornate Baroque Gilded Crest (Top Center) */}
        <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent pointer-events-none" />

        <div className="space-y-4">
          {/* Header Cartouche: FIELD RIDDLE */}
          <div className="relative flex items-center justify-center">
            <div className="px-5 py-1.5 rounded-full bg-gradient-to-b from-[#2a1c10] via-[#1a120b] to-[#0f0a06] border border-[#ffd866]/80 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
              <h2 className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.22em] text-[#ffd866] uppercase text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                FIELD RIDDLE
              </h2>
            </div>
          </div>

          {/* Riddle Body / Status Text */}
          <div className="min-h-[75px] flex flex-col justify-center text-center px-1">
            {!isTargetDiscovered ? (
              <p className="font-serif italic text-sm sm:text-base text-[#4a341b] leading-relaxed">
                Reach the marked point on the map to reveal the active riddle.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="font-serif text-xs sm:text-[13px] text-[#2c1d0c] font-medium leading-relaxed italic bg-[#f2e5cb]/70 p-2.5 rounded border border-[#b8974a]/40 shadow-inner">
                  "{currentStep.riddle}"
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#735323]">
                  <span className="truncate max-w-[190px]">{currentStep.fieldLocationHint}</span>
                  <button
                    type="button"
                    onClick={handleCopyRiddle}
                    className="underline hover:text-[#3d270c] transition-colors cursor-pointer"
                    title="Copy riddle for phone call"
                  >
                    {isCopied ? 'COPIED!' : 'COPY'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ornamental Divider with Compass Star */}
          <div className="relative flex items-center justify-center py-1">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#b8974a]/50 to-transparent" />
            <span className="absolute px-2 bg-[#f7ecd6] text-[#b8974a] text-xs">✦</span>
          </div>

          {/* Answer Code Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {onOpenScanner && isTargetDiscovered && (
              <button
                type="button"
                onClick={onOpenScanner}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#b8860b] to-[#d4af37] hover:from-[#c9971c] hover:to-[#e5c158] text-[#1c1208] font-cinzel text-xs font-bold tracking-[0.16em] border border-[#ffd866] shadow-sm flex items-center justify-center gap-2 cursor-pointer uppercase transition-all"
              >
                <span>📷</span>
                <span>SCAN PHYSICAL QR CHECKPOINT</span>
              </button>
            )}

            <div className="relative">
              <input
                type="text"
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                disabled={!isTargetDiscovered || isSubmitting}
                placeholder="ENTER CODE / ANSWER"
                aria-label="Enter Field Code or Answer"
                className="w-full px-4 py-2.5 rounded-lg bg-[#f0e3cc]/90 border border-[#b8974a]/60 text-[#2b1b0b] font-cinzel text-xs sm:text-sm font-semibold tracking-[0.18em] placeholder:text-[#947650] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:bg-[#fff9ed] shadow-inner text-center uppercase transition-all disabled:opacity-55 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={!isTargetDiscovered || isSubmitting || !answerInput.trim()}
              className="w-full py-2.5 rounded-lg bg-gradient-to-b from-[#3a2816] via-[#24180d] to-[#120c06] hover:from-[#4d361f] hover:to-[#1a1209] text-[#ffd866] font-cinzel text-xs sm:text-sm font-bold tracking-[0.24em] border border-[#d4af37]/70 shadow-[0_3px_10px_rgba(70,45,15,0.4)] transition-all uppercase cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isSubmitting ? 'VERIFYING...' : 'SUBMIT'}
            </button>

            {/* Error or Success Feedback Banner */}
            {feedback && (
              <div
                role="alert"
                className={`p-2 rounded text-center text-xs font-serif ${
                  feedback.type === 'success'
                    ? 'bg-emerald-900/15 border border-emerald-600/50 text-emerald-800'
                    : 'bg-red-900/15 border border-red-600/50 text-red-800'
                }`}
              >
                {feedback.message}
              </div>
            )}
          </form>

          {/* Section 2: PARTNER HANDOFF */}
          <div className="pt-2 border-t border-[#b8974a]/30 space-y-2.5">
            <div className="relative flex items-center justify-center">
              <div className="px-4 py-0.5 rounded-full bg-gradient-to-b from-[#2a1c10] to-[#140c06] border border-[#ffd866]/60 shadow-sm">
                <span className="font-cinzel text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#ffd866] uppercase text-center">
                  PARTNER HANDOFF
                </span>
              </div>
            </div>

            {/* Two Roles Layout */}
            <div className="grid grid-cols-2 text-center border-b border-[#b8974a]/25 pb-2">
              <div className="border-r border-[#b8974a]/30 px-1">
                <span className="font-cinzel text-[10px] font-bold tracking-wider text-[#3d2912] uppercase block">
                  MAP EXPLORER
                </span>
                <span className="text-[9px] text-[#785b30] block">Desktop Navigator</span>
              </div>
              <div className="px-1">
                <span className="font-cinzel text-[10px] font-bold tracking-wider text-[#3d2912] uppercase block">
                  FIELD PARTNER
                </span>
                <span className="text-[9px] text-[#785b30] block">Campus Investigator</span>
              </div>
            </div>

            <p className="font-serif text-[11px] text-[#543b1c] text-center italic leading-tight">
              Share the clue with your partner by call. Enter the discovered code once received.
            </p>
          </div>
        </div>

        {/* Section 3: 5-Step Route Clue Progress Indicator */}
        <div className="mt-4 pt-3 border-t border-[#b8974a]/40 space-y-2">
          {/* 5 Circular Clue Step Discs */}
          <div className="flex items-center justify-center gap-3">
            {[0, 1, 2, 3, 4].map((idx) => {
              const stepNumber = idx + 1;
              const isCompleted = idx < progress.activeStepIndex || progress.completedRouteIds.includes(currentRoute.routeId);
              const isCurrent = idx === progress.activeStepIndex && !progress.completedRouteIds.includes(currentRoute.routeId);

              let dotContent: React.ReactNode;
              if (isCurrent) {
                dotContent = (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-white border border-[#b8860b] shadow-[0_0_10px_rgba(255,215,0,0.95)] flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-[#3d270c]" />
                  </div>
                );
              } else if (isCompleted) {
                dotContent = (
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-[#b8860b] shadow-sm flex items-center justify-center">
                    <span className="text-[#3d270c] text-[9px] font-bold">✓</span>
                  </div>
                );
              } else {
                dotContent = (
                  <div className="w-4 h-4 rounded-full bg-[#3d2a17]/40 border border-[#b8974a]/40" />
                );
              }

              return (
                <div
                  key={`clue-dot-${stepNumber}`}
                  className="relative flex items-center justify-center"
                  title={`Clue ${stepNumber} of 5`}
                >
                  {dotContent}
                </div>
              );
            })}
          </div>

          {/* Footer Metadata: CURRENT SECTOR | X / 5 SOLVED */}
          <div className="flex items-center justify-between text-[11px] font-cinzel font-semibold tracking-wider text-[#5c401d] pt-1">
            <span>SECTOR OBJECTIVE</span>
            <div className="h-3 w-[1px] bg-[#b8974a]/50" />
            <span>{solvedCountInRoute} / 5 SOLVED</span>
          </div>
        </div>

      </div>
    </aside>
  );
};
