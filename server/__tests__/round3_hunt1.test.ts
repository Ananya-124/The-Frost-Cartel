// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';

const oldDbPath = process.env.SQLITE_DB_PATH;
const testDbPath = path.join(process.cwd(), 'database', `round3_hunt1_${process.pid}_${Date.now()}.db`);
process.env.SQLITE_DB_PATH = testDbPath;
const [{ app }, { db, hashPassword, initDatabase }] = await Promise.all([import('../index.ts'), import('../../database/db.ts')]);

describe('Round 3 Hunt I — The Forgotten Incident', () => {
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

  it('validates all six cooperative reconstructions, exact awards, optional evidence, refresh, locks, and expiry', async () => {
    const call = async (actor: 'archivist' | 'tracker', pathName: string, body?: unknown) => fetch(`${baseUrl}/api/round3${pathName}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${tokens[actor]}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const interact = async (actor: 'archivist' | 'tracker', objectId: string) => {
      const response = await call(actor, '/hunt1/action', { type: 'interact', actor, objectId });
      expect(response.status).toBe(200);
      return response.json() as Promise<{ success: boolean; message: string; state: any }>;
    };
    const submit = async (actor: 'archivist' | 'tracker', sequence: string[]) => {
      const response = await call(actor, '/hunt1/action', { type: 'submit', actor, value: { sequence } });
      expect(response.status).toBe(200);
      return response.json() as Promise<{ success: boolean; message: string; state: any }>;
    };

    await call('archivist', '/session', {});
    await call('archivist', '/run/start', {});
    const opened = await call('archivist', '/hunt1/session', {});
    expect(opened.status).toBe(200);
    expect((await call('archivist', '/hunt2/session', {})).status).toBe(423);

    expect((await call('archivist', '/hunt1/action', { type: 'interact', actor: 'tracker', objectId: 'visitorTracks' })).status).toBe(403);
    const forgedRole = await interact('archivist', 'visitorTracks');
    expect(forgedRole.state.subtasks.visitorTracks).not.toBe(true);
    const missingPartnerEvidence = await interact('archivist', 'visitorLedger');
    expect(missingPartnerEvidence.state.subtasks.visitorLedger).toBe(true);
    const tooEarly = await submit('archivist', ['technician', 'director', 'visitor']);
    expect(tooEarly.state.currentChallenge).toBe(1);
    expect(tooEarly.state.penalties).toBe(0);
    await interact('tracker', 'visitorTracks');
    await interact('archivist', 'optionalResearchNote');
    await interact('tracker', 'optionalForgottenRecording');
    expect((await interact('archivist', 'optionalResearchNote')).state.score).toBe(100);
    const wrongVisitorOrder = await submit('archivist', ['visitor', 'director', 'technician']);
    expect(wrongVisitorOrder.success).toBe(false);
    expect(wrongVisitorOrder.state.penalties).toBe(10);
    expect((await submit('archivist', ['visitor', 'director', 'technician'])).state.penalties).toBe(10);
    let result = await submit('archivist', ['technician', 'director', 'visitor']);
    expect(result.state.taskScores.lastVisitor).toBe(100);
    expect(result.state.currentChallenge).toBe(2);
    expect((await submit('archivist', ['technician', 'director', 'visitor'])).state.taskScores.lastVisitor).toBe(100);

    await interact('archivist', 'archiveIndex');
    const reportEarly = await submit('tracker', ['purpose', 'apparatus', 'safeguards', 'result']);
    expect(reportEarly.state.currentChallenge).toBe(2);
    await interact('tracker', 'shreddedReport');
    const reportAnswer = ['purpose', 'apparatus', 'safeguards', 'result'];
    const wrongRoleArchivist = await call('archivist', '/hunt1/action', { type: 'missingReportTracker', actor: 'archivist', value: { sequence: reportAnswer } });
    expect((await wrongRoleArchivist.json() as { success: boolean }).success).toBe(false);
    const wrongRoleTracker = await call('tracker', '/hunt1/action', { type: 'missingReportArchivist', actor: 'tracker', value: { sequence: reportAnswer } });
    expect((await wrongRoleTracker.json() as { success: boolean }).success).toBe(false);
    expect((await call('tracker', '/hunt1/action', { type: 'missingReportArchivist', actor: 'archivist', value: { sequence: reportAnswer } })).status).toBe(403);
    expect((await call('archivist', '/hunt1/action', { type: 'missingReportTracker', actor: 'tracker', value: { sequence: reportAnswer } })).status).toBe(403);

    const archivistDecode = await call('archivist', '/hunt1/action', { type: 'missingReportArchivist', actor: 'archivist', value: { sequence: reportAnswer } });
    let reportState = (await archivistDecode.json() as { success: boolean; state: any }).state;
    expect(reportState.missingReport.archivistValid).toBe(true);
    expect(reportState.currentChallenge).toBe(2);
    const restoredReport = (await call('tracker', '/hunt1/state').then((r) => r.json()) as { state: any }).state;
    expect(restoredReport.missingReport.archivistOrder).toEqual(reportAnswer);
    expect(restoredReport.taskScores.missingReport).toBe(0);

    const wrongFragmentOrder = ['apparatus', 'purpose', 'safeguards', 'result'];
    const wrongTrackerSubmit = await call('tracker', '/hunt1/action', { type: 'missingReportTracker', actor: 'tracker', value: { sequence: wrongFragmentOrder } });
    reportState = (await wrongTrackerSubmit.json() as { success: boolean; state: any }).state;
    expect(reportState.missingReport.trackerValid).toBe(false);
    const wrongTrackerAgain = await call('tracker', '/hunt1/action', { type: 'missingReportTracker', actor: 'tracker', value: { sequence: wrongFragmentOrder } });
    expect(((await wrongTrackerAgain.json() as { state: any }).state).penalties).toBe(reportState.penalties);
    const mismatchConfirm = await call('archivist', '/hunt1/action', { type: 'missingReportConfirm', actor: 'archivist', value: { reconstructionVersion: reportState.missingReport.reconstructionVersion } });
    expect((await mismatchConfirm.json() as { success: boolean }).success).toBe(false);

    const trackerSubmit = await call('tracker', '/hunt1/action', { type: 'missingReportTracker', actor: 'tracker', value: { sequence: reportAnswer } });
    reportState = (await trackerSubmit.json() as { success: boolean; state: any }).state;
    expect(reportState.missingReport.trackerValid).toBe(true);
    expect(reportState.taskScores.missingReport).toBe(0);
    const afterReconnect = (await call('archivist', '/hunt1/state').then((r) => r.json()) as { state: any }).state;
    expect(afterReconnect.missingReport.trackerOrder).toEqual(reportAnswer);
    const archivistConfirm = await call('archivist', '/hunt1/action', { type: 'missingReportConfirm', actor: 'archivist', value: { reconstructionVersion: reportState.missingReport.reconstructionVersion } });
    const archivistConfirmResult = await archivistConfirm.json() as { success: boolean; state: any };
    reportState = archivistConfirmResult.state;
    expect(archivistConfirmResult.success).toBe(true);
    expect(reportState.taskScores.missingReport).toBe(0);
    const repeatedConfirm = await call('archivist', '/hunt1/action', { type: 'missingReportConfirm', actor: 'archivist', value: { reconstructionVersion: reportState.missingReport.reconstructionVersion } });
    expect((await repeatedConfirm.json() as { success: boolean }).success).toBe(false);
    const trackerConfirm = await call('tracker', '/hunt1/action', { type: 'missingReportConfirm', actor: 'tracker', value: { reconstructionVersion: reportState.missingReport.reconstructionVersion } });
    result = await trackerConfirm.json() as { success: boolean; message: string; state: any };
    expect(result.state.taskScores.missingReport).toBe(150);
    expect(result.state.currentChallenge).toBe(3);
    expect(result.state.taskCompleted.missingReport).toBe(true);
    const duplicateReportConfirm = await call('tracker', '/hunt1/action', { type: 'missingReportConfirm', actor: 'tracker', value: { reconstructionVersion: reportState.missingReport.reconstructionVersion } });
    expect((await duplicateReportConfirm.json() as { success: boolean }).success).toBe(false);
    expect(result.state.taskScores.missingReport).toBe(150);
    expect((await call('tracker', '/hunt1/state').then((r) => r.json()) as { state: any }).state.taskScores.missingReport).toBe(150);

    await interact('archivist', 'generatorLog');
    await interact('tracker', 'burntRelay');
    await interact('tracker', 'openGround');
    const wiring = ['generator-relay', 'relay-load', 'load-ground', 'ground-frame'];
    const prematureTracker = await call('tracker', '/hunt1/action', { type: 'powerFailureTracker', actor: 'tracker', value: { sequence: wiring } });
    expect((await prematureTracker.json() as { success: boolean }).success).toBe(false);
    expect((await call('tracker', '/hunt1/action', { type: 'powerFailureArchivist', actor: 'archivist', value: { sequence: wiring } })).status).toBe(403);
    expect((await call('archivist', '/hunt1/action', { type: 'powerFailureTracker', actor: 'tracker', value: { sequence: wiring } })).status).toBe(403);
    const wrongWiring = ['relay-load', 'generator-relay', 'load-ground', 'ground-frame'];
    const wrongArchivistDecode = await call('archivist', '/hunt1/action', { type: 'powerFailureArchivist', actor: 'archivist', value: { sequence: wrongWiring } });
    const wrongDecodeResult = await wrongArchivistDecode.json() as { success: boolean; state: any };
    expect(wrongDecodeResult.success).toBe(false);
    const duplicateWrongDecode = await call('archivist', '/hunt1/action', { type: 'powerFailureArchivist', actor: 'archivist', value: { sequence: wrongWiring } });
    expect(((await duplicateWrongDecode.json() as { state: any }).state).penalties).toBe(wrongDecodeResult.state.penalties);
    const correctDecode = await call('archivist', '/hunt1/action', { type: 'powerFailureArchivist', actor: 'archivist', value: { sequence: wiring } });
    result = await correctDecode.json() as { success: boolean; message: string; state: any };
    expect(result.success).toBe(true);
    expect(result.state.taskScores.powerFailure).toBe(0);
    expect(result.state.powerFailure.archivistValid).toBe(true);
    const restoredCircuit = (await call('tracker', '/hunt1/state').then((r) => r.json()) as { state: any }).state;
    expect(restoredCircuit.powerFailure.archivistConnections).toEqual(wiring);
    const wrongTrackerConnections = ['generator-relay', 'load-ground', 'relay-load', 'ground-frame'];
    const wrongCircuit = await call('tracker', '/hunt1/action', { type: 'powerFailureTracker', actor: 'tracker', value: { sequence: wrongTrackerConnections } });
    const wrongCircuitState = (await wrongCircuit.json() as { success: boolean; state: any });
    expect(wrongCircuitState.success).toBe(false);
    expect(wrongCircuitState.state.taskScores.powerFailure).toBe(0);
    const duplicateWrongCircuit = await call('tracker', '/hunt1/action', { type: 'powerFailureTracker', actor: 'tracker', value: { sequence: wrongTrackerConnections } });
    expect(((await duplicateWrongCircuit.json() as { state: any }).state).penalties).toBe(wrongCircuitState.state.penalties);
    const restoredTrackerWiring = (await call('archivist', '/hunt1/state').then((r) => r.json()) as { state: any }).state;
    expect(restoredTrackerWiring.powerFailure.trackerConnections).toEqual(wrongTrackerConnections);
    result = await (await call('tracker', '/hunt1/action', { type: 'powerFailureTracker', actor: 'tracker', value: { sequence: wiring } })).json() as { success: boolean; message: string; state: any };
    expect(result.success).toBe(true);
    expect(result.state.taskScores.powerFailure).toBe(200);
    expect(result.state.currentChallenge).toBe(4);
    const duplicateCircuit = await call('tracker', '/hunt1/action', { type: 'powerFailureTracker', actor: 'tracker', value: { sequence: wiring } });
    const duplicateCircuitResult = await duplicateCircuit.json() as { success: boolean; state: any };
    expect(duplicateCircuitResult.success).toBe(false);
    expect(duplicateCircuitResult.state.taskScores.powerFailure).toBe(200);

    await interact('archivist', 'observationLog');
    await interact('tracker', 'cameraBuffer');
    const timeline = ['alarm', 'lights-fail', 'subject-appears', 'observer-vanishes'];
    const wrongFuture = ['alarm', 'lights-fail', 'observer-vanishes', 'subject-appears'];
    expect((await call('tracker', '/hunt1/action', { type: 'observationArchivist', actor: 'archivist', value: { sequence: timeline } })).status).toBe(403);
    expect((await call('archivist', '/hunt1/action', { type: 'observationTracker', actor: 'tracker', value: { sequence: timeline } })).status).toBe(403);
    const earlyFuture = await call('tracker', '/hunt1/action', { type: 'observationTracker', actor: 'tracker', value: { sequence: wrongFuture } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(earlyFuture.success).toBe(false);
    expect(earlyFuture.state.taskScores.observationLog).toBe(0);
    const wrongPast = ['alarm', 'subject-appears', 'lights-fail', 'observer-vanishes'];
    const wrongPastResponse = await call('archivist', '/hunt1/action', { type: 'observationArchivist', actor: 'archivist', value: { sequence: wrongPast } });
    const wrongPastResult = await wrongPastResponse.json() as { success: boolean; state: any };
    expect(wrongPastResult.success).toBe(false);
    const repeatedWrongPast = await call('archivist', '/hunt1/action', { type: 'observationArchivist', actor: 'archivist', value: { sequence: wrongPast } }).then((response) => response.json()) as { state: any };
    expect(repeatedWrongPast.state.penalties).toBe(wrongPastResult.state.penalties);
    const pastTimeline = await call('archivist', '/hunt1/action', { type: 'observationArchivist', actor: 'archivist', value: { sequence: timeline } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(pastTimeline.success).toBe(true);
    expect(pastTimeline.state.taskScores.observationLog).toBe(0);
    expect((await call('archivist', '/hunt1/state').then((response) => response.json()) as { state: any }).state.observationTimeline.archivistTimeline).toEqual(timeline);
    expect((await call('tracker', '/hunt1/state').then((response) => response.json()) as { state: any }).state.observationTimeline.archivistTimeline).toBeNull();
    const wrongFutureResponse = await call('tracker', '/hunt1/action', { type: 'observationTracker', actor: 'tracker', value: { sequence: wrongFuture } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(wrongFutureResponse.success).toBe(false);
    expect(wrongFutureResponse.state.taskScores.observationLog).toBe(0);
    expect(wrongFutureResponse.state.observationTimeline.investigationsAgree).toBe(false);
    expect(wrongFutureResponse.state.observationTimeline.archivistTimeline).toBeNull();
    expect(wrongFutureResponse.state.observationTimeline.trackerTimeline).toEqual(wrongFuture);
    const restoredFutureTimeline = (await call('tracker', '/hunt1/state').then((response) => response.json()) as { state: any }).state;
    expect(restoredFutureTimeline.observationTimeline.trackerTimeline).toEqual(wrongFuture);
    expect(restoredFutureTimeline.observationTimeline.archivistTimeline).toBeNull();
    const repeatedWrongFuture = await call('tracker', '/hunt1/action', { type: 'observationTracker', actor: 'tracker', value: { sequence: wrongFuture } }).then((response) => response.json()) as { state: any };
    expect(repeatedWrongFuture.state.penalties).toBe(wrongFutureResponse.state.penalties);
    const correctFuture = await call('tracker', '/hunt1/action', { type: 'observationTracker', actor: 'tracker', value: { sequence: timeline } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(correctFuture.success).toBe(true);
    result = correctFuture;
    expect(result.state.taskScores.observationLog).toBe(200);
    expect(result.state.currentChallenge).toBe(5);
    expect(result.state.observationTimeline.archivistTimeline).toEqual(timeline);
    expect(result.state.observationTimeline.trackerTimeline).toEqual(timeline);
    const duplicateObservation = await call('tracker', '/hunt1/action', { type: 'observationTracker', actor: 'tracker', value: { sequence: timeline } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(duplicateObservation.success).toBe(false);
    expect(duplicateObservation.state.taskScores.observationLog).toBe(200);

    await interact('archivist', 'signalChart');
    await interact('tracker', 'cableJunction');
    const signalRoute = ['intake', 'ground', 'observer', 'transmit'];
    expect((await call('tracker', '/hunt1/action', { type: 'signalArchivist', actor: 'archivist', value: { sequence: signalRoute } })).status).toBe(403);
    expect((await call('archivist', '/hunt1/action', { type: 'signalTracker', actor: 'tracker', value: { sequence: signalRoute } })).status).toBe(403);
    const earlySignal = await call('tracker', '/hunt1/action', { type: 'signalTracker', actor: 'tracker', value: { sequence: signalRoute } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(earlySignal.success).toBe(false);
    expect(earlySignal.state.taskScores.signalReconstruction).toBe(0);
    const wrongArchiveRoute = ['intake', 'observer', 'ground', 'transmit'];
    const wrongArchiveResponse = await call('archivist', '/hunt1/action', { type: 'signalArchivist', actor: 'archivist', value: { sequence: wrongArchiveRoute } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(wrongArchiveResponse.success).toBe(false);
    const repeatedWrongArchive = await call('archivist', '/hunt1/action', { type: 'signalArchivist', actor: 'archivist', value: { sequence: wrongArchiveRoute } }).then((response) => response.json()) as { state: any };
    expect(repeatedWrongArchive.state.penalties).toBe(wrongArchiveResponse.state.penalties);
    const archiveRouteResponse = await call('archivist', '/hunt1/action', { type: 'signalArchivist', actor: 'archivist', value: { sequence: signalRoute } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(archiveRouteResponse.success).toBe(true);
    expect(archiveRouteResponse.state.taskScores.signalReconstruction).toBe(0);
    const restoredSignalReference = (await call('tracker', '/hunt1/state').then((response) => response.json()) as { state: any }).state;
    expect(restoredSignalReference.signalReconstruction.archivistRoute).toEqual(signalRoute);
    const wrongTrackerRoute = ['intake', 'observer', 'ground', 'transmit'];
    const wrongTrackerSignal = await call('tracker', '/hunt1/action', { type: 'signalTracker', actor: 'tracker', value: { sequence: wrongTrackerRoute } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(wrongTrackerSignal.success).toBe(false);
    expect(wrongTrackerSignal.state.taskScores.signalReconstruction).toBe(0);
    const duplicateWrongTrackerSignal = await call('tracker', '/hunt1/action', { type: 'signalTracker', actor: 'tracker', value: { sequence: wrongTrackerRoute } }).then((response) => response.json()) as { state: any };
    expect(duplicateWrongTrackerSignal.state.penalties).toBe(wrongTrackerSignal.state.penalties);
    const restoredTrackerRoute = (await call('tracker', '/hunt1/state').then((response) => response.json()) as { state: any }).state;
    expect(restoredTrackerRoute.signalReconstruction.trackerRoute).toEqual(wrongTrackerRoute);
    result = await (await call('tracker', '/hunt1/action', { type: 'signalTracker', actor: 'tracker', value: { sequence: signalRoute } })).json() as { success: boolean; message: string; state: any };
    expect(result.success).toBe(true);
    expect(result.state.taskScores.signalReconstruction).toBe(200);
    expect(result.state.currentChallenge).toBe(6);
    const duplicateSignal = await call('tracker', '/hunt1/action', { type: 'signalTracker', actor: 'tracker', value: { sequence: signalRoute } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(duplicateSignal.success).toBe(false);
    expect(duplicateSignal.state.taskScores.signalReconstruction).toBe(200);

    await interact('archivist', 'incidentBoardPast');
    await interact('tracker', 'incidentBoardFuture');
    const beforeConclusion = await submit('archivist', ['visitor', 'report-omission', 'ground-failure', 'relay-bypass', 'signal-overload', 'manifestation']);
    expect(beforeConclusion.success).toBe(false);
    expect(beforeConclusion.state.completed).toBe(false);
    expect((await call('archivist', '/hunt1/state')).status).toBe(200);
    const restored = (await call('tracker', '/hunt1/state').then((r) => r.json()) as { state: any }).state;
    expect(restored.taskCompleted.signalReconstruction).toBe(true);
    expect(restored.evidence.some((entry: { id: string }) => entry.id === 'cameraBuffer')).toBe(true);
    const wrongHistory = ['resonance-limited-to-recorded-imprints', 'temporal-resonance-reconstructs-human-memories'];
    const historical = ['temporal-resonance-reconstructs-human-memories', 'resonance-limited-to-recorded-imprints'];
    const physical = ['omitted-ground-and-relay-bypass-exceeded-limits', 'a-reconstructed-memory-became-conscious-after-transmission', 'that-consciousness-manifested-as-the-entity'];
    expect((await call('tracker', '/hunt1/action', { type: 'incidentConclusionArchivist', actor: 'archivist', value: { sequence: historical } })).status).toBe(403);
    expect((await call('archivist', '/hunt1/action', { type: 'incidentConclusionTracker', actor: 'tracker', value: { sequence: physical } })).status).toBe(403);
    const wrongConclusion = await call('archivist', '/hunt1/action', { type: 'incidentConclusionArchivist', actor: 'archivist', value: { sequence: wrongHistory } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(wrongConclusion.success).toBe(false);
    const repeatedWrongConclusion = await call('archivist', '/hunt1/action', { type: 'incidentConclusionArchivist', actor: 'archivist', value: { sequence: wrongHistory } }).then((response) => response.json()) as { state: any };
    expect(repeatedWrongConclusion.state.penalties).toBe(wrongConclusion.state.penalties);
    const archivistConclusion = await call('archivist', '/hunt1/action', { type: 'incidentConclusionArchivist', actor: 'archivist', value: { sequence: historical } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(archivistConclusion.success).toBe(true);
    expect(archivistConclusion.state.taskScores.incidentConclusion).toBe(0);
    expect(archivistConclusion.state.completed).toBe(false);
    expect(archivistConclusion.state.incidentConclusion.archivistInterpretation).toEqual(historical);
    const restoredConclusion = (await call('archivist', '/hunt1/state').then((response) => response.json()) as { state: any }).state;
    expect(restoredConclusion.incidentConclusion.archivistInterpretation).toEqual(historical);
    const trackerPrivateView = (await call('tracker', '/hunt1/state').then((response) => response.json()) as { state: any }).state;
    expect(trackerPrivateView.incidentConclusion.archivistInterpretation).toBeNull();
    const wrongPhysical = ['a-reconstructed-memory-became-conscious-after-transmission', 'omitted-ground-and-relay-bypass-exceeded-limits', 'that-consciousness-manifested-as-the-entity'];
    const wrongTrackerConclusion = await call('tracker', '/hunt1/action', { type: 'incidentConclusionTracker', actor: 'tracker', value: { sequence: wrongPhysical } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(wrongTrackerConclusion.success).toBe(false);
    const duplicateWrongPhysical = await call('tracker', '/hunt1/action', { type: 'incidentConclusionTracker', actor: 'tracker', value: { sequence: wrongPhysical } }).then((response) => response.json()) as { state: any };
    expect(duplicateWrongPhysical.state.penalties).toBe(wrongTrackerConclusion.state.penalties);
    expect((await call('archivist', '/hunt2/session', {})).status).toBe(423);
    const finished = await call('tracker', '/hunt1/action', { type: 'incidentConclusionTracker', actor: 'tracker', value: { sequence: physical } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(finished.success).toBe(true);
    expect(finished.state.completed).toBe(true);
    expect(finished.state.taskScores.incidentConclusion).toBe(150);
    expect(finished.state.taskCompleted.incidentConclusion).toBe(true);
    expect(finished.state.incidentConclusion.archivistInterpretation).toEqual(historical);
    expect(finished.state.incidentConclusion.trackerInterpretation).toEqual(physical);
    const duplicateConclusion = await call('tracker', '/hunt1/action', { type: 'incidentConclusionTracker', actor: 'tracker', value: { sequence: physical } }).then((response) => response.json()) as { success: boolean; state: any };
    expect(duplicateConclusion.success).toBe(false);
    const afterDuplicateConclusion = (await call('tracker', '/hunt1/state').then((response) => response.json()) as { state: any }).state;
    expect(afterDuplicateConclusion.taskScores.incidentConclusion).toBe(150);
    expect(finished.state.optionalScores).toEqual({ researchNote: 50, forgottenRecording: 50 });
    expect(finished.state.score).toBe(1000); // 1,000 base + 100 optional − 100 unique failed submissions.
    const officialState = await call('tracker', '/state');
    expect((await officialState.json() as { session: { score: number } }).session.score).toBe(1000);
    expect((await call('archivist', '/hunt1/action', { type: 'submit', actor: 'archivist', value: { sequence: historical } })).status).toBe(400);
    expect((await call('tracker', '/hunt2/session', {})).status).toBe(200);

    const expiryTeam = { id: `hunt1-expiry-${suffix}`, name: `Hunt1 Expiry ${suffix}`, password: 'Expiry#2026' };
    const now = new Date().toISOString();
    const { hash, salt } = hashPassword(expiryTeam.password);
    db.prepare(`INSERT INTO teams (id, team_name, password_hash, salt, raw_password, is_paused, score, max_credits, total_credits, login_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, 0, 500, 500, 0, ?, ?)`)
      .run(expiryTeam.id, expiryTeam.name, hash, salt, expiryTeam.password, now, now);
    const login = await fetch(`${baseUrl}/api/auth/team-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamName: expiryTeam.name, password: expiryTeam.password }) });
    const expiryToken = (await login.json() as { token: string }).token;
    const trackerLogin = await fetch(`${baseUrl}/api/auth/team-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamName: expiryTeam.name, password: expiryTeam.password }) });
    const expiryTrackerToken = (await trackerLogin.json() as { token: string }).token;
    const expiryAuth = { Authorization: `Bearer ${expiryToken}`, 'Content-Type': 'application/json' };
    await fetch(`${baseUrl}/api/round3/session`, { method: 'POST', headers: expiryAuth, body: '{}' });
    await fetch(`${baseUrl}/api/round3/run/start`, { method: 'POST', headers: expiryAuth, body: '{}' });
    await fetch(`${baseUrl}/api/round3/hunt1/session`, { method: 'POST', headers: expiryAuth, body: '{}' });
    const expiryStateRow = db.prepare('SELECT state_json FROM round3_hunt1_sessions WHERE team_id=?').get(expiryTeam.id) as { state_json: string };
    const expiryState = JSON.parse(expiryStateRow.state_json);
    expiryState.currentChallenge = 4;
    expiryState.subtasks = { observationLog: true, cameraBuffer: true };
    expiryState.observationTimeline = { archivistTimeline: timeline, archivistValid: true, trackerTimeline: null, trackerValid: false };
    db.prepare('UPDATE round3_hunt1_sessions SET state_json=? WHERE team_id=?').run(JSON.stringify(expiryState), expiryTeam.id);
    db.prepare('UPDATE round3_runs SET started_at=? WHERE team_id=?').run(new Date(Date.now() - 26 * 60 * 1000).toISOString(), expiryTeam.id);
    const afterExpiry = await fetch(`${baseUrl}/api/round3/hunt1/action`, { method: 'POST', headers: { Authorization: `Bearer ${expiryTrackerToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'observationTracker', actor: 'tracker', value: { sequence: timeline } }) });
    expect(afterExpiry.status).toBe(409);
    expect(JSON.parse((db.prepare('SELECT state_json FROM round3_hunt1_sessions WHERE team_id=?').get(expiryTeam.id) as { state_json: string }).state_json).taskScores.observationLog).toBe(0);
    db.prepare('DELETE FROM teams WHERE id=?').run(expiryTeam.id);
  });
});
