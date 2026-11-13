import { CARD_KEYS, CLOSE_PANEL_KEY, CONTROLS } from '../../config/controls';
import { HUNT1_INTERACTABLE_IDS, HUNT2_INTERACTABLE_IDS, HUNT3_INTERACTABLE_IDS } from '../../config/interactables';
import type { PlayerIndex } from '../../types';
import type { InteractableObject } from '../../types';
import { activateCardEffect } from '../cards/cardEffects';
import type { GameContext } from '../context';
import { performAction } from '../interaction/interactions';
import { findNearTarget } from '../interaction/nearby';
import { closePuzzles, pressPuzzleKey } from '../puzzles/puzzleManager';

export type Hunt1InteractionHandler = (player: PlayerIndex, object: InteractableObject) => void;
export type Hunt2InteractionHandler = (player: PlayerIndex, object: InteractableObject) => void;
export type Hunt3InteractionHandler = (player: PlayerIndex, object: InteractableObject) => void;

/** Executes the interaction for a player (E key or Enter key or clicking on prompt button). */
export function triggerPlayerAction(
  ctx: GameContext,
  index: PlayerIndex,
  onHunt1Interaction?: Hunt1InteractionHandler,
  onHunt2Interaction?: Hunt2InteractionHandler,
  onHunt3Interaction?: Hunt3InteractionHandler,
): void {
  const { state } = ctx;
  const target = findNearTarget(state, index);
  if (state.huntIndex === 0 && onHunt1Interaction) {
    if (target?.kind === 'object') {
      if (HUNT1_INTERACTABLE_IDS.has(target.object.id)) {
        onHunt1Interaction(index, target.object);
      } else {
        performAction(ctx, index);
      }
    } else {
      showInteractionGuidance(state, index, 'Move beside the highlighted Hunt I evidence and press E.');
    }
  } else if (state.huntIndex === 1 && onHunt2Interaction) {
    if (target?.kind === 'object') {
      if (HUNT2_INTERACTABLE_IDS.has(target.object.id)) {
        onHunt2Interaction(index, target.object);
      } else {
        performAction(ctx, index);
      }
    } else if (index === 1 && target?.kind === 'entity') {
      performAction(ctx, index);
    } else {
      showInteractionGuidance(state, index, 'Move beside the highlighted Hunt II object and press E.');
    }
  } else if (state.huntIndex === 2 && onHunt3Interaction) {
    if (target?.kind === 'object') {
      if (HUNT3_INTERACTABLE_IDS.has(target.object.id)) {
        onHunt3Interaction(index, target.object);
      } else {
        performAction(ctx, index);
      }
    } else {
      showInteractionGuidance(state, index, index === 0
        ? 'Move beside a highlighted Past task object, or use the Archivist task panel.'
        : 'Move beside a highlighted Future task object, or use the Tracker task panel.');
    }
  } else {
    performAction(ctx, index);
  }
}

/** Handles one-shot key presses (search, journal, panel buttons, cards, Escape). */
export function handleActionKey(
  ctx: GameContext,
  event: KeyboardEvent,
  onUseCard: (slot: number) => void = (slot) => activateCardEffect(ctx, slot),
  onHunt1Interaction?: Hunt1InteractionHandler,
  onHunt2Interaction?: Hunt2InteractionHandler,
  onHunt3Interaction?: Hunt3InteractionHandler,
): void {
  const { state } = ctx;
  if (state.phase !== 'playing' || event.repeat) return;
  const journalIndex = event.code === CONTROLS[0].journal ? 0 : event.code === CONTROLS[1].journal ? 1 : -1;
  // Handle Q/P before checking focused controls: the task panels contain buttons,
  // but those must not prevent either opening or closing a player's journal.
  if (journalIndex > -1) {
    event.preventDefault();
    toggleJournal(ctx, journalIndex as PlayerIndex);
    return;
  }
  const target = event.target;
  const isEditingText = target instanceof HTMLElement && (
    target.tagName === 'TEXTAREA' ||
    (target.tagName === 'INPUT' && !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color'].includes((target as HTMLInputElement).type.toLowerCase())) ||
    target.isContentEditable
  );
  if (isEditingText) return;

  if (target instanceof HTMLElement && (target.tagName === 'BUTTON' || target.closest('button'))) {
    const btn = (target.tagName === 'BUTTON' ? target : target.closest('button')) as HTMLElement;
    btn.blur();
  }
  if (event.code.startsWith('Arrow') || event.code === 'Space') event.preventDefault();

  if (event.code === CLOSE_PANEL_KEY) {
    closePuzzles(state);
    state.journalOpen = [false, false];
    state.dirty = true;
    return;
  }

  const isEKey = event.code === 'KeyE' || event.key === 'e' || event.key === 'E';
  const isEnterKey = event.code === 'Enter' || event.key === 'Enter';

  if (isEKey) {
    triggerPlayerAction(ctx, 0, onHunt1Interaction, onHunt2Interaction, onHunt3Interaction);
  } else if (isEnterKey) {
    triggerPlayerAction(ctx, 1, onHunt1Interaction, onHunt2Interaction, onHunt3Interaction);
  }

  for (const index of [0, 1] as const) {
    const keys = CONTROLS[index];
    if (event.code === keys.journal) toggleJournal(ctx, index);
    const panelButton = keys.panelKeys.indexOf(event.code);
    if (panelButton > -1) pressPuzzleKey(state, index, panelButton);
  }

  const slot = CARD_KEYS.indexOf(event.code);
  if (slot > -1) onUseCard(slot);
}

function toggleJournal(ctx: GameContext, index: PlayerIndex): void {
  ctx.state.journalOpen[index] = !ctx.state.journalOpen[index];
  ctx.state.dirty = true;
}

function showInteractionGuidance(state: GameContext['state'], index: PlayerIndex, message: string): void {
  state.messages[index] = message;
  state.messageUntil[index] = state.time + 4;
  state.dirty = true;
}
