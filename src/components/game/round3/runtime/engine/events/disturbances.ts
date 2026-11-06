import { playTone } from '../../audio/sound';
import { SURGE_DURATION } from '../../config/scoring';
import type { GameState, PlayerIndex } from '../../types';
import { randomInt } from '../../utils/math';
import { announce, showMessage } from '../state/messages';

/** A penalty surge: the real entity rushes the Tracker and the screens distort. */
export function triggerSurge(state: GameState): void {
  state.surgeTimer = SURGE_DURATION;
  state.distortion = 1.1;
  playTone(60, 0.7, 'sawtooth', 0.1);
}

/** Random scare event. */
export function triggerDisturbance(state: GameState): void {
  const kind = randomInt(4);
  state.apparitions = state.apparitions.filter((a) => state.time - a.t < 4);
  if (kind === 0) {
    state.brownout = 1.4;
    playTone(45, 1.2, 'sawtooth', 0.08);
    announce(state, 'The lights die…');
  } else if (kind === 1) {
    const index = randomInt(2) as PlayerIndex;
    const p = state.players[index];
    const angle = Math.random() * 6.28;
    state.apparitions.push({
      playerIndex: index,
      x: p.x + Math.cos(angle) * 230,
      y: p.y + Math.sin(angle) * 230,
      t: state.time,
    });
    playTone(300, 0.6, 'sine', 0.03);
  } else if (kind === 2) {
    state.distortion = 0.9;
    playTone(90, 0.5, 'square', 0.06);
    showMessage(state, randomInt(2) as PlayerIndex, 'A door slams somewhere in the dark.', 2500);
  } else {
    showMessage(state, randomInt(2) as PlayerIndex, 'Something whispers behind you.', 2500);
    playTone(180 + randomInt(80), 0.8, 'triangle', 0.04);
    state.distortion = 0.4;
  }
}
