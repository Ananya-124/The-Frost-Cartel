import { playTone } from '../../audio/sound';
import { MIRROR_CLUE } from '../../config/clues';
import { getHunt } from '../../config/hunts';
import { REQUIREMENT_MESSAGES } from '../../config/messages';
import { SCORE } from '../../config/scoring';
import type { Clue, InteractableObject, PlayerIndex } from '../../types';
import type { GameContext } from '../context';
import { triggerSurge } from '../events/disturbances';
import { openNode, openTerminal } from '../puzzles/puzzleManager';
import { addScore } from '../scoring/scoring';
import { announce, showMessage } from '../state/messages';
import { onFlagGranted } from './flagEffects';

const clueKey = (huntIndex: number, o: InteractableObject): string =>
  `${huntIndex}${o.timeline === 'future' ? 'f' : 'p'}:${o.id}`;

/** Finds the clue attached to an object in the current hunt, if any. */
function findClue(ctx: GameContext, o: InteractableObject): Clue | undefined {
  const hunt = getHunt(ctx.state.huntIndex);
  const clue = hunt.clues.find((c) => c.objectId === o.id && c.timeline === o.timeline);
  if (clue) return clue;
  return o.id === 'mirror' && o.timeline === 'future' ? MIRROR_CLUE : undefined;
}

/** Records a clue in the one shared journal, visible to both players at once. */
function addToJournal(ctx: GameContext, index: PlayerIndex, clue: Clue): void {
  const { state } = ctx;
  const player = state.players[index];
  state.journal.push({
    title: clue.title,
    text: clue.text,
    huntIndex: state.huntIndex,
    discoveredBy: player.role,
    timeline: player.timeline,
    timestamp: new Date().toLocaleTimeString(),
  });
  announce(state, `${player.role} discovered: ${clue.title}`);
  playTone(330, 0.2, 'triangle');
}

/** Search or use a prop. */
export function interactWithObject(ctx: GameContext, index: PlayerIndex, o: InteractableObject): void {
  const { state } = ctx;
  if (o.id === 'node') {
    openNode(state, index);
    return;
  }
  if (o.id === 'term') {
    openTerminal(state, index);
    return;
  }

  const clue = findClue(ctx, o);
  if (!clue) {
    showMessage(state, index, 'Nothing of interest.');
    return;
  }
  if (clue.requires && !state.flags[clue.requires]) {
    playTone(90, 0.2, 'square');
    showMessage(state, index, REQUIREMENT_MESSAGES[clue.requires]);
    return;
  }
  const key = clueKey(state.huntIndex, o);
  if (state.completed[key]) {
    showMessage(state, index, `You already examined this: ${clue.title}`);
    return;
  }
  state.completed[key] = true;
  addToJournal(ctx, index, clue);

  if (clue.dangerous) {
    addScore(state, SCORE.dangerousClue, 'dangerous evidence');
    triggerSurge(state);
    announce(state, 'The mirror screams: dangerous evidence recorded.');
  } else {
    addScore(state, SCORE.clue, 'hidden evidence');
  }
  if (clue.grants) {
    state.flags[clue.grants] = true;
    onFlagGranted(ctx, clue.grants);
  }
  showMessage(state, index, `${clue.title}: ${clue.text}`);
}
