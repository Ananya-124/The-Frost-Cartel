import { Router } from 'express';
import * as crypto from 'node:crypto';
import { requireAdminAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { eventBus } from '../services/eventBus.ts';
import { postgresPool } from '../../database/postgres/pool.ts';
import { hashPassword, verifyPassword } from '../auth/password.ts';
import { sessionCookieSettings } from '../config/security.ts';
import { setRound1TimerActive } from '../services/round1Gameplay.ts';

export const adminRouter = Router();

// POST /api/admin/login
adminRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ success: false, message: 'Username and password are required.' });
    return;
  }

  if (!postgresPool) { res.status(503).json({ success: false, message: 'Authentication service is unavailable.' }); return; }
  const found = await postgresPool.query<{ id: string; username: string; password_hash: string; salt: string; role: string; mustChangePassword: boolean }>(`
    SELECT id, username, password_hash, salt, role, must_change_password AS "mustChangePassword"
    FROM admins WHERE LOWER(username)=LOWER($1)
  `, [username.trim()]);
  const admin = found.rows[0];
  if (!admin || !verifyPassword(password, admin.password_hash, admin.salt)) {
    res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    return;
  }

  const now = new Date();
  const token = 'adm_' + crypto.randomBytes(32).toString('hex');

  await postgresPool.query(`INSERT INTO admin_sessions(id,admin_id,token,expires_at,created_at)
    VALUES($1,$2,$3,now()+interval '12 hours',$4)`, ['asess-' + crypto.randomUUID(), admin.id, token, now]);

  const cookie = sessionCookieSettings().admin;
  res.cookie(cookie.name, token, { ...cookie.options, maxAge: 12 * 60 * 60 * 1000 });

  res.json({
    success: true,
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      mustChangePassword: admin.mustChangePassword,
    },
  });
});

// POST /api/admin/change-password
adminRouter.post('/change-password', requireAdminAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.admin) {
    res.status(401).json({ success: false, message: 'Admin authentication required.' });
    return;
  }

  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    return;
  }

  if (!postgresPool) { res.status(503).json({ success: false, message: 'Authentication service is unavailable.' }); return; }
  const result = await postgresPool.query<{ password_hash: string; salt: string }>('SELECT password_hash,salt FROM admins WHERE id=$1', [req.admin.id]);
  const adminRecord = result.rows[0] as {
    password_hash: string;
    salt: string;
  } | undefined;

  if (!adminRecord || !verifyPassword(currentPassword, adminRecord.password_hash, adminRecord.salt)) {
    res.status(400).json({ success: false, message: 'Current password incorrect.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  await postgresPool.query('UPDATE admins SET password_hash=$1,salt=$2,must_change_password=false,updated_at=now() WHERE id=$3', [hash, salt, req.admin.id]);

  res.json({ success: true, message: 'Admin password updated successfully.' });
});

// GET /api/admin/dashboard — PostgreSQL is authoritative for every value.
adminRouter.get('/dashboard', requireAdminAuth, async (_req, res) => {
  if (!postgresPool) { res.status(503).json({ success: false, message: 'Dashboard service is unavailable.' }); return; }
  const [statsResult, roundResult, recentLogsResult] = await Promise.all([
    postgresPool.query<{ total_teams: number; active_teams: number; paused_teams: number; average_score: number }>(`
      SELECT count(*)::int AS total_teams,
        count(*) FILTER (WHERE NOT is_paused AND login_count > 0)::int AS active_teams,
        count(*) FILTER (WHERE is_paused)::int AS paused_teams,
        coalesce(round(avg(score)),0)::int AS average_score
      FROM teams`),
    postgresPool.query<{ is_active: boolean }>('SELECT is_active FROM rounds WHERE round_id=1'),
    postgresPool.query<{ action: string; details: Record<string, unknown>; created_at: Date; team_name: string }>(`
      SELECT a.action,a.details,a.created_at,t.team_name
      FROM activity_history a JOIN teams t ON t.id=a.team_id
      ORDER BY a.created_at DESC,a.id DESC LIMIT 10`),
  ]);
  const stats = statsResult.rows[0];
  res.json({ success: true, data: { stats: {
    totalTeams: stats.total_teams,
    activeTeams: stats.active_teams,
    pausedTeams: stats.paused_teams,
    averageScore: stats.average_score,
    round1Active: roundResult.rows[0]?.is_active ?? false,
  }, recentLogs: recentLogsResult.rows } });
});

// Team identity, round/hunt progress and Round 4 qualification are PostgreSQL-owned.
adminRouter.get('/teams', requireAdminAuth, async (_req, res) => {
  if (!postgresPool) { res.status(503).json({ success: false, message: 'Team roster service is unavailable.' }); return; }
  const result = await postgresPool.query(`
    SELECT t.id,t.team_name,t.is_paused,t.score,t.max_credits,t.total_credits,t.login_count,t.last_login_at,t.created_at,
      coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.stage_id) FROM round1_stage_progress s WHERE s.team_id=t.id),'[]'::jsonb) AS stages,
      coalesce((SELECT jsonb_agg(jsonb_build_object('roundId',rp.round_id,'status',rp.status,'score',rp.score,'maxScore',rp.max_score,'eligibleAt',rp.eligible_at,'completedAt',rp.completed_at) ORDER BY rp.round_id) FROM round_progress rp WHERE rp.team_id=t.id),'[]'::jsonb) AS rounds,
      coalesce((SELECT jsonb_agg(jsonb_build_object('huntId',hp.hunt_id,'status',hp.status,'completedAt',hp.completed_at) ORDER BY hp.hunt_id) FROM team_hunt_progress hp WHERE hp.team_id=t.id),'[]'::jsonb) AS hunts,
      (SELECT jsonb_build_object('routeId',q.route_id,'routeNumber',r.route_number,'routeName',r.route_name,'status',CASE WHEN p.is_finished THEN 'COMPLETED' ELSE 'IN_PROGRESS' END)
       FROM round4_qualified_teams q JOIN round4_routes r ON r.id=q.route_id LEFT JOIN round4_team_progress p ON p.team_id=q.team_id WHERE q.team_id=t.id) AS round4
    FROM teams t ORDER BY t.team_name,t.id`);
  const teams = result.rows.map((t) => ({
    id: t.id, teamName: t.team_name, isPaused: t.is_paused, score: t.score,
    maxCredits: t.max_credits, totalCredits: t.total_credits, loginCount: t.login_count,
    lastLoginAt: t.last_login_at, stages: t.stages, rounds: t.rounds, hunts: t.hunts,
    round4: t.round4, createdAt: t.created_at,
  }));
  res.json({ success: true, teams });
});

adminRouter.post('/teams', requireAdminAuth, async (req, res) => {
  const { teamName, password } = req.body ?? {};
  if (typeof teamName !== 'string' || !teamName.trim()) { res.status(400).json({ success: false, message: 'Squad Name is required.' }); return; }
  if (password !== undefined && (typeof password !== 'string' || password.trim().length < 4)) { res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' }); return; }
  if (!postgresPool) { res.status(503).json({ success: false, message: 'Authentication service is unavailable.' }); return; }
  const name = teamName.trim();
  const generatedPassword = typeof password === 'string' && password.trim() ? password.trim() : `SQUAD#${crypto.randomBytes(12).toString('base64url')}`;
  const { hash, salt } = hashPassword(generatedPassword);
  const teamId = 'team-' + crypto.randomUUID();
  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended(lower($1),0))', [name]);
    const duplicate = await client.query('SELECT 1 FROM teams WHERE lower(team_name)=lower($1) LIMIT 1', [name]);
    if (duplicate.rowCount) { await client.query('ROLLBACK'); res.status(409).json({ success: false, message: 'A squad with this name already exists.' }); return; }
    await client.query(`INSERT INTO teams(id,team_name,password_hash,salt) VALUES($1,$2,$3,$4)`, [teamId, name, hash, salt]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    if ((error as { code?: string }).code === '23505') { res.status(409).json({ success: false, message: 'A squad with this name already exists.' }); return; }
    throw error;
  } finally { client.release(); }
  res.status(201).json({ success: true, team: { id: teamId, teamName: name, password: generatedPassword, score: 0, isPaused: false, loginCount: 0 } });
});

adminRouter.put('/teams/:id', requireAdminAuth, async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { teamName, password } = req.body ?? {};
  if (Object.hasOwn(req.body ?? {}, 'score')) {
    res.status(400).json({ success: false, message: 'Direct score edits are not allowed. Score changes must be recorded through an audited score-ledger operation.' });
    return;
  }
  if (!postgresPool) { res.status(503).json({ success: false, message: 'Authentication service is unavailable.' }); return; }
  const values: unknown[] = [];
  const setters: string[] = [];
  if (typeof teamName === 'string' && teamName.trim()) { values.push(teamName.trim()); setters.push(`team_name=$${values.length}`); }
  if (typeof password === 'string' && password.trim()) { const credentials = hashPassword(password.trim()); values.push(credentials.hash, credentials.salt); setters.push(`password_hash=$${values.length - 1}`, `salt=$${values.length}`); }
  if (!setters.length) { res.status(400).json({ success: false, message: 'No team identity changes were provided.' }); return; }
  values.push(id);
  try {
    const updated = await postgresPool.query(`UPDATE teams SET ${setters.join(',')},updated_at=now() WHERE id=$${values.length} RETURNING id`, values);
    if (!updated.rowCount) { res.status(404).json({ success: false, message: 'Squad not found.' }); return; }
  } catch (error) {
    if ((error as { code?: string }).code === '23505') { res.status(409).json({ success: false, message: 'A squad with this name already exists.' }); return; }
    throw error;
  }
  eventBus.broadcastToTeam(id, 'TEAM_UPDATED', { id });
  res.json({ success: true, message: 'Squad updated successfully.' });
});

adminRouter.delete('/teams/:id', requireAdminAuth, async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!postgresPool) { res.status(503).json({ success: false, message: 'Authentication service is unavailable.' }); return; }
  const removed = await postgresPool.query('DELETE FROM teams WHERE id=$1 RETURNING id', [id]);
  if (!removed.rowCount) { res.status(404).json({ success: false, message: 'Squad not found.' }); return; }
  res.json({ success: true, message: 'Squad deleted.' });
});

adminRouter.post('/teams/:id/pause', requireAdminAuth, async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (typeof req.body?.isPaused !== 'boolean') { res.status(400).json({ success: false, message: 'isPaused must be supplied as the desired team pause state.' }); return; }
  if (!postgresPool) { res.status(503).json({ success: false, message: 'Authentication service is unavailable.' }); return; }
  const changed = await postgresPool.query('UPDATE teams SET is_paused=$2,updated_at=now() WHERE id=$1 RETURNING is_paused', [id, req.body.isPaused]);
  if (!changed.rowCount) { res.status(404).json({ success: false, message: 'Squad not found.' }); return; }
  const isPaused = changed.rows[0].is_paused;
  eventBus.broadcastToTeam(id, 'TEAM_UPDATED', { id, isPaused });
  res.json({ success: true, isPaused });
});

adminRouter.post('/teams/:id/reset-password', requireAdminAuth, async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!postgresPool) { res.status(503).json({ success: false, message: 'Authentication service is unavailable.' }); return; }
  const newPassword = `RITUAL#${crypto.randomBytes(12).toString('base64url')}`;
  const { hash, salt } = hashPassword(newPassword);
  const changed = await postgresPool.query('UPDATE teams SET password_hash=$1,salt=$2,updated_at=now() WHERE id=$3 RETURNING id', [hash, salt, id]);
  if (!changed.rowCount) { res.status(404).json({ success: false, message: 'Squad not found.' }); return; }
  res.json({ success: true, newPassword });
});
// GET /api/admin/rounds/status — same PostgreSQL timer state used by Round 1 gameplay.
adminRouter.get('/rounds/status', requireAdminAuth, async (_req, res) => {
  if (!postgresPool) { res.status(503).json({ success: false, message: 'Round control service is unavailable.' }); return; }
  const result = await postgresPool.query<{ is_active: boolean; duration_seconds: number; start_time: Date | null }>(
    `SELECT r.is_active,r.duration_seconds,r.start_time FROM rounds r WHERE r.round_id=1`);
  const round = result.rows[0];
  if (!round) { res.status(404).json({ success: false, message: 'Round 1 state not found.' }); return; }
  const configuration = await postgresPool.query<{ lifecycle: string }>("SELECT configuration->>'lifecycle' AS lifecycle FROM round1_configuration WHERE singleton_id=1");
  const lifecycle = configuration.rows[0]?.lifecycle ?? 'not_started';
  const isActive = lifecycle === 'not_started' || lifecycle === 'running';
  res.json({ success: true, round: { isActive, durationSeconds: round.duration_seconds, startTime: round.start_time } });
});

// POST /api/admin/rounds/toggle — desired-state input makes safe retries idempotent.
adminRouter.post('/rounds/toggle', requireAdminAuth, async (req: AuthenticatedRequest, res) => {
  if (typeof req.body?.isActive !== 'boolean') { res.status(400).json({ success: false, message: 'isActive must be supplied as the desired Round 1 state.' }); return; }
  if (!postgresPool || !req.admin) { res.status(503).json({ success: false, message: 'Round control service is unavailable.' }); return; }
  const result = await setRound1TimerActive(postgresPool, req.admin.id, req.body.isActive);
  if (result.changed) eventBus.broadcastAll('ROUND_STATUS', { roundId: 1, isActive: result.isActive });
  res.json({ success: true, isActive: result.isActive });
});

// GET /api/admin/results — protected admin view of official PostgreSQL scores.
adminRouter.get('/results', requireAdminAuth, async (_req, res) => {
  if (!postgresPool) { res.status(503).json({ success: false, message: 'Results service is unavailable.' }); return; }
  const result = await postgresPool.query(`
    SELECT l.team_id AS id,l.team_name AS "teamName",l.score,l.rank::int AS rank,
      t.max_credits AS "maxCredits",t.last_login_at,
      (SELECT count(*)::int FROM round1_stage_progress s WHERE s.team_id=l.team_id AND s.status='COMPLETED') AS "completedStages"
    FROM leaderboard l JOIN teams t ON t.id=l.team_id ORDER BY l.rank,l.team_id`);
  res.json({ success: true, results: result.rows });
});

// POST /api/admin/logout
adminRouter.post('/logout', async (req: AuthenticatedRequest, res) => {
  const token = req.cookies?.fc_admin_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token && postgresPool) await postgresPool.query('DELETE FROM admin_sessions WHERE token=$1', [token]);
  const cookie = sessionCookieSettings().admin;
  res.clearCookie(cookie.name, cookie.options);
  res.json({ success: true, message: 'Admin signed out successfully.' });
});
