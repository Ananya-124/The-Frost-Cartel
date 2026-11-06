// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';

const oldDbPath = process.env.SQLITE_DB_PATH;
const testDbPath = path.join(process.cwd(), 'database', `round3_hunt2_${process.pid}_${Date.now()}.db`);
process.env.SQLITE_DB_PATH = testDbPath;
const [{ app }, { db, hashPassword, initDatabase }] = await Promise.all([import('../index.ts'), import('../../database/db.ts')]);

describe('Round 3 Hunt 2 cooperative progression', () => {
  let server: Server;
  let baseUrl = '';
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const team = { id: `hunt2-test-${suffix}`, name: `Hunt2 Test ${suffix}`, password: 'Hunt#Two2026' };
  let token = '';

  beforeAll(async () => {
    initDatabase();
    const now = new Date().toISOString();
    const { hash, salt } = hashPassword(team.password);
    db.prepare(`INSERT INTO teams (id, team_name, password_hash, salt, raw_password, is_paused, score, max_credits, total_credits, login_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, 0, 500, 500, 0, ?, ?)`)
      .run(team.id, team.name, hash, salt, team.password, now, now);
    await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', () => { const address = server.address(); if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`; resolve(); }); });
    const login = await fetch(`${baseUrl}/api/auth/team-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamName: team.name, password: team.password }) });
    token = (await login.json() as { token: string }).token;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.prepare('DELETE FROM teams WHERE id = ?').run(team.id);
    db.close();
    for (const suffix of ['', '-wal', '-shm']) { const file = `${testDbPath}${suffix}`; if (fs.existsSync(file)) fs.unlinkSync(file); }
    if (oldDbPath === undefined) delete process.env.SQLITE_DB_PATH; else process.env.SQLITE_DB_PATH = oldDbPath;
  });

  it('validates all five challenge dependencies, penalties, score deduplication, and persistence', async () => {
    const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const call = async (pathName: string, body?: unknown) => fetch(`${baseUrl}/api/round3${pathName}`, { method: body === undefined ? 'GET' : 'POST', headers: auth, body: body === undefined ? undefined : JSON.stringify(body) });
    const act = async (actor: 'archivist' | 'tracker', objectId: string) => {
      const response = await call('/hunt2/action', { type: 'interact', actor, objectId });
      expect(response.status).toBe(200);
      return response.json() as Promise<{ success: boolean; message: string; input?: string; state: { currentChallenge: number; completed: boolean; subtasks: Record<string, boolean>; score: number; penalties: number; inspectedManifestations: string[]; inspectedFurniture: string[]; inspectedAnchors: string[]; mechanismsActivated: string[] } }>;
    };
    const submit = async (actor: 'archivist' | 'tracker', value: unknown) => {
      const response = await call('/hunt2/action', { type: 'submit', actor, value });
      expect(response.status).toBe(200);
      return response.json() as Promise<{ success: boolean; state: { currentChallenge: number; completed: boolean; subtasks: Record<string, boolean>; score: number; penalties: number } }>;
    };

    expect((await fetch(`${baseUrl}/api/round3/hunt2/state`)).status).toBe(401);
    expect((await call('/hunt2/session', {})).status).toBe(200);
    const optional = await act('tracker', 'optionalAnomaly');
    expect(optional.state.currentChallenge).toBe(1);
    const optionalScore = optional.state.score;
    expect((await act('tracker', 'optionalAnomaly')).state.score).toBe(optionalScore);
    await call('/hunt2/action', { type: 'hint', actor: 'archivist' });
    await call('/hunt2/action', { type: 'hint', actor: 'tracker' });
    const hintPenalty = (await call('/hunt2/state').then((r) => r.json()) as { state: { penalties: number } }).state.penalties;
    expect(hintPenalty).toBe(50);
    await call('/hunt2/action', { type: 'hint', actor: 'tracker' });
    expect((await call('/hunt2/state').then((r) => r.json()) as { state: { penalties: number } }).state.penalties).toBe(50);
    const blockedDoor = await act('tracker', 'falseDoor3');
    expect(blockedDoor.state.currentChallenge).toBe(1);
    await act('archivist', 'memoryDoorRoom');
    expect((await submit('archivist', { kind: 'door', door: 2 })).success).toBe(false);
    expect((await submit('archivist', { kind: 'door', door: 3 })).state.subtasks.genuineDoorIdentified).toBe(true);
    const afterDoorScore = (await call('/hunt2/state').then((r) => r.json()) as { state: { score: number } }).state.score;
    await submit('archivist', { kind: 'door', door: 3 });
    expect((await call('/hunt2/state').then((r) => r.json()) as { state: { score: number } }).state.score).toBe(afterDoorScore);
    expect((await act('tracker', 'falseDoor2')).state.subtasks.genuineExitOpened).not.toBe(true);
    expect((await act('tracker', 'falseDoor3')).state.currentChallenge).toBe(2);

    for (const id of ['manifestationA', 'manifestationB', 'manifestationC']) await act('tracker', id);
    expect((await submit('tracker', { kind: 'manifestation', manifestation: 'manifestationB' })).state.currentChallenge).toBe(2);
    await act('archivist', 'identityMemory');
    expect((await submit('archivist', { kind: 'characteristic', characteristic: 'no shadow' })).success).toBe(false);
    await submit('archivist', { kind: 'characteristic', characteristic: 'reversed reflection' });
    expect((await submit('tracker', { kind: 'manifestation', manifestation: 'manifestationA' })).success).toBe(false);
    expect((await submit('tracker', { kind: 'manifestation', manifestation: 'manifestationB' })).state.currentChallenge).toBe(3);

    await act('archivist', 'layoutMemory');
    const arrangement = ['chair', 'mirror', 'table', 'lamp'];
    await submit('archivist', { kind: 'arrangement', order: arrangement });
    for (const id of ['layoutChair', 'layoutMirror', 'layoutTable', 'layoutLamp']) await act('tracker', id);
    expect((await submit('tracker', { kind: 'arrangement', order: ['mirror', 'chair', 'table', 'lamp'] })).success).toBe(false);
    expect((await submit('tracker', { kind: 'arrangement', order: arrangement })).state.currentChallenge).toBe(4);

    for (const id of ['memoryAnchorA', 'memoryAnchorB', 'memoryAnchorC']) await act('tracker', id);
    expect((await submit('tracker', { kind: 'anchor', anchor: 'memoryAnchorC' })).state.currentChallenge).toBe(4);
    await act('archivist', 'anchorMemory');
    await submit('archivist', { kind: 'anchor-pattern', pattern: 'pulse-pause-double-pulse' });
    expect((await submit('tracker', { kind: 'anchor', anchor: 'memoryAnchorA' })).success).toBe(false);
    expect((await submit('tracker', { kind: 'anchor', anchor: 'memoryAnchorC' })).state.currentChallenge).toBe(5);

    await act('archivist', 'finalSequenceMemory');
    const sequence = ['arrival', 'alarm', 'containment-failure'];
    expect((await submit('archivist', { kind: 'final-sequence', order: ['alarm', 'arrival', 'containment-failure'] })).success).toBe(false);
    await submit('archivist', { kind: 'final-sequence', order: sequence });
    await act('archivist', 'finalSequenceMemory');
    for (const id of ['mechanismB', 'mechanismA', 'mechanismC']) await act('tracker', id);
    await act('archivist', 'finalMemoryConsole');
    await act('tracker', 'trueMemoryAnchor');
    expect((await act('archivist', 'finalMemoryConsole')).state.completed).toBe(false);
    const finished = await act('tracker', 'trueMemoryAnchor');
    expect(finished.state.completed).toBe(true);
    expect(finished.state.score).toBeGreaterThan(0);
    expect(finished.state.currentChallenge).toBe(5);
    const saved = (await call('/hunt2/state').then((r) => r.json()) as { state: { completed: boolean; subtasks: Record<string, boolean> } }).state;
    expect(saved.completed).toBe(true);
    expect(saved.subtasks.trueAnchorActivated).toBe(true);
  });
});
