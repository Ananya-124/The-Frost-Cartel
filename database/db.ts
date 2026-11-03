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
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

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
}
