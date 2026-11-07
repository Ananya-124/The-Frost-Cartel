/** Look-and-feel data for the Haunted Auction. Card names, prices and status come from the server (round2.routes.ts). */

/** Card art by server card id (1-6). */
export const CARD_ART: Record<number, string> = {
  1: '/assets/round2/vampire.png',
  2: '/assets/round2/witch.png',
  3: '/assets/round2/ghost-pass.png',
  4: '/assets/round2/zombie.png',
  5: '/assets/round2/pumpkin-bomb.png',
  6: '/assets/round2/reaper.png',
};

/** One dimmed orange for every card frame and title. */
export const CARD_COLOR = '#c4601a';
export const CARD_TITLE_COLOR = '#e3a45c';

export const STAGE_GHOST = '/assets/round2/ghost-stage.png';
