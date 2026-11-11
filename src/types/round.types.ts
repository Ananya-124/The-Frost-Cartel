export type Round1Status = 'not_started' | 'running' | 'paused' | 'completed';

export type CurrentRound = 'Round 1' | 'Round 2' | 'Round 3' | 'Round 4';

export type StageId = 'stage-1' | 'stage-2' | 'stage-3';

export type StageStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface StageRecord {
  stageId: StageId;
  name: string;
  rewardCredits: number;
  earnedCredits: number;
  status: StageStatus;
  startTime: string | null;
  endTime: string | null;
}

export interface RoundConfig {
  id: string;
  number: string;
  title: string;
  tagline: string;
  statusText: string;
  statusBadge: 'active' | 'upcoming' | 'locked' | 'completed';
  duration: string;
  bounty: string;
  teamFormat: string;
  description: string;
  imageSrc: string;
  actionText: string;
  isAccessible: boolean;
}

