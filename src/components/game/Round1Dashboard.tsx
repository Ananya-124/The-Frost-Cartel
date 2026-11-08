import React, { useState, useEffect } from 'react';
import type { TeamSession } from '../../types/team.types';
import type { StageId } from '../../types/round.types';
import { round1Service } from '../../services/round1Service';
import { soundController } from '../../utils/soundController';
import { Stage1Framework } from './stage1/Stage1Framework';
import { Stage1PumpkinShuffle } from './stage1/Stage1PumpkinShuffle';
import { Stage2HauntedImageHunt } from './stage2/Stage2HauntedImageHunt';
import { Stage3ForgottenGraveyard } from './stage3/Stage3ForgottenGraveyard';
import { HauntedGraveyardAtmosphere } from './haunted/HauntedGraveyardAtmosphere';
import { GothicRound1HUD } from './haunted/GothicRound1HUD';
import { HauntedPortalCard } from './haunted/HauntedPortalCard';

interface Round1DashboardProps {
  session: TeamSession;
  onReturnHome: () => void;
  onOpenDashboard?: () => void;
  onUpdateCredits: (newCredits: number) => void;
}

export const Round1Dashboard: React.FC<Round1DashboardProps> = ({
  session,
  onReturnHome,
  onOpenDashboard: _onOpenDashboard,
  onUpdateCredits,
}) => {
  const [teamSession, setTeamSession] = useState(() => {
    const status = round1Service.getRound1Status();
    const current = round1Service.getTeamSession(session.teamId, session.teamName);
    const remaining = round1Service.getTimeRemainingSeconds(session.teamId);
    if (status === 'running' && (!current.roundStartTime || remaining <= 0 || current.status === 'expired')) {
      return round1Service.beginRound1(session.teamId, session.teamName, true);
    }
    return current;
  });
  const [secondsRemaining, setSecondsRemaining] = useState(() =>
    round1Service.getTimeRemainingSeconds(session.teamId)
  );
  const [isMuted, setIsMuted] = useState(soundController.isMuted());
  const [activeStageId, setActiveStageId] = useState<StageId | null>(null);

  // Synchronize timer and cross-tab storage
  useEffect(() => {
    const syncState = () => {
      const remaining = round1Service.getTimeRemainingSeconds(session.teamId);
      setSecondsRemaining(remaining);
      setTeamSession(round1Service.getTeamSession(session.teamId, session.teamName));
    };

    const timer = setInterval(syncState, 1000);

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'frost_cartel_round1_status' ||
        e.key === 'frost_cartel_round1_duration' ||
        e.key === 'frost_cartel_round1_sessions'
      ) {
        syncState();
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', handleStorage);
    };
  }, [session.teamId, session.teamName]);

  const handleToggleMute = () => {
    const muted = soundController.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectStage = (stageId: StageId) => {
    soundController.playClick();
    // Ensure timer is active and running when entering any stage
    const remaining = round1Service.getTimeRemainingSeconds(session.teamId);
    if (!teamSession.roundStartTime || teamSession.status === 'expired' || remaining <= 0) {
      round1Service.beginRound1(session.teamId, session.teamName, true);
    }
    const updated = round1Service.enterStage(session.teamId, stageId);
    setTeamSession({ ...updated });
    setActiveStageId(stageId);
  };

  const handleSkipStage = (stageId: StageId) => {
    soundController.playClick();
    const updated = round1Service.skipStage(session.teamId, stageId);
    setTeamSession({ ...updated });
    setActiveStageId(null);
  };

  const handleStageCompleted = () => {
    soundController.playVictory();
    const updated = round1Service.getTeamSession(session.teamId, session.teamName);
    setTeamSession({ ...updated });
    onUpdateCredits(updated.credits);
  };

  const stage1Config = round1Service.getStage1Config();
  const stage2Config = round1Service.getStage2Config();
  const stage3Config = round1Service.getStage3Config();

  // Active Stage 1 View
  if (activeStageId === 'stage-1') {
    return (
      <div className="relative min-h-screen bg-cartel-void text-cartel-bone flex flex-col font-sans overflow-x-hidden">
        {teamSession.stages['stage-1'].status === 'not_configured' ? (
          <Stage1Framework
            config={stage1Config}
            onReturnDashboard={() => setActiveStageId(null)}
            onSkipStage={() => handleSkipStage('stage-1')}
          />
        ) : (
          <Stage1PumpkinShuffle
            teamId={session.teamId}
            config={stage1Config}
            onReturnDashboard={() => setActiveStageId(null)}
            onSkipStage={() => handleSkipStage('stage-1')}
            onCreditsAwarded={handleStageCompleted}
          />
        )}
      </div>
    );
  }

  // Active Stage 2 View
  if (activeStageId === 'stage-2') {
    return (
      <div className="relative min-h-screen bg-cartel-void text-cartel-bone flex flex-col font-sans overflow-x-hidden">
        <Stage2HauntedImageHunt
          teamId={session.teamId}
          config={stage2Config}
          initialFoundTargetIds={teamSession.stage2State.foundTargetIds}
          isCompleted={teamSession.stages['stage-2'].status === 'completed'}
          onReturnDashboard={() => setActiveStageId(null)}
          onSkipStage={() => handleSkipStage('stage-2')}
          onStageCompleted={handleStageCompleted}
        />
      </div>
    );
  }

  // Active Stage 3 View
  if (activeStageId === 'stage-3') {
    return (
      <div className="relative min-h-screen bg-black text-cartel-bone flex flex-col font-sans overflow-x-hidden">
        <Stage3ForgottenGraveyard
          teamId={session.teamId}
          config={stage3Config}
          initialCollectedFragments={teamSession.stage3State.collectedFragments}
          isCompleted={teamSession.stages['stage-3'].status === 'completed'}
          onReturnDashboard={() => setActiveStageId(null)}
          onSkipStage={() => handleSkipStage('stage-3')}
          onStageCompleted={handleStageCompleted}
        />
      </div>
    );
  }

  // Main Round 1 Dashboard View
  const isTeamStarted = Boolean(teamSession.roundStartTime);
  const isExpired = teamSession.status === 'expired' || secondsRemaining <= 0;

  return (
    <div className="relative min-h-screen md:h-screen w-full bg-black text-stone-100 flex flex-col justify-between font-sans overflow-y-auto md:overflow-hidden select-none">
      {/* 1. Full-Screen Cinematic Haunted Graveyard Atmosphere */}
      <HauntedGraveyardAtmosphere />

      {/* 2. Compact Minimal Top HUD */}
      <GothicRound1HUD
        session={session}
        secondsRemaining={secondsRemaining}
        isTeamStarted={isTeamStarted}
        credits={teamSession.credits}
        isMuted={isMuted}
        durationMinutes={round1Service.getDurationMinutes()}
        onToggleMute={handleToggleMute}
        onReturnHome={onReturnHome}
      />

      {/* 3. Centered Main Header & Three Gothic Arch Portals */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-col justify-center items-center my-auto">
        {/* Centered Main Heading (Highest Visual Priority) */}
        <div className="flex flex-col items-center text-center mb-3 sm:mb-5 max-w-full">
          {/* Accessible Screen-Reader Anchor */}
          <span className="sr-only">ROUND 01 • MASTER PORTAL</span>

          {/* ROUND 01 Label */}
          <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs md:text-sm font-cinzel font-bold text-amber-400 tracking-[0.25em] sm:tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
            <span className="text-amber-500/80" aria-hidden="true">―✦―</span>
            <span>ROUND 01</span>
            <span className="text-amber-500/80" aria-hidden="true">―✦―</span>
          </div>

          {/* Large THE GRAVEYARD ESCAPE Heading with Blood-Red Glow */}
          <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-gothic tracking-normal sm:tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#f5ede3] to-[#e63946] drop-shadow-[0_4px_22px_rgba(220,38,38,0.9)] leading-tight mt-1 mb-1.5 sm:mb-2 px-2 text-center">
            THE GRAVEYARD ESCAPE
          </h1>

          {/* Ornamental Skull Divider */}
          <div className="flex items-center justify-center gap-2 text-red-500" aria-hidden="true">
            <span className="w-12 sm:w-20 md:w-28 h-[1.5px] bg-gradient-to-r from-transparent via-red-600 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-xs sm:text-sm md:text-base filter drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]">💀</span>
            <span className="w-12 sm:w-20 md:w-28 h-[1.5px] bg-gradient-to-l from-transparent via-red-600 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </div>
        </div>

        {/* The Three Compact Gothic Portals in One Centered Horizontal Row */}
        <div className="w-full flex flex-col md:flex-row flex-nowrap md:flex-nowrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto pb-4 md:pb-0">
          {/* PORTAL 01: The Pumpkin Shuffle (Burnt Orange) */}
          <HauntedPortalCard
            stageId="stage-1"
            stageNumber={1}
            title={stage1Config.title}
            rewardCredits={100}
            status={teamSession.stages['stage-1'].status}
            colorTheme="orange"
            artworkUrl="/assets/halloween/portals/portal_stage1_pumpkin_shuffle.jpg"
            isExpired={isExpired}
            progressText={
              (teamSession.stage1State?.trials.filter((t) => t.status !== 'pending').length ?? 0) > 0
                ? `${teamSession.stage1State.trials.filter((t) => t.status !== 'pending').length} / ${teamSession.stage1State.trials.length} TRIALS`
                : undefined
            }
            onEnterStage={() => handleSelectStage('stage-1')}
          />

          {/* PORTAL 02: The Haunted Image Hunt (Mystical Purple) */}
          <HauntedPortalCard
            stageId="stage-2"
            stageNumber={2}
            title={stage2Config.title}
            rewardCredits={150}
            status={teamSession.stages['stage-2'].status}
            colorTheme="purple"
            artworkUrl="/assets/halloween/portals/portal_stage2_gallery.jpg"
            progressText={
              teamSession.stage2State.foundTargetIds.length > 0
                ? `${teamSession.stage2State.foundTargetIds.length} / 12 UNCOVERED`
                : undefined
            }
            isExpired={isExpired}
            onEnterStage={() => handleSelectStage('stage-2')}
          />

          {/* PORTAL 03: The Forgotten Graveyard (Ghostly Teal) */}
          <HauntedPortalCard
            stageId="stage-3"
            stageNumber={3}
            title={stage3Config.title}
            rewardCredits={250}
            status={teamSession.stages['stage-3'].status}
            colorTheme="emerald"
            artworkUrl="/assets/halloween/portals/portal_stage3_graveyard.jpg"
            progressText={
              teamSession.stage3State.collectedFragments.length > 0
                ? `${teamSession.stage3State.collectedFragments.length} / 3 UNEARTHED`
                : undefined
            }
            isExpired={isExpired}
            onEnterStage={() => handleSelectStage('stage-3')}
          />
        </div>
      </main>

      {/* Clean Bottom Buffer for Ground Fog */}
      <footer className="relative z-10 w-full h-3 sm:h-5 pointer-events-none" />
    </div>
  );
};
