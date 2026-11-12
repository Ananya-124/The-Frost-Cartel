// @vitest-environment node
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { createPostgresPoolConfig } from './config.ts';
import { runMigrations } from './migration-runner.ts';

const tempDirs: string[] = [];
afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('PostgreSQL connection settings', () => {
  it('defaults to verified TLS even when the URL includes sslmode=require', () => {
    expect(() => createPostgresPoolConfig({ DATABASE_URL: 'postgres://u:p@localhost/db?sslmode=require' }))
      .toThrow(/PGSSLROOTCERT/);
  });

  it('supports Supabase CA verification and shares pool sizing settings', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'frost-pg-'));
    tempDirs.push(dir);
    const caPath = path.join(dir, 'ca.crt');
    await writeFile(caPath, 'test CA');
    const config = createPostgresPoolConfig({
      DATABASE_URL: 'postgres://u:p@localhost/db?sslmode=require',
      PGSSLROOTCERT: caPath,
      PG_POOL_MAX: '4',
    });
    expect(config.connectionString).not.toContain('sslmode=');
    expect(config.ssl).toMatchObject({ ca: 'test CA', rejectUnauthorized: true });
    expect(config.max).toBe(4);
    expect(config.idleTimeoutMillis).toBe(30_000);
  });

  it('falls back to the bundled CA for missing Windows and POSIX certificate paths', async () => {
    const bundled = await readFile(path.resolve(process.cwd(), 'certs', 'prod-ca-2021.crt'), 'utf8');
    for (const missingPath of [
      'C:\\Users\\someone\\Downloads\\prod-ca-2021.crt',
      '"C:\\Users\\someone\\Downloads\\prod-ca-2021.crt"',
      'C:/Users/someone/Downloads/prod-ca-2021.crt',
      '/home/someone/Downloads/missing-dir/prod-ca-2021.crt',
    ]) {
      const config = createPostgresPoolConfig({ DATABASE_URL: 'postgres://u:p@localhost/db', PGSSLROOTCERT: missingPath });
      expect(config.ssl).toMatchObject({ ca: bundled, rejectUnauthorized: true });
    }
  });

  it('accepts a secret CA certificate supplied as environment content', () => {
    const config = createPostgresPoolConfig({
      DATABASE_URL: 'postgres://u:p@localhost/db',
      PGSSLMODE: 'verify-full',
      PGSSLROOTCERT_CONTENT: '-----BEGIN CERTIFICATE-----\\nexample\\n-----END CERTIFICATE-----',
    });
    expect(config.ssl).toMatchObject({ rejectUnauthorized: true, ca: '-----BEGIN CERTIFICATE-----\\nexample\\n-----END CERTIFICATE-----' });
  });

  it('makes encryption-only and disabled TLS explicit', () => {
    expect(createPostgresPoolConfig({ DATABASE_URL: 'postgres://u:p@localhost/db', PGSSLMODE: 'require' }).ssl)
      .toMatchObject({ rejectUnauthorized: false });
    expect(createPostgresPoolConfig({ DATABASE_URL: 'postgres://u:p@localhost/db', PGSSLMODE: 'disable' }).ssl).toBe(false);
  });
});

describe('migration transactions', () => {
  it('runs each migration and version record inside one outer transaction', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'frost-migrations-'));
    tempDirs.push(dir);
    await writeFile(path.join(dir, '002.sql'), 'SELECT 2;');
    await writeFile(path.join(dir, '001.sql'), 'SELECT 1;');

    const statements: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => { statements.push(sql); return { rowCount: 1 }; }),
      release: vi.fn(),
    };
    const pool = {
      query: vi.fn(async (sql: string) => { statements.push(sql); return { rowCount: 0 }; }),
      connect: vi.fn(async () => client),
    } as unknown as Pool;

    await expect(runMigrations(pool, dir)).resolves.toEqual(['001.sql', '002.sql']);
    expect(statements).toEqual(expect.arrayContaining(['BEGIN', 'SELECT 1;', 'SELECT 2;', 'COMMIT']));
    expect(statements.filter((sql) => sql === 'BEGIN')).toHaveLength(2);
    expect(client.release).toHaveBeenCalledTimes(2);
    const foundation = await readFile(new URL('./migrations/001_foundation.sql', import.meta.url), 'utf8');
    expect(foundation).not.toMatch(/^\s*(BEGIN|COMMIT)\s*;/im);
  });

  it('rolls back and releases a client when a migration fails', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'frost-migrations-fail-'));
    tempDirs.push(dir);
    await writeFile(path.join(dir, '001.sql'), 'INVALID SQL;');
    const client = {
      query: vi.fn(async (sql: string) => {
        if (sql === 'INVALID SQL;') throw new Error('bad migration');
        return { rowCount: 1 };
      }),
      release: vi.fn(),
    };
    const pool = {
      query: vi.fn(async () => ({ rowCount: 0 })),
      connect: vi.fn(async () => client),
    } as unknown as Pool;

    await expect(runMigrations(pool, dir)).rejects.toThrow('bad migration');
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalledOnce();
  });
});
