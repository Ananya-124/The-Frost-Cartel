import React, { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import type { TeamSession } from '../../types/team.types';
import type { StageId } from '../../types/round.types';
import { round1Api, type Round1StateResponse } from '../../services/round1ApiService';
import type { Round1TeamSessionState } from '../../types/round1.types';
import { soundController } from '../../utils/soundController';
import { HauntedGraveyardAtmosphere } from './haunted/HauntedGraveyardAtmosphere';
import { GothicRound1HUD } from './haunted/GothicRound1HUD';
import { HauntedPortalCard } from './haunted/HauntedPortalCard';
import { createRound1TimerStore } from './round1TimerStore';
import { Round1DeferredBoundary } from './Round1DeferredBoundary';

const Stage1Framework = lazy(() => import('./stage1/Stage1Framework').then((module) => ({ default: module.Stage1Framework })));
const Stage1PumpkinShuffle = lazy(() => import('./stage1/Stage1PumpkinShuffle').then((module) => ({ default: module.Stage1PumpkinShuffle })));
const Stage2HauntedImageHunt = lazy(() => import('./stage2/Stage2HauntedImageHunt').then((module) => ({ default: module.Stage2HauntedImageHunt })));
const Stage3ForgottenGraveyard = lazy(() => import('./stage3/Stage3ForgottenGraveyard').then((module) => ({ default: module.Stage3ForgottenGraveyard })));

const StageChunkLoading: React.FC<{ label: string }> = ({ label }) => (
  <div role="status" className="min-h-screen bg-black text-stone-100 flex items-center justify-center">Loading {label}…</div>
);

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
  const [serverState, setServerState] = useState<Round1StateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [timerStore] = useState(() => createRound1TimerStore());
  const [isMuted, setIsMuted] = useState(soundController.isMuted());
  const [activeStageId, setActiveStageId] = useState<StageId | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('stage');
      if (s === '1' || s === 'stage-1') return 'stage-1';
      if (s === '2' || s === 'stage-2') return 'stage-2';
      if (s === '3' || s === 'stage-3') return 'stage-3';
    }
    return null;
  });
  const stateRequestInFlight = useRef<Promise<void> | null>(null);
  const timerDeadline = useRef<number | null>(null);
  const onUpdateCreditsRef = useRef(onUpdateCredits);
  useEffect(() => { onUpdateCreditsRef.current = onUpdateCredits; }, [onUpdateCredits]);

  // PostgreSQL is authoritative; the browser renders against its absolute deadline.
  const applyServerState = useCallback((value: Round1StateResponse) => {
    if (!value?.round || !value.team || !value.session || !value.config?.stage1 || !value.config.stage2 || !value.config.stage3) {
      throw new Error('The Round 1 server returned incomplete game state. Retry or contact the event coordinator.');
    }
    setServerState(value);
    timerDeadline.current = value.round.endsAt ? Date.parse(value.round.endsAt) : null;
    setSecondsRemaining(value.round.remainingSeconds);
    timerStore.setSeconds(value.round.remainingSeconds);
    onUpdateCreditsRef.current(value.team.totalCredits);
  }, [timerStore]);
  const refreshState = useCallback(() => {
    if (stateRequestInFlight.current) return stateRequestInFlight.current;
    const request = (async () => {
      try { applyServerState(await round1Api.getState()); setRequestError(null); }
      catch (error) { setRequestError(error instanceof Error ? error.message : 'Could not load Round 1.'); }
      finally { setLoading(false); }
    })();
    stateRequestInFlight.current = request;
    void request.finally(() => { if (stateRequestInFlight.current === request) stateRequestInFlight.current = null; }).catch(() => undefined);
    return request;
  }, [applyServerState]);
  useEffect(() => {
    void refreshState();
    const poll = setInterval(() => { void refreshState(); }, 30000);
    let lastRefreshTime = Date.now();
    const refreshWhenVisible = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible' && now - lastRefreshTime > 10000) {
        lastRefreshTime = now;
        void refreshState();
      }
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('online', refreshWhenVisible);
    return () => {
      clearInterval(poll);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('online', refreshWhenVisible);
    };
  }, [refreshState, session.teamId, session.teamName]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (serverState?.round.isActive && serverState.session.status === 'active') {
        const deadline = timerDeadline.current;
        // No deadline means the round hasn't been explicitly started yet —
        // do not decrement; the server-synced value is already in the store.
        if (deadline === null) return;
        const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        timerStore.setSeconds(next);
        // Keep the dashboard countdown responsive without rerendering a heavy
        // active puzzle tree once per second.
        if (activeStageId === null) setSecondsRemaining(next);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [serverState?.round.isActive, serverState?.session.status, activeStageId, timerStore]);

  const teamSession = serverState?.session as Round1TeamSessionState | undefined;
  const stage1Config = serverState?.config.stage1;
  const stage2Config = serverState?.config.stage2;
  const stage3Config = serverState?.config.stage3;
  const durationMinutes = Math.floor((serverState?.round.totalDurationSeconds ?? 0) / 60);
  const requestErrorNotice = requestError && (
    <div role="alert" className="absolute top-16 left-1/2 z-50 w-[min(92vw,38rem)] -translate-x-1/2 rounded border border-red-500/50 bg-red-950/95 px-4 py-3 text-sm text-red-100">
      <span>{requestError}</span>
      <button type="button" className="ml-4 underline" onClick={() => setRequestError(null)}>Dismiss</button>
    </div>
  );

  const performAction = async (type: string, fields: Record<string, unknown> = {}) => {
    const result = await round1Api.action(type, fields);
    const actionDeadline = result.session.roundDeadline ? Date.parse(result.session.roundDeadline) : null;
    if (Number.isFinite(actionDeadline) && actionDeadline !== null) {
      timerDeadline.current = timerDeadline.current === null ? actionDeadline : Math.min(timerDeadline.current, actionDeadline);
    }
    setServerState((current) => current ? {
      ...current,
      round: { ...current.round, endsAt: timerDeadline.current === null ? null : new Date(timerDeadline.current).toISOString() },
      session: result.session,
      team: { ...current.team, score: result.score, totalCredits: Number(result.totalCredits ?? current.team.totalCredits) },
    } : current);
    if (actionDeadline !== null && Number.isFinite(actionDeadline)) {
      const next = Math.max(0, Math.ceil((timerDeadline.current! - Date.now()) / 1000));
      timerStore.setSeconds(next);
      if (activeStageId === null) setSecondsRemaining(next);
    }
    if (typeof result.totalCredits === 'number') onUpdateCredits(result.totalCredits);
    setRequestError(null);
    return { ...result, creditsDelta: result.score - (serverState?.team.score ?? result.score) };
  };

  const handleToggleMute = () => {
    const muted = soundController.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectStage = async (stageId: StageId) => {
    soundController.playClick();
    try { await performAction('enter', { stageId }); setActiveStageId(stageId); }
    catch (error) { setRequestError(error instanceof Error ? error.message : 'Could not enter this stage.'); }
  };

  const handleSkipStage = async (stageId: StageId) => {
    soundController.playClick();
    try { await performAction('skip', { stageId }); setActiveStageId(null); }
    catch (error) { setRequestError(error instanceof Error ? error.message : 'Could not skip this stage.'); }
  };

  const handleStageCompleted = () => {
    soundController.playVictory();
  };

  if (loading || !teamSession || !stage1Config || !stage2Config || !stage3Config) return <div className="min-h-screen bg-black text-stone-100 flex flex-col items-center justify-center gap-4"><p>{loading ? 'Loading your Round 1 progress…' : requestError ?? 'Round 1 state is unavailable.'}</p>{!loading && <button className="px-4 py-2 border border-amber-500 rounded" onClick={() => { setLoading(true); void refreshState(); }}>Retry</button>}{requestError?.includes('session has expired') && <button onClick={onReturnHome}>Return to sign in</button>}</div>;

  // Active Stage 1 View
  if (activeStageId === 'stage-1') {
    return (
      <div className="relative min-h-screen bg-cartel-void text-cartel-bone flex flex-col font-sans overflow-x-hidden">
        {requestErrorNotice}
        {teamSession.stages['stage-1'].status === 'not_configured' ? (
          <Round1DeferredBoundary stageLabel="Stage 1"><Suspense fallback={<StageChunkLoading label="Stage 1" />}>
            <Stage1Framework config={stage1Config} onReturnDashboard={() => setActiveStageId(null)} onSkipStage={() => { void handleSkipStage('stage-1'); }} />
          </Suspense></Round1DeferredBoundary>
        ) : (
          <Round1DeferredBoundary stageLabel="Stage 1"><Suspense fallback={<StageChunkLoading label="Stage 1" />}>
            <Stage1PumpkinShuffle teamId={session.teamId} config={stage1Config} initialState={teamSession.stage1State} timerStore={timerStore} onAction={performAction} onReturnDashboard={() => setActiveStageId(null)} onSkipStage={() => { void handleSkipStage('stage-1'); }} onCreditsAwarded={handleStageCompleted} />
          </Suspense></Round1DeferredBoundary>
        )}
      </div>
    );
  }

  // Active Stage 2 View
  if (activeStageId === 'stage-2') {
    return (
      <div className="relative min-h-screen bg-cartel-void text-cartel-bone flex flex-col font-sans overflow-x-hidden">
        {requestErrorNotice}
        <Round1DeferredBoundary stageLabel="Stage 2"><Suspense fallback={<StageChunkLoading label="Stage 2" />}>
          <Stage2HauntedImageHunt teamId={session.teamId} config={stage2Config} initialFoundTargetIds={teamSession.stage2State.foundTargetIds} timerStore={timerStore} onAction={performAction} isCompleted={teamSession.stages['stage-2'].status === 'completed'} onReturnDashboard={() => setActiveStageId(null)} onSkipStage={() => { void handleSkipStage('stage-2'); }} onStageCompleted={handleStageCompleted} />
        </Suspense></Round1DeferredBoundary>
      </div>
    );
  }

  // Active Stage 3 View
  if (activeStageId === 'stage-3') {
    return (
      <div className="relative min-h-screen bg-black text-cartel-bone flex flex-col font-sans overflow-x-hidden">
        {requestErrorNotice}
        <Round1DeferredBoundary stageLabel="Stage 3"><Suspense fallback={<StageChunkLoading label="Stage 3" />}>
          <Stage3ForgottenGraveyard teamId={session.teamId} config={stage3Config} initialSession={teamSession} timerStore={timerStore} onAction={performAction} initialCollectedFragments={teamSession.stage3State.collectedFragments} isCompleted={teamSession.stages['stage-3'].status === 'completed'} onReturnDashboard={() => setActiveStageId(null)} onSkipStage={() => { void handleSkipStage('stage-3'); }} onStageCompleted={handleStageCompleted} />
        </Suspense></Round1DeferredBoundary>
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
        durationMinutes={durationMinutes}
        onToggleMute={handleToggleMute}
        onReturnHome={onReturnHome}
      />

      {/* 3. Centered Main Header & Three Gothic Arch Portals */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-col justify-center items-center my-auto">
        {requestError && <div role="alert" className="mb-3 w-full rounded border border-red-500/50 bg-red-950/80 px-4 py-3 text-sm text-red-100">{requestError}<button type="button" className="ml-4 underline" onClick={() => setRequestError(null)}>Dismiss</button></div>}
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
          {/* PORTAL 01: The Unknown Challenge (Burnt Orange) */}
          <HauntedPortalCard
            stageId="stage-1"
            stageNumber={1}
            title={stage1Config.title}
            rewardCredits={100}
            status={teamSession.stages['stage-1'].status}
            colorTheme="orange"
            artworkUrl="/assets/halloween/portals/portal_stage1_crypt.jpg"
            isExpired={isExpired}
            progressText={
              (teamSession.stage1State?.trials.filter((t) => t.status !== 'pending').length ?? 0) > 0
                ? `${teamSession.stage1State.trials.filter((t) => t.status !== 'pending').length} / ${teamSession.stage1State.trials.length} TRIALS`
                : undefined
            }
            onEnterStage={() => { void handleSelectStage('stage-1'); }}
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
            onEnterStage={() => { void handleSelectStage('stage-2'); }}
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
            onEnterStage={() => { void handleSelectStage('stage-3'); }}
          />
        </div>
      </main>

      {/* Clean Bottom Buffer for Ground Fog */}
      <footer className="relative z-10 w-full h-3 sm:h-5 pointer-events-none" />
    </div>
  );
};
