const STORAGE_PREFIX = 'fc_round3_used_cards_';

/** Returns the set of card IDs that have been activated and consumed by this team. */
export function getTeamUsedCards(teamName: string): Set<string> {
  if (typeof window === 'undefined' || !teamName) return new Set();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${teamName.toLowerCase().trim()}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/** Permanently marks a card as used for this team so it cannot be used again. */
export function markTeamCardUsed(teamName: string, cardId: string): void {
  if (typeof window === 'undefined' || !teamName || !cardId) return;
  try {
    const key = `${STORAGE_PREFIX}${teamName.toLowerCase().trim()}`;
    const used = getTeamUsedCards(teamName);
    used.add(cardId);
    localStorage.setItem(key, JSON.stringify([...used]));
  } catch {}
}
