import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { initDatabase } from '../database/db.ts';
import { authRouter } from './routes/auth.routes.ts';
import { adminRouter } from './routes/admin.routes.ts';
import { round1Router } from './routes/round1.routes.ts';
import { eventsRouter } from './routes/events.routes.ts';
import { round2Router } from './routes/round2.routes.ts';
import { round3Router } from './routes/round3.routes.ts';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3001;

// Security hardening: Disable X-Powered-By header to prevent technology disclosure (SonarQube S5689)
app.disable('x-powered-by');

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Strict origin validation preventing permissive CORS reflection with credentials (SonarQube S5122)
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.has(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    game: 'FROST CARTEL Authoritative Server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/round1', round1Router);
app.use('/api/events', eventsRouter);
app.use('/api/round2', round2Router);
app.use('/api/round3', round3Router);

// Database initialization
initDatabase();

// Start server if executed directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(PORT), () => {
    console.log(`[FROST CARTEL] Authoritative Backend listening on http://127.0.0.1:${PORT}`);
  });
}
