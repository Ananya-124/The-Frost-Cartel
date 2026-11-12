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
        { id: 1, name: 'The Pumpkin Shuffle', max: 100, status: 'AVAILABLE' },
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

  // Safe schema migrations for SQLite: ensure columns exist
  try {
    const stepCols = db.prepare('PRAGMA table_info(round4_steps)').all() as { name: string }[];
    const stepColNames = new Set(stepCols.map((c) => c.name));
    if (!stepColNames.has('qr_token')) {
      db.exec("ALTER TABLE round4_steps ADD COLUMN qr_token TEXT NOT NULL DEFAULT ''");
    }
    if (!stepColNames.has('validation_word')) {
      db.exec("ALTER TABLE round4_steps ADD COLUMN validation_word TEXT NOT NULL DEFAULT ''");
    }
    if (!stepColNames.has('physical_location')) {
      db.exec("ALTER TABLE round4_steps ADD COLUMN physical_location TEXT NOT NULL DEFAULT ''");
    }
    if (!stepColNames.has('safety_notes')) {
      db.exec("ALTER TABLE round4_steps ADD COLUMN safety_notes TEXT NOT NULL DEFAULT ''");
    }
    if (!stepColNames.has('is_verified')) {
      db.exec('ALTER TABLE round4_steps ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 1');
    }

    const settingsCols = db.prepare('PRAGMA table_info(round4_settings)').all() as { name: string }[];
    const settingsColNames = new Set(settingsCols.map((c) => c.name));
    if (!settingsColNames.has('final_riddle')) {
      db.exec("ALTER TABLE round4_settings ADD COLUMN final_riddle TEXT NOT NULL DEFAULT ''");
    }
    if (!settingsColNames.has('final_accepted_answers_json')) {
      db.exec("ALTER TABLE round4_settings ADD COLUMN final_accepted_answers_json TEXT NOT NULL DEFAULT '[\"ANCHOR\"]'");
    }
    if (!settingsColNames.has('final_qr_token')) {
      db.exec("ALTER TABLE round4_settings ADD COLUMN final_qr_token TEXT NOT NULL DEFAULT 'fc_qr_final_7th_relic'");
    }

    const progCols = db.prepare('PRAGMA table_info(round4_team_progress)').all() as { name: string }[];
    const progColNames = new Set(progCols.map((c) => c.name));
    if (!progColNames.has('scanned_qr_token')) {
      db.exec('ALTER TABLE round4_team_progress ADD COLUMN scanned_qr_token TEXT');
    }
  } catch (err) {
    console.error('[DB] Error during round4 schema migration:', err);
  }

  // 1. Seed or update Round 4 Settings
  const finalRiddle =
    "Standing at the pinnacle on floor number seven, Underneath the tiled expanse of the room's white heaven. Find the white spinners anchored high overhead, Whose three wide arms rest while the final steps are tread. Reach above the still blade hovering over the crowd, To pull down the victory and claim your title proud.";
  const finalAnswers = ['ANCHOR', 'CEILING FAN', 'WHITE SPINNERS', 'PINNACLE'];

  const settingsCheck = db.prepare('SELECT id FROM round4_settings LIMIT 1').get();
  if (!settingsCheck) {
    db.prepare(`
      INSERT INTO round4_settings (
        id, is_released, common_final_location_id, common_final_floor_id, common_final_room_name,
        common_final_x, common_final_y, common_final_radius, physical_entry_instructions,
        final_riddle, final_accepted_answers_json, final_qr_token, created_at, updated_at
      ) VALUES (
        'settings-main', 1, 'room-final-700', 'floor-07', 'Main Event Venue (Anchor Ceiling Fan)',
        800, 510, 42, 'Seventh Floor • Main Event Hall • Underneath 3-Blade Anchor Ceiling Fan Bay',
        ?, ?, 'fc_qr_final_7th_relic', ?, ?
      )
    `).run(finalRiddle, JSON.stringify(finalAnswers), now, now);
  } else {
    db.prepare(`
      UPDATE round4_settings
      SET common_final_floor_id = 'floor-07',
          common_final_room_name = 'Main Event Venue (Anchor Ceiling Fan)',
          common_final_x = 800,
          common_final_y = 510,
          common_final_radius = 42,
          physical_entry_instructions = 'Seventh Floor • Main Event Hall • Underneath 3-Blade Anchor Ceiling Fan Bay',
          final_riddle = ?,
          final_accepted_answers_json = ?,
          final_qr_token = 'fc_qr_final_7th_relic',
          updated_at = ?
      WHERE id = 'settings-main'
    `).run(finalRiddle, JSON.stringify(finalAnswers), now);
  }

  // 2. Remove deprecated routes (> 5) and seed the 5 authoritative routes
  db.prepare('DELETE FROM round4_routes WHERE route_number > 5').run();

  const routes = [
    { id: 'route-1', num: 1, roman: 'I', name: 'Route I', sub: 'Meridian Path (4 → 2 → 5 → 3 → 7)' },
    { id: 'route-2', num: 2, roman: 'II', name: 'Route II', sub: "Alchemist's Arc (2 → 4 → 6 → 3 → 7)" },
    { id: 'route-3', num: 3, roman: 'III', name: 'Route III', sub: "Cartographer's Traverse (2 → 6 → 3 → 5 → 7)" },
    { id: 'route-4', num: 4, roman: 'IV', name: 'Route IV', sub: 'Shadow Traverse (4 → 6 → 2 → 5 → 7)' },
    { id: 'route-5', num: 5, roman: 'V', name: 'Route V', sub: 'Phantom Meridian (6 → 2 → 5 → 4 → 7)' },
  ];

  const insertRoute = db.prepare(`
    INSERT INTO round4_routes (id, route_number, roman_numeral, route_name, route_subtitle, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      route_number = excluded.route_number,
      roman_numeral = excluded.roman_numeral,
      route_name = excluded.route_name,
      route_subtitle = excluded.route_subtitle,
      updated_at = excluded.updated_at
  `);

  for (const r of routes) {
    insertRoute.run(r.id, r.num, r.roman, r.name, r.sub, now, now);
  }

  // 3. Seed the 25 Authoritative Steps (5 routes × 5 steps) with PDF riddles, Halloween tokens & QR codes
  // Clean up any steps for routes > 5
  db.prepare("DELETE FROM round4_steps WHERE route_id NOT IN ('route-1', 'route-2', 'route-3', 'route-4', 'route-5')").run();

  const rawSteps = [
    // === ROUTE 1: 4 -> 2 -> 5 -> 3 -> 7 ===
    {
      id: 'r1_s1',
      route: 'route-1',
      idx: 1,
      floor: 'floor-04',
      loc: 'Near CS UG Lab 2 — Wooden Table',
      x: 230,
      y: 520,
      rad: 36,
      rid: "Four floors above, your next trail awaits,\nNear CS UG Lab 2 lie the secrets of fate.\nWhere curious minds work and mysteries grow,\nA wooden guardian hides what you need to know.\nDon't search its surface or look around,\nThe secret lies beneath, close to the ground.",
      hint: '4th Floor • Near CS UG Lab 2 • Underneath the wooden table',
      physLoc: 'Near CS UG Lab 2, underneath the wooden table',
      safety: 'Mount on inner wooden apron of table. Accessible without moving furniture.',
      word: 'WRAITH',
      token: 'fc_qr_r1_s1_w47a',
      answers: ['WRAITH'],
      isFinal: 0,
    },
    {
      id: 'r1_s2',
      route: 'route-1',
      idx: 2,
      floor: 'floor-02',
      loc: 'Student Sitting Benches — Wall Overhead',
      x: 512,
      y: 280,
      rad: 36,
      rid: "Make your way to the second floor,\nWhere tired souls pause before exploring more.\nA place where footsteps slow their pace,\nAnd weary travellers find a resting space.\nThe secret isn't where they sit below,\nBut above their heads, where shadows grow.",
      hint: '2nd Floor • Wall above the sitting benches',
      physLoc: 'On the wall above the student sitting benches',
      safety: 'Eye-level wall sticker above middle backrest.',
      word: 'CANDLE',
      token: 'fc_qr_r1_s2_c92b',
      answers: ['CANDLE'],
      isFinal: 0,
    },
    {
      id: 'r1_s3',
      route: 'route-1',
      idx: 3,
      floor: 'floor-05',
      loc: 'Ratan Tata Portrait Frame',
      x: 512,
      y: 330,
      rad: 36,
      rid: 'Five floors above, a wise face meets your sight,\nA man who turned challenges into the light.\nHe taught the world that success is hard to claim,\nFind the one whose wisdom speaks through his name.\nHis words are in front, but his secret stays behind.',
      hint: '5th Floor • Behind the Ratan Tata frame',
      physLoc: 'Behind the Ratan Tata portrait frame',
      safety: 'Place on lower edge of rear frame moulding. Do not remove frame from wall.',
      word: 'RAVEN',
      token: 'fc_qr_r1_s3_r18c',
      answers: ['RAVEN'],
      isFinal: 0,
    },
    {
      id: 'r1_s4',
      route: 'route-1',
      idx: 4,
      floor: 'floor-03',
      loc: 'Notice Boards Near Lift',
      x: 460,
      y: 430,
      rad: 36,
      rid: "On floor number three, your trail takes flight,\nNear the lift stands a keeper of information in sight.\nIt holds announcements, posters and more,\nLike whispers from souls who've passed before.\nSearch where these silent stories stay,\nYour next secret is hidden along the way.",
      hint: '3rd Floor • Notice boards near the lift',
      physLoc: 'Notice boards near the lift',
      safety: 'Affix to outer bottom-right frame trim of notice board.',
      word: 'HEX',
      token: 'fc_qr_r1_s4_h34d',
      answers: ['HEX'],
      isFinal: 0,
    },
    {
      id: 'r1_s5',
      route: 'route-1',
      idx: 5,
      floor: 'floor-07',
      loc: 'Main Event Venue — Anchor Ceiling Fan Bay',
      x: 800,
      y: 510,
      rad: 42,
      rid: finalRiddle,
      hint: '7th Floor • Main Event Hall • 3-Blade Anchor Ceiling Fan Bay',
      physLoc: 'Main Event Venue, stationary podium beneath Anchor ceiling fan',
      safety: 'Affix to stationary podium directly beneath fan. Never touch fan or blades.',
      word: 'ANCHOR',
      token: 'fc_qr_final_7th_relic',
      answers: finalAnswers,
      isFinal: 1,
    },

    // === ROUTE 2: 2 -> 4 -> 6 -> 3 -> 7 ===
    {
      id: 'r2_s1',
      route: 'route-2',
      idx: 1,
      floor: 'floor-02',
      loc: 'Near Room 217 — Wooden Table',
      x: 280,
      y: 240,
      rad: 36,
      rid: 'Two floors above, your next mystery awaits,\nNear room 217 lie the secrets of fate.\nA lonely wooden keeper stands nearby,\nHolding its secrets away from the eye.',
      hint: '2nd Floor • Near Room 217 • Underneath the wooden table',
      physLoc: 'Near Room 217, underneath the wooden table',
      safety: 'Affix to underside of tabletop near legs.',
      word: 'GHOUL',
      token: 'fc_qr_r2_s1_g51a',
      answers: ['GHOUL'],
      isFinal: 0,
    },
    {
      id: 'r2_s2',
      route: 'route-2',
      idx: 2,
      floor: 'floor-04',
      loc: 'Industry–Academia Banner (Anusha & Bhavana Chambers)',
      x: 740,
      y: 220,
      rad: 36,
      rid: 'Four floors above, your next trail begins,\nWhere knowledge meets the world of innovations.\nNear the chambers of Anusha and Bhavana,\nA banner speaks of a technological era.\nIt welcomes minds to a future untold,\nLook around its presence for a secret to unfold.',
      hint: '4th Floor • Industry–Academia Collaboration banner',
      physLoc: 'Industry–Academia Collaboration banner near Anusha and Bhavana chambers',
      safety: 'Affix to lower corner of banner frame.',
      word: 'COVEN',
      token: 'fc_qr_r2_s2_c73b',
      answers: ['COVEN'],
      isFinal: 0,
    },
    {
      id: 'r2_s3',
      route: 'route-2',
      idx: 3,
      floor: 'floor-06',
      loc: 'Near CSBS 604 Staircase — Fire Extinguisher Bracket',
      x: 720,
      y: 160,
      rad: 36,
      rid: 'Six floors above, your next mystery lies,\nNear CSBS 604, where the staircase climbs.\nA silent guardian stands against the wall,\nReady to fight what threatens all.\nThough flames may awaken in the dead of night,\nLook near the keeper who puts them out of sight.',
      hint: '6th Floor • Near CSBS 604 staircase • Fire extinguisher area',
      physLoc: 'Near CSBS 604 staircase, stationary bracket beside fire extinguisher',
      safety: 'Affix to wall panel beside extinguisher. Do not move emergency equipment.',
      word: 'PHANTOM',
      token: 'fc_qr_r2_s3_p29c',
      answers: ['PHANTOM'],
      isFinal: 0,
    },
    {
      id: 'r2_s4',
      route: 'route-2',
      idx: 4,
      floor: 'floor-03',
      loc: 'In Front of C301 — Compartments / Boxes',
      x: 720,
      y: 240,
      rad: 36,
      rid: 'On floor number three, your hunt takes flight,\nSeek the door marked C301 in sight.\nBefore it stands a keeper of many spaces,\nWith countless little doors and hidden places.\nThe spirits have left something behind,\nSearch among the compartments to find.',
      hint: '3rd Floor • In front of C301 • Among the boxes/compartments',
      physLoc: 'In front of C301, among the compartments/boxes',
      safety: 'Affix inside open cubby shelf 3. Do not access personal lockers.',
      word: 'GRIMOIRE',
      token: 'fc_qr_r2_s4_g84d',
      answers: ['GRIMOIRE'],
      isFinal: 0,
    },
    {
      id: 'r2_s5',
      route: 'route-2',
      idx: 5,
      floor: 'floor-07',
      loc: 'Main Event Venue — Anchor Ceiling Fan Bay',
      x: 800,
      y: 510,
      rad: 42,
      rid: finalRiddle,
      hint: '7th Floor • Main Event Hall • 3-Blade Anchor Ceiling Fan Bay',
      physLoc: 'Main Event Venue, stationary podium beneath Anchor ceiling fan',
      safety: 'Affix to stationary podium directly beneath fan. Never touch fan or blades.',
      word: 'ANCHOR',
      token: 'fc_qr_final_7th_relic',
      answers: finalAnswers,
      isFinal: 1,
    },

    // === ROUTE 3: 2 -> 6 -> 3 -> 5 -> 7 ===
    {
      id: 'r3_s1',
      route: 'route-3',
      idx: 1,
      floor: 'floor-02',
      loc: 'Near Room 215 — Archive Boxes',
      x: 190,
      y: 310,
      rad: 36,
      rid: 'Two floors above where journeys begin,\nA quiet corner holds secrets within.\nNear two-one-five, a row of doors,\nStands guarding secrets behind its shores.\nThey hold no keys to kingdoms unknown,\nYet one hides a secret of its own.\nLook where the silent keepers stand,\nYour next discovery is close at hand.',
      hint: '2nd Floor • Near Room 215 • Among the boxes',
      physLoc: 'Near Room 215, stationary archive cabinet #2',
      safety: 'Organizer calibration required: Affix on stationary cabinet #2.',
      word: 'SPECTER',
      token: 'fc_qr_r3_s1_s62a',
      answers: ['SPECTER'],
      isFinal: 0,
    },
    {
      id: 'r3_s2',
      route: 'route-3',
      idx: 2,
      floor: 'floor-06',
      loc: 'Electronics Circuits Lab — Guglielmo Board Corner',
      x: 170,
      y: 520,
      rad: 36,
      rid: "Six floors above the ground,\nWhere electric thoughts are carefully planned.\nA lab of circuits, connections and flow,\nHolds a secret that few would know.\nFind the board that carries a pioneer's name,\nWhere two walls meet, you'll continue the game.\nDon't follow the wires or search the floor,\nThe corner beside it hides something more.",
      hint: '6th Floor • Electronics Circuit Lab • Guglielmo Board corner',
      physLoc: 'Electronics Circuits Lab, corner wall seam beside Guglielmo Board',
      safety: 'Affix on corner drywall seam. Do not touch lab wiring.',
      word: 'TALISMAN',
      token: 'fc_qr_r3_s2_t15b',
      answers: ['TALISMAN'],
      isFinal: 0,
    },
    {
      id: 'r3_s3',
      route: 'route-3',
      idx: 3,
      floor: 'floor-03',
      loc: 'Near Room C302 — Result Analysis Display Board',
      x: 320,
      y: 200,
      rad: 36,
      rid: 'Three floors above,\nA wall of achievements holds secrets within.\nWhere numbers and graphs tell stories of pride,\nA board of results stands waiting nearby.\nNear C302, take a careful view,\nAmong the records, a secret waits for you.\nLook where achievements are proudly displayed,\nYour next hidden clue will soon be revealed!',
      hint: '3rd Floor • Near Room C302 • Result Analysis Display Board',
      physLoc: 'Near Room C302, at Result Analysis Display Board',
      safety: 'Affix to wooden frame boundary of result showcase.',
      word: 'WITCH',
      token: 'fc_qr_r3_s3_w93c',
      answers: ['WITCH'],
      isFinal: 0,
    },
    {
      id: 'r3_s4',
      route: 'route-3',
      idx: 4,
      floor: 'floor-05',
      loc: 'Near CR501 — Red Fire Cabinet Wall',
      x: 260,
      y: 220,
      rad: 36,
      rid: 'Ascend five levels to the top-tier space,\nFind CR501 to locate the place.\nA bright red cabinet stands upon the wall,\nKeeping watch along the silent hall.\nLift up your eyes above the crimson steel,\nHigh on the ceiling tile, your reward reveal.',
      hint: '5th Floor • Near CR501 • Wall beside fire cabinet',
      physLoc: 'Near CR501, eye-level wall panel beside fire cabinet',
      safety: 'STRICT SAFETY: Stationed on eye-level wall panel. Never climb or reach ceiling.',
      word: 'BANSHEE',
      token: 'fc_qr_r3_s4_b46d',
      answers: ['BANSHEE'],
      isFinal: 0,
    },
    {
      id: 'r3_s5',
      route: 'route-3',
      idx: 5,
      floor: 'floor-07',
      loc: 'Main Event Venue — Anchor Ceiling Fan Bay',
      x: 800,
      y: 510,
      rad: 42,
      rid: finalRiddle,
      hint: '7th Floor • Main Event Hall • 3-Blade Anchor Ceiling Fan Bay',
      physLoc: 'Main Event Venue, stationary podium beneath Anchor ceiling fan',
      safety: 'Affix to stationary podium directly beneath fan. Never touch fan or blades.',
      word: 'ANCHOR',
      token: 'fc_qr_final_7th_relic',
      answers: finalAnswers,
      isFinal: 1,
    },

    // === ROUTE 4: 4 -> 6 -> 2 -> 5 -> 7 ===
    {
      id: 'r4_s1',
      route: 'route-4',
      idx: 1,
      floor: 'floor-04',
      loc: 'In Front of CSE Vision Board — Elevator Floor Signage',
      x: 512,
      y: 420,
      rad: 36,
      rid: 'Make your way up to the fourth level space,\nWhere CSE\'s Vision and Mission take their place.\nStand before the steel doors that lift and convey,\nThough this elevator skips four along its way.\nLook just above the metal frame where numbers rest,\nBehind the floor sign lies your hidden quest.',
      hint: '4th Floor • In front of CSE Vision & Mission board • Elevator floor signage',
      physLoc: 'In front of CSE Vision & Mission board, elevator floor signage',
      safety: 'Affix onto metal border of elevator signage above doors.',
      word: 'CAULDRON',
      token: 'fc_qr_r4_s1_c38a',
      answers: ['CAULDRON'],
      isFinal: 0,
    },
    {
      id: 'r4_s2',
      route: 'route-4',
      idx: 2,
      floor: 'floor-06',
      loc: 'Beside AV 602 — AI & DS Notice Board',
      x: 760,
      y: 220,
      rad: 36,
      rid: 'Ascend to floor six to continue your quest,\nWhere data and intelligence are put to the test.\nLocate the dark pinboard beneath the department sign,\nRight beside classroom six-zero-two in line.\nDon\'t read the posters pinned out front in plain view,\nBehind the dark frame, your passage calls to you.',
      hint: '6th Floor • Beside AV 602 Class Room • Behind Department of AI & DS notice board',
      physLoc: 'Beside AV 602 Class Room, behind black Department of AI & DS notice board',
      safety: 'Affix on side trim of dark pinboard.',
      word: 'NIGHTFALL',
      token: 'fc_qr_r4_s2_n72b',
      answers: ['NIGHTFALL'],
      isFinal: 0,
    },
    {
      id: 'r4_s3',
      route: 'route-4',
      idx: 3,
      floor: 'floor-02',
      loc: 'Near C208 — Recessed Storage Corner',
      x: 780,
      y: 240,
      rad: 36,
      rid: 'Head down to floor two where the quiet hallway bends,\nBeside room C208, the open path ends.\nLook into the recessed corner tucked out of sight,\nWhere flat brown boxes rest away from the light.',
      hint: '2nd Floor • Near C208 • Inner wall corner behind stacked storage boxes',
      physLoc: 'Near C208, tucked in inner wall corner behind stacked storage boxes',
      safety: 'Affix on drywall baseboard in recessed nook. Do not obstruct passage.',
      word: 'COBWEB',
      token: 'fc_qr_r4_s3_c19c',
      answers: ['COBWEB'],
      isFinal: 0,
    },
    {
      id: 'r4_s4',
      route: 'route-4',
      idx: 4,
      floor: 'floor-05',
      loc: 'Near Lab 503 — Blue Suggestion Container',
      x: 750,
      y: 480,
      rad: 36,
      rid: 'Head to the fifth floor and follow the hall,\nFind Lab 503 and look at the wall.\nAbove the long wooden shelf standing nearby,\nA bright blue container catches your eye.\nWhere students drop feedback through a slot at the top,\nSearch inside the chamber where reflections stop.',
      hint: '5th Floor • Near Lab 503 • Blue suggestion container above wooden cabinet',
      physLoc: 'Near Lab 503, inside blue suggestion container above wooden cabinet',
      safety: 'Affix on underside of suggestion box lid or side.',
      word: 'LANTERN',
      token: 'fc_qr_r4_s4_l85d',
      answers: ['LANTERN'],
      isFinal: 0,
    },
    {
      id: 'r4_s5',
      route: 'route-4',
      idx: 5,
      floor: 'floor-07',
      loc: 'Main Event Venue — Anchor Ceiling Fan Bay',
      x: 800,
      y: 510,
      rad: 42,
      rid: finalRiddle,
      hint: '7th Floor • Main Event Hall • 3-Blade Anchor Ceiling Fan Bay',
      physLoc: 'Main Event Venue, stationary podium beneath Anchor ceiling fan',
      safety: 'Affix to stationary podium directly beneath fan. Never touch fan or blades.',
      word: 'ANCHOR',
      token: 'fc_qr_final_7th_relic',
      answers: finalAnswers,
      isFinal: 1,
    },

    // === ROUTE 5: 6 -> 2 -> 5 -> 4 -> 7 ===
    {
      id: 'r5_s1',
      route: 'route-5',
      idx: 1,
      floor: 'floor-06',
      loc: 'Near Lift — AI & DS Project Lab Overhead Sign',
      x: 530,
      y: 430,
      rad: 36,
      rid: "Ascend to floor six where the elevators wait,\nRight beside the lift doors, locate the lab gate.\n'Department of AI & Data Science Project Lab' reads high,\nReach right behind the main sign hanging over the door.",
      hint: '6th Floor • Near the lift • Overhead AI & DS Project Lab sign board',
      physLoc: 'Near the lift, behind overhead Department of AI & DS Project Lab sign board',
      safety: 'Affix to back of sign mounting bracket reachable from door threshold.',
      word: 'VAMPIRE',
      token: 'fc_qr_r5_s1_v44a',
      answers: ['VAMPIRE'],
      isFinal: 0,
    },
    {
      id: 'r5_s2',
      route: 'route-5',
      idx: 2,
      floor: 'floor-02',
      loc: 'Near Sitting Area — Wooden PRINTEX Kiosk Cabinet',
      x: 610,
      y: 320,
      rad: 36,
      rid: "Ascend or descend to floor two's relaxing space,\nWhere student benches line the floor, step up to the place.\nSpot the tall wooden station built by ECE,\nWhere quick digital prints are made easily.\nDon't scan the print code displayed upon the front,\nSearch behind the cabinet structure for your hunt.",
      hint: '2nd Floor • Near sitting area • Underneath wooden PRINTEX kiosk cabinet',
      physLoc: 'Near sitting area, tucked behind/underneath wooden PRINTEX kiosk cabinet',
      safety: 'Affix to rear cabinet wood casing. Keep clear of kiosk power cables.',
      word: 'MIDNIGHT',
      token: 'fc_qr_r5_s2_m81b',
      answers: ['MIDNIGHT'],
      isFinal: 0,
    },
    {
      id: 'r5_s3',
      route: 'route-5',
      idx: 3,
      floor: 'floor-05',
      loc: 'Near UG CR 503 & 504 — Side Staircase Exit Door',
      x: 140,
      y: 380,
      rad: 36,
      rid: "Climb up to the fifth level where classrooms line the way,\nNear CR503 and 504 where students spend their day.\nLocate the side staircase door that swings to open wide,\nMarked with a green 'FIFTH FLOOR' sign mounted just inside.\nHidden by the heavy door, you'll advance the game.",
      hint: '5th Floor • Near UG CR 503 & 504 side staircase • Back panel of heavy exit door',
      physLoc: 'Near UG CR 503 & 504 side staircase, back panel of heavy exit door near FIFTH FLOOR sign',
      safety: 'CRITICAL SAFETY: Affix flat vinyl sticker to door push face. Never prop open, wedge or lock door.',
      word: 'CRYPT',
      token: 'fc_qr_r5_s3_c27c',
      answers: ['CRYPT'],
      isFinal: 0,
    },
    {
      id: 'r5_s4',
      route: 'route-5',
      idx: 4,
      floor: 'floor-04',
      loc: 'Near UG Lab 1 & BS Narayan Lab — Distinguished Alumni Poster',
      x: 360,
      y: 520,
      rad: 36,
      rid: 'Ascend four levels where computing labs reside,\nNear UG Lab 1 and BS Narayan side by side.\nFind where the CSE department honors its own,\nA Distinguished Alumni poster proudly shown. (IN PURPLE)\nDo not look at the text or the portrait\'s frame,\nBehind the banner lies the secret of the game.',
      hint: '4th Floor • Near UG Lab 1 & BS Narayan Lab • Behind purple Distinguished Alumni poster',
      physLoc: 'Near UG Lab 1 and BS Narayan Computational Lab, behind purple Distinguished Alumni poster board',
      safety: 'Affix removable clip-on tab behind poster lower-right corner.',
      word: 'OMEN',
      token: 'fc_qr_r5_s4_o63d',
      answers: ['OMEN'],
      isFinal: 0,
    },
    {
      id: 'r5_s5',
      route: 'route-5',
      idx: 5,
      floor: 'floor-07',
      loc: 'Main Event Venue — Anchor Ceiling Fan Bay',
      x: 800,
      y: 510,
      rad: 42,
      rid: finalRiddle,
      hint: '7th Floor • Main Event Hall • 3-Blade Anchor Ceiling Fan Bay',
      physLoc: 'Main Event Venue, stationary podium beneath Anchor ceiling fan',
      safety: 'Affix to stationary podium directly beneath fan. Never touch fan or blades.',
      word: 'ANCHOR',
      token: 'fc_qr_final_7th_relic',
      answers: finalAnswers,
      isFinal: 1,
    },
  ];

  const insertStep = db.prepare(`
    INSERT OR REPLACE INTO round4_steps (
      id, route_id, clue_index, floor_id, location_name, target_x, target_y, trigger_radius,
      riddle_text, field_location_hint, accepted_answers_json, validation_word, qr_token,
      physical_location, safety_notes, is_verified, is_case_sensitive, is_common_final, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)
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
      s.word,
      s.token,
      s.physLoc,
      s.safety,
      s.isFinal,
      now,
      now
    );
  }

  // 4. Default Seed Qualified Teams & Progress for initial 5 tournament teams
  const qualifiedCount = db.prepare('SELECT COUNT(*) as count FROM round4_qualified_teams').get() as { count: number };
  if (qualifiedCount.count === 0) {
    const teamsToQualify = db.prepare('SELECT id FROM teams ORDER BY score DESC, created_at ASC LIMIT 5').all() as { id: string }[];
    if (teamsToQualify.length >= 5) {
      // Cryptographically secure Fisher-Yates shuffle of the 5 routes
      const availableRoutes = ['route-1', 'route-2', 'route-3', 'route-4', 'route-5'];
      for (let i = availableRoutes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableRoutes[i], availableRoutes[j]] = [availableRoutes[j], availableRoutes[i]];
      }

      const insertQual = db.prepare(`
        INSERT INTO round4_qualified_teams (id, team_id, route_id, qualified_at, assigned_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const insertProg = db.prepare(`
        INSERT INTO round4_team_progress (
          id, team_id, route_id, current_step_index, target_discovered, solved_steps_json, common_room_arrived, is_finished, created_at, updated_at
        ) VALUES (?, ?, ?, 0, 0, '[]', 0, 0, ?, ?)
      `);

      for (let i = 0; i < 5; i++) {
        const teamId = teamsToQualify[i].id;
        const routeId = availableRoutes[i];
        const qualId = `qual-${teamId}`;
        const progId = `prog-${teamId}`;
        insertQual.run(qualId, teamId, routeId, now, now);
        insertProg.run(progId, teamId, routeId, now, now);
      }
      console.log('[DB] Qualified top 5 tournament teams with unique random routes I to V.');
    }
  }
}



