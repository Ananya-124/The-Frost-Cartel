import { Router, type Response, type NextFunction } from 'express';
import type { Pool } from 'pg';
import type { PoolClient } from 'pg';
import { postgresPool } from '../../database/postgres/pool.ts';
import { db } from '../../database/db.ts';
import { getRound3Run, getRound3Session } from '../../database/postgres/round3-repository.ts';
import {
  adminAdvanceTeamToRound, adminProgress, adminProgressRound2Global, adminProgressRound3Global, adminProgressRound4Global,
  adminResetAllTeamsProgress,
  assertHuntAccessible, completeHunt, completeRound, completeRoundInTransaction, getTeamProgression,
  getTeamProgressionAudit, ProgressionError, startHunt, startRound,
} from '../../database/postgres/progression.ts';
import { requireAdminAuth, requireTeamAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { withPostgresTransaction } from '../../database/postgres/transaction.ts';

const teamRouter = Router();
const adminRouter = Router();
const configuredPool = (pool: Pool | null = postgresPool): Pool => {
  if (!pool) throw new ProgressionError('PostgreSQL progression is unavailable.', 'UNAVAILABLE');
  return pool;
};

function getSqliteTeamProgression(teamId: string) {
  let stages: Array<{ stage_id: number; status: string }> = [];
  try {
    stages = db.prepare('SELECT stage_id, status FROM stages_progress WHERE team_id=?').all(teamId) as Array<{ stage_id: number; status: string }>;
  } catch {
    stages = [];
  }
  const r1Done = stages.length === 3 && stages.every((s) => s.status === 'COMPLETED');
  const r1Started = stages.some((s) => s.status === 'COMPLETED' || s.status === 'IN_PROGRESS');
  const r1Status = r1Done ? 'COMPLETED' : r1Started ? 'IN_PROGRESS' : 'AVAILABLE';
  const now = new Date().toISOString();

  return {
    rounds: [
      { round_id: 1, status: r1Status, eligible_at: null, completed_at: r1Done ? now : null },
      { round_id: 2, status: r1Done ? 'AVAILABLE' : 'LOCKED', eligible_at: null, completed_at: null },
      { round_id: 3, status: 'LOCKED', eligible_at: null, completed_at: null },
      { round_id: 4, status: 'LOCKED', eligible_at: null, completed_at: null },
    ],
    hunts: [
      { hunt_id: 1, status: 'LOCKED', completed_at: null },
      { hunt_id: 2, status: 'LOCKED', completed_at: null },
      { hunt_id: 3, status: 'LOCKED', completed_at: null },
    ],
  };
}

function failure(res: Response, error: unknown): void {
  if (error instanceof ProgressionError) {
    const status = error.code === 'FORBIDDEN' ? 403 : error.code === 'NOT_FOUND' ? 404 : error.code === 'LOCKED' ? 423 : error.code === 'UNAVAILABLE' ? 503 : 409;
    res.status(status).json({ success: false, message: error.message, code: error.code });
    return;
  }
  console.error('[Progression API]', error);
  res.status(503).json({ success: false, message: 'Progression service is temporarily unavailable.' });
}

const asyncHandler = (handler: (req: AuthenticatedRequest, res: Response) => Promise<unknown>) =>
  (req: AuthenticatedRequest, res: Response) => {
    void handler(req, res).catch((error: unknown) => failure(res, error));
  };

function authenticatedTeam(req: AuthenticatedRequest): string {
  if (!req.team) throw new ProgressionError('Squad authentication required.', 'FORBIDDEN');
  // requireTeamAuth joined the live session to the team record for this same
  // request; repeating that identity lookup adds latency without improving auth.
  return req.team.id;
}

function numberParam(value: string | string[], label: string, minimum: number, maximum: number): number {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new ProgressionError(`Invalid ${label}.`, 'NOT_FOUND');
  }
  return parsed;
}

async function gameHuntComplete(teamId: string, huntId: number, pool: Pool): Promise<boolean> {
  const result = await pool.query<{ state: { completed?: unknown } }>(
    'SELECT state FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=$2', [teamId, huntId],
  );
  return result.rows[0]?.state?.completed === true;
}

async function reconcileRound3Hunts(pool: Pool, teamId: string): Promise<void> {
  const round = await pool.query<{ status: string }>('SELECT status FROM round_progress WHERE team_id=$1 AND round_id=3', [teamId]);
  if (round.rows[0]?.status !== 'IN_PROGRESS') return;
  const run = await getRound3Run(pool, teamId);
  const completedSession = run?.status === 'completed' && (await getRound3Session(pool, teamId))?.is_completed === true;
  if (!completedSession && (run?.status !== 'running' || run.remaining_ms <= 0)) return;
  for (const huntId of [1, 2, 3]) {
    if (!await gameHuntComplete(teamId, huntId, pool)) break;
    const state = await pool.query<{ status: string }>('SELECT status FROM team_hunt_progress WHERE team_id=$1 AND hunt_id=$2', [teamId, huntId]);
    if (state.rows[0]?.status === 'AVAILABLE') await startHunt(pool, teamId, huntId);
    if (state.rows[0]?.status === 'AVAILABLE' || state.rows[0]?.status === 'IN_PROGRESS') {
      await completeHunt(pool, teamId, huntId);
    }
  }
}

async function completeEvidence(teamId: string, roundId: number, pool: Pool): Promise<boolean> {
  if (roundId === 1) {
    const result = await pool.query<{ total: number; done: number }>(`SELECT count(*)::int AS total,
      count(*) FILTER (WHERE status='COMPLETED')::int AS done FROM round1_stage_progress WHERE team_id=$1`, [teamId]);
    return result.rows[0]?.total === 3 && result.rows[0]?.done === 3;
  }
  if (roundId === 2) return false; // The auction currently has no authoritative team-completion record.
  if (roundId === 3) {
    await reconcileRound3Hunts(pool, teamId);
    const session = await getRound3Session(pool, teamId);
    const run = await getRound3Run(pool, teamId);
    return session?.is_completed === true && run?.status === 'completed';
  }
  const result = await pool.query<{ is_finished: boolean; current_step_index: number; finished_at: Date | null }>(
    'SELECT is_finished,current_step_index,finished_at FROM round4_team_progress WHERE team_id=$1', [teamId]);
  return result.rows[0]?.is_finished === true && result.rows[0].current_step_index === 5 && result.rows[0].finished_at !== null;
}

/** Lock Round 1 team/stages and record progression completion in the same transaction. */
async function completeRound1FromEvidence(pool: Pool, teamId: string): Promise<boolean> {
  return withPostgresTransaction(pool, async (client: PoolClient) => {
    if (!(await client.query('SELECT id FROM teams WHERE id=$1 FOR UPDATE', [teamId])).rowCount) return false;
    const stages = await client.query<{ stage_id: number; status: string }>(
      'SELECT stage_id,status FROM round1_stage_progress WHERE team_id=$1 ORDER BY stage_id FOR UPDATE', [teamId]);
    if (stages.rowCount !== 3 || stages.rows.some((stage, index) => stage.stage_id !== index + 1 || stage.status !== 'COMPLETED')) return false;
    const progress = await client.query<{ status: string }>(
      'SELECT status FROM round_progress WHERE team_id=$1 AND round_id=1 FOR UPDATE', [teamId]);
    if (!progress.rowCount || !['IN_PROGRESS', 'COMPLETED'].includes(progress.rows[0].status)) return false;
    await completeRoundInTransaction(client, teamId, 1);
    return true;
  });
}

async function reconcileRoundCompletion(pool: Pool, teamId: string, roundId: number): Promise<void> {
  if (roundId === 1) { await completeRound1FromEvidence(pool, teamId); return; }
  const status = await pool.query<{ status: string }>('SELECT status FROM round_progress WHERE team_id=$1 AND round_id=$2', [teamId, roundId]);
  if (status.rows[0]?.status === 'IN_PROGRESS' && await completeEvidence(teamId, roundId, pool)) {
    await completeRound(pool, teamId, roundId);
  }
}

teamRouter.use(requireTeamAuth);

teamRouter.get('/me', asyncHandler(async (req, res) => {
  if (!postgresPool) {
    if (!req.team) throw new ProgressionError('Squad authentication required.', 'FORBIDDEN');
    const teamId = req.team.id;
    return res.json({ success: true, teamId, ...getSqliteTeamProgression(teamId) });
  }
  const pool = configuredPool();
  const teamId = authenticatedTeam(req);
  await reconcileRound3Hunts(pool, teamId);
  for (const roundId of [1, 3, 4]) await reconcileRoundCompletion(pool, teamId, roundId);
  return res.json({ success: true, teamId, ...(await getTeamProgression(pool, teamId)) });
}));

teamRouter.post('/me/rounds/:roundId/start', asyncHandler(async (req, res) => {
  if (!postgresPool) {
    if (!req.team) throw new ProgressionError('Squad authentication required.', 'FORBIDDEN');
    const teamId = req.team.id;
    return res.json({ success: true, teamId, ...getSqliteTeamProgression(teamId) });
  }
  const pool = configuredPool();
  const teamId = authenticatedTeam(req);
  const roundId = numberParam(req.params.roundId, 'round', 1, 4);
  await startRound(pool, teamId, roundId);
  return res.json({ success: true, ...(await getTeamProgression(pool, teamId)) });
}));

teamRouter.post('/me/rounds/:roundId/complete', asyncHandler(async (req, res) => {
  if (!postgresPool) {
    if (!req.team) throw new ProgressionError('Squad authentication required.', 'FORBIDDEN');
    const teamId = req.team.id;
    return res.json({ success: true, teamId, ...getSqliteTeamProgression(teamId) });
  }
  const pool = configuredPool();
  const teamId = authenticatedTeam(req);
  const roundId = numberParam(req.params.roundId, 'round', 1, 4);
  if (roundId === 1) {
    if (!await completeRound1FromEvidence(pool, teamId)) return res.status(409).json({ success: false, message: 'The server has not recorded completion of Round 1.' });
    return res.json({ success: true, ...(await getTeamProgression(pool, teamId)) });
  }
  if (!(await completeEvidence(teamId, roundId, pool))) {
    return res.status(409).json({ success: false, message: roundId === 2
      ? 'Round 2 does not expose authoritative team completion yet; an administrator must record completion.'
      : 'The server has not recorded completion of this round.' });
  }
  await completeRound(pool, teamId, roundId);
  return res.json({ success: true, ...(await getTeamProgression(pool, teamId)) });
}));

teamRouter.post('/me/hunts/:huntId/start', asyncHandler(async (req, res) => {
  if (!postgresPool) {
    if (!req.team) throw new ProgressionError('Squad authentication required.', 'FORBIDDEN');
    const teamId = req.team.id;
    return res.json({ success: true, teamId, ...getSqliteTeamProgression(teamId) });
  }
  const pool = configuredPool();
  const teamId = authenticatedTeam(req);
  const huntId = numberParam(req.params.huntId, 'hunt', 1, 3);
  await reconcileRound3Hunts(pool, teamId);
  await startHunt(pool, teamId, huntId);
  return res.json({ success: true, ...(await getTeamProgression(pool, teamId)) });
}));

teamRouter.post('/me/hunts/:huntId/complete', asyncHandler(async (req, res) => {
  if (!postgresPool) {
    if (!req.team) throw new ProgressionError('Squad authentication required.', 'FORBIDDEN');
    const teamId = req.team.id;
    return res.json({ success: true, teamId, ...getSqliteTeamProgression(teamId) });
  }
  const pool = configuredPool();
  const teamId = authenticatedTeam(req);
  const huntId = numberParam(req.params.huntId, 'hunt', 1, 3);
  await reconcileRound3Hunts(pool, teamId);
  if (!await gameHuntComplete(teamId, huntId, pool)) {
    return res.status(409).json({ success: false, message: 'The server has not recorded completion of this hunt.' });
  }
  await completeHunt(pool, teamId, huntId);
  return res.json({ success: true, ...(await getTeamProgression(pool, teamId)) });
}));

adminRouter.use(requireAdminAuth);

adminRouter.post('/round2/:action', asyncHandler(async (req, res) => {
  const pool = configuredPool();
  if (!req.admin || !req.adminSessionToken) throw new ProgressionError('Administrator authentication required.', 'FORBIDDEN');
  const action = (Array.isArray(req.params.action) ? req.params.action[0] : req.params.action).toLowerCase();
  if (!['unlock', 'lock', 'reset'].includes(action)) throw new ProgressionError('Unsupported round 2 action.', 'NOT_FOUND');
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) || undefined : undefined;
  const result = await adminProgressRound2Global(pool, req.adminSessionToken, action as 'unlock' | 'lock' | 'reset', reason);
  return res.json({ success: true, action, ...result });
}));

adminRouter.post('/round3/:action', asyncHandler(async (req, res) => {
  const pool = configuredPool();
  if (!req.admin || !req.adminSessionToken) throw new ProgressionError('Administrator authentication required.', 'FORBIDDEN');
  const action = (Array.isArray(req.params.action) ? req.params.action[0] : req.params.action).toLowerCase();
  if (!['advance', 'unlock', 'lock'].includes(action)) throw new ProgressionError('Unsupported round 3 action.', 'NOT_FOUND');
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) || undefined : undefined;
  const result = await adminProgressRound3Global(pool, req.adminSessionToken, action as 'advance' | 'unlock' | 'lock', reason);
  return res.json({ success: true, action, ...result });
}));

adminRouter.post('/round4/:action', asyncHandler(async (req, res) => {
  const pool = configuredPool();
  if (!req.admin || !req.adminSessionToken) throw new ProgressionError('Administrator authentication required.', 'FORBIDDEN');
  const action = (Array.isArray(req.params.action) ? req.params.action[0] : req.params.action).toLowerCase();
  if (!['advance', 'unlock', 'lock'].includes(action)) throw new ProgressionError('Unsupported round 4 action.', 'NOT_FOUND');
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) || undefined : undefined;
  const result = await adminProgressRound4Global(pool, req.adminSessionToken, action as 'advance' | 'unlock' | 'lock', reason);
  return res.json({ success: true, action, ...result });
}));

adminRouter.post('/reset-all', asyncHandler(async (req, res) => {
  const pool = configuredPool();
  if (!req.admin || !req.adminSessionToken) throw new ProgressionError('Administrator authentication required.', 'FORBIDDEN');
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) || undefined : undefined;
  try {
    db.prepare("UPDATE stages_progress SET status='NOT_STARTED'").run();
  } catch {}
  const result = await adminResetAllTeamsProgress(pool, req.adminSessionToken, reason);
  return res.json({ success: true, message: 'All squad progress reset to Round 1 staged.', ...result });
}));

adminRouter.post('/tournament/reset', asyncHandler(async (req, res) => {
  const pool = configuredPool();
  if (!req.admin || !req.adminSessionToken) throw new ProgressionError('Administrator authentication required.', 'FORBIDDEN');
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) || undefined : undefined;
  try {
    db.prepare("UPDATE stages_progress SET status='NOT_STARTED'").run();
  } catch {}
  const result = await adminResetAllTeamsProgress(pool, req.adminSessionToken, reason);
  return res.json({ success: true, message: 'All squad progress reset to Round 1 staged.', ...result });
}));

adminRouter.post('/teams/:teamId/advance/:roundId', asyncHandler(async (req, res) => {
  const pool = configuredPool();
  if (!req.admin || !req.adminSessionToken) throw new ProgressionError('Administrator authentication required.', 'FORBIDDEN');
  const teamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
  const roundId = numberParam(req.params.roundId, 'round', 1, 4);
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) || undefined : undefined;
  const result = await adminAdvanceTeamToRound(pool, req.adminSessionToken, teamId, roundId, reason);
  return res.json({ success: true, ...result, ...(await getTeamProgression(pool, teamId)), audit: await getTeamProgressionAudit(pool, teamId) });
}));

adminRouter.get('/:teamId', asyncHandler(async (req, res) => {
  if (!postgresPool) {
    if (!req.admin || !req.adminSessionToken) throw new ProgressionError('Administrator authentication required.', 'FORBIDDEN');
    const rawTeamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
    const team = db.prepare('SELECT id FROM teams WHERE id=?').get(rawTeamId);
    if (!team) throw new ProgressionError('Team not found.', 'NOT_FOUND');
    return res.json({ success: true, teamId: rawTeamId, ...getSqliteTeamProgression(rawTeamId), audit: [] });
  }
  const pool = configuredPool();
  if (!req.admin || !req.adminSessionToken) throw new ProgressionError('Administrator authentication required.', 'FORBIDDEN');
  const rawTeamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
  if (!(await pool.query('SELECT 1 FROM teams WHERE id=$1', [rawTeamId])).rowCount) throw new ProgressionError('Team not found.', 'NOT_FOUND');
  return res.json({ success: true, teamId: rawTeamId, ...(await getTeamProgression(pool, rawTeamId)), audit: await getTeamProgressionAudit(pool, rawTeamId) });
}));

adminRouter.post('/:teamId/:entity/:entityId/:action', asyncHandler(async (req, res) => {
  if (!postgresPool) {
    if (!req.admin || !req.adminSessionToken) throw new ProgressionError('Administrator authentication required.', 'FORBIDDEN');
    const teamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
    const team = db.prepare('SELECT id FROM teams WHERE id=?').get(teamId);
    if (!team) throw new ProgressionError('Team not found.', 'NOT_FOUND');
    return res.json({ success: true, teamId, ...getSqliteTeamProgression(teamId), audit: [] });
  }
  const pool = configuredPool();
  if (!req.admin || !req.adminSessionToken) throw new ProgressionError('Administrator authentication required.', 'FORBIDDEN');
  const teamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
  const entityText = Array.isArray(req.params.entity) ? req.params.entity[0] : req.params.entity;
  const entity = entityText.toUpperCase();
  if (entity !== 'ROUND' && entity !== 'HUNT') throw new ProgressionError('Invalid progression type.', 'NOT_FOUND');
  const entityId = numberParam(req.params.entityId, entity.toLowerCase(), 1, entity === 'ROUND' ? 4 : 3);
  const action = (Array.isArray(req.params.action) ? req.params.action[0] : req.params.action).toLowerCase();
  if (!['unlock', 'lock', 'complete', 'reset'].includes(action)) throw new ProgressionError('Unsupported progression action.', 'NOT_FOUND');
  if (!(await pool.query('SELECT 1 FROM teams WHERE id=$1', [teamId])).rowCount) throw new ProgressionError('Team not found.', 'NOT_FOUND');
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) || undefined : undefined;
  await adminProgress(pool, req.adminSessionToken, teamId, entity, entityId, action as 'unlock' | 'lock' | 'complete' | 'reset', reason);
  return res.json({ success: true, teamId, ...(await getTeamProgression(pool, teamId)), audit: await getTeamProgressionAudit(pool, teamId) });
}));

export const progressionRouter = teamRouter;
export const adminProgressionRouter = adminRouter;

export function roundAccessGuard(roundId: number) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.path === '/admin' || req.path.startsWith('/admin/')) { next(); return; }
    requireTeamAuth(req, res, () => {
      if (!postgresPool) { next(); return; }
      const accessStartedAt = performance.now();
      void (async () => {
        const pool = configuredPool();
        const teamId = authenticatedTeam(req);
        if (roundId === 4 && req.path === '/status') {
          next();
          return;
        }
        if (roundId === 4) {
          const release = await pool.query<{ is_released: boolean }>('SELECT is_released FROM round4_settings WHERE id=1');
          if (release.rows[0]?.is_released !== true) {
            res.status(423).json({ success: false, message: 'Round 04 has not been released by the event administrators.', code: 'UNRELEASED' });
            return;
          }
        }
        const state = await pool.query<{ status: string; auction_enabled: boolean }>(
          `SELECT rp.status,
             CASE WHEN $2=2 THEN COALESCE((SELECT enabled FROM round2_auction_config WHERE id=1), false) ELSE true END AS auction_enabled
           FROM round_progress rp WHERE rp.team_id=$1 AND rp.round_id=$2`,
          [teamId, roundId],
        );
        let teamRoundStatus = state.rows[0]?.status;
        if (roundId === 1 && teamRoundStatus === 'LOCKED') {
          const r1 = await pool.query<{ is_active: boolean }>('SELECT is_active FROM rounds WHERE round_id=1');
          if (r1.rows[0]?.is_active) {
            await pool.query("UPDATE round_progress SET status='IN_PROGRESS', updated_at=now() WHERE team_id=$1 AND round_id=1", [teamId]);
            teamRoundStatus = 'IN_PROGRESS';
          }
        }
        if (roundId === 2 && state.rows[0]?.auction_enabled !== true) {
          throw new ProgressionError('Round 2 is unavailable until an administrator starts the auction.', 'LOCKED');
        }
        if (teamRoundStatus === 'AVAILABLE') {
          await startRound(pool, teamId, roundId);
          teamRoundStatus = 'IN_PROGRESS';
        }
        if (!teamRoundStatus || !['AVAILABLE', 'IN_PROGRESS', 'COMPLETED'].includes(teamRoundStatus)) {
          throw new ProgressionError('This round is locked.', 'LOCKED');
        }
        if (roundId === 2 && req.team) {
          if (req.body && typeof req.body === 'object') req.body.teamName = req.team.teamName;
          if (req.method === 'GET') req.query.team = req.team.teamName;
        }
        if (roundId === 3) {
          await reconcileRound3Hunts(pool, teamId);
          const huntRoute = req.path.match(/^\/hunt([123])\/(?:session|state|action)$/);
          if (huntRoute) {
            const huntId = Number(huntRoute[1]);
            const hunt = await pool.query<{ status: string }>('SELECT status FROM team_hunt_progress WHERE team_id=$1 AND hunt_id=$2', [teamId, huntId]);
            if (hunt.rows[0]?.status === 'AVAILABLE') await startHunt(pool, teamId, huntId);
            await assertHuntAccessible(pool, teamId, huntId);
          }
        }
        const completionRoute = (roundId === 1 && req.path === '/stage/complete') ||
          (roundId === 3 && req.path === '/complete');
        if (completionRoute) {
          const originalJson = res.json.bind(res);
          let completionSyncStarted = false;
          res.json = ((body: unknown) => {
            if (!completionSyncStarted && body && typeof body === 'object' && (body as { success?: unknown }).success === true) {
              completionSyncStarted = true;
              void reconcileRoundCompletion(pool, teamId, roundId)
                .catch((error: unknown) => console.error(`[Progression] Failed to record Round ${roundId} completion.`, error))
                .finally(() => { originalJson(body); });
              return res;
            }
            return originalJson(body);
          }) as Response['json'];
        }
        if (roundId === 1 && process.env.ROUND1_PERF_LOG === '1') {
          console.info(`[Round 1 timing] access-guard ${Math.round(performance.now() - accessStartedAt)}ms`);
        }
        next();
      })().catch((error: unknown) => failure(res, error));
    });
  };
}
