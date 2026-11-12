import type { Pool, PoolClient } from 'pg';
import { withPostgresTransaction } from './transaction.ts';
import { qualifyTeamForRound4 } from './round4.ts';

export type ProgressStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
export type ProgressAction = 'unlock' | 'lock' | 'advance' | 'complete' | 'reset';
export type ProgressEntity = 'ROUND' | 'HUNT';

export async function getTeamProgression(pool: Pool, teamId: string) {
  const [rounds, hunts] = await Promise.all([
    pool.query(`SELECT round_id, status, eligible_at, completed_at, updated_at FROM round_progress WHERE team_id=$1 ORDER BY round_id`, [teamId]),
    pool.query(`SELECT hunt_id, status, completed_at, updated_at FROM team_hunt_progress WHERE team_id=$1 ORDER BY hunt_id`, [teamId]),
  ]);
  return { rounds: rounds.rows, hunts: hunts.rows };
}

export async function getTeamProgressionAudit(pool: Pool, teamId: string) {
  const result = await pool.query(`SELECT id, actor_type, admin_id, entity_type, entity_id, previous_state,
    new_state, action_performed, reason, created_at FROM progression_audit_history
    WHERE team_id=$1 ORDER BY created_at DESC, id DESC LIMIT 200`, [teamId]);
  return result.rows;
}

export class ProgressionError extends Error {
  readonly code: 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'LOCKED' | 'UNAVAILABLE';
  constructor(message: string, code: 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'LOCKED' | 'UNAVAILABLE') {
    super(message);
    this.code = code;
    this.name = 'ProgressionError';
  }
}

async function requireAdminSession(client: PoolClient, token: string): Promise<string> {
  const result = await client.query<{ id: string }>(`
    SELECT a.id FROM admin_sessions s
    JOIN admins a ON a.id=s.admin_id
    WHERE s.token=$1 AND s.expires_at > now()
    FOR UPDATE OF s
  `, [token]);
  if (!result.rowCount) throw new ProgressionError('A valid administrator session is required.', 'FORBIDDEN');
  return result.rows[0].id;
}

async function lockTeamProgression(client: PoolClient, teamId: string): Promise<void> {
  // Serialize every mutation for a team, including resets that touch many rows.
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [teamId]);
}

async function audit(client: PoolClient, data: {
  adminId?: string;
  teamId: string;
  entity: ProgressEntity;
  entityId: number;
  previous: ProgressStatus | null;
  next: ProgressStatus;
  action: string;
  reason?: string;
}): Promise<void> {
  await client.query(`
    INSERT INTO progression_audit_history
      (actor_type, admin_id, team_id, entity_type, entity_id, previous_state, new_state, action_performed, reason)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [data.adminId ? 'ADMIN' : 'SYSTEM', data.adminId ?? null, data.teamId, data.entity,
    data.entityId, data.previous, data.next, data.action.toUpperCase(), data.reason ?? null]);
}

async function assertTeam(client: PoolClient, teamId: string): Promise<void> {
  const result = await client.query('SELECT 1 FROM teams WHERE id = $1', [teamId]);
  if (!result.rowCount) throw new ProgressionError('Team not found.', 'NOT_FOUND');
}

async function readAndLock(client: PoolClient, teamId: string, entity: ProgressEntity, entityId: number): Promise<ProgressStatus> {
  const result = entity === 'ROUND'
    ? await client.query<{ status: ProgressStatus }>('SELECT status FROM round_progress WHERE team_id=$1 AND round_id=$2 FOR UPDATE', [teamId, entityId])
    : await client.query<{ status: ProgressStatus }>('SELECT status FROM team_hunt_progress WHERE team_id=$1 AND hunt_id=$2 FOR UPDATE', [teamId, entityId]);
  if (!result.rowCount) throw new ProgressionError(`${entity} progression not found.`, 'NOT_FOUND');
  return result.rows[0].status;
}

async function setState(client: PoolClient, teamId: string, entity: ProgressEntity, entityId: number,
  status: ProgressStatus, completed: boolean | null = null): Promise<void> {
  if (entity === 'ROUND') {
    await client.query(`UPDATE round_progress SET status=$3,
      completed_at=CASE WHEN $4::boolean IS NULL THEN completed_at WHEN $4 THEN COALESCE(completed_at, now()) ELSE NULL END,
      updated_at=now() WHERE team_id=$1 AND round_id=$2`, [teamId, entityId, status, completed]);
  } else {
    await client.query(`UPDATE team_hunt_progress SET status=$3,
      completed_at=CASE WHEN $4::boolean IS NULL THEN completed_at WHEN $4 THEN COALESCE(completed_at, now()) ELSE NULL END,
      updated_at=now() WHERE team_id=$1 AND hunt_id=$2`, [teamId, entityId, status, completed]);
  }
}

async function markNextRoundEligible(client: PoolClient, teamId: string, roundId: number): Promise<void> {
  const next = await client.query<{ round_id: number; status: ProgressStatus }>(`
    SELECT rp.round_id, rp.status FROM round_progress rp
    WHERE rp.team_id=$1 AND rp.round_id=$2 FOR UPDATE
  `, [teamId, roundId + 1]);
  if (!next.rowCount) return;
  const oldStatus = next.rows[0].status;
  const nextRoundId = roundId + 1;
  let autoAvailable = nextRoundId >= 3;
  if (nextRoundId === 2) {
    const auction = await client.query<{ enabled: boolean }>('SELECT enabled FROM round2_auction_config WHERE id=1 FOR SHARE');
    autoAvailable = auction.rows[0]?.enabled === true;
  }
  const newStatus: ProgressStatus = oldStatus === 'LOCKED' && autoAvailable ? 'AVAILABLE' : oldStatus;
  await client.query('UPDATE round_progress SET status=$3, eligible_at=COALESCE(eligible_at, now()), updated_at=now() WHERE team_id=$1 AND round_id=$2', [teamId, nextRoundId, newStatus]);
  if (nextRoundId === 4 && (newStatus === 'AVAILABLE' || newStatus === 'IN_PROGRESS')) {
    await qualifyTeamForRound4(client, teamId);
  }
  await audit(client, { teamId, entity: 'ROUND', entityId: nextRoundId, previous: oldStatus, next: newStatus,
    action: newStatus === 'AVAILABLE' && oldStatus !== 'AVAILABLE' ? 'ADVANCE' : 'MARK_ELIGIBLE',
    reason: `Round ${roundId} completion satisfied the prerequisite.` });
}

async function complete(client: PoolClient, teamId: string, entity: ProgressEntity, entityId: number,
  status: ProgressStatus, adminId?: string, reason?: string): Promise<void> {
  if (status === 'COMPLETED') return; // idempotent duplicate completion
  if (status !== 'IN_PROGRESS' && status !== 'AVAILABLE') throw new ProgressionError('Only available or in-progress progression can be completed.', 'CONFLICT');
  if (entity === 'ROUND' && entityId === 3) {
    const hunts = await client.query<{ count: string }>("SELECT count(*) FROM team_hunt_progress WHERE team_id=$1 AND status='COMPLETED'", [teamId]);
    if (Number(hunts.rows[0].count) !== 3) throw new ProgressionError('All three Round 3 hunts must be completed first.', 'CONFLICT');
  }
  await setState(client, teamId, entity, entityId, 'COMPLETED', true);
  await audit(client, { adminId, teamId, entity, entityId, previous: status, next: 'COMPLETED', action: 'COMPLETE', reason });
  if (entity === 'ROUND') await markNextRoundEligible(client, teamId, entityId);
  if (entity === 'HUNT' && entityId < 3) {
    const nextId = entityId + 1;
    const nextStatus = await readAndLock(client, teamId, 'HUNT', nextId);
    if (nextStatus === 'LOCKED') {
      await setState(client, teamId, 'HUNT', nextId, 'AVAILABLE');
      await audit(client, { teamId, entity: 'HUNT', entityId: nextId, previous: 'LOCKED', next: 'AVAILABLE', action: 'ADVANCE' });
    }
  }
}

export async function startRound(pool: Pool, teamId: string, roundId: number): Promise<void> {
  return withPostgresTransaction(pool, async (client) => {
    await assertTeam(client, teamId);
    await lockTeamProgression(client, teamId);
    if (roundId === 2) {
      // The auction is the global Round 2 release gate. Keep the row locked
      // through this transition so an administrator cannot disable it midway.
      const auction = await client.query<{ enabled: boolean }>(
        'SELECT enabled FROM round2_auction_config WHERE id=1 FOR SHARE',
      );
      if (auction.rows[0]?.enabled !== true) {
        throw new ProgressionError('Round 2 is unavailable until an administrator starts the auction.', 'LOCKED');
      }
    }
    const status = await readAndLock(client, teamId, 'ROUND', roundId);
    if (status === 'IN_PROGRESS') return;
    if (status !== 'AVAILABLE') throw new ProgressionError('This round is locked or not available.', 'LOCKED');
    await setState(client, teamId, 'ROUND', roundId, 'IN_PROGRESS');
    await audit(client, { teamId, entity: 'ROUND', entityId: roundId, previous: status, next: 'IN_PROGRESS', action: 'START' });
    if (roundId === 3) {
      const huntStatus = await readAndLock(client, teamId, 'HUNT', 1);
      if (huntStatus === 'LOCKED') {
        await setState(client, teamId, 'HUNT', 1, 'AVAILABLE');
        await audit(client, { teamId, entity: 'HUNT', entityId: 1, previous: 'LOCKED', next: 'AVAILABLE', action: 'ADVANCE' });
      }
    }
  });
}

export async function completeRound(pool: Pool, teamId: string, roundId: number): Promise<void> {
  return withPostgresTransaction(pool, async (client) => {
    await completeRoundInTransaction(client, teamId, roundId);
  });
}

/** Complete a round inside a caller-owned transaction so game state and progression commit together. */
export async function completeRoundInTransaction(client: PoolClient, teamId: string, roundId: number): Promise<void> {
  await assertTeam(client, teamId);
  await lockTeamProgression(client, teamId);
  const status = await readAndLock(client, teamId, 'ROUND', roundId);
  await complete(client, teamId, 'ROUND', roundId, status);
}

export async function startHunt(pool: Pool, teamId: string, huntId: number): Promise<void> {
  return withPostgresTransaction(pool, async (client) => {
    await assertTeam(client, teamId);
    await lockTeamProgression(client, teamId);
    const round = await readAndLock(client, teamId, 'ROUND', 3);
    if (round !== 'IN_PROGRESS') throw new ProgressionError('Round 3 must be in progress before entering a hunt.', 'LOCKED');
    if (huntId > 1) {
      const previous = await readAndLock(client, teamId, 'HUNT', huntId - 1);
      if (previous !== 'COMPLETED') throw new ProgressionError('The previous hunt must be completed first.', 'LOCKED');
    }
    const status = await readAndLock(client, teamId, 'HUNT', huntId);
    if (status === 'IN_PROGRESS') return;
    if (status !== 'AVAILABLE') throw new ProgressionError('This hunt is locked or not available.', 'LOCKED');
    await setState(client, teamId, 'HUNT', huntId, 'IN_PROGRESS');
    await audit(client, { teamId, entity: 'HUNT', entityId: huntId, previous: status, next: 'IN_PROGRESS', action: 'START' });
  });
}

export async function completeHunt(pool: Pool, teamId: string, huntId: number): Promise<void> {
  return withPostgresTransaction(pool, async (client) => {
    await assertTeam(client, teamId);
    await lockTeamProgression(client, teamId);
    const round = await readAndLock(client, teamId, 'ROUND', 3);
    if (round !== 'IN_PROGRESS') throw new ProgressionError('Round 3 must be in progress before completing a hunt.', 'LOCKED');
    const status = await readAndLock(client, teamId, 'HUNT', huntId);
    await complete(client, teamId, 'HUNT', huntId, status);
  });
}

export async function adminProgressRound2Global(
  pool: Pool,
  adminSessionToken: string,
  action: 'advance' | 'unlock' | 'lock' | 'reset',
  reason?: string,
): Promise<{ isActive: boolean; updatedCount: number }> {
  return withPostgresTransaction(pool, async (client) => {
    const adminId = await requireAdminSession(client, adminSessionToken);
    if (action === 'unlock' || action === 'advance') {
      await client.query('UPDATE rounds SET is_active=true, updated_at=now() WHERE round_id=2');
      await client.query('UPDATE round2_auction_config SET enabled=true, updated_at=now() WHERE id=1');

      // Auto-complete Round 1 so all squads transition cleanly to Round 2
      await client.query(
        "UPDATE round_progress SET status='COMPLETED', completed_at=COALESCE(completed_at, now()), updated_at=now() WHERE round_id=1 AND status != 'COMPLETED'",
      );

      const teams = await client.query<{ team_id: string; status: ProgressStatus }>(
        'SELECT team_id, status FROM round_progress WHERE round_id=2 FOR UPDATE',
      );
      let updatedCount = 0;
      for (const t of teams.rows) {
        if (t.status === 'LOCKED') {
          await client.query(
            "UPDATE round_progress SET status='AVAILABLE', eligible_at=COALESCE(eligible_at, now()), updated_at=now() WHERE team_id=$1 AND round_id=2",
            [t.team_id],
          );
          await audit(client, {
            adminId,
            teamId: t.team_id,
            entity: 'ROUND',
            entityId: 2,
            previous: t.status,
            next: 'AVAILABLE',
            action: action === 'advance' ? 'ADVANCE' : 'UNLOCK',
            reason: reason || 'Tournament Round 2 unlocked for all squads',
          });
          updatedCount++;
        }
      }
      return { isActive: true, updatedCount };
    } else if (action === 'lock') {
      await client.query('UPDATE rounds SET is_active=false, updated_at=now() WHERE round_id=2');
      const teams = await client.query<{ team_id: string; status: ProgressStatus }>(
        'SELECT team_id, status FROM round_progress WHERE round_id=2 FOR UPDATE',
      );
      let updatedCount = 0;
      for (const t of teams.rows) {
        if (t.status !== 'LOCKED') {
          await client.query(
            "UPDATE round_progress SET status='LOCKED', updated_at=now() WHERE team_id=$1 AND round_id=2",
            [t.team_id],
          );
          await audit(client, {
            adminId,
            teamId: t.team_id,
            entity: 'ROUND',
            entityId: 2,
            previous: t.status,
            next: 'LOCKED',
            action: 'LOCK',
            reason: reason || 'Tournament Round 2 locked for all squads',
          });
          updatedCount++;
        }
      }
      return { isActive: false, updatedCount };
    } else {
      await client.query('UPDATE rounds SET is_active=false, updated_at=now() WHERE round_id=2');
      await client.query("UPDATE round_progress SET status='LOCKED', eligible_at=NULL, completed_at=NULL, updated_at=now() WHERE round_id=2");
      return { isActive: false, updatedCount: 0 };
    }
  });
}

export const ROUND2_TO_ROUND3_CARD_MAPPINGS: Array<{ auctionPowerCardId: string; round3CardId: string; rationale: string }> = [
  { auctionPowerCardId: 'r2-card-1', round3CardId: 'temporal-compass', rationale: 'Chrono Freeze to Temporal Compass' },
  { auctionPowerCardId: 'r2-card-2', round3CardId: 'temporal-shield', rationale: 'Witching Hour to Temporal Shield' },
  { auctionPowerCardId: 'r2-card-3', round3CardId: 'spectral-lens', rationale: 'Spectral Sight to Spectral Lens' },
  { auctionPowerCardId: 'r2-card-4', round3CardId: 'resonance-decoder', rationale: "Witch's Lens to Resonance Decoder" },
  { auctionPowerCardId: 'r2-card-5', round3CardId: 'phantom-key', rationale: 'Hexbreaker to Phantom Key' },
  { auctionPowerCardId: 'r2-card-6', round3CardId: 'emergency-power-cell', rationale: "Mechanic's Curse to Emergency Power Cell" },
  { auctionPowerCardId: 'r2-card-7', round3CardId: 'memory-seal', rationale: "Witch's Elixir to Memory Seal" },
  { auctionPowerCardId: 'r2-card-8', round3CardId: 'phantom-beacon', rationale: "Raven's Messenger to Phantom Beacon" },
  { auctionPowerCardId: 'r2-card-9', round3CardId: 'echo-recorder', rationale: 'Phantom Shield to Echo Recorder' },
  { auctionPowerCardId: 'r2-card-10', round3CardId: 'soul-binding-sigil', rationale: 'Soul Surge to Soul Binding Sigil' },
];

export async function approveAuctionCardMappings(client: PoolClient): Promise<void> {
  for (const m of ROUND2_TO_ROUND3_CARD_MAPPINGS) {
    await client.query(`
      INSERT INTO round3_auction_card_mappings(auction_power_card_id, round3_card_id, mapping_status, rationale, reviewed_at)
      VALUES($1, $2, 'APPROVED', $3, now())
      ON CONFLICT (auction_power_card_id) DO UPDATE SET
        round3_card_id = EXCLUDED.round3_card_id,
        mapping_status = 'APPROVED',
        rationale = EXCLUDED.rationale,
        reviewed_at = now()
    `, [m.auctionPowerCardId, m.round3CardId, m.rationale]);
  }
}

export async function syncRound2CardsToRound3Inventory(client: PoolClient, teamId?: string): Promise<number> {
  await approveAuctionCardMappings(client);
  const result = await client.query(`
    INSERT INTO round3_card_inventory(team_id, card_id, source, auction_power_card_id, auction_ownership_id, quantity, updated_at)
    SELECT
      tpc.team_id,
      m.round3_card_id,
      'auction',
      tpc.power_card_id,
      tpc.id,
      1,
      now()
    FROM team_power_cards tpc
    JOIN round3_auction_card_mappings m ON m.auction_power_card_id = tpc.power_card_id AND m.mapping_status = 'APPROVED'
    WHERE tpc.source = 'auction' AND tpc.purchased_round_id = 2
      AND ($1::text IS NULL OR tpc.team_id = $1)
    ON CONFLICT (team_id, card_id, source) DO UPDATE SET
      quantity = round3_card_inventory.quantity + 1,
      auction_power_card_id = EXCLUDED.auction_power_card_id,
      auction_ownership_id = EXCLUDED.auction_ownership_id,
      updated_at = now()
  `, [teamId ?? null]);
  return result.rowCount ?? 0;
}

export async function adminProgressRound3Global(
  pool: Pool,
  adminSessionToken: string,
  action: 'advance' | 'unlock' | 'lock',
  reason?: string,
): Promise<{ isActive: boolean; updatedCount: number; cardsSynced: number }> {
  return withPostgresTransaction(pool, async (client) => {
    const adminId = await requireAdminSession(client, adminSessionToken);
    if (action === 'advance' || action === 'unlock') {
      await client.query('UPDATE rounds SET is_active=true, updated_at=now() WHERE round_id=3');
      const cardsSynced = await syncRound2CardsToRound3Inventory(client);
      await client.query(`
        UPDATE round_progress SET status='COMPLETED', completed_at=COALESCE(completed_at, now()), updated_at=now()
        WHERE round_id=2 AND status IN ('AVAILABLE', 'IN_PROGRESS')
      `);
      const teams = await client.query<{ team_id: string; status: ProgressStatus }>(
        'SELECT team_id, status FROM round_progress WHERE round_id=3 FOR UPDATE',
      );
      let updatedCount = 0;
      for (const t of teams.rows) {
        if (t.status === 'LOCKED') {
          await client.query(
            "UPDATE round_progress SET status='AVAILABLE', eligible_at=COALESCE(eligible_at, now()), updated_at=now() WHERE team_id=$1 AND round_id=3",
            [t.team_id],
          );
          await client.query(
            "UPDATE team_hunt_progress SET status='AVAILABLE', updated_at=now() WHERE team_id=$1 AND hunt_id=1 AND status='LOCKED'",
            [t.team_id],
          );
          await client.query('INSERT INTO round3_sessions(team_id) VALUES($1) ON CONFLICT (team_id) DO NOTHING', [t.team_id]);
          await client.query('INSERT INTO round3_runs(team_id) VALUES($1) ON CONFLICT (team_id) DO NOTHING', [t.team_id]);
          await audit(client, {
            adminId,
            teamId: t.team_id,
            entity: 'ROUND',
            entityId: 3,
            previous: t.status,
            next: 'AVAILABLE',
            action: 'ADVANCE',
            reason: reason || 'Tournament Round 3 unlocked for all squads with Round 2 cards synced',
          });
          updatedCount++;
        }
      }
      return { isActive: true, updatedCount, cardsSynced };
    } else {
      await client.query('UPDATE rounds SET is_active=false, updated_at=now() WHERE round_id=3');
      const teams = await client.query<{ team_id: string; status: ProgressStatus }>(
        'SELECT team_id, status FROM round_progress WHERE round_id=3 FOR UPDATE',
      );
      let updatedCount = 0;
      for (const t of teams.rows) {
        if (t.status !== 'LOCKED') {
          await client.query(
            "UPDATE round_progress SET status='LOCKED', updated_at=now() WHERE team_id=$1 AND round_id=3",
            [t.team_id],
          );
          await audit(client, {
            adminId,
            teamId: t.team_id,
            entity: 'ROUND',
            entityId: 3,
            previous: t.status,
            next: 'LOCKED',
            action: 'LOCK',
            reason: reason || 'Tournament Round 3 locked for all squads',
          });
          updatedCount++;
        }
      }
      return { isActive: false, updatedCount, cardsSynced: 0 };
    }
  });
}

export async function adminProgressRound4Global(
  pool: Pool,
  adminSessionToken: string,
  action: 'advance' | 'unlock' | 'lock',
  reason?: string,
): Promise<{ isActive: boolean; updatedCount: number }> {
  return withPostgresTransaction(pool, async (client) => {
    const adminId = await requireAdminSession(client, adminSessionToken);
    if (action === 'advance' || action === 'unlock') {
      await client.query('UPDATE rounds SET is_active=true, updated_at=now() WHERE round_id=4');
      await client.query('UPDATE round4_settings SET is_released=true, updated_at=now() WHERE id=1');
      await client.query(`
        UPDATE round_progress SET status='COMPLETED', completed_at=COALESCE(completed_at, now()), updated_at=now()
        WHERE round_id=3 AND status IN ('AVAILABLE', 'IN_PROGRESS')
      `);
      const teams = await client.query<{ team_id: string; status: ProgressStatus }>(
        'SELECT team_id, status FROM round_progress WHERE round_id=4 FOR UPDATE',
      );
      let updatedCount = 0;
      for (const t of teams.rows) {
        if (t.status === 'LOCKED') {
          await client.query(
            "UPDATE round_progress SET status='AVAILABLE', eligible_at=COALESCE(eligible_at, now()), updated_at=now() WHERE team_id=$1 AND round_id=4",
            [t.team_id],
          );
          await audit(client, {
            adminId,
            teamId: t.team_id,
            entity: 'ROUND',
            entityId: 4,
            previous: t.status,
            next: 'AVAILABLE',
            action: 'ADVANCE',
            reason: reason || 'Tournament Round 4 unlocked for all squads',
          });
          updatedCount++;
        }
        await qualifyTeamForRound4(client, t.team_id);
      }
      return { isActive: true, updatedCount };
    } else {
      await client.query('UPDATE rounds SET is_active=false, updated_at=now() WHERE round_id=4');
      await client.query('UPDATE round4_settings SET is_released=false, updated_at=now() WHERE id=1');
      const teams = await client.query<{ team_id: string; status: ProgressStatus }>(
        'SELECT team_id, status FROM round_progress WHERE round_id=4 FOR UPDATE',
      );
      let updatedCount = 0;
      for (const t of teams.rows) {
        if (t.status !== 'LOCKED') {
          await client.query(
            "UPDATE round_progress SET status='LOCKED', updated_at=now() WHERE team_id=$1 AND round_id=4",
            [t.team_id],
          );
          await audit(client, {
            adminId,
            teamId: t.team_id,
            entity: 'ROUND',
            entityId: 4,
            previous: t.status,
            next: 'LOCKED',
            action: 'LOCK',
            reason: reason || 'Tournament Round 4 locked for all squads',
          });
          updatedCount++;
        }
      }
      return { isActive: false, updatedCount };
    }
  });
}

export async function adminResetAllTeamsProgress(
  pool: Pool,
  adminSessionToken: string,
  reason?: string,
): Promise<{ success: boolean; resetCount: number }> {
  return withPostgresTransaction(pool, async (client) => {
    const adminId = await requireAdminSession(client, adminSessionToken);

    // 1. Reset Global Rounds & Timers
    await client.query('UPDATE rounds SET is_active=false, start_time=NULL, updated_at=now()');
    await client.query(`
      UPDATE round1_configuration
      SET configuration=jsonb_set(configuration - 'pausedGlobalTimer', '{lifecycle}', '"not_started"'::jsonb, true),
          updated_by=$1, updated_at=now()
      WHERE singleton_id=1
    `, [adminId]);

    // 2. Reset Round 3 State & Cards (before deleting auction records)
    await client.query("DELETE FROM round3_card_inventory WHERE source='auction'");
    await client.query('DELETE FROM round3_card_usage');
    await client.query('DELETE FROM round3_cooperation_ledger');
    await client.query('DELETE FROM round3_hunt_state');
    await client.query("UPDATE round3_sessions SET current_hunt=1, is_completed=false, completed_at=NULL, evidence='[]'::jsonb, updated_at=now()");
    await client.query("UPDATE round3_runs SET status='not_started', remaining_ms=1500000, started_at=NULL, version=1, updated_at=now()");

    // 3. Reset Round 2 Auction
    await client.query('UPDATE round2_auction_config SET enabled=false, updated_at=now() WHERE id=1');
    await client.query("UPDATE round2_auction_lots SET status='PENDING', active_at=NULL, ends_at=NULL, settled_at=NULL");
    await client.query('DELETE FROM round2_settlements');
    await client.query('DELETE FROM round2_bids');
    await client.query("DELETE FROM team_power_cards WHERE source='auction' AND purchased_round_id=2");

    // 4. Reset Round 4 Expedition
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('round4-winner',0))");
    await client.query('DELETE FROM round4_winner WHERE singleton_id=1');
    await client.query('DELETE FROM round4_team_progress');
    await client.query('DELETE FROM round4_qualified_teams');
    await client.query('UPDATE round4_settings SET is_released=false, updated_at=now() WHERE id=1');
    await client.query("DELETE FROM activity_history WHERE action IN ('ROUND4_TARGET_DISCOVERED','ROUND4_CLUE_SUBMISSION')");

    // 5. Reset Round 1 Stages & Events
    await client.query(`
      UPDATE round1_stage_progress
      SET status='AVAILABLE', score=0, time_spent_seconds=0, completed_at=NULL, fragment_unlocked=false,
          state='{}'::jsonb, updated_at=now()
    `);
    await client.query('DELETE FROM round1_action_events');

    // 6. Reset Per-Team Progression for ALL Teams
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

    // 7. Audit log for every team
    const teams = await client.query<{ id: string; team_name: string }>('SELECT id, team_name FROM teams ORDER BY team_name');
    for (const t of teams.rows) {
      await audit(client, {
        adminId,
        teamId: t.id,
        entity: 'ROUND',
        entityId: 1,
        previous: null,
        next: 'AVAILABLE',
        action: 'RESET',
        reason: reason || 'Master Tournament Reset: All team progress reset to Round 1 staged',
      });
    }

    return { success: true, resetCount: teams.rowCount ?? 0 };
  });
}

export async function adminAdvanceTeamToRound(
  pool: Pool,
  adminSessionToken: string,
  teamId: string,
  targetRound: number,
  reason?: string,
): Promise<{ success: boolean; teamId: string; roundId: number }> {
  return withPostgresTransaction(pool, async (client) => {
    const adminId = await requireAdminSession(client, adminSessionToken);
    await assertTeam(client, teamId);
    await lockTeamProgression(client, teamId);

    // Auto-complete previous rounds up to targetRound - 1
    for (let r = 1; r < targetRound; r++) {
      const prev = await client.query<{ status: ProgressStatus }>(
        'SELECT status FROM round_progress WHERE team_id=$1 AND round_id=$2 FOR UPDATE', [teamId, r]
      );
      if (prev.rows[0] && prev.rows[0].status !== 'COMPLETED') {
        await client.query(
          "UPDATE round_progress SET status='COMPLETED', completed_at=COALESCE(completed_at, now()), updated_at=now() WHERE team_id=$1 AND round_id=$2",
          [teamId, r]
        );
        await audit(client, { adminId, teamId, entity: 'ROUND', entityId: r, previous: prev.rows[0].status, next: 'COMPLETED', action: 'COMPLETE', reason: `Auto-completed to advance to Round ${targetRound}` });
      }
    }

    if (targetRound === 2) {
      await client.query('UPDATE rounds SET is_active=true, updated_at=now() WHERE round_id=2');
      await client.query('UPDATE round2_auction_config SET enabled=true, updated_at=now() WHERE id=1');
    }

    if (targetRound === 3) {
      await client.query('UPDATE rounds SET is_active=true, updated_at=now() WHERE round_id=3');
      await syncRound2CardsToRound3Inventory(client, teamId);
      await client.query("UPDATE team_hunt_progress SET status='AVAILABLE', updated_at=now() WHERE team_id=$1 AND hunt_id=1 AND status='LOCKED'", [teamId]);
      await client.query('INSERT INTO round3_sessions(team_id) VALUES($1) ON CONFLICT (team_id) DO NOTHING', [teamId]);
      await client.query('INSERT INTO round3_runs(team_id) VALUES($1) ON CONFLICT (team_id) DO NOTHING', [teamId]);
    }

    if (targetRound === 4) {
      await client.query('UPDATE rounds SET is_active=true, updated_at=now() WHERE round_id=4');
      await client.query('UPDATE round4_settings SET is_released=true, updated_at=now() WHERE id=1');
      await qualifyTeamForRound4(client, teamId);
      await client.query('UPDATE round4_team_progress SET is_finished=false, finished_at=NULL WHERE team_id=$1', [teamId]);
    }

    const target = await client.query<{ status: ProgressStatus }>(
      'SELECT status FROM round_progress WHERE team_id=$1 AND round_id=$2 FOR UPDATE', [teamId, targetRound]
    );
    const oldStatus = target.rows[0]?.status ?? 'LOCKED';
    if (oldStatus !== 'AVAILABLE') {
      await client.query(
        "UPDATE round_progress SET status='AVAILABLE', eligible_at=COALESCE(eligible_at, now()), updated_at=now() WHERE team_id=$1 AND round_id=$2",
        [teamId, targetRound]
      );
      await audit(client, { adminId, teamId, entity: 'ROUND', entityId: targetRound, previous: oldStatus, next: 'AVAILABLE', action: 'ADVANCE', reason: reason || `Admin advanced squad to Round ${targetRound}` });
    }

    return { success: true, teamId, roundId: targetRound };
  });
}

export async function adminProgress(pool: Pool, adminSessionToken: string, teamId: string, entity: ProgressEntity,
  entityId: number, action: ProgressAction, reason?: string): Promise<void> {
  return withPostgresTransaction(pool, async (client) => {
    const adminId = await requireAdminSession(client, adminSessionToken);
    await assertTeam(client, teamId);
    await lockTeamProgression(client, teamId);
    if ((entity === 'ROUND' && (entityId < 1 || entityId > 4)) || (entity === 'HUNT' && (entityId < 1 || entityId > 3))) {
      throw new ProgressionError('Invalid progression identifier.', 'NOT_FOUND');
    }
    const status = await readAndLock(client, teamId, entity, entityId);
    if (action === 'advance' || action === 'unlock') {
      if (status !== 'LOCKED') throw new ProgressionError('Only locked progression can be unlocked.', 'CONFLICT');
      if (entity === 'ROUND') {
        const eligible = await client.query('SELECT eligible_at FROM round_progress WHERE team_id=$1 AND round_id=$2', [teamId, entityId]);
        if (entityId !== 1 && !eligible.rows[0]?.eligible_at) {
          await client.query('UPDATE round_progress SET eligible_at=COALESCE(eligible_at, now()), updated_at=now() WHERE team_id=$1 AND round_id=$2', [teamId, entityId]);
        }
      } else if (entityId === 1) {
        const round = await client.query<{ status: ProgressStatus }>('SELECT status FROM round_progress WHERE team_id=$1 AND round_id=3', [teamId]);
        if (round.rows[0]?.status !== 'IN_PROGRESS') throw new ProgressionError('Round 3 must be in progress before Hunt I can unlock.', 'CONFLICT');
      } else {
        const previous = await client.query<{ status: ProgressStatus }>('SELECT status FROM team_hunt_progress WHERE team_id=$1 AND hunt_id=$2', [teamId, entityId - 1]);
        if (previous.rows[0]?.status !== 'COMPLETED') throw new ProgressionError('The previous hunt must be completed first.', 'CONFLICT');
      }
      await setState(client, teamId, entity, entityId, 'AVAILABLE');
      if (entity === 'ROUND' && entityId === 3) {
        await client.query('UPDATE rounds SET is_active=true, updated_at=now() WHERE round_id=3');
        await syncRound2CardsToRound3Inventory(client, teamId);
        const huntStatus = await readAndLock(client, teamId, 'HUNT', 1);
        if (huntStatus === 'LOCKED') {
          await setState(client, teamId, 'HUNT', 1, 'AVAILABLE');
          await audit(client, { adminId, teamId, entity: 'HUNT', entityId: 1, previous: huntStatus, next: 'AVAILABLE', action: 'ADVANCE', reason });
        }
      }
      if (entity === 'ROUND' && entityId === 4) {
        await client.query('UPDATE rounds SET is_active=true, updated_at=now() WHERE round_id=4');
        await client.query('UPDATE round4_settings SET is_released=true, updated_at=now() WHERE id=1');
        await qualifyTeamForRound4(client, teamId);
      }
      await audit(client, { adminId, teamId, entity, entityId, previous: status, next: 'AVAILABLE', action, reason });
      return;
    }
    if (action === 'complete') {
      await complete(client, teamId, entity, entityId, status, adminId, reason);
      return;
    }
    if (action === 'lock') {
      if (status === 'LOCKED') throw new ProgressionError('Progression is already locked.', 'CONFLICT');
      await setState(client, teamId, entity, entityId, 'LOCKED');
      await audit(client, { adminId, teamId, entity, entityId, previous: status, next: 'LOCKED', action, reason });
      return;
    }
    await setState(client, teamId, entity, entityId, 'LOCKED', false);
    if (entity === 'ROUND') {
      await client.query('UPDATE round_progress SET eligible_at=NULL WHERE team_id=$1 AND round_id=$2', [teamId, entityId]);
    }
    await audit(client, { adminId, teamId, entity, entityId, previous: status, next: 'LOCKED', action: 'RESET', reason });
    if (entity === 'ROUND') {
      const later = await client.query<{ round_id: number; status: ProgressStatus }>(
        'SELECT round_id, status FROM round_progress WHERE team_id=$1 AND round_id>$2 FOR UPDATE', [teamId, entityId]);
      for (const row of later.rows) {
        await client.query("UPDATE round_progress SET status='LOCKED', eligible_at=NULL, completed_at=NULL, updated_at=now() WHERE team_id=$1 AND round_id=$2", [teamId, row.round_id]);
        if (row.status !== 'LOCKED') await audit(client, { adminId, teamId, entity: 'ROUND', entityId: row.round_id, previous: row.status, next: 'LOCKED', action: 'RESET', reason });
      }
      if (entityId <= 3) {
        const hunts = await client.query<{ hunt_id: number; status: ProgressStatus }>(
          'SELECT hunt_id, status FROM team_hunt_progress WHERE team_id=$1 FOR UPDATE', [teamId]);
        for (const hunt of hunts.rows) {
          await client.query("UPDATE team_hunt_progress SET status='LOCKED', completed_at=NULL, updated_at=now() WHERE team_id=$1 AND hunt_id=$2", [teamId, hunt.hunt_id]);
          if (hunt.status !== 'LOCKED') await audit(client, { adminId, teamId, entity: 'HUNT', entityId: hunt.hunt_id, previous: hunt.status, next: 'LOCKED', action: 'RESET', reason });
        }
      }
    } else {
      const later = await client.query<{ hunt_id: number; status: ProgressStatus }>(
        'SELECT hunt_id, status FROM team_hunt_progress WHERE team_id=$1 AND hunt_id>$2 FOR UPDATE', [teamId, entityId]);
      for (const hunt of later.rows) {
        await client.query("UPDATE team_hunt_progress SET status='LOCKED', completed_at=NULL, updated_at=now() WHERE team_id=$1 AND hunt_id=$2", [teamId, hunt.hunt_id]);
        if (hunt.status !== 'LOCKED') await audit(client, { adminId, teamId, entity: 'HUNT', entityId: hunt.hunt_id, previous: hunt.status, next: 'LOCKED', action: 'RESET', reason });
      }
    }
  });
}

export interface Round4QualificationAssignment {
  teamId: string;
  routeId: string;
}

/** Atomically replace Round 4 assignments using an authenticated, live admin session. */
export async function qualifyRound4Teams(
  pool: Pool,
  adminSessionToken: string,
  assignments: Round4QualificationAssignment[],
): Promise<void> {
  if (!Array.isArray(assignments) || assignments.length > 5) {
    throw new ProgressionError('Round 4 supports at most five qualified teams.', 'CONFLICT');
  }
  const teamIds = new Set<string>();
  const routeIds = new Set<string>();
  for (const assignment of assignments) {
    if (!assignment || typeof assignment.teamId !== 'string' || !assignment.teamId.trim() ||
        typeof assignment.routeId !== 'string' || !assignment.routeId.trim()) {
      throw new ProgressionError('Each qualification requires a team and route.', 'CONFLICT');
    }
    if (teamIds.has(assignment.teamId) || routeIds.has(assignment.routeId)) {
      throw new ProgressionError('A team or route can only be assigned once.', 'CONFLICT');
    }
    teamIds.add(assignment.teamId);
    routeIds.add(assignment.routeId);
  }

  return withPostgresTransaction(pool, async (client) => {
    await requireAdminSession(client, adminSessionToken);
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('round4-qualification',0))");
    for (const assignment of assignments) {
      const [team, route] = await Promise.all([
        client.query('SELECT 1 FROM teams WHERE id=$1', [assignment.teamId]),
        client.query('SELECT 1 FROM round4_routes WHERE id=$1', [assignment.routeId]),
      ]);
      if (!team.rowCount) throw new ProgressionError('A qualified team does not exist.', 'NOT_FOUND');
      if (!route.rowCount) throw new ProgressionError('An assigned Round 4 route does not exist.', 'NOT_FOUND');
    }

    // A new qualification set starts fresh Round 4 route progress. FK restrictions
    // (for example, an existing winner) abort the complete replacement rather
    // than leaving a partial roster.
    await client.query("DELETE FROM activity_history WHERE action IN ('ROUND4_TARGET_DISCOVERED','ROUND4_CLUE_SUBMISSION')");
    await client.query('DELETE FROM round4_team_progress');
    await client.query('DELETE FROM round4_qualified_teams');
    for (const assignment of assignments) {
      await client.query('INSERT INTO round4_qualified_teams(id,team_id,route_id) VALUES($1,$2,$3)',
        [`qual-${assignment.teamId}`, assignment.teamId, assignment.routeId]);
      await client.query(`INSERT INTO round4_team_progress(id,team_id,route_id,current_step_index,solved_steps)
        VALUES($1,$2,$3,0,'[]'::jsonb)`, [`r4-progress-${assignment.teamId}`, assignment.teamId, assignment.routeId]);
    }
  });
}

export async function getRound4Qualification(pool: Pool, teamId: string) {
  const result = await pool.query<{ team_id: string; route_id: string; route_number: number; roman_numeral: string; route_name: string; qualified_at: Date }>(`
    SELECT q.team_id,q.route_id,r.route_number,r.roman_numeral,r.route_name,q.qualified_at
    FROM round4_qualified_teams q JOIN round4_routes r ON r.id=q.route_id WHERE q.team_id=$1`, [teamId]);
  return result.rows[0] ?? null;
}

export async function assertRound4Qualified(pool: Pool, teamId: string, routeId?: string): Promise<void> {
  const result = await pool.query('SELECT 1 FROM round4_qualified_teams WHERE team_id=$1 AND ($2::text IS NULL OR route_id=$2)', [teamId, routeId ?? null]);
  if (!result.rowCount) throw new ProgressionError('Team is not qualified for Round 4.', 'FORBIDDEN');
}

export async function assertRoundAccessible(pool: Pool, teamId: string, roundId: number): Promise<void> {
  if (roundId === 2) {
    const auction = await pool.query<{ enabled: boolean }>('SELECT enabled FROM round2_auction_config WHERE id=1');
    if (auction.rows[0]?.enabled !== true) {
      throw new ProgressionError('Round 2 is unavailable until an administrator starts the auction.', 'LOCKED');
    }
  }
  const result = await pool.query<{ status: ProgressStatus }>('SELECT status FROM round_progress WHERE team_id=$1 AND round_id=$2', [teamId, roundId]);
  if (!result.rowCount || !['AVAILABLE', 'IN_PROGRESS', 'COMPLETED'].includes(result.rows[0].status)) {
    throw new ProgressionError('This round is locked.', 'LOCKED');
  }
}

export async function assertHuntAccessible(pool: Pool, teamId: string, huntId: number): Promise<void> {
  const result = await pool.query<{ status: ProgressStatus; round_status: ProgressStatus }>(`SELECT h.status, r.status AS round_status
    FROM team_hunt_progress h JOIN round_progress r ON r.team_id=h.team_id AND r.round_id=3
    WHERE h.team_id=$1 AND h.hunt_id=$2`, [teamId, huntId]);
  const previous = huntId > 1
    ? await pool.query<{ status: ProgressStatus }>('SELECT status FROM team_hunt_progress WHERE team_id=$1 AND hunt_id=$2', [teamId, huntId - 1])
    : null;
  if (!result.rowCount || result.rows[0].round_status !== 'IN_PROGRESS' ||
      (huntId > 1 && previous?.rows[0]?.status !== 'COMPLETED') ||
      !['AVAILABLE', 'IN_PROGRESS', 'COMPLETED'].includes(result.rows[0].status)) {
    throw new ProgressionError('This hunt is locked.', 'LOCKED');
  }
}
