// @vitest-environment node
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migration-runner.ts';

const connectionString = process.env.PG_TEST_DATABASE_URL;
const suite = connectionString ? describe : describe.skip;
let adminPool: Pool;
let pool: Pool;
let schemaName: string;

suite('PostgreSQL application schema migrations 001–012', () => {
  beforeAll(async () => {
    const parsed = new URL(connectionString!);
    if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
      throw new Error('PG_TEST_DATABASE_URL must point to a local PostgreSQL server; remote databases are refused.');
    }
    adminPool = new Pool({ connectionString });
    schemaName = `frost_schema_${randomUUID().replaceAll('-', '')}`;
    await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
    pool = new Pool({ connectionString, options: `-c search_path=${schemaName}` });
    await runMigrations(pool, path.resolve('database/postgres/migrations'));
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
    if (schemaName) await adminPool?.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await adminPool?.end();
  });

  it('applies all twelve migrations in order and initializes a new team once', async () => {
    const versions = await pool.query<{ version: string }>('SELECT version FROM schema_migrations ORDER BY version');
    expect(versions.rows.map(({ version }) => version)).toEqual([
      '001_foundation.sql', '002_seed_catalog.sql', '003_team_progression.sql',
      '004_round1_and_shared_ledgers.sql', '005_round2_auction.sql',
      '006_round3_state.sql', '007_round4_expedition.sql', '008_round1_prelaunch_default.sql',
      '009_round1_configuration.sql', '010_round2_admin_audit.sql',
      '011_round3_timer_initialization.sql',
      '012_round4_catalog_seed.sql',
    ]);
    expect((await pool.query('SELECT singleton_id,configuration FROM round1_configuration')).rows).toEqual([{ singleton_id: 1, configuration: {} }]);

    await pool.query("INSERT INTO teams(id,team_name,password_hash,salt) VALUES('schema-team','Schema Team','hash','salt')");
    expect((await pool.query('SELECT count(*)::int AS count FROM round_progress WHERE team_id=$1', ['schema-team'])).rows[0].count).toBe(4);
    expect((await pool.query('SELECT count(*)::int AS count FROM team_hunt_progress WHERE team_id=$1', ['schema-team'])).rows[0].count).toBe(3);
    expect((await pool.query('SELECT stage_id,status,max_score FROM round1_stage_progress WHERE team_id=$1 ORDER BY stage_id', ['schema-team'])).rows)
      .toEqual([
        { stage_id: 1, status: 'AVAILABLE', max_score: 100 },
        { stage_id: 2, status: 'AVAILABLE', max_score: 150 },
        { stage_id: 3, status: 'AVAILABLE', max_score: 250 },
      ]);
    expect((await pool.query('SELECT team_id,current_hunt,is_completed,version FROM round3_sessions WHERE team_id=$1', ['schema-team'])).rows)
      .toEqual([{ team_id: 'schema-team', current_hunt: 1, is_completed: false, version: '1' }]);
    expect((await pool.query('SELECT team_id,status,remaining_ms,started_at,version FROM round3_runs WHERE team_id=$1', ['schema-team'])).rows)
      .toEqual([{ team_id: 'schema-team', status: 'not_started', remaining_ms: '1500000', started_at: null, version: '1' }]);
    expect((await pool.query('SELECT team_id,hunt_id,state,model_version,version FROM round3_hunt_state WHERE team_id=$1 ORDER BY hunt_id', ['schema-team'])).rows)
      .toEqual([1, 2, 3].map((hunt_id) => ({
        team_id: 'schema-team', hunt_id, state: {}, model_version: 1, version: '1',
      })));
    expect((await pool.query('SELECT id,is_released FROM round4_settings')).rows)
      .toEqual([{ id: 1, is_released: false }]);
    expect((await pool.query('SELECT id,enabled FROM round2_auction_config')).rows)
      .toEqual([{ id: 1, enabled: false }]);
    expect((await pool.query('SELECT is_active FROM rounds WHERE round_id=1')).rows[0].is_active).toBe(false);
    expect((await pool.query("SELECT count(*)::int AS count FROM round3_auction_card_mappings WHERE mapping_status='UNMAPPED' AND round3_card_id IS NULL")).rows[0].count).toBe(11);
    expect((await pool.query("SELECT count(*)::int AS count FROM round3_auction_card_mappings WHERE mapping_status <> 'UNMAPPED' OR round3_card_id IS NOT NULL")).rows[0].count).toBe(0);
  });

  it('upgrades existing schemas safely, correcting only unstarted zero-timer runs', async () => {
    const upgradeSchema = `frost_upgrade_${randomUUID().replaceAll('-', '')}`;
    await adminPool.query(`CREATE SCHEMA "${upgradeSchema}"`);
    const upgradePool = new Pool({ connectionString, options: `-c search_path=${upgradeSchema}` });
    const { mkdtemp, rm, copyFile, readdir } = await import('node:fs/promises');
    const os = await import('node:os');
    const legacyMigrations = await mkdtemp(path.join(os.tmpdir(), 'frost-pg-legacy-migrations-'));
    try {
      const migrationsPath = path.resolve('database/postgres/migrations');
      for (const name of (await readdir(migrationsPath)).filter((name) => name < '011_round3_timer_initialization.sql')) {
        await copyFile(path.join(migrationsPath, name), path.join(legacyMigrations, name));
      }
      await runMigrations(upgradePool, legacyMigrations);
      await upgradePool.query("INSERT INTO teams(id,team_name,password_hash,salt) VALUES('legacy-unstarted','Legacy Unstarted','hash','salt'),('legacy-running','Legacy Running','hash','salt')");
      await upgradePool.query("UPDATE round3_runs SET status='running',remaining_ms=765432,version=8 WHERE team_id='legacy-running'");
      const singleMigration = await mkdtemp(path.join(os.tmpdir(), 'frost-pg-forward-migration-'));
      try {
        await copyFile(path.join('database/postgres/migrations', '011_round3_timer_initialization.sql'), path.join(singleMigration, '011_round3_timer_initialization.sql'));
        await runMigrations(upgradePool, singleMigration);
        expect((await upgradePool.query('SELECT status,remaining_ms,version FROM round3_runs ORDER BY team_id')).rows)
          .toEqual([
            { status: 'running', remaining_ms: '765432', version: '8' },
            { status: 'not_started', remaining_ms: '1500000', version: '1' },
          ]);
        await upgradePool.query("INSERT INTO teams(id,team_name,password_hash,salt) VALUES('legacy-new','Legacy New','hash','salt')");
        expect((await upgradePool.query("SELECT remaining_ms FROM round3_runs WHERE team_id='legacy-new'")).rows[0].remaining_ms).toBe('1500000');
      } finally {
        await rm(singleMigration, { recursive: true, force: true });
      }
    } finally {
      await rm(legacyMigrations, { recursive: true, force: true });
      await upgradePool.end();
      await adminPool.query(`DROP SCHEMA IF EXISTS "${upgradeSchema}" CASCADE`);
    }
  });

  it('enforces idempotency on score, credit, activity and cooperation events', async () => {
    await pool.query("INSERT INTO teams(id,team_name,password_hash,salt) VALUES('ledger-team','Ledger Team','hash','salt')");
    await pool.query("INSERT INTO score_transactions(id,team_id,round_id,delta,new_score,reason,source_event_id) VALUES('score-1','ledger-team',1,10,10,'test','stage-event')");
    await expect(pool.query("INSERT INTO score_transactions(id,team_id,round_id,delta,new_score,reason,source_event_id) VALUES('score-2','ledger-team',1,10,20,'retry','stage-event')"))
      .rejects.toMatchObject({ code: '23505' });

    await pool.query("INSERT INTO credit_transactions(id,team_id,round_id,delta,balance_after,transaction_type,reference_id) VALUES('credit-1','ledger-team',2,-5,495,'bid','bid-1')");
    await expect(pool.query("INSERT INTO credit_transactions(id,team_id,round_id,delta,balance_after,transaction_type,reference_id) VALUES('credit-2','ledger-team',2,-5,490,'bid','bid-1')"))
      .rejects.toMatchObject({ code: '23505' });

    await pool.query("INSERT INTO activity_history(id,team_id,action,source_event_id) VALUES('activity-1','ledger-team','stage-completed','activity-event')");
    await expect(pool.query("INSERT INTO activity_history(id,team_id,action,source_event_id) VALUES('activity-2','ledger-team','stage-completed','activity-event')"))
      .rejects.toMatchObject({ code: '23505' });

    await pool.query("INSERT INTO round3_cooperation_ledger(event_id,team_id,points,event_type) VALUES('coop-event','ledger-team',5,'test')");
    await expect(pool.query("INSERT INTO round3_cooperation_ledger(event_id,team_id,points,event_type) VALUES('coop-event','ledger-team',5,'retry')"))
      .rejects.toMatchObject({ code: '23505' });
  });

  it('enforces auction settlement consistency across team, bid, lot and card ownership', async () => {
    await pool.query("INSERT INTO teams(id,team_name,password_hash,salt) VALUES('auction-team','Auction Team','hash','salt'),('other-team','Other Team','hash','salt')");
    await pool.query("INSERT INTO round2_auction_lots(id,sequence_number,power_card_id,status) VALUES('lot-1',1,'r2-card-1','ACTIVE'),('lot-2',2,'r2-card-2','PENDING'),('lot-3',3,'r2-card-1','PENDING'),('lot-4',4,'r2-card-1','PENDING'),('lot-5',5,'r2-card-1','PENDING'),('lot-6',6,'r2-card-2','PENDING')");
    await expect(pool.query("UPDATE round2_auction_lots SET status='ACTIVE' WHERE id='lot-2'"))
      .rejects.toMatchObject({ code: '23505' });
    await pool.query("INSERT INTO round2_bids(id,lot_id,team_id,amount,request_id) VALUES('bid-cross','lot-5','auction-team',100,'request-cross'),('bid-lot','lot-6','auction-team',101,'request-lot'),('bid-owner','lot-1','auction-team',102,'request-owner'),('bid-valid','lot-1','auction-team',103,'request-valid')");
    await pool.query("INSERT INTO team_power_cards(id,team_id,power_card_id,purchased_round_id,source,purchase_price,auction_lot_id) VALUES('owner-valid','auction-team','r2-card-1',2,'auction',100,'lot-1'),('owner-lot','auction-team','r2-card-2',2,'auction',101,'lot-2'),('owner-card','auction-team','r2-card-1',2,'auction',102,'lot-3'),('owner-cross','other-team','r2-card-1',2,'auction',100,'lot-5')");

    await expect(pool.query("INSERT INTO round2_settlements(id,lot_id,power_card_id,team_id,winning_bid_id,ownership_id) VALUES('settle-cross-team','lot-5','r2-card-1','other-team','bid-cross','owner-cross')"))
      .rejects.toMatchObject({ code: '23503' });
    await expect(pool.query("INSERT INTO round2_settlements(id,lot_id,power_card_id,team_id,winning_bid_id,ownership_id) VALUES('settle-wrong-lot','lot-2','r2-card-2','auction-team','bid-lot','owner-lot')"))
      .rejects.toMatchObject({ code: '23503' });
    await expect(pool.query("INSERT INTO round2_settlements(id,lot_id,power_card_id,team_id,winning_bid_id,ownership_id) VALUES('settle-wrong-owner','lot-1','r2-card-1','auction-team','bid-owner','owner-card')"))
      .rejects.toMatchObject({ code: '23503' });

    await expect(pool.query("INSERT INTO team_power_cards(id,team_id,power_card_id,purchased_round_id,source,purchase_price,auction_lot_id) VALUES('owner-wrong-card','auction-team','r2-card-2',2,'auction',100,'lot-4')"))
      .rejects.toMatchObject({ code: '23503' });
    await pool.query("INSERT INTO round2_settlements(id,lot_id,power_card_id,team_id,winning_bid_id,ownership_id) VALUES('settle-valid','lot-1','r2-card-1','auction-team','bid-valid','owner-valid')");
  });

  it('requires a qualified, completed team and route before recording the winner', async () => {
    await pool.query("INSERT INTO teams(id,team_name,password_hash,salt) VALUES('r4-alpha','R4 Alpha','hash','salt'),('r4-bravo','R4 Bravo','hash','salt'),('r4-outside','R4 Outside','hash','salt')");
    await pool.query("INSERT INTO round4_qualified_teams(id,team_id,route_id) VALUES('qual-alpha','r4-alpha','route-1'),('qual-bravo','r4-bravo','route-2')");
    await pool.query("INSERT INTO round4_team_progress(id,team_id,route_id,current_step_index,is_finished,finished_at) VALUES('prog-alpha','r4-alpha','route-1',4,false,NULL),('prog-bravo','r4-bravo','route-2',5,true,now())");

    await expect(pool.query("INSERT INTO round4_winner(team_id,team_name,route_id,final_answer) VALUES('r4-outside','R4 Outside','route-1','answer')"))
      .rejects.toMatchObject({ code: '23514' });
    await expect(pool.query("INSERT INTO round4_winner(team_id,team_name,route_id,final_answer) VALUES('r4-alpha','R4 Alpha','route-2','answer')"))
      .rejects.toMatchObject({ code: '23514' });
    await expect(pool.query("INSERT INTO round4_winner(team_id,team_name,route_id,final_answer) VALUES('r4-alpha','R4 Alpha','route-1','answer')"))
      .rejects.toMatchObject({ code: '23514' });
    await pool.query("INSERT INTO round4_winner(team_id,team_name,route_id,final_answer) VALUES('r4-bravo','R4 Bravo','route-2','answer')");
    expect((await pool.query('SELECT team_id,route_id FROM round4_winner')).rows)
      .toEqual([{ team_id: 'r4-bravo', route_id: 'route-2' }]);
  });

  it('does not grant auction inventory without a reviewed, exact card mapping and ownership', async () => {
    await pool.query("INSERT INTO teams(id,team_name,password_hash,salt) VALUES('mapping-team','Mapping Team','hash','salt')");
    expect((await pool.query("SELECT count(*)::int AS count FROM round3_auction_card_mappings WHERE mapping_status='APPROVED'")).rows[0].count).toBe(0);
    await expect(pool.query("INSERT INTO round3_card_inventory(team_id,card_id,source,auction_power_card_id,auction_ownership_id,quantity) VALUES('mapping-team','spectral-lens','auction','r2-card-3','not-an-owner',1)"))
      .rejects.toMatchObject({ code: '23503' });
    await expect(pool.query("INSERT INTO round3_card_inventory(team_id,card_id,source,quantity) VALUES('mapping-team','spectral-lens','development',-1)"))
      .rejects.toMatchObject({ code: '23514' });
    await expect(pool.query("INSERT INTO round3_card_inventory(team_id,card_id,source,quantity) VALUES('mapping-team','spectral-lens','auction',1)"))
      .rejects.toMatchObject({ code: '23514' });

    await pool.query("INSERT INTO round3_card_inventory(team_id,card_id,source,quantity) VALUES('mapping-team','spectral-lens','development',1)");
    await pool.query("INSERT INTO round3_card_usage(id,team_id,card_id,source,source_event_id,remaining_quantity) VALUES('use-1','mapping-team','spectral-lens','development','card-event-1',0)");
    await expect(pool.query("INSERT INTO round3_card_usage(id,team_id,card_id,source,source_event_id,remaining_quantity) VALUES('use-2','mapping-team','spectral-lens','development','card-event-1',0)"))
      .rejects.toMatchObject({ code: '23505' });
  });

  it('preserves per-team separation for round and hunt state and enforces JSON shapes', async () => {
    await pool.query("INSERT INTO teams(id,team_name,password_hash,salt) VALUES('state-a','State A','hash','salt'),('state-b','State B','hash','salt')");
    await pool.query("UPDATE round3_hunt_state SET state='{\"clue\":true}'::jsonb WHERE team_id='state-a' AND hunt_id=1");
    await pool.query("UPDATE round3_hunt_state SET state='{}'::jsonb WHERE team_id='state-b' AND hunt_id=1");
    expect((await pool.query('SELECT state FROM round3_hunt_state WHERE team_id=$1 AND hunt_id=1', ['state-a'])).rows[0].state)
      .toEqual({ clue: true });
    await pool.query("UPDATE round3_runs SET remaining_ms=900000,version=2 WHERE team_id='state-a'");
    expect((await pool.query('SELECT team_id,remaining_ms,version FROM round3_runs WHERE team_id IN ($1,$2) ORDER BY team_id', ['state-a', 'state-b'])).rows)
      .toEqual([
        { team_id: 'state-a', remaining_ms: '900000', version: '2' },
        { team_id: 'state-b', remaining_ms: '1500000', version: '1' },
      ]);
    expect((await pool.query('SELECT team_id,version FROM round3_sessions WHERE team_id IN ($1,$2) ORDER BY team_id', ['state-a', 'state-b'])).rows)
      .toEqual([{ team_id: 'state-a', version: '1' }, { team_id: 'state-b', version: '1' }]);
    expect((await pool.query('SELECT team_id,hunt_id,version FROM round3_hunt_state WHERE team_id IN ($1,$2) ORDER BY team_id,hunt_id', ['state-a', 'state-b'])).rows)
      .toHaveLength(6);
    await expect(pool.query("INSERT INTO round4_steps(id,route_id,clue_index,floor_id,location_name,target_x,target_y,riddle_text,field_location_hint,accepted_answers) VALUES('step-bad','route-3',1,'floor-1','room',1,2,'riddle','hint','{}'::jsonb)"))
      .rejects.toMatchObject({ code: '23514' });
  });

  it('rolls back all DDL from a failing migration', async () => {
    const { mkdtemp, rm, writeFile } = await import('node:fs/promises');
    const os = await import('node:os');
    const dir = await mkdtemp(path.join(os.tmpdir(), 'frost-pg-bad-migration-'));
    await writeFile(path.join(dir, '008_failure.sql'), 'CREATE TABLE rollback_probe(id integer PRIMARY KEY); INVALID SQL;');
    try {
      await expect(runMigrations(pool, dir)).rejects.toBeTruthy();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
    const exists = await pool.query("SELECT to_regclass('rollback_probe') AS relation");
    expect(exists.rows[0].relation).toBeNull();
  });
});
