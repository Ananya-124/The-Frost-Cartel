import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Hunt1ActionResult, Hunt1Actor, Hunt1State } from '../../src/types/hunt1.types.ts';

const originalDatabasePath = process.env.SQLITE_DB_PATH;
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'frost-cartel-hunt1-'));
process.env.SQLITE_DB_PATH = path.join(temporaryDirectory, 'integration.db');

let database: typeof import('../../database/db.ts');
let round3: typeof import('./round3.service.ts');
let hunt1: typeof import('./round3-hunt1.service.ts');
const teamId = 'hunt1-integration-team';
const teamName = 'Hunt I Integration Team';

beforeAll(async () => {
  database = await import('../../database/db.ts');
  database.db.exec('CREATE TABLE teams (id TEXT PRIMARY KEY, team_name TEXT NOT NULL);');
  database.db.prepare('INSERT INTO teams (id, team_name) VALUES (?, ?)').run(teamId, teamName);
  round3 = await import('./round3.service.ts');
  database.db.exec(`
    CREATE TABLE round3_hunt2_sessions (team_id TEXT PRIMARY KEY, state_json TEXT NOT NULL);
    CREATE TABLE round3_hunt3_sessions (team_id TEXT PRIMARY KEY, state_json TEXT NOT NULL);
  `);
  hunt1 = await import('./round3-hunt1.service.ts');
  round3.ensureRound3Session({ id: teamId, teamName });
  hunt1.ensureRound3Hunt1State(teamId, 1);
});

afterAll(() => {
  database?.db.close();
  if (originalDatabasePath === undefined) delete process.env.SQLITE_DB_PATH;
  else process.env.SQLITE_DB_PATH = originalDatabasePath;
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

describe('Hunt I two-player integration', () => {
  it('validates retained investigations, cooperative gates, points, and refresh state', async () => {
    const act = async (actor: Hunt1Actor, type: string, value?: unknown, objectId?: string): Promise<Hunt1ActionResult> => {
      const result = await Promise.resolve().then(() =>
        hunt1.applyRound3Hunt1Action(teamId, { type, actor, value, objectId }),
      );
      if (!result) throw new Error(`Action ${type} did not return a Hunt I state.`);
      return result;
    };
    const inspect = (_actor: Hunt1Actor): Hunt1State => {
      const result = hunt1.getRound3Hunt1State(teamId);
      if (!result) throw new Error('Hunt I session disappeared during integration test.');
      return result;
    };
    const examinePair = async (archivistObject: string, trackerObject: string) => {
      const results = await Promise.all([
        act('archivist', 'interact', undefined, archivistObject),
        act('tracker', 'interact', undefined, trackerObject),
      ]);
      expect(results.every((result) => result.success)).toBe(true);
    };
    const answer = (actor: Hunt1Actor, type: string, sequence: string[]) =>
      act(actor, type, { sequence });

    await examinePair('generatorLog', 'burntRelay');
    expect((await act('tracker', 'interact', undefined, 'openGround')).success).toBe(true);
    expect((await answer('archivist', 'powerFailureArchivist', ['generator-relay', 'relay-load', 'load-ground', 'ground-frame'])).success).toBe(true);
    const task3 = await answer('tracker', 'powerFailureTracker', ['generator-relay', 'relay-load', 'load-ground', 'ground-frame']);
    expect(task3.state.taskCompleted.powerFailure).toBe(true);
    expect(task3.state.currentChallenge).toBe(2);
    expect(task3.state.score).toBe(200);

    await examinePair('observationLog', 'cameraBuffer');
    const task4Results = await Promise.all([
      answer('archivist', 'observationArchivist', ['alarm', 'lights-fail', 'subject-appears', 'observer-vanishes']),
      answer('tracker', 'observationTracker', ['alarm', 'lights-fail', 'subject-appears', 'observer-vanishes']),
    ]);
    expect(task4Results[0].state.taskCompleted.observationLog).toBe(false);
    expect(task4Results[0].state.observationTimeline!.trackerTimeline).toBeNull();
    const task4 = task4Results[1];
    expect(task4.state.observationTimeline!.archivistTimeline).toEqual(['alarm', 'lights-fail', 'subject-appears', 'observer-vanishes']);
    expect(task4.state.observationTimeline!.trackerTimeline).toEqual(['alarm', 'lights-fail', 'subject-appears', 'observer-vanishes']);
    expect(task4.state.taskCompleted.observationLog).toBe(true);
    expect(task4.state.currentChallenge).toBe(3);
    expect(task4.state.score).toBe(400);

    await examinePair('signalChart', 'cableJunction');
    expect((await answer('tracker', 'signalTracker', ['intake', 'ground', 'observer', 'transmit'])).success).toBe(false);
    expect((await answer('archivist', 'signalArchivist', ['intake', 'ground', 'observer', 'transmit'])).success).toBe(true);
    const task5 = await answer('tracker', 'signalTracker', ['intake', 'ground', 'observer', 'transmit']);
    expect(task5.state.taskCompleted.signalReconstruction).toBe(true);
    expect(task5.state.currentChallenge).toBe(4);
    expect(task5.state.score).toBe(600);

    await examinePair('incidentBoardPast', 'incidentBoardFuture');
    const archiveConclusion = ['temporal-resonance-reconstructs-human-memories', 'resonance-limited-to-recorded-imprints'];
    const futureConclusion = ['omitted-ground-and-relay-bypass-exceeded-limits', 'a-reconstructed-memory-became-conscious-after-transmission', 'that-consciousness-manifested-as-the-entity'];
    const archivistConclusion = await answer('archivist', 'incidentConclusionArchivist', archiveConclusion);
    expect(archivistConclusion.state.completed).toBe(false);
    expect(inspect('tracker').incidentConclusion!.archivistInterpretation).toEqual(archiveConclusion);
    const task6 = await answer('tracker', 'incidentConclusionTracker', futureConclusion);
    expect(task6.state.completed).toBe(true);
    expect(task6.state.taskCompleted.incidentConclusion).toBe(true);
    expect(task6.state.score).toBe(750);
    expect(task6.state.penalties).toBe(0);

    const refreshed = hunt1.ensureRound3Hunt1State(teamId);
    expect(refreshed.completed).toBe(true);
    expect(refreshed.taskCompleted).toEqual(task6.state.taskCompleted);
    expect(refreshed.score).toBe(750);
  });
});
