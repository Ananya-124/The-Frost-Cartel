import { describe, it, expect, beforeEach } from 'vitest';
import { Round1Service } from '../round1Service';

describe('Round1Service Master Rules & Idempotent Scoring', () => {
  let service: Round1Service;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    service = new Round1Service();
  });

  it('initializes squad with 0 credits and 22-minute duration', () => {
    const session = service.getTeamSession('team_alpha', 'Alpha Squad');
    expect(session.credits).toBe(0);
    expect(session.totalDurationMinutes).toBe(22);
    expect(session.status).toBe('waiting');
    expect(session.stages['stage-1'].status).toBe('available');
    expect(session.stages['stage-2'].status).toBe('available');
    expect(session.stages['stage-3'].status).toBe('available');
  });

  it('opens Stage 1 for sessions that were saved while it was still "not configured"', () => {
    const session = service.getTeamSession('team_old', 'Old Squad');
    session.stages['stage-1'].status = 'not_configured';
    expect(service.getTeamSession('team_old', 'Old Squad').stages['stage-1'].status).toBe('available');
  });

  describe('Stage 1 — Pumpkin Shuffle trials', () => {
    const start = (id = 'team_s1') => {
      service.beginRound1(id, 'S1 Squad');
      return id;
    };

    it('starts with two pending trials (5 pumpkins / 40 CR, 7 pumpkins / 60 CR, 2 tries each)', () => {
      const id = start();
      expect(service.getStage1Trials().map((t) => [t.pumpkins, t.tries, t.reward])).toEqual([[5, 2, 40], [7, 2, 60]]);
      expect(service.getStage1State(id)?.trials).toEqual([
        { attemptsUsed: 0, status: 'pending', earnedCredits: 0 },
        { attemptsUsed: 0, status: 'pending', earnedCredits: 0 },
      ]);
    });

    it('awards 40 credits for winning trial I and keeps the stage open for trial II', () => {
      const id = start();
      expect(service.beginStage1Attempt(id, 0)).toEqual({ ok: true, attemptsUsed: 1 });
      expect(service.resolveStage1Trial(id, 0, true)).toEqual({ success: true, creditsAwarded: 40, stageFinished: false });
      const session = service.getTeamSession(id, 'S1 Squad');
      expect(session.credits).toBe(40);
      expect(session.stages['stage-1'].status).toBe('in_progress');
    });

    it('awards 60 credits for trial II and completes the stage (100 in total)', () => {
      const id = start();
      service.beginStage1Attempt(id, 0);
      service.resolveStage1Trial(id, 0, true);
      service.beginStage1Attempt(id, 1);
      expect(service.resolveStage1Trial(id, 1, true)).toEqual({ success: true, creditsAwarded: 60, stageFinished: true });
      const session = service.getTeamSession(id, 'S1 Squad');
      expect(session.credits).toBe(100);
      expect(session.stages['stage-1'].status).toBe('completed');
      expect(session.stages['stage-1'].earnedCredits).toBe(100);
      expect(session.scoreTransactions.filter((t) => t.stageId === 'stage-1')).toHaveLength(2);
    });

    it('allows a win on the second try and pays the same', () => {
      const id = start();
      service.beginStage1Attempt(id, 0);
      expect(service.resolveStage1Trial(id, 0, false).reason).toBe('tries_left'); // cannot lose with a try left
      expect(service.beginStage1Attempt(id, 0)).toEqual({ ok: true, attemptsUsed: 2 });
      expect(service.resolveStage1Trial(id, 0, true).creditsAwarded).toBe(40);
    });

    it('closes a trial as lost after two failed tries, with no credits, and gives no third try', () => {
      const id = start();
      service.beginStage1Attempt(id, 0);
      service.beginStage1Attempt(id, 0);
      expect(service.beginStage1Attempt(id, 0)).toEqual({ ok: false, reason: 'no_tries' });
      expect(service.resolveStage1Trial(id, 0, false)).toEqual({ success: true, creditsAwarded: 0, stageFinished: false });
      expect(service.getTeamSession(id, 'S1 Squad').credits).toBe(0);
      expect(service.beginStage1Attempt(id, 0)).toEqual({ ok: false, reason: 'resolved' });
    });

    it('keeps trial II locked until trial I is closed, and never pays a trial twice', () => {
      const id = start();
      expect(service.beginStage1Attempt(id, 1)).toEqual({ ok: false, reason: 'locked' });
      service.beginStage1Attempt(id, 0);
      service.resolveStage1Trial(id, 0, true);
      expect(service.resolveStage1Trial(id, 0, true).reason).toBe('already_resolved');
      expect(service.getTeamSession(id, 'S1 Squad').credits).toBe(40);
      expect(service.beginStage1Attempt(id, 1).ok).toBe(true);
    });

    it('completes the stage with partial credits when trial I is lost and trial II is won', () => {
      const id = start();
      service.beginStage1Attempt(id, 0);
      service.beginStage1Attempt(id, 0);
      service.resolveStage1Trial(id, 0, false);
      service.beginStage1Attempt(id, 1);
      service.resolveStage1Trial(id, 1, true);
      const session = service.getTeamSession(id, 'S1 Squad');
      expect(session.credits).toBe(60);
      expect(session.stages['stage-1'].status).toBe('completed');
    });

    it('remembers used tries after a reload, so leaving the stage cannot refund them', () => {
      const id = start();
      service.beginStage1Attempt(id, 0);
      const reloaded = new Round1Service();
      expect(reloaded.getStage1State(id)?.trials[0].attemptsUsed).toBe(1);
      expect(reloaded.beginStage1Attempt(id, 0)).toEqual({ ok: true, attemptsUsed: 2 });
      expect(reloaded.beginStage1Attempt(id, 0)).toEqual({ ok: false, reason: 'no_tries' });
    });

    it('counts an abandoned last try as lost when the squad comes back', () => {
      const id = start();
      service.beginStage1Attempt(id, 0);
      service.beginStage1Attempt(id, 0); // last try started, never answered
      service.settleAbandonedStage1(id);
      expect(service.getStage1State(id)?.trials[0].status).toBe('lost');
    });

    it('upgrades old saved sessions that have no Stage 1 state', () => {
      const id = start();
      const old = service.getTeamSession(id, 'S1 Squad') as unknown as { stage1State?: unknown };
      delete old.stage1State;
      expect(service.getStage1State(id)?.trials).toHaveLength(2);
    });

    it('awards nothing once the round timer has ended', () => {
      const id = start();
      service.beginStage1Attempt(id, 0);
      service.getTeamSession(id, 'S1 Squad').status = 'expired';
      expect(service.resolveStage1Trial(id, 0, true)).toMatchObject({ success: false, creditsAwarded: 0, reason: 'expired' });
      expect(service.beginStage1Attempt(id, 0)).toEqual({ ok: false, reason: 'expired' });
    });

    it('reports progress to the score sync hook', () => {
      const calls: unknown[][] = [];
      service.setOnScoreSync((...a) => calls.push(a));
      const id = start();
      service.beginStage1Attempt(id, 0);
      service.resolveStage1Trial(id, 0, true);
      expect(calls[0].slice(0, 4)).toEqual([id, 40, 'stage-1', 'in_progress']);
    });
  });

  it('begins round 1 and computes exact timestamp deadline', () => {
    const session = service.beginRound1('team_alpha', 'Alpha Squad');
    expect(session.roundStartTime).not.toBeNull();
    expect(session.roundDeadline).not.toBeNull();
    expect(session.status).toBe('active');

    const remaining = service.getTimeRemainingSeconds('team_alpha');
    expect(remaining).toBeGreaterThan(1300); // 22 min = 1320 sec
    expect(remaining).toBeLessThanOrEqual(1320);
  });

  it('allows configurable round duration between 20 and 25 minutes', () => {
    service.setDurationMinutes(24);
    expect(service.getDurationMinutes()).toBe(24);

    // Reject out of bounds
    service.setDurationMinutes(15);
    expect(service.getDurationMinutes()).toBe(24);
    service.setDurationMinutes(30);
    expect(service.getDurationMinutes()).toBe(24);
  });

  it('allows non-sequential stage access (all stages accessible simultaneously)', () => {
    service.beginRound1('team_alpha', 'Alpha Squad');

    // Squad can enter Stage 3 first directly
    const sessionStage3 = service.enterStage('team_alpha', 'stage-3');
    expect(sessionStage3.currentStageId).toBe('stage-3');
    expect(sessionStage3.stages['stage-3'].status).toBe('in_progress');

    // Then switch to Stage 2
    const sessionStage2 = service.enterStage('team_alpha', 'stage-2');
    expect(sessionStage2.currentStageId).toBe('stage-2');
    expect(sessionStage2.stages['stage-2'].status).toBe('in_progress');
  });

  it('skipping a stage awards 0 credits but allows later completion', () => {
    service.beginRound1('team_alpha', 'Alpha Squad');
    service.enterStage('team_alpha', 'stage-2');

    // Skip Stage 2
    const session = service.skipStage('team_alpha', 'stage-2');
    expect(session.stages['stage-2'].status).toBe('skipped');
    expect(session.stages['stage-2'].earnedCredits).toBe(0);
    expect(session.credits).toBe(0);

    // Re-enter and complete Stage 2
    service.enterStage('team_alpha', 'stage-2');
    const completeRes = service.completeStage('team_alpha', 'stage-2');
    expect(completeRes.success).toBe(true);
    expect(completeRes.creditsAwarded).toBe(150);

    const updated = service.getTeamSession('team_alpha', 'Alpha Squad');
    expect(updated.stages['stage-2'].status).toBe('completed');
    expect(updated.credits).toBe(150);
  });

  it('prevents duplicate stage completion rewards (idempotent)', () => {
    service.beginRound1('team_alpha', 'Alpha Squad');

    const first = service.completeStage('team_alpha', 'stage-2');
    expect(first.success).toBe(true);
    expect(first.creditsAwarded).toBe(150);

    // Second claim must be rejected with 0 additional credits
    const second = service.completeStage('team_alpha', 'stage-2');
    expect(second.success).toBe(false);
    expect(second.creditsAwarded).toBe(0);

    const session = service.getTeamSession('team_alpha', 'Alpha Squad');
    expect(session.credits).toBe(150);
    expect(session.scoreTransactions.length).toBe(1);
  });

  it('applies configurable hint deductions to team credit balance', () => {
    service.beginRound1('team_alpha', 'Alpha Squad');
    service.completeStage('team_alpha', 'stage-2'); // 150 CR

    const res = service.useHint('team_alpha', 'stage-2', 'Inspect Photo 1');
    expect(res.deduction).toBe(15);

    const session = service.getTeamSession('team_alpha', 'Alpha Squad');
    expect(session.credits).toBe(135);
    expect(session.scoreTransactions.length).toBe(2);
    expect(session.scoreTransactions[1].type).toBe('hint_deduction');
    expect(session.scoreTransactions[1].deltaCredits).toBe(-15);
  });

  it('validates Stage 3 puzzles and awards 250 credits upon final gate escape', () => {
    service.beginRound1('team_alpha', 'Alpha Squad');

    // Grave 1
    service.placeBone('team_alpha', 'slot_head', 'bone_skull');
    service.placeBone('team_alpha', 'slot_chest', 'bone_rib');
    const g1Complete = service.placeBone('team_alpha', 'slot_legs', 'bone_femur');
    expect(g1Complete.allPlaced).toBe(true);

    const sessionAfterG1 = service.getTeamSession('team_alpha', 'Alpha Squad');
    expect(sessionAfterG1.stage3State.collectedFragments).toContain('THE');

    // Grave 2
    service.digSoil('team_alpha', 'soil_1');
    service.digSoil('team_alpha', 'soil_2');
    service.digSoil('team_alpha', 'soil_3');
    const g2Res = service.unlockGrave2Coffer('team_alpha', '147');
    expect(g2Res.success).toBe(true);

    const sessionAfterG2 = service.getTeamSession('team_alpha', 'Alpha Squad');
    expect(sessionAfterG2.stage3State.collectedFragments).toContain('NIGHT');

    // Grave 3 Rune Rings
    // Ring 0: FLAME (0) -> CW -> MOON (1)
    service.rotateRuneRing('team_alpha', 0, 'cw');
    // Ring 1: SKULL (0) -> CW -> FLAME (1) -> CW -> RAVEN (2)
    service.rotateRuneRing('team_alpha', 1, 'cw');
    service.rotateRuneRing('team_alpha', 1, 'cw');
    // Ring 2: MOON (0) -> CW -> RAVEN (1) -> CW -> FLAME (2)
    service.rotateRuneRing('team_alpha', 2, 'cw');
    const g3Res = service.rotateRuneRing('team_alpha', 2, 'cw');
    expect(g3Res.isCorrectSequence).toBe(true);

    const sessionAfterG3 = service.getTeamSession('team_alpha', 'Alpha Squad');
    expect(sessionAfterG3.stage3State.collectedFragments).toContain('RETURNS');

    // Final Gate Answer
    const wrongAttempt = service.submitFinalEscapeAnswer('team_alpha', 'OPEN SESAME');
    expect(wrongAttempt.success).toBe(false);

    const correctAttempt = service.submitFinalEscapeAnswer('team_alpha', 'THE NIGHT RETURNS');
    expect(correctAttempt.success).toBe(true);

    const finalSession = service.getTeamSession('team_alpha', 'Alpha Squad');
    expect(finalSession.credits).toBe(250); // 250 earned on stage completion
    expect(finalSession.stages['stage-3'].status).toBe('completed');
  });
});
