import { describe, expect, it } from 'vitest';
import { createInitialState } from './state/createInitialState';
import { updatePlayers } from './physics/movement';
import { checkPosition } from './physics/collision';
import { HUNT1_INTERACTABLE_IDS, HUNT2_INTERACTABLE_IDS, HUNT3_INTERACTABLE_IDS, INTERACTABLES, isHunt3InteractableAvailable } from '../config/interactables';
import { findNearTarget } from './interaction/nearby';
import type { InputManager } from './input/InputManager';
import { DOORS } from './world/geometry';
import { ROOM_BY_ID } from '../config/rooms';
import { PLAYER_HALF_SIZE } from '../config/constants';

function inputWith(...keys: string[]): InputManager {
  const held = new Set(keys);
  return { isDown: (code: string) => held.has(code) } as InputManager;
}

function solidObjectsAt(state: ReturnType<typeof createInitialState>, x: number, y: number, timeline: 'past' | 'future'): string[] {
  const h = PLAYER_HALF_SIZE;
  return INTERACTABLES.filter((object) => {
    if (state.huntIndex !== 0 && HUNT1_INTERACTABLE_IDS.has(object.id)) return false;
    if (state.huntIndex !== 1 && HUNT2_INTERACTABLE_IDS.has(object.id)) return false;
    if (state.huntIndex !== 2 && HUNT3_INTERACTABLE_IDS.has(object.id)) return false;
    if (state.huntIndex === 2 && HUNT3_INTERACTABLE_IDS.has(object.id) && !isHunt3InteractableAvailable(object.id, state.hunt3Stage)) return false;
    if (object.timeline !== timeline || !object.collision) return false;
    const box = object.collision;
    return !!box && x + h > box.x && x - h < box.x + box.w && y + h > box.y && y - h < box.y + box.h;
  }).map((object) => object.id);
}

describe('Round 3 movement integration', () => {
  it('moves both investigators using their existing, separate controls', () => {
    const state = createInitialState('Movement verification');
    const [archivist, tracker] = state.players;
    const initial = state.players.map(({ x, y }) => ({ x, y }));

    updatePlayers(state, inputWith('KeyD', 'ArrowUp'), 0.1);

    expect(archivist.x).toBeGreaterThan(initial[0].x);
    expect(archivist.y).toBe(initial[0].y);
    expect(tracker.x).toBe(initial[1].x);
    expect(tracker.y).toBeLessThan(initial[1].y);
  });

  it('keeps movement inside the existing room collision geometry', () => {
    const state = createInitialState('Collision verification');
    const archivist = state.players[0];

    expect(checkPosition(state, archivist.x - 500, archivist.y, 'past')).toEqual({ kind: 'wall' });
    expect(checkPosition(state, archivist.x, archivist.y, 'past')).toEqual({ kind: 'free' });
  });

  it('connects adjacent rooms through traversable corridors and keeps locked thresholds solid', () => {
    const state = createInitialState('Corridor verification');
    const openCorridor = DOORS.find((door) => door.from === 'rec' && door.to === 'lab');
    const lockedCorridor = DOORS.find((door) => door.from === 'exam' && door.to === 'arch');
    if (!openCorridor || !lockedCorridor) throw new Error('Expected corridor fixtures are missing.');

    const openPoint = {
      x: openCorridor.connector.x + openCorridor.connector.w / 2,
      y: openCorridor.connector.y + openCorridor.connector.h / 2,
    };
    const lockedPoint = {
      x: lockedCorridor.connector.x + lockedCorridor.connector.w / 2,
      y: lockedCorridor.connector.y + lockedCorridor.connector.h / 2,
    };
    expect(checkPosition(state, openPoint.x, openPoint.y, 'past')).toEqual({ kind: 'free' });
    expect(checkPosition(state, lockedPoint.x, lockedPoint.y, 'past').kind).toBe('door');
  });

  it('keeps the Observation Chamber accessible during Hunt I and gated in Hunt II', () => {
    const state = createInitialState('Observation access verification');
    const door = DOORS.find((candidate) => candidate.from === 'dir' && candidate.to === 'obs');
    if (!door) throw new Error("Expected Director's Office to Observation Chamber passage.");
    const point = {
      x: door.connector.x + door.connector.w / 2,
      y: door.connector.y + door.connector.h / 2,
    };

    expect(checkPosition(state, point.x, point.y, 'past')).toEqual({ kind: 'free' });
    expect(checkPosition(state, point.x, point.y, 'future')).toEqual({ kind: 'free' });

    state.huntIndex = 1;
    expect(checkPosition(state, point.x, point.y, 'past').kind).toBe('door');
    expect(checkPosition(state, point.x, point.y, 'future').kind).toBe('door');
    state.flags.shelf = true;
    expect(checkPosition(state, point.x, point.y, 'past')).toEqual({ kind: 'free' });
    expect(checkPosition(state, point.x, point.y, 'future')).toEqual({ kind: 'free' });
  });

  it('allows traversal through every unlocked room connection in both timelines', () => {
    const state = createInitialState('All corridors verification');
    for (const flag of ['key', 'fuse', 'drawer', 'arch', 'power', 'badge', 'shelf', 'tape', 'anchor', 'pastVerified', 'futureVerified', 'pastNodeReady', 'futureNodeReady'] as const) {
      state.flags[flag] = true;
    }

    for (const door of DOORS) {
      const horizontal = door.horizontal;
      const start = horizontal
        ? { x: door.connector.x - PLAYER_HALF_SIZE - 2, y: door.connector.y + door.connector.h / 2 }
        : { x: door.connector.x + door.connector.w / 2, y: door.connector.y - PLAYER_HALF_SIZE - 2 };
      const end = horizontal
        ? { x: door.connector.x + door.connector.w + PLAYER_HALF_SIZE + 2, y: start.y }
        : { x: start.x, y: door.connector.y + door.connector.h + PLAYER_HALF_SIZE + 2 };

      for (const timeline of ['past', 'future'] as const) {
        for (let progress = 0; progress <= 1; progress += 0.02) {
          const x = start.x + (end.x - start.x) * progress;
          const y = start.y + (end.y - start.y) * progress;
          expect(checkPosition(state, x, y, timeline), `${door.from} → ${door.to} (${timeline}) at ${x},${y}`).toEqual({ kind: 'free' });
        }
      }
    }
  });

  it('walks players through every room connection without cross-timeline collision', () => {
    for (const door of DOORS) {
      const from = ROOM_BY_ID[door.from];
      const to = ROOM_BY_ID[door.to];
      const direction = door.horizontal
        ? (from.gx < to.gx ? 'right' : 'left')
        : (from.gy < to.gy ? 'down' : 'up');
      const start = door.horizontal
        ? {
          x: direction === 'right' ? door.connector.x - 30 : door.connector.x + door.connector.w + 30,
          y: door.connector.y + door.connector.h / 2,
        }
        : {
          x: door.connector.x + door.connector.w / 2,
          y: direction === 'down' ? door.connector.y - 30 : door.connector.y + door.connector.h + 30,
        };
      const target = door.horizontal
        ? {
          x: direction === 'right' ? door.connector.x + door.connector.w + 30 : door.connector.x - 30,
          y: start.y,
        }
        : {
          x: start.x,
          y: direction === 'down' ? door.connector.y + door.connector.h + 30 : door.connector.y - 30,
        };
      const targetCoordinate = door.horizontal ? target.x : target.y;

      for (const huntIndex of [0, 1, 2] as const) {
        const huntStages = huntIndex === 2 ? [1, 2, 3, 4] : [undefined];
        for (const huntStage of huntStages) {
          for (const [timeline, playerIndex] of [['past', 0], ['future', 1]] as const) {
            const state = createInitialState(`Traverse ${door.from}-${door.to}`);
            state.huntIndex = huntIndex;
            state.hunt3Stage = huntStage;
            for (const flag of ['key', 'fuse', 'drawer', 'arch', 'power', 'badge', 'shelf', 'tape', 'anchor', 'pastVerified', 'futureVerified', 'pastNodeReady', 'futureNodeReady'] as const) {
              state.flags[flag] = true;
            }
            const activePlayer = state.players[playerIndex];
            activePlayer.x = start.x;
            activePlayer.y = start.y;
            const passageState = `Hunt ${huntIndex + 1}${huntStage ? ` stage ${huntStage}` : ''}`;
            expect(checkPosition(state, start.x, start.y, timeline).kind, `${door.from} → ${door.to} (${timeline}, ${passageState}) should start inside the room`).toBe('free');
            const prefix = playerIndex === 0 ? 'Key' : 'Arrow';
            const key = direction === 'right' ? `${prefix}${playerIndex === 0 ? 'D' : 'Right'}`
              : direction === 'left' ? `${prefix}${playerIndex === 0 ? 'A' : 'Left'}`
                : direction === 'down' ? `${prefix}${playerIndex === 0 ? 'S' : 'Down'}`
                  : `${prefix}${playerIndex === 0 ? 'W' : 'Up'}`;
            const reachedTarget = () => direction === 'right' || direction === 'down'
              ? (door.horizontal ? activePlayer.x : activePlayer.y) >= targetCoordinate - 1
              : (door.horizontal ? activePlayer.x : activePlayer.y) <= targetCoordinate + 1;
            for (let frame = 0; frame < 60 && !reachedTarget(); frame++) {
              updatePlayers(state, inputWith(key), 0.05);
            }

            expect(reachedTarget(), `${door.from} → ${door.to} (${timeline}, ${passageState}) should be traversable; stopped at ${activePlayer.x},${activePlayer.y}; props=${solidObjectsAt(state, activePlayer.x + (direction === 'right' ? 7.5 : direction === 'left' ? -7.5 : 0), activePlayer.y + (direction === 'down' ? 7.5 : direction === 'up' ? -7.5 : 0), timeline).join(',')}`).toBe(true);
          }
        }
      }
    }
  });

  it('blocks locked doorways in each locked timeline and opens them when its own flag is set', () => {
    for (const door of DOORS.filter((candidate) => candidate.pastLock || candidate.futureLock)) {
      for (const [timeline, lock] of [['past', door.pastLock], ['future', door.futureLock]] as const) {
        const state = createInitialState(`Door lock ${door.from}-${door.to}`);
        state.huntIndex = 1;
        const point = {
          x: door.connector.x + door.connector.w / 2,
          y: door.connector.y + door.connector.h / 2,
        };
        if (lock) {
          expect(checkPosition(state, point.x, point.y, timeline).kind, `${door.from} → ${door.to} stays locked in ${timeline}`).toBe('door');
          state.flags[lock] = true;
          expect(checkPosition(state, point.x, point.y, timeline), `${door.from} → ${door.to} opens in ${timeline}`).toEqual({ kind: 'free' });
        } else {
          expect(checkPosition(state, point.x, point.y, timeline), `${door.from} → ${door.to} is open in ${timeline}`).toEqual({ kind: 'free' });
        }
      }
    }
  });

  it('does not let one timeline’s blocked movement interfere with the other player', () => {
    const state = createInitialState('Independent collision verification');
    const lockedDoor = DOORS.find((door) => door.pastLock && door.futureLock);
    if (!lockedDoor) throw new Error('Expected a door locked in both timelines.');

    const blocker = lockedDoor.blocker;
    const archivist = state.players[0];
    const tracker = state.players[1];
    archivist.x = blocker.x + blocker.w / 2;
    archivist.y = blocker.y + blocker.h / 2;
    tracker.x = ROOM_BY_ID.rec.x + 150;
    tracker.y = ROOM_BY_ID.rec.y + 150;
    const trackerStart = { x: tracker.x, y: tracker.y };

    updatePlayers(state, inputWith('ArrowRight'), 0.1);

    expect(archivist.x).toBe(blocker.x + blocker.w / 2);
    expect(tracker.x).toBeGreaterThan(trackerStart.x);
    expect(tracker.y).toBe(trackerStart.y);
  });

  it('gives interactive props separate hitboxes and solid movement boundaries', () => {
    const state = createInitialState('Object layer verification');
    const desk = INTERACTABLES.find((object) => object.id === 'desk' && object.timeline === 'past');
    if (!desk) throw new Error('Reception desk fixture is missing.');

    expect(checkPosition(state, desk.x, desk.y - desk.hitbox.h / 2, 'past')).toEqual({ kind: 'wall' });
    state.players[0].x = desk.x;
    state.players[0].y = desk.y + 30;
    expect(findNearTarget(state, 0)?.kind).toBe('object');
  });
});
