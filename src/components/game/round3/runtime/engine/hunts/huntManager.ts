import { HUNT_COUNT, HUNT_INTRO_FREEZE, HUNT_INTRO_VISIBLE_MS, TIMELINES } from '../../config/constants';
import { START_MESSAGE } from '../../config/messages';
import type { HuntIndex } from '../../types';
import type { GameContext } from '../context';
import { spawnEntities } from '../entities/entityAI';
import { spawnPosition } from '../state/createInitialState';
import { showMessage } from '../state/messages';
import { isDoorOpen } from '../world/doors';
import { DOORS } from '../world/geometry';

/** Resets per-hunt state, places the players at the entrance and plays the intro. */
export function startHunt(ctx: GameContext, index: HuntIndex): void {
  const { state } = ctx;
  state.huntIndex = index;
  state.flags = {};
  state.puzzles = [null, null];
  state.entityMarked = false;
  state.surgeTimer = 0;
  state.revealTimer = 0;
  state.chronoSandTimer = 0;
  for (const player of state.players) {
    const spawn = spawnPosition(player.index);
    player.x = spawn.x;
    player.y = spawn.y;
    player.syncArmedAt = null;
  }
  state.entities = spawnEntities(index);
  state.doorOpenMemory = [
    DOORS.map((d) => isDoorOpen(state, d, TIMELINES[0])),
    DOORS.map((d) => isDoorOpen(state, d, TIMELINES[1])),
  ];
  state.huntIntro = index;
  state.freezeTimer = HUNT_INTRO_FREEZE;
  ctx.scheduler.after(HUNT_INTRO_VISIBLE_MS, () => {
    state.huntIntro = null;
    state.dirty = true;
  });
  showMessage(state, 0, START_MESSAGE, 6000);
  showMessage(state, 1, START_MESSAGE, 6000);
  state.dirty = true;
}

/** Moves to the next hunt, or ends the game after the last one. */
export function advanceHunt(ctx: GameContext): void {
  const { state } = ctx;
  if (state.huntIndex >= HUNT_COUNT - 1) {
    endGame(ctx);
    return;
  }
  startHunt(ctx, (state.huntIndex + 1) as HuntIndex);
}

/** Final screen: totals and the leaderboard. */
export function endGame(ctx: GameContext): void {
  const { state } = ctx;
  state.summary = {
    teamName: state.teamName,
    totalScore: state.score,
    huntScores: [...state.huntScores],
    evidence: state.journal.length,
    captures: state.captures,
    bonus: state.bonus,
    penalties: state.penalty,
    rank: null,
    leaderboard: [],
  };
  state.phase = 'ended';
  state.puzzles = [null, null];
  state.journalOpen = [false, false];
  state.dirty = true;
}
