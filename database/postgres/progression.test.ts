// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Pool, QueryResult, QueryResultRow } from 'pg';
import {
  ProgressionError, adminProgress, assertHuntAccessible, assertRoundAccessible,
  completeHunt, completeRound, startHunt, startRound,
} from './progression.ts';

type Row = { status: string; eligible_at?: string | null; completed_at?: string | null };
class ProgressionDb {
  admins = new Set(['admin-1']);
  adminSessions = new Map([['admin-session-1', 'admin-1']]);
  teams = new Set(['team-a', 'team-b']);
  rounds = new Map<string, Row>();
  hunts = new Map<string, Row>();
  history: Array<Record<string, unknown>> = [];
  auctionEnabled = false;
  failAudit = false;
  private snapshot: unknown;
  private key(team: string, id: number) { return `${team}:${id}`; }
  constructor() {
    for (const team of this.teams) {
      for (let id = 1; id <= 4; id++) this.rounds.set(this.key(team, id), { status: id === 1 ? 'AVAILABLE' : 'LOCKED', eligible_at: null, completed_at: null });
      for (let id = 1; id <= 3; id++) this.hunts.set(this.key(team, id), { status: 'LOCKED', completed_at: null });
    }
  }
  private copy() { return structuredClone({ rounds: this.rounds, hunts: this.hunts, history: this.history, auctionEnabled: this.auctionEnabled }); }
  readonly client = {
    query: async (sql: string, values: unknown[] = []): Promise<QueryResult<any>> => {
      const q = sql.trim().replace(/\s+/g, ' ').toLowerCase();
      if (q === 'begin') { this.snapshot = this.copy(); return this.result([]); }
      if (q === 'commit') { this.snapshot = undefined; return this.result([]); }
      if (q === 'rollback') {
        if (this.snapshot) Object.assign(this, this.snapshot);
        this.snapshot = undefined;
        return this.result([]);
      }
      if (q.startsWith('select a.id from admin_sessions')) return this.result(this.adminSessions.has(String(values[0])) ? [{ id: this.adminSessions.get(String(values[0]))! }] : []);
      if (q.startsWith('select pg_advisory_xact_lock')) return this.result([{}]);
      if (q.startsWith('select 1 from admins')) return this.result(this.admins.has(String(values[0])) ? [{}] : []);
      if (q.startsWith('select 1 from teams')) return this.result(this.teams.has(String(values[0])) ? [{}] : []);
      if (q.startsWith('select status from round_progress')) return this.result(this.rounds.has(this.key(String(values[0]), Number(values[1]))) ? [{ status: this.rounds.get(this.key(String(values[0]), Number(values[1])))!.status }] : []);
      if (q.startsWith('select status from team_hunt_progress')) return this.result(this.hunts.has(this.key(String(values[0]), Number(values[1]))) ? [{ status: this.hunts.get(this.key(String(values[0]), Number(values[1])))!.status }] : []);
      if (q.startsWith('select round_id, status from round_progress')) return this.result([...this.rounds.entries()].filter(([k]) => k.startsWith(`${values[0]}:`) && Number(k.split(':')[1]) > Number(values[1])).map(([k, v]) => ({ round_id: Number(k.split(':')[1]), status: v.status })));
      if (q.startsWith('select hunt_id, status from team_hunt_progress')) return this.result([...this.hunts.entries()].filter(([k]) => k.startsWith(`${values[0]}:`) && Number(k.split(':')[1]) > Number(values[1])).map(([k, v]) => ({ hunt_id: Number(k.split(':')[1]), status: v.status })));
      if (q.startsWith('select rp.round_id')) return this.result(this.rounds.has(this.key(String(values[0]), Number(values[1]))) ? [{ round_id: values[1], status: this.rounds.get(this.key(String(values[0]), Number(values[1])))!.status }] : []);
      if (q.startsWith('select enabled from round2_auction_config')) return this.result([{ enabled: this.auctionEnabled }]);
      if (q.startsWith('select team_id, status from round_progress')) {
        const target = String(values[0]);
        const others = [...this.rounds.entries()]
          .filter(([k]) => k.endsWith(':2') && !k.startsWith(`${target}:`))
          .map(([k, v]) => ({ team_id: k.split(':')[0], status: v.status }));
        return this.result(others);
      }
      if (q.startsWith('select eligible_at from round_progress')) return this.result([{ eligible_at: this.rounds.get(this.key(String(values[0]), Number(values[1])))?.eligible_at ?? null }]);
      if (q.startsWith('select status from round_progress')) return this.result([{ status: this.rounds.get(this.key(String(values[0]), Number(values[1])))?.status }].filter((r) => r.status));
      if (q.startsWith('select count(*) from team_hunt_progress')) return this.result([{ count: [...this.hunts.entries()].filter(([k, v]) => k.startsWith(`${values[0]}:`) && v.status === 'COMPLETED').length }]);
      if (q.startsWith('select h.status')) {
        const hunt = this.hunts.get(this.key(String(values[0]), Number(values[1])));
        const round = this.rounds.get(this.key(String(values[0]), 3));
        return this.result(hunt && round ? [{ status: hunt.status, round_status: round.status }] : []);
      }
      if (q.startsWith('update round_progress set eligible_at=null')) {
        const row = this.rounds.get(this.key(String(values[0]), Number(values[1])));
        if (row) row.eligible_at = null;
        return this.result([]);
      }
      if (q.startsWith('update round_progress set status=$3, eligible_at')) {
        const row = this.rounds.get(this.key(String(values[0]), Number(values[1])));
        if (row) {
          row.status = String(values[2]);
          row.eligible_at ??= 'eligible';
          if (Number(values[1]) === 2 && row.status === 'AVAILABLE') {
            this.auctionEnabled = true;
          }
        }
        return this.result([]);
      }
      if (q.startsWith('update round_progress set eligible_at')) {
        const row = this.rounds.get(this.key(String(values[0]), Number(values[1])));
        if (row) row.eligible_at ??= 'eligible';
        return this.result([]);
      }
      if (q.startsWith('update round_progress set status=')) {
        const row = this.rounds.get(this.key(String(values[0]), Number(values[1])));
        if (row) {
          row.status = String(values[2]);
          if (values[3] === true) row.completed_at ??= 'completed';
          if (values[3] === false) row.completed_at = null;
          if (Number(values[1]) === 2 && (row.status === 'AVAILABLE' || row.status === 'IN_PROGRESS')) {
            this.auctionEnabled = true;
          }
        }
        return this.result([]);
      }
      if (q.startsWith('update rounds set')) return this.result([]);
      if (q.startsWith('update round2_auction_config set')) return this.result([]);
      if (q.startsWith("update round_progress set status='available'")) {
        const row = this.rounds.get(this.key(String(values[0]), 2));
        if (row) { row.status = 'AVAILABLE'; row.eligible_at ??= 'eligible'; }
        return this.result([]);
      }
      if (q.startsWith('update team_hunt_progress set status=')) {
        const row = this.hunts.get(this.key(String(values[0]), Number(values[1])));
        if (row) { row.status = String(values[2]); if (values[3] === true) row.completed_at ??= 'completed'; if (values[3] === false) row.completed_at = null; }
        return this.result([]);
      }
      if (q.startsWith("update round_progress set status='locked'")) {
        const row = this.rounds.get(this.key(String(values[0]), Number(values[1])));
        if (row) { row.status = 'LOCKED'; row.eligible_at = null; row.completed_at = null; }
        return this.result([]);
      }
      if (q.startsWith("update team_hunt_progress set status='locked'")) {
        const row = this.hunts.get(this.key(String(values[0]), Number(values[1])));
        if (row) { row.status = 'LOCKED'; row.completed_at = null; }
        return this.result([]);
      }
      if (q.startsWith('insert into progression_audit_history')) {
        if (this.failAudit) throw new Error('audit insert failed');
        this.history.push({ actor: values[0], adminId: values[1], teamId: values[2], entity: values[3], id: values[4], previous: values[5], next: values[6], action: values[7], reason: values[8] });
        return this.result([]);
      }
      throw new Error(`Unexpected SQL in progression test: ${sql}`);
    },
    release: () => undefined,
  };
  readonly pool = {
    connect: async () => this.client,
    query: this.client.query,
  } as unknown as Pool;
  private result<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
    return { rows, rowCount: rows.length, command: '', oid: 0, fields: [] };
  }
}

const expectCode = async (promise: Promise<unknown>, code: ProgressionError['code']) => {
  await expect(promise).rejects.toMatchObject({ code });
};

describe('PostgreSQL progression service transaction contract', () => {
  it('keeps progression independent for two teams', async () => {
    const db = new ProgressionDb();
    await startRound(db.pool, 'team-a', 1);
    await expect(assertRoundAccessible(db.pool, 'team-a', 1)).resolves.toBeUndefined();
    await expectCode(assertRoundAccessible(db.pool, 'team-b', 2), 'LOCKED');
  });

  it('records Round 2 eligibility while its auction remains disabled', async () => {
    const db = new ProgressionDb();
    await startRound(db.pool, 'team-a', 1);
    await completeRound(db.pool, 'team-a', 1);
    expect(db.rounds.get('team-a:2')).toMatchObject({ status: 'LOCKED', eligible_at: 'eligible' });
    await expectCode(startRound(db.pool, 'team-a', 2), 'LOCKED');
  });

  it('keeps Round 2 inaccessible after a team unlock until the auction is enabled', async () => {
    const db = new ProgressionDb();
    await startRound(db.pool, 'team-a', 1);
    await completeRound(db.pool, 'team-a', 1);
    await adminProgress(db.pool, 'admin-session-1', 'team-a', 'ROUND', 2, 'unlock');
    await expectCode(assertRoundAccessible(db.pool, 'team-a', 2), 'LOCKED');
    await expectCode(startRound(db.pool, 'team-a', 2), 'LOCKED');
    expect(db.rounds.get('team-a:2')?.status).toBe('AVAILABLE');

    db.auctionEnabled = true;
    await expect(assertRoundAccessible(db.pool, 'team-a', 2)).resolves.toBeUndefined();
    await startRound(db.pool, 'team-a', 2);
    expect(db.rounds.get('team-a:2')?.status).toBe('IN_PROGRESS');
  });

  it('requires an existing admin before a manual unlock', async () => {
    const db = new ProgressionDb();
    await expectCode(adminProgress(db.pool, 'admin-1', 'team-a', 'ROUND', 2, 'unlock'), 'FORBIDDEN');
  });

  it('requires admin unlock and explicit auction activation before Round 2 access', async () => {
    const db = new ProgressionDb();
    await startRound(db.pool, 'team-a', 1);
    await completeRound(db.pool, 'team-a', 1);
    await expectCode(assertRoundAccessible(db.pool, 'team-a', 2), 'LOCKED');
    await adminProgress(db.pool, 'admin-session-1', 'team-a', 'ROUND', 2, 'unlock', 'Round 1 verified');
    await expectCode(assertRoundAccessible(db.pool, 'team-a', 2), 'LOCKED');
    db.auctionEnabled = true;
    await expect(assertRoundAccessible(db.pool, 'team-a', 2)).resolves.toBeUndefined();
  });

  it('keeps Round 2 locked until auction activation, then advances Round 3 and Round 4 automatically', async () => {
    const db = new ProgressionDb();
    await startRound(db.pool, 'team-a', 1);
    await completeRound(db.pool, 'team-a', 1);
    await adminProgress(db.pool, 'admin-session-1', 'team-a', 'ROUND', 2, 'unlock');
    db.auctionEnabled = true;
    await startRound(db.pool, 'team-a', 2);
    await completeRound(db.pool, 'team-a', 2);
    expect(db.rounds.get('team-a:3')).toMatchObject({ status: 'AVAILABLE', eligible_at: 'eligible' });
    await startRound(db.pool, 'team-a', 3);
    await expect(assertHuntAccessible(db.pool, 'team-a', 1)).resolves.toBeUndefined();
    await expectCode(startHunt(db.pool, 'team-a', 2), 'LOCKED');
    await startHunt(db.pool, 'team-a', 1);
    await completeHunt(db.pool, 'team-a', 1);
    await startHunt(db.pool, 'team-a', 2);
    await completeHunt(db.pool, 'team-a', 2);
    await startHunt(db.pool, 'team-a', 3);
    await completeHunt(db.pool, 'team-a', 3);
    await expect(assertHuntAccessible(db.pool, 'team-a', 3)).resolves.toBeUndefined();
  });

  it('rejects direct Hunt III bypass and Round 3 completion before all hunts', async () => {
    const db = new ProgressionDb();
    await expectCode(startHunt(db.pool, 'team-a', 3), 'LOCKED');
    await startRound(db.pool, 'team-a', 1);
    await completeRound(db.pool, 'team-a', 1);
    await adminProgress(db.pool, 'admin-session-1', 'team-a', 'ROUND', 2, 'unlock');
    db.auctionEnabled = true;
    await startRound(db.pool, 'team-a', 2);
    await completeRound(db.pool, 'team-a', 2);
    await startRound(db.pool, 'team-a', 3);
    await expectCode(completeRound(db.pool, 'team-a', 3), 'CONFLICT');
  });

  it('does not create duplicate completion history for repeated completion calls', async () => {
    const db = new ProgressionDb();
    await startRound(db.pool, 'team-a', 1);
    await completeRound(db.pool, 'team-a', 1);
    const historyCount = db.history.length;
    await completeRound(db.pool, 'team-a', 1);
    expect(db.history).toHaveLength(historyCount);
  });

  it('writes administrator, prior/new state, action, timestamped row, and reason for manual transitions', async () => {
    const db = new ProgressionDb();
    await startRound(db.pool, 'team-a', 1);
    await completeRound(db.pool, 'team-a', 1);
    await adminProgress(db.pool, 'admin-session-1', 'team-a', 'ROUND', 2, 'advance', 'Approved by event lead');
    expect(db.history.at(-1)).toMatchObject({ actor: 'ADMIN', adminId: 'admin-1', teamId: 'team-a', previous: 'LOCKED', next: 'AVAILABLE', action: 'ADVANCE', reason: 'Approved by event lead' });
  });

  it('preserves completion history when progression is reset', async () => {
    const db = new ProgressionDb();
    await startRound(db.pool, 'team-a', 1);
    await completeRound(db.pool, 'team-a', 1);
    const before = db.history.length;
    await adminProgress(db.pool, 'admin-session-1', 'team-a', 'ROUND', 1, 'reset', 'Replay requested');
    expect(db.rounds.get('team-a:1')?.status).toBe('LOCKED');
    expect(db.history.length).toBe(before + 1);
    expect(db.history.at(-1)).toMatchObject({ action: 'RESET', previous: 'COMPLETED', next: 'LOCKED' });
  });

  it('rolls back state and audit data when a transaction fails', async () => {
    const db = new ProgressionDb();
    db.failAudit = true;
    await expect(startRound(db.pool, 'team-a', 1)).rejects.toThrow('audit insert failed');
    expect(db.rounds.get('team-a:1')?.status).toBe('AVAILABLE');
    expect(db.history).toHaveLength(0);
  });
});
