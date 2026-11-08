// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';

const oldDbPath = process.env.SQLITE_DB_PATH;
const testDbPath = path.join(process.cwd(), 'database', `round3_hunt1_${process.pid}_${Date.now()}.db`);
process.env.SQLITE_DB_PATH = testDbPath;
const [{ app }, { db, hashPassword, initDatabase }] = await Promise.all([import('../index.ts'), import('../../database/db.ts')]);

describe('Round 3 Hunt I — four retained incident tasks', () => {
  let server: Server;
  let baseUrl = '';
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const team = { id: `hunt1-test-${suffix}`, name: `Hunt1 Test ${suffix}`, password: 'Hunt#One2026' };
  const tokens: Record<'archivist' | 'tracker', string> = { archivist: '', tracker: '' };

  beforeAll(async () => {
    initDatabase();
    const now = new Date().toISOString();
    const { hash, salt } = hashPassword(team.password);
    db.prepare(`INSERT INTO teams (id, team_name, password_hash, salt, raw_password, is_paused, score, max_credits, total_credits, login_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, 0, 500, 500, 0, ?, ?)`)
      .run(team.id, team.name, hash, salt, team.password, now, now);
    await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', () => { const address = server.address(); if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`; resolve(); }); });
    for (const actor of ['archivist', 'tracker'] as const) {
      const login = await fetch(`${baseUrl}/api/auth/team-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamName: team.name, password: team.password }) });
      const result = await login.json() as { token: string; playerNumber: number };
      expect(result.playerNumber).toBe(actor === 'archivist' ? 1 : 2);
      tokens[actor] = result.token;
    }
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.prepare('DELETE FROM teams WHERE id = ?').run(team.id);
    db.close();
    for (const suffix of ['', '-wal', '-shm']) { const file = `${testDbPath}${suffix}`; if (fs.existsSync(file)) fs.unlinkSync(file); }
    if (oldDbPath === undefined) delete process.env.SQLITE_DB_PATH; else process.env.SQLITE_DB_PATH = oldDbPath;
  });

  it('starts at Power Failure, rejects removed interactions, and validates every retained task and award', async () => {
    const call = async (actor: 'archivist' | 'tracker', pathName: string, body?: unknown) => fetch(`${baseUrl}/api/round3${pathName}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${tokens[actor]}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const action = async (actor: 'archivist' | 'tracker', type: string, objectId?: string, sequence?: string[]) => {
      const response = await call(actor, '/hunt1/action', { type, actor, ...(objectId ? { objectId } : {}), ...(sequence ? { value: { sequence } } : {}) });
      expect(response.status).toBe(200);
      return response.json() as Promise<{ success: boolean; message: string; state: any }>;
    };
    const interact = (actor: 'archivist' | 'tracker', id: string) => action(actor, 'interact', id);

    await call('archivist', '/session', {});
    await call('archivist', '/run/start', {});
    const oldState = {
      modelVersion: 2, teamId: team.id, currentChallenge: 3, completed: false, score: 0, penalties: 0,
      subtasks: { visitorLedger: true },
      taskCompleted: { lastVisitor: true, missingReport: true, powerFailure: false, observationLog: false, signalReconstruction: false, incidentConclusion: false },
      taskScores: { lastVisitor: 100, missingReport: 150, powerFailure: 0, observationLog: 0, signalReconstruction: 0, incidentConclusion: 0 },
      optionalScores: { researchNote: 0, forgottenRecording: 0 }, objectStates: { visitorLedger: 'examined' },
      evidence: [{ id: 'visitorLedger' }], journal: [{ id: 'objective-complete-lastVisitor' }], failedSubmissions: [], hintUses: {}, updatedAt: new Date().toISOString(),
    };
    db.prepare('INSERT INTO round3_hunt1_sessions(team_id,state_json,updated_at) VALUES(?,?,?)').run(team.id, JSON.stringify(oldState), new Date().toISOString());
    const opened = await call('archivist', '/hunt1/session', {});
    expect(opened.status).toBe(200);
    const openedState = (await opened.json() as { state: any }).state;
    expect(openedState.currentChallenge).toBe(1);
    expect(openedState.modelVersion).toBe(3);
    expect(openedState.taskCompleted).toEqual({ powerFailure: false, observationLog: false, signalReconstruction: false, incidentConclusion: false });
    expect(openedState.availableInteractables).not.toContain('visitorLedger');
    expect(openedState.availableInteractables).not.toContain('archiveIndex');
    expect((await call('archivist', '/hunt2/session', {})).status).toBe(423);

    expect((await interact('archivist', 'visitorLedger')).success).toBe(false);
    expect((await interact('archivist', 'archiveIndex')).success).toBe(false);
    await interact('archivist', 'generatorLog');
    await interact('tracker', 'burntRelay');
    await interact('tracker', 'openGround');
    const wiring = ['generator-relay', 'relay-load', 'load-ground', 'ground-frame'];
    expect((await action('tracker', 'powerFailureTracker', undefined, wiring)).success).toBe(false);
    expect((await action('archivist', 'powerFailureArchivist', undefined, wiring)).success).toBe(true);
    let result = await action('tracker', 'powerFailureTracker', undefined, wiring);
    expect(result.state.currentChallenge).toBe(2);
    expect(result.state.taskScores.powerFailure).toBe(200);

    await interact('archivist', 'observationLog');
    await interact('tracker', 'cameraBuffer');
    const timeline = ['alarm', 'lights-fail', 'subject-appears', 'observer-vanishes'];
    expect((await action('archivist', 'observationArchivist', undefined, timeline)).state.currentChallenge).toBe(2);
    result = await action('tracker', 'observationTracker', undefined, timeline);
    expect(result.state.currentChallenge).toBe(3);
    expect(result.state.taskScores.observationLog).toBe(200);

    await interact('archivist', 'signalChart');
    await interact('tracker', 'cableJunction');
    const route = ['intake', 'ground', 'observer', 'transmit'];
    await action('archivist', 'signalArchivist', undefined, route);
    result = await action('tracker', 'signalTracker', undefined, route);
    expect(result.state.currentChallenge).toBe(4);
    expect(result.state.taskScores.signalReconstruction).toBe(200);

    await interact('archivist', 'optionalResearchNote');
    await interact('tracker', 'optionalForgottenRecording');
    await interact('archivist', 'incidentBoardPast');
    await interact('tracker', 'incidentBoardFuture');
    const historical = ['temporal-resonance-reconstructs-human-memories', 'resonance-limited-to-recorded-imprints'];
    const physical = ['omitted-ground-and-relay-bypass-exceeded-limits', 'a-reconstructed-memory-became-conscious-after-transmission', 'that-consciousness-manifested-as-the-entity'];
    await action('archivist', 'incidentConclusionArchivist', undefined, historical);
    result = await action('tracker', 'incidentConclusionTracker', undefined, physical);
    expect(result.state.completed).toBe(true);
    expect(result.state.taskCompleted).toEqual({ powerFailure: true, observationLog: true, signalReconstruction: true, incidentConclusion: true });
    expect(result.state.taskScores).toEqual({ powerFailure: 200, observationLog: 200, signalReconstruction: 200, incidentConclusion: 150 });
    expect(result.state.score).toBe(850);
    expect((await call('tracker', '/state').then((response) => response.json()) as { session: { score: number } }).session.score).toBe(850);
    expect((await call('tracker', '/hunt2/session', {})).status).toBe(200);
  });
});
