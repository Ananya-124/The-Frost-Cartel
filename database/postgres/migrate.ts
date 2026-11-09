import 'dotenv/config';
import { Pool } from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPostgresPoolConfig } from './config.ts';
import { runMigrations } from './migration-runner.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to run PostgreSQL migrations.');

const pool = new Pool(createPostgresPoolConfig());

try {
  const applied = await runMigrations(pool, path.join(here, 'migrations'));
  for (const file of applied) console.log(`[migrate] applied ${file}`);
} finally {
  await pool.end();
}
