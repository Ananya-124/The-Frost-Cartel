// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { app } from '../index.ts';
import { initDatabase } from '../../database/db.ts';

const ADMIN_KEY = process.env.ROUND2_ADMIN_KEY || 'frost-r2-admin';

describe('Round 2 — Haunted Auction API (player flow)', () => {
  let server: Server;
  let base = '';

  const call = async (path: string, method = 'GET', body?: unknown, admin = false) => {
    const res = await fetch(`${base}/api/round2${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(admin ? { 'x-round2-key': ADMIN_KEY } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, json: (await res.json()) as any };
  };

  beforeAll(async () => {
    initDatabase();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') base = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
    await call('/admin/reset', 'POST', {}, true);
  });

  afterAll(async () => {
    await call('/admin/reset', 'POST', {}, true);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('rejects admin calls without the key', async () => {
    const r = await call('/admin/start', 'POST', { cardId: 1 });
    expect(r.status).toBe(401);
  });

  it('lets teams join and shows no live card at first', async () => {
    const a = await call('/join', 'POST', { teamName: 'Alpha', credits: 300 });
    const b = await call('/join', 'POST', { teamName: 'Beta', credits: 200 });
    await call('/join', 'POST', { teamName: 'Early Team', credits: 0 });
    const refreshed = await call('/join', 'POST', { teamName: 'Early Team', credits: 175 });
    expect(a.json.me.credits).toBe(300);
    expect(b.json.me.credits).toBe(200);
    expect(refreshed.json.me.credits).toBe(175);
    expect(a.json.live).toBeNull();
    expect(a.json.cards).toHaveLength(11);
    expect(a.json.cards.map((card: { name: string }) => card.name)).toEqual([
      'Chrono Freeze',
      'Witching Hour',
      'Spectral Sight',
      "Witch's Lens",
      'Hexbreaker',
      "Mechanic's Curse",
      "Witch's Elixir",
      "Raven's Messenger",
      'Phantom Shield',
      'Soul Surge',
      "The Warden's Decree — Master Card",
    ]);
    expect(a.json.cards[10].description).toContain('enforce the pause manually');
    const noCard = await call('/bid', 'POST', { teamName: 'Alpha', amount: 100 });
    expect(noCard.status).toBe(409);
  });

  it('shows the live card to players as soon as the admin starts it', async () => {
    const start = await call('/admin/start', 'POST', { cardId: 1, basePrice: 100, durationSeconds: 0 }, true);
    expect(start.json.success).toBe(true);
    const seen = await call('/state?team=Alpha');
    expect(seen.json.live.cardId).toBe(1);
    expect(seen.json.live.base).toBe(100);
    expect(seen.json.cards.find((c: any) => c.id === 1).status).toBe('live');
  });

  it('enforces the bidding rules', async () => {
    expect((await call('/bid', 'POST', { teamName: 'Alpha', amount: 90 })).status).toBe(400); // below base
    expect((await call('/bid', 'POST', { teamName: 'Ghost', amount: 100 })).status).toBe(403); // never joined
    expect((await call('/bid', 'POST', { teamName: 'Alpha', amount: 100 })).json.live.highBidder).toBe('Alpha');
    expect((await call('/join', 'POST', { teamName: 'Alpha', credits: 450 })).json.me.credits).toBe(300);
    expect((await call('/bid', 'POST', { teamName: 'Alpha', amount: 150 })).status).toBe(409); // already leading
    expect((await call('/bid', 'POST', { teamName: 'Beta', amount: 105 })).status).toBe(400); // under the +10 step
    expect((await call('/bid', 'POST', { teamName: 'Beta', amount: 250 })).status).toBe(400); // more than Beta owns
    expect((await call('/bid', 'POST', { teamName: 'Beta', amount: 110 })).json.live.highBidder).toBe('Beta');
    expect((await call('/bid', 'POST', { teamName: 'alpha', amount: 120 })).json.live.highBidder).toBe('Alpha'); // name is case-insensitive
  });

  it('sells the card to the top bidder, spends credits and keeps the card', async () => {
    await call('/admin/end', 'POST', {}, true);
    const s = await call('/state?team=Alpha');
    expect(s.json.live).toBeNull();
    const card = s.json.cards.find((c: any) => c.id === 1);
    expect(card.status).toBe('sold');
    expect(card.winner).toBe('Alpha');
    expect(s.json.me.credits).toBe(180);
    expect(s.json.me.cards).toEqual([{ id: 1, name: 'Chrono Freeze', price: 120 }]);
    expect((await call('/join', 'POST', { teamName: 'Alpha', credits: 500 })).json.me.credits).toBe(180);
    expect((await call('/state?team=Beta')).json.me.credits).toBe(200);
  });

  it('marks a card unsold when nobody bids, and allows starting it again', async () => {
    await call('/admin/start', 'POST', { cardId: 3, durationSeconds: 0 }, true);
    await call('/admin/end', 'POST', {}, true);
    expect((await call('/state?team=Beta')).json.cards.find((c: any) => c.id === 3).status).toBe('unsold');
    const again = await call('/admin/start', 'POST', { cardId: 3, durationSeconds: 0 }, true);
    expect(again.json.success).toBe(true);
    await call('/admin/end', 'POST', {}, true);
  });

  it('does not crash or lose credits when a leading team is removed mid-auction', async () => {
    await call('/admin/start', 'POST', { cardId: 2, basePrice: 100, durationSeconds: 0 }, true);
    await call('/bid', 'POST', { teamName: 'Beta', amount: 100 });
    const removal = await call('/admin/team/Beta', 'DELETE', undefined, true);
    expect(removal.status).toBe(409); // leader cannot be removed
    const end = await call('/admin/end', 'POST', {}, true);
    expect(end.json.success).toBe(true);
    expect((await call('/state?team=Beta')).json.me.cards).toHaveLength(1);
  });

  it('extends the timer when a bid lands in the last seconds (anti-sniping)', async () => {
    await call('/admin/start', 'POST', { cardId: 4, basePrice: 50, durationSeconds: 1 }, true);
    const bid = await call('/bid', 'POST', { teamName: 'Alpha', amount: 50 });
    const left = bid.json.live.endsAt - bid.json.now;
    expect(left).toBeGreaterThan(8000);
    expect(left).toBeLessThanOrEqual(10100);
    await call('/admin/end', 'POST', {}, true);
    expect((await call('/state?team=Alpha')).json.cards.find((c: any) => c.id === 4).winner).toBe('Alpha');
  });

  it('closes a timed card on its own and rejects late bids', async () => {
    await call('/admin/start', 'POST', { cardId: 5, basePrice: 50, durationSeconds: 1 }, true);
    await new Promise((r) => setTimeout(r, 1700));
    const s = await call('/state?team=Alpha');
    expect(s.json.live).toBeNull();
    expect(s.json.cards.find((c: any) => c.id === 5).status).toBe('unsold');
    expect((await call('/bid', 'POST', { teamName: 'Beta', amount: 60 })).status).toBe(409);
  });
});
