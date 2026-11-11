// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import type { Server } from 'node:http';
import * as path from 'node:path';
import { runMigrations } from '../../database/postgres/migration-runner.ts';
import type { Hunt3ActionResult, Hunt3Actor, Hunt3State } from '../../src/types/hunt3.types.ts';
import { hashPassword } from '../auth/password.ts';

const testDatabaseUrl = process.env.PG_TEST_DATABASE_URL;
const suite = testDatabaseUrl ? describe : describe.skip;

suite('Round 3 Hunt III final containment PostgreSQL integration', () => {
  let adminPool: Pool;
  let schemaPool: Pool;
  let schemaName: string;
  let server: Server;
  let baseUrl = '';
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const team = { id: `hunt3-${suffix}`, name: `Hunt3 ${suffix}`, password: 'Hunt#Three2026' };
  const token: Record<Hunt3Actor, string> = { archivist: '', tracker: '' };

  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalSslMode = process.env.PGSSLMODE;

  beforeAll(async () => {
    const localDatabaseUrl = new URL(testDatabaseUrl!);
    if (!['localhost', '127.0.0.1', '::1'].includes(localDatabaseUrl.hostname)) {
      throw new Error('Remote PostgreSQL hosts are refused in Hunt III tests.');
    }
    schemaName = `frost_hunt3_${randomUUID().replaceAll('-', '')}`;
    adminPool = new Pool({ connectionString: testDatabaseUrl });
    await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
    schemaPool = new Pool({ connectionString: testDatabaseUrl, options: `-c search_path=${schemaName}` });
    await runMigrations(schemaPool, path.resolve('database/postgres/migrations'));
    localDatabaseUrl.searchParams.set('options', `-c search_path=${schemaName}`);
    process.env.DATABASE_URL = localDatabaseUrl.toString();
    process.env.PGSSLMODE = 'disable';

    const [{ app }, { seedPostgresTeamIdentity, prepareTeamRoundProgression }] = await Promise.all([
      import('../index.ts'), import('./progressionFixtures.ts'),
    ]);

    const { hash, salt } = hashPassword(team.password);
    await seedPostgresTeamIdentity(team.id, team.name, hash, salt);
    await prepareTeamRoundProgression(team.id, 3, [1, 2]);

    // Mark Hunt II completed in PostgreSQL round3_hunt_state so Hunt III is accessible
    const hunt2Fresh = (await import('../services/round3-hunt2.rules.ts')).createFreshRound3Hunt2State(team.id);
    hunt2Fresh.completed = true;
    await schemaPool.query(
      `INSERT INTO round3_hunt_state(team_id, hunt_id, state, model_version)
       VALUES($1, 2, $2::jsonb, 1)
       ON CONFLICT(team_id, hunt_id) DO UPDATE SET state = $2::jsonb`,
      [team.id, JSON.stringify(hunt2Fresh)],
    );

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    for (const actor of ['archivist', 'tracker'] as const) {
      const login = await fetch(`${baseUrl}/api/auth/team-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: team.name, password: team.password }),
      });
      const result = await login.json() as { token: string; playerNumber: number };
      expect(result.playerNumber).toBe(actor === 'archivist' ? 1 : 2);
      token[actor] = result.token;
    }
  });

  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    const { postgresPool } = await import('../../database/postgres/pool.ts');
    await postgresPool?.end();
    if (schemaPool) await schemaPool.end();
    if (adminPool && schemaName) {
      await adminPool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      await adminPool.end();
    }
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = originalDatabaseUrl;
    if (originalSslMode === undefined) delete process.env.PGSSLMODE; else process.env.PGSSLMODE = originalSslMode;
  });

  it('validates cooperative stage progression, role access, scoring, duplicate protection, refresh, and expiry', async () => {
    const call = async (actor: Hunt3Actor, endpoint: string, body?: unknown) => fetch(`${baseUrl}/api/round3${endpoint}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token[actor]}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const actAs = async (session: Hunt3Actor, actor: Hunt3Actor, id: string) => {
      const response = await call(session, '/hunt3/action', { type: 'interact', id, actor, actionId: randomUUID() });
      expect(response.status).toBe(200);
      return response.json() as Promise<Hunt3ActionResult>;
    };
    const act = (actor: Hunt3Actor, id: string) => actAs(actor, actor, id);

    const submit = async (actor: Hunt3Actor, id: string, value: unknown) => {
      const response = await call(actor, '/hunt3/action', { type: 'submit', id, value, actor, actionId: randomUUID() });
      expect(response.status).toBe(200);
      return response.json() as Promise<Hunt3ActionResult>;
    };

    await call('archivist', '/session', {});
    await call('archivist', '/run/start', {});
    const opened = await call('tracker', '/hunt3/session', {});
    if (opened.status !== 200) throw new Error(`Hunt III session open failed (${opened.status}): ${await opened.text()}`);

    // Cross-timeline rejection
    const crossTimeline = await call('archivist', '/hunt3/action', { type: 'interact', id: 'sighting-ledger', actor: 'tracker', actionId: randomUUID() });
    expect(((await crossTimeline.json()) as { success: boolean }).success).toBe(false);

    // Shared browser support: Archivist session acting as Tracker
    const localTrackerEvidence = await actAs('archivist', 'tracker', 'cold-ash');
    expect(localTrackerEvidence.success).toBe(true);

    for (const id of ['sighting-ledger', 'containment-observation', 'old-facility-report']) await act('archivist', id);
    const sharedProgress = (await call('tracker', '/hunt3/state').then((r) => r.json())) as { state: Hunt3State };
    expect(sharedProgress.state.journal).toHaveLength(4);
    expect(sharedProgress.state.evidence.archivist).toHaveLength(3);

    const historical = await submit('archivist', 'trail-location', { location: 'east-wing' });
    expect(historical.state.trail.tracker).toBeNull();
    for (const id of ['drag-marks', 'shattered-compass']) await act('tracker', id);
    let result = await submit('tracker', 'trail-location', { location: 'cold-star' });
    expect(result.state.stage).toBe(2);
    expect(result.state.scoreBreakdown.stage1).toBe(250);

    // Stage 2
    for (const seal of ['power', 'resonance', 'memory'] as const) {
      await act('archivist', `${seal}-diagram`);
      if (seal === 'power') {
        expect((await call('tracker', '/hunt3/action', { type: 'submit', actor: 'tracker', id: 'seal-power-archive', value: { sequence: ['source', 'ground', 'return'] }, actionId: randomUUID() }).then((r) => r.json()) as { success: boolean }).success).toBe(false);
        expect((await submit('tracker', 'seal-power', { sequence: ['source', 'ground', 'return'] })).success).toBe(false);
        expect((await submit('archivist', 'seal-power-archive', { sequence: ['source', 'return', 'ground'] })).success).toBe(false);
      }
      const archiveOrder = seal === 'power' ? ['source', 'ground', 'return'] : seal === 'resonance' ? ['low-tone', 'phase-two', 'silence'] : ['arrival', 'warning', 'anchor'];
      expect((await submit('archivist', `seal-${seal}-archive`, { sequence: archiveOrder })).success).toBe(true);
      if (seal === 'power') expect((await act('tracker', 'power-diagram')).success).toBe(false);
      expect((await act('tracker', `${seal}-mechanism`)).success).toBe(true);
      if (seal === 'power') {
        expect((await submit('tracker', 'seal-power', { sequence: ['source', 'return', 'ground'] })).success).toBe(false);
        result = await submit('tracker', 'seal-power', { sequence: ['source', 'ground', 'return'] });
      }
      if (seal === 'resonance') result = await submit('tracker', 'seal-resonance', { sequence: archiveOrder });
      if (seal === 'memory') result = await submit('tracker', 'seal-memory', { sequence: archiveOrder });
      expect(result.success).toBe(true);
    }

    await act('archivist', 'component-catalog');
    for (const part of ['induction-coil', 'prism-lens', 'grounding-braid', 'memory-core']) await act('tracker', `recover-${part}`);
    result = (await (await call('tracker', '/hunt3/state')).json()) as Hunt3ActionResult;
    expect(result.state.scoreBreakdown.stage2).toBe(400);
    const loaded = (await (await call('tracker', '/hunt3/state')).json()) as { state: Hunt3State };
    expect(loaded.state.stage).toBe(3);
    expect(loaded.state.components).toHaveLength(4);

    // Stage 3
    await act('archivist', 'apparatus-blueprint');
    await act('archivist', 'weakness-notes');
    await submit('archivist', 'apparatus', { sequence: ['coil:west', 'lens:center', 'braid:ground', 'core:east'] });
    await act('tracker', 'physical-apparatus');
    await submit('tracker', 'apparatus', { sequence: ['coil:west', 'lens:center', 'braid:ground', 'core:east'] });
    await act('tracker', 'test-station');
    for (const [condition, reading] of [['frequency-low', 'withdrawal'], ['light-dark', 'surge'], ['temperature-cold', 'withdrawal']]) {
      await submit('tracker', 'weakness-trial', { condition, reading });
    }
    expect((await submit('archivist', 'weakness-conclusion', { profile: ['frequency-low', 'light-dark', 'temperature-cold'] })).success).toBe(true);
    await act('archivist', 'lure-control');
    for (let i = 0; i < 3; i += 1) await act('tracker', 'disruptor');
    expect(((await call('tracker', '/hunt3/state').then((r) => r.json())) as { state: Hunt3State }).state.stage).toBe(4);

    // Hidden paired objective
    await act('archivist', 'secret-inscription');
    result = await act('tracker', 'secret-residue');
    expect(result.state.scoreBreakdown.optional).toBe(100);
    await act('tracker', 'secret-residue');
    expect(((await call('tracker', '/hunt3/state').then((r) => r.json())) as { state: Hunt3State }).state.scoreBreakdown.optional).toBe(100);

    // Stage 4 Boss sequence
    const boss: Array<[Hunt3Actor, string]> = [
      ['archivist', 'hold-record'],
      ['tracker', 'ground-current'],
      ['archivist', 'release-memory'],
      ['tracker', 'vent-pressure'],
      ['archivist', 'lock-sequence'],
    ];
    for (const [actor, id] of boss) {
      await new Promise((resolve) => setTimeout(resolve, 710));
      result = await act(actor, id);
    }

    // Test boss timeout destabilization
    const huntStateRow = (await schemaPool.query<{ state: Hunt3State }>('SELECT state FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=3', [team.id])).rows[0].state;
    huntStateRow.boss.deadlineAt = Date.now() - 1;
    await schemaPool.query('UPDATE round3_hunt_state SET state=$2::jsonb WHERE team_id=$1 AND hunt_id=3', [team.id, JSON.stringify(huntStateRow)]);

    result = await act('tracker', 'close-containment');
    expect(result.success).toBe(false);
    expect(result.message).toContain('warning window closed');

    await new Promise((resolve) => setTimeout(resolve, 710));
    await act('archivist', 'lock-sequence');
    await new Promise((resolve) => setTimeout(resolve, 710));
    result = await act('tracker', 'close-containment');

    expect(result.state.completed).toBe(true);
    expect(result.state.scoreBreakdown.stage4).toBe(500);
    expect(result.state.score).toBe(1560);

    // Idempotent retry with same actionId returns identical state
    const actionId = randomUUID();
    const sub1 = await call('tracker', '/hunt3/action', { type: 'interact', id: 'close-containment', actor: 'tracker', actionId });
    const sub2 = await call('tracker', '/hunt3/action', { type: 'interact', id: 'close-containment', actor: 'tracker', actionId });
    expect(await sub1.json()).toEqual(await sub2.json());

    // Verified complete endpoint
    const completeRes = await call('archivist', '/complete', {});
    expect(completeRes.status).toBe(200);
    const completeBody = (await completeRes.json()) as { success: boolean; completed: boolean };
    expect(completeBody.completed).toBe(true);
  });
});
