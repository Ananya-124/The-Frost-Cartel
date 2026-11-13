import { createHash, randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import type { Hunt3ActionResult, Hunt3Actor, Hunt3State } from '../../src/types/hunt3.types.ts';
import { withPostgresTransaction } from './transaction.ts';
import { recordScoreEventInTransaction } from './ledger.ts';
import {
  applyRound3Hunt3ActionToState,
  createFreshRound3Hunt3State,
  HUNT3_MODEL_VERSION,
  normalizeRound3Hunt3State,
  round3Hunt3StateForActor,
} from '../../server/services/round3-hunt3.rules.ts';

export class Round3Hunt3ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Round3Hunt3ConflictError';
  }
}

export class Round3Hunt3InactiveRunError extends Error {
  constructor() {
    super('Round 3 timer is paused or expired.');
    this.name = 'Round3Hunt3InactiveRunError';
  }
}

export interface Round3Hunt3ActionInput {
  actionId: string;
  type: string;
  id: string;
  actor?: unknown;
  value?: unknown;
}

type ActionEnvelope = { fingerprint: string; result: Hunt3ActionResult };
type Hunt3Row = { state: Hunt3State; version: string; model_version: number };

function fingerprint(input: Round3Hunt3ActionInput): string {
  return createHash('sha256')
    .update(JSON.stringify({ type: input.type, id: input.id, actor: input.actor, value: input.value }))
    .digest('hex');
}

async function lockState(client: PoolClient, teamId: string, initialize: boolean): Promise<Hunt3Row | null> {
  if (initialize) {
    const fresh = JSON.stringify(createFreshRound3Hunt3State(teamId));
    await client.query(
      `INSERT INTO round3_hunt_state(team_id,hunt_id,state,model_version)
       SELECT id,3,$2::jsonb,$3 FROM teams WHERE id=$1
       ON CONFLICT(team_id,hunt_id) DO NOTHING`,
      [teamId, fresh, HUNT3_MODEL_VERSION],
    );
  }
  const result = await client.query<Hunt3Row>(
    'SELECT state,version,model_version FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=3 FOR UPDATE',
    [teamId],
  );
  const row = result.rows[0];
  if (!row) return null;
  const normalized = normalizeRound3Hunt3State(row.state, teamId);
  if (!normalized) {
    const fresh = createFreshRound3Hunt3State(teamId);
    const reset = await client.query<Hunt3Row>(
      `UPDATE round3_hunt_state SET state=$2::jsonb,model_version=$3,version=version+1,updated_at=clock_timestamp()
       WHERE team_id=$1 AND hunt_id=3 RETURNING state,version,model_version`,
      [teamId, JSON.stringify(fresh), HUNT3_MODEL_VERSION],
    );
    return reset.rows[0] ?? null;
  }
  if (JSON.stringify(normalized) !== JSON.stringify(row.state)) {
    const updated = await client.query<Hunt3Row>(
      `UPDATE round3_hunt_state SET state=$2::jsonb,model_version=$3,version=version+1,updated_at=clock_timestamp()
       WHERE team_id=$1 AND hunt_id=3 RETURNING state,version,model_version`,
      [teamId, JSON.stringify(normalized), HUNT3_MODEL_VERSION],
    );
    return updated.rows[0] ?? null;
  }
  return { ...row, state: normalized };
}

export async function ensureRound3Hunt3State(
  pool: Pool,
  teamId: string,
  actor?: Hunt3Actor,
  sharedView = true,
): Promise<Hunt3State | null> {
  return withPostgresTransaction(pool, async (client) => {
    const row = await lockState(client, teamId, true);
    if (!row) return null;
    return sharedView || !actor ? row.state : round3Hunt3StateForActor(row.state, actor, false);
  });
}

export async function getRound3Hunt3State(
  pool: Pool,
  teamId: string,
  actor?: Hunt3Actor,
  sharedView = true,
): Promise<Hunt3State | null> {
  const result = await pool.query<{ state: Hunt3State }>(
    'SELECT state FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=3',
    [teamId],
  );
  const state = normalizeRound3Hunt3State(result.rows[0]?.state, teamId);
  if (!state) return null;
  return sharedView || !actor ? state : round3Hunt3StateForActor(state, actor, false);
}

async function lockLiveRun(client: PoolClient, teamId: string): Promise<boolean> {
  const result = await client.query<{ status: string; remaining_ms: string; started_at: Date | null }>(
    'SELECT status,remaining_ms,started_at FROM round3_runs WHERE team_id=$1 FOR UPDATE',
    [teamId],
  );
  let run = result.rows[0];
  if (!run) return false;
  if ((run.status === 'not_started' || run.status === 'paused') && Number(run.remaining_ms) > 0) {
    const resumed = await client.query<{ status: string; remaining_ms: string; started_at: Date | null }>(
      `UPDATE round3_runs SET status='running', started_at=clock_timestamp(), updated_at=clock_timestamp(), version=version+1
       WHERE team_id=$1 RETURNING status, remaining_ms, started_at`, [teamId],
    );
    run = resumed.rows[0];
  }
  if (!run || run.status !== 'running' || !run.started_at) return false;
  const remaining = await client.query<{ remaining_ms: string }>(
    'SELECT GREATEST(0,$1::bigint-floor(extract(epoch FROM (clock_timestamp()-$2::timestamptz))*1000)::bigint) AS remaining_ms',
    [run.remaining_ms, run.started_at],
  );
  if (Number(remaining.rows[0].remaining_ms) > 0) return true;
  await client.query(
    `UPDATE round3_runs SET status='expired',remaining_ms=0,started_at=NULL,updated_at=clock_timestamp(),version=version+1
     WHERE team_id=$1`,
    [teamId],
  );
  return false;
}

export async function applyRound3Hunt3Action(
  pool: Pool,
  teamId: string,
  input: Round3Hunt3ActionInput,
  actor: Hunt3Actor,
  sharedView = true,
): Promise<Hunt3ActionResult | null> {
  const currentFingerprint = fingerprint(input);
  return withPostgresTransaction(pool, async (client) => {
    const row = await lockState(client, teamId, true);
    if (!row) return null;

    const actionStore = ((row.state as Record<string, unknown>)._actionStore ?? {}) as Record<string, ActionEnvelope>;
    const existing = actionStore[input.actionId];
    if (existing) {
      if (existing.fingerprint !== currentFingerprint) {
        throw new Round3Hunt3ConflictError('Action ID was previously used with different parameters.');
      }
      return {
        ...existing.result,
        state: sharedView ? existing.result.state : round3Hunt3StateForActor(existing.result.state, actor, false),
      };
    }

    if (!await lockLiveRun(client, teamId)) {
      throw new Round3Hunt3InactiveRunError();
    }

    const applied = applyRound3Hunt3ActionToState(row.state, actor, input);
    if (!applied) return null;
    const { result, scoreDelta } = applied;

    const updatedState = { ...result.state } as Record<string, unknown>;
    updatedState._actionStore = {
      ...actionStore,
      [input.actionId]: { fingerprint: currentFingerprint, result },
    };

    if (scoreDelta !== 0) {
      await recordScoreEventInTransaction(client, {
        teamId,
        roundId: 3,
        delta: scoreDelta,
        sourceEventId: `r3h3:${input.actionId}`,
        reason: `Round 3 Hunt III ${input.type}`,
        details: { huntId: 3, actionId: input.actionId, type: input.type, id: input.id, actor },
      });
    }

    await client.query(
      `UPDATE round3_hunt_state
       SET state=$2::jsonb,model_version=$3,version=version+1,updated_at=clock_timestamp()
       WHERE team_id=$1 AND hunt_id=3`,
      [teamId, JSON.stringify(updatedState), HUNT3_MODEL_VERSION],
    );

    return {
      ...result,
      state: sharedView ? result.state : round3Hunt3StateForActor(result.state, actor, false),
    };
  });
}
