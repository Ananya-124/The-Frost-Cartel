import { Router } from 'express';
import * as crypto from 'node:crypto';
import { db } from '../../database/db.ts';
import { requireTeamAuth, requireAdminAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { eventBus } from '../services/eventBus.ts';

export const round4Router = Router();

// ==========================================
// SQUAD PLAYER ENDPOINTS
// ==========================================

/**
 * GET /api/round4/status
 * Check team qualification, route assignment, release status, and winner state.
 */
round4Router.get('/status', requireTeamAuth, (req: AuthenticatedRequest, res) => {
  if (!req.team) {
    res.status(401).json({ success: false, message: 'Squad authentication required.' });
    return;
  }
  const teamId = req.team.id;

  const settings = db.prepare('SELECT is_released FROM round4_settings LIMIT 1').get() as { is_released: number } | undefined;
  const isReleased = settings?.is_released === 1;

  const qualification = db.prepare(`
    SELECT q.route_id, r.route_number, r.roman_numeral, r.route_name
    FROM round4_qualified_teams q
    JOIN round4_routes r ON q.route_id = r.id
    WHERE q.team_id = ?
  `).get(teamId) as { route_id: string; route_number: number; roman_numeral: string; route_name: string } | undefined;

  const winner = db.prepare('SELECT team_id as teamId, team_name as teamName, route_id as routeId, solved_at as solvedAt FROM round4_winner LIMIT 1').get() as {
    teamId: string;
    teamName: string;
    routeId: string;
    solvedAt: string;
  } | undefined;

  if (!qualification) {
    res.json({
      success: true,
      qualified: false,
      isReleased,
      assignedRouteId: null,
      winner: winner || null,
      message: 'Your squad has not been qualified for Round 04 (The Campus Expedition). Only seven qualified squads may enter.',
    });
    return;
  }

  res.json({
    success: true,
    qualified: true,
    isReleased,
    assignedRouteId: qualification.route_id,
    routeNumber: qualification.route_number,
    romanNumeral: qualification.roman_numeral,
    routeName: qualification.route_name,
    winner: winner || null,
  });
});

/**
 * GET /api/round4/my-route
 * Authoritative route & clue progression for the calling squad.
 * STRICT SECURITY: Never returns other teams' routes or unearned future clue answers!
 */
round4Router.get('/my-route', requireTeamAuth, (req: AuthenticatedRequest, res) => {
  if (!req.team) {
    res.status(401).json({ success: false, message: 'Squad authentication required.' });
    return;
  }
  const teamId = req.team.id;

  // 1. Verify qualification & retrieve assigned route
  const qual = db.prepare(`
    SELECT q.route_id, r.route_number, r.roman_numeral, r.route_name, r.route_subtitle
    FROM round4_qualified_teams q
    JOIN round4_routes r ON q.route_id = r.id
    WHERE q.team_id = ?
  `).get(teamId) as {
    route_id: string;
    route_number: number;
    roman_numeral: string;
    route_name: string;
    route_subtitle: string;
  } | undefined;

  if (!qual) {
    res.status(403).json({
      success: false,
      message: 'Access Denied: Your squad is not among the seven qualified teams for Round 04.',
    });
    return;
  }

  // 2. Retrieve team progress (or initialize if absent)
  let progress = db.prepare(`
    SELECT id, current_step_index, target_discovered, solved_steps_json, common_room_arrived, is_finished, finished_at
    FROM round4_team_progress
    WHERE team_id = ?
  `).get(teamId) as {
    id: string;
    current_step_index: number;
    target_discovered: number;
    solved_steps_json: string;
    common_room_arrived: number;
    is_finished: number;
    finished_at: string | null;
  } | undefined;

  if (!progress) {
    const progId = 'prog-' + teamId;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO round4_team_progress (
        id, team_id, route_id, current_step_index, target_discovered, solved_steps_json, common_room_arrived, is_finished, created_at, updated_at
      ) VALUES (?, ?, ?, 0, 0, '[]', 0, 0, ?, ?)
    `).run(progId, teamId, qual.route_id, now, now);

    progress = {
      id: progId,
      current_step_index: 0,
      target_discovered: 0,
      solved_steps_json: '[]',
      common_room_arrived: 0,
      is_finished: 0,
      finished_at: null,
    };
  }

  // 3. Fetch steps for this route strictly up to current step (Future steps remain hidden)
  const steps = db.prepare(`
    SELECT id, clue_index, floor_id, location_name, target_x, target_y, trigger_radius,
           riddle_text, field_location_hint, is_common_final
    FROM round4_steps
    WHERE route_id = ?
    ORDER BY clue_index ASC
  `).all(qual.route_id) as Array<{
    id: string;
    clue_index: number;
    floor_id: string;
    location_name: string;
    target_x: number;
    target_y: number;
    trigger_radius: number;
    riddle_text: string;
    field_location_hint: string;
    is_common_final: number;
  }>;

  // Retrieve common final room configuration
  const settings = db.prepare(`
    SELECT common_final_location_id, common_final_floor_id, common_final_room_name,
           common_final_x, common_final_y, common_final_radius, physical_entry_instructions
    FROM round4_settings
    LIMIT 1
  `).get() as {
    common_final_location_id: string;
    common_final_floor_id: string;
    common_final_room_name: string;
    common_final_x: number;
    common_final_y: number;
    common_final_radius: number;
    physical_entry_instructions: string;
  };

  const solvedStepIds = JSON.parse(progress.solved_steps_json || '[]') as string[];
  const activeStepRaw = steps[progress.current_step_index] || null;

  let activeStep = null;
  if (activeStepRaw) {
    const isStep5Final = activeStepRaw.is_common_final === 1 || activeStepRaw.clue_index === 5;
    activeStep = {
      stepId: activeStepRaw.id,
      clueIndex: activeStepRaw.clue_index,
      floorId: isStep5Final ? settings.common_final_floor_id : activeStepRaw.floor_id,
      locationName: isStep5Final ? settings.common_final_room_name : activeStepRaw.location_name,
      targetPoint: isStep5Final
        ? { x: settings.common_final_x, y: settings.common_final_y }
        : { x: activeStepRaw.target_x, y: activeStepRaw.target_y },
      triggerRadius: isStep5Final ? settings.common_final_radius : activeStepRaw.trigger_radius,
      // Riddle is revealed only once avatar arrives at target point
      riddle: progress.target_discovered === 1 ? activeStepRaw.riddle_text : '',
      fieldLocationHint: progress.target_discovered === 1 ? activeStepRaw.field_location_hint : '',
      isCommonFinal: isStep5Final,
      physicalEntryInstructions: isStep5Final ? settings.physical_entry_instructions : undefined,
    };
  }

  // 4. Retrieve current winner if declared
  const winner = db.prepare('SELECT team_id as teamId, team_name as teamName, route_id as routeId, solved_at as solvedAt FROM round4_winner LIMIT 1').get() as {
    teamId: string;
    teamName: string;
    routeId: string;
    solvedAt: string;
  } | undefined;

  res.json({
    success: true,
    route: {
      routeId: qual.route_id,
      routeNumber: qual.route_number,
      romanNumeral: qual.roman_numeral,
      routeName: qual.route_name,
      routeSubtitle: qual.route_subtitle,
    },
    progress: {
      currentStepIndex: progress.current_step_index,
      targetDiscovered: progress.target_discovered === 1,
      solvedStepIds,
      commonRoomArrived: progress.common_room_arrived === 1,
      isFinished: progress.is_finished === 1,
      finishedAt: progress.finished_at,
    },
    activeStep,
    totalSteps: steps.length,
    winner: winner || null,
    isWinner: winner?.teamId === teamId,
  });
});

/**
 * POST /api/round4/discover-target
 * Triggered when desktop player's avatar reaches the active clue's coordinates.
 */
round4Router.post('/discover-target', requireTeamAuth, (req: AuthenticatedRequest, res) => {
  if (!req.team) {
    res.status(401).json({ success: false, message: 'Squad authentication required.' });
    return;
  }
  const teamId = req.team.id;

  const progress = db.prepare('SELECT current_step_index, route_id FROM round4_team_progress WHERE team_id = ?').get(teamId) as {
    current_step_index: number;
    route_id: string;
  } | undefined;

  if (!progress) {
    res.status(403).json({ success: false, message: 'Squad progress not initialized.' });
    return;
  }

  const isFinalStep = progress.current_step_index === 4;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE round4_team_progress
    SET target_discovered = 1,
        common_room_arrived = CASE WHEN ? = 1 THEN 1 ELSE common_room_arrived END,
        updated_at = ?
    WHERE team_id = ?
  `).run(isFinalStep ? 1 : 0, now, teamId);

  // Retrieve unlocked riddle for active step
  const step = db.prepare(`
    SELECT id, clue_index, riddle_text, field_location_hint
    FROM round4_steps
    WHERE route_id = ? AND clue_index = ?
  `).get(progress.route_id, progress.current_step_index + 1) as {
    id: string;
    clue_index: number;
    riddle_text: string;
    field_location_hint: string;
  } | undefined;

  res.json({
    success: true,
    targetDiscovered: true,
    commonRoomArrived: isFinalStep,
    riddle: step?.riddle_text || '',
    fieldLocationHint: step?.field_location_hint || '',
  });
});

/**
 * POST /api/round4/submit-clue
 * Authoritative answer verification with atomic immediate transaction on final step.
 * Only ONE team can win the championship.
 */
round4Router.post('/submit-clue', requireTeamAuth, (req: AuthenticatedRequest, res) => {
  if (!req.team) {
    res.status(401).json({ success: false, message: 'Squad authentication required.' });
    return;
  }
  const teamId = req.team.id;
  const teamName = req.team.teamName;
  const { stepId, answer } = req.body;

  if (!stepId || typeof answer !== 'string') {
    res.status(400).json({ success: false, message: 'stepId and answer string are required.' });
    return;
  }

  const cleanAnswer = answer.trim();
  if (!cleanAnswer) {
    res.status(400).json({ success: false, message: 'Answer cannot be blank.' });
    return;
  }

  // 1. Retrieve progress and step record
  const progress = db.prepare(`
    SELECT current_step_index, route_id, solved_steps_json, is_finished
    FROM round4_team_progress
    WHERE team_id = ?
  `).get(teamId) as {
    current_step_index: number;
    route_id: string;
    solved_steps_json: string;
    is_finished: number;
  } | undefined;

  if (!progress) {
    res.status(403).json({ success: false, message: 'Squad is not qualified or assigned a route.' });
    return;
  }

  if (progress.is_finished === 1) {
    res.status(400).json({ success: false, message: 'Your squad has already completed all five expedition clues.' });
    return;
  }

  // Verify the submitted step is indeed the active step
  const activeStep = db.prepare(`
    SELECT id, clue_index, accepted_answers_json, is_case_sensitive, is_common_final
    FROM round4_steps
    WHERE route_id = ? AND clue_index = ?
  `).get(progress.route_id, progress.current_step_index + 1) as {
    id: string;
    clue_index: number;
    accepted_answers_json: string;
    is_case_sensitive: number;
    is_common_final: number;
  } | undefined;

  if (!activeStep || activeStep.id !== stepId) {
    res.status(400).json({
      success: false,
      message: 'Mismatched clue sequence. Please solve your currently assigned clue step.',
    });
    return;
  }

  // 2. Validate answer candidate
  const acceptedAnswers = JSON.parse(activeStep.accepted_answers_json || '[]') as string[];
  const isMatch = acceptedAnswers.some((accepted) => {
    if (activeStep.is_case_sensitive === 1) {
      return accepted.trim() === cleanAnswer;
    }
    return accepted.trim().toUpperCase() === cleanAnswer.toUpperCase();
  });

  if (!isMatch) {
    res.status(400).json({
      success: false,
      correct: false,
      message: 'Incorrect cipher. The code does not align with the architectural record.',
    });
    return;
  }

  const now = new Date().toISOString();
  const solvedList = JSON.parse(progress.solved_steps_json || '[]') as string[];
  if (!solvedList.includes(stepId)) {
    solvedList.push(stepId);
  }

  // 3. Handle Intermediate Steps (Clues 1 to 4)
  if (activeStep.clue_index < 5) {
    const nextIndex = progress.current_step_index + 1;
    db.prepare(`
      UPDATE round4_team_progress
      SET current_step_index = ?,
          target_discovered = 0,
          solved_steps_json = ?,
          updated_at = ?
      WHERE team_id = ?
    `).run(nextIndex, JSON.stringify(solvedList), now, teamId);

    // Broadcast progress event over SSE
    eventBus.emitEvent('ROUND4_STEP_SOLVED', {
      teamId,
      teamName,
      routeId: progress.route_id,
      solvedClueIndex: activeStep.clue_index,
      nextClueIndex: nextIndex + 1,
    });

    res.json({
      success: true,
      correct: true,
      isFinal: false,
      nextStepIndex: nextIndex,
      message: `Clue ${activeStep.clue_index} solved! Next campus location unlocked.`,
    });
    return;
  }

  // 4. Handle Clue 5: THE FINAL ROOM — ATOMIC RACE TO VICTORY
  // Uses immediate lock to prevent race conditions between simultaneous submissions
  try {
    db.exec('BEGIN IMMEDIATE;');

    // Check if winner is ALREADY recorded
    const existingWinner = db.prepare('SELECT team_id as teamId, team_name as teamName, solved_at as solvedAt FROM round4_winner LIMIT 1').get() as {
      teamId: string;
      teamName: string;
      solvedAt: string;
    } | undefined;

    if (existingWinner) {
      db.exec('COMMIT;');
      res.json({
        success: false,
        correct: true,
        raceClosed: true,
        winner: existingWinner,
        message: 'THE TREASURE HAS BEEN CLAIMED. Another squad solved the final cipher first!',
      });
      return;
    }

    // Record the ONE AND ONLY WINNER
    const winnerId = 'win-' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO round4_winner (id, team_id, team_name, route_id, final_answer, solved_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(winnerId, teamId, teamName, progress.route_id, cleanAnswer, now, now);

    // Update team progress to finished
    db.prepare(`
      UPDATE round4_team_progress
      SET current_step_index = 5,
          solved_steps_json = ?,
          is_finished = 1,
          finished_at = ?,
          updated_at = ?
      WHERE team_id = ?
    `).run(JSON.stringify(solvedList), now, now, teamId);

    db.exec('COMMIT;');

    const winnerRecord = {
      teamId,
      teamName,
      routeId: progress.route_id,
      solvedAt: now,
    };

    // Broadcast champion announcement across SSE
    eventBus.emitEvent('ROUND4_WINNER_DECLARED', { winner: winnerRecord });

    res.json({
      success: true,
      correct: true,
      isFinal: true,
      isWinner: true,
      teamName,
      routeId: progress.route_id,
      solvedAt: now,
      message: 'CONGRATULATIONS! Your squad deciphered the final riddle first and claimed the Golden Relic!',
    });
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // ignore rollback failure if not in transaction
    }
    console.error('[Round4 submitClue] Transaction error:', err);
    res.status(500).json({ success: false, message: 'Internal server failure verifying championship answer.' });
  }
});

// ==========================================
// ADMIN CONTROL & MONITORING ENDPOINTS
// ==========================================

/**
 * GET /api/round4/admin/overview
 * Real-time monitoring of all 7 qualified teams, routes, steps, and winner.
 */
round4Router.get('/admin/overview', requireAdminAuth, (_req, res) => {
  const settings = db.prepare('SELECT * FROM round4_settings LIMIT 1').get();
  const routes = db.prepare('SELECT * FROM round4_routes ORDER BY route_number ASC').all();
  const winner = db.prepare('SELECT * FROM round4_winner LIMIT 1').get();

  const qualifiedTeams = db.prepare(`
    SELECT q.id as qualId, q.team_id as teamId, t.team_name as teamName,
           q.route_id as routeId, r.roman_numeral as romanNumeral, r.route_name as routeName,
           p.current_step_index as currentStepIndex, p.target_discovered as targetDiscovered,
           p.common_room_arrived as commonRoomArrived, p.is_finished as isFinished,
           p.finished_at as finishedAt,
           (SELECT COUNT(*) FROM round4_steps WHERE route_id = q.route_id) as totalSteps
    FROM round4_qualified_teams q
    JOIN teams t ON q.team_id = t.id
    JOIN round4_routes r ON q.route_id = r.id
    LEFT JOIN round4_team_progress p ON q.team_id = p.team_id
    ORDER BY r.route_number ASC
  `).all();

  const availableTeams = db.prepare(`
    SELECT id, team_name as teamName, score, total_credits as totalCredits
    FROM teams
    ORDER BY score DESC, created_at ASC
  `).all();

  const steps = db.prepare(`
    SELECT id, route_id as routeId, clue_index as clueIndex, floor_id as floorId,
           location_name as locationName, target_x as targetX, target_y as targetY,
           trigger_radius as triggerRadius, riddle_text as riddleText,
           field_location_hint as fieldLocationHint, accepted_answers_json as acceptedAnswersJson,
           is_case_sensitive as isCaseSensitive, is_common_final as isCommonFinal
    FROM round4_steps
    ORDER BY route_id ASC, clue_index ASC
  `).all();

  res.json({
    success: true,
    settings,
    routes,
    qualifiedTeams,
    availableTeams,
    steps,
    winner: winner || null,
  });
});

/**
 * POST /api/round4/admin/qualify-teams
 * Administrator configures the exact 7 teams and assigns 1 unique route per team.
 * Enforces maximum 7 teams, unique team IDs, and unique route IDs.
 */
round4Router.post('/admin/qualify-teams', requireAdminAuth, (req, res) => {
  const { assignments } = req.body as { assignments: Array<{ teamId: string; routeId: string }> };

  if (!Array.isArray(assignments)) {
    res.status(400).json({ success: false, message: 'assignments must be an array.' });
    return;
  }

  if (assignments.length > 7) {
    res.status(400).json({
      success: false,
      message: 'Strict Limit Exceeded: Round 04 allows at most seven qualified teams.',
    });
    return;
  }

  // Validate uniqueness
  const teamIds = new Set<string>();
  const routeIds = new Set<string>();

  for (const a of assignments) {
    if (!a.teamId || !a.routeId) {
      res.status(400).json({ success: false, message: 'Each assignment requires valid teamId and routeId.' });
      return;
    }
    if (teamIds.has(a.teamId)) {
      res.status(400).json({ success: false, message: `Duplicate team assignment detected: ${a.teamId}` });
      return;
    }
    if (routeIds.has(a.routeId)) {
      res.status(400).json({ success: false, message: `Duplicate route assignment detected: ${a.routeId}` });
      return;
    }
    teamIds.add(a.teamId);
    routeIds.add(a.routeId);
  }

  const now = new Date().toISOString();

  try {
    db.exec('BEGIN IMMEDIATE;');

    // Clear previous qualifications and progress
    db.prepare('DELETE FROM round4_qualified_teams').run();
    db.prepare('DELETE FROM round4_team_progress').run();

    const insertQual = db.prepare(`
      INSERT INTO round4_qualified_teams (id, team_id, route_id, qualified_at, assigned_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertProg = db.prepare(`
      INSERT INTO round4_team_progress (
        id, team_id, route_id, current_step_index, target_discovered, solved_steps_json, common_room_arrived, is_finished, created_at, updated_at
      ) VALUES (?, ?, ?, 0, 0, '[]', 0, 0, ?, ?)
    `);

    for (const a of assignments) {
      const qId = 'qual-' + a.teamId;
      const pId = 'prog-' + a.teamId;
      insertQual.run(qId, a.teamId, a.routeId, now, now);
      insertProg.run(pId, a.teamId, a.routeId, now, now);
    }

    db.exec('COMMIT;');

    res.json({
      success: true,
      message: `Successfully qualified ${assignments.length} squads with unique routes I to VII.`,
    });
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // ignore
    }
    console.error('[Round4 qualifyTeams] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to update team qualification records.' });
  }
});

/**
 * POST /api/round4/admin/release
 * Release or unrelease Round 04 access.
 */
round4Router.post('/admin/release', requireAdminAuth, (req, res) => {
  const { isReleased } = req.body;
  const flag = isReleased ? 1 : 0;
  const now = new Date().toISOString();

  db.prepare('UPDATE round4_settings SET is_released = ?, updated_at = ?').run(flag, now);
  eventBus.emitEvent('ROUND4_RELEASE_STATE', { isReleased: flag === 1 });

  res.json({ success: true, isReleased: flag === 1 });
});

/**
 * POST /api/round4/admin/configure-step
 * Visual clue positioning & riddle editor for any of the 35 steps.
 */
round4Router.post('/admin/configure-step', requireAdminAuth, (req, res) => {
  const {
    stepId,
    riddleText,
    fieldLocationHint,
    acceptedAnswers,
    targetX,
    targetY,
    triggerRadius,
    floorId,
    locationName,
  } = req.body;

  if (!stepId) {
    res.status(400).json({ success: false, message: 'stepId is required.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM round4_steps WHERE id = ?').get(stepId);
  if (!existing) {
    res.status(404).json({ success: false, message: `Step ${stepId} not found.` });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE round4_steps
    SET riddle_text = COALESCE(?, riddle_text),
        field_location_hint = COALESCE(?, field_location_hint),
        accepted_answers_json = CASE WHEN ? IS NOT NULL THEN ? ELSE accepted_answers_json END,
        target_x = COALESCE(?, target_x),
        target_y = COALESCE(?, target_y),
        trigger_radius = COALESCE(?, trigger_radius),
        floor_id = COALESCE(?, floor_id),
        location_name = COALESCE(?, location_name),
        updated_at = ?
    WHERE id = ?
  `).run(
    riddleText ?? null,
    fieldLocationHint ?? null,
    acceptedAnswers ? JSON.stringify(acceptedAnswers) : null,
    acceptedAnswers ? JSON.stringify(acceptedAnswers) : null,
    targetX ?? null,
    targetY ?? null,
    triggerRadius ?? null,
    floorId ?? null,
    locationName ?? null,
    now,
    stepId
  );

  res.json({ success: true, message: `Step ${stepId} successfully updated.` });
});

/**
 * POST /api/round4/admin/configure-final-room
 * Configure the global Common Final Room destination.
 */
round4Router.post('/admin/configure-final-room', requireAdminAuth, (req, res) => {
  const { floorId, roomName, targetX, targetY, triggerRadius, physicalEntryInstructions } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE round4_settings
    SET common_final_floor_id = COALESCE(?, common_final_floor_id),
        common_final_room_name = COALESCE(?, common_final_room_name),
        common_final_x = COALESCE(?, common_final_x),
        common_final_y = COALESCE(?, common_final_y),
        common_final_radius = COALESCE(?, common_final_radius),
        physical_entry_instructions = COALESCE(?, physical_entry_instructions),
        updated_at = ?
  `).run(
    floorId ?? null,
    roomName ?? null,
    targetX ?? null,
    targetY ?? null,
    triggerRadius ?? null,
    physicalEntryInstructions ?? null,
    now
  );

  res.json({ success: true, message: 'Common final room successfully updated.' });
});

/**
 * POST /api/round4/admin/reset-tournament
 * Clear winner and reset all 7 teams' progress to clue 1.
 */
round4Router.post('/admin/reset-tournament', requireAdminAuth, (_req, res) => {
  const now = new Date().toISOString();

  try {
    db.exec('BEGIN IMMEDIATE;');
    db.prepare('DELETE FROM round4_winner').run();
    db.prepare(`
      UPDATE round4_team_progress
      SET current_step_index = 0,
          target_discovered = 0,
          solved_steps_json = '[]',
          common_room_arrived = 0,
          is_finished = 0,
          finished_at = NULL,
          updated_at = ?
    `).run(now);
    db.exec('COMMIT;');

    eventBus.emitEvent('ROUND4_RESET', { resetAt: now });

    res.json({ success: true, message: 'Round 04 tournament state reset successfully.' });
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // ignore
    }
    console.error('[Round4 resetTournament] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset tournament state.' });
  }
});

