import type { InteractableId, InteractableObject, PropKind, RoomId, Timeline } from '../types';
import type { GameState } from '../types';
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
  ['book', 'past', 'dir', 45, 160, 'shelf', 'Heavy bookcase'],
  ['rec', 'past', 'sec', 210, 60, 'tape', 'Cassette recorder'],
  ['wall', 'past', 'obs', 70, 45, 'clock', 'Wall clock'],
  ['term', 'past', 'obs', 215, 200, 'term', 'Archive terminal'],
  ['node', 'past', 'exp', 150, 150, 'node', 'Containment node'],
  // Future
  ['prints', 'future', 'hall', 150, 150, 'prints', 'Floor marks'],
  ['cwall', 'future', 'exam', 150, 45, 'crack', 'Cracked wall'],
  ['panel', 'future', 'con', 150, 70, 'mach', 'Breaker panel'],
  ['mon', 'future', 'sec', 210, 60, 'term', 'Dead monitor'],
  ['anch', 'future', 'dir', 150, 80, 'node', 'Temporal anchor'],
  ['mirror', 'future', 'lab', 235, 70, 'mirror', 'Cracked mirror'],
  ['term', 'future', 'obs', 215, 200, 'term', 'Warden terminal'],
  ['node', 'future', 'exp', 150, 150, 'node', 'Containment node'],
  // Hunt I's six sequential challenges use distinct, server-validated targets.
  ['stoppedClock', 'future', 'rec', 235, 45, 'clock', 'Stopped wall clock'],
  ['reportFragment', 'future', 'rec', 230, 240, 'tape', 'Torn report fragment'],
  ['transmitter', 'future', 'gen', 150, 140, 'mach', 'Resonance transmitter'],
  ['circuitDiagram', 'past', 'lab', 95, 55, 'shelf', 'Original circuit diagram'],
  ['componentCapacitor', 'future', 'con', 55, 130, 'mach', 'Capacitor'],
  ['componentCoil', 'future', 'con', 150, 130, 'mach', 'Resonance coil'],
  ['componentOutput', 'future', 'con', 245, 130, 'mach', 'Output assembly'],
  ['calibrationConsole', 'past', 'obs', 145, 190, 'term', 'Calibration console'],
  ['shutdownConsole', 'past', 'obs', 225, 230, 'mach', 'Emergency shutdown console'],
  ['emergencyBreaker', 'future', 'con', 150, 220, 'mach', 'Emergency breaker'],
  ['optionalLog', 'future', 'con', 260, 45, 'shelf', 'Hidden transmitter log'],
  // Hunt II visual-deception props (mounted only while Hunt II is active).
  ['memoryDoorRoom', 'past', 'hall', 150, 55, 'term', 'Original door memory'],
  ['falseDoor1', 'future', 'hall', 55, 45, 'door', 'Door 1'],
  ['falseDoor2', 'future', 'hall', 120, 45, 'door', 'Door 2'],
  ['falseDoor3', 'future', 'hall', 185, 45, 'door', 'Door 3'],
  ['falseDoor4', 'future', 'hall', 250, 45, 'door', 'Door 4'],
  ['identityMemory', 'past', 'sec', 150, 160, 'term', 'Manifestation memory projector'],
  ['manifestationA', 'future', 'exp', 55, 120, 'node', 'Manifestation A'],
  ['manifestationB', 'future', 'exp', 150, 120, 'mirror', 'Manifestation B'],
  ['manifestationC', 'future', 'exp', 245, 120, 'prints', 'Manifestation C'],
  ['layoutMemory', 'past', 'lab', 150, 65, 'term', 'Original room projection'],
  ['layoutChair', 'future', 'lab', 55, 125, 'bed', 'Displaced chair'],
  ['layoutMirror', 'future', 'lab', 130, 220, 'mirror', 'Displaced mirror'],
  ['layoutTable', 'future', 'lab', 235, 130, 'desk', 'Displaced table'],
  ['layoutLamp', 'future', 'lab', 235, 220, 'mach', 'Experimental lamp'],
  ['anchorMemory', 'past', 'exp', 150, 55, 'node', 'Anchor experiment memory'],
  ['memoryAnchorA', 'future', 'con', 55, 100, 'node', 'Memory anchor A'],
  ['memoryAnchorB', 'future', 'con', 150, 100, 'node', 'Memory anchor B'],
  ['memoryAnchorC', 'future', 'con', 245, 100, 'node', 'Memory anchor C'],
  ['finalSequenceMemory', 'past', 'obs', 150, 70, 'term', 'Final memory projector'],
  ['finalMemoryConsole', 'past', 'obs', 225, 200, 'mach', 'Memory stabilization console'],
  ['mechanismA', 'future', 'con', 55, 190, 'mach', 'Warning alarm relay'],
  ['mechanismB', 'future', 'con', 150, 190, 'mach', 'Arrival latch'],
  ['mechanismC', 'future', 'con', 245, 190, 'mach', 'Containment fail-safe'],
  ['trueMemoryAnchor', 'future', 'con', 150, 250, 'node', 'Exposed memory anchor'],
  ['optionalAnomaly', 'future', 'hall', 150, 230, 'mirror', 'Impossible shadow'],
];

/** Targets owned by Hunt 1; these are hidden from Hunt 2 and Hunt 3 worlds. */
export const HUNT1_INTERACTABLE_IDS: ReadonlySet<InteractableId> = new Set([
  'stoppedClock', 'reportFragment', 'transmitter', 'circuitDiagram',
  'componentCapacitor', 'componentCoil', 'componentOutput',
  'calibrationConsole', 'shutdownConsole', 'emergencyBreaker', 'optionalLog',
]);
export const HUNT2_INTERACTABLE_IDS: ReadonlySet<InteractableId> = new Set([
  'memoryDoorRoom', 'falseDoor1', 'falseDoor2', 'falseDoor3', 'falseDoor4',
  'identityMemory', 'manifestationA', 'manifestationB', 'manifestationC', 'layoutMemory',
  'layoutChair', 'layoutMirror', 'layoutTable', 'layoutLamp', 'anchorMemory',
  'memoryAnchorA', 'memoryAnchorB', 'memoryAnchorC', 'finalSequenceMemory', 'finalMemoryConsole',
  'mechanismA', 'mechanismB', 'mechanismC', 'trueMemoryAnchor', 'optionalAnomaly',
]);

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

/** Applies Hunt 2's authoritative room reconstruction to the shared world coordinates. */
export function getInteractableForState(object: InteractableObject, state: GameState): InteractableObject {
  if (state.huntIndex !== 1) return object;
  const position = state.hunt2ObjectPositions?.[object.id];
  if (!position) return object;
  const dx = position.x - object.x;
  const dy = position.y - object.y;
  const shift = (rect: Rect | null) => rect ? { ...rect, x: rect.x + dx, y: rect.y + dy } : null;
  return { ...object, x: position.x, y: position.y, hitbox: shift(object.hitbox)!, collision: shift(object.collision) };
}

/** Display names of the two terminals, which behave differently from other props. */
export const ARCHIVE_TERMINAL_NAME = 'Archive terminal';
export const WARDEN_TERMINAL_NAME = 'Warden terminal';
