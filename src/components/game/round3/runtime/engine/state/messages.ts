import type { GameState, PlayerIndex } from '../../types';

/** Shows a message on one player's screen. */
export function showMessage(state: GameState, index: PlayerIndex, text: string, ms = 4200): void {
  state.messages[index] = text;
  state.messageUntil[index] = state.time + ms / 1000;
  state.dirty = true;
}

/** Shows a message on both screens. */
export function announce(state: GameState, text: string): void {
  showMessage(state, 0, text);
  showMessage(state, 1, text);
}

/** Clears messages whose time has run out. */
export function expireMessages(state: GameState): void {
  for (const i of [0, 1] as const) {
    if (state.messages[i] && state.time >= state.messageUntil[i]) {
      state.messages[i] = '';
      state.dirty = true;
    }
  }
}
