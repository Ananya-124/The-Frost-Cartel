import { Router } from 'express';
import { requireTeamAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { postgresPool } from '../../database/postgres/pool.ts';
import {
  completeRound3Run, ensureRound3Session as ensurePostgresRound3Session, getRound3Run as getPostgresRound3Run,
  getRound3Session as getPostgresRound3Session, discoverRound3Evidence, pauseRound3Run as pausePostgresRound3Run,
  resumeRound3Run as resumePostgresRound3Run, Round3VersionConflictError, startRound3Run as startPostgresRound3Run,
  updateRound3Session,
} from '../../database/postgres/round3-repository.ts';
import { consumeRound3Card, getRound3CardUsage, getRound3Inventory, loadRound3DevelopmentSample, Round3CardError } from '../../database/postgres/round3-cards.ts';
import { ROUND3_CARD_CATALOG } from '../../src/constants/round3.cards.ts';
import { applyRound3Hunt1Action, ensureRound3Hunt1State, getRound3Hunt1State, Round3Hunt1ConflictError, Round3Hunt1InactiveRunError } from '../../database/postgres/round3-hunt1.ts';
import { applyRound3Hunt2Action, ensureRound3Hunt2State, getRound3Hunt2State, Round3Hunt2ConflictError, Round3Hunt2InactiveRunError } from '../../database/postgres/round3-hunt2.ts';
import { applyRound3Hunt3Action, ensureRound3Hunt3State, getRound3Hunt3State, Round3Hunt3ConflictError, Round3Hunt3InactiveRunError } from '../../database/postgres/round3-hunt3.ts';

export const round3Router = Router();
const auth = requireTeamAuth;
const teamOf = (req: AuthenticatedRequest) => req.team ? { id: req.team.id, teamName: req.team.teamName } : null;
const requirePostgres = () => postgresPool;
const huntNames = ['paradox-hunt', 'paradox-hunt-2', 'paradox-hunt-3'] as const;
const runResponse = (run: Awaited<ReturnType<typeof getPostgresRound3Run>>) => run && ({
  status: run.status,
  remainingMs: run.remaining_ms,
  remainingSeconds: run.remaining_seconds,
  startedAt: run.started_at?.toISOString() ?? null,
  updatedAt: run.updated_at.toISOString(),
});

async function postgresTimerAllowsGameplay(teamId: string): Promise<boolean> {
  const pool = requirePostgres();
  if (!pool) return false;
  let run = await getPostgresRound3Run(pool, teamId);
  // Preserve the existing first-action start behavior while making PostgreSQL
  // the timer authority for score-bearing Hunt actions.
  if (run?.status === 'not_started') run = await startPostgresRound3Run(pool, teamId);
  return run?.status === 'running' && run.remaining_ms > 0;
}

async function getPostgresApiState(team: { id: string; teamName: string }) {
  const pool = requirePostgres();
  if (!pool) return null;
  const session = await getPostgresRound3Session(pool, team.id);
  if (!session) return null;
  const run = await getPostgresRound3Run(pool, team.id);
  const scoreResult = await pool.query<{ score: number }>('SELECT score FROM round_progress WHERE team_id=$1 AND round_id=3', [team.id]);
  const score = scoreResult.rows[0]?.score ?? 0;
  const playerProgress = { ...session.player_progress };
  if (playerProgress.engine && typeof playerProgress.engine === 'object' && !Array.isArray(playerProgress.engine)) {
    playerProgress.engine = { ...(playerProgress.engine as Record<string, unknown>), score };
  }
  return {
    success: true as const,
    session: {
      teamId: session.team_id,
      teamName: team.teamName,
      currentHunt: huntNames[session.current_hunt - 1] ?? huntNames[0],
      playerProgress,
      timelines: { past: session.past_state, future: session.future_state },
      activeTimeline: session.active_timeline === 'future' ? 'future' as const : 'past' as const,
      evidenceDiscoveries: session.evidence,
      cardUsage: await getRound3CardUsage(pool, team.id),
      score,
      completed: session.is_completed,
      completedAt: session.completed_at?.toISOString() ?? null,
      updatedAt: session.updated_at.toISOString(),
      run: runResponse(run),
    },
    inventory: await getRound3Inventory(pool, team.id),
    cards: ROUND3_CARD_CATALOG,
  };
}

function parseProgressPatch(input: unknown, existing: NonNullable<Awaited<ReturnType<typeof getPostgresRound3Session>>>, authoritativeScore: number) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || JSON.stringify(input).length > 32_000) return null;
  const value = input as Record<string, unknown>;
  const patch: Parameters<typeof updateRound3Session>[3] = {};
  const isRecord = (item: unknown): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item);
  if (value.playerProgress !== undefined) {
    if (!isRecord(value.playerProgress)) return null;
    patch.player_progress = { ...value.playerProgress };
    if (isRecord(patch.player_progress.engine)) patch.player_progress.engine = { ...patch.player_progress.engine, score: authoritativeScore };
  }
  if (value.activeTimeline !== undefined) {
    if (value.activeTimeline !== 'past' && value.activeTimeline !== 'future') return null;
    patch.active_timeline = value.activeTimeline;
  }
  if (value.timelines !== undefined) {
    if (!isRecord(value.timelines) || (value.timelines.past !== undefined && !isRecord(value.timelines.past)) || (value.timelines.future !== undefined && !isRecord(value.timelines.future))) return null;
    if (value.timelines.past !== undefined) patch.past_state = value.timelines.past;
    if (value.timelines.future !== undefined) patch.future_state = value.timelines.future;
  }
  if (value.evidenceDiscoveries !== undefined) {
    if (!Array.isArray(value.evidenceDiscoveries) || value.evidenceDiscoveries.length > 200 || value.evidenceDiscoveries.some((id) => typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id))) return null;
    patch.evidence = [...new Set([...existing.evidence, ...value.evidenceDiscoveries as string[]])];
  }
  if (value.currentHunt !== undefined) {
    if (typeof value.currentHunt !== 'string' || !/^paradox-hunt(?:-[1-3])?$/.test(value.currentHunt)) return null;
    patch.current_hunt = value.currentHunt === 'paradox-hunt' ? 1 : Number(value.currentHunt.slice(-1));
  }
  return patch;
}
const canAccessHunt3 = async (pool: NonNullable<ReturnType<typeof requirePostgres>>, teamId: string) =>
  (await getRound3Hunt2State(pool, teamId))?.completed === true;

round3Router.get('/run', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  const run = await getPostgresRound3Run(pool, req.team.id);
  return run ? res.json({ success: true, run: runResponse(run) }) : res.status(404).json({ success: false, message: 'Round 3 run has not been initialized.' });
});
round3Router.post('/run/start', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  const run = await startPostgresRound3Run(pool, req.team.id);
  return run ? res.json({ success: true, run: runResponse(run) }) : res.status(404).json({ success: false, message: 'Round 3 run has not been initialized.' });
});
round3Router.post('/run/pause', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  const run = await pausePostgresRound3Run(pool, req.team.id);
  return run ? res.json({ success: true, run: runResponse(run) }) : res.status(404).json({ success: false, message: 'Round 3 run has not been initialized.' });
});
round3Router.post('/run/resume', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  const run = await resumePostgresRound3Run(pool, req.team.id);
  return run ? res.json({ success: true, run: runResponse(run) }) : res.status(404).json({ success: false, message: 'Round 3 run has not been initialized.' });
});

round3Router.post('/hunt1/session', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  const state = await ensureRound3Hunt1State(pool, req.team.id, req.playerNumber);
  return state ? res.json({ success: true, state }) : res.status(404).json({ success: false, message: 'Hunt 1 session has not been initialized.' });
});

round3Router.get('/hunt1/state', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  const state = await getRound3Hunt1State(pool, req.team.id, req.playerNumber);
  return state ? res.json({ success: true, state }) : res.status(404).json({ success: false, message: 'Hunt 1 session has not been initialized.' });
});

round3Router.post('/hunt1/action', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  if (!await postgresTimerAllowsGameplay(req.team.id)) return res.status(409).json({ success: false, message: 'Round 3 gameplay is not active.' });
  if (req.body?.actor !== 'archivist' && req.body?.actor !== 'tracker') return res.status(400).json({ success: false, message: 'Select the investigator responsible for this Hunt I action.' });
  if (typeof req.body?.actionId !== 'string' || !/^[A-Za-z0-9:_-]{8,120}$/.test(req.body.actionId)) return res.status(400).json({ success: false, message: 'A stable Hunt I action ID is required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  try {
    const result = await applyRound3Hunt1Action(pool, req.team.id, req.body, req.playerNumber);
    return result ? res.json(result) : res.status(400).json({ success: false, message: 'Invalid Hunt 1 action or session.' });
  } catch (error) {
    if (error instanceof Round3Hunt1InactiveRunError) return res.status(409).json({ success: false, message: error.message });
    if (error instanceof Round3Hunt1ConflictError) return res.status(409).json({ success: false, message: error.message });
    throw error;
  }
});

round3Router.post('/hunt2/session', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  if (!(await getRound3Hunt1State(pool, req.team.id))?.completed) return res.status(423).json({ success: false, message: 'Complete Hunt I before entering Hunt II.' });
  await ensurePostgresRound3Session(pool, req.team.id);
  const actor = req.playerNumber === 1 ? 'archivist' : 'tracker';
  const state = await ensureRound3Hunt2State(pool, req.team.id, actor, req.body?.sharedView === true);
  return state ? res.json({ success: true, state }) : res.status(404).json({ success: false, message: 'Hunt II session has not been initialized.' });
});

round3Router.get('/hunt2/state', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  if (!(await getRound3Hunt1State(pool, req.team.id))?.completed) return res.status(423).json({ success: false, message: 'Complete Hunt I before opening Hunt II.' });
  const state = await getRound3Hunt2State(pool, req.team.id, req.playerNumber === 1 ? 'archivist' : 'tracker', req.query.sharedView === 'true');
  if (!state) return res.status(404).json({ success: false, message: 'Hunt 2 session has not been initialized.' });
  return res.json({ success: true, state });
});

round3Router.post('/hunt2/action', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  if (!await postgresTimerAllowsGameplay(req.team.id)) return res.status(409).json({ success: false, message: 'Round 3 gameplay is not active.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  if (!(await getRound3Hunt1State(pool, req.team.id))?.completed) return res.status(423).json({ success: false, message: 'Complete Hunt I before taking Hunt II actions.' });
  if (req.body?.actor !== 'archivist' && req.body?.actor !== 'tracker') return res.status(400).json({ success: false, message: 'Select the investigator responsible for this Hunt II action.' });
  if (typeof req.body?.actionId !== 'string' || !/^[A-Za-z0-9:_-]{8,120}$/.test(req.body.actionId)) return res.status(400).json({ success: false, message: 'A stable Hunt II action ID is required.' });
  try {
    const result = await applyRound3Hunt2Action(pool, req.team.id, req.body);
    if (!result) return res.status(400).json({ success: false, message: 'Invalid Hunt II action or session.' });
    return res.json(result);
  } catch (error) {
    if (error instanceof Round3Hunt2InactiveRunError || error instanceof Round3Hunt2ConflictError) return res.status(409).json({ success: false, message: error.message });
    throw error;
  }
});

round3Router.post('/hunt3/session', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  if (!await canAccessHunt3(pool, req.team.id)) return res.status(423).json({ success: false, message: 'Complete Hunt II before entering Hunt III.' });
  await ensurePostgresRound3Session(pool, req.team.id);
  const actor = req.playerNumber === 1 ? 'archivist' : 'tracker';
  const state = await ensureRound3Hunt3State(pool, req.team.id, actor, req.body?.sharedView !== false);
  return state ? res.json({ success: true, state }) : res.status(404).json({ success: false, message: 'Hunt III session has not been initialized.' });
});

round3Router.get('/hunt3/state', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  if (!await canAccessHunt3(pool, req.team.id)) return res.status(423).json({ success: false, message: 'Complete Hunt II before opening Hunt III.' });
  const actor = req.playerNumber === 1 ? 'archivist' : 'tracker';
  const state = await getRound3Hunt3State(pool, req.team.id, actor, req.query.sharedView !== 'false');
  if (!state) return res.status(404).json({ success: false, message: 'Hunt III session has not been initialized.' });
  return res.json({ success: true, state });
});

round3Router.post('/hunt3/action', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  if (!await postgresTimerAllowsGameplay(req.team.id)) return res.status(409).json({ success: false, message: 'Round 3 gameplay is not active.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  if (!await canAccessHunt3(pool, req.team.id)) return res.status(423).json({ success: false, message: 'Complete Hunt II before taking Hunt III actions.' });
  if (req.body?.actor !== 'archivist' && req.body?.actor !== 'tracker') return res.status(400).json({ success: false, message: 'Select the investigator responsible for this Hunt III action.' });
  if (typeof req.body?.actionId !== 'string' || !/^[A-Za-z0-9:_-]{8,120}$/.test(req.body.actionId)) return res.status(400).json({ success: false, message: 'A stable Hunt III action ID is required.' });
  const actor = req.body.actor as 'archivist' | 'tracker';
  try {
    const result = await applyRound3Hunt3Action(pool, req.team.id, req.body, actor, req.body?.sharedView !== false);
    if (!result) return res.status(400).json({ success: false, message: 'Invalid Hunt III action or session.' });
    return res.json(result);
  } catch (error) {
    if (error instanceof Round3Hunt3InactiveRunError || error instanceof Round3Hunt3ConflictError) {
      return res.status(409).json({ success: false, message: error.message });
    }
    throw error;
  }
});

round3Router.get('/state', auth, async (req: AuthenticatedRequest, res) => {
  const team = teamOf(req);
  if (!team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  const state = await getPostgresApiState(team);
  return state ? res.json(state) : res.status(404).json({ success: false, message: 'Round 3 session has not been initialized.' });
});

round3Router.post('/session', auth, async (req: AuthenticatedRequest, res) => {
  const team = teamOf(req);
  if (!team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  await ensurePostgresRound3Session(pool, team.id);
  const state = await getPostgresApiState(team);
  return state ? res.json(state) : res.status(404).json({ success: false, message: 'Round 3 session has not been initialized.' });
});

round3Router.patch('/progress', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  const existing = await getPostgresRound3Session(pool, req.team.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Round 3 session has not been initialized.' });
  const score = await pool.query<{ score: number }>('SELECT score FROM round_progress WHERE team_id=$1 AND round_id=3', [req.team.id]);
  const patch = parseProgressPatch(req.body, existing, score.rows[0]?.score ?? 0);
  if (!patch) return res.status(400).json({ success: false, message: 'Invalid progress or timeline state.' });
  let updated: Awaited<ReturnType<typeof updateRound3Session>>;
  try {
    updated = await updateRound3Session(pool, req.team.id, existing.version, patch);
  } catch (error) {
    if (error instanceof Round3VersionConflictError) return res.status(409).json({ success: false, message: 'Round 3 progress changed. Refresh and retry.' });
    throw error;
  }
  if (!updated) return res.status(404).json({ success: false, message: 'Round 3 session has not been initialized.' });
  if (updated.version === existing.version) return res.status(409).json({ success: false, message: 'Round 3 progress changed. Refresh and retry.' });
  const state = await getPostgresApiState({ id: req.team.id, teamName: req.team.teamName });
  return state ? res.json(state) : res.status(404).json({ success: false, message: 'Round 3 session has not been initialized.' });
});

round3Router.post('/evidence/:evidenceId/discover', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  const evidence = await discoverRound3Evidence(pool, req.team.id, String(req.params.evidenceId));
  return evidence ? res.json({ success: true, evidenceDiscoveries: evidence }) : res.status(400).json({ success: false, message: 'Invalid evidence identifier.' });
});

round3Router.post('/cards/:cardId/activate', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  if (typeof req.body?.requestId !== 'string') return res.status(400).json({ success: false, message: 'A stable card activation ID is required.' });
  try {
    const usage = await consumeRound3Card(pool, req.team.id, String(req.params.cardId), req.body.requestId, req.body?.source);
    return res.json({ success: true, usage, state: await getPostgresApiState({ id: req.team.id, teamName: req.team.teamName }) });
  } catch (error) {
    if (error instanceof Round3CardError) {
      const status = error.code === 'INVALID' ? 400 : error.code === 'NOT_FOUND' ? 409 : error.code === 'UNAVAILABLE' ? 409 : 409;
      return res.status(status).json({ success: false, message: error.message, code: error.code });
    }
    throw error;
  }
});

round3Router.post('/complete', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  const run = await getPostgresRound3Run(pool, req.team.id);
  if (!run) return res.status(404).json({ success: false, message: 'Round 3 session has not been initialized.' });
  if (run.status === 'expired' || (run.status === 'running' && run.remaining_ms <= 0)) return res.status(409).json({ success: false, message: 'The Round 3 timer expired before Hunt III was completed.' });
  if (run.status !== 'running') return res.status(409).json({ success: false, message: 'Round 3 is not actively running.' });
  const hunt3State = await getRound3Hunt3State(pool, req.team.id);
  if (hunt3State?.completed !== true) return res.status(409).json({ success: false, message: 'Complete Hunt III before completing Round 3.' });
  const completion = await completeRound3Run(pool, req.team.id);
  if (!completion.completed) {
    const message = completion.reason === 'expired'
      ? 'The Round 3 timer expired before Hunt III was completed.'
      : completion.reason === 'not_running'
        ? 'Round 3 is not actively running.'
        : 'Round 3 session has not been initialized.';
    return res.status(completion.reason === 'missing' ? 404 : 409).json({ success: false, message });
  }
  return res.json({ success: true, completed: true, completedAt: completion.session.completed_at?.toISOString() ?? null });
});

round3Router.post('/development/sample-inventory', auth, async (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const pool = requirePostgres();
  if (!pool) return res.status(503).json({ success: false, message: 'Round 3 persistence is unavailable.' });
  const enabled = process.env.NODE_ENV !== 'production' && process.env.ROUND3_ENABLE_DEV_INVENTORY === 'true';
  if (!await loadRound3DevelopmentSample(pool, req.team.id, enabled)) return res.status(404).json({ success: false, message: 'Development sample inventory is disabled.' });
  return res.json(await getPostgresApiState({ id: req.team.id, teamName: req.team.teamName }));
});
