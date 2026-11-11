// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import type { Server } from 'node:http';
import * as path from 'node:path';
import { runMigrations } from '../../database/postgres/migration-runner.ts';
import { hashPassword } from '../auth/password.ts';

const testDatabaseUrl = process.env.PG_TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error('PG_TEST_DATABASE_URL is required for this isolated PostgreSQL integration test.');
const localDatabaseUrl = new URL(testDatabaseUrl);
if (!['localhost', '127.0.0.1', '::1'].includes(localDatabaseUrl.hostname)) throw new Error('Remote PostgreSQL hosts are refused in Hunt I tests.');
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalSslMode = process.env.PGSSLMODE;
const schemaName = `frost_hunt1_${randomUUID().replaceAll('-', '')}`;
const adminPool = new Pool({ connectionString: testDatabaseUrl });
await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
const schemaPool = new Pool({ connectionString: testDatabaseUrl, options: `-c search_path=${schemaName}` });
await runMigrations(schemaPool, path.resolve('database/postgres/migrations'));
localDatabaseUrl.searchParams.set('options', `-c search_path=${schemaName}`);
process.env.DATABASE_URL = localDatabaseUrl.toString();
process.env.PGSSLMODE = 'disable';

const [{ app }, { seedPostgresTeamIdentity, prepareTeamRoundProgression, removeTeamProgressionFixture }] = await Promise.all([
  import('../index.ts'), import('./progressionFixtures.ts'),
]);

describe('Round 3 Hunt I — four retained incident tasks', () => {
  let server: Server;
  let baseUrl = '';
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const team = { id: `hunt1-test-${suffix}`, name: `Hunt1 Test ${suffix}`, password: 'Hunt#One2026' };
  const tokens: Record<'archivist' | 'tracker', string> = { archivist: '', tracker: '' };

  beforeAll(async () => {
    const { hash, salt } = hashPassword(team.password);
    await seedPostgresTeamIdentity(team.id, team.name, hash, salt);
    await prepareTeamRoundProgression(team.id, 3);
    await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', () => { const address = server.address(); if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`; resolve(); }); });
    for (const actor of ['archivist', 'tracker'] as const) {
      const login = await fetch(`${baseUrl}/api/auth/team-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamName: team.name, password: team.password }) });
      const result = await login.json() as { token: string; playerNumber: number };
      expect(result.playerNumber).toBe(actor === 'archivist' ? 1 : 2);
      tokens[actor] = result.token;
    }
  });

  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    await removeTeamProgressionFixture(team.id);
    const { postgresPool } = await import('../../database/postgres/pool.ts');
    await postgresPool?.end();
    await schemaPool.end();
    await adminPool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await adminPool.end();
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = originalDatabaseUrl;
    if (originalSslMode === undefined) delete process.env.PGSSLMODE; else process.env.PGSSLMODE = originalSslMode;
  });

  it('starts at Power Failure, rejects removed interactions, and validates every retained task and award', async () => {
    const call = async (actor: 'archivist' | 'tracker', pathName: string, body?: unknown) => fetch(`${baseUrl}/api/round3${pathName}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${tokens[actor]}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const action = async (actor: 'archivist' | 'tracker', type: string, objectId?: string, sequence?: string[]) => {
      const response = await call(actor, '/hunt1/action', { actionId: randomUUID(), type, actor, ...(objectId ? { objectId } : {}), ...(sequence ? { value: { sequence } } : {}) });
      expect(response.status).toBe(200);
      return response.json() as Promise<{ success: boolean; message: string; state: any }>;
    };
    const interact = (actor: 'archivist' | 'tracker', id: string) => action(actor, 'interact', id);

    await call('archivist', '/session', {});
    await call('archivist', '/run/start', {});
    const opened = await call('archivist', '/hunt1/session', {});
    expect(opened.status).toBe(200);
    const openedState = (await opened.json() as { state: any }).state;
    expect(openedState.currentChallenge).toBe(1);
    expect(openedState.modelVersion).toBe(3);
    expect(openedState.taskCompleted).toEqual({ powerFailure: false, observationLog: false, signalReconstruction: false, incidentConclusion: false });
    expect(openedState.availableInteractables).not.toContain('visitorLedger');
    expect(openedState.availableInteractables).not.toContain('archiveIndex');
    expect((await call('archivist', '/hunt2/session', {})).status).toBe(423);

    expect((await interact('archivist', 'visitorLedger')).success).toBe(false);
    expect((await interact('archivist', 'archiveIndex')).success).toBe(false);
    await interact('archivist', 'generatorLog');
    await interact('tracker', 'burntRelay');
    await interact('tracker', 'openGround');
    const wiring = ['generator-relay', 'relay-load', 'load-ground', 'ground-frame'];
    expect((await action('tracker', 'powerFailureTracker', undefined, wiring)).success).toBe(false);
    expect((await action('archivist', 'powerFailureArchivist', undefined, wiring)).success).toBe(true);
    let result = await action('tracker', 'powerFailureTracker', undefined, wiring);
    expect(result.state.currentChallenge).toBe(2);
    expect(result.state.taskScores.powerFailure).toBe(200);

    await interact('archivist', 'observationLog');
    await interact('tracker', 'cameraBuffer');
    const timeline = ['alarm', 'lights-fail', 'subject-appears', 'observer-vanishes'];
    expect((await action('archivist', 'observationArchivist', undefined, timeline)).state.currentChallenge).toBe(2);
    result = await action('tracker', 'observationTracker', undefined, timeline);
    expect(result.state.currentChallenge).toBe(3);
    expect(result.state.taskScores.observationLog).toBe(200);

    await interact('archivist', 'signalChart');
    await interact('tracker', 'cableJunction');
    const route = ['intake', 'ground', 'observer', 'transmit'];
    await action('archivist', 'signalArchivist', undefined, route);
    result = await action('tracker', 'signalTracker', undefined, route);
    expect(result.state.currentChallenge).toBe(4);
    expect(result.state.taskScores.signalReconstruction).toBe(200);

    await interact('archivist', 'optionalResearchNote');
    await interact('tracker', 'optionalForgottenRecording');
    await interact('archivist', 'incidentBoardPast');
    await interact('tracker', 'incidentBoardFuture');
    const historical = ['temporal-resonance-reconstructs-human-memories', 'resonance-limited-to-recorded-imprints'];
    const physical = ['omitted-ground-and-relay-bypass-exceeded-limits', 'a-reconstructed-memory-became-conscious-after-transmission', 'that-consciousness-manifested-as-the-entity'];
    await action('archivist', 'incidentConclusionArchivist', undefined, historical);
    result = await action('tracker', 'incidentConclusionTracker', undefined, physical);
    expect(result.state.completed).toBe(true);
    expect(result.state.taskCompleted).toEqual({ powerFailure: true, observationLog: true, signalReconstruction: true, incidentConclusion: true });
    expect(result.state.taskScores).toEqual({ powerFailure: 200, observationLog: 200, signalReconstruction: 200, incidentConclusion: 150 });
    expect(result.state.score).toBe(850);
    expect((await call('tracker', '/state').then((response) => response.json()) as { session: { score: number } }).session.score).toBe(850);
    const progression = await fetch(`${baseUrl}/api/progression/me`, { headers: { Authorization: `Bearer ${tokens.tracker}` } });
    expect(progression.status).toBe(200);
    const huntStates = (await schemaPool.query('SELECT hunt_id,status FROM team_hunt_progress WHERE team_id=$1 ORDER BY hunt_id', [team.id])).rows;
    expect(huntStates).toMatchObject([{ hunt_id: 1, status: 'COMPLETED' }, { hunt_id: 2, status: 'AVAILABLE' }, { hunt_id: 3, status: 'LOCKED' }]);
  });
});
