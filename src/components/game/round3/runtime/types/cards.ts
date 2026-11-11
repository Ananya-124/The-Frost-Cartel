export type BuiltInCardEffect = 'reveal' | 'unlock' | 'shield' | 'sync';

export interface PowerCard {
  name: string;
  desc: string;
  /** A built-in effect id, or a custom id registered through the card API. */
  effect: string;
  uses: number;
  /** Round 3 inventory identity; absent only for standalone legacy data. */
  cardId?: string;
  consumption?: 'consume-one' | 'retained';
  source?: 'auction' | 'development' | 'admin' | 'testing';
}
