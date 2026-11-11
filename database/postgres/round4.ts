import { createHash, randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { completeRoundInTransaction } from './progression.ts';
import { withPostgresTransaction } from './transaction.ts';

export class Round4Error extends Error {
  readonly code: 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'INVALID' | 'UNRELEASED';
  constructor(message: string, code: 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'INVALID' | 'UNRELEASED') {
    super(message);
    this.code = code;
    this.name = 'Round4Error';
  }
}

type Winner = { teamId: string; teamName: string; routeId: string; solvedAt: Date };
type ActionResult = { status: number; body: Record<string, unknown>; duplicate?: boolean };

function requestKey(value: unknown, fallback: string): string {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string' || value.length > 128 || !/^[\w:.-]+$/.test(value)) {
    throw new Round4Error('requestId must be a unique string of at most 128 letters, numbers or -_:. characters.', 'INVALID');
  }
  return value;
}

function fingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function requireReleased(client: PoolClient): Promise<void> {
  const result = await client.query<{ is_released: boolean }>('SELECT is_released FROM round4_settings WHERE id=1');
  if (!result.rows[0]?.is_released) throw new Round4Error('Round 04 has not been released by the event administrators.', 'UNRELEASED');
}

async function findReplay(client: PoolClient, teamId: string, sourceEventId: string, actionFingerprint: string): Promise<ActionResult | null> {
  const result = await client.query<{ details: { fingerprint?: string; status?: number; response?: Record<string, unknown> } }>(
    'SELECT details FROM activity_history WHERE team_id=$1 AND source_event_id=$2', [teamId, sourceEventId],
  );
  if (!result.rowCount) return null;
  const saved = result.rows[0].details;
  if (saved.fingerprint !== actionFingerprint || !saved.response || typeof saved.status !== 'number') {
    throw new Round4Error('requestId was already used for a different Round 4 action.', 'CONFLICT');
  }
  return { status: saved.status, body: saved.response, duplicate: true };
}

async function saveAction(client: PoolClient, teamId: string, action: string, sourceEventId: string,
  actionFingerprint: string, result: ActionResult): Promise<void> {
  await client.query(`INSERT INTO activity_history(id,team_id,action,details,source_event_id)
    VALUES($1,$2,$3,$4::jsonb,$5)`, [`r4-event-${randomUUID()}`, teamId, action,
    JSON.stringify({ fingerprint: actionFingerprint, status: result.status, response: result.body }), sourceEventId]);
}

export async function getRound4ReleaseState(pool: Pool): Promise<boolean> {
  const result = await pool.query<{ is_released: boolean }>('SELECT is_released FROM round4_settings WHERE id=1');
  if (!result.rowCount) throw new Round4Error('Round 4 settings are unavailable.', 'NOT_FOUND');
  return result.rows[0].is_released;
}

export async function getRound4Status(pool: Pool, teamId: string) {
  const [released, qualification, winner] = await Promise.all([
    getRound4ReleaseState(pool),
    pool.query<{ route_id: string; route_number: number; roman_numeral: string; route_name: string }>(`
      SELECT q.route_id,r.route_number,r.roman_numeral,r.route_name FROM round4_qualified_teams q
      JOIN round4_routes r ON r.id=q.route_id WHERE q.team_id=$1`, [teamId]),
    getRound4Winner(pool),
  ]);
  const qual = qualification.rows[0];
  if (!qual) return {
    success: true, qualified: false, isReleased: released, assignedRouteId: null, winner: winner ?? null,
    message: 'Your squad has not been qualified for Round 04 (The Campus Expedition). Only seven qualified squads may enter.',
  };
  return {
    success: true, qualified: true, isReleased: released, assignedRouteId: qual.route_id,
    routeNumber: qual.route_number, romanNumeral: qual.roman_numeral, routeName: qual.route_name, winner: winner ?? null,
  };
}

export async function getRound4Winner(pool: Pool): Promise<Winner | null> {
  const result = await pool.query<Winner>(`SELECT w.team_id AS "teamId",w.team_name AS "teamName",
    w.route_id AS "routeId",w.solved_at AS "solvedAt" FROM round4_winner w WHERE singleton_id=1`);
  return result.rows[0] ?? null;
}

export async function getRound4TeamRoute(pool: Pool, teamId: string) {
  const qual = await pool.query<{ route_id: string; route_number: number; roman_numeral: string; route_name: string; route_subtitle: string }>(`
    SELECT q.route_id,r.route_number,r.roman_numeral,r.route_name,r.route_subtitle
    FROM round4_qualified_teams q JOIN round4_routes r ON r.id=q.route_id WHERE q.team_id=$1`, [teamId]);
  const assignment = qual.rows[0];
  if (!assignment) throw new Round4Error('Access Denied: Your squad is not among the seven qualified teams for Round 04.', 'FORBIDDEN');
  const progressResult = await pool.query<{ current_step_index: number; target_discovered: boolean; solved_steps: string[]; common_room_arrived: boolean; is_finished: boolean; finished_at: Date | null }>(
    'SELECT current_step_index,target_discovered,solved_steps,common_room_arrived,is_finished,finished_at FROM round4_team_progress WHERE team_id=$1 AND route_id=$2',
    [teamId, assignment.route_id],
  );
  const progress = progressResult.rows[0];
  if (!progress) throw new Round4Error('Round 04 progress is not initialized for this team.', 'FORBIDDEN');

  const [stepsResult, settingsResult, winner] = await Promise.all([
    pool.query<{ id: string; clue_index: number; floor_id: string; location_name: string; target_x: number; target_y: number; trigger_radius: number; riddle_text: string; field_location_hint: string; is_common_final: boolean }>(
      'SELECT id,clue_index,floor_id,location_name,target_x,target_y,trigger_radius,riddle_text,field_location_hint,is_common_final FROM round4_steps WHERE route_id=$1 ORDER BY clue_index', [assignment.route_id]),
    pool.query<{ common_final_floor_id: string; common_final_room_name: string; common_final_x: number; common_final_y: number; common_final_radius: number; physical_entry_instructions: string }>(
      'SELECT common_final_floor_id,common_final_room_name,common_final_x,common_final_y,common_final_radius,physical_entry_instructions FROM round4_settings WHERE id=1'),
    getRound4Winner(pool),
  ]);
  const settings = settingsResult.rows[0];
  if (!settings) throw new Round4Error('Round 4 settings are unavailable.', 'NOT_FOUND');
  const active = stepsResult.rows[progress.current_step_index] ?? null;
  const finalStep = active?.is_common_final === true || active?.clue_index === 5;
  const activeStep = active ? {
    stepId: active.id,
    clueIndex: active.clue_index,
    floorId: finalStep ? settings.common_final_floor_id : active.floor_id,
    locationName: finalStep ? settings.common_final_room_name : active.location_name,
    targetPoint: finalStep ? { x: settings.common_final_x, y: settings.common_final_y } : { x: active.target_x, y: active.target_y },
    triggerRadius: finalStep ? settings.common_final_radius : active.trigger_radius,
    riddle: progress.target_discovered ? active.riddle_text : '',
    fieldLocationHint: progress.target_discovered ? active.field_location_hint : '',
    isCommonFinal: finalStep,
    physicalEntryInstructions: finalStep ? settings.physical_entry_instructions : undefined,
  } : null;
  return {
    success: true,
    route: { routeId: assignment.route_id, routeNumber: assignment.route_number, romanNumeral: assignment.roman_numeral,
      routeName: assignment.route_name, routeSubtitle: assignment.route_subtitle },
    progress: { currentStepIndex: progress.current_step_index, targetDiscovered: progress.target_discovered,
      solvedStepIds: progress.solved_steps, commonRoomArrived: progress.common_room_arrived,
      isFinished: progress.is_finished, finishedAt: progress.finished_at },
    activeStep, totalSteps: stepsResult.rowCount, winner: winner ?? null, isWinner: winner?.teamId === teamId,
  };
}

export async function discoverRound4Target(pool: Pool, teamId: string, requestedId?: unknown): Promise<ActionResult> {
  return withPostgresTransaction(pool, async (client) => {
    await requireReleased(client);
    const progressResult = await client.query<{ route_id: string; current_step_index: number; version: string }>(
      'SELECT route_id,current_step_index,version FROM round4_team_progress WHERE team_id=$1 FOR UPDATE', [teamId]);
    const progress = progressResult.rows[0];
    if (!progress) throw new Round4Error('Squad progress not initialized.', 'FORBIDDEN');
    const step = await client.query<{ id: string; clue_index: number; riddle_text: string; field_location_hint: string; is_common_final: boolean }>(
      'SELECT id,clue_index,riddle_text,field_location_hint,is_common_final FROM round4_steps WHERE route_id=$1 AND clue_index=$2',
      [progress.route_id, progress.current_step_index + 1]);
    const active = step.rows[0];
    if (!active) throw new Round4Error('The active Round 4 clue is unavailable.', 'CONFLICT');
    const key = requestKey(requestedId, `auto-${active.id}`);
    const eventId = `round4:discover:${key}`;
    const fp = fingerprint({ action: 'discover', stepId: active.id });
    const replay = await findReplay(client, teamId, eventId, fp);
    if (replay) return replay;
    const final = active.is_common_final || active.clue_index === 5;
    await client.query(`UPDATE round4_team_progress SET target_discovered=true,
      common_room_arrived=common_room_arrived OR $2,version=version+1,updated_at=clock_timestamp()
      WHERE team_id=$1`, [teamId, final]);
    const response: ActionResult = { status: 200, body: { success: true, targetDiscovered: true,
      commonRoomArrived: final, riddle: active.riddle_text, fieldLocationHint: active.field_location_hint } };
    await saveAction(client, teamId, 'ROUND4_TARGET_DISCOVERED', eventId, fp, response);
    return response;
  });
}

export async function submitRound4Clue(pool: Pool, teamId: string, stepId: unknown, answer: unknown, requestedId?: unknown): Promise<ActionResult> {
  if (typeof stepId !== 'string' || !stepId.trim() || typeof answer !== 'string') {
    return { status: 400, body: { success: false, message: 'stepId and answer string are required.' } };
  }
  const cleanAnswer = answer.trim();
  if (!cleanAnswer) return { status: 400, body: { success: false, message: 'Answer cannot be blank.' } };
  return withPostgresTransaction(pool, async (client) => {
    await requireReleased(client);
    const progressResult = await client.query<{
      route_id: string; current_step_index: number; solved_steps: string[]; is_finished: boolean;
      target_discovered: boolean; version: string;
    }>('SELECT route_id,current_step_index,solved_steps,is_finished,target_discovered,version FROM round4_team_progress WHERE team_id=$1 FOR UPDATE', [teamId]);
    const progress = progressResult.rows[0];
    if (!progress) throw new Round4Error('Squad is not qualified or assigned a route.', 'FORBIDDEN');
    const key = requestKey(requestedId, `auto-${stepId}-${fingerprint(cleanAnswer)}`);
    const eventId = `round4:submit:${key}`;
    const fp = fingerprint({ action: 'submit', stepId, answer: cleanAnswer });
    const replay = await findReplay(client, teamId, eventId, fp);
    if (replay) return replay;

    const fail = async (status: number, body: Record<string, unknown>): Promise<ActionResult> => {
      const result = { status, body };
      // Preserve retries when the client supplied its stable request ID. Legacy
      // clients do not send one; avoid caching their transient pre-discovery or
      // validation failures under a synthesized key.
      if (requestedId !== undefined && requestedId !== null && requestedId !== '') {
        await saveAction(client, teamId, 'ROUND4_CLUE_SUBMISSION', eventId, fp, result);
      }
      return result;
    };
    if (progress.is_finished) return fail(400, { success: false, message: 'Your squad has already completed all five expedition clues.' });
    const activeResult = await client.query<{
      id: string; clue_index: number; accepted_answers: string[]; is_case_sensitive: boolean; is_common_final: boolean;
    }>('SELECT id,clue_index,accepted_answers,is_case_sensitive,is_common_final FROM round4_steps WHERE route_id=$1 AND clue_index=$2',
    [progress.route_id, progress.current_step_index + 1]);
    const active = activeResult.rows[0];
    if (!active || active.id !== stepId) {
      return fail(400, { success: false, message: 'Mismatched clue sequence. Please solve your currently assigned clue step.' });
    }
    if (!progress.target_discovered) return fail(409, { success: false, message: 'Discover the active clue target before submitting its answer.' });
    const isMatch = active.accepted_answers.some((accepted) => active.is_case_sensitive
      ? accepted.trim() === cleanAnswer
      : accepted.trim().toUpperCase() === cleanAnswer.toUpperCase());
    if (!isMatch) return fail(400, { success: false, correct: false,
      message: 'Incorrect cipher. The code does not align with the architectural record.' });

    const solved = [...progress.solved_steps];
    if (!solved.includes(stepId)) solved.push(stepId);
    if (active.clue_index < 5) {
      const nextIndex = progress.current_step_index + 1;
      await client.query(`UPDATE round4_team_progress SET current_step_index=$2,target_discovered=false,
        solved_steps=$3::jsonb,version=version+1,updated_at=clock_timestamp() WHERE team_id=$1`,
      [teamId, nextIndex, JSON.stringify(solved)]);
      const result: ActionResult = { status: 200, body: { success: true, correct: true, isFinal: false,
        nextStepIndex: nextIndex, message: `Clue ${active.clue_index} solved! Next campus location unlocked.` } };
      await saveAction(client, teamId, 'ROUND4_CLUE_SUBMISSION', eventId, fp, result);
      return result;
    }

    const priorSteps = await client.query<{ id: string; clue_index: number }>(
      'SELECT id,clue_index FROM round4_steps WHERE route_id=$1 AND clue_index<5 ORDER BY clue_index', [progress.route_id]);
    if (priorSteps.rowCount !== 4 || priorSteps.rows.some((row, index) => row.clue_index !== index + 1 || !solved.includes(row.id))) {
      throw new Round4Error('The team has not completed the required clue sequence.', 'CONFLICT');
    }
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('round4-winner',0))");
    const existingWinner = await client.query<Winner>(`SELECT team_id AS "teamId",team_name AS "teamName",
      route_id AS "routeId",solved_at AS "solvedAt" FROM round4_winner WHERE singleton_id=1 FOR UPDATE`);
    if (existingWinner.rowCount) return fail(200, { success: false, correct: true, raceClosed: true,
      winner: existingWinner.rows[0], message: 'THE TREASURE HAS BEEN CLAIMED. Another squad solved the final cipher first!' });

    const team = await client.query<{ team_name: string }>('SELECT team_name FROM teams WHERE id=$1', [teamId]);
    if (!team.rowCount) throw new Round4Error('Team not found.', 'NOT_FOUND');
    const now = new Date();
    await client.query(`UPDATE round4_team_progress SET current_step_index=5,target_discovered=true,
      solved_steps=$2::jsonb,is_finished=true,finished_at=$3,version=version+1,updated_at=$3 WHERE team_id=$1`,
    [teamId, JSON.stringify(solved), now]);
    await client.query(`INSERT INTO round4_winner(singleton_id,team_id,team_name,route_id,final_answer,solved_at)
      VALUES(1,$1,$2,$3,$4,$5)`, [teamId, team.rows[0].team_name, progress.route_id, cleanAnswer, now]);
    await completeRoundInTransaction(client, teamId, 4);
    const body = { success: true, correct: true, isFinal: true, isWinner: true, teamName: team.rows[0].team_name,
      routeId: progress.route_id, solvedAt: now, message: 'CONGRATULATIONS! Your squad deciphered the final riddle first and claimed the Golden Relic!' };
    const result: ActionResult = { status: 200, body };
    await saveAction(client, teamId, 'ROUND4_CLUE_SUBMISSION', eventId, fp, result);
    return result;
  });
}

export async function setRound4Release(pool: Pool, released: boolean): Promise<void> {
  await pool.query('UPDATE round4_settings SET is_released=$1,updated_at=clock_timestamp() WHERE id=1', [released]);
}

export async function updateRound4Step(pool: Pool, input: Record<string, unknown>): Promise<boolean> {
  const stepId = input.stepId;
  if (typeof stepId !== 'string' || !stepId.trim()) throw new Round4Error('stepId is required.', 'INVALID');
  const stringFields: Array<[string, string]> = [['riddleText', 'riddle_text'], ['fieldLocationHint', 'field_location_hint'], ['floorId', 'floor_id'], ['locationName', 'location_name']];
  for (const [field] of stringFields) if (input[field] !== undefined && typeof input[field] !== 'string') throw new Round4Error(`${field} must be text.`, 'INVALID');
  for (const field of ['targetX', 'targetY', 'triggerRadius'] as const) {
    if (input[field] !== undefined && (typeof input[field] !== 'number' || !Number.isFinite(input[field]) || (field === 'triggerRadius' && input[field] <= 0))) {
      throw new Round4Error(`${field} must be a valid number.`, 'INVALID');
    }
  }
  if (input.acceptedAnswers !== undefined && (!Array.isArray(input.acceptedAnswers) || input.acceptedAnswers.length === 0 || input.acceptedAnswers.some((answer) => typeof answer !== 'string' || !answer.trim()))) {
    throw new Round4Error('acceptedAnswers must be a non-empty array of strings.', 'INVALID');
  }
  const values: unknown[] = [stepId];
  const assignments: string[] = [];
  const add = (field: string, column: string, cast = '') => {
    if (input[field] !== undefined) { values.push(field === 'acceptedAnswers' ? JSON.stringify(input[field]) : input[field]); assignments.push(`${column}=$${values.length}${cast}`); }
  };
  add('riddleText', 'riddle_text'); add('fieldLocationHint', 'field_location_hint'); add('floorId', 'floor_id'); add('locationName', 'location_name');
  add('targetX', 'target_x'); add('targetY', 'target_y'); add('triggerRadius', 'trigger_radius'); add('acceptedAnswers', 'accepted_answers', '::jsonb');
  if (!assignments.length) return Boolean((await pool.query('SELECT 1 FROM round4_steps WHERE id=$1', [stepId])).rowCount);
  assignments.push('updated_at=clock_timestamp()');
  const result = await pool.query(`UPDATE round4_steps SET ${assignments.join(',')} WHERE id=$1`, values);
  return Boolean(result.rowCount);
}

export async function updateRound4FinalRoom(pool: Pool, input: Record<string, unknown>): Promise<void> {
  const fields: Array<[string, string, 'text' | 'number']> = [
    ['floorId', 'common_final_floor_id', 'text'], ['roomName', 'common_final_room_name', 'text'],
    ['targetX', 'common_final_x', 'number'], ['targetY', 'common_final_y', 'number'],
    ['triggerRadius', 'common_final_radius', 'number'], ['physicalEntryInstructions', 'physical_entry_instructions', 'text'],
  ];
  const values: unknown[] = [];
  const assignments: string[] = [];
  for (const [field, column, type] of fields) {
    if (input[field] === undefined) continue;
    if (type === 'text' && typeof input[field] !== 'string') throw new Round4Error(`${field} must be text.`, 'INVALID');
    if (type === 'number' && (typeof input[field] !== 'number' || !Number.isFinite(input[field]) || (field === 'triggerRadius' && input[field] <= 0))) throw new Round4Error(`${field} must be a valid number.`, 'INVALID');
    values.push(input[field]); assignments.push(`${column}=$${values.length}`);
  }
  if (!assignments.length) return;
  assignments.push('updated_at=clock_timestamp()');
  await pool.query(`UPDATE round4_settings SET ${assignments.join(',')} WHERE id=1`, values);
}

export async function resetRound4Tournament(pool: Pool): Promise<void> {
  await withPostgresTransaction(pool, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('round4-winner',0))");
    await client.query('DELETE FROM round4_winner WHERE singleton_id=1');
    await client.query("DELETE FROM activity_history WHERE action IN ('ROUND4_TARGET_DISCOVERED','ROUND4_CLUE_SUBMISSION')");
    await client.query(`UPDATE round4_team_progress SET current_step_index=0,target_discovered=false,solved_steps='[]'::jsonb,
      common_room_arrived=false,is_finished=false,finished_at=NULL,version=version+1,updated_at=clock_timestamp()`);
  });
}

export async function getRound4AdminOverview(pool: Pool) {
  const [settingsResult, routesResult, winnerResult, qualifiedResult, teamsResult, stepsResult] = await Promise.all([
    pool.query('SELECT * FROM round4_settings WHERE id=1'),
    pool.query('SELECT * FROM round4_routes ORDER BY route_number'),
    pool.query(`SELECT 'win-' || team_id AS id,team_id,team_name,route_id,final_answer,solved_at,created_at
      FROM round4_winner WHERE singleton_id=1`),
    pool.query(`SELECT q.id AS "qualId",q.team_id AS "teamId",t.team_name AS "teamName",q.route_id AS "routeId",
      r.roman_numeral AS "romanNumeral",r.route_name AS "routeName",p.current_step_index AS "currentStepIndex",
      p.target_discovered AS "targetDiscovered",p.common_room_arrived AS "commonRoomArrived",p.is_finished AS "isFinished",
      p.finished_at AS "finishedAt",(SELECT count(*)::int FROM round4_steps WHERE route_id=q.route_id) AS "totalSteps"
      FROM round4_qualified_teams q JOIN teams t ON t.id=q.team_id JOIN round4_routes r ON r.id=q.route_id
      LEFT JOIN round4_team_progress p ON p.team_id=q.team_id ORDER BY r.route_number`),
    pool.query('SELECT id,team_name AS "teamName",score,total_credits AS "totalCredits" FROM teams ORDER BY score DESC,created_at'),
    pool.query(`SELECT id,route_id AS "routeId",clue_index AS "clueIndex",floor_id AS "floorId",location_name AS "locationName",
      target_x AS "targetX",target_y AS "targetY",trigger_radius AS "triggerRadius",riddle_text AS "riddleText",
      field_location_hint AS "fieldLocationHint",accepted_answers AS answers,is_case_sensitive AS "isCaseSensitive",
      is_common_final AS "isCommonFinal" FROM round4_steps ORDER BY route_id,clue_index`),
  ]);
  const settings = settingsResult.rows[0];
  const qualifiedTeams = qualifiedResult.rows.map((row) => ({ ...row,
    targetDiscovered: row.targetDiscovered ? 1 : 0,
    commonRoomArrived: row.commonRoomArrived ? 1 : 0,
    isFinished: row.isFinished ? 1 : 0,
  }));
  return { success: true, settings: settings ? { ...settings, is_released: settings.is_released ? 1 : 0 } : null,
    routes: routesResult.rows, qualifiedTeams, availableTeams: teamsResult.rows,
    steps: stepsResult.rows.map((row) => ({ ...row, acceptedAnswersJson: JSON.stringify(row.answers), isCaseSensitive: row.isCaseSensitive ? 1 : 0, isCommonFinal: row.isCommonFinal ? 1 : 0, answers: undefined })),
    winner: winnerResult.rows[0] ?? null };
}

export async function recordRound4Completion(pool: Pool, teamId: string): Promise<void> {
  await withPostgresTransaction(pool, async (client) => {
    const progress = await client.query('SELECT 1 FROM round4_team_progress WHERE team_id=$1 AND is_finished=true AND current_step_index=5 AND finished_at IS NOT NULL', [teamId]);
    if (!progress.rowCount) throw new Round4Error('The team has not completed the Round 4 expedition.', 'CONFLICT');
    await completeRoundInTransaction(client, teamId, 4);
  });
}
