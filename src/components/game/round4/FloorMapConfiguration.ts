/**
 * FROST CARTEL — ROUND 04: THE CAMPUS EXPEDITION
 * Production Architectural Floor Map Configuration
 *
 * Mapped to the 6 extracted watercolor floor plans from floors.pdf:
 * - Second Floor (floor-02.png)
 * - Third Floor (floor-03.png)
 * - Fourth Floor (floor-04.png)
 * - Fifth Floor (floor-05.png)
 * - Sixth Floor (floor-06.png)
 * - Seventh Floor (floor-07.png)
 */

import type { FloorMapConfig, RectArea } from '../../../types/round4Expedition.types';
import { ROUND4_COLLISION_DATA } from '../../../data/round4/round4CollisionData';

export const MAP_DIMENSIONS = {
  width: 1024,
  height: 774,
};

function buildFloorConfig(
  floorId: string,
  floorName: string,
  collisionKey: 'floor-02' | 'floor-03' | 'floor-04' | 'floor-05' | 'floor-06' | 'floor-07'
): FloorMapConfig {
  const colData = ROUND4_COLLISION_DATA[collisionKey];
  const walkable: RectArea[] = colData.walkableRegions.map((r) => ({
    x: r.x,
    y: r.y,
    width: r.w,
    height: r.h,
  }));

  // Outer bounds collision perimeter (North, South, West, East)
  const collision: RectArea[] = [
    { x: 0, y: 0, width: MAP_DIMENSIONS.width, height: 110 }, // North exterior trees / roof
    { x: 0, y: 580, width: MAP_DIMENSIONS.width, height: 194 }, // South exterior garden
    { x: 0, y: 0, width: 85, height: MAP_DIMENSIONS.height }, // West exterior wall
    { x: 960, y: 0, width: 64, height: MAP_DIMENSIONS.height }, // East exterior wall
  ];

  return {
    floorId,
    floorName,
    mapImage: `/images/round-04/floors/${collisionKey}.png`,
    mapWidth: MAP_DIMENSIONS.width,
    mapHeight: MAP_DIMENSIONS.height,
    walkableRegions: walkable,
    collisionRegions: collision,
    spawnPoint: colData.spawnPoint,
  };
}

export const FLOOR_MAP_CONFIGS: Record<string, FloorMapConfig> = {
  'floor-02': buildFloorConfig('floor-02', 'Second Floor', 'floor-02'),
  'floor-2': buildFloorConfig('floor-02', 'Second Floor', 'floor-02'),

  'floor-03': buildFloorConfig('floor-03', 'Third Floor', 'floor-03'),
  'floor-3': buildFloorConfig('floor-03', 'Third Floor', 'floor-03'),

  'floor-04': buildFloorConfig('floor-04', 'Fourth Floor', 'floor-04'),
  'floor-4': buildFloorConfig('floor-04', 'Fourth Floor', 'floor-04'),

  'floor-05': buildFloorConfig('floor-05', 'Fifth Floor', 'floor-05'),
  'floor-5': buildFloorConfig('floor-05', 'Fifth Floor', 'floor-05'),

  'floor-06': buildFloorConfig('floor-06', 'Sixth Floor', 'floor-06'),
  'floor-6': buildFloorConfig('floor-06', 'Sixth Floor', 'floor-06'),

  'floor-07': buildFloorConfig('floor-07', 'Seventh Floor', 'floor-07'),
  'floor-7': buildFloorConfig('floor-07', 'Seventh Floor', 'floor-07'),
};

export function getFloorMapConfig(floorId: string): FloorMapConfig {
  const norm = floorId.toLowerCase().trim();
  return FLOOR_MAP_CONFIGS[norm] || FLOOR_MAP_CONFIGS['floor-07'];
}
