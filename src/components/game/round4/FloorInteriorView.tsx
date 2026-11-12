import React, { useState, useEffect, useCallback } from 'react';
import type { FloorDefinition } from './FloorConfiguration';
import type { ExpeditionProgress, WinnerRecord } from '../../../types/round4Expedition.types';
import { round4Service } from '../../../services/round4Service';
import { getFloorMapConfig } from './FloorMapConfiguration';
import { RouteNavigation } from './RouteNavigation';
import { CampusFloorMap } from './CampusFloorMap';
import { FieldRiddlePanel } from './FieldRiddlePanel';
import { QRScannerModal } from './QRScannerModal';
import { WinnerCelebrationModal } from './WinnerCelebrationModal';
import { NonWinnerModal } from './NonWinnerModal';
import { soundController } from '../../../utils/soundController';

interface FloorInteriorViewProps {
  floor: FloorDefinition;
  onReturnToExterior: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
}

export const FloorInteriorView: React.FC<FloorInteriorViewProps> = ({
  floor,
  onReturnToExterior,
  isMuted,
  onToggleMute,
  onExit,
}) => {
  const [progress, setProgress] = useState<ExpeditionProgress | null>(null);
  const [routeState, setRouteState] = useState<Awaited<ReturnType<typeof round4Service.fetchMyRouteState>> | null>(null);
  const [winner, setWinner] = useState<WinnerRecord | null>(() => round4Service.getWinner());
  const [isAccessDenied, setIsAccessDenied] = useState<boolean>(false);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [discoveryBusy, setDiscoveryBusy] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedWord, setScannedWord] = useState<string | null>(null);

  // Authoritative server route & qualification check on mount
  // Subscribe to service progress updates and winner events
  useEffect(() => {
    const unsubProgress = round4Service.subscribe((updated) => {
      setProgress({ ...updated });
    });
    const unsubWinner = round4Service.subscribeWinner((win) => {
      setWinner(win);
    });
    return () => {
      unsubProgress();
      unsubWinner();
    };
  }, []);

  const loadAuthoritativeState = useCallback(async () => {
    setIsLoading(true); setLoadError(null); setIsAccessDenied(false);
    try {
      const status = await round4Service.getStatus();
      if (!status.qualified || !status.isReleased) {
        setIsAccessDenied(true);
        setAccessMessage(status.message ?? (!status.isReleased ? 'Round 04 has not been released by the event administrators.' : 'Your team has not been qualified for Round 04.'));
        if (status.winner) setWinner(status.winner);
        return;
      }
      const state = await round4Service.fetchMyRouteState();
      setRouteState(state);
      setProgress({ teamId: '', activeRouteId: state.route.routeId, activeStepIndex: state.progress.currentStepIndex,
        targetDiscovered: state.progress.targetDiscovered, solvedStepIds: state.progress.solvedStepIds,
        completedRouteIds: state.progress.isFinished ? [state.route.routeId] : [],
        lastUpdated: state.progress.finishedAt ?? new Date().toISOString() });
      setWinner(state.winner);
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : 'Round 04 state could not be loaded.');
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void loadAuthoritativeState(); }, [loadAuthoritativeState]);

  const currentRoute = routeState ? { ...routeState.route, steps: routeState.activeStep ? [{ ...routeState.activeStep, acceptedCodes: [] }] : [] } : null;
  const currentStep = currentRoute?.steps[0] ?? null;
  const activeFloorId = currentStep?.floorId || floor.id;
  const mapConfig = getFloorMapConfig(activeFloorId);

  useEffect(() => {
    setScannedWord(null);
  }, [currentStep?.stepId]);

  // Map Explorer avatar touches the glowing target point
  const handleTargetReached = useCallback(() => {
    if (!routeState || routeState.progress.targetDiscovered || discoveryBusy || routeState.progress.isFinished) return;
    setDiscoveryBusy(true); setActionError(null);
    void round4Service.markTargetDiscovered().then((updated) => {
      setRouteState(updated);
      setProgress({ teamId: '', activeRouteId: updated.route.routeId, activeStepIndex: updated.progress.currentStepIndex,
        targetDiscovered: updated.progress.targetDiscovered, solvedStepIds: updated.progress.solvedStepIds,
        completedRouteIds: updated.progress.isFinished ? [updated.route.routeId] : [], lastUpdated: new Date().toISOString() });
    }).catch((cause: unknown) => setActionError(cause instanceof Error ? cause.message : 'Target discovery was not confirmed.'))
      .finally(() => setDiscoveryBusy(false));
  }, [routeState, discoveryBusy]);

  // Player 1 submits answer code received from Field Partner
  const handleSubmitAnswer = useCallback(
    async (answer: string): Promise<{ success: boolean; message: string }> => {
      if (!routeState?.activeStep || !progress) return { success: false, message: 'Round 04 state is unavailable. Retry loading before submitting.' };
      setActionError(null);
      const result = await round4Service.submitAnswer(routeState.activeStep.stepId, answer);
      if (result.success && result.state) {
        const updated = result.state;
        setRouteState(updated);
        setProgress({ teamId: '', activeRouteId: updated.route.routeId, activeStepIndex: updated.progress.currentStepIndex,
          targetDiscovered: updated.progress.targetDiscovered, solvedStepIds: updated.progress.solvedStepIds,
          completedRouteIds: updated.progress.isFinished ? [updated.route.routeId] : [], lastUpdated: updated.progress.finishedAt ?? new Date().toISOString() });
        setWinner(updated.winner);
      } else if (result.success) {
        setActionError('The answer was accepted by the server, but current progress could not be refreshed. Reloading server state…');
        void loadAuthoritativeState();
      } else setActionError(result.message);
      return { success: result.success, message: result.message };
    },
    [routeState, progress, loadAuthoritativeState]
  );

  const handleReturn = () => {
    if (!isMuted) {
      soundController.playClick();
    }
    onReturnToExterior();
  };

  if (isLoading) return <main className="min-h-screen flex items-center justify-center bg-[#faf5ea] text-[#3d2a14] font-cinzel" role="status">Loading your server-verified Round 04 route…</main>;
  if (loadError) return <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#faf5ea] p-6 text-center text-[#3d2a14]"><p role="alert" className="max-w-lg text-sm">{loadError}</p><div className="flex gap-3"><button type="button" onClick={() => { void loadAuthoritativeState(); }} className="rounded border border-amber-700 px-4 py-2 text-xs font-bold">Retry</button><button type="button" onClick={handleReturn} className="rounded border border-stone-500 px-4 py-2 text-xs">Return to Exterior</button></div></main>;

  if (isAccessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#140e08] text-[#f4ecd8] font-cinzel">
        <div className="max-w-md p-8 rounded-2xl bg-[#241a0d] border border-amber-500/50 text-center shadow-2xl">
          <span className="text-4xl mb-4 block" aria-hidden="true">🔒</span>
          <h2 className="text-xl font-black text-amber-300 uppercase tracking-wider mb-2">
            ACCESS RESTRICTED
          </h2>
          <p className="text-xs text-[#d4c6a0] font-sans mb-6 leading-relaxed">
            {accessMessage ?? 'Round 04 is not currently available to this team.'}
          </p>
          <button
            type="button"
            onClick={handleReturn}
            className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase cursor-pointer transition-colors"
          >
            Return to Exterior
          </button>
        </div>
      </div>
    );
  }

  if (!routeState || !progress || !currentRoute) return null;
  if (!currentStep) return <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#faf5ea] p-6 text-center text-[#3d2a14]">
    <h2 className="font-cinzel text-xl font-bold">Assigned expedition complete</h2>
    <p className="max-w-md text-sm">The server confirms that all five clues on your assigned route are complete. Await the official result.</p>
    {winner && <p className="text-sm font-bold">Official winner: {winner.teamName}</p>}
    <button type="button" onClick={handleReturn} className="rounded border border-amber-700 px-4 py-2 text-xs font-bold">Return to Exterior</button>
  </main>;

  return (
    <div className="relative min-h-screen w-full bg-[#faf5ea] text-[#3d2a14] font-sans flex flex-col justify-between overflow-x-hidden selection:bg-amber-500 selection:text-black select-none">
      
      {/* 0. Warm Ivory Parchment Environment & Decorative Corner Ivy Foliage */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Layer A: Radial Ivory to Warm Parchment Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,_#fffef9_0%,_#fbf5e6_35%,_#f4ebd5_70%,_#ebdcc4_100%)]" />

        {/* Layer B: Ultra-Subtle Natural Paper Grain Texture */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperGrainInterior'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperGrainInterior)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Layer C: Stylized Decorative Botanical Leaves Framing the Page Corners (SVG) */}
        {/* Top-Left Ivy Sprig */}
        <div className="absolute -top-3 -left-3 w-32 h-32 opacity-75">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <path d="M 0,0 C 40,10 60,40 70,80 C 75,50 90,30 110,10" fill="none" stroke="#2d4a22" strokeWidth="2.5" />
            <path d="M 15,20 C 5,35 15,50 35,45 C 40,30 30,15 15,20 Z" fill="#4d7c35" opacity="0.9" />
            <path d="M 40,35 C 30,55 45,70 65,60 C 70,45 55,30 40,35 Z" fill="#3b6328" opacity="0.9" />
            <path d="M 65,15 C 60,30 75,45 90,35 C 95,20 80,10 65,15 Z" fill="#5c8f42" opacity="0.85" />
            <path d="M 5,60 C 0,80 15,95 35,85 C 40,70 25,55 5,60 Z" fill="#436f2e" opacity="0.85" />
          </svg>
        </div>

        {/* Top-Right Ivy Sprig */}
        <div className="absolute -top-3 -right-3 w-32 h-32 opacity-75">
          <svg viewBox="0 0 120 120" className="w-full h-full transform scale-x-[-1]">
            <path d="M 0,0 C 40,10 60,40 70,80 C 75,50 90,30 110,10" fill="none" stroke="#2d4a22" strokeWidth="2.5" />
            <path d="M 15,20 C 5,35 15,50 35,45 C 40,30 30,15 15,20 Z" fill="#4d7c35" opacity="0.9" />
            <path d="M 40,35 C 30,55 45,70 65,60 C 70,45 55,30 40,35 Z" fill="#3b6328" opacity="0.9" />
            <path d="M 65,15 C 60,30 75,45 90,35 C 95,20 80,10 65,15 Z" fill="#5c8f42" opacity="0.85" />
          </svg>
        </div>

        {/* Bottom-Left Ivy Sprig */}
        <div className="absolute -bottom-3 -left-3 w-32 h-32 opacity-75">
          <svg viewBox="0 0 120 120" className="w-full h-full transform scale-y-[-1]">
            <path d="M 0,0 C 40,10 60,40 70,80 C 75,50 90,30 110,10" fill="none" stroke="#2d4a22" strokeWidth="2.5" />
            <path d="M 15,20 C 5,35 15,50 35,45 C 40,30 30,15 15,20 Z" fill="#4d7c35" opacity="0.9" />
            <path d="M 40,35 C 30,55 45,70 65,60 C 70,45 55,30 40,35 Z" fill="#3b6328" opacity="0.9" />
          </svg>
        </div>

        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#e3cfb0]/20 via-transparent to-[#d8c29e]/30 pointer-events-none" />
      </div>

      {/* 1. Top Header (Compact & Matching Reference UI) */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-3 flex items-center justify-between border-b border-[#b8974a]/30 bg-[#faf5ea]/80 backdrop-blur-md shadow-sm">
        
        {/* Left: Frost Cartel Emblem & Floor Badge */}
        <div className="flex items-center gap-3 select-none">
          {/* Circular Gold Skull Medallion */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#3d2b17] to-[#140c06] border border-[#d4af37] flex items-center justify-center shadow-[0_2px_8px_rgba(70,45,15,0.3)]">
            <span className="text-sm">💀</span>
          </div>
          <div className="flex flex-col">
            <span className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.2em] text-[#3d2a14]">
              FROST CARTEL
            </span>
          </div>
        </div>

        {/* Center: Gilded Cartouche Badge (ROUND 04 • SEVENTH FLOOR) */}
        <div className="hidden md:flex items-center justify-center">
          <div className="px-5 py-1 rounded-full bg-gradient-to-r from-[#2c1e11] via-[#1a120b] to-[#2c1e11] border border-[#d4af37] shadow-[0_2px_10px_rgba(70,45,15,0.25)] flex items-center gap-2">
            <span className="text-[#ffd866] text-xs">✦</span>
            <span className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.22em] text-[#ffd866] uppercase">
              ROUND 04 • {floor.label.toUpperCase()}
            </span>
            <span className="text-[#ffd866] text-xs">✦</span>
          </div>
        </div>

        {/* Right: Timer, Sound Toggle, Return to Campus Exterior, and Exit */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hourglass Timer Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#f0e3cc]/80 border border-[#b8974a]/40 shadow-inner">
            <span className="text-xs">⏳</span>
            <span className="font-mono text-xs font-bold tracking-wider text-[#4a341b]">
              02:58
            </span>
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={onToggleMute}
            className="w-8 h-8 rounded-full border border-[#b8974a]/50 bg-[#2c1f12] text-[#ffd866] flex items-center justify-center text-xs transition-all hover:scale-105 shadow-[0_2px_6px_rgba(70,45,15,0.3)] cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Return to Exterior Button */}
          <button
            onClick={handleReturn}
            aria-label="Return to Exterior"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded font-cinzel text-xs font-bold tracking-wider text-[#4a341b] hover:text-[#7d561a] hover:bg-[#d4af37]/20 border border-[#b8974a]/40 bg-[#f4ebd5]/80 transition-all uppercase cursor-pointer"
            title="Return to College Exterior"
          >
            <span>←</span>
            <span>Return</span>
          </button>

          {/* Exit Button */}
          <button
            onClick={onExit}
            aria-label="Exit Round 04"
            className="px-3 py-1 rounded font-cinzel text-xs font-bold tracking-wider text-[#7a2214] hover:text-red-700 hover:bg-red-900/15 border border-red-700/40 bg-[#f4ebd5]/80 transition-all uppercase cursor-pointer"
            title="Exit Round 04"
          >
            EXIT
          </button>
        </div>
      </header>

      {/* 2. Main Exploration Stage (3-Column Layout: Left Routes, Center Map, Right Panel) */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between p-3 sm:p-5 lg:p-6 gap-4 max-w-[1720px] mx-auto w-full overflow-hidden">
        {actionError && <div role="alert" className="absolute left-4 right-4 top-2 z-30 rounded border border-red-500/50 bg-red-950/80 p-2 text-xs text-red-100">{actionError} <button type="button" onClick={() => setActionError(null)} className="ml-2 underline">Dismiss</button></div>}
        {discoveryBusy && <div role="status" className="absolute left-4 top-12 z-30 rounded bg-amber-950/80 px-3 py-1 text-xs text-amber-100">Confirming target discovery…</div>}
        
        {/* Left Section (~14% width): Vertical Ancient Relic Route Selector */}
        <section
          aria-label="Expedition Routes"
          className="flex-shrink-0 flex items-center justify-center w-full lg:w-auto"
        >
          <RouteNavigation
            progress={progress}
            assignedRoute={routeState.route}
          />
        </section>

        {/* Central Section (~60% width): Interactive Campus Floor Map */}
        <section
          aria-label="Campus Exploration Map"
          className="flex-1 flex items-center justify-center w-full min-h-[380px] max-w-[960px] mx-auto"
        >
          <CampusFloorMap
            key={mapConfig.floorId}
            mapConfig={mapConfig}
            currentStep={currentStep}
            isTargetDiscovered={routeState.progress.targetDiscovered}
            onTargetReached={handleTargetReached}
            isMuted={isMuted}
          />
        </section>

        {/* Right Section (~26% width): Field Riddle & Partner Handoff Console */}
        <section
          aria-label="Field Riddle and Partner Handoff"
          className="flex-shrink-0 flex items-center justify-center w-full lg:w-auto"
        >
          <FieldRiddlePanel
            currentRoute={currentRoute}
            currentStep={currentStep}
            progress={progress}
            isTargetDiscovered={routeState.progress.targetDiscovered}
            onSubmitAnswer={handleSubmitAnswer}
            onOpenScanner={() => setIsScannerOpen(true)}
            scannedValidationWord={scannedWord}
            isMuted={isMuted}
          />
        </section>

      </main>

      {/* QR Code Physical Checkpoint Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        teamId={currentRoute?.routeId || ''}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(valWord) => {
          setScannedWord(valWord);
          setIsScannerOpen(false);
        }}
        isMuted={isMuted}
      />

      {/* 3. Championship Winner & Non-Winner Result Overlays */}
      {winner && (
        routeState.isWinner ? (
          <WinnerCelebrationModal
            winner={winner}
            routeRomanNumeral={currentRoute.romanNumeral}
            onExit={onExit}
          />
        ) : (
          <NonWinnerModal
            winner={winner}
            mySolvedCount={progress.solvedStepIds.length}
            myRouteRomanNumeral={currentRoute.romanNumeral}
            onExit={handleReturn}
          />
        )
      )}
    </div>
  );
};
