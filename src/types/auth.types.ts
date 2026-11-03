import type { TeamSession } from './team.types';

export interface AuthResponse {
  success: boolean;
  message?: string;
  team?: TeamSession;
  token?: string;
}

export type ActivityEventType =
  | 'login'
  | 'round_start'
  | 'stage_open'
  | 'stage_completion'
  | 'stage_skip'
  | 'admin_movement'
  | 'round_completion';

export interface ActivityEvent {
  id: string;
  teamId: string;
  type: ActivityEventType;
  description: string;
  timestamp: string;
}

