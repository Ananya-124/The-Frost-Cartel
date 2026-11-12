// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import * as crypto from 'node:crypto';
import { app } from '../index.ts';
import { db, initDatabase, hashPassword } from '../../database/db.ts';

const hasPg = Boolean(process.env.PG_TEST_DATABASE_URL || process.env.DATABASE_URL);
const suite = hasPg ? describe : describe.skip;

suite('ROUND 04 — COMPLETE 5-ROUTE ANSWER & SEVENTH FLOOR VERIFICATION AUDIT', () => {
  let server: Server;
  let baseUrl: string;
  let adminToken: string;

  // 5 qualified squads for Routes 1 to 5
  const squads: Array<{
    id: string;
    name: string;
    routeId: string;
    routeNum: number;
    token: string;
  }> = [];

  const EXPECTED_ROUTES = [
    {
      routeId: 'route-1',
      name: 'Route I',
      sequence: ['floor-04', 'floor-02', 'floor-05', 'floor-03', 'floor-07'],
      steps: [
        { stepId: 'r1_s1', floor: 'floor-04', word: 'WRAITH', qr: 'fc_qr_r1_s1_w47a' },
        { stepId: 'r1_s2', floor: 'floor-02', word: 'CANDLE', qr: 'fc_qr_r1_s2_c92b' },
        { stepId: 'r1_s3', floor: 'floor-05', word: 'RAVEN', qr: 'fc_qr_r1_s3_r18c' },
        { stepId: 'r1_s4', floor: 'floor-03', word: 'HEX', qr: 'fc_qr_r1_s4_h34d' },
        { stepId: 'r1_s5', floor: 'floor-07', word: 'ANCHOR', qr: 'fc_qr_final_7th_relic' },
      ],
    },
    {
      routeId: 'route-2',
      name: 'Route II',
      sequence: ['floor-02', 'floor-04', 'floor-06', 'floor-03', 'floor-07'],
      steps: [
        { stepId: 'r2_s1', floor: 'floor-02', word: 'GHOUL', qr: 'fc_qr_r2_s1_g51a' },
        { stepId: 'r2_s2', floor: 'floor-04', word: 'COVEN', qr: 'fc_qr_r2_s2_c73b' },
        { stepId: 'r2_s3', floor: 'floor-06', word: 'PHANTOM', qr: 'fc_qr_r2_s3_p29c' },
        { stepId: 'r2_s4', floor: 'floor-03', word: 'GRIMOIRE', qr: 'fc_qr_r2_s4_g84d' },
        { stepId: 'r2_s5', floor: 'floor-07', word: 'ANCHOR', qr: 'fc_qr_final_7th_relic' },
      ],
    },
    {
      routeId: 'route-3',
      name: 'Route III',
      sequence: ['floor-02', 'floor-06', 'floor-03', 'floor-05', 'floor-07'],
      steps: [
        { stepId: 'r3_s1', floor: 'floor-02', word: 'SPECTER', qr: 'fc_qr_r3_s1_s62a' },
        { stepId: 'r3_s2', floor: 'floor-06', word: 'TALISMAN', qr: 'fc_qr_r3_s2_t15b' },
        { stepId: 'r3_s3', floor: 'floor-03', word: 'WITCH', qr: 'fc_qr_r3_s3_w93c' },
        { stepId: 'r3_s4', floor: 'floor-05', word: 'BANSHEE', qr: 'fc_qr_r3_s4_b46d' },
        { stepId: 'r3_s5', floor: 'floor-07', word: 'ANCHOR', qr: 'fc_qr_final_7th_relic' },
      ],
    },
    {
      routeId: 'route-4',
      name: 'Route IV',
      sequence: ['floor-04', 'floor-06', 'floor-02', 'floor-05', 'floor-07'],
      steps: [
        { stepId: 'r4_s1', floor: 'floor-04', word: 'CAULDRON', qr: 'fc_qr_r4_s1_c38a' },
        { stepId: 'r4_s2', floor: 'floor-06', word: 'NIGHTFALL', qr: 'fc_qr_r4_s2_n72b' },
        { stepId: 'r4_s3', floor: 'floor-02', word: 'COBWEB', qr: 'fc_qr_r4_s3_c19c' },
        { stepId: 'r4_s4', floor: 'floor-05', word: 'LANTERN', qr: 'fc_qr_r4_s4_l85d' },
        { stepId: 'r4_s5', floor: 'floor-07', word: 'ANCHOR', qr: 'fc_qr_final_7th_relic' },
      ],
    },
    {
      routeId: 'route-5',
      name: 'Route V',
      sequence: ['floor-06', 'floor-02', 'floor-05', 'floor-04', 'floor-07'],
      steps: [
        { stepId: 'r5_s1', floor: 'floor-06', word: 'VAMPIRE', qr: 'fc_qr_r5_s1_v44a' },
        { stepId: 'r5_s2', floor: 'floor-02', word: 'MIDNIGHT', qr: 'fc_qr_r5_s2_m81b' },
        { stepId: 'r5_s3', floor: 'floor-05', word: 'CRYPT', qr: 'fc_qr_r5_s3_c27c' },
        { stepId: 'r5_s4', floor: 'floor-04', word: 'OMEN', qr: 'fc_qr_r5_s4_o63d' },
        { stepId: 'r5_s5', floor: 'floor-07', word: 'ANCHOR', qr: 'fc_qr_final_7th_relic' },
      ],
    },
  ];

  beforeAll(async () => {
    initDatabase();
    db.exec('DELETE FROM round4_winner;');
    db.exec('DELETE FROM round4_team_progress;');
    db.exec('DELETE FROM round4_qualified_teams;');

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });

    // Admin login
    const adminRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin123', password: 'admin@1' }),
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;

    // Create 5 squads and assign Routes 1 to 5
    const now = new Date().toISOString();
    for (let i = 1; i <= 5; i++) {
      const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const teamId = `audit-squad-${i}-${uid}`;
      const name = `Squad ${i} Expeditioner ${uid}`;
      const pass = `Pass#${i}#2026`;
      const { hash, salt } = hashPassword(pass);
      const token = `audit_tok_${i}_${crypto.randomBytes(16).toString('hex')}`;

      db.prepare(`
        INSERT INTO teams (id, team_name, password_hash, salt, raw_password, is_paused, score, max_credits, total_credits, login_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, 100, 500, 500, 1, ?, ?)
      `).run(teamId, name, hash, salt, pass, now, now);

      db.prepare(`
        INSERT INTO team_sessions (id, team_id, token, player_number, expires_at, created_at)
        VALUES (?, ?, ?, 1, ?, ?)
      `).run(`sess-${teamId}`, teamId, token, new Date(Date.now() + 86400000).toISOString(), now);

      squads.push({
        id: teamId,
        name,
        routeId: `route-${i}`,
        routeNum: i,
        token,
      });
    }

    // Qualify the 5 squads
    const assignments = squads.map((s) => ({
      teamId: s.id,
      routeId: s.routeId,
    }));

    const qualRes = await fetch(`${baseUrl}/api/round4/admin/qualify-teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ assignments }),
    });
    expect(qualRes.status).toBe(200);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('verifies that all 5 routes are properly registered with 5 distinct steps each', () => {
    const routeRows = db.prepare('SELECT id, route_number, roman_numeral FROM round4_routes ORDER BY route_number ASC').all() as Array<{ id: string; route_number: number; roman_numeral: string }>;
    expect(routeRows.length).toBe(5);

    for (let r = 1; r <= 5; r++) {
      const stepRows = db.prepare('SELECT clue_index, floor_id, validation_word, qr_token FROM round4_steps WHERE route_id = ? ORDER BY clue_index ASC').all(`route-${r}`) as Array<{
        clue_index: number;
        floor_id: string;
        validation_word: string;
        qr_token: string;
      }>;
      expect(stepRows.length).toBe(5);
      const expected = EXPECTED_ROUTES[r - 1];
      for (let s = 0; s < 5; s++) {
        expect(stepRows[s].clue_index).toBe(s + 1);
        expect(stepRows[s].floor_id).toBe(expected.steps[s].floor);
        expect(stepRows[s].validation_word).toBe(expected.steps[s].word);
        expect(stepRows[s].qr_token).toBe(expected.steps[s].qr);
      }
    }
  });

  it('executes full automated run across all 5 routes: testing validation, case-insensitivity, whitespace trimming, and wrong-answer rejection', async () => {
    for (let r = 0; r < 5; r++) {
      const squad = squads[r];
      const routeInfo = EXPECTED_ROUTES[r];

      // Solve Steps 1 through 4
      for (let s = 0; s < 4; s++) {
        const stepDef = routeInfo.steps[s];

        // 1. Fetch current step route status
        const myRouteRes = await fetch(`${baseUrl}/api/round4/my-route`, {
          headers: { Authorization: `Bearer ${squad.token}` },
        });
        const myRouteData = await myRouteRes.json();
        expect(myRouteData.activeStep.clueIndex).toBe(s + 1);
        expect(myRouteData.activeStep.floorId).toBe(stepDef.floor);

        // 2. Discover target
        const discRes = await fetch(`${baseUrl}/api/round4/discover-target`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${squad.token}` },
        });
        expect(discRes.status).toBe(200);

        // 3. Test wrong answer rejection
        const wrongRes = await fetch(`${baseUrl}/api/round4/submit-clue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${squad.token}`,
          },
          body: JSON.stringify({
            stepId: stepDef.stepId,
            answer: 'INCORRECT_CIPHER_TOKEN',
          }),
        });
        expect(wrongRes.status).toBe(400);

        // 4. Test wrong step out-of-order rejection (trying to submit step 5 now)
        const oooRes = await fetch(`${baseUrl}/api/round4/submit-clue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${squad.token}`,
          },
          body: JSON.stringify({
            stepId: `${routeInfo.routeId}_s5`,
            answer: 'ANCHOR',
          }),
        });
        expect(oooRes.status).toBe(400);

        // 5. Test QR checkpoint verification
        const qrRes = await fetch(`${baseUrl}/api/round4/scan-qr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${squad.token}`,
          },
          body: JSON.stringify({ qrToken: stepDef.qr }),
        });
        expect(qrRes.status).toBe(200);
        const qrData = await qrRes.json();
        expect(qrData.valid).toBe(true);
        expect(qrData.validationWord).toBe(stepDef.word);

        // 6. Submit correct answer with test of case insensitivity and whitespace padding!
        // E.g. '  wraith  ' instead of 'WRAITH' on step 1 of Route 1
        const answerVariant = s % 2 === 0
          ? `  ${stepDef.word.toLowerCase()}  `
          : stepDef.word.toUpperCase();

        const subRes = await fetch(`${baseUrl}/api/round4/submit-clue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${squad.token}`,
          },
          body: JSON.stringify({
            stepId: stepDef.stepId,
            answer: answerVariant,
          }),
        });
        expect(subRes.status).toBe(200);
        const subData = await subRes.json();
        expect(subData.success).toBe(true);
        expect(subData.correct).toBe(true);
      }

      // Squad is now waiting on Step 5 (Common Final Room on Floor 7)
      const finalCheck = await fetch(`${baseUrl}/api/round4/my-route`, {
        headers: { Authorization: `Bearer ${squad.token}` },
      });
      const finalCheckData = await finalCheck.json();
      expect(finalCheckData.activeStep.clueIndex).toBe(5);
      expect(finalCheckData.activeStep.isCommonFinal).toBe(true);
      expect(finalCheckData.activeStep.floorId).toBe('floor-07');
    }
  });

  it('demonstrates that all 5 squads converge at Floor 7 and tests single-winner championship atomicity', async () => {
    // All 5 squads discover the final target
    for (const squad of squads) {
      const discRes = await fetch(`${baseUrl}/api/round4/discover-target`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${squad.token}` },
      });
      expect(discRes.status).toBe(200);
    }

    // Squad 3 submits the winning final answer first using alias "CEILING FAN"
    const winnerRes = await fetch(`${baseUrl}/api/round4/submit-clue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${squads[2].token}`,
      },
      body: JSON.stringify({
        stepId: 'r3_s5',
        answer: '  ceiling fan  ', // tests whitespace & case insensitivity on alias!
      }),
    });

    expect(winnerRes.status).toBe(200);
    const winnerData = await winnerRes.json();
    expect(winnerData.success).toBe(true);
    expect(winnerData.isWinner).toBe(true);
    expect(winnerData.teamName).toBe(squads[2].name);

    // Now other squads submit valid answers ("ANCHOR", "WHITE SPINNERS", etc.)
    // They must receive raceClosed = true and NOT be declared winners
    const lateSquads = [squads[0], squads[1], squads[3], squads[4]];
    for (const lateSquad of lateSquads) {
      const lateRes = await fetch(`${baseUrl}/api/round4/submit-clue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${lateSquad.token}`,
        },
        body: JSON.stringify({
          stepId: `r${lateSquad.routeNum}_s5`,
          answer: 'ANCHOR',
        }),
      });

      const lateData = await lateRes.json();
      expect(lateData.success).toBe(false);
      expect(lateData.raceClosed).toBe(true);
      expect(lateData.winner.teamId).toBe(squads[2].id);
    }

    // Verify DB strictly records ONE champion
    const winnersInDb = db.prepare('SELECT * FROM round4_winner').all() as Array<{ team_id: string }>;
    expect(winnersInDb.length).toBe(1);
    expect(winnersInDb[0].team_id).toBe(squads[2].id);
  });
});
