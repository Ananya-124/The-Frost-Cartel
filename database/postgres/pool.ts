import 'dotenv/config';
import { Pool } from 'pg';
import { createPostgresPoolConfig } from './config.ts';

function createPostgresPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  const pool = new Pool(createPostgresPoolConfig());
  pool.on('error', (err) => {
    // Idle clients in the pool can be disconnected or reset by cloud poolers (e.g. Supabase, AWS).
    // An error listener is mandatory in pg to prevent unhandled 'error' events from terminating the process.
    console.warn('[PostgreSQL Pool] Idle client notice:', err.message);
  });
  return pool;
}

/** PostgreSQL connection pool for the staged migration to repository-backed services. */
export const postgresPool = createPostgresPool();
