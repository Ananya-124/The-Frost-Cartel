import type { CurrentRound, StageId, StageRecord } from './round.types';
import type { ActivityEvent } from './auth.types';

export type TeamStatus = 'waiting' | 'active' | 'paused' | 'completed';

export interface TeamSession {
  teamId: string;
  teamName: string;
  playerNumber?: 1 | 2;
  player1Name?: string;
  player2Name?: string;
  credits: number;
  currentRound: number;
  gameStatus: TeamStatus;
  loginTime: string;
}

export interface AdminTeam {
  id: string;
  name: string;
  passwordHash: string; // Stored securely/masked, never plaintext
  status: TeamStatus;
  currentRound: CurrentRound;
  currentStage: StageId | 'staged';
  roundStartTime: string | null;
  roundEndTime: string | null;
  stageStartTime: string | null;
  credits: number;
  stages: Record<StageId, StageRecord>;
  activityHistory: ActivityEvent[];
  createdAt: string;
}

