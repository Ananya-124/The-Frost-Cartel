export interface R2Card { id: number; name: string; description: string; icon: string; defaultBase: number; status: 'pending' | 'live' | 'sold' | 'unsold'; winner: string | null; price: number | null }
export interface R2Live { cardId: number; base: number; highBid: number; highBidder: string | null; endsAt: number | null; bids: { team: string; amount: number; t: number }[] }
export interface R2Me { name: string; startCredits: number; spent: number; credits: number; cards: { id: number; name: string; price: number }[] }
export interface R2View { success: boolean; message?: string; now: number; cards: R2Card[]; live: R2Live | null; minIncrement: number; me: R2Me | null }
export interface R2Overview extends R2View { teams: R2Me[] }
export interface R2Result { success: boolean; message?: string }

const API = '/api/round2';
const ADMIN_KEY_STORE = 'fc_r2_admin_key';
const INVENTORY_KEY = 'frost_cartel_round2_inventory';

async function call<T>(path: string, method = 'GET', body?: unknown, adminKey?: string): Promise<T> {
  try {
    const res = await fetch(API + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(adminKey ? { 'x-round2-key': adminKey } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return (await res.json()) as T;
  } catch {
    return { success: false, message: 'Cannot reach the auction server.' } as unknown as T;
  }
}

export const round2Service = {
  /** Round 1 -> Round 2: credits earned in Round 1 live in localStorage under the team's id. */
  getRound1Credits(teamId: string, fallback = 0): number {
    const readCredits = (storage: Storage): number | undefined => {
      try {
        const stored = storage.getItem('frost_cartel_round1_sessions');
        if (!stored) return undefined;
        const all = JSON.parse(stored) as Record<string, { credits?: unknown }>;
        const credits = all[teamId]?.credits;
        return typeof credits === 'number' && Number.isFinite(credits) ? credits : undefined;
      } catch {
        return undefined;
      }
    };
    return readCredits(localStorage) ?? readCredits(sessionStorage) ?? fallback;
  },
  join: (teamName: string, credits: number) => call<R2View>('/join', 'POST', { teamName, credits }),
  getState: (team: string) => call<R2View>(`/state?team=${encodeURIComponent(team)}`),
  bid: (teamName: string, amount: number) => call<R2View>('/bid', 'POST', { teamName, amount }),

  /** Round 2 -> Round 3: cards won + credits left are mirrored to localStorage. Read with getInventory(). */
  saveInventory(me: R2Me | null): void {
    if (!me) return;
    try {
      localStorage.setItem(INVENTORY_KEY, JSON.stringify({ teamName: me.name, remainingCredits: me.credits, cards: me.cards }));
    } catch { /* storage unavailable */ }
  },
  getInventory(): { teamName: string; remainingCredits: number; cards: R2Me['cards'] } | null {
    try {
      return JSON.parse(localStorage.getItem(INVENTORY_KEY) ?? 'null');
    } catch {
      return null;
    }
  },

  getAdminKey: () => sessionStorage.getItem(ADMIN_KEY_STORE) ?? '',
  setAdminKey: (k: string) => sessionStorage.setItem(ADMIN_KEY_STORE, k),
  admin: {
    overview: (k: string) => call<R2Overview>('/admin/overview', 'GET', undefined, k),
    start: (k: string, cardId: number, basePrice: number, durationSeconds: number) =>
      call<R2Result>('/admin/start', 'POST', { cardId, basePrice, durationSeconds }, k),
    end: (k: string) => call<R2Result>('/admin/end', 'POST', {}, k),
    reset: (k: string) => call<R2Result>('/admin/reset', 'POST', {}, k),
    removeTeam: (k: string, name: string) => call<R2Result>(`/admin/team/${encodeURIComponent(name)}`, 'DELETE', undefined, k),
  },
};
