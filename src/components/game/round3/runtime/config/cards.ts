import type { PowerCard } from '../types';

export const DEFAULT_CARDS: readonly PowerCard[] = [
  { name: 'Spectral Lens', desc: 'Reveals the true entity for 9s', effect: 'reveal', uses: 2 },
  { name: 'Skeleton Key', desc: 'Unlocks the nearest locked door', effect: 'unlock', uses: 1 },
  { name: 'Ward Sigil', desc: 'Cancels the next penalty', effect: 'shield', uses: 2 },
  { name: 'Chrono Sand', desc: 'Widens the sync window for 25s', effect: 'sync', uses: 1 },
];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Same field handling as the original `setCards`. Falls back to defaults if not an array. */
export function normalizeCards(input: unknown): PowerCard[] {
  const source: readonly unknown[] = Array.isArray(input) ? input : DEFAULT_CARDS;
  return source.map((raw) => {
    const c = isRecord(raw) ? raw : {};
    const uses = Number(c.uses ?? c.qty ?? 1);
    return {
      name: typeof c.name === 'string' && c.name ? c.name : 'Card',
      desc: typeof c.desc === 'string' ? c.desc : '',
      effect: typeof c.effect === 'string' ? c.effect : '',
      uses: Number.isFinite(uses) ? uses : 1,
      ...(typeof c.cardId === 'string' ? { cardId: c.cardId } : {}),
      ...(c.consumption === 'retained' || c.consumption === 'consume-one' ? { consumption: c.consumption } : {}),
      ...(c.source === 'auction' || c.source === 'development' ? { source: c.source } : {}),
    };
  });
}

/** Parses the optional Round 2 card JSON. Invalid JSON falls back to defaults. */
export function parseCardJson(text: string): PowerCard[] {
  try {
    return normalizeCards(JSON.parse(text) as unknown);
  } catch {
    return normalizeCards(null);
  }
}
