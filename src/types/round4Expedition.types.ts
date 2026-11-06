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

export interface WinnerRecord {
  teamId: string;
  teamName: string;
  routeId: string;
  solvedAt: string;
}

export interface QualifiedTeamAssignment {
  qualId: string;
  teamId: string;
  teamName: string;
  routeId: string;
  romanNumeral: string;
  routeName: string;
  currentStepIndex: number;
  targetDiscovered: number;
  commonRoomArrived: number;
  isFinished: number;
  finishedAt: string | null;
  totalSteps: number;
}

export interface Round4Settings {
  id: string;
  is_released: number;
  common_final_location_id: string;
  common_final_floor_id: string;
  common_final_room_name: string;
  common_final_x: number;
  common_final_y: number;
  common_final_radius: number;
  physical_entry_instructions: string;
}

export interface Round4AdminOverview {
  settings: Round4Settings;
  routes: Array<{
    id: string;
    route_number: number;
    roman_numeral: string;
    route_name: string;
    route_subtitle: string;
  }>;
  qualifiedTeams: QualifiedTeamAssignment[];
  availableTeams: Array<{
    id: string;
    teamName: string;
    score: number;
    totalCredits: number;
  }>;
  steps: Array<{
    id: string;
    routeId: string;
    clueIndex: number;
    floorId: string;
    locationName: string;
    targetX: number;
    targetY: number;
    triggerRadius: number;
    riddleText: string;
    fieldLocationHint: string;
    acceptedAnswersJson: string;
    isCaseSensitive: number;
    isCommonFinal: number;
  }>;
  winner: WinnerRecord | null;
}


