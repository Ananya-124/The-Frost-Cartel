// @vitest-environment node
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migration-runner.ts';
import {
  getRound3Run,
  getRound3Session,
  pauseRound3Run,
  resumeRound3Run,
  Round3VersionConflictError,
  startRound3Run,
  updateRound3Session,
} from './round3-repository.ts';

const connectionString = process.env.PG_TEST_DATABASE_URL;
const suite = connectionString ? describe : describe.skip;
let adminPool: Pool;
let pool: Pool;
let schemaName: string;

async function createTeam(name: string) {
  const id = `r3-repo-${randomUUID()}`;
  await pool.query('INSERT INTO teams(id,team_name,password_hash,salt) VALUES($1,$2,$3,$4)', [id, name, 'hash', 'salt']);
  return id;
}

suite('PostgreSQL Round 3 session and run repositories', () => {
  beforeAll(async () => {
    const parsed = new URL(connectionString!);
    if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
      throw new Error('PG_TEST_DATABASE_URL must point to a local PostgreSQL server; remote databases are refused.');
    }
    adminPool = new Pool({ connectionString });
    schemaName = `frost_r3_repo_${randomUUID().replaceAll('-', '')}`;
    await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
    pool = new Pool({ connectionString, options: `-c search_path=${schemaName}` });
    await runMigrations(pool, path.resolve('database/postgres/migrations'));
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
    if (schemaName) await adminPool?.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await adminPool?.end();
  });

  it('reads and updates session state by team with optimistic version protection', async () => {
    const [teamA, teamB] = await Promise.all([createTeam('Round 3 A'), createTeam('Round 3 B')]);
    const initialA = await getRound3Session(pool, teamA);
    const initialB = await getRound3Session(pool, teamB);
    expect(initialA).toMatchObject({ team_id: teamA, current_hunt: 1, version: '1', is_completed: false });
    expect(initialB).toMatchObject({ team_id: teamB, current_hunt: 1, version: '1', is_completed: false });

    const updated = await updateRound3Session(pool, teamA, initialA!.version, {
      current_hunt: 2,
      player_progress: { marker: 'team-a' },
      evidence: ['found-note'],
    });
    expect(updated).toMatchObject({ team_id: teamA, current_hunt: 2, version: '2', player_progress: { marker: 'team-a' }, evidence: ['found-note'] });
    await expect(updateRound3Session(pool, teamA, initialA!.version, { current_hunt: 3 }))
      .rejects.toBeInstanceOf(Round3VersionConflictError);
    expect(await getRound3Session(pool, teamB)).toMatchObject({ team_id: teamB, current_hunt: 1, version: '1', player_progress: {} });
    expect(await getRound3Session(pool, 'missing-team')).toBeNull();
    expect(await startRound3Run(pool, teamA)).toMatchObject({ status: 'running' });
    expect(await getRound3Run(pool, teamB)).toMatchObject({ status: 'not_started', remaining_ms: 1_500_000, version: '1' });
  });

  it('serializes concurrent session writes and rejects the stale writer', async () => {
    const teamId = await createTeam('Concurrent session');
    const current = await getRound3Session(pool, teamId);
    const writes = await Promise.allSettled([
      updateRound3Session(pool, teamId, current!.version, { past_state: { writer: 'a' } }),
      updateRound3Session(pool, teamId, current!.version, { future_state: { writer: 'b' } }),
    ]);
    expect(writes.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(writes.filter((result) => result.status === 'rejected' && result.reason instanceof Round3VersionConflictError)).toHaveLength(1);
    expect((await getRound3Session(pool, teamId))?.version).toBe('2');
  });

  it('initializes timers at 25 minutes and persists start, pause and resume across a pool restart', async () => {
    const teamId = await createTeam('Timer persistence');
    const initialized = await getRound3Run(pool, teamId);
    expect(initialized).toMatchObject({ status: 'not_started', remaining_ms: 1_500_000, remaining_seconds: 1_500, version: '1' });

    const started = await startRound3Run(pool, teamId);
    expect(started).toMatchObject({ status: 'running', remaining_ms: 1_500_000, version: '2' });
    expect(await startRound3Run(pool, teamId)).toMatchObject({ status: 'running', version: '2' });
    const paused = await pauseRound3Run(pool, teamId);
    expect(paused?.status).toBe('paused');
    expect(paused!.remaining_ms).toBeGreaterThan(0);
    expect(paused!.remaining_ms).toBeLessThanOrEqual(1_500_000);

    await pool.end();
    pool = new Pool({ connectionString, options: `-c search_path=${schemaName}` });
    const afterRestart = await getRound3Run(pool, teamId);
    expect(afterRestart).toMatchObject({ status: 'paused', remaining_ms: paused!.remaining_ms, version: paused!.version });
    const resumed = await resumeRound3Run(pool, teamId);
    expect(resumed).toMatchObject({ status: 'running', remaining_ms: paused!.remaining_ms, version: String(Number(paused!.version) + 1) });
    const pausedAgain = await pauseRound3Run(pool, teamId);
    expect(pausedAgain!.remaining_ms).toBeLessThanOrEqual(resumed!.remaining_ms);
  });

  it('serializes concurrent timer transitions without duplicate version increments', async () => {
    const teamId = await createTeam('Concurrent timer');
    const starts = await Promise.all([startRound3Run(pool, teamId), startRound3Run(pool, teamId)]);
    expect(starts.map((run) => run?.status)).toEqual(['running', 'running']);
    expect((await getRound3Run(pool, teamId))?.version).toBe('2');
    const pauses = await Promise.all([pauseRound3Run(pool, teamId), pauseRound3Run(pool, teamId)]);
    expect(pauses.map((run) => run?.status)).toEqual(['paused', 'paused']);
    expect((await getRound3Run(pool, teamId))?.version).toBe('3');
  });

  it('persists expiry without marking a hunt or session completed', async () => {
    const teamId = await createTeam('Expired timer');
    await startRound3Run(pool, teamId);
    await pool.query(
      "UPDATE round3_runs SET started_at=clock_timestamp()-interval '26 minutes' WHERE team_id=$1",
      [teamId],
    );
    const expired = await getRound3Run(pool, teamId);
    expect(expired).toMatchObject({ status: 'expired', remaining_ms: 0, started_at: null, version: '3' });
    expect(await getRound3Session(pool, teamId)).toMatchObject({ is_completed: false, completed_at: null });
    expect(await resumeRound3Run(pool, teamId)).toMatchObject({ status: 'expired', version: '3' });

    const completedTeam = await createTeam('Completed timer');
    await pool.query("UPDATE round3_runs SET status='completed' WHERE team_id=$1", [completedTeam]);
    await pool.query('UPDATE round3_sessions SET is_completed=true,completed_at=clock_timestamp() WHERE team_id=$1', [completedTeam]);
    expect(await getRound3Run(pool, completedTeam)).toMatchObject({ status: 'completed', version: '1' });
    expect(await getRound3Session(pool, completedTeam)).toMatchObject({ is_completed: true });
  });

  it('rolls back timer state when a transition fails', async () => {
    const teamId = await createTeam('Timer rollback');
    const started = await startRound3Run(pool, teamId);
    await pool.query(`CREATE FUNCTION fail_round3_pause() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.status = 'paused' THEN RAISE EXCEPTION 'forced Round 3 run failure'; END IF; RETURN NEW; END $$`);
    await pool.query('CREATE TRIGGER fail_round3_pause BEFORE UPDATE ON round3_runs FOR EACH ROW EXECUTE FUNCTION fail_round3_pause()');
    try {
      await expect(pauseRound3Run(pool, teamId)).rejects.toThrow('forced Round 3 run failure');
      expect(await getRound3Run(pool, teamId)).toMatchObject({ status: 'running', version: started!.version });
    } finally {
      await pool.query('DROP TRIGGER fail_round3_pause ON round3_runs');
      await pool.query('DROP FUNCTION fail_round3_pause()');
    }
  });
});
