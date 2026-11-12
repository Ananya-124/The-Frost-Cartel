// One-shot admin script: reset Round 1 lifecycle back to 'not_started'
// so the START ROUND 1 button works again.
// Run: node --experimental-strip-types scripts/reset_round1_state.ts

import { postgresPool } from '../database/postgres/pool.ts';

const p = postgresPool;
if (!p) { console.error('PostgreSQL pool not available.'); process.exit(1); }

const client = await p.connect();
try {
  await client.query('BEGIN');

  // 1. Reset lifecycle → not_started, remove any stale pausedGlobalTimer key
  await client.query(`
    UPDATE round1_configuration
    SET configuration = jsonb_set(
          configuration - 'pausedGlobalTimer',
          '{lifecycle}',
          '"not_started"'::jsonb,
          true
        ),
        updated_at = now()
    WHERE singleton_id = 1
  `);

  // 2. Reset rounds row: not active, no start time, restore default 22-min duration
  await client.query(`
    UPDATE rounds
    SET is_active = false,
        start_time = NULL,
        duration_seconds = 1320,
        updated_at = now()
    WHERE round_id = 1
  `);

  // 3. Clear all team Round 1 session states so every team starts from scratch
  await client.query(`
    UPDATE round1_stage_progress
    SET state = '{}'::jsonb,
        updated_at = now()
  `);

  // 4. Remove action-event cache so old action IDs don't re-replay stale responses
  await client.query(`DELETE FROM round1_action_events`);

  await client.query('COMMIT');

  // Verify
  const rounds = await p.query<{ is_active: boolean; start_time: Date | null; duration_seconds: number }>(
    'SELECT is_active, start_time, duration_seconds FROM rounds WHERE round_id=1'
  );
  const cfg = await p.query<{ lifecycle: string }>(
    `SELECT configuration->>'lifecycle' AS lifecycle FROM round1_configuration WHERE singleton_id=1`
  );

  console.log('rounds row :', JSON.stringify(rounds.rows[0]));
  console.log('lifecycle  :', cfg.rows[0]?.lifecycle);
  console.log('');
  console.log('✓ Round 1 reset to not_started. Click START ROUND 1 in the admin panel.');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('ROLLBACK — error:', (err as Error).message);
  process.exit(1);
} finally {
  client.release();
  await p.end();
}
