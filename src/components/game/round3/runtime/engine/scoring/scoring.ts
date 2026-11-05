import { playTone } from '../../audio/sound';
import type { GameState } from '../../types';
import { announce } from '../state/messages';

/**
 * Adds points to the team score. A `key` makes the event one-time only.
 * A Ward Sigil cancels a penalty.
 */
export function addScore(state: GameState, points: number, reason: string, key?: string): void {
  if (key) {
    if (state.completed[key]) return;
    state.completed[key] = true;
  }
  if (points < 0 && state.shields > 0) {
    state.shields--;
    announce(state, `Ward Sigil absorbed ${points} (${reason})`);
    return;
  }
  state.score += points;
  state.huntScores[state.huntIndex] += points;
  if (points < 0) state.penalty += points;
  else state.bonus += points;
  if (points > 0) playTone(660, 0.25, 'triangle');
  state.dirty = true;
}
