import { describe, expect, it, vi } from 'vitest';
import { HUNT1_INTERACTABLE_IDS, INTERACTABLES } from '../../config/interactables';
import { GameStore } from '../state/store';
import { Scheduler, type GameContext } from '../context';
import { CONTROLS } from '../../config/controls';
import { findNearTarget } from '../interaction/nearby';
import { handleActionKey } from './playerControls';

describe('Hunt I keyboard interaction dispatch', () => {
  it('uses the prompted key and dispatches the matching ID for every Hunt I prop', () => {
    const store = new GameStore();
    const state = store.state;
    state.phase = 'playing';
    state.huntIndex = 0;
    const context: GameContext = { state, store, scheduler: new Scheduler(), cardEffects: {} };
    const onHunt1Interaction = vi.fn();

    for (const id of HUNT1_INTERACTABLE_IDS) {
      const object = INTERACTABLES.find((candidate) => candidate.id === id);
      if (!object) throw new Error(`Missing Hunt I interactable definition: ${id}`);
      const index = object.timeline === 'past' ? 0 : 1;
      state.hunt1AvailableInteractables = [id];
      state.players[index].x = object.x + object.hitbox.w / 2;
      state.players[index].y = object.y + object.hitbox.h / 2;

      const key = CONTROLS[index].act;
      const target = findNearTarget(state, index);
      expect(target?.kind).toBe('object');
      if (target?.kind !== 'object') throw new Error(`No nearby target detected for Hunt I interactable: ${id}`);
      expect(target.text).toContain(`[${index === 0 ? 'E' : 'Enter'}]`);
      expect(target.object.id).toBe(id);
      handleActionKey(context, new KeyboardEvent('keydown', { code: key }), undefined, onHunt1Interaction);

      expect(onHunt1Interaction).toHaveBeenLastCalledWith(index, expect.objectContaining({ id }));
    }

    expect(onHunt1Interaction).toHaveBeenCalledTimes(HUNT1_INTERACTABLE_IDS.size);
  });

  it('dispatches both local investigators independently and keeps each timeline isolated', () => {
    const store = new GameStore();
    const state = store.state;
    state.phase = 'playing';
    state.huntIndex = 0;
    const generatorLog = INTERACTABLES.find((object) => object.id === 'generatorLog');
    const burntRelay = INTERACTABLES.find((object) => object.id === 'burntRelay');
    if (!generatorLog || !burntRelay) throw new Error('Power Failure investigation fixtures are missing.');
    state.hunt1AvailableInteractables = [generatorLog.id, burntRelay.id];
    state.players[0].x = generatorLog.x + generatorLog.hitbox.w / 2;
    state.players[0].y = generatorLog.y + generatorLog.hitbox.h / 2;
    state.players[1].x = burntRelay.x + burntRelay.hitbox.w / 2;
    state.players[1].y = burntRelay.y + burntRelay.hitbox.h / 2;
    const context: GameContext = { state, store, scheduler: new Scheduler(), cardEffects: {} };
    const pending = new Promise<void>(() => {});
    const onHunt1Interaction = vi.fn(() => pending);

    handleActionKey(context, new KeyboardEvent('keydown', { code: CONTROLS[0].act }), undefined, onHunt1Interaction);
    handleActionKey(context, new KeyboardEvent('keydown', { code: CONTROLS[1].act }), undefined, onHunt1Interaction);

    expect(onHunt1Interaction).toHaveBeenNthCalledWith(1, 0, expect.objectContaining({ id: 'generatorLog', timeline: 'past' }));
    expect(onHunt1Interaction).toHaveBeenNthCalledWith(2, 1, expect.objectContaining({ id: 'burntRelay', timeline: 'future' }));

    state.players[0].x = burntRelay.x + burntRelay.hitbox.w / 2;
    state.players[0].y = burntRelay.y + burntRelay.hitbox.h / 2;
    state.players[1].x = generatorLog.x + generatorLog.hitbox.w / 2;
    state.players[1].y = generatorLog.y + generatorLog.hitbox.h / 2;
    handleActionKey(context, new KeyboardEvent('keydown', { code: CONTROLS[0].act }), undefined, onHunt1Interaction);
    handleActionKey(context, new KeyboardEvent('keydown', { code: CONTROLS[1].act }), undefined, onHunt1Interaction);

    expect(onHunt1Interaction).toHaveBeenCalledTimes(2);
  });
});

describe('player journal hotkeys', () => {
  it.each([
    ['KeyQ', 0],
    ['KeyP', 1],
  ] as const)('%s opens and closes its journal even when a task button has focus', (code, index) => {
    const store = new GameStore();
    const state = store.state;
    state.phase = 'playing';
    state.huntIndex = 2;
    const context: GameContext = { state, store, scheduler: new Scheduler(), cardEffects: {} };
    const focusedButton = document.createElement('button');

    for (const expected of [true, false]) {
      const event = new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: focusedButton });
      handleActionKey(context, event);
      expect(state.journalOpen[index]).toBe(expected);
      expect(event.defaultPrevented).toBe(true);
    }
  });
});

describe('task interaction feedback', () => {
  it.each([
    [0, 'KeyE', 0, 'Hunt I'],
    [1, 'Enter', 1, 'Hunt II'],
    [2, 'KeyE', 0, 'Past task'],
    [2, 'Enter', 1, 'Future task'],
  ] as const)('guides player %s when no task object is nearby', (huntIndex, key, player, message) => {
    const store = new GameStore();
    const state = store.state;
    state.phase = 'playing';
    state.huntIndex = huntIndex;
    state.hunt1AvailableInteractables = [];
    state.hunt3Stage = 1;
    state.players[player].x = -1000;
    state.players[player].y = -1000;
    state.entities = state.entities.map((entity) => ({ ...entity, gone: true }));
    const context: GameContext = { state, store, scheduler: new Scheduler(), cardEffects: {} };
    handleActionKey(context, new KeyboardEvent('keydown', { code: key }), undefined, vi.fn(), vi.fn(), vi.fn());
    expect(state.messages[player]).toContain(message);
    expect(state.dirty).toBe(true);
  });
});
