import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { recordCreditEventInTransaction } from './ledger.ts';
import { withPostgresTransaction } from './transaction.ts';

const MINIMUM_INCREMENT = 10;
const DEFAULT_SNIPE_SECONDS = 10;

export class AuctionError extends Error {
  readonly code: 'INVALID' | 'NOT_FOUND' | 'CONFLICT' | 'INSUFFICIENT_CREDITS' | 'FORBIDDEN' | 'DISABLED';
  constructor(message: string, code: 'INVALID' | 'NOT_FOUND' | 'CONFLICT' | 'INSUFFICIENT_CREDITS' | 'FORBIDDEN' | 'DISABLED') {
    super(message);
    this.code = code;
    this.name = 'AuctionError';
  }
}

interface AuctionConfig { enabled: boolean; default_bid_seconds: number; snipe_seconds: number }
interface Lot { id: string; sequence_number: number; power_card_id: string; status: string; starting_bid: number; active_at: Date | null; ends_at: Date | null }
interface SettlementResult { success: true; duplicate: boolean; sold: boolean; lotId: string; teamId?: string; winner?: string; amount?: number; balance?: number }
type AdminAuctionAction = 'START' | 'END' | 'RESET' | 'REMOVE_TEAM';

async function writeAdminAudit(client: PoolClient, event: {
  adminId: string; action: AdminAuctionAction; outcome: 'APPLIED' | 'REJECTED'; lotId?: string;
  details?: Record<string, unknown>; previousState?: Record<string, unknown>; newState?: Record<string, unknown>;
}): Promise<void> {
  await client.query(`INSERT INTO round2_auction_admin_audit
    (id,admin_id,action,outcome,lot_id,details,previous_state,new_state)
    VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb)`, [
    `r2-admin-audit-${randomUUID()}`, event.adminId, event.action, event.outcome, event.lotId ?? null,
    JSON.stringify(event.details ?? {}), JSON.stringify(event.previousState ?? {}), JSON.stringify(event.newState ?? {}),
  ]);
}

async function lockEnabledConfig(client: PoolClient, mode: 'SHARE' | 'UPDATE' = 'SHARE'): Promise<AuctionConfig> {
  const result = await client.query<AuctionConfig>(`SELECT enabled,default_bid_seconds,snipe_seconds FROM round2_auction_config WHERE id=1 FOR ${mode}`);
  const config = result.rows[0];
  if (!config || !config.enabled) throw new AuctionError('Round 2 auction is disabled.', 'DISABLED');
  return config;
}

function validateBid(amount: number, requestId: string): void {
  if (!Number.isSafeInteger(amount) || amount < 1) throw new AuctionError('Bid amount must be a positive whole number.', 'INVALID');
  if (typeof requestId !== 'string' || requestId.trim().length < 8 || requestId.length > 120) {
    throw new AuctionError('A stable requestId between 8 and 120 characters is required.', 'INVALID');
  }
}

async function getActiveLot(client: PoolClient, lotId?: string): Promise<Lot> {
  const result = lotId
    ? await client.query<Lot>('SELECT id,sequence_number,power_card_id,status,starting_bid,active_at,ends_at FROM round2_auction_lots WHERE id=$1 FOR UPDATE', [lotId])
    : await client.query<Lot>("SELECT id,sequence_number,power_card_id,status,starting_bid,active_at,ends_at FROM round2_auction_lots WHERE status='ACTIVE' ORDER BY sequence_number DESC LIMIT 1 FOR UPDATE");
  const lot = result.rows[0];
  if (!lot) throw new AuctionError('There is no active auction lot.', 'NOT_FOUND');
  return lot;
}

function currentHighBid(client: PoolClient, lotId: string) {
  return client.query<{ id: string; team_id: string; amount: number; placed_at: Date; team_name: string }>(
    `SELECT b.id,b.team_id,b.amount,b.placed_at,t.team_name
     FROM round2_bids b JOIN teams t ON t.id=b.team_id
     WHERE b.lot_id=$1 ORDER BY b.amount DESC,b.placed_at ASC,b.id ASC LIMIT 1`, [lotId]);
}

export interface PlaceAuctionBidInput { teamId: string; amount: number; requestId: string }
export interface PlaceAuctionBidResult { success: true; duplicate: boolean; bidId: string; lotId: string; amount: number; minimumBid: number; endsAt: Date | null }

/** Place one authenticated team's bid under the active-lot and wallet row locks. */
export async function placeAuctionBid(pool: Pool, input: PlaceAuctionBidInput): Promise<PlaceAuctionBidResult> {
  validateBid(input.amount, input.requestId);
  if (!input.teamId?.trim()) throw new AuctionError('An authenticated team is required.', 'FORBIDDEN');

  return withPostgresTransaction(pool, async (client) => {
    await lockEnabledConfig(client, 'SHARE');

    // A retry after the lot has settled must still return its original accepted bid.
    const previous = await client.query<{ id: string; lot_id: string; amount: number; placed_at: Date }>(
      'SELECT id,lot_id,amount,placed_at FROM round2_bids WHERE team_id=$1 AND request_id=$2', [input.teamId, input.requestId]);
    if (previous.rowCount) {
      const old = previous.rows[0];
      if (old.amount !== input.amount) throw new AuctionError('This requestId was already used for a different bid.', 'CONFLICT');
      return { success: true, duplicate: true, bidId: old.id, lotId: old.lot_id, amount: old.amount, minimumBid: old.amount, endsAt: null };
    }

    const lot = await getActiveLot(client);
    if (lot.status !== 'ACTIVE') throw new AuctionError('This auction lot is no longer active.', 'CONFLICT');
    if (lot.ends_at && lot.ends_at.getTime() <= Date.now()) throw new AuctionError('Bidding has closed.', 'CONFLICT');

    // Check again after locking the lot: concurrent copies of the same request serialize here.
    const raced = await client.query<{ id: string; lot_id: string; amount: number; placed_at: Date }>(
      'SELECT id,lot_id,amount,placed_at FROM round2_bids WHERE team_id=$1 AND request_id=$2', [input.teamId, input.requestId]);
    if (raced.rowCount) {
      const old = raced.rows[0];
      if (old.amount !== input.amount) throw new AuctionError('This requestId was already used for a different bid.', 'CONFLICT');
      return { success: true, duplicate: true, bidId: old.id, lotId: old.lot_id, amount: old.amount, minimumBid: old.amount, endsAt: lot.ends_at };
    }

    const team = await client.query<{ total_credits: number }>('SELECT total_credits FROM teams WHERE id=$1 FOR UPDATE', [input.teamId]);
    if (!team.rowCount) throw new AuctionError('Authenticated team was not found.', 'NOT_FOUND');
    const progression = await client.query<{ status: string }>(
      'SELECT status FROM round_progress WHERE team_id=$1 AND round_id=2 FOR SHARE', [input.teamId]);
    if (!progression.rowCount || progression.rows[0].status !== 'IN_PROGRESS') {
      throw new AuctionError('This team is not eligible to bid in Round 2.', 'FORBIDDEN');
    }

    const alreadyPlaced = await client.query<{ id: string }>(
      'SELECT id FROM round2_bids WHERE lot_id=$1 AND team_id=$2', [lot.id, input.teamId]);
    if (alreadyPlaced.rowCount) throw new AuctionError('You have already placed a bid for this card. Each team can only bid once.', 'CONFLICT');

    const minimumBid = lot.starting_bid;
    if (input.amount < minimumBid) throw new AuctionError(`Minimum bid is ${minimumBid} CR.`, 'INVALID');
    if (input.amount > team.rows[0].total_credits) throw new AuctionError('Not enough credits.', 'INSUFFICIENT_CREDITS');

    const bidId = `bid-${randomUUID()}`;
    await client.query('INSERT INTO round2_bids(id,lot_id,team_id,amount,request_id) VALUES($1,$2,$3,$4,$5)',
      [bidId, lot.id, input.teamId, input.amount, input.requestId]);

    const config = await client.query<{ snipe_seconds: number }>('SELECT snipe_seconds FROM round2_auction_config WHERE id=1');
    const snipeSeconds = Math.max(DEFAULT_SNIPE_SECONDS, config.rows[0]?.snipe_seconds ?? 0);
    let endsAt = lot.ends_at;
    if (endsAt && endsAt.getTime() - Date.now() < snipeSeconds * 1000) {
      const update = await client.query<{ ends_at: Date }>(
        `UPDATE round2_auction_lots SET ends_at=now()+($2::integer * interval '1 second') WHERE id=$1 RETURNING ends_at`, [lot.id, snipeSeconds]);
      endsAt = update.rows[0].ends_at;
    }
    return { success: true, duplicate: false, bidId, lotId: lot.id, amount: input.amount, minimumBid, endsAt };
  });
}

export interface StartAuctionLotInput { cardId: number; basePrice?: number; durationSeconds?: number }
export async function startAuctionLot(pool: Pool, input: StartAuctionLotInput, adminId: string) {
  if (typeof adminId !== 'string' || !adminId.trim()) throw new AuctionError('Authenticated administrator is required.', 'FORBIDDEN');
  if (!Number.isSafeInteger(input.cardId) || input.cardId < 1 || input.cardId > 11) throw new AuctionError('Unknown auction card.', 'INVALID');
  if (input.basePrice !== undefined && (!Number.isSafeInteger(input.basePrice) || input.basePrice < 0)) throw new AuctionError('Starting bid must be a non-negative whole number.', 'INVALID');
  if (input.durationSeconds !== undefined && (!Number.isSafeInteger(input.durationSeconds) || input.durationSeconds < 0 || input.durationSeconds > 86400)) {
    throw new AuctionError('Auction duration is invalid.', 'INVALID');
  }

  return withPostgresTransaction(pool, async (client) => {
    const configResult = await client.query<AuctionConfig>('SELECT enabled,default_bid_seconds,snipe_seconds FROM round2_auction_config WHERE id=1 FOR UPDATE');
    const config = configResult.rows[0];
    if (!config) throw new AuctionError('Round 2 auction configuration is unavailable.', 'DISABLED');
    const cardResult = await client.query<{ id: string; base_price: number; metadata: { auctionCardId?: number } }>(
      `SELECT id,base_price,metadata FROM power_cards
       WHERE round_id=2 AND is_active=true AND metadata->>'auctionCardId'=$1`, [String(input.cardId)]);
    const card = cardResult.rows[0];
    if (!card) throw new AuctionError('Auction card is not configured.', 'NOT_FOUND');
    if ((await client.query('SELECT 1 FROM round2_settlements WHERE power_card_id=$1 LIMIT 1', [card.id])).rowCount) {
      throw new AuctionError('This card has already been sold.', 'CONFLICT');
    }
    if ((await client.query("SELECT 1 FROM round2_auction_lots WHERE status='ACTIVE' LIMIT 1")).rowCount) {
      throw new AuctionError('A card is already live. End it first.', 'CONFLICT');
    }
    if (!config.enabled) {
      await client.query('UPDATE round2_auction_config SET enabled=true,updated_at=now() WHERE id=1');
    }
    await client.query('UPDATE rounds SET is_active=true, updated_at=now() WHERE round_id=2');
    const eligibleTeams = await client.query<{ team_id: string }>(`UPDATE round_progress
      SET status='AVAILABLE', eligible_at=COALESCE(eligible_at, now()), updated_at=now()
      WHERE round_id=2 AND status='LOCKED'
      RETURNING team_id`);
    for (const eligible of eligibleTeams.rows) {
      await client.query(`INSERT INTO progression_audit_history
        (actor_type,admin_id,team_id,entity_type,entity_id,previous_state,new_state,action_performed,reason)
        VALUES('ADMIN',$1,$2,'ROUND',2,'LOCKED','AVAILABLE','ADVANCE','Round 2 auction started.')`,
      [adminId, eligible.team_id]);
    }
    const sequence = await client.query<{ next_number: number }>('SELECT COALESCE(MAX(sequence_number),0)+1 AS next_number FROM round2_auction_lots');
    const priorLot = await client.query<{ status: string }>('SELECT status FROM round2_auction_lots WHERE power_card_id=$1 ORDER BY sequence_number DESC LIMIT 1', [card.id]);
    const lotId = `lot-${randomUUID()}`;
    const base = input.basePrice && input.basePrice > 0 ? input.basePrice : card.base_price;
    const duration = input.durationSeconds ?? config.default_bid_seconds;
    const lot = await client.query<{ id: string; sequence_number: number; starting_bid: number; ends_at: Date | null }>(
      `INSERT INTO round2_auction_lots(id,sequence_number,power_card_id,status,starting_bid,active_at,ends_at)
       VALUES($1,$2,$3,'ACTIVE',$4,now(),CASE WHEN $5 > 0 THEN now()+($5::integer * interval '1 second') ELSE NULL END)
       RETURNING id,sequence_number,starting_bid,ends_at`, [lotId, sequence.rows[0].next_number, card.id, base, duration]);
    await writeAdminAudit(client, { adminId, action: 'START', outcome: 'APPLIED', lotId,
      details: { cardId: input.cardId, powerCardId: card.id, startingBid: base, durationSeconds: duration },
      previousState: { status: priorLot.rows[0]?.status ?? 'PENDING', auctionEnabled: config.enabled },
      newState: { status: 'ACTIVE', sequenceNumber: lot.rows[0].sequence_number, endsAt: lot.rows[0].ends_at, auctionEnabled: true } });
    return { success: true as const, lot: lot.rows[0], powerCardId: card.id };
  });
}

async function settleLockedLot(client: PoolClient, lot: Lot): Promise<SettlementResult> {
  if (lot.status === 'SETTLED') {
    const prior = await client.query<{ team_id: string; team_name: string; amount: number; balance_after: number }>(
      `SELECT s.team_id,t.team_name,b.amount,ct.balance_after
       FROM round2_settlements s JOIN teams t ON t.id=s.team_id
       JOIN round2_bids b ON b.id=s.winning_bid_id
       JOIN credit_transactions ct ON ct.team_id=s.team_id AND ct.transaction_type='round2_auction_settlement' AND ct.reference_id=s.lot_id
       WHERE s.lot_id=$1`, [lot.id]);
    const result = prior.rows[0];
    return { success: true, duplicate: true, sold: true, lotId: lot.id, teamId: result?.team_id, winner: result?.team_name, amount: result?.amount, balance: result?.balance_after };
  }
  if (lot.status === 'CANCELLED') return { success: true, duplicate: true, sold: false, lotId: lot.id };
  if (lot.status !== 'ACTIVE') throw new AuctionError('Auction lot cannot be settled from its current state.', 'CONFLICT');

  const winnerBid = await currentHighBid(client, lot.id);
  const winning = winnerBid.rows[0];
  if (!winning) {
    await client.query("UPDATE round2_auction_lots SET status='CANCELLED',settled_at=now() WHERE id=$1", [lot.id]);
    return { success: true, duplicate: false, sold: false, lotId: lot.id };
  }

  const winnerTeam = await client.query<{ total_credits: number; team_name: string }>(
    'SELECT total_credits,team_name FROM teams WHERE id=$1 FOR UPDATE', [winning.team_id]);
  if (!winnerTeam.rowCount) throw new AuctionError('Winning team no longer exists.', 'NOT_FOUND');
  const ownershipId = `ownership-${randomUUID()}`;
  const settlementId = `settlement-${randomUUID()}`;
  const credit = await recordCreditEventInTransaction(client, {
    teamId: winning.team_id, roundId: 2, delta: -winning.amount,
    transactionType: 'round2_auction_settlement', referenceId: lot.id,
    details: { lotId: lot.id, winningBidId: winning.id, powerCardId: lot.power_card_id },
  });
  await client.query(
    `INSERT INTO team_power_cards(id,team_id,power_card_id,purchased_round_id,source,purchase_price,auction_lot_id)
     VALUES($1,$2,$3,2,'auction',$4,$5)`, [ownershipId, winning.team_id, lot.power_card_id, winning.amount, lot.id]);
  await client.query(
    `INSERT INTO round2_settlements(id,lot_id,power_card_id,team_id,winning_bid_id,ownership_id)
     VALUES($1,$2,$3,$4,$5,$6)`, [settlementId, lot.id, lot.power_card_id, winning.team_id, winning.id, ownershipId]);
  await client.query("UPDATE round2_auction_lots SET status='SETTLED',settled_at=now() WHERE id=$1 AND status='ACTIVE'", [lot.id]);
  return { success: true, duplicate: false, sold: true, lotId: lot.id, teamId: winning.team_id, winner: winnerTeam.rows[0].team_name, amount: winning.amount, balance: credit.balance };
}

export async function settleAuctionLot(pool: Pool, lotId: string): Promise<SettlementResult> {
  return withPostgresTransaction(pool, async (client) => {
    await lockEnabledConfig(client, 'SHARE');
    const result = await client.query<Lot>('SELECT id,sequence_number,power_card_id,status,starting_bid,active_at,ends_at FROM round2_auction_lots WHERE id=$1 FOR UPDATE', [lotId]);
    const lot = result.rows[0];
    if (!lot) throw new AuctionError('Auction lot was not found.', 'NOT_FOUND');
    return settleLockedLot(client, lot);
  });
}

export async function settleActiveAuction(pool: Pool, adminId: string): Promise<SettlementResult> {
  if (typeof adminId !== 'string' || !adminId.trim()) throw new AuctionError('Authenticated administrator is required.', 'FORBIDDEN');
  return withPostgresTransaction(pool, async (client) => {
    await lockEnabledConfig(client, 'SHARE');
    const lot = await getActiveLot(client);
    const result = await settleLockedLot(client, lot);
    await writeAdminAudit(client, { adminId, action: 'END', outcome: 'APPLIED', lotId: lot.id,
      previousState: { status: 'ACTIVE', powerCardId: lot.power_card_id, startingBid: lot.starting_bid },
      newState: { status: result.sold ? 'SETTLED' : 'CANCELLED', winnerId: result.teamId ?? null, winner: result.winner ?? null, amount: result.amount ?? null } });
    return result;
  });
}

export async function recordAuctionAdminAction(pool: Pool, adminId: string, action: 'RESET' | 'REMOVE_TEAM', details: Record<string, unknown>): Promise<void> {
  if (typeof adminId !== 'string' || !adminId.trim()) throw new AuctionError('Authenticated administrator is required.', 'FORBIDDEN');
  return withPostgresTransaction(pool, async (client) => {
    await lockEnabledConfig(client, 'SHARE');
    await writeAdminAudit(client, { adminId, action, outcome: 'REJECTED', details,
      previousState: { historyPreserved: true }, newState: { changed: false } });
  });
}

/** Called by a background poll; the config row lock makes a disable operation serialize with settlement. */
export async function settleExpiredAuction(pool: Pool): Promise<SettlementResult | null> {
  return withPostgresTransaction(pool, async (client) => {
    const enabled = await client.query<{ enabled: boolean }>('SELECT enabled FROM round2_auction_config WHERE id=1 FOR SHARE');
    if (enabled.rows[0]?.enabled !== true) return null;
    const result = await client.query<Lot>(
      "SELECT id,sequence_number,power_card_id,status,starting_bid,active_at,ends_at FROM round2_auction_lots WHERE status='ACTIVE' AND ends_at IS NOT NULL AND ends_at<=now() ORDER BY sequence_number DESC LIMIT 1 FOR UPDATE SKIP LOCKED");
    const lot = result.rows[0];
    return lot ? settleLockedLot(client, lot) : null;
  });
}

export async function getAuctionView(pool: Pool, teamId?: string) {
  const [cardsResult, liveResult, teamResult] = await Promise.all([
    pool.query(`WITH latest AS (
      SELECT DISTINCT ON (l.power_card_id) l.* FROM round2_auction_lots l ORDER BY l.power_card_id,l.sequence_number DESC
    )
    SELECT (pc.metadata->>'auctionCardId')::integer AS id,pc.name,pc.description,pc.base_price AS default_base,
      CASE WHEN latest.status='ACTIVE' THEN 'live' WHEN latest.status='SETTLED' THEN 'sold'
           WHEN latest.status='CANCELLED' THEN 'unsold' ELSE 'pending' END AS status,
      st.team_name AS winner,wb.amount AS price
    FROM power_cards pc LEFT JOIN latest ON latest.power_card_id=pc.id
    LEFT JOIN round2_settlements rs ON rs.lot_id=latest.id
    LEFT JOIN teams st ON st.id=rs.team_id LEFT JOIN round2_bids wb ON wb.id=rs.winning_bid_id
    WHERE pc.round_id=2 AND pc.is_active=true ORDER BY id`),
    pool.query(`SELECT l.id,l.sequence_number,l.power_card_id,(pc.metadata->>'auctionCardId')::integer AS card_id,
      l.starting_bid,l.ends_at,
      COALESCE((SELECT b.amount FROM round2_bids b WHERE b.lot_id=l.id ORDER BY b.amount DESC,b.placed_at ASC,b.id ASC LIMIT 1),0) AS high_bid,
      (SELECT t.team_name FROM round2_bids b JOIN teams t ON t.id=b.team_id WHERE b.lot_id=l.id ORDER BY b.amount DESC,b.placed_at ASC,b.id ASC LIMIT 1) AS high_bidder
      FROM round2_auction_lots l JOIN power_cards pc ON pc.id=l.power_card_id WHERE l.status='ACTIVE' LIMIT 1`),
    teamId ? pool.query(`SELECT t.team_name,t.total_credits,
      COALESCE((SELECT sum(-ct.delta)::integer FROM credit_transactions ct WHERE ct.team_id=t.id AND ct.transaction_type='round2_auction_settlement'),0) AS spent,
      COALESCE((SELECT json_agg(json_build_object('id',(pc.metadata->>'auctionCardId')::integer,'name',pc.name,'price',tpc.purchase_price) ORDER BY tpc.purchased_at)
        FROM team_power_cards tpc JOIN power_cards pc ON pc.id=tpc.power_card_id WHERE tpc.team_id=t.id AND tpc.source='auction'), '[]'::json) AS owned_cards
      FROM teams t WHERE t.id=$1`, [teamId]) : Promise.resolve({ rows: [] as never[] }),
  ]);
  const liveRow = liveResult.rows[0] as { id: string; card_id: number; starting_bid: number; ends_at: Date | null; high_bid: number; high_bidder: string | null } | undefined;
  let live: Record<string, unknown> | null = null;
  if (liveRow) {
    const bids = await pool.query<{ team_name: string; amount: number; placed_at: Date }>(
      `SELECT t.team_name,b.amount,b.placed_at FROM round2_bids b JOIN teams t ON t.id=b.team_id
       WHERE b.lot_id=$1 ORDER BY b.amount DESC,b.placed_at ASC,b.id ASC`, [liveRow.id]);
    const walletRow = teamResult.rows[0] as { team_name: string } | undefined;
    const myBid = walletRow ? bids.rows.find((b) => b.team_name === walletRow.team_name) : undefined;
    const isTeamView = Boolean(teamId);
    live = {
      cardId: liveRow.card_id,
      base: liveRow.starting_bid,
      highBid: isTeamView ? 0 : liveRow.high_bid,
      highBidder: isTeamView ? null : liveRow.high_bidder,
      endsAt: liveRow.ends_at?.getTime() ?? null,
      myBid: myBid?.amount ?? null,
      hasBid: Boolean(myBid),
      bids: isTeamView
        ? (myBid ? [{ team: myBid.team_name, amount: myBid.amount, t: myBid.placed_at.getTime() }] : [])
        : bids.rows.map((bid) => ({ team: bid.team_name, amount: bid.amount, t: bid.placed_at.getTime() })),
    };
  }
  const wallet = teamResult.rows[0] as { team_name: string; total_credits: number; spent: number; owned_cards: { id: number; name: string; price: number }[] } | undefined;
  const me = wallet ? { name: wallet.team_name, startCredits: wallet.total_credits + wallet.spent, spent: wallet.spent, credits: wallet.total_credits, cards: wallet.owned_cards } : null;
  return { success: true, now: Date.now(), cards: cardsResult.rows.map((card) => ({ ...card, defaultBase: card.default_base, default_base: undefined })), live,
    minIncrement: MINIMUM_INCREMENT, me };
}

export async function getAuctionOverview(pool: Pool) {
  const [base, teams, audit] = await Promise.all([getAuctionView(pool), pool.query(`SELECT t.id,t.team_name,t.total_credits,
      COALESCE((SELECT sum(-ct.delta)::integer FROM credit_transactions ct WHERE ct.team_id=t.id AND ct.transaction_type='round2_auction_settlement'),0) AS spent,
      COALESCE((SELECT json_agg(json_build_object('id',(pc.metadata->>'auctionCardId')::integer,'name',pc.name,'price',tpc.purchase_price) ORDER BY tpc.purchased_at)
        FROM team_power_cards tpc JOIN power_cards pc ON pc.id=tpc.power_card_id WHERE tpc.team_id=t.id AND tpc.source='auction'), '[]'::json) AS cards
      FROM teams t ORDER BY t.team_name,t.id`), pool.query(`SELECT a.id,a.admin_id,ad.username AS admin_username,a.action,a.outcome,a.lot_id,a.details,a.previous_state,a.new_state,a.created_at
      FROM round2_auction_admin_audit a JOIN admins ad ON ad.id=a.admin_id ORDER BY a.created_at DESC,a.id DESC LIMIT 50`)]);
  return { ...base, teams: teams.rows.map((team) => ({ name: team.team_name, startCredits: team.total_credits + team.spent,
    spent: team.spent, credits: team.total_credits, cards: team.cards })), audit: audit.rows };
}
