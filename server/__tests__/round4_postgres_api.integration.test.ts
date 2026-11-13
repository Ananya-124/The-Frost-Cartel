// @vitest-environment node
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import express, { type RequestHandler } from 'express';
import type { Server } from 'node:http';
import path from 'node:path';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runMigrations } from '../../database/postgres/migration-runner.ts';
import { createRound4Router } from '../routes/round4.routes.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

const testUrl = process.env.PG_TEST_DATABASE_URL;
const suite = testUrl ? describe : describe.skip;

suite('Round 4 PostgreSQL player/admin API integration', () => {
  const schema = `frost_r4_api_${randomUUID().replaceAll('-', '')}`;
  const teamTokens = new Map<string, string>();
  const adminToken = `r4-admin-${randomUUID()}`;
  let adminPool: Pool;
  let pool: Pool;
  let server: Server;
  let baseUrl = '';
  let team1 = '';
  let team2 = '';
  let unqualifiedTeam = '';

  const teamAuth: RequestHandler = (req, res, next) => {
    void (async () => {
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      const result = await pool.query<{ id: string; team_name: string; score: number; max_credits: number; is_paused: boolean }>(`
        SELECT t.id,t.team_name,t.score,t.max_credits,t.is_paused FROM team_sessions s JOIN teams t ON t.id=s.team_id
        WHERE s.token=$1 AND s.expires_at>now()`, [token]);
      if (!result.rowCount) { res.status(401).json({ success: false, message: 'Invalid test team session.' }); return; }
      const row = result.rows[0];
      (req as AuthenticatedRequest).team = { id: row.id, teamName: row.team_name, score: row.score, maxCredits: row.max_credits, isPaused: row.is_paused };
      next();
    })().catch(next);
  };
  const adminAuth: RequestHandler = (req, res, next) => {
    void (async () => {
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      const result = await pool.query<{ id: string; username: string }>(`SELECT a.id,a.username FROM admin_sessions s
        JOIN admins a ON a.id=s.admin_id WHERE s.token=$1 AND s.expires_at>now()`, [token]);
      if (!result.rowCount) { res.status(401).json({ success: false, message: 'Invalid test admin session.' }); return; }
      (req as AuthenticatedRequest).admin = { id: result.rows[0].id, username: result.rows[0].username, role: 'admin', mustChangePassword: false };
      (req as AuthenticatedRequest).adminSessionToken = token;
      next();
    })().catch(next);
  };

  async function call(pathname: string, token: string | undefined, body?: unknown, method = body === undefined ? 'GET' : 'POST') {
    return fetch(`${baseUrl}${pathname}`, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }

  async function discover(token: string, requestId: string) {
    return call('/discover-target', token, { requestId });
  }

  async function submit(token: string, stepId: string, answer: string, requestId: string) {
    return call('/submit-clue', token, { stepId, answer, requestId });
  }

  async function advanceToFinal(teamId: string, routeNumber: number, token: string) {
    const routeId = `route-${routeNumber}`;
    const ids = Array.from({ length: 4 }, (_, index) => `r${routeNumber}_s${index + 1}`);
    await pool.query(`UPDATE round4_team_progress SET current_step_index=4,target_discovered=false,solved_steps=$2::jsonb,
      common_room_arrived=false,is_finished=false,finished_at=NULL,version=version+1 WHERE team_id=$1`, [teamId, JSON.stringify(ids)]);
    await pool.query("UPDATE round_progress SET status='IN_PROGRESS' WHERE team_id=$1 AND round_id=4", [teamId]);
    const discoverResponse = await discover(token, `final-discover-${teamId}`);
    expect(discoverResponse.status).toBe(200);
    return routeId;
  }

  beforeAll(async () => {
    if (!testUrl) return;
    const parsedUrl = new URL(testUrl);
    if (!['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname)) throw new Error('Round 4 integration tests refuse remote PostgreSQL hosts.');
    process.env.PGSSLMODE = 'disable';

    adminPool = new Pool({ connectionString: testUrl, ssl: false });
    await adminPool.query(`CREATE SCHEMA "${schema}"`);
    const scoped = new URL(testUrl);
    scoped.searchParams.set('options', `-c search_path=${schema}`);
    pool = new Pool({ connectionString: scoped.toString(), ssl: false });
    await runMigrations(pool, path.resolve('database/postgres/migrations'));

    team1 = `r4-one-${randomUUID()}`;
    team2 = `r4-two-${randomUUID()}`;
    unqualifiedTeam = `r4-out-${randomUUID()}`;
    await pool.query(`INSERT INTO admins(id,username,password_hash,salt,role,must_change_password)
      VALUES('admin-r4','admin-r4','hash','salt','admin',false)`);
    await pool.query('INSERT INTO admin_sessions(id,admin_id,token,expires_at) VALUES($1,$2,$3,now()+interval \'1 hour\')',
      ['session-admin-r4', 'admin-r4', adminToken]);
    const teamIds = [team1, team2, unqualifiedTeam];
    for (const [index, id] of teamIds.entries()) {
      const name = `Round Four Team ${index + 1}`;
      const token = `r4-team-${randomUUID()}`;
      teamTokens.set(id, token);
      await pool.query('INSERT INTO teams(id,team_name,password_hash,salt) VALUES($1,$2,$3,$4)', [id, name, 'hash', 'salt']);
      await pool.query(`INSERT INTO team_sessions(id,team_id,token,player_number,expires_at)
        VALUES($1,$2,$3,1,now()+interval '1 hour')`, [`session-${id}`, id, token]);
      await pool.query("UPDATE round_progress SET status='AVAILABLE',eligible_at=now() WHERE team_id=$1 AND round_id=4", [id]);
    }

    const app = express();
    app.use(express.json());
    app.use('/api/round4', createRound4Router(pool, { team: teamAuth, admin: adminAuth }));
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}/api/round4`;
        resolve();
      });
    });
  }, 60_000);

  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    await pool?.end();
    if (schema) await adminPool?.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await adminPool?.end();
  });

  it('blocks gameplay while unreleased but lets teams read release status', async () => {
    const status = await call('/status', teamTokens.get(team1));
    expect(status.status).toBe(200);
    expect((await status.json()).isReleased).toBe(false);
    expect((await call('/my-route', teamTokens.get(team1))).status).toBe(423);
    expect((await discover(teamTokens.get(team1)!, 'sealed-discovery')).status).toBe(423);
    expect((await submit(teamTokens.get(team1)!, 'r1_s1', 'RIVET7', 'sealed-answer')).status).toBe(423);
  });

  it('requires an authenticated admin for assignment/release and ignores submitted team identity', async () => {
    expect((await call('/admin/qualify-teams', undefined, { assignments: [] })).status).toBe(401);
    const qualification = await call('/admin/qualify-teams', adminToken, { assignments: [
      { teamId: team1, routeId: 'route-1' }, { teamId: team2, routeId: 'route-2' },
    ] });
    expect(qualification.status).toBe(200);
    expect((await call('/my-route?teamId=' + team2, teamTokens.get(team1))).status).toBe(423);
    const release = await call('/admin/release', adminToken, { isReleased: true });
    expect(release.status).toBe(200);
    expect((await call('/admin/release', undefined, { isReleased: false })).status).toBe(401);
  });

  it('isolates assigned routes and rejects unqualified teams', async () => {
    const one = await call('/my-route?teamId=' + team2, teamTokens.get(team1));
    const two = await call('/my-route', teamTokens.get(team2));
    expect(one.status).toBe(200);
    expect((await one.json()).route.routeId).toBe('route-1');
    expect((await two.json()).route.routeId).toBe('route-2');
    expect((await call('/my-route', teamTokens.get(unqualifiedTeam))).status).toBe(403);
  });

  it('requires discovery, validates answers and replays stable IDs without duplicate progress', async () => {
    const token = teamTokens.get(team1)!;
    expect((await submit(token, 'r1_s1', 'RIVET7', 'answer-before-discovery')).status).toBe(409);
    expect((await discover(token, 'discover-1')).status).toBe(200);
    expect((await submit(token, 'r1_s1', 'incorrect', 'wrong-1')).status).toBe(400);
    const first = await submit(token, 'r1_s1', 'RIVET7', 'correct-1');
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    expect(firstBody).toMatchObject({ success: true, correct: true, nextStepIndex: 1 });
    const retry = await submit(token, 'r1_s1', 'RIVET7', 'correct-1');
    expect(retry.status).toBe(200);
    expect(await retry.json()).toEqual(firstBody);
    expect((await pool.query('SELECT current_step_index,solved_steps FROM round4_team_progress WHERE team_id=$1', [team1])).rows[0])
      .toMatchObject({ current_step_index: 1, solved_steps: ['r1_s1'] });
  });

  it('serializes simultaneous correct clue submissions so only one advances the clue', async () => {
    const token = teamTokens.get(team1)!;
    await discover(token, 'discover-2');
    const responses = await Promise.all([
      submit(token, 'r1_s2', 'MERIDIAN', 'concurrent-a'),
      submit(token, 'r1_s2', 'MERIDIAN', 'concurrent-b'),
    ]);
    const bodies = await Promise.all(responses.map((response) => response.json()));
    expect(bodies.filter((body) => body.success === true)).toHaveLength(1);
    expect(bodies.filter((body) => body.success === false)).toHaveLength(1);
    expect((await pool.query('SELECT current_step_index FROM round4_team_progress WHERE team_id=$1', [team1])).rows[0].current_step_index)
      .toBe(2);
  });

  it('commits winner, completion and progression atomically; rolls back on progression failure and closes concurrent races', async () => {
    const firstToken = teamTokens.get(team1)!;
    const secondToken = teamTokens.get(team2)!;
    await advanceToFinal(team1, 1, firstToken);
    await advanceToFinal(team2, 2, secondToken);

    await pool.query("UPDATE round_progress SET status='LOCKED' WHERE team_id=$1 AND round_id=4", [team1]);
    const failed = await submit(firstToken, 'r1_s5', 'BSN', 'final-rollback');
    expect(failed.status).toBe(409);
    expect((await pool.query('SELECT count(*)::int AS count FROM round4_winner')).rows[0].count).toBe(0);
    expect((await pool.query('SELECT current_step_index,is_finished FROM round4_team_progress WHERE team_id=$1', [team1])).rows[0])
      .toMatchObject({ current_step_index: 4, is_finished: false });
    await pool.query("UPDATE round_progress SET status='IN_PROGRESS' WHERE team_id=$1 AND round_id=4", [team1]);

    const [winnerResponse, contenderResponse] = await Promise.all([
      submit(firstToken, 'r1_s5', 'BSN', 'final-winner-a'),
      submit(secondToken, 'r2_s5', 'SEVEN', 'final-winner-b'),
    ]);
    const [winnerBody, contenderBody] = await Promise.all([winnerResponse.json(), contenderResponse.json()]);
    const declaredWinners = [winnerBody, contenderBody].filter((body) => body.isWinner === true);
    expect(declaredWinners).toHaveLength(1);
    expect(declaredWinners[0].winner).toMatchObject({
      teamId: declaredWinners[0].teamId,
      teamName: declaredWinners[0].teamName,
      routeId: declaredWinners[0].routeId,
      solvedAt: declaredWinners[0].solvedAt,
    });
    expect([winnerBody, contenderBody].filter((body) => body.raceClosed === true)).toHaveLength(1);
    expect((await pool.query('SELECT count(*)::int AS count FROM round4_winner')).rows[0].count).toBe(1);
    const completed = await pool.query(`SELECT rp.team_id FROM round_progress rp JOIN round4_team_progress r4 USING(team_id)
      WHERE rp.round_id=4 AND rp.status='COMPLETED' AND r4.is_finished=true`);
    expect(completed.rows).toHaveLength(1);
  });

  it('builds the admin overview from PostgreSQL catalog, teams and progress', async () => {
    const response = await call('/admin/overview', adminToken);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.settings.is_released).toBe(1);
    expect(body.routes).toHaveLength(7);
    expect(body.steps).toHaveLength(35);
    expect(body.qualifiedTeams).toHaveLength(2);
    expect(body.winner.team_id).toBeTruthy();
    expect(body.availableTeams.some((team: { id: string }) => team.id === team1)).toBe(true);
  });

  it('persists admin clue and final-room edits in PostgreSQL and rejects unauthenticated changes', async () => {
    expect((await call('/admin/configure-step', undefined, { stepId: 'r1_s1', targetX: 511 })).status).toBe(401);
    const clueEdit = await call('/admin/configure-step', adminToken, {
      stepId: 'r1_s1', targetX: 511, acceptedAnswers: ['EDITED-ANSWER'],
    });
    expect(clueEdit.status).toBe(200);
    expect((await pool.query('SELECT target_x,accepted_answers FROM round4_steps WHERE id=$1', ['r1_s1'])).rows[0])
      .toMatchObject({ target_x: 511, accepted_answers: ['EDITED-ANSWER'] });
    expect((await call('/admin/configure-step', adminToken, { stepId: 'missing-step', targetX: 10 })).status).toBe(404);
    const roomEdit = await call('/admin/configure-final-room', adminToken, { roomName: 'Verified Final Room', targetX: 290 });
    expect(roomEdit.status).toBe(200);
    expect((await pool.query('SELECT common_final_room_name,common_final_x FROM round4_settings WHERE id=1')).rows[0])
      .toMatchObject({ common_final_room_name: 'Verified Final Room', common_final_x: 290 });
  });
});
