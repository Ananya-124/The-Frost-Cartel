import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Stage3ForgottenGraveyard } from '../game/stage3/Stage3ForgottenGraveyard';
import { round1Service } from '../../services/round1Service';

describe('Stage 3: The Forgotten Graveyard Component', () => {
  const mockReturn = vi.fn();
  const mockSkip = vi.fn();
  const mockComplete = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    round1Service.beginRound1('test_team_s3', 'Graveyard Walkers');
  });

  it('renders graveyard grounds overview and grave navigation options', () => {
    const config = round1Service.getStage3Config();
    render(
      <Stage3ForgottenGraveyard
        teamId="test_team_s3"
        config={config}
        initialCollectedFragments={[]}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    expect(screen.getByText('STAGE 03 OF 03 • 250 CREDITS')).toBeInTheDocument();
    expect(screen.getByText('The Forgotten Graveyard')).toBeInTheDocument();
    expect(screen.getByText('The Cursed Sepulcher Grounds')).toBeInTheDocument();
    expect(screen.getByText('The Bone Chamber')).toBeInTheDocument();
    expect(screen.getByText('The Buried Diary')).toBeInTheDocument();
    expect(screen.getByText('The Rune Tombstone')).toBeInTheDocument();
  });

  it('allows navigating to Grave 1 and assembling the skeleton', () => {
    const config = round1Service.getStage3Config();
    render(
      <Stage3ForgottenGraveyard
        teamId="test_team_s3"
        config={config}
        initialCollectedFragments={[]}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    const grave1Btn = screen.getByRole('button', { name: /Grave 1: Bone Chamber/i });
    fireEvent.click(grave1Btn);

    expect(screen.getByText(/Grave 1 — The Bone Chamber/i)).toBeInTheDocument();
    expect(screen.getByText('Apex Altar')).toBeInTheDocument();

    // Select Cranium bone
    const skullBone = screen.getByRole('button', { name: /Ancient Cranium/i });
    fireEvent.click(skullBone);

    // Place in Apex Altar
    const apexAltar = screen.getByText('Apex Altar');
    fireEvent.click(apexAltar);

    // Apex Altar now displays placed bone and badge
    expect(screen.getAllByText('Ancient Cranium').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('(Placed)')).toBeInTheDocument();
  });

  it('toggles evidence journal drawer', () => {
    const config = round1Service.getStage3Config();
    render(
      <Stage3ForgottenGraveyard
        teamId="test_team_s3"
        config={config}
        initialCollectedFragments={['THE']}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    const journalBtn = screen.getByRole('button', { name: /Evidence Journal/i });
    fireEvent.click(journalBtn);

    expect(screen.getByText('EVIDENCE JOURNAL')).toBeInTheDocument();
    expect(screen.getByText('THE')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /✕ Close/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('EVIDENCE JOURNAL')).not.toBeInTheDocument();
  });

  it('submits final gate incantation and unlocks gate', () => {
    const config = round1Service.getStage3Config();
    render(
      <Stage3ForgottenGraveyard
        teamId="test_team_s3"
        config={config}
        initialCollectedFragments={['THE', 'NIGHT', 'RETURNS']}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    const gateTab = screen.getByRole('button', { name: /Final Escape Gate/i });
    fireEvent.click(gateTab);

    expect(screen.getByText('The Arch-Lich Escape Gate')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/ENTER COMPLETE RUNIC PHRASE/i);
    const submitBtn = screen.getByRole('button', { name: /Speak Incantation & Break Gate/i });

    fireEvent.change(input, { target: { value: 'THE NIGHT RETURNS' } });
    fireEvent.click(submitBtn);

    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Arch-Lich Gate Shattered • Escaped!/i)).toBeInTheDocument();
  });
});
