import { useEffect, useState } from 'react';

/**
 * Strict Fullscreen Utility for The Frost Cartel.
 *
 * User Requirement:
 * - As soon as they enter the web link, the website enters Full Screen mode.
 * - The option for window is disabled/removed; the website stays strictly in Full Screen mode.
 * - If user gestures exit fullscreen (such as native Escape key), the next interaction immediately
 *   restores Full Screen mode.
 */

interface VendorDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface VendorHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export function isFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as VendorDocument;
  return Boolean(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

export async function enterFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  if (isFullscreen()) return true;

  const elem = document.documentElement as VendorHTMLElement;
  try {
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
      return true;
    } else if (elem.webkitRequestFullscreen) {
      await elem.webkitRequestFullscreen();
      return true;
    } else if (elem.mozRequestFullScreen) {
      await elem.mozRequestFullScreen();
      return true;
    } else if (elem.msRequestFullscreen) {
      await elem.msRequestFullscreen();
      return true;
    }
  } catch (err) {
    // Browsers reject programmatic fullscreen if invoked before an active user gesture.
    // The interaction listeners in initAutoFullscreen will invoke enterFullscreen on first interaction.
    console.debug('[Fullscreen] Fullscreen deferred until user gesture:', err);
  }
  return false;
}

/**
 * Continuous strict fullscreen enforcement:
 * 1. Tries to enter fullscreen immediately when entering the link.
 * 2. Captures any user interaction (click, touch, pointer, keydown) to immediately enter fullscreen.
 * 3. Listens for fullscreenchange; if the screen is ever windowed, re-attaches interaction triggers
 *    so any subsequent interaction immediately returns to fullscreen.
 */
export function initAutoFullscreen(): () => void {
  if (typeof window === 'undefined') return () => undefined;

  // 1. Attempt immediate fullscreen on link entry
  void enterFullscreen();

  let listenersAttached = false;
  const interactionEvents: Array<keyof WindowEventMap> = ['click', 'pointerdown', 'touchstart', 'keydown'];

  const handleInteraction = () => {
    if (!isFullscreen()) {
      void enterFullscreen();
    }
  };

  const attachInteractionListeners = () => {
    if (listenersAttached) return;
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleInteraction, { capture: true, passive: true });
    });
    listenersAttached = true;
  };

  const detachInteractionListeners = () => {
    if (!listenersAttached) return;
    interactionEvents.forEach((eventName) => {
      window.removeEventListener(eventName, handleInteraction, { capture: true });
    });
    listenersAttached = false;
  };

  // Initially attach interaction listeners
  attachInteractionListeners();

  // Listen to fullscreen changes across vendor prefixes
  const handleFsChange = () => {
    if (!isFullscreen()) {
      // Re-arm interaction listeners so any user tap/click/key restores fullscreen
      attachInteractionListeners();
    } else {
      // Keep listeners active to ensure persistent adherence
    }
  };

  const fsEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
  fsEvents.forEach((ev) => document.addEventListener(ev, handleFsChange));

  return () => {
    detachInteractionListeners();
    fsEvents.forEach((ev) => document.removeEventListener(ev, handleFsChange));
  };
}

/**
 * React hook to observe fullscreen state.
 */
export function useFullscreen() {
  const [active, setActive] = useState(() => isFullscreen());

  useEffect(() => {
    const handleFsChange = () => {
      setActive(isFullscreen());
    };

    const fsEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    fsEvents.forEach((ev) => document.addEventListener(ev, handleFsChange));

    return () => {
      fsEvents.forEach((ev) => document.removeEventListener(ev, handleFsChange));
    };
  }, []);

  return {
    isFullscreen: active,
    enterFullscreen,
  };
}
