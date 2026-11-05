import React, { useState, useEffect, useCallback } from 'react';
import type { FloorDefinition } from './FloorConfiguration';
import type { ExpeditionProgress } from '../../../types/round4Expedition.types';
import { round4Service } from '../../../services/round4Service';
import { authService } from '../../../services/authService';
import { getExpeditionRoute } from './ExpeditionRouteConfiguration';
import { getFloorMapConfig } from './FloorMapConfiguration';
import { RouteNavigation } from './RouteNavigation';
import { CampusFloorMap } from './CampusFloorMap';
import { FieldRiddlePanel } from './FieldRiddlePanel';
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
  const session = authService.getCurrentSession();
  const teamId = session?.teamId || 'fc_team_001';

  const [progress, setProgress] = useState<ExpeditionProgress>(() =>
    round4Service.getProgress(teamId)
  );

  // Subscribe to service progress updates
  useEffect(() => {
    const unsubscribe = round4Service.subscribe((updated) => {
      setProgress({ ...updated });
    });
    return unsubscribe;
  }, []);

  const currentRoute = getExpeditionRoute(progress.activeRouteId);
  const currentStep = currentRoute.steps[progress.activeStepIndex] || currentRoute.steps[0];
  const activeFloorId = currentStep.floorId || floor.id;
  const mapConfig = getFloorMapConfig(activeFloorId);

  // Map Explorer avatar touches the glowing target point
  const handleTargetReached = useCallback(() => {
    if (!progress.targetDiscovered) {
      const updated = round4Service.markTargetDiscovered(teamId);
      setProgress({ ...updated });
    }
  }, [teamId, progress.targetDiscovered]);

  // Player 1 submits answer code received from Field Partner
  const handleSubmitAnswer = useCallback(
    (answer: string): Promise<{ success: boolean; message: string }> => {
      const result = round4Service.submitAnswer(teamId, answer);
      setProgress({ ...result.progress });
      return Promise.resolve({ success: result.success, message: result.message });
    },
    [teamId]
  );

  // Player switches route from RouteNavigation
  const handleSelectRoute = useCallback(
    (routeId: string) => {
      const result = round4Service.selectRoute(teamId, routeId);
      if (result.success) {
        setProgress({ ...result.progress });
      }
    },
    [teamId]
  );

  const handleReturn = () => {
    if (!isMuted) {
      soundController.playClick();
    }
    onReturnToExterior();
  };

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
        
        {/* Left Section (~14% width): Vertical Ancient Relic Route Selector */}
        <section
          aria-label="Expedition Routes"
          className="flex-shrink-0 flex items-center justify-center w-full lg:w-auto"
        >
          <RouteNavigation
            progress={progress}
            onSelectRoute={handleSelectRoute}
            isMuted={isMuted}
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
            isTargetDiscovered={progress.targetDiscovered}
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
            isTargetDiscovered={progress.targetDiscovered}
            onSubmitAnswer={handleSubmitAnswer}
            isMuted={isMuted}
          />
        </section>

      </main>
    </div>
  );
};
