import { readFileSync, existsSync } from 'node:fs';
import * as path from 'node:path';
import type { PoolConfig } from 'pg';

export type PostgresEnvironment = NodeJS.ProcessEnv;

function resolveCertFile(certPath?: string): string | undefined {
  if (!certPath) return undefined;
  const cleanPath = certPath.replace(/^["']|["']$/g, '');
  if (existsSync(cleanPath)) {
    return readFileSync(cleanPath, 'utf8');
  }
  // Split on both separators so a Windows path in a shared .env still resolves on Linux/macOS.
  const filename = cleanPath.split(/[\\/]/).pop() || cleanPath;
  const bundled = path.resolve(process.cwd(), 'certs', filename);
  if (existsSync(bundled)) {
    return readFileSync(bundled, 'utf8');
  }
  const userHome = process.env.USERPROFILE || process.env.HOME || '';
  if (userHome) {
    const userDownloads = path.join(userHome, 'Downloads', filename);
    if (existsSync(userDownloads)) {
      return readFileSync(userDownloads, 'utf8');
    }
  }
  return readFileSync(cleanPath, 'utf8');
}

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
      ssl = { ca: rootCertContent || resolveCertFile(rootCertPath), rejectUnauthorized: true, checkServerIdentity: () => undefined };
      break;
    case 'verify-full':
      if (!rootCertPath && !rootCertContent) throw new Error('PGSSLROOTCERT or PGSSLROOTCERT_CONTENT is required when PGSSLMODE=verify-full.');
      ssl = { ca: rootCertContent || resolveCertFile(rootCertPath), rejectUnauthorized: true };
      break;
    default:
      throw new Error(`Unsupported PGSSLMODE "${mode}". Use disable, require, verify-ca, or verify-full.`);
  }

  const max = Number(env.PG_POOL_MAX || 10);
  if (!Number.isInteger(max) || max < 1) throw new Error('PG_POOL_MAX must be a positive integer.');
  // Keep a few connections open past the idle timeout: reconnecting to a hosted
  // pooler costs a TLS handshake (~300 ms), which otherwise lands on the first
  // click after every 30 s pause.
  const min = Math.min(Number(env.PG_POOL_MIN || 3), max);
  if (!Number.isInteger(min) || min < 0) throw new Error('PG_POOL_MIN must be a non-negative integer.');

  return {
    connectionString: url.toString(),
    ssl,
    max,
    min,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  };
}
