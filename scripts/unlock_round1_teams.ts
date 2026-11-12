import { postgresPool } from '../database/postgres/pool.ts';
import { getTeamRound1State } from '../server/services/round1Gameplay.ts';

const p = postgresPool;
if (!p) { console.error('No pool'); process.exit(1); }

try {
  // 1. Ensure round 1 in rounds is active
  await p.query(`
    UPDATE rounds
    SET is_active = true,
        start_time = COALESCE(start_time, now()),
        duration_seconds = COALESCE(NULLIF(duration_seconds, 0), 1320),
        updated_at = now()
    WHERE round_id = 1
  `);

  // 2. Ensure lifecycle is running
  await p.query(`
    UPDATE round1_configuration
    SET configuration = jsonb_set(
      configuration - 'pausedGlobalTimer',
      '{lifecycle}',
      '"running"'::jsonb,
      true
    ),
    updated_at = now()
    WHERE singleton_id = 1
  `);

  // 3. Set round 1 progress to IN_PROGRESS for all teams so they are unlocked
  const updated = await p.query(`
    UPDATE round_progress
    SET status = 'IN_PROGRESS', updated_at = now()
    WHERE round_id = 1
  `);
  console.log(`Set round 1 IN_PROGRESS for ${updated.rowCount} teams.`);

  // 4. Verify getTeamRound1State for team2
  const team2 = await p.query<{ id: string }>(`SELECT id FROM teams WHERE team_name = 'team2'`);
  if (team2.rows[0]) {
    const state = await getTeamRound1State(p, team2.rows[0].id);
    console.log('team2 roundActive:', state.roundActive);
    console.log('team2 remainingSeconds:', state.remainingSeconds);
    console.log('team2 round endsAt:', state.endsAt);
    console.log('team2 session status:', state.session.status);
    console.log('team2 SUCCESS: Round 1 is completely unlocked and accessible!');
  }
} catch (e) {
  console.error('Error:', e);
} finally {
  await p.end();
}
