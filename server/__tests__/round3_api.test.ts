// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';

const previousDbPath = process.env.SQLITE_DB_PATH;
const testDbPath = path.join(process.cwd(), 'database', `round3_test_${process.pid}_${Date.now()}.db`);
process.env.SQLITE_DB_PATH = testDbPath;
const [{ app }, { db, hashPassword, initDatabase }, { awardRound3Score }] = await Promise.all([
  import('../index.ts'),
  import('../../database/db.ts'),
  import('../services/round3.service.ts'),
]);

describe('Round 3 isolated team sessions and persistence', () => {
  let server: Server;
  let baseUrl = '';
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const teams = [
    { id: `round3-test-a-${suffix}`, name: `Round3 A ${suffix}`, password: 'Paradox#A1' },
    { id: `round3-test-b-${suffix}`, name: `Round3 B ${suffix}`, password: 'Paradox#B1' },
  ];
  const tokens: string[] = [];

  beforeAll(async () => {
    initDatabase();
    const now = new Date().toISOString();
    const insert = db.prepare(`INSERT INTO teams (id, team_name, password_hash, salt, raw_password, is_paused, score, max_credits, total_credits, login_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, 0, 500, 500, 0, ?, ?)`);
    for (const team of teams) {
      const { hash, salt } = hashPassword(team.password);
      insert.run(team.id, team.name, hash, salt, team.password, now, now);
    }
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
    for (const team of teams) {
      const response = await fetch(`${baseUrl}/api/auth/team-login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: team.name, password: team.password }),
      });
      const data = await response.json() as { token: string };
      tokens.push(data.token);
    }
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    for (const team of teams) db.prepare('DELETE FROM teams WHERE id = ?').run(team.id);
    db.close();
    for (const suffix of ['', '-wal', '-shm']) {
      const file = `${testDbPath}${suffix}`;
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    if (previousDbPath === undefined) delete process.env.SQLITE_DB_PATH;
    else process.env.SQLITE_DB_PATH = previousDbPath;
  });

  it('requires existing team auth and keeps progress/inventory isolated and durable', async () => {
    const unauthorized = await fetch(`${baseUrl}/api/round3/session`, { method: 'POST' });
    expect(unauthorized.status).toBe(401);

    const headersA = { Authorization: `Bearer ${tokens[0]}`, 'Content-Type': 'application/json' };
    const headersB = { Authorization: `Bearer ${tokens[1]}`, 'Content-Type': 'application/json' };
    expect((await fetch(`${baseUrl}/api/round3/session`, { method: 'POST', headers: headersA, body: '{}' })).status).toBe(200);
    expect((await fetch(`${baseUrl}/api/round3/session`, { method: 'POST', headers: headersB, body: '{}' })).status).toBe(200);

    const progress = await fetch(`${baseUrl}/api/round3/progress`, {
      method: 'PATCH', headers: headersA,
      body: JSON.stringify({
        playerProgress: { checkpoint: 'threshold-1', engine: { phase: 'playing', huntIndex: 2, score: 35, players: [{ timeline: 'past', x: 1 }, { timeline: 'future', x: 2 }], journal: [] } },
        timelines: { past: { clue: 'ash' }, future: { clue: 'signal' } }, activeTimeline: 'future',
        currentHunt: 'paradox-hunt-3', evidenceDiscoveries: ['h2-future-clock-fragment'],
      }),
    });
    expect(progress.status).toBe(200);

    const evidence = await fetch(`${baseUrl}/api/round3/evidence/clock-fragment/discover`, { method: 'POST', headers: headersA, body: '{}' });
    expect((await evidence.json()).evidenceDiscoveries).toEqual(['h2-future-clock-fragment', 'clock-fragment']);

    db.prepare(`INSERT INTO round3_inventory (team_id, card_id, source, quantity) VALUES (?, 'emergency-power-cell', 'development', 2)`).run(teams[0].id);
    db.prepare(`INSERT INTO round3_inventory (team_id, card_id, source, quantity) VALUES (?, 'emergency-power-cell', 'auction', 3)`).run(teams[0].id);
    expect(awardRound3Score(teams[0].id, 35)).toBe(true);

    const otherTeamState = await fetch(`${baseUrl}/api/round3/state`, { headers: { Authorization: `Bearer ${tokens[1]}` } });
    const otherData = await otherTeamState.json();
    expect(otherData.session.playerProgress).toEqual({});
    expect(otherData.inventory).toEqual([]);

    const activate = await fetch(`${baseUrl}/api/round3/cards/emergency-power-cell/activate`, { method: 'POST', headers: headersA, body: JSON.stringify({ source: 'development' }) });
    expect(activate.status).toBe(200);
    const activationData = await activate.json();
    expect(activationData.usage.source).toBe('development');
    expect(activationData.usage.remainingQuantity).toBe(1);

    await fetch(`${baseUrl}/api/round3/complete`, { method: 'POST', headers: headersA, body: '{}' });
    const persisted = await fetch(`${baseUrl}/api/round3/state`, { headers: { Authorization: `Bearer ${tokens[0]}` } });
    const data = await persisted.json();
    expect(data.session.activeTimeline).toBe('future');
    expect(data.session.timelines.past).toEqual({ clue: 'ash' });
    expect(data.session.timelines.future).toEqual({ clue: 'signal' });
    expect(data.session.evidenceDiscoveries).toEqual(['h2-future-clock-fragment', 'clock-fragment']);
    expect(data.session.playerProgress.engine.huntIndex).toBe(2);
    expect(data.session.score).toBe(35);
    expect(data.session.completed).toBe(true);
    expect(data.session.currentHunt).toBe('paradox-hunt-3');
    expect(data.inventory).toEqual([
      { cardId: 'emergency-power-cell', quantity: 3, source: 'auction' },
      { cardId: 'emergency-power-cell', quantity: 1, source: 'development' },
    ]);
    expect(data.session.cardUsage).toHaveLength(1);
  });
});
