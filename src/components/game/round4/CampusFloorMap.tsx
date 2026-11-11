import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { ClueStep, FloorMapConfig, Point2D } from '../../../types/round4Expedition.types';
import { soundController } from '../../../utils/soundController';

interface CampusFloorMapProps {
  mapConfig: FloorMapConfig;
  currentStep: ClueStep;
  isTargetDiscovered: boolean;
  onTargetReached: () => void;
  isMuted: boolean;
}

const AVATAR_SPEED = 75; // pixels per second (controlled human walking pace per Part 10)
const AVATAR_RADIUS = 8;

function isPositionValid(pos: Point2D, config: FloorMapConfig): boolean {
  // Check bounds
  if (
    pos.x < AVATAR_RADIUS ||
    pos.x > config.mapWidth - AVATAR_RADIUS ||
    pos.y < AVATAR_RADIUS ||
    pos.y > config.mapHeight - AVATAR_RADIUS
  ) {
    return false;
  }

  // If walkable regions defined, avatar MUST be inside at least one walkable corridor or room
  if (config.walkableRegions && config.walkableRegions.length > 0) {
    const isWalkable = config.walkableRegions.some(
      (r) =>
        pos.x >= r.x &&
        pos.x <= r.x + r.width &&
        pos.y >= r.y &&
        pos.y <= r.y + r.height
    );
    if (!isWalkable) return false;
  }

  // Check collision regions (walls/obstacles)
  if (config.collisionRegions) {
    for (const col of config.collisionRegions) {
      if (
        pos.x >= col.x - AVATAR_RADIUS &&
        pos.x <= col.x + col.width + AVATAR_RADIUS &&
        pos.y >= col.y - AVATAR_RADIUS &&
        pos.y <= col.y + col.height + AVATAR_RADIUS
      ) {
        return false;
      }
    }
  }

  return true;
}

export const CampusFloorMap: React.FC<CampusFloorMapProps> = ({
  mapConfig,
  currentStep,
  isTargetDiscovered,
  onTargetReached,
  isMuted,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [avatarPos, setAvatarPos] = useState<Point2D>(() => mapConfig.spawnPoint);
  const [avatarAngle, setAvatarAngle] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showDiscoveryBurst, setShowDiscoveryBurst] = useState<boolean>(false);

  // Position reference for frame updates
  const posRef = useRef<Point2D>(mapConfig.spawnPoint);
  const heldKeys = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number | null>(null);

  // Handle keyboard inputs
  useEffect(() => {
    const isInteractiveElementFocused = (): boolean => {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || (active as HTMLElement).isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInteractiveElementFocused()) return;

      const key = e.key.toLowerCase();
      if (
        key === 'w' ||
        key === 'a' ||
        key === 's' ||
        key === 'd' ||
        key === 'arrowup' ||
        key === 'arrowleft' ||
        key === 'arrowdown' ||
        key === 'arrowright'
      ) {
        e.preventDefault();
        heldKeys.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      heldKeys.current.delete(key);
    };

    const handleBlur = () => {
      heldKeys.current.clear();
      lastTimeRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Main Delta-Time Movement & Proximity Loop
  useEffect(() => {
    let animId: number;

    const gameLoop = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      // Determine directional intent
      let dx = 0;
      let dy = 0;

      if (heldKeys.current.has('w') || heldKeys.current.has('arrowup')) dy -= 1;
      if (heldKeys.current.has('s') || heldKeys.current.has('arrowdown')) dy += 1;
      if (heldKeys.current.has('a') || heldKeys.current.has('arrowleft')) dx -= 1;
      if (heldKeys.current.has('d') || heldKeys.current.has('arrowright')) dx += 1;

      if (dx !== 0 || dy !== 0) {
        // Normalize diagonal speed
        const length = Math.hypot(dx, dy);
        const totalDx = (dx / length) * AVATAR_SPEED * dt;
        const totalDy = (dy / length) * AVATAR_SPEED * dt;

        setAvatarAngle(Math.atan2(dy, dx) * (180 / Math.PI) + 90);

        // Substep movement (max 2 units per substep) to prevent wall tunneling
        const maxStepSize = 2.0;
        const numSubSteps = Math.max(1, Math.ceil(Math.hypot(totalDx, totalDy) / maxStepSize));
        const subDx = totalDx / numSubSteps;
        const subDy = totalDy / numSubSteps;

        let curX = posRef.current.x;
        let curY = posRef.current.y;

        for (let i = 0; i < numSubSteps; i++) {
          const nextX = curX + subDx;
          const nextY = curY + subDy;

          // Try direct movement
          if (isPositionValid({ x: nextX, y: nextY }, mapConfig)) {
            curX = nextX;
            curY = nextY;
          } else if (isPositionValid({ x: nextX, y: curY }, mapConfig)) {
            // Slide along X axis
            curX = nextX;
          } else if (isPositionValid({ x: curX, y: nextY }, mapConfig)) {
            // Slide along Y axis
            curY = nextY;
          } else {
            // Blocked in this substep
            break;
          }
        }

        posRef.current = { x: curX, y: curY };
        setAvatarPos({ x: curX, y: curY });
      }

      // Check Proximity to Target Point
      if (!isTargetDiscovered) {
        const dist = Math.hypot(
          posRef.current.x - currentStep.targetPoint.x,
          posRef.current.y - currentStep.targetPoint.y
        );

        if (dist <= currentStep.triggerRadius) {
          if (!isMuted) {
            soundController.playChime();
          }
          setShowDiscoveryBurst(true);
          setTimeout(() => setShowDiscoveryBurst(false), 1200);
          onTargetReached();
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [mapConfig, currentStep, isTargetDiscovered, onTargetReached, isMuted]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((z) => Math.min(1.4, Number((z + 0.15).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((z) => Math.max(0.85, Number((z - 0.15).toFixed(2))));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  // Calculate percentages relative to map coordinate system (618x430)
  const avatarLeftPercent = (avatarPos.x / mapConfig.mapWidth) * 100;
  const avatarTopPercent = (avatarPos.y / mapConfig.mapHeight) * 100;
  const targetLeftPercent = (currentStep.targetPoint.x / mapConfig.mapWidth) * 100;
  const targetTopPercent = (currentStep.targetPoint.y / mapConfig.mapHeight) * 100;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center select-none"
    >
      {/* 1. Ornate Gilded Antique Frame Container (Matches Reference UI) */}
      <div className="relative w-full max-w-[940px] aspect-[618/430] rounded-xl p-2 sm:p-2.5 bg-gradient-to-b from-[#dfbe73] via-[#b68c3b] to-[#7f5c1d] shadow-[0_16px_45px_rgba(75,50,20,0.35),inset_0_2px_4px_rgba(255,255,255,0.6)] border border-[#ffd866]/80 flex flex-col overflow-hidden">
        
        {/* Inner Beveled Recessed Canvas Border */}
        <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#e9decb] shadow-[inset_0_0_12px_rgba(0,0,0,0.4)] border border-[#8f6d2b]/60">
          
          {/* Zoomable Map Stage */}
          <div
            className="relative w-full h-full transition-transform duration-200 ease-out origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Layer A: Base Illustrated Floor Map Artwork */}
            <img
              src={mapConfig.mapImage}
              alt={mapConfig.floorName}
              className="w-full h-full object-fill pointer-events-none select-none filter contrast-[1.03] brightness-[1.01]"
              draggable={false}
            />

            {/* Layer B: Dev-only Watermark for Replaceable Map Architecture */}
            {import.meta.env.DEV && (
              <div className="absolute bottom-2 left-3 z-20 pointer-events-none px-2 py-0.5 rounded bg-amber-950/75 border border-amber-400/30 text-[9px] font-mono tracking-wider text-amber-200 uppercase">
                TEMPORARY MAP ARTWORK
              </div>
            )}

            {/* Layer C: Interactive Glowing Golden Target Point */}
            <div
              className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${targetLeftPercent}%`,
                top: `${targetTopPercent}%`,
              }}
            >
              {isTargetDiscovered ? (
                // Discovered State: Subtle golden compass check mark
                <div className="relative flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-700/80 border border-amber-300 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.8)]">
                    <span className="text-white text-[11px] font-bold">✓</span>
                  </div>
                </div>
              ) : (
                // Active Pulsing Clue Point
                <div className="relative flex items-center justify-center">
                  {/* Outer Radar Ripple Wave */}
                  <div className="absolute w-10 h-10 rounded-full border border-amber-300/60 animate-ping [animation-duration:2.2s]" />
                  {/* Soft Radiant Halo */}
                  <div className="absolute w-8 h-8 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,230,120,0.9)_0%,rgba(245,170,40,0.5)_50%,transparent_80%)] animate-pulse [animation-duration:1.6s] filter blur-[1px]" />
                  {/* Center Star Point */}
                  <div className="relative w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-100 to-white border border-amber-600 shadow-[0_0_12px_rgba(255,215,0,0.95)] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-900" />
                  </div>
                </div>
              )}
            </div>

            {/* Layer D: Golden Discovery Burst Animation */}
            {showDiscoveryBurst && (
              <div
                className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ping [animation-duration:0.9s]"
                style={{
                  left: `${targetLeftPercent}%`,
                  top: `${targetTopPercent}%`,
                }}
              >
                <div className="w-16 h-16 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95)_0%,rgba(255,215,0,0.8)_45%,transparent_75%)]" />
              </div>
            )}

            {/* Layer E: Desktop Map Explorer Avatar Token */}
            <div
              data-testid="avatar-explorer"
              className="avatar-explorer absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
              style={{
                left: `${avatarLeftPercent}%`,
                top: `${avatarTopPercent}%`,
              }}
            >
              <div className="relative flex items-center justify-center">
                {/* Subtle Avatar Ground Shadow */}
                <div className="absolute -bottom-1 w-6 h-3 rounded-full bg-black/45 filter blur-[2px]" />

                {/* Hooded Explorer Token Sprite (Matching Reference Image) */}
                <div className="relative w-7 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 28 32" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                    <defs>
                      <linearGradient id="cloakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2c2824" />
                        <stop offset="50%" stopColor="#151311" />
                        <stop offset="100%" stopColor="#080706" />
                      </linearGradient>
                      <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ffd866" />
                        <stop offset="100%" stopColor="#d4af37" />
                      </linearGradient>
                    </defs>
                    {/* Flowing Dark Cloak */}
                    <path
                      d="M 6,30 C 4,20 6,12 14,12 C 22,12 24,20 22,30 C 18,32 10,32 6,30 Z"
                      fill="url(#cloakGrad)"
                      stroke="#8f6d2b"
                      strokeWidth="0.8"
                    />
                    {/* Gold Hemline Trim */}
                    <path d="M 6,30 C 10,32 18,32 22,30" fill="none" stroke="url(#goldTrim)" strokeWidth="1.2" />
                    {/* Pointed Monk Hood */}
                    <path
                      d="M 14,2 C 8,6 8,15 14,16 C 20,15 20,6 14,2 Z"
                      fill="url(#cloakGrad)"
                      stroke="url(#goldTrim)"
                      strokeWidth="1"
                    />
                    {/* Shrouded Face Cowl Shadow */}
                    <ellipse cx="14" cy="10" rx="3.5" ry="4" fill="#000000" />
                    {/* Glowing Explorer Gaze */}
                    <circle cx="12.5" cy="9.5" r="0.7" fill="#ffd700" />
                    <circle cx="15.5" cy="9.5" r="0.7" fill="#ffd700" />
                  </svg>
                </div>

                {/* Compass Direction Arrow Indicator */}
                <div
                  className="absolute -top-3 w-3 h-3 flex items-center justify-center transition-transform duration-100"
                  style={{ transform: `rotate(${avatarAngle}deg)` }}
                >
                  <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-[#ffd866] filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Top-Left Badge: CAMPUS FLOOR MAP */}
          <div className="absolute top-2.5 left-2.5 z-30 pointer-events-none select-none">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#2b1f13]/90 border border-[#d4af37]/70 shadow-[0_2px_8px_rgba(0,0,0,0.5)] backdrop-blur-sm">
              <span className="text-[#ffd866] text-xs">🧭</span>
              <span className="font-cinzel text-[11px] sm:text-xs font-bold tracking-[0.18em] text-[#ffd866] uppercase">
                ✦ CAMPUS FLOOR MAP
              </span>
            </div>
          </div>

          {/* 3. Top-Right Badge: CLUE X OF 5 */}
          <div className="absolute top-2.5 right-2.5 z-30 pointer-events-none select-none">
            <div className="px-3 py-1 rounded bg-[#2b1f13]/90 border border-[#d4af37]/70 shadow-[0_2px_8px_rgba(0,0,0,0.5)] backdrop-blur-sm">
              <span className="font-cinzel text-[11px] sm:text-xs font-bold tracking-[0.18em] text-[#ffd866] uppercase">
                CLUE {currentStep.clueIndex} OF 5
              </span>
            </div>
          </div>

          {/* 4. Bottom-Right Controls: Zoom (+/-) and Compass Rose */}
          <div className="absolute bottom-2.5 right-2.5 z-30 flex items-center gap-2 select-none">
            {/* Zoom In (+) */}
            <button
              onClick={handleZoomIn}
              aria-label="Zoom Map In"
              className="w-7 h-7 rounded-full bg-[#2b1f13]/85 hover:bg-[#3d2c1b] border border-[#d4af37]/60 text-[#ffd866] text-sm font-bold flex items-center justify-center transition-all shadow-[0_2px_6px_rgba(0,0,0,0.4)] cursor-pointer"
              title="Zoom In"
            >
              +
            </button>
            {/* Zoom Out (-) */}
            <button
              onClick={handleZoomOut}
              aria-label="Zoom Map Out"
              className="w-7 h-7 rounded-full bg-[#2b1f13]/85 hover:bg-[#3d2c1b] border border-[#d4af37]/60 text-[#ffd866] text-sm font-bold flex items-center justify-center transition-all shadow-[0_2px_6px_rgba(0,0,0,0.4)] cursor-pointer"
              title="Zoom Out"
            >
              −
            </button>
            {/* Compass Rose Reset Button */}
            <button
              onClick={handleResetZoom}
              aria-label="Reset Map Orientation"
              className="w-8 h-8 rounded-full bg-[#2b1f13]/85 hover:bg-[#3d2c1b] border border-[#d4af37]/60 text-[#ffd866] flex items-center justify-center transition-all shadow-[0_2px_6px_rgba(0,0,0,0.4)] cursor-pointer group"
              title="Reset Zoom & View"
            >
              <div className="relative flex flex-col items-center">
                <span className="text-[9px] font-cinzel font-bold text-[#ffd866] leading-none mb-0.5">N</span>
                <span className="text-xs group-hover:rotate-45 transition-transform duration-300">🧭</span>
              </div>
            </button>
          </div>

          {/* 5. Bottom-Left Subtle Movement Controls Hint */}
          <div className="absolute bottom-2.5 left-2.5 z-30 pointer-events-none select-none hidden sm:block">
            <span className="font-cinzel text-[10px] tracking-widest text-[#7c5b2a] bg-[#fbf5e6]/80 px-2 py-0.5 rounded border border-[#d4af37]/30 shadow-sm uppercase font-semibold">
              WASD / ARROW KEYS TO MOVE
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
