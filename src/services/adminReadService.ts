import type { AdminTeam, DashboardMetrics, Round1Status, StageId, StageRecord, TeamStatus } from '../types/admin';
import { STAGE_NAMES } from '../types/admin';
import { apiUrl } from './apiBaseUrl';

type ApiStage = { stage_id: number; status: string; score: number; max_score: number; completed_at: string | null };
type ApiRound = { roundId: number; status: string; completedAt?: string | null };
type ApiTeam = {
  id: string; teamName: string; isPaused: boolean; score: number; maxCredits: number; totalCredits: number;
  loginCount: number; lastLoginAt: string | null; createdAt: string; stages: ApiStage[]; rounds: ApiRound[];
  hunts: unknown[]; round4: unknown;
};
type ApiResult = { id: string; teamName: string; score: number; rank: number; maxCredits: number; last_login_at: string | null; completedStages: number };
type ApiLeaderboardEntry = { team_id: string; team_name: string; score: number; rank: number; updated_at: string };

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({})) as { message?: string } & T;
  if (!response.ok) {
    const error = new Error(data.message ?? `Request failed (${response.status}).`);
    Object.assign(error, { status: response.status });
    throw error;
  }
  return data;
}

function mapTeam(team: ApiTeam): AdminTeam & { officialScore: number } {
  const stages = {} as Record<StageId, StageRecord>;
  const stagesById = new Map(team.stages.map((stage) => [stage.stage_id, stage]));
  (['stage-1', 'stage-2', 'stage-3'] as const).forEach((stageId, index) => {
    const source = stagesById.get(index + 1);
    const status = source?.status?.toLowerCase();
    stages[stageId] = {
      stageId,
      name: STAGE_NAMES[stageId],
      rewardCredits: source?.max_score ?? 0,
      earnedCredits: source?.score ?? 0,
      status: status === 'completed' ? 'completed' : status === 'in_progress' ? 'in_progress' : status === 'skipped' ? 'skipped' : 'not_started',
      startTime: null,
      endTime: source?.completed_at ?? null,
    };
  });

  const round1 = team.rounds.find((round) => round.roundId === 1);
  const currentRound = team.rounds.find((round) => round.status === 'IN_PROGRESS' || round.status === 'AVAILABLE');
  const activeStage = (Object.values(stages).find((stage) => stage.status === 'in_progress')?.stageId ?? 'staged') as StageId | 'staged';
  const status: TeamStatus = team.isPaused ? 'paused' : round1?.status === 'COMPLETED' ? 'completed' : round1?.status === 'IN_PROGRESS' ? 'active' : 'waiting';

  return {
    id: team.id,
    name: team.teamName,
    passwordHash: '',
    status,
    currentRound: currentRound ? `Round ${currentRound.roundId}` as AdminTeam['currentRound'] : 'Round 1',
    currentStage: activeStage,
    roundStartTime: null,
    roundEndTime: round1?.completedAt ?? null,
    stageStartTime: null,
    credits: team.totalCredits,
    officialScore: team.score,
    stages,
    activityHistory: [],
    createdAt: team.createdAt,
  };
}

export const adminReadService = {
  async getTeams(): Promise<AdminTeam[]> {
    const result = await request<{ success: true; teams: ApiTeam[] }>('/api/admin/teams');
    return result.teams.map(mapTeam);
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [dashboard, teams, roundConfig] = await Promise.all([
      request<{ success: true; data: { stats: { totalTeams: number; activeTeams: number; pausedTeams: number; round1Active: boolean } } }>('/api/admin/dashboard'),
      this.getTeams(),
      request<{ success: true; configuration: { lifecycle?: Round1Status } }>('/api/round1/admin/config'),
    ]);
    const completedTeams = teams.filter((team) => team.status === 'completed').length;
    const activeTeams = dashboard.data.stats.activeTeams;
    const pausedTeams = dashboard.data.stats.pausedTeams;
    const waitingTeams = Math.max(0, dashboard.data.stats.totalTeams - completedTeams - activeTeams - pausedTeams);
    return {
      totalTeams: dashboard.data.stats.totalTeams,
      waitingTeams,
      activeTeams,
      completedTeams,
      pausedTeams,
      round1Status: roundConfig.configuration.lifecycle ?? (dashboard.data.stats.round1Active ? 'running' : 'not_started'),
      totalActiveSessions: activeTeams + pausedTeams,
    };
  },

  async getResults(): Promise<Array<AdminTeam & { officialScore: number; rank: number }>> {
    const [result, teams] = await Promise.all([
      request<{ success: true; results: ApiResult[] }>('/api/admin/results'),
      this.getTeams(),
    ]);
    const byId = new Map(teams.map((team) => [team.id, team]));
    return result.results.map((row) => {
      const team = byId.get(row.id);
      const base = team ?? mapTeam({ id: row.id, teamName: row.teamName, isPaused: false, score: row.score, maxCredits: row.maxCredits,
        totalCredits: 0, loginCount: 0, lastLoginAt: row.last_login_at, createdAt: '', stages: [], rounds: [], hunts: [], round4: null });
      return { ...base, officialScore: row.score, rank: row.rank };
    });
  },

  async getLeaderboard(): Promise<ApiLeaderboardEntry[]> {
    const result = await request<{ success: true; leaderboard: ApiLeaderboardEntry[] }>('/api/leaderboard');
    return result.leaderboard;
  },

  createTeam: (teamName: string, password: string) =>
    request<{ success: true; team: { id: string; teamName: string; password: string } }>('/api/admin/teams', 'POST', { teamName, password }),
  renameTeam: (teamId: string, teamName: string) =>
    request<{ success: true; message: string }>(`/api/admin/teams/${encodeURIComponent(teamId)}`, 'PUT', { teamName }),
  setTeamPaused: (teamId: string, isPaused: boolean) =>
    request<{ success: true; isPaused: boolean }>(`/api/admin/teams/${encodeURIComponent(teamId)}/pause`, 'POST', { isPaused }),
  resetTeamPassword: (teamId: string) =>
    request<{ success: true; newPassword: string }>(`/api/admin/teams/${encodeURIComponent(teamId)}/reset-password`, 'POST', {}),
  deleteTeam: (teamId: string) =>
    request<{ success: true; message: string }>(`/api/admin/teams/${encodeURIComponent(teamId)}`, 'DELETE'),
};

export type { ApiLeaderboardEntry };
