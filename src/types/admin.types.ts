import type { Round1Status } from './round.types';

export interface DashboardMetrics {
  totalTeams: number;
  waitingTeams: number;
  activeTeams: number;
  completedTeams: number;
  pausedTeams: number;
  round1Status: Round1Status;
  totalActiveSessions: number;
}
