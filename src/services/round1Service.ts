import type { StageId } from '../types/round.types';
import type {
  HuntImage,
  Round1TeamSessionState,
  ScoreTransaction,
  Stage1Config,
  Stage2Config,
  Stage3Config,
} from '../types/round1.types';
import { STAGE_CREDITS } from '../constants/credits.constants';

export type ScoreSyncCallback = (
  teamId: string,
  credits: number,
  stageId?: StageId,
  stageStatus?: 'completed' | 'skipped' | 'in_progress',
  activityDesc?: string
) => void;

// Initial 8 Configured Illustrated Horror Scenes for Stage 2 Haunted Image Hunt
const INITIAL_HUNT_IMAGES: HuntImage[] = [
  {
    id: 'img_01',
    title: 'The Ancestral Study',
    imageUrl: '/assets/stage-2/photographs/moonlit-cemetery.jpg',
    orientationDeg: -4,
    description: 'A shadowy cemetery at midnight littered with weathered tombstones and a carved pumpkin.',
    hotspots: [
      { id: 'hs_01', name: 'Carved Jack-o\'-Lantern', targetId: 'target_pumpkin', xPercent: 16, yPercent: 76, widthPercent: 14, heightPercent: 16 },
    ],
  },
  {
    id: 'img_02',
    title: 'The Alchemist\'s Crypt',
    imageUrl: '/assets/stage-2/photographs/witches-laboratory.jpg',
    orientationDeg: 2,
    description: 'Stone shelves holding occult concoctions, bubbling cauldrons, and venom potion bottles.',
    hotspots: [
      { id: 'hs_05', name: 'Venom Potion Bottle', targetId: 'target_potion', xPercent: 68, yPercent: 68, widthPercent: 10, heightPercent: 14 },
    ],
  },
  {
    id: 'img_03',
    title: 'The Mausoleum Vault',
    imageUrl: '/assets/stage-2/photographs/ancient-crypt.jpg',
    orientationDeg: -1.5,
    description: 'An ancient resting place holding an ornate stone coffin and an ancestral skull.',
    hotspots: [
      { id: 'hs_02', name: 'Ancestral Skull', targetId: 'target_skull', xPercent: 28, yPercent: 44, widthPercent: 10, heightPercent: 12 },
      { id: 'hs_07', name: 'Carved Coffin', targetId: 'target_coffin', xPercent: 50, yPercent: 62, widthPercent: 24, heightPercent: 24 },
    ],
  },
  {
    id: 'img_04',
    title: 'The Witch\'s Belfry',
    imageUrl: '/assets/stage-2/photographs/gothic-chapel.jpg',
    orientationDeg: 3,
    description: 'Moonlit chapel rafters where bats roost and ritual altar candles flicker.',
    hotspots: [
      { id: 'hs_04', name: 'Nocturnal Bat', targetId: 'target_bat', xPercent: 74, yPercent: 16, widthPercent: 10, heightPercent: 10 },
      { id: 'hs_09', name: 'Candle of the Dead', targetId: 'target_candle', xPercent: 46, yPercent: 62, widthPercent: 8, heightPercent: 15 },
    ],
  },
  {
    id: 'img_05',
    title: 'The Haunted Mansion',
    imageUrl: '/assets/stage-2/photographs/haunted-mansion.jpg',
    orientationDeg: -2.5,
    description: 'A grand decaying foyer with cobwebs draping the arches and a floating ghost apparition.',
    hotspots: [
      { id: 'hs_11', name: 'Pale Ghost Apparition', targetId: 'target_ghost', xPercent: 35, yPercent: 46, widthPercent: 14, heightPercent: 22 },
      { id: 'hs_03', name: 'Woven Cobweb', targetId: 'target_web', xPercent: 82, yPercent: 8, widthPercent: 14, heightPercent: 16 },
    ],
  },
  {
    id: 'img_06',
    title: 'The Cursed Attic',
    imageUrl: '/assets/stage-2/photographs/cursed-attic.jpg',
    orientationDeg: 1.5,
    description: 'Dusty storage trunks holding a pointed witch hat, forgotten dolls, and a crawling spider.',
    hotspots: [
      { id: 'hs_10', name: 'Pointed Witch Hat', targetId: 'target_witch_hat', xPercent: 48, yPercent: 64, widthPercent: 12, heightPercent: 14 },
      { id: 'hs_06', name: 'Crawling Arachnid', targetId: 'target_spider', xPercent: 68, yPercent: 24, widthPercent: 8, heightPercent: 9 },
    ],
  },
  {
    id: 'img_07',
    title: 'The Haunted Village',
    imageUrl: '/assets/stage-2/photographs/haunted-village.jpg',
    orientationDeg: -3,
    description: 'A rain-slicked cobblestone street where a black cat prowls in the moonlight.',
    hotspots: [
      { id: 'hs_12', name: 'Obsidian Black Cat', targetId: 'target_black_cat', xPercent: 42, yPercent: 68, widthPercent: 10, heightPercent: 12 },
    ],
  },
  {
    id: 'img_08',
    title: 'The Forest Bridge',
    imageUrl: '/assets/stage-2/photographs/forest-bridge.jpg',
    orientationDeg: 2.5,
    description: 'An ancient mossy stone bridge hiding an iron skeleton key beside an ominous lantern.',
    hotspots: [
      { id: 'hs_08', name: 'Ornate Skeleton Key', targetId: 'target_key', xPercent: 58, yPercent: 72, widthPercent: 9, heightPercent: 12 },
    ],
  },
];

// Initial 12 Configured Halloween Targets
const INITIAL_TARGET_ITEMS = [
  { id: 'target_pumpkin', name: 'Pumpkin', icon: '🎃', isFound: false },
  { id: 'target_skull', name: 'Skull', icon: '💀', isFound: false },
  { id: 'target_ghost', name: 'Ghost', icon: '👻', isFound: false },
  { id: 'target_bat', name: 'Bat', icon: '🦇', isFound: false },
  { id: 'target_witch_hat', name: 'Witch Hat', icon: '🧙‍♀️', isFound: false },
  { id: 'target_spider', name: 'Spider', icon: '🕷️', isFound: false },
  { id: 'target_web', name: 'Spider Web', icon: '🕸️', isFound: false },
  { id: 'target_coffin', name: 'Coffin', icon: '⚰️', isFound: false },
  { id: 'target_black_cat', name: 'Black Cat', icon: '🐈‍⬛', isFound: false },
  { id: 'target_potion', name: 'Potion Bottle', icon: '🧪', isFound: false },
  { id: 'target_candle', name: 'Candle', icon: '🕯️', isFound: false },
  { id: 'target_key', name: 'Skeleton Key', icon: '🗝️', isFound: false },
];

export class Round1Service {
  // Global Admin Settings
  private round1Status: 'not_started' | 'running' | 'paused' | 'completed' = 'running';
  private roundReleaseTimestamp: string | null = '2026-11-03T00:15:00.000Z';
  private durationMinutes = 22; // Default 22 minutes (admin configurable 20–25)
  private onScoreSync?: ScoreSyncCallback;

  setOnScoreSync(callback: ScoreSyncCallback): void {
    this.onScoreSync = callback;
  }

  // Stage 1 Configuration Framework (Pending puzzle integration)
  private stage1Config: Stage1Config = {
    title: 'The Unknown Challenge',
    description: 'Central organizers are finalizing the dark rites for this chamber.',
    instructions: 'Prepare your squad operatives. When unsealed by central command, this chamber will award 100 Credits.',
    rewardCredits: STAGE_CREDITS['stage-1'], // 100
    isReadyForPublication: false, // Rule: cannot be marked ready until challenge finalized
    activityType: 'challenge_pending',
  };

  // Stage 2 Configuration: Haunted Image Hunt
  private stage2Config: Stage2Config = {
    title: 'The Haunted Image Hunt',
    description: 'Inspect scattered antique photographs to identify 12 occult Halloween relics.',
    rewardCredits: STAGE_CREDITS['stage-2'], // 150
    images: [...INITIAL_HUNT_IMAGES],
    targets: [...INITIAL_TARGET_ITEMS],
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
