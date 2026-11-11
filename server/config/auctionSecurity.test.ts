import { describe, expect, it } from 'vitest';
import { isRound2AuctionEnabled } from './auctionSecurity.ts';

describe('PostgreSQL Round 2 auction gate', () => {
  it('fails closed when the singleton is missing or disabled', async () => {
    expect(await isRound2AuctionEnabled({ query: async () => ({ rows: [] }) } as never)).toBe(false);
    expect(await isRound2AuctionEnabled({ query: async () => ({ rows: [{ enabled: false }] }) } as never)).toBe(false);
  });

  it('only opens when PostgreSQL explicitly reports enabled', async () => {
    expect(await isRound2AuctionEnabled({ query: async () => ({ rows: [{ enabled: true }] }) } as never)).toBe(true);
    await expect(isRound2AuctionEnabled({ query: async () => { throw new Error('database unavailable'); } } as never)).rejects.toThrow('database unavailable');
  });
});
