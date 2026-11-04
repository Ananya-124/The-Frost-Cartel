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
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Approach Flight (DOVE_ENTERING & DOVE_FLYING)
  useEffect(() => {
    if (state !== 'DOVE_ENTERING' && state !== 'DOVE_FLYING') return;

    if (!isMuted) {
      soundController.playDoveFlutter();
    }

    const duration = 2800; // 2.8s smooth curved flight
    startTimeRef.current = null;

    const animateFlight = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const rawT = Math.min(1, elapsed / duration);

      // Smooth ease-in-out progress
      const t = rawT < 0.5 ? 2 * rawT * rawT : -1 + (4 - 2 * rawT) * rawT;

      const transform = getDoveTransform(
        APPROACH_PATH.p0,
        APPROACH_PATH.p1,
        APPROACH_PATH.p2,
        APPROACH_PATH.p3,
        t,
        APPROACH_PATH.startScale,
        APPROACH_PATH.endScale,
        APPROACH_PATH.minPitch,
        APPROACH_PATH.maxPitch
      );

      setDoveTransform(transform);
      // Gentle wing flapping frequency slows into flare as bird arrives at pedestal
      const flapRate = 0.02 * (1 - rawT * 0.35);
      setFlapPhase(elapsed * flapRate);

      if (rawT < 1) {
        animFrameRef.current = requestAnimationFrame(animateFlight);
      } else {
        // Reached pedestal release point
        onLetterDrop();
      }
    };

    animFrameRef.current = requestAnimationFrame(animateFlight);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, onLetterDrop, isMuted]);

  // Departure & Perch Flight (DOVE_LANDING)
  useEffect(() => {
    if (state !== 'DOVE_LANDING') return;

    if (!isMuted) {
      soundController.playDoveFlutter();
    }

    const duration = 1800; // 1.8s ascent to right arch column
    startTimeRef.current = null;

    const animatePerch = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const rawT = Math.min(1, elapsed / duration);

      // Smooth deceleration ease-out
      const t = 1 - Math.pow(1 - rawT, 2.5);

      const transform = getDoveTransform(
        PERCH_PATH.p0,
        PERCH_PATH.p1,
        PERCH_PATH.p2,
        PERCH_PATH.p3,
        t,
        PERCH_PATH.startScale,
        PERCH_PATH.endScale,
        PERCH_PATH.minPitch,
        PERCH_PATH.maxPitch
      );

      setDoveTransform(transform);
      // Wing flapping gradually slows down as bird prepares to perch
      const flapFrequency = 0.022 * (1 - rawT * 0.7);
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

  // If in initial idle state, bird is not yet visible in courtyard
  if (state === 'ENVIRONMENT_IDLE') {
    return null;
  }

  const isFlying = state === 'DOVE_ENTERING' || state === 'DOVE_FLYING' || state === 'DOVE_LANDING';
  const isPerched =
    state === 'LETTER_AVAILABLE' ||
    state === 'LETTER_OPENING' ||
    state === 'LETTER_REVEALED' ||
    state === 'PORTAL_IGNITION' ||
    state === 'SCENE_CONTRACTING' ||
    state === 'PARTICLES_FORMING';

  // Calculate subtle, natural wing flapping oscillation
  const wingAngle = Math.sin(flapPhase) * 18; // -18 to +18 degrees
  const wingScaleY = 1 + Math.sin(flapPhase) * 0.12;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none">
      {/* 1. In-Flight White Dove following Bezier Path */}
      {isFlying && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
          style={{
            left: `${doveTransform.x}%`,
            top: `${doveTransform.y}%`,
            transform: `
              translate(-50%, -50%)
              rotate(${doveTransform.pitch + doveTransform.bank}deg)
              scale(${doveTransform.scale})
            `,
          }}
        >
          {/* Swirling Golden Particle Trail */}
          <div className="absolute -inset-8 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-amber-400/20 blur-md animate-pulse" />
            <div className="absolute w-8 h-8 rounded-full border border-amber-300/40 animate-ping opacity-30" />
            <div className="absolute -left-4 top-1/2 w-1.5 h-1.5 rounded-full bg-yellow-200/90 blur-[0.5px] animate-pulse" />
          </div>

          {/* Flying Dove Body with Animated Wing Flap (Sprite carries sealed scroll in talons) */}
          <div
            className="relative"
            style={{
              transform: `perspective(400px) rotateX(${wingAngle}deg) scaleY(${wingScaleY})`,
              transformOrigin: '50% 50%',
            }}
          >
            <img
              src="/assets/round-4/white_dove_flying.png"
              alt="White messenger dove in flight"
              className="w-44 sm:w-52 h-auto drop-shadow-[0_10px_24px_rgba(255,220,110,0.5)] filter brightness-110"
            />
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
            <img
              src="/assets/round-4/white_dove_perched.png"
              alt="Perched White Dove resting gracefully"
              className="w-full h-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] filter brightness-105"
            />
          </div>
        </div>
      )}
    </div>
  );
};
