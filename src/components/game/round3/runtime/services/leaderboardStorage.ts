import type { LeaderboardEntry } from '../types';
import { apiUrl } from '../../../../../services/apiBaseUrl';

interface ApiLeaderboardEntry extends LeaderboardEntry {
  team_id: string;
  team_name: string;
  rank: number;
}

/** Reads official score and rank data from the shared PostgreSQL leaderboard. */
export async function loadLeaderboard(): Promise<ApiLeaderboardEntry[]> {
  const response = await fetch(apiUrl('/api/leaderboard'), { credentials: 'include' });
  const body = await response.json().catch(() => ({})) as { success?: boolean; leaderboard?: ApiLeaderboardEntry[]; message?: string };
  if (!response.ok || body.success !== true || !Array.isArray(body.leaderboard)) {
    throw new Error(body.message ?? `Official leaderboard unavailable (${response.status}).`);
  }
  return body.leaderboard;
}
