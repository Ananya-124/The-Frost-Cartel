export type ProgressStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
import { apiUrl, setStoredToken, clearStoredToken } from './apiBaseUrl';
export type ProgressEntity = 'ROUND' | 'HUNT';
export type ProgressAction = 'unlock' | 'lock' | 'complete' | 'reset';

export interface RoundProgress { round_id: number; status: ProgressStatus; eligible_at: string | null; completed_at: string | null }
export interface HuntProgress { hunt_id: number; status: ProgressStatus; completed_at: string | null }
export interface ProgressAudit { id: number; entity_type: ProgressEntity; entity_id: number; action_performed: string; previous_state: string | null; new_state: string; reason: string | null; created_at: string; admin_id: string | null }
export interface TeamProgression { teamId: string; rounds: RoundProgress[]; hunts: HuntProgress[]; audit?: ProgressAudit[] }
export interface ServerTeamOption { id: string; teamName: string }
const REQUEST_TIMEOUT_MS = 15_000;

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(apiUrl(path), {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({})) as { message?: string } & T;
    if (!response.ok) {
      const error = new Error(data.message ?? `Progression request failed (${response.status}).`);
      Object.assign(error, { status: response.status });
      throw error;
    }
    return data;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Progression request timed out. Retry to check your access again.');
    if (error instanceof Error && error.name === 'TypeError') throw new Error('Could not reach the progression server. Retry to check your access again.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const progressionService = {
  getMine: () => request<{ success: true } & TeamProgression>('/api/progression/me'),
  startRound: (roundId: number) => request<{ success: true } & TeamProgression>(`/api/progression/me/rounds/${roundId}/start`, 'POST', {}),
  getAdminTeam: (teamId: string) => request<{ success: true } & TeamProgression>(`/api/admin/progression/${encodeURIComponent(teamId)}`),
  getAdminTeams: async (): Promise<ServerTeamOption[]> => {
    const result = await request<{ success: true; teams: ServerTeamOption[] }>('/api/admin/teams');
    return result.teams.map(({ id, teamName }) => ({ id, teamName }));
  },
  adminAction: (teamId: string, entity: ProgressEntity, entityId: number, action: ProgressAction, reason?: string) =>
    request<{ success: true } & TeamProgression>(`/api/admin/progression/${encodeURIComponent(teamId)}/${entity}/${entityId}/${action}`, 'POST', { reason }),
  adminRound2Global: (action: 'unlock' | 'lock' | 'reset', reason?: string) =>
    request<{ success: true; action: string; isActive: boolean; updatedCount: number }>(`/api/admin/progression/round2/${action}`, 'POST', { reason }),
  adminRound3Global: (action: 'advance' | 'unlock' | 'lock', reason?: string) =>
    request<{ success: true; action: string; isActive: boolean; updatedCount: number; cardsSynced: number }>(`/api/admin/progression/round3/${action}`, 'POST', { reason }),
  adminRound4Global: (action: 'advance' | 'unlock' | 'lock', reason?: string) =>
    request<{ success: true; action: string; isActive: boolean; updatedCount: number }>(`/api/admin/progression/round4/${action}`, 'POST', { reason }),
  adminAdvanceTeam: (teamId: string, roundId: number, reason?: string) =>
    request<{ success: true; teamId: string; roundId: number } & TeamProgression>(`/api/admin/progression/teams/${encodeURIComponent(teamId)}/advance/${roundId}`, 'POST', { reason }),
  adminResetAllTeamsProgress: (reason?: string) =>
    request<{ success: true; message: string; resetCount: number }>('/api/admin/progression/reset-all', 'POST', { reason }),
};

export const adminAuthService = {
  async login(username: string, password: string): Promise<{ username: string; mustChangePassword: boolean }> {
    const result = await request<{ success: true; token?: string; admin: { username: string; mustChangePassword: boolean } }>('/api/admin/login', 'POST', { username, password });
    if (result.token) {
      setStoredToken('admin', result.token);
    }
    return result.admin;
  },
  async validate(): Promise<boolean> {
    const response = await fetch(apiUrl('/api/admin/dashboard'), { credentials: 'include' });
    return response.ok;
  },
  async logout(): Promise<void> {
    clearStoredToken('admin');
    await request('/api/admin/logout', 'POST', {});
  },
};

export function errorStatus(error: unknown): number | undefined {
  return error && typeof error === 'object' && 'status' in error ? Number((error as { status: unknown }).status) : undefined;
}
