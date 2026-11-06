import { PLAYER_HALF_SIZE } from '../../config/constants';
import { getInteractableForState, HUNT1_INTERACTABLE_IDS, HUNT2_INTERACTABLE_IDS, HUNT3_INTERACTABLE_IDS, INTERACTABLES, isHunt3InteractableAvailable } from '../../config/interactables';
import type { Door, GameState, Timeline } from '../../types';
import { isDoorOpen } from '../world/doors';
import { DOORS, WALKABLE_RECTS, pointInRect } from '../world/geometry';

export type MoveCheck = { kind: 'free' } | { kind: 'wall' } | { kind: 'door'; door: Door };

function overlapsPlayer(x: number, y: number, rect: { x: number; y: number; w: number; h: number }): boolean {
  const h = PLAYER_HALF_SIZE;
  return x + h > rect.x && x - h < rect.x + rect.w && y + h > rect.y && y - h < rect.y + rect.h;
}

/** Checks the four corners of the player's box at a candidate position. */
export function checkPosition(
  state: GameState,
  x: number,
  y: number,
  timeline: Timeline,
): MoveCheck {
  const h = PLAYER_HALF_SIZE;
  const corners: ReadonlyArray<readonly [number, number]> = [
    [x - h, y - h],
    [x + h, y - h],
    [x - h, y + h],
    [x + h, y + h],
  ];
  for (const door of DOORS) {
    if (!isDoorOpen(state, door, timeline) && overlapsPlayer(x, y, door.blocker)) {
      return { kind: 'door', door };
    }
  }
  for (const object of INTERACTABLES) {
    if (state.huntIndex !== 0 && HUNT1_INTERACTABLE_IDS.has(object.id)) continue;
    if (state.huntIndex !== 1 && HUNT2_INTERACTABLE_IDS.has(object.id)) continue;
    if (state.huntIndex !== 2 && HUNT3_INTERACTABLE_IDS.has(object.id)) continue;
    if (state.huntIndex === 2 && HUNT3_INTERACTABLE_IDS.has(object.id) && !isHunt3InteractableAvailable(object.id, state.hunt3Stage)) continue;
    if ((state.hunt2HiddenInteractablesUntil?.[object.id] ?? 0) > state.time) continue;
    if (state.hunt2ObjectStates?.[object.id] === 'hidden') continue;
    if (object.id === 'trueMemoryAnchor' && !state.hunt2Subtasks?.trueAnchorActivated) continue;
    const currentObject = getInteractableForState(object, state);
    if (currentObject.timeline === timeline && currentObject.collision && overlapsPlayer(x, y, currentObject.collision)) {
      return { kind: 'wall' };
    }
  }
  for (const [px, py] of corners) {
    if (!WALKABLE_RECTS.some((r) => pointInRect(px, py, r))) return { kind: 'wall' };
  }
  return { kind: 'free' };
}
