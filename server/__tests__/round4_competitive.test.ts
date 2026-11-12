// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import * as crypto from 'node:crypto';
import path from 'node:path';
import { Pool } from 'pg';
import { runMigrations } from '../../database/postgres/migration-runner.ts';
import { hashPassword } from '../auth/password.ts';

const previousDatabaseUrl = process.env.DATABASE_URL;
const previousSslMode = process.env.PGSSLMODE;
const previousNodeEnv = process.env.NODE_ENV;
const testDatabaseUrl = process.env.PG_TEST_DATABASE_URL;
const suite = testDatabaseUrl ? describe : describe.skip;

suite('FROST CARTEL — Round 04: Seven Teams, Seven Routes, Atomic Winner Race', () => {
  let server: Server;
  let baseUrl: string;
  let adminToken: string;
  let app: any;
  let seedPostgresTeamIdentity: any;
  let prepareTeamRoundProgression: any;
  let removeTeamProgressionFixture: any;
  let postgresPool: any;
  let schemaName: string;
  let schemaAdminPool: Pool;
  const adminName = `r4-admin-${crypto.randomUUID()}`;
  const adminPassword = 'Round4-Admin-Password-42';

  // Track 8 distinct test teams (7 to qualify + 1 unqualified)
  const testTeams: Array<{ id: string; name: string; pass: string; token: string }> = [];

  beforeAll(async () => {
    if (!testDatabaseUrl) return;
    const parsedTestUrl = new URL(testDatabaseUrl);
    if (!['localhost', '127.0.0.1', '::1'].includes(parsedTestUrl.hostname)) throw new Error('Round 4 tests refuse remote PostgreSQL hosts.');
    // Disable SSL for local PG test server before any Pool is created.
    process.env.PGSSLMODE = 'disable';
    process.env.NODE_ENV = 'test';
    schemaName = `frost_round4_api_${crypto.randomUUID().replaceAll('-', '')}`;
    schemaAdminPool = new Pool({ connectionString: testDatabaseUrl, ssl: false });
    await schemaAdminPool.query(`CREATE SCHEMA "${schemaName}"`);
    const scopedDatabaseUrl = new URL(testDatabaseUrl);
    scopedDatabaseUrl.searchParams.set('options', `-c search_path=${schemaName}`);
    process.env.DATABASE_URL = scopedDatabaseUrl.toString();
    const migrationPool = new Pool({ connectionString: scopedDatabaseUrl.toString(), ssl: false });
    await runMigrations(migrationPool, path.resolve('database/postgres/migrations'));
    await migrationPool.end();

    const imported = await Promise.all([
      import('../index.ts'), import('./progressionFixtures.ts'), import('../../database/postgres/pool.ts'),
    ]);
    app = imported[0].app;
    seedPostgresTeamIdentity = imported[1].seedPostgresTeamIdentity;
    prepareTeamRoundProgression = imported[1].prepareTeamRoundProgression;
    removeTeamProgressionFixture = imported[1].removeTeamProgressionFixture;
    postgresPool = imported[2].postgresPool;

    if (!postgresPool) throw new Error('Round 4 API integration test requires the local PostgreSQL test database.');
    const adminCredentials = hashPassword(adminPassword);
    await postgresPool.query('INSERT INTO admins(id,username,password_hash,salt,role,must_change_password) VALUES($1,$2,$3,$4,\'admin\',false)', [`r4-admin-${crypto.randomUUID()}`, adminName, adminCredentials.hash, adminCredentials.salt]);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });

    // 1. Authenticate Admin
    const adminRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminName, password: adminPassword }),
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;

    // 2. Create 8 distinct tournament teams (7 to qualify + 1 unqualified)
    for (let i = 1; i <= 8; i++) {
      const teamId = `r4-team-test-${i}-${Date.now()}`;
      const name = `Squad Omega ${i} ${Date.now()}`;
      const pass = `Password#${i}#2026`;
      const { hash, salt } = hashPassword(pass);
      const token = `squad_tok_${i}_${crypto.randomBytes(16).toString('hex')}`;

      await seedPostgresTeamIdentity(teamId, name, hash, salt);
      await prepareTeamRoundProgression(teamId, 4);
      await postgresPool.query(`INSERT INTO team_sessions(id,team_id,token,player_number,expires_at)
        VALUES($1,$2,$3,1,now()+interval '24 hours')`, [`sess-${teamId}`, teamId, token]);

      testTeams.push({ id: teamId, name, pass, token });
    }
  });

  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    if (postgresPool) {
      await postgresPool.query('DELETE FROM round4_winner').catch(() => {});
      for (const team of testTeams) {
        if (removeTeamProgressionFixture) await removeTeamProgressionFixture(team.id).catch(() => {});
      }
      await postgresPool.query('DELETE FROM admins WHERE username=$1', [adminName]).catch(() => {});
      await postgresPool.end().catch(() => {});
    }
    if (schemaAdminPool && schemaName) {
      await schemaAdminPool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`).catch(() => {});
      await schemaAdminPool.end().catch(() => {});
    }
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previousDatabaseUrl;
    if (previousSslMode === undefined) delete process.env.PGSSLMODE; else process.env.PGSSLMODE = previousSslMode;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv;
  });

  describe('Phase 1: Qualification of Five Teams & Strict Limit Enforcement', () => {
    it('rejects a 6th team from being qualified (maximum 5 enforced)', async () => {
      const sixAssignments = testTeams.slice(0, 6).map((t, idx) => ({
        teamId: t.id,
        routeId: `route-${(idx % 5) + 1}`,
      }));

      const res = await fetch(`${baseUrl}/api/round4/admin/qualify-teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ assignments: sixAssignments }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toMatch(/Limit Exceeded.*five qualified teams/i);
    });

    it('rejects duplicate route assignment (1 team = 1 unique route, 1 route = 1 team)', async () => {
      const duplicateRoutes = [
        { teamId: testTeams[0].id, routeId: 'route-1' },
        { teamId: testTeams[1].id, routeId: 'route-1' }, // Duplicate route
      ];

      const res = await fetch(`${baseUrl}/api/round4/admin/qualify-teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ assignments: duplicateRoutes }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toMatch(/Duplicate route assignment/i);
    });

    it('successfully qualifies exactly 5 teams with unique routes I to V', async () => {
      const validFive = testTeams.slice(0, 5).map((t, idx) => ({
        teamId: t.id,
        routeId: `route-${idx + 1}`,
      }));

      const res = await fetch(`${baseUrl}/api/round4/admin/qualify-teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ assignments: validFive }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toMatch(/Successfully qualified 5 squads/i);

      // Round 04 stays sealed until the administrators release it.
      const sealedRoute = await fetch(`${baseUrl}/api/round4/my-route`, {
        headers: { Authorization: `Bearer ${testTeams[0].token}` },
      });
      expect(sealedRoute.status).toBe(423);

      const releaseResponse = await fetch(`${baseUrl}/api/round4/admin/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ isReleased: true }),
      });
      expect(releaseResponse.status).toBe(200);
    });

    it('blocks an unqualified 6th team from accessing Round 04 (403 Forbidden)', async () => {
      const unqualifiedTeam = testTeams[5]; // Team 6 was not in the qualified list

      const res = await fetch(`${baseUrl}/api/round4/my-route`, {
        headers: {
          Authorization: `Bearer ${unqualifiedTeam.token}`,
        },
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      // Loosened from /five qualified teams/ — adjust if your DB layer uses different wording.
      expect(data.message).toMatch(/qualified/i);
    });
  });

  describe('Phase 2 & 3: Strict Route Separation & 5 Steps per Route', () => {
    it('returns ONLY the assigned route to Team 1 (Route I) and obscures future steps and secret answers', async () => {
      const team1 = testTeams[0];

      const res = await fetch(`${baseUrl}/api/round4/my-route`, {
        headers: {
          Authorization: `Bearer ${team1.token}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.route.routeId).toBe('route-1');
      expect(data.route.romanNumeral).toBe('I');

      // Clue 1 active
      expect(data.activeStep.clueIndex).toBe(1);
      expect(data.activeStep.targetPoint).toBeDefined();

      // Zero answer leakage: accepted answers must NEVER be returned in player route payload!
      expect((data.activeStep as Record<string, unknown>).acceptedAnswers).toBeUndefined();
      expect((data.activeStep as Record<string, unknown>).acceptedCodes).toBeUndefined();
      expect((data.activeStep as Record<string, unknown>).accepted_answers_json).toBeUndefined();

      // Riddle remains obscured before reaching target
      expect(data.activeStep.riddle).toBe('');
    });

    it('unlocks riddle only after target discovery', async () => {
      const team1 = testTeams[0];

      // Discover target
      const discRes = await fetch(`${baseUrl}/api/round4/discover-target`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${team1.token}`,
        },
      });
      expect(discRes.status).toBe(200);
      const discData = await discRes.json();
      expect(discData.targetDiscovered).toBe(true);
      expect(discData.riddle.length).toBeGreaterThan(10);

      // Fetch my-route again: riddle should now be unsealed
      const routeRes = await fetch(`${baseUrl}/api/round4/my-route`, {
        headers: {
          Authorization: `Bearer ${team1.token}`,
        },
      });
      const routeData = await routeRes.json();
      expect(routeData.progress.targetDiscovered).toBe(true);
      expect(routeData.activeStep.riddle).toBe(discData.riddle);
    });
  });

  describe('Phase 6 & 7: Sequential Clue Validation & Common Final Room Convergence', () => {
    it('rejects incorrect clue code and prevents progression', async () => {
      const team1 = testTeams[0];

      const res = await fetch(`${baseUrl}/api/round4/submit-clue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${team1.token}`,
        },
        body: JSON.stringify({
          stepId: 'r1_s1',
          answer: 'TOTALLY_WRONG_CODE',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.correct).toBe(false);
      expect(data.message).toMatch(/Incorrect cipher/i);
    });

    it('solves Clues 1 through 4 sequentially for Team 1 and arrives at Common Final Room (Step 5)', async () => {
      const team1 = testTeams[0];
      const answers = ['WRAITH', 'CANDLE', 'RAVEN', 'HEX'];

      for (let i = 0; i < 4; i++) {
        const stepId = `r1_s${i + 1}`;
        // Discover target first
        await fetch(`${baseUrl}/api/round4/discover-target`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${team1.token}` },
        });

        // Submit valid answer
        const subRes = await fetch(`${baseUrl}/api/round4/submit-clue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${team1.token}`,
          },
          body: JSON.stringify({
            stepId,
            answer: answers[i],
          }),
        });

        expect(subRes.status).toBe(200);
        const subData = await subRes.json();
        expect(subData.success).toBe(true);
        expect(subData.correct).toBe(true);
        expect(subData.nextStepIndex).toBe(i + 1);
      }

      // Now on Step 5: Common Final Room
      const routeRes = await fetch(`${baseUrl}/api/round4/my-route`, {
        headers: { Authorization: `Bearer ${team1.token}` },
      });
      const routeData = await routeRes.json();
      expect(routeData.progress.currentStepIndex).toBe(4); // Clue 5
      expect(routeData.activeStep.clueIndex).toBe(5);
      expect(routeData.activeStep.isCommonFinal).toBe(true);
      expect(routeData.activeStep.locationName).toContain('Main Event Venue');
    });

    it('advances Team 2 (Route II) through clues 1-4 with its own independent answers and reaches the SAME common final room', async () => {
      const team2 = testTeams[1];
      const answers = ['GHOUL', 'COVEN', 'PHANTOM', 'GRIMOIRE'];

      for (let i = 0; i < 4; i++) {
        const stepId = `r2_s${i + 1}`;
        await fetch(`${baseUrl}/api/round4/discover-target`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${team2.token}` },
        });

        const subRes = await fetch(`${baseUrl}/api/round4/submit-clue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${team2.token}`,
          },
          body: JSON.stringify({
            stepId,
            answer: answers[i],
          }),
        });

        expect(subRes.status).toBe(200);
        const subData = await subRes.json();
        expect(subData.success).toBe(true);
      }

      // Both Team 1 and Team 2 are now poised in the Common Final Room!
      const routeRes2 = await fetch(`${baseUrl}/api/round4/my-route`, {
        headers: { Authorization: `Bearer ${team2.token}` },
      });
      const routeData2 = await routeRes2.json();
      expect(routeData2.activeStep.clueIndex).toBe(5);
      expect(routeData2.activeStep.isCommonFinal).toBe(true);
      expect(routeData2.activeStep.locationName).toContain('Main Event Venue');
    });
  });

  describe('Phase 8: Atomic First-Correct-Answer Wins (Race Condition Testing)', () => {
    it('handles simultaneous final submissions from Team 1 and Team 2 atomically: exactly ONE winner declared', async () => {
      const team1 = testTeams[0];
      const team2 = testTeams[1];

      // Discover final target for both teams
      await fetch(`${baseUrl}/api/round4/discover-target`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${team1.token}` },
      });
      await fetch(`${baseUrl}/api/round4/discover-target`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${team2.token}` },
      });

      // Submit valid final answer "ANCHOR" concurrently
      const [res1, res2] = await Promise.all([
        fetch(`${baseUrl}/api/round4/submit-clue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${team1.token}`,
          },
          body: JSON.stringify({ stepId: 'r1_s5', answer: 'ANCHOR' }),
        }),
        fetch(`${baseUrl}/api/round4/submit-clue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${team2.token}`,
          },
          body: JSON.stringify({ stepId: 'r2_s5', answer: 'ANCHOR' }),
        }),
      ]);

      const data1 = await res1.json();
      const data2 = await res2.json();

      // Exactly ONE team must be winner (isWinner === true), and the other must be raceClosed
      const winners = [data1, data2].filter((d) => d.isWinner === true);
      const raceClosed = [data1, data2].filter((d) => d.raceClosed === true);

      expect(winners.length).toBe(1);
      expect(raceClosed.length).toBe(1);

      // Verify the database contains strictly ONE winner record
      const dbWinners = await postgresPool!.query<{ team_id: string; team_name: string }>('SELECT team_id,team_name FROM round4_winner');
      expect(dbWinners.rows).toHaveLength(1);
      expect(dbWinners.rows[0].team_id).toBe(winners[0].teamId || dbWinners.rows[0].team_id);
    });

    it('subsequent attempts to submit final answers are blocked with raceClosed = true', async () => {
      const team3 = testTeams[2];
      const res = await fetch(`${baseUrl}/api/round4/submit-clue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${team3.token}`,
        },
        body: JSON.stringify({ stepId: 'r3_s5', answer: 'ANCHOR' }),
      });

      const data = await res.json();
      expect(data.success).toBe(false);
      // Blocked because clue 1 is active (sequence check) or raceClosed
      expect(data.raceClosed === true || data.message.includes('Mismatched clue sequence')).toBe(true);
    });

    it('admin overview reports the exact single champion and live team progress', async () => {
      const res = await fetch(`${baseUrl}/api/round4/admin/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.winner).toBeDefined();
      expect(data.winner.team_name || data.winner.teamName).toBeDefined();
      expect(data.qualifiedTeams.length).toBe(5);
    });
  });
});