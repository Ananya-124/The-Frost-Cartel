// @vitest-environment node
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migration-runner.ts';
import { getLeaderboard, LedgerError, recordCreditEvent, recordScoreEvent } from './ledger.ts';
import { startRound } from './progression.ts';

const connectionString = process.env.PG_TEST_DATABASE_URL;
const suite = connectionString ? describe : describe.skip;
let ownerPool: Pool;
let pool: Pool;
let schemaName: string;
let counter = 0;

async function createTeam(name: string, score = 0, credits = 500): Promise<string> {
  const id = `ledger-${++counter}-${randomUUID()}`;
  await pool.query('INSERT INTO teams(id,team_name,password_hash,salt,score,total_credits) VALUES($1,$2,$3,$4,$5,$6)', [id,name,'hash','salt',score,credits]);
  return id;
}

suite('PostgreSQL centralized score, credit and leaderboard services', () => {
  beforeAll(async () => {
    const parsed = new URL(connectionString!);
    if (!['localhost','127.0.0.1','::1'].includes(parsed.hostname)) throw new Error('Remote PostgreSQL hosts are refused in integration tests.');
    ownerPool = new Pool({ connectionString });
    schemaName = `frost_ledger_${randomUUID().replaceAll('-','')}`;
    await ownerPool.query(`CREATE SCHEMA "${schemaName}"`);
    pool = new Pool({ connectionString, options: `-c search_path=${schemaName}` });
    await runMigrations(pool, path.resolve('database/postgres/migrations'));
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
    if (schemaName) await ownerPool?.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await ownerPool?.end();
  });

  it('records score and round totals atomically, caps awards, applies penalties, and is idempotent', async () => {
    const teamId = await createTeam('Atomic Score');
    await startRound(pool, teamId, 1);
    await pool.query('UPDATE round_progress SET max_score=500 WHERE team_id=$1 AND round_id=1', [teamId]);
    const input = { teamId, roundId: 1, delta: 600, sourceEventId: 'stage-one', reason: 'stage completion', stageId: 1 };
    const [first, retry] = await Promise.all([recordScoreEvent(pool, input), recordScoreEvent(pool, input)]);
    expect(first).toMatchObject({ delta: 500, score: 500, duplicate: false });
    expect(retry).toMatchObject({ transactionId: first.transactionId, delta: 500, score: 500, duplicate: true });
    expect((await pool.query('SELECT score FROM teams WHERE id=$1',[teamId])).rows[0].score).toBe(500);
    expect((await pool.query('SELECT score FROM round_progress WHERE team_id=$1 AND round_id=1',[teamId])).rows[0].score).toBe(500);
    expect((await pool.query('SELECT count(*)::int AS count FROM score_transactions WHERE team_id=$1',[teamId])).rows[0].count).toBe(1);
    await expect(recordScoreEvent(pool, { ...input, delta: 10 })).rejects.toMatchObject({ code: 'CONFLICT' });

    const penalty = await recordScoreEvent(pool, { teamId, roundId: 1, delta: -75, sourceEventId: 'mistake-one', reason: 'mistake penalty' });
    expect(penalty).toMatchObject({ delta: -75, score: 425, duplicate: false });
    expect((await pool.query('SELECT score FROM round_progress WHERE team_id=$1 AND round_id=1',[teamId])).rows[0].score).toBe(425);
  });

  it('serializes concurrent score events and rolls back score changes if ledger insertion fails', async () => {
    const teamId = await createTeam('Concurrent Score');
    await startRound(pool, teamId, 1);
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => recordScoreEvent(pool, {
      teamId, roundId: 1, delta: 10, sourceEventId: `parallel-${i}`, reason: 'concurrent award',
    })));
    expect(results.reduce((sum, result) => sum + result.delta, 0)).toBe(80);
    expect((await pool.query('SELECT score FROM teams WHERE id=$1',[teamId])).rows[0].score).toBe(80);

    await pool.query(`CREATE FUNCTION fail_score_insert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'score ledger failure'; END $$`);
    await pool.query('CREATE TRIGGER fail_score_insert BEFORE INSERT ON score_transactions FOR EACH ROW EXECUTE FUNCTION fail_score_insert()');
    await expect(recordScoreEvent(pool, { teamId, roundId: 1, delta: 20, sourceEventId: 'rollback-score', reason: 'forced failure' })).rejects.toThrow(/score ledger failure/);
    expect((await pool.query('SELECT score FROM teams WHERE id=$1',[teamId])).rows[0].score).toBe(80);
    expect((await pool.query('SELECT score FROM round_progress WHERE team_id=$1 AND round_id=1',[teamId])).rows[0].score).toBe(80);
    expect((await pool.query("SELECT 1 FROM score_transactions WHERE team_id=$1 AND source_event_id='rollback-score'",[teamId])).rowCount).toBe(0);
    await pool.query('DROP TRIGGER fail_score_insert ON score_transactions');
    await pool.query('DROP FUNCTION fail_score_insert()');
  });

  it('rejects unknown teams, invalid rounds, and scoring before round access', async () => {
    const teamId = await createTeam('Score Validation');
    await expect(recordScoreEvent(pool, { teamId: 'missing-team', roundId: 1, delta: 1, sourceEventId: 'missing', reason: 'test' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(recordScoreEvent(pool, { teamId, roundId: 5, delta: 1, sourceEventId: 'invalid-round', reason: 'test' }))
      .rejects.toMatchObject({ code: 'INVALID' });
    await expect(recordScoreEvent(pool, { teamId, roundId: 1, delta: 1, sourceEventId: 'locked-round', reason: 'test' }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(recordScoreEvent(pool, { teamId, roundId: 1, delta: 0, sourceEventId: 'zero', reason: 'test' }))
      .rejects.toBeInstanceOf(LedgerError);
  });

  it('applies credit additions and deductions once and rejects insufficient balances', async () => {
    const teamId = await createTeam('Credit Wallet', 0, 200);
    const addition = { teamId, roundId: 1, delta: 50, transactionType: 'award', referenceId: 'reward-1' };
    const first = await recordCreditEvent(pool, addition);
    const retry = await recordCreditEvent(pool, addition);
    expect(first).toMatchObject({ balance: 250, duplicate: false });
    expect(retry).toMatchObject({ transactionId: first.transactionId, balance: 250, duplicate: true });
    await expect(recordCreditEvent(pool, { ...addition, delta: 10 })).rejects.toMatchObject({ code: 'CONFLICT' });

    const spent = await recordCreditEvent(pool, { teamId, roundId: 2, delta: -175, transactionType: 'bid', referenceId: 'bid-1' });
    expect(spent).toMatchObject({ balance: 75, delta: -175 });
    await expect(recordCreditEvent(pool, { teamId, roundId: 2, delta: -76, transactionType: 'bid', referenceId: 'bid-2' }))
      .rejects.toMatchObject({ code: 'INSUFFICIENT_CREDITS' });
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1',[teamId])).rows[0].total_credits).toBe(75);
    expect((await pool.query('SELECT count(*)::int AS count FROM credit_transactions WHERE team_id=$1',[teamId])).rows[0].count).toBe(2);
  });

  it('serializes concurrent credit deductions and rolls back balance changes if ledger insertion fails', async () => {
    const teamId = await createTeam('Concurrent Credits', 0, 500);
    const results = await Promise.allSettled(Array.from({ length: 8 }, (_, i) => recordCreditEvent(pool, {
      teamId, roundId: 2, delta: -100, transactionType: 'bid', referenceId: `parallel-bid-${i}`,
    })));
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(5);
    expect(results.filter((result) => result.status === 'rejected' && result.reason instanceof LedgerError && result.reason.code === 'INSUFFICIENT_CREDITS')).toHaveLength(3);
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1',[teamId])).rows[0].total_credits).toBe(0);

    await pool.query(`CREATE FUNCTION fail_credit_insert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'credit ledger failure'; END $$`);
    await pool.query('CREATE TRIGGER fail_credit_insert BEFORE INSERT ON credit_transactions FOR EACH ROW EXECUTE FUNCTION fail_credit_insert()');
    await expect(recordCreditEvent(pool, { teamId, roundId: 2, delta: 10, transactionType: 'refund', referenceId: 'rollback-credit' }))
      .rejects.toThrow(/credit ledger failure/);
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1',[teamId])).rows[0].total_credits).toBe(0);
    expect((await pool.query("SELECT 1 FROM credit_transactions WHERE team_id=$1 AND reference_id='rollback-credit'",[teamId])).rowCount).toBe(0);
    await pool.query('DROP TRIGGER fail_credit_insert ON credit_transactions');
    await pool.query('DROP FUNCTION fail_credit_insert()');
  });

  it('rejects invalid credit references and reads one deterministic PostgreSQL leaderboard', async () => {
    await pool.query('UPDATE teams SET score=0');
    const beta = await createTeam('Beta Team', 10, 0);
    const alpha = await createTeam('Alpha Team', 10, 0);
    const gamma = await createTeam('Gamma Team', 5, 0);
    await expect(recordCreditEvent(pool, { teamId: 'missing-team', delta: 1, transactionType: 'award', referenceId: 'missing' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(recordCreditEvent(pool, { teamId: alpha, delta: -1, transactionType: 'spend', referenceId: 'negative' }))
      .rejects.toMatchObject({ code: 'INSUFFICIENT_CREDITS' });
    await expect(recordCreditEvent(pool, { teamId: alpha, roundId: 6, delta: 1, transactionType: 'award', referenceId: 'invalid-round' }))
      .rejects.toMatchObject({ code: 'INVALID' });
    const board = await getLeaderboard(pool);
    const positions = board.filter((row) => [alpha,beta,gamma].includes(row.team_id));
    expect(positions.map((row) => [row.team_name,row.score,row.rank])).toEqual([
      ['Alpha Team',10,1], ['Beta Team',10,2], ['Gamma Team',5,3],
    ]);
    await expect(getLeaderboard(pool, 0)).rejects.toMatchObject({ code: 'INVALID' });
  });
});
