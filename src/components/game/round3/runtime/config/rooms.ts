import type { Room, RoomId } from '../types';
import { ROOM_ORIGIN, ROOM_PITCH, ROOM_SIZE } from './constants';

const ROOM_DEFINITIONS: ReadonlyArray<readonly [RoomId, string, number, number]> = [
  ['exam', 'Patient Examination Room', 0, 0],
  ['arch', 'Archive & Records', 1, 0],
  ['dir', "Director's Office", 2, 0],
  ['obs', 'Observation Chamber', 3, 0],
  ['lab', 'Research Laboratory', 0, 1],
  ['sec', 'Security Control Room', 1, 1],
  ['hall', 'Main Hall', 2, 1],
  ['exp', 'Main Experiment Chamber', 3, 1],
  ['rec', 'Entrance & Reception', 0, 2],
  ['gen', 'Power Generator Room', 1, 2],
  ['con', 'Underground Containment', 2, 2],
];

export const ROOMS: readonly Room[] = ROOM_DEFINITIONS.map(([id, name, gx, gy]) => ({
  id,
  name,
  gx,
  gy,
  x: ROOM_ORIGIN.x + gx * ROOM_PITCH.x,
  y: ROOM_ORIGIN.y + gy * ROOM_PITCH.y,
  w: ROOM_SIZE.w,
  h: ROOM_SIZE.h,
}));

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r])) as Record<RoomId, Room>;
