import type { PlayerIndex } from '../../types';
import type { GameContext } from '../context';
import { markEntity } from '../entities/manifestation';
import { interactWithObject } from './clueCollection';
import { findNearTarget } from './nearby';

/** Search / use / mark button pressed by one player. */
export function performAction(ctx: GameContext, index: PlayerIndex): void {
  const { state } = ctx;
  if (state.phase !== 'playing' || state.freezeTimer > 0 || state.puzzles[index]) return;
  const target = findNearTarget(state, index);
  if (!target) return;
  if (target.kind === 'entity') markEntity(state, target.entity);
  else interactWithObject(ctx, index, target.object);
}
