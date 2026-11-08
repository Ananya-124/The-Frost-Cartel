import React, { useState, useRef, useEffect } from 'react';
import type { HuntImage, Hotspot } from '../../../types/round1.types';
import { normalizeTargetId } from './stage2TargetsConfig';
import { useInspectionZoomPan } from './useInspectionZoomPan';

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

function isTargetFound(targetId: string, foundTargetIds: string[]): boolean {
  const normId = normalizeTargetId(targetId);
  return foundTargetIds.some(
    (id) => normalizeTargetId(id) === normId || id === targetId
  );
}

interface OverlayItemProps {
  hotspot: Hotspot;
  isAlreadyFound: boolean;
  imgWidth: number;
  imgHeight: number;
  onSelect: (hotspot: Hotspot, e: React.MouseEvent) => void;
}

const DiscoveredBadge: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <g transform={`translate(${cx}, ${cy})`} className="pointer-events-none">
    <circle r="14" fill="#064e3b" stroke="#34d399" strokeWidth="2" filter="url(#gold-glow)" />
    <text y="5" textAnchor="middle" fill="#6ee7b7" fontSize="14" fontWeight="bold">
      ✓
    </text>
  </g>
);

const HotspotPathItem: React.FC<OverlayItemProps> = ({
  hotspot,
  isAlreadyFound,
  imgWidth,
  imgHeight,
  onSelect,
}) => {
  const handleKeySelect = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(hotspot, e as unknown as React.MouseEvent);
    }
  };

  const cx = (hotspot.xPercent * imgWidth) / 100 + (hotspot.widthPercent * imgWidth) / 200;
  const cy = (hotspot.yPercent * imgHeight) / 100 + (hotspot.heightPercent * imgHeight) / 200;
  const strokeW = isAlreadyFound ? Math.max(3, imgWidth / 400) : Math.max(12, imgWidth / 100);

  return (
    <g key={hotspot.id}>
      <path
        id={`path_${hotspot.id}`}
        d={hotspot.svgPath}
        role="button"
        tabIndex={0}
        aria-label={`Select ${hotspot.name}`}
        onClick={(e) => onSelect(hotspot, e)}
        onKeyDown={handleKeySelect}
        fill={isAlreadyFound ? 'rgba(251, 191, 36, 0.22)' : 'rgba(0, 0, 0, 0.001)'}
        stroke={isAlreadyFound ? '#fbbf24' : 'transparent'}
        strokeWidth={strokeW}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ pointerEvents: 'all' }}
        filter={isAlreadyFound ? 'url(#gold-glow)' : undefined}
        className={`transition-all duration-300 ${
          isAlreadyFound ? 'relic-gold-draw cursor-default' : 'opacity-0 hover:opacity-0 cursor-crosshair'
        }`}
      />
      {isAlreadyFound && <DiscoveredBadge cx={cx} cy={cy} />}
    </g>
  );
};

const HotspotRectItem: React.FC<OverlayItemProps> = ({
  hotspot,
  isAlreadyFound,
  imgWidth,
  imgHeight,
  onSelect,
}) => {
  const handleKeySelect = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(hotspot, e as unknown as React.MouseEvent);
    }
  };

  const rx = (hotspot.xPercent * imgWidth) / 100;
  const ry = (hotspot.yPercent * imgHeight) / 100;
  const rw = (hotspot.widthPercent * imgWidth) / 100;
  const rh = (hotspot.heightPercent * imgHeight) / 100;

  return (
    <g key={hotspot.id}>
      <rect
        id={`rect_${hotspot.id}`}
        x={rx}
        y={ry}
        width={rw}
        height={rh}
        rx="8"
        role="button"
        tabIndex={0}
        aria-label={`Select ${hotspot.name}`}
        onClick={(e) => onSelect(hotspot, e)}
        onKeyDown={handleKeySelect}
        fill={isAlreadyFound ? 'rgba(251, 191, 36, 0.22)' : 'rgba(0, 0, 0, 0.001)'}
        stroke={isAlreadyFound ? '#fbbf24' : 'transparent'}
        strokeWidth={isAlreadyFound ? 3 : 0}
        style={{ pointerEvents: 'all' }}
        filter={isAlreadyFound ? 'url(#gold-glow)' : undefined}
        className={`transition-all duration-300 ${
          isAlreadyFound ? 'cursor-default' : 'opacity-0 hover:opacity-0 cursor-crosshair'
        }`}
      />
      {isAlreadyFound && <DiscoveredBadge cx={rx + rw / 2} cy={ry + rh / 2} />}
    </g>
  );
};

const HotspotOverlayItem: React.FC<OverlayItemProps> = (props) => {
  if (props.hotspot.svgPath) {
    return <HotspotPathItem {...props} />;
  }
  return <HotspotRectItem {...props} />;
};

export const PhotoInspectionViewer: React.FC<PhotoInspectionViewerProps> = ({
  image,
  foundTargetIds,
  stageCleared: _stageCleared,
  onClose,
  onHotspotClick,
  onMissedClick,
}) => {
  const {
    zoomLevel,
    pan,
    isDragging,
    containerRef,
    cursorClass,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  } = useInspectionZoomPan();

  const [ripples, setRipples] = useState<DiscoveryRipple[]>([]);
  const rippleIdRef = useRef(1);

  // Canonical dimensions from image or standard fallback
  const imgWidth = (image as { width?: number }).width ?? 1280;
  const imgHeight = (image as { height?: number }).height ?? 853;

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

  // Click on a target hotspot
  const handleHotspotSelect = (hotspot: Hotspot, e: React.MouseEvent) => {
    e.stopPropagation();
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
    <dialog
      open
      aria-labelledby="inspection-title"
      className="fixed inset-0 z-50 m-0 p-2 sm:p-4 w-full h-full max-w-none max-h-none border-none flex flex-col justify-between bg-black/95 backdrop-blur-md text-stone-100 select-none animate-fadeIn"
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
        className={`relative flex-1 max-w-5xl w-full mx-auto my-2 rounded-2xl overflow-hidden border-2 border-stone-800 bg-[#070503] flex items-center justify-center shadow-2xl ${cursorClass}`}
      >
        {/* Transform container applying zoom and pan to BOTH image and SVG overlay together */}
        <div
          style={{
            transform: `scale(${zoomLevel}) translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            aspectRatio: `${imgWidth} / ${imgHeight}`,
            maxHeight: '74vh',
            maxWidth: '100%',
          }}
          className="relative w-full h-full flex items-center justify-center select-none"
        >
          {/* High-Resolution Scene Photograph */}
          <img
            src={image.imageUrl}
            alt={image.title}
            className="w-full h-full object-fill pointer-events-none filter contrast-105"
            draggable={false}
          />

          {/* Unified SVG Hotspot Overlay (Zero Pixel Drift Guarantee) */}
          <svg
            viewBox={`0 0 ${imgWidth} ${imgHeight}`}
            aria-label={`Interactive evidence targets for ${image.title}`}
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
          >
            <title>{`Interactive evidence targets for ${image.title}`}</title>
            <defs>
              <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <style>{`
                @keyframes drawGoldenPath {
                  0% { stroke-dashoffset: 1500; opacity: 0.3; }
                  100% { stroke-dashoffset: 0; opacity: 1; }
                }
                .relic-gold-draw {
                  stroke-dasharray: 1500;
                  animation: drawGoldenPath 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
              `}</style>
            </defs>

            {/* Transparent background catcher for missed clicks */}
            <rect
              x="0"
              y="0"
              width={imgWidth}
              height={imgHeight}
              fill="transparent"
              onClick={onMissedClick}
              className="cursor-crosshair pointer-events-auto"
            />

            {/* Target Hotspots */}
            {image.hotspots.map((hs) => (
              <HotspotOverlayItem
                key={hs.id}
                hotspot={hs}
                isAlreadyFound={isTargetFound(hs.targetId, foundTargetIds)}
                imgWidth={imgWidth}
                imgHeight={imgHeight}
                onSelect={handleHotspotSelect}
              />
            ))}
          </svg>

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
    </dialog>
  );
};
