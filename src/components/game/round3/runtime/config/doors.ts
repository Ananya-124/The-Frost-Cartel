import type { DoorDefinition } from '../types';

/**
 * Door connections. `pastLock` / `futureLock` name the flag that opens the
 * door in each timeline. Geometry is derived in engine/world/geometry.ts.
 */
export const DOOR_DEFINITIONS: readonly DoorDefinition[] = [
  { from: 'rec', to: 'lab', pastLock: null, futureLock: null },
  { from: 'lab', to: 'exam', pastLock: null, futureLock: null },
  { from: 'rec', to: 'gen', pastLock: null, futureLock: null },
  { from: 'lab', to: 'sec', pastLock: null, futureLock: null },
  { from: 'exam', to: 'arch', pastLock: 'key', futureLock: 'arch' },
  { from: 'arch', to: 'sec', pastLock: 'key', futureLock: 'arch' },
  { from: 'sec', to: 'gen', pastLock: null, futureLock: null },
  { from: 'sec', to: 'hall', pastLock: 'badge', futureLock: 'power' },
  { from: 'arch', to: 'dir', pastLock: null, futureLock: null },
  { from: 'dir', to: 'hall', pastLock: null, futureLock: null },
  { from: 'hall', to: 'con', pastLock: null, futureLock: null },
  { from: 'gen', to: 'con', pastLock: null, futureLock: null },
  { from: 'dir', to: 'obs', pastLock: 'shelf', futureLock: 'shelf' },
  { from: 'hall', to: 'exp', pastLock: 'power', futureLock: 'power' },
  { from: 'obs', to: 'exp', pastLock: null, futureLock: null },
];
