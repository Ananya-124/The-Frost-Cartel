import { HUNT1_INTERACTABLE_IDS, HUNT2_INTERACTABLE_IDS, HUNT3_INTERACTABLE_IDS, INTERACTABLES, isHunt3InteractableAvailable } from '../../config/interactables';
import { INTERACT_RADIUS, MARK_RADIUS } from '../../config/constants';
import type { Entity, GameState, InteractableObject, PlayerIndex } from '../../types';
import { dist } from '../../utils/math';

export type NearTarget =
  | { kind: 'entity'; text: string; entity: Entity }
  | { kind: 'object'; text: string; object: InteractableObject };

function distanceToHitbox(object: InteractableObject, player: { x: number; y: number }): number {
  const box = object.hitbox;
  const dx = Math.max(box.x - player.x, 0, player.x - (box.x + box.w));
  const dy = Math.max(box.y - player.y, 0, player.y - (box.y + box.h));
  return Math.hypot(dx, dy);
}

/** What the player could act on right now: a manifestation (Tracker) or the closest prop. */
export function findNearTarget(state: GameState, index: PlayerIndex): NearTarget | null {
  const player = state.players[index];
  // Hunt 2 uses Enter to mark entities. In Hunt 3, the Tracker's Enter key
  // must remain available for the staged evidence and containment objects.
  if (index === 1 && state.huntIndex === 1) {
    const entity = state.entities.find((e) => !e.gone && dist(e, player) < MARK_RADIUS);
    if (entity) return { kind: 'entity', text: '[Enter] Mark this manifestation', entity };
  }
  let best: InteractableObject | null = null;
  let bestDist = INTERACT_RADIUS;
  for (const object of INTERACTABLES) {
    if (state.huntIndex === 0 && state.hunt1AvailableInteractables !== undefined && !HUNT1_INTERACTABLE_IDS.has(object.id)) continue;
    if (state.huntIndex !== 0 && HUNT1_INTERACTABLE_IDS.has(object.id)) continue;
    if (state.huntIndex === 0 && HUNT1_INTERACTABLE_IDS.has(object.id)
      && !state.hunt1AvailableInteractables?.includes(object.id)) continue;
    if (state.huntIndex !== 1 && HUNT2_INTERACTABLE_IDS.has(object.id)) continue;
    if (state.huntIndex === 1 && !HUNT2_INTERACTABLE_IDS.has(object.id)) continue;
    if (state.huntIndex !== 2 && HUNT3_INTERACTABLE_IDS.has(object.id)) continue;
    if (state.huntIndex === 2 && !HUNT3_INTERACTABLE_IDS.has(object.id)) continue;
    if (state.huntIndex === 2 && !isHunt3InteractableAvailable(object.id, state.hunt3Stage)) continue;
    if ((state.hunt2HiddenInteractablesUntil?.[object.id] ?? 0) > state.time) continue;
    if (state.hunt2ObjectStates?.[object.id] === 'hidden') continue;
    if (object.id === 'trueMemoryAnchor' && !state.hunt2Subtasks?.trueAnchorActivated) continue;
    if (object.timeline !== player.timeline) continue;
    const d = distanceToHitbox(object, player);
    if (d < bestDist) {
      bestDist = d;
      best = object;
    }
  }
  if (!best) return null;
  const key = index === 1 ? 'Enter' : 'E';
  const verb = best.kind === 'node' ? 'Use' : 'Search';
  return { kind: 'object', object: best, text: `[${key}] ${verb} ${best.name}` };
}
