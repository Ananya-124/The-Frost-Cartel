import { Router } from 'express';
import * as crypto from 'node:crypto';
import { db } from '../../database/db.ts';
import { eventBus } from '../services/eventBus.ts';

export const eventsRouter = Router();

eventsRouter.get('/stream', (req, res) => {
  const token = (req.query.token as string) || req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.cookies?.fc_team_token;

  let teamId: string | undefined;

  if (token) {
    const session = db.prepare('SELECT team_id FROM team_sessions WHERE token = ?').get(token) as { team_id: string } | undefined;
    if (session) {
      teamId = session.team_id;
    }
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true',
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

