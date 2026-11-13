import type { Round3InventoryItem } from '../../../../types/round3.types';
import type { PowerCard } from './types';

export const ROUND2_CARD_DEFINITIONS: Record<number, {
  id: string;
  name: string;
  desc: string;
  effect: string;
}> = {
  1: {
    id: 'chrono-freeze',
    name: 'Chrono Freeze',
    desc: 'Freeze the active task countdown for 10 seconds. Your team can continue moving, interacting and solving puzzles while time stands still.',
    effect: 'chrono-freeze',
  },
  2: {
    id: 'witching-hour',
    name: 'Witching Hour',
    desc: 'Gain an additional 5 seconds during a timed synchronization challenge. Use this advantage when every second counts.',
    effect: 'witching-hour',
  },
  3: {
    id: 'spectral-sight',
    name: 'Spectral Sight',
    desc: 'Reveal one hidden clue or receive an additional hint for your current task. See what others might miss.',
    effect: 'spectral-sight',
  },
  4: {
    id: 'witchs-lens',
    name: "Witch's Lens",
    desc: 'Highlight one important interactable object in your current room. Let the supernatural guide your investigation.',
    effect: 'witchs-lens',
  },
  5: {
    id: 'hexbreaker',
    name: 'Hexbreaker',
    desc: 'Eliminate one incorrect option or reveal one wrong connection in an active puzzle. Break through the curse of uncertainty.',
    effect: 'hexbreaker',
  },
  6: {
    id: 'mechanics-curse',
    name: "Mechanic's Curse",
    desc: 'Automatically validate one correctly configured stage of a multi-stage mechanism. Skip the final confirmation and move forward.',
    effect: 'mechanics-curse',
  },
  7: {
    id: 'witchs-elixir',
    name: "Witch's Elixir",
    desc: 'Forgive one incorrect input that would normally trigger a mistake penalty. Every team deserves a second chance.',
    effect: 'witchs-elixir',
  },
  8: {
    id: 'ravens-messenger',
    name: "Raven's Messenger",
    desc: 'Reveal the location of the next relevant interactable object in your timeline. Let the raven lead the way.',
    effect: 'ravens-messenger',
  },
  9: {
    id: 'phantom-shield',
    name: 'Phantom Shield',
    desc: 'Protect your team from one failed synchronization penalty or one failed timed-control attempt. The spirits grant you one layer of protection.',
    effect: 'phantom-shield',
  },
  10: {
    id: 'soul-surge',
    name: 'Soul Surge',
    desc: 'Instantly complete one correctly configured stage of a multi-stage mechanism without performing its final activation interaction.',
    effect: 'soul-surge',
  },
  11: {
    id: 'wardens-decree',
    name: "The Warden's Decree",
    desc: 'Choose one competing team and order a 2-minute gameplay pause with 2 Ward Sigils. Present to coordinators to enforce.',
    effect: 'wardens-decree',
  },
};

const LEGACY_ENGINE_EFFECTS: Record<string, string> = {
  'spectral-lens': 'reveal',
  'echo-recorder': 'echo',
  'phantom-key': 'unlock',
  'temporal-compass': 'sync',
  'phantom-beacon': 'reveal',
  'resonance-decoder': 'decode',
  'temporal-shield': 'shield',
  'memory-seal': 'shield',
  'emergency-power-cell': 'power',
  'soul-binding-sigil': 'bind',
};

const LEGACY_NAMES: Record<string, { name: string; desc: string }> = {
  'spectral-lens': { name: 'Spectral Lens', desc: 'Reveals the true entity for 9s.' },
  'echo-recorder': { name: 'Echo Recorder', desc: 'Replays the latest clue through the shared journal.' },
  'phantom-key': { name: 'Phantom Key', desc: 'Unlocks the nearest locked door.' },
  'temporal-compass': { name: 'Temporal Compass', desc: 'Widens the synchronized capture window.' },
  'phantom-beacon': { name: 'Phantom Beacon', desc: 'Marks the true entity for 9s.' },
  'resonance-decoder': { name: 'Resonance Decoder', desc: 'Reveals the active anomaly for 9s.' },
  'temporal-shield': { name: 'Temporal Shield', desc: 'Cancels the next penalty.' },
  'memory-seal': { name: 'Memory Seal', desc: 'Cancels the next penalty.' },
  'emergency-power-cell': { name: 'Emergency Power Cell', desc: 'Restores facility power.' },
  'soul-binding-sigil': { name: 'Soul Binding Sigil', desc: 'Protects the team from the next penalty.' },
};

/** Normalizes a card name string to match Round 2 definitions */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Resolves a Round 2 card by ID (1-11) or name */
export function resolveRound2Card(card: { id?: number; name?: string }): { id: string; name: string; desc: string; effect: string } | null {
  if (typeof card.id === 'number' && ROUND2_CARD_DEFINITIONS[card.id]) {
    return ROUND2_CARD_DEFINITIONS[card.id];
  }
  if (card.name) {
    const target = normalizeName(card.name);
    for (const def of Object.values(ROUND2_CARD_DEFINITIONS)) {
      if (normalizeName(def.name) === target) return def;
    }
  }
  return null;
}

/** Maps only cards actually present in the authenticated Round 3 inventory. */
export function inventoryToPowerCards(inventory: readonly Round3InventoryItem[] = []): PowerCard[] {
  return inventory.filter((item) => item.quantity > 0).map((item) => {
    // Check if it matches a Round 2 card definition first
    const r2 = Object.values(ROUND2_CARD_DEFINITIONS).find((d) => d.id === item.cardId);
    if (r2) {
      return {
        cardId: r2.id,
        source: item.source,
        name: r2.name,
        desc: r2.desc,
        effect: r2.effect,
        uses: item.quantity,
        consumption: 'consume-one',
      };
    }
    const nameInfo = LEGACY_NAMES[item.cardId] ?? { name: item.cardId, desc: 'Special power card' };
    const effect = LEGACY_ENGINE_EFFECTS[item.cardId] ?? 'shield';
    return {
      cardId: item.cardId,
      source: item.source,
      name: nameInfo.name,
      desc: nameInfo.desc,
      effect,
      uses: item.quantity,
      consumption: item.cardId === 'temporal-compass' ? 'retained' : 'consume-one',
    };
  });
}

/**
 * Combines Round 3 server inventory with Round 2 auction won cards,
 * enforcing single-use per card per team.
 */
export function buildTeamPowerCards(
  inventory: readonly Round3InventoryItem[] = [],
  wonRound2Cards: readonly { id?: number; name: string }[] = [],
  usedCards: Set<string> = new Set()
): PowerCard[] {
  const cards: PowerCard[] = [];
  const seenIds = new Set<string>();

  // 1. Process Round 2 Auction cards won by this team
  for (const won of wonRound2Cards) {
    const def = resolveRound2Card(won);
    if (!def || seenIds.has(def.id)) continue;
    seenIds.add(def.id);
    const alreadyUsed = usedCards.has(def.id);
    cards.push({
      cardId: def.id,
      source: 'auction',
      name: def.name,
      desc: def.desc,
      effect: def.effect,
      uses: alreadyUsed ? 0 : 1, // Strictly single-use per team!
      consumption: 'consume-one',
    });
  }

  // 2. Process any other items from server inventory (avoiding duplicates)
  for (const item of inventory) {
    if (item.quantity <= 0) continue;
    const def = Object.values(ROUND2_CARD_DEFINITIONS).find((d) => d.id === item.cardId);
    const cardId = def ? def.id : item.cardId;
    if (seenIds.has(cardId)) continue;
    seenIds.add(cardId);
    const alreadyUsed = usedCards.has(cardId);
    if (def) {
      cards.push({
        cardId: def.id,
        source: item.source,
        name: def.name,
        desc: def.desc,
        effect: def.effect,
        uses: alreadyUsed ? 0 : 1,
        consumption: 'consume-one',
      });
    } else {
      const nameInfo = LEGACY_NAMES[item.cardId] ?? { name: item.cardId, desc: 'Special power card' };
      const effect = LEGACY_ENGINE_EFFECTS[item.cardId] ?? 'shield';
      cards.push({
        cardId: item.cardId,
        source: item.source,
        name: nameInfo.name,
        desc: nameInfo.desc,
        effect,
        uses: alreadyUsed ? 0 : item.quantity,
        consumption: item.cardId === 'temporal-compass' ? 'retained' : 'consume-one',
      });
    }
  }

  return cards;
}
