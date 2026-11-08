// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Hunt2State } from '../../src/types/hunt2.types.ts';

const oldDbPath = process.env.SQLITE_DB_PATH;
const testDbPath = path.join(process.cwd(), 'database', `round3_hunt2_${process.pid}_${Date.now()}.db`);
process.env.SQLITE_DB_PATH = testDbPath;
const [{ app }, { db, hashPassword, initDatabase }] = await Promise.all([import('../index.ts'), import('../../database/db.ts')]);

describe('Round 3 Hunt 2 cooperative progression', () => {
  let server: Server;
  let baseUrl = '';
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const team = { id: `hunt2-test-${suffix}`, name: `Hunt2 Test ${suffix}`, password: 'Hunt#Two2026' };
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

  it('validates the four retained tasks, rejects removed task inputs, and preserves progress', async () => {
    const call = async (actor: 'archivist' | 'tracker', pathName: string, body?: unknown) => fetch(`${baseUrl}/api/round3${pathName}`, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${tokens[actor]}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const actAs = async (session: 'archivist' | 'tracker', actor: 'archivist' | 'tracker', objectId: string) => {
      const response = await call(session, '/hunt2/action', { type: 'interact', actor, objectId });
      expect(response.status).toBe(200);
      return response.json() as Promise<{ success: boolean; message: string; input?: string; state: Hunt2State }>;
    };
    const act = (actor: 'archivist' | 'tracker', objectId: string) => actAs(actor, actor, objectId);
    const submit = async (actor: 'archivist' | 'tracker', value: unknown) => {
      const response = await call(actor, '/hunt2/action', { type: 'submit', actor, value });
      expect(response.status).toBe(200);
      return response.json() as Promise<{ success: boolean; state: Hunt2State }>;
    };

    expect((await fetch(`${baseUrl}/api/round3/hunt2/state`)).status).toBe(401);
    await call('archivist', '/session', {});
    await call('archivist', '/hunt1/session', {});
    const hunt1Row = db.prepare('SELECT state_json FROM round3_hunt1_sessions WHERE team_id=?').get(team.id) as { state_json: string };
    const completedHunt1 = JSON.parse(hunt1Row.state_json) as { completed: boolean; currentChallenge: number; taskCompleted: Record<string, boolean> };
    completedHunt1.completed = true;
    completedHunt1.currentChallenge = 6;
    completedHunt1.taskCompleted = { lastVisitor: true, missingReport: true, powerFailure: true, observationLog: true, signalReconstruction: true, incidentConclusion: true };
    db.prepare('UPDATE round3_hunt1_sessions SET state_json=? WHERE team_id=?').run(JSON.stringify(completedHunt1), team.id);
    expect((await call('archivist', '/hunt2/session', {})).status).toBe(200);
    const savedStateRow = db.prepare('SELECT state_json FROM round3_hunt2_sessions WHERE team_id=?').get(team.id) as { state_json: string };
    const freshStateJson = savedStateRow.state_json;
    const freshState = await call('archivist', '/hunt2/state').then((response) => response.json()) as { state: Hunt2State };
    expect(freshState.state.currentChallenge).toBe(2);
    expect((db.prepare('SELECT state_json FROM round3_hunt2_sessions WHERE team_id=?').get(team.id) as { state_json: string }).state_json).toBe(freshStateJson);
    const legacyState = JSON.parse(savedStateRow.state_json) as Record<string, unknown>;
    legacyState.currentChallenge = 4;
    legacyState.identityReconstruction = {};
    (legacyState.scoreBreakdown as Record<string, unknown>).identities = 100;
    const legacyStateJson = JSON.stringify(legacyState);
    db.prepare('UPDATE round3_hunt2_sessions SET state_json=? WHERE team_id=?').run(legacyStateJson, team.id);
    const compatible = await call('archivist', '/hunt2/state').then((response) => response.json()) as { state: Hunt2State };
    expect(compatible.state.currentChallenge).toBe(2);
    expect(compatible.state).not.toHaveProperty('identityReconstruction');
    expect((db.prepare('SELECT state_json FROM round3_hunt2_sessions WHERE team_id=?').get(team.id) as { state_json: string }).state_json).toBe(legacyStateJson);
    db.prepare('UPDATE round3_hunt2_sessions SET state_json=? WHERE team_id=?').run(savedStateRow.state_json, team.id);
    const initial = await call('archivist', '/hunt2/state').then((response) => response.json()) as { state: Hunt2State };
    expect(initial.state.currentChallenge).toBe(2);
    expect(initial.state.scoreBreakdown).toEqual({ hiddenWeakness: 0, brokenMemory: 0, anchor: 0, final: 0, optional: 0, penalties: 0 });
    expect(initial.state).not.toHaveProperty('identityReconstruction');
    expect(initial.state).not.toHaveProperty('falseManifestation');
    expect(initial.state).not.toHaveProperty('memoryFragments');
    const optional = await act('tracker', 'optionalAnomaly');
    expect(optional.state.currentChallenge).toBe(2);
    const optionalScore = optional.state.score;
    expect((await act('tracker', 'optionalAnomaly')).state.score).toBe(optionalScore);
    await call('archivist', '/hunt2/action', { type: 'hint', actor: 'archivist' });
    await call('tracker', '/hunt2/action', { type: 'hint', actor: 'tracker' });
    const hintPenalty = (await call('archivist', '/hunt2/state').then((response) => response.json()) as { state: { penalties: number } }).state.penalties;
    expect(hintPenalty).toBe(50);
    await call('tracker', '/hunt2/action', { type: 'hint', actor: 'tracker' });
    expect((await call('archivist', '/hunt2/state').then((response) => response.json()) as { state: { penalties: number } }).state.penalties).toBe(50);

    for (const id of ['identityTraceA', 'identityPatientFile', 'manifestationA', 'manifestationRecords', 'memoryDiary', 'memoryEcho', 'falseDoor3']) {
      expect((await act('tracker', id)).success).toBe(false);
    }
    for (const kind of ['identity-historical', 'identity-physical', 'manifestation-history', 'manifestation-physical', 'memory-historical', 'memory-physical']) {
      expect((await submit('archivist', { kind, order: [] })).success).toBe(false);
    }
    expect((await call('archivist', '/hunt2/state').then((response) => response.json()) as { state: Hunt2State }).state.currentChallenge).toBe(2);
    const earlyArchive = await act('archivist', 'weaknessArchive');
    expect(earlyArchive.input).toBeUndefined();
    expect(earlyArchive.message).toContain('at least two controlled trials');
    const trial = async (variable: string, setting: string) => {
      const station = variable === 'frequency' ? 'weaknessFrequencyStation' : variable === 'light' ? 'weaknessLightStation' : 'weaknessTemperatureStation';
      const opened = await act('tracker', station);
      if (!opened.success) expect(opened.message).toContain('Both controlled conditions');
      return submit('tracker', { kind: 'weakness-experiment', variable, setting });
    };
    await trial('frequency', 'high');
    await trial('frequency', 'low');
    expect((await act('archivist', 'weaknessArchive')).input).toBe('weakness-history');
    expect((await submit('archivist', { kind: 'weakness-history', conclusion: 'bright' })).success).toBe(false);
    expect((await submit('archivist', { kind: 'weakness-history', conclusion: 'bright and warm' })).success).toBe(true);
    expect((await trial('frequency', 'high')).success).toBe(false);
    await trial('light', 'dark');
    await trial('temperature', 'cold');
    expect((await call('tracker', '/hunt2/state').then((r) => r.json()) as { state: Hunt2State }).state.hiddenWeakness.experiments.length).toBe(4);
    expect((await act('tracker', 'weaknessFrequencyStation')).input).toBe('weakness-conclusion');
    expect((await submit('tracker', { kind: 'weakness-conclusion', profile: { frequency: 'low', light: 'dark', temperature: 'warm' } })).success).toBe(false);
    await submit('tracker', { kind: 'weakness-conclusion', profile: { frequency: 'low', light: 'dark', temperature: 'cold' } });
    expect((await call('tracker', '/hunt2/state').then((r) => r.json()) as { state: Hunt2State }).state.hiddenWeakness.experimentalConclusion).toBe('{"frequency":"low","light":"dark","temperature":"cold"}');
    await act('tracker', 'weaknessContainmentConsole');
    const savedWeakness = db.prepare('SELECT state_json FROM round3_hunt2_sessions WHERE team_id=?').get(team.id) as { state_json: string };
    const pendingWeakness = JSON.parse(savedWeakness.state_json) as Hunt2State;
    pendingWeakness.hiddenWeakness.syncDeadline = Date.now() - 1;
    db.prepare('UPDATE round3_hunt2_sessions SET state_json=? WHERE team_id=?').run(JSON.stringify(pendingWeakness), team.id);
    const failedCalibration = await act('archivist', 'weaknessCalibrationConsole');
    expect(failedCalibration.state.subtasks.hiddenWeaknessComplete).not.toBe(true);
    await act('tracker', 'weaknessContainmentConsole');
    expect((await act('archivist', 'weaknessCalibrationConsole')).state.currentChallenge).toBe(3);
    expect((await call('tracker', '/hunt2/state').then((r) => r.json()) as { state: Hunt2State }).state.scoreBreakdown.hiddenWeakness).toBe(200);
    expect((await act('tracker', 'weaknessContainmentConsole')).state.scoreBreakdown.hiddenWeakness).toBe(200);

    expect((await act('tracker', 'brokenArchivePhoto')).success).toBe(false);
    expect((await act('tracker', 'brokenProjectionSymbols')).success).toBe(false);
    expect((await act('archivist', 'brokenArchiveLedger')).success).toBe(false);
    await act('archivist', 'brokenArchivePhoto');
    await act('tracker', 'brokenMemoryChamber');
    await act('tracker', 'brokenProjectionSymbols');
    await act('archivist', 'brokenArchiveLedger');
    await act('tracker', 'brokenKeepsakeMechanism');
    await act('archivist', 'brokenArchiveRecording');
    const discovered = (await call('tracker', '/hunt2/state').then((r) => r.json()) as { state: Hunt2State }).state;
    expect(discovered.brokenMemory.trackerEvidence).toHaveLength(3);
    expect((await call('archivist', '/hunt2/state').then((r) => r.json()) as { state: Hunt2State }).state.brokenMemory.archivistEvidence).toHaveLength(3);
    expect((await act('tracker', 'brokenRestorationBoard')).input).toBe('broken-structure');
    const history = ['photograph:source', 'ledger:duplicate', 'recording:fragmented-voice', 'keepsake:before-test', 'shadow:original', 'name:subject-zero'];
    const structure = ['photograph:entry', 'ledger:archive', 'recording:resonance', 'keepsake:center', 'shadow:mirror', 'name:anchor'];
    expect((await submit('tracker', { kind: 'broken-historical', order: history })).success).toBe(false);
    expect((await submit('archivist', { kind: 'broken-historical', order: ['photograph:source', 'ledger:duplicate', 'recording:fragmented-voice', 'keepsake:after-test', 'shadow:original', 'name:subject-zero'] })).success).toBe(false);
    await submit('archivist', { kind: 'broken-historical', order: history });
    expect((await call('archivist', '/hunt2/state').then((r) => r.json()) as { state: Hunt2State }).state.brokenMemory.historical).toEqual(history);
    expect((await submit('tracker', { kind: 'broken-structure', order: ['photograph:entry', 'ledger:entry', 'recording:resonance', 'keepsake:center', 'shadow:mirror', 'name:anchor'] })).success).toBe(false);
    await submit('tracker', { kind: 'broken-structure', order: structure });
    expect((await act('tracker', 'brokenRestoreMechanism')).success).toBe(false);
    await act('archivist', 'brokenSyncConsole');
    const brokenRaw = db.prepare('SELECT state_json FROM round3_hunt2_sessions WHERE team_id=?').get(team.id) as { state_json: string };
    const waitingBroken = JSON.parse(brokenRaw.state_json) as Hunt2State;
    waitingBroken.brokenMemory.syncDeadline = Date.now() - 1;
    db.prepare('UPDATE round3_hunt2_sessions SET state_json=? WHERE team_id=?').run(JSON.stringify(waitingBroken), team.id);
    expect((await act('tracker', 'brokenRestoreMechanism')).success).toBe(false);
    await act('archivist', 'brokenSyncConsole');
    const restored = await act('tracker', 'brokenRestoreMechanism');
    expect(restored.state.currentChallenge).toBe(4);
    expect(restored.state.subtasks.brokenMemoryComplete).toBe(true);
    expect(restored.state.scoreBreakdown.brokenMemory).toBe(300);
    expect((await act('tracker', 'brokenRestoreMechanism')).state.scoreBreakdown.brokenMemory).toBe(300);

    expect((await act('tracker', 'anchorMemory')).success).toBe(false);
    expect((await act('tracker', 'memoryAnchorC')).success).toBe(false);
    expect((await act('archivist', 'anchorFlowRecord')).success).toBe(false);
    await act('archivist', 'anchorMemory');
    await act('tracker', 'memoryAnchorA');
    await act('tracker', 'memoryAnchorB');
    await act('archivist', 'anchorFlowRecord');
    await act('tracker', 'memoryAnchorC');
    await act('tracker', 'anchorNodeD');
    const anchorTrackerView = (await call('tracker', '/hunt2/state').then((r) => r.json()) as { state: Hunt2State }).state;
    expect(anchorTrackerView.memoryAnchor.trackerEvidence).toHaveLength(4);
    expect(anchorTrackerView.memoryAnchor.nodeStates).toEqual({ A: 'unstable', B: 'reversed', C: 'disconnected', D: 'stable' });
    const anchorArchivistView = (await call('archivist', '/hunt2/state').then((r) => r.json()) as { state: Hunt2State }).state;
    expect(anchorArchivistView.memoryAnchor.trackerEvidence).toHaveLength(0);
    expect(anchorArchivistView.memoryAnchor.nodeStates.A).toBe('unknown');
    expect((await act('archivist', 'anchorPastControl')).input).toBe('anchor-history-config');
    expect((await act('tracker', 'anchorFutureControl')).input).toBe('anchor-physical-config');
    const historicalAnchor = ['A:east', 'B:west', 'C:ground', 'D:loop'];
    const physicalAnchor = ['A:stabilize', 'B:forward', 'C:reconnect', 'D:hold'];
    expect((await submit('tracker', { kind: 'anchor-history-config', order: historicalAnchor })).success).toBe(false);
    expect((await submit('archivist', { kind: 'anchor-history-config', order: ['A:west', 'B:west', 'C:ground', 'D:loop'] })).success).toBe(false);
    await submit('archivist', { kind: 'anchor-history-config', order: historicalAnchor });
    expect((await call('archivist', '/hunt2/state').then((r) => r.json()) as { state: Hunt2State }).state.memoryAnchor.historicalConfiguration).toEqual(historicalAnchor);
    expect((await submit('tracker', { kind: 'anchor-physical-config', order: ['A:redirect', 'B:forward', 'C:reconnect', 'D:hold'] })).success).toBe(false);
    await submit('tracker', { kind: 'anchor-physical-config', order: physicalAnchor });
    expect((await call('tracker', '/hunt2/state').then((r) => r.json()) as { state: Hunt2State }).state.memoryAnchor.physicalConfiguration).toEqual(physicalAnchor);
    expect((await act('tracker', 'anchorFutureControl')).success).toBe(false);
    await act('archivist', 'anchorPastControl');
    const anchorRaw = db.prepare('SELECT state_json FROM round3_hunt2_sessions WHERE team_id=?').get(team.id) as { state_json: string };
    const waitingAnchor = JSON.parse(anchorRaw.state_json) as Hunt2State;
    waitingAnchor.memoryAnchor.syncDeadline = Date.now() - 1;
    db.prepare('UPDATE round3_hunt2_sessions SET state_json=? WHERE team_id=?').run(JSON.stringify(waitingAnchor), team.id);
    expect((await act('tracker', 'anchorFutureControl')).success).toBe(false);
    await act('archivist', 'anchorPastControl');
    await act('tracker', 'anchorFutureControl');
    expect((await act('tracker', 'memoryAnchorB')).success).toBe(false);
    await act('tracker', 'memoryAnchorA');
    await act('archivist', 'anchorNodePastB');
    await act('tracker', 'memoryAnchorC');
    const anchorFinished = await act('archivist', 'anchorNodePastD');
    expect(anchorFinished.state.currentChallenge).toBe(5);
    expect(anchorFinished.state.subtasks.memoryAnchorComplete).toBe(true);
    expect(anchorFinished.state.scoreBreakdown.anchor).toBe(200);
    expect((await act('archivist', 'anchorNodePastD')).state.scoreBreakdown.anchor).toBe(200);

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
    const saved = (await call('archivist', '/hunt2/state').then((r) => r.json()) as { state: { completed: boolean; subtasks: Record<string, boolean> } }).state;
    expect(saved.completed).toBe(true);
    expect(saved.subtasks.memoryAnchorComplete).toBe(true);
  });
});
