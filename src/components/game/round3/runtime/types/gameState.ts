import type { PowerCard } from './cards';
import type { Entity } from './entity';
import type { FlagSet } from './flags';
import type { ClueRecord, HuntIndex } from './investigation';
import type { EndSummary } from './leaderboard';
import type { Player, PlayerIndex } from './player';
import type { ActivePuzzle } from './puzzle';

export type GamePhase = 'menu' | 'playing' | 'ended';

/** A fleeting silhouette shown to one player as a scare. */
export interface Apparition {
  playerIndex: PlayerIndex;
  x: number;
  y: number;
  t: number;
}

/** The single shared state both players read and write. Replaces the global `G`. */
export interface GameState {
  phase: GamePhase;
  /** Elapsed game time in seconds. */
  time: number;
  /** While above zero, gameplay is frozen (cinematics, capture freeze). */
  freezeTimer: number;
  huntIndex: HuntIndex;
  flags: FlagSet;
  /** Keys of one-time events (scoring and clues already awarded). */
  completed: Record<string, true>;
  players: [Player, Player];
  /** One journal shared by both players. */
  journal: ClueRecord[];
  cards: PowerCard[];
  score: number;
  bonus: number;
  penalty: number;
  huntScores: [number, number, number];
  captures: number;
  entities: Entity[];
  puzzles: [ActivePuzzle | null, ActivePuzzle | null];
  entityMarked: boolean;
  shields: number;
  chronoSandTimer: number;
  revealTimer: number;
  surgeTimer: number;
  contactCooldown: number;
  distortion: number;
  brownout: number;
  apparitions: Apparition[];
  disturbanceTimer: number;
  /** Hunt 2 deception hides a false manifestation/anchor for a short local timer. */
  hunt2HiddenInteractablesUntil?: Record<string, number>;
  hunt2ObjectPositions?: Record<string, { x: number; y: number }>;
  hunt2ObjectStates?: Record<string, string>;
  hunt2Subtasks?: Record<string, boolean>;
  hunt2OpenedInteractables?: string[];
  hudTimer: number;
  footstepTimer: number;
  teamName: string;
  /** Latest on-screen message for each player. */
  messages: [string, string];
  /** Game time at which each message disappears. */
  messageUntil: [number, number];
  /** Last known open/closed state of each door per timeline, used to play door sounds. */
  doorOpenMemory: [boolean[], boolean[]];
  journalOpen: [boolean, boolean];
  /** Hunt whose intro cinematic is showing, or null. */
  huntIntro: HuntIndex | null;
  summary: EndSummary | null;
  /** Set whenever something the UI shows has changed. */
  dirty: boolean;
}
