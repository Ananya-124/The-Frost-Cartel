import 'dotenv/config';
import { Pool } from 'pg';
import { createPostgresPoolConfig } from './config.ts';

/** PostgreSQL connection pool for the staged migration to repository-backed services. */
export const postgresPool = process.env.DATABASE_URL
  ? new Pool(createPostgresPoolConfig())
  : null;
