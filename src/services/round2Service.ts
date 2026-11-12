import { apiUrl } from './apiBaseUrl';

export interface R2Card { id: number; name: string; description: string; icon: string; defaultBase: number; status: 'pending' | 'live' | 'sold' | 'unsold'; winner: string | null; price: number | null }
export interface R2Live { cardId: number; base: number; highBid: number; highBidder: string | null; endsAt: number | null; bids: { team: string; amount: number; t: number }[] }
export interface R2Me { name: string; startCredits: number; spent: number; credits: number; cards: { id: number; name: string; price: number }[] }
export interface R2View { success: boolean; message?: string; code?: string; status?: number; now: number; cards: R2Card[]; live: R2Live | null; minIncrement: number; me: R2Me | null; bid?: { id: string; duplicate: boolean; minimumBid: number } }
export interface R2AuditEntry { id: string; admin_id: string; admin_username: string; action: 'START' | 'END' | 'RESET' | 'REMOVE_TEAM'; outcome: 'APPLIED' | 'REJECTED'; lot_id: string | null; details: Record<string, unknown>; previous_state: Record<string, unknown>; new_state: Record<string, unknown>; created_at: string }
export interface R2Overview extends R2View { teams: R2Me[]; audit: R2AuditEntry[] }
export interface R2Result { success: boolean; message?: string; code?: string; status?: number }

const API = '/api/round2';

export function subscribeToAuctionChanges(onChange: () => void): () => void {
  if (typeof EventSource === 'undefined') return () => undefined;
  try {
    const source = new EventSource(apiUrl('/api/events/stream'), { withCredentials: true });
    source.addEventListener('ROUND2_AUCTION_CHANGED', onChange);
    // Native EventSource retries aggressively by default. Polling remains the
    // bounded fallback, so close failed streams and avoid reconnect storms.
    source.onerror = () => source.close();
    return () => source.close();
  } catch {
    return () => undefined;
  }
}

async function call<T extends { success: boolean; message?: string; code?: string; status?: number }>(path: string, method = 'GET', body?: unknown): Promise<T> {
  try {
    const res = await fetch(apiUrl(API + path), {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result = await res.json() as T;
    return res.ok ? result : { ...result, success: false, status: res.status };
  } catch {
    return { success: false, message: 'Cannot reach the auction server.' } as T;
  }
}

export const round2Service = {
  join: () => call<R2View>('/join', 'POST', {}),
  getState: () => call<R2View>('/state'),
  bid: (amount: number, requestId: string) => call<R2View>('/bid', 'POST', { amount, requestId }),
  admin: {
    overview: () => call<R2Overview>('/admin/overview'),
    start: (cardId: number, basePrice: number, durationSeconds: number) => call<R2Result>('/admin/start', 'POST', { cardId, basePrice, durationSeconds }),
    end: () => call<R2Result>('/admin/end', 'POST', {}),
    reset: () => call<R2Result>('/admin/reset', 'POST', {}),
    removeTeam: (name: string) => call<R2Result>(`/admin/team/${encodeURIComponent(name)}`, 'DELETE'),
  },
};
