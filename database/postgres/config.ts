import { readFileSync } from 'node:fs';
import type { PoolConfig } from 'pg';

export type PostgresEnvironment = NodeJS.ProcessEnv;

/** Build one shared pg configuration for the application and migration runner. */
export function createPostgresPoolConfig(env: PostgresEnvironment = process.env): PoolConfig {
  const connectionString = env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required for PostgreSQL.');

  const url = new URL(connectionString);
  const mode = (env.PGSSLMODE || 'verify-full').toLowerCase();
  const rootCertPath = env.PGSSLROOTCERT || url.searchParams.get('sslrootcert') || undefined;
  const rootCertContent = env.PGSSLROOTCERT_CONTENT;
  // pg-connection-string handles sslmode itself and may override the explicit
  // TLS options below. Consume these libpq parameters here so our policy wins.
  url.searchParams.delete('sslmode');
  url.searchParams.delete('sslrootcert');

  let ssl: PoolConfig['ssl'];
  switch (mode) {
    case 'disable':
      ssl = false;
      break;
    case 'require':
      // Encrypt traffic, without validating the server certificate.
      ssl = { rejectUnauthorized: false };
      break;
    case 'verify-ca':
      if (!rootCertPath && !rootCertContent) throw new Error('PGSSLROOTCERT or PGSSLROOTCERT_CONTENT is required when PGSSLMODE=verify-ca.');
      ssl = { ca: rootCertContent || readFileSync(rootCertPath!, 'utf8'), rejectUnauthorized: true, checkServerIdentity: () => undefined };
      break;
    case 'verify-full':
      if (!rootCertPath && !rootCertContent) throw new Error('PGSSLROOTCERT or PGSSLROOTCERT_CONTENT is required when PGSSLMODE=verify-full.');
      ssl = { ca: rootCertContent || readFileSync(rootCertPath!, 'utf8'), rejectUnauthorized: true };
      break;
    default:
      throw new Error(`Unsupported PGSSLMODE "${mode}". Use disable, require, verify-ca, or verify-full.`);
  }

  const max = Number(env.PG_POOL_MAX || 10);
  if (!Number.isInteger(max) || max < 1) throw new Error('PG_POOL_MAX must be a positive integer.');

  return {
    connectionString: url.toString(),
    ssl,
    max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };
}
