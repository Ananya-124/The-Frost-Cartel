import { DEFAULT_CARDS } from '../../config/cards';
import {
  ENTRANCE_ROOM,
  FIRST_DISTURBANCE_DELAY,
  PLAYER_SPAWN_OFFSETS,
  ROLE_NAMES,
  ROOM_SIZE,
  TIMELINES,
} from '../../config/constants';
import { ROOM_BY_ID } from '../../config/rooms';
import type { GameState, Player, PlayerIndex, PowerCard } from '../../types';
import { DOORS } from '../world/geometry';

/** Entrance position for one player. */
export function spawnPosition(index: PlayerIndex): { x: number; y: number } {
  const room = ROOM_BY_ID[ENTRANCE_ROOM];
  const offset = PLAYER_SPAWN_OFFSETS[index];
  return {
    x: room.x + (offset.x / 300) * ROOM_SIZE.w,
    y: room.y + (offset.y / 280) * ROOM_SIZE.h,
  };
}

function createPlayer(index: PlayerIndex): Player {
  const { x, y } = spawnPosition(index);
  return {
    index,
    role: ROLE_NAMES[index],
    timeline: TIMELINES[index],
    x,
    y,
    doorMessageUntil: 0,
    syncArmedAt: null,
  };
}

/** Fresh game state. Equivalent to the original `newG()`. */
export function createInitialState(
  teamName = 'Team',
  cards: readonly PowerCard[] = DEFAULT_CARDS,
): GameState {
  return {
    phase: 'menu',
    time: 0,
    freezeTimer: 0,
    huntIndex: 0,
    flags: {},
    completed: {},
    players: [createPlayer(0), createPlayer(1)],
    journal: [],
    cards: cards.map((c) => ({ ...c })),
    score: 0,
    bonus: 0,
    penalty: 0,
    huntScores: [0, 0, 0],
    captures: 0,
    entities: [],
    puzzles: [null, null],
    entityMarked: false,
    shields: 0,
    chronoSandTimer: 0,
    syncWindowBonus: 0,
    highlightedObjectId: null,
    highlightTimer: 0,
    forgiveness: 0,
    revealTimer: 0,
    surgeTimer: 0,
    contactCooldown: 0,
    distortion: 0,
    brownout: 0,
    apparitions: [],
    disturbanceTimer: FIRST_DISTURBANCE_DELAY,
    hudTimer: 0,
    footstepTimer: 0,
    teamName,
    messages: ['', ''],
    messageUntil: [0, 0],
    doorOpenMemory: [DOORS.map(() => false), DOORS.map(() => false)],
    journalOpen: [false, false],
    huntIntro: null,
    summary: null,
    dirty: true,
  };
}
