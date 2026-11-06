import { playTone } from '../../audio/sound';
import { ENTITY } from '../../config/constants';
import { getHunt } from '../../config/hunts';
import { ROOM_BY_ID } from '../../config/rooms';
import { SCORE } from '../../config/scoring';
import type { GameState, PlayerIndex, ProgressFlag, SequencePuzzle } from '../../types';
import { dist } from '../../utils/math';
import { triggerSurge } from '../events/disturbances';
import { addScore } from '../scoring/scoring';
import { showMessage } from '../state/messages';

const VERIFIED_FLAG: Record<PlayerIndex, ProgressFlag> = {
  0: 'pastVerified',
  1: 'futureVerified',
};
const NODE_FLAG: Record<PlayerIndex, ProgressFlag> = {
  0: 'pastNodeReady',
  1: 'futureNodeReady',
};

/** The sequence a player must enter, reversed when the puzzle says so. */
export function targetSequence(state: GameState, index: PlayerIndex): number[] {
  const puzzle: SequencePuzzle = getHunt(state.huntIndex).sequence[state.players[index].timeline];
  const steps = [...puzzle.steps];
  return puzzle.reversedWhenFlag && state.flags[puzzle.reversedWhenFlag] ? steps.reverse() : steps;
}

/** Opens the verification question at a terminal. */
export function openTerminal(state: GameState, index: PlayerIndex): void {
  if (state.flags[VERIFIED_FLAG[index]]) {
    showMessage(state, index, 'Already verified.');
    return;
  }
  const puzzle = getHunt(state.huntIndex).verification[state.players[index].timeline];
  state.puzzles[index] = { kind: 'verification', question: puzzle.question };
  state.dirty = true;
}

/** Uses the Experiment Chamber node: open the sequence, or arm the capture. */
export function openNode(state: GameState, index: PlayerIndex): void {
  if (!state.flags.tape) {
    showMessage(state, index, 'The node is inert. Something must weaken the entity first.');
    return;
  }
  if (!(state.flags.pastVerified && state.flags.futureVerified)) {
    showMessage(
      state,
      index,
      "You do not understand this mechanism yet. Verify your findings at your timeline's terminal.",
    );
    return;
  }
  if (!state.flags[NODE_FLAG[index]]) {
    const length = getHunt(state.huntIndex).sequence[state.players[index].timeline].steps.length;
    state.puzzles[index] = { kind: 'sequence', length, input: [] };
    state.dirty = true;
    return;
  }
  if (!(state.flags.pastNodeReady && state.flags.futureNodeReady)) {
    showMessage(state, index, 'Your node is ready. Wait for your partner.');
    return;
  }
  const real = state.entities.find((e) => e.real);
  const chamber = ROOM_BY_ID.exp;
  const target = {
    x: chamber.x + ENTITY.captureTargetOffset.x,
    y: chamber.y + ENTITY.captureTargetOffset.y,
  };
  if (!state.entityMarked || !real || dist(real, target) > ENTITY.captureRange) {
    showMessage(
      state,
      index,
      'The true entity must be identified and present before you can capture it.',
    );
    return;
  }
  state.players[index].syncArmedAt = state.time;
  showMessage(state, index, 'Armed. Your partner must act with you…');
}

/** A panel button (0-3) pressed by one player. */
export function pressPuzzleKey(state: GameState, index: PlayerIndex, key: number): void {
  if (state.phase !== 'playing') return;
  const puzzle = state.puzzles[index];
  if (!puzzle) return;

  if (puzzle.kind === 'verification') {
    if (key > 2) return;
    if (key === puzzle.question.correctIndex) {
      state.puzzles[index] = null;
      state.flags[VERIFIED_FLAG[index]] = true;
      addScore(state, SCORE.deduction, 'deduction', `q${index}${state.huntIndex}`);
      showMessage(state, index, 'Verified. The weakness comes into focus.');
      playTone(520, 0.3);
    } else {
      addScore(state, SCORE.wrongAnswer, 'wrong evidence selection');
      triggerSurge(state);
      showMessage(state, index, 'Wrong. The facility seems to lean closer.');
    }
    state.dirty = true;
    return;
  }

  puzzle.input.push(key);
  if (puzzle.input.length === puzzle.length) {
    const target = targetSequence(state, index);
    if (puzzle.input.every((v, j) => v === target[j])) {
      state.flags[NODE_FLAG[index]] = true;
      state.puzzles[index] = null;
      addScore(state, SCORE.deduction, 'cross-timeline deduction', `sq${index}${state.huntIndex}`);
      showMessage(state, index, 'The mechanism locks. Waiting for the other timeline to be ready…');
      playTone(440, 0.4);
    } else {
      puzzle.input = [];
      addScore(state, SCORE.wrongSequence, 'wrong sequence');
      triggerSurge(state);
      showMessage(state, index, 'Wrong sequence! The panel shrieks and something answers.');
    }
  }
  state.dirty = true;
}

/** Closes any open panel (Escape). */
export function closePuzzles(state: GameState): void {
  state.puzzles = [null, null];
  state.dirty = true;
}
