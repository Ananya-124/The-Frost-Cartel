import type { Round3CardId } from '../../../../constants/round3.cards';
import type { Round3InventoryItem } from '../../../../types/round3.types';
import type { PowerCard } from './types';

const ENGINE_EFFECTS: Record<Round3CardId, string> = {
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

const NAMES: Record<Round3CardId, { name: string; desc: string }> = {
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

/** Maps only cards actually present in the authenticated Round 3 inventory. */
export function inventoryToPowerCards(inventory: readonly Round3InventoryItem[]): PowerCard[] {
  return inventory.filter((item) => item.quantity > 0).map((item) => ({
    cardId: item.cardId,
    source: item.source,
    name: NAMES[item.cardId].name,
    desc: NAMES[item.cardId].desc,
    effect: ENGINE_EFFECTS[item.cardId],
    uses: item.quantity,
    consumption: item.cardId === 'temporal-compass' ? 'retained' : 'consume-one',
  }));
}
