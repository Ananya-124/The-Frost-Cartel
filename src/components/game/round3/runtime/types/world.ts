import type { DoorLock } from './flags';
import type { Rect } from './geometry';
import type { Timeline } from './player';

export type RoomId =
  | 'exam'
  | 'arch'
  | 'dir'
  | 'obs'
  | 'lab'
  | 'sec'
  | 'hall'
  | 'exp'
  | 'rec'
  | 'gen'
  | 'con';

export interface Room {
  id: RoomId;
  name: string;
  /** Grid column and row. */
  gx: number;
  gy: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Static description of a door, as authored in config. */
export interface DoorDefinition {
  from: RoomId;
  to: RoomId;
  /** Flag that must be set for the door to open in the Past, or null if never locked. */
  pastLock: DoorLock | null;
  /** Flag that must be set for the door to open in the Future, or null if never locked. */
  futureLock: DoorLock | null;
}

export interface Door extends DoorDefinition {
  /** Walkable corridor area between the two rooms. */
  connector: Rect;
  /** Area that blocks movement while the door is closed. */
  blocker: Rect;
  /** True for a corridor between rooms on the same row (wider than tall). */
  horizontal: boolean;
}

export type InteractableId =
  | 'desk'
  | 'shelf'
  | 'gen'
  | 'exam'
  | 'cab'
  | 'dir'
  | 'book'
  | 'rec'
  | 'wall'
  | 'term'
  | 'node'
  | 'prints'
  | 'cwall'
  | 'panel'
  | 'mon'
  | 'anch'
  | 'mirror'
  | 'anchorMemory'
  | 'memoryAnchorA'
  | 'memoryAnchorB'
  | 'memoryAnchorC'
  | 'finalSequenceMemory'
  | 'finalMemoryConsole'
  | 'mechanismA'
  | 'mechanismB'
  | 'mechanismC'
  | 'trueMemoryAnchor'
  | 'optionalAnomaly'
  | 'weaknessArchive'
  | 'weaknessFrequencyStation'
  | 'weaknessLightStation'
  | 'weaknessTemperatureStation'
  | 'weaknessContainmentConsole'
  | 'weaknessCalibrationConsole'
  | 'brokenArchivePhoto'
  | 'brokenArchiveLedger'
  | 'brokenArchiveRecording'
  | 'brokenMemoryChamber'
  | 'brokenProjectionSymbols'
  | 'brokenKeepsakeMechanism'
  | 'brokenRestorationBoard'
  | 'brokenRestorationBoardFuture'
  | 'brokenSyncConsole'
  | 'brokenRestoreMechanism'
  | 'anchorFlowRecord'
  | 'anchorNodeD'
  | 'anchorPastControl'
  | 'anchorFutureControl'
  | 'anchorNodePastB'
  | 'anchorNodePastD'
  | 'generatorLog'
  | 'burntRelay'
  | 'openGround'
  | 'observationLog'
  | 'cameraBuffer'
  | 'signalChart'
  | 'cableJunction'
  | 'incidentBoardPast'
  | 'incidentBoardFuture'
  | 'optionalResearchNote'
  | 'optionalForgottenRecording'
  | 'sighting-ledger' | 'containment-observation' | 'old-facility-report' | 'cold-ash' | 'drag-marks' | 'shattered-compass'
  | 'power-diagram' | 'power-mechanism' | 'resonance-diagram' | 'resonance-mechanism' | 'memory-diagram' | 'memory-mechanism'
  | 'component-catalog' | 'apparatus-blueprint' | 'weakness-notes' | 'test-station' | 'lure-control' | 'disruptor'
  | 'secret-inscription' | 'secret-residue' | 'hold-record' | 'ground-current' | 'release-memory' | 'vent-pressure' | 'lock-sequence' | 'close-containment'
  | 'recover-induction-coil' | 'recover-prism-lens' | 'recover-grounding-braid' | 'recover-memory-core' | 'recover-shattered-glass' | 'recover-scorched-lattice' | 'physical-apparatus';

/** Visual style used by the prop renderer. */
export type PropKind =
  | 'desk'
  | 'shelf'
  | 'mach'
  | 'bed'
  | 'cab'
  | 'tape'
  | 'clock'
  | 'crack'
  | 'term'
  | 'node'
  | 'prints'
  | 'mirror'
  | 'door';

export interface InteractableObject {
  id: InteractableId;
  timeline: Timeline;
  roomId: RoomId;
  kind: PropKind;
  name: string;
  x: number;
  y: number;
  /** World-space interaction region, independent of the sprite crop. */
  hitbox: Rect;
  /** Solid world-space body, or null for traces and wall-mounted details. */
  collision: Rect | null;
}
