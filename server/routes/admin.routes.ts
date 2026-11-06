import { Router } from 'express';
import * as crypto from 'node:crypto';
import { db, verifyPassword, hashPassword } from '../../database/db.ts';
import { requireAdminAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { eventBus } from '../services/eventBus.ts';

export const adminRouter = Router();

// POST /api/admin/login
adminRouter.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ success: false, message: 'Username and password are required.' });
    return;
  }

  const admin = db.prepare(`
    SELECT id, username, password_hash, salt, role, must_change_password as mustChangePassword
    FROM admins
    WHERE LOWER(username) = LOWER(?)
  `).get(username.trim()) as {
    id: string;
    username: string;
    password_hash: string;
    salt: string;
    role: string;
    mustChangePassword: number;
  } | undefined;

  if (!admin || !verifyPassword(password, admin.password_hash, admin.salt)) {
    res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
  const token = 'adm_' + crypto.randomBytes(32).toString('hex');

  db.prepare(`
    INSERT INTO admin_sessions (id, admin_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run('asess-' + crypto.randomUUID(), admin.id, token, expiresAt, now.toISOString());

  res.cookie('fc_admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 12 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      mustChangePassword: admin.mustChangePassword === 1,
    },
  });
});

// POST /api/admin/change-password
adminRouter.post('/change-password', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  if (!req.admin) {
    res.status(401).json({ success: false, message: 'Admin authentication required.' });
    return;
  }

  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    return;
  }

  const adminRecord = db.prepare('SELECT password_hash, salt FROM admins WHERE id = ?').get(req.admin.id) as {
    password_hash: string;
    salt: string;
  } | undefined;

  if (!adminRecord || !verifyPassword(currentPassword, adminRecord.password_hash, adminRecord.salt)) {
    res.status(400).json({ success: false, message: 'Current password incorrect.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  db.prepare(`
    UPDATE admins
    SET password_hash = ?, salt = ?, must_change_password = 0, updated_at = ?
    WHERE id = ?
  `).run(hash, salt, new Date().toISOString(), req.admin.id);

  res.json({ success: true, message: 'Admin password updated successfully.' });
});

// GET /api/admin/dashboard
adminRouter.get('/dashboard', requireAdminAuth, (_req, res) => {
  const teams = db.prepare('SELECT * FROM teams ORDER BY score DESC').all() as Array<{
    id: string;
    team_name: string;
    score: number;
    is_paused: number;
    login_count: number;
    last_login_at: string;
  }>;

  const totalTeams = teams.length;
  const activeTeams = teams.filter(t => t.is_paused === 0 && t.login_count > 0).length;
  const pausedTeams = teams.filter(t => t.is_paused === 1).length;
  const totalScore = teams.reduce((acc, t) => acc + t.score, 0);
  const avgScore = totalTeams > 0 ? Math.round(totalScore / totalTeams) : 0;

  const roundState = db.prepare('SELECT * FROM global_round_state WHERE round_id = 1').get() as {
    is_active: number;
    duration_seconds: number;
    start_time: string;
  } | undefined;

  const recentLogs = db.prepare(`
    SELECT a.action, a.details, a.created_at, t.team_name
    FROM activity_history a
    JOIN teams t ON a.team_id = t.id
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all();

  res.json({
    success: true,
    data: {
      stats: {
        totalTeams,
        activeTeams,
        pausedTeams,
        averageScore: avgScore,
        round1Active: roundState ? roundState.is_active === 1 : true,
      },
      recentLogs,
    },
  });
});

// GET /api/admin/teams
adminRouter.get('/teams', requireAdminAuth, (_req, res) => {
  const teams = db.prepare('SELECT * FROM teams ORDER BY team_name ASC').all() as Array<{
    id: string;
    team_name: string;
    raw_password: string;
    is_paused: number;
    score: number;
    max_credits: number;
    total_credits: number;
    login_count: number;
    last_login_at: string;
    created_at: string;
  }>;

  const teamsWithStages = teams.map(t => {
    const stages = db.prepare('SELECT * FROM stages_progress WHERE team_id = ? ORDER BY stage_id ASC').all(t.id);
    return {
      id: t.id,
      teamName: t.team_name,
      password: t.raw_password,
      isPaused: t.is_paused === 1,
      score: t.score,
      maxCredits: t.max_credits,
      totalCredits: t.total_credits,
      loginCount: t.login_count,
      lastLoginAt: t.last_login_at,
      stages,
      createdAt: t.created_at,
    };
  });

  res.json({ success: true, teams: teamsWithStages });
});

// POST /api/admin/teams (Create Squad)
adminRouter.post('/teams', requireAdminAuth, (req, res) => {
  const { teamName, password } = req.body;

  if (!teamName?.trim()) {
    res.status(400).json({ success: false, message: 'Squad Name is required.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM teams WHERE LOWER(team_name) = LOWER(?)').get(teamName.trim());
  if (existing) {
    res.status(400).json({ success: false, message: 'A squad with this name already exists.' });
    return;
  }

  // Cryptographically secure password generation avoiding weak PRNG Math.random (SonarQube S2245)
  const generatedPassword = password?.trim() || `SQUAD#${crypto.randomInt(1000, 10000)}`;
  const { hash, salt } = hashPassword(generatedPassword);
  const teamId = 'team-' + crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO teams (id, team_name, password_hash, salt, raw_password, is_paused, score, max_credits, total_credits, login_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 0, 0, 500, 500, 0, ?, ?)
  `).run(teamId, teamName.trim(), hash, salt, generatedPassword, now, now);

  const stages = [
    { id: 1, name: 'The Unknown Challenge', max: 100, status: 'NOT CONFIGURED' },
    { id: 2, name: 'The Haunted Image Hunt', max: 150, status: 'AVAILABLE' },
    { id: 3, name: 'The Forgotten Graveyard', max: 250, status: 'LOCKED' },
  ];

  for (const st of stages) {
    db.prepare(`
      INSERT INTO stages_progress (id, team_id, stage_id, stage_name, status, score, max_score, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(`stg-${teamId}-${st.id}`, teamId, st.id, st.name, st.status, st.max, now, now);
  }

  res.status(201).json({
    success: true,
    team: {
      id: teamId,
      teamName: teamName.trim(),
      password: generatedPassword,
      score: 0,
      isPaused: false,
      loginCount: 0,
    },
  });
});

// PUT /api/admin/teams/:id (Edit Squad)
adminRouter.put('/teams/:id', requireAdminAuth, (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { teamName, password, score } = req.body;

  const team = db.prepare('SELECT id, raw_password, score FROM teams WHERE id = ?').get(id) as { id: string; raw_password: string; score: number } | undefined;
  if (!team) {
    res.status(404).json({ success: false, message: 'Squad not found.' });
    return;
  }

  const now = new Date().toISOString();
  let updatedPassword = team.raw_password;

  const trimmedPassword = password?.trim();
  if (trimmedPassword && trimmedPassword !== team.raw_password) {
    updatedPassword = trimmedPassword;
    const { hash, salt } = hashPassword(updatedPassword);
    db.prepare('UPDATE teams SET password_hash = ?, salt = ?, raw_password = ? WHERE id = ?').run(hash, salt, updatedPassword, id);
  }

  const updatedScore = typeof score === 'number' ? score : team.score;
  const updatedName = teamName?.trim();

  if (updatedName) {
    db.prepare('UPDATE teams SET team_name = ?, score = ?, updated_at = ? WHERE id = ?').run(updatedName, updatedScore, now, id);
  } else {
    db.prepare('UPDATE teams SET score = ?, updated_at = ? WHERE id = ?').run(updatedScore, now, id);
  }

  eventBus.broadcastToTeam(id, 'TEAM_UPDATED', { id, score: updatedScore });

  res.json({ success: true, message: 'Squad updated successfully.' });
});

// DELETE /api/admin/teams/:id
adminRouter.delete('/teams/:id', requireAdminAuth, (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'Squad ID is required.' });
    return;
  }

  const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(id);
  if (!team) {
    res.status(404).json({ success: false, message: 'Squad not found.' });
    return;
  }

  db.prepare('DELETE FROM teams WHERE id = ?').run(id);
  res.json({ success: true, message: 'Squad deleted.' });
});

// POST /api/admin/teams/:id/pause
adminRouter.post('/teams/:id/pause', requireAdminAuth, (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'Squad ID is required.' });
    return;
  }

  const team = db.prepare('SELECT is_paused FROM teams WHERE id = ?').get(id) as { is_paused: number } | undefined;
  if (!team) {
    res.status(404).json({ success: false, message: 'Squad not found.' });
    return;
  }

  const newStatus = team.is_paused === 1 ? 0 : 1;
  db.prepare('UPDATE teams SET is_paused = ?, updated_at = ? WHERE id = ?').run(newStatus, new Date().toISOString(), id);

  eventBus.broadcastToTeam(id, 'TEAM_UPDATED', { id, isPaused: newStatus === 1 });

  res.json({ success: true, isPaused: newStatus === 1 });
});

// POST /api/admin/teams/:id/reset-password
adminRouter.post('/teams/:id/reset-password', requireAdminAuth, (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'Squad ID is required.' });
    return;
  }

  const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(id);
  if (!team) {
    res.status(404).json({ success: false, message: 'Squad not found.' });
    return;
  }

  // Cryptographically secure password generation avoiding weak PRNG Math.random (SonarQube S2245)
  const newPassword = `RITUAL#${crypto.randomInt(1000, 10000)}`;
  const { hash, salt } = hashPassword(newPassword);

  db.prepare('UPDATE teams SET password_hash = ?, salt = ?, raw_password = ?, updated_at = ? WHERE id = ?')
    .run(hash, salt, newPassword, new Date().toISOString(), id);

  res.json({ success: true, newPassword });
});

// GET /api/admin/rounds/status
adminRouter.get('/rounds/status', requireAdminAuth, (_req, res) => {
  const round = db.prepare('SELECT * FROM global_round_state WHERE round_id = 1').get() as {
    is_active: number;
    duration_seconds: number;
    start_time: string;
  } | undefined;

  if (!round) {
    res.status(404).json({ success: false, message: 'Round 1 state not found.' });
    return;
  }

  res.json({ success: true, round: { isActive: round.is_active === 1, durationSeconds: round.duration_seconds, startTime: round.start_time } });
});

// POST /api/admin/rounds/toggle
adminRouter.post('/rounds/toggle', requireAdminAuth, (_req, res) => {
  const round = db.prepare('SELECT is_active FROM global_round_state WHERE round_id = 1').get() as { is_active: number } | undefined;
  if (!round) {
    res.status(404).json({ success: false, message: 'Round 1 state not found.' });
    return;
  }

  const newActive = round.is_active === 1 ? 0 : 1;
  db.prepare('UPDATE global_round_state SET is_active = ?, updated_at = ? WHERE round_id = 1').run(newActive, new Date().toISOString());

  eventBus.broadcastAll('ROUND_STATUS', { roundId: 1, isActive: newActive === 1 });

  res.json({ success: true, isActive: newActive === 1 });
});

// GET /api/admin/results (Leaderboard)
adminRouter.get('/results', (_req, res) => {
  const teams = db.prepare(`
    SELECT t.id, t.team_name as teamName, t.score, t.max_credits as maxCredits, t.last_login_at,
           (SELECT COUNT(*) FROM stages_progress sp WHERE sp.team_id = t.id AND sp.status = 'COMPLETED') as completedStages
    FROM teams t
    WHERE t.is_paused = 0
    ORDER BY t.score DESC, t.last_login_at ASC
  `).all();

  res.json({ success: true, results: teams });
});

// POST /api/admin/logout
adminRouter.post('/logout', (req: AuthenticatedRequest, res) => {
  const token = req.cookies?.fc_admin_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token) {
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
  }
  res.clearCookie('fc_admin_token');
  res.json({ success: true, message: 'Admin signed out successfully.' });
});
