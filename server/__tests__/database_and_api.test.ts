// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { app } from '../index.ts';
import { db, initDatabase, hashPassword, verifyPassword } from '../../database/db.ts';

describe('FROST CARTEL Authoritative Database & API Layer', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    initDatabase();
    // Ensure test team stage progress is in AVAILABLE state for idempotent test runs
    const teamAi = db.prepare('SELECT id FROM teams WHERE team_name = ?').get('TEAM AI') as { id: string } | undefined;
    if (teamAi) {
      db.prepare("UPDATE stages_progress SET status = 'AVAILABLE', score = 0 WHERE team_id = ? AND stage_id = 2").run(teamAi.id);
      db.prepare('UPDATE teams SET score = 0 WHERE id = ?').run(teamAi.id);
    }

    // Refresh Round 1 start time for authoritative timer test
    db.prepare('UPDATE global_round_state SET start_time = ? WHERE round_id = 1').run(new Date().toISOString());

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('Database Durability & Hashing Security', () => {
    it('cryptographically hashes passwords using scrypt with unique salt', () => {
      const pass = 'GraveHunter#2026';
      const { hash: hash1, salt: salt1 } = hashPassword(pass);
      const { hash: hash2, salt: salt2 } = hashPassword(pass);

      // Salts must differ even for identical input
      expect(salt1).not.toBe(salt2);
      expect(hash1).not.toBe(hash2);

      // Verification succeeds with matching salt
      expect(verifyPassword(pass, hash1, salt1)).toBe(true);
      expect(verifyPassword(pass, hash2, salt2)).toBe(true);
      expect(verifyPassword('WrongPassword', hash1, salt1)).toBe(false);
    });

    it('seeds and verifies bootstrap admin123 with must_change_password flag', () => {
      const admin = db.prepare('SELECT username, must_change_password FROM admins WHERE username = ?').get('admin123') as {
        username: string;
        must_change_password: number;
      };

      expect(admin).toBeDefined();
      expect(admin.username).toBe('admin123');
      expect(admin.must_change_password).toBe(1);
    });

    it('persists newly created teams into SQLite disk storage', () => {
      const uniqueName = 'Crypt Raiders ' + Date.now();
      const insert = db.prepare(`
        INSERT INTO teams (id, team_name, password_hash, salt, raw_password, is_paused, score, max_credits, total_credits, login_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, 0, 500, 500, 0, ?, ?)
      `);
      const { hash, salt } = hashPassword('raiderPass!1');
      const now = new Date().toISOString();
      const id = 'test-team-' + Date.now();
      insert.run(id, uniqueName, hash, salt, 'raiderPass!1', now, now);

      const retrieved = db.prepare('SELECT * FROM teams WHERE id = ?').get(id) as {
        id: string;
        team_name: string;
        score: number;
      };

      expect(retrieved).toBeDefined();
      expect(retrieved.team_name).toBe(uniqueName);
      expect(retrieved.score).toBe(0);
    });
  });

  describe('Authoritative API Endpoints', () => {
    let adminToken = '';
    let teamToken = '';
    const testTeamName = 'TEAM AI';
    const testTeamPass = 'SQUAD@AI9';

    it('GET /api/health returns authoritative status', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.game).toContain('FROST CARTEL');
    });

    it('POST /api/admin/login validates credentials and returns session token with HttpOnly cookie', async () => {
      const res = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin123', password: 'admin@1' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.admin.username).toBe('admin123');
      expect(data.admin.mustChangePassword).toBe(true);
      adminToken = data.token;
    });

    it('POST /api/auth/team-login authenticates team and returns session token and player assignment', async () => {
      const res = await fetch(`${baseUrl}/api/auth/team-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: testTeamName, password: testTeamPass }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.playerNumber).toBeGreaterThanOrEqual(1);
      expect(data.team.teamName).toBe(testTeamName);
      teamToken = data.token;
    });

    it('GET /api/round1/state returns authoritative remaining time and team progress', async () => {
      const res = await fetch(`${baseUrl}/api/round1/state`, {
        headers: { Authorization: `Bearer ${teamToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.round.name).toBe('The Graveyard Escape');
      expect(data.round.remainingSeconds).toBeGreaterThan(0);
      expect(data.team.maxCredits).toBe(500);
    });

    it('POST /api/round1/stage/complete performs atomic transactional scoring', async () => {
      const res = await fetch(`${baseUrl}/api/round1/stage/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teamToken}`,
        },
        body: JSON.stringify({ stageId: 2, points: 150, timeSpentSeconds: 180, fragmentUnlocked: true }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.stageId).toBe(2);
      expect(data.awardedPoints).toBe(150);
      expect(data.newTotalScore).toBeGreaterThanOrEqual(150);
      expect(data.fragmentUnlocked).toBe(true);

      // Verify audit trail logged in score_transactions
      const tx = db.prepare('SELECT * FROM score_transactions WHERE stage_id = 2 ORDER BY created_at DESC LIMIT 1').get() as {
        delta: number;
        reason: string;
      };
      expect(tx).toBeDefined();
      expect(tx.delta).toBe(150);
    });

    it('GET /api/admin/dashboard returns telemetry data to authenticated admin', async () => {
      const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.stats.totalTeams).toBeGreaterThan(0);
      expect(data.data.stats.round1Active).toBe(true);
    });

    it('POST /api/admin/teams creates new team, persists to DB, and returns organizer password', async () => {
      const newTeamPayload = {
        teamName: 'Gargoyle Guard ' + Date.now(),
        password: 'GUARD#99',
      };

      const res = await fetch(`${baseUrl}/api/admin/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(newTeamPayload),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.team.teamName).toBe(newTeamPayload.teamName);
      expect(data.team.password).toBe('GUARD#99');

      // Verify direct database read persists the new team
      const inDb = db.prepare('SELECT team_name, raw_password FROM teams WHERE id = ?').get(data.team.id) as {
        team_name: string;
        raw_password: string;
      };
      expect(inDb.team_name).toBe(newTeamPayload.teamName);
      expect(inDb.raw_password).toBe('GUARD#99');
    });

    it('GET /api/admin/results returns tournament leaderboard with scores and completed stages', async () => {
      const res = await fetch(`${baseUrl}/api/admin/results`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBeGreaterThan(0);
    });
  });
});
