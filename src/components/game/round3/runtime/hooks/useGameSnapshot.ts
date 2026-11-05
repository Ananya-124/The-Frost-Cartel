import { useSyncExternalStore } from 'react';
import type { GameStore } from '../engine/state/store';
import type { UiSnapshot } from '../engine/state/snapshot';

/** Subscribes a component to the game's published snapshots. */
export function useGameSnapshot(store: GameStore): UiSnapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
