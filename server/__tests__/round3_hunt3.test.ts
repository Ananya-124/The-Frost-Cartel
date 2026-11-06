// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Hunt3ActionResult, Hunt3Actor, Hunt3State } from '../../src/types/hunt3.types.ts';

const previousDbPath = process.env.SQLITE_DB_PATH;
const dbPath = path.join(process.cwd(), 'database', `round3_hunt3_${process.pid}_${Date.now()}.db`);
process.env.SQLITE_DB_PATH = dbPath;
const [{ app }, { db, hashPassword, initDatabase }, hunt2] = await Promise.all([import('../index.ts'), import('../../database/db.ts'), import('../services/round3-hunt2.service.ts')]);

describe('Round 3 Hunt III final containment', () => {
  let server: Server; let baseUrl = '';
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const team = { id: `hunt3-${suffix}`, name: `Hunt3 ${suffix}`, password: 'Hunt#Three2026' };
  const token: Record<Hunt3Actor, string> = { archivist: '', tracker: '' };

  beforeAll(async () => {
    initDatabase(); const now = new Date().toISOString(); const { hash, salt } = hashPassword(team.password);
    db.prepare(`INSERT INTO teams (id, team_name, password_hash, salt, raw_password, is_paused, score, max_credits, total_credits, login_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, 0, 500, 500, 0, ?, ?)`)
      .run(team.id, team.name, hash, salt, team.password, now, now);
    await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', () => { const address = server.address(); if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`; resolve(); }); });
    for (const actor of ['archivist', 'tracker'] as const) {
      const login = await fetch(`${baseUrl}/api/auth/team-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamName: team.name, password: team.password }) });
      const result = await login.json() as { token: string; playerNumber: number };
      expect(result.playerNumber).toBe(actor === 'archivist' ? 1 : 2); token[actor] = result.token;
    }
    // This test focuses on Hunt III; the prior hunt's completion is server-owned state.
    const priorHunt = hunt2.ensureRound3Hunt2State(team.id); priorHunt.completed = true;
    db.prepare('UPDATE round3_hunt2_sessions SET state_json=?,updated_at=? WHERE team_id=?').run(JSON.stringify(priorHunt), now, team.id);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.prepare('DELETE FROM teams WHERE id=?').run(team.id); db.close();
    for (const suffix of ['', '-wal', '-shm']) { const file = `${dbPath}${suffix}`; if (fs.existsSync(file)) fs.unlinkSync(file); }
    if (previousDbPath === undefined) delete process.env.SQLITE_DB_PATH; else process.env.SQLITE_DB_PATH = previousDbPath;
  });

  it('validates cooperative stage progression, role access, scoring, duplicate protection, refresh, and expiry', async () => {
    const call = async (actor: Hunt3Actor, endpoint: string, body?: unknown) => fetch(`${baseUrl}/api/round3${endpoint}`, {
      method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token[actor]}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
    });
    const act = async (actor: Hunt3Actor, id: string) => {
      const response = await call(actor, '/hunt3/action', { type: 'interact', id }); expect(response.status).toBe(200); return response.json() as Promise<Hunt3ActionResult>;
    };
    const submit = async (actor: Hunt3Actor, id: string, value: unknown) => {
      const response = await call(actor, '/hunt3/action', { type: 'submit', id, value }); expect(response.status).toBe(200); return response.json() as Promise<Hunt3ActionResult>;
    };
    await call('archivist', '/session', {}); await call('archivist', '/run/start', {});
    const opened = await call('tracker', '/hunt3/session', {});
    if (opened.status !== 200) throw new Error(`Hunt III session open failed (${opened.status}): ${await opened.text()}`);
    expect((await call('archivist', '/hunt3/action', { type: 'interact', id: 'sighting-ledger', actor: 'tracker' })).status).toBe(403);

    for (const id of ['sighting-ledger', 'containment-observation', 'old-facility-report']) await act('archivist', id);
    const historical = await submit('archivist', 'trail-location', { location: 'east-wing' });
    expect(historical.state.trail.tracker).toBeNull();
    for (const id of ['cold-ash', 'drag-marks', 'shattered-compass']) await act('tracker', id);
    let result = await submit('tracker', 'trail-location', { location: 'cold-star' });
    expect(result.state.stage).toBe(2); expect(result.state.scoreBreakdown.stage1).toBe(250);

    for (const seal of ['power', 'resonance', 'memory'] as const) {
      await act('archivist', `${seal}-diagram`);
      if (seal === 'power') expect((await act('tracker', 'power-diagram')).success).toBe(false);
      expect((await act('tracker', `${seal}-mechanism`)).success).toBe(true);
      if (seal === 'power') {
        expect((await submit('archivist', 'seal-power', { sequence: ['source', 'ground', 'return'] })).success).toBe(false);
        expect((await submit('tracker', 'seal-power', { sequence: ['source', 'return', 'ground'] })).success).toBe(false);
        result = await submit('tracker', 'seal-power', { sequence: ['source', 'ground', 'return'] });
      }
      if (seal === 'resonance') result = await submit('tracker', 'seal-resonance', { settings: { frequency: 'low', phase: 'two', carrier: 'muted' } });
      if (seal === 'memory') result = await submit('tracker', 'seal-memory', { cadence: [1, 2, 1] });
      expect(result.success).toBe(true);
    }
    await act('archivist', 'component-catalog');
    for (const part of ['induction-coil', 'prism-lens', 'grounding-braid', 'memory-core']) await act('tracker', `recover-${part}`);
    result = await (await call('tracker', '/hunt3/state')).json() as Hunt3ActionResult;
    expect(result.state.scoreBreakdown.stage2).toBe(400);
    const loaded = await (await call('tracker', '/hunt3/state')).json() as { state: Hunt3State };
    expect(loaded.state.stage).toBe(3); expect(loaded.state.components).toHaveLength(4);

    await act('archivist', 'apparatus-blueprint'); await act('archivist', 'weakness-notes');
    await submit('archivist', 'apparatus', { sequence: ['coil:west', 'lens:center', 'braid:ground', 'core:east'] });
    await act('tracker', 'physical-apparatus');
    await submit('tracker', 'apparatus', { sequence: ['coil:west', 'lens:center', 'braid:ground', 'core:east'] });
    await act('tracker', 'test-station');
    for (const [condition, reading] of [['frequency-low', 'withdrawal'], ['light-dark', 'surge'], ['temperature-cold', 'withdrawal']]) await submit('tracker', 'weakness-trial', { condition, reading });
    expect((await submit('archivist', 'weakness-conclusion', { profile: ['frequency-low', 'light-dark', 'temperature-cold'] })).success).toBe(true);
    await act('archivist', 'lure-control');
    for (let i = 0; i < 3; i += 1) await act('tracker', 'disruptor');
    expect((await call('tracker', '/hunt3/state').then((r) => r.json()) as { state: Hunt3State }).state.stage).toBe(4);

    // Hidden paired evidence awards once and is available after environmental discovery.
    await act('archivist', 'secret-inscription');
    result = await act('tracker', 'secret-residue');
    expect(result.state.scoreBreakdown.optional).toBe(100);
    await act('tracker', 'secret-residue');
    expect((await call('tracker', '/hunt3/state').then((r) => r.json()) as { state: Hunt3State }).state.scoreBreakdown.optional).toBe(100);

    const boss: Array<[Hunt3Actor, string]> = [['archivist', 'hold-record'], ['tracker', 'ground-current'], ['archivist', 'release-memory'], ['tracker', 'vent-pressure'], ['archivist', 'lock-sequence']];
    for (const [actor, id] of boss) { await new Promise((resolve) => setTimeout(resolve, 710)); result = await act(actor, id); }
    const persisted = db.prepare('SELECT state_json FROM round3_hunt3_sessions WHERE team_id=?').get(team.id) as { state_json: string };
    const late = JSON.parse(persisted.state_json) as Hunt3State; late.boss.deadlineAt = Date.now() - 1;
    db.prepare('UPDATE round3_hunt3_sessions SET state_json=? WHERE team_id=?').run(JSON.stringify(late), team.id);
    result = await act('tracker', 'close-containment'); expect(result.success).toBe(false); expect(result.message).toContain('warning window closed');
    await new Promise((resolve) => setTimeout(resolve, 710)); await act('archivist', 'lock-sequence');
    await new Promise((resolve) => setTimeout(resolve, 710)); result = await act('tracker', 'close-containment');
    expect(result.state.completed).toBe(true); expect(result.state.scoreBreakdown.stage4).toBe(500); expect(result.state.score).toBe(1580);
    result = await act('tracker', 'close-containment'); expect(result.state.score).toBe(1580);
    const restored = await (await call('archivist', '/hunt3/state')).json() as { state: Hunt3State };
    expect(restored.state.completed).toBe(true); expect(restored.state.score).toBe(1580);

    await call('archivist', '/progress', { playerProgress: { engine: { score: 999999 } } });
    const official = await (await call('tracker', '/state')).json() as { session: { score: number } };
    expect(official.session.score).toBe(1580);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', () => { const address = server.address(); if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`; resolve(); }); });
    expect((await call('tracker', '/hunt3/state').then((r) => r.json()) as { state: Hunt3State }).state.score).toBe(1580);
    db.prepare("UPDATE round3_runs SET status='running',remaining_ms=1,started_at=? WHERE team_id=?").run(new Date(Date.now() - 1000).toISOString(), team.id);
    expect((await call('tracker', '/hunt3/action', { type: 'interact', id: 'close-containment' })).status).toBe(409);
    expect((await call('tracker', '/state').then((r) => r.json()) as { session: { score: number } }).session.score).toBe(1580);
  });
});
