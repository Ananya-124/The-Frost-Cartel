import React, { useState } from 'react';
import type { Stage1Config } from '../../../types/round1.types';
import { SkipStageModal } from '../common/SkipStageModal';

interface Stage1FrameworkProps {
  config: Stage1Config;
  onReturnDashboard: () => void;
  onSkipStage: () => void;
}

export const Stage1Framework: React.FC<Stage1FrameworkProps> = ({
  config,
  onReturnDashboard,
  onSkipStage,
}) => {
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);

  return (
    <div className="relative flex-1 flex flex-col justify-between max-w-4xl w-full mx-auto p-4 sm:p-6 text-cartel-bone font-sans">
      {/* Top Stage Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div>
          <div className="text-[10px] font-cinzel text-cartel-pumpkin font-bold uppercase tracking-widest">
            STAGE 01 OF 03 • 100 CREDITS RESERVED
          </div>
          <h1 className="text-xl sm:text-2xl font-cinzel font-black text-white tracking-wide">
            {config.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSkipModalOpen(true)}
            className="px-3 py-1.5 rounded bg-cartel-charcoal/80 hover:bg-white/10 border border-white/15 text-cartel-silver hover:text-white font-cinzel text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Skip Stage
          </button>
          <button
            type="button"
            onClick={onReturnDashboard}
            className="px-3.5 py-1.5 rounded bg-cartel-pumpkin/20 hover:bg-cartel-pumpkin/30 border border-cartel-pumpkin/60 text-cartel-pumpkin font-cinzel text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Round Dashboard
          </button>
        </div>
      </div>

      {/* Main Framework Body */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-10 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Animated Runic Seal Background */}
        <div
          aria-hidden="true"
          className="absolute w-72 h-72 rounded-full border border-dashed border-cartel-pumpkin/20 animate-spin-slow pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute w-56 h-56 rounded-full border border-dotted border-cartel-amber/20 animate-spin-slow-reverse pointer-events-none"
        />

        {/* Central Icon */}
        <div className="w-20 h-20 rounded-full bg-cartel-charcoal border-2 border-cartel-pumpkin/50 flex items-center justify-center text-3xl mb-4 text-cartel-amber shadow-pumpkinGlow">
          ⏳
        </div>

        {/* Stage Status Stamp */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 text-xs font-cinzel font-bold uppercase tracking-widest mb-3">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" aria-hidden="true" />
          <span>STAGE 1 — CHALLENGE PENDING</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-white mb-2">
          Dark Rites in Preparation
        </h2>

        <p className="text-xs sm:text-sm text-cartel-silver/80 max-w-lg mb-6 leading-relaxed">
          {config.description}
        </p>

        {/* Configured Instructions Panel */}
        <div className="w-full max-w-lg p-4 rounded-xl bg-cartel-midnight/80 border border-white/10 text-left mb-8">
          <div className="text-[10px] font-cinzel text-cartel-amber uppercase tracking-wider font-bold mb-1">
            Organizers Briefing Note:
          </div>
          <p className="text-xs text-cartel-silver font-sans leading-relaxed">
            {config.instructions}
          </p>
        </div>

        {/* Tactical Recommendation */}
        <div className="text-xs text-cartel-silver/60 font-mono flex items-center gap-2">
          <span>💡 Tactical Protocol:</span>
          <span>You may freely advance to Stage 2 or Stage 3 without penalty.</span>
        </div>
      </div>

      {/* Skip Confirmation Modal */}
      <SkipStageModal
        isOpen={isSkipModalOpen}
        stageNumber={1}
        stageTitle={config.title}
        rewardCredits={config.rewardCredits}
        onContinue={() => setIsSkipModalOpen(false)}
        onConfirmSkip={() => {
          setIsSkipModalOpen(false);
          onSkipStage();
        }}
      />
    </div>
  );
};

