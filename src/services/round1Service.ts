import type { StageId } from '../types/round.types';
import type {
  Round1TeamSessionState,
  ScoreTransaction,
  Stage1Config,
  Stage2Config,
  Stage3Config,
  Stage1State,
  Stage1TrialConfig,
  Stage1TrialState,
} from '../types/round1.types';
import { DEFAULT_STAGE1_TRIALS } from '../constants/stage1.constants';
import { STAGE_CREDITS } from '../constants/credits.constants';
import { STAGE2_CANONICAL_IMAGES, STAGE2_CANONICAL_TARGETS } from '../components/game/stage2/stage2TargetsConfig';

export type ScoreSyncCallback = (
  teamId: string,
  credits: number,
  stageId?: StageId,
  stageStatus?: 'completed' | 'skipped' | 'in_progress',
  activityDesc?: string
) => void;

export type Stage1AttemptResult =
  | { ok: true; attemptsUsed: number }
  | { ok: false; reason: 'unknown_team' | 'bad_trial' | 'locked' | 'resolved' | 'no_tries' | 'expired' };

export interface Stage1ResolveResult {
  success: boolean;
  creditsAwarded: number;
  stageFinished: boolean;
  reason?: 'unknown_team' | 'bad_trial' | 'not_started' | 'tries_left' | 'already_resolved' | 'expired';
}

export class Round1Service {
  // Global Admin Settings
  private round1Status: 'not_started' | 'running' | 'paused' | 'completed' = 'running';
  private roundReleaseTimestamp: string | null = '2026-11-03T00:15:00.000Z';
  private durationMinutes = 22; // Default 22 minutes (admin configurable 20–25)
  private onScoreSync?: ScoreSyncCallback;

  setOnScoreSync(callback: ScoreSyncCallback): void {
    this.onScoreSync = callback;
  }

  // Stage 1 Configuration: The Pumpkin Shuffle — two trials (5 pumpkins / 40 CR, 7 pumpkins / 60 CR), 2 tries each
  private stage1Config: Stage1Config = {
    title: 'The Pumpkin Shuffle',
    description: 'A skull sleeps beneath one of the pumpkins. Watch it vanish, follow the shuffle, then smash the right pumpkin.',
    instructions: 'Two trials, two tries each. Trial I: five pumpkins, 40 Credits. Trial II: seven pumpkins, 60 Credits. The skull is shown once, then the pumpkins shuffle for 20 seconds.',
    rewardCredits: STAGE_CREDITS['stage-1'], // 100 in total
    isReadyForPublication: true,
    activityType: 'skull_pumpkin_shuffle',
    trials: DEFAULT_STAGE1_TRIALS.map((t) => ({ ...t })),
    revealSeconds: 3,
  };

  // Stage 2 Configuration: Haunted Image Hunt
  private stage2Config: Stage2Config = {
    title: 'The Haunted Image Hunt',
    description: 'Inspect scattered antique photographs to identify 12 occult Halloween relics.',
    rewardCredits: STAGE_CREDITS['stage-2'], // 150
    images: [...STAGE2_CANONICAL_IMAGES],
    targets: [...STAGE2_CANONICAL_TARGETS],
    hintDeduction: 15, // Configurable deduction for hint usage
    incorrectClickPenalty: 0, // Configurable deduction for wrong clicks (default 0)
  };

  // Stage 3 Configuration: The Forgotten Graveyard
  private stage3Config: Stage3Config = {
    title: 'The Forgotten Graveyard',
    description: 'Explore 3 open graves, arrange skeletal remains, decipher a buried diary, and align rune rings to escape.',
    rewardCredits: STAGE_CREDITS['stage-3'], // 250
    grave1: {
      clueFragment: 'THE',
      bones: [
        { id: 'bone_skull', name: 'Ancient Cranium', symbol: '💀', description: 'Carved with the Mark of the North.' },
        { id: 'bone_rib', name: 'Thoracic Ribcage', symbol: '🦴', description: 'Inscribed with cemetery wardings.' },
        { id: 'bone_femur', name: 'Grave Femur', symbol: '🦴', description: 'Heavy and cold as tomb stone.' },
      ],
      slots: [
        { slotId: 'slot_head', name: 'Apex Altar', acceptedBoneId: 'bone_skull', placedBoneId: null },
        { slotId: 'slot_chest', name: 'Center Sepulcher', acceptedBoneId: 'bone_rib', placedBoneId: null },
        { slotId: 'slot_legs', name: 'Base Pedestal', acceptedBoneId: 'bone_femur', placedBoneId: null },
      ],
      isCompleted: false,
    },
    grave2: {
      clueFragment: 'NIGHT',
      diaryExcerpt: 'Read the final digit of each marked year, from oldest to newest.',
      soilLocations: [
        { id: 'soil_1', name: 'Overgrown Mound', inscriptionYear: 1891, isDug: false },
        { id: 'soil_2', name: 'Crumbling Pedestal', inscriptionYear: 1904, isDug: false },
        { id: 'soil_3', name: 'Weeping Willow Roots', inscriptionYear: 1927, isDug: false },
      ],
      correctCode: '147', // Final digits of 1891, 1904, 1927 in chronological order
      isCompleted: false,
    },
    grave3: {
      clueFragment: 'RETURNS',
      ruleText: 'Align the celestial sequence: MOON → RAVEN → FLAME',
      runeRings: [
        { id: 'ring_1', name: 'Outer Ring', symbols: ['FLAME', 'MOON', 'RAVEN', 'SKULL'], selectedIndex: 0, correctSymbol: 'MOON' },
        { id: 'ring_2', name: 'Middle Ring', symbols: ['SKULL', 'FLAME', 'RAVEN', 'MOON'], selectedIndex: 0, correctSymbol: 'RAVEN' },
        { id: 'ring_3', name: 'Inner Ring', symbols: ['MOON', 'RAVEN', 'FLAME', 'SKULL'], selectedIndex: 0, correctSymbol: 'FLAME' },
      ],
      isCompleted: false,
    },
    finalGate: {
      acceptedAnswer: 'THE NIGHT RETURNS',
      isEscaped: false,
    },
    incorrectAnswerPenalty: 10, // Deduct 10 credits for incorrect final gate submissions
  };

  // In-Memory Team Game States (keyed by teamId)
  private teamStates: Map<string, Round1TeamSessionState> = new Map();

  // Load from persistent/session storage if available
  constructor() {
    this.hydrateFromStorage();
    this.initStorageListener();
  }

  private initStorageListener(): void {
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', (e) => {
        if (e.key === 'frost_cartel_round1_status' && e.newValue) {
          const s = e.newValue as 'not_started' | 'running' | 'paused' | 'completed';
          if (['not_started', 'running', 'paused', 'completed'].includes(s)) {
            this.round1Status = s;
          }
        }
        if (e.key === 'frost_cartel_round1_duration' && e.newValue) {
          const d = Number(e.newValue);
          if (d >= 20 && d <= 25) {
            this.durationMinutes = d;
          }
        }
        if (e.key === 'frost_cartel_round1_sessions') {
          this.hydrateFromStorage();
        }
      });
    }
  }

  private hydrateFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedStatus = window.localStorage.getItem('frost_cartel_round1_status');
        if (storedStatus && ['not_started', 'running', 'paused', 'completed'].includes(storedStatus)) {
          this.round1Status = storedStatus as 'not_started' | 'running' | 'paused' | 'completed';
        }
        const storedDuration = window.localStorage.getItem('frost_cartel_round1_duration');
        if (storedDuration) {
          const d = Number(storedDuration);
          if (d >= 20 && d <= 25) {
            this.durationMinutes = d;
          }
        }
      }

      let stored: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        stored = window.localStorage.getItem('frost_cartel_round1_sessions');
      }
      if (!stored && typeof window !== 'undefined' && window.sessionStorage) {
        stored = window.sessionStorage.getItem('frost_cartel_round1_sessions');
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        for (const [key, val] of Object.entries(parsed)) {
          this.teamStates.set(key, val as Round1TeamSessionState);
        }
      }
    } catch {
      // Ignore parse failure, use fresh state
    }
  }

  private persistToStorage(): void {
    try {
      const obj: Record<string, Round1TeamSessionState> = {};
      for (const [k, v] of this.teamStates.entries()) {
        obj[k] = v;
      }
      const serialized = JSON.stringify(obj);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('frost_cartel_round1_sessions', serialized);
      }
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('frost_cartel_round1_sessions', serialized);
      }
    } catch {
      // Storage unavailable or quota reached
    }
  }

  /**
   * Get or initialize session state for a squad.
   */
  getTeamSession(teamId: string, teamName: string): Round1TeamSessionState {
    let session = this.teamStates.get(teamId);
    // Sessions saved before Stage 1 was built still say "not configured" — open the stage for them.
    if (session && session.stages['stage-1'].status === 'not_configured' && this.stage1Config.isReadyForPublication) {
      session.stages['stage-1'].status = 'available';
      this.persistToStorage();
    }
    if (session) this.ensureStage1State(session);
    if (!session) {
      session = {
        teamId,
        teamName,
        status: 'waiting',
        currentStageId: 'dashboard',
        roundStartTime: null,
        roundDeadline: null,
        roundEndTime: null,
        totalDurationMinutes: this.durationMinutes,
        credits: 0,
        stages: {
          'stage-1': {
            stageId: 'stage-1',
            status: this.stage1Config.isReadyForPublication ? 'available' : 'not_configured',
            rewardCredits: 100,
            earnedCredits: 0,
            startTime: null,
            completionTime: null,
            activeTimeSeconds: 0,
          },
          'stage-2': {
            stageId: 'stage-2',
            status: 'available',
            rewardCredits: 150,
            earnedCredits: 0,
            startTime: null,
            completionTime: null,
            activeTimeSeconds: 0,
          },
          'stage-3': {
            stageId: 'stage-3',
            status: 'available',
            rewardCredits: 250,
            earnedCredits: 0,
            startTime: null,
            completionTime: null,
            activeTimeSeconds: 0,
          },
        },
        scoreTransactions: [],
        stage1State: this.freshStage1State(),
        stage2State: {
          foundTargetIds: [],
          usedHintsCount: 0,
        },
        stage3State: {
          placedBoneSlots: {},
          dugSoilIds: [],
          grave2CofferUnlocked: false,
          grave3RingIndices: [0, 0, 0],
          grave3Unlocked: false,
          collectedFragments: [],
          isGateUnlocked: false,
        },
        evidenceJournal: {
          grave1Fragment: null,
          grave2Fragment: null,
          grave3Fragment: null,
          notes: ['Evidence Journal initialized. Unearth relics to reveal gate passphrases.'],
          unlockedCodes: [],
        },
      };
      this.teamStates.set(teamId, session);
      this.persistToStorage();
    }
    return session;
  }

  /**
   * Team presses "BEGIN ROUND 1" or enters a stage to start their timer session.
   * If forceRenew is true, or if session was expired, or if timer has reached 0,
   * it renews the session deadline so the squad can play immediately.
   */
  beginRound1(teamId: string, teamName: string, forceRenew = false): Round1TeamSessionState {
    const session = this.getTeamSession(teamId, teamName);
    const remaining = this.getTimeRemainingSeconds(teamId);
    const isPastDeadline = !session.roundDeadline || remaining <= 0 || session.status === 'expired';

    if (forceRenew || !session.roundStartTime || isPastDeadline) {
      const now = new Date();
      session.roundStartTime = now.toISOString();
      const deadline = new Date(now.getTime() + this.durationMinutes * 60 * 1000);
      session.roundDeadline = deadline.toISOString();
      session.roundEndTime = null;
      session.status = 'active';

      this.persistToStorage();
    }
    return session;
  }

  /**
   * Reset / unseal Round 1 timer for a specific squad.
   */
  resetRound1ForTeam(teamId: string): Round1TeamSessionState | null {
    const session = this.teamStates.get(teamId);
    if (!session) return null;
    const now = new Date();
    session.roundStartTime = now.toISOString();
    session.roundDeadline = new Date(now.getTime() + this.durationMinutes * 60 * 1000).toISOString();
    session.roundEndTime = null;
    session.status = 'active';
    this.persistToStorage();
    return session;
  }

  resetTeamProgress(teamId: string): void {
    this.teamStates.delete(teamId);
    this.persistToStorage();
  }

  /**
   * Compute exact remaining time in seconds using timestamp-based deadlines.
   */
  getTimeRemainingSeconds(teamId: string): number {
    const session = this.teamStates.get(teamId);
    if (!session || !session.roundDeadline) {
      return this.durationMinutes * 60;
    }
    if (this.round1Status === 'paused' || session.status === 'paused') {
      // Return preserved active time
      const deadline = new Date(session.roundDeadline).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((deadline - now) / 1000));
    }
    if (session.status === 'completed' && session.roundEndTime) {
      return 0;
    }

    const deadline = new Date(session.roundDeadline).getTime();
    const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));

    // Auto-expire when timer concludes
    if (remaining === 0 && session.status === 'active') {
      session.status = 'expired';
      session.roundEndTime = new Date().toISOString();
      this.persistToStorage();
    }

    return remaining;
  }

  /**
   * Enter a stage.
   */
  enterStage(teamId: string, stageId: StageId): Round1TeamSessionState {
    const session = this.teamStates.get(teamId);
    if (!session) throw new Error(`Squad ${teamId} not found`);

    session.currentStageId = stageId;
    const stage = session.stages[stageId];
    if (stage.status === 'available') {
      stage.status = 'in_progress';
      if (!stage.startTime) {
        stage.startTime = new Date().toISOString();
      }
    }
    this.persistToStorage();
    return session;
  }

  /**
   * Skip a stage. Confirmed via modal.
   * Completing this stage awards its credits; skipping does NOT award credits.
   * Squad can return to the skipped stage anytime before the round deadline.
   */
  skipStage(teamId: string, stageId: StageId): Round1TeamSessionState {
    const session = this.teamStates.get(teamId);
    if (!session) throw new Error(`Squad ${teamId} not found`);

    const stage = session.stages[stageId];
    if (stage.status !== 'completed') {
      stage.status = 'skipped';
    }
    session.currentStageId = 'dashboard';
    this.persistToStorage();
    if (this.onScoreSync) {
      this.onScoreSync(
        teamId,
        session.credits,
        stageId,
        'skipped',
        `Admin/Squad skipped ${stageId.toUpperCase()}`
      );
    }
    return session;
  }

  /**
   * Complete a stage and award its fixed completion reward.
   * Idempotent: Can only award credits ONCE.
   */
  completeStage(teamId: string, stageId: StageId): { success: boolean; creditsAwarded: number } {
    const session = this.teamStates.get(teamId);
    if (!session) return { success: false, creditsAwarded: 0 };

    // Prevent scoring after timer has expired
    if (session.status === 'expired') {
      return { success: false, creditsAwarded: 0 };
    }

    const stage = session.stages[stageId];
    // Idempotent guard: Stage already completed
    if (stage.status === 'completed' && stage.earnedCredits > 0) {
      return { success: false, creditsAwarded: 0 };
    }

    const reward = STAGE_CREDITS[stageId];
    stage.status = 'completed';
    stage.earnedCredits = reward;
    stage.completionTime = new Date().toISOString();

    session.credits = Math.min(500, session.credits + reward);

    const tx: ScoreTransaction = {
      id: `tx_${Date.now()}_${stageId}`,
      teamId,
      stageId,
      type: 'stage_completion',
      deltaCredits: reward,
      balanceAfter: session.credits,
      reason: `Completed ${stageId.toUpperCase()} (${reward} Credits)`,
      timestamp: new Date().toISOString(),
    };
    session.scoreTransactions.push(tx);

    // Check if all configured stages are completed
    const allDone = Object.values(session.stages).every(
      (s) => s.status === 'completed' || s.status === 'not_configured'
    );
    if (allDone) {
      session.status = 'completed';
      session.roundEndTime = new Date().toISOString();
    }

    this.persistToStorage();
    if (this.onScoreSync) {
      this.onScoreSync(
        teamId,
        session.credits,
        stageId,
        'completed',
        `Completed ${stageId.toUpperCase()} (+${reward} CR)`
      );
    }
    return { success: true, creditsAwarded: reward };
  }

  // ---------------------------------------------------------------------------
  // Stage 1 — The Pumpkin Shuffle (two trials, limited tries, credits per trial)
  // ---------------------------------------------------------------------------

  getStage1Trials(): Stage1TrialConfig[] {
    return this.stage1Config.trials && this.stage1Config.trials.length > 0
      ? this.stage1Config.trials
      : DEFAULT_STAGE1_TRIALS;
  }

  private freshStage1State(): Stage1State {
    return {
      trials: this.getStage1Trials().map((): Stage1TrialState => ({ attemptsUsed: 0, status: 'pending', earnedCredits: 0 })),
    };
  }

  /** Sessions saved before the trials existed (or with a different number of trials) get a valid state. */
  private ensureStage1State(session: Round1TeamSessionState): Stage1State {
    const wanted = this.getStage1Trials().length;
    if (!session.stage1State || !Array.isArray(session.stage1State.trials)) {
      session.stage1State = this.freshStage1State();
      this.persistToStorage();
    } else if (session.stage1State.trials.length !== wanted) {
      const old = session.stage1State.trials;
      session.stage1State.trials = Array.from({ length: wanted }, (_, i) => old[i] ?? { attemptsUsed: 0, status: 'pending', earnedCredits: 0 });
      this.persistToStorage();
    }
    return session.stage1State;
  }

  getStage1State(teamId: string): Stage1State | null {
    const session = this.teamStates.get(teamId);
    return session ? this.ensureStage1State(session) : null;
  }

  /**
   * Called when a squad opens Stage 1. A trial whose last try was used but never answered
   * (tab closed mid-shuffle) counts as lost, so leaving can never refund a try.
   */
  settleAbandonedStage1(teamId: string): void {
    const session = this.teamStates.get(teamId);
    if (!session) return;
    const state = this.ensureStage1State(session);
    const trials = this.getStage1Trials();
    let changed = false;
    state.trials.forEach((t, i) => {
      if (t.status === 'pending' && t.attemptsUsed >= trials[i].tries) {
        t.status = 'lost';
        changed = true;
      }
    });
    if (changed) {
      this.finalizeStage1IfDone(session);
      this.persistToStorage();
    }
  }

  /** A try is spent the moment a round starts (when the skull is shown), not when the guess is made. */
  beginStage1Attempt(teamId: string, trialIndex: number): Stage1AttemptResult {
    const session = this.teamStates.get(teamId);
    if (!session) return { ok: false, reason: 'unknown_team' };
    const cfg = this.getStage1Trials()[trialIndex];
    if (!cfg) return { ok: false, reason: 'bad_trial' };
    const state = this.ensureStage1State(session);
    if (trialIndex > 0 && state.trials[trialIndex - 1].status === 'pending') return { ok: false, reason: 'locked' };
    const trial = state.trials[trialIndex];
    if (trial.status !== 'pending') return { ok: false, reason: 'resolved' };
    if (trial.attemptsUsed >= cfg.tries) return { ok: false, reason: 'no_tries' };
    const remaining = this.getTimeRemainingSeconds(teamId);
    if (session.status === 'expired' || remaining <= 0) return { ok: false, reason: 'expired' };

    trial.attemptsUsed += 1;
    const stage = session.stages['stage-1'];
    if (stage.status === 'available') {
      stage.status = 'in_progress';
      if (!stage.startTime) stage.startTime = new Date().toISOString();
    }
    this.persistToStorage();
    return { ok: true, attemptsUsed: trial.attemptsUsed };
  }

  /**
   * Close a trial. Won: awards that trial's credits (once). Lost: only allowed once every try is used.
   * When both trials are closed the stage is completed.
   */
  resolveStage1Trial(teamId: string, trialIndex: number, won: boolean): Stage1ResolveResult {
    const session = this.teamStates.get(teamId);
    if (!session) return { success: false, creditsAwarded: 0, stageFinished: false, reason: 'unknown_team' };
    const cfg = this.getStage1Trials()[trialIndex];
    if (!cfg) return { success: false, creditsAwarded: 0, stageFinished: false, reason: 'bad_trial' };
    const state = this.ensureStage1State(session);
    const trial = state.trials[trialIndex];
    if (trial.status !== 'pending') return { success: false, creditsAwarded: 0, stageFinished: false, reason: 'already_resolved' };
    if (trial.attemptsUsed < 1) return { success: false, creditsAwarded: 0, stageFinished: false, reason: 'not_started' };
    if (!won && trial.attemptsUsed < cfg.tries) return { success: false, creditsAwarded: 0, stageFinished: false, reason: 'tries_left' };
    this.getTimeRemainingSeconds(teamId); // lets the timer flag an expired round
    if (session.status === 'expired') return { success: false, creditsAwarded: 0, stageFinished: false, reason: 'expired' };

    const stage = session.stages['stage-1'];
    let awarded = 0;
    if (won) {
      awarded = cfg.reward;
      trial.status = 'won';
      trial.earnedCredits = awarded;
      stage.earnedCredits += awarded;
      session.credits = Math.min(500, session.credits + awarded);
      session.scoreTransactions.push({
        id: `tx_${Date.now()}_stage-1_t${trialIndex + 1}`,
        teamId,
        stageId: 'stage-1',
        type: 'stage_completion',
        deltaCredits: awarded,
        balanceAfter: session.credits,
        reason: `Stage 1 trial ${trialIndex + 1} solved in ${trial.attemptsUsed} ${trial.attemptsUsed === 1 ? 'try' : 'tries'} (${awarded} Credits)`,
        timestamp: new Date().toISOString(),
      });
    } else {
      trial.status = 'lost';
    }

    const stageFinished = this.finalizeStage1IfDone(session);
    this.persistToStorage();
    if (this.onScoreSync && (awarded > 0 || stageFinished)) {
      this.onScoreSync(
        teamId,
        session.credits,
        'stage-1',
        stageFinished ? 'completed' : 'in_progress',
        won ? `Stage 1 trial ${trialIndex + 1} solved (+${awarded} CR)` : `Stage 1 trial ${trialIndex + 1} failed`
      );
    }
    return { success: true, creditsAwarded: awarded, stageFinished };
  }

  /** Marks Stage 1 completed once no trial is pending. Returns true when it is finished. */
  private finalizeStage1IfDone(session: Round1TeamSessionState): boolean {
    const state = this.ensureStage1State(session);
    if (state.trials.some((t) => t.status === 'pending')) return false;
    const stage = session.stages['stage-1'];
    if (stage.status !== 'completed') {
      stage.status = 'completed';
      stage.completionTime = new Date().toISOString();
    }
    const allDone = Object.values(session.stages).every((s) => s.status === 'completed' || s.status === 'not_configured');
    if (allDone) {
      session.status = 'completed';
      session.roundEndTime = new Date().toISOString();
    }
    return true;
  }

  /**
   * Use a hint (deducts credits if configured by admin).
   */
  useHint(teamId: string, stageId: StageId, hintLabel: string): { deduction: number } {
    const session = this.teamStates.get(teamId);
    if (!session) return { deduction: 0 };

    const deduction = stageId === 'stage-2' ? this.stage2Config.hintDeduction : 0;
    if (deduction > 0) {
      session.credits = Math.max(0, session.credits - deduction);
      const tx: ScoreTransaction = {
        id: `tx_hint_${Date.now()}`,
        teamId,
        stageId,
        type: 'hint_deduction',
        deltaCredits: -deduction,
        balanceAfter: session.credits,
        reason: `Hint requested: ${hintLabel} (-${deduction} CR)`,
        timestamp: new Date().toISOString(),
      };
      session.scoreTransactions.push(tx);
    }

    if (stageId === 'stage-2') {
      session.stage2State.usedHintsCount++;
    }
    this.persistToStorage();
    if (this.onScoreSync && deduction > 0) {
      this.onScoreSync(
        teamId,
        session.credits,
        stageId,
        'in_progress',
        `Hint requested: ${hintLabel} (-${deduction} CR)`
      );
    }
    return { deduction };
  }

  /**
   * Record penalty for incorrect answer attempt (if configured by admin).
   */
  recordPenalty(teamId: string, stageId: StageId, reason: string): { penalty: number } {
    const session = this.teamStates.get(teamId);
    if (!session) return { penalty: 0 };

    const penalty =
      stageId === 'stage-2'
        ? this.stage2Config.incorrectClickPenalty
        : this.stage3Config.incorrectAnswerPenalty;

    if (penalty > 0) {
      session.credits = Math.max(0, session.credits - penalty);
      const tx: ScoreTransaction = {
        id: `tx_pen_${Date.now()}`,
        teamId,
        stageId,
        type: 'penalty_deduction',
        deltaCredits: -penalty,
        balanceAfter: session.credits,
        reason: `${reason} (-${penalty} CR)`,
        timestamp: new Date().toISOString(),
      };
      session.scoreTransactions.push(tx);
      this.persistToStorage();
      if (this.onScoreSync) {
        this.onScoreSync(
          teamId,
          session.credits,
          stageId,
          'in_progress',
          `${reason} (-${penalty} CR)`
        );
      }
    }

    return { penalty };
  }

  // Stage 2: Register discovered target item
  registerStage2Discovery(
    teamId: string,
    targetId: string,
    _imageId: string
  ): { isNew: boolean; totalFound: number; completed: boolean } {
    const session = this.teamStates.get(teamId);
    if (!session) return { isNew: false, totalFound: 0, completed: false };

    if (session.stage2State.foundTargetIds.includes(targetId)) {
      return {
        isNew: false,
        totalFound: session.stage2State.foundTargetIds.length,
        completed: false,
      };
    }

    session.stage2State.foundTargetIds.push(targetId);
    const totalFound = session.stage2State.foundTargetIds.length;
    const targetCount = this.stage2Config.targets.length;
    const completed = totalFound >= targetCount;

    if (completed) {
      this.completeStage(teamId, 'stage-2');
    }

    this.persistToStorage();
    return { isNew: true, totalFound, completed };
  }

  // Stage 3: Grave 1 Bone Placement
  placeBone(teamId: string, slotId: string, boneId: string): { allPlaced: boolean } {
    const session = this.teamStates.get(teamId);
    if (!session) return { allPlaced: false };

    session.stage3State.placedBoneSlots[slotId] = boneId;

    // Check if all 3 correct bones placed
    const isSlotHead = session.stage3State.placedBoneSlots['slot_head'] === 'bone_skull';
    const isSlotChest = session.stage3State.placedBoneSlots['slot_chest'] === 'bone_rib';
    const isSlotLegs = session.stage3State.placedBoneSlots['slot_legs'] === 'bone_femur';

    const allPlaced = isSlotHead && isSlotChest && isSlotLegs;
    if (allPlaced && !session.stage3State.collectedFragments.includes('THE')) {
      session.stage3State.collectedFragments.push('THE');
      session.evidenceJournal.grave1Fragment = 'THE';
      session.evidenceJournal.notes.push('Grave 1: Ancestral skeleton reassembled. Parchment unsealed: "THE"');
    }

    this.persistToStorage();
    return { allPlaced };
  }

  // Stage 3: Grave 2 Digging & Coffer Code Unlock
  digSoil(teamId: string, soilId: string): { year: number } {
    const session = this.teamStates.get(teamId);
    if (!session) return { year: 1900 };

    if (!session.stage3State.dugSoilIds.includes(soilId)) {
      session.stage3State.dugSoilIds.push(soilId);
    }
    const soil = this.stage3Config.grave2.soilLocations.find((s) => s.id === soilId);
    const year = soil?.inscriptionYear ?? 1900;
    session.evidenceJournal.notes.push(`Grave 2: Unearthed marker with inscription year: ${year}`);
    this.persistToStorage();
    return { year };
  }

  unlockGrave2Coffer(teamId: string, enteredCode: string): { success: boolean } {
    const session = this.teamStates.get(teamId);
    if (!session) return { success: false };

    const correct = this.stage3Config.grave2.correctCode.trim();
    if (enteredCode.trim() === correct) {
      session.stage3State.grave2CofferUnlocked = true;
      if (!session.stage3State.collectedFragments.includes('NIGHT')) {
        session.stage3State.collectedFragments.push('NIGHT');
        session.evidenceJournal.grave2Fragment = 'NIGHT';
        session.evidenceJournal.unlockedCodes.push(`Coffer Key: ${correct}`);
        session.evidenceJournal.notes.push('Grave 2: Lock tumblers released. Parchment unsealed: "NIGHT"');
      }
      this.persistToStorage();
      return { success: true };
    }

    this.recordPenalty(teamId, 'stage-3', 'Incorrect coffer combination attempt');
    return { success: false };
  }

  // Stage 3: Grave 3 Rune Rings Rotation
  rotateRuneRing(teamId: string, ringIndex: number, direction: 'cw' | 'ccw'): {
    currentSymbol: string;
    isCorrectSequence: boolean;
  } {
    const session = this.teamStates.get(teamId);
    if (!session) return { currentSymbol: '', isCorrectSequence: false };

    const ring = this.stage3Config.grave3.runeRings[ringIndex];
    let curr = session.stage3State.grave3RingIndices[ringIndex];
    if (direction === 'cw') {
      curr = (curr + 1) % ring.symbols.length;
    } else {
      curr = (curr - 1 + ring.symbols.length) % ring.symbols.length;
    }
    session.stage3State.grave3RingIndices[ringIndex] = curr;

    const ring1Symbol = this.stage3Config.grave3.runeRings[0].symbols[session.stage3State.grave3RingIndices[0]];
    const ring2Symbol = this.stage3Config.grave3.runeRings[1].symbols[session.stage3State.grave3RingIndices[1]];
    const ring3Symbol = this.stage3Config.grave3.runeRings[2].symbols[session.stage3State.grave3RingIndices[2]];

    const isCorrect = ring1Symbol === 'MOON' && ring2Symbol === 'RAVEN' && ring3Symbol === 'FLAME';
    if (isCorrect && !session.stage3State.collectedFragments.includes('RETURNS')) {
      session.stage3State.grave3Unlocked = true;
      session.stage3State.collectedFragments.push('RETURNS');
      session.evidenceJournal.grave3Fragment = 'RETURNS';
      session.evidenceJournal.notes.push('Grave 3: Celestial runes aligned. Secret chamber unsealed: "RETURNS"');
    }

    this.persistToStorage();
    return { currentSymbol: ring.symbols[curr], isCorrectSequence: isCorrect };
  }

  // Stage 3: Final Answer Submission
  submitFinalEscapeAnswer(teamId: string, answer: string): { success: boolean; message: string } {
    const session = this.teamStates.get(teamId);
    if (!session) return { success: false, message: 'Squad session invalid.' };

    const normalized = answer.trim().toUpperCase().replace(/\s+/g, ' ');
    const expected = this.stage3Config.finalGate.acceptedAnswer.trim().toUpperCase().replace(/\s+/g, ' ');

    if (normalized === expected) {
      session.stage3State.isGateUnlocked = true;
      this.completeStage(teamId, 'stage-3');
      this.persistToStorage();
      return { success: true, message: 'THE ARCH-LICH GATE SHATTERS. SQUAD ESCAPE SUCCESSFUL!' };
    }

    this.recordPenalty(teamId, 'stage-3', `Incorrect gate cipher attempt "${answer}"`);
    return { success: false, message: 'The ancient runes reject your phrase. The gate remains sealed.' };
  }

  // Admin Getters & Configuration Setters
  getRound1Status(): 'not_started' | 'running' | 'paused' | 'completed' {
    return this.round1Status;
  }

  setRound1Status(status: 'not_started' | 'running' | 'paused' | 'completed'): void {
    this.round1Status = status;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('frost_cartel_round1_status', status);
      }
    } catch {
      // Storage access blocked or quota exceeded
    }

    if (status === 'running') {
      if (!this.roundReleaseTimestamp) {
        this.roundReleaseTimestamp = new Date().toISOString();
      }
      // When round is started or active, unseal and renew waiting or expired squad sessions
      for (const session of this.teamStates.values()) {
        const remaining = this.getTimeRemainingSeconds(session.teamId);
        if (session.status === 'waiting' || session.status === 'expired' || remaining <= 0) {
          const now = new Date();
          session.roundStartTime = now.toISOString();
          session.roundDeadline = new Date(now.getTime() + this.durationMinutes * 60 * 1000).toISOString();
          session.roundEndTime = null;
          session.status = 'active';
        }
      }
      this.persistToStorage();
    }
  }

  getDurationMinutes(): number {
    return this.durationMinutes;
  }

  setDurationMinutes(minutes: number): void {
    if (minutes >= 20 && minutes <= 25) {
      this.durationMinutes = minutes;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('frost_cartel_round1_duration', String(minutes));
        }
      } catch {
        // Storage access blocked or quota exceeded
      }
      for (const session of this.teamStates.values()) {
        session.totalDurationMinutes = minutes;
        if (session.status === 'active' && session.roundStartTime) {
          const startMs = new Date(session.roundStartTime).getTime();
          session.roundDeadline = new Date(startMs + minutes * 60 * 1000).toISOString();
        }
      }
      this.persistToStorage();
    }
  }

  getStage1Config(): Stage1Config {
    return this.stage1Config;
  }

  updateStage1Config(updates: Partial<Stage1Config>): void {
    this.stage1Config = { ...this.stage1Config, ...updates };
  }

  getStage2Config(): Stage2Config {
    return this.stage2Config;
  }

  updateStage2Config(updates: Partial<Stage2Config>): void {
    this.stage2Config = { ...this.stage2Config, ...updates };
  }

  getStage3Config(): Stage3Config {
    return this.stage3Config;
  }

  updateStage3Config(updates: Partial<Stage3Config>): void {
    this.stage3Config = { ...this.stage3Config, ...updates };
  }

  getAllSquadSessions(): Round1TeamSessionState[] {
    return Array.from(this.teamStates.values());
  }
}

export const round1Service = new Round1Service();
