import type { Pool, PoolClient } from 'pg';
import { withPostgresTransaction } from './transaction.ts';

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
  await audit(client, { teamId, entity: 'ROUND', entityId: nextRoundId, previous: oldStatus, next: newStatus,
    action: newStatus === 'AVAILABLE' && oldStatus !== 'AVAILABLE' ? 'ADVANCE' : 'MARK_ELIGIBLE',
    reason: `Round ${roundId} completion satisfied the prerequisite.` });
}

async function complete(client: PoolClient, teamId: string, entity: ProgressEntity, entityId: number,
  status: ProgressStatus, adminId?: string, reason?: string): Promise<void> {
  if (status === 'COMPLETED') return; // idempotent duplicate completion
  if (status !== 'IN_PROGRESS') throw new ProgressionError('Only in-progress progression can be completed.', 'CONFLICT');
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
        if (entityId !== 1 && !eligible.rows[0].eligible_at) throw new ProgressionError('The team is not yet eligible for this round.', 'CONFLICT');
      } else if (entityId === 1) {
        const round = await client.query<{ status: ProgressStatus }>('SELECT status FROM round_progress WHERE team_id=$1 AND round_id=3', [teamId]);
        if (round.rows[0]?.status !== 'IN_PROGRESS') throw new ProgressionError('Round 3 must be in progress before Hunt I can unlock.', 'CONFLICT');
      } else {
        const previous = await client.query<{ status: ProgressStatus }>('SELECT status FROM team_hunt_progress WHERE team_id=$1 AND hunt_id=$2', [teamId, entityId - 1]);
        if (previous.rows[0]?.status !== 'COMPLETED') throw new ProgressionError('The previous hunt must be completed first.', 'CONFLICT');
      }
      await setState(client, teamId, entity, entityId, 'AVAILABLE');
      if (entity === 'ROUND' && entityId === 3) {
        const huntStatus = await readAndLock(client, teamId, 'HUNT', 1);
        if (huntStatus === 'LOCKED') {
          await setState(client, teamId, 'HUNT', 1, 'AVAILABLE');
          await audit(client, { adminId, teamId, entity: 'HUNT', entityId: 1, previous: huntStatus, next: 'AVAILABLE', action: 'ADVANCE', reason });
        }
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
  if (!Array.isArray(assignments) || assignments.length > 7) {
    throw new ProgressionError('Round 4 supports at most seven qualified teams.', 'CONFLICT');
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
