import type { Pool, PoolClient } from 'pg';

type Queryable = Pick<Pool | PoolClient, 'query'>;

/** Fail closed unless the PostgreSQL singleton explicitly enables Round 2. */
export async function isRound2AuctionEnabled(database: Queryable, lockForShare = false): Promise<boolean> {
  const result = await database.query<{ enabled: boolean }>(
    `SELECT enabled FROM round2_auction_config WHERE id=1${lockForShare ? ' FOR SHARE' : ''}`,
  );
  return result.rows[0]?.enabled === true;
}
