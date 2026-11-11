// @vitest-environment node
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { Server } from 'node:http';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runMigrations } from '../../database/postgres/migration-runner.ts';
import { hashPassword } from '../auth/password.ts';

const connectionString = process.env.PG_TEST_DATABASE_URL;
const suite = connectionString ? describe : describe.skip;
let adminPool: Pool;
let migrationPool: Pool;
let appPool: Pool | null;
let schemaName: string;
let server: Server;
let baseUrl: string;
let app: typeof import('../index.ts').app;
let adminUser: string;
let adminPassword: string;
let adminToken: string;
const databaseUrlBefore = process.env.DATABASE_URL;
const sslModeBefore = process.env.PGSSLMODE;

async function request(pathname: string, options: { method?: string; token?: string; cookie?: string; body?: unknown } = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function createTeam(name: string, id = `api-team-${randomUUID()}`) {
  const { hash, salt } = hashPassword('Test-Team-Password-42');
  await appPool!.query('INSERT INTO teams(id,team_name,password_hash,salt) VALUES($1,$2,$3,$4)', [id, name, hash, salt]);
  const login = await request('/api/auth/team-login', { method: 'POST', body: { teamName: name, password: 'Test-Team-Password-42' } });
  const data = await login.json() as { token: string };
  return { id, token: data.token };
}

async function adminAction(teamId: string, entity: string, entityId: number, action: string, reason?: string) {
  return request(`/api/admin/progression/${encodeURIComponent(teamId)}/${entity}/${entityId}/${action}`, {
    method: 'POST', token: adminToken, body: { reason },
  });
}

async function expectRetiredStageCompletionHasNoEffects(team: { id: string; token: string }) {
  const snapshot = async () => ({
    postgresWallet: (await appPool!.query('SELECT score,total_credits FROM teams WHERE id=$1', [team.id])).rows,
    stages: (await appPool!.query('SELECT stage_id,status,score FROM round1_stage_progress WHERE team_id=$1 ORDER BY stage_id', [team.id])).rows,
    rounds: (await appPool!.query('SELECT round_id,status,score,eligible_at,completed_at FROM round_progress WHERE team_id=$1 ORDER BY round_id', [team.id])).rows,
    auditCount: (await appPool!.query('SELECT count(*)::int AS n FROM progression_audit_history WHERE team_id=$1', [team.id])).rows[0].n,
  });
  const before = await snapshot();
  const response = await request('/api/round1/stage/complete', {
    method: 'POST', token: team.token, body: { stageId: 1, points: 999999 },
  });
  expect(response.status).toBe(410);
  expect(await response.json()).toMatchObject({ success: false, message: expect.stringContaining('retired') });
  expect(await snapshot()).toEqual(before);
}

async function eligibleTeamForRound3(team: { id: string; token: string }) {
  await request('/api/round1/state', { token: team.token });
  await appPool!.query("UPDATE round1_stage_progress SET status='COMPLETED' WHERE team_id=$1", [team.id]);
  await expectRetiredStageCompletionHasNoEffects(team);
  expect((await request('/api/progression/me/rounds/1/start', { method: 'POST', token: team.token })).status).toBe(200);
  expect((await adminAction(team.id, 'ROUND', 1, 'complete')).status).toBe(200);
  expect((await adminAction(team.id, 'ROUND', 2, 'unlock')).status).toBe(200);
  expect((await request('/api/progression/me/rounds/2/start', { method: 'POST', token: team.token })).status).toBe(200);
  expect((await adminAction(team.id, 'ROUND', 2, 'complete')).status).toBe(200);
  const progression = await request('/api/progression/me', { token: team.token });
  expect((await progression.json()).rounds.find((round: { round_id: number }) => round.round_id === 3).status).toBe('AVAILABLE');
}

suite('Progression API with PostgreSQL identity sessions', () => {
  beforeAll(async () => {
    const parsed = new URL(connectionString!);
    if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
      throw new Error('PG_TEST_DATABASE_URL must point to a local PostgreSQL server; remote databases are refused.');
    }
    schemaName = `frost_api_${randomUUID().replaceAll('-', '')}`;
    adminPool = new Pool({ connectionString });
    await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
    const scoped = new URL(connectionString!);
    scoped.searchParams.set('options', `-c search_path=${schemaName}`);
    process.env.DATABASE_URL = scoped.toString();
    process.env.PGSSLMODE = 'disable';

    migrationPool = new Pool({ connectionString: process.env.DATABASE_URL });
    await runMigrations(migrationPool, path.resolve('database/postgres/migrations'));
    const serverModule = await import('../index.ts');
    app = serverModule.app;
    appPool = (await import('../../database/postgres/pool.ts')).postgresPool;

    adminUser = `progress-admin-${randomUUID()}`;
    adminPassword = 'Progress-Admin-Password-42';
    const adminHash = hashPassword(adminPassword);
    await appPool!.query(`INSERT INTO admins(id,username,password_hash,salt,role,must_change_password)
      VALUES($1,$2,$3,$4,'admin',false)`, [`pg-admin-${randomUUID()}`, adminUser, adminHash.hash, adminHash.salt]);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
    const login = await request('/api/admin/login', { method: 'POST', body: { username: adminUser, password: adminPassword } });
    expect(login.status).toBe(200);
    adminToken = (await login.json() as { token: string }).token;
  }, 60_000);

  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    if (appPool) await appPool.end();
    await migrationPool?.end();
    if (schemaName) await adminPool?.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await adminPool?.end();
    if (databaseUrlBefore === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = databaseUrlBefore;
    if (sslModeBefore === undefined) delete process.env.PGSSLMODE; else process.env.PGSSLMODE = sslModeBefore;
  });

  it('reports readiness only after PostgreSQL connectivity and required migrations are available', async () => {
    const ready = await request('/api/ready');
    expect(ready.status).toBe(200);
    expect(await ready.json()).toMatchObject({ status: 'ready', checks: { postgres: 'ready', migrations: 'ready' } });

    await appPool!.query("DELETE FROM schema_migrations WHERE version='008_round1_prelaunch_default.sql'");
    try {
      const missing = await request('/api/ready');
      expect(missing.status).toBe(503);
      expect(await missing.json()).toMatchObject({ status: 'not_ready', checks: { migrations: 'incomplete' } });
    } finally {
      await appPool!.query("INSERT INTO schema_migrations(version) VALUES ('008_round1_prelaunch_default.sql') ON CONFLICT DO NOTHING");
    }

    const interceptablePool = appPool as unknown as { query: (...args: any[]) => Promise<any> };
    const originalQuery = interceptablePool.query.bind(interceptablePool);
    interceptablePool.query = async (query: any, ...args: any[]) => {
      if (query === 'SELECT 1 FROM round_progress LIMIT 0') {
        throw Object.assign(new Error('Required PostgreSQL table is missing.'), { code: '42P01' });
      }
      return originalQuery(query, ...args);
    };
    try {
      const missingTable = await request('/api/ready');
      expect(missingTable.status).toBe(503);
      expect(await missingTable.json()).toMatchObject({ status: 'not_ready', checks: { postgres: 'reachable', migrations: 'incomplete' } });
    } finally {
      interceptablePool.query = originalQuery;
    }
  });

  it('creates PostgreSQL team identities, rejects duplicates and incorrect credentials, and preserves the frontend login contract', async () => {
    const name = `Registration ${randomUUID()}`;
    const created = await request('/api/admin/teams', { method: 'POST', token: adminToken, body: { teamName: name } });
    expect(created.status).toBe(201);
    const createdData = await created.json() as { team: { id: string; password: string; teamName: string } };
    expect(createdData.team.teamName).toBe(name);
    expect((await appPool!.query('SELECT 1 FROM teams WHERE id=$1', [createdData.team.id])).rowCount).toBe(1);
    expect((await request('/api/admin/teams', { method: 'POST', token: adminToken, body: { teamName: name.toLowerCase() } })).status).toBe(409);
    expect((await request('/api/auth/team-login', { method: 'POST', body: { teamName: name, password: 'incorrect' } })).status).toBe(401);
    const login = await request('/api/auth/team-login', { method: 'POST', body: { teamName: name, password: createdData.team.password } });
    expect(login.status).toBe(200);
    const response = await login.json() as { success: boolean; token: string; playerNumber: number; team: { id: string; teamName: string; score: number; maxCredits: number; totalCredits: number; isPaused: boolean } };
    expect(response).toMatchObject({ success: true, team: { id: createdData.team.id, teamName: name, score: 0, maxCredits: 500, totalCredits: 500, isPaused: false } });
    expect([1, 2]).toContain(response.playerNumber);
    expect(login.headers.get('set-cookie')).toMatch(/^fc_team_token=.*HttpOnly/i);
    const session = await request('/api/auth/session', { token: response.token });
    expect(session.status).toBe(200);
    expect((await session.json() as { team: { id: string; score: number; totalCredits: number } }).team)
      .toMatchObject({ id: createdData.team.id, score: 0, totalCredits: 500 });
    expect((await request('/api/auth/logout', { method: 'POST', token: response.token })).status).toBe(200);
    expect((await request('/api/auth/session', { token: response.token })).status).toBe(401);
  });

  it('rejects incorrect admin passwords and authorizes admin actions only from PostgreSQL sessions', async () => {
    expect((await request('/api/admin/login', { method: 'POST', body: { username: adminUser, password: 'incorrect' } })).status).toBe(401);
    expect((await request('/api/admin/progression/unknown-team', { token: 'forged-token' })).status).toBe(401);
    const login = await request('/api/admin/login', { method: 'POST', body: { username: adminUser, password: adminPassword } });
    expect(login.status).toBe(200);
    expect(login.headers.get('set-cookie')).toMatch(/^fc_admin_token=.*HttpOnly/i);
    const data = await login.json() as { token: string; admin: { id: string; username: string; role: string; mustChangePassword: boolean } };
    expect(data.admin.username).toBe(adminUser);
    expect((await request('/api/admin/progression/no-such-team', { token: data.token })).status).toBe(404);
    expect((await request('/api/admin/logout', { method: 'POST', token: data.token })).status).toBe(200);
    expect((await request('/api/admin/progression/no-such-team', { token: data.token })).status).toBe(401);
  });

  it('validates event-stream team sessions against PostgreSQL', async () => {
    const invalid = await request('/api/events/stream?token=forged-session-token');
    expect(invalid.status).toBe(401);
    const team = await createTeam(`Event stream ${randomUUID()}`);
    const valid = await fetch(`${baseUrl}/api/events/stream`, { headers: { Authorization: `Bearer ${team.token}` } });
    expect(valid.status).toBe(200);
    expect(valid.headers.get('content-type')).toContain('text/event-stream');
    await valid.body?.cancel();
  });

  it('binds team progression to the authenticated PostgreSQL session and gates locked round APIs', async () => {
    const teamA = await createTeam('Bridge Alpha');
    const teamB = await createTeam('Bridge Bravo');
    const read = await request('/api/progression/me', { token: teamA.token });
    expect(read.status).toBe(200);
    expect((await read.json()).teamId).toBe(teamA.id);
    const forged = await request('/api/progression/me/rounds/1/start', { method: 'POST', token: teamA.token, body: { teamId: teamB.id } });
    expect(forged.status).toBe(200);
    const teamBProgress = await request('/api/progression/me', { token: teamB.token });
    expect((await teamBProgress.json()).rounds[0].status).toBe('AVAILABLE');
    const lockedDirect = await request(`/api/round2/state?team=${encodeURIComponent('Bridge Bravo')}`, { token: teamB.token });
    expect(lockedDirect.status).toBe(423);
  });

  it('requires an authenticated admin for unlock and lock, and stores an audit trail', async () => {
    const team = await createTeam('Admin Gate');
    await request('/api/round1/state', { token: team.token });
    await expectRetiredStageCompletionHasNoEffects(team);
    expect((await request('/api/progression/me/rounds/1/start', { method: 'POST', token: team.token })).status).toBe(200);
    expect((await adminAction(team.id, 'ROUND', 1, 'complete')).status).toBe(200);
    const teamProgress = await request('/api/progression/me', { token: team.token });
    const progression = await teamProgress.json();
    expect(progression.rounds[1]).toMatchObject({ status: 'LOCKED' });
    expect(new Date(progression.rounds[1].eligible_at).getTime()).toBeGreaterThan(0);
    expect((await adminAction(team.id, 'ROUND', 2, 'unlock')).status).toBe(200);
    expect((await adminAction(team.id, 'ROUND', 2, 'lock', 'admin lock test')).status).toBe(200);
    const state = await request(`/api/admin/progression/${team.id}`, { token: adminToken });
    const data = await state.json();
    expect(data.rounds[1].status).toBe('LOCKED');
    expect(data.audit.some((row: { reason: string | null; action_performed: string }) => row.action_performed === 'LOCK' && row.reason === 'admin lock test')).toBe(true);
    const forged = await request(`/api/admin/progression/${team.id}/ROUND/2/unlock`, { method: 'POST', token: team.token });
    expect(forged.status).toBe(401);
  });

  it('enforces hunt sequence on both progression endpoints and direct Round 3 routes', async () => {
    const team = await createTeam('Hunt API');
    await eligibleTeamForRound3(team);
    const bypass = await request('/api/round3/hunt2/session', { method: 'POST', token: team.token, body: {} });
    expect(bypass.status).toBe(423);
    const direct = await request('/api/progression/me/hunts/3/start', { method: 'POST', token: team.token });
    expect(direct.status).toBe(423);
    const hunt1 = await request('/api/round3/hunt1/session', { method: 'POST', token: team.token, body: {} });
    expect(hunt1.status).toBe(200);
    const after = await request('/api/progression/me', { token: team.token });
    expect((await after.json()).hunts[0].status).toBe('IN_PROGRESS');
  });

  it('rejects expired PostgreSQL team/admin sessions and revokes sessions on logout', async () => {
    const team = await createTeam('Expiry API');
    await request('/api/progression/me', { token: team.token });
    expect((await request('/api/auth/logout', { method: 'POST', token: team.token })).status).toBe(200);
    expect((await request('/api/progression/me', { token: team.token })).status).toBe(401);
    const expiredTeam = await createTeam('Expired Team API');
    await request('/api/progression/me', { token: expiredTeam.token });
    await appPool!.query('UPDATE team_sessions SET expires_at=now()-interval \'1 second\' WHERE token=$1', [expiredTeam.token]);
    expect((await request('/api/progression/me', { token: expiredTeam.token })).status).toBe(401);

    const adminLogin = await request('/api/admin/login', { method: 'POST', body: { username: adminUser, password: adminPassword } });
    const token = (await adminLogin.json() as { token: string }).token;
    expect((await request(`/api/admin/progression/${team.id}`, { token })).status).toBe(200);
    expect((await request('/api/admin/logout', { method: 'POST', token })).status).toBe(200);
    expect((await request(`/api/admin/progression/${team.id}`, { token })).status).toBe(401);
    expect((await appPool!.query('SELECT 1 FROM admin_sessions WHERE token=$1', [token])).rowCount).toBe(0);

    const expiredLogin = await request('/api/admin/login', { method: 'POST', body: { username: adminUser, password: adminPassword } });
    const expiredToken = (await expiredLogin.json() as { token: string }).token;
    await appPool!.query('UPDATE admin_sessions SET expires_at=now()-interval \'1 second\' WHERE token=$1', [expiredToken]);
    expect((await request(`/api/admin/progression/${team.id}`, { token: expiredToken })).status).toBe(401);
    for (let attempt = 0; attempt < 20; attempt++) {
      const revoked = await appPool!.query('SELECT 1 FROM admin_sessions WHERE token=$1', [expiredToken]);
      if (!revoked.rowCount) break;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    expect((await appPool!.query('SELECT 1 FROM admin_sessions WHERE token=$1', [expiredToken])).rowCount).toBe(0);
  });

  it('authenticates with the login cookie and clears it on logout', async () => {
    await createTeam('Cookie Session API');
    const login = await request('/api/auth/team-login', { method: 'POST', body: { teamName: 'Cookie Session API', password: 'Test-Team-Password-42' } });
    expect(login.status).toBe(200);
    const setCookie = login.headers.get('set-cookie');
    expect(setCookie).toMatch(/^fc_team_token=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    const cookie = setCookie!.split(';')[0];
    expect((await request('/api/progression/me', { cookie })).status).toBe(200);
    const logout = await request('/api/auth/logout', { method: 'POST', cookie });
    expect(logout.status).toBe(200);
    expect(logout.headers.get('set-cookie')).toMatch(/Expires=Thu, 01 Jan 1970/i);
    expect((await request('/api/progression/me', { cookie })).status).toBe(401);
  });

  it('rejects client-supplied team identity on admin operations and keeps reset history', async () => {
    const team = await createTeam('Reset API');
    await request('/api/progression/me/rounds/1/start', { method: 'POST', token: team.token });
    await appPool!.query("UPDATE round1_stage_progress SET status='COMPLETED' WHERE team_id=$1", [team.id]);
    await request('/api/progression/me/rounds/1/complete', { method: 'POST', token: team.token });
    await adminAction(team.id, 'ROUND', 2, 'unlock');
    const reset = await request(`/api/admin/progression/${team.id}/ROUND/1/reset`, { method: 'POST', token: adminToken, body: { teamId: 'forged-team', reason: 'audit reset' } });
    expect(reset.status).toBe(200);
    const result = await reset.json();
    expect(result.teamId).toBe(team.id);
    expect(result.rounds[1].status).toBe('LOCKED');
    expect(result.audit.some((row: { reason: string | null }) => row.reason === 'audit reset')).toBe(true);
  });
});
