import { postgresPool } from '../database/postgres/pool.ts';
import { db } from '../database/db.ts';

async function main() {
  console.log('[RESET] Starting master tournament reset for all teams...');

  // 1. Reset SQLite if initialized
  try {
    db.prepare('DELETE FROM round4_winner').run();
    db.prepare('DELETE FROM round4_team_progress').run();
    db.prepare('DELETE FROM round4_qualified_teams').run();
    db.prepare('UPDATE round4_settings SET is_released=0 WHERE id=1').run();
    db.prepare("DELETE FROM teams WHERE id LIKE '%audit%' OR team_name LIKE '%Squad%'").run();
    db.prepare("UPDATE stages_progress SET status='NOT_STARTED'").run();
    console.log('[RESET] SQLite reset complete.');
  } catch (err: unknown) {
    console.warn('[RESET] SQLite warning (non-fatal):', err);
  }

  // 2. Reset PostgreSQL
  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN');

    // Reset Global Rounds & Timers
    await client.query('UPDATE rounds SET is_active=false, start_time=NULL, updated_at=now()');
    await client.query(`
      UPDATE round1_configuration
      SET configuration=jsonb_set(configuration - 'pausedGlobalTimer', '{lifecycle}', '"not_started"'::jsonb, true),
          updated_at=now()
      WHERE singleton_id=1
    `);

    // Reset Round 3 State & Cards
    await client.query("DELETE FROM round3_card_inventory WHERE source='auction'");
    await client.query('DELETE FROM round3_card_usage');
    await client.query('DELETE FROM round3_cooperation_ledger');
    await client.query('DELETE FROM round3_hunt_state');
    await client.query("UPDATE round3_sessions SET current_hunt=1, is_completed=false, completed_at=NULL, evidence='[]'::jsonb, updated_at=now()");
    await client.query("UPDATE round3_runs SET status='not_started', remaining_ms=1500000, started_at=NULL, version=1, updated_at=now()");

    // Reset Round 2 Auction
    await client.query('UPDATE round2_auction_config SET enabled=false, updated_at=now() WHERE id=1');
    await client.query("UPDATE round2_auction_lots SET status='PENDING', active_at=NULL, ends_at=NULL, settled_at=NULL");
    await client.query('DELETE FROM round2_settlements');
    await client.query('DELETE FROM round2_bids');
    await client.query("DELETE FROM team_power_cards WHERE source='auction' AND purchased_round_id=2");

    // Reset Round 4 Expedition & Winner Crown
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('round4-winner',0))");
    await client.query('DELETE FROM round4_winner WHERE singleton_id=1');
    await client.query('DELETE FROM round4_team_progress');
    await client.query('DELETE FROM round4_qualified_teams');
    await client.query('UPDATE round4_settings SET is_released=false, updated_at=now() WHERE id=1');
    await client.query("DELETE FROM activity_history WHERE action IN ('ROUND4_TARGET_DISCOVERED','ROUND4_CLUE_SUBMISSION')");

    // Clean any lingering test / audit teams
    await client.query("DELETE FROM round_progress WHERE team_id LIKE '%audit%'");
    await client.query("DELETE FROM team_sessions WHERE team_id LIKE '%audit%'");
    await client.query("DELETE FROM teams WHERE id LIKE '%audit%' OR team_name LIKE '%Squad%'");

    // Reset Round 1 Stages & Events
    await client.query(`
      UPDATE round1_stage_progress
      SET status='AVAILABLE', score=0, time_spent_seconds=0, completed_at=NULL, fragment_unlocked=false,
          state='{}'::jsonb, updated_at=now()
    `);
    await client.query('DELETE FROM round1_action_events');

    // Reset Per-Team Progression for ALL Teams
    await client.query(`
      UPDATE round_progress
      SET status='AVAILABLE', eligible_at=now(), completed_at=NULL, time_spent_seconds=0, updated_at=now()
      WHERE round_id=1
    `);
    await client.query(`
      UPDATE round_progress
      SET status='LOCKED', eligible_at=NULL, completed_at=NULL, time_spent_seconds=0, updated_at=now()
      WHERE round_id IN (2, 3, 4)
    `);
    await client.query(`
      UPDATE team_hunt_progress
      SET status='LOCKED', completed_at=NULL, updated_at=now()
    `);

    await client.query('COMMIT');
    console.log('[RESET] PostgreSQL master reset committed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[RESET] PostgreSQL reset error:', err);
    throw err;
  } finally {
    client.release();
    await postgresPool.end();
  }

  console.log('[RESET] All teams progress successfully reset to fresh Round 1 staged state!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
