import { playTone } from '../../audio/sound';
import { CARD_KEYS } from '../../config/controls';
import { CHRONO_SAND_DURATION, REVEAL_DURATION, UNLOCK_CARD_RANGE } from '../../config/scoring';
import type { BuiltInCardEffect, GameState } from '../../types';
import { dist } from '../../utils/math';
import type { GameContext } from '../context';
import { announce } from '../state/messages';
import { isDoorOpen } from '../world/doors';
import { DOORS } from '../world/geometry';

/** Return 1 to leave the card unspent (as in the original). */
export type CardEffect = (state: GameState) => number | void;

const reveal: CardEffect = (state) => {
  state.revealTimer = REVEAL_DURATION;
  announce(state, 'The Spectral Lens burns: the true entity glows.');
};

const unlock: CardEffect = (state) => {
  for (const index of [0, 1] as const) {
    const player = state.players[index];
    const closed = DOORS.filter((d) => !isDoorOpen(state, d, player.timeline)).sort(
      (a, b) => dist(centre(a.connector), player) - dist(centre(b.connector), player),
    );
    const door = closed[0];
    if (door && dist(centre(door.connector), player) < UNLOCK_CARD_RANGE) {
      const lock = player.timeline === 'future' ? door.futureLock : door.pastLock;
      if (lock) state.flags[lock] = true;
      announce(state, 'The Skeleton Key opens the nearest locked door.');
      return;
    }
  }
  announce(state, 'No locked door nearby. The card was not spent.');
  return 1;
};

const shield: CardEffect = (state) => {
  state.shields++;
  announce(state, 'A Ward Sigil protects the team from the next penalty.');
};

const sync: CardEffect = (state) => {
  state.chronoSandTimer = CHRONO_SAND_DURATION;
  announce(state, 'Chrono Sand: the sync window widens.');
};

const echo: CardEffect = (state) => {
  const clue = state.journal.at(-1);
  if (!clue) {
    announce(state, 'No recorded echo is available yet. The card was not spent.');
    return 1;
  }
  announce(state, `Echo Recorder: ${clue.title} — ${clue.text}`);
};

const decode: CardEffect = (state) => {
  state.revealTimer = REVEAL_DURATION;
  announce(state, 'Resonance Decoder isolates the true anomaly.');
};

const power: CardEffect = (state) => {
  state.flags.power = true;
  announce(state, 'Emergency Power Cell restores facility power.');
};

const bind: CardEffect = (state) => {
  state.shields++;
  announce(state, 'Soul Binding Sigil absorbs the next penalty.');
};

function centre(r: { x: number; y: number; w: number; h: number }): { x: number; y: number } {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

export const BUILT_IN_EFFECTS: Record<BuiltInCardEffect, CardEffect> = {
  reveal,
  unlock,
  shield,
  sync,
};

/** Registry that custom effects can be added to (exposed as `PARADOX.effects`). */
export function createCardEffects(): Record<string, CardEffect> {
  return { ...BUILT_IN_EFFECTS, echo, decode, power, bind };
}

/** Uses the card at a slot (Z, X, C, V). */
export function activateCardEffect(ctx: GameContext, slot: number): boolean {
  const { state } = ctx;
  const card = state.cards[slot];
  if (!card || card.uses < 1 || state.phase !== 'playing') return false;
  const effect = ctx.cardEffects[card.effect];
  if (!effect) {
    announce(state, 'This card effect is not wired yet.');
    return false;
  }
  if (effect(state) === 1) return false;
  if (card.consumption !== 'retained') card.uses--;
  playTone(700, 0.3, 'triangle');
  state.dirty = true;
  return true;
}

export const cardSlotForKey = (code: string): number => CARD_KEYS.indexOf(code);
