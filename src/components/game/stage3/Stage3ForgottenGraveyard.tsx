import React, { useState, useEffect } from 'react';
import type { Stage3Config } from '../../../types/round1.types';
import type { Round1TeamSessionState } from '../../../types/round1.types';
import type { Round1ActionResponse } from '../../../services/round1ApiService';
import { soundController } from '../../../utils/soundController';
import { Stage3HUD } from './Stage3HUD';
import { HauntedStage3Atmosphere } from './HauntedStage3Atmosphere';
import { GraveyardEnvironmentView } from './GraveyardEnvironmentView';
import { Grave1MarkedRemains } from './Grave1MarkedRemains';
import { Grave2BuriedDiary } from './Grave2BuriedDiary';
import { Grave3FinalTestament } from './Grave3FinalTestament';
import { EvidenceJournalModal } from './EvidenceJournalModal';
import { FinalGateModal } from './FinalGateModal';
import { SkipStageModal } from '../common/SkipStageModal';
import { useRound1TimerStore, type Round1TimerStore } from '../round1TimerStore';

interface Stage3ForgottenGraveyardProps {
  teamId: string;
  config: Stage3Config;
  initialSession: Round1TeamSessionState;
  timerStore?: Round1TimerStore;
  secondsRemaining?: number;
  onAction: (type: string, fields?: Record<string, unknown>) => Promise<Round1ActionResponse>;
  initialCollectedFragments: string[];
  isCompleted: boolean;
  onReturnDashboard: () => void;
  onSkipStage: () => void;
  onStageCompleted: () => void;
}

export const Stage3ForgottenGraveyard: React.FC<Stage3ForgottenGraveyardProps> = ({
  teamId,
  config,
  initialSession,
  timerStore,
  secondsRemaining = 25 * 60,
  onAction,
  initialCollectedFragments,
  isCompleted,
  onReturnDashboard,
  onSkipStage,
  onStageCompleted,
}) => {
  const resolvedTimerStore = useRound1TimerStore(timerStore, secondsRemaining);
  // Navigation / Active View State: 'overview' or focused coffin investigation
  const [activeView, setActiveView] = useState<'overview' | 'coffin1' | 'coffin2' | 'coffin3'>('overview');

  // Modal visibility states
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isFinalGateOpen, setIsFinalGateOpen] = useState(false);
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);

  // Sound and Timer states
  const [isMuted, setIsMuted] = useState(soundController.isMuted());

  // Game progression states
  const [collectedFragments, setCollectedFragments] = useState<string[]>(initialSession.stage3State.collectedFragments ?? initialCollectedFragments);
  const [stageCleared, setStageCleared] = useState(isCompleted);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Coffin 1: Placed Bones
  const [placedBones, setPlacedBones] = useState<Record<string, string>>(() => {
    return initialSession.stage3State?.placedBoneSlots ?? {};
  });

  // Coffin 2: Dug Soils & Coffer
  const [dugSoils, setDugSoils] = useState<string[]>(() => {
    return initialSession.stage3State?.dugSoilIds ?? [];
  });
  const [isCofferUnlocked, setIsCofferUnlocked] = useState<boolean>(() => {
    return initialSession.stage3State?.grave2CofferUnlocked ?? false;
  });

  // Coffin 3: Rune Rings
  const [ringIndices, setRingIndices] = useState<number[]>(initialSession.stage3State.grave3RingIndices ?? [0, 0, 0]);
  const [isGrave3Unlocked, setIsGrave3Unlocked] = useState(Boolean(initialSession.stage3State.grave3Unlocked));

  useEffect(() => {
    const state = initialSession.stage3State;
    setCollectedFragments(state.collectedFragments ?? initialCollectedFragments);
    setPlacedBones(state.placedBoneSlots ?? {});
    setDugSoils(state.dugSoilIds ?? []);
    setIsCofferUnlocked(Boolean(state.grave2CofferUnlocked));
    setRingIndices(state.grave3RingIndices ?? [0, 0, 0]);
    setIsGrave3Unlocked(Boolean(state.grave3Unlocked));
  }, [initialSession, initialCollectedFragments]);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleToggleMute = () => {
    const newMuted = soundController.toggleMute();
    setIsMuted(newMuted);
  };

  const handleFragmentUnlocked = (fragment: string) => {
    if (!collectedFragments.includes(fragment)) {
      const updated = [...collectedFragments, fragment];
      setCollectedFragments(updated);
      showToast(`Fragment Discovered: "${fragment}"! Added to Evidence Journal.`);
    }
  };

  const handleGateUnlocked = () => {
    setStageCleared(true);
    onStageCompleted();
  };

  const session = initialSession;
  const journalData = {
    grave1Fragment: collectedFragments.includes('BENEATH') ? 'BENEATH' : (collectedFragments.includes('THE') ? 'THE' : session.evidenceJournal?.grave1Fragment),
    grave2Fragment: collectedFragments.includes('EMBER')
      ? 'EMBER'
      : (collectedFragments.includes('NIGHT') ? 'NIGHT' : session.evidenceJournal?.grave2Fragment),
    grave3Fragment: collectedFragments.includes('RETURNS') ? 'RETURNS' : session.evidenceJournal?.grave3Fragment,
    notes: session.evidenceJournal?.notes ?? [],
    unlockedCodes: session.evidenceJournal?.unlockedCodes ?? [],
  };

  return (
    <div
      className={`relative w-full flex flex-col justify-between text-stone-100 font-sans select-none animate-fadeIn ${
        activeView === 'overview' || activeView === 'coffin2'
          ? 'h-screen h-[100dvh] overflow-hidden min-h-0'
          : 'min-h-screen overflow-x-hidden'
      }`}
    >
      {/* 0. Full-Screen Cinematic Haunted Mansion & Cemetery Backdrop with Live Bats, Crows & Ghosts */}
      <HauntedStage3Atmosphere />

      {/* 1. Master Top HUD Header (Shown on Graveyard Overview) */}
      {activeView === 'overview' && (
        <Stage3HUD
          timerStore={resolvedTimerStore}
          stageCleared={stageCleared}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onReturnDashboard={onReturnDashboard}
          teamName={session.teamName || 'FROST CARTEL'}
          credits={config.rewardCredits || 250}
        />
      )}

      {/* Semantic Accessibility Fallback when inside a coffin sub-view */}
      {activeView !== 'overview' && (
        <nav aria-label="Grave shortcuts" className="sr-only">
          <span>The Forgotten Graveyard</span>
          <span>The Cursed Sepulcher Grounds</span>
          <span>The Bone Chamber</span>
          <span>The Buried Diary</span>
          <span>The Rune Tombstone</span>
          <button type="button" onClick={() => setActiveView('overview')}>
            Graveyard Overview
          </button>
          <button type="button" onClick={() => setActiveView('coffin1')}>
            Grave 1: Bone Chamber
          </button>
          <button type="button" onClick={() => setActiveView('coffin2')}>
            Grave 2: Buried Diary
          </button>
          <button type="button" onClick={() => setActiveView('coffin3')}>
            Grave 3: Rune Tombstone
          </button>
          <button type="button" onClick={() => setIsJournalOpen(true)}>
            Evidence Journal ({collectedFragments.length}/3)
          </button>
          <button type="button" onClick={() => setIsFinalGateOpen(true)}>
            Final Escape Gate
          </button>
        </nav>
      )}

      {/* Floating Alert Toast */}
      {toastNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-black/95 border-2 border-amber-500 text-amber-200 font-cinzel text-xs font-bold tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-fadeIn flex items-center gap-2">
          <span>⚡</span>
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 2. Main Exploration Surface */}
      <main className="relative z-10 flex-1 w-full flex flex-col justify-center items-center">
        {activeView === 'overview' && (
          <GraveyardEnvironmentView
            config={config}
            collectedFragments={collectedFragments}
            isCompleted={stageCleared}
            onSelectCoffin={(coffinId) => setActiveView(coffinId)}
            onOpenJournal={() => setIsJournalOpen(true)}
            onOpenFinalGate={() => setIsFinalGateOpen(true)}
            onReturnDashboard={onReturnDashboard}
            onSkipStage={() => setIsSkipModalOpen(true)}
          />
        )}

        {activeView === 'coffin1' && (
          <Grave1MarkedRemains
            key="grave1"
            teamId={teamId}
            onAction={onAction}
            initialSession={initialSession}
            config={config}
            collectedFragments={collectedFragments}
            placedBones={placedBones}
            timerStore={resolvedTimerStore}
            stageCleared={stageCleared}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onReturnDashboard={onReturnDashboard}
            onReturnCemetery={() => setActiveView('overview')}
            onUpdatePlacedBones={(updated) => setPlacedBones(updated)}
            onFragmentUnlocked={handleFragmentUnlocked}
            onOpenJournal={() => setIsJournalOpen(true)}
          />
        )}

        {activeView === 'coffin2' && (
          <Grave2BuriedDiary
            key="grave2"
            teamId={teamId}
            onAction={onAction}
            config={config}
            collectedFragments={collectedFragments}
            dugSoils={dugSoils}
            isCofferUnlocked={isCofferUnlocked}
            timerStore={resolvedTimerStore}
            stageCleared={stageCleared}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onReturnDashboard={onReturnDashboard}
            onReturnCemetery={() => setActiveView('overview')}
            onSoilDug={(soilId) => setDugSoils((prev) => [...prev, soilId])}
            onCofferUnlocked={() => setIsCofferUnlocked(true)}
            onFragmentUnlocked={handleFragmentUnlocked}
            onOpenJournal={() => setIsJournalOpen(true)}
          />
        )}

        {activeView === 'coffin3' && (
          <Grave3FinalTestament
            key="grave3"
            teamId={teamId}
            config={config}
            collectedFragments={collectedFragments}
            ringIndices={ringIndices}
            isGrave3Unlocked={isGrave3Unlocked}
            timerStore={resolvedTimerStore}
            stageCleared={stageCleared}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onReturnDashboard={onReturnDashboard}
            onReturnCemetery={() => setActiveView('overview')}
            onRotateRing={async (ringIdx, dir) => {
              try {
                const result = await onAction('stage3.rotateRune', { ringIndex: ringIdx, direction: dir });
                setRingIndices(result.session.stage3State.grave3RingIndices);
                setIsGrave3Unlocked(Boolean(result.session.stage3State.grave3Unlocked));
                setCollectedFragments(result.session.stage3State.collectedFragments);
                if (result.session.stage3State.grave3Unlocked) handleFragmentUnlocked('RETURNS');
              } catch (error) { showToast(error instanceof Error ? error.message : 'Rune rotation could not be saved.'); }
            }}
            onFragmentUnlocked={handleFragmentUnlocked}
            onOpenJournal={() => setIsJournalOpen(true)}
          />
        )}
      </main>

      {/* 3. Investigator Field Journal Modal */}
      <EvidenceJournalModal
        isOpen={isJournalOpen}
        journal={journalData}
        collectedFragments={collectedFragments}
        onClose={() => setIsJournalOpen(false)}
      />

      {/* 4. The Arch-Lich Final Escape Gate Modal */}
      <FinalGateModal
        isOpen={isFinalGateOpen}
        teamId={teamId}
        onAction={onAction}
        collectedFragments={collectedFragments}
        isCompleted={stageCleared}
        onGateUnlocked={handleGateUnlocked}
        onClose={() => setIsFinalGateOpen(false)}
      />

      {/* 5. Skip Stage Modal */}
      {isSkipModalOpen && (
        <SkipStageModal
          isOpen={isSkipModalOpen}
          stageNumber={3}
          stageTitle={config.title}
          rewardCredits={config.rewardCredits}
          onContinue={() => setIsSkipModalOpen(false)}
          onConfirmSkip={() => {
            setIsSkipModalOpen(false);
            onSkipStage();
          }}
        />
      )}
    </div>
  );
};
