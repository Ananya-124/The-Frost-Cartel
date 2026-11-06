import { normalizeCards } from '../../config/cards';
import type { GameContext } from '../context';
import type { CardEffect } from './cardEffects';

/** Public hook for Round 2 card data, kept from the original `window.PARADOX`. */
export interface ParadoxApi {
  setCards: (cards: unknown) => void;
  effects: Record<string, CardEffect>;
}

declare global {
  interface Window {
    PARADOX?: ParadoxApi;
  }
}

/** Installs `window.PARADOX` and returns a function that removes it. */
export function installParadoxApi(ctx: GameContext): () => void {
  const api: ParadoxApi = {
    setCards: (cards) => {
      ctx.state.cards = normalizeCards(cards);
      ctx.state.dirty = true;
    },
    effects: ctx.cardEffects,
  };
  window.PARADOX = api;
  return () => {
    if (window.PARADOX === api) delete window.PARADOX;
  };
}
