import { createHash, randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import type { Hunt2ActionResult, Hunt2State } from '../../src/types/hunt2.types.ts';
import { withPostgresTransaction } from './transaction.ts';
import { recordScoreEventInTransaction } from './ledger.ts';
import {
  applyRound3Hunt2ActionToState,
  createFreshRound3Hunt2State,
  normalizeRound3Hunt2State,
  round3Hunt2StateForActor,
} from '../../server/services/round3-hunt2.rules.ts';
import type { Hunt2Actor } from '../../src/types/hunt2.types.ts';

export class Round3Hunt2ConflictError extends Error {
  constructor(message: string) { super(message); this.name = 'Round3Hunt2ConflictError'; }
}

export class Round3Hunt2InactiveRunError extends Error {
  constructor() { super('Round 3 timer is paused or expired.'); this.name = 'Round3Hunt2InactiveRunError'; }
}

export interface Round3Hunt2ActionInput {
  actionId: string;
  type: string;
  actor?: unknown;
  objectId?: unknown;
  value?: unknown;
}

type ActionEnvelope = { fingerprint: string; result: Hunt2ActionResult };
type Hunt2Row = { state: Hunt2State; version: string; model_version: number };

function fingerprint(input: Round3Hunt2ActionInput): string {
  return createHash('sha256').update(JSON.stringify({ type: input.type, actor: input.actor, objectId: input.objectId, value: input.value })).digest('hex');
}

async function lockState(client: PoolClient, teamId: string, initialize: boolean): Promise<Hunt2Row | null> {
  if (initialize) {
    const fresh = JSON.stringify(createFreshRound3Hunt2State(teamId));
    await client.query(
      `INSERT INTO round3_hunt_state(team_id,hunt_id,state,model_version)
       SELECT id,2,$2::jsonb,1 FROM teams WHERE id=$1
       ON CONFLICT(team_id,hunt_id) DO NOTHING`,
      [teamId, fresh],
    );
  }
  const result = await client.query<Hunt2Row>(
    'SELECT state,version,model_version FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=2 FOR UPDATE', [teamId],
  );
  const row = result.rows[0];
  if (!row) return null;
  const normalized = normalizeRound3Hunt2State(row.state, teamId);
  if (!normalized) {
    const fresh = createFreshRound3Hunt2State(teamId);
    const reset = await client.query<Hunt2Row>(
      `UPDATE round3_hunt_state SET state=$2::jsonb,model_version=1,version=version+1,updated_at=clock_timestamp()
       WHERE team_id=$1 AND hunt_id=2 RETURNING state,version,model_version`,
      [teamId, JSON.stringify(fresh)],
    );
    return reset.rows[0] ?? null;
  }
  // Persist compatibility normalization once so subsequent reads use a stable state shape.
  if (JSON.stringify(normalized) !== JSON.stringify(row.state)) {
    const updated = await client.query<Hunt2Row>(
      `UPDATE round3_hunt_state SET state=$2::jsonb,model_version=1,version=version+1,updated_at=clock_timestamp()
       WHERE team_id=$1 AND hunt_id=2 RETURNING state,version,model_version`,
      [teamId, JSON.stringify(normalized)],
    );
    return updated.rows[0] ?? null;
  }
  return { ...row, state: normalized };
}

export async function ensureRound3Hunt2State(pool: Pool, teamId: string, actor?: Hunt2Actor, sharedView = true): Promise<Hunt2State | null> {
  return withPostgresTransaction(pool, async (client) => {
    const row = await lockState(client, teamId, true);
    if (!row) return null;
    return sharedView || !actor ? row.state : round3Hunt2StateForActor(row.state, actor);
  });
}

export async function getRound3Hunt2State(pool: Pool, teamId: string, actor?: Hunt2Actor, sharedView = true): Promise<Hunt2State | null> {
  const result = await pool.query<{ state: Hunt2State }>(
    'SELECT state FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=2', [teamId],
  );
  const state = normalizeRound3Hunt2State(result.rows[0]?.state, teamId);
  if (!state) return null;
  return sharedView || !actor ? state : round3Hunt2StateForActor(state, actor);
}

async function lockLiveRun(client: PoolClient, teamId: string): Promise<boolean> {
  const result = await client.query<{ status: string; remaining_ms: string; started_at: Date | null }>(
    'SELECT status,remaining_ms,started_at FROM round3_runs WHERE team_id=$1 FOR UPDATE', [teamId],
  );
  const run = result.rows[0];
  if (!run || run.status !== 'running' || !run.started_at) return false;
  const remaining = await client.query<{ remaining_ms: string }>(
    'SELECT GREATEST(0,$1::bigint-floor(extract(epoch FROM (clock_timestamp()-$2::timestamptz))*1000)::bigint) AS remaining_ms',
    [run.remaining_ms, run.started_at],
  );
  if (Number(remaining.rows[0]?.remaining_ms) > 0) return true;
  await client.query(
    `UPDATE round3_runs SET status='expired',remaining_ms=0,started_at=NULL,updated_at=clock_timestamp(),version=version+1
     WHERE team_id=$1`, [teamId],
  );
  return false;
}

async function requirePriorHuntCompletion(client: PoolClient, teamId: string): Promise<void> {
  const result = await client.query<{ status: string; state: { completed?: boolean } }>(
    `SELECT p.status,s.state FROM team_hunt_progress p
     JOIN round3_hunt_state s ON s.team_id=p.team_id AND s.hunt_id=1
     WHERE p.team_id=$1 AND p.hunt_id=1 FOR UPDATE OF p,s`, [teamId],
  );
  if (result.rows[0]?.status !== 'COMPLETED' || result.rows[0]?.state?.completed !== true) {
    throw new Round3Hunt2ConflictError('Complete Hunt I before entering Hunt II.');
  }
}

export async function applyRound3Hunt2Action(
  pool: Pool,
  teamId: string,
  input: Round3Hunt2ActionInput,
): Promise<Hunt2ActionResult | null> {
  if (typeof input.actionId !== 'string' || !/^[A-Za-z0-9:_-]{8,120}$/.test(input.actionId)) {
    throw new Round3Hunt2ConflictError('A stable Hunt II action ID is required.');
  }
  if (typeof input.type !== 'string' || input.type.length > 80) return null;
  const eventId = `round3-hunt2:${input.actionId}`;
  const actionFingerprint = fingerprint(input);

  return withPostgresTransaction(pool, async (client) => {
    if (!await lockLiveRun(client, teamId)) throw new Round3Hunt2InactiveRunError();
    const row = await lockState(client, teamId, false);
    if (!row) return null;

    const previous = await client.query<{ details: ActionEnvelope }>(
      'SELECT details FROM activity_history WHERE team_id=$1 AND source_event_id=$2', [teamId, eventId],
    );
    if (previous.rowCount) {
      const envelope = previous.rows[0].details;
      if (envelope.fingerprint !== actionFingerprint) throw new Round3Hunt2ConflictError('This action ID was already used for a different Hunt II action.');
      return envelope.result;
    }

    const access = await client.query<{ status: string }>(
      'SELECT status FROM team_hunt_progress WHERE team_id=$1 AND hunt_id=2 FOR UPDATE', [teamId],
    );
    if (access.rows[0]?.status !== 'IN_PROGRESS') throw new Round3Hunt2ConflictError('Hunt II is not active for this team.');
    await requirePriorHuntCompletion(client, teamId);

    const state = structuredClone(row.state);
    const evaluation = applyRound3Hunt2ActionToState(state, input);
    if (!evaluation) return null;
    if (evaluation.scoreDelta !== 0) {
      await recordScoreEventInTransaction(client, {
        teamId,
        roundId: 3,
        delta: evaluation.scoreDelta,
        sourceEventId: eventId,
        reason: `Round 3 Hunt II ${input.type}`,
        details: { huntId: 2, actionId: input.actionId, actor: input.actor, task: state.currentChallenge },
      });
    }

    await client.query(
      `UPDATE round3_hunt_state SET state=$2::jsonb,model_version=1,version=version+1,updated_at=clock_timestamp()
       WHERE team_id=$1 AND hunt_id=2`, [teamId, JSON.stringify(state)],
    );
    const { scoreDelta: _scoreDelta, ...response } = evaluation;
    await client.query(
      `INSERT INTO activity_history(id,team_id,action,details,source_event_id)
       VALUES($1,$2,$3,$4::jsonb,$5)`,
      [`h2-${randomUUID()}`, teamId, `round3-hunt2:${input.type}`, JSON.stringify({ fingerprint: actionFingerprint, result: response } satisfies ActionEnvelope), eventId],
    );
    return response;
  });
}
