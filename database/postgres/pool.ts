import 'dotenv/config';
import { Pool } from 'pg';
import { createPostgresPoolConfig } from './config.ts';

function createPostgresPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  const pool = new Pool(createPostgresPoolConfig());

  // An error listener on pool is required so idle clients closed by Supabase don't cause an unhandled process crash.
  pool.on('error', (err) => {
    console.warn('[PostgreSQL Pool] Idle client notice:', err.message);
  });

  // Ensure individual pooled clients attach error listeners as well when acquired or connected
  pool.on('connect', (client) => {
    client.on('error', (err) => {
      console.warn('[PostgreSQL Client] Connection error handled safely:', err.message);
    });
  });

  return pool;
}

/** PostgreSQL connection pool for the staged migration to repository-backed services. */
export const postgresPool = createPostgresPool();
