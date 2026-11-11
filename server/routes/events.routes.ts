import { Router } from 'express';
import * as crypto from 'node:crypto';
import { postgresPool } from '../../database/postgres/pool.ts';
import { eventBus } from '../services/eventBus.ts';

export const eventsRouter = Router();

eventsRouter.get('/stream', async (req, res) => {
  const token = (req.query.token as string) || req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.cookies?.fc_team_token;

  let teamId: string | undefined;

  if (token) {
    if (!postgresPool) { res.status(503).json({ success: false, message: 'Authentication service is unavailable.' }); return; }
    const session = await postgresPool.query<{ team_id: string }>(
      'SELECT team_id FROM team_sessions WHERE token=$1 AND expires_at>now()', [token]);
    if (!session.rowCount) { res.status(401).json({ success: false, message: 'Invalid or expired squad session.' }); return; }
    teamId = session.rows[0].team_id;
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const clientId = crypto.randomUUID();
  eventBus.addClient({ id: clientId, teamId, res });

  // Send initial connection acknowledgement
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ clientId, teamId, timestamp: new Date().toISOString() })}\n\n`);

  // Heartbeat interval
  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    eventBus.removeClient(clientId);
  });
});

