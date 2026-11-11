import React, { useState, useEffect, useRef } from 'react';
import type { HuntImage, Hotspot, Stage2Config } from '../../../types/round1.types';
import type { Round1ActionResponse } from '../../../services/round1ApiService';
import { soundController } from '../../../utils/soundController';
import { Stage2HUD } from './Stage2HUD';
import { useRound1TimerStore, type Round1TimerStore } from '../round1TimerStore';
import { RelicChecklistBar } from './RelicChecklistBar';
import { HauntedEvidenceTable } from './HauntedEvidenceTable';
import { PhotoInspectionViewer } from './PhotoInspectionViewer';
import { Stage2BottomBar } from './Stage2BottomBar';
import { HintModal } from './HintModal';
import { SkipStageModal } from '../common/SkipStageModal';
import { TargetCalibrationModal } from './TargetCalibrationModal';
import { normalizeTargetId } from './stage2TargetsConfig';

interface Stage2HauntedImageHuntProps {
  teamId: string;
  config: Stage2Config;
  initialFoundTargetIds: string[];
  timerStore?: Round1TimerStore;
  secondsRemaining?: number;
  onAction: (type: string, fields?: Record<string, unknown>) => Promise<Round1ActionResponse>;
  isCompleted: boolean;
  onReturnDashboard: () => void;
  onSkipStage: () => void;
  onStageCompleted: () => void;
}

export const Stage2HauntedImageHunt: React.FC<Stage2HauntedImageHuntProps> = ({
  teamId: _teamId,
  config,
  initialFoundTargetIds,
  timerStore,
  secondsRemaining = 25 * 60,
  onAction,
  isCompleted,
  onReturnDashboard,
  onSkipStage,
  onStageCompleted,
}) => {
  const resolvedTimerStore = useRound1TimerStore(timerStore, secondsRemaining);
  const [foundIds, setFoundIds] = useState<string[]>(initialFoundTargetIds);
  const [activeImage, setActiveImage] = useState<HuntImage | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [isCalibOpen, setIsCalibOpen] = useState(false);
  const [activeHintImageId, setActiveHintImageId] = useState<string | null>(null);
  const [stageCleared, setStageCleared] = useState(isCompleted);
  const [isMuted, setIsMuted] = useState(soundController.isMuted());

  // Keyboard shortcut Ctrl+Shift+C to toggle calibration modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        setIsCalibOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => setFoundIds(initialFoundTargetIds), [initialFoundTargetIds]);

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
  const actionPendingRef = useRef(false);
  const handleHotspotClick = async (hotspot: Hotspot) => {
    if (stageCleared || actionPendingRef.current) return;

    const normTargetId = normalizeTargetId(hotspot.targetId);
    const targetItem = config.targets.find(
      (t) => normalizeTargetId(t.id) === normTargetId || t.id === hotspot.targetId
    );
    const targetName = targetItem?.name ?? hotspot.name;

    if (
      foundIds.some(
        (id) => normalizeTargetId(id) === normTargetId || id === hotspot.targetId
      )
    ) {
      soundController.playClick();
      showToast(`Already Discovered: ${targetName}`);
      return;
    }

    // New valid discovery!
    actionPendingRef.current = true;
    try {
      const res = await onAction('stage2.discover', { targetId: normTargetId, imageId: activeImage?.id || '' });
      const updated = res.session.stage2State.foundTargetIds;
      setFoundIds(updated);
      soundController.playDiscover();
      showToast(`🎯 Uncovered: ${targetName} (${updated.length}/${config.targets.length})`);
      if (res.session.stages['stage-2'].status === 'completed') { soundController.playVictory(); setStageCleared(true); onStageCompleted(); }
    } catch (error) { showToast(error instanceof Error ? error.message : 'Discovery could not be confirmed.'); }
    finally { actionPendingRef.current = false; }
  };

  // Click on background of photo (missed click)
  const handleMissedClick = async () => {
    if (stageCleared || actionPendingRef.current) return;
    actionPendingRef.current = true;
    try {
      soundController.playError();
      const result = await onAction('stage2.missed');
      const penalty = Number(result.penalty ?? config.incorrectClickPenalty);
      showToast(`False discovery. The crypt mists stir (-${penalty} CR).`);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Miss could not be recorded.'); }
    finally { actionPendingRef.current = false; }
  };

  // Confirm and deliver hint
  const handleConfirmHint = async () => {
    setIsHintModalOpen(false);
    if (actionPendingRef.current) return;
    actionPendingRef.current = true;
    try {
      const result = await onAction('stage2.hint');
      const hostImage = config.images.find((img) => img.id === result.imageId);
      if (!hostImage) throw new Error('The server returned an unavailable clue image.');
      setActiveHintImageId(hostImage.id);
      soundController.playDiscover();
      showToast(`Clue unsealed! Look closely inside "${hostImage.title}" (-${Number(result.deduction ?? config.hintDeduction)} CR).`);
      setTimeout(() => setActiveHintImageId(null), 14000);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Hint could not be loaded.'); }
    finally { actionPendingRef.current = false; }
  };

  return (
    <div
      className="relative h-screen h-[100dvh] w-full bg-[#050302] text-stone-100 flex flex-col justify-between font-sans overflow-hidden select-none min-h-0"
      style={{
        backgroundImage: "radial-gradient(ellipse at 12% 50%, rgba(245, 158, 11, 0.14) 0%, transparent 45%), radial-gradient(ellipse at 50% 15%, rgba(185, 28, 28, 0.08) 0%, transparent 55%), url('/assets/stage-02/evidence-board/detective-table-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Heavy Gothic Horror Vignette & Atmospheric Shadow Layer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.7)_60%,rgba(5,2,1,0.95)_100%)] pointer-events-none z-0"
      />
      {/* 1. Header with Stage Branding & Synchronized Round HUD */}
      <Stage2HUD
        timerStore={resolvedTimerStore}
        stageCleared={stageCleared}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onReturnDashboard={onReturnDashboard}
        onOpenCalibration={() => setIsCalibOpen(true)}
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
      <main className="flex-1 min-h-0 flex flex-col justify-between max-w-[1440px] w-full mx-auto px-2 sm:px-4 py-0.5 sm:py-1 overflow-hidden">
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

      {/* 8. Developer Target Calibration Tool Modal */}
      <TargetCalibrationModal
        images={config.images}
        isOpen={isCalibOpen}
        onClose={() => setIsCalibOpen(false)}
        onTestDiscover={handleHotspotClick}
      />
    </div>
  );
};
