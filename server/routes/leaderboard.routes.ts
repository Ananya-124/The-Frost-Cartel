import { Router } from 'express';
import { postgresPool } from '../../database/postgres/pool.ts';
import { getLeaderboard } from '../../database/postgres/ledger.ts';

export const leaderboardRouter = Router();

/** Public read-only leaderboard, sourced from the official PostgreSQL score view. */
leaderboardRouter.get('/', async (req, res) => {
  if (!postgresPool) { res.status(503).json({ success: false, message: 'Leaderboard service is unavailable.' }); return; }
  const rawLimit = req.query.limit;
  const rawOffset = req.query.offset;
  const limit = rawLimit === undefined ? 100 : Number(rawLimit);
  const offset = rawOffset === undefined ? 0 : Number(rawOffset);
  try {
    const leaderboard = await getLeaderboard(postgresPool, limit, offset);
    res.json({ success: true, leaderboard });
  } catch (error) {
    if ((error as { code?: string }).code === 'INVALID') {
      res.status(400).json({ success: false, message: 'Leaderboard pagination is invalid.' });
      return;
    }
    throw error;
  }
});
