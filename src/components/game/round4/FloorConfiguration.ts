export interface WindowTarget {
  x: number; // in 0..1629 viewBox
  y: number; // in 0..965 viewBox
  width: number;
  height: number;
}

export interface CameraTarget {
  x: number; // focal point x (0..1629)
  y: number; // focal point y (0..965)
  scale: number; // zoom scale
}

export interface BadgePosition {
  x: number;
  y: number;
}

export interface FloorDefinition {
  id: string;
  floorNumber: number;
  romanNumeral: string;
  label: string;
  subtitle: string;
  shortName: string;
  outlinePaths: string[];
  hitAreaPaths: string[];
  windowTarget: WindowTarget;
  cameraTarget: CameraTarget;
  badgePosition: BadgePosition;
  enabled: boolean;
  interiorTitle: string;
  interiorDescription: string;
  interiorClueHint: string;
}

export const BUILDING_VIEWBOX = {
  width: 1629,
  height: 965,
};

/**
 * Authoritative 8-floor calibrated architectural configuration for:
 * B. S. NARAYAN PLATINUM JUBILEE ACADEMIC BLOCK
 *
 * Calibrated against the 1629x965 Ghibli artwork.
 * Uses exact cubic Bézier curves (C) that mathematically hug the cylindrical
 * perspective curvature of the concrete sunshades and slabs across the facade.
 */
export const COLLEGE_FLOORS: FloorDefinition[] = [
  {
    id: 'floor-7',
    floorNumber: 7,
    romanNumeral: 'VII',
    label: 'Seventh Floor',
    subtitle: 'The Celestial Archives & Observatory',
    shortName: 'Level 07',
    outlinePaths: [
      'M 85.0,145.0 C 413.1,119.0 558.9,105.0 814.0,105.0 C 1068.1,105.0 1213.3,120.8 1540.0,150.0 L 1540.0,235.0 C 1213.3,204.4 1068.1,188.0 814.0,188.0 C 558.9,188.0 413.1,202.7 85.0,230.0 Z',
    ],
    hitAreaPaths: [
      'M 85.0,145.0 C 413.1,119.0 558.9,105.0 814.0,105.0 C 1068.1,105.0 1213.3,120.8 1540.0,150.0 L 1540.0,235.0 C 1213.3,204.4 1068.1,188.0 814.0,188.0 C 558.9,188.0 413.1,202.7 85.0,230.0 Z',
    ],
    windowTarget: { x: 960, y: 110, width: 100, height: 60 },
    cameraTarget: { x: 1010, y: 140, scale: 3.8 },
    badgePosition: { x: 1180, y: 165 },
    enabled: true,
    interiorTitle: 'SEVENTH FLOOR — THE CELESTIAL ARCHIVES & OBSERVATORY',
    interiorDescription:
      'The topmost level of the Platinum Jubilee Academic Block, crowned by an expansive panorama of the city and domed astronomical instruments.',
    interiorClueHint: 'Look towards the high skylight alignments and stellar charts.',
  },
  {
    id: 'floor-6',
    floorNumber: 6,
    romanNumeral: 'VI',
    label: 'Sixth Floor',
    subtitle: 'The Astrolabe Study & Scriptorium',
    shortName: 'Level 06',
    outlinePaths: [
      'M 85.0,230.0 C 413.1,202.7 558.9,188.0 814.0,188.0 C 1068.1,188.0 1213.3,204.4 1540.0,235.0 L 1540.0,333.0 C 1213.3,302.4 1068.1,286.0 814.0,286.0 C 558.9,286.0 413.1,300.7 85.0,328.0 Z',
    ],
    hitAreaPaths: [
      'M 85.0,230.0 C 413.1,202.7 558.9,188.0 814.0,188.0 C 1068.1,188.0 1213.3,204.4 1540.0,235.0 L 1540.0,333.0 C 1213.3,302.4 1068.1,286.0 814.0,286.0 C 558.9,286.0 413.1,300.7 85.0,328.0 Z',
    ],
    windowTarget: { x: 360, y: 205, width: 100, height: 60 },
    cameraTarget: { x: 410, y: 235, scale: 3.8 },
    badgePosition: { x: 1180, y: 255 },
    enabled: true,
    interiorTitle: 'SIXTH FLOOR — THE ASTROLABE STUDY & SCRIPTORIUM',
    interiorDescription:
      'Sunlit manuscript benches and historic cartographic tables line the curved glass corridor.',
    interiorClueHint: 'Historic compass points inscribed on the central balustrade.',
  },
  {
    id: 'floor-5',
    floorNumber: 5,
    romanNumeral: 'V',
    label: 'Fifth Floor',
    subtitle: 'The Alchemical Laboratories',
    shortName: 'Level 05',
    outlinePaths: [
      'M 85.0,328.0 C 413.1,300.7 558.9,286.0 814.0,286.0 C 1068.1,286.0 1213.3,302.4 1540.0,333.0 L 1540.0,426.0 C 1213.3,396.8 1068.1,381.0 814.0,381.0 C 558.9,381.0 413.1,395.4 85.0,422.0 Z',
    ],
    hitAreaPaths: [
      'M 85.0,328.0 C 413.1,300.7 558.9,286.0 814.0,286.0 C 1068.1,286.0 1213.3,302.4 1540.0,333.0 L 1540.0,426.0 C 1213.3,396.8 1068.1,381.0 814.0,381.0 C 558.9,381.0 413.1,395.4 85.0,422.0 Z',
    ],
    windowTarget: { x: 1260, y: 345, width: 100, height: 60 },
    cameraTarget: { x: 1310, y: 375, scale: 3.8 },
    badgePosition: { x: 1180, y: 352 },
    enabled: true,
    interiorTitle: 'FIFTH FLOOR — THE ALCHEMICAL LABORATORIES',
    interiorDescription:
      'Rows of precision alembics, specimen cases, and ancient metallurgical crucibles overlook the canopy.',
    interiorClueHint: 'Check the periodic inscriptions behind the distillation apparatus.',
  },
  {
    id: 'floor-4',
    floorNumber: 4,
    romanNumeral: 'IV',
    label: 'Fourth Floor',
    subtitle: "The Cartographer's Guild",
    shortName: 'Level 04',
    outlinePaths: [
      'M 85.0,422.0 C 413.1,395.4 558.9,381.0 814.0,381.0 C 1068.1,381.0 1213.3,396.8 1540.0,426.0 L 1540.0,518.0 C 1213.3,490.1 1068.1,475.0 814.0,475.0 C 558.9,475.0 413.1,489.0 85.0,515.0 Z',
    ],
    hitAreaPaths: [
      'M 85.0,422.0 C 413.1,395.4 558.9,381.0 814.0,381.0 C 1068.1,381.0 1213.3,396.8 1540.0,426.0 L 1540.0,518.0 C 1213.3,490.1 1068.1,475.0 814.0,475.0 C 558.9,475.0 413.1,489.0 85.0,515.0 Z',
    ],
    windowTarget: { x: 600, y: 440, width: 100, height: 60 },
    cameraTarget: { x: 650, y: 470, scale: 3.8 },
    badgePosition: { x: 1180, y: 447 },
    enabled: true,
    interiorTitle: "FOURTH FLOOR — THE CARTOGRAPHER'S GUILD",
    interiorDescription:
      'Expansive draft tables covered in relief topography of the campus and ancient land deeds.',
    interiorClueHint: 'A forgotten compass rose is etched into the stone flooring.',
  },
  {
    id: 'floor-3',
    floorNumber: 3,
    romanNumeral: 'III',
    label: 'Third Floor',
    subtitle: 'The Grand Library & Rare Manuscripts',
    shortName: 'Level 03',
    outlinePaths: [
      'M 85.0,515.0 C 413.1,489.0 558.9,475.0 814.0,475.0 C 1068.1,475.0 1213.3,490.1 1540.0,518.0 L 1540.0,610.0 C 1213.3,583.4 1068.1,569.0 814.0,569.0 C 558.9,569.0 413.1,582.6 85.0,608.0 Z',
    ],
    hitAreaPaths: [
      'M 85.0,515.0 C 413.1,489.0 558.9,475.0 814.0,475.0 C 1068.1,475.0 1213.3,490.1 1540.0,518.0 L 1540.0,610.0 C 1213.3,583.4 1068.1,569.0 814.0,569.0 C 558.9,569.0 413.1,582.6 85.0,608.0 Z',
    ],
    windowTarget: { x: 1015, y: 525, width: 100, height: 65 },
    cameraTarget: { x: 1067, y: 557, scale: 3.8 },
    badgePosition: { x: 1180, y: 542 },
    enabled: true,
    interiorTitle: 'THIRD FLOOR — THE GRAND LIBRARY & RARE MANUSCRIPTS',
    interiorDescription:
      'Floor-to-ceiling mahogany shelves housing codices, cipher keys, and historical archives.',
    interiorClueHint: 'Look between the folios in the locked western bay.',
  },
  {
    id: 'floor-2',
    floorNumber: 2,
    romanNumeral: 'II',
    label: 'Second Floor',
    subtitle: 'The Chronometer Hall',
    shortName: 'Level 02',
    outlinePaths: [
      'M 85.0,608.0 C 413.1,582.6 558.9,569.0 814.0,569.0 C 1068.1,569.0 1213.3,583.4 1540.0,610.0 L 1540.0,700.0 C 1213.3,674.6 1068.1,661.0 814.0,661.0 C 558.9,661.0 413.1,674.0 85.0,698.0 Z',
    ],
    hitAreaPaths: [
      'M 85.0,608.0 C 413.1,582.6 558.9,569.0 814.0,569.0 C 1068.1,569.0 1213.3,583.4 1540.0,610.0 L 1540.0,700.0 C 1213.3,674.6 1068.1,661.0 814.0,661.0 C 558.9,661.0 413.1,674.0 85.0,698.0 Z',
    ],
    windowTarget: { x: 280, y: 575, width: 105, height: 60 },
    cameraTarget: { x: 332, y: 605, scale: 3.8 },
    badgePosition: { x: 1180, y: 635 },
    enabled: true,
    interiorTitle: 'SECOND FLOOR — THE CHRONOMETER HALL',
    interiorDescription:
      'Intricate brass gearworks, pendulum clocks, and celestial dials measuring sidereal time.',
    interiorClueHint: 'The minute hand aligns with the relic azimuth.',
  },
  {
    id: 'floor-1',
    floorNumber: 1,
    romanNumeral: 'I',
    label: 'First Floor',
    subtitle: 'The Assembly Chamber & Reliquary',
    shortName: 'Level 01',
    outlinePaths: [
      'M 85.0,698.0 C 413.1,674.0 558.9,661.0 814.0,661.0 C 1068.1,661.0 1213.3,674.6 1540.0,700.0 L 1540.0,790.0 C 1213.3,766.0 1068.1,753.0 814.0,753.0 C 558.9,753.0 413.1,765.2 85.0,788.0 Z',
    ],
    hitAreaPaths: [
      'M 85.0,698.0 C 413.1,674.0 558.9,661.0 814.0,661.0 C 1068.1,661.0 1213.3,674.6 1540.0,700.0 L 1540.0,790.0 C 1213.3,766.0 1068.1,753.0 814.0,753.0 C 558.9,753.0 413.1,765.2 85.0,788.0 Z',
    ],
    windowTarget: { x: 895, y: 660, width: 105, height: 60 },
    cameraTarget: { x: 947, y: 690, scale: 3.8 },
    badgePosition: { x: 1180, y: 725 },
    enabled: true,
    interiorTitle: 'FIRST FLOOR — THE ASSEMBLY CHAMBER & RELIQUARY',
    interiorDescription:
      'The elevated concourse above the entrance, featuring display plinths and heraldic crests.',
    interiorClueHint: "The foundation stone bears the founder's cipher.",
  },
  {
    id: 'floor-G',
    floorNumber: 0,
    romanNumeral: 'G',
    label: 'Ground Floor',
    subtitle: 'The Grand Atrium & Vestibule',
    shortName: 'Level G',
    outlinePaths: [
      'M 85.0,788.0 C 413.1,765.2 558.9,753.0 814.0,753.0 C 1068.1,753.0 1213.3,766.0 1540.0,790.0 L 1540.0,880.0 C 1213.3,863.8 1068.1,855.0 814.0,855.0 C 558.9,855.0 413.1,863.8 85.0,880.0 Z',
    ],
    hitAreaPaths: [
      'M 85.0,788.0 C 413.1,765.2 558.9,753.0 814.0,753.0 C 1068.1,753.0 1213.3,766.0 1540.0,790.0 L 1540.0,880.0 C 1213.3,863.8 1068.1,855.0 814.0,855.0 C 558.9,855.0 413.1,863.8 85.0,880.0 Z',
    ],
    windowTarget: { x: 760, y: 840, width: 120, height: 75 },
    cameraTarget: { x: 820, y: 875, scale: 3.2 },
    badgePosition: { x: 1180, y: 818 },
    enabled: true,
    interiorTitle: 'GROUND FLOOR — THE GRAND ATRIUM & VESTIBULE',
    interiorDescription:
      'The soaring glass-front entrance hall connecting the campus courtyards with the academic block.',
    interiorClueHint: 'Search the illuminated showcase near the eastern archway.',
  },
];
