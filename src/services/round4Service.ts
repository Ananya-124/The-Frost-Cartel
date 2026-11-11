import type { ClueStep, ExpeditionProgress, Round4AdminOverview, WinnerRecord } from '../types/round4Expedition.types';
import { apiUrl } from './apiBaseUrl';

export interface Round4Status {
  success: true;
  qualified: boolean;
  isReleased: boolean;
  assignedRouteId: string | null;
  routeNumber?: number;
  romanNumeral?: string;
  routeName?: string;
  winner: WinnerRecord | null;
  message?: string;
}

export interface AuthoritativeRouteState {
  success: true;
  route: { routeId: string; routeNumber: number; romanNumeral: string; routeName: string; routeSubtitle: string };
  progress: {
    currentStepIndex: number;
    targetDiscovered: boolean;
    solvedStepIds: string[];
    commonRoomArrived: boolean;
    isFinished: boolean;
    finishedAt: string | null;
  };
  activeStep: (Omit<ClueStep, 'acceptedCodes'> & { isCommonFinal: boolean; physicalEntryInstructions?: string }) | null;
  totalSteps: number;
  winner: WinnerRecord | null;
  isWinner: boolean;
}

export interface Round4ActionResult {
  success: boolean;
  message: string;
  state?: AuthoritativeRouteState;
  isWinner?: boolean;
  raceClosed?: boolean;
  winner?: WinnerRecord;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...(init?.headers ?? {}) },
  });
  const data = await response.json().catch(() => ({})) as { message?: string } & T;
  if (!response.ok) {
    const error = new Error(data.message ?? `Round 04 request failed (${response.status}).`);
    Object.assign(error, { status: response.status });
    throw error;
  }
  return data;
}

function requestId(): string {
  return crypto.randomUUID();
}

class Round4Service {
  private readonly listeners = new Set<(progress: ExpeditionProgress) => void>();
  private readonly winnerListeners = new Set<(winner: WinnerRecord | null) => void>();
  private currentWinner: WinnerRecord | null = null;
  private readonly pendingIds = new Map<string, string>();

  constructor() {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        const source = new EventSource(apiUrl('/api/events/stream'), { withCredentials: true });
        source.addEventListener('ROUND4_WINNER_DECLARED', (event: MessageEvent) => {
          try { this.publishWinner(JSON.parse(event.data).winner ?? null); } catch { /* Ignore malformed event payloads. */ }
        });
        source.addEventListener('ROUND4_RESET', () => this.publishWinner(null));
      } catch {
        // API polling remains available when the event stream cannot connect.
      }
    }
  }

  private publishWinner(winner: WinnerRecord | null): void {
    this.currentWinner = winner;
    this.winnerListeners.forEach((listener) => listener(winner));
  }

  private publishState(state: AuthoritativeRouteState): ExpeditionProgress {
    const progress: ExpeditionProgress = {
      teamId: '',
      activeRouteId: state.route.routeId,
      activeStepIndex: state.progress.currentStepIndex,
      targetDiscovered: state.progress.targetDiscovered,
      solvedStepIds: state.progress.solvedStepIds,
      completedRouteIds: state.progress.isFinished ? [state.route.routeId] : [],
      lastUpdated: state.progress.finishedAt ?? new Date().toISOString(),
    };
    this.listeners.forEach((listener) => listener(progress));
    if (state.winner) this.publishWinner(state.winner);
    return progress;
  }

  async getStatus(): Promise<Round4Status> {
    const status = await request<Round4Status>('/api/round4/status');
    if (status.winner !== undefined) this.publishWinner(status.winner);
    return status;
  }

  getAdminOverview(): Promise<Round4AdminOverview & { success: true }> {
    return request('/api/round4/admin/overview');
  }

  setAdminRelease(isReleased: boolean): Promise<{ success: true; isReleased: boolean }> {
    return request('/api/round4/admin/release', { method: 'POST', body: JSON.stringify({ isReleased }) });
  }

  resetAdminTournament(): Promise<{ success: true; message: string }> {
    return request('/api/round4/admin/reset-tournament', { method: 'POST' });
  }

  qualifyAdminTeams(assignments: Array<{ teamId: string; routeId: string }>): Promise<{ success: true; message: string }> {
    return request('/api/round4/admin/qualify-teams', { method: 'POST', body: JSON.stringify({ assignments }) });
  }

  configureAdminStep(configuration: Record<string, unknown>): Promise<{ success: true; message: string }> {
    return request('/api/round4/admin/configure-step', { method: 'POST', body: JSON.stringify(configuration) });
  }

  async fetchMyRouteState(): Promise<AuthoritativeRouteState> {
    const state = await request<AuthoritativeRouteState>('/api/round4/my-route');
    this.publishState(state);
    return state;
  }

  async markTargetDiscovered(): Promise<AuthoritativeRouteState> {
    const key = 'discover-target';
    const id = this.pendingIds.get(key) ?? requestId();
    this.pendingIds.set(key, id);
    const result = await request<{ state?: AuthoritativeRouteState }>('/api/round4/discover-target', { method: 'POST', body: JSON.stringify({ requestId: id }) });
    this.pendingIds.delete(key);
    return result.state ? (this.publishState(result.state), result.state) : this.fetchMyRouteState();
  }

  async submitAnswer(stepId: string, rawAnswer: string): Promise<Round4ActionResult> {
    const key = `answer:${stepId}:${rawAnswer.trim().toUpperCase()}`;
    const id = this.pendingIds.get(key) ?? requestId();
    this.pendingIds.set(key, id);
    try {
      const result = await request<{ success: boolean; message: string; isWinner?: boolean; raceClosed?: boolean; winner?: WinnerRecord; state?: AuthoritativeRouteState }>(
        '/api/round4/submit-clue',
        { method: 'POST', body: JSON.stringify({ stepId, answer: rawAnswer, requestId: id }) },
      );
      this.pendingIds.delete(key);
      if (!result.success) return result;
      if (result.winner) this.publishWinner(result.winner);
      if (result.state) return { ...result, state: result.state };
      try {
        const state = await this.fetchMyRouteState();
        return { ...result, state };
      } catch {
        return { ...result, message: `${result.message} The server accepted it; refresh Round 04 state before continuing.` };
      }
    } catch (error) {
      // Keep the request ID for a retry after a network failure; the server may have committed it.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return { success: false, message: 'Network unavailable. Retry when connected; the same request will be safely replayed.' };
      }
      return { success: false, message: error instanceof Error ? error.message : 'Answer submission failed. Please retry.' };
    }
  }

  getWinner(): WinnerRecord | null { return this.currentWinner; }
  subscribe(listener: (progress: ExpeditionProgress) => void): () => void {
    this.listeners.add(listener); return () => { this.listeners.delete(listener); };
  }
  subscribeWinner(listener: (winner: WinnerRecord | null) => void): () => void {
    this.winnerListeners.add(listener); return () => { this.winnerListeners.delete(listener); };
  }
}

export const round4Service = new Round4Service();
