import { Router } from 'express';
import * as crypto from 'node:crypto';
import { db, verifyPassword } from '../../database/db.ts';
import { requireTeamAuth, type AuthenticatedRequest } from '../middleware/auth.ts';

export const authRouter = Router();

authRouter.post('/team-login', (req, res) => {
  const { teamName, password } = req.body;

  if (!teamName || !password) {
    res.status(400).json({ success: false, message: 'Squad Name and Ritual Password are required.' });
    return;
  }

  const team = db.prepare(`
    SELECT id, team_name as teamName, password_hash, salt, is_paused as isPaused, score, max_credits as maxCredits, total_credits as totalCredits, login_count
    FROM teams
    WHERE LOWER(team_name) = LOWER(?)
  `).get(teamName.trim()) as {
    id: string;
    teamName: string;
    password_hash: string;
    salt: string;
    isPaused: number;
    score: number;
    maxCredits: number;
    totalCredits: number;
    login_count: number;
  } | undefined;

  if (!team) {
    res.status(401).json({ success: false, message: 'Invalid Squad Name or password.' });
    return;
  }

  const isValid = verifyPassword(password, team.password_hash, team.salt);
  if (!isValid) {
    res.status(401).json({ success: false, message: 'Invalid Squad Name or password.' });
    return;
  }

  if (team.isPaused) {
    res.status(403).json({ success: false, message: 'This squad has been temporarily paused by Game Masters.' });
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const token = 'squad_' + crypto.randomBytes(32).toString('hex');
  const playerNumber = (team.login_count % 2) + 1;

  // Insert session
  const sessionId = 'tsess-' + crypto.randomUUID();
  db.prepare(`
    INSERT INTO team_sessions (id, team_id, token, player_number, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(sessionId, team.id, token, playerNumber, expiresAt, now.toISOString());

  // Update team login count
  db.prepare(`
    UPDATE teams
    SET login_count = login_count + 1, last_login_at = ?, updated_at = ?
    WHERE id = ?
  `).run(now.toISOString(), now.toISOString(), team.id);

  // Log activity
  db.prepare(`
    INSERT INTO activity_history (id, team_id, action, details, created_at)
    VALUES (?, ?, 'LOGIN', ?, ?)
  `).run('act-' + crypto.randomUUID(), team.id, `Player ${playerNumber} authenticated to squad portal`, now.toISOString());

  // Set HTTP cookie as well as return JSON token
  res.cookie('fc_team_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    token,
    playerNumber,
    team: {
      id: team.id,
      teamName: team.teamName,
      score: team.score,
      maxCredits: team.maxCredits,
      totalCredits: team.totalCredits,
      isPaused: team.isPaused === 1,
    },
  });
});

authRouter.get('/session', requireTeamAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    team: req.team,
    playerNumber: req.playerNumber,
  });
});

authRouter.post('/logout', (req: AuthenticatedRequest, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.cookies?.fc_team_token;
  if (token) {
    db.prepare('DELETE FROM team_sessions WHERE token = ?').run(token);
  }
  res.clearCookie('fc_team_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});
