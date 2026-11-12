import { Router, type RequestHandler, type Response } from 'express';
import type { Pool } from 'pg';
import { postgresPool } from '../../database/postgres/pool.ts';
import {
  discoverRound4Target, getRound4AdminOverview, getRound4ReleaseState, getRound4Status,
  getRound4TeamRoute, resetRound4Tournament, Round4Error, scanRound4Qr,
  setRound4Release, submitRound4Clue, updateRound4FinalRoom, updateRound4Step,
} from '../../database/postgres/round4.ts';
import { ProgressionError, qualifyRound4Teams as replaceRound4Assignments } from '../../database/postgres/progression.ts';
import { requireAdminAuth, requireTeamAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { eventBus } from '../services/eventBus.ts';

type AuthMiddleware = RequestHandler;

function errorResponse(res: Response, error: unknown): void {
  if (error instanceof Round4Error) {
    const status = error.code === 'FORBIDDEN' ? 403 : error.code === 'NOT_FOUND' ? 404 :
      error.code === 'INVALID' ? 400 : error.code === 'UNRELEASED' ? 423 : 409;
    res.status(status).json({ success: false, message: error.message, code: error.code });
    return;
  }
  if (error instanceof ProgressionError) {
    const status = error.code === 'FORBIDDEN' ? 403 : error.code === 'NOT_FOUND' ? 404 : error.code === 'LOCKED' ? 423 : 409;
    res.status(status).json({ success: false, message: error.message, code: error.code });
    return;
  }
  const databaseCode = (error as { code?: string } | null)?.code;
  if (databaseCode === '23503' || databaseCode === '23505' || databaseCode === '23514') {
    res.status(409).json({ success: false, message: 'The Round 04 change conflicts with existing tournament state.' });
    return;
  }
  console.error('[Round4 API] PostgreSQL operation failed.', error);
  res.status(503).json({ success: false, message: 'Round 04 service is temporarily unavailable.' });
}

function asyncRoute(handler: (req: AuthenticatedRequest, res: Response) => Promise<unknown>): RequestHandler {
  return (req, res) => { void handler(req as AuthenticatedRequest, res).catch((error: unknown) => errorResponse(res, error)); };
}

export function createRound4Router(
  pool: Pool | null = postgresPool,
  auth: { team: AuthMiddleware; admin: AuthMiddleware } = { team: requireTeamAuth, admin: requireAdminAuth },
) {
  const router = Router();
  const requirePool = (): Pool => {
    if (!pool) throw new Round4Error('PostgreSQL service is unavailable.', 'NOT_FOUND');
    return pool;
  };
  const teamId = (req: AuthenticatedRequest): string => {
    if (!req.team?.id) throw new Round4Error('Squad authentication required.', 'FORBIDDEN');
    return req.team.id;
  };
  const adminSession = (req: AuthenticatedRequest): string => {
    if (!req.admin?.id || !req.adminSessionToken) throw new Round4Error('Administrator authentication required.', 'FORBIDDEN');
    return req.adminSessionToken;
  };
  const ensureReleased = async (dbPool: Pool) => {
    if (!(await getRound4ReleaseState(dbPool))) throw new Round4Error('Round 04 has not been released by the event administrators.', 'UNRELEASED');
  };

  // Status remains available while sealed so the client can present the existing release state.
  router.get('/status', auth.team, asyncRoute(async (req, res) =>
    res.json(await getRound4Status(requirePool(), teamId(req)))));

  router.get('/my-route', auth.team, asyncRoute(async (req, res) => {
    const dbPool = requirePool();
    await ensureReleased(dbPool);
    res.json(await getRound4TeamRoute(dbPool, teamId(req)));
  }));

  router.post('/discover-target', auth.team, asyncRoute(async (req, res) => {
    const dbPool = requirePool();
    const id = teamId(req);
    const result = await discoverRound4Target(dbPool, id, req.body?.requestId);
    if (result.body.success === true) {
      const state = await getRound4TeamRoute(dbPool, id);
      res.status(result.status).json({ ...result.body, state });
      return;
    }
    res.status(result.status).json(result.body);
  }));

  router.post('/submit-clue', auth.team, asyncRoute(async (req, res) => {
    const dbPool = requirePool();
    const id = teamId(req);
    const result = await submitRound4Clue(dbPool, id, req.body?.stepId, req.body?.answer, req.body?.requestId);
    // Replayed successful non-final submissions must preserve the same response
    // shape as the original request so clients do not need a follow-up state read.
    if (result.duplicate && result.body.success === true && result.body.isFinal === false) {
      result.body.state = await getRound4TeamRoute(dbPool, id);
    }
    if (!result.duplicate && result.body.success === true && result.body.isFinal === false) {
      const state = await getRound4TeamRoute(dbPool, id);
      result.body.state = state;
      eventBus.emitEvent('ROUND4_STEP_SOLVED', {
        teamId: id,
        teamName: req.team?.teamName,
        routeId: state.route.routeId,
        solvedClueIndex: Number(result.body.nextStepIndex),
        nextClueIndex: Number(result.body.nextStepIndex) + 1,
      });
    }
    if (!result.duplicate && result.body.isWinner === true) eventBus.emitEvent('ROUND4_WINNER_DECLARED', {
      winner: { teamId: id, teamName: result.body.teamName, routeId: result.body.routeId, solvedAt: result.body.solvedAt },
    });
    res.status(result.status).json(result.body);
  }));

  router.post('/scan-qr', auth.team, asyncRoute(async (req, res) => {
    const dbPool = requirePool();
    const id = teamId(req);
    const token = req.body?.qrToken || req.query?.token;
    const result = await scanRound4Qr(dbPool, id, token);
    res.status(result.success ? 200 : 400).json(result);
  }));

  router.get('/admin/overview', auth.admin, asyncRoute(async (_req, res) =>
    res.json(await getRound4AdminOverview(requirePool()))));

  router.post('/admin/qualify-teams', auth.admin, asyncRoute(async (req, res) => {
    const session = adminSession(req);
    const assignments = req.body?.assignments;
    if (!Array.isArray(assignments)) return res.status(400).json({ success: false, message: 'assignments must be an array.' });
    if (assignments.length > 5) return res.status(400).json({ success: false,
      message: 'Strict Limit Exceeded: Round 04 allows at most five qualified teams.' });
    const teamIds = new Set<string>();
    const routeIds = new Set<string>();
    for (const assignment of assignments) {
      if (!assignment || typeof assignment.teamId !== 'string' || !assignment.teamId.trim() ||
          typeof assignment.routeId !== 'string' || !assignment.routeId.trim()) {
        return res.status(400).json({ success: false, message: 'Each assignment requires valid teamId and routeId.' });
      }
      if (teamIds.has(assignment.teamId)) return res.status(400).json({ success: false, message: `Duplicate team assignment detected: ${assignment.teamId}` });
      if (routeIds.has(assignment.routeId)) return res.status(400).json({ success: false, message: `Duplicate route assignment detected: ${assignment.routeId}` });
      teamIds.add(assignment.teamId);
      routeIds.add(assignment.routeId);
    }
    await replaceRound4Assignments(requirePool(), session, assignments);
    res.json({ success: true, message: `Successfully qualified ${assignments.length} squads with unique routes I to V.` });
  }));

  router.post('/admin/release', auth.admin, asyncRoute(async (req, res) => {
    adminSession(req);
    if (typeof req.body?.isReleased !== 'boolean') return res.status(400).json({ success: false, message: 'isReleased must be a boolean.' });
    await setRound4Release(requirePool(), req.body.isReleased);
    eventBus.emitEvent('ROUND4_RELEASE_STATE', { isReleased: req.body.isReleased });
    res.json({ success: true, isReleased: req.body.isReleased });
  }));

  router.post('/admin/configure-step', auth.admin, asyncRoute(async (req, res) => {
    adminSession(req);
    const stepId = req.body?.stepId;
    if (typeof stepId !== 'string' || !stepId) return res.status(400).json({ success: false, message: 'stepId is required.' });
    if (!(await updateRound4Step(requirePool(), req.body))) return res.status(404).json({ success: false, message: `Step ${stepId} not found.` });
    res.json({ success: true, message: `Step ${stepId} successfully updated.` });
  }));

  router.post('/admin/configure-final-room', auth.admin, asyncRoute(async (req, res) => {
    adminSession(req);
    await updateRound4FinalRoom(requirePool(), req.body ?? {});
    res.json({ success: true, message: 'Common final room successfully updated.' });
  }));

  router.post('/admin/reset-tournament', auth.admin, asyncRoute(async (req, res) => {
    adminSession(req);
    await resetRound4Tournament(requirePool());
    const resetAt = new Date().toISOString();
    eventBus.emitEvent('ROUND4_RESET', { resetAt });
    res.json({ success: true, message: 'Round 04 tournament state reset successfully.' });
  }));

  return router;
}

export const round4Router = createRound4Router();
