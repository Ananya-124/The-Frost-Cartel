import type { PlayerIndex, RoleName, Timeline } from '../types';

export const ROLE_NAMES: readonly [RoleName, RoleName] = ['Archivist', 'Tracker'];
export const TIMELINES: readonly [Timeline, Timeline] = ['past', 'future'];
export const TIMELINE_INDEX: Record<Timeline, PlayerIndex> = { past: 0, future: 1 };

/** Breaker symbols (Past) and rune symbols (Future), indexed 0-3. */
export const BREAKER_SYMBOLS = ['AMBER', 'BLUE', 'RED', 'GREEN'] as const;
export const BREAKER_COLORS = ['#e0a030', '#4aa8ff', '#e04646', '#4fd070'] as const;
export const RUNES = ['◇', 'Δ', '○', '✕'] as const;

export const HUNT_COUNT = 3;

/** Size of the pre-rendered world canvases. */
export const WORLD_WIDTH = 1700;
export const WORLD_HEIGHT = 1100;

/** Room grid layout. */
export const ROOM_ORIGIN = { x: 60, y: 40 } as const;
export const ROOM_PITCH = { x: 400, y: 340 } as const;
export const ROOM_SIZE = { w: 300, h: 280 } as const;

/** Movement and interaction. */
export const PLAYER_SPEED = 150;
export const PLAYER_HALF_SIZE = 9;
export const DIAGONAL_FACTOR = 0.707;
export const INTERACT_RADIUS = 95;
export const MARK_RADIUS = 85;
export const GLOW_RADIUS = 170;
export const DOOR_MESSAGE_COOLDOWN = 2.5;
export const FOOTSTEP_INTERVAL = 0.34;

/** Timing. */
export const MAX_FRAME_DT = 0.05;
export const HUD_REFRESH_INTERVAL = 0.25;
export const HUNT_INTRO_FREEZE = 3.6;
export const HUNT_INTRO_VISIBLE_MS = 3300;
export const CAPTURE_FREEZE = 4;
export const NEXT_HUNT_DELAY_MS = 3600;
export const FIRST_DISTURBANCE_DELAY = 14;

/** Where both players start and where the Tracker wakes after being caught. */
export const ENTRANCE_ROOM = 'rec' as const;
export const PLAYER_SPAWN_OFFSETS: readonly [{ x: number; y: number }, { x: number; y: number }] = [
  { x: 110, y: 180 },
  { x: 190, y: 180 },
];

/** Entity behaviour. */
export const ENTITY = {
  count: 3,
  speedByHunt: [55, 72, 66] as const,
  tapeSpeed: 70,
  chaseSpeed: 82,
  surgeChaseSpeed: 120,
  chaseRange: 240,
  contactRadius: 22,
  teleportInterval: 13,
  teleportDistance: 190,
  teleportTimerBase: 8,
  teleportTimerStep: 3,
  trailInterval: 0.25,
  trailMaxPoints: 26,
  trailLifetime: 6,
  captureTargetOffset: { x: 150, y: 60 },
  captureRange: 140,
} as const;
