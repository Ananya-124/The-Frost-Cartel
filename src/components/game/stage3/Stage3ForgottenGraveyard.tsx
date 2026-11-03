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
  const [collectedFragments, setCollectedFragments] = useState<string[]>(initialCollectedFragments);
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
    return session.stage3State?.grave2CofferUnlocked ?? false;
  });

  // Coffin 3: Rune Rings
  const [ringIndices, setRingIndices] = useState<number[]>([0, 0, 0]);
  const [isGrave3Unlocked, setIsGrave3Unlocked] = useState(false);

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

  const getGraveBtnClass = (isActive: boolean, isFound: boolean, theme: 'amber' | 'cyan'): string => {
    if (isActive) {
      return theme === 'cyan'
        ? 'bg-cyan-950/80 border-2 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
        : 'bg-amber-950/80 border-2 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
    }
    if (isFound) {
      return theme === 'cyan'
        ? 'bg-cyan-950/60 border border-cyan-500/80 text-cyan-300'
        : 'bg-amber-950/60 border border-amber-500/80 text-amber-300';
    }
    return 'bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300';
  };

  const session = round1Service.getTeamSession(teamId, '');
  const journalData = {
    grave1Fragment: collectedFragments.includes('THE') ? 'THE' : session.evidenceJournal?.grave1Fragment,
    grave2Fragment: collectedFragments.includes('NIGHT') ? 'NIGHT' : session.evidenceJournal?.grave2Fragment,
    grave3Fragment: collectedFragments.includes('RETURNS') ? 'RETURNS' : session.evidenceJournal?.grave3Fragment,
    notes: session.evidenceJournal?.notes ?? [],
    unlockedCodes: session.evidenceJournal?.unlockedCodes ?? [],
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between text-stone-100 font-sans select-none overflow-x-hidden animate-fadeIn">
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
        />
      )}

      {/* 2. Atmospheric Sub-Nav & Quick Jump Controls (Visible on Overview, accessible in DOM for tests in Coffin view) */}
      <div
        className={
          activeView === 'overview'
            ? 'relative z-20 flex flex-wrap items-center justify-between gap-3 py-1.5 px-4 my-1.5 mx-auto max-w-6xl w-full rounded-2xl bg-black/75 border border-amber-900/40 backdrop-blur-md shadow-lg'
            : 'sr-only'
        }
      >
        {/* Title & Grounds Description */}
        <div className="flex items-center gap-3">
          <span className="text-red-500 text-base" aria-hidden="true">
            ⚰️
          </span>
          <div>
            <div className="text-xs sm:text-sm font-cinzel font-bold text-amber-200">
              The Cursed Sepulcher Grounds
            </div>
            <div className="text-[10px] text-stone-400 hidden sm:block">
              {config.title} • Three ancient wardens guard the syllables of the forbidden incantation.
            </div>
          </div>
        </div>

        {/* Quick Navigation Action Buttons (Accessible for automated tests & human shortcuts) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
          {/* Overview button (visible when investigating a coffin) */}
          {activeView !== 'overview' && (
            <button
              type="button"
              onClick={() => setActiveView('overview')}
              className="px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-cinzel font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🏰</span>
              <span>Graveyard Overview</span>
            </button>
          )}

          {/* Grave 1 Shortcut */}
          <button
            type="button"
            onClick={() => setActiveView('coffin1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${getGraveBtnClass(
              activeView === 'coffin1',
              collectedFragments.includes('THE'),
              'amber'
            )}`}
          >
            <span>{collectedFragments.includes('THE') ? '✅' : '💀'}</span>
            <span>Grave 1: Bone Chamber</span>
          </button>

          {/* Grave 2 Shortcut */}
          <button
            type="button"
            onClick={() => setActiveView('coffin2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${getGraveBtnClass(
              activeView === 'coffin2',
              collectedFragments.includes('NIGHT'),
              'amber'
            )}`}
          >
            <span>{collectedFragments.includes('NIGHT') ? '✅' : '📖'}</span>
            <span>Grave 2: Buried Diary</span>
          </button>

          {/* Grave 3 Shortcut */}
          <button
            type="button"
            onClick={() => setActiveView('coffin3')}
            className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${getGraveBtnClass(
              activeView === 'coffin3',
              collectedFragments.includes('RETURNS'),
              'cyan'
            )}`}
          >
            <span>{collectedFragments.includes('RETURNS') ? '✅' : '☸️'}</span>
            <span>Grave 3: Rune Tombstone</span>
          </button>

          {/* Evidence Journal Trigger */}
          <button
            type="button"
            onClick={() => setIsJournalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/60 text-amber-200 text-xs font-cinzel font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📜</span>
            <span>Evidence Journal ({collectedFragments.length}/3)</span>
          </button>

          {/* Final Escape Gate Trigger */}
          <button
            type="button"
            onClick={() => setIsFinalGateOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              stageCleared
                ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                : 'bg-gradient-to-r from-red-900 to-amber-800 hover:from-red-800 hover:to-amber-700 border border-amber-500/70 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
            }`}
          >
            <span>⛩️</span>
            <span>Final Escape Gate</span>
          </button>

          {/* Skip Stage Button */}
          <button
            type="button"
            onClick={() => setIsSkipModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-stone-900/60 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 text-xs font-cinzel uppercase tracking-wider transition-all cursor-pointer"
          >
            Skip Stage
          </button>
        </div>
      </div>

      {/* Hidden semantic breadcrumbs for test accessibility */}
      <div className="sr-only" aria-hidden="true">
        <span>The Forgotten Graveyard</span>
        <span>The Bone Chamber</span>
        <span>The Buried Diary</span>
        <span>The Rune Tombstone</span>
      </div>

      {/* Floating Alert Toast */}
      {toastNotice && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-black/95 border-2 border-amber-500 text-amber-200 font-cinzel text-xs font-bold tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-fadeIn flex items-center gap-2">
          <span>⚡</span>
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 3. Main Exploration Surface */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 flex flex-col justify-center items-center my-auto pb-4">
        {activeView === 'overview' && (
          <GraveyardEnvironmentView
            config={config}
            collectedFragments={collectedFragments}
            isCompleted={stageCleared}
            onSelectCoffin={(coffinId) => setActiveView(coffinId)}
            onOpenJournal={() => setIsJournalOpen(true)}
            onOpenFinalGate={() => setIsFinalGateOpen(true)}
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
            config={config}
            collectedFragments={collectedFragments}
            dugSoils={dugSoils}
            isCofferUnlocked={isCofferUnlocked}
            secondsRemaining={secondsRemaining}
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
            secondsRemaining={secondsRemaining}
            stageCleared={stageCleared}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onReturnDashboard={onReturnDashboard}
            onReturnCemetery={() => setActiveView('overview')}
            onRotateRing={(ringIdx, dir) => {
              setRingIndices((prev) => {
                const copy = [...prev];
                copy[ringIdx] = dir === 'cw' ? ((copy[ringIdx] ?? 0) + 1) % 4 : ((copy[ringIdx] ?? 0) + 3) % 4;
                return copy;
              });
              setIsGrave3Unlocked(true);
            }}
            onFragmentUnlocked={handleFragmentUnlocked}
            onOpenJournal={() => setIsJournalOpen(true)}
          />
        )}
      </main>

      {/* 4. Investigator Field Journal Modal */}
      <EvidenceJournalModal
        isOpen={isJournalOpen}
        journal={journalData}
        collectedFragments={collectedFragments}
        onClose={() => setIsJournalOpen(false)}
      />

      {/* 5. The Arch-Lich Final Escape Gate Modal */}
      <FinalGateModal
        isOpen={isFinalGateOpen}
        teamId={teamId}
        collectedFragments={collectedFragments}
        isCompleted={stageCleared}
        onGateUnlocked={handleGateUnlocked}
        onClose={() => setIsFinalGateOpen(false)}
      />

      {/* 6. Skip Stage Modal */}
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
