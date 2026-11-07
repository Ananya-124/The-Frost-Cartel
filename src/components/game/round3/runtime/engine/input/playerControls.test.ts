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
    const ledger = INTERACTABLES.find((object) => object.id === 'visitorLedger');
    const tracks = INTERACTABLES.find((object) => object.id === 'visitorTracks');
    if (!ledger || !tracks) throw new Error('Visitor investigation fixtures are missing.');
    state.hunt1AvailableInteractables = [ledger.id, tracks.id];
    state.players[0].x = ledger.x + ledger.hitbox.w / 2;
    state.players[0].y = ledger.y + ledger.hitbox.h / 2;
    state.players[1].x = tracks.x + tracks.hitbox.w / 2;
    state.players[1].y = tracks.y + tracks.hitbox.h / 2;
    const context: GameContext = { state, store, scheduler: new Scheduler(), cardEffects: {} };
    const pending = new Promise<void>(() => {});
    const onHunt1Interaction = vi.fn(() => pending);

    handleActionKey(context, new KeyboardEvent('keydown', { code: CONTROLS[0].act }), undefined, onHunt1Interaction);
    handleActionKey(context, new KeyboardEvent('keydown', { code: CONTROLS[1].act }), undefined, onHunt1Interaction);

    expect(onHunt1Interaction).toHaveBeenNthCalledWith(1, 0, expect.objectContaining({ id: 'visitorLedger', timeline: 'past' }));
    expect(onHunt1Interaction).toHaveBeenNthCalledWith(2, 1, expect.objectContaining({ id: 'visitorTracks', timeline: 'future' }));

    state.players[0].x = tracks.x + tracks.hitbox.w / 2;
    state.players[0].y = tracks.y + tracks.hitbox.h / 2;
    state.players[1].x = ledger.x + ledger.hitbox.w / 2;
    state.players[1].y = ledger.y + ledger.hitbox.h / 2;
    handleActionKey(context, new KeyboardEvent('keydown', { code: CONTROLS[0].act }), undefined, onHunt1Interaction);
    handleActionKey(context, new KeyboardEvent('keydown', { code: CONTROLS[1].act }), undefined, onHunt1Interaction);

    expect(onHunt1Interaction).toHaveBeenCalledTimes(2);
  });
});
