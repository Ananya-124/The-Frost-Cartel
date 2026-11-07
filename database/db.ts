import { DatabaseSync } from 'node:sqlite';
import * as crypto from 'node:crypto';
import * as path from 'node:path';
import * as fs from 'node:fs';

const DB_DIR = path.resolve(process.cwd(), 'database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.SQLITE_DB_PATH || path.join(DB_DIR, 'frost_cartel.db');

export const db = new DatabaseSync(DB_PATH);

// Execute pragmas for optimal SQLite durability and concurrent read performance
try {
  db.exec('PRAGMA busy_timeout = 10000;');
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (err) {
  console.warn('[DB] SQLite PRAGMA configuration notice:', err);
}

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export function initDatabase(): void {
  const schemaPath = path.join(DB_DIR, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  seedBootstrapData();
}

export function seedBootstrapData(): void {
  const now = new Date().toISOString();

  // 1. Seed or verify Admin
  const adminCheck = db.prepare('SELECT id FROM admins WHERE username = ?');
  const bootstrapUsername = process.env.ADMIN_BOOTSTRAP_USER || 'admin123';
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'admin@1';

  const existingAdmin = adminCheck.get(bootstrapUsername);
  if (!existingAdmin) {
    const { hash, salt } = hashPassword(bootstrapPassword);
    const adminId = 'admin-' + crypto.randomUUID();
    const insertAdmin = db.prepare(`
      INSERT INTO admins (id, username, password_hash, salt, role, must_change_password, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'superadmin', 1, ?, ?)
    `);
    insertAdmin.run(adminId, bootstrapUsername, hash, salt, now, now);
    console.log(`[DB] Seeded initial admin account: ${bootstrapUsername} (must_change_password=1)`);
  }

  // 2. Seed Global Round 1 state
  const roundCheck = db.prepare('SELECT id FROM global_round_state WHERE round_id = 1');
  if (!roundCheck.get()) {
    const insertRound = db.prepare(`
      INSERT INTO global_round_state (id, round_id, round_name, is_active, duration_seconds, start_time, created_at, updated_at)
      VALUES (?, 1, 'The Graveyard Escape', 1, 1320, ?, ?, ?)
    `);
    insertRound.run('round-1', now, now, now);
    console.log('[DB] Seeded Round 1 state: The Graveyard Escape (22:00 duration)');
  }

  // 3. Seed initial tournament teams if none exist
  const teamCountRow = db.prepare('SELECT COUNT(*) as count FROM teams').get() as { count: number };
  if (teamCountRow.count === 0) {
    const defaultTeams = [
      { name: 'TEAM AI', pass: 'SQUAD@AI9' },
      { name: 'TEAM1', pass: 'TEAM1@2026' },
      { name: 'Shadow Syndicate', pass: 'SHADOW#88' },
      { name: 'Grave Walkers', pass: 'GRAVE#44' },
      { name: 'Cursed Alchemists', pass: 'ALCHEMY!22' },
      {name:'a',pass:'aaa'}
    ];

    for (const team of defaultTeams) {
      const teamId = 'team-' + crypto.randomUUID();
      const { hash, salt } = hashPassword(team.pass);
      const insertTeam = db.prepare(`
        INSERT INTO teams (id, team_name, password_hash, salt, raw_password, is_paused, score, max_credits, total_credits, login_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, 0, 500, 500, 0, ?, ?)
      `);
      insertTeam.run(teamId, team.name, hash, salt, team.pass, now, now);

      // Seed initial stages for each team
      const stages = [
        { id: 1, name: 'The Unknown Challenge', max: 100, status: 'NOT CONFIGURED' },
        { id: 2, name: 'The Haunted Image Hunt', max: 150, status: 'AVAILABLE' },
        { id: 3, name: 'The Forgotten Graveyard', max: 250, status: 'LOCKED' },
      ];

      for (const st of stages) {
        const stageProgressId = `stg-${teamId}-${st.id}`;
        const insertStage = db.prepare(`
          INSERT INTO stages_progress (id, team_id, stage_id, stage_name, status, score, max_score, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
        `);
        insertStage.run(stageProgressId, teamId, st.id, st.name, st.status, st.max, now, now);
      }
    }
    console.log(`[DB] Seeded ${defaultTeams.length} initial tournament teams.`);
  }

  // Ensure at least 7 tournament teams exist for Round 4 qualification
  const allTeams = db.prepare('SELECT id, team_name FROM teams ORDER BY created_at ASC').all() as { id: string; team_name: string }[];
  if (allTeams.length < 7) {
    const additionalTeams = [
      { name: 'Phantom Cartographers', pass: 'CARTEL#77' },
      { name: 'Celestial Seekers', pass: 'SEEKER!99' },
    ];
    for (const team of additionalTeams) {
      if (!allTeams.some((t) => t.team_name === team.name)) {
        const teamId = 'team-' + crypto.randomUUID();
        const { hash, salt } = hashPassword(team.pass);
        db.prepare(`
          INSERT INTO teams (id, team_name, password_hash, salt, raw_password, is_paused, score, max_credits, total_credits, login_count, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 0, 0, 500, 500, 0, ?, ?)
        `).run(teamId, team.name, hash, salt, team.pass, now, now);
      }
    }
  }

  seedRound4Data();
}

export function seedRound4Data(): void {
  const now = new Date().toISOString();

  // 1. Seed Round 4 Settings
  const settingsCheck = db.prepare('SELECT id FROM round4_settings LIMIT 1').get();
  if (!settingsCheck) {
    db.prepare(`
      INSERT INTO round4_settings (
        id, is_released, common_final_location_id, common_final_floor_id, common_final_room_name,
        common_final_x, common_final_y, common_final_radius, physical_entry_instructions, created_at, updated_at
      ) VALUES ('settings-main', 1, 'room-final-700', 'floor-7', 'The Celestial Archives & Observatory Vault', 280, 125, 36, 'Level 07 • North Archway • Final Chamber Doors', ?, ?)
    `).run(now, now);
  }

  // 2. Seed the 7 Routes
  const routeCount = db.prepare('SELECT COUNT(*) as count FROM round4_routes').get() as { count: number };
  if (routeCount.count === 0) {
    const routes = [
      { id: 'route-1', num: 1, roman: 'I', name: 'Route I', sub: 'The Celestial Meridian & Solar Horizon' },
      { id: 'route-2', num: 2, roman: 'II', name: 'Route II', sub: "The Cartographer's Traverse" },
      { id: 'route-3', num: 3, roman: 'III', name: 'Route III', sub: 'The Alchemical Cryptogram' },
      { id: 'route-4', num: 4, roman: 'IV', name: 'Route IV', sub: 'The Scriptorium Cipher' },
      { id: 'route-5', num: 5, roman: 'V', name: 'Route V', sub: 'The Platinum Block Chronology' },
      { id: 'route-6', num: 6, roman: 'VI', name: 'Route VI', sub: "The Astronomer's Needle" },
      { id: 'route-7', num: 7, roman: 'VII', name: 'Route VII', sub: 'The Keystone Pilgrimage' },
    ];

    const insertRoute = db.prepare(`
      INSERT INTO round4_routes (id, route_number, roman_numeral, route_name, route_subtitle, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const r of routes) {
      insertRoute.run(r.id, r.num, r.roman, r.name, r.sub, now, now);
    }
  }

  // 3. Seed the 35 Steps (7 routes × 5 steps: 4 independent + 1 common final room with route-specific riddle)
  const stepCount = db.prepare('SELECT COUNT(*) as count FROM round4_steps').get() as { count: number };
  if (stepCount.count < 35) {
    const rawSteps = [
      // ROUTE I
      { id: 'r1_s1', route: 'route-1', idx: 1, floor: 'floor-7', loc: 'Lecture Hall 701 — North Slate', x: 500, y: 130, rad: 36, rid: 'Where the lecturer’s chalk marks the morning equinox, find the brass inscription engraved beneath the northern slate.', hint: 'Level 07 • Room 701 (Lecture Hall) • Northern Chalkboard Frame', answers: ['RIVET7', 'EQUINOX', '701'], isFinal: 0 },
      { id: 'r1_s2', route: 'route-1', idx: 2, floor: 'floor-7', loc: 'Central Atrium — Mosaic Compass Rose', x: 280, y: 260, rad: 36, rid: 'Stand upon the carved marble needle pointing to true north. Read the four Roman initials etched into the bronze meridian ring.', hint: 'Level 07 • Central Courtyard Balcony • Bronze Floor Meridian', answers: ['MERIDIAN', 'NORTH', 'AZIMUTH'], isFinal: 0 },
      { id: 'r1_s3', route: 'route-1', idx: 3, floor: 'floor-7', loc: 'Informatics Bay — Terminal 04', x: 155, y: 330, rad: 36, rid: 'Behind the fourth workstation where cathode screens once hummed, discover the serial number stamped into the metal chassis.', hint: 'Level 07 • Room 704 (Computer Lab) • Terminal 04 Chassis Tag', answers: ['BAY4', 'SILICON', 'TERMINAL'], isFinal: 0 },
      { id: 'r1_s4', route: 'route-1', idx: 4, floor: 'floor-7', loc: 'Western Reading Hall — Antiquities Cabinet', x: 165, y: 135, rad: 36, rid: 'Between folio volumes of 1947 and 1952, a locked wooden vitrine holds the founder’s surveying compass. Enter its calibration year.', hint: 'Level 07 • Room 702 (Western Reading Hall) • Vitrine Plaque', answers: ['1947', 'COMPASS', 'PLATINUM'], isFinal: 0 },
      { id: 'r1_s5', route: 'route-1', idx: 5, floor: 'floor-7', loc: 'The Celestial Archives & Observatory Vault', x: 280, y: 125, rad: 36, rid: 'Ascend the ceremonial stairs to the observatory doorway. The keystone bears a winged cipher. Decode the three letters.', hint: 'Level 07 • North Archway • Final Keystone Inscription', answers: ['BSN', 'KEYSTONE', 'APEX'], isFinal: 1 },

      // ROUTE II
      { id: 'r2_s1', route: 'route-2', idx: 1, floor: 'floor-6', loc: 'Astrolabe Draft Station', x: 420, y: 140, rad: 36, rid: 'On the curved drafting desk overlooking the canopy, count the radial degrees etched on the brass protractor.', hint: 'Level 06 • East Scriptorium • Drafting Desk 02', answers: ['180', 'RADIAL', 'CHART'], isFinal: 0 },
      { id: 'r2_s2', route: 'route-2', idx: 2, floor: 'floor-6', loc: 'Architectural Archive Stacks — Aisle D', x: 135, y: 150, rad: 36, rid: 'Follow shelf column D to the blue binding titled "Structural Elevations 1965". What is the folio stamp number?', hint: 'Level 06 • Archive Room • Shelf Column D', answers: ['65D', 'BLUE', 'ELEVATION'], isFinal: 0 },
      { id: 'r2_s3', route: 'route-2', idx: 3, floor: 'floor-6', loc: 'Faculty Seminar Room — Podium Drawer', x: 490, y: 310, rad: 36, rid: 'Beneath the mahogany lecturer podium, a brass plate conceals a four-letter guild motto.', hint: 'Level 06 • Room 603 (Seminar Hall) • Podium Base', answers: ['LUX', 'ORDO', 'MIND'], isFinal: 0 },
      { id: 'r2_s4', route: 'route-2', idx: 4, floor: 'floor-6', loc: 'Southern Balcony Balustrade', x: 280, y: 360, rad: 36, rid: 'Look towards the courtyard fountain from the stone railing. The southern plinth holds an iron mason mark.', hint: 'Level 06 • South Colonnade • Balustrade Stone Center', answers: ['MASON', 'PLINTH', 'STONE'], isFinal: 0 },
      { id: 'r2_s5', route: 'route-2', idx: 5, floor: 'floor-7', loc: 'The Celestial Archives & Observatory Vault', x: 280, y: 125, rad: 36, rid: 'At the high skylight alignment, count the brass celestial rings suspended beneath the dome.', hint: 'Level 07 • North Archway • Final Celestial Dome Rings', answers: ['SEVEN', 'ORBIT', 'CELESTIAL'], isFinal: 1 },

      // ROUTE III
      { id: 'r3_s1', route: 'route-3', idx: 1, floor: 'floor-5', loc: 'Organic Synthesis Lab — Cabinet 09', x: 140, y: 140, rad: 36, rid: 'Inside the copper reagent cabinet, locate bottle labeled with the atomic weight of silver.', hint: 'Level 05 • Room 501 • Copper Reagent Locker', answers: ['108', 'ARGENTUM', 'SILVER'], isFinal: 0 },
      { id: 'r3_s2', route: 'route-3', idx: 2, floor: 'floor-5', loc: 'Analytical Balance Chamber', x: 220, y: 320, rad: 36, rid: 'On the vibration-free granite slab, calibrate the balance needle to read the zero point tare value.', hint: 'Level 05 • Balance Niche • Granite Calibration Plate', answers: ['TARE', 'ZERO', 'BALANCE'], isFinal: 0 },
      { id: 'r3_s3', route: 'route-3', idx: 3, floor: 'floor-5', loc: 'Central Corridor — Herbarium Display', x: 380, y: 220, rad: 36, rid: 'Examine the dried belladonna leaf mounted in the botanical frame. Identify the collector’s field number.', hint: 'Level 05 • Center Hall • Glass Vitrine 03', answers: ['BELL42', 'NIGHTSHADE', 'FLORA'], isFinal: 0 },
      { id: 'r3_s4', route: 'route-3', idx: 4, floor: 'floor-5', loc: 'East Distillation Tower', x: 505, y: 280, rad: 36, rid: 'Where condensers rise through the mezzanine ceiling, count the cooling coils wrapped in brass wire.', hint: 'Level 05 • East Lab • Condenser Column 01', answers: ['TWELVE', '12', 'SPIRAL'], isFinal: 0 },
      { id: 'r3_s5', route: 'route-3', idx: 5, floor: 'floor-7', loc: 'The Celestial Archives & Observatory Vault', x: 280, y: 125, rad: 36, rid: 'Before the vault threshold, decipher the Latin motto carved into the archway lintel.', hint: 'Level 07 • North Archway • Final Lintel Inscription', answers: ['VERITAS', 'ARCHWAY', 'LINTEL'], isFinal: 1 },

      // ROUTE IV
      { id: 'r4_s1', route: 'route-4', idx: 1, floor: 'floor-4', loc: 'Manuscript Conservation Lab', x: 440, y: 130, rad: 36, rid: 'On the illuminated parchment easel, align the watermark grid with the golden ratio cipher.', hint: 'Level 04 • Conservation Lab • Easel 01', answers: ['PHI', 'WATERMARK', '1618'], isFinal: 0 },
      { id: 'r4_s2', route: 'route-4', idx: 2, floor: 'floor-4', loc: 'Rare Bindings Stack — Row 14', x: 150, y: 230, rad: 36, rid: 'Locate the heavy leather-bound ledger labeled "Faculty Minutes 1958". What is the monogram on the brass clasp?', hint: 'Level 04 • Stack 14 • Brass Clasp', answers: ['FMC', 'MONOGRAM', 'CLASP'], isFinal: 0 },
      { id: 'r4_s3', route: 'route-4', idx: 3, floor: 'floor-4', loc: 'Central Scriptorium — Great Oak Table', x: 280, y: 270, rad: 36, rid: 'Carved into the underside of the central oak table is an eight-digit grid coordinate.', hint: 'Level 04 • Center Reading Table • Underside Plaque', answers: ['884126', 'COORD', 'CENTRAL'], isFinal: 0 },
      { id: 'r4_s4', route: 'route-4', idx: 4, floor: 'floor-4', loc: 'Printing Press Exhibition', x: 495, y: 330, rad: 36, rid: 'The cast-iron Gutenberg reproduction lever points to a letter case. What metal typeset letter is locked inside?', hint: 'Level 04 • East Annex • Press Bed Frame', answers: ['OMEGA', 'LEVER', 'TYPE'], isFinal: 0 },
      { id: 'r4_s5', route: 'route-4', idx: 5, floor: 'floor-7', loc: 'The Celestial Archives & Observatory Vault', x: 280, y: 125, rad: 36, rid: 'On the bronze astrolabe pedestal in the final chamber, note the meridian angle.', hint: 'Level 07 • North Archway • Final Astrolabe Pedestal', answers: ['ANGLE360', 'MERIDIAN', 'ZENITH'], isFinal: 1 },

      // ROUTE V
      { id: 'r5_s1', route: 'route-5', idx: 1, floor: 'floor-3', loc: 'Dean of Engineering Suite — Fireplace Mantle', x: 160, y: 130, rad: 36, rid: 'Behind the brass clock on the ceremonial stone mantle, find the founder’s initials stamped into the brickwork.', hint: 'Level 03 • Room 301 • Mantle Clock', answers: ['BSN1962', 'MANTLE', 'CLOCK'], isFinal: 0 },
      { id: 'r5_s2', route: 'route-5', idx: 2, floor: 'floor-3', loc: 'Civil Engineering Materials Lab', x: 480, y: 140, rad: 36, rid: 'The hydraulic press pressure dial has a red calibration tick. Enter the maximum metric tonnage.', hint: 'Level 03 • Materials Lab • Pressure Gauge', answers: ['500T', 'HYDRAULIC', 'PRESSURE'], isFinal: 0 },
      { id: 'r5_s3', route: 'route-5', idx: 3, floor: 'floor-3', loc: 'Founders Memorial Gallery', x: 280, y: 260, rad: 36, rid: 'Read the fifth line inscribed on the foundation bronze tablet unveiled in 1962.', hint: 'Level 03 • Central Gallery • Bronze Plaque', answers: ['DEDICATION', 'FOUNDATION', '1962'], isFinal: 0 },
      { id: 'r5_s4', route: 'route-5', idx: 4, floor: 'floor-3', loc: 'Surveying Instrument Armory', x: 180, y: 340, rad: 36, rid: 'Inside the transit theodolite case #3, find the serial number on the optical prism barrel.', hint: 'Level 03 • Armory Locker 03 • Theodolite Case', answers: ['PRISM03', 'TRANSIT', 'OPTIC'], isFinal: 0 },
      { id: 'r5_s5', route: 'route-5', idx: 5, floor: 'floor-7', loc: 'The Celestial Archives & Observatory Vault', x: 280, y: 125, rad: 36, rid: 'The observatory ledger rests upon the central lectern. Read the final accession date.', hint: 'Level 07 • North Archway • Final Central Lectern', answers: ['1974', 'ARCHIVE', 'RECORD'], isFinal: 1 },

      // ROUTE VI
      { id: 'r6_s1', route: 'route-6', idx: 1, floor: 'floor-2', loc: 'Applied Physics Wave Tank', x: 460, y: 135, rad: 36, rid: 'Where acoustic transducers generate harmonic waves, count the resonant nodal lines marked on the acrylic wall.', hint: 'Level 02 • Room 204 • Acrylic Tank', answers: ['HARMONIC', 'NODAL', 'ACOUSTIC'], isFinal: 0 },
      { id: 'r6_s2', route: 'route-6', idx: 2, floor: 'floor-2', loc: 'Laser Interferometer Darkroom', x: 150, y: 160, rad: 36, rid: 'Inspect the helium-neon optical beam splitter base. Enter the wavelength engraved in nanometers.', hint: 'Level 02 • Optics Darkroom • Beam Splitter 01', answers: ['633NM', '633', 'HELIOS'], isFinal: 0 },
      { id: 'r6_s3', route: 'route-6', idx: 3, floor: 'floor-2', loc: 'Cryogenic Storage Bay', x: 340, y: 300, rad: 36, rid: 'On the vacuum flask relief valve, check the pressure safety seal stamp.', hint: 'Level 02 • Cryo Bay • Flask 02 Valve', answers: ['CRYO', 'VACUUM', 'NITROGEN'], isFinal: 0 },
      { id: 'r6_s4', route: 'route-6', idx: 4, floor: 'floor-2', loc: 'West Faculty Lounge — Grandfather Clock', x: 135, y: 320, rad: 36, rid: 'Open the pendulum cabinet door. Note the engraved weight maker name.', hint: 'Level 02 • Lounge West • Clock Cabinet', answers: ['CHRONOS', 'PENDULUM', 'TIME'], isFinal: 0 },
      { id: 'r6_s5', route: 'route-6', idx: 5, floor: 'floor-7', loc: 'The Celestial Archives & Observatory Vault', x: 280, y: 125, rad: 36, rid: 'Beneath the glass dome, inspect the primary telescope brass mounting plate.', hint: 'Level 07 • North Archway • Final Telescope Mounting', answers: ['REFRACTOR', 'HORIZON', 'OPTIC'], isFinal: 1 },

      // ROUTE VII
      { id: 'r7_s1', route: 'route-7', idx: 1, floor: 'floor-1', loc: 'Main Foyer — Granite Foundation Stone', x: 280, y: 350, rad: 36, rid: 'At the grand glass entrance beneath the canopy, locate the cornerstone laid in memory of the founders.', hint: 'Level 01 • Main Entrance Foyer • Cornerstone', answers: ['CORNERSTONE', 'PLATINUM', 'FOUNDER'], isFinal: 0 },
      { id: 'r7_s2', route: 'route-7', idx: 2, floor: 'floor-1', loc: 'Auditorium Projection Booth', x: 480, y: 220, rad: 36, rid: 'Behind the twin 35mm carbon-arc projectors, check the lens focal length stencil on the steel casing.', hint: 'Level 01 • Auditorium Balcony • Booth Lens Stencil', answers: ['75MM', 'CARBON', 'CINEMA'], isFinal: 0 },
      { id: 'r7_s3', route: 'route-7', idx: 3, floor: 'floor-1', loc: 'Historical Trophy Cabinet', x: 150, y: 250, rad: 36, rid: 'Find the 1968 Inter-Collegiate Debating Chalice. Read the inscription on the silver base.', hint: 'Level 01 • Trophy Corridor • Glass Cabinet 02', answers: ['CHALICE', '1968', 'ORATORY'], isFinal: 0 },
      { id: 'r7_s4', route: 'route-7', idx: 4, floor: 'floor-1', loc: 'Dean’s Executive Boardroom', x: 160, y: 140, rad: 36, rid: 'Behind the presidential portrait, a discreet safe bears a 4-dial letter combination.', hint: 'Level 01 • Boardroom North • Behind Portrait', answers: ['DEAN', 'SAFE', 'COUNCIL'], isFinal: 0 },
      { id: 'r7_s5', route: 'route-7', idx: 5, floor: 'floor-7', loc: 'The Celestial Archives & Observatory Vault', x: 280, y: 125, rad: 36, rid: 'Upon the vault portal seal, translate the four celestial runes surrounding the sun emblem.', hint: 'Level 07 • North Archway • Final Sun Emblem Seal', answers: ['SOLARIS', 'CROWN', 'RADIANT'], isFinal: 1 },
    ];

    const insertStep = db.prepare(`
      INSERT OR REPLACE INTO round4_steps (
        id, route_id, clue_index, floor_id, location_name, target_x, target_y, trigger_radius,
        riddle_text, field_location_hint, accepted_answers_json, is_case_sensitive, is_common_final, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `);

    for (const s of rawSteps) {
      insertStep.run(
        s.id,
        s.route,
        s.idx,
        s.floor,
        s.loc,
        s.x,
        s.y,
        s.rad,
        s.rid,
        s.hint,
        JSON.stringify(s.answers),
        s.isFinal,
        now,
        now
      );
    }
  }

  // 4. Default Seed Qualified Teams & Progress for initial 7 teams if none exist
  const qualifiedCount = db.prepare('SELECT COUNT(*) as count FROM round4_qualified_teams').get() as { count: number };
  if (qualifiedCount.count === 0) {
    const teamsToQualify = db.prepare('SELECT id FROM teams ORDER BY created_at ASC LIMIT 7').all() as { id: string }[];
    if (teamsToQualify.length >= 7) {
      const insertQual = db.prepare(`
        INSERT INTO round4_qualified_teams (id, team_id, route_id, qualified_at, assigned_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const insertProg = db.prepare(`
        INSERT INTO round4_team_progress (
          id, team_id, route_id, current_step_index, target_discovered, solved_steps_json, common_room_arrived, is_finished, created_at, updated_at
        ) VALUES (?, ?, ?, 0, 0, '[]', 0, 0, ?, ?)
      `);

      for (let i = 0; i < 7; i++) {
        const teamId = teamsToQualify[i].id;
        const routeId = `route-${i + 1}`;
        const qualId = `qual-${teamId}`;
        const progId = `prog-${teamId}`;
        insertQual.run(qualId, teamId, routeId, now, now);
        insertProg.run(progId, teamId, routeId, now, now);
      }
      console.log('[DB] Qualified 7 initial tournament teams and assigned Routes I to VII.');
    }
  }
}


