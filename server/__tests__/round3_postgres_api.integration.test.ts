// @vitest-environment node
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import { runMigrations } from '../../database/postgres/migration-runner.ts';

const testDatabaseUrl = process.env.PG_TEST_DATABASE_URL;
const suite = testDatabaseUrl ? describe : describe.skip;
const originalEnvironment = {
  databaseUrl: process.env.DATABASE_URL,
  sslMode: process.env.PGSSLMODE,
  nodeEnv: process.env.NODE_ENV,
};
let schemaName: string;
let adminPool: Pool;
let schemaPool: Pool;
let appPool: Pool;
let app: Express;
let server: Server;
let baseUrl: string;
const teams = Array.from({ length: 4 }, (_, index) => ({
  id: `r3-api-${index}-${randomUUID()}`,
  name: `R3 API ${index} ${randomUUID()}`,
  token: `token-${randomUUID()}`,
}));

async function api(pathname: string, teamIndex?: number, method = 'GET', body?: unknown) {
  const response = await fetch(`${baseUrl}/api/round3${pathname}`, {
    method,
    headers: {
      ...(teamIndex === undefined ? {} : { Authorization: `Bearer ${teams[teamIndex].token}` }),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();
  let data: Record<string, any> = {};
  try { data = JSON.parse(raw) as Record<string, any>; } catch { data = { raw }; }
  return { response, data };
}

async function progressionApi(pathname: string, teamIndex: number, method = 'GET', body?: unknown) {
  const response = await fetch(`${baseUrl}/api/progression${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${teams[teamIndex].token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();
  let data: Record<string, any> = {};
  try { data = JSON.parse(raw) as Record<string, any>; } catch { data = { raw }; }
  return { response, data };
}

async function setHunt3Completion(teamIndex: number, completed: boolean) {
  const teamId = teams[teamIndex].id;
  const { createFreshRound3Hunt3State } = await import('../services/round3-hunt3.rules.ts');
  const pgState = createFreshRound3Hunt3State(teamId);
  pgState.completed = completed;
  await schemaPool.query(
    `INSERT INTO round3_hunt_state(team_id,hunt_id,state,model_version)
     VALUES($1, 3, $2::jsonb, 1)
     ON CONFLICT(team_id,hunt_id) DO UPDATE SET state=$2::jsonb, updated_at=clock_timestamp()`,
    [teamId, JSON.stringify(pgState)],
  );
}

async function prepareHunt2Team(teamIndex: number) {
  const teamId = teams[teamIndex].id;
  const { createFreshRound3Hunt1State } = await import('../services/round3-hunt1.rules.ts');
  const state = createFreshRound3Hunt1State(teamId);
  state.completed = true;
  state.currentChallenge = 4;
  state.score = 750;
  state.taskCompleted = { powerFailure: true, observationLog: true, signalReconstruction: true, incidentConclusion: true };
  state.taskScores = { powerFailure: 200, observationLog: 200, signalReconstruction: 200, incidentConclusion: 150 };
  await schemaPool.query("UPDATE round_progress SET status='IN_PROGRESS' WHERE team_id=$1 AND round_id=3", [teamId]);
  await schemaPool.query("UPDATE team_hunt_progress SET status=CASE WHEN hunt_id=1 THEN 'COMPLETED' WHEN hunt_id=2 THEN 'AVAILABLE' ELSE 'LOCKED' END WHERE team_id=$1", [teamId]);
  await schemaPool.query('UPDATE round3_hunt_state SET state=$2::jsonb,model_version=3 WHERE team_id=$1 AND hunt_id=1', [teamId, JSON.stringify(state)]);
  await schemaPool.query("UPDATE round3_hunt_state SET state=jsonb_set(state,'{completed}','false'::jsonb,true) WHERE team_id=$1 AND hunt_id=2", [teamId]);
  await schemaPool.query("UPDATE round3_runs SET status='not_started',remaining_ms=1500000,started_at=NULL WHERE team_id=$1", [teamId]);
  await api('/run/start', teamIndex, 'POST', {});
  return teamId;
}

suite('Round 3 PostgreSQL session and timer APIs', () => {
  beforeAll(async () => {
    const parsed = new URL(testDatabaseUrl!);
    if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
      throw new Error('PG_TEST_DATABASE_URL must point to a local PostgreSQL server; remote databases are refused.');
    }
    adminPool = new Pool({ connectionString: testDatabaseUrl });
    schemaName = `frost_r3_api_${randomUUID().replaceAll('-', '')}`;
    await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
    schemaPool = new Pool({ connectionString: testDatabaseUrl, options: `-c search_path=${schemaName}` });
    await runMigrations(schemaPool, path.resolve('database/postgres/migrations'));

    const appUrl = new URL(testDatabaseUrl!);
    appUrl.searchParams.set('options', `-c search_path=${schemaName}`);
    process.env.DATABASE_URL = appUrl.toString();
    process.env.PGSSLMODE = 'disable';
    process.env.NODE_ENV = 'test';
    const [{ round3Router }, { roundAccessGuard, progressionRouter }] = await Promise.all([
      import('../routes/round3.routes.ts'),
      import('../routes/progression.routes.ts'),
    ]);
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/round3', roundAccessGuard(3));
    app.use('/api/round3', round3Router);
    app.use('/api/progression', progressionRouter);

    for (const [index, team] of teams.entries()) {
      await schemaPool.query('INSERT INTO teams(id,team_name,password_hash,salt) VALUES($1,$2,$3,$4)', [team.id, team.name, 'hash', 'salt']);
      await schemaPool.query("UPDATE round_progress SET status='IN_PROGRESS' WHERE team_id=$1 AND round_id=3", [team.id]);
      await schemaPool.query("UPDATE team_hunt_progress SET status='IN_PROGRESS' WHERE team_id=$1 AND hunt_id=1", [team.id]);
      await schemaPool.query('INSERT INTO team_sessions(id,team_id,token,player_number,expires_at) VALUES($1,$2,$3,$4,now()+interval \'1 hour\')', [`api-session-${index}`, team.id, team.token, index % 2 + 1]);
    }

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
    appPool = (await import('../../database/postgres/pool.ts')).postgresPool!;
  }, 45_000);

  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    await appPool?.end();
    await schemaPool?.end();
    if (schemaName) await adminPool?.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await adminPool?.end();
    if (originalEnvironment.databaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalEnvironment.databaseUrl;
    if (originalEnvironment.sslMode === undefined) delete process.env.PGSSLMODE;
    else process.env.PGSSLMODE = originalEnvironment.sslMode;
    if (originalEnvironment.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnvironment.nodeEnv;
  });

  it('requires authenticated team sessions and isolates PostgreSQL session updates', async () => {
    expect((await api('/state')).response.status).toBe(401);
    expect((await api('/state', 0)).response.status).toBe(200);
    expect((await api('/session', 1, 'POST', { teamId: teams[0].id })).response.status).toBe(200);
    const update = await api('/progress', 0, 'PATCH', {
      teamId: teams[1].id,
      playerProgress: { own: 'alpha' },
      timelines: { past: { clue: 'alpha' } },
      activeTimeline: 'future',
      evidenceDiscoveries: ['alpha-evidence'],
    });
    expect(update.response.status).toBe(200);
    expect(update.data.session).toMatchObject({ teamId: teams[0].id, playerProgress: { own: 'alpha' }, activeTimeline: 'future' });
    expect((await api('/state', 1)).data.session).toMatchObject({ teamId: teams[1].id, playerProgress: {}, evidenceDiscoveries: [] });
    expect((await schemaPool.query('SELECT player_progress,version FROM round3_sessions WHERE team_id=$1', [teams[1].id])).rows[0])
      .toMatchObject({ player_progress: {}, version: '1' });
  });

  it('reinitializes Round 3 sessions in PostgreSQL without creating duplicate session state', async () => {
    const teamId = teams[2].id;
    await schemaPool.query('DELETE FROM round3_sessions WHERE team_id=$1', [teamId]);
    const initialized = await api('/session', 2, 'POST', { teamId: teams[1].id });
    expect(initialized.response.status).toBe(200);
    expect(initialized.data.session.teamId).toBe(teamId);
    expect((await schemaPool.query('SELECT team_id,version FROM round3_sessions WHERE team_id=$1', [teamId])).rows)
      .toEqual([{ team_id: teamId, version: '1' }]);
  });

  it('stores evidence in PostgreSQL, validates IDs, gates on its timer and safely replays discoveries', async () => {
    const teamId = teams[0].id;
    expect((await api('/evidence/bad%20evidence/discover', 0, 'POST', {})).response.status).toBe(400);
    const first = await api('/evidence/alpha-evidence/discover', 0, 'POST', { teamId: teams[1].id });
    expect(first.response.status).toBe(200);
    expect(first.data.evidenceDiscoveries).toEqual(['alpha-evidence']);
    const version = (await schemaPool.query('SELECT version FROM round3_sessions WHERE team_id=$1', [teamId])).rows[0].version;
    expect((await schemaPool.query('SELECT evidence FROM round3_sessions WHERE team_id=$1', [teamId])).rows[0].evidence).toEqual(['alpha-evidence']);
    expect((await schemaPool.query('SELECT status,remaining_ms FROM round3_runs WHERE team_id=$1', [teamId])).rows[0].status).toBe('running');

    const retry = await api('/evidence/alpha-evidence/discover', 0, 'POST', { teamId: teams[1].id });
    expect(retry.response.status).toBe(200);
    expect(retry.data.evidenceDiscoveries).toEqual(first.data.evidenceDiscoveries);
    expect((await schemaPool.query('SELECT version FROM round3_sessions WHERE team_id=$1', [teamId])).rows[0].version).toBe(version);
    expect((await schemaPool.query('SELECT evidence FROM round3_sessions WHERE team_id=$1', [teams[1].id])).rows[0].evidence).toEqual([]);

    await api('/run/pause', 0, 'POST', {});
    expect((await api('/evidence/second-evidence/discover', 0, 'POST', {})).response.status).toBe(400);
    expect((await schemaPool.query('SELECT evidence FROM round3_sessions WHERE team_id=$1', [teamId])).rows[0].evidence).toEqual(['alpha-evidence']);
    await schemaPool.query("UPDATE round3_runs SET status='running',started_at=clock_timestamp()-interval '26 minutes' WHERE team_id=$1", [teamId]);
    expect((await api('/evidence/second-evidence/discover', 0, 'POST', {})).response.status).toBe(400);
    expect((await schemaPool.query('SELECT status FROM round3_runs WHERE team_id=$1', [teamId])).rows[0].status).toBe('expired');
    // Leave the shared API fixture ready for later Hunt I action tests.
    await schemaPool.query("UPDATE round3_runs SET status='not_started',remaining_ms=1500000,started_at=NULL WHERE team_id=$1", [teamId]);
  });

  it('persists API timer start, pause, resume and expiry without false completion or scoring', async () => {
    const teamIndex = 2;
    const teamId = teams[teamIndex].id;
    const initial = await api('/run', teamIndex);
    expect(initial.response.status).toBe(200);
    expect(initial.data.run).toMatchObject({ status: 'not_started', remainingMs: 1_500_000 });
    expect((await api('/run/start', teamIndex, 'POST', { teamId: teams[1].id })).data.run.status).toBe('running');
    expect((await api('/run/pause', teamIndex, 'POST', {})).data.run.status).toBe('paused');
    const pausedVersion = (await schemaPool.query('SELECT version FROM round3_runs WHERE team_id=$1', [teamId])).rows[0].version;
    expect((await api('/run/resume', teamIndex, 'POST', {})).data.run.status).toBe('running');
    await schemaPool.query("UPDATE round3_runs SET started_at=clock_timestamp()-interval '26 minutes' WHERE team_id=$1", [teamId]);
    const expired = await api('/run', teamIndex);
    expect(expired.data.run).toMatchObject({ status: 'expired', remainingMs: 0 });
    expect((await api('/hunt1/action', teamIndex, 'POST', { type: 'interact', actor: 'archivist', objectId: 'sealed-ledger' })).response.status).toBe(409);
    expect(Number((await schemaPool.query('SELECT version FROM round3_runs WHERE team_id=$1', [teamId])).rows[0].version)).toBe(Number(pausedVersion) + 2);
    expect((await schemaPool.query('SELECT status FROM round3_runs WHERE team_id=$1', [teams[3].id])).rows[0].status).toBe('not_started');
    expect((await schemaPool.query('SELECT is_completed FROM round3_sessions WHERE team_id=$1', [teamId])).rows[0].is_completed).toBe(false);
    expect((await schemaPool.query('SELECT score FROM teams WHERE id=$1', [teamId])).rows[0].score).toBe(0);
  });

  it('rejects premature completion and rejects a completed Hunt III after timer expiry without progression', async () => {
    const teamIndex = 1;
    const teamId = teams[teamIndex].id;
    await api('/run/start', teamIndex, 'POST', {});
    const premature = await api('/complete', teamIndex, 'POST', {});
    expect(premature.response.status).toBe(409);
    expect((await schemaPool.query('SELECT is_completed FROM round3_sessions WHERE team_id=$1', [teamId])).rows[0].is_completed).toBe(false);

    await setHunt3Completion(teamIndex, true);
    await schemaPool.query("UPDATE round3_runs SET started_at=clock_timestamp()-interval '26 minutes' WHERE team_id=$1", [teamId]);
    const expiredAttempt = await api('/complete', teamIndex, 'POST', { teamId: teams[0].id, completed: true, points: 999999 });
    expect(expiredAttempt.response.status).toBe(409);
    expect((await schemaPool.query('SELECT status FROM round3_runs WHERE team_id=$1', [teamId])).rows[0].status).toBe('expired');
    expect((await schemaPool.query('SELECT status FROM round_progress WHERE team_id=$1 AND round_id=3', [teamId])).rows[0].status).toBe('IN_PROGRESS');
    expect((await schemaPool.query('SELECT count(*)::int AS n FROM team_hunt_progress WHERE team_id=$1 AND status=\'COMPLETED\'', [teamId])).rows[0].n).toBe(0);
    expect((await schemaPool.query('SELECT score FROM teams WHERE id=$1', [teamId])).rows[0].score).toBe(0);
  });

  it('completes only after the server-side Hunt III state is completed', async () => {
    const teamIndex = 3;
    const teamId = teams[teamIndex].id;
    await api('/run/start', teamIndex, 'POST', {});
    await schemaPool.query("UPDATE round3_hunt_state SET state=jsonb_set(state,'{completed}','true'::jsonb,true) WHERE team_id=$1 AND hunt_id IN (1,2)", [teamId]);
    await schemaPool.query("UPDATE team_hunt_progress SET status=CASE WHEN hunt_id IN (1,2) THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,completed_at=CASE WHEN hunt_id IN (1,2) THEN now() ELSE NULL END WHERE team_id=$1", [teamId]);
    expect((await schemaPool.query("SELECT count(*)::int AS n FROM team_hunt_progress WHERE team_id=$1 AND status='COMPLETED'", [teamId])).rows[0].n).toBe(2);
    await setHunt3Completion(teamIndex, false);
    expect((await progressionApi('/me/hunts/3/complete', teamIndex, 'POST', { completed: true })).response.status).toBe(409);
    expect((await schemaPool.query("SELECT status FROM team_hunt_progress WHERE team_id=$1 AND hunt_id=3", [teamId])).rows[0].status).toBe('IN_PROGRESS');
    await setHunt3Completion(teamIndex, true);
    const huntProgress = await progressionApi('/me/hunts/3/complete', teamIndex, 'POST', { completed: false });
    expect(huntProgress.response.status).toBe(200);
    expect((await schemaPool.query("SELECT status FROM team_hunt_progress WHERE team_id=$1 AND hunt_id=3", [teamId])).rows[0].status).toBe('COMPLETED');
    const response = await api('/complete', teamIndex, 'POST', { completed: false, points: 999999 });
    expect(response.response.status).toBe(200);
    expect(response.data).toMatchObject({ success: true, completed: true });
    expect(response.data.completedAt).toBeTruthy();
    expect((await schemaPool.query('SELECT status FROM round3_runs WHERE team_id=$1', [teamId])).rows[0].status).toBe('completed');
    expect((await schemaPool.query('SELECT is_completed FROM round3_sessions WHERE team_id=$1', [teamId])).rows[0].is_completed).toBe(true);
    expect((await schemaPool.query('SELECT status FROM round_progress WHERE team_id=$1 AND round_id=3', [teamId])).rows[0].status).toBe('COMPLETED');
    expect((await progressionApi('/me', teamIndex)).data.rounds.find((round: { round_id: number }) => round.round_id === 3).status).toBe('COMPLETED');
    expect((await schemaPool.query('SELECT score FROM teams WHERE id=$1', [teamId])).rows[0].score).toBe(0);
  });

  it('persists Hunt I task actions and score atomically, isolates teams, and replays duplicate action IDs', async () => {
    const teamIndex = 0;
    const teamId = teams[teamIndex].id;
    await api('/run/start', teamIndex, 'POST', {});
    const opened = await api('/hunt1/session', teamIndex, 'POST', {});
    expect(opened.response.status).toBe(200);
    expect((await api('/hunt1/action', teamIndex, 'POST', { type: 'hint', actor: 'archivist' })).response.status).toBe(400);
    const action = async (type: string, actor: string, objectId?: string, value?: unknown, actionId = randomUUID()) =>
      api('/hunt1/action', teamIndex, 'POST', { actionId, type, actor, ...(objectId ? { objectId } : {}), ...(value === undefined ? {} : { value }) });
    const duplicateId = randomUUID();
    const first = await action('interact', 'archivist', 'generatorLog', undefined, duplicateId);
    const retry = await action('interact', 'archivist', 'generatorLog', undefined, duplicateId);
    expect(first.response.status).toBe(200);
    expect(retry.response.status).toBe(200);
    expect(retry.data).toEqual(first.data);
    expect((await action('interact', 'tracker', 'burntRelay', undefined, duplicateId)).response.status).toBe(409);
    expect((await action('interact', 'archivist', 'burntRelay')).data.message).toContain('must examine');
    await action('interact', 'tracker', 'burntRelay');
    await action('interact', 'tracker', 'openGround');
    const wiring = ['generator-relay', 'relay-load', 'load-ground', 'ground-frame'];
    await action('powerFailureArchivist', 'archivist', undefined, { sequence: wiring });
    const completed = await action('powerFailureTracker', 'tracker', undefined, { sequence: wiring });
    expect(completed.data.state.taskScores.powerFailure).toBe(200);
    expect(completed.data.state.currentChallenge).toBe(2);
    expect((await schemaPool.query('SELECT score FROM teams WHERE id=$1', [teamId])).rows[0].score).toBe(200);
    expect((await schemaPool.query('SELECT score FROM round_progress WHERE team_id=$1 AND round_id=3', [teamId])).rows[0].score).toBe(200);
    expect((await schemaPool.query('SELECT score FROM teams WHERE id=$1', [teams[1].id])).rows[0].score).toBe(0);
    const eventCount = await schemaPool.query("SELECT count(*)::int AS n FROM score_transactions WHERE team_id=$1 AND round_id=3", [teamId]);
    expect(eventCount.rows[0].n).toBe(1);
    const stored = (await schemaPool.query('SELECT state FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=1', [teamId])).rows[0].state;
    expect(stored.taskCompleted.powerFailure).toBe(true);
  });

  it('records Hunt I hint penalties, rejects missing/forged identities, and blocks actions while paused or expired', async () => {
    const teamIndex = 1;
    const teamId = teams[teamIndex].id;
    await schemaPool.query("UPDATE round3_runs SET status='not_started',remaining_ms=1500000,started_at=NULL WHERE team_id=$1", [teamId]);
    await api('/run/start', teamIndex, 'POST', {});
    await api('/hunt1/session', teamIndex, 'POST', {});
    const hint = await api('/hunt1/action', teamIndex, 'POST', { actionId: randomUUID(), type: 'hint', actor: 'archivist', teamId: teams[0].id, points: 999999 });
    expect(hint.response.status).toBe(200);
    expect(hint.data.state.penalties).toBe(10);
    expect((await schemaPool.query('SELECT score FROM teams WHERE id=$1', [teamId])).rows[0].score).toBe(0);
    expect((await schemaPool.query('SELECT count(*)::int AS n FROM activity_history WHERE team_id=$1 AND action LIKE \'round3-hunt1:%\'', [teamId])).rows[0].n).toBe(1);
    const sendAction = (type: string, actor: string, objectId?: string, value?: unknown) =>
      api('/hunt1/action', teamIndex, 'POST', { actionId: randomUUID(), type, actor, ...(objectId ? { objectId } : {}), ...(value === undefined ? {} : { value }) });
    await sendAction('interact', 'archivist', 'optionalResearchNote');
    expect((await schemaPool.query('SELECT score FROM teams WHERE id=$1', [teamId])).rows[0].score).toBe(40);
    await sendAction('interact', 'archivist', 'generatorLog');
    await sendAction('interact', 'tracker', 'burntRelay');
    await sendAction('interact', 'tracker', 'openGround');
    const wiring = ['generator-relay', 'relay-load', 'load-ground', 'ground-frame'];
    await sendAction('powerFailureArchivist', 'archivist', undefined, { sequence: wiring });
    await sendAction('powerFailureTracker', 'tracker', undefined, { sequence: wiring });
    await sendAction('interact', 'archivist', 'observationLog');
    await sendAction('interact', 'tracker', 'cameraBuffer');
    const wrongTimeline = ['lights-fail', 'alarm', 'subject-appears', 'observer-vanishes'];
    await sendAction('observationArchivist', 'archivist', undefined, { sequence: wrongTimeline });
    expect((await schemaPool.query('SELECT score FROM teams WHERE id=$1', [teamId])).rows[0].score).toBe(230);
    expect((await schemaPool.query('SELECT score FROM round_progress WHERE team_id=$1 AND round_id=3', [teamId])).rows[0].score).toBe(230);
    await api('/run/pause', teamIndex, 'POST', {});
    expect((await api('/hunt1/action', teamIndex, 'POST', { actionId: randomUUID(), type: 'hint', actor: 'archivist' })).response.status).toBe(409);
    await api('/run/resume', teamIndex, 'POST', {});
    await schemaPool.query("UPDATE round3_runs SET started_at=clock_timestamp()-interval '26 minutes' WHERE team_id=$1", [teamId]);
    expect((await api('/hunt1/action', teamIndex, 'POST', { actionId: randomUUID(), type: 'hint', actor: 'archivist' })).response.status).toBe(409);
    expect((await schemaPool.query('SELECT status FROM round3_runs WHERE team_id=$1', [teamId])).rows[0].status).toBe('expired');
    expect((await api('/hunt1/action', undefined, 'POST', { actionId: randomUUID(), type: 'hint', actor: 'archivist' })).response.status).toBe(401);
  });

  it('serializes concurrent Hunt I actions and rolls back state when ledger persistence fails', async () => {
    const teamIndex = 2;
    const teamId = teams[teamIndex].id;
    await schemaPool.query("UPDATE round3_runs SET status='not_started',remaining_ms=1500000,started_at=NULL WHERE team_id=$1", [teamId]);
    await api('/run/start', teamIndex, 'POST', {});
    await api('/hunt1/session', teamIndex, 'POST', {});
    const actionId = randomUUID();
    const repeated = await Promise.all([
      api('/hunt1/action', teamIndex, 'POST', { actionId, type: 'interact', actor: 'archivist', objectId: 'optionalResearchNote' }),
      api('/hunt1/action', teamIndex, 'POST', { actionId, type: 'interact', actor: 'archivist', objectId: 'optionalResearchNote' }),
    ]);
    expect(repeated.map((item) => item.response.status)).toEqual([200, 200]);
    expect(repeated[0].data).toEqual(repeated[1].data);
    expect((await schemaPool.query('SELECT score FROM teams WHERE id=$1', [teamId])).rows[0].score).toBe(50);
    expect((await schemaPool.query("SELECT count(*)::int AS n FROM score_transactions WHERE team_id=$1 AND round_id=3", [teamId])).rows[0].n).toBe(1);

    await schemaPool.query('ALTER TABLE score_transactions ADD CONSTRAINT test_reject_hunt1 CHECK (source_event_id NOT LIKE \'%force-rollback%\')');
    const before = (await schemaPool.query('SELECT state,version FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=1', [teamId])).rows[0];
    const failure = await api('/hunt1/action', teamIndex, 'POST', { actionId: 'force-rollback-001', type: 'interact', actor: 'tracker', objectId: 'optionalForgottenRecording' });
    expect(failure.response.status).toBeGreaterThanOrEqual(500);
    const after = (await schemaPool.query('SELECT state,version FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=1', [teamId])).rows[0];
    expect(after.state).toEqual(before.state);
    expect(after.version).toBe(before.version);
    expect((await schemaPool.query("SELECT 1 FROM activity_history WHERE team_id=$1 AND source_event_id='round3-hunt1:force-rollback-001'", [teamId])).rowCount).toBe(0);
    expect((await schemaPool.query('SELECT score FROM teams WHERE id=$1', [teamId])).rows[0].score).toBe(50);
    await schemaPool.query('ALTER TABLE score_transactions DROP CONSTRAINT test_reject_hunt1');
  });

  it('migrates Hunt II actions, scoring and retries to PostgreSQL without trusting client identity or completion claims', async () => {
    const teamIndex = 3;
    const teamId = await prepareHunt2Team(teamIndex);
    const opened = await api('/hunt2/session', teamIndex, 'POST', { sharedView: true });
    expect(opened.response.status).toBe(200);
    expect(opened.data.state.currentChallenge).toBe(2);
    expect((await api('/hunt2/state', teamIndex)).response.status).toBe(200);
    expect((await api('/hunt2/action', undefined, 'POST', { actionId: randomUUID(), type: 'hint', actor: 'archivist' })).response.status).toBe(401);
    expect((await api('/hunt2/action', teamIndex, 'POST', { type: 'hint', actor: 'archivist' })).response.status).toBe(400);

    const forgedTeamScoreBefore = (await schemaPool.query('SELECT score FROM teams WHERE id=$1', [teams[0].id])).rows[0].score;
    const optionalId = randomUUID();
    const optional = await api('/hunt2/action', teamIndex, 'POST', { actionId: optionalId, type: 'interact', actor: 'tracker', objectId: 'optionalAnomaly', teamId: teams[0].id, points: 999999 });
    const retry = await api('/hunt2/action', teamIndex, 'POST', { actionId: optionalId, type: 'interact', actor: 'tracker', objectId: 'optionalAnomaly', teamId: teams[1].id, points: 0 });
    expect(optional.response.status).toBe(200);
    expect(retry.response.status).toBe(200);
    expect(retry.data).toEqual(optional.data);
    expect(optional.data.state.score).toBe(100);
    expect((await schemaPool.query('SELECT score FROM teams WHERE id=$1', [teamId])).rows[0].score).toBe(100);
    expect((await schemaPool.query('SELECT score FROM teams WHERE id=$1', [teams[0].id])).rows[0].score).toBe(forgedTeamScoreBefore);

    const hintId = randomUUID();
    const concurrent = await Promise.all([
      api('/hunt2/action', teamIndex, 'POST', { actionId: hintId, type: 'hint', actor: 'archivist' }),
      api('/hunt2/action', teamIndex, 'POST', { actionId: hintId, type: 'hint', actor: 'archivist' }),
    ]);
    expect(concurrent.map((item) => item.response.status)).toEqual([200, 200]);
    expect(concurrent[0].data).toEqual(concurrent[1].data);
    expect(concurrent[0].data.state.penalties).toBe(25);
    expect((await schemaPool.query('SELECT score FROM round_progress WHERE team_id=$1 AND round_id=3', [teamId])).rows[0].score).toBe(75);
    expect((await api('/hunt2/action', teamIndex, 'POST', { actionId: hintId, type: 'interact', actor: 'tracker', objectId: 'optionalAnomaly' })).response.status).toBe(409);

    const forgedComplete = await api('/hunt2/action', teamIndex, 'POST', { actionId: randomUUID(), type: 'complete', actor: 'tracker', completed: true, points: 999999 });
    expect(forgedComplete.response.status).toBe(400);
    expect((await schemaPool.query("SELECT state->>'completed' AS completed FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=2", [teamId])).rows[0].completed).toBe('false');
    expect((await schemaPool.query("SELECT status FROM team_hunt_progress WHERE team_id=$1 AND hunt_id=3", [teamId])).rows[0].status).toBe('LOCKED');

    await schemaPool.query("ALTER TABLE score_transactions ADD CONSTRAINT test_reject_hunt2 CHECK (source_event_id NOT LIKE '%force-rollback%')");
    const before = (await schemaPool.query('SELECT state,version FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=2', [teamId])).rows[0];
    const rollback = await api('/hunt2/action', teamIndex, 'POST', { actionId: 'force-rollback-hunt2', type: 'hint', actor: 'archivist' });
    expect(rollback.response.status).toBeGreaterThanOrEqual(500);
    const after = (await schemaPool.query('SELECT state,version FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=2', [teamId])).rows[0];
    expect(after.state).toEqual(before.state);
    expect(after.version).toBe(before.version);
    expect((await schemaPool.query("SELECT 1 FROM activity_history WHERE team_id=$1 AND source_event_id='round3-hunt2:force-rollback-hunt2'", [teamId])).rowCount).toBe(0);
    await schemaPool.query('ALTER TABLE score_transactions DROP CONSTRAINT test_reject_hunt2');

    await api('/run/pause', teamIndex, 'POST', {});
    expect((await api('/hunt2/action', teamIndex, 'POST', { actionId: randomUUID(), type: 'hint', actor: 'archivist' })).response.status).toBe(409);
    await api('/run/resume', teamIndex, 'POST', {});
    await schemaPool.query("UPDATE round3_runs SET started_at=clock_timestamp()-interval '26 minutes' WHERE team_id=$1", [teamId]);
    expect((await api('/hunt2/action', teamIndex, 'POST', { actionId: randomUUID(), type: 'hint', actor: 'archivist' })).response.status).toBe(409);
    expect((await schemaPool.query('SELECT status FROM round3_runs WHERE team_id=$1', [teamId])).rows[0].status).toBe('expired');
  });

  it('reads and consumes Round 3 cards from PostgreSQL atomically with team isolation and idempotent retries', async () => {
    const teamIndex = 2;
    const teamId = teams[teamIndex].id;
    await schemaPool.query("UPDATE round_progress SET status='IN_PROGRESS' WHERE team_id=$1 AND round_id=3", [teamId]);
    await schemaPool.query("UPDATE round_progress SET status='IN_PROGRESS' WHERE team_id=$1 AND round_id=3", [teams[1].id]);
    await schemaPool.query("UPDATE round3_runs SET status='not_started',remaining_ms=1500000,started_at=NULL WHERE team_id=$1", [teamId]);
    await api('/run/start', teamIndex, 'POST', {});
    await schemaPool.query(
      "INSERT INTO round3_card_inventory(team_id,card_id,source,quantity) VALUES($1,'spectral-lens','development',1),($1,'emergency-power-cell','development',2)",
      [teamId],
    );

    expect((await api('/cards/spectral-lens/activate', undefined, 'POST', { requestId: randomUUID() })).response.status).toBe(401);
    const inventoryState = await api('/session', teamIndex, 'POST', {});
    expect(inventoryState.data.inventory).toEqual([
      { cardId: 'emergency-power-cell', quantity: 2, source: 'development' },
      { cardId: 'spectral-lens', quantity: 1, source: 'development' },
    ]);
    expect((await api('/session', 1, 'POST', {})).data.inventory).toEqual([]);

    const requestId = randomUUID();
    const requests = await Promise.all([
      api('/cards/spectral-lens/activate', teamIndex, 'POST', { requestId, source: 'development', teamId: teams[1].id }),
      api('/cards/spectral-lens/activate', teamIndex, 'POST', { requestId, source: 'development', teamId: teams[1].id }),
    ]);
    expect(requests.map(({ response }) => response.status)).toEqual([200, 200]);
    expect(requests[0].data.usage).toEqual(requests[1].data.usage);
    expect(requests[0].data.state.inventory).toEqual(requests[1].data.state.inventory);
    expect(requests[0].data.usage).toMatchObject({ cardId: 'spectral-lens', source: 'development', requestId, remainingQuantity: 0 });
    expect((await schemaPool.query("SELECT quantity FROM round3_card_inventory WHERE team_id=$1 AND card_id='spectral-lens'", [teamId])).rows[0].quantity).toBe(0);
    expect((await schemaPool.query('SELECT count(*)::int AS n FROM round3_card_usage WHERE team_id=$1 AND source_event_id=$2', [teamId, `round3-card:${requestId}`])).rows[0].n).toBe(1);
    expect((await schemaPool.query("SELECT count(*)::int AS n FROM round3_card_usage WHERE team_id=$1 AND source_event_id=$2", [teams[1].id, `round3-card:${requestId}`])).rows[0].n).toBe(0);
    expect((await api('/cards/spectral-lens/activate', teamIndex, 'POST', { requestId: randomUUID(), source: 'development' })).response.status).toBe(409);

    await schemaPool.query("CREATE FUNCTION reject_round3_card_usage() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced card usage failure'; END $$");
    await schemaPool.query('CREATE TRIGGER reject_round3_card_usage BEFORE INSERT ON round3_card_usage FOR EACH ROW EXECUTE FUNCTION reject_round3_card_usage()');
    const failedRequestId = randomUUID();
    expect((await api('/cards/emergency-power-cell/activate', teamIndex, 'POST', { requestId: failedRequestId, source: 'development' })).response.status).toBe(500);
    expect((await schemaPool.query("SELECT quantity FROM round3_card_inventory WHERE team_id=$1 AND card_id='emergency-power-cell'", [teamId])).rows[0].quantity).toBe(2);
    expect((await schemaPool.query('SELECT count(*)::int AS n FROM round3_card_usage WHERE team_id=$1 AND source_event_id=$2', [teamId, `round3-card:${failedRequestId}`])).rows[0].n).toBe(0);
    await schemaPool.query('DROP TRIGGER reject_round3_card_usage ON round3_card_usage');
    await schemaPool.query('DROP FUNCTION reject_round3_card_usage()');
    const recovered = await api('/cards/emergency-power-cell/activate', teamIndex, 'POST', { requestId: failedRequestId, source: 'development' });
    expect(recovered.response.status).toBe(200);
    expect(recovered.data.usage.remainingQuantity).toBe(1);
    await api('/run/pause', teamIndex, 'POST', {});
    expect((await api('/cards/emergency-power-cell/activate', teamIndex, 'POST', { requestId: randomUUID(), source: 'development' })).response.status).toBe(409);
    expect((await schemaPool.query("SELECT quantity FROM round3_card_inventory WHERE team_id=$1 AND card_id='emergency-power-cell'", [teamId])).rows[0].quantity).toBe(1);
    await schemaPool.query("UPDATE round3_runs SET status='expired',remaining_ms=0,started_at=NULL WHERE team_id=$1", [teamId]);
    expect((await api('/cards/emergency-power-cell/activate', teamIndex, 'POST', { requestId: randomUUID(), source: 'development' })).response.status).toBe(409);
  });

  it('keeps Hunt II locked until PostgreSQL records Hunt I completion', async () => {
    const teamIndex = 1;
    await schemaPool.query("UPDATE round3_runs SET status='not_started',remaining_ms=1500000,started_at=NULL WHERE team_id=$1", [teams[teamIndex].id]);
    expect((await api('/hunt2/session', teamIndex, 'POST', { sharedView: true })).response.status).toBe(423);
    expect((await schemaPool.query("SELECT status FROM team_hunt_progress WHERE team_id=$1 AND hunt_id=2", [teams[teamIndex].id])).rows[0].status).toBe('LOCKED');
  });
});
