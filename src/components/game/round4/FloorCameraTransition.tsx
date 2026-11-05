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

  // Calculate transform origin based on the target window center in 1629x965 viewBox space
  const originXPercent =
    ((selectedFloor.windowTarget.x + selectedFloor.windowTarget.width / 2) / BUILDING_VIEWBOX.width) * 100;
  const originYPercent =
    ((selectedFloor.windowTarget.y + selectedFloor.windowTarget.height / 2) / BUILDING_VIEWBOX.height) * 100;

  let currentScale = 1;
  let transitionDuration = '1800ms';
  let easing = 'cubic-bezier(0.22, 1, 0.36, 1)'; // Smooth drone deceleration curve

  if (phase === 'APPROACHING') {
    currentScale = selectedFloor.cameraTarget.scale;
    transitionDuration = '1800ms';
  } else if (phase === 'WINDOW_FOCUSED' || phase === 'WINDOW_OPENING') {
    currentScale = selectedFloor.cameraTarget.scale;
    transitionDuration = '600ms';
  } else if (phase === 'WINDOW_ENTERING' || phase === 'COMPLETED') {
    currentScale = selectedFloor.cameraTarget.scale * 1.45; // Camera pushes through window
    transitionDuration = '900ms';
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)';
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

