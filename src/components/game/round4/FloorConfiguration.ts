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
      'M 72.5,158.0 C 369.1,127.0 554.5,96.0 814.0,96.0 C 1069.8,96.0 1252.6,126.0 1545.0,156.0 L 1545.0,238.0 C 1252.6,212.0 1069.8,186.0 814.0,186.0 C 554.5,186.0 369.1,212.0 72.5,238.0 Z',
    ],
    hitAreaPaths: [
      'M 72.5,158.0 C 369.1,127.0 554.5,96.0 814.0,96.0 C 1069.8,96.0 1252.6,126.0 1545.0,156.0 L 1545.0,238.0 C 1252.6,212.0 1069.8,186.0 814.0,186.0 C 554.5,186.0 369.1,212.0 72.5,238.0 Z',
    ],
    windowTarget: { x: 984, y: 115, width: 100, height: 60 },
    cameraTarget: { x: 1034, y: 145, scale: 3.8 },
    badgePosition: { x: 1180, y: 155 },
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
      'M 69.0,238.0 C 367.0,212.0 553.2,186.0 814.0,186.0 C 1069.8,186.0 1252.6,212.0 1545.0,238.0 L 1545.0,332.0 C 1252.6,309.0 1069.8,286.0 814.0,286.0 C 553.2,286.0 367.0,308.0 69.0,330.0 Z',
    ],
    hitAreaPaths: [
      'M 69.0,238.0 C 367.0,212.0 553.2,186.0 814.0,186.0 C 1069.8,186.0 1252.6,212.0 1545.0,238.0 L 1545.0,332.0 C 1252.6,309.0 1069.8,286.0 814.0,286.0 C 553.2,286.0 367.0,308.0 69.0,330.0 Z',
    ],
    windowTarget: { x: 390, y: 290, width: 100, height: 60 },
    cameraTarget: { x: 440, y: 320, scale: 3.8 },
    badgePosition: { x: 1180, y: 250 },
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
      'M 66.5,330.0 C 365.5,308.0 552.4,286.0 814.0,286.0 C 1069.8,286.0 1252.6,309.0 1545.0,332.0 L 1545.0,426.0 C 1252.6,404.5 1069.8,383.0 814.0,383.0 C 552.4,383.0 365.5,403.5 66.5,424.0 Z',
    ],
    hitAreaPaths: [
      'M 66.5,330.0 C 365.5,308.0 552.4,286.0 814.0,286.0 C 1069.8,286.0 1252.6,309.0 1545.0,332.0 L 1545.0,426.0 C 1252.6,404.5 1069.8,383.0 814.0,383.0 C 552.4,383.0 365.5,403.5 66.5,424.0 Z',
    ],
    windowTarget: { x: 1255, y: 335, width: 100, height: 60 },
    cameraTarget: { x: 1305, y: 365, scale: 3.8 },
    badgePosition: { x: 1180, y: 345 },
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
      'M 65.0,424.0 C 364.6,403.5 551.9,383.0 814.0,383.0 C 1069.8,383.0 1252.6,404.5 1545.0,426.0 L 1545.0,518.0 C 1252.6,499.0 1069.8,480.0 814.0,480.0 C 551.9,480.0 364.6,499.0 65.0,518.0 Z',
    ],
    hitAreaPaths: [
      'M 65.0,424.0 C 364.6,403.5 551.9,383.0 814.0,383.0 C 1069.8,383.0 1252.6,404.5 1545.0,426.0 L 1545.0,518.0 C 1252.6,499.0 1069.8,480.0 814.0,480.0 C 551.9,480.0 364.6,499.0 65.0,518.0 Z',
    ],
    windowTarget: { x: 685, y: 435, width: 100, height: 60 },
    cameraTarget: { x: 735, y: 465, scale: 3.8 },
    badgePosition: { x: 1180, y: 440 },
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
      'M 65.0,518.0 C 364.6,499.0 551.9,480.0 814.0,480.0 C 1069.8,480.0 1252.6,499.0 1545.0,518.0 L 1545.0,610.0 C 1252.6,592.5 1069.8,575.0 814.0,575.0 C 551.9,575.0 364.6,592.5 65.0,610.0 Z',
    ],
    hitAreaPaths: [
      'M 65.0,518.0 C 364.6,499.0 551.9,480.0 814.0,480.0 C 1069.8,480.0 1252.6,499.0 1545.0,518.0 L 1545.0,610.0 C 1252.6,592.5 1069.8,575.0 814.0,575.0 C 551.9,575.0 364.6,592.5 65.0,610.0 Z',
    ],
    windowTarget: { x: 380, y: 512, width: 100, height: 62 },
    cameraTarget: { x: 430, y: 543, scale: 3.8 },
    badgePosition: { x: 1180, y: 535 },
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
      'M 66.5,610.0 C 365.5,592.5 552.4,575.0 814.0,575.0 C 1069.3,575.0 1251.7,592.5 1543.5,610.0 L 1543.5,702.0 C 1251.7,686.0 1069.3,670.0 814.0,670.0 C 552.4,670.0 365.5,686.0 66.5,702.0 Z',
    ],
    hitAreaPaths: [
      'M 66.5,610.0 C 365.5,592.5 552.4,575.0 814.0,575.0 C 1069.3,575.0 1251.7,592.5 1543.5,610.0 L 1543.5,702.0 C 1251.7,686.0 1069.3,670.0 814.0,670.0 C 552.4,670.0 365.5,686.0 66.5,702.0 Z',
    ],
    windowTarget: { x: 990, y: 605, width: 100, height: 64 },
    cameraTarget: { x: 1040, y: 637, scale: 3.8 },
    badgePosition: { x: 1180, y: 630 },
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
      'M 70.0,702.0 C 367.6,686.0 553.6,670.0 814.0,670.0 C 1068.5,670.0 1250.2,686.0 1541.0,702.0 L 1541.0,792.0 C 1250.2,777.0 1068.5,762.0 814.0,762.0 C 553.6,762.0 367.6,777.0 70.0,792.0 Z',
    ],
    hitAreaPaths: [
      'M 70.0,702.0 C 367.6,686.0 553.6,670.0 814.0,670.0 C 1068.5,670.0 1250.2,686.0 1541.0,702.0 L 1541.0,792.0 C 1250.2,777.0 1068.5,762.0 814.0,762.0 C 553.6,762.0 367.6,777.0 70.0,792.0 Z',
    ],
    windowTarget: { x: 1215, y: 712, width: 100, height: 64 },
    cameraTarget: { x: 1265, y: 744, scale: 3.8 },
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
      'M 73.5,792.0 C 369.7,777.0 554.8,762.0 814.0,762.0 C 1067.8,762.0 1249.0,777.0 1539.0,792.0 L 1539.0,885.0 C 1249.0,872.5 1067.8,860.0 814.0,860.0 C 554.8,860.0 369.7,871.0 73.5,882.0 Z',
    ],
    hitAreaPaths: [
      'M 73.5,792.0 C 369.7,777.0 554.8,762.0 814.0,762.0 C 1067.8,762.0 1249.0,777.0 1539.0,792.0 L 1539.0,885.0 C 1249.0,872.5 1067.8,860.0 814.0,860.0 C 554.8,860.0 369.7,871.0 73.5,882.0 Z',
    ],
    windowTarget: { x: 470, y: 800, width: 120, height: 75 },
    cameraTarget: { x: 530, y: 835, scale: 3.2 },
    badgePosition: { x: 1180, y: 820 },
    enabled: true,
    interiorTitle: 'GROUND FLOOR — THE GRAND ATRIUM & VESTIBULE',
    interiorDescription:
      'The soaring glass-front entrance hall connecting the campus courtyards with the academic block.',
    interiorClueHint: 'Search the illuminated showcase near the eastern archway.',
  },
];
