import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword, verifyPassword } from '../../database/db.ts';

describe('Authoritative Database Durability & Restart Verification', () => {
  const DB_PATH = path.resolve(process.cwd(), 'database', 'frost_cartel.db');

  it('preserves newly created teams and stage data across complete database reload / restart', () => {
    const testId = 'restart-test-' + Date.now();
    const testTeamName = 'Immortal Crypt ' + Date.now();
    const testPass = 'CryptKey#2026';
    const { hash, salt } = hashPassword(testPass);
    const now = new Date().toISOString();

    // 1. Initial write connection
    {
      const db1 = new DatabaseSync(DB_PATH);
      db1.exec('PRAGMA foreign_keys = ON;');
      const insert = db1.prepare(`
        INSERT INTO teams (id, team_name, password_hash, salt, raw_password, is_paused, score, max_credits, total_credits, login_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, 150, 500, 500, 1, ?, ?)
      `);
      insert.run(testId, testTeamName, hash, salt, testPass, now, now);

      const insertStage = db1.prepare(`
        INSERT INTO stages_progress (id, team_id, stage_id, stage_name, status, score, max_score, created_at, updated_at)
        VALUES (?, ?, 2, 'The Haunted Image Hunt', 'COMPLETED', 150, 150, ?, ?)
      `);
      insertStage.run(`stg-${testId}-2`, testId, now, now);

      db1.close();
    }

    // 2. Simulated complete restart - new fresh connection without in-memory cache
    {
      const db2 = new DatabaseSync(DB_PATH);
      const team = db2.prepare('SELECT * FROM teams WHERE id = ?').get(testId) as {
        id: string;
        team_name: string;
        password_hash: string;
        salt: string;
        score: number;
        is_paused: number;
      };

      expect(team).toBeDefined();
      expect(team.team_name).toBe(testTeamName);
      expect(team.score).toBe(150);
      expect(team.is_paused).toBe(0);

      // Verify cryptographic password verification succeeds on fresh connection
      expect(verifyPassword(testPass, team.password_hash, team.salt)).toBe(true);

      const stage = db2.prepare('SELECT * FROM stages_progress WHERE team_id = ? AND stage_id = 2').get(testId) as {
        status: string;
        score: number;
      };
      expect(stage).toBeDefined();
      expect(stage.status).toBe('COMPLETED');
      expect(stage.score).toBe(150);

      // Clean up test team
      db2.prepare('DELETE FROM teams WHERE id = ?').run(testId);
      db2.close();
    }
  });
});

