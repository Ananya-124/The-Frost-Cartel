import * as crypto from 'node:crypto';
import type { Pool } from 'pg';
import { hashPassword } from '../../server/auth/password.ts';

/** Create the first production administrator exactly once, when explicitly configured. */
export async function ensureBootstrapAdmin(pool: Pool, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('frost-cartel-bootstrap-admin',0))");
    const existing = await client.query('SELECT 1 FROM admins LIMIT 1');
    if (existing.rowCount) { await client.query('COMMIT'); return; }
    const username = env.ADMIN_BOOTSTRAP_USER?.trim();
    const password = env.ADMIN_BOOTSTRAP_PASSWORD;
    if (!username || !password || password.length < 16) {
      throw new Error('PostgreSQL has no administrator. Set ADMIN_BOOTSTRAP_USER and a 16+ character ADMIN_BOOTSTRAP_PASSWORD for the first startup.');
    }
    const { hash, salt } = hashPassword(password);
    await client.query(`INSERT INTO admins(id,username,password_hash,salt,role,must_change_password)
      VALUES($1,$2,$3,$4,'superadmin',true)`, ['admin-' + crypto.randomUUID(), username, hash, salt]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK').catch(() => undefined); throw error; }
  finally { client.release(); }
}
