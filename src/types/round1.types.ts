import type { StageId } from './round.types';

export type StageProgressStatus =
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'not_configured';

export interface ScoreTransaction {
  id: string;
  teamId: string;
  stageId: StageId | 'round-1';
  type: 'stage_completion' | 'hint_deduction' | 'penalty_deduction' | 'admin_adjustment';
  deltaCredits: number;
  balanceAfter: number;
  reason: string;
  timestamp: string;
}

export interface StageProgress {
  stageId: StageId;
  status: StageProgressStatus;
  rewardCredits: number;
  earnedCredits: number;
  startTime: string | null;
  completionTime: string | null;
  activeTimeSeconds: number;
}

export interface Hotspot {
  id: string;
  name: string;
  targetId: string;
  xPercent: number; // 0 - 100
  yPercent: number; // 0 - 100
  widthPercent: number; // 0 - 100
  heightPercent: number; // 0 - 100
  svgPath?: string;
  originalX?: number;
  originalY?: number;
  originalWidth?: number;
  originalHeight?: number;
}

export interface HuntImage {
  id: string;
  title: string;
  imageUrl: string;
  orientationDeg: number;
  description: string;
  hotspots: Hotspot[];
  width?: number;
  height?: number;
}

export interface TargetItem {
  id: string;
  name: string;
  icon: string;
  isFound: boolean;
  foundInImageId?: string;
  foundAt?: string;
}

export interface Stage1Config {
  title: string;
  description: string;
  instructions: string;
  rewardCredits: number;
  isReadyForPublication: boolean;
  activityType: 'challenge_pending' | 'custom_riddle' | 'crypt_cipher' | 'skull_pumpkin_shuffle';
  /** Pumpkin Shuffle: the trials (pumpkins, tries, credits, shuffle length). Defaults live in stage1.constants.ts. */
  trials?: Stage1TrialConfig[];
  /** Pumpkin Shuffle: how long the skull is shown before it is hidden (default 3). */
  revealSeconds?: number;
}

export interface Stage1TrialConfig {
  pumpkins: number;
  tries: number;
  reward: number;
  shuffleSeconds: number;
}

export type Stage1TrialStatus = 'pending' | 'won' | 'lost';

export interface Stage1TrialState {
  attemptsUsed: number;
  status: Stage1TrialStatus;
  earnedCredits: number;
}

export interface Stage1State {
  trials: Stage1TrialState[];
}

export interface Stage2Config {
  title: string;
  description: string;
  rewardCredits: number;
  images: HuntImage[];
  targets: TargetItem[];
  hintDeduction: number;
  incorrectClickPenalty: number;
}

export interface BoneSlot {
  slotId: string;
  name: string;
  acceptedBoneId: string;
  placedBoneId: string | null;
}

export interface BoneItem {
  id: string;
  name: string;
  symbol: string;
  description: string;
}

export interface SoilLocation {
  id: string;
  name: string;
  inscriptionYear: number;
  isDug: boolean;
}

export interface RuneRing {
  id: string;
  name: string;
  symbols: string[];
  selectedIndex: number;
  correctSymbol: string;
}

export interface Stage3Config {
  title: string;
  description: string;
  rewardCredits: number;
  grave1: {
    clueFragment: string;
    bones: BoneItem[];
    slots: BoneSlot[];
    isCompleted: boolean;
  };
  grave2: {
    clueFragment: string;
    diaryExcerpt: string;
    soilLocations: SoilLocation[];
    correctCode: string;
    isCompleted: boolean;
  };
  grave3: {
    clueFragment: string;
    ruleText: string;
    runeRings: RuneRing[];
    isCompleted: boolean;
  };
  finalGate: {
    acceptedAnswer: string;
    isEscaped: boolean;
  };
  incorrectAnswerPenalty: number;
}

export interface Round1TeamSessionState {
  teamId: string;
  teamName: string;
  status: 'waiting' | 'active' | 'paused' | 'completed' | 'expired';
  currentStageId: StageId | 'dashboard';
  roundStartTime: string | null;
  roundDeadline: string | null;
  roundEndTime: string | null;
  totalDurationMinutes: number;
  credits: number;
  stages: Record<StageId, StageProgress>;
  scoreTransactions: ScoreTransaction[];
  stage1State: Stage1State;
  stage2State: {
    foundTargetIds: string[];
    usedHintsCount: number;
  };
  stage3State: {
    placedBoneSlots: Record<string, string>; // slotId -> boneId
    dugSoilIds: string[];
    grave2CofferUnlocked: boolean;
    grave3RingIndices: [number, number, number];
    grave3Unlocked: boolean;
    collectedFragments: string[];
    isGateUnlocked: boolean;
  };
  evidenceJournal: {
    grave1Fragment: string | null;
    grave2Fragment: string | null;
    grave3Fragment: string | null;
    notes: string[];
    unlockedCodes: string[];
  };
}

