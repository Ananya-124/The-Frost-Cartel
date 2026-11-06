import type { Round3CardDefinition, Round3CardId } from '../constants/round3.cards';

export type Round3Timeline = 'past' | 'future';
export type Round3InventorySource = 'auction' | 'development';

export interface Round3InventoryItem {
  cardId: Round3CardId;
  quantity: number;
  source: Round3InventorySource;
}

export interface Round3SessionState {
  teamId: string;
  teamName: string;
  currentHunt: string;
  playerProgress: Record<string, unknown>;
  timelines: Record<Round3Timeline, Record<string, unknown>>;
  activeTimeline: Round3Timeline;
  evidenceDiscoveries: string[];
  cardUsage: Array<{ cardId: Round3CardId; usedAt: string; remainingQuantity: number }>;
  score: number;
  completed: boolean;
  completedAt: string | null;
  updatedAt: string;
}

export interface Round3StateResponse {
  success: boolean;
  session: Round3SessionState;
  inventory: Round3InventoryItem[];
  cards: readonly Round3CardDefinition[];
}
