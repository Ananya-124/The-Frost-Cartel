import React, { useState, useEffect, useCallback, useRef, startTransition } from 'react';
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
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Support developer calibration tool via URL or shortcut
  const [isCalibrating, setIsCalibrating] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('calibrate') === 'true';
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setIsCalibrating((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const activeTimers = timersRef.current;
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      activeTimers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const hoveredFloor = COLLEGE_FLOORS.find((f) => f.id === hoveredFloorId) || null;
  const activeFloor = selectedFloor || hoveredFloor || COLLEGE_FLOORS[2]; // Default to Floor 5 when idle
  const activeFloorLabel = activeFloor ? activeFloor.label.toUpperCase() : 'FIFTH FLOOR';

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

  // Floor Click & Selection Sequence: Continuous Drone Upward Flight -> Direct Window Entry -> Interior
  const handleSelectFloor = useCallback(
    (floor: FloorDefinition) => {
      if (viewState !== 'FLOOR_SELECTION_READY' && viewState !== 'FLOOR_HOVERED') return;

      setSelectedFloor(floor);
      setViewState('FLOOR_SELECTED');
      setCameraPhase('APPROACHING');

      if (!isMuted) {
        soundController.playClick();
      }

      // Stage B & C: Continuous upward drone flight approaching the selected open window (1050ms)
      const t1 = setTimeout(() => {
        setViewState('WINDOW_ENTRY');
        setCameraPhase('WINDOW_ENTERING');
        if (!isMuted) {
          soundController.playChime();
        }

        // Stage D & E: Uninterrupted forward pass-through open window aperture directly into Interior (420ms)
        const t2 = setTimeout(() => {
          startTransition(() => {
            setViewState('FLOOR_INTERIOR_REVEAL');
            setCameraPhase('COMPLETED');
          });
          onProceedToFloors?.(floor.id);
        }, 420);
        timersRef.current.push(t2);
      }, 1050);
      timersRef.current.push(t1);
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
      return;
    }
    if (onReplayIntro) {
      onReplayIntro();
      return;
    }
    onExit();
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
    <div className="relative h-screen w-full bg-[#fbf6ec] text-[#3d2a14] font-sans overflow-hidden selection:bg-amber-500 selection:text-black select-none">
      {/* Screen-reader accessible heading & landmarks (Visually hidden - Requirement 3) */}
      <div className="sr-only">
        <h1>B. S. NARAYAN PLATINUM JUBILEE ACADEMIC BLOCK</h1>
        <h2>PLEASE SELECT YOUR FLOOR</h2>
      </div>

      {/* 0. Ancient Treasure-Hunt Manuscript Environment (Warm Ivory & Light Aged Parchment Canvas) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Layer A: Radial Ivory to Soft Champagne Parchment Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,_#fffef9_0%,_#fbf5e6_35%,_#f4ebd5_70%,_#ebdcc4_100%)]" />

        {/* Layer B: Ultra-Subtle Natural Antique Paper Grain Texture */}
        <div
          className="absolute inset-0 opacity-[0.038] mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperGrain)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Layer C: Delicate Antique-Gold Cartographic Corner Accents */}
        <div className="absolute inset-0 pointer-events-none opacity-35" aria-hidden="true">
          {/* Top-Left Filigree */}
          <svg className="absolute top-4 left-4 w-10 h-10 overflow-visible" viewBox="0 0 40 40">
            <path d="M 0,36 L 0,8 C 0,3.6 3.6,0 8,0 L 36,0" fill="none" stroke="#b8974a" strokeWidth="1.2" />
            <circle cx="8" cy="8" r="2.2" fill="#b8974a" />
          </svg>
          {/* Top-Right Filigree */}
          <svg className="absolute top-4 right-4 w-10 h-10 overflow-visible -scale-x-100" viewBox="0 0 40 40">
            <path d="M 0,36 L 0,8 C 0,3.6 3.6,0 8,0 L 36,0" fill="none" stroke="#b8974a" strokeWidth="1.2" />
            <circle cx="8" cy="8" r="2.2" fill="#b8974a" />
          </svg>
          {/* Bottom-Left Filigree */}
          <svg className="absolute bottom-4 left-4 w-10 h-10 overflow-visible -scale-y-100" viewBox="0 0 40 40">
            <path d="M 0,36 L 0,8 C 0,3.6 3.6,0 8,0 L 36,0" fill="none" stroke="#b8974a" strokeWidth="1.2" />
            <circle cx="8" cy="8" r="2.2" fill="#b8974a" />
          </svg>
          {/* Bottom-Right Filigree */}
          <svg className="absolute bottom-4 right-4 w-10 h-10 overflow-visible -scale-x-100 -scale-y-100" viewBox="0 0 40 40">
            <path d="M 0,36 L 0,8 C 0,3.6 3.6,0 8,0 L 36,0" fill="none" stroke="#b8974a" strokeWidth="1.2" />
            <circle cx="8" cy="8" r="2.2" fill="#b8974a" />
          </svg>
        </div>

        {/* Layer D: Soft Ambient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#e3cfb0]/15 via-transparent to-[#d8c29e]/25" />
      </div>

      {/* Shared Gradient Defs for Minimal Floating HUD Controls */}
      <svg className="sr-only" aria-hidden="true" width="0" height="0">
        <defs>
          <radialGradient id="ctrlBtnGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2c1f12" stopOpacity="0.94" />
            <stop offset="100%" stopColor="#120c06" stopOpacity="0.98" />
          </radialGradient>
          <linearGradient id="ctrlGoldRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd866" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#9a761c" />
          </linearGradient>
        </defs>
      </svg>

      {/* 1. Floating Elegant Minimalist Top Controls (Directly Over Scene - Requirement 4) */}
      {/* Top-Left: Floating Circular Gold Back Medallion */}
      <button
        type="button"
        onClick={handleBackClick}
        aria-label="Back to Previous Stage"
        className="absolute top-4 sm:top-6 left-4 sm:left-6 lg:left-8 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 group shadow-[0_4px_16px_rgba(70,45,15,0.4)] cursor-pointer"
        title="Go Back"
      >
        <svg viewBox="0 0 44 44" className="w-full h-full pointer-events-none overflow-visible">
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
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 group shadow-[0_4px_16px_rgba(70,45,15,0.4)] cursor-pointer"
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
        <div className="h-5 sm:h-6 w-[1px] bg-gradient-to-b from-transparent via-[#b8974a]/60 to-transparent" />

        {/* Minimal Gold Letter Button */}
        {onReplayIntro && (
          <button
            type="button"
            onClick={onReplayIntro}
            className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.2em] text-[#4b3317] hover:text-[#7d561a] hover:bg-[#d4af37]/20 px-3 py-1 rounded-sm border border-[#b8974a]/50 bg-[#f4ebd5]/80 backdrop-blur-sm transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(70,45,15,0.15)] uppercase"
            title="Read Letter"
          >
            LETTER
          </button>
        )}

        {/* Minimal Gold Divider */}
        <div className="h-5 sm:h-6 w-[1px] bg-gradient-to-b from-transparent via-[#b8974a]/60 to-transparent" />

        {/* Minimal Gold Exit Button */}
        <button
          type="button"
          onClick={onExit}
          className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.2em] text-[#7a2214] hover:text-red-700 hover:bg-red-900/15 px-3 py-1 rounded-sm border border-red-700/40 bg-[#f4ebd5]/80 backdrop-blur-sm transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(70,45,15,0.15)] uppercase"
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
        <div className="relative w-full aspect-[255/505] flex items-center justify-center drop-shadow-[0_16px_36px_rgba(70,45,15,0.28)]">
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
              {activeFloorLabel}
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
          <div className="relative h-full aspect-[1629/965] max-w-none flex items-center justify-center translate-x-[2%] sm:translate-x-[4%] lg:translate-x-[5%] filter drop-shadow-[0_12px_36px_rgba(95,70,35,0.22)]">
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
