import type { InteractableId, InteractableObject, PropKind, RoomId, Timeline } from '../types';
import type { Rect } from '../types';
import { ROOM_BY_ID } from './rooms';
import { ROOM_SIZE } from './constants';

type InteractableDefinition = readonly [
  id: InteractableId,
  timeline: Timeline,
  room: RoomId,
  dx: number,
  dy: number,
  kind: PropKind,
  name: string,
];

const DEFINITIONS: readonly InteractableDefinition[] = [
  // Past
  ['desk', 'past', 'rec', 215, 70, 'desk', 'Reception desk'],
  ['shelf', 'past', 'lab', 60, 60, 'shelf', 'Supply shelf'],
  ['gen', 'past', 'gen', 150, 110, 'mach', 'Old generator'],
  ['exam', 'past', 'exam', 150, 170, 'bed', 'Examination table'],
  ['cab', 'past', 'arch', 210, 55, 'cab', 'Locked cabinet'],
  ['dir', 'past', 'dir', 150, 80, 'desk', "Director's desk"],
  ['book', 'past', 'dir', 245, 220, 'shelf', 'Heavy bookcase'],
  ['rec', 'past', 'sec', 210, 60, 'tape', 'Cassette recorder'],
  ['wall', 'past', 'obs', 70, 45, 'clock', 'Wall clock'],
  ['term', 'past', 'obs', 215, 200, 'term', 'Archive terminal'],
  ['node', 'past', 'exp', 150, 150, 'node', 'Containment node'],
  // Future
  ['prints', 'future', 'hall', 150, 150, 'prints', 'Floor marks'],
  ['cwall', 'future', 'exam', 150, 45, 'crack', 'Cracked wall'],
  ['panel', 'future', 'con', 150, 200, 'mach', 'Breaker panel'],
  ['mon', 'future', 'sec', 210, 60, 'term', 'Dead monitor'],
  ['anch', 'future', 'dir', 150, 80, 'node', 'Temporal anchor'],
  ['mirror', 'future', 'lab', 235, 70, 'mirror', 'Cracked mirror'],
  ['term', 'future', 'obs', 215, 200, 'term', 'Warden terminal'],
  ['node', 'future', 'exp', 150, 150, 'node', 'Containment node'],
  // Hunt I — incident evidence and reconstruction stations.
  ['optionalResearchNote', 'past', 'arch', 230, 60, 'crack', 'Hidden research note'],
  ['generatorLog', 'past', 'gen', 75, 55, 'term', 'Generator maintenance log'],
  ['burntRelay', 'future', 'gen', 75, 240, 'mach', 'Burned relay jumper'],
  ['openGround', 'future', 'gen', 225, 240, 'crack', 'Open ground lead'],
  ['observationLog', 'past', 'obs', 75, 55, 'desk', 'Observation logbook'],
  ['cameraBuffer', 'future', 'obs', 220, 65, 'term', 'Camera buffer'],
  ['signalChart', 'past', 'sec', 75, 55, 'shelf', 'Signal routing chart'],
  ['cableJunction', 'future', 'sec', 225, 190, 'mach', 'Rerouted cable junction'],
  ['optionalForgottenRecording', 'future', 'sec', 225, 55, 'tape', 'Forgotten recording'],
  ['incidentBoardPast', 'past', 'lab', 75, 55, 'term', 'Incident board (Research Laboratory)'],
  ['incidentBoardFuture', 'future', 'lab', 225, 190, 'term', 'Evidence board (Research Laboratory)'],
  ['weaknessArchive', 'past', 'exp', 75, 55, 'term', 'Containment experiment archive'],
  ['weaknessFrequencyStation', 'future', 'exp', 55, 220, 'mach', 'Resonance station'],
  ['weaknessLightStation', 'future', 'exp', 150, 220, 'mach', 'Light exposure station'],
  ['weaknessTemperatureStation', 'future', 'exp', 245, 220, 'mach', 'Temperature station'],
  ['weaknessContainmentConsole', 'future', 'con', 75, 245, 'mach', 'Containment control'],
  ['weaknessCalibrationConsole', 'past', 'con', 225, 245, 'term', 'Historical calibration console'],
  ['brokenArchivePhoto', 'past', 'arch', 150, 95, 'crack', 'Damaged identity photograph'],
  ['brokenArchiveLedger', 'past', 'obs', 220, 145, 'desk', 'Duplicated memory ledger'],
  ['brokenArchiveRecording', 'past', 'sec', 150, 220, 'tape', 'Fragmented voice recording'],
  ['brokenMemoryChamber', 'future', 'lab', 65, 220, 'mirror', 'Unstable memory chamber'],
  ['brokenProjectionSymbols', 'future', 'hall', 230, 220, 'node', 'Substituted memory symbols'],
  ['brokenKeepsakeMechanism', 'future', 'con', 225, 145, 'mach', 'Displaced keepsake mechanism'],
  ['brokenRestorationBoard', 'past', 'obs', 150, 145, 'term', 'Shared memory restoration board'],
  ['brokenRestorationBoardFuture', 'future', 'obs', 150, 145, 'term', 'Shared memory restoration board'],
  ['brokenSyncConsole', 'past', 'con', 75, 245, 'term', 'Historical memory synchronizer'],
  ['brokenRestoreMechanism', 'future', 'con', 225, 245, 'mach', 'Environmental restoration mechanism'],
  ['anchorMemory', 'past', 'exp', 150, 150, 'node', 'Anchor experiment memory'],
  ['memoryAnchorA', 'future', 'con', 55, 100, 'node', 'Memory anchor A'],
  ['memoryAnchorB', 'future', 'con', 150, 100, 'node', 'Memory anchor B'],
  ['memoryAnchorC', 'future', 'con', 245, 100, 'node', 'Memory anchor C'],
  ['anchorNodeD', 'future', 'con', 150, 175, 'node', 'Memory anchor D'],
  ['anchorFlowRecord', 'past', 'con', 225, 55, 'term', 'Anchor energy-flow record'],
  ['anchorPastControl', 'past', 'con', 75, 245, 'mach', 'Past anchor alignment control'],
  ['anchorFutureControl', 'future', 'con', 225, 245, 'mach', 'Future anchor stabilization control'],
  ['anchorNodePastB', 'past', 'con', 150, 100, 'node', 'Memory anchor B alignment'],
  ['anchorNodePastD', 'past', 'con', 150, 175, 'node', 'Memory anchor D alignment'],
  ['finalSequenceMemory', 'past', 'obs', 150, 70, 'term', 'Final memory projector'],
  ['finalMemoryConsole', 'past', 'obs', 225, 200, 'mach', 'Memory stabilization console'],
  ['mechanismA', 'future', 'con', 55, 230, 'mach', 'Warning alarm relay'],
  ['mechanismB', 'future', 'con', 150, 230, 'mach', 'Arrival latch'],
  ['mechanismC', 'future', 'con', 245, 230, 'mach', 'Containment fail-safe'],
  ['trueMemoryAnchor', 'future', 'con', 150, 250, 'node', 'Exposed memory anchor'],
  ['optionalAnomaly', 'future', 'hall', 150, 230, 'mirror', 'Impossible shadow'],
  // Hunt III physical investigation stations and evidence, split by timeline.
  ['sighting-ledger', 'past', 'arch', 75, 55, 'desk', 'Entity sighting ledger'],
  ['containment-observation', 'past', 'obs', 75, 55, 'term', 'Containment observation record'],
  ['old-facility-report', 'past', 'dir', 210, 55, 'desk', 'Facility movement report'],
  ['cold-ash', 'future', 'hall', 55, 230, 'prints', 'Cold ash trail'],
  ['drag-marks', 'future', 'obs', 220, 65, 'crack', 'Fresh drag marks'],
  ['shattered-compass', 'future', 'obs', 75, 205, 'mach', 'Shattered compass'],
  ['power-diagram', 'past', 'gen', 75, 55, 'term', 'Original power seal diagram'],
  ['power-mechanism', 'future', 'gen', 225, 240, 'mach', 'Damaged power seal'],
  ['resonance-diagram', 'past', 'sec', 75, 55, 'shelf', 'Resonance seal notes'],
  ['resonance-mechanism', 'future', 'sec', 225, 190, 'mach', 'Resonance seal array'],
  ['memory-diagram', 'past', 'obs', 75, 55, 'desk', 'Memory seal protocol'],
  ['memory-mechanism', 'future', 'obs', 225, 145, 'node', 'Memory seal mechanism'],
  ['component-catalog', 'past', 'arch', 220, 190, 'shelf', 'Containment component catalogue'],
  ['recover-induction-coil', 'future', 'gen', 75, 240, 'mach', 'Scorched induction coil'],
  ['recover-prism-lens', 'future', 'exam', 220, 190, 'mirror', 'Cracked prism lens'],
  ['recover-grounding-braid', 'future', 'sec', 75, 190, 'tape', 'Loose grounding braid'],
  ['recover-memory-core', 'future', 'obs', 75, 205, 'node', 'Memory core'],
  ['recover-shattered-glass', 'future', 'hall', 45, 230, 'mirror', 'Shattered glass decoy'],
  ['recover-scorched-lattice', 'future', 'hall', 250, 230, 'mach', 'Scorched lattice decoy'],
  ['apparatus-blueprint', 'past', 'con', 75, 55, 'term', 'Original containment blueprint'],
  ['physical-apparatus', 'future', 'con', 150, 230, 'mach', 'Reconstruction apparatus'],
  ['weakness-notes', 'past', 'exp', 75, 55, 'desk', 'Historical entity reaction notes'],
  ['test-station', 'future', 'exp', 225, 190, 'mach', 'Environmental test station'],
  ['lure-control', 'past', 'con', 75, 245, 'mach', 'Lure tone control'],
  ['disruptor', 'future', 'con', 225, 245, 'mach', 'Containment disruptor'],
  ['secret-inscription', 'past', 'dir', 45, 160, 'crack', 'Concealed containment inscription'],
  ['secret-residue', 'future', 'hall', 250, 230, 'mirror', 'Impossible containment shadow'],
  ['hold-record', 'past', 'con', 75, 55, 'term', 'Past record control'],
  ['ground-current', 'future', 'con', 225, 70, 'mach', 'Live ground control'],
  ['release-memory', 'past', 'obs', 150, 70, 'term', 'Memory release control'],
  ['vent-pressure', 'future', 'con', 150, 230, 'mach', 'Pressure vent'],
  ['lock-sequence', 'past', 'con', 150, 180, 'node', 'Final sequence lock'],
  ['close-containment', 'future', 'con', 150, 245, 'mach', 'Containment chamber lock'],
];

/** Targets owned by Hunt 1; these are hidden from Hunt 2 and Hunt 3 worlds. */
export const HUNT1_INTERACTABLE_IDS: ReadonlySet<InteractableId> = new Set([
  'optionalResearchNote',
  'generatorLog', 'burntRelay', 'openGround', 'observationLog', 'cameraBuffer',
  'signalChart', 'cableJunction', 'incidentBoardPast', 'incidentBoardFuture', 'optionalForgottenRecording',
]);
export const HUNT2_INTERACTABLE_IDS: ReadonlySet<InteractableId> = new Set([
  'weaknessArchive', 'weaknessFrequencyStation', 'weaknessLightStation', 'weaknessTemperatureStation', 'weaknessContainmentConsole', 'weaknessCalibrationConsole',
  'brokenArchivePhoto', 'brokenArchiveLedger', 'brokenArchiveRecording', 'brokenMemoryChamber', 'brokenProjectionSymbols', 'brokenKeepsakeMechanism', 'brokenRestorationBoard', 'brokenRestorationBoardFuture', 'brokenSyncConsole', 'brokenRestoreMechanism',
  'anchorMemory',
  'memoryAnchorA', 'memoryAnchorB', 'memoryAnchorC', 'anchorNodeD', 'anchorFlowRecord', 'anchorPastControl', 'anchorFutureControl', 'anchorNodePastB', 'anchorNodePastD', 'finalSequenceMemory', 'finalMemoryConsole',
  'mechanismA', 'mechanismB', 'mechanismC', 'trueMemoryAnchor', 'optionalAnomaly',
]);
export const HUNT3_INTERACTABLE_IDS: ReadonlySet<InteractableId> = new Set([
  'sighting-ledger', 'containment-observation', 'old-facility-report', 'cold-ash', 'drag-marks', 'shattered-compass',
  'power-diagram', 'power-mechanism', 'resonance-diagram', 'resonance-mechanism', 'memory-diagram', 'memory-mechanism',
  'component-catalog', 'recover-induction-coil', 'recover-prism-lens', 'recover-grounding-braid', 'recover-memory-core', 'recover-shattered-glass', 'recover-scorched-lattice', 'apparatus-blueprint', 'physical-apparatus', 'weakness-notes', 'test-station', 'lure-control', 'disruptor', 'secret-inscription', 'secret-residue',
  'hold-record', 'ground-current', 'release-memory', 'vent-pressure', 'lock-sequence', 'close-containment',
]);
const HUNT3_STAGE_OBJECTS: Record<number, ReadonlySet<InteractableId>> = {
  1: new Set(['sighting-ledger', 'containment-observation', 'old-facility-report', 'cold-ash', 'drag-marks', 'shattered-compass']),
  2: new Set(['power-diagram', 'power-mechanism', 'resonance-diagram', 'resonance-mechanism', 'memory-diagram', 'memory-mechanism', 'component-catalog', 'apparatus-blueprint', 'recover-induction-coil', 'recover-prism-lens', 'recover-grounding-braid', 'recover-memory-core', 'recover-shattered-glass', 'recover-scorched-lattice']),
  3: new Set(['apparatus-blueprint', 'physical-apparatus', 'weakness-notes', 'test-station', 'lure-control', 'disruptor']),
  4: new Set(['hold-record', 'ground-current', 'release-memory', 'vent-pressure', 'lock-sequence', 'close-containment']),
};
export function isHunt3InteractableAvailable(id: InteractableId, stage: number | undefined): boolean {
  return id === 'secret-inscription' || id === 'secret-residue' || (HUNT3_STAGE_OBJECTS[stage ?? 1]?.has(id) ?? false);
}

/** World footprints remain independent from art crops and render scale. */
const OBJECT_BOUNDS: Record<PropKind, readonly [width: number, height: number, solid: boolean]> = {
  desk: [72, 34, true],
  shelf: [78, 32, true],
  mach: [72, 48, true],
  bed: [82, 38, true],
  cab: [50, 42, true],
  tape: [42, 28, true],
  clock: [30, 20, false],
  crack: [52, 36, false],
  term: [54, 38, true],
  node: [66, 38, true],
  prints: [58, 26, false],
  mirror: [42, 36, false],
  door: [42, 54, false],
};

export const INTERACTABLES: readonly InteractableObject[] = DEFINITIONS.map(
  ([id, timeline, roomId, dx, dy, kind, name]) => {
    const room = ROOM_BY_ID[roomId];
    const x = room.x + (dx / 300) * ROOM_SIZE.w;
    const y = room.y + (dy / 280) * ROOM_SIZE.h;
    const [w, h, blocksMovement] = OBJECT_BOUNDS[kind];
    const hitbox: Rect = { x: x - w / 2, y: y - h, w, h };
    return {
      id,
      timeline,
      roomId,
      kind,
      name,
      x,
      y,
      hitbox,
      collision: blocksMovement ? hitbox : null,
    };
  },
);

/** Display names of the two terminals, which behave differently from other props. */
export const ARCHIVE_TERMINAL_NAME = 'Archive terminal';
export const WARDEN_TERMINAL_NAME = 'Warden terminal';
