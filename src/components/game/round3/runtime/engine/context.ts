import type { GameState } from '../types';
import type { CardEffect } from './cards/cardEffects';
import type { GameStore } from './state/store';

/** Delayed callbacks that are cancelled when the engine shuts down. */
export class Scheduler {
  private ids = new Set<number>();

  after(ms: number, fn: () => void): void {
    const id = window.setTimeout(() => {
      this.ids.delete(id);
      fn();
    }, ms);
    this.ids.add(id);
  }

  clear(): void {
    this.ids.forEach((id) => window.clearTimeout(id));
    this.ids.clear();
  }
}

/** Everything a game system needs. Created once per engine. */
export interface GameContext {
  state: GameState;
  store: GameStore;
  scheduler: Scheduler;
  cardEffects: Record<string, CardEffect>;
}
