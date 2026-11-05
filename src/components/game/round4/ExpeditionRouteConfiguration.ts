/**
 * FROST CARTEL — ROUND 04: THE CAMPUS EXPEDITION
 * 7 Routes × 5 Sequential Clue Steps (35 Clue Steps Total)
 *
 * Configurable data model for cooperative campus treasure hunt.
 * Production riddles, coordinates, and codes can be injected or updated
 * without changing the core game engine.
 */

import type { ExpeditionRoute } from '../../../types/round4Expedition.types';

export const EXPEDITION_ROUTES: ExpeditionRoute[] = [
  {
    routeId: 'route-1',
    routeNumber: 1,
    romanNumeral: 'I',
    routeName: 'Route I',
    routeSubtitle: 'The Celestial Meridian & Solar Horizon',
    steps: [
      {
        stepId: 'r1_s1',
        clueIndex: 1,
        floorId: 'floor-7',
        locationName: 'Lecture Hall 701 — North Chalkboard',
        targetPoint: { x: 500, y: 130 }, // Top-Right Classroom near blackboard
        triggerRadius: 36,
        riddle:
          'Where the lecturer’s chalk marks the morning equinox, find the brass inscription engraved beneath the northern slate.',
        fieldLocationHint: 'Level 07 • Room 701 (Lecture Hall) • Northern Chalkboard Frame',
        acceptedCodes: ['RIVET7', 'EQUINOX', '701'],
      },
      {
        stepId: 'r1_s2',
        clueIndex: 2,
        floorId: 'floor-7',
        locationName: 'Central Atrium — Mosaic Compass Rose',
        targetPoint: { x: 280, y: 260 }, // Center Courtyard Tile
        triggerRadius: 36,
        riddle:
          'Stand upon the carved marble needle pointing to true north. Read the four Roman initials etched into the bronze meridian ring.',
        fieldLocationHint: 'Level 07 • Central Courtyard Balcony • Bronze Floor Meridian',
        acceptedCodes: ['MERIDIAN', 'NORTH', 'AZIMUTH'],
      },
      {
        stepId: 'r1_s3',
        clueIndex: 3,
        floorId: 'floor-7',
        locationName: 'Advanced Informatics Bay — Terminal 04',
        targetPoint: { x: 155, y: 330 }, // Bottom-Left Computer Lab
        triggerRadius: 36,
        riddle:
          'Behind the fourth workstation where cathode screens once hummed, discover the serial number stamped into the metal chassis.',
        fieldLocationHint: 'Level 07 • Room 704 (Computer Lab) • Terminal 04 Chassis Tag',
        acceptedCodes: ['BAY4', 'SILICON', 'TERMINAL'],
      },
      {
        stepId: 'r1_s4',
        clueIndex: 4,
        floorId: 'floor-7',
        locationName: 'Western Reading Hall — Antiquities Cabinet',
        targetPoint: { x: 165, y: 135 }, // Top-Left Reading Room
        triggerRadius: 36,
        riddle:
          'Between folio volumes of 1947 and 1952, a locked wooden vitrine holds the founder’s surveying compass. Enter its calibration year.',
        fieldLocationHint: 'Level 07 • Room 702 (Western Reading Hall) • Vitrine Plaque',
        acceptedCodes: ['1947', 'COMPASS', 'PLATINUM'],
      },
      {
        stepId: 'r1_s5',
        clueIndex: 5,
        floorId: 'floor-7',
        locationName: 'Northern Grand Staircase — Vault Keystone',
        targetPoint: { x: 280, y: 125 }, // North Stair Landing
        triggerRadius: 36,
        riddle:
          'Ascend the ceremonial stairs to the observatory doorway. The keystone bears a winged cipher. Decode the three letters.',
        fieldLocationHint: 'Level 07 • North Stairwell Archway • Keystone Inscription',
        acceptedCodes: ['BSN', 'KEYSTONE', 'APEX'],
      },
    ],
  },
  {
    routeId: 'route-2',
    routeNumber: 2,
    romanNumeral: 'II',
    routeName: 'Route II',
    routeSubtitle: "The Cartographer's Traverse",
    steps: [
      {
        stepId: 'r2_s1',
        clueIndex: 1,
        floorId: 'floor-6',
        locationName: 'Astrolabe Draft Station',
        targetPoint: { x: 420, y: 140 },
        triggerRadius: 36,
        riddle:
          'On the curved drafting desk overlooking the canopy, count the radial degrees etched on the brass protractor.',
        fieldLocationHint: 'Level 06 • East Scriptorium • Drafting Desk 02',
        acceptedCodes: ['180', 'RADIAL', 'CHART'],
      },
      {
        stepId: 'r2_s2',
        clueIndex: 2,
        floorId: 'floor-6',
        locationName: 'Rare Atlas Repository',
        targetPoint: { x: 160, y: 145 },
        triggerRadius: 36,
        riddle:
          'The atlas of the Deccan plateau contains a hand-drawn river delta. What is the name of the western headland?',
        fieldLocationHint: 'Level 06 • West Folio Shelves • Deccan Folio',
        acceptedCodes: ['DELTA', 'RIVER', 'PLATEAU'],
      },
      {
        stepId: 'r2_s3',
        clueIndex: 3,
        floorId: 'floor-6',
        locationName: 'The Pendulum Gallery',
        targetPoint: { x: 280, y: 250 },
        triggerRadius: 36,
        riddle:
          'Observe the oscillation scale inscribed beneath the bronze sphere. Enter the recorded oscillation period in seconds.',
        fieldLocationHint: 'Level 06 • Center Atrium Void • Pendulum Marker',
        acceptedCodes: ['4', 'OSCILLATE', 'GRAVITY'],
      },
      {
        stepId: 'r2_s4',
        clueIndex: 4,
        floorId: 'floor-6',
        locationName: 'Terrestrial Globe Alcove',
        targetPoint: { x: 155, y: 320 },
        triggerRadius: 36,
        riddle:
          'Spin the copper globe to the Tropic of Cancer. Locate the engraved sailing ship and enter its carved name.',
        fieldLocationHint: 'Level 06 • South Study Room • Copper Globe',
        acceptedCodes: ['VOYAGER', 'CARAVEL', 'HORIZON'],
      },
      {
        stepId: 'r2_s5',
        clueIndex: 5,
        floorId: 'floor-6',
        locationName: 'Surveyor’s Transit Vault',
        targetPoint: { x: 440, y: 320 },
        triggerRadius: 36,
        riddle:
          'The theodolite stand carries an inspection stamp from the Department of Public Works. Enter the inspector’s badge code.',
        fieldLocationHint: 'Level 06 • Southeast Instrument Vault • Transit Case',
        acceptedCodes: ['DPW44', 'TRANSIT', 'BEARING'],
      },
    ],
  },
  {
    routeId: 'route-3',
    routeNumber: 3,
    romanNumeral: 'III',
    routeName: 'Route III',
    routeSubtitle: 'The Alchemical Pathway & Crucible',
    steps: [
      {
        stepId: 'r3_s1',
        clueIndex: 1,
        floorId: 'floor-5',
        locationName: 'Metallurgy Hearth — Crucible 03',
        targetPoint: { x: 490, y: 135 },
        triggerRadius: 36,
        riddle:
          'Beside the high-temperature muffle furnace, inspect the refractory brick maker’s mark. What element symbol is stamped?',
        fieldLocationHint: 'Level 05 • Laboratory 502 • Furnace Brickwork',
        acceptedCodes: ['PT', 'PLATINUM', '78'],
      },
      {
        stepId: 'r3_s2',
        clueIndex: 2,
        floorId: 'floor-5',
        locationName: 'Distillation Gallery',
        targetPoint: { x: 280, y: 255 },
        triggerRadius: 36,
        riddle:
          'Seven glass condenser coils drain into a single beaker. Count the spiral revolutions in the central borosilicate tube.',
        fieldLocationHint: 'Level 05 • Center Chemical Display • Spiral Alembic',
        acceptedCodes: ['12', 'SPIRAL', 'CONDENSER'],
      },
      {
        stepId: 'r3_s3',
        clueIndex: 3,
        floorId: 'floor-5',
        locationName: 'Reagents Safe 09',
        targetPoint: { x: 150, y: 330 },
        triggerRadius: 36,
        riddle:
          'The heavy brass dial of the chemical vault has three engraved numbers in red enamel. Enter the combination sequence.',
        fieldLocationHint: 'Level 05 • Chemical Storage • Safe 09 Dial',
        acceptedCodes: ['369', 'REAGENT', 'VAULT'],
      },
      {
        stepId: 'r3_s4',
        clueIndex: 4,
        floorId: 'floor-5',
        locationName: 'Analytical Balance Chamber',
        targetPoint: { x: 160, y: 140 },
        triggerRadius: 36,
        riddle:
          'Under the glass bell jar, the brass counterweight set is missing one tare weight. What is the weight stamped on its empty velvet slot?',
        fieldLocationHint: 'Level 05 • Precision Weighing Bay • Velvet Box',
        acceptedCodes: ['50G', 'TARE', 'BALANCE'],
      },
      {
        stepId: 'r3_s5',
        clueIndex: 5,
        floorId: 'floor-5',
        locationName: 'Fume Scrubber Tower',
        targetPoint: { x: 430, y: 320 },
        triggerRadius: 36,
        riddle:
          'Look to the vent manifold where exhaust pressures are monitored. Read the green safe-zone gauge limit.',
        fieldLocationHint: 'Level 05 • East Terrace Entry • Pressure Manifold',
        acceptedCodes: ['100', 'PASCAL', 'BAR'],
      },
    ],
  },
  {
    routeId: 'route-4',
    routeNumber: 4,
    romanNumeral: 'IV',
    routeName: 'Route IV',
    routeSubtitle: 'The Chronometer Passage & Escapement',
    steps: [
      {
        stepId: 'r4_s1',
        clueIndex: 1,
        floorId: 'floor-4',
        locationName: 'Master Tower Clock Mechanism',
        targetPoint: { x: 500, y: 130 },
        triggerRadius: 36,
        riddle:
          'The deadbeat escapement clicks once every two beats. How many teeth line the escape wheel?',
        fieldLocationHint: 'Level 04 • Clock Tower Control • Escape Wheel Gear',
        acceptedCodes: ['30', 'ESCAPEMENT', 'DEADBEAT'],
      },
      {
        stepId: 'r4_s2',
        clueIndex: 2,
        floorId: 'floor-4',
        locationName: 'Solar Noon Heliostat',
        targetPoint: { x: 280, y: 260 },
        triggerRadius: 36,
        riddle:
          'A beam of midday sunlight reflects through the ceiling slit onto the stone floor line. Read the engraved solstice marker.',
        fieldLocationHint: 'Level 04 • Central Corridor • Noon Beam Meridian',
        acceptedCodes: ['SOLSTICE', 'JUNE', 'ZENITH'],
      },
      {
        stepId: 'r4_s3',
        clueIndex: 3,
        floorId: 'floor-4',
        locationName: 'Chronograph Calibration Bench',
        targetPoint: { x: 155, y: 330 },
        triggerRadius: 36,
        riddle:
          'A vintage Swiss marine chronometer is suspended in gimbals. What is the chronometer maker’s serial number?',
        fieldLocationHint: 'Level 04 • Timekeeping Bench • Chronometer Case',
        acceptedCodes: ['CHRONO88', 'GIMBAL', 'TICK'],
      },
      {
        stepId: 'r4_s4',
        clueIndex: 4,
        floorId: 'floor-4',
        locationName: 'Tuning Fork Resonator',
        targetPoint: { x: 165, y: 135 },
        triggerRadius: 36,
        riddle:
          'The large acoustic tuning fork is tuned to standard concert pitch. Enter the engraved frequency in Hertz.',
        fieldLocationHint: 'Level 04 • Acoustic Lab • Resonance Plaque',
        acceptedCodes: ['440', '440HZ', 'A440'],
      },
      {
        stepId: 'r4_s5',
        clueIndex: 5,
        floorId: 'floor-4',
        locationName: 'Archival Ledger of Bell Chimes',
        targetPoint: { x: 440, y: 320 },
        triggerRadius: 36,
        riddle:
          'The carillon toll record reveals which melody sounded during the foundation ceremony. Enter the hymn name.',
        fieldLocationHint: 'Level 04 • Bell Ringer Registry • 1962 Entry',
        acceptedCodes: ['CARILLON', 'HYMN', 'CHIME'],
      },
    ],
  },
  {
    routeId: 'route-5',
    routeNumber: 5,
    romanNumeral: 'V',
    routeName: 'Route V',
    routeSubtitle: 'The Bibliotheca Arcana & Rare Manuscripts',
    steps: [
      {
        stepId: 'r5_s1',
        clueIndex: 1,
        floorId: 'floor-3',
        locationName: 'Restricted Stacks — Bay 07',
        targetPoint: { x: 500, y: 130 },
        triggerRadius: 36,
        riddle:
          'Behind the wire cage in Bay 07, inspect the spine of the oldest cataloged volume. Enter the call number letters.',
        fieldLocationHint: 'Level 03 • Stacks 07 • Rare Folio Spine',
        acceptedCodes: ['QA76', 'CATALOG', 'FOLIO'],
      },
      {
        stepId: 'r5_s2',
        clueIndex: 2,
        floorId: 'floor-3',
        locationName: 'Microfiche Cabinet 14',
        targetPoint: { x: 280, y: 260 },
        triggerRadius: 36,
        riddle:
          'Slide out drawer 14 and read the label on the negative roll dated November 1974.',
        fieldLocationHint: 'Level 03 • Microfilm Room • Drawer 14 Tag',
        acceptedCodes: ['1974', 'FICHE', 'ARCHIVE'],
      },
      {
        stepId: 'r5_s3',
        clueIndex: 3,
        floorId: 'floor-3',
        locationName: 'The Illumination Desk',
        targetPoint: { x: 155, y: 330 },
        triggerRadius: 36,
        riddle:
          'The green shaded reading lamp base bears an antique iron foundry mark. What city is named?',
        fieldLocationHint: 'Level 03 • Reading Desk 09 • Lamp Foundry Stamp',
        acceptedCodes: ['BANGALORE', 'FOUNDRY', 'BRASS'],
      },
      {
        stepId: 'r5_s4',
        clueIndex: 4,
        floorId: 'floor-3',
        locationName: 'Rare Map Drawers — Drawer 03',
        targetPoint: { x: 165, y: 135 },
        triggerRadius: 36,
        riddle:
          'The blueprint for the Jubilee foundation shows an underground culvert. What is its diameter in centimeters?',
        fieldLocationHint: 'Level 03 • Map Chest • Jubilee Blueprint 01',
        acceptedCodes: ['120', 'CULVERT', 'BLUEPRINT'],
      },
      {
        stepId: 'r5_s5',
        clueIndex: 5,
        floorId: 'floor-3',
        locationName: 'The Cypher Folio Display',
        targetPoint: { x: 440, y: 320 },
        triggerRadius: 36,
        riddle:
          'The locked showcase displays a handwritten cryptogram from 1968. Enter the first decrypted word.',
        fieldLocationHint: 'Level 03 • Central Showcase • 1968 Note',
        acceptedCodes: ['AURORA', 'CIPHER', 'SECRET'],
      },
    ],
  },
  {
    routeId: 'route-6',
    routeNumber: 6,
    romanNumeral: 'VI',
    routeName: 'Route VI',
    routeSubtitle: "The Founder's Quadrant & Reliquary",
    steps: [
      {
        stepId: 'r6_s1',
        clueIndex: 1,
        floorId: 'floor-2',
        locationName: 'The Ceremonial Mace Stand',
        targetPoint: { x: 500, y: 130 },
        triggerRadius: 36,
        riddle:
          'The silver mace head is adorned with four lion emblems. Count the petals on the lotus base beneath them.',
        fieldLocationHint: 'Level 02 • Council Hallway • Mace Display Stand',
        acceptedCodes: ['16', 'LOTUS', 'MACE'],
      },
      {
        stepId: 'r6_s2',
        clueIndex: 2,
        floorId: 'floor-2',
        locationName: 'Portrait of B. S. Narayan',
        targetPoint: { x: 280, y: 260 },
        triggerRadius: 36,
        riddle:
          'Examine the gilded frame of the founder’s portrait. What Sanskrit motto is engraved upon the brass cartouche?',
        fieldLocationHint: 'Level 02 • Portrait Gallery • Founder Cartouche',
        acceptedCodes: ['VIDYA', 'FOUNDER', 'NARAYAN'],
      },
      {
        stepId: 'r6_s3',
        clueIndex: 3,
        floorId: 'floor-2',
        locationName: 'The Memorial Trowel Case',
        targetPoint: { x: 155, y: 330 },
        triggerRadius: 36,
        riddle:
          'The silver ceremonial trowel used to lay the first cornerstone is preserved in velvet. Enter the inscribed year.',
        fieldLocationHint: 'Level 02 • Relic Vitrine 02 • Foundation Trowel',
        acceptedCodes: ['1962', 'CORNERSTONE', 'TROWEL'],
      },
      {
        stepId: 'r6_s4',
        clueIndex: 4,
        floorId: 'floor-2',
        locationName: 'Honor Roll Bronze Plaque',
        targetPoint: { x: 165, y: 135 },
        triggerRadius: 36,
        riddle:
          'The top line of the donor plaque honors the chief architect. What is the surname inscribed in raised copper letters?',
        fieldLocationHint: 'Level 02 • West Concourse • Bronze Honor Plaque',
        acceptedCodes: ['RAO', 'ARCHITECT', 'PLAQUE'],
      },
      {
        stepId: 'r6_s5',
        clueIndex: 5,
        floorId: 'floor-2',
        locationName: 'The Seal of Academic Excellence',
        targetPoint: { x: 440, y: 320 },
        triggerRadius: 36,
        riddle:
          'Look closely at the heraldic crest on the double teak doors. What mythological beast guards the flame of knowledge?',
        fieldLocationHint: 'Level 02 • Council Chamber Doors • Teak Carving',
        acceptedCodes: ['GARUDA', 'EAGLE', 'FLAME'],
      },
    ],
  },
  {
    routeId: 'route-7',
    routeNumber: 7,
    romanNumeral: 'VII',
    routeName: 'Route VII',
    routeSubtitle: 'The Platinum Vault & Grand Atrium',
    steps: [
      {
        stepId: 'r7_s1',
        clueIndex: 1,
        floorId: 'floor-1',
        locationName: 'Grand Concourse Balustrade',
        targetPoint: { x: 500, y: 130 },
        triggerRadius: 36,
        riddle:
          'Overlook the entrance atrium from the first-floor mezzanine. Count the structural glass fins supporting the canopy.',
        fieldLocationHint: 'Level 01 • Mezzanine Balcony • Glass Canopy Fins',
        acceptedCodes: ['8', 'EIGHT', 'CANOPY'],
      },
      {
        stepId: 'r7_s2',
        clueIndex: 2,
        floorId: 'floor-1',
        locationName: 'The Platinum Jubilee Time Capsule',
        targetPoint: { x: 280, y: 260 },
        triggerRadius: 36,
        riddle:
          'Embedded in the terrazzo floor lies the sealed stainless capsule. When is it scheduled to be opened?',
        fieldLocationHint: 'Level 01 • Concourse Center • Capsule Seal',
        acceptedCodes: ['2062', 'CAPSULE', 'CENTURY'],
      },
      {
        stepId: 'r7_s3',
        clueIndex: 3,
        floorId: 'floor-G',
        locationName: 'Ground Vestibule — Foundation Pillar',
        targetPoint: { x: 155, y: 330 },
        triggerRadius: 36,
        riddle:
          'The massive granite pillar beside the turnstiles holds a polished bronze benchmark. Enter the elevation above sea level.',
        fieldLocationHint: 'Ground Floor • Main Atrium • Benchmark Plaque',
        acceptedCodes: ['920M', '920', 'ALTITUDE'],
      },
      {
        stepId: 'r7_s4',
        clueIndex: 4,
        floorId: 'floor-G',
        locationName: 'The Rotary Campus Model',
        targetPoint: { x: 165, y: 135 },
        triggerRadius: 36,
        riddle:
          'Beneath the miniature scale model of the Platinum Jubilee block, a silver keyhole remains. What word is stamped on the keyhole ring?',
        fieldLocationHint: 'Ground Floor • Center Showcase • Scale Model Base',
        acceptedCodes: ['CARTEL', 'MASTER', 'KEYHOLE'],
      },
      {
        stepId: 'r7_s5',
        clueIndex: 5,
        floorId: 'floor-G',
        locationName: 'The Master Relic Chamber Door',
        targetPoint: { x: 440, y: 320 },
        triggerRadius: 36,
        riddle:
          'The final heavy vault door requires the master cooperative passphrase discovered across all seven expeditions. Enter it now to claim victory!',
        fieldLocationHint: 'Ground Floor • Eastern Archway • The Final Chamber',
        acceptedCodes: ['FROSTCARTEL', 'VICTORY', 'PLATINUMJUBILEE'],
      },
    ],
  },
];

/**
 * Helper to get a route by routeId or routeNumber
 */
export function getExpeditionRoute(routeIdOrNumber: string | number): ExpeditionRoute {
  if (typeof routeIdOrNumber === 'number') {
    return EXPEDITION_ROUTES[routeIdOrNumber - 1] || EXPEDITION_ROUTES[0];
  }
  return EXPEDITION_ROUTES.find((r) => r.routeId === routeIdOrNumber) || EXPEDITION_ROUTES[0];
}
