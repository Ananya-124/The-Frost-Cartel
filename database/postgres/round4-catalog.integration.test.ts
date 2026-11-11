// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migration-runner.ts';

const connectionString = process.env.PG_TEST_DATABASE_URL;
const suite = connectionString ? describe : describe.skip;
let adminPool: Pool;
let pool: Pool;
let schemaName: string;

suite('Round 4 PostgreSQL catalog migration 012', () => {
  beforeAll(async () => {
    const parsed = new URL(connectionString!);
    if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
      throw new Error('PG_TEST_DATABASE_URL must point to a local PostgreSQL server; remote databases are refused.');
    }
    adminPool = new Pool({ connectionString });
    schemaName = `frost_r4_catalog_${randomUUID().replaceAll('-', '')}`;
    await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
    pool = new Pool({ connectionString, options: `-c search_path=${schemaName}` });
    await runMigrations(pool, path.resolve('database/postgres/migrations'));
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
    if (schemaName) await adminPool?.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await adminPool?.end();
  });

  it('seeds the seven routes and their exact five-clue sequence', async () => {
    expect((await pool.query('SELECT count(*)::int AS count FROM round4_routes')).rows[0].count).toBe(7);
    expect((await pool.query('SELECT count(*)::int AS count FROM round4_steps')).rows[0].count).toBe(35);

    const routeRows = await pool.query(`
      SELECT r.id, r.route_number, r.roman_numeral, r.route_name, r.route_subtitle,
             count(s.id)::int AS clue_count,
             array_agg(s.clue_index ORDER BY s.clue_index) AS clue_order,
             array_agg(s.is_common_final ORDER BY s.clue_index) AS common_final_flags
      FROM round4_routes r LEFT JOIN round4_steps s ON s.route_id=r.id
      GROUP BY r.id ORDER BY r.route_number
    `);
    expect(routeRows.rows).toEqual([
      { id: 'route-1', route_number: 1, roman_numeral: 'I', route_name: 'Route I', route_subtitle: 'The Celestial Meridian & Solar Horizon', clue_count: 5, clue_order: [1, 2, 3, 4, 5], common_final_flags: [false, false, false, false, true] },
      { id: 'route-2', route_number: 2, roman_numeral: 'II', route_name: 'Route II', route_subtitle: "The Cartographer's Traverse", clue_count: 5, clue_order: [1, 2, 3, 4, 5], common_final_flags: [false, false, false, false, true] },
      { id: 'route-3', route_number: 3, roman_numeral: 'III', route_name: 'Route III', route_subtitle: 'The Alchemical Cryptogram', clue_count: 5, clue_order: [1, 2, 3, 4, 5], common_final_flags: [false, false, false, false, true] },
      { id: 'route-4', route_number: 4, roman_numeral: 'IV', route_name: 'Route IV', route_subtitle: 'The Scriptorium Cipher', clue_count: 5, clue_order: [1, 2, 3, 4, 5], common_final_flags: [false, false, false, false, true] },
      { id: 'route-5', route_number: 5, roman_numeral: 'V', route_name: 'Route V', route_subtitle: 'The Platinum Block Chronology', clue_count: 5, clue_order: [1, 2, 3, 4, 5], common_final_flags: [false, false, false, false, true] },
      { id: 'route-6', route_number: 6, roman_numeral: 'VI', route_name: 'Route VI', route_subtitle: "The Astronomer's Needle", clue_count: 5, clue_order: [1, 2, 3, 4, 5], common_final_flags: [false, false, false, false, true] },
      { id: 'route-7', route_number: 7, roman_numeral: 'VII', route_name: 'Route VII', route_subtitle: 'The Keystone Pilgrimage', clue_count: 5, clue_order: [1, 2, 3, 4, 5], common_final_flags: [false, false, false, false, true] },
    ]);

    const associations = await pool.query(`
      SELECT id, route_id, clue_index, floor_id, location_name, target_x, target_y,
             trigger_radius, riddle_text, field_location_hint, accepted_answers,
             is_case_sensitive, is_common_final
      FROM round4_steps ORDER BY route_id, clue_index
    `);
    expect(associations.rows).toHaveLength(35);
    for (const row of associations.rows) {
      const [, routeNumber, clueNumber] = row.id.match(/^r([1-7])_s([1-5])$/) ?? [];
      expect(routeNumber).toBeDefined();
      expect(row.route_id).toBe(`route-${routeNumber}`);
      expect(row.clue_index).toBe(Number(clueNumber));
      expect(row.is_common_final).toBe(row.clue_index === 5);
      expect(row.is_case_sensitive).toBe(false);
      expect(row.trigger_radius).toBe(36);
      expect(row.accepted_answers).toHaveLength(3);
    }
    expect(associations.rows.filter((row) => row.is_common_final)).toHaveLength(7);
    const actualCatalog = associations.rows.map((row) => ({
      id: row.id,
      routeId: row.route_id,
      clueIndex: row.clue_index,
      floorId: row.floor_id,
      locationName: row.location_name,
      targetX: Number(row.target_x),
      targetY: Number(row.target_y),
      triggerRadius: Number(row.trigger_radius),
      riddleText: row.riddle_text,
      fieldLocationHint: row.field_location_hint,
      acceptedAnswers: row.accepted_answers,
      isCaseSensitive: row.is_case_sensitive,
      isCommonFinal: row.is_common_final,
    }));
    expect(actualCatalog.every((clue) =>
      clue.id.length > 0 && clue.floorId.length > 0 && clue.locationName.length > 0 &&
      clue.riddleText.length > 0 && clue.fieldLocationHint.length > 0 &&
      clue.acceptedAnswers.length === 3 && clue.targetX >= 0 && clue.targetY >= 0 &&
      clue.triggerRadius > 0,
    )).toBe(true);
  });

  it('is re-runnable without duplicates and leaves release, qualification, progress and winner untouched', async () => {
    const migration = await readFile(path.resolve('database/postgres/migrations/012_round4_catalog_seed.sql'), 'utf8');
    await pool.query(migration);
    expect((await pool.query('SELECT count(*)::int AS count FROM round4_routes')).rows[0].count).toBe(7);
    expect((await pool.query('SELECT count(*)::int AS count FROM round4_steps')).rows[0].count).toBe(35);
    expect((await pool.query('SELECT is_released FROM round4_settings WHERE id=1')).rows[0].is_released).toBe(false);
    expect((await pool.query('SELECT count(*)::int AS count FROM round4_qualified_teams')).rows[0].count).toBe(0);
    expect((await pool.query('SELECT count(*)::int AS count FROM round4_team_progress')).rows[0].count).toBe(0);
    expect((await pool.query('SELECT count(*)::int AS count FROM round4_winner')).rows[0].count).toBe(0);
  });

  it('retains route foreign keys and clue catalog constraints', async () => {
    await expect(pool.query("INSERT INTO round4_steps(id,route_id,clue_index,floor_id,location_name,target_x,target_y,riddle_text,field_location_hint,accepted_answers) VALUES('bad-route-step','missing-route',1,'floor-1','room',1,2,'riddle','hint','[]'::jsonb)"))
      .rejects.toMatchObject({ code: '23503' });
    await expect(pool.query("INSERT INTO round4_steps(id,route_id,clue_index,floor_id,location_name,target_x,target_y,riddle_text,field_location_hint,accepted_answers) VALUES('bad-clue-index','route-1',6,'floor-1','room',1,2,'riddle','hint','[]'::jsonb)"))
      .rejects.toMatchObject({ code: '23514' });
    await expect(pool.query("INSERT INTO round4_steps(id,route_id,clue_index,floor_id,location_name,target_x,target_y,riddle_text,field_location_hint,accepted_answers) VALUES('bad-answer-shape','route-1',1,'floor-1','room',1,2,'riddle','hint','{}'::jsonb)"))
      .rejects.toMatchObject({ code: '23514' });
  });
});
