// @vitest-environment node
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import express, { type RequestHandler } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import path from 'node:path';
import { runMigrations } from '../../database/postgres/migration-runner.ts';
import { runRound2AuctionTimerTick, createRound2Router } from '../routes/round2.routes.ts';

const url = process.env.PG_TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;
let owner: Pool;
let pool: Pool;
let schema = '';
let server: Server;
let base = '';
let alphaId = '';
let betaId = '';
let adminId = '';

suite('Round 2 PostgreSQL auction API', () => {
  beforeAll(async () => {
    const parsed = new URL(url!);
    if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) throw new Error('Remote PostgreSQL is refused.');
    owner = new Pool({ connectionString: url });
    schema = `r2_api_${randomUUID().replaceAll('-', '')}`;
    await owner.query(`CREATE SCHEMA "${schema}"`);
    pool = new Pool({ connectionString: url, options: `-c search_path=${schema}` });
    await runMigrations(pool, path.resolve('database/postgres/migrations'));
    alphaId = `r2-alpha-${randomUUID()}`;
    betaId = `r2-beta-${randomUUID()}`;
    adminId = `r2-admin-${randomUUID()}`;
    await pool.query('INSERT INTO admins(id,username,password_hash,salt) VALUES($1,$2,$3,$4)', [adminId, `auction-admin-${randomUUID()}`, 'hash', 'salt']);
    await pool.query('INSERT INTO teams(id,team_name,password_hash,salt,total_credits) VALUES($1,$2,$3,$4,$5),($6,$7,$8,$9,$10)',
      [alphaId, 'Alpha Canonical', 'hash', 'salt', 347, betaId, 'Beta Canonical', 'hash', 'salt', 91]);
    await pool.query('UPDATE teams SET score=222 WHERE id=$1', [alphaId]);
    await pool.query('UPDATE teams SET score=476 WHERE id=$1', [betaId]);
    await pool.query("UPDATE round_progress SET status='IN_PROGRESS' WHERE team_id IN ($1,$2) AND round_id=2", [alphaId, betaId]);
    await pool.query("INSERT INTO round2_auction_lots(id,sequence_number,power_card_id,status,starting_bid,active_at,ends_at) VALUES('expired-lot',1,'r2-card-1','ACTIVE',100,now()-interval '1 minute',now()-interval '1 second')");

    const authenticateTestTeam: RequestHandler = (req, _res, next) => {
      const isBeta = req.header('x-test-team') === 'beta';
      (req as typeof req & { team?: { id: string; teamName: string } }).team = isBeta
        ? { id: betaId, teamName: 'Beta Canonical' }
        : { id: alphaId, teamName: 'Alpha Canonical' };
      next();
    };
    const authenticateTestAdmin: RequestHandler = (req, res, next) => {
      if (req.header('x-test-admin') !== 'authenticated') { res.status(401).json({ success: false, message: 'Admin session required.' }); return; }
      (req as typeof req & { admin?: { id: string; username: string } }).admin = { id: adminId, username: 'Auction Admin' };
      next();
    };
    const app = express();
    app.use(express.json());
    app.use(authenticateTestTeam);
    app.use('/api/round2', createRound2Router({ pool, authenticateAdmin: authenticateTestAdmin }));
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') base = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  }, 30000);

  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    await pool?.end();
    if (schema) await owner?.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await owner?.end();
  });

  const call = async (route: string, method = 'GET', body?: unknown, team = 'alpha', extraHeaders: Record<string, string> = {}) => {
    const response = await fetch(`${base}/api/round2${route}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-test-team': team, ...extraHeaders },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, json: await response.json() as Record<string, any> };
  };

  it('blocks team access while disabled and still requires an admin session for auction activation', async () => {
    const results = await Promise.all([
      call('/state?team=Beta'),
      call('/join', 'POST', { teamId: betaId, teamName: 'Beta', credits: 999999 }),
      call('/bid', 'POST', { amount: 100, requestId: 'disabled-request-1' }),
    ]);
    expect(results.map((result) => result.status)).toEqual([503, 503, 503]);
    expect((await call('/admin/overview')).status).toBe(401);
    expect((await call('/admin/start', 'POST', { cardId: 2 })).status).toBe(401);
    expect((await call('/admin/end', 'POST', {})).status).toBe(401);
    await runRound2AuctionTimerTick(pool);
    expect((await pool.query('SELECT status FROM round2_auction_lots WHERE id=$1', ['expired-lot'])).rows[0].status).toBe('ACTIVE');
    expect((await pool.query('SELECT count(*)::int AS n FROM round2_settlements')).rows[0].n).toBe(0);
    expect((await pool.query('SELECT enabled FROM round2_auction_config WHERE id=1')).rows[0].enabled).toBe(false);
  });

  it('requires an authenticated admin to explicitly start Round 2, then uses only authenticated team wallet data', async () => {
    await pool.query("UPDATE round2_auction_lots SET status='CANCELLED' WHERE id='expired-lot'");
    const started = await call('/admin/start', 'POST', { cardId: 11, basePrice: 50, durationSeconds: 60 }, 'alpha', { 'x-test-admin': 'authenticated' });
    expect(started.status).toBe(200);
    expect((await pool.query('SELECT enabled FROM round2_auction_config WHERE id=1')).rows[0].enabled).toBe(true);
    const joined = await call('/join', 'POST', { teamId: betaId, teamName: 'Beta Canonical', credits: 1 }, 'alpha');
    expect(joined.status).toBe(200);
    expect(joined.json.me).toMatchObject({ name: 'Alpha Canonical', credits: 347, startCredits: 347 });
    expect(joined.json.cards).toHaveLength(11);
    const state = await call('/state?team=Beta Canonical', 'GET', undefined, 'alpha');
    expect(state.json.me).toMatchObject({ name: 'Alpha Canonical', credits: 347 });
    const bid = await call('/bid', 'POST', { teamId: betaId, teamName: 'Beta Canonical', amount: 100, requestId: 'forged-identity-bid' }, 'alpha');
    expect(bid.status).toBe(200);
    expect((await pool.query('SELECT team_id,amount FROM round2_bids WHERE request_id=$1', ['forged-identity-bid'])).rows[0]).toMatchObject({ team_id: alphaId, amount: 100 });
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1', [alphaId])).rows[0].total_credits).toBe(347);
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1', [betaId])).rows[0].total_credits).toBe(91);
    await pool.query("UPDATE round2_auction_lots SET status='CANCELLED' WHERE status='ACTIVE'");
  });

  it('does not accept the former development admin key instead of a PostgreSQL admin session', async () => {
    const admin = await call('/admin/overview', 'GET', undefined, 'alpha', { 'x-round2-key': 'frost-r2-admin' });
    expect(admin.status).toBe(401);
    expect(admin.json.message).toMatch(/admin session/i);
  });

  it('records authenticated start and end actions and audited history-preserving rejections', async () => {
    await pool.query("UPDATE round2_auction_lots SET status='CANCELLED' WHERE id='expired-lot'");
    const noSession = await call('/admin/start', 'POST', { cardId: 2, basePrice: 50 }, 'alpha', { 'x-round2-key': 'legacy-secret' });
    expect(noSession.status).toBe(401);
    const started = await call('/admin/start', 'POST', { cardId: 2, basePrice: 50, durationSeconds: 60 }, 'alpha', { 'x-test-admin': 'authenticated' });
    expect(started.status).toBe(200);
    const ended = await call('/admin/end', 'POST', {}, 'alpha', { 'x-test-admin': 'authenticated' });
    expect(ended.status).toBe(200);
    const reset = await call('/admin/reset', 'POST', {}, 'alpha', { 'x-test-admin': 'authenticated' });
    expect(reset.status).toBe(409);
    const remove = await call('/admin/team/Alpha%20Canonical', 'DELETE', undefined, 'alpha', { 'x-test-admin': 'authenticated' });
    expect(remove.status).toBe(409);
    const audit = await pool.query<{ admin_id: string; action: string; outcome: string }>(
      'SELECT admin_id,action,outcome FROM round2_auction_admin_audit ORDER BY created_at,id');
    expect(audit.rows.map((row) => [row.admin_id, row.action, row.outcome])).toEqual([
      [adminId, 'START', 'APPLIED'], [adminId, 'START', 'APPLIED'], [adminId, 'END', 'APPLIED'],
      [adminId, 'RESET', 'REJECTED'], [adminId, 'REMOVE_TEAM', 'REJECTED'],
    ]);
    const overview = await call('/admin/overview', 'GET', undefined, 'alpha', { 'x-test-admin': 'authenticated' });
    expect(overview.status).toBe(200);
    expect(overview.json.audit).toEqual(expect.arrayContaining([
      expect.objectContaining({ admin_id: adminId, admin_username: expect.stringMatching(/^auction-admin-/), action: 'RESET', outcome: 'REJECTED' }),
      expect.objectContaining({ admin_id: adminId, action: 'START', outcome: 'APPLIED' }),
    ]));
  });
});
