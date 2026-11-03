import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { initDatabase } from '../database/db.ts';
import { authRouter } from './routes/auth.routes.ts';
import { adminRouter } from './routes/admin.routes.ts';
import { round1Router } from './routes/round1.routes.ts';
import { eventsRouter } from './routes/events.routes.ts';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost frontend dev servers and same-origin
      if (!origin || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
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

// Database initialization
initDatabase();

// Start server if executed directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[FROST CARTEL] Authoritative Backend listening on http://127.0.0.1:${PORT}`);
  });
}
