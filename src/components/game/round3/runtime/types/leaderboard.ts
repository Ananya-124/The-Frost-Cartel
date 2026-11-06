export interface LeaderboardEntry {
  name: string;
  score: number;
}

/** Figures shown on the end screen. */
export interface EndSummary {
  teamName: string;
  totalScore: number;
  huntScores: [number, number, number];
  evidence: number;
  captures: number;
  bonus: number;
  penalties: number;
  rank: number;
  leaderboard: LeaderboardEntry[];
}
