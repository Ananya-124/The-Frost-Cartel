import { createHash, randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { ROUND3_CARD_CATALOG, type Round3CardId } from '../../src/constants/round3.cards.ts';
import type { Round3InventoryItem } from '../../src/types/round3.types.ts';
import { withPostgresTransaction } from './transaction.ts';

export class Round3CardError extends Error {
  readonly code: 'INVALID' | 'UNAVAILABLE' | 'CONFLICT' | 'NOT_FOUND';
  constructor(message: string, code: 'INVALID' | 'UNAVAILABLE' | 'CONFLICT' | 'NOT_FOUND') {
    super(message);
    this.code = code;
    this.name = 'Round3CardError';
  }
}

export interface Round3CardUsage {
  cardId: Round3CardId;
  source: Round3InventoryItem['source'];
  requestId: string;
  usedAt: string;
  remainingQuantity: number;
  consumption: 'consume-one' | 'retained';
}

type UsageEnvelope = { fingerprint: string; usage: Round3CardUsage };

function actionFingerprint(cardId: string, source: string | undefined): string {
  return createHash('sha256').update(JSON.stringify({ cardId, source: source ?? null })).digest('hex');
}

async function lockRun(client: PoolClient, teamId: string): Promise<{ status: string; remaining_ms: string; started_at: Date | null } | null> {
  const result = await client.query<{ status: string; remaining_ms: string; started_at: Date | null }>(
    'SELECT status,remaining_ms,started_at FROM round3_runs WHERE team_id=$1 FOR UPDATE', [teamId],
  );
  return result.rows[0] ?? null;
}

async function runIsActive(client: PoolClient, teamId: string, run: { status: string; remaining_ms: string; started_at: Date | null } | null): Promise<boolean> {
  if (!run || run.status !== 'running' || !run.started_at) return false;
  const remaining = await client.query<{ ms: string }>(
    'SELECT GREATEST(0,$1::bigint-floor(extract(epoch FROM (clock_timestamp()-$2::timestamptz))*1000)::bigint) AS ms',
    [run.remaining_ms, run.started_at],
  );
  if (Number(remaining.rows[0]?.ms) > 0) return true;
  await client.query(
    `UPDATE round3_runs SET status='expired',remaining_ms=0,started_at=NULL,updated_at=clock_timestamp(),version=version+1
     WHERE team_id=$1`, [teamId],
  );
  return false;
}

export async function getRound3Inventory(pool: Pool, teamId: string): Promise<Round3InventoryItem[]> {
  const result = await pool.query<Round3InventoryItem>(
    `SELECT card_id AS "cardId",quantity,source FROM round3_card_inventory
     WHERE team_id=$1 AND quantity>0 ORDER BY card_id,source`, [teamId],
  );
  return result.rows;
}

export async function getRound3CardUsage(pool: Pool, teamId: string): Promise<Round3CardUsage[]> {
  const result = await pool.query<{ card_id: Round3CardId; source: Round3InventoryItem['source']; source_event_id: string; effect_context: UsageEnvelope; used_at: Date; remaining_quantity: number }>(
    `SELECT card_id,source,source_event_id,effect_context,used_at,remaining_quantity
     FROM round3_card_usage WHERE team_id=$1 ORDER BY used_at DESC,id DESC`, [teamId],
  );
  return result.rows.map((row) => row.effect_context?.usage ?? ({
    cardId: row.card_id, source: row.source, requestId: row.source_event_id.replace(/^round3-card:/, ''),
    usedAt: row.used_at.toISOString(), remainingQuantity: row.remaining_quantity,
    consumption: ROUND3_CARD_CATALOG.find((card) => card.id === row.card_id)?.consumption ?? 'consume-one',
  }));
}

export async function consumeRound3Card(
  pool: Pool,
  teamId: string,
  cardId: string,
  requestId: string,
  requestedSource?: unknown,
): Promise<Round3CardUsage> {
  if (!/^[A-Za-z0-9:_-]{8,120}$/.test(requestId)) throw new Round3CardError('A stable card activation ID is required.', 'INVALID');
  const definition = ROUND3_CARD_CATALOG.find((card) => card.id === cardId);
  if (!definition) throw new Round3CardError('Unknown Round 3 card.', 'INVALID');
  if (requestedSource !== undefined && !['auction', 'development', 'admin'].includes(String(requestedSource))) {
    throw new Round3CardError('Invalid inventory source.', 'INVALID');
  }
  const source = requestedSource as Round3InventoryItem['source'] | undefined;
  const sourceEventId = `round3-card:${requestId}`;
  const fingerprint = actionFingerprint(cardId, source);

  return withPostgresTransaction(pool, async (client) => {
    const replay = await client.query<{ effect_context: UsageEnvelope }>(
      'SELECT effect_context FROM round3_card_usage WHERE team_id=$1 AND source_event_id=$2', [teamId, sourceEventId],
    );
    if (replay.rowCount) {
      const envelope = replay.rows[0].effect_context;
      if (envelope.fingerprint !== fingerprint) throw new Round3CardError('This activation ID was already used for another card.', 'CONFLICT');
      return envelope.usage;
    }
    const run = await lockRun(client, teamId);
    // A concurrent request may have committed while this transaction waited
    // for the run row. Re-read under the lock before checking quantity.
    const concurrentReplay = await client.query<{ effect_context: UsageEnvelope }>(
      'SELECT effect_context FROM round3_card_usage WHERE team_id=$1 AND source_event_id=$2', [teamId, sourceEventId],
    );
    if (concurrentReplay.rowCount) {
      const envelope = concurrentReplay.rows[0].effect_context;
      if (envelope.fingerprint !== fingerprint) throw new Round3CardError('This activation ID was already used for another card.', 'CONFLICT');
      return envelope.usage;
    }
    if (!await runIsActive(client, teamId, run)) throw new Round3CardError('Round 3 gameplay is paused or expired.', 'UNAVAILABLE');

    const inventory = await client.query<{ quantity: number; source: Round3InventoryItem['source'] }>(
      `SELECT i.quantity,i.source FROM round3_card_inventory i
       LEFT JOIN round3_auction_card_mappings m ON m.auction_power_card_id=i.auction_power_card_id AND m.round3_card_id=i.card_id
       WHERE i.team_id=$1 AND i.card_id=$2 AND i.quantity>0
         AND ($3::text IS NULL OR i.source=$3)
         AND (i.source<>'auction' OR m.mapping_status='APPROVED')
       ORDER BY CASE i.source WHEN 'auction' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END
       LIMIT 1 FOR UPDATE OF i`, [teamId, cardId, source ?? null],
    );
    const row = inventory.rows[0];
    if (!row) throw new Round3CardError('This team does not own that card or has no charges remaining.', 'NOT_FOUND');

    const remainingQuantity = definition.consumption === 'consume-one' ? row.quantity - 1 : row.quantity;
    if (definition.consumption === 'consume-one') {
      const updated = await client.query(
        `UPDATE round3_card_inventory SET quantity=$4,updated_at=clock_timestamp()
         WHERE team_id=$1 AND card_id=$2 AND source=$3 AND quantity>0`, [teamId, cardId, row.source, remainingQuantity],
      );
      if (updated.rowCount !== 1) throw new Round3CardError('Card inventory changed. Refresh and retry.', 'CONFLICT');
    }
    const usedAt = new Date().toISOString();
    const usage: Round3CardUsage = { cardId: definition.id, source: row.source, requestId, usedAt, remainingQuantity, consumption: definition.consumption };
    await client.query(
      `INSERT INTO round3_card_usage(id,team_id,card_id,source,source_event_id,effect_context,remaining_quantity)
       VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)`,
      [`r3card-${randomUUID()}`, teamId, cardId, row.source, sourceEventId, JSON.stringify({ fingerprint, usage } satisfies UsageEnvelope), remainingQuantity],
    );
    await client.query('UPDATE round3_sessions SET updated_at=clock_timestamp(),version=version+1 WHERE team_id=$1', [teamId]);
    return usage;
  });
}

export async function loadRound3DevelopmentSample(pool: Pool, teamId: string, enabled: boolean): Promise<boolean> {
  if (!enabled) return false;
  return withPostgresTransaction(pool, async (client) => {
    const team = await client.query('SELECT 1 FROM teams WHERE id=$1 FOR UPDATE', [teamId]);
    if (!team.rowCount) return false;
    for (const item of [
      { cardId: 'spectral-lens', quantity: 1 },
      { cardId: 'temporal-compass', quantity: 1 },
      { cardId: 'emergency-power-cell', quantity: 2 },
    ]) {
      await client.query(
        `INSERT INTO round3_card_inventory(team_id,card_id,source,quantity)
         VALUES($1,$2,'development',$3) ON CONFLICT(team_id,card_id,source) DO NOTHING`,
        [teamId, item.cardId, item.quantity],
      );
    }
    await client.query('UPDATE round3_sessions SET updated_at=clock_timestamp(),version=version+1 WHERE team_id=$1', [teamId]);
    return true;
  });
}
