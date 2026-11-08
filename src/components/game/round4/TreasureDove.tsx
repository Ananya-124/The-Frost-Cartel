import React, { useEffect, useState, useRef } from 'react';
import type { Round4IntroState } from '../../../types/round4.types';
import { soundController } from '../../../utils/soundController';
import {
  APPROACH_PATH,
  PERCH_PATH,
  getDoveTransform,
  type DoveTransform,
} from './DoveFlightPath';

interface TreasureDoveProps {
  state: Round4IntroState;
  onLetterDrop: () => void;
  onDovePerched: () => void;
  isMuted: boolean;
}

export const TreasureDove: React.FC<TreasureDoveProps> = ({
  state,
  onLetterDrop,
  onDovePerched,
  isMuted,
}) => {
  const [doveTransform, setDoveTransform] = useState<DoveTransform>(() => ({
    x: APPROACH_PATH.p0.x,
    y: APPROACH_PATH.p0.y,
    pitch: 5,
    bank: 0,
    scale: APPROACH_PATH.startScale,
  }));

  const [flapPhase, setFlapPhase] = useState(0);
  const [flyingImgError, setFlyingImgError] = useState(false);
  const [perchedImgError, setPerchedImgError] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Flap wings gently while hovering at pedestal during letter drop
  useEffect(() => {
    if (state === 'LETTER_DROPPING' || state === 'LETTER_DROPPED') {
      let frame: number;
      const start = performance.now();
      const hoverFlap = (now: number) => {
        setFlapPhase((now - start) * 0.014);
        frame = requestAnimationFrame(hoverFlap);
      };
      frame = requestAnimationFrame(hoverFlap);
      return () => cancelAnimationFrame(frame);
    }
  }, [state]);

  // Approach Flight: Slow, elegant 3.8s flight (DOVE_ENTERING / DOVE_FLYING / DOVE_APPROACHING)
  useEffect(() => {
    if (
      state !== 'DOVE_ENTERING' &&
      state !== 'DOVE_FLYING' &&
      state !== 'DOVE_APPROACHING'
    ) {
      return;
    }

    if (!isMuted) {
      soundController.playDoveFlutter();
    }

    const duration = 3800; // 3.8s majestic curved approach
    startTimeRef.current = null;

    const animateFlight = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const rawT = Math.min(1, elapsed / duration);

      // Smooth ease-in-out progress for slow, natural acceleration and deceleration
      const t = rawT < 0.5 ? 2 * rawT * rawT : -1 + (4 - 2 * rawT) * rawT;

      const transform = getDoveTransform(APPROACH_PATH, t);

      setDoveTransform(transform);
      // Gentle, majestic wing flapping frequency slows into a flare as bird arrives at pedestal
      const flapRate = 0.014 * (1 - rawT * 0.45);
      setFlapPhase(elapsed * flapRate);

      if (rawT < 1) {
        animFrameRef.current = requestAnimationFrame(animateFlight);
      } else {
        // Arrived directly at pedestal release point
        onLetterDrop();
      }
    };

    animFrameRef.current = requestAnimationFrame(animateFlight);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, onLetterDrop, isMuted]);

  // Departure & Perch Flight: Smooth 2.4s ascent (DOVE_LANDING)
  useEffect(() => {
    if (state !== 'DOVE_LANDING') return;

    if (!isMuted) {
      soundController.playDoveFlutter();
    }

    const duration = 2400; // 2.4s graceful ascent to right arch column
    startTimeRef.current = null;

    const animatePerch = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const rawT = Math.min(1, elapsed / duration);

      // Smooth deceleration ease-out
      const t = 1 - Math.pow(1 - rawT, 2.2);

      const transform = getDoveTransform(PERCH_PATH, t);

      setDoveTransform(transform);
      // Wing flapping gradually slows down as bird settles
      const flapFrequency = 0.016 * (1 - rawT * 0.75);
      setFlapPhase(elapsed * flapFrequency);

      if (rawT < 1) {
        animFrameRef.current = requestAnimationFrame(animatePerch);
      } else {
        onDovePerched();
      }
    };

    animFrameRef.current = requestAnimationFrame(animatePerch);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, onDovePerched, isMuted]);

  // If in initial reveal or idle states, bird is not yet visible
  if (
    state === 'INITIAL_REVEAL' ||
    state === 'ENVIRONMENT_IDLE' ||
    state === 'INTRO_VISIBLE'
  ) {
    return null;
  }

  const isFlying =
    state === 'DOVE_ENTERING' ||
    state === 'DOVE_FLYING' ||
    state === 'DOVE_APPROACHING' ||
    state === 'LETTER_DROPPING' ||
    state === 'LETTER_DROPPED' ||
    state === 'DOVE_LANDING';

  const isPerched =
    state === 'LETTER_AVAILABLE' ||
    state === 'LETTER_OPENING' ||
    state === 'LETTER_REVEALED' ||
    state === 'LETTER_OPENED' ||
    state === 'HUNT_REQUESTED' ||
    state === 'OUTGOING_BLUR' ||
    state === 'INCOMING_COLLEGE_REVEAL' ||
    state === 'PORTAL_IGNITION' ||
    state === 'SCENE_CONTRACTING' ||
    state === 'PARTICLES_FORMING';

  // Subtle wing flapping oscillation
  const wingAngle = Math.sin(flapPhase) * 16; // -16 to +16 degrees
  const wingScaleY = 1 + Math.sin(flapPhase) * 0.1;

  const isHoveringAtPedestal = state === 'LETTER_DROPPING' || state === 'LETTER_DROPPED';
  const activeTransform: DoveTransform = isHoveringAtPedestal
    ? {
        x: APPROACH_PATH.p3.x,
        y: APPROACH_PATH.p3.y,
        pitch: 2,
        bank: 0,
        scale: APPROACH_PATH.endScale,
      }
    : doveTransform;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none">
      {/* 1. In-Flight White Dove following Bezier Path */}
      {isFlying && (
        <div
          className="absolute transition-transform duration-75"
          style={{
            left: `${activeTransform.x}%`,
            top: `${activeTransform.y}%`,
            transform: `
              translate(-50%, -50%)
              rotate(${activeTransform.pitch + activeTransform.bank}deg)
              scale(${activeTransform.scale})
            `,
          }}
        >
          {/* Swirling Golden Particle Trail */}
          <div className="absolute -inset-8 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-amber-400/20 blur-md animate-pulse" />
            <div className="absolute w-8 h-8 rounded-full border border-amber-300/40 animate-ping opacity-30" />
            <div className="absolute -left-4 top-1/2 w-1.5 h-1.5 rounded-full bg-yellow-200/90 blur-[0.5px] animate-pulse" />
          </div>

          {/* Flying Dove Body with Animated Wing Flap */}
          <div
            className="relative"
            style={{
              transform: `perspective(400px) rotateX(${wingAngle}deg) scaleY(${wingScaleY})`,
              transformOrigin: '50% 50%',
            }}
          >
            {!flyingImgError ? (
              <img
                src="/assets/round-4/white_dove_flying.png"
                alt="White messenger dove in flight"
                onError={() => setFlyingImgError(true)}
                className="w-44 sm:w-52 h-auto drop-shadow-[0_10px_24px_rgba(255,220,110,0.5)] filter brightness-110"
              />
            ) : (
              /* High-Fidelity SVG Dove Fallback */
              <svg
                viewBox="0 0 160 120"
                role="img"
                aria-label="Flying White Dove with Scroll"
                className="w-44 sm:w-52 h-auto drop-shadow-[0_10px_24px_rgba(255,220,110,0.7)]"
              >
                <title>Flying White Dove with Scroll</title>
                <defs>
                  <linearGradient id="doveWing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="60%" stopColor="#f4ecd8" />
                    <stop offset="100%" stopColor="#d8cbb0" />
                  </linearGradient>
                  <radialGradient id="doveChest" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="80%" stopColor="#e8dfcb" />
                  </radialGradient>
                </defs>
                {/* Left/Back Wing */}
                <path
                  d="M65 48 C45 20, 20 15, 5 32 C18 42, 38 48, 55 52 Z"
                  fill="url(#doveWing)"
                  opacity="0.85"
                />
                {/* Tail Feathers */}
                <path
                  d="M30 65 C15 72, 5 82, 0 95 C15 90, 32 80, 42 72 Z"
                  fill="url(#doveWing)"
                />
                {/* Body & Chest */}
                <ellipse cx="75" cy="58" rx="32" ry="18" fill="url(#doveChest)" transform="rotate(-15 75 58)" />
                {/* Head */}
                <circle cx="106" cy="45" r="11" fill="#ffffff" />
                {/* Eye */}
                <circle cx="110" cy="43" r="1.8" fill="#1a1208" />
                <circle cx="110.6" cy="42.5" r="0.6" fill="#ffffff" />
                {/* Golden Beak */}
                <polygon points="116,45 125,48 116,51" fill="#f59e0b" />
                {/* Right/Fore Wing */}
                <path
                  d="M72 52 C85 10, 115 2, 140 18 C120 28, 98 42, 82 56 Z"
                  fill="url(#doveWing)"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* 2. Peacefully Perched Dove Resting on Right Arch Column Capital */}
      {isPerched && (
        <div
          className="absolute top-[6%] sm:top-[8%] right-[8%] sm:right-[11%] lg:right-[13%] w-24 sm:w-28 lg:w-32 animate-fadeIn transition-transform duration-700"
          style={{ animationDuration: '0.9s' }}
        >
          {/* Breathing & Gentle Ambient Glow */}
          <div className="relative animate-pulse [animation-duration:4.5s] hover:scale-105 transition-transform">
            {/* Soft Sunlit Halo */}
            <div className="absolute -inset-4 rounded-full bg-amber-300/20 blur-lg pointer-events-none" />
            {!perchedImgError ? (
              <img
                src="/assets/round-4/white_dove_perched.png"
                alt="Perched White Dove resting gracefully"
                onError={() => setPerchedImgError(true)}
                className="w-full h-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] filter brightness-105"
              />
            ) : (
              <svg
                viewBox="0 0 100 90"
                role="img"
                aria-label="Perched White Dove"
                className="w-full h-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
              >
                <title>Perched White Dove</title>
                <defs>
                  <linearGradient id="perchedBody" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#e4d9c0" />
                  </linearGradient>
                </defs>
                {/* Tail */}
                <path d="M25 65 C15 78, 8 85, 2 88 C12 80, 22 72, 30 65 Z" fill="#d8cbb0" />
                {/* Perched Body */}
                <ellipse cx="48" cy="50" rx="24" ry="18" fill="url(#perchedBody)" transform="rotate(-20 48 50)" />
                {/* Folded Wing */}
                <path d="M36 42 C48 38, 62 46, 56 62 C46 66, 38 58, 36 42 Z" fill="#ffffff" stroke="#e0d4bc" strokeWidth="0.8" />
                {/* Head */}
                <circle cx="68" cy="34" r="10" fill="#ffffff" />
                <circle cx="71" cy="32" r="1.6" fill="#1a1208" />
                <polygon points="77,34 85,37 77,39" fill="#f59e0b" />
                {/* Golden claws resting */}
                <line x1="42" y1="66" x2="40" y2="72" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
                <line x1="50" y1="67" x2="49" y2="73" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
