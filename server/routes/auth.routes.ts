import { Router } from 'express';
import * as crypto from 'node:crypto';
import { postgresPool } from '../../database/postgres/pool.ts';
import { verifyPassword } from '../auth/password.ts';
import { requireTeamAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { sessionCookieSettings } from '../config/security.ts';

export const authRouter = Router();

authRouter.post('/team-login', async (req, res) => {
  const { teamName, password } = req.body ?? {};
  if (typeof teamName !== 'string' || !teamName.trim() || typeof password !== 'string' || !password) {
    res.status(400).json({ success: false, message: 'Squad Name and Ritual Password are required.' }); return;
  }
  if (!postgresPool) { res.status(503).json({ success: false, message: 'Authentication service is unavailable.' }); return; }
  const client = await postgresPool.connect();
  try {
    const found = await client.query<{ id: string; teamName: string; password_hash: string; salt: string; isPaused: boolean; score: number; maxCredits: number; totalCredits: number; login_count: number }>(
      `SELECT id, team_name AS "teamName", password_hash, salt, is_paused AS "isPaused", score,
              max_credits AS "maxCredits", total_credits AS "totalCredits", login_count
       FROM teams WHERE lower(team_name)=lower($1)`, [teamName.trim()]);
    const team = found.rows[0];
    if (!team || !verifyPassword(password, team.password_hash, team.salt)) {
      res.status(401).json({ success: false, message: 'Invalid Squad Name or password.' }); return;
    }
    if (team.isPaused) { res.status(403).json({ success: false, message: 'This squad has been temporarily paused by Game Masters.' }); return; }
    const token = 'squad_' + crypto.randomBytes(32).toString('hex');
    const sessionId = 'tsess-' + crypto.randomUUID();
    await client.query('BEGIN');
    const updated = await client.query<{ previous_count: number }>(
      'UPDATE teams SET login_count=login_count+1, last_login_at=now(), updated_at=now() WHERE id=$1 RETURNING login_count-1 AS previous_count', [team.id]);
    const playerNumber = (updated.rows[0].previous_count % 2) + 1;
    await client.query(`INSERT INTO team_sessions(id,team_id,token,player_number,expires_at)
      VALUES($1,$2,$3,$4,now()+interval '24 hours')`, [sessionId, team.id, token, playerNumber]);
    await client.query(`INSERT INTO activity_history(id,team_id,action,details)
      VALUES($1,$2,'LOGIN',$3::jsonb)`, ['act-' + crypto.randomUUID(), team.id, JSON.stringify({ message: `Player ${playerNumber} authenticated to squad portal` })]);
    await client.query('COMMIT');
    const cookie = sessionCookieSettings().team;
    res.cookie(cookie.name, token, { ...cookie.options, maxAge: 24 * 60 * 60 * 1000 });
    res.json({ success: true, token, playerNumber, team: { id: team.id, teamName: team.teamName, score: team.score, maxCredits: team.maxCredits, totalCredits: team.totalCredits, isPaused: false } });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.error('[Team login] PostgreSQL operation failed.', error);
    res.status(503).json({ success: false, message: 'Authentication service is temporarily unavailable.' });
  } finally { client.release(); }
});

authRouter.get('/session', requireTeamAuth, (req: AuthenticatedRequest, res) => {
  res.json({ success: true, team: req.team, playerNumber: req.playerNumber });
});

authRouter.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.cookies?.fc_team_token;
  if (token && postgresPool) await postgresPool.query('DELETE FROM team_sessions WHERE token=$1', [token]);
  const cookie = sessionCookieSettings().team;
  res.clearCookie(cookie.name, cookie.options);
  res.json({ success: true, message: 'Logged out successfully.' });
});
