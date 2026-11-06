import { DOOR_DEFINITIONS } from '../../config/doors';
import { ROOMS, ROOM_BY_ID } from '../../config/rooms';
import type { Door, Rect } from '../../types';

/** Builds door geometry exactly as the original `D` array did. */
function buildDoors(): Door[] {
  return DOOR_DEFINITIONS.map((def) => {
    const a = ROOM_BY_ID[def.from];
    const b = ROOM_BY_ID[def.to];
    let connector: Rect;
    let blocker: Rect;
    if (a.gy === b.gy) {
      const left = a.gx < b.gx ? a : b;
      connector = { x: left.x + 300, y: left.y + 110, w: 100, h: 60 };
      blocker = { x: connector.x + 46, y: connector.y, w: 8, h: 60 };
    } else {
      const upper = a.gy < b.gy ? a : b;
      connector = { x: upper.x + 120, y: upper.y + 280, w: 60, h: 60 };
      blocker = { x: connector.x, y: connector.y + 26, w: 60, h: 8 };
    }
    return { ...def, connector, blocker, horizontal: connector.w > connector.h };
  });
}

export const DOORS: readonly Door[] = buildDoors();

/** Every walkable rectangle: all rooms plus all door corridors. */
export const WALKABLE_RECTS: readonly Rect[] = [...ROOMS, ...DOORS.map((d) => d.connector)];

export const pointInRect = (px: number, py: number, r: Rect): boolean =>
  px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
