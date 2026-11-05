/**
 * FROST CARTEL — ROUND 04: THE CAMPUS EXPEDITION
 * Cooperative Treasure Hunt Map & Route Types
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface RectArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClueStep {
  stepId: string;
  clueIndex: number; // 1 through 5
  floorId: string;
  locationName: string;
  targetPoint: Point2D; // in map coordinate space (0..618, 0..430)
  triggerRadius: number; // distance in pixels to trigger discovery
  riddle: string;
  fieldLocationHint: string;
  acceptedCodes: string[];
}

export interface ExpeditionRoute {
  routeId: string;
  routeNumber: number; // 1 through 7
  romanNumeral: string; // 'I' through 'VII'
  routeName: string;
  routeSubtitle: string;
  steps: ClueStep[];
}

export interface FloorMapConfig {
  floorId: string;
  floorName: string;
  mapImage: string;
  mapWidth: number;
  mapHeight: number;
  walkableRegions: RectArea[];
  collisionRegions: RectArea[];
  spawnPoint: Point2D;
}

export interface ExpeditionProgress {
  teamId: string;
  activeRouteId: string;
  activeStepIndex: number; // 0 to 4
  targetDiscovered: boolean;
  solvedStepIds: string[];
  completedRouteIds: string[];
  lastUpdated: string;
}

export type RiddlePanelState =
  | 'BEFORE_ARRIVING'
  | 'RIDDLE_UNLOCKED'
  | 'WAITING_FOR_FIELD_ANSWER'
  | 'SUBMITTING'
  | 'INCORRECT_ANSWER'
  | 'CORRECT_ANSWER'
  | 'ROUTE_COMPLETED';

