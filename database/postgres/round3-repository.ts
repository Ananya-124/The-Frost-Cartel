import type { Pool } from 'pg';
import { withPostgresTransaction } from './transaction.ts';

export const ROUND3_RUN_DURATION_MS = 25 * 60 * 1000;

export type Round3RunStatus = 'not_started' | 'running' | 'paused' | 'completed' | 'expired';

export interface Round3Session {
  team_id: string;
  current_hunt: number;
  player_progress: Record<string, unknown>;
  past_state: Record<string, unknown>;
  future_state: Record<string, unknown>;
  active_timeline: string | null;
  evidence: string[];
  is_completed: boolean;
  completed_at: Date | null;
  version: string;
  created_at: Date;
  updated_at: Date;
}

export interface Round3Run {
  team_id: string;
  status: Round3RunStatus;
  remaining_ms: string;
  started_at: Date | null;
  updated_at: Date;
  version: string;
}

export type Round3RunSnapshot = Omit<Round3Run, 'remaining_ms'> & {
  remaining_ms: number;
  remaining_seconds: number;
};

export interface Round3SessionPatch {
  current_hunt?: number;
  player_progress?: Record<string, unknown>;
  past_state?: Record<string, unknown>;
  future_state?: Record<string, unknown>;
  active_timeline?: string | null;
  evidence?: string[];
  is_completed?: boolean;
  completed_at?: Date | null;
}

export class Round3VersionConflictError extends Error {
  constructor() {
    super('Round 3 session changed since it was read. Fetch the latest state and retry.');
    this.name = 'Round3VersionConflictError';
  }
}

const SESSION_COLUMNS = `team_id, current_hunt, player_progress, past_state, future_state,
  active_timeline, evidence, is_completed, completed_at, version, created_at, updated_at`;

export async function ensureRound3Session(pool: Pool, teamId: string): Promise<Round3Session | null> {
  return withPostgresTransaction(pool, async (client) => {
    await client.query(
      `INSERT INTO round3_sessions(team_id)
       SELECT id FROM teams WHERE id = $1
       ON CONFLICT (team_id) DO NOTHING`,
      [teamId],
    );
    const result = await client.query<Round3Session>(
      `SELECT ${SESSION_COLUMNS} FROM round3_sessions WHERE team_id = $1`,
      [teamId],
    );
    return result.rows[0] ?? null;
  });
}

export async function getRound3Session(pool: Pool, teamId: string): Promise<Round3Session | null> {
  const result = await pool.query<Round3Session>(
    `SELECT ${SESSION_COLUMNS} FROM round3_sessions WHERE team_id = $1`,
    [teamId],
  );
  return result.rows[0] ?? null;
}

/** Apply only supplied session fields, guarded by the version last observed by the caller. */
export async function updateRound3Session(
  pool: Pool,
  teamId: string,
  expectedVersion: number | string,
  patch: Round3SessionPatch,
): Promise<Round3Session | null> {
  return withPostgresTransaction(pool, async (client) => {
    const current = await client.query<{ version: string }>(
      'SELECT version FROM round3_sessions WHERE team_id = $1 FOR UPDATE',
      [teamId],
    );
    if (!current.rowCount) return null;
    if (String(current.rows[0].version) !== String(expectedVersion)) throw new Round3VersionConflictError();

    const fields: Array<[keyof Round3SessionPatch, string]> = [
      ['current_hunt', 'current_hunt'],
      ['player_progress', 'player_progress'],
      ['past_state', 'past_state'],
      ['future_state', 'future_state'],
      ['active_timeline', 'active_timeline'],
      ['evidence', 'evidence'],
      ['is_completed', 'is_completed'],
      ['completed_at', 'completed_at'],
    ];
    const values: unknown[] = [teamId];
    const assignments: string[] = [];
    for (const [key, column] of fields) {
      if (Object.hasOwn(patch, key)) {
        values.push(key === 'player_progress' || key === 'past_state' || key === 'future_state' || key === 'evidence'
          ? JSON.stringify(patch[key])
          : patch[key]);
        assignments.push(`${column} = $${values.length}${key === 'player_progress' || key === 'past_state' || key === 'future_state' || key === 'evidence' ? '::jsonb' : ''}`);
      }
    }
    assignments.push('version = version + 1', 'updated_at = clock_timestamp()');
    const updated = await client.query<Round3Session>(
      `UPDATE round3_sessions SET ${assignments.join(', ')} WHERE team_id = $1 RETURNING ${SESSION_COLUMNS}`,
      values,
    );
    return updated.rows[0];
  });
}

interface LockedRun extends Round3Run {
  computed_remaining_ms: string;
}

async function lockOrInitializeRun(client: import('pg').PoolClient, teamId: string): Promise<LockedRun | null> {
  // Team creation normally inserts this row through the schema trigger. This
  // guarded insert also repairs a missing run without allowing an unknown team.
  await client.query(
    `INSERT INTO round3_runs(team_id, remaining_ms)
     SELECT id, $2 FROM teams WHERE id = $1
     ON CONFLICT (team_id) DO NOTHING`,
    [teamId, ROUND3_RUN_DURATION_MS],
  );
  const result = await client.query<LockedRun>(
    `SELECT team_id, status, remaining_ms, started_at, updated_at, version,
       CASE WHEN status = 'running' AND started_at IS NOT NULL
         THEN GREATEST(0, remaining_ms - floor(extract(epoch FROM (clock_timestamp() - started_at)) * 1000)::bigint)
         ELSE remaining_ms
       END AS computed_remaining_ms
     FROM round3_runs WHERE team_id = $1 FOR UPDATE`,
    [teamId],
  );
  return result.rows[0] ?? null;
}

async function persistExpiry(client: import('pg').PoolClient, row: LockedRun): Promise<Round3Run> {
  const result = await client.query<Round3Run>(
    `UPDATE round3_runs SET status = 'expired', remaining_ms = 0, started_at = NULL,
       updated_at = clock_timestamp(), version = version + 1
     WHERE team_id = $1 RETURNING team_id, status, remaining_ms, started_at, updated_at, version`,
    [row.team_id],
  );
  return result.rows[0];
}

function snapshot(row: Round3Run | LockedRun, computedRemaining?: string): Round3RunSnapshot {
  const remaining = Number(computedRemaining ?? ('computed_remaining_ms' in row ? row.computed_remaining_ms : row.remaining_ms));
  return {
    team_id: row.team_id,
    status: row.status,
    remaining_ms: remaining,
    remaining_seconds: Math.ceil(remaining / 1000),
    started_at: row.started_at,
    updated_at: row.updated_at,
    version: row.version,
  };
}

/** Read a durable timer and persist expiry if the running deadline has passed. */
export async function getRound3Run(pool: Pool, teamId: string): Promise<Round3RunSnapshot | null> {
  return withPostgresTransaction(pool, async (client) => {
    const row = await lockOrInitializeRun(client, teamId);
    if (!row) return null;
    const remaining = Number(row.computed_remaining_ms);
    if (row.status === 'running' && remaining === 0) return snapshot(await persistExpiry(client, row));
    return snapshot(row, row.computed_remaining_ms);
  });
}

export async function startRound3Run(pool: Pool, teamId: string): Promise<Round3RunSnapshot | null> {
  return withPostgresTransaction(pool, async (client) => {
    const row = await lockOrInitializeRun(client, teamId);
    if (!row) return null;
    const remaining = Number(row.computed_remaining_ms);
    if (row.status === 'running' && remaining === 0) return snapshot(await persistExpiry(client, row));
    if (row.status !== 'not_started') return snapshot(row, row.computed_remaining_ms);
    const started = await client.query<Round3Run>(
      `UPDATE round3_runs SET status = 'running', started_at = clock_timestamp(),
         updated_at = clock_timestamp(), version = version + 1
       WHERE team_id = $1 RETURNING team_id, status, remaining_ms, started_at, updated_at, version`,
      [teamId],
    );
    return snapshot(started.rows[0]);
  });
}

export async function pauseRound3Run(pool: Pool, teamId: string): Promise<Round3RunSnapshot | null> {
  return withPostgresTransaction(pool, async (client) => {
    const row = await lockOrInitializeRun(client, teamId);
    if (!row) return null;
    const remaining = Number(row.computed_remaining_ms);
    if (row.status !== 'running') return snapshot(row, row.computed_remaining_ms);
    if (remaining === 0) return snapshot(await persistExpiry(client, row));
    const paused = await client.query<Round3Run>(
      `UPDATE round3_runs SET status = 'paused', remaining_ms = $2, started_at = NULL,
         updated_at = clock_timestamp(), version = version + 1
       WHERE team_id = $1 RETURNING team_id, status, remaining_ms, started_at, updated_at, version`,
      [teamId, remaining],
    );
    return snapshot(paused.rows[0]);
  });
}

export async function resumeRound3Run(pool: Pool, teamId: string): Promise<Round3RunSnapshot | null> {
  return withPostgresTransaction(pool, async (client) => {
    const row = await lockOrInitializeRun(client, teamId);
    if (!row) return null;
    if (row.status !== 'paused') return snapshot(row, row.computed_remaining_ms);
    if (Number(row.remaining_ms) === 0) return snapshot(await persistExpiry(client, row));
    const resumed = await client.query<Round3Run>(
      `UPDATE round3_runs SET status = 'running', started_at = clock_timestamp(),
         updated_at = clock_timestamp(), version = version + 1
       WHERE team_id = $1 RETURNING team_id, status, remaining_ms, started_at, updated_at, version`,
      [teamId],
    );
    return snapshot(resumed.rows[0]);
  });
}

/** Persist one evidence discovery using the authenticated team's PG session and live timer. */
export async function discoverRound3Evidence(pool: Pool, teamId: string, evidenceId: unknown): Promise<string[] | null> {
  if (typeof evidenceId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(evidenceId)) return null;
  return withPostgresTransaction(pool, async (client) => {
    const run = await lockOrInitializeRun(client, teamId);
    if (!run) return null;
    if (run.status === 'not_started') {
      await client.query(`UPDATE round3_runs SET status='running',started_at=clock_timestamp(),
        updated_at=clock_timestamp(),version=version+1 WHERE team_id=$1`, [teamId]);
    } else if (run.status !== 'running') return null;
    else if (Number(run.computed_remaining_ms) <= 0) {
      await persistExpiry(client, run);
      return null;
    }

    const session = await client.query<{ evidence: string[]; version: string }>(
      'SELECT evidence,version FROM round3_sessions WHERE team_id=$1 FOR UPDATE', [teamId]);
    if (!session.rowCount) return null;
    const discoveries = session.rows[0].evidence;
    // Repeated discovery of the same evidence is an idempotent successful replay.
    if (discoveries.includes(evidenceId)) return discoveries;
    if (discoveries.length >= 200) return null;
    const next = [...discoveries, evidenceId];
    const updated = await client.query<{ evidence: string[] }>(`UPDATE round3_sessions
      SET evidence=$2::jsonb,version=version+1,updated_at=clock_timestamp()
      WHERE team_id=$1 AND version=$3 RETURNING evidence`, [teamId, JSON.stringify(next), session.rows[0].version]);
    return updated.rows[0]?.evidence ?? null;
  });
}

export type Round3CompletionResult =
  | { completed: true; run: Round3RunSnapshot; session: Round3Session }
  | { completed: false; reason: 'missing' | 'not_running' | 'expired'; run: Round3RunSnapshot | null };

/** Complete a run and mark its PG session together, but only while its timer is live. */
export async function completeRound3Run(pool: Pool, teamId: string): Promise<Round3CompletionResult> {
  return withPostgresTransaction(pool, async (client) => {
    const run = await lockOrInitializeRun(client, teamId);
    if (!run) return { completed: false, reason: 'missing', run: null };
    const remaining = Number(run.computed_remaining_ms);
    if (run.status === 'running' && remaining === 0) {
      const expired = snapshot(await persistExpiry(client, run));
      return { completed: false, reason: 'expired', run: expired };
    }
    if (run.status !== 'running') {
      return { completed: false, reason: run.status === 'expired' ? 'expired' : 'not_running', run: snapshot(run, run.computed_remaining_ms) };
    }

    const session = await client.query<{ version: string }>(
      'SELECT version FROM round3_sessions WHERE team_id = $1 FOR UPDATE',
      [teamId],
    );
    if (!session.rowCount) return { completed: false, reason: 'missing', run: snapshot(run, run.computed_remaining_ms) };

    const finishedRun = await client.query<Round3Run>(
      `UPDATE round3_runs SET status = 'completed', remaining_ms = $2, started_at = NULL,
         updated_at = clock_timestamp(), version = version + 1
       WHERE team_id = $1 RETURNING team_id, status, remaining_ms, started_at, updated_at, version`,
      [teamId, remaining],
    );
    const finishedSession = await client.query<Round3Session>(
      `UPDATE round3_sessions SET is_completed = true,
         completed_at = COALESCE(completed_at, clock_timestamp()), updated_at = clock_timestamp(), version = version + 1
       WHERE team_id = $1 RETURNING ${SESSION_COLUMNS}`,
      [teamId],
    );
    return { completed: true, run: snapshot(finishedRun.rows[0]), session: finishedSession.rows[0] };
  });
}
