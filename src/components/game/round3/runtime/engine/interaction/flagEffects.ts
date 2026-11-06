import { playTone } from '../../audio/sound';
import { FLAG_ANNOUNCEMENTS, TAPE_MESSAGE, TAPE_SHIFT_MESSAGE } from '../../config/messages';
import { SCORE } from '../../config/scoring';
import type { ProgressFlag } from '../../types';
import type { GameContext } from '../context';
import { addScore } from '../scoring/scoring';
import { announce } from '../state/messages';

/** Reactions to a flag being granted by a clue: announcements, and the tape's effects. */
export function onFlagGranted(ctx: GameContext, flag: ProgressFlag): void {
  const { state } = ctx;
  const note = FLAG_ANNOUNCEMENTS[flag];
  if (note) {
    playTone(note.major ? 220 : 380, 0.5, 'triangle');
    announce(state, note.text);
  }

  if (flag === 'tape') {
    addScore(state, SCORE.disruption, 'successful disruption', `dis${state.huntIndex}`);
    announce(state, TAPE_MESSAGE);
    if (state.huntIndex === 2) {
      // Hunt III: the paradox swaps which manifestation is real and voids earlier marks.
      const nextReal = state.entities.find((e) => !e.real);
      for (const e of state.entities) {
        e.real = false;
        e.leavesTrail = false;
        e.marked = false;
      }
      if (nextReal) {
        nextReal.real = true;
        nextReal.leavesTrail = true;
      }
      state.entityMarked = false;
      ctx.scheduler.after(2500, () => announce(state, TAPE_SHIFT_MESSAGE));
    }
  }
}
