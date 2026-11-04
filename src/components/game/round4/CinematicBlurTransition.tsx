import React from 'react';

interface CinematicBlurTransitionProps {
  children: React.ReactNode;
  isInitialFocused: boolean;
  isOutgoing: boolean;
  reducedMotion?: boolean;
}

export const CinematicBlurTransition: React.FC<CinematicBlurTransitionProps> = ({
  children,
  isInitialFocused,
  isOutgoing,
  reducedMotion = false,
}) => {
  if (reducedMotion) {
    let opacityClass = 'opacity-0';
    if (isOutgoing) {
      opacityClass = 'opacity-0 pointer-events-none';
    } else if (isInitialFocused) {
      opacityClass = 'opacity-100';
    }

    return (
      <div
        className={`w-full min-h-screen transition-opacity duration-300 ${opacityClass}`}
      >
        {children}
      </div>
    );
  }

  // Camera lens focus and blur crossfade styles
  let style: React.CSSProperties;

  if (isOutgoing) {
    // Phase 4: Outgoing scene smoothly loses focus and fades away
    style = {
      filter: 'blur(14px)',
      opacity: 0,
      transform: 'scale(0.98)',
      transition: 'filter 1400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 1400ms cubic-bezier(0.4, 0, 0.2, 1), transform 1400ms cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'none',
      willChange: 'filter, opacity, transform',
    };
  } else if (isInitialFocused) {
    // Normal fully focused state
    style = {
      filter: 'blur(0px)',
      opacity: 1,
      transform: 'scale(1)',
      transition: 'filter 1000ms cubic-bezier(0.16, 1, 0.3, 1), opacity 1000ms cubic-bezier(0.16, 1, 0.3, 1), transform 1000ms cubic-bezier(0.16, 1, 0.3, 1)',
      willChange: 'filter, opacity, transform',
    };
  } else {
    // Phase 1 Initial state: softly blurred, low initial opacity, slightly enlarged
    style = {
      filter: 'blur(12px)',
      opacity: 0.35,
      transform: 'scale(1.025)',
      transition: 'none',
      willChange: 'filter, opacity, transform',
    };
  }

  return (
    <div className="w-full min-h-screen origin-center select-none" style={style}>
      {children}
    </div>
  );
};
