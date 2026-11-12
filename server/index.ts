import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { postgresPool } from '../database/postgres/pool.ts';
import { ensureBootstrapAdmin } from '../database/postgres/bootstrapAdmin.ts';
import { authRouter } from './routes/auth.routes.ts';
import { adminRouter } from './routes/admin.routes.ts';
import { leaderboardRouter } from './routes/leaderboard.routes.ts';
import { round1Router } from './routes/round1.routes.ts';
import { round2Router, startRound2AuctionTimer } from './routes/round2.routes.ts';
import { round3Router } from './routes/round3.routes.ts';
import { round4Router } from './routes/round4.routes.ts';
import { eventsRouter } from './routes/events.routes.ts';
import { adminProgressionRouter, progressionRouter, roundAccessGuard } from './routes/progression.routes.ts';
import { createCorsOptions } from './config/security.ts';
import { requestTimingMiddleware } from './middleware/requestTiming.ts';

export const app = express();
const PORT = process.env.PORT || 3001;

// Security hardening: Disable X-Powered-By header to prevent technology disclosure (SonarQube S5689)
app.disable('x-powered-by');

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Exact origin allowlist; no-origin requests remain available for CLI/server health checks.
const corsMiddleware = cors(createCorsOptions());
app.use(corsMiddleware);
app.options('*', corsMiddleware);
app.use(requestTimingMiddleware);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    game: 'FROST CARTEL Authoritative Server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Readiness requires the PostgreSQL schema used by all persistent game services.
app.get('/api/ready', async (_req, res) => {
  let postgresReady = false;
  let migrationsReady = false;
  try {
    if (!postgresPool) throw new Error('PostgreSQL pool is not configured.');
    const applied = await postgresPool.query<{ version: string }>('SELECT version FROM schema_migrations');
    postgresReady = true;
    const requiredMigrations = [
      '001_foundation.sql', '002_seed_catalog.sql', '003_team_progression.sql',
      '004_round1_and_shared_ledgers.sql', '005_round2_auction.sql',
      '006_round3_state.sql', '007_round4_expedition.sql', '008_round1_prelaunch_default.sql',
      '009_round1_configuration.sql', '010_round2_admin_audit.sql',
      '011_round3_timer_initialization.sql', '012_round4_catalog_seed.sql',
    ];
    const appliedVersions = new Set(applied.rows.map(({ version }) => version));
    const missing = requiredMigrations.filter((version) => !appliedVersions.has(version));
    if (missing.length) {
      return res.status(503).json({ status: 'not_ready', message: `Required PostgreSQL migrations are missing: ${missing.join(', ')}.`, checks: { postgres: 'reachable', migrations: 'incomplete' } });
    }
    await postgresPool.query('SELECT 1 FROM round_progress LIMIT 0');
    migrationsReady = true;
    return res.json({ status: 'ready', checks: { postgres: 'ready', migrations: 'ready' } });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const message = code === '42P01'
      ? 'PostgreSQL migrations have not been applied.'
      : !postgresReady
      ? 'PostgreSQL is not configured or unavailable.'
      : 'A required PostgreSQL table is unavailable.';
    return res.status(503).json({ status: 'not_ready', message, checks: { postgres: postgresReady ? 'reachable' : 'unavailable', migrations: migrationsReady ? 'ready' : 'incomplete' } });
  }
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/progression', progressionRouter);
app.use('/api/admin/progression', adminProgressionRouter);
app.use('/api/round1', roundAccessGuard(1));
app.use('/api/round1', round1Router);
app.use('/api/round2', roundAccessGuard(2));
app.use('/api/round2', round2Router);
app.use('/api/round3', roundAccessGuard(3));
app.use('/api/round3', round3Router);
app.use('/api/round4', roundAccessGuard(4));
app.use('/api/round4', round4Router);
app.use('/api/events', eventsRouter);

// Serve static assets from public and dist bundles
app.use(express.static('public'));
app.use(express.static('dist'));

// Start server if executed directly
if (process.env.NODE_ENV !== 'test') {
  const start = async () => {
    if (process.env.NODE_ENV === 'production' || process.env.ADMIN_BOOTSTRAP_USER || process.env.ADMIN_BOOTSTRAP_PASSWORD) {
      if (!postgresPool) throw new Error('DATABASE_URL is required to bootstrap PostgreSQL administrator authentication.');
      await ensureBootstrapAdmin(postgresPool);
    }
    if (postgresPool) startRound2AuctionTimer(postgresPool);
    app.listen(Number(PORT), () => console.log(`[FROST CARTEL] Authoritative Backend listening on http://127.0.0.1:${PORT}`));
  };
  void start().catch((error: unknown) => {
    console.error('[FROST CARTEL] Backend startup failed; server was not started.', error);
    process.exitCode = 1;
  });
}
