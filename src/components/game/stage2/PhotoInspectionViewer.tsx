import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { HuntImage, Hotspot } from '../../../types/round1.types';

interface DiscoveryRipple {
  id: string;
  xPercent: number;
  yPercent: number;
}

interface PhotoInspectionViewerProps {
  image: HuntImage;
  foundTargetIds: string[];
  stageCleared: boolean;
  onClose: () => void;
  onHotspotClick: (hotspot: Hotspot, e: React.MouseEvent) => void;
  onMissedClick: (e: React.MouseEvent) => void;
}

export const PhotoInspectionViewer: React.FC<PhotoInspectionViewerProps> = ({
  image,
  foundTargetIds,
  stageCleared: _stageCleared,
  onClose,
  onHotspotClick,
  onMissedClick,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<DiscoveryRipple[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(1);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse drag panning when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Click on a target hotspot
  const handleHotspotSelect = (hotspot: Hotspot, e: React.MouseEvent) => {
    e.stopPropagation();
    // Add golden discovery ripple effect using ref counter
    const currentId = `ripple_${rippleIdRef.current++}`;
    const newRipple: DiscoveryRipple = {
      id: currentId,
      xPercent: hotspot.xPercent + hotspot.widthPercent / 2,
      yPercent: hotspot.yPercent + hotspot.heightPercent / 2,
    };
    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1800);

    onHotspotClick(hotspot, e);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspection-title"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md p-2 sm:p-4 select-none animate-fadeIn"
    >
      {/* 1. Top Inspection HUD Bar */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 border-b border-amber-600/30 pb-2.5 sm:pb-3 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-300 font-bold text-sm shadow-[0_0_12px_rgba(245,158,11,0.5)]">
            🔍
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-cinzel font-bold text-amber-400/90 tracking-widest uppercase">
              DETECTIVE EVIDENCE INSPECTION
            </div>
            <h2
              id="inspection-title"
              className="text-sm sm:text-lg md:text-xl font-cinzel font-black text-stone-100 tracking-wide"
            >
              INSPECTION VIEWER • {image.title}
            </h2>
          </div>
        </div>

        {/* Controls: Zoom In, Zoom Out, Reset, Close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center rounded-lg bg-stone-900 border border-stone-700/80 p-0.5 shadow-inner">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              aria-label="Zoom Out"
              title="Zoom Out"
              className="px-2.5 py-1 text-xs font-bold text-stone-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              -
            </button>
            <span className="px-2 text-[11px] font-mono text-amber-300 font-bold min-w-[42px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              aria-label="Zoom In"
              title="Zoom In"
              className="px-2.5 py-1 text-xs font-bold text-stone-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetZoom}
            aria-label="Reset Zoom"
            className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700/80 text-[10px] sm:text-xs font-cinzel font-semibold text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            1x
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Inspector"
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 border border-amber-400 text-stone-950 font-cinzel text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer"
          >
            Back to Evidence Table ✕
          </button>
        </div>
      </div>

      {/* 2. Main High-Res Photograph Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onClick={onMissedClick}
        className={`relative flex-1 max-w-5xl w-full mx-auto my-2 rounded-2xl overflow-hidden border-2 border-stone-800 bg-[#070503] flex items-center justify-center shadow-2xl ${
          zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
        }`}
      >
        <div
          style={{
            transform: `scale(${zoomLevel}) translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          className="relative max-w-full max-h-full aspect-square sm:aspect-[4/3] flex items-center justify-center select-none"
        >
          {/* High-Resolution Scene Illustration */}
          <img
            src={image.imageUrl}
            alt={image.title}
            className="max-h-[70vh] sm:max-h-[76vh] w-auto object-contain pointer-events-none filter contrast-105"
            draggable={false}
          />

          {/* Invisible Hotspots Layer (Accurate Normalized % Coordinates) */}
          {image.hotspots.map((hs) => {
            const isAlreadyFound = foundTargetIds.includes(hs.targetId);

            return (
              <div
                key={hs.id}
                role="button"
                tabIndex={0}
                aria-label={`Select ${hs.name}`}
                onClick={(e) => handleHotspotSelect(hs, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleHotspotSelect(hs, e as unknown as React.MouseEvent);
                  }
                }}
                style={{
                  left: `${hs.xPercent}%`,
                  top: `${hs.yPercent}%`,
                  width: `${hs.widthPercent}%`,
                  height: `${hs.heightPercent}%`,
                }}
                className={`absolute select-none transition-all ${
                  isAlreadyFound
                    ? 'border-2 border-emerald-400/80 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.7)] bg-emerald-500/10 cursor-pointer pointer-events-auto'
                    : 'opacity-0 hover:opacity-0 cursor-crosshair pointer-events-auto'
                }`}
              >
                {/* Golden Discovered Rune Indicator */}
                {isAlreadyFound && (
                  <div className="absolute inset-0 flex items-center justify-center text-emerald-300 font-bold text-xs pointer-events-none drop-shadow-[0_0_6px_rgba(16,185,129,1)]">
                    ✓
                  </div>
                )}
              </div>
            );
          })}

          {/* Dynamic Expanding Discovery Ripple Effect */}
          {ripples.map((rip) => (
            <div
              key={rip.id}
              style={{
                left: `${rip.xPercent}%`,
                top: `${rip.yPercent}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,1)] animate-ping pointer-events-none z-40"
            />
          ))}
        </div>
      </div>

      {/* 3. Bottom Information & Help Footer */}
      <div className="relative z-30 max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-3 text-stone-400 text-xs px-2">
        <p className="font-sans italic text-stone-400 text-center sm:text-left text-[11px] sm:text-xs">
          {image.description}
        </p>
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-amber-300/80">
          <span>{zoomLevel > 1 ? '🖱️ Drag to pan • ' : '🔍 Click relic to tag • '}</span>
          <span>[ESC] to return</span>
        </div>
      </div>
    </div>
  );
};
