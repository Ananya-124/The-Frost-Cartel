// @vitest-environment node
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migration-runner.ts';
import { placeAuctionBid, settleActiveAuction, settleAuctionLot, settleExpiredAuction, startAuctionLot } from './auction.ts';
import { performRound1Action } from '../../server/services/round1Gameplay.ts';

const url = process.env.PG_TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;
let owner: Pool;
let pool: Pool;
let schema = '';
let teamA = '';
let teamB = '';
let adminId = '';
let seq = 0;

async function createTeam(name: string, credits: number): Promise<string> {
  const id = `auction-team-${++seq}-${randomUUID()}`;
  await pool.query('INSERT INTO teams(id,team_name,password_hash,salt,total_credits) VALUES($1,$2,$3,$4,$5)', [id, name, 'hash', 'salt', credits]);
  await pool.query("UPDATE round_progress SET status='IN_PROGRESS' WHERE team_id=$1 AND round_id=2", [id]);
  return id;
}

async function enableAuction(): Promise<void> { await pool.query('UPDATE round2_auction_config SET enabled=true WHERE id=1'); }
async function disableAuction(): Promise<void> { await pool.query('UPDATE round2_auction_config SET enabled=false WHERE id=1'); }

suite('PostgreSQL Round 2 auction engine', () => {
  beforeAll(async () => {
    const parsed = new URL(url!);
    if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) throw new Error('Remote PostgreSQL is refused.');
    owner = new Pool({ connectionString: url });
    schema = `r2_engine_${randomUUID().replaceAll('-', '')}`;
    await owner.query(`CREATE SCHEMA "${schema}"`);
    pool = new Pool({ connectionString: url, options: `-c search_path=${schema}` });
    await runMigrations(pool, path.resolve('database/postgres/migrations'));
    adminId = `auction-admin-${randomUUID()}`;
    await pool.query('INSERT INTO admins(id,username,password_hash,salt) VALUES($1,$2,$3,$4)', [adminId, `auction-admin-${randomUUID()}`, 'hash', 'salt']);
    teamA = await createTeam('Auction Alpha', 350);
    teamB = await createTeam('Auction Beta', 125);
  }, 30000);

  afterAll(async () => {
    await pool?.end();
    if (schema) await owner?.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await owner?.end();
  });

  it('enforces the disabled config at the service boundary', async () => {
    expect((await pool.query('SELECT enabled FROM round2_auction_config WHERE id=1')).rows[0].enabled).toBe(false);
    await expect(placeAuctionBid(pool, { teamId: teamA, amount: 100, requestId: 'disabled-bid-1' })).rejects.toMatchObject({ code: 'DISABLED' });
    await expect(settleActiveAuction(pool, adminId)).rejects.toMatchObject({ code: 'DISABLED' });
    expect(await settleExpiredAuction(pool)).toBeNull();
    const eligibleTeam = `auction-eligible-${randomUUID()}`;
    await pool.query('INSERT INTO teams(id,team_name,password_hash,salt) VALUES($1,$2,$3,$4)', [eligibleTeam, eligibleTeam, 'hash', 'salt']);
    await pool.query("UPDATE round_progress SET eligible_at=now() WHERE team_id=$1 AND round_id=2", [eligibleTeam]);
    const started = await startAuctionLot(pool, { cardId: 11 }, adminId);
    expect(started.success).toBe(true);
    expect((await pool.query('SELECT enabled FROM round2_auction_config WHERE id=1')).rows[0].enabled).toBe(true);
    expect((await pool.query('SELECT status FROM round_progress WHERE team_id=$1 AND round_id=2', [eligibleTeam])).rows[0].status).toBe('AVAILABLE');
    expect((await pool.query("SELECT action_performed FROM progression_audit_history WHERE team_id=$1 AND entity_type='ROUND' AND entity_id=2", [eligibleTeam])).rows[0].action_performed).toBe('ADVANCE');
    await pool.query("UPDATE round2_auction_lots SET status='CANCELLED' WHERE id=$1", [started.lot.id]);
    await disableAuction();
    expect((await pool.query('SELECT enabled FROM round2_auction_config WHERE id=1')).rows[0].enabled).toBe(false);
  });

  it('validates minimum bids, wallet availability and Round 2 eligibility', async () => {
    await enableAuction();
    const lot = await startAuctionLot(pool, { cardId: 1, basePrice: 100, durationSeconds: 90 }, adminId);
    await expect(placeAuctionBid(pool, { teamId: teamA, amount: 99, requestId: 'minimum-bid-0001' })).rejects.toMatchObject({ code: 'INVALID' });
    await expect(placeAuctionBid(pool, { teamId: teamB, amount: 126, requestId: 'insufficient-0001' })).rejects.toMatchObject({ code: 'INSUFFICIENT_CREDITS' });
    await expect(placeAuctionBid(pool, { teamId: 'missing-team', amount: 100, requestId: 'missing-team-01' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await pool.query("UPDATE round_progress SET status='LOCKED' WHERE team_id=$1 AND round_id=2", [teamA]);
    await expect(placeAuctionBid(pool, { teamId: teamA, amount: 100, requestId: 'locked-team-0001' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await pool.query("UPDATE round_progress SET status='IN_PROGRESS' WHERE team_id=$1 AND round_id=2", [teamA]);
    expect(lot.lot.id).toMatch(/^lot-/);
  });

  it('accepts retry-safe bids and rejects request ID reuse with a different payload', async () => {
    const first = await placeAuctionBid(pool, { teamId: teamA, amount: 100, requestId: 'alpha-first-bid' });
    const retry = await placeAuctionBid(pool, { teamId: teamA, amount: 100, requestId: 'alpha-first-bid' });
    expect(first.duplicate).toBe(false);
    expect(retry).toMatchObject({ duplicate: true, bidId: first.bidId, lotId: first.lotId });
    await expect(placeAuctionBid(pool, { teamId: teamA, amount: 110, requestId: 'alpha-first-bid' })).rejects.toMatchObject({ code: 'CONFLICT' });
    expect((await pool.query('SELECT count(*)::int AS n FROM round2_bids WHERE team_id=$1 AND request_id=$2', [teamA, 'alpha-first-bid'])).rows[0].n).toBe(1);
  });

  it('settles atomically once, deducts the wallet, records ownership and preserves team isolation', async () => {
    const lot = (await pool.query<{ id: string }>("SELECT id FROM round2_auction_lots WHERE status='ACTIVE' ORDER BY sequence_number DESC LIMIT 1")).rows[0];
    const expected = await pool.query<{ amount: number }>('SELECT amount FROM round2_bids WHERE lot_id=$1 ORDER BY amount DESC,placed_at ASC,id ASC LIMIT 1', [lot.id]);
    const amount = expected.rows[0].amount;
    const settled = await settleAuctionLot(pool, lot.id);
    expect(settled).toMatchObject({ success: true, duplicate: false, sold: true, teamId: teamA, amount: 100 });
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1', [teamA])).rows[0].total_credits).toBe(250);
    expect((await pool.query('SELECT status FROM round2_auction_lots WHERE id=$1', [lot.id])).rows[0].status).toBe('SETTLED');
    expect((await pool.query('SELECT count(*)::int AS n FROM team_power_cards WHERE team_id=$1 AND auction_lot_id=$2', [teamA, lot.id])).rows[0].n).toBe(1);
    expect((await pool.query('SELECT count(*)::int AS n FROM round2_settlements WHERE lot_id=$1', [lot.id])).rows[0].n).toBe(1);
    const duplicate = await settleAuctionLot(pool, lot.id);
    expect(duplicate).toMatchObject({ duplicate: true, sold: true, amount });
    expect(await placeAuctionBid(pool, { teamId: teamA, amount: 100, requestId: 'alpha-first-bid' })).toMatchObject({ duplicate: true, lotId: lot.id });
    expect((await pool.query("SELECT count(*)::int AS n FROM credit_transactions WHERE team_id=$1 AND transaction_type='round2_auction_settlement' AND reference_id=$2", [teamA, lot.id])).rows[0].n).toBe(1);
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1', [teamB])).rows[0].total_credits).toBe(125);
  });

  it('serializes concurrent bids, retries identical requests once, and extends the timer near expiry', async () => {
    const lot = await startAuctionLot(pool, { cardId: 2, basePrice: 100, durationSeconds: 5 }, adminId);
    const simultaneous = await Promise.allSettled([
      placeAuctionBid(pool, { teamId: teamA, amount: 100, requestId: 'alpha-concurrent-bid' }),
      placeAuctionBid(pool, { teamId: teamB, amount: 100, requestId: 'beta-concurrent-bid' }),
    ]);
    expect(simultaneous.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(simultaneous.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const firstBid = (await pool.query<{ team_id: string; amount: number }>('SELECT team_id,amount FROM round2_bids WHERE lot_id=$1', [lot.lot.id])).rows[0];
    const otherTeam = firstBid.team_id === teamA ? teamB : teamA;
    const retryId = 'concurrent-identical-request';
    const [first, retry] = await Promise.all([
      placeAuctionBid(pool, { teamId: otherTeam, amount: 110, requestId: retryId }),
      placeAuctionBid(pool, { teamId: otherTeam, amount: 110, requestId: retryId }),
    ]);
    expect([first.duplicate, retry.duplicate].sort()).toEqual([false, true]);
    const bids = await pool.query<{ amount: number; team_id: string }>('SELECT amount,team_id FROM round2_bids WHERE lot_id=$1 ORDER BY amount DESC,placed_at ASC,id ASC', [lot.lot.id]);
    expect(bids.rows.map((row) => row.amount)).toEqual([110, 100]);
    expect(bids.rows[0].team_id).toBe(otherTeam);
    expect((await pool.query('SELECT count(*)::int AS n FROM round2_bids WHERE team_id=$1 AND request_id=$2', [otherTeam, retryId])).rows[0].n).toBe(1);
    const extended = await pool.query<{ ends_at: Date }>('SELECT ends_at FROM round2_auction_lots WHERE id=$1', [lot.lot.id]);
    expect(extended.rows[0].ends_at.getTime()).toBeGreaterThan(Date.now() + 8000);
    const results = await Promise.all([settleAuctionLot(pool, lot.lot.id), settleAuctionLot(pool, lot.lot.id)]);
    expect(results.filter((result) => result.duplicate).length).toBe(1);
    expect((await pool.query('SELECT count(*)::int AS n FROM round2_settlements WHERE lot_id=$1', [lot.lot.id])).rows[0].n).toBe(1);
  });

  it('rolls back wallet, ownership, settlement and lot status when settlement insertion fails', async () => {
    const next = await startAuctionLot(pool, { cardId: 3, basePrice: 50, durationSeconds: 0 }, adminId);
    await placeAuctionBid(pool, { teamId: teamA, amount: 50, requestId: 'rollback-winner-bid' });
    const walletBefore = (await pool.query('SELECT total_credits FROM teams WHERE id=$1', [teamA])).rows[0].total_credits;
    await pool.query(`CREATE FUNCTION reject_auction_settlement() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced settlement failure'; END $$`);
    await pool.query('CREATE TRIGGER reject_auction_settlement BEFORE INSERT ON round2_settlements FOR EACH ROW EXECUTE FUNCTION reject_auction_settlement()');
    await expect(settleActiveAuction(pool, adminId)).rejects.toThrow('forced settlement failure');
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1', [teamA])).rows[0].total_credits).toBe(walletBefore);
    expect((await pool.query('SELECT status FROM round2_auction_lots WHERE id=$1', [next.lot.id])).rows[0].status).toBe('ACTIVE');
    expect((await pool.query('SELECT count(*)::int AS n FROM team_power_cards WHERE auction_lot_id=$1', [next.lot.id])).rows[0].n).toBe(0);
    expect((await pool.query('SELECT count(*)::int AS n FROM round2_settlements WHERE lot_id=$1', [next.lot.id])).rows[0].n).toBe(0);
    expect((await pool.query("SELECT count(*)::int AS n FROM credit_transactions WHERE reference_id=$1 AND transaction_type='round2_auction_settlement'", [next.lot.id])).rows[0].n).toBe(0);
    await pool.query('DROP TRIGGER reject_auction_settlement ON round2_settlements');
    await pool.query('DROP FUNCTION reject_auction_settlement()');
    await settleActiveAuction(pool, adminId);
  });

  it('cancels an empty lot and makes concurrent settlement retries idempotent', async () => {
    const empty = await startAuctionLot(pool, { cardId: 4, durationSeconds: 0 }, adminId);
    const emptyResult = await settleActiveAuction(pool, adminId);
    expect(emptyResult).toMatchObject({ sold: false, lotId: empty.lot.id });
    expect((await pool.query('SELECT status FROM round2_auction_lots WHERE id=$1', [empty.lot.id])).rows[0].status).toBe('CANCELLED');
    const winnerLot = await startAuctionLot(pool, { cardId: 5, basePrice: 50, durationSeconds: 0 }, adminId);
    await placeAuctionBid(pool, { teamId: teamA, amount: 50, requestId: 'settlement-retry-bid' });
    const results = await Promise.all([settleAuctionLot(pool, winnerLot.lot.id), settleAuctionLot(pool, winnerLot.lot.id)]);
    expect(results.filter((result) => result.duplicate).length).toBe(1);
    expect((await pool.query('SELECT count(*)::int AS n FROM round2_settlements WHERE lot_id=$1', [winnerLot.lot.id])).rows[0].n).toBe(1);
  });

  it('settles expired lots from the PostgreSQL background timer path', async () => {
    const timerTeam = await createTeam('Auction Timer Team', 400);
    const timed = await startAuctionLot(pool, { cardId: 6, basePrice: 50, durationSeconds: 60 }, adminId);
    await placeAuctionBid(pool, { teamId: timerTeam, amount: 50, requestId: 'timer-lot-winning-bid' });
    await pool.query("UPDATE round2_auction_lots SET active_at=now()-interval '2 minutes',ends_at=now()-interval '1 second' WHERE id=$1", [timed.lot.id]);
    const result = await settleExpiredAuction(pool);
    expect(result).toMatchObject({ sold: true, lotId: timed.lot.id, teamId: timerTeam, amount: 50 });
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1', [timerTeam])).rows[0].total_credits).toBe(350);
  });

  it('makes Round 1 rewards immediately spendable by the same team in Round 2', async () => {
    await pool.query("UPDATE round2_auction_lots SET status='CANCELLED' WHERE status='ACTIVE'");
    const rewardedTeam = await createTeam('Round One Wallet Handoff', 500);
    await pool.query("UPDATE round_progress SET status='IN_PROGRESS' WHERE team_id=$1 AND round_id=1", [rewardedTeam]);
    await pool.query("UPDATE rounds SET is_active=true,start_time=now(),duration_seconds=1320 WHERE round_id=1");
    const action = (type: string, fields: Record<string, unknown> = {}) => ({ actionId: randomUUID(), type, ...fields });
    await performRound1Action(pool, rewardedTeam, action('begin'));
    for (const trialIndex of [0, 1]) {
      const target = await performRound1Action(pool, rewardedTeam, action('stage1.begin', { trialIndex })) as { skullId: number };
      await performRound1Action(pool, rewardedTeam, action('stage1.guess', { trialIndex, guessId: target.skullId }));
    }
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1', [rewardedTeam])).rows[0].total_credits).toBe(600);
    await pool.query("UPDATE round_progress SET status='IN_PROGRESS' WHERE team_id=$1 AND round_id=2", [rewardedTeam]);
    const lot = await startAuctionLot(pool, { cardId: 7, basePrice: 600, durationSeconds: 60 }, adminId);
    await placeAuctionBid(pool, { teamId: rewardedTeam, amount: 600, requestId: 'round1-wallet-handoff-bid' });
    await expect(settleAuctionLot(pool, lot.lot.id)).resolves.toMatchObject({ success: true, sold: true, teamId: rewardedTeam, amount: 600 });
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1', [rewardedTeam])).rows[0].total_credits).toBe(0);
    expect((await pool.query("SELECT delta FROM credit_transactions WHERE team_id=$1 ORDER BY created_at,id", [rewardedTeam])).rows.map((row) => row.delta)).toEqual([40, 60, -600]);
    expect((await pool.query('SELECT count(*)::int AS n FROM team_power_cards WHERE team_id=$1 AND auction_lot_id=$2', [rewardedTeam, lot.lot.id])).rows[0].n).toBe(1);
  });

  it('keeps Round 2 disabled after tests without changing migration defaults', async () => {
    await disableAuction();
    expect((await pool.query('SELECT enabled FROM round2_auction_config WHERE id=1')).rows[0].enabled).toBe(false);
  });
});
