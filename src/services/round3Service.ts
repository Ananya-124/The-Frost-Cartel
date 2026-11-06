import type { Round3CardId } from '../constants/round3.cards';
import type { Round3RunState, Round3StateResponse, Round3Timeline } from '../types/round3.types';
import type { Hunt1ActionResult } from '../types/hunt1.types';
import type { Hunt2ActionResult } from '../types/hunt2.types';
import type { Hunt3ActionResult, Hunt3Actor, Hunt3State } from '../types/hunt3.types';

const API = `${import.meta.env.VITE_API_URL ?? ''}/api/round3`;

async function call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${API}${path}`, {
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
  activateCard: (cardId: Round3CardId, source?: 'auction' | 'development') => call<{ success: boolean; state: Round3StateResponse }>(`/cards/${cardId}/activate`, 'POST', { source }),
  loadDevelopmentSample: () => call<Round3StateResponse>('/development/sample-inventory', 'POST', {}),
  completeHunt: () => call<{ success: boolean; completed: boolean; completedAt: string }>('/complete', 'POST', {}),
  openHunt1Session: () => call<{ success: boolean; state: import('../types/hunt1.types').Hunt1State }>('/hunt1/session', 'POST', {}),
  getHunt1State: () => call<{ success: boolean; state: import('../types/hunt1.types').Hunt1State }>('/hunt1/state'),
  hunt1Action: (action: { type: string; actor: string; objectId?: string; value?: unknown }) =>
    call<Hunt1ActionResult>('/hunt1/action', 'POST', action),
  openHunt2Session: () => call<{ success: boolean; state: import('../types/hunt2.types').Hunt2State }>('/hunt2/session', 'POST', {}),
  getHunt2State: () => call<{ success: boolean; state: import('../types/hunt2.types').Hunt2State }>('/hunt2/state'),
  hunt2Action: (action: { type: string; actor: string; objectId?: string; value?: unknown }) =>
    call<Hunt2ActionResult>('/hunt2/action', 'POST', action),
  openHunt3Session: () => call<{ success: boolean; state: Hunt3State }>('/hunt3/session', 'POST', {}),
  getHunt3State: () => call<{ success: boolean; state: Hunt3State }>('/hunt3/state'),
  hunt3Action: (actor: Hunt3Actor, action: { type: string; id: string; value?: unknown }) =>
    call<Hunt3ActionResult>('/hunt3/action', 'POST', { ...action, actor }),
};
