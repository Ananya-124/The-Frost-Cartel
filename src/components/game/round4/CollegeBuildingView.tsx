import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { COLLEGE_FLOORS, type FloorDefinition } from './FloorConfiguration';
import { CollegeBuildingScene } from './CollegeBuildingScene';
import { FloorInteriorView } from './FloorInteriorView';
import { FloorCalibrationTool } from './FloorCalibrationTool';
import type { CameraAnimationPhase } from './FloorCameraTransition';
import { soundController } from '../../../utils/soundController';

export type FloorViewState =
  | 'BUILDING_INITIAL_REVEAL'
  | 'FLOOR_SELECTION_READY'
  | 'FLOOR_HOVERED'
  | 'FLOOR_SELECTED'
  | 'CAMERA_APPROACH'
  | 'WINDOW_FOCUSED'
  | 'WINDOW_OPENING'
  | 'WINDOW_ENTRY'
  | 'FLOOR_INTERIOR_REVEAL'
  | 'FLOOR_READY';

interface CollegeBuildingViewProps {
  onExit: () => void;
  onReplayIntro?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onProceedToFloors?: (floorId: string) => void;
}

export const CollegeBuildingView: React.FC<CollegeBuildingViewProps> = ({
  onExit,
  onReplayIntro,
  isMuted,
  onToggleMute,
  onProceedToFloors,
}) => {
  const [viewState, setViewState] = useState<FloorViewState>('FLOOR_SELECTION_READY');
  const [hoveredFloorId, setHoveredFloorId] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<FloorDefinition | null>(null);
  const [cameraPhase, setCameraPhase] = useState<CameraAnimationPhase>('IDLE');
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);
  const [, startTransition] = useTransition();

  // Support developer calibration tool via URL or shortcut
  const [isCalibrating, setIsCalibrating] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('calibrate') === 'true';
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        setIsCalibrating((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hoveredFloor = COLLEGE_FLOORS.find((f) => f.id === hoveredFloorId) || null;
  const activeFloor = selectedFloor || hoveredFloor || COLLEGE_FLOORS[2]; // Default to Floor 5 when idle

  // Floor Hover Handler
  const handleHoverFloor = useCallback(
    (floorId: string | null) => {
      if (viewState !== 'FLOOR_SELECTION_READY' && viewState !== 'FLOOR_HOVERED') return;
      setHoveredFloorId(floorId);
      setViewState(floorId ? 'FLOOR_HOVERED' : 'FLOOR_SELECTION_READY');
      if (floorId && !isMuted) {
        soundController.playHover();
      }
    },
    [viewState, isMuted]
  );

  // Floor Click & Selection Sequence (Drone Approach -> Window -> Interior)
  const handleSelectFloor = useCallback(
    (floor: FloorDefinition) => {
      if (viewState !== 'FLOOR_SELECTION_READY' && viewState !== 'FLOOR_HOVERED') return;

      setSelectedFloor(floor);
      setViewState('FLOOR_SELECTED');
      setCameraPhase('APPROACHING');

      if (!isMuted) {
        soundController.playClick();
      }

      // Stage B: Drone Camera Approach (1800ms)
      const t1 = setTimeout(() => {
        setViewState('WINDOW_FOCUSED');
        setCameraPhase('WINDOW_FOCUSED');
        if (!isMuted) {
          soundController.playChime();
        }

        // Stage C: Window Targeting & Opening (600ms)
        setTimeout(() => {
          setViewState('WINDOW_OPENING');
          setCameraPhase('WINDOW_OPENING');

          // Stage D: Window Entry push-through (850ms)
          setTimeout(() => {
            setViewState('WINDOW_ENTRY');
            setCameraPhase('WINDOW_ENTERING');

            // Stage E: Interior Reveal (650ms)
            setTimeout(() => {
              startTransition(() => {
                setViewState('FLOOR_INTERIOR_REVEAL');
                setCameraPhase('COMPLETED');
              });
              onProceedToFloors?.(floor.id);
            }, 650);
          }, 850);
        }, 600);
      }, 1800);

      return () => clearTimeout(t1);
    },
    [viewState, isMuted, onProceedToFloors]
  );

  // Return to Exterior View from Interior
  const handleReturnToExterior = useCallback(() => {
    startTransition(() => {
      setSelectedFloor(null);
      setHoveredFloorId(null);
      setCameraPhase('IDLE');
      setViewState('FLOOR_SELECTION_READY');
    });
  }, []);

  // If inside floor interior, render full interior view
  if ((viewState === 'FLOOR_INTERIOR_REVEAL' || viewState === 'FLOOR_READY') && selectedFloor) {
    return (
      <FloorInteriorView
        floor={selectedFloor}
        onReturnToExterior={handleReturnToExterior}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="relative h-screen w-full bg-[#080a0e] text-[#f4ecd8] flex flex-col font-sans overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* 1. Atmospheric Ambient Daylight Background */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#181d26] via-[#0d1017] to-[#050608]">
        {/* Soft Golden Morning Sunbeams */}
        <div className="absolute -top-40 right-1/4 w-[750px] h-[750px] rounded-full bg-gradient-to-br from-amber-400/15 via-amber-600/5 to-transparent blur-3xl pointer-events-none" />
      </div>

      {/* 2. Sleek Minimalist Frost Cartel Header (Reference Design) */}
      <header className="relative z-30 w-full px-4 sm:px-8 py-2.5 flex items-center justify-between border-b border-amber-500/15 bg-black/70 backdrop-blur-md select-none shrink-0">
        {/* Top-Left: Frost Cartel Skull Emblem & Subtle Line */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-950/70 border border-amber-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(245,185,80,0.25)]">
            <span className="text-sm">💀</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.25em] text-amber-100">
              FROST CARTEL
            </span>
            <div className="hidden sm:block h-[1px] w-24 bg-gradient-to-r from-amber-500/40 to-transparent" />
            <span className="sr-only">ROUND 04 — THE RADIANT TREASURE HUNT</span>
            <span className="sr-only">B. S. NARAYAN PLATINUM JUBILEE ACADEMIC BLOCK</span>
          </div>
        </div>

        {/* Top-Center: Oval Round 04 Badge */}
        <div className="flex items-center">
          <div className="px-4 py-0.5 rounded-full border border-amber-500/40 bg-amber-950/60 font-cinzel text-[11px] font-bold tracking-[0.25em] text-amber-300 shadow-[0_0_12px_rgba(245,185,80,0.2)]">
            ✦ ROUND 04 ✦
          </div>
        </div>

        {/* Top-Right: Sound & Exit Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleMute}
            className="w-8 h-8 rounded-full border border-amber-500/30 bg-black/50 hover:bg-amber-950/40 text-amber-300 flex items-center justify-center text-xs transition-all hover:border-amber-400"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="px-2.5 py-1 rounded border border-amber-500/30 bg-black/40 hover:bg-amber-950/40 text-amber-300 font-cinzel text-[11px] tracking-wider uppercase transition-all"
              title="Replay Letter"
            >
              Letter
            </button>
          )}

          <button
            onClick={onExit}
            className="px-3.5 py-1 rounded border border-amber-500/30 bg-black/40 hover:bg-red-950/40 text-amber-200 hover:text-red-200 hover:border-red-500/40 font-cinzel text-xs tracking-wider uppercase transition-all"
          >
            EXIT
          </button>
        </div>
      </header>

      {/* 3. Main Stage: Edge-to-Edge Cinematic Building with Floating Ancient Relic Selector */}
      <main className="relative z-10 flex-1 w-full h-[calc(100vh-50px)] flex items-center justify-center overflow-hidden p-0 m-0">
        {/* Floating Ancient Relic Vertical Banner (Requirement 4 & Reference Design) */}
        <aside
          aria-label="Floor Selection Guidance"
          className="absolute left-3 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-30 select-none flex flex-col items-center pointer-events-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.9)]"
        >
          {/* Top Ornate Gold Crown Finial SVG */}
          <div className="w-28 sm:w-32 -mb-2 z-10 flex justify-center">
            <svg viewBox="0 0 140 45" className="w-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] overflow-visible">
              <defs>
                <linearGradient id="finialGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffd866" />
                  <stop offset="50%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#9a761c" />
                </linearGradient>
              </defs>
              {/* Central Spire */}
              <path d="M 70,0 L 75,15 L 70,18 L 65,15 Z" fill="url(#finialGold)" />
              {/* Acanthus / Fleur Crest */}
              <path
                d="M 70,14 C 85,12 110,6 125,24 C 115,24 100,20 85,26 C 95,30 115,35 130,30 C 115,38 95,38 70,35 C 45,38 25,38 10,30 C 25,35 45,30 55,26 C 40,20 25,24 15,24 C 30,6 55,12 70,14 Z"
                fill="url(#finialGold)"
                stroke="#644911"
                strokeWidth="0.8"
              />
              <circle cx="70" cy="24" r="4" fill="#ffffff" stroke="#9a761c" strokeWidth="1" />
            </svg>
          </div>

          {/* Aged Parchment Banner Scroll Body */}
          <div className="relative w-28 sm:w-32 py-4 px-2 rounded-sm bg-gradient-to-b from-[#e8d7be] via-[#dfcbb0] to-[#cca97f] border-2 border-[#caa552] shadow-[inset_0_0_18px_rgba(140,85,20,0.35),0_10px_25px_rgba(0,0,0,0.85)] flex flex-col items-center">
            {/* Corner Filigree Accents */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#875c1c]" />
            <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#875c1c]" />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[#875c1c]" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#875c1c]" />

            {/* Top Compass Rose Emblem */}
            <div className="w-7 h-7 my-1 text-[#64441b] flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-full h-full fill-current">
                <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
                <path d="M 16,3 L 18.5,13.5 L 29,16 L 18.5,18.5 L 16,29 L 13.5,18.5 L 3,16 L 13.5,13.5 Z" />
                <circle cx="16" cy="16" r="2.5" fill="#caa552" />
              </svg>
            </div>

            {/* Centered Instruction Text: PLEASE SELECT YOUR FLOOR */}
            <div className="text-center font-cinzel font-bold text-[#352112] text-[11px] sm:text-xs tracking-[0.22em] leading-relaxed my-2 select-none">
              <span className="sr-only">PLEASE SELECT YOUR FLOOR</span>
              <div aria-hidden="true" className="space-y-0.5">
                <div>PLEASE</div>
                <div>SELECT</div>
                <div>YOUR</div>
                <div>FLOOR</div>
              </div>
            </div>

            {/* Ornate Divider with Diamond */}
            <div className="w-16 flex items-center justify-center gap-1 my-1.5 opacity-70">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#64441b]" />
              <div className="w-1.5 h-1.5 rotate-45 bg-[#64441b]" />
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#64441b]" />
            </div>

            {/* Dark Mahogany Cartouche Plaque Displaying Active Floor */}
            <div className="w-full mt-1.5 p-1.5 rounded-sm bg-gradient-to-r from-[#221008] via-[#35180c] to-[#221008] border border-amber-500/60 shadow-[inset_0_0_8px_rgba(0,0,0,0.8),0_2px_6px_rgba(0,0,0,0.6)] text-center">
              <div className="font-cinzel text-[10px] sm:text-[11px] font-bold text-amber-200 tracking-wider truncate">
                {activeFloor ? activeFloor.label.toUpperCase() : 'SELECT LEVEL'}
              </div>
            </div>

            {/* Bottom Compass Rose Emblem */}
            <div className="w-6 h-6 mt-2 text-[#64441b] flex items-center justify-center opacity-85">
              <svg viewBox="0 0 32 32" className="w-full h-full fill-current">
                <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
                <path d="M 16,5 L 18,14 L 27,16 L 18,18 L 16,27 L 14,18 L 5,16 L 14,14 Z" />
                <circle cx="16" cy="16" r="2" fill="#caa552" />
              </svg>
            </div>
          </div>

          {/* Bottom Ornate Spearhead / Finial SVG */}
          <div className="w-16 sm:w-20 -mt-1 z-10 flex justify-center">
            <svg viewBox="0 0 80 40" className="w-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] overflow-visible">
              <path
                d="M 20,0 L 60,0 C 55,10 50,18 40,38 C 30,18 25,10 20,0 Z"
                fill="url(#finialGold)"
                stroke="#644911"
                strokeWidth="0.8"
              />
              <circle cx="40" cy="12" r="3" fill="#ffffff" stroke="#9a761c" strokeWidth="1" />
            </svg>
          </div>
        </aside>

        {/* Center: Real College Building Scene with Edge-to-Edge Composition */}
        <section
          aria-label="College Building Façade Map"
          className="relative w-full h-full flex items-center justify-center p-0 m-0"
        >
          <CollegeBuildingScene
            floors={COLLEGE_FLOORS}
            hoveredFloorId={hoveredFloorId}
            selectedFloor={selectedFloor}
            onHoverFloor={handleHoverFloor}
            onSelectFloor={handleSelectFloor}
            cameraPhase={cameraPhase}
            onMouseMoveCoords={isCalibrating ? setMouseCoords : undefined}
          />
        </section>
      </main>

      {/* 4. Developer Calibration Tool (Accessible via ?calibrate=true or Ctrl+Shift+C) */}
      {isCalibrating && (
        <FloorCalibrationTool
          floors={COLLEGE_FLOORS}
          activeFloorId={hoveredFloorId || selectedFloor?.id || null}
          onSelectFloor={(id) => setHoveredFloorId(id)}
          mouseCoords={mouseCoords}
          onTestZoom={handleSelectFloor}
          onClose={() => setIsCalibrating(false)}
        />
      )}
    </div>
  );
};
