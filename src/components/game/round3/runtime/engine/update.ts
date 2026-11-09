import { playTone } from '../audio/sound';
import { HUD_REFRESH_INTERVAL } from '../config/constants';
import { TIMELINES } from '../config/constants';
import { randomInt } from '../utils/math';
import type { GameContext } from './context';
import { updateEntities } from './entities/entityAI';
import { resolveSync } from './entities/syncCapture';
import { triggerDisturbance } from './events/disturbances';
import type { InputManager } from './input/InputManager';
import { updatePlayers } from './physics/movement';
import { expireMessages } from './state/messages';
import { isDoorOpen } from './world/doors';
import { DOORS } from './world/geometry';

/** One simulation step. Order matches the original `upd`. */
export function updateGame(ctx: GameContext, input: InputManager, dt: number): void {
  const { state } = ctx;
  expireMessages(state);

  if (state.freezeTimer > 0) state.freezeTimer -= dt;
  state.brownout = Math.max(0, state.brownout - dt);
  state.disturbanceTimer -= dt;
  if (state.disturbanceTimer < 0 && state.freezeTimer <= 0) {
    state.disturbanceTimer = 16 + randomInt(20);
    triggerDisturbance(state);
  }
  state.distortion = Math.max(0, state.distortion - dt);
  state.revealTimer = Math.max(0, state.revealTimer - dt);
  state.chronoSandTimer = Math.max(0, state.chronoSandTimer - dt);
  state.syncWindowBonus = Math.max(0, state.syncWindowBonus - dt);
  state.highlightTimer = Math.max(0, state.highlightTimer - dt);
  if (state.highlightTimer === 0) state.highlightedObjectId = null;
  state.surgeTimer = Math.max(0, state.surgeTimer - dt);
  state.contactCooldown -= dt;
  if (state.freezeTimer > 0) return;

  updatePlayers(state, input, dt);

  // Door sounds when a timeline's door opens.
  DOORS.forEach((door, d) => {
    for (const i of [0, 1] as const) {
      const open = isDoorOpen(state, door, TIMELINES[i]);
      const memory = state.doorOpenMemory[i];
      if (memory[d] !== open) {
        memory[d] = open;
        if (open) playTone(150, 0.3, 'sawtooth', 0.04);
      }
    }
  });

  updateEntities(state, dt);
  resolveSync(ctx);

  state.hudTimer -= dt;
  if (state.hudTimer < 0) {
    state.hudTimer = HUD_REFRESH_INTERVAL;
    state.dirty = true;
  }
}
