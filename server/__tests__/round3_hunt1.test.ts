// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';

const oldDbPath = process.env.SQLITE_DB_PATH;
const testDbPath = path.join(process.cwd(), 'database', `round3_hunt1_${process.pid}_${Date.now()}.db`);
process.env.SQLITE_DB_PATH = testDbPath;
const [{ app }, { db, hashPassword, initDatabase }] = await Promise.all([
  import('../index.ts'),
  import('../../database/db.ts'),
]);

describe('Round 3 Hunt 1 cooperative progression', () => {
  let server: Server;
  let baseUrl = '';
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const team = { id: `hunt1-test-${suffix}`, name: `Hunt1 Test ${suffix}`, password: 'Hunt#One2026' };
  let token = '';

  beforeAll(async () => {
    initDatabase();
    const now = new Date().toISOString();
    const { hash, salt } = hashPassword(team.password);
    db.prepare(`INSERT INTO teams (id, team_name, password_hash, salt, raw_password, is_paused, score, max_credits, total_credits, login_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, 0, 500, 500, 0, ?, ?)`)
      .run(team.id, team.name, hash, salt, team.password, now, now);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
    const login = await fetch(`${baseUrl}/api/auth/team-login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName: team.name, password: team.password }),
    });
    token = (await login.json() as { token: string }).token;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.prepare('DELETE FROM teams WHERE id = ?').run(team.id);
    db.close();
    for (const suffix of ['', '-wal', '-shm']) {
      const file = `${testDbPath}${suffix}`;
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    if (oldDbPath === undefined) delete process.env.SQLITE_DB_PATH;
    else process.env.SQLITE_DB_PATH = oldDbPath;
  });

  it('validates dependencies and answers, persists evidence, and requires both shutdown controls', async () => {
    const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const call = async (pathName: string, body?: unknown) => fetch(`${baseUrl}/api/round3${pathName}`, {
      method: body === undefined ? 'GET' : 'POST', headers: auth,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const act = async (actor: 'archivist' | 'tracker', objectId: string) => {
      const response = await call('/hunt1/action', { type: 'interact', actor, objectId });
      expect(response.status).toBe(200);
      return response.json() as Promise<{ success: boolean; message: string; state: { currentChallenge: number; completed: boolean; subtasks: Record<string, boolean>; inventory: string[]; score: number; evidence: Array<{ id: string }> } }>;
    };
    const submit = async (actor: 'archivist' | 'tracker', value: unknown) => {
      const response = await call('/hunt1/action', { type: 'submit', actor, value });
      expect(response.status).toBe(200);
      return response.json() as Promise<{ success: boolean; state: { currentChallenge: number; completed: boolean; subtasks: Record<string, boolean>; score: number; penalties: number } }>;
    };

    expect((await fetch(`${baseUrl}/api/round3/hunt1/session`, { method: 'POST' })).status).toBe(401);
    const opened = await call('/hunt1/session', {});
    expect(opened.status).toBe(200);

    const earlyClock = await act('tracker', 'stoppedClock');
    expect(earlyClock.state.inventory).not.toContain('maintenance-key');
    expect(earlyClock.state.currentChallenge).toBe(1);

    await act('archivist', 'desk');
    const wrongRiddle = await submit('archivist', { kind: 'riddle', answer: 'the reception desk' });
    expect(wrongRiddle.success).toBe(false);
    const riddle = await submit('archivist', { kind: 'riddle', answer: 'the stopped wall clock' });
    expect(riddle.state.subtasks.riddleSolved).toBe(true);
    const riddleScore = riddle.state.score;
    expect((await submit('archivist', { kind: 'riddle', answer: 'the stopped wall clock' })).state.score).toBe(riddleScore);
    const key = await act('tracker', 'stoppedClock');
    expect(key.state.currentChallenge).toBe(2);
    expect(key.state.inventory).toContain('maintenance-key');

    const lockedByKey = await act('archivist', 'desk');
    expect(lockedByKey.state.subtasks.drawerUnlocked).toBe(true);
    const report = await act('archivist', 'desk');
    expect(report.state.subtasks.originalReportCollected).toBe(true);
    expect(report.state.currentChallenge).toBe(2);
    expect(report.state.subtasks.reportReconstructed).not.toBe(true);
    const fragment = await act('tracker', 'reportFragment');
    expect(fragment.state.currentChallenge).toBe(3);
    expect(fragment.state.subtasks.reportReconstructed).toBe(true);

    const earlyFrequency = await submit('tracker', { kind: 'transmitter-frequency', frequency: 740 });
    expect(earlyFrequency.state.currentChallenge).toBe(3);
    await act('archivist', 'rec');
    const wrongFrequency = await submit('archivist', { kind: 'frequency-analysis', frequency: 700 });
    expect(wrongFrequency.success).toBe(false);
    expect(wrongFrequency.state.penalties).toBeGreaterThan(0);
    expect(wrongFrequency.state.currentChallenge).toBe(3);
    const decoded = await submit('archivist', { kind: 'frequency-analysis', frequency: 740 });
    expect(decoded.state.subtasks.frequencyDecoded).toBe(true);
    const decodedScore = decoded.state.score;
    expect((await submit('archivist', { kind: 'frequency-analysis', frequency: 740 })).state.score).toBe(decodedScore);
    await act('tracker', 'transmitter');
    const entered = await submit('tracker', { kind: 'transmitter-frequency', frequency: 740 });
    expect(entered.state.currentChallenge).toBe(4);

    await act('archivist', 'circuitDiagram');
    const wiring = ['power', 'capacitor', 'resonance-coil', 'output'];
    expect((await submit('archivist', { kind: 'circuit-deduction', order: wiring })).state.subtasks.wiringValidated).toBe(true);
    await act('tracker', 'panel');
    for (const part of ['componentCapacitor', 'componentCoil', 'componentOutput']) await act('tracker', part);
    const restored = await submit('tracker', { kind: 'circuit-installation', order: wiring });
    expect(restored.state.currentChallenge).toBe(5);
    expect(restored.state.subtasks.circuitRestored).toBe(true);

    await act('archivist', 'calibrationConsole');
    const calibration = { kind: 'calibration', frequency: 740, mode: 'antiphase' };
    expect((await submit('archivist', calibration)).state.subtasks.calibrationValidated).toBe(true);
    await act('tracker', 'transmitter');
    const configured = await submit('tracker', { kind: 'transmitter-configuration', frequency: 740, mode: 'antiphase' });
    expect(configured.state.subtasks.transmitterConfigured).toBe(true);
    await act('archivist', 'calibrationConsole');
    await act('tracker', 'transmitter');
    expect((await call('/hunt1/state')).status).toBe(200);
    const toFinal = await call('/hunt1/state');
    expect((await toFinal.json() as { state: { currentChallenge: number } }).state.currentChallenge).toBe(6);

    await act('archivist', 'shutdownConsole');
    await act('tracker', 'emergencyBreaker');
    const first = await act('archivist', 'shutdownConsole');
    expect(first.state.completed).toBe(false);
    const finished = await act('tracker', 'emergencyBreaker');
    expect(finished.state.completed).toBe(true);
    expect(finished.state.score).toBeGreaterThan(0);

    const persisted = await call('/hunt1/state');
    const saved = (await persisted.json() as { state: { completed: boolean; currentChallenge: number; evidence: Array<{ id: string }> } }).state;
    expect(saved.completed).toBe(true);
    expect(saved.currentChallenge).toBe(6);
    expect(saved.evidence.some((item) => item.id === 'reconstructed-maintenance-report')).toBe(true);
  });
});
