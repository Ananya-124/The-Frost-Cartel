// @vitest-environment node
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { adminProgress, assertHuntAccessible, assertRound4Qualified, assertRoundAccessible, completeHunt, completeRound, getRound4Qualification, ProgressionError, qualifyRound4Teams, startHunt, startRound } from './progression.ts';
import { runMigrations } from './migration-runner.ts';

const connectionString = process.env.PG_TEST_DATABASE_URL;
const suite = connectionString ? describe : describe.skip;
let adminPool: Pool;
let pool: Pool;
let schemaName: string;
let teamCounter = 0;
const adminId = 'test-admin';
const adminToken = 'test-admin-session-token';

async function createTeam(name: string): Promise<string> {
  const id = `test-team-${++teamCounter}-${randomUUID()}`;
  await pool.query('INSERT INTO teams(id, team_name, password_hash, salt) VALUES($1,$2,$3,$4)', [id, name, 'hash', 'salt']);
  return id;
}

async function roundStatus(teamId: string, roundId: number) {
  return (await pool.query('SELECT status, eligible_at, completed_at FROM round_progress WHERE team_id=$1 AND round_id=$2', [teamId, roundId])).rows[0];
}

async function prepareRound3(teamId: string): Promise<void> {
  await startRound(pool, teamId, 1);
  await completeRound(pool, teamId, 1);
  await adminProgress(pool, adminToken, teamId, 'ROUND', 2, 'unlock');
  await pool.query('UPDATE round2_auction_config SET enabled=true WHERE id=1');
  await startRound(pool, teamId, 2);
  await completeRound(pool, teamId, 2);
  expect(await roundStatus(teamId, 3)).toMatchObject({ status: 'AVAILABLE' });
  await startRound(pool, teamId, 3);
}

suite('PostgreSQL progression integration (isolated local database)', () => {
  beforeAll(async () => {
    const parsed = new URL(connectionString!);
    if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
      throw new Error('PG_TEST_DATABASE_URL must point to a local PostgreSQL server; remote databases are refused.');
    }
    adminPool = new Pool({ connectionString });
    schemaName = `frost_progress_${randomUUID().replaceAll('-', '')}`;
    await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
    pool = new Pool({ connectionString, options: `-c search_path=${schemaName}` });
    await runMigrations(pool, path.resolve('database/postgres/migrations'));
    await pool.query('INSERT INTO admins(id, username, password_hash, salt) VALUES($1,$2,$3,$4)', [adminId, 'test-admin', 'hash', 'salt']);
    await pool.query('INSERT INTO admin_sessions(id, admin_id, token, expires_at) VALUES($1,$2,$3,now()+interval \'1 hour\')', ['session-id', adminId, adminToken]);
  }, 30_000);

  beforeEach(async () => {
    // Each case starts with the production-safe default; tests that exercise
    // activation explicitly enable it within their own isolated schema.
    await pool.query('UPDATE round2_auction_config SET enabled=false WHERE id=1');
  });

  afterAll(async () => {
    await pool?.end();
    if (schemaName) await adminPool?.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await adminPool?.end();
  });

  it('initializes all rounds and hunts independently for each new team', async () => {
    const teamA = await createTeam('Alpha');
    const teamB = await createTeam('Bravo');
    expect((await roundStatus(teamA, 1)).status).toBe('AVAILABLE');
    expect((await roundStatus(teamA, 2)).status).toBe('LOCKED');
    expect((await roundStatus(teamB, 1)).status).toBe('AVAILABLE');
    expect((await pool.query('SELECT status FROM team_hunt_progress WHERE team_id=$1 ORDER BY hunt_id', [teamA])).rows.map((row) => row.status)).toEqual(['LOCKED', 'LOCKED', 'LOCKED']);
    await startRound(pool, teamA, 1);
    await expect(assertRoundAccessible(pool, teamB, 2)).rejects.toMatchObject({ code: 'LOCKED' });
  });

  it('keeps the next round locked after completion until a valid admin session unlocks it', async () => {
    const team = await createTeam('RoundSequence');
    await startRound(pool, team, 1);
    await completeRound(pool, team, 1);
    expect(await roundStatus(team, 2)).toMatchObject({ status: 'LOCKED' });
    await expect(assertRoundAccessible(pool, team, 2)).rejects.toMatchObject({ code: 'LOCKED' });
    await expect(adminProgress(pool, adminId, team, 'ROUND', 2, 'unlock')).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await adminProgress(pool, adminToken, team, 'ROUND', 2, 'unlock', 'verified');
    expect((await roundStatus(team, 2)).status).toBe('AVAILABLE');
    await expect(assertRoundAccessible(pool, team, 2)).rejects.toMatchObject({ code: 'LOCKED' });
    await expect(startRound(pool, team, 2)).rejects.toMatchObject({ code: 'LOCKED' });
    await pool.query('UPDATE round2_auction_config SET enabled=true WHERE id=1');
    await expect(assertRoundAccessible(pool, team, 2)).resolves.toBeUndefined();
  });

  it('advances only the selected team to Round 2 and leaves the auction disabled', async () => {
    const selected = await createTeam('SelectedTeam');
    const other = await createTeam('OtherTeam');
    await startRound(pool, selected, 1);
    await completeRound(pool, selected, 1);

    await adminProgress(pool, adminToken, selected, 'ROUND', 2, 'unlock');

    expect((await roundStatus(selected, 2)).status).toBe('AVAILABLE');
    expect((await roundStatus(other, 2)).status).toBe('LOCKED');
    expect((await pool.query('SELECT enabled FROM round2_auction_config WHERE id=1')).rows[0].enabled).toBe(false);
    await expect(assertRoundAccessible(pool, selected, 2)).rejects.toMatchObject({ code: 'LOCKED' });
  });

  it('enforces Hunt I, Hunt II, Hunt III sequentially and auto-advances Round 3 and Round 4', async () => {
    const team = await createTeam('HuntSequence');
    await prepareRound3(team);
    await expect(assertHuntAccessible(pool, team, 2)).rejects.toMatchObject({ code: 'LOCKED' });
    await expect(startHunt(pool, team, 3)).rejects.toMatchObject({ code: 'LOCKED' });
    await startHunt(pool, team, 1);
    await completeHunt(pool, team, 1);
    await expect(assertHuntAccessible(pool, team, 2)).resolves.toBeUndefined();
    await startHunt(pool, team, 2);
    await completeHunt(pool, team, 2);
    await startHunt(pool, team, 3);
    await completeHunt(pool, team, 3);
    expect((await pool.query('SELECT hunt_id,status,completed_at FROM team_hunt_progress WHERE team_id=$1 ORDER BY hunt_id', [team])).rows.map((row) => row.status)).toEqual(['COMPLETED', 'COMPLETED', 'COMPLETED']);
    await completeRound(pool, team, 3);
    expect(await roundStatus(team, 4)).toMatchObject({ status: 'AVAILABLE' });
    expect((await roundStatus(team, 4)).eligible_at).not.toBeNull();
  });

  it('does not trust a client-supplied admin id in place of a live admin session token', async () => {
    const team = await createTeam('InvalidAdmin');
    await startRound(pool, team, 1);
    await completeRound(pool, team, 1);
    await expect(adminProgress(pool, adminId, team, 'ROUND', 2, 'unlock')).rejects.toBeInstanceOf(ProgressionError);
    expect((await roundStatus(team, 2)).status).toBe('LOCKED');
  });

  it('authorizes Round 4 qualification, enforces unique teams/routes, and initializes route progress atomically', async () => {
    const alpha = await createTeam('Qualified Alpha');
    const beta = await createTeam('Qualified Beta');
    const routeA = 'route-1';
    const routeB = 'route-2';

    const assignments = [{ teamId: alpha, routeId: routeA }, { teamId: beta, routeId: routeB }];
    await expect(qualifyRound4Teams(pool, 'invalid-admin-session', assignments)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(qualifyRound4Teams(pool, adminToken, [{ teamId: alpha, routeId: routeA }, { teamId: beta, routeId: routeA }]))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(qualifyRound4Teams(pool, adminToken, Array.from({ length: 8 }, (_, i) => ({ teamId: `team-${i}`, routeId: `route-${i}` }))))
      .rejects.toMatchObject({ code: 'CONFLICT' });

    await qualifyRound4Teams(pool, adminToken, assignments);
    expect(await getRound4Qualification(pool, alpha)).toMatchObject({ team_id: alpha, route_id: routeA });
    await expect(assertRound4Qualified(pool, alpha, routeA)).resolves.toBeUndefined();
    await expect(assertRound4Qualified(pool, alpha, routeB)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await pool.query('SELECT team_id,route_id,current_step_index,solved_steps FROM round4_team_progress WHERE team_id=$1',[alpha])).rows[0])
      .toMatchObject({ team_id: alpha, route_id: routeA, current_step_index: 0, solved_steps: [] });
    expect((await pool.query('SELECT count(*)::int AS count FROM round4_qualified_teams')).rows[0].count).toBe(2);

    await expect(qualifyRound4Teams(pool, adminToken, [{ teamId: alpha, routeId: 'missing-route' }]))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect((await pool.query('SELECT count(*)::int AS count FROM round4_qualified_teams')).rows[0].count).toBe(2);
  });

  it('makes duplicate concurrent round completion idempotent', async () => {
    const team = await createTeam('ConcurrentCompletion');
    await startRound(pool, team, 1);
    await Promise.all([completeRound(pool, team, 1), completeRound(pool, team, 1)]);
    const completions = await pool.query("SELECT count(*)::int AS count FROM progression_audit_history WHERE team_id=$1 AND entity_type='ROUND' AND entity_id=1 AND action_performed='COMPLETE'", [team]);
    const eligibility = await pool.query("SELECT count(*)::int AS count FROM progression_audit_history WHERE team_id=$1 AND entity_type='ROUND' AND entity_id=2 AND action_performed='MARK_ELIGIBLE'", [team]);
    expect(completions.rows[0].count).toBe(1);
    expect(eligibility.rows[0].count).toBe(1);
  });

  it('resets an earlier hunt by locking later hunts while retaining audit and score history', async () => {
    const team = await createTeam('HuntReset');
    await prepareRound3(team);
    await startHunt(pool, team, 1); await completeHunt(pool, team, 1);
    await startHunt(pool, team, 2); await completeHunt(pool, team, 2);
    await startHunt(pool, team, 3); await completeHunt(pool, team, 3);
    await pool.query('INSERT INTO score_transactions(id,team_id,round_id,delta,new_score,reason) VALUES($1,$2,3,25,25,$3)', ['score-before-reset', team, 'test score']);
    const historyBefore = Number((await pool.query('SELECT count(*) FROM progression_audit_history WHERE team_id=$1', [team])).rows[0].count);
    await adminProgress(pool, adminToken, team, 'HUNT', 1, 'reset', 'retry hunt sequence');
    expect((await pool.query('SELECT status,completed_at FROM team_hunt_progress WHERE team_id=$1 ORDER BY hunt_id', [team])).rows.map((row) => row.status)).toEqual(['LOCKED', 'LOCKED', 'LOCKED']);
    expect(Number((await pool.query('SELECT count(*) FROM progression_audit_history WHERE team_id=$1', [team])).rows[0].count)).toBeGreaterThan(historyBefore);
    expect((await pool.query('SELECT id FROM score_transactions WHERE id=$1', ['score-before-reset'])).rowCount).toBe(1);
  });

  it('rolls back progression and audit together when the audit insert fails', async () => {
    const team = await createTeam('Rollback');
    await pool.query(`CREATE FUNCTION fail_progress_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced audit failure'; END $$`);
    await pool.query('CREATE TRIGGER fail_progress_audit BEFORE INSERT ON progression_audit_history FOR EACH ROW EXECUTE FUNCTION fail_progress_audit()');
    await expect(startRound(pool, team, 1)).rejects.toThrow(/forced audit failure/);
    expect((await roundStatus(team, 1)).status).toBe('AVAILABLE');
    expect((await pool.query('SELECT count(*) FROM progression_audit_history WHERE team_id=$1', [team])).rows[0].count).toBe('0');
    await pool.query('DROP TRIGGER fail_progress_audit ON progression_audit_history');
    await pool.query('DROP FUNCTION fail_progress_audit()');
  });
});
