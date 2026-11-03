import React, { useState, useEffect } from 'react';
import type { HuntImage, Hotspot, Stage2Config } from '../../../types/round1.types';
import { round1Service } from '../../../services/round1Service';
import { soundController } from '../../../utils/soundController';
import { Stage2HUD } from './Stage2HUD';
import { RelicChecklistBar } from './RelicChecklistBar';
import { HauntedEvidenceTable } from './HauntedEvidenceTable';
import { PhotoInspectionViewer } from './PhotoInspectionViewer';
import { Stage2BottomBar } from './Stage2BottomBar';
import { HintModal } from './HintModal';
import { SkipStageModal } from '../common/SkipStageModal';

interface Stage2HauntedImageHuntProps {
  teamId: string;
  config: Stage2Config;
  initialFoundTargetIds: string[];
  isCompleted: boolean;
  onReturnDashboard: () => void;
  onSkipStage: () => void;
  onStageCompleted: () => void;
}

export const Stage2HauntedImageHunt: React.FC<Stage2HauntedImageHuntProps> = ({
  teamId,
  config,
  initialFoundTargetIds,
  isCompleted,
  onReturnDashboard,
  onSkipStage,
  onStageCompleted,
}) => {
  const [foundIds, setFoundIds] = useState<string[]>(initialFoundTargetIds);
  const [activeImage, setActiveImage] = useState<HuntImage | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [activeHintImageId, setActiveHintImageId] = useState<string | null>(null);
  const [stageCleared, setStageCleared] = useState(isCompleted);
  const [isMuted, setIsMuted] = useState(soundController.isMuted());
  const [secondsRemaining, setSecondsRemaining] = useState(() =>
    round1Service.getTimeRemainingSeconds(teamId)
  );

  // Synchronize master round countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(round1Service.getTimeRemainingSeconds(teamId));
    }, 1000);
    return () => clearInterval(timer);
  }, [teamId]);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleToggleMute = () => {
    const muted = soundController.toggleMute();
    setIsMuted(muted);
  };

  const handleOpenImage = (img: HuntImage) => {
    soundController.playClick();
    setActiveImage(img);
  };

  const handleCloseImage = () => {
    soundController.playClick();
    setActiveImage(null);
  };

  // Hotspot Click Handler inside Photo Inspector
  const handleHotspotClick = (hotspot: Hotspot) => {
    if (stageCleared) return;

    const targetItem = config.targets.find((t) => t.id === hotspot.targetId);
    const targetName = targetItem?.name ?? hotspot.name;

    if (foundIds.includes(hotspot.targetId)) {
      soundController.playClick();
      showToast(`Already Discovered: ${targetName}`);
      return;
    }

    // New valid discovery!
    soundController.playDiscover();
    const res = round1Service.registerStage2Discovery(
      teamId,
      hotspot.targetId,
      activeImage?.id || ''
    );
    const updatedFound = [...foundIds, hotspot.targetId];
    setFoundIds(updatedFound);
    showToast(`🎯 Uncovered: ${targetName} (${res.totalFound}/${config.targets.length})`);

    if (res.completed) {
      soundController.playVictory();
      setStageCleared(true);
      onStageCompleted();
    }
  };

  // Click on background of photo (missed click)
  const handleMissedClick = () => {
    if (stageCleared) return;

    if (config.incorrectClickPenalty > 0) {
      soundController.playError();
      const { penalty } = round1Service.recordPenalty(
        teamId,
        'stage-2',
        'Incorrect artifact click in search board'
      );
      showToast(`False discovery. The crypt mists stir (-${penalty} CR).`);
    } else {
      soundController.playClick();
      showToast('Nothing hidden here. Inspect another shadow.');
    }
  };

  // Confirm and deliver hint
  const handleConfirmHint = () => {
    setIsHintModalOpen(false);
    const unfound = config.targets.find((t) => !foundIds.includes(t.id));
    if (!unfound) {
      showToast('All 12 cursed relics have already been found!');
      return;
    }

    const hostImage = config.images.find((img) =>
      img.hotspots.some((h) => h.targetId === unfound.id)
    );

    if (hostImage) {
      const { deduction } = round1Service.useHint(
        teamId,
        'stage-2',
        `Revealed container for ${unfound.name}`
      );
      setActiveHintImageId(hostImage.id);
      soundController.playDiscover();
      showToast(
        `Clue unsealed! Look closely inside "${hostImage.title}" (-${deduction} CR).`
      );
      setTimeout(() => setActiveHintImageId(null), 14000);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0a0502] text-stone-100 flex flex-col justify-between font-sans overflow-x-hidden select-none">
      {/* 1. Header with Stage Branding & Synchronized Round HUD */}
      <Stage2HUD
        secondsRemaining={secondsRemaining}
        stageCleared={stageCleared}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onReturnDashboard={onReturnDashboard}
      />

      {/* Floating Ghost Toast Notification */}
      {toastNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#180d05]/95 border-2 border-amber-500/90 text-xs sm:text-sm font-cinzel font-bold text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.65)] animate-fadeIn flex items-center gap-2.5"
        >
          <span aria-hidden="true">⚡</span>
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 2. Compact 12-Relic Discovery Progress Checklist */}
      <main className="flex-1 flex flex-col justify-between max-w-[1440px] w-full mx-auto px-2 sm:px-4 py-1">
        <RelicChecklistBar targets={config.targets} foundIds={foundIds} />

        {/* 3. The Central Haunted Detective Evidence Table */}
        <HauntedEvidenceTable
          images={config.images}
          activeHintImageId={activeHintImageId}
          onOpenImage={handleOpenImage}
        />
      </main>

      {/* 4. Bottom Tactical Bar */}
      <Stage2BottomBar
        hintDeduction={config.hintDeduction}
        stageCleared={stageCleared}
        onOpenHintModal={() => setIsHintModalOpen(true)}
        onOpenSkipModal={() => setIsSkipModalOpen(true)}
        onReturnDashboard={onReturnDashboard}
      />

      {/* 5. Full-Screen Photo Inspection Modal View */}
      {activeImage && (
        <PhotoInspectionViewer
          image={activeImage}
          foundTargetIds={foundIds}
          stageCleared={stageCleared}
          onClose={handleCloseImage}
          onHotspotClick={handleHotspotClick}
          onMissedClick={handleMissedClick}
        />
      )}

      {/* 6. Hint Confirmation Modal Dialog */}
      <HintModal
        isOpen={isHintModalOpen}
        deductionCredits={config.hintDeduction}
        onCancel={() => setIsHintModalOpen(false)}
        onConfirm={handleConfirmHint}
      />

      {/* 7. Skip Stage Confirmation Modal Dialog */}
      <SkipStageModal
        isOpen={isSkipModalOpen}
        stageNumber={2}
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
