import { playTone } from '../../audio/sound';
import { ROOM_BY_ID } from '../../config/rooms';
import { SCORE } from '../../config/scoring';
import type { Entity, GameState } from '../../types';
import { triggerSurge } from '../events/disturbances';
import { addScore } from '../scoring/scoring';
import { showMessage } from '../state/messages';

/** The Tracker marks a manifestation: the real one scores, a decoy punishes. */
export function markEntity(state: GameState, entity: Entity): void {
  if (entity.real) {
    if (state.entityMarked) {
      showMessage(state, 1, 'Already marked.');
      return;
    }
    state.entityMarked = true;
    entity.marked = true;
    addScore(state, SCORE.prediction, 'entity prediction', `pred${state.huntIndex}`);
    showMessage(state, 1, 'This is the true entity. Its outline burns red.');
    playTone(520, 0.3);
  } else if (!entity.penalized) {
    entity.penalized = true;
    addScore(state, SCORE.falseManifestation, 'false manifestation');
    triggerSurge(state);
    showMessage(state, 1, 'A decoy! It shrieks and dissolves. The real one is enraged.');
    // The decoy reappears in Containment and can be marked (and punished) again.
    const containment = ROOM_BY_ID.con;
    entity.x = containment.x + 150;
    entity.y = containment.y + 100;
    entity.targetX = 0;
    entity.penalized = false;
    entity.trail = [];
  }
}
