import { beforeEach, describe, expect, it } from 'vitest';
import { adminService } from '../adminService';
import { round1Service } from '../round1Service';

describe('admin team progress actions', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    adminService.resetToDefaults();
  });

  it('resets the team to the beginning of Round 1 and clears game progress', () => {
    const team = adminService.getTeams().teams[0];
    team.credits = 250;
    team.currentRound = 'Round 2';
    team.currentStage = 'staged';
    team.stages['stage-1'].earnedCredits = 100;
    team.stages['stage-1'].status = 'completed';

    const gameState = round1Service.getTeamSession(team.id, team.name);
    gameState.credits = 100;
    gameState.stage1State.trials[0].attemptsUsed = 1;

    const result = adminService.resetTeamProgress(team.id);
    const resetTeam = adminService.getTeams().teams.find((candidate) => candidate.id === team.id);
    const resetGameState = round1Service.getTeamSession(team.id, team.name);

    expect(result.success).toBe(true);
    expect(resetTeam).toMatchObject({
      currentRound: 'Round 1',
      currentStage: 'stage-1',
      status: 'waiting',
      roundStartTime: null,
      roundEndTime: null,
      stageStartTime: null,
      credits: 0,
    });
    expect(resetTeam?.stages['stage-1'].status).toBe('not_started');
    expect(resetGameState.credits).toBe(0);
    expect(resetGameState.stage1State.trials[0].attemptsUsed).toBe(0);
  });

  it('demotes a Round 2 team to the last stage of Round 1 and preserves earned progress', () => {
    const team = adminService.getTeams().teams[0];
    team.credits = 175;
    team.stages['stage-3'].earnedCredits = 75;
    team.currentRound = 'Round 2';
    team.currentStage = 'staged';

    const result = adminService.demoteTeamToPreviousRound(team.id);

    expect(result.success).toBe(true);
    expect(team.currentRound).toBe('Round 1');
    expect(team.currentStage).toBe('stage-3');
    expect(team.credits).toBe(175);
    expect(team.stages['stage-3'].earnedCredits).toBe(75);
  });

  it('does not demote a team that is already in Round 1', () => {
    const team = adminService.getTeams().teams[0];
    const originalStage = team.currentStage;
    const result = adminService.demoteTeamToPreviousRound(team.id);

    expect(result.success).toBe(false);
    expect(team.currentRound).toBe('Round 1');
    expect(team.currentStage).toBe(originalStage);
  });
});
