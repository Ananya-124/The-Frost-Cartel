import json

with open('public/assets/round-04/svg/floor-paths.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

floors_data = {f['id']: f['path'] for f in data['floors']}

floor_configs = [
    {
        'id': 'floor-7',
        'code': '07',
        'floorNumber': 7,
        'romanNumeral': 'VII',
        'label': 'Seventh Floor',
        'subtitle': 'The Celestial Archives & Observatory',
        'shortName': 'Level 07',
        'windowTarget': {'x': 960, 'y': 110, 'width': 100, 'height': 60},
        'cameraTarget': {'x': 1010, 'y': 140, 'scale': 3.8},
        'interiorTitle': 'SEVENTH FLOOR — THE CELESTIAL ARCHIVES & OBSERVATORY',
        'interiorDescription': 'The topmost level of the Platinum Jubilee Academic Block, crowned by an expansive panorama of the city and domed astronomical instruments.',
        'interiorClueHint': 'Look towards the high skylight alignments and stellar charts.'
    },
    {
        'id': 'floor-6',
        'code': '06',
        'floorNumber': 6,
        'romanNumeral': 'VI',
        'label': 'Sixth Floor',
        'subtitle': 'The Astrolabe Study & Scriptorium',
        'shortName': 'Level 06',
        'windowTarget': {'x': 360, 'y': 205, 'width': 100, 'height': 60},
        'cameraTarget': {'x': 410, 'y': 235, 'scale': 3.8},
        'interiorTitle': 'SIXTH FLOOR — THE ASTROLABE STUDY & SCRIPTORIUM',
        'interiorDescription': 'Sunlit manuscript benches and historic cartographic tables line the curved glass corridor.',
        'interiorClueHint': 'Historic compass points inscribed on the central balustrade.'
    },
    {
        'id': 'floor-5',
        'code': '05',
        'floorNumber': 5,
        'romanNumeral': 'V',
        'label': 'Fifth Floor',
        'subtitle': 'The Alchemical Laboratories',
        'shortName': 'Level 05',
        'windowTarget': {'x': 1260, 'y': 345, 'width': 100, 'height': 60},
        'cameraTarget': {'x': 1310, 'y': 375, 'scale': 3.8},
        'interiorTitle': 'FIFTH FLOOR — THE ALCHEMICAL LABORATORIES',
        'interiorDescription': 'Rows of precision alembics, specimen cases, and ancient metallurgical crucibles overlook the canopy.',
        'interiorClueHint': 'Check the periodic inscriptions behind the distillation apparatus.'
    },
    {
        'id': 'floor-4',
        'code': '04',
        'floorNumber': 4,
        'romanNumeral': 'IV',
        'label': 'Fourth Floor',
        'subtitle': "The Cartographer's Guild",
        'shortName': 'Level 04',
        'windowTarget': {'x': 600, 'y': 440, 'width': 100, 'height': 60},
        'cameraTarget': {'x': 650, 'y': 470, 'scale': 3.8},
        'interiorTitle': "FOURTH FLOOR — THE CARTOGRAPHER'S GUILD",
        'interiorDescription': 'Expansive draft tables covered in relief topography of the campus and ancient land deeds.',
        'interiorClueHint': 'A forgotten compass rose is etched into the stone flooring.'
    },
    {
        'id': 'floor-3',
        'code': '03',
        'floorNumber': 3,
        'romanNumeral': 'III',
        'label': 'Third Floor',
        'subtitle': 'The Grand Library & Rare Manuscripts',
        'shortName': 'Level 03',
        'windowTarget': {'x': 1015, 'y': 525, 'width': 100, 'height': 65},
        'cameraTarget': {'x': 1067, 'y': 557, 'scale': 3.8},
        'interiorTitle': 'THIRD FLOOR — THE GRAND LIBRARY & RARE MANUSCRIPTS',
        'interiorDescription': 'Floor-to-ceiling mahogany shelves housing codices, cipher keys, and historical archives.',
        'interiorClueHint': 'Look between the folios in the locked western bay.'
    },
    {
        'id': 'floor-2',
        'code': '02',
        'floorNumber': 2,
        'romanNumeral': 'II',
        'label': 'Second Floor',
        'subtitle': 'The Chronometer Hall',
        'shortName': 'Level 02',
        'windowTarget': {'x': 280, 'y': 575, 'width': 105, 'height': 60},
        'cameraTarget': {'x': 332, 'y': 605, 'scale': 3.8},
        'interiorTitle': 'SECOND FLOOR — THE CHRONOMETER HALL',
        'interiorDescription': 'Intricate brass gearworks, pendulum clocks, and celestial dials measuring sidereal time.',
        'interiorClueHint': 'The minute hand aligns with the relic azimuth.'
    },
    {
        'id': 'floor-1',
        'code': '01',
        'floorNumber': 1,
        'romanNumeral': 'I',
        'label': 'First Floor',
        'subtitle': 'The Assembly Chamber & Reliquary',
        'shortName': 'Level 01',
        'windowTarget': {'x': 895, 'y': 660, 'width': 105, 'height': 60},
        'cameraTarget': {'x': 947, 'y': 690, 'scale': 3.8},
        'interiorTitle': 'FIRST FLOOR — THE ASSEMBLY CHAMBER & RELIQUARY',
        'interiorDescription': 'The elevated concourse above the entrance, featuring display plinths and heraldic crests.',
        'interiorClueHint': "The foundation stone bears the founder's cipher."
    },
    {
        'id': 'floor-G',
        'code': 'G',
        'floorNumber': 0,
        'romanNumeral': 'G',
        'label': 'Ground Floor',
        'subtitle': 'The Grand Atrium & Vestibule',
        'shortName': 'Level G',
        'windowTarget': {'x': 530, 'y': 770, 'width': 200, 'height': 80},
        'cameraTarget': {'x': 630, 'y': 810, 'scale': 3.2},
        'interiorTitle': 'GROUND FLOOR — THE GRAND ATRIUM & VESTIBULE',
        'interiorDescription': 'The marble-columned entry pavilion with glazed revolving doors and mosaic floors.',
        'interiorClueHint': 'Follow the cardinal floor compass toward the central atrium.'
    }
]

out = '''export interface WindowTarget {
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
 * Authoritative 8-floor architectural configuration for:
 * B. S. NARAYAN PLATINUM JUBILEE ACADEMIC BLOCK
 *
 * Calibrated against the 1629x965 Ghibli artwork.
 * Includes precise architectural curvature and open-window coordinates
 * across all 8 floors (Level 07 down to Level G).
 */
export const COLLEGE_FLOORS: FloorDefinition[] = [
'''

for fc in floor_configs:
    code = fc['code']
    path_d = floors_data[code]
    out += f'''  {{
    id: '{fc['id']}',
    floorNumber: {fc['floorNumber']},
    romanNumeral: '{fc['romanNumeral']}',
    label: '{fc['label']}',
    subtitle: \"{fc['subtitle']}\",
    shortName: '{fc['shortName']}',
    outlinePaths: [
      '{path_d}',
    ],
    hitAreaPaths: [
      '{path_d}',
    ],
    windowTarget: {{ x: {fc['windowTarget']['x']}, y: {fc['windowTarget']['y']}, width: {fc['windowTarget']['width']}, height: {fc['windowTarget']['height']} }},
    cameraTarget: {{ x: {fc['cameraTarget']['x']}, y: {fc['cameraTarget']['y']}, scale: {fc['cameraTarget']['scale']} }},
    enabled: true,
    interiorTitle: \"{fc['interiorTitle']}\",
    interiorDescription:
      \"{fc['interiorDescription']}\",
    interiorClueHint: \"{fc['interiorClueHint']}\",
  }},
'''

out += '];\n'

with open('src/components/game/round4/FloorConfiguration.ts', 'w', encoding='utf-8') as f:
    f.write(out)

print('Generated FloorConfiguration.ts successfully!')
