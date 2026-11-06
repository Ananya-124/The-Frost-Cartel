/**
 * FROST CARTEL — ROUND 04: THE CAMPUS EXPEDITION
 * Replaceable Floor Map Configuration
 *
 * Each floor supports an independent map asset, independent spawn point,
 * walkable pathways, collision boundaries, and room definitions.
 */

import type { FloorMapConfig } from '../../../types/round4Expedition.types';

export const SAMPLE_MAP_DIMENSIONS = {
  width: 618,
  height: 430,
};

export const FLOOR_MAP_CONFIGS: Record<string, FloorMapConfig> = {
  'floor-7': {
    floorId: 'floor-7',
    floorName: 'Seventh Floor — The Celestial Archives & Observatory',
    mapImage: '/assets/round-04/sample_campus_floor_map.png',
    mapWidth: 618,
    mapHeight: 430,
    spawnPoint: { x: 280, y: 185 },
    walkableRegions: [
      // Central East-West Corridor
      { x: 75, y: 172, width: 465, height: 42 },
      // Central North-South Foyer & Stair Vestibule
      { x: 248, y: 110, width: 72, height: 170 },
      // North Hallway Connector
      { x: 310, y: 112, width: 130, height: 62 },
      // Room 701: Lecture Hall (Top Right)
      { x: 330, y: 95, width: 220, height: 82 },
      // Room 702: Western Reading Hall (Top Left)
      { x: 92, y: 95, width: 148, height: 82 },
      // Central Open Atrium Courtyard
      { x: 212, y: 210, width: 136, height: 105 },
      // Room 703: Faculty Study (Middle Left)
      { x: 92, y: 205, width: 124, height: 78 },
      // Room 704: Informatics / Computer Station (Bottom Left)
      { x: 92, y: 288, width: 126, height: 82 },
      // Room 705: East Study Hall (Middle Right)
      { x: 348, y: 205, width: 138, height: 82 },
      // Room 706: East Seminar & Archive Room (Bottom Right)
      { x: 348, y: 298, width: 138, height: 72 },
      // South Staircase & Vestibule
      { x: 242, y: 300, width: 78, height: 85 },
    ],
    collisionRegions: [
      // Outer Map Perimeter Bounds
      { x: 0, y: 0, width: 618, height: 85 }, // North Exterior Roof
      { x: 0, y: 395, width: 618, height: 35 }, // South Exterior
      { x: 0, y: 0, width: 75, height: 430 }, // West Exterior Wall
      { x: 565, y: 0, width: 53, height: 430 }, // East Exterior Wall
      // Central Courtyard Wall Balustrades
      { x: 208, y: 220, width: 6, height: 95 },
      { x: 346, y: 220, width: 6, height: 95 },
      { x: 208, y: 315, width: 144, height: 6 },
    ],
  },
  'floor-6': {
    floorId: 'floor-6',
    floorName: 'Sixth Floor — The Astrolabe Study & Scriptorium',
    mapImage: '/assets/round-04/sample_campus_floor_map.png',
    mapWidth: 618,
    mapHeight: 430,
    spawnPoint: { x: 280, y: 185 },
    walkableRegions: [
      { x: 75, y: 172, width: 465, height: 42 },
      { x: 248, y: 110, width: 72, height: 170 },
      { x: 330, y: 95, width: 220, height: 82 },
      { x: 92, y: 95, width: 148, height: 82 },
      { x: 212, y: 210, width: 136, height: 105 },
    ],
    collisionRegions: [
      { x: 0, y: 0, width: 618, height: 85 },
      { x: 0, y: 395, width: 618, height: 35 },
      { x: 0, y: 0, width: 75, height: 430 },
      { x: 565, y: 0, width: 53, height: 430 },
    ],
  },
  'floor-5': {
    floorId: 'floor-5',
    floorName: 'Fifth Floor — The Alchemical Laboratories',
    mapImage: '/assets/round-04/sample_campus_floor_map.png',
    mapWidth: 618,
    mapHeight: 430,
    spawnPoint: { x: 280, y: 185 },
    walkableRegions: [
      { x: 75, y: 172, width: 465, height: 42 },
      { x: 248, y: 110, width: 72, height: 170 },
      { x: 330, y: 95, width: 220, height: 82 },
      { x: 92, y: 95, width: 148, height: 82 },
      { x: 212, y: 210, width: 136, height: 105 },
    ],
    collisionRegions: [
      { x: 0, y: 0, width: 618, height: 85 },
      { x: 0, y: 395, width: 618, height: 35 },
      { x: 0, y: 0, width: 75, height: 430 },
      { x: 565, y: 0, width: 53, height: 430 },
    ],
  },
  'floor-4': {
    floorId: 'floor-4',
    floorName: "Fourth Floor — The Cartographer's Guild",
    mapImage: '/assets/round-04/sample_campus_floor_map.png',
    mapWidth: 618,
    mapHeight: 430,
    spawnPoint: { x: 280, y: 185 },
    walkableRegions: [
      { x: 75, y: 172, width: 465, height: 42 },
      { x: 248, y: 110, width: 72, height: 170 },
      { x: 330, y: 95, width: 220, height: 82 },
      { x: 92, y: 95, width: 148, height: 82 },
      { x: 212, y: 210, width: 136, height: 105 },
    ],
    collisionRegions: [
      { x: 0, y: 0, width: 618, height: 85 },
      { x: 0, y: 395, width: 618, height: 35 },
      { x: 0, y: 0, width: 75, height: 430 },
      { x: 565, y: 0, width: 53, height: 430 },
    ],
  },
  'floor-3': {
    floorId: 'floor-3',
    floorName: 'Third Floor — The Grand Library & Rare Manuscripts',
    mapImage: '/assets/round-04/sample_campus_floor_map.png',
    mapWidth: 618,
    mapHeight: 430,
    spawnPoint: { x: 280, y: 185 },
    walkableRegions: [
      { x: 75, y: 172, width: 465, height: 42 },
      { x: 248, y: 110, width: 72, height: 170 },
      { x: 330, y: 95, width: 220, height: 82 },
      { x: 92, y: 95, width: 148, height: 82 },
      { x: 212, y: 210, width: 136, height: 105 },
    ],
    collisionRegions: [
      { x: 0, y: 0, width: 618, height: 85 },
      { x: 0, y: 395, width: 618, height: 35 },
      { x: 0, y: 0, width: 75, height: 430 },
      { x: 565, y: 0, width: 53, height: 430 },
    ],
  },
  'floor-2': {
    floorId: 'floor-2',
    floorName: 'Second Floor — The Chronometer Hall',
    mapImage: '/assets/round-04/sample_campus_floor_map.png',
    mapWidth: 618,
    mapHeight: 430,
    spawnPoint: { x: 280, y: 185 },
    walkableRegions: [
      { x: 75, y: 172, width: 465, height: 42 },
      { x: 248, y: 110, width: 72, height: 170 },
      { x: 330, y: 95, width: 220, height: 82 },
      { x: 92, y: 95, width: 148, height: 82 },
      { x: 212, y: 210, width: 136, height: 105 },
    ],
    collisionRegions: [
      { x: 0, y: 0, width: 618, height: 85 },
      { x: 0, y: 395, width: 618, height: 35 },
      { x: 0, y: 0, width: 75, height: 430 },
      { x: 565, y: 0, width: 53, height: 430 },
    ],
  },
  'floor-1': {
    floorId: 'floor-1',
    floorName: 'First Floor — The Assembly Chamber & Reliquary',
    mapImage: '/assets/round-04/sample_campus_floor_map.png',
    mapWidth: 618,
    mapHeight: 430,
    spawnPoint: { x: 280, y: 185 },
    walkableRegions: [
      { x: 75, y: 172, width: 465, height: 42 },
      { x: 248, y: 110, width: 72, height: 170 },
      { x: 330, y: 95, width: 220, height: 82 },
      { x: 92, y: 95, width: 148, height: 82 },
      { x: 212, y: 210, width: 136, height: 105 },
    ],
    collisionRegions: [
      { x: 0, y: 0, width: 618, height: 85 },
      { x: 0, y: 395, width: 618, height: 35 },
      { x: 0, y: 0, width: 75, height: 430 },
      { x: 565, y: 0, width: 53, height: 430 },
    ],
  },
  'floor-G': {
    floorId: 'floor-G',
    floorName: 'Ground Floor — The Grand Atrium & Vestibule',
    mapImage: '/assets/round-04/sample_campus_floor_map.png',
    mapWidth: 618,
    mapHeight: 430,
    spawnPoint: { x: 280, y: 185 },
    walkableRegions: [
      { x: 75, y: 172, width: 465, height: 42 },
      { x: 248, y: 110, width: 72, height: 170 },
      { x: 330, y: 95, width: 220, height: 82 },
      { x: 92, y: 95, width: 148, height: 82 },
      { x: 212, y: 210, width: 136, height: 105 },
    ],
    collisionRegions: [
      { x: 0, y: 0, width: 618, height: 85 },
      { x: 0, y: 395, width: 618, height: 35 },
      { x: 0, y: 0, width: 75, height: 430 },
      { x: 565, y: 0, width: 53, height: 430 },
    ],
  },
};

/**
 * Returns the configured map for a floor, falling back to Seventh Floor sample map.
 */
export function getFloorMapConfig(floorId: string): FloorMapConfig {
  return FLOOR_MAP_CONFIGS[floorId] || FLOOR_MAP_CONFIGS['floor-7'];
}
