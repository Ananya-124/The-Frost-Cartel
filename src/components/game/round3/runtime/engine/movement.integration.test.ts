import { describe, expect, it } from 'vitest';
import { createInitialState } from './state/createInitialState';
import { updatePlayers } from './physics/movement';
import { checkPosition } from './physics/collision';
import { INTERACTABLES } from '../config/interactables';
import { findNearTarget } from './interaction/nearby';
import type { InputManager } from './input/InputManager';
import { DOORS } from './world/geometry';

function inputWith(...keys: string[]): InputManager {
  const held = new Set(keys);
  return { isDown: (code: string) => held.has(code) } as InputManager;
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
