import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { withPostgresTransaction } from './transaction.ts';

export class LedgerError extends Error {
  readonly code: 'INVALID' | 'NOT_FOUND' | 'CONFLICT' | 'INSUFFICIENT_CREDITS';
  constructor(message: string, code: 'INVALID' | 'NOT_FOUND' | 'CONFLICT' | 'INSUFFICIENT_CREDITS') {
    super(message);
    this.code = code;
    this.name = 'LedgerError';
  }
}

export interface ScoreEvent {
  teamId: string;
  roundId: number;
  /** Trusted server-side score delta; clients must never submit this directly. */
  delta: number;
  sourceEventId: string;
  reason: string;
  stageId?: number;
  details?: Record<string, unknown>;
}

export interface CreditEvent {
  teamId: string;
  roundId?: number | null;
  /** Positive credits add to the wallet; negative credits spend or penalize it. */
  delta: number;
  transactionType: string;
  /** Required idempotency key, unique per team and transaction type. */
  referenceId: string;
  details?: Record<string, unknown>;
}

function validateCommon(teamId: string, delta: number, roundId: number | null | undefined, sourceEventId: string): void {
  if (typeof teamId !== 'string' || !teamId.trim()) throw new LedgerError('A valid team ID is required.', 'INVALID');
  if (!Number.isSafeInteger(delta) || delta === 0) throw new LedgerError('Ledger delta must be a non-zero integer.', 'INVALID');
  if (roundId != null && (!Number.isInteger(roundId) || roundId < 1 || roundId > 4)) {
    throw new LedgerError('Round ID must be between 1 and 4.', 'INVALID');
  }
  if (typeof sourceEventId !== 'string' || !sourceEventId.trim() || sourceEventId.length > 200) {
    throw new LedgerError('A non-empty idempotency reference of at most 200 characters is required.', 'INVALID');
  }
}

function jsonDetails(details: Record<string, unknown> | undefined, extra: Record<string, unknown>): string {
  try {
    const value = JSON.stringify({ ...(details ?? {}), ...extra });
    if (value === undefined) throw new Error('Details are not JSON serializable.');
    return value;
  } catch {
    throw new LedgerError('Ledger details must be JSON serializable.', 'INVALID');
  }
}

export interface ScoreEventResult {
  transactionId: string;
  teamId: string;
  roundId: number;
  delta: number;
  score: number;
  duplicate: boolean;
}

/** Apply a trusted score event, atomically updating team and round totals with its immutable ledger row. */
export async function recordScoreEvent(pool: Pool, event: ScoreEvent): Promise<ScoreEventResult> {
  validateCommon(event.teamId, event.delta, event.roundId, event.sourceEventId);
  if (!Number.isInteger(event.roundId) || event.roundId < 1 || event.roundId > 4) {
    throw new LedgerError('Round ID must be between 1 and 4.', 'INVALID');
  }
  if (typeof event.reason !== 'string' || !event.reason.trim()) throw new LedgerError('A score reason is required.', 'INVALID');
  if (event.stageId !== undefined && (!Number.isInteger(event.stageId) || event.stageId < 1)) {
    throw new LedgerError('Stage ID must be a positive integer.', 'INVALID');
  }

  return withPostgresTransaction(pool, async (client) => {
    const teamResult = await client.query<{ score: number }>(
      'SELECT score FROM teams WHERE id=$1 FOR UPDATE', [event.teamId]);
    const team = teamResult.rows[0];
    if (!team) throw new LedgerError('Team not found.', 'NOT_FOUND');

    const prior = await client.query<{ id: string; delta: number; new_score: number; reason: string; stage_id: number | null; details: Record<string, unknown> }>(
      `SELECT id,delta,new_score,reason,stage_id,details FROM score_transactions
       WHERE team_id=$1 AND round_id=$2 AND source_event_id=$3`, [event.teamId, event.roundId, event.sourceEventId]);
    if (prior.rowCount) {
      const row = prior.rows[0];
      const requested = Number(row.details?.requestedDelta);
      if (requested !== event.delta || row.reason !== event.reason || row.stage_id !== (event.stageId ?? null)) {
        throw new LedgerError('The score idempotency reference was already used for a different event.', 'CONFLICT');
      }
      return { transactionId: row.id, teamId: event.teamId, roundId: event.roundId, delta: row.delta, score: row.new_score, duplicate: true };
    }

    const progressResult = await client.query<{ status: string; score: number; max_score: number }>(
      'SELECT status,score,max_score FROM round_progress WHERE team_id=$1 AND round_id=$2 FOR UPDATE', [event.teamId, event.roundId]);
    const progress = progressResult.rows[0];
    if (!progress) throw new LedgerError('Round progression was not initialized for this team.', 'NOT_FOUND');
    if (progress.status !== 'IN_PROGRESS') throw new LedgerError('Scores can only be recorded for an in-progress round.', 'CONFLICT');

    // Wallet limits belong to total_credits/max_credits. Scores are governed by
    // the round's max_score (0 = uncapped) and must not be clipped by a credit cap.
    const roundRoom = event.delta > 0 && progress.max_score > 0
      ? Math.max(0, progress.max_score - progress.score)
      : Number.POSITIVE_INFINITY;
    const appliedDelta = event.delta > 0
      ? Math.min(event.delta, roundRoom)
      : Math.max(event.delta, -team.score);
    const newScore = team.score + appliedDelta;
    const newRoundScore = Math.max(0, progress.score + appliedDelta);
    const details = jsonDetails(event.details, { requestedDelta: event.delta });
    const transactionId = `score-${randomUUID()}`;

    await client.query('UPDATE teams SET score=$1,updated_at=now() WHERE id=$2', [newScore, event.teamId]);
    await client.query('UPDATE round_progress SET score=$1,updated_at=now() WHERE team_id=$2 AND round_id=$3', [newRoundScore, event.teamId, event.roundId]);
    await client.query(`INSERT INTO score_transactions(id,team_id,round_id,stage_id,delta,new_score,reason,source_event_id,details)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`, [transactionId, event.teamId, event.roundId, event.stageId ?? null,
      appliedDelta, newScore, event.reason.trim(), event.sourceEventId, details]);

    return { transactionId, teamId: event.teamId, roundId: event.roundId, delta: appliedDelta, score: newScore, duplicate: false };
  });
}

/** Score-event variant for gameplay services already inside a larger transaction. */
export async function recordScoreEventInTransaction(client: PoolClient, event: ScoreEvent): Promise<ScoreEventResult> {
  validateCommon(event.teamId, event.delta, event.roundId, event.sourceEventId);
  if (!Number.isInteger(event.roundId) || event.roundId < 1 || event.roundId > 4 ||
      typeof event.reason !== 'string' || !event.reason.trim() ||
      (event.stageId !== undefined && (!Number.isInteger(event.stageId) || event.stageId < 1))) {
    throw new LedgerError('Invalid score event.', 'INVALID');
  }
  const teamResult = await client.query<{ score: number }>('SELECT score FROM teams WHERE id=$1 FOR UPDATE', [event.teamId]);
  const team = teamResult.rows[0];
  if (!team) throw new LedgerError('Team not found.', 'NOT_FOUND');
  const prior = await client.query<{ id: string; delta: number; new_score: number; reason: string; stage_id: number | null; details: Record<string, unknown> }>(
    `SELECT id,delta,new_score,reason,stage_id,details FROM score_transactions WHERE team_id=$1 AND round_id=$2 AND source_event_id=$3`,
    [event.teamId,event.roundId,event.sourceEventId]);
  if (prior.rowCount) {
    const row = prior.rows[0];
    if (Number(row.details?.requestedDelta) !== event.delta || row.reason !== event.reason || row.stage_id !== (event.stageId ?? null)) {
      throw new LedgerError('The score idempotency reference was already used for a different event.', 'CONFLICT');
    }
    return { transactionId: row.id,teamId:event.teamId,roundId:event.roundId,delta:row.delta,score:row.new_score,duplicate:true };
  }
  const progressResult = await client.query<{ status: string; score: number; max_score: number }>(
    'SELECT status,score,max_score FROM round_progress WHERE team_id=$1 AND round_id=$2 FOR UPDATE',[event.teamId,event.roundId]);
  const progress = progressResult.rows[0];
  if (!progress) throw new LedgerError('Round progression was not initialized for this team.', 'NOT_FOUND');
  if (progress.status !== 'IN_PROGRESS') throw new LedgerError('Scores can only be recorded for an in-progress round.', 'CONFLICT');
  const roundRoom = event.delta > 0 && progress.max_score > 0 ? Math.max(0,progress.max_score-progress.score) : Number.POSITIVE_INFINITY;
  const appliedDelta = event.delta > 0 ? Math.min(event.delta,roundRoom) : Math.max(event.delta,-team.score);
  const newScore = team.score+appliedDelta;
  const newRoundScore = Math.max(0,progress.score+appliedDelta);
  const details = jsonDetails(event.details,{ requestedDelta:event.delta });
  const transactionId = `score-${randomUUID()}`;
  await client.query('UPDATE teams SET score=$1,updated_at=now() WHERE id=$2',[newScore,event.teamId]);
  await client.query('UPDATE round_progress SET score=$1,updated_at=now() WHERE team_id=$2 AND round_id=$3',[newRoundScore,event.teamId,event.roundId]);
  await client.query(`INSERT INTO score_transactions(id,team_id,round_id,stage_id,delta,new_score,reason,source_event_id,details)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,[transactionId,event.teamId,event.roundId,event.stageId??null,appliedDelta,newScore,event.reason.trim(),event.sourceEventId,details]);
  return { transactionId,teamId:event.teamId,roundId:event.roundId,delta:appliedDelta,score:newScore,duplicate:false };
}

export interface CreditEventResult {
  transactionId: string;
  teamId: string;
  roundId: number | null;
  delta: number;
  balance: number;
  duplicate: boolean;
}

/** Update the team's PostgreSQL wallet and append its ledger event atomically. */
export async function recordCreditEvent(pool: Pool, event: CreditEvent): Promise<CreditEventResult> {
  return withPostgresTransaction(pool, (client) => recordCreditEventInTransaction(client, event));
}

/** Credit-event variant for gameplay services already inside a larger transaction. */
export async function recordCreditEventInTransaction(client: PoolClient, event: CreditEvent): Promise<CreditEventResult> {
  validateCommon(event.teamId, event.delta, event.roundId, event.referenceId);
  if (typeof event.transactionType !== 'string' || !event.transactionType.trim() || event.transactionType.length > 80) {
    throw new LedgerError('A transaction type of at most 80 characters is required.', 'INVALID');
  }

  const teamResult = await client.query<{ total_credits: number }>(
    'SELECT total_credits FROM teams WHERE id=$1 FOR UPDATE', [event.teamId]);
  const team = teamResult.rows[0];
  if (!team) throw new LedgerError('Team not found.', 'NOT_FOUND');

  const transactionType = event.transactionType.trim();
  const prior = await client.query<{ id: string; delta: number; balance_after: number; round_id: number | null; details: Record<string, unknown> }>(
    `SELECT id,delta,balance_after,round_id,details FROM credit_transactions
       WHERE team_id=$1 AND transaction_type=$2 AND reference_id=$3`, [event.teamId, transactionType, event.referenceId]);
  if (prior.rowCount) {
    const row = prior.rows[0];
    if (row.delta !== event.delta || row.round_id !== (event.roundId ?? null)) {
      throw new LedgerError('The credit idempotency reference was already used for a different event.', 'CONFLICT');
    }
    return { transactionId: row.id, teamId: event.teamId, roundId: row.round_id, delta: row.delta, balance: row.balance_after, duplicate: true };
  }

  const balance = team.total_credits + event.delta;
  if (!Number.isSafeInteger(balance) || balance < 0) throw new LedgerError('The team does not have enough credits for this transaction.', 'INSUFFICIENT_CREDITS');
  const transactionId = `credit-${randomUUID()}`;
  const details = jsonDetails(event.details, {});
  await client.query('UPDATE teams SET total_credits=$1,updated_at=now() WHERE id=$2', [balance, event.teamId]);
  await client.query(`INSERT INTO credit_transactions(id,team_id,round_id,delta,balance_after,transaction_type,reference_id,details)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`, [transactionId,event.teamId,event.roundId ?? null,event.delta,balance,transactionType,event.referenceId,details]);
  return { transactionId, teamId: event.teamId, roundId: event.roundId ?? null, delta: event.delta, balance, duplicate: false };
}

export interface LeaderboardEntry {
  team_id: string;
  team_name: string;
  score: number;
  rank: number;
  updated_at: Date;
}

/** Shared leaderboard projection backed exclusively by the PostgreSQL teams table. */
export async function getLeaderboard(pool: Pool, limit = 100, offset = 0): Promise<LeaderboardEntry[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000 || !Number.isInteger(offset) || offset < 0) {
    throw new LedgerError('Leaderboard pagination is invalid.', 'INVALID');
  }
  const result = await pool.query<LeaderboardEntry>(
    'SELECT team_id,team_name,score,rank::integer AS rank,updated_at FROM leaderboard ORDER BY rank ASC,team_id ASC LIMIT $1 OFFSET $2', [limit, offset]);
  return result.rows;
}
