import { createHash, randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import type { Hunt1ActionResult, Hunt1State } from '../../src/types/hunt1.types.ts';
import { withPostgresTransaction } from './transaction.ts';
import { recordScoreEventInTransaction } from './ledger.ts';
import {
  applyRound3Hunt1ActionToState,
  createFreshRound3Hunt1State,
  HUNT1_MODEL_VERSION,
  presentRound3Hunt1State,
} from '../../server/services/round3-hunt1.rules.ts';

export class Round3Hunt1ConflictError extends Error {
  constructor(message: string) { super(message); this.name = 'Round3Hunt1ConflictError'; }
}

export class Round3Hunt1InactiveRunError extends Error {
  constructor() { super('Round 3 timer is paused or expired.'); this.name = 'Round3Hunt1InactiveRunError'; }
}

export interface Round3Hunt1ActionInput {
  actionId: string;
  type: string;
  actor?: unknown;
  objectId?: unknown;
  value?: unknown;
}

type ActionEnvelope = { fingerprint: string; result: Hunt1ActionResult };
type Hunt1Row = { state: Hunt1State; version: string; model_version: number };

function fingerprint(input: Round3Hunt1ActionInput): string {
  return createHash('sha256').update(JSON.stringify({ type: input.type, actor: input.actor, objectId: input.objectId, value: input.value })).digest('hex');
}

async function lockState(client: PoolClient, teamId: string, initialize: boolean): Promise<Hunt1Row | null> {
  if (initialize) {
    const fresh = JSON.stringify(createFreshRound3Hunt1State(teamId));
    await client.query(
      `INSERT INTO round3_hunt_state(team_id,hunt_id,state,model_version)
       SELECT id,1,$2::jsonb,$3 FROM teams WHERE id=$1
       ON CONFLICT(team_id,hunt_id) DO NOTHING`,
      [teamId, fresh, HUNT1_MODEL_VERSION],
    );
  }
  const result = await client.query<Hunt1Row>(
    'SELECT state,version,model_version FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=1 FOR UPDATE',
    [teamId],
  );
  const row = result.rows[0];
  if (!row) return null;
  const state = row.state;
  if (!state || typeof state !== 'object' || state.modelVersion !== HUNT1_MODEL_VERSION || state.teamId !== teamId) {
    const fresh = createFreshRound3Hunt1State(teamId);
    const reset = await client.query<Hunt1Row>(
      `UPDATE round3_hunt_state SET state=$2::jsonb,model_version=$3,version=version+1,updated_at=clock_timestamp()
       WHERE team_id=$1 AND hunt_id=1 RETURNING state,version,model_version`,
      [teamId, JSON.stringify(fresh), HUNT1_MODEL_VERSION],
    );
    return reset.rows[0] ?? null;
  }
  return row;
}

export async function ensureRound3Hunt1State(pool: Pool, teamId: string, playerNumber?: number): Promise<Hunt1State | null> {
  return withPostgresTransaction(pool, async (client) => {
    const row = await lockState(client, teamId, true);
    return row ? presentRound3Hunt1State(row.state, playerNumber) : null;
  });
}

export async function getRound3Hunt1State(pool: Pool, teamId: string, playerNumber?: number): Promise<Hunt1State | null> {
  const result = await pool.query<{ state: Hunt1State }>(
    'SELECT state FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=1', [teamId],
  );
  const state = result.rows[0]?.state;
  return state ? presentRound3Hunt1State(state, playerNumber) : null;
}

async function lockLiveRun(client: PoolClient, teamId: string): Promise<boolean> {
  const result = await client.query<{ status: string; remaining_ms: string; started_at: Date | null }>(
    `SELECT status,remaining_ms,started_at FROM round3_runs WHERE team_id=$1 FOR UPDATE`, [teamId],
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
    `SELECT GREATEST(0,$1::bigint-floor(extract(epoch FROM (clock_timestamp()-$2::timestamptz))*1000)::bigint) AS remaining_ms`,
    [run.remaining_ms, run.started_at],
  );
  if (Number(remaining.rows[0].remaining_ms) > 0) return true;
  await client.query(
    `UPDATE round3_runs SET status='expired',remaining_ms=0,started_at=NULL,updated_at=clock_timestamp(),version=version+1
     WHERE team_id=$1`, [teamId],
  );
  return false;
}

export async function applyRound3Hunt1Action(
  pool: Pool,
  teamId: string,
  input: Round3Hunt1ActionInput,
  playerNumber?: number,
): Promise<Hunt1ActionResult | null> {
  if (typeof input.actionId !== 'string' || !/^[A-Za-z0-9:_-]{8,120}$/.test(input.actionId)) {
    throw new Round3Hunt1ConflictError('A stable Hunt I action ID is required.');
  }
  if (typeof input.type !== 'string' || input.type.length > 80) return null;
  const eventId = `round3-hunt1:${input.actionId}`;
  const actionFingerprint = fingerprint(input);

  return withPostgresTransaction(pool, async (client) => {
    if (!await lockLiveRun(client, teamId)) throw new Round3Hunt1InactiveRunError();
    const row = await lockState(client, teamId, false);
    if (!row) return null;

    const previous = await client.query<{ details: ActionEnvelope }>(
      'SELECT details FROM activity_history WHERE team_id=$1 AND source_event_id=$2',
      [teamId, eventId],
    );
    if (previous.rowCount) {
      const envelope = previous.rows[0].details;
      if (envelope.fingerprint !== actionFingerprint) throw new Round3Hunt1ConflictError('This action ID was already used for a different Hunt I action.');
      return envelope.result;
    }

    const access = await client.query<{ status: string }>(
      'SELECT status FROM team_hunt_progress WHERE team_id=$1 AND hunt_id=1 FOR UPDATE', [teamId],
    );
    if (access.rows[0]?.status !== 'IN_PROGRESS') throw new Round3Hunt1ConflictError('Hunt I is not active for this team.');

    const state: Hunt1State = structuredClone(row.state);
    const evaluation = applyRound3Hunt1ActionToState(state, input, playerNumber);
    if (!evaluation) return null;

    if (evaluation.scoreDelta !== 0) {
      await recordScoreEventInTransaction(client, {
        teamId,
        roundId: 3,
        delta: evaluation.scoreDelta,
        sourceEventId: eventId,
        reason: `Round 3 Hunt I ${input.type}`,
        details: { huntId: 1, actionId: input.actionId, actor: input.actor, task: state.currentChallenge },
      });
    }

    await client.query(
      `UPDATE round3_hunt_state SET state=$2::jsonb,model_version=$3,version=version+1,updated_at=clock_timestamp()
       WHERE team_id=$1 AND hunt_id=1`,
      [teamId, JSON.stringify(state), HUNT1_MODEL_VERSION],
    );
    const { scoreDelta: _scoreDelta, ...response } = evaluation;
    const envelope: ActionEnvelope = { fingerprint: actionFingerprint, result: response };
    await client.query(
      `INSERT INTO activity_history(id,team_id,action,details,source_event_id)
       VALUES($1,$2,$3,$4::jsonb,$5)`,
      [`h1-${randomUUID()}`, teamId, `round3-hunt1:${input.type}`, JSON.stringify(envelope), eventId],
    );
    return response;
  });
}
