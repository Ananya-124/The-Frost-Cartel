import { playTone } from '../../audio/sound';
import { CONTROLS } from '../../config/controls';
import {
  DIAGONAL_FACTOR,
  DOOR_MESSAGE_COOLDOWN,
  FOOTSTEP_INTERVAL,
  PLAYER_SPEED,
} from '../../config/constants';
import { DOOR_LOCK_MESSAGES } from '../../config/messages';
import type { GameState, PlayerIndex } from '../../types';
import { randomInt } from '../../utils/math';
import type { InputManager } from '../input/InputManager';
import { showMessage } from '../state/messages';
import { checkPosition } from './collision';

/** Moves both players from held keys, with per-axis collision. */
export function updatePlayers(state: GameState, input: InputManager, dt: number): void {
  for (const index of [0, 1] as const) {
    if (state.puzzles[index]) continue;
    movePlayer(state, input, index, dt);
  }
}

function movePlayer(state: GameState, input: InputManager, index: PlayerIndex, dt: number): void {
  const player = state.players[index];
  const keys = CONTROLS[index];
  let dx = (input.isDown(keys.right) ? 1 : 0) - (input.isDown(keys.left) ? 1 : 0);
  let dy = (input.isDown(keys.down) ? 1 : 0) - (input.isDown(keys.up) ? 1 : 0);
  if (dx && dy) {
    dx *= DIAGONAL_FACTOR;
    dy *= DIAGONAL_FACTOR;
  }
  const step = PLAYER_SPEED * dt;

  for (const [ax, ay] of [
    [dx * step, 0],
    [0, dy * step],
  ] as const) {
    if (!ax && !ay) continue;
    const result = checkPosition(state, player.x + ax, player.y + ay, player.timeline);
    if (result.kind === 'free') {
      player.x += ax;
      player.y += ay;
    } else if (result.kind === 'door' && state.time > player.doorMessageUntil) {
      player.doorMessageUntil = state.time + DOOR_MESSAGE_COOLDOWN;
      const lock = player.timeline === 'future' ? result.door.futureLock : result.door.pastLock;
      if (lock) showMessage(state, index, DOOR_LOCK_MESSAGES[lock]);
      playTone(110, 0.15, 'square');
    }
  }

  if (dx || dy) {
    state.footstepTimer += dt;
    if (state.footstepTimer > FOOTSTEP_INTERVAL) {
      state.footstepTimer = 0;
      playTone(70 + randomInt(20), 0.05, 'square', 0.02);
    }
  }
}
