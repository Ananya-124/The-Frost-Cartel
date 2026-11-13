import { describe, expect, it } from 'vitest';
import { buildTeamPowerCards } from './inventoryCards';
import type { Round3InventoryItem } from '../../../../types/round3.types';

describe('Round 3 Card Inventory Resolution', () => {
  it('returns strictly only the 2 collected cards and prevents duplicate mapped inventory entries', () => {
    // Team collected 2 cards in Round 2
    const wonRound2Cards = [
      { id: 1, name: 'Chrono Freeze' },
      { id: 2, name: 'Witching Hour' },
    ];

    // Backend sync maps Card 1 to temporal-compass and Card 2 to temporal-shield in round3_card_inventory
    const backendInventory: Round3InventoryItem[] = [
      { cardId: 'temporal-compass', quantity: 1, source: 'auction' },
      { cardId: 'temporal-shield', quantity: 1, source: 'auction' },
      { cardId: 'spectral-lens', quantity: 1, source: 'development' },
    ];

    const cards = buildTeamPowerCards(backendInventory, wonRound2Cards);

    // Must return exactly 2 cards, NOT 4!
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.name)).toEqual(['Chrono Freeze', 'Witching Hour']);
    expect(cards.map((c) => c.effect)).toEqual(['chrono-freeze', 'witching-hour']);
  });

  it('resolves auction cards cleanly from inventory if wonRound2Cards is empty', () => {
    const backendInventory: Round3InventoryItem[] = [
      { cardId: 'temporal-compass', quantity: 1, source: 'auction' },
      { cardId: 'temporal-shield', quantity: 1, source: 'auction' },
      { cardId: 'spectral-lens', quantity: 1, source: 'development' },
    ];

    const cards = buildTeamPowerCards(backendInventory, []);

    // Only the 2 auction cards should be included, development card excluded
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.name)).toEqual(['Chrono Freeze', 'Witching Hour']);
  });
});
