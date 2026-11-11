import type { Round3CardId } from '../constants/round3.cards';
import type { Round3RunState, Round3StateResponse, Round3Timeline } from '../types/round3.types';
import type { Hunt1ActionResult } from '../types/hunt1.types';
import type { Hunt2ActionResult } from '../types/hunt2.types';
import type { Hunt3ActionResult, Hunt3Actor, Hunt3State } from '../types/hunt3.types';
import { apiUrl } from './apiBaseUrl';

const API = '/api/round3';

async function call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(apiUrl(`${API}${path}`), {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json() as T & { message?: string };
  if (!response.ok) throw new Error(result.message ?? `Round 3 request failed (${response.status}).`);
  return result;
}

export const round3Service = {
  getRun: () => call<{ success: boolean; run: Round3RunState }>('/run'),
  startRun: () => call<{ success: boolean; run: Round3RunState }>('/run/start', 'POST', {}),
  pauseRun: () => call<{ success: boolean; run: Round3RunState | null }>('/run/pause', 'POST', {}),
  resumeRun: () => call<{ success: boolean; run: Round3RunState | null }>('/run/resume', 'POST', {}),
  openSession: () => call<Round3StateResponse>('/session', 'POST', {}),
  getState: () => call<Round3StateResponse>('/state'),
  setTimeline: (activeTimeline: Round3Timeline) => call<Round3StateResponse>('/progress', 'PATCH', { activeTimeline }),
  saveGameState: (gameState: unknown) => {
    const saved = gameState !== null && typeof gameState === 'object' ? gameState as { players?: unknown[]; flags?: unknown; huntIndex?: unknown; journal?: Array<{ huntIndex: number; timeline: string; title: string }> } : {};
    const huntNumber = Number.isInteger(saved.huntIndex) ? Math.max(1, Math.min(3, Number(saved.huntIndex) + 1)) : 1;
    return call<Round3StateResponse>('/progress', 'PATCH', {
      currentHunt: `paradox-hunt-${huntNumber}`,
      playerProgress: { engine: gameState },
      activeTimeline: 'past',
      evidenceDiscoveries: (saved.journal ?? []).map((clue) => `h${clue.huntIndex}-${clue.timeline}-${clue.title.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60)}`),
      timelines: {
        past: { player: saved.players?.[0] ?? null, flags: saved.flags ?? {}, huntIndex: saved.huntIndex ?? 0 },
        future: { player: saved.players?.[1] ?? null, flags: saved.flags ?? {}, huntIndex: saved.huntIndex ?? 0 },
      },
    });
  },
  discoverEvidence: (evidenceId: string) => call<{ success: boolean; evidenceDiscoveries: string[] }>(`/evidence/${encodeURIComponent(evidenceId)}/discover`, 'POST', {}),
  activateCard: (() => {
    const pending = new Map<string, Promise<{ success: boolean; usage: { remainingQuantity: number }; state: Round3StateResponse }>>();
    const requestIds = new Map<string, string>();
    const storageKey = (key: string) => `frost:round3:card-activation:${encodeURIComponent(key)}`;
    return (cardId: Round3CardId, source?: 'auction' | 'development' | 'admin') => {
      const key = `${cardId}:${source ?? 'any'}`;
      const current = pending.get(key);
      if (current) return current;
      let requestId: string;
      try { requestId = sessionStorage.getItem(storageKey(key)) ?? requestIds.get(key) ?? crypto.randomUUID(); }
      catch { requestId = requestIds.get(key) ?? crypto.randomUUID(); }
      requestIds.set(key, requestId);
      try { sessionStorage.setItem(storageKey(key), requestId); } catch { /* Server-side inventory remains authoritative. */ }
      const request = call<{ success: boolean; usage: { remainingQuantity: number }; state: Round3StateResponse }>(`/cards/${cardId}/activate`, 'POST', { source, requestId })
        .then((result) => {
          requestIds.delete(key);
          try { if (sessionStorage.getItem(storageKey(key)) === requestId) sessionStorage.removeItem(storageKey(key)); } catch { /* A stale id is safely deduplicated by the server. */ }
          return result;
        })
        .finally(() => pending.delete(key));
      pending.set(key, request);
      return request;
    };
  })(),
  loadDevelopmentSample: () => call<Round3StateResponse>('/development/sample-inventory', 'POST', {}),
  completeHunt: () => call<{ success: boolean; completed: boolean; completedAt: string }>('/complete', 'POST', {}),
  openHunt1Session: () => call<{ success: boolean; state: import('../types/hunt1.types').Hunt1State }>('/hunt1/session', 'POST', {}),
  getHunt1State: () => call<{ success: boolean; state: import('../types/hunt1.types').Hunt1State }>('/hunt1/state'),
  hunt1Action: (() => {
    const pending = new Map<string, { actionId: string; promise?: Promise<Hunt1ActionResult> }>();
    const storageKey = (key: string) => `frost:round3:hunt1:pending:${encodeURIComponent(key)}`;
    const readStoredId = (key: string) => {
      try { return typeof sessionStorage === 'undefined' ? undefined : sessionStorage.getItem(storageKey(key)) ?? undefined; }
      catch { return undefined; }
    };
    const storeId = (key: string, id: string) => {
      try { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(storageKey(key), id); }
      catch { /* the server remains the authority if browser storage is unavailable */ }
    };
    const clearStoredId = (key: string, id: string) => {
      try { if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(storageKey(key)) === id) sessionStorage.removeItem(storageKey(key)); }
      catch { /* a stale ID remains safe because the server deduplicates it */ }
    };
    return (action: { type: string; actor: string; objectId?: string; value?: unknown; actionId?: string }) => {
      const key = JSON.stringify({ type: action.type, actor: action.actor, objectId: action.objectId, value: action.value });
      const existing = pending.get(key);
      if (existing?.promise) return existing.promise;
      const actionId = action.actionId ?? existing?.actionId ?? readStoredId(key) ?? crypto.randomUUID();
      storeId(key, actionId);
      const promise = call<Hunt1ActionResult>('/hunt1/action', 'POST', { ...action, actionId })
        .then((result) => { if (pending.get(key)?.actionId === actionId) pending.delete(key); clearStoredId(key, actionId); return result; })
        .catch((error: unknown) => { pending.set(key, { actionId }); throw error; });
      // Keep the same ID after transport failures so a retry cannot duplicate a committed action.
      pending.set(key, { actionId, promise });
      return promise;
    };
  })(),
  openHunt2Session: () => call<{ success: boolean; state: import('../types/hunt2.types').Hunt2State }>('/hunt2/session', 'POST', { sharedView: true }),
  getHunt2State: () => call<{ success: boolean; state: import('../types/hunt2.types').Hunt2State }>('/hunt2/state?sharedView=true'),
  hunt2Action: (() => {
    const pending = new Map<string, { actionId: string; promise?: Promise<Hunt2ActionResult> }>();
    const storageKey = (key: string) => `frost:round3:hunt2:pending:${encodeURIComponent(key)}`;
    const readStoredId = (key: string) => {
      try { return typeof sessionStorage === 'undefined' ? undefined : sessionStorage.getItem(storageKey(key)) ?? undefined; }
      catch { return undefined; }
    };
    const storeId = (key: string, id: string) => {
      try { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(storageKey(key), id); }
      catch { /* server-side idempotency still protects actions */ }
    };
    const clearStoredId = (key: string, id: string) => {
      try { if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(storageKey(key)) === id) sessionStorage.removeItem(storageKey(key)); }
      catch { /* stale action IDs remain deduplicated on the server */ }
    };
    return (action: { type: string; actor: string; objectId?: string; value?: unknown; actionId?: string }) => {
      const key = JSON.stringify({ type: action.type, actor: action.actor, objectId: action.objectId, value: action.value });
      const existing = pending.get(key);
      if (existing?.promise) return existing.promise;
      const actionId = action.actionId ?? existing?.actionId ?? readStoredId(key) ?? crypto.randomUUID();
      storeId(key, actionId);
      const promise = call<Hunt2ActionResult>('/hunt2/action', 'POST', { ...action, actionId })
        .then((result) => { if (pending.get(key)?.actionId === actionId) pending.delete(key); clearStoredId(key, actionId); return result; })
        .catch((error: unknown) => { pending.set(key, { actionId }); throw error; });
      pending.set(key, { actionId, promise });
      return promise;
    };
  })(),
  openHunt3Session: () => call<{ success: boolean; state: Hunt3State }>('/hunt3/session', 'POST', { sharedView: true }),
  getHunt3State: () => call<{ success: boolean; state: Hunt3State }>('/hunt3/state?sharedView=true'),
  hunt3Action: (() => {
    const pending = new Map<string, { actionId: string; promise?: Promise<Hunt3ActionResult> }>();
    const storageKey = (key: string) => `frost:round3:hunt3:pending:${encodeURIComponent(key)}`;
    const readStoredId = (key: string) => {
      try { return typeof sessionStorage === 'undefined' ? undefined : sessionStorage.getItem(storageKey(key)) ?? undefined; }
      catch { return undefined; }
    };
    const storeId = (key: string, id: string) => {
      try { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(storageKey(key), id); }
      catch { /* server-side idempotency still protects actions */ }
    };
    const clearStoredId = (key: string, id: string) => {
      try { if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(storageKey(key)) === id) sessionStorage.removeItem(storageKey(key)); }
      catch { /* stale action IDs remain deduplicated on the server */ }
    };
    return (actor: Hunt3Actor, action: { type: string; id: string; value?: unknown; actionId?: string }) => {
      const key = JSON.stringify({ type: action.type, id: action.id, actor, value: action.value });
      const existing = pending.get(key);
      if (existing?.promise) return existing.promise;
      const actionId = action.actionId ?? existing?.actionId ?? readStoredId(key) ?? crypto.randomUUID();
      storeId(key, actionId);
      const promise = call<Hunt3ActionResult>('/hunt3/action', 'POST', { ...action, actor, actionId, sharedView: true })
        .then((result) => { if (pending.get(key)?.actionId === actionId) pending.delete(key); clearStoredId(key, actionId); return result; })
        .catch((error: unknown) => { pending.set(key, { actionId }); throw error; });
      pending.set(key, { actionId, promise });
      return promise;
    };
  })(),
};
