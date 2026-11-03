import React from 'react';

interface Stage2BottomBarProps {
  hintDeduction: number;
  stageCleared: boolean;
  onOpenHintModal: () => void;
  onOpenSkipModal: () => void;
  onReturnDashboard: () => void;
}

export const Stage2BottomBar: React.FC<Stage2BottomBarProps> = ({
  hintDeduction,
  stageCleared,
  onOpenHintModal,
  onOpenSkipModal,
  onReturnDashboard,
}) => {
  return (
    <footer className="relative z-30 w-full max-w-[1400px] mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-900/40">
      {/* Left Instructions */}
      <div className="text-[10px] sm:text-xs font-cinzel font-bold tracking-[0.18em] text-amber-300/80 uppercase text-center sm:text-left drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
        ✦ OPEN A PHOTO • ZOOM TO INSPECT • CLICK A RELIC WHEN YOU FIND IT ✦
      </div>

      {/* Right Tactical Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {!stageCleared && (
          <button
            type="button"
            onClick={onOpenHintModal}
            aria-label={`Hint (-${hintDeduction} CR)`}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-950/80 via-amber-900/70 to-amber-950/80 hover:from-amber-900 hover:to-amber-800 border border-amber-500/70 text-amber-200 font-cinzel text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_22px_rgba(245,158,11,0.5)] cursor-pointer"
          >
            <span aria-hidden="true">💡</span>
            <span>Hint (-{hintDeduction} CR)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenSkipModal}
          aria-label="Skip Stage"
          className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-stone-950/80 hover:bg-stone-900 border border-stone-700/80 hover:border-stone-500 text-stone-300 hover:text-white font-cinzel text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md"
        >
          Skip Stage
        </button>

        <button
          type="button"
          onClick={onReturnDashboard}
          aria-label="Return to Round Dashboard"
          className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 border border-amber-400 text-stone-950 font-cinzel text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
        >
          Round Dashboard
        </button>
      </div>
    </footer>
  );
};

