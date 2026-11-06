import { playTone } from '../../audio/sound';
import { CAPTURE_FREEZE, NEXT_HUNT_DELAY_MS } from '../../config/constants';
import {
  PERFECT_SYNC_WINDOW,
  SCORE,
  SYNC_WINDOW,
  SYNC_WINDOW_WIDE,
} from '../../config/scoring';
import type { GameState } from '../../types';
import type { GameContext } from '../context';
import { triggerSurge } from '../events/disturbances';
import { advanceHunt } from '../hunts/huntManager';
import { addScore } from '../scoring/scoring';
import { announce } from '../state/messages';

function failSync(state: GameState): void {
  addScore(state, SCORE.failedSync, 'failed synchronization');
  triggerSurge(state);
  announce(state, 'Out of sync! The binding shatters and the entity lashes out.');
}

function disarm(state: GameState): void {
  state.players[0].syncArmedAt = null;
  state.players[1].syncArmedAt = null;
}

/** Resolves the synchronized capture once both players have armed, or one has waited too long. */
export function resolveSync(ctx: GameContext): void {
  const { state } = ctx;
  const window_ = state.chronoSandTimer > 0 ? SYNC_WINDOW_WIDE : SYNC_WINDOW;
  const a = state.players[0].syncArmedAt;
  const b = state.players[1].syncArmedAt;

  if (a !== null && b !== null) {
    const gap = Math.abs(a - b);
    disarm(state);
    if (gap <= window_) {
      const perfect = gap <= PERFECT_SYNC_WINDOW;
      addScore(state, SCORE.capture, 'capture', `cap${state.huntIndex}`);
      if (perfect) addScore(state, SCORE.perfectSync, 'perfect sync', `sy${state.huntIndex}`);
      state.captures++;
      const real = state.entities.find((e) => e.real);
      if (real) real.gone = true;
      state.freezeTimer = CAPTURE_FREEZE;
      playTone(880, 0.8, 'triangle', 0.1);
      announce(
        state,
        perfect ? 'PERFECT SYNCHRONIZATION. The entity is bound.' : 'The entity is captured.',
      );
      ctx.scheduler.after(NEXT_HUNT_DELAY_MS, () => advanceHunt(ctx));
    } else {
      failSync(state);
    }
    return;
  }

  for (const player of state.players) {
    if (player.syncArmedAt !== null && state.time - player.syncArmedAt > window_) {
      disarm(state);
      failSync(state);
    }
  }
}
