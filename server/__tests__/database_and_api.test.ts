// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Pool } from 'pg';
import { runMigrations } from '../../database/postgres/migration-runner.ts';
import { ensureBootstrapAdmin } from '../../database/postgres/bootstrapAdmin.ts';
import { hashPassword, verifyPassword } from '../auth/password.ts';

const testUrl = process.env.PG_TEST_DATABASE_URL;
if (!testUrl) throw new Error('PG_TEST_DATABASE_URL must point to the isolated local PostgreSQL test database.');
const parsedTestUrl = new URL(testUrl);
if (!['localhost', '127.0.0.1', '::1'].includes(parsedTestUrl.hostname)) throw new Error('Remote PostgreSQL hosts are refused in integration tests.');
const schemaName = `frost_identity_${randomUUID().replaceAll('-', '')}`;
const schemaOwner = new Pool({ connectionString: testUrl });
await schemaOwner.query(`CREATE SCHEMA "${schemaName}"`);
const scopedUrl = new URL(testUrl);
scopedUrl.searchParams.set('options', `-c search_path=${schemaName}`);
process.env.DATABASE_URL = scopedUrl.toString();
process.env.PGSSLMODE = 'disable';
const migrationPool = new Pool({ connectionString: process.env.DATABASE_URL });
await runMigrations(migrationPool, path.resolve('database/postgres/migrations'));
const [{ app }, { postgresPool }] = await Promise.all([
  import('../index.ts'), import('../../database/postgres/pool.ts'),
]);
if (!postgresPool) throw new Error('Test PostgreSQL pool did not initialize.');

describe('FROST CARTEL Authoritative Database & API Layer', () => {
  let server: Server;
  let baseUrl: string;
  const adminName = `identity-admin-${randomUUID()}`;
  const adminPass = 'Identity-Admin-Password-42';

  beforeAll(async () => {
    await ensureBootstrapAdmin(postgresPool, { ...process.env, ADMIN_BOOTSTRAP_USER: adminName, ADMIN_BOOTSTRAP_PASSWORD: adminPass });
    const teamId = `identity-team-${randomUUID()}`;
    const teamCredential = hashPassword('SQUAD@AI9');
    await postgresPool.query('INSERT INTO teams(id,team_name,password_hash,salt) VALUES($1,$2,$3,$4)', [teamId, 'TEAM AI', teamCredential.hash, teamCredential.salt]);
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
    await postgresPool.end();
    await migrationPool.end();
    await schemaOwner.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await schemaOwner.end();
  });

  describe('PostgreSQL Identity & Hashing Security', () => {
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

    it('creates a hashed first PostgreSQL admin once and does not reset or recreate it on later startup', async () => {
      const existing = await postgresPool.query<{ username: string; password_hash: string; salt: string }>(
        'SELECT username,password_hash,salt FROM admins WHERE username=$1', [adminName]);
      expect(existing.rowCount).toBe(1);
      expect(existing.rows[0].password_hash).not.toBe(adminPass);
      expect(verifyPassword(adminPass, existing.rows[0].password_hash, existing.rows[0].salt)).toBe(true);
      await ensureBootstrapAdmin(postgresPool, { ADMIN_BOOTSTRAP_USER: 'replacement-admin', ADMIN_BOOTSTRAP_PASSWORD: 'Another-Admin-Password-42' } as NodeJS.ProcessEnv);
      expect((await postgresPool.query('SELECT 1 FROM admins WHERE username=$1', ['replacement-admin'])).rowCount).toBe(0);
      const afterRestart = await postgresPool.query<{ password_hash: string }>('SELECT password_hash FROM admins WHERE username=$1', [adminName]);
      expect(afterRestart.rows[0].password_hash).toBe(existing.rows[0].password_hash);
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
        body: JSON.stringify({ username: adminName, password: adminPass }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.admin.username).toBe(adminName);
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

    it('rejects legacy client-submitted Round 1 points instead of trusting them', async () => {
      const res = await fetch(`${baseUrl}/api/round1/stage/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teamToken}`,
        },
        body: JSON.stringify({ stageId: 2, points: 150, timeSpentSeconds: 180, fragmentUnlocked: true }),
      });

      expect(res.status).toBe(410);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect((await postgresPool.query("SELECT count(*)::int AS n FROM score_transactions st JOIN teams t ON t.id=st.team_id WHERE t.team_name='TEAM AI'")).rows[0].n).toBe(0);
    });

    it('requires an authenticated admin for trusted Round 1 configuration and keeps answers private from teams', async () => {
      const denied = await fetch(`${baseUrl}/api/round1/admin/config/stage3`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correctCode: '5555' }) });
      expect(denied.status).toBe(401);
      const invalid = await fetch(`${baseUrl}/api/round1/admin/config/stage2`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ hintDeduction: 999 }) });
      expect(invalid.status).toBe(400);
      const saved = await fetch(`${baseUrl}/api/round1/admin/config/stage3`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ correctCode: '5555' }) });
      expect(saved.status).toBe(200);
      const playerState = await fetch(`${baseUrl}/api/round1/state`, { headers: { Authorization: `Bearer ${teamToken}` } });
      const state = await playerState.json();
      expect(state.config.stage3.grave2.correctCode).toBeUndefined();
      expect(state.config.stage3.finalGate.acceptedAnswer).toBeUndefined();
    });

    it('requires team authentication for actions and derives the action owner from the session', async () => {
      const denied = await fetch(`${baseUrl}/api/round1/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actionId: 'unauthorized-round1', type: 'stage1.begin', teamId: 'forged-team' }) });
      expect(denied.status).toBe(401);
      await postgresPool.query('UPDATE rounds SET is_active=true,start_time=now(),duration_seconds=1320 WHERE round_id=1');
      const accepted = await fetch(`${baseUrl}/api/round1/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${teamToken}` }, body: JSON.stringify({ actionId: 'authenticated-round1-action', type: 'stage1.begin', trialIndex: 0, teamId: 'forged-team', points: 999999, won: true }) });
      expect(accepted.status).toBe(200);
      const owner = await postgresPool.query('SELECT team_id FROM round1_action_events WHERE action_id=$1', ['authenticated-round1-action']);
      expect(owner.rows[0].team_id).toBe((await postgresPool.query("SELECT id FROM teams WHERE team_name='TEAM AI'")).rows[0].id);
      expect((await postgresPool.query("SELECT count(*)::int AS n FROM score_transactions st JOIN teams t ON t.id=st.team_id WHERE t.team_name='TEAM AI'")).rows[0].n).toBe(0);
    });

    it('GET /api/admin/dashboard returns telemetry data to authenticated admin', async () => {
      const extraId = `dashboard-pg-${randomUUID()}`;
      await postgresPool.query('INSERT INTO teams(id,team_name,password_hash,salt,score) VALUES($1,$2,$3,$4,240)', [extraId, `Dashboard PG ${extraId}`, 'hash', 'salt']);
      const denied = await fetch(`${baseUrl}/api/admin/dashboard`);
      expect(denied.status).toBe(401);
      const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.stats.totalTeams).toBe(2);
      expect(data.data.stats.averageScore).toBe(120);
      expect(data.data.stats.round1Active).toBe(true);
    });

    it('GET /api/admin/teams returns PostgreSQL roster, stage state and round/hunt progression', async () => {
      const denied = await fetch(`${baseUrl}/api/admin/teams`);
      expect(denied.status).toBe(401);
      const res = await fetch(`${baseUrl}/api/admin/teams`, { headers: { Authorization: `Bearer ${adminToken}` } });
      expect(res.status).toBe(200);
      const data = await res.json();
      const team = data.teams.find((entry: { teamName: string }) => entry.teamName === 'TEAM AI');
      expect(team).toBeDefined();
      expect(team.stages).toHaveLength(3);
      expect(team.stages[0].status).toBe('IN_PROGRESS');
      expect(team.rounds).toHaveLength(4);
      expect(team.hunts).toHaveLength(3);
      expect(team.round4).toBeNull();
    });

    it('POST /api/admin/teams creates a PostgreSQL identity and returns the one-time password', async () => {
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

      const inDb = await postgresPool.query('SELECT team_name,password_hash,salt FROM teams WHERE id=$1', [data.team.id]);
      expect(inDb.rows[0].team_name).toBe(newTeamPayload.teamName);
      expect(inDb.rows[0].password_hash).not.toBe('GUARD#99');
      expect((await postgresPool.query('SELECT 1 FROM teams WHERE id=$1', [data.team.id])).rowCount).toBe(1);
    });

    it('GET /api/admin/results requires an admin session and returns PostgreSQL scores', async () => {
      const denied = await fetch(`${baseUrl}/api/admin/results`);
      expect(denied.status).toBe(401);
      const res = await fetch(`${baseUrl}/api/admin/results`, { headers: { Authorization: `Bearer ${adminToken}` } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBeGreaterThanOrEqual(2);
      expect(data.results[0].score).toBe(240);
      expect(data.results[0].rank).toBe(1);
    });

    it('GET /api/leaderboard is public and returns the same official score ordering as admin results', async () => {
      const res = await fetch(`${baseUrl}/api/leaderboard`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.leaderboard.length).toBeGreaterThanOrEqual(2);
      expect(data.leaderboard[0].score).toBe(240);
      expect(data.leaderboard[0].rank).toBe(1);
      const adminResults = await fetch(`${baseUrl}/api/admin/results`, { headers: { Authorization: `Bearer ${adminToken}` } });
      const adminData = await adminResults.json();
      expect(data.leaderboard.map((row: { team_id: string; score: number }) => [row.team_id, row.score]))
        .toEqual(adminData.results.map((row: { id: string; score: number }) => [row.id, row.score]));
    });

    it('Round 1 admin status and desired-state controls use PostgreSQL and require an admin session', async () => {
      await postgresPool.query('UPDATE rounds SET is_active=false,duration_seconds=99,start_time=NULL WHERE round_id=1');
      expect((await fetch(`${baseUrl}/api/admin/rounds/status`)).status).toBe(401);
      const status = await fetch(`${baseUrl}/api/admin/rounds/status`, { headers: { Authorization: `Bearer ${adminToken}` } });
      expect(status.status).toBe(200);
      // Round 1 is available on a fresh launch even before its optional shared timer is started.
      expect((await status.json()).round).toMatchObject({ isActive: true, durationSeconds: 99, startTime: null });
      const missingDesiredState = await fetch(`${baseUrl}/api/admin/rounds/toggle`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });
      expect(missingDesiredState.status).toBe(400);
      const activate = () => fetch(`${baseUrl}/api/admin/rounds/toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ isActive: true }) });
      expect((await activate()).status).toBe(200);
      expect((await activate()).status).toBe(200); // retrying the desired state is a no-op
      expect((await postgresPool.query('SELECT is_active FROM rounds WHERE round_id=1')).rows[0].is_active).toBe(true);
      const deactivate = () => fetch(`${baseUrl}/api/admin/rounds/toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ isActive: false }) });
      expect((await deactivate()).status).toBe(200);
      expect((await deactivate()).status).toBe(200);
      expect((await postgresPool.query('SELECT is_active FROM rounds WHERE round_id=1')).rows[0].is_active).toBe(false);
    });

    it('admin roster actions are PostgreSQL-backed, pause retries are safe, and score edits cannot bypass the ledger', async () => {
      const team = (await postgresPool.query<{ id: string; score: number; team_name: string }>("SELECT id,score,team_name FROM teams WHERE team_name='TEAM AI'")).rows[0];
      const beforeLedger = (await postgresPool.query('SELECT count(*)::int AS count FROM score_transactions WHERE team_id=$1', [team.id])).rows[0].count;
      const forgedScore = await fetch(`${baseUrl}/api/admin/teams/${team.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ teamName: 'Should Not Change', score: team.score + 500 }) });
      expect(forgedScore.status).toBe(400);
      expect((await postgresPool.query('SELECT team_name,score FROM teams WHERE id=$1', [team.id])).rows[0]).toEqual({ team_name: team.team_name, score: team.score });
      expect((await postgresPool.query('SELECT count(*)::int AS count FROM score_transactions WHERE team_id=$1', [team.id])).rows[0].count).toBe(beforeLedger);
      const setPaused = (isPaused: boolean) => fetch(`${baseUrl}/api/admin/teams/${team.id}/pause`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ isPaused }) });
      expect((await setPaused(true)).status).toBe(200);
      expect((await setPaused(true)).status).toBe(200);
      expect((await postgresPool.query('SELECT is_paused FROM teams WHERE id=$1', [team.id])).rows[0].is_paused).toBe(true);
      expect((await setPaused(false)).status).toBe(200);
      expect((await postgresPool.query('SELECT is_paused FROM teams WHERE id=$1', [team.id])).rows[0].is_paused).toBe(false);
    });

    it('Round 1 completion uses PostgreSQL stage evidence and atomically unlocks next-round eligibility', async () => {
      const team = (await postgresPool.query<{ id: string }>("SELECT id FROM teams WHERE team_name='TEAM AI'")).rows[0];
      const initialScore = (await postgresPool.query('SELECT score FROM teams WHERE id=$1', [team.id])).rows[0].score;
      const completeUrl = `${baseUrl}/api/progression/me/rounds/1/complete`;
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${teamToken}` };
      const denied = await fetch(completeUrl, { method: 'POST', headers, body: '{}' });
      expect(denied.status).toBe(409);
      await postgresPool.query("UPDATE round_progress SET status='IN_PROGRESS' WHERE team_id=$1 AND round_id=1", [team.id]);
      await postgresPool.query("UPDATE round1_stage_progress SET status='COMPLETED' WHERE team_id=$1", [team.id]);
      const completed = await fetch(completeUrl, { method: 'POST', headers, body: '{}' });
      expect(completed.status).toBe(200);
      expect((await postgresPool.query('SELECT status FROM round_progress WHERE team_id=$1 AND round_id=1', [team.id])).rows[0].status).toBe('COMPLETED');
      expect((await postgresPool.query('SELECT eligible_at FROM round_progress WHERE team_id=$1 AND round_id=2', [team.id])).rows[0].eligible_at).not.toBeNull();
      expect((await postgresPool.query('SELECT score FROM teams WHERE id=$1', [team.id])).rows[0].score).toBe(initialScore);
    });
  });
});
