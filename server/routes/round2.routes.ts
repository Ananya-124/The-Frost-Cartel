import { Router, type RequestHandler, type Response } from 'express';
import type { Pool } from 'pg';
import { postgresPool } from '../../database/postgres/pool.ts';
import {
  AuctionError, getAuctionOverview, getAuctionView, placeAuctionBid, settleActiveAuction,
  recordAuctionAdminAction, settleExpiredAuction, startAuctionLot,
} from '../../database/postgres/auction.ts';
import { isRound2AuctionEnabled } from '../config/auctionSecurity.ts';
import { requireAdminAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { eventBus } from '../services/eventBus.ts';

interface RouterOptions { pool?: Pool | null; startBackgroundJobs?: boolean; authenticateAdmin?: RequestHandler }

interface AuctionTimerOptions {
  checkEnabled?: (pool: Pool) => Promise<boolean>;
  settleExpired?: (pool: Pool) => Promise<unknown>;
  intervalMs?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  schedule?: typeof setTimeout;
  cancel?: typeof clearTimeout;
  onError?: (error: unknown) => void;
}

const auctionTimers = new WeakMap<Pool, () => void>();

/** Start one settlement poller only after PostgreSQL explicitly enables Round 2. */
export function startRound2AuctionTimer(pool: Pool, options: AuctionTimerOptions = {}): () => void {
  const existingStop = auctionTimers.get(pool);
  if (existingStop) return existingStop;

  const checkEnabled = options.checkEnabled ?? ((database) => isRound2AuctionEnabled(database));
  const settleExpired = options.settleExpired ?? settleExpiredAuction;
  const schedule = options.schedule ?? setTimeout;
  const cancel = options.cancel ?? clearTimeout;
  // Bid acceptance uses the authoritative lot deadline. Settlement polling is
  // only a cleanup trigger, so one DB check per second is sufficient.
  const intervalMs = options.intervalMs ?? 1_000;
  const initialBackoffMs = options.initialBackoffMs ?? 1_000;
  const maxBackoffMs = options.maxBackoffMs ?? 60_000;
  const onError = options.onError ?? ((error) => console.error('[Round 2 timer]', error));
  let stopped = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let backoffMs = initialBackoffMs;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (timeout !== undefined) cancel(timeout);
    timeout = undefined;
    if (auctionTimers.get(pool) === stop) auctionTimers.delete(pool);
  };

  const queue = (callback: () => void, delayMs: number) => {
    if (stopped) return;
    timeout = schedule(() => {
      timeout = undefined;
      callback();
    }, delayMs);
    timeout.unref?.();
  };

  const nextBackoff = () => {
    const current = backoffMs;
    backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
    return current;
  };

  const tick = async () => {
    if (stopped) return;
    try {
      const settled = await settleExpired(pool);
      if (settled) eventBus.broadcastAll('ROUND2_AUCTION_CHANGED', { reason: 'settled' });
      backoffMs = initialBackoffMs;
      queue(() => { void tick(); }, intervalMs);
    } catch (error) {
      onError(error);
      queue(() => { void tick(); }, nextBackoff());
    }
  };

  const initialize = async () => {
    if (stopped) return;
    try {
      const enabled = await checkEnabled(pool);
      if (stopped) return;
      if (!enabled) {
        stop();
        return;
      }
      backoffMs = initialBackoffMs;
      queue(() => { void tick(); }, intervalMs);
    } catch (error) {
      onError(error);
      queue(() => { void initialize(); }, nextBackoff());
    }
  };

  auctionTimers.set(pool, stop);
  void initialize();
  return stop;
}

const fail = (res: Response, error: unknown) => {
  if (error instanceof AuctionError) {
    const status = error.code === 'DISABLED' ? 503 : error.code === 'FORBIDDEN' ? 403
      : error.code === 'NOT_FOUND' ? 404 : error.code === 'INSUFFICIENT_CREDITS' ? 400
      : error.code === 'INVALID' ? 400 : 409;
    res.status(status).json({ success: false, message: error.message, code: error.code });
    return;
  }
  console.error('[Round 2 PostgreSQL auction]', error);
  res.status(503).json({ success: false, message: 'Round 2 auction service is temporarily unavailable.' });
};

function authenticatedTeam(req: AuthenticatedRequest): { id: string; teamName: string } {
  if (!req.team) throw new AuctionError('Squad authentication required.', 'FORBIDDEN');
  return req.team;
}

function authenticatedAdmin(req: AuthenticatedRequest): string {
  if (!req.admin) throw new AuctionError('Administrator session required.', 'FORBIDDEN');
  return req.admin.id;
}

/** Round 2 reads and writes are available only when the PostgreSQL singleton is enabled. */
export function createRound2Router(options: RouterOptions = {}) {
  const pool = options.pool === undefined ? postgresPool : options.pool;
  const router = Router();
  const asyncRoute = (handler: (req: AuthenticatedRequest, res: Response, pool: Pool) => Promise<unknown>): RequestHandler =>
    (req, res) => {
      if (!pool) { res.status(503).json({ success: false, message: 'Round 2 PostgreSQL service is unavailable.' }); return; }
      void handler(req as AuthenticatedRequest, res, pool).then((result) => {
        if (!res.headersSent && result !== undefined) res.json(result);
      }).catch((error: unknown) => fail(res, error));
    };
  if (pool) router.use('/admin', options.authenticateAdmin ?? requireAdminAuth);
  if (pool) router.use((req, res, next) => {
    // Admins can inspect the catalog and explicitly start the first lot while the
    // auction is disabled. The start transaction enables it atomically.
    if ((req.method === 'GET' && req.path === '/admin/overview') || (req.method === 'POST' && req.path === '/admin/start')) {
      next();
      return;
    }
    void isRound2AuctionEnabled(pool).then((enabled) => {
      if (!enabled) { res.status(503).json({ success: false, message: 'Round 2 auction is disabled.' }); return; }
      next();
    }).catch((error: unknown) => {
      console.error('[Round 2 gate] PostgreSQL configuration lookup failed.', error);
      res.status(503).json({ success: false, message: 'Round 2 availability could not be verified.' });
    });
  });
  else router.use((_req, res) => res.status(503).json({ success: false, message: 'Round 2 PostgreSQL service is unavailable.' }));

  if (options.startBackgroundJobs && pool) startRound2AuctionTimer(pool);

  router.get('/state', asyncRoute(async (req, _res, database) => {
    const team = authenticatedTeam(req);
    return getAuctionView(database, team.id);
  }));

  // Compatibility endpoint: client fields are deliberately ignored; identity and wallet come from the session and PostgreSQL.
  router.post('/join', asyncRoute(async (req, _res, database) => {
    const team = authenticatedTeam(req);
    return getAuctionView(database, team.id);
  }));

  router.post('/bid', asyncRoute(async (req, _res, database) => {
    const team = authenticatedTeam(req);
    const amount = Number(req.body?.amount);
    const requestId = req.body?.requestId;
    const bid = await placeAuctionBid(database, { teamId: team.id, amount, requestId });
    if (!bid.duplicate) eventBus.broadcastAll('ROUND2_AUCTION_CHANGED', { reason: 'bid' });
    return { ...(await getAuctionView(database, team.id)), bid: { id: bid.bidId, duplicate: bid.duplicate, minimumBid: bid.minimumBid } };
  }));

  router.get('/admin/overview', asyncRoute(async (_req, _res, database) => getAuctionOverview(database)));

  router.post('/admin/start', asyncRoute(async (req, res, database) => {
    const adminId = authenticatedAdmin(req);
    const cardId = Number(req.body?.cardId);
    const basePrice = req.body?.basePrice === undefined ? undefined : Number(req.body.basePrice);
    const durationSeconds = req.body?.durationSeconds === undefined ? undefined : Number(req.body.durationSeconds);
    const result = await startAuctionLot(database, { cardId, basePrice, durationSeconds }, adminId);
    startRound2AuctionTimer(database);
    eventBus.broadcastAll('ROUND2_AUCTION_CHANGED', { reason: 'started' });
    return res.json(result);
  }));

  router.post('/admin/end', asyncRoute(async (req, _res, database) => {
    const result = await settleActiveAuction(database, authenticatedAdmin(req));
    eventBus.broadcastAll('ROUND2_AUCTION_CHANGED', { reason: 'ended' });
    return result;
  }));

  // Historical auction transactions are immutable; these legacy maintenance operations cannot erase PostgreSQL records.
  router.post('/admin/reset', asyncRoute(async (req, _res, database) => {
    await recordAuctionAdminAction(database, authenticatedAdmin(req), 'RESET', { reason: 'History-preserving reset is not supported.' });
    throw new AuctionError('Auction history is immutable; reset is unavailable.', 'CONFLICT');
  }));
  router.delete('/admin/team/:name', asyncRoute(async (req, _res, database) => {
    const name = String(req.params.name ?? '');
    await recordAuctionAdminAction(database, authenticatedAdmin(req), 'REMOVE_TEAM', { teamName: name, reason: 'Team auction history cannot be removed.' });
    throw new AuctionError('Team auction history cannot be removed.', 'CONFLICT');
  }));

  return router;
}

export async function runRound2AuctionTimerTick(pool: Pool): Promise<void> {
  await settleExpiredAuction(pool);
}

// The production server starts the timer explicitly after startup; importing this router
// (including from tests) must not initiate database traffic.
export const round2Router = createRound2Router();
