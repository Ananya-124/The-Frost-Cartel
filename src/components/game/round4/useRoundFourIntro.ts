import { useState, useEffect, useRef, useCallback } from 'react';
import type { Round4IntroState } from '../../../types/round4.types';
import { soundController } from '../../../utils/soundController';

export interface UseRoundFourIntroOptions {
  initialState?: Round4IntroState;
  onExit?: () => void;
  onProceedToFloors?: (floorId: string) => void;
}

export function useRoundFourIntro(options: UseRoundFourIntroOptions = {}) {
  const { initialState = 'INITIAL_REVEAL' } = options;

  const [state, setState] = useState<Round4IntroState>(() => {
    if (initialState === 'ENVIRONMENT_IDLE') return 'INITIAL_REVEAL';
    return initialState;
  });

  const [isMuted, setIsMuted] = useState(() => soundController.isMuted());
  const [initialFocused, setInitialFocused] = useState(() => {
    // If mounted with an advanced state, start already focused
    return (
      initialState !== 'INITIAL_REVEAL' &&
      initialState !== 'ENVIRONMENT_IDLE'
    );
  });

  // Track if prefers-reduced-motion is active
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const timersRef = useRef<number[]>([]);

  const addTimer = useCallback((fn: () => void, delayMs: number) => {
    const id = window.setTimeout(fn, delayMs);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Phase 1: Camera Lens Blur-to-Clear Reveal on Entering Round 4
  useEffect(() => {
    if (state !== 'INITIAL_REVEAL') return;

    // Trigger initial focus transition on next tick
    const frameId = requestAnimationFrame(() => {
      setInitialFocused(true);
    });

    const revealDuration = reducedMotion ? 400 : 1000;
    const pauseBeforeDove = reducedMotion ? 150 : 400; // 300-500ms pause after reveal completes

    // 1. Reveal complete -> INTRO_VISIBLE
    addTimer(() => {
      setState('INTRO_VISIBLE');

      // 2. Wait 300-500ms after reveal completes before dove takes flight
      addTimer(() => {
        setState('DOVE_FLYING');
      }, pauseBeforeDove);
    }, revealDuration);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [state, reducedMotion, addTimer]);

  const handleToggleMute = useCallback(() => {
    const next = soundController.toggleMute();
    setIsMuted(next);
  }, []);

  // Dove arrived directly above stone pedestal: release ancient letter
  const handleLetterDrop = useCallback(() => {
    setState('LETTER_DROPPING');
  }, []);

  // Letter bounced and settled on pedestal: dove ascends to perch
  const handleDropFinished = useCallback(() => {
    setState('DOVE_LANDING');
  }, []);

  // Dove settled peacefully on column capital: letter is available to click
  const handleDovePerched = useCallback(() => {
    setState('LETTER_AVAILABLE');
  }, []);

  // Player clicked the sealed letter on pedestal
  const handleOpenLetter = useCallback(() => {
    setState('LETTER_OPENING');
    addTimer(() => {
      setState('LETTER_REVEALED');
    }, 380);
  }, [addTimer]);

  // Player clicked "BEGIN THE HUNT": initiate Blur-to-Clear Crossfade to College Screen
  const handleBeginHunt = useCallback(() => {
    if (
      state === 'HUNT_REQUESTED' ||
      state === 'OUTGOING_BLUR' ||
      state === 'COLLEGE_REVEAL' ||
      state === 'COLLEGE_READY'
    ) {
      return; // prevent duplicate clicks
    }

    setState('OUTGOING_BLUR');

    const crossfadeDuration = reducedMotion ? 500 : 1400;

    // Crossfade smoothly to College Screen
    addTimer(() => {
      setState('COLLEGE_READY');
    }, crossfadeDuration);
  }, [state, reducedMotion, addTimer]);

  // Replay intro action from college screen
  const handleReplayIntro = useCallback(() => {
    clearAllTimers();
    setInitialFocused(false);
    setState('INITIAL_REVEAL');
  }, [clearAllTimers]);

  return {
    state,
    setState,
    isMuted,
    handleToggleMute,
    initialFocused,
    reducedMotion,
    handleLetterDrop,
    handleDropFinished,
    handleDovePerched,
    handleOpenLetter,
    handleBeginHunt,
    handleReplayIntro,
  };
}

