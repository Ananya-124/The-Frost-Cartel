import { playTone } from '../../audio/sound';
import { CARD_KEYS } from '../../config/controls';
import { CHRONO_SAND_DURATION, REVEAL_DURATION, UNLOCK_CARD_RANGE } from '../../config/scoring';
import type { BuiltInCardEffect, GameState } from '../../types';
import { dist } from '../../utils/math';
import type { GameContext } from '../context';
import { announce } from '../state/messages';
import { isDoorOpen } from '../world/doors';
import { DOORS } from '../world/geometry';
import { getHunt } from '../../config/hunts';
import { HUNT1_INTERACTABLE_IDS, HUNT2_INTERACTABLE_IDS, HUNT3_INTERACTABLE_IDS, INTERACTABLES, isHunt3InteractableAvailable } from '../../config/interactables';
import { ROOMS } from '../../config/rooms';
import { pointInRect } from '../world/geometry';
import { targetSequence } from '../puzzles/puzzleManager';

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

const chronoFreeze: CardEffect = (state) => {
  announce(state, 'Chrono Freeze activated: the team task clock is paused for 10 seconds; movement and actions remain available.');
};
const witchingHour: CardEffect = (state) => {
  if (state.players.every((player) => player.syncArmedAt === null)) {
    announce(state, 'Witching Hour needs an active synchronization window. The card was not spent.');
    return 1;
  }
  state.syncWindowBonus = 5;
  announce(state, 'Witching Hour: 5 seconds added to the active capture synchronization window.');
};
const spectralSight: CardEffect = (state) => {
  const candidates = getHunt(state.huntIndex).clues.filter((clue) => {
    const player = state.players.find((candidate) => candidate.timeline === clue.timeline);
    const key = `${state.huntIndex}${clue.timeline === 'future' ? 'f' : 'p'}:${clue.objectId}`;
    return player && !state.completed[key] && (!clue.requires || state.flags[clue.requires]);
  });
  const clue = candidates[0];
  if (!clue) { announce(state, 'No unrevealed clue is available in this hunt. The card was not spent.'); return 1; }
  announce(state, `Spectral Sight reveals ${clue.title}: ${clue.text}`);
};
const highlightNearby: CardEffect = (state) => {
  const object = visibleObjects(state).find((candidate) => state.players.some((player) => player.timeline === candidate.timeline && pointInRect(candidate.x, candidate.y, ROOMS.find((room) => room.id === candidate.roomId)!)));
  if (!object) { announce(state, 'No important interactable is available in either current room. The card was not spent.'); return 1; }
  state.highlightedObjectId = object.id;
  state.highlightTimer = 10;
  announce(state, `Witch’s Lens highlights ${object.name} in this room.`);
};
const hexbreaker: CardEffect = (state) => {
  const puzzle = state.puzzles.find((item) => item?.kind === 'verification');
  if (!puzzle || puzzle.kind !== 'verification') { announce(state, 'Hexbreaker requires an open verification puzzle. The card was not spent.'); return 1; }
  const wrongOption = puzzle.question.options.findIndex((_, index) => index !== puzzle.question.correctIndex && !puzzle.eliminatedOptions?.includes(index));
  if (wrongOption < 0) { announce(state, 'No incorrect option remains to eliminate. The card was not spent.'); return 1; }
  puzzle.eliminatedOptions = [...(puzzle.eliminatedOptions ?? []), wrongOption];
  announce(state, `Hexbreaker removes one incorrect option (${wrongOption + 1}) from the open puzzle.`);
};
const elixir: CardEffect = (state) => {
  state.forgiveness++;
  announce(state, 'Witch’s Elixir is ready: the next incorrect puzzle input will not cause a score penalty or surge.');
};
const raven: CardEffect = (state) => {
  const timeline = state.players[0].timeline;
  const object = visibleObjects(state).find((candidate) => candidate.timeline === timeline);
  if (!object) { announce(state, `No next interactable is available in the ${timeline} timeline. The card was not spent.`); return 1; }
  state.highlightedObjectId = object.id;
  state.highlightTimer = 15;
  announce(state, `Raven’s Messenger marks the next ${timeline} interactable: ${object.name}.`);
};

function visibleObjects(state: GameState) {
  return INTERACTABLES.filter((object) => {
    const inHunt = state.huntIndex === 0 ? HUNT1_INTERACTABLE_IDS.has(object.id)
      : state.huntIndex === 1 ? HUNT2_INTERACTABLE_IDS.has(object.id)
        : HUNT3_INTERACTABLE_IDS.has(object.id) && isHunt3InteractableAvailable(object.id, state.hunt3Stage);
    const hidden = state.hunt2ObjectStates?.[object.id] === 'hidden' || object.id === 'trueMemoryAnchor' && !state.hunt2Subtasks?.trueAnchorActivated;
    return inHunt && !hidden && (state.hunt2HiddenInteractablesUntil?.[object.id] ?? 0) <= state.time;
  });
}
const master: CardEffect = (state) => {
  state.shields += 2;
  announce(state, 'The Warden’s Decree activated! Granted 2 Ward Sigils. Present this card to coordinators to enforce a 2-minute pause on a rival team.');
};

const mechanicsCurse: CardEffect = (state) => {
  const activeSequence = state.puzzles.find((item) => item?.kind === 'sequence');
  if (activeSequence && activeSequence.kind === 'sequence') {
    for (const index of [0, 1] as const) {
      if (state.puzzles[index]?.kind === 'sequence') {
        const target = targetSequence(state, index);
        activeSequence.input = [...target];
        state.flags[index === 0 ? 'pastNodeReady' : 'futureNodeReady'] = true;
        state.puzzles[index] = null;
        announce(state, 'Mechanic’s Curse: Automatically validated sequence mechanism stage!');
        playTone(520, 0.4);
        return;
      }
    }
  }
  if (state.flags.tape && state.flags.pastVerified && state.flags.futureVerified) {
    if (!state.flags.pastNodeReady) {
      state.flags.pastNodeReady = true;
      announce(state, 'Mechanic’s Curse: Automatically validated the Past timeline mechanism node.');
      return;
    }
    if (!state.flags.futureNodeReady) {
      state.flags.futureNodeReady = true;
      announce(state, 'Mechanic’s Curse: Automatically validated the Future timeline mechanism node.');
      return;
    }
  }
  announce(state, 'Mechanic’s Curse requires an active mechanism stage (e.g. sequence node). The card was not spent.');
  return 1;
};

const soulSurge: CardEffect = (state) => {
  if (state.flags.tape && state.flags.pastVerified && state.flags.futureVerified) {
    if (!state.flags.pastNodeReady) {
      state.flags.pastNodeReady = true;
      announce(state, 'Soul Surge: Instantly completed Past mechanism stage without final activation interaction!');
      return;
    }
    if (!state.flags.futureNodeReady) {
      state.flags.futureNodeReady = true;
      announce(state, 'Soul Surge: Instantly completed Future mechanism stage without final activation interaction!');
      return;
    }
    if (state.players.some((p) => p.syncArmedAt === null)) {
      state.players[0].syncArmedAt = state.time;
      state.players[1].syncArmedAt = state.time;
      announce(state, 'Soul Surge: Unleashed! Both synchronized capture stages instantly completed and armed!');
      return;
    }
  }
  announce(state, 'Soul Surge requires an eligible multi-stage mechanism in progress. The card was not spent.');
  return 1;
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
  return { ...BUILT_IN_EFFECTS, echo, decode, power, bind,
    'chrono-freeze': chronoFreeze, 'witching-hour': witchingHour,
    'spectral-sight': spectralSight, 'witchs-lens': highlightNearby,
    hexbreaker, 'mechanics-curse': mechanicsCurse,
    'witchs-elixir': elixir, 'ravens-messenger': raven,
    'phantom-shield': shield, 'soul-surge': soulSurge,
    'wardens-decree': master };
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
