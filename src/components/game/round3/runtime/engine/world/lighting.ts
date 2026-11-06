import type { GameState, Room, Timeline } from '../../types';

const FUTURE_POWERED_ROOMS = ['hall', 'sec', 'gen', 'con'];

/** Brightness multiplier for a room's lamp. Zero during a brownout. */
export function lampLevel(state: GameState, room: Room, timeline: Timeline): number {
  if (state.brownout > 0) return 0;
  if (timeline === 'future') {
    return state.flags.power && FUTURE_POWERED_ROOMS.includes(room.id) ? 1 : 0.5;
  }
  return state.flags.power ? 1.05 : 0.8;
}
