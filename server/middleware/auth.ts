import type { Request, Response, NextFunction } from 'express';
import { db } from '../../database/db.ts';

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    username: string;
    role: string;
    mustChangePassword: boolean;
  };
  team?: {
    id: string;
    teamName: string;
    score: number;
    maxCredits: number;
    isPaused: boolean;
  };
  playerNumber?: number;
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.fc_admin_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. No session token provided.' });
    return;
  }

  const stmt = db.prepare(`
    SELECT a.id, a.username, a.role, a.must_change_password as mustChangePassword, s.expires_at
    FROM admin_sessions s
    JOIN admins a ON s.admin_id = a.id
    WHERE s.token = ?
  `);

  const session = stmt.get(token) as {
    id: string;
    username: string;
    role: string;
    mustChangePassword: number;
    expires_at: string;
  } | undefined;

  if (!session) {
    res.status(401).json({ success: false, message: 'Invalid or expired admin session token.' });
    return;
  }

  if (new Date(session.expires_at) < new Date()) {
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
    res.status(401).json({ success: false, message: 'Admin session expired. Please sign in again.' });
    return;
  }

  req.admin = {
    id: session.id,
    username: session.username,
    role: session.role,
    mustChangePassword: Boolean(session.mustChangePassword),
  };

  next();
}

export function requireTeamAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.cookies?.fc_team_token;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. No squad token provided.' });
    return;
  }

  const stmt = db.prepare(`
    SELECT t.id, t.team_name as teamName, t.score, t.max_credits as maxCredits, t.is_paused as isPaused, s.player_number as playerNumber, s.expires_at
    FROM team_sessions s
    JOIN teams t ON s.team_id = t.id
    WHERE s.token = ?
  `);

  const session = stmt.get(token) as {
    id: string;
    teamName: string;
    score: number;
    maxCredits: number;
    isPaused: number;
    playerNumber: number;
    expires_at: string;
  } | undefined;

  if (!session) {
    res.status(401).json({ success: false, message: 'Invalid squad session.' });
    return;
  }

  if (session.isPaused) {
    res.status(403).json({ success: false, message: 'Squad has been temporarily paused by the Game Masters.' });
    return;
  }

  req.team = {
    id: session.id,
    teamName: session.teamName,
    score: session.score,
    maxCredits: session.maxCredits,
    isPaused: Boolean(session.isPaused),
  };
  req.playerNumber = session.playerNumber;

  next();
}
