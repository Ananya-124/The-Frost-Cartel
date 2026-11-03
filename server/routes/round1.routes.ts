import { Router } from 'express';
import * as crypto from 'node:crypto';
import { db } from '../../database/db.ts';
import { requireTeamAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { eventBus } from '../services/eventBus.ts';

export const round1Router = Router();

// GET /api/round1/state
round1Router.get('/state', requireTeamAuth, (req: AuthenticatedRequest, res) => {
  if (!req.team) {
    res.status(401).json({ success: false, message: 'Squad authentication required.' });
    return;
  }
  const teamId = req.team.id;

  const round = db.prepare('SELECT * FROM global_round_state WHERE round_id = 1').get() as {
    is_active: number;
    duration_seconds: number;
    start_time: string;
  } | undefined;

  if (!round) {
    res.status(404).json({ success: false, message: 'Round 1 state not found.' });
    return;
  }

  const startTime = new Date(round.start_time).getTime();
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const remainingSeconds = Math.max(0, round.duration_seconds - elapsed);

  const stages = db.prepare('SELECT * FROM stages_progress WHERE team_id = ? ORDER BY stage_id ASC').all(teamId);
  const team = db.prepare('SELECT score, max_credits, total_credits, is_paused FROM teams WHERE id = ?').get(teamId) as {
    score: number;
    max_credits: number;
    total_credits: number;
    is_paused: number;
  };

  res.json({
    success: true,
    round: {
      id: 1,
      name: 'The Graveyard Escape',
      isActive: round.is_active === 1,
      totalDurationSeconds: round.duration_seconds,
      remainingSeconds,
    },
    team: {
      score: team.score,
      maxCredits: team.max_credits,
      totalCredits: team.total_credits,
      isPaused: team.is_paused === 1,
    },
    stages,
  });
});

// POST /api/round1/stage/complete
round1Router.post('/stage/complete', requireTeamAuth, (req: AuthenticatedRequest, res) => {
  if (!req.team) {
    res.status(401).json({ success: false, message: 'Squad authentication required.' });
    return;
  }
  const teamId = req.team.id;
  const { stageId, points, timeSpentSeconds, fragmentUnlocked } = req.body;

  if (!stageId || typeof stageId !== 'number') {
    res.status(400).json({ success: false, message: 'Valid stageId is required.' });
    return;
  }

  const stageProgress = db.prepare('SELECT * FROM stages_progress WHERE team_id = ? AND stage_id = ?').get(teamId, stageId) as {
    id: string;
    status: string;
    score: number;
    max_score: number;
  } | undefined;

  if (!stageProgress) {
    res.status(404).json({ success: false, message: 'Stage progress record not found.' });
    return;
  }

  // Prevent re-scoring completed stage
  if (stageProgress.status === 'COMPLETED') {
    res.json({ success: true, message: 'Stage already recorded as completed.', stage: stageProgress });
    return;
  }

  // Verify points limit
  const awardedPoints = Math.min(typeof points === 'number' ? points : stageProgress.max_score, stageProgress.max_score);
  const team = db.prepare('SELECT score, max_credits FROM teams WHERE id = ?').get(teamId) as { score: number; max_credits: number };
  const newTotalScore = Math.min(team.score + awardedPoints, team.max_credits);
  const now = new Date().toISOString();

  // Transaction: Update stage progress + update team score + insert score transaction + insert activity
  db.exec('BEGIN TRANSACTION;');
  try {
    // 1. Update this stage
    db.prepare(`
      UPDATE stages_progress
      SET status = 'COMPLETED', score = ?, time_spent_seconds = ?, completed_at = ?, fragment_unlocked = ?, updated_at = ?
      WHERE team_id = ? AND stage_id = ?
    `).run(awardedPoints, timeSpentSeconds || 0, now, fragmentUnlocked ? 1 : 0, now, teamId, stageId);

    // 2. If Stage 2 completed, unlock Stage 3
    if (stageId === 2) {
      db.prepare(`
        UPDATE stages_progress
        SET status = 'AVAILABLE', updated_at = ?
        WHERE team_id = ? AND stage_id = 3 AND status = 'LOCKED'
      `).run(now, teamId);
    }

    // 3. Update team total score
    db.prepare(`
      UPDATE teams
      SET score = ?, updated_at = ?
      WHERE id = ?
    `).run(newTotalScore, now, teamId);

    // 4. Record score transaction in append-only ledger
    db.prepare(`
      INSERT INTO score_transactions (id, team_id, stage_id, delta, new_score, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('tx-' + crypto.randomUUID(), teamId, stageId, awardedPoints, newTotalScore, `Stage ${stageId} completion`, now);

    // 5. Activity log
    db.prepare(`
      INSERT INTO activity_history (id, team_id, action, details, created_at)
      VALUES (?, ?, 'STAGE_COMPLETE', ?, ?)
    `).run('act-' + crypto.randomUUID(), teamId, `Completed Stage ${stageId} (+${awardedPoints} CR)`, now);

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Transaction failed:', err);
    res.status(500).json({ success: false, message: 'Database transaction error.' });
    return;
  }

  // Broadcast update to all players on this squad
  eventBus.broadcastToTeam(teamId, 'STAGE_COMPLETED', {
    stageId,
    awardedPoints,
    newTotalScore,
    fragmentUnlocked: Boolean(fragmentUnlocked),
  });

  res.json({
    success: true,
    stageId,
    awardedPoints,
    newTotalScore,
    fragmentUnlocked: Boolean(fragmentUnlocked),
  });
});

