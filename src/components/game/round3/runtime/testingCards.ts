import type { PowerCard } from './types';

export const TEST_POWER_CARDS = [
  { id: 'chrono-freeze', name: 'Chrono Freeze', desc: 'Pause the Round 3 task clock for 10 seconds.' },
  { id: 'witching-hour', name: 'Witching Hour', desc: 'Add 5 seconds to an active sync window.' },
  { id: 'spectral-sight', name: 'Spectral Sight', desc: 'Reveal one additional task hint.' },
  { id: 'witchs-lens', name: "Witch’s Lens", desc: 'Highlight an important object in this room.' },
  { id: 'hexbreaker', name: 'Hexbreaker', desc: 'Eliminate one incorrect puzzle option.' },
  { id: 'mechanics-curse', name: "Mechanic’s Curse", desc: 'Validate a correctly configured mechanism stage.' },
  { id: 'witchs-elixir', name: "Witch’s Elixir", desc: 'Forgive one incorrect input penalty.' },
  { id: 'ravens-messenger', name: "Raven’s Messenger", desc: 'Reveal the next object in your timeline.' },
  { id: 'phantom-shield', name: 'Phantom Shield', desc: 'Block one failed sync or timed-control penalty.' },
  { id: 'soul-surge', name: 'Soul Surge', desc: 'Complete a correctly configured mechanism stage.' },
  { id: 'wardens-decree', name: "The Warden’s Decree", desc: 'Request a 2-minute pause through event coordinators.' },
] as const;

export type TestPowerCardId = (typeof TEST_POWER_CARDS)[number]['id'];
const STORAGE_PREFIX = 'frost-cartel-r3-test-cards:';
const USED_PREFIX = 'frost-cartel-r3-test-used:';

export function readTestingInventory(teamName: string): TestPowerCardId[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_PREFIX + teamName) ?? '[]');
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id): id is TestPowerCardId => TEST_POWER_CARDS.some((card) => card.id === id)))];
  } catch { return []; }
}

export function writeTestingInventory(teamName: string, ids: TestPowerCardId[]): void {
  localStorage.setItem(STORAGE_PREFIX + teamName, JSON.stringify([...new Set(ids)]));
}

export function readUsedTestingCards(teamName: string): TestPowerCardId[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(USED_PREFIX + teamName) ?? '[]');
    return Array.isArray(value) ? [...new Set(value.filter((id): id is TestPowerCardId => TEST_POWER_CARDS.some((card) => card.id === id)))] : [];
  } catch { return []; }
}

export function markTestingCardUsed(teamName: string, id: TestPowerCardId): TestPowerCardId[] {
  const used = [...new Set([...readUsedTestingCards(teamName), id])];
  localStorage.setItem(USED_PREFIX + teamName, JSON.stringify(used));
  return used;
}

export function writeUsedTestingCards(teamName: string, ids: TestPowerCardId[]): void {
  localStorage.setItem(USED_PREFIX + teamName, JSON.stringify([...new Set(ids)]));
}

export function cardsFromTestingInventory(ids: readonly TestPowerCardId[], used: readonly TestPowerCardId[] = []): PowerCard[] {
  return ids.map((id) => {
    const card = TEST_POWER_CARDS.find((item) => item.id === id)!;
    return { cardId: id, source: 'testing', name: card.name, desc: card.desc, effect: id, uses: used.includes(id) ? 0 : 1, consumption: 'consume-one' };
  });
}
