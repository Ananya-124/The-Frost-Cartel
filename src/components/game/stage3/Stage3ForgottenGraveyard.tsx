import React, { useState, useEffect } from 'react';
import type { Stage3Config } from '../../../types/round1.types';
import { round1Service } from '../../../services/round1Service';
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

interface Stage3ForgottenGraveyardProps {
  teamId: string;
  config: Stage3Config;
  initialCollectedFragments: string[];
  isCompleted: boolean;
  onReturnDashboard: () => void;
  onSkipStage: () => void;
  onStageCompleted: () => void;
}

export const Stage3ForgottenGraveyard: React.FC<Stage3ForgottenGraveyardProps> = ({
  teamId,
  config,
  initialCollectedFragments,
  isCompleted,
  onReturnDashboard,
  onSkipStage,
  onStageCompleted,
}) => {
  // Navigation / Active View State: 'overview' or focused coffin investigation
  const [activeView, setActiveView] = useState<'overview' | 'coffin1' | 'coffin2' | 'coffin3'>('overview');

  // Sync initial fragments into round1Service if provided
  const [collectedFragments, setCollectedFragments] = useState<string[]>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    const stored = session.stage3State?.collectedFragments ?? [];
    const merged = Array.from(new Set([...stored, ...(initialCollectedFragments || [])]));
    if (session.stage3State && merged.length > stored.length) {
      session.stage3State.collectedFragments = merged;
    }
    return merged;
  });

  // Authoritative stage 3 completion state (strictly 0..3)
  const [graveCompletion, setGraveCompletion] = useState(() =>
    round1Service.getStage3GraveCompletion(teamId)
  );

  // Modal visibility states
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isFinalGateOpen, setIsFinalGateOpen] = useState(false);
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);

  // Sound and Timer states
  const [isMuted, setIsMuted] = useState(soundController.isMuted());
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return round1Service.getTimeRemainingSeconds(teamId);
  });

  // Game progression states
  const [stageCleared, setStageCleared] = useState(isCompleted);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Coffin 1: Placed Bones
  const [placedBones, setPlacedBones] = useState<Record<string, string>>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    return session.stage3State?.placedBoneSlots ?? {};
  });

  // Coffin 2: Dug Soils & Coffer
  const [dugSoils, setDugSoils] = useState<string[]>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    return session.stage3State?.dugSoilIds ?? [];
  });
  const [isCofferUnlocked, setIsCofferUnlocked] = useState<boolean>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    return Boolean(session.stage3State?.grave2CofferUnlocked || session.stage3State?.grave2Completed);
  });

  // Coffin 3: Rune Rings
  const [ringIndices, setRingIndices] = useState<number[]>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    return session.stage3State?.grave3RingIndices ? [...session.stage3State.grave3RingIndices] : [0, 0, 0];
  });
  const [isGrave3Unlocked, setIsGrave3Unlocked] = useState<boolean>(() => {
    const session = round1Service.getTeamSession(teamId, '');
    return Boolean(session.stage3State?.grave3Unlocked || session.stage3State?.grave3Completed);
  });

  // Live countdown timer sync
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = round1Service.getTimeRemainingSeconds(teamId);
      setSecondsRemaining(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [teamId]);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleToggleMute = () => {
    const newMuted = soundController.toggleMute();
    setIsMuted(newMuted);
  };

  // Coffin Selection Guard: Completed coffins are permanently sealed and cannot be reopened
  const handleSelectCoffin = (coffinId: 'coffin1' | 'coffin2' | 'coffin3') => {
    const currentStatus = round1Service.getStage3GraveCompletion(teamId);
    if (coffinId === 'coffin1' && currentStatus.grave1) {
      showToast('✦ Coffin I is sealed • Fragment "BENEATH" already secured ✦');
      return;
    }
    if (coffinId === 'coffin2' && currentStatus.grave2) {
      showToast('✦ Coffin II is sealed • Fragment "EMBER" already secured ✦');
      return;
    }
    if (coffinId === 'coffin3' && currentStatus.grave3) {
      showToast('✦ Coffin III is sealed • Fragment "RETURNS" already secured ✦');
      return;
    }
    setActiveView(coffinId);
  };

  const handleFragmentUnlocked = (fragment: string) => {
    if (fragment === 'BENEATH' || fragment === 'THE') {
      round1Service.markGrave1Completed(teamId);
    } else if (fragment === 'EMBER' || fragment === 'NIGHT') {
      round1Service.markGrave2Completed(teamId, fragment);
    } else if (fragment === 'RETURNS') {
      round1Service.markGrave3Completed(teamId);
    }
    const updated = round1Service.getStage3GraveCompletion(teamId);
    setGraveCompletion(updated);
    setCollectedFragments((prev) => Array.from(new Set([...prev, fragment])));
    showToast(`Fragment Discovered: "${fragment}"! Added to Evidence Journal.`);
  };

  const handleGateUnlocked = () => {
    setStageCleared(true);
    onStageCompleted();
  };

  const session = round1Service.getTeamSession(teamId, '');
  const journalData = {
    grave1Fragment: graveCompletion.fragments.grave1 || (collectedFragments.includes('THE') ? 'THE' : null),
    grave2Fragment: graveCompletion.fragments.grave2 || (collectedFragments.includes('NIGHT') ? 'NIGHT' : null),
    grave3Fragment: graveCompletion.fragments.grave3 || (collectedFragments.includes('RETURNS') ? 'RETURNS' : null),
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
          secondsRemaining={secondsRemaining}
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
          <button
            type="button"
            disabled={graveCompletion.grave1}
            aria-disabled={graveCompletion.grave1}
            onClick={() => handleSelectCoffin('coffin1')}
          >
            Grave 1: Bone Chamber {graveCompletion.grave1 ? '(Completed)' : ''}
          </button>
          <button
            type="button"
            disabled={graveCompletion.grave2}
            aria-disabled={graveCompletion.grave2}
            onClick={() => handleSelectCoffin('coffin2')}
          >
            Grave 2: Buried Diary {graveCompletion.grave2 ? '(Completed)' : ''}
          </button>
          <button
            type="button"
            disabled={graveCompletion.grave3}
            aria-disabled={graveCompletion.grave3}
            onClick={() => handleSelectCoffin('coffin3')}
          >
            Grave 3: Rune Tombstone {graveCompletion.grave3 ? '(Completed)' : ''}
          </button>
          <button type="button" onClick={() => setIsJournalOpen(true)}>
            Evidence Journal ({graveCompletion.completedCount}/3)
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
            graveCompletion={graveCompletion}
            isCompleted={stageCleared}
            onSelectCoffin={handleSelectCoffin}
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
            config={config}
            collectedFragments={collectedFragments}
            placedBones={placedBones}
            secondsRemaining={secondsRemaining}
            stageCleared={stageCleared}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onReturnDashboard={onReturnDashboard}
            onReturnCemetery={() => {
              setGraveCompletion(round1Service.getStage3GraveCompletion(teamId));
              setActiveView('overview');
            }}
            onUpdatePlacedBones={(updated) => setPlacedBones(updated)}
            onFragmentUnlocked={handleFragmentUnlocked}
            onOpenJournal={() => setIsJournalOpen(true)}
          />
        )}

        {activeView === 'coffin2' && (
          <Grave2BuriedDiary
            key="grave2"
            teamId={teamId}
            config={config}
            collectedFragments={collectedFragments}
            dugSoils={dugSoils}
            isCofferUnlocked={isCofferUnlocked}
            secondsRemaining={secondsRemaining}
            stageCleared={stageCleared}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onReturnDashboard={onReturnDashboard}
            onReturnCemetery={() => {
              setGraveCompletion(round1Service.getStage3GraveCompletion(teamId));
              setActiveView('overview');
            }}
            onSoilDug={(soilId) => setDugSoils((prev) => [...prev, soilId])}
            onCofferUnlocked={() => {
              setIsCofferUnlocked(true);
              round1Service.markGrave2Completed(teamId, 'EMBER');
              setGraveCompletion(round1Service.getStage3GraveCompletion(teamId));
            }}
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
            secondsRemaining={secondsRemaining}
            stageCleared={stageCleared}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onReturnDashboard={onReturnDashboard}
            onReturnCemetery={() => {
              setGraveCompletion(round1Service.getStage3GraveCompletion(teamId));
              setActiveView('overview');
            }}
            onRotateRing={(ringIdx, dir) => {
              const res = round1Service.rotateRuneRing(teamId, ringIdx, dir);
              const curSession = round1Service.getTeamSession(teamId, '');
              setRingIndices([...curSession.stage3State.grave3RingIndices]);
              if (res.isCorrectSequence) {
                setIsGrave3Unlocked(true);
                setGraveCompletion(round1Service.getStage3GraveCompletion(teamId));
              }
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
        completedCount={graveCompletion.completedCount}
        onClose={() => setIsJournalOpen(false)}
      />

      {/* 4. The Arch-Lich Final Escape Gate Modal */}
      <FinalGateModal
        isOpen={isFinalGateOpen}
        teamId={teamId}
        collectedFragments={collectedFragments}
        completedCount={graveCompletion.completedCount}
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
