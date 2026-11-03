import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Stage2HauntedImageHunt } from '../game/stage2/Stage2HauntedImageHunt';
import { round1Service } from '../../services/round1Service';

describe('Stage 2: The Haunted Image Hunt Component', () => {
  const mockReturn = vi.fn();
  const mockSkip = vi.fn();
  const mockComplete = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    round1Service.beginRound1('test_team_s2', 'Hunt Masters');
  });

  it('renders target checklist, scattered photos, and hud controls', () => {
    const config = round1Service.getStage2Config();
    render(
      <Stage2HauntedImageHunt
        teamId="test_team_s2"
        config={config}
        initialFoundTargetIds={[]}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    expect(screen.getByText('STAGE 02 OF 03 • 150 CREDITS')).toBeInTheDocument();
    expect(screen.getByText('The Haunted Image Hunt')).toBeInTheDocument();
    expect(screen.getByText(/OBJECTS DISCOVERED: 0 \/ 12/i)).toBeInTheDocument();
    expect(screen.getByText('The Ancestral Study')).toBeInTheDocument();
    expect(screen.getByText('The Alchemist\'s Crypt')).toBeInTheDocument();
  });

  it('opens enlarged image viewer and discovers target object on click', () => {
    const config = round1Service.getStage2Config();
    render(
      <Stage2HauntedImageHunt
        teamId="test_team_s2"
        config={config}
        initialFoundTargetIds={[]}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    // Open first image
    const photo1 = screen.getByText('The Ancestral Study');
    fireEvent.click(photo1);

    expect(screen.getByText(/INSPECTION VIEWER • The Ancestral Study/i)).toBeInTheDocument();

    // Click on Jack-o'-Lantern hotspot
    const pumpkinHotspot = screen.getByLabelText(/Select Carved Jack-o'-Lantern/i);
    fireEvent.click(pumpkinHotspot);

    // Should update discovered count
    expect(screen.getByText(/OBJECTS DISCOVERED: 1 \/ 12/i)).toBeInTheDocument();

    // Clicking already discovered target does not duplicate
    fireEvent.click(pumpkinHotspot);
    expect(screen.getByText(/OBJECTS DISCOVERED: 1 \/ 12/i)).toBeInTheDocument();
  });

  it('opens hint confirmation dialog and applies credit deduction', () => {
    const config = round1Service.getStage2Config();
    render(
      <Stage2HauntedImageHunt
        teamId="test_team_s2"
        config={config}
        initialFoundTargetIds={[]}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    const hintBtn = screen.getByRole('button', { name: /Hint \(-15 CR\)/i });
    fireEvent.click(hintBtn);

    expect(screen.getByText('SEEK AN OCCULT CLUE?')).toBeInTheDocument();
    expect(screen.getByText(/15 credits/i)).toBeInTheDocument();

    const acceptBtn = screen.getByRole('button', { name: /Accept \(-15 CR\)/i });
    fireEvent.click(acceptBtn);

    expect(screen.queryByText('SEEK AN OCCULT CLUE?')).not.toBeInTheDocument();
  });

  it('renders all 8 evidence photographs on the haunted detective table and supports zoom controls', () => {
    const config = round1Service.getStage2Config();
    render(
      <Stage2HauntedImageHunt
        teamId="test_team_s2"
        config={config}
        initialFoundTargetIds={[]}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    // Verify all 8 photos are rendered
    expect(screen.getByText('The Ancestral Study')).toBeInTheDocument();
    expect(screen.getByText('The Alchemist\'s Crypt')).toBeInTheDocument();
    expect(screen.getByText('The Mausoleum Vault')).toBeInTheDocument();
    expect(screen.getByText('The Witch\'s Belfry')).toBeInTheDocument();
    expect(screen.getByText('The Haunted Mansion')).toBeInTheDocument();
    expect(screen.getByText('The Cursed Attic')).toBeInTheDocument();
    expect(screen.getByText('The Haunted Village')).toBeInTheDocument();
    expect(screen.getByText('The Forest Bridge')).toBeInTheDocument();

    // Open The Haunted Mansion
    const mansionPhoto = screen.getByText('The Haunted Mansion');
    fireEvent.click(mansionPhoto);

    expect(screen.getByText(/INSPECTION VIEWER • The Haunted Mansion/i)).toBeInTheDocument();

    // Zoom In
    const zoomInBtn = screen.getByRole('button', { name: 'Zoom In' });
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('150%')).toBeInTheDocument();

    // Zoom Out
    const zoomOutBtn = screen.getByRole('button', { name: 'Zoom Out' });
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Close Inspector
    const closeBtn = screen.getByRole('button', { name: 'Close Inspector' });
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/INSPECTION VIEWER • The Haunted Mansion/i)).not.toBeInTheDocument();
  });
});

