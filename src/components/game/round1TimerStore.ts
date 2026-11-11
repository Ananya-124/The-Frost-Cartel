import { useState, useSyncExternalStore } from 'react';

export interface Round1TimerStore {
  getSnapshot: () => number;
  subscribe: (listener: () => void) => () => void;
  setSeconds: (seconds: number) => void;
}

const standaloneTimerStore = createRound1TimerStore(25 * 60);

export function createRound1TimerStore(initialSeconds = 0): Round1TimerStore {
  let seconds = initialSeconds;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => seconds,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    setSeconds: (next) => {
      const normalized = Math.max(0, Math.floor(next));
      if (normalized === seconds) return;
      seconds = normalized;
      for (const listener of listeners) listener();
    },
  };
}

export function useRound1TimerSeconds(store: Round1TimerStore = standaloneTimerStore): number {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/** Keeps standalone stage rendering compatible while the dashboard owns the live store. */
export function useRound1TimerStore(store: Round1TimerStore | undefined, initialSeconds = 25 * 60): Round1TimerStore {
  const [fallback] = useState(() => createRound1TimerStore(initialSeconds));
  return store ?? fallback;
}
