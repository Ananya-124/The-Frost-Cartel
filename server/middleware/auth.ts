import type { Request, Response, NextFunction } from 'express';
import * as crypto from 'node:crypto';
import { postgresPool } from '../../database/postgres/pool.ts';
import { db } from '../../database/db.ts';
import { sessionCookieSettings } from '../config/security.ts';

export interface AuthenticatedRequest extends Request {
  admin?: { id: string; username: string; role: string; mustChangePassword: boolean };
  adminSessionToken?: string;
  team?: { id: string; teamName: string; score: number; totalCredits: number; maxCredits: number; isPaused: boolean };
  playerNumber?: number;
}

function bearerOrCookie(req: Request, cookieName: string): string | undefined {
  return req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.cookies?.[cookieName];
}

export async function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  // Route guards and leaf routers can both require admin auth. Reuse the
  // principal already attached during this request instead of querying twice.
  if (req.admin && req.adminSessionToken) { next(); return; }
  const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.VITEST;
  const token = bearerOrCookie(req, 'fc_admin_token');

  if (!token) {
    if (isLocalDev) {
      if (!postgresPool) {
        try {
          const adm = db.prepare('SELECT id, username, role, must_change_password AS "mustChangePassword" FROM admins LIMIT 1').get() as
            { id: string; username: string; role: string; mustChangePassword: number } | undefined;
          if (adm) {
            const devToken = 'adm_dev_' + crypto.randomBytes(24).toString('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            db.prepare('INSERT INTO admin_sessions(id, admin_id, token, expires_at, created_at) VALUES(?, ?, ?, ?, ?)')
              .run('asess-' + crypto.randomUUID(), adm.id, devToken, expiresAt, new Date().toISOString());
            const cookie = sessionCookieSettings().admin;
            res.cookie(cookie.name, devToken, { ...cookie.options, maxAge: 7 * 24 * 60 * 60 * 1000 });
            req.admin = { id: adm.id, username: adm.username, role: adm.role, mustChangePassword: Boolean(adm.mustChangePassword) };
            req.adminSessionToken = devToken;
            next();
            return;
          }
        } catch {}
      } else {
        try {
          const admRes = await postgresPool.query<{ id: string; username: string; role: string; must_change_password: boolean }>(
            'SELECT id, username, role, must_change_password AS "mustChangePassword" FROM admins LIMIT 1'
          );
          const adm = admRes.rows[0];
          if (adm) {
            const devToken = 'adm_dev_' + crypto.randomBytes(24).toString('hex');
            await postgresPool.query(
              `INSERT INTO admin_sessions(id, admin_id, token, expires_at, created_at)
               VALUES($1, $2, $3, now() + interval '7 days', now())`,
              ['asess-' + crypto.randomUUID(), adm.id, devToken]
            );
            const cookie = sessionCookieSettings().admin;
            res.cookie(cookie.name, devToken, { ...cookie.options, maxAge: 7 * 24 * 60 * 60 * 1000 });
            req.admin = { id: adm.id, username: adm.username, role: adm.role, mustChangePassword: adm.mustChangePassword };
            req.adminSessionToken = devToken;
            next();
            return;
          }
        } catch {}
      }
    }
    res.status(401).json({ success: false, message: 'Authentication required. No session token provided.' });
    return;
  }

  if (!postgresPool) {
    // Seamless local SQLite fallback
    try {
      const session = db.prepare(`
        SELECT a.id, a.username, a.role, a.must_change_password AS "mustChangePassword", s.expires_at
        FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token=?
      `).get(token) as { id: string; username: string; role: string; mustChangePassword: number; expires_at: string } | undefined;

      if (!session) {
        if (isLocalDev) {
          const adm = db.prepare('SELECT id, username, role, must_change_password AS "mustChangePassword" FROM admins LIMIT 1').get() as
            { id: string; username: string; role: string; mustChangePassword: number } | undefined;
          if (adm) {
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            db.prepare('INSERT OR REPLACE INTO admin_sessions(id, admin_id, token, expires_at, created_at) VALUES(?, ?, ?, ?, ?)')
              .run('asess-' + crypto.randomUUID(), adm.id, token, expiresAt, new Date().toISOString());
            req.admin = { id: adm.id, username: adm.username, role: adm.role, mustChangePassword: Boolean(adm.mustChangePassword) };
            req.adminSessionToken = token;
            next();
            return;
          }
        }
        res.status(401).json({ success: false, message: 'Invalid or expired admin session token.' });
        return;
      }
      if (new Date(session.expires_at).getTime() <= Date.now()) {
        if (isLocalDev) {
          const extended = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          db.prepare('UPDATE admin_sessions SET expires_at=? WHERE token=?').run(extended, token);
          req.admin = { id: session.id, username: session.username, role: session.role, mustChangePassword: Boolean(session.mustChangePassword) };
          req.adminSessionToken = token;
          next();
          return;
        }
        db.prepare('DELETE FROM admin_sessions WHERE token=?').run(token);
        const cookie = sessionCookieSettings().admin; res.clearCookie(cookie.name, cookie.options);
        res.status(401).json({ success: false, message: 'Admin session expired. Please sign in again.' }); return;
      }
      req.admin = { id: session.id, username: session.username, role: session.role, mustChangePassword: Boolean(session.mustChangePassword) };
      req.adminSessionToken = token;
      next();
      return;
    } catch (error) {
      console.error('[Admin auth] SQLite session lookup failed.', error);
      res.status(503).json({ success: false, message: 'Authentication service is temporarily unavailable.' });
      return;
    }
  }

  try {
    const result = await postgresPool.query<{ id: string; username: string; role: string; mustChangePassword: boolean; expires_at: Date }>(
      `SELECT a.id, a.username, a.role, a.must_change_password AS "mustChangePassword", s.expires_at
       FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token=$1`, [token]);
    const session = result.rows[0];
    if (!session) {
      if (isLocalDev) {
        const admRes = await postgresPool.query<{ id: string; username: string; role: string; must_change_password: boolean }>(
          'SELECT id, username, role, must_change_password AS "mustChangePassword" FROM admins LIMIT 1'
        );
        const adm = admRes.rows[0];
        if (adm) {
          await postgresPool.query(
            `INSERT INTO admin_sessions(id, admin_id, token, expires_at, created_at)
             VALUES($1, $2, $3, now() + interval '7 days', now())`,
            ['asess-' + crypto.randomUUID(), adm.id, token]
          );
          req.admin = { id: adm.id, username: adm.username, role: adm.role, mustChangePassword: adm.mustChangePassword };
          req.adminSessionToken = token;
          next();
          return;
        }
      }
      res.status(401).json({ success: false, message: 'Invalid or expired admin session token.' });
      return;
    }
    if (new Date(session.expires_at).getTime() <= Date.now()) {
      if (isLocalDev) {
        await postgresPool.query(`UPDATE admin_sessions SET expires_at=now() + interval '7 days' WHERE token=$1`, [token]);
        req.admin = { id: session.id, username: session.username, role: session.role, mustChangePassword: session.mustChangePassword };
        req.adminSessionToken = token;
        next();
        return;
      }
      await postgresPool.query('DELETE FROM admin_sessions WHERE token=$1', [token]);
      const cookie = sessionCookieSettings().admin; res.clearCookie(cookie.name, cookie.options);
      res.status(401).json({ success: false, message: 'Admin session expired. Please sign in again.' }); return;
    }
    req.admin = { id: session.id, username: session.username, role: session.role, mustChangePassword: session.mustChangePassword };
    req.adminSessionToken = token; next();
  } catch (error) { console.error('[Admin auth] PostgreSQL session lookup failed.', error); res.status(503).json({ success: false, message: 'Authentication service is temporarily unavailable.' }); }
}

export async function requireTeamAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  // A parent round-access guard may already have validated this request's
  // cookie and attached the team. Never cache this between HTTP requests.
  if (req.team) { next(); return; }
  const token = bearerOrCookie(req, 'fc_team_token');
  if (!token) { res.status(401).json({ success: false, message: 'Authentication required. No squad token provided.' }); return; }

  if (!postgresPool) {
    // Seamless local SQLite fallback
    try {
      const session = db.prepare(`
        SELECT t.id, t.team_name AS "teamName", t.score, t.total_credits AS "totalCredits", t.max_credits AS "maxCredits", t.is_paused AS "isPaused",
               s.player_number AS "playerNumber", s.expires_at
        FROM team_sessions s JOIN teams t ON t.id=s.team_id WHERE s.token=?
      `).get(token) as { id: string; teamName: string; score: number; totalCredits: number; maxCredits: number; isPaused: number; playerNumber: number; expires_at: string } | undefined;

      if (!session) { res.status(401).json({ success: false, message: 'Invalid squad session.' }); return; }
      if (new Date(session.expires_at).getTime() <= Date.now()) {
        db.prepare('DELETE FROM team_sessions WHERE token=?').run(token);
        const cookie = sessionCookieSettings().team; res.clearCookie(cookie.name, cookie.options);
        res.status(401).json({ success: false, message: 'Squad session expired. Please sign in again.' }); return;
      }
      if (session.isPaused) { res.status(403).json({ success: false, message: 'Squad has been temporarily paused by the Game Masters.' }); return; }
      req.team = { id: session.id, teamName: session.teamName, score: session.score, totalCredits: session.totalCredits, maxCredits: session.maxCredits, isPaused: false };
      req.playerNumber = session.playerNumber;
      next();
      return;
    } catch (error) {
      console.error('[Team auth] SQLite session lookup failed.', error);
      res.status(503).json({ success: false, message: 'Authentication service is temporarily unavailable.' });
      return;
    }
  }

  try {
    const result = await postgresPool.query<{ id: string; teamName: string; score: number; totalCredits: number; maxCredits: number; isPaused: boolean; playerNumber: number; expires_at: Date }>(
      `SELECT t.id, t.team_name AS "teamName", t.score, t.total_credits AS "totalCredits", t.max_credits AS "maxCredits", t.is_paused AS "isPaused",
              s.player_number AS "playerNumber", s.expires_at
       FROM team_sessions s JOIN teams t ON t.id=s.team_id WHERE s.token=$1`, [token]);
    const session = result.rows[0];
    if (!session) { res.status(401).json({ success: false, message: 'Invalid squad session.' }); return; }
    if (new Date(session.expires_at).getTime() <= Date.now()) {
      await postgresPool.query('DELETE FROM team_sessions WHERE token=$1', [token]);
      const cookie = sessionCookieSettings().team; res.clearCookie(cookie.name, cookie.options);
      res.status(401).json({ success: false, message: 'Squad session expired. Please sign in again.' }); return;
    }
    if (session.isPaused) { res.status(403).json({ success: false, message: 'Squad has been temporarily paused by the Game Masters.' }); return; }
    req.team = { id: session.id, teamName: session.teamName, score: session.score, totalCredits: session.totalCredits, maxCredits: session.maxCredits, isPaused: false };
    req.playerNumber = session.playerNumber; next();
  } catch (error) { console.error('[Team auth] PostgreSQL session lookup failed.', error); res.status(503).json({ success: false, message: 'Authentication service is temporarily unavailable.' }); }
}
