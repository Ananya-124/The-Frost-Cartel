import React from 'react';
import { BUILDING_VIEWBOX, type FloorDefinition } from './FloorConfiguration';

export type CameraAnimationPhase =
  | 'IDLE'
  | 'APPROACHING'
  | 'WINDOW_FOCUSED'
  | 'WINDOW_OPENING'
  | 'WINDOW_ENTERING'
  | 'COMPLETED';

interface FloorCameraTransitionProps {
  children: React.ReactNode;
  selectedFloor: FloorDefinition | null;
  phase: CameraAnimationPhase;
  reducedMotion?: boolean;
}

/**
 * Continuous Cinematic Drone-Style Camera Flight & Direct Window Entry
 * - Stage A -> B -> C: Smooth upward ascent towards the selected floor's open window
 * - Stage D: Direct push straight through the already-open window aperture into the room without stopping
 * - Total duration: ~1.5 seconds with continuous forward velocity
 */
export const FloorCameraTransition: React.FC<FloorCameraTransitionProps> = ({
  children,
  selectedFloor,
  phase,
  reducedMotion = false,
}) => {
  if (!selectedFloor || phase === 'IDLE') {
    return (
      <div
        className="relative w-full h-full transition-transform duration-700 ease-out origin-center"
        style={{ transform: 'scale(1) translate3d(0, 0, 0)' }}
      >
        {children}
      </div>
    );
  }

  // Calculate transform origin based on the target open window center in 1629x965 viewBox space
  const originXPercent =
    ((selectedFloor.windowTarget.x + selectedFloor.windowTarget.width / 2) / BUILDING_VIEWBOX.width) * 100;
  const originYPercent =
    ((selectedFloor.windowTarget.y + selectedFloor.windowTarget.height / 2) / BUILDING_VIEWBOX.height) * 100;

  let currentScale = 1;
  let transitionDuration: string;
  let easing = 'cubic-bezier(0.22, 1, 0.36, 1)'; // Drone ascent deceleration curve

  if (phase === 'APPROACHING' || phase === 'WINDOW_FOCUSED') {
    // Stage B & C: Upward drone approach towards the open window (1050ms continuous movement)
    currentScale = selectedFloor.cameraTarget.scale;
    transitionDuration = '1050ms';
  } else if (phase === 'WINDOW_ENTERING' || phase === 'WINDOW_OPENING') {
    // Stage D: Continuous forward push straight through the open window aperture into the interior (420ms)
    currentScale = selectedFloor.cameraTarget.scale * 1.85;
    transitionDuration = '420ms';
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)';
  } else {
    // phase === 'COMPLETED'
    currentScale = selectedFloor.cameraTarget.scale * 2.1;
    transitionDuration = '300ms';
    easing = 'ease-out';
  }

  const transformStyle: React.CSSProperties = reducedMotion
    ? {
        transform: 'scale(1)',
        opacity: phase === 'WINDOW_ENTERING' || phase === 'COMPLETED' ? 0 : 1,
        transition: 'opacity 500ms ease',
      }
    : {
        transformOrigin: `${originXPercent}% ${originYPercent}%`,
        transform: `scale(${currentScale}) translate3d(0, 0, 0)`,
        transition: `transform ${transitionDuration} ${easing}`,
        willChange: 'transform',
      };

  return (
    <div className="relative w-full h-full overflow-visible" style={transformStyle}>
      {children}
    </div>
  );
};


