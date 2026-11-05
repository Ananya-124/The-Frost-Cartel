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
  onBack?: () => void;
  onReplayIntro?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onProceedToFloors?: (floorId: string) => void;
}

export const CollegeBuildingView: React.FC<CollegeBuildingViewProps> = ({
  onExit,
  onBack,
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

  // Back Button Click Handler (Returns to previous stage or letter)
  const handleBackClick = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (onReplayIntro) {
      onReplayIntro();
    } else {
      onExit();
    }
  }, [onBack, onReplayIntro, onExit]);

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
    <div className="relative h-screen w-full bg-[#080a0e] text-[#f4ecd8] font-sans overflow-hidden selection:bg-amber-500 selection:text-black select-none">
      {/* Screen-reader accessible heading & landmarks (Visually hidden - Requirement 3) */}
      <div className="sr-only">
        <h1>B. S. NARAYAN PLATINUM JUBILEE ACADEMIC BLOCK</h1>
        <h2>PLEASE SELECT YOUR FLOOR</h2>
      </div>

      {/* 1. Floating Elegant Minimalist Top Controls (Directly Over Scene - Requirement 4) */}
      {/* Top-Left: Floating Circular Gold Back Medallion */}
      <button
        onClick={handleBackClick}
        aria-label="Back to Previous Stage"
        className="absolute top-4 sm:top-6 left-4 sm:left-6 lg:left-8 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 group shadow-[0_4px_16px_rgba(0,0,0,0.8)] cursor-pointer"
        title="Go Back"
      >
        <svg viewBox="0 0 44 44" className="w-full h-full pointer-events-none overflow-visible">
          <defs>
            <radialGradient id="ctrlBtnGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e1408" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#080604" stopOpacity="0.95" />
            </radialGradient>
            <linearGradient id="ctrlGoldRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd866" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#9a761c" />
            </linearGradient>
          </defs>
          {/* Circular Glass Disc */}
          <circle cx="22" cy="22" r="19" fill="url(#ctrlBtnGrad)" />
          {/* Outer Beveled Gold Ring */}
          <circle cx="22" cy="22" r="19" fill="none" stroke="url(#ctrlGoldRing)" strokeWidth="1.8" />
          {/* Inset Gold Detail Ring */}
          <circle cx="22" cy="22" r="16.5" fill="none" stroke="#d4af37" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.65" />
          {/* Cardinal Compass Notches */}
          <path d="M 22,1 L 23.5,3.5 L 20.5,3.5 Z M 22,43 L 23.5,40.5 L 20.5,40.5 Z M 1,22 L 3.5,20.5 L 3.5,23.5 Z M 43,22 L 40.5,20.5 L 40.5,23.5 Z" fill="url(#ctrlGoldRing)" />
          {/* Gold Left Arrow */}
          <path
            d="M 26,22 L 16,22 M 20.5,16.5 L 15,22 L 20.5,27.5"
            fill="none"
            stroke="#ffd866"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:stroke-white transition-colors"
          />
        </svg>
      </button>

      {/* Top-Right: Sound, Letter, Exit Controls */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 lg:right-8 z-40 flex items-center gap-3 sm:gap-4 select-none">
        {/* Floating Circular Sound Medallion */}
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 group shadow-[0_4px_16px_rgba(0,0,0,0.8)] cursor-pointer"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          <svg viewBox="0 0 44 44" className="w-full h-full pointer-events-none overflow-visible">
            <circle cx="22" cy="22" r="19" fill="url(#ctrlBtnGrad)" />
            <circle cx="22" cy="22" r="19" fill="none" stroke="url(#ctrlGoldRing)" strokeWidth="1.8" />
            <circle cx="22" cy="22" r="16.5" fill="none" stroke="#d4af37" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.65" />
            <path d="M 22,1 L 23.5,3.5 L 20.5,3.5 Z M 22,43 L 23.5,40.5 L 20.5,40.5 Z M 1,22 L 3.5,20.5 L 3.5,23.5 Z M 43,22 L 40.5,20.5 L 40.5,23.5 Z" fill="url(#ctrlGoldRing)" />
            {/* Speaker Horn */}
            <path
              d="M 17,17 L 14,17 L 14,27 L 17,27 L 22,31 L 22,13 Z"
              fill="#ffd866"
              className="group-hover:fill-white transition-colors"
            />
            {isMuted ? (
              <path d="M 26,17 L 32,27 M 32,17 L 26,27" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
            ) : (
              <path
                d="M 25,18 C 27,20 27,24 25,26 M 28,15 C 31,18 31,26 28,29"
                fill="none"
                stroke="#ffd866"
                strokeWidth="2"
                strokeLinecap="round"
                className="group-hover:stroke-white transition-colors"
              />
            )}
          </svg>
        </button>

        {/* Minimal Gold Divider */}
        <div className="h-5 sm:h-6 w-[1px] bg-gradient-to-b from-transparent via-[#d4af37]/70 to-transparent" />

        {/* Minimal Gold Letter Button */}
        {onReplayIntro && (
          <button
            onClick={onReplayIntro}
            className="font-cinzel text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#f5d77f] hover:text-[#fff2a8] hover:drop-shadow-[0_0_8px_rgba(255,215,0,0.7)] uppercase transition-all duration-200 cursor-pointer"
            title="Read Letter"
          >
            LETTER
          </button>
        )}

        {/* Minimal Gold Divider */}
        <div className="h-5 sm:h-6 w-[1px] bg-gradient-to-b from-transparent via-[#d4af37]/70 to-transparent" />

        {/* Minimal Gold Exit Button */}
        <button
          onClick={onExit}
          className="font-cinzel text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#f5d77f] hover:text-red-300 hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.7)] uppercase transition-all duration-200 cursor-pointer"
          title="Exit Round 04"
        >
          EXIT
        </button>
      </div>

      {/* 2. Left Section (~25% of viewport width): Grand Ancient Relic Floor Selector */}
      <aside
        aria-label="Floor Selection Guidance"
        className="absolute left-3 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-30 select-none pointer-events-none w-[28%] max-w-[320px] min-w-[210px]"
      >
        <div className="relative w-full aspect-[255/505] flex items-center justify-center drop-shadow-[0_20px_45px_rgba(0,0,0,0.92)]">
          {/* Authentic Ancient Parchment Relic Artwork */}
          <img
            src="/assets/round-04/ancient-relic-parchment.png"
            alt="Ancient Relic Floor Selector - Please Select Your Floor"
            className="w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />

          {/* Dynamic Active Floor Cartouche Plaque Text */}
          <div className="absolute left-[13%] right-[13%] top-[65.2%] h-[10.5%] flex items-center justify-center pointer-events-none select-none">
            <span className="font-cinzel text-xs sm:text-[13px] md:text-sm font-bold tracking-[0.18em] text-[#ffd866] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] truncate px-2 text-center">
              {activeFloor ? activeFloor.label.toUpperCase() : 'FIFTH FLOOR'}
            </span>
          </div>
        </div>
      </aside>

      {/* 3. Main Stage: College Building Artwork & Interactive SVG Floors (~75% Visual Composition) */}
      <main className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
        <section
          aria-label="College Building Façade Map"
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
        >
          <div className="relative h-full aspect-[1629/965] max-w-none flex items-center justify-center translate-x-[2%] sm:translate-x-[4%] lg:translate-x-[5%]">
            <CollegeBuildingScene
              floors={COLLEGE_FLOORS}
              hoveredFloorId={hoveredFloorId}
              selectedFloor={selectedFloor}
              onHoverFloor={handleHoverFloor}
              onSelectFloor={handleSelectFloor}
              cameraPhase={cameraPhase}
              onMouseMoveCoords={isCalibrating ? setMouseCoords : undefined}
            />
          </div>
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
