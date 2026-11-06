import { CARD_KEYS, CLOSE_PANEL_KEY, CONTROLS } from '../../config/controls';
import type { PlayerIndex } from '../../types';
import type { InteractableObject } from '../../types';
import { activateCardEffect } from '../cards/cardEffects';
import type { GameContext } from '../context';
import { performAction } from '../interaction/interactions';
import { findNearTarget } from '../interaction/nearby';
import { closePuzzles, pressPuzzleKey } from '../puzzles/puzzleManager';

export type Hunt1InteractionHandler = (player: PlayerIndex, object: InteractableObject) => void;
export type Hunt2InteractionHandler = (player: PlayerIndex, object: InteractableObject) => void;

/** Handles one-shot key presses (search, journal, panel buttons, cards, Escape). */
export function handleActionKey(
  ctx: GameContext,
  event: KeyboardEvent,
  onUseCard: (slot: number) => void = (slot) => activateCardEffect(ctx, slot),
  onHunt1Interaction?: Hunt1InteractionHandler,
  onHunt2Interaction?: Hunt2InteractionHandler,
): void {
  const { state } = ctx;
  if (state.phase !== 'playing') return;
  if (event.code.startsWith('Arrow') || event.code === 'Space') event.preventDefault();
  if (event.repeat) return;

  if (event.code === CLOSE_PANEL_KEY) {
    closePuzzles(state);
    state.journalOpen = [false, false];
    state.dirty = true;
    return;
  }

  for (const index of [0, 1] as const) {
    const keys = CONTROLS[index];
    if (event.code === keys.act) {
      if (state.huntIndex === 0 && onHunt1Interaction) {
        const target = findNearTarget(state, index);
        if (target?.kind === 'object') onHunt1Interaction(index, target.object);
      } else if (state.huntIndex === 1 && onHunt2Interaction) {
        const target = findNearTarget(state, index);
        if (target?.kind === 'object') onHunt2Interaction(index, target.object);
      } else performAction(ctx, index);
    }
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
