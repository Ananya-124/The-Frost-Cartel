import React, { useState } from 'react';
import type { HuntImage, Hotspot } from '../../../types/round1.types';
import { STAGE2_TARGET_DEFINITIONS } from './stage2TargetsConfig';

interface TargetCalibrationModalProps {
  images: HuntImage[];
  isOpen: boolean;
  onClose: () => void;
  onTestDiscover?: (hotspot: Hotspot) => void;
}

export const TargetCalibrationModal: React.FC<TargetCalibrationModalProps> = ({
  images,
  isOpen,
  onClose,
  onTestDiscover,
}) => {
  const [selectedImageId, setSelectedImageId] = useState<string>(images[0]?.id || 'img_01');
  const [showOutlines, setShowOutlines] = useState(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  if (!isOpen) return null;

  const currentImage = images.find((img) => img.id === selectedImageId) || images[0];
  const imgWidth = (currentImage as { width?: number }).width ?? 1280;
  const imgHeight = (currentImage as { height?: number }).height ?? 853;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calib-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 select-none animate-fadeIn"
    >
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#120a05] border-2 border-amber-600/80 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/60 p-3 sm:p-4 bg-stone-950/80">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl">🛠️</span>
            <div>
              <h2
                id="calib-title"
                className="font-cinzel text-sm sm:text-base font-bold text-amber-300"
              >
                Developer Target Calibration Tool
              </h2>
              <p className="text-[10px] sm:text-xs text-stone-400">
                Inspect high-res photograph SVG contours & pixel hit coordinates for all 12 relics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOutlines((prev) => !prev)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                showOutlines
                  ? 'bg-amber-950 border-amber-500 text-amber-200'
                  : 'bg-stone-900 border-stone-700 text-stone-400'
              }`}
            >
              SVG Contours: {showOutlines ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={() => setShowBoundingBoxes((prev) => !prev)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                showBoundingBoxes
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                  : 'bg-stone-900 border-stone-700 text-stone-400'
              }`}
            >
              Bounds: {showBoundingBoxes ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Calibration Modal"
              className="px-3 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded text-xs font-bold text-stone-300 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scene Selection Tabs */}
        <div className="flex overflow-x-auto gap-1 p-2 bg-stone-950/60 border-b border-stone-800">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedImageId(img.id)}
              className={`px-3 py-1.5 rounded text-xs font-cinzel font-semibold whitespace-nowrap transition-all ${
                selectedImageId === img.id
                  ? 'bg-amber-700 text-white shadow'
                  : 'bg-stone-900/80 text-stone-400 hover:text-stone-200'
              }`}
            >
              {img.title}
            </button>
          ))}
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col lg:flex-row gap-4 items-start justify-center">
          {/* Main Visual Display */}
          <div className="flex-1 w-full flex flex-col items-center">
            <div
              style={{
                aspectRatio: `${imgWidth} / ${imgHeight}`,
                maxWidth: '100%',
                maxHeight: '56vh',
              }}
              className="relative w-full border border-stone-700 rounded-lg overflow-hidden bg-black shadow-inner"
            >
              <img
                src={currentImage.imageUrl}
                alt={currentImage.title}
                className="w-full h-full object-fill pointer-events-none"
              />

              {/* Calibration SVG Overlay */}
              <svg
                viewBox={`0 0 ${imgWidth} ${imgHeight}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                {currentImage.hotspots.map((hs) => {
                  const def = STAGE2_TARGET_DEFINITIONS.find((d) => d.targetId === hs.targetId);
                  const rx = (hs.xPercent * imgWidth) / 100;
                  const ry = (hs.yPercent * imgHeight) / 100;
                  const rw = (hs.widthPercent * imgWidth) / 100;
                  const rh = (hs.heightPercent * imgHeight) / 100;

                  return (
                    <g key={hs.id}>
                      {showBoundingBoxes && (
                        <rect
                          x={rx}
                          y={ry}
                          width={rw}
                          height={rh}
                          fill="rgba(16, 185, 129, 0.15)"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                        />
                      )}
                      {showOutlines && hs.svgPath && (
                        <path
                          d={hs.svgPath}
                          fill="rgba(245, 158, 11, 0.35)"
                          stroke="#fbbf24"
                          strokeWidth="3"
                        />
                      )}
                      <circle cx={rx + rw / 2} cy={ry + rh / 2} r="6" fill="#ef4444" />
                      <text
                        x={rx + rw / 2}
                        y={ry - 6}
                        textAnchor="middle"
                        fill="#fef08a"
                        fontSize="16"
                        fontWeight="bold"
                        filter="drop-shadow(0 0 4px #000)"
                      >
                        {def?.name || hs.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="mt-2 text-xs text-stone-400 font-mono">
              Dimensions: {imgWidth} × {imgHeight} px • Aspect: {(imgWidth / imgHeight).toFixed(2)}
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-3">
            <h3 className="font-cinzel text-xs font-bold uppercase tracking-wider text-amber-300">
              Hotspots in this scene ({currentImage.hotspots.length})
            </h3>
            {currentImage.hotspots.map((hs) => {
              const def = STAGE2_TARGET_DEFINITIONS.find((d) => d.targetId === hs.targetId);
              return (
                <div
                  key={hs.id}
                  className="p-3 rounded-lg bg-stone-900/90 border border-stone-800 flex flex-col gap-1.5 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 font-cinzel">
                      {def?.name || hs.name}
                    </span>
                    <span className="text-[10px] text-stone-500 uppercase">
                      ID: {hs.targetId}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-300">
                    <div>Original: X: {hs.originalX ?? Math.round((hs.xPercent * imgWidth) / 100)}, Y: {hs.originalY ?? Math.round((hs.yPercent * imgHeight) / 100)} px</div>
                    <div>Size: {hs.originalWidth ?? Math.round((hs.widthPercent * imgWidth) / 100)} × {hs.originalHeight ?? Math.round((hs.heightPercent * imgHeight) / 100)} px</div>
                    <div>Norm: {hs.xPercent.toFixed(1)}%, {hs.yPercent.toFixed(1)}% ({hs.widthPercent.toFixed(1)}% × {hs.heightPercent.toFixed(1)}%)</div>
                    <div className="truncate text-stone-500 text-[10px] mt-1">
                      SVG: {hs.svgPath ? `${hs.svgPath.slice(0, 35)}...` : 'None (using rect)'}
                    </div>
                  </div>
                  {onTestDiscover && (
                    <button
                      type="button"
                      onClick={() => onTestDiscover(hs)}
                      className="mt-1 px-2 py-1 rounded bg-amber-950 hover:bg-amber-900 border border-amber-600/60 text-amber-300 text-[11px] font-cinzel transition-colors"
                    >
                      ⚡ Test Trigger Discovery
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

