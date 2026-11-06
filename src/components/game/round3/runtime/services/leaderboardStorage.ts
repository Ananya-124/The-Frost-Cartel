import {
  LEADERBOARD_SIZE,
  LEADERBOARD_STORAGE_KEY,
} from '../config/scoring';
import type { LeaderboardEntry } from '../types';

/** Storage keeps the original compact format: { n: name, s: score }. */
interface StoredEntry {
  n: string;
  s: number;
}

const isStoredEntry = (v: unknown): v is StoredEntry =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as StoredEntry).n === 'string' &&
  typeof (v as StoredEntry).s === 'number';

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(LEADERBOARD_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(isStoredEntry).map((e) => ({ name: e.n, score: e.s }));
  } catch {
    return [];
  }
}

function saveLeaderboard(entries: readonly LeaderboardEntry[]): void {
  try {
    const stored: StoredEntry[] = entries.map((e) => ({ n: e.name, s: e.score }));
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* storage unavailable: the board is simply not kept */
  }
}

/** Adds a result, keeps the top entries, and reports the team's rank. */
export function recordScore(
  name: string,
  score: number,
): { entries: LeaderboardEntry[]; rank: number } {
  const all = loadLeaderboard();
  all.push({ name, score });
  all.sort((a, b) => b.score - a.score);
  const rank = all.findIndex((e) => e.name === name && e.score === score) + 1;
  const entries = all.slice(0, LEADERBOARD_SIZE);
  saveLeaderboard(entries);
  return { entries, rank };
}
