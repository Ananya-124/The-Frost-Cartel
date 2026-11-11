import { apiUrl } from './apiBaseUrl';
import type { Round1TeamSessionState, Stage1Config, Stage2Config, Stage3Config } from '../types/round1.types';

export interface Round1StateResponse {
  success: true;
  round: { id: number; name: string; isActive: boolean; totalDurationSeconds: number; remainingSeconds: number };
  team: { score: number; totalCredits: number; maxCredits: number; isPaused: boolean };
  session: Round1TeamSessionState;
  config: { stage1: Stage1Config; stage2: Stage2Config; stage3: Stage3Config };
}

export interface Round1ActionResponse {
  success: boolean;
  duplicate?: boolean;
  message?: string;
  session: Round1TeamSessionState;
  score: number;
  completed: boolean;
  [key: string]: unknown;
}

const pendingActions = new Map<string, { id: string; promise?: Promise<Round1ActionResponse> }>();
const REQUEST_TIMEOUT_MS = 15_000;
let pendingStateRequest: Promise<Round1StateResponse> | null = null;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = performance.now();
  let status = 0;
  try {
    const response = await fetch(apiUrl(path), {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      signal: controller.signal,
    });
    status = response.status;
    const body = await response.json().catch(() => ({})) as { message?: string };
    if (response.status === 401 || response.status === 403) {
      throw new Error(response.status === 401 ? 'Your session has expired. Sign in again to continue.' : body.message ?? 'You are not authorized to perform this action.');
    }
    if (!response.ok) throw new Error(body.message ?? `Round 1 request failed (${response.status}).`);
    return body as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Round 1 request timed out. Check your connection and retry.');
    if (error instanceof Error && error.name === 'TypeError') throw new Error('Could not reach the Round 1 server. Check your connection and retry.');
    throw error;
  } finally {
    clearTimeout(timeout);
    if (import.meta.env.DEV) console.debug(`[Round 1 timing] ${init?.method ?? 'GET'} ${path} ${Math.round(performance.now() - startedAt)}ms status=${status || 'network-error'}`);
  }
}

export const round1Api = {
  getState: () => {
    if (pendingStateRequest) return pendingStateRequest;
    const current = request<Round1StateResponse>('/api/round1/state');
    pendingStateRequest = current;
    void current.finally(() => { if (pendingStateRequest === current) pendingStateRequest = null; }).catch(() => undefined);
    return current;
  },
  action: (type: string, fields: Record<string, unknown> = {}) => {
    const key = `${type}:${JSON.stringify(fields)}`;
    const existing = pendingActions.get(key);
    if (existing?.promise) return existing.promise;
    const actionId = existing?.id ?? crypto.randomUUID();
    const entry = { id: actionId, promise: undefined as Promise<Round1ActionResponse> | undefined };
    const promise = request<Round1ActionResponse>('/api/round1/actions', {
      method: 'POST', body: JSON.stringify({ actionId, type, ...fields }),
    }).then((result) => { pendingActions.delete(key); return result; }).catch((error: unknown) => {
      entry.promise = undefined;
      throw error;
    });
    // Retain this ID after a network failure so a manual retry is idempotent.
    entry.promise = promise;
    pendingActions.set(key, entry);
    return promise;
  },
  adminConfig: () => request<{ success: true; configuration: { durationMinutes: number; lifecycle?: 'not_started' | 'running' | 'paused' | 'completed'; stage1: Stage1Config; stage2: Stage2Config; stage3: Stage3Config } }>('/api/round1/admin/config'),
  updateAdminConfig: (group: 'duration' | 'stage1' | 'stage2' | 'stage3', patch: Record<string, unknown>) => request('/api/round1/admin/config/' + group, {
    method: 'PATCH', body: JSON.stringify(patch),
  }),
  timer: (action: 'start' | 'pause' | 'resume' | 'end') => request(`/api/round1/admin/timer/${action}`, { method: 'POST', body: '{}' }),
};
