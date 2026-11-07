import type { Door, GameState, Timeline } from '../../types';

/** A door is open when it has no lock for the timeline or its flag is set. */
export function isDoorOpen(state: GameState, door: Door, timeline: Timeline): boolean {
  if (state.huntIndex === 0 && door.from === 'dir' && door.to === 'obs') return true;
  const lock = timeline === 'future' ? door.futureLock : door.pastLock;
  return !lock || !!state.flags[lock];
}
