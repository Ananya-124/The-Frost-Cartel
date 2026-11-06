import type { PlayerIndex } from '../types';

export interface PlayerControls {
  left: string;
  right: string;
  up: string;
  down: string;
  /** Search / use / mark. */
  act: string;
  journal: string;
  /** Four puzzle panel buttons. */
  panelKeys: readonly [string, string, string, string];
}

/** Keyboard codes (KeyboardEvent.code). */
export const CONTROLS: Record<PlayerIndex, PlayerControls> = {
  0: {
    left: 'KeyA',
    right: 'KeyD',
    up: 'KeyW',
    down: 'KeyS',
    act: 'KeyE',
    journal: 'KeyQ',
    panelKeys: ['Digit1', 'Digit2', 'Digit3', 'Digit4'],
  },
  1: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    up: 'ArrowUp',
    down: 'ArrowDown',
    act: 'Enter',
    journal: 'KeyP',
    panelKeys: ['Digit7', 'Digit8', 'Digit9', 'Digit0'],
  },
};

/** Card hotkeys shared by both players, in card order. */
export const CARD_KEYS: readonly string[] = ['KeyZ', 'KeyX', 'KeyC', 'KeyV'];
export const CLOSE_PANEL_KEY = 'Escape';
