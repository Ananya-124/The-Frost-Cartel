import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Stage3ForgottenGraveyard } from '../game/stage3/Stage3ForgottenGraveyard';
import { round1Service } from '../../services/round1Service';

describe('Stage 3 Master Regression & State Management', () => {
  const mockReturn = vi.fn();
  const mockSkip = vi.fn();
  const mockComplete = vi.fn();
  const teamId = 'test_team_master_s3';

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
    round1Service.resetTeamProgress(teamId);
    round1Service.beginRound1(teamId, 'Spectral Operatives');
  });

  it('initially displays 0/3 counter and all coffins show PLAY buttons', () => {
    const config = round1Service.getStage3Config();
    render(
      <Stage3ForgottenGraveyard
        teamId={teamId}
        config={config}
        initialCollectedFragments={[]}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    // Initial counter must be 0/3 everywhere
    expect(screen.getByRole('button', { name: /Evidence Journal \(0\/3\)/i })).toBeInTheDocument();

    // All 3 coffin cards should have PLAY buttons
    const playButtons = screen.getAllByText(/PLAY ›/i);
    expect(playButtons).toHaveLength(3);

    // No COMPLETED buttons initially
    expect(screen.queryByText(/COMPLETED/i)).not.toBeInTheDocument();
  });

  it('idempotently advances counter to 1/3 and marks Coffin I as COMPLETED and unclickable', () => {
    const config = round1Service.getStage3Config();

    // Solve Grave 1
    round1Service.unlockGrave1Chest(teamId);

    const comp = round1Service.getStage3GraveCompletion(teamId);
    expect(comp.grave1).toBe(true);
    expect(comp.completedCount).toBe(1);

    render(
      <Stage3ForgottenGraveyard
        teamId={teamId}
        config={config}
        initialCollectedFragments={[]}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    // Counter must be 1/3
    expect(screen.getByRole('button', { name: /Evidence Journal \(1\/3\)/i })).toBeInTheDocument();

    // Coffin 1 card shows COMPLETED button
    expect(screen.getByRole('button', { name: /completed and permanently sealed/i })).toBeInTheDocument();
    expect(screen.getByText(/“BENEATH” SECURED/i)).toBeInTheDocument();

    // Coffin 2 & 3 still show PLAY
    const playButtons = screen.getAllByText(/PLAY ›/i);
    expect(playButtons).toHaveLength(2);

    // Clicking Coffin 1 does NOT open Coffin 1 (stays on overview)
    const coffin1Region = screen.getByRole('region', { name: /COFFIN I: THE MARKED REMAINS \(Completed\)/i });
    fireEvent.click(coffin1Region);

    // Overview title remains visible
    expect(screen.getByText('The Forgotten Graveyard')).toBeInTheDocument();
    // Grave 1 view did NOT mount
    expect(screen.queryByText('THE KEEPER’S LAST RIDDLE')).not.toBeInTheDocument();
  });

  it('counter never displays 4/3 even if both legacy fragments exist in state', () => {
    const config = round1Service.getStage3Config();
    const session = round1Service.getTeamSession(teamId, '');

    // Inject all fragments including legacy duplicates
    session.stage3State.collectedFragments = ['BENEATH', 'THE', 'EMBER', 'NIGHT', 'RETURNS'];
    session.stage3State.grave1Completed = true;
    session.stage3State.grave2Completed = true;
    session.stage3State.grave3Completed = true;

    const comp = round1Service.getStage3GraveCompletion(teamId);
    expect(comp.completedCount).toBe(3);
    expect(comp.completedCount).not.toBe(4);

    render(
      <Stage3ForgottenGraveyard
        teamId={teamId}
        config={config}
        initialCollectedFragments={[]}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    // Must show 3/3, absolutely NEVER 4/3
    expect(screen.getByRole('button', { name: /Evidence Journal \(3\/3\)/i })).toBeInTheDocument();
    expect(screen.queryByText(/4\/3/)).not.toBeInTheDocument();

    // Open Evidence Journal modal
    const journalBtn = screen.getByRole('button', { name: /Evidence Journal \(3\/3\)/i });
    fireEvent.click(journalBtn);

    expect(screen.getByText(/3\/3 INSCRIPTIONS UNSEALED/i)).toBeInTheDocument();
    expect(screen.getByText('BENEATH')).toBeInTheDocument();
    expect(screen.getByText('EMBER')).toBeInTheDocument();
    expect(screen.getByText('RETURNS')).toBeInTheDocument();
    expect(screen.queryByText(/4\/3/)).not.toBeInTheDocument();
  });

  it('redesigned Final Escape Gate modal renders single header, connected tablets, and unseals with phrase', () => {
    const config = round1Service.getStage3Config();

    // Complete all 3 graves
    round1Service.markGrave1Completed(teamId);
    round1Service.markGrave2Completed(teamId, 'EMBER');
    round1Service.markGrave3Completed(teamId);

    render(
      <Stage3ForgottenGraveyard
        teamId={teamId}
        config={config}
        initialCollectedFragments={['BENEATH', 'EMBER', 'RETURNS']}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    // Open Final Escape Gate
    const gateBtn = screen.getByRole('button', { name: /Final Escape Gate/i });
    fireEvent.click(gateBtn);

    // Single clear header & subtitle
    expect(screen.getByText('The Arch-Lich Escape Gate')).toBeInTheDocument();
    expect(screen.getByText('FINAL SANCTUM • ESCAPE PORTAL')).toBeInTheDocument();

    // 3 Connected Tablets visible
    expect(screen.getByText(/GRAVE I — THE MARKED REMAINS/i)).toBeInTheDocument();
    expect(screen.getByText('BENEATH')).toBeInTheDocument();
    expect(screen.getByText(/GRAVE II — THE BURIED DIARY/i)).toBeInTheDocument();
    expect(screen.getByText('EMBER')).toBeInTheDocument();
    expect(screen.getByText(/GRAVE III — THE FINAL TESTAMENT/i)).toBeInTheDocument();
    expect(screen.getByText('RETURNS')).toBeInTheDocument();

    // Inscriptions counter shows 3/3
    expect(screen.getByText(/Grave Inscriptions Unsealed \(3\/3\)/i)).toBeInTheDocument();

    // Input field
    const input = screen.getByPlaceholderText(/ENTER COMPLETE RUNIC PHRASE/i);
    const submitBtn = screen.getByRole('button', { name: /UNSEAL THE FINAL GATE/i });

    // Wrong submission test
    fireEvent.change(input, { target: { value: 'WRONG CIPHER' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/The ancient runes reject your phrase/i)).toBeInTheDocument();
    expect(mockComplete).not.toHaveBeenCalled();

    // Correct submission
    fireEvent.change(input, { target: { value: 'BENEATH EMBER RETURNS' } });
    fireEvent.click(submitBtn);

    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/ARCH-LICH GATE SHATTERED • ESCAPED!/i)).toBeInTheDocument();
    expect(screen.getByText(/\+250 CREDITS SECURED/i)).toBeInTheDocument();

    // Verify Jump Scare is completely absent
    expect(screen.queryByLabelText(/Ancient Grave Jumpscare Event/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/THE ARCH-LICH AWAKENS/i)).not.toBeInTheDocument();
  });
});
