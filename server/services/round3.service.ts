import * as crypto from 'node:crypto';
import { db } from '../../database/db.ts';
import { ROUND3_CARD_CATALOG, ROUND3_DEVELOPMENT_SAMPLE_INVENTORY, type Round3CardId } from '../../src/constants/round3.cards.ts';
import type { Round3Timeline } from '../../src/types/round3.types.ts';

export interface Round3InventoryProvider {
  getInventory(teamId: string): Array<{ cardId: Round3CardId; quantity: number; source: 'auction' | 'development' }>;
  activateCard(teamId: string, cardId: Round3CardId, consumption: 'consume-one' | 'retained', requestedSource?: 'auction' | 'development'): { source: 'auction' | 'development'; remainingQuantity: number } | null;
}

export const round3CardCatalog = ROUND3_CARD_CATALOG;

const RUN_DURATION_MS = 25 * 60 * 1000;

db.exec(`
  CREATE TABLE IF NOT EXISTS round3_sessions (
    team_id TEXT PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
    current_hunt TEXT NOT NULL DEFAULT 'paradox-hunt',
    player_progress_json TEXT NOT NULL DEFAULT '{}',
    past_state_json TEXT NOT NULL DEFAULT '{}',
    future_state_json TEXT NOT NULL DEFAULT '{}',
    active_timeline TEXT NOT NULL DEFAULT 'past' CHECK (active_timeline IN ('past', 'future')),
    evidence_json TEXT NOT NULL DEFAULT '[]',
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
    is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS round3_inventory (
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('auction', 'development')),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    PRIMARY KEY (team_id, card_id, source)
  );
  CREATE TABLE IF NOT EXISTS round3_card_usage (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('auction', 'development')),
    used_at TEXT NOT NULL,
    remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0)
  );
  CREATE INDEX IF NOT EXISTS idx_round3_card_usage_team ON round3_card_usage(team_id, used_at);
`);

// Separate run state keeps the timer migration safe for databases that already have round3_sessions.
db.exec(`
  CREATE TABLE IF NOT EXISTS round3_runs (
    team_id TEXT PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started','running','paused','completed','expired')),
    remaining_ms INTEGER NOT NULL DEFAULT ${RUN_DURATION_MS} CHECK(remaining_ms BETWEEN 0 AND ${RUN_DURATION_MS}),
    started_at TEXT,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS round3_cooperation_ledger (
    event_id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK(points > 0),
    awarded_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_round3_cooperation_team ON round3_cooperation_ledger(team_id);
`);

const cardIds = new Set<string>(ROUND3_CARD_CATALOG.map((card) => card.id));
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export class DatabaseRound3InventoryProvider implements Round3InventoryProvider {
  getInventory(teamId: string) {
    return db.prepare(`
      SELECT card_id AS cardId, quantity, source FROM round3_inventory
      WHERE team_id = ? AND quantity > 0 ORDER BY card_id, source
    `).all(teamId) as Array<{ cardId: Round3CardId; quantity: number; source: 'auction' | 'development' }>;
  }

  activateCard(teamId: string, cardId: Round3CardId, consumption: 'consume-one' | 'retained', requestedSource?: 'auction' | 'development') {
    const row = requestedSource
      ? db.prepare('SELECT source, quantity FROM round3_inventory WHERE team_id = ? AND card_id = ? AND source = ? AND quantity > 0').get(teamId, cardId, requestedSource) as { source: 'auction' | 'development'; quantity: number } | undefined
      : db.prepare(`SELECT source, quantity FROM round3_inventory WHERE team_id = ? AND card_id = ? AND quantity > 0 ORDER BY CASE source WHEN 'auction' THEN 0 ELSE 1 END LIMIT 1`).get(teamId, cardId) as { source: 'auction' | 'development'; quantity: number } | undefined;
    if (!row) return null;
    const remainingQuantity = consumption === 'consume-one' ? row.quantity - 1 : row.quantity;
    if (consumption === 'consume-one') {
      const result = db.prepare('UPDATE round3_inventory SET quantity = ? WHERE team_id = ? AND card_id = ? AND source = ? AND quantity > 0').run(remainingQuantity, teamId, cardId, row.source);
      if (Number(result.changes) !== 1) return null;
    }
    return { source: row.source, remainingQuantity };
  }
}

export let round3InventoryProvider: Round3InventoryProvider = new DatabaseRound3InventoryProvider();
export function configureRound3InventoryProvider(provider: Round3InventoryProvider) {
  round3InventoryProvider = provider;
}

export function ensureRound3Session(team: { id: string; teamName: string }) {
  const now = new Date().toISOString();
  db.prepare(`INSERT OR IGNORE INTO round3_sessions (team_id, created_at, updated_at) VALUES (?, ?, ?)`).run(team.id, now, now);
  db.prepare(`INSERT OR IGNORE INTO round3_runs (team_id, updated_at) VALUES (?, ?)`).run(team.id, now);
  return getRound3State(team);
}

export function getRound3State(team: { id: string; teamName: string }) {
  const run = getRound3Run(team.id);
  const row = db.prepare('SELECT * FROM round3_sessions WHERE team_id = ?').get(team.id) as {
    team_id: string; current_hunt: string; player_progress_json: string; past_state_json: string;
    future_state_json: string; active_timeline: Round3Timeline; evidence_json: string; score: number;
    is_completed: number; completed_at: string | null; updated_at: string;
  } | undefined;
  if (!row) return null;
  const playerProgress = JSON.parse(row.player_progress_json) as Record<string, unknown>;
  const savedEngine = isRecord(playerProgress.engine) ? playerProgress.engine : null;
  const savedScore = getRound3OfficialScore(team.id);
  if (savedEngine) playerProgress.engine = { ...savedEngine, score: savedScore };
  const usage = db.prepare(`
    SELECT card_id AS cardId, used_at AS usedAt, remaining_quantity AS remainingQuantity
    FROM round3_card_usage WHERE team_id = ? ORDER BY used_at DESC
  `).all(team.id) as Array<{ cardId: Round3CardId; usedAt: string; remainingQuantity: number }>;
  return {
    success: true as const,
    session: {
      teamId: row.team_id, teamName: team.teamName, currentHunt: row.current_hunt,
      playerProgress,
      timelines: { past: JSON.parse(row.past_state_json) as Record<string, unknown>, future: JSON.parse(row.future_state_json) as Record<string, unknown> },
      activeTimeline: row.active_timeline, evidenceDiscoveries: JSON.parse(row.evidence_json) as string[],
      cardUsage: usage, score: savedScore, completed: row.is_completed === 1,
      completedAt: row.completed_at, updatedAt: row.updated_at,
      run,
    },
    inventory: round3InventoryProvider.getInventory(team.id),
    cards: round3CardCatalog,
  };
}

type RunRow = { status: 'not_started'|'running'|'paused'|'completed'|'expired'; remaining_ms: number; started_at: string|null; updated_at: string };
function runRow(teamId: string): RunRow | undefined { return db.prepare('SELECT status, remaining_ms, started_at, updated_at FROM round3_runs WHERE team_id = ?').get(teamId) as RunRow|undefined; }
export function getRound3Run(teamId: string) {
  const row = runRow(teamId);
  if (!row) return null;
  let remainingMs = row.remaining_ms;
  let status = row.status;
  if (status === 'running' && row.started_at) remainingMs = Math.max(0, row.remaining_ms - (Date.now() - Date.parse(row.started_at)));
  if (status === 'running' && remainingMs === 0) {
    const now = new Date().toISOString();
    db.prepare("UPDATE round3_runs SET status='expired', remaining_ms=0, started_at=NULL, updated_at=? WHERE team_id=? AND status='running'").run(now, teamId);
    db.prepare('UPDATE round3_sessions SET is_completed=1, completed_at=COALESCE(completed_at,?), updated_at=? WHERE team_id=?').run(now, now, teamId);
    status = 'expired';
  }
  return { status, remainingMs, remainingSeconds: Math.ceil(remainingMs / 1000), startedAt: row.started_at, updatedAt: row.updated_at };
}
export function startRound3Run(teamId: string) {
  const row = runRow(teamId); if (!row) return null;
  getRound3Run(teamId);
  if (row.status !== 'not_started') return getRound3Run(teamId);
  const now = new Date().toISOString();
  db.prepare("UPDATE round3_runs SET status='running', started_at=?, updated_at=? WHERE team_id=? AND status='not_started'").run(now, now, teamId);
  return getRound3Run(teamId);
}
export function pauseRound3Run(teamId: string) {
  const run = getRound3Run(teamId); if (!run || run.status !== 'running') return run;
  const now = new Date().toISOString();
  db.prepare("UPDATE round3_runs SET status='paused', remaining_ms=?, started_at=NULL, updated_at=? WHERE team_id=? AND status='running'").run(run.remainingMs, now, teamId);
  return getRound3Run(teamId);
}
export function resumeRound3Run(teamId: string) {
  const run = getRound3Run(teamId); if (!run || run.status !== 'paused') return run;
  const now = new Date().toISOString();
  db.prepare("UPDATE round3_runs SET status='running', started_at=?, updated_at=? WHERE team_id=? AND status='paused'").run(now, now, teamId);
  return getRound3Run(teamId);
}
export function round3GameplayAllowed(teamId: string): boolean {
  let run = getRound3Run(teamId);
  // The first validated hunt action is the gameplay boundary for clients that do not call /run/start.
  if (run?.status === 'not_started') run = startRound3Run(teamId);
  return !!run && run.status === 'running' && run.remainingMs > 0;
}
export function getRound3OfficialScore(teamId: string): number {
  const hunt1 = db.prepare('SELECT state_json FROM round3_hunt1_sessions WHERE team_id=?').get(teamId) as {state_json:string}|undefined;
  const hunt2 = db.prepare('SELECT state_json FROM round3_hunt2_sessions WHERE team_id=?').get(teamId) as {state_json:string}|undefined;
  const hunt3 = db.prepare('SELECT state_json FROM round3_hunt3_sessions WHERE team_id=?').get(teamId) as {state_json:string}|undefined;
  const coop = db.prepare('SELECT COALESCE(SUM(points),0) AS total FROM round3_cooperation_ledger WHERE team_id=?').get(teamId) as {total:number};
  const s1 = hunt1 ? Number((JSON.parse(hunt1.state_json) as {score?:unknown}).score) || 0 : 0;
  const s2 = hunt2 ? Number((JSON.parse(hunt2.state_json) as {score?:unknown}).score) || 0 : 0;
  const s3 = hunt3 ? Number((JSON.parse(hunt3.state_json) as {score?:unknown}).score) || 0 : 0;
  return Math.max(0, s1) + Math.max(0, s2) + Math.max(0, s3) + coop.total;
}
export function awardRound3CooperationEvent(teamId: string, eventId: string, points: number) {
  if (!/^[a-zA-Z0-9:_-]{1,120}$/.test(eventId) || !Number.isSafeInteger(points) || points <= 0) return false;
  const insert = db.prepare('INSERT OR IGNORE INTO round3_cooperation_ledger(event_id,team_id,points,awarded_at) VALUES(?,?,?,?)');
  db.exec('BEGIN IMMEDIATE');
  try {
    const total = (db.prepare('SELECT COALESCE(SUM(points),0) AS total FROM round3_cooperation_ledger WHERE team_id=?').get(teamId) as {total:number}).total;
    if (total >= 200) { db.exec('COMMIT'); return false; }
    const awarded = Number(insert.run(eventId, teamId, Math.min(points,200-total), new Date().toISOString()).changes) === 1;
    db.exec('COMMIT');
    return awarded;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function updateRound3Progress(teamId: string, input: unknown): boolean {
  if (!isRecord(input)) return false;
  const progress = input.playerProgress;
  const timeline = input.activeTimeline;
  const timelines = input.timelines;
  const discoveries = input.evidenceDiscoveries;
  const currentHunt = input.currentHunt;
  if (progress !== undefined && !isRecord(progress)) return false;
  if (timeline !== undefined && timeline !== 'past' && timeline !== 'future') return false;
  if (timelines !== undefined && (!isRecord(timelines) || (timelines.past !== undefined && !isRecord(timelines.past)) || (timelines.future !== undefined && !isRecord(timelines.future)))) return false;
  if (discoveries !== undefined && (!Array.isArray(discoveries) || discoveries.length > 200 || discoveries.some((id) => typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)))) return false;
  if (currentHunt !== undefined && (typeof currentHunt !== 'string' || !/^paradox-hunt(?:-[1-3])?$/.test(currentHunt))) return false;
  if (JSON.stringify(input).length > 32_000) return false;
  const existing = db.prepare('SELECT * FROM round3_sessions WHERE team_id = ?').get(teamId) as {
    current_hunt: string; player_progress_json: string; past_state_json: string; future_state_json: string; active_timeline: Round3Timeline; evidence_json: string;
  } | undefined;
  if (!existing) return false;
  const now = new Date().toISOString();
  const evidence = new Set(JSON.parse(existing.evidence_json) as string[]);
  if (Array.isArray(discoveries)) for (const id of discoveries as string[]) evidence.add(id);
  const safeProgress = progress ? { ...progress } : JSON.parse(existing.player_progress_json) as Record<string, unknown>;
  if (isRecord(safeProgress.engine)) safeProgress.engine = { ...safeProgress.engine, score: getRound3OfficialScore(teamId) };
  db.prepare(`UPDATE round3_sessions SET current_hunt = ?, player_progress_json = ?, past_state_json = ?, future_state_json = ?, active_timeline = ?, evidence_json = ?, updated_at = ? WHERE team_id = ?`)
    .run(currentHunt ?? existing.current_hunt,
      JSON.stringify(safeProgress),
      JSON.stringify(timelines && isRecord(timelines.past) ? timelines.past : JSON.parse(existing.past_state_json)),
      JSON.stringify(timelines && isRecord(timelines.future) ? timelines.future : JSON.parse(existing.future_state_json)),
      timeline ?? existing.active_timeline, JSON.stringify([...evidence]), now, teamId);
  return true;
}

export function discoverRound3Evidence(teamId: string, evidenceId: unknown): string[] | null {
  if (!round3GameplayAllowed(teamId)) return null;
  if (typeof evidenceId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(evidenceId)) return null;
  const row = db.prepare('SELECT evidence_json FROM round3_sessions WHERE team_id = ?').get(teamId) as { evidence_json: string } | undefined;
  if (!row) return null;
  const evidence = JSON.parse(row.evidence_json) as string[];
  if (!evidence.includes(evidenceId)) evidence.push(evidenceId);
  db.prepare('UPDATE round3_sessions SET evidence_json = ?, updated_at = ? WHERE team_id = ?').run(JSON.stringify(evidence), new Date().toISOString(), teamId);
  return evidence;
}

export function activateRound3Card(teamId: string, cardId: string, requestedSource?: unknown) {
  if (!round3GameplayAllowed(teamId)) return { error: 'Round 3 gameplay is not active.' };
  if (!cardIds.has(cardId)) return { error: 'Unknown Round 3 card.' };
  if (requestedSource !== undefined && requestedSource !== 'auction' && requestedSource !== 'development') return { error: 'Invalid inventory source.' };
  const definition = ROUND3_CARD_CATALOG.find((card) => card.id === cardId);
  if (!definition) return { error: 'Unknown Round 3 card.' };
  const activation = round3InventoryProvider.activateCard(teamId, definition.id, definition.consumption, requestedSource as 'auction' | 'development' | undefined);
  if (!activation) return { error: 'This team does not own that card or has no charges remaining.' };
  const now = new Date().toISOString();
  db.prepare('INSERT INTO round3_card_usage (id, team_id, card_id, source, used_at, remaining_quantity) VALUES (?, ?, ?, ?, ?, ?)')
    .run(`r3use-${crypto.randomUUID()}`, teamId, cardId, activation.source, now, activation.remainingQuantity);
  db.prepare('UPDATE round3_sessions SET updated_at = ? WHERE team_id = ?').run(now, teamId);
  return { cardId, source: activation.source, remainingQuantity: activation.remainingQuantity, consumption: definition.consumption };
}

export function completeRound3Hunt(teamId: string) {
  if (!round3GameplayAllowed(teamId)) return null;
  const finale = db.prepare('SELECT state_json FROM round3_hunt3_sessions WHERE team_id=?').get(teamId) as { state_json: string } | undefined;
  const hunt2Session = db.prepare('SELECT 1 AS present FROM round3_hunt2_sessions WHERE team_id=?').get(teamId);
  // Preserve the legacy API-only session path; real Hunt II runs must finish the server-authoritative finale.
  if ((finale && (JSON.parse(finale.state_json) as { completed?: unknown }).completed !== true) || (hunt2Session && !finale)) return null;
  const now = new Date().toISOString();
  db.prepare('UPDATE round3_sessions SET is_completed = 1, completed_at = COALESCE(completed_at, ?), updated_at = ? WHERE team_id = ?').run(now, now, teamId);
  db.prepare("UPDATE round3_runs SET status='completed', started_at=NULL, updated_at=? WHERE team_id=?").run(now, teamId);
  return db.prepare('SELECT is_completed, completed_at FROM round3_sessions WHERE team_id = ?').get(teamId) as { is_completed: number; completed_at: string | null } | undefined;
}

export function loadRound3DevelopmentSample(teamId: string, enabled: boolean) {
  if (!enabled) return false;
  const now = new Date().toISOString();
  const insert = db.prepare(`INSERT INTO round3_inventory (team_id, card_id, source, quantity) VALUES (?, ?, 'development', ?) ON CONFLICT(team_id, card_id, source) DO UPDATE SET quantity = excluded.quantity`);
  db.exec('BEGIN TRANSACTION');
  try {
    for (const item of ROUND3_DEVELOPMENT_SAMPLE_INVENTORY) insert.run(teamId, item.cardId, item.quantity);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  db.prepare('UPDATE round3_sessions SET updated_at = ? WHERE team_id = ?').run(now, teamId);
  return true;
}
