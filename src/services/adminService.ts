import type {
  AdminTeam,
  DashboardMetrics,
  Round1Status,
  StageId,
  StageRecord,
  StageStatus,
  TeamStatus,
} from '../types/admin';
import { STAGE_CREDITS, STAGE_NAMES } from '../types/admin';
import { round1Service } from './round1Service';

/**
 * Admin Service & Team Repository for Frost Cartel.
 *
 * MOCK REPOSITORY ACTIVE (Database integration ready)
 * This service implements the central administrative contracts.
 * When the database backend is deployed, these methods can map directly to
 * REST / GraphQL / Supabase RPC endpoints.
 */

function createInitialStageRecords(): Record<StageId, StageRecord> {
  return {
    'stage-1': {
      stageId: 'stage-1',
      name: STAGE_NAMES['stage-1'],
      rewardCredits: STAGE_CREDITS['stage-1'],
      earnedCredits: 0,
      status: 'not_started',
      startTime: null,
      endTime: null,
    },
    'stage-2': {
      stageId: 'stage-2',
      name: STAGE_NAMES['stage-2'],
      rewardCredits: STAGE_CREDITS['stage-2'],
      earnedCredits: 0,
      status: 'not_started',
      startTime: null,
      endTime: null,
    },
    'stage-3': {
      stageId: 'stage-3',
      name: STAGE_NAMES['stage-3'],
      rewardCredits: STAGE_CREDITS['stage-3'],
      earnedCredits: 0,
      status: 'not_started',
      startTime: null,
      endTime: null,
    },
  };
}

// Initial seed teams representing an active event roster (ready to scale to 70+ teams)
const INITIAL_TEAMS: AdminTeam[] = [
  {
    id: 'fc_team_001',
    name: 'Phantom Crypt',
    passwordHash: '••••••••••••',
    status: 'active',
    currentRound: 'Round 1',
    currentStage: 'stage-2',
    roundStartTime: '2026-11-03T00:15:00.000Z',
    roundEndTime: null,
    stageStartTime: '2026-11-03T00:22:15.000Z',
    credits: 100,
    stages: {
      'stage-1': {
        stageId: 'stage-1',
        name: STAGE_NAMES['stage-1'],
        rewardCredits: 100,
        earnedCredits: 100,
        status: 'completed',
        startTime: '2026-11-03T00:15:10.000Z',
        endTime: '2026-11-03T00:21:50.000Z',
      },
      'stage-2': {
        stageId: 'stage-2',
        name: STAGE_NAMES['stage-2'],
        rewardCredits: 150,
        earnedCredits: 0,
        status: 'in_progress',
        startTime: '2026-11-03T00:22:15.000Z',
        endTime: null,
      },
      'stage-3': {
        stageId: 'stage-3',
        name: STAGE_NAMES['stage-3'],
        rewardCredits: 250,
        earnedCredits: 0,
        status: 'not_started',
        startTime: null,
        endTime: null,
      },
    },
    activityHistory: [
      {
        id: 'act_001',
        teamId: 'fc_team_001',
        type: 'login',
        description: 'Squad operatives authenticated at workstation pod #04',
        timestamp: '2026-11-03T00:14:20.000Z',
      },
      {
        id: 'act_002',
        teamId: 'fc_team_001',
        type: 'round_start',
        description: 'Entered Round 1: The Graveyard Escape',
        timestamp: '2026-11-03T00:15:00.000Z',
      },
      {
        id: 'act_003',
        teamId: 'fc_team_001',
        type: 'stage_completion',
        description: 'Completed Stage 1: The Crypt Chamber (+100 credits)',
        timestamp: '2026-11-03T00:21:50.000Z',
      },
    ],
    createdAt: '2026-11-02T22:30:00.000Z',
  },
  {
    id: 'fc_team_002',
    name: 'Wraith Syndicate',
    passwordHash: '••••••••••••',
    status: 'active',
    currentRound: 'Round 1',
    currentStage: 'stage-3',
    roundStartTime: '2026-11-03T00:15:00.000Z',
    roundEndTime: null,
    stageStartTime: '2026-11-03T00:28:10.000Z',
    credits: 250,
    stages: {
      'stage-1': {
        stageId: 'stage-1',
        name: STAGE_NAMES['stage-1'],
        rewardCredits: 100,
        earnedCredits: 100,
        status: 'completed',
        startTime: '2026-11-03T00:15:15.000Z',
        endTime: '2026-11-03T00:20:05.000Z',
      },
      'stage-2': {
        stageId: 'stage-2',
        name: STAGE_NAMES['stage-2'],
        rewardCredits: 150,
        earnedCredits: 150,
        status: 'completed',
        startTime: '2026-11-03T00:20:20.000Z',
        endTime: '2026-11-03T00:28:00.000Z',
      },
      'stage-3': {
        stageId: 'stage-3',
        name: STAGE_NAMES['stage-3'],
        rewardCredits: 250,
        earnedCredits: 0,
        status: 'in_progress',
        startTime: '2026-11-03T00:28:10.000Z',
        endTime: null,
      },
    },
    activityHistory: [
      {
        id: 'act_004',
        teamId: 'fc_team_002',
        type: 'login',
        description: 'Squad operatives authenticated at workstation pod #12',
        timestamp: '2026-11-03T00:13:50.000Z',
      },
      {
        id: 'act_005',
        teamId: 'fc_team_002',
        type: 'stage_completion',
        description: 'Completed Stage 1 (+100 credits)',
        timestamp: '2026-11-03T00:20:05.000Z',
      },
      {
        id: 'act_006',
        teamId: 'fc_team_002',
        type: 'stage_completion',
        description: 'Completed Stage 2 (+150 credits)',
        timestamp: '2026-11-03T00:28:00.000Z',
      },
    ],
    createdAt: '2026-11-02T22:31:00.000Z',
  },
  {
    id: 'fc_team_003',
    name: 'Midnight Coven',
    passwordHash: '••••••••••••',
    status: 'completed',
    currentRound: 'Round 1',
    currentStage: 'staged',
    roundStartTime: '2026-11-03T00:15:00.000Z',
    roundEndTime: '2026-11-03T00:36:45.000Z',
    stageStartTime: null,
    credits: 500,
    stages: {
      'stage-1': {
        stageId: 'stage-1',
        name: STAGE_NAMES['stage-1'],
        rewardCredits: 100,
        earnedCredits: 100,
        status: 'completed',
        startTime: '2026-11-03T00:15:10.000Z',
        endTime: '2026-11-03T00:21:10.000Z',
      },
      'stage-2': {
        stageId: 'stage-2',
        name: STAGE_NAMES['stage-2'],
        rewardCredits: 150,
        earnedCredits: 150,
        status: 'completed',
        startTime: '2026-11-03T00:21:25.000Z',
        endTime: '2026-11-03T00:29:40.000Z',
      },
      'stage-3': {
        stageId: 'stage-3',
        name: STAGE_NAMES['stage-3'],
        rewardCredits: 250,
        earnedCredits: 250,
        status: 'completed',
        startTime: '2026-11-03T00:29:50.000Z',
        endTime: '2026-11-03T00:36:45.000Z',
      },
    },
    activityHistory: [
      {
        id: 'act_007',
        teamId: 'fc_team_003',
        type: 'round_completion',
        description: 'Successfully escaped Graveyard with maximum 500 credits',
        timestamp: '2026-11-03T00:36:45.000Z',
      },
    ],
    createdAt: '2026-11-02T22:32:00.000Z',
  },
  {
    id: 'fc_team_004',
    name: 'Obsidian Gate',
    passwordHash: '••••••••••••',
    status: 'paused',
    currentRound: 'Round 1',
    currentStage: 'stage-1',
    roundStartTime: '2026-11-03T00:15:00.000Z',
    roundEndTime: null,
    stageStartTime: '2026-11-03T00:16:00.000Z',
    credits: 0,
    stages: createInitialStageRecords(),
    activityHistory: [
      {
        id: 'act_008',
        teamId: 'fc_team_004',
        type: 'login',
        description: 'Squad session initialized',
        timestamp: '2026-11-03T00:14:00.000Z',
      },
    ],
    createdAt: '2026-11-02T22:33:00.000Z',
  },
  {
    id: 'fc_team_005',
    name: 'Frost Reapers',
    passwordHash: '••••••••••••',
    status: 'waiting',
    currentRound: 'Round 1',
    currentStage: 'staged',
    roundStartTime: null,
    roundEndTime: null,
    stageStartTime: null,
    credits: 0,
    stages: createInitialStageRecords(),
    activityHistory: [],
    createdAt: '2026-11-02T22:34:00.000Z',
  },
  {
    id: 'fc_team_006',
    name: 'Grim Sentinels',
    passwordHash: '••••••••••••',
    status: 'waiting',
    currentRound: 'Round 1',
    currentStage: 'staged',
    roundStartTime: null,
    roundEndTime: null,
    stageStartTime: null,
    credits: 0,
    stages: createInitialStageRecords(),
    activityHistory: [],
    createdAt: '2026-11-02T22:35:00.000Z',
  },
  {
    id: 'fc_team_007',
    name: 'Shadow Legion',
    passwordHash: '••••••••••••',
    status: 'waiting',
    currentRound: 'Round 1',
    currentStage: 'staged',
    roundStartTime: null,
    roundEndTime: null,
    stageStartTime: null,
    credits: 0,
    stages: createInitialStageRecords(),
    activityHistory: [],
    createdAt: '2026-11-02T22:36:00.000Z',
  },
];

class AdminService {
  private readonly storageKey = 'frost_cartel_admin_teams';
  private teams: AdminTeam[] = this.loadTeams();
  private round1Status: Round1Status = 'running';

  private loadTeams(): AdminTeam[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Fallback to initial seeds
      }
    }
    return [...INITIAL_TEAMS];
  }

  private saveTeams(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.teams));
      } catch {
        // Fallback
      }
    }
  }

  /**
   * Reset team roster to defaults (useful for test isolation and event reset).
   */
  resetToDefaults(): void {
    this.teams = [...INITIAL_TEAMS];
    this.saveTeams();
  }

  /**
   * Get overarching telemetry and summary metrics for the Admin Dashboard.
   */
  getDashboardMetrics(): DashboardMetrics {
    const totalTeams = this.teams.length;
    let waitingTeams = 0;
    let activeTeams = 0;
    let completedTeams = 0;
    let pausedTeams = 0;

    for (const team of this.teams) {
      switch (team.status) {
        case 'waiting':
          waitingTeams++;
          break;
        case 'active':
          activeTeams++;
          break;
        case 'completed':
          completedTeams++;
          break;
        case 'paused':
          pausedTeams++;
          break;
      }
    }

    return {
      totalTeams,
      waitingTeams,
      activeTeams,
      completedTeams,
      pausedTeams,
      round1Status: this.round1Status,
      totalActiveSessions: activeTeams + pausedTeams,
    };
  }

  /**
   * Get current Round 1 global state.
   */
  getRound1Status(): Round1Status {
    return this.round1Status;
  }

  /**
   * Admin global round controls (Start, Pause, Resume, End).
   */
  updateRound1Status(newStatus: Round1Status): { success: boolean; message: string } {
    this.round1Status = newStatus;
    round1Service.setRound1Status(newStatus);
    const now = new Date().toISOString();

    if (newStatus === 'running') {
      // Transition waiting teams to active with round start timestamp
      for (const team of this.teams) {
        if (team.status === 'waiting') {
          team.status = 'active';
          team.roundStartTime = team.roundStartTime || now;
          team.currentStage = 'stage-1';
          team.stageStartTime = now;
          team.activityHistory.unshift({
            id: `act_${crypto.randomUUID().substring(0, 8)}`,
            teamId: team.id,
            type: 'round_start',
            description: 'Round 1 officially commenced by Tournament Administrator',
            timestamp: now,
          });
        } else if (team.status === 'paused') {
          team.status = 'active';
        }
      }
    } else if (newStatus === 'paused') {
      // Pause all currently active teams
      for (const team of this.teams) {
        if (team.status === 'active') {
          team.status = 'paused';
          team.activityHistory.unshift({
            id: `act_${crypto.randomUUID().substring(0, 8)}`,
            teamId: team.id,
            type: 'admin_movement',
            description: 'Gameplay paused globally by Tournament Administrator',
            timestamp: now,
          });
        }
      }
    } else if (newStatus === 'completed') {
      // Conclude round for all active/paused teams
      for (const team of this.teams) {
        if (team.status === 'active' || team.status === 'paused') {
          team.status = 'completed';
          team.roundEndTime = team.roundEndTime || now;
          team.activityHistory.unshift({
            id: `act_${crypto.randomUUID().substring(0, 8)}`,
            teamId: team.id,
            type: 'round_completion',
            description: 'Round 1 ended globally by Tournament Administrator',
            timestamp: now,
          });
        }
      }
    }

    this.saveTeams();

    return {
      success: true,
      message: `Round 1 status updated to: ${newStatus.toUpperCase()}`,
    };
  }

  /**
   * Get all teams with filtering and pagination.
   */
  getTeams(
    search = '',
    statusFilter = 'all',
    page = 1,
    pageSize = 10
  ): { teams: AdminTeam[]; totalCount: number; totalPages: number } {
    const trimmedSearch = search.trim().toLowerCase();

    const filtered = this.teams.filter((team) => {
      const matchesSearch =
        !trimmedSearch || team.name.toLowerCase().includes(trimmedSearch);
      const matchesStatus =
        statusFilter === 'all' || team.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return {
      teams: paginated,
      totalCount,
      totalPages,
    };
  }

  /**
   * Find single team by unique ID.
   */
  getTeamById(teamId: string): AdminTeam | null {
    const team = this.teams.find((t) => t.id === teamId);
    return team ? { ...team } : null;
  }

  /**
   * Create a team manually with organizer-chosen credentials.
   * Enforces name uniqueness and non-plaintext storage.
   */
  createTeam(name: string, password: string): { success: boolean; message: string; team?: AdminTeam } {
    const trimmedName = name.trim();
    const trimmedPass = password.trim();

    if (!trimmedName) {
      return { success: false, message: 'Team name is required.' };
    }
    if (!trimmedPass) {
      return { success: false, message: 'Password is required.' };
    }

    const exists = this.teams.some(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      return {
        success: false,
        message: `Team name "${trimmedName}" already exists. Team names must be unique.`,
      };
    }

    const now = new Date().toISOString();
    const newTeam: AdminTeam = {
      id: `fc_team_${crypto.randomUUID().replaceAll('-', '').substring(0, 8)}`,
      name: trimmedName,
      passwordHash: '••••••••••••', // Masked, never stored in plaintext
      status: this.round1Status === 'running' ? 'active' : 'waiting',
      currentRound: 'Round 1',
      currentStage: this.round1Status === 'running' ? 'stage-1' : 'staged',
      roundStartTime: this.round1Status === 'running' ? now : null,
      roundEndTime: null,
      stageStartTime: this.round1Status === 'running' ? now : null,
      credits: 0,
      stages: createInitialStageRecords(),
      activityHistory: [
        {
          id: `act_${crypto.randomUUID().substring(0, 8)}`,
          teamId: '',
          type: 'admin_movement',
          description: `Team manually created by administrator (Credentials assigned)`,
          timestamp: now,
        },
      ],
      createdAt: now,
    };

    newTeam.activityHistory[0].teamId = newTeam.id;
    this.teams.unshift(newTeam);
    this.saveTeams();

    return {
      success: true,
      message: `Team "${trimmedName}" created successfully.`,
      team: newTeam,
    };
  }

  /**
   * Edit team name, validating uniqueness.
   */
  updateTeamName(teamId: string, newName: string): { success: boolean; message: string } {
    const trimmed = newName.trim();
    if (!trimmed) {
      return { success: false, message: 'New team name cannot be empty.' };
    }

    const duplicate = this.teams.some(
      (t) => t.id !== teamId && t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      return { success: false, message: `Team name "${trimmed}" is already taken.` };
    }

    const team = this.teams.find((t) => t.id === teamId);
    if (!team) {
      return { success: false, message: 'Team not found.' };
    }

    const oldName = team.name;
    team.name = trimmed;
    team.activityHistory.unshift({
      id: `act_${crypto.randomUUID().substring(0, 8)}`,
      teamId: team.id,
      type: 'admin_movement',
      description: `Team name updated from "${oldName}" to "${trimmed}" by administrator`,
      timestamp: new Date().toISOString(),
    });
    this.saveTeams();

    return { success: true, message: `Team name updated to "${trimmed}".` };
  }

  /**
   * Reset team password.
   */
  resetTeamPassword(teamId: string, newPassword: string): { success: boolean; message: string } {
    const trimmed = newPassword.trim();
    if (!trimmed || trimmed.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }

    const team = this.teams.find((t) => t.id === teamId);
    if (!team) {
      return { success: false, message: 'Team not found.' };
    }

    team.passwordHash = '••••••••••••';
    team.activityHistory.unshift({
      id: `act_${crypto.randomUUID().substring(0, 8)}`,
      teamId: team.id,
      type: 'admin_movement',
      description: 'Master passkey reset by administrator',
      timestamp: new Date().toISOString(),
    });
    this.saveTeams();

    return { success: true, message: `Password reset successfully for "${team.name}".` };
  }

  /**
   * Toggle individual team pause/resume state.
   */
  toggleTeamPause(teamId: string): { success: boolean; message: string; newStatus?: TeamStatus } {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) {
      return { success: false, message: 'Team not found.' };
    }

    const now = new Date().toISOString();
    if (team.status === 'paused') {
      team.status = 'active';
      team.activityHistory.unshift({
        id: `act_${crypto.randomUUID().substring(0, 8)}`,
        teamId: team.id,
        type: 'admin_movement',
        description: 'Squad resumed by administrator',
        timestamp: now,
      });
      this.saveTeams();
      return { success: true, message: `"${team.name}" resumed.`, newStatus: 'active' };
    } else {
      team.status = 'paused';
      team.activityHistory.unshift({
        id: `act_${crypto.randomUUID().substring(0, 8)}`,
        teamId: team.id,
        type: 'admin_movement',
        description: 'Squad paused by administrator',
        timestamp: now,
      });
      this.saveTeams();
      return { success: true, message: `"${team.name}" paused.`, newStatus: 'paused' };
    }
  }

  /**
   * Move a team to a specific stage.
   * Preserves earned credits and does NOT auto-award completion credits.
   */
  moveTeamStage(
    teamId: string,
    targetStage: StageId,
    reason = 'Administrator stage realignment'
  ): { success: boolean; message: string } {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) {
      return { success: false, message: 'Team not found.' };
    }

    const now = new Date().toISOString();
    const sourceStage = team.currentStage;
    team.currentStage = targetStage;
    team.stageStartTime = now;

    // Set stage status to in_progress if not already completed
    if (team.stages[targetStage].status !== 'completed') {
      team.stages[targetStage].status = 'in_progress';
      team.stages[targetStage].startTime = team.stages[targetStage].startTime || now;
    }

    team.activityHistory.unshift({
      id: `act_${crypto.randomUUID().substring(0, 8)}`,
      teamId: team.id,
      type: 'admin_movement',
      description: `Moved from [${sourceStage}] to [${STAGE_NAMES[targetStage]}] by administrator (${reason})`,
      timestamp: now,
    });
    this.saveTeams();

    return {
      success: true,
      message: `Team "${team.name}" moved to ${STAGE_NAMES[targetStage]}.`,
    };
  }

  /**
   * Advance eligible team to Round 2 (The Haunted Auction).
   */
  moveTeamToRound2(teamId: string): { success: boolean; message: string } {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) {
      return { success: false, message: 'Team not found.' };
    }

    const now = new Date().toISOString();
    team.currentRound = 'Round 2';
    team.currentStage = 'staged';
    team.status = 'waiting';

    team.activityHistory.unshift({
      id: `act_${crypto.randomUUID().substring(0, 8)}`,
      teamId: team.id,
      type: 'admin_movement',
      description: `Transferred to Round 2: The Haunted Auction (Credits: ${team.credits} CR preserved)`,
      timestamp: now,
    });
    this.saveTeams();

    return {
      success: true,
      message: `Team "${team.name}" successfully transferred to Round 2 with ${team.credits} credits.`,
    };
  }

  /**
   * Delete team from repository.
   */
  deleteTeam(teamId: string): { success: boolean; message: string } {
    const initialLen = this.teams.length;
    this.teams = this.teams.filter(t => t.id !== teamId);
    if (this.teams.length < initialLen) {
      this.saveTeams();
      return { success: true, message: 'Team deleted.' };
    }
    return { success: false, message: 'Team not found.' };
  }

  /**
   * Synchronize gameplay progress from Round 1 gameplay directly into Admin standings.
   */
  syncTeamProgress(
    teamId: string,
    credits: number,
    stageId?: StageId,
    stageStatus?: StageStatus,
    activityDesc?: string
  ): void {
    const team = this.teams.find(
      (t) => t.id === teamId || t.name.toLowerCase() === teamId.toLowerCase()
    );
    if (team) {
      team.credits = credits;
      if (stageId && stageStatus) {
        team.stages[stageId].status = stageStatus;
        team.stages[stageId].earnedCredits = STAGE_CREDITS[stageId];
      }
      if (activityDesc) {
        team.activityHistory.unshift({
          id: `act_${crypto.randomUUID().substring(0, 8)}`,
          teamId: team.id,
          type: 'stage_completion',
          description: activityDesc,
          timestamp: new Date().toISOString(),
        });
      }
      this.saveTeams();
    }
  }

  /**
   * Get sorted standings and stage-wise credit breakdowns for the Results screen.
   */
  getResults(search = '', statusFilter = 'all'): AdminTeam[] {
    const trimmed = search.trim().toLowerCase();

    return this.teams
      .filter((team) => {
        const matchesSearch = !trimmed || team.name.toLowerCase().includes(trimmed);
        const matchesStatus = statusFilter === 'all' || team.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.credits - a.credits);
  }

  /**
   * Alias for tournament leaderboard standings ranked by bounty credits.
   */
  getResultsStandings(): AdminTeam[] {
    return this.getResults('', 'all');
  }

  /**
   * Generate CSV export of current results.
   */
  exportResultsCSV(): string {
    const results = this.getResults();
    const headers = [
      'Team Name',
      'Stage 1 Credits (Max 100)',
      'Stage 2 Credits (Max 150)',
      'Stage 3 Credits (Max 250)',
      'Total Credits (Max 500)',
      'Round Status',
      'Current Round',
      'Created At',
    ];

    const rows = results.map((t) => [
      `"${t.name.replaceAll('"', '""')}"`,
      t.stages['stage-1'].earnedCredits,
      t.stages['stage-2'].earnedCredits,
      t.stages['stage-3'].earnedCredits,
      t.credits,
      t.status.toUpperCase(),
      t.currentRound,
      t.createdAt,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }
}

export const adminService = new AdminService();

// Automatically synchronize live Round 1 gameplay events into the Admin Standings & Audit logs
round1Service.setOnScoreSync((teamId, credits, stageId, stageStatus, activityDesc) => {
  adminService.syncTeamProgress(teamId, credits, stageId, stageStatus, activityDesc);
});

