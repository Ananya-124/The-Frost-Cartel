import type { GameState } from '../../types';
import { createInitialState } from './createInitialState';
import { buildSnapshot, type UiSnapshot } from './snapshot';

/**
 * Holds the shared game state. The engine mutates `state` directly every frame;
 * React only sees immutable snapshots, published through `emit()`.
 */
export class GameStore {
  readonly state: GameState = createInitialState();
  private listeners = new Set<() => void>();
  private snapshot: UiSnapshot = buildSnapshot(this.state);

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): UiSnapshot => this.snapshot;

  /** Publishes a fresh snapshot to React. */
  emit(): void {
    this.state.dirty = false;
    this.snapshot = buildSnapshot(this.state);
    this.listeners.forEach((l) => l());
  }

  /** Replaces the whole state with a new one (new session). */
  replaceState(next: GameState): void {
    Object.assign(this.state, next);
    this.emit();
  }
}
