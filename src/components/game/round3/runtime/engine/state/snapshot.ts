import { getHunt } from '../../config/hunts';
import { ROOMS } from '../../config/rooms';
import type {
  ActivePuzzle,
  ClueRecord,
  EndSummary,
  GamePhase,
  GameState,
  PlayerIndex,
  PowerCard,
  RoleName,
  Timeline,
} from '../../types';
import { findNearTarget } from '../interaction/nearby';
import { getObjective } from '../hunts/missionTracker';
import { pointInRect } from '../world/geometry';

export interface PlayerPanelView {
  index: PlayerIndex;
  role: RoleName;
  timeline: Timeline;
  roomName: string;
  objective: string;
  partnerArmed: boolean;
  prompt: string;
  message: string;
  puzzle: ActivePuzzle | null;
  journalOpen: boolean;
}

export interface HuntIntroView {
  numeral: string;
  title: string;
  premise: string;
}

/** Immutable copy of what React needs. Rebuilt whenever the engine emits. */
export interface UiSnapshot {
  phase: GamePhase;
  teamName: string;
  score: number;
  huntNumber: number;
  huntTitle: string;
  /** Weakness, Entity, Past node, Future node. */
  readiness: readonly [boolean, boolean, boolean, boolean];
  cards: PowerCard[];
  journal: ClueRecord[];
  players: [PlayerPanelView, PlayerPanelView];
  huntIntro: HuntIntroView | null;
  summary: EndSummary | null;
}

function clonePuzzle(puzzle: ActivePuzzle | null): ActivePuzzle | null {
  if (!puzzle) return null;
  return puzzle.kind === 'sequence' ? { ...puzzle, input: [...puzzle.input] } : { ...puzzle };
}

function buildPlayerView(state: GameState, index: PlayerIndex): PlayerPanelView {
  const player = state.players[index];
  const room = ROOMS.find((r) => pointInRect(player.x, player.y, r));
  const target = state.puzzles[index] ? null : findNearTarget(state, index);
  const readyToCapture = !!(state.flags.pastNodeReady && state.flags.futureNodeReady && state.flags.tape);
  const other = state.players[index === 0 ? 1 : 0];
  return {
    index,
    role: player.role,
    timeline: player.timeline,
    roomName: room ? room.name : 'Corridor',
    objective: getObjective(state, player.timeline),
    partnerArmed: readyToCapture && other.syncArmedAt !== null,
    prompt: state.phase === 'playing' && target ? target.text : '',
    message: state.messages[index],
    puzzle: clonePuzzle(state.puzzles[index]),
    journalOpen: state.journalOpen[index],
  };
}

export function buildSnapshot(state: GameState): UiSnapshot {
  const hunt = getHunt(state.huntIndex);
  const intro = state.huntIntro === null ? null : getHunt(state.huntIntro);
  const f = state.flags;
  return {
    phase: state.phase,
    teamName: state.teamName,
    score: state.score,
    huntNumber: state.huntIndex + 1,
    huntTitle: hunt.title,
    readiness: [
      !!(f.pastVerified && f.futureVerified),
      state.entityMarked && !!f.tape,
      !!f.pastNodeReady,
      !!f.futureNodeReady,
    ],
    cards: state.cards.map((c) => ({ ...c })),
    journal: state.journal.slice(),
    players: [buildPlayerView(state, 0), buildPlayerView(state, 1)],
    huntIntro: intro ? { numeral: intro.numeral, title: intro.title, premise: intro.premise } : null,
    summary: state.summary,
  };
}
