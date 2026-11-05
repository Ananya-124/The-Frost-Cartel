import React, { useState } from 'react';
import { BUILDING_VIEWBOX, type FloorDefinition } from './FloorConfiguration';

interface FloorCalibrationToolProps {
  floors: FloorDefinition[];
  activeFloorId: string | null;
  onSelectFloor: (floorId: string) => void;
  mouseCoords: { x: number; y: number } | null;
  onTestZoom: (floor: FloorDefinition) => void;
  onClose: () => void;
}

export const FloorCalibrationTool: React.FC<FloorCalibrationToolProps> = ({
  floors,
  activeFloorId,
  onSelectFloor,
  mouseCoords,
  onTestZoom,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<string>(activeFloorId || floors[0]?.id || 'floor-7');
  const [copied, setCopied] = useState(false);

  const currentFloor = floors.find((f) => f.id === selectedId) || floors[0];

  const handleCopyJSON = () => {
    const jsonStr = JSON.stringify(currentFloor, null, 2);
    navigator.clipboard?.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      aria-label="Floor Calibration Tool"
      className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-lg border border-amber-500/60 bg-black/90 text-amber-200 p-4 font-mono text-xs shadow-2xl backdrop-blur-md space-y-3"
    >
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-amber-300 font-cinzel text-xs tracking-wider">
            SVG CALIBRATION TOOL
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-amber-400/60 hover:text-amber-200 px-1 py-0.5 rounded text-sm"
          title="Close Calibration"
        >
          ✕
        </button>
      </div>

      {/* Real-time Cursor Coordinates Readout */}
      <div className="flex items-center justify-between bg-amber-950/40 p-2 rounded border border-amber-500/20">
        <span className="text-amber-400 font-semibold">VIEWBOX ({BUILDING_VIEWBOX.width} × {BUILDING_VIEWBOX.height}):</span>
        <span className="text-white font-bold">
          {mouseCoords ? `X: ${mouseCoords.x.toFixed(1)}, Y: ${mouseCoords.y.toFixed(1)}` : 'Hover Building...'}
        </span>
      </div>

      {/* Floor Selector */}
      <div className="space-y-1">
        <label htmlFor="calibration-floor-select" className="text-amber-400 font-semibold block text-[11px]">SELECT FLOOR TO INSPECT:</label>
        <select
          id="calibration-floor-select"
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            onSelectFloor(e.target.value);
          }}
          className="w-full bg-[#16120b] border border-amber-500/40 rounded px-2 py-1 text-amber-200 focus:outline-none focus:border-amber-400"
        >
          {floors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.romanNumeral} — {f.label} ({f.outlinePaths.length} path{f.outlinePaths.length > 1 ? 's' : ''})
            </option>
          ))}
        </select>
      </div>

      {/* Floor Coordinate Metrics */}
      {currentFloor && (
        <div className="space-y-1 bg-black/60 p-2 rounded border border-amber-500/20 text-[11px]">
          <div>
            <span className="text-amber-400/80">Window Target:</span>{' '}
            <span className="text-white">
              x: {currentFloor.windowTarget.x}, y: {currentFloor.windowTarget.y}, w: {currentFloor.windowTarget.width}, h: {currentFloor.windowTarget.height}
            </span>
          </div>
          <div>
            <span className="text-amber-400/80">Camera Target:</span>{' '}
            <span className="text-white">
              x: {currentFloor.cameraTarget.x}, y: {currentFloor.cameraTarget.y}, scale: {currentFloor.cameraTarget.scale}x
            </span>
          </div>
          <div>
            <span className="text-amber-400/80">Paths Count:</span>{' '}
            <span className="text-amber-300">{currentFloor.outlinePaths.length} architectural segments</span>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => currentFloor && onTestZoom(currentFloor)}
          className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase tracking-wider text-[11px] transition-colors"
        >
          Test Drone Zoom
        </button>
        <button
          onClick={handleCopyJSON}
          className="px-3 py-1.5 rounded border border-amber-500/50 bg-black/60 hover:bg-amber-950/60 text-amber-300 text-[11px] transition-colors"
        >
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>
      </div>
    </aside>
  );
};

