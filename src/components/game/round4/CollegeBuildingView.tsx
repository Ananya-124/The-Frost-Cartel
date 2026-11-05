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

  // Check for developer calibration mode via URL query or window flag
  const [isCalibrating, setIsCalibrating] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('calibrate') === 'true';
  });

  // Support Ctrl+Shift+C shortcut for toggling calibration tool during development
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
  const activeFloor = selectedFloor || hoveredFloor;

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
        const t2 = setTimeout(() => {
          setViewState('WINDOW_OPENING');
          setCameraPhase('WINDOW_OPENING');

          // Stage D: Window Entry push-through (850ms)
          const t3 = setTimeout(() => {
            setViewState('WINDOW_ENTRY');
            setCameraPhase('WINDOW_ENTERING');

            // Stage E: Interior Reveal (650ms)
            const t4 = setTimeout(() => {
              startTransition(() => {
                setViewState('FLOOR_INTERIOR_REVEAL');
                setCameraPhase('COMPLETED');
              });
              onProceedToFloors?.(floor.id);
            }, 650);

            return () => clearTimeout(t4);
          }, 850);

          return () => clearTimeout(t3);
        }, 600);

        return () => clearTimeout(t2);
      }, 1800);

      return () => clearTimeout(t1);
    },
    [viewState, isMuted, onProceedToFloors]
  );

  // Return to College Exterior View from Interior
  const handleReturnToExterior = useCallback(() => {
    startTransition(() => {
      setSelectedFloor(null);
      setHoveredFloorId(null);
      setCameraPhase('IDLE');
      setViewState('FLOOR_SELECTION_READY');
    });
  }, []);

  // If inside floor interior, render full interior room view
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
    <div className="relative min-h-screen w-full bg-[#080a0e] text-[#f4ecd8] flex flex-col font-sans overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* 1. Atmospheric Ambient Daylight Background */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#181d26] via-[#0d1017] to-[#050608]">
        {/* Soft Golden Morning Sunbeams */}
        <div className="absolute -top-40 right-1/4 w-[750px] h-[750px] rounded-full bg-gradient-to-br from-amber-400/15 via-amber-600/5 to-transparent blur-3xl pointer-events-none" />
      </div>

      {/* 2. Minimalist Frost Cartel HUD Header */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-amber-500/20 bg-black/50 backdrop-blur-md select-none">
        {/* Top-Left: Frost Cartel Skull Emblem & Round 04 */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400/30 to-amber-900/60 border border-amber-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,185,80,0.3)]">
            <span className="text-base sm:text-lg">💀</span>
          </div>
          <div className="flex flex-col">
            <span className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.2em] text-amber-200">
              FROST CARTEL
            </span>
            <span className="font-sans text-[10px] tracking-widest text-amber-400/80 font-semibold uppercase">
              ROUND 04 — THE RADIANT TREASURE HUNT
            </span>
          </div>
        </div>

        {/* Top-Center / Landmark Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-500/25 text-amber-300 text-xs font-cinzel tracking-widest">
          <span>🏛️</span>
          <span>B. S. NARAYAN PLATINUM JUBILEE ACADEMIC BLOCK</span>
        </div>

        {/* Top-Right: Sound, Replay, Exit */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleMute}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-amber-500/30 bg-black/40 hover:bg-amber-950/40 text-amber-300 flex items-center justify-center text-xs transition-all hover:border-amber-400"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="px-3 py-1.5 rounded border border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 font-cinzel text-xs tracking-wider uppercase transition-all"
              title="Replay Messenger Letter Intro"
            >
              Replay Letter
            </button>
          )}

          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded border border-red-500/30 bg-red-950/30 hover:bg-red-950/60 text-red-300 font-cinzel text-xs tracking-wider uppercase transition-all"
          >
            Exit
          </button>
        </div>
      </header>

      {/* 3. Main Stage: Side Ancient Relic Pillar + Center Real College Photograph */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-3 sm:p-6 lg:p-8 gap-4 lg:gap-8 max-w-[1500px] mx-auto w-full">
        {/* Ancient Relic Floor Instruction Element (Phase 2 Requirement) */}
        <aside
          aria-label="Floor Selection Guidance"
          className="relative order-2 lg:order-1 flex lg:flex-col items-center justify-between lg:justify-center p-3 sm:p-5 rounded-lg border-2 border-amber-500/40 bg-gradient-to-b from-[#22180e]/90 via-[#150f08]/90 to-[#0c0804]/90 shadow-[0_10px_35px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(245,185,80,0.15)] backdrop-blur-md w-full lg:w-48 shrink-0 select-none overflow-hidden"
        >
          {/* Weathered Relic Gold Corner Notches */}
          <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
          <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
          <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
          <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

          {/* Relic Medallion Seal */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-amber-400/60 bg-gradient-to-br from-amber-400/30 to-amber-950/80 flex items-center justify-center text-amber-300 text-lg sm:text-xl shadow-[0_0_15px_rgba(245,185,80,0.3)] mb-2 lg:mb-4">
            ✦
          </div>

          {/* Mandatory Instruction Text: PLEASE SELECT YOUR FLOOR */}
          <div className="text-center space-y-1 my-1 lg:my-3">
            <span className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 block">
              PLEASE SELECT YOUR FLOOR
            </span>
            <span className="hidden lg:block font-serif italic text-amber-300/70 text-[11px]">
              Directly interact with the college façade
            </span>
          </div>

          {/* Active / Hovered Floor Status Medallion */}
          <div className="mt-1 lg:mt-4 p-2 sm:p-2.5 rounded border border-amber-500/30 bg-black/60 text-center w-full">
            <div className="font-cinzel text-[10px] tracking-widest text-amber-400/70 uppercase">
              {activeFloor ? activeFloor.shortName : 'HOVER FAÇADE'}
            </div>
            <div className="font-cinzel text-xs font-bold text-amber-200 truncate mt-0.5">
              {activeFloor ? activeFloor.label : 'Select a Level'}
            </div>
          </div>
        </aside>

        {/* Center: Real College Photograph Scene with SVG Floor Overlay */}
        <section aria-label="College Building Façade Map" className="order-1 lg:order-2 flex-1 flex flex-col items-center justify-center w-full">
          <CollegeBuildingScene
            floors={COLLEGE_FLOORS}
            hoveredFloorId={hoveredFloorId}
            selectedFloor={selectedFloor}
            onHoverFloor={handleHoverFloor}
            onSelectFloor={handleSelectFloor}
            cameraPhase={cameraPhase}
            onMouseMoveCoords={isCalibrating ? setMouseCoords : undefined}
          />

          {/* Subtle Mobile Floor Guidance Banner */}
          <div className="mt-3 text-center text-xs font-serif italic text-amber-300/70 select-none">
            {cameraPhase !== 'IDLE' ? (
              <span className="text-amber-300 animate-pulse font-cinzel tracking-wider text-xs">
                ✦ APPROACHING {selectedFloor?.label.toUpperCase()} — TARGETING WINDOW BEACON...
              </span>
            ) : (
              <span>Touch or hover over any architectural floor band on the building to inspect</span>
            )}
          </div>
        </section>
      </main>

      {/* 4. Developer Calibration Tool (Phase 6) */}
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
