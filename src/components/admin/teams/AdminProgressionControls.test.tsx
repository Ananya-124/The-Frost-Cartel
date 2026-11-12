import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminProgressionControls } from './AdminProgressionControls';
import { progressionService, type TeamProgression } from '../../../services/progressionService';

vi.mock('../../../services/progressionService', () => ({
  errorStatus: vi.fn(() => undefined),
  progressionService: {
    getAdminTeam: vi.fn(),
    getAdminTeams: vi.fn(),
    adminAction: vi.fn(),
  },
}));

function state(round2EligibleAt: string | null, round2Status: 'LOCKED' | 'AVAILABLE' = 'LOCKED'): { success: true } & TeamProgression {
  return {
    success: true,
    teamId: 'team-42',
    rounds: [1, 2, 3, 4].map((round_id) => ({
      round_id,
      status: round_id === 1 ? 'COMPLETED' : round_id === 2 ? round2Status : 'LOCKED',
      eligible_at: round_id === 2 ? round2EligibleAt : null,
      completed_at: null,
    })) as TeamProgression['rounds'],
    hunts: [1, 2, 3].map((hunt_id) => ({ hunt_id, status: 'LOCKED' as const, completed_at: null })),
    audit: [],
  };
}

describe('Admin Round 2 team progression controls', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('allows Round 2 unlock for the shared tournament auction while keeping subsequent rounds gated', async () => {
    vi.mocked(progressionService.getAdminTeam).mockResolvedValue({ success: true, ...state(null) });
    render(<AdminProgressionControls teamId="team-42" teamName="North Hall" />);

    const unlockRound2 = await screen.findByRole('button', { name: 'unlock Round 2' });
    expect(unlockRound2).toBeEnabled();
    expect(unlockRound2).toHaveAttribute('title', 'Unlock Round 2 for all squads across the tournament');

    const unlockRound3 = screen.getByRole('button', { name: 'unlock Round 3' });
    expect(unlockRound3).toBeDisabled();
    expect(unlockRound3).toHaveAttribute('title', 'Complete Round 2 before unlocking this round.');

    expect(screen.getByText(/Round 2 is a shared tournament auction/i)).toBeInTheDocument();
    expect(progressionService.getAdminTeam).toHaveBeenCalledWith('team-42');
    expect(progressionService.getAdminTeams).not.toHaveBeenCalled();
  });

  it('unlocks an eligible team through the authenticated server action and displays the confirmed state', async () => {
    vi.mocked(progressionService.getAdminTeam).mockResolvedValue({ success: true, ...state('2026-11-12T10:00:00.000Z') });
    vi.mocked(progressionService.adminAction).mockResolvedValue({ success: true, ...state('2026-11-12T10:00:00.000Z', 'AVAILABLE') });
    const onProgressChanged = vi.fn();
    render(<AdminProgressionControls teamId="team-42" teamName="North Hall" onProgressChanged={onProgressChanged} />);

    fireEvent.change(await screen.findByLabelText('Audit reason (optional)'), { target: { value: 'Round 1 verified' } });
    fireEvent.click(screen.getByRole('button', { name: 'unlock Round 2' }));

    await waitFor(() => expect(progressionService.adminAction).toHaveBeenCalledWith(
      'team-42', 'ROUND', 2, 'unlock', 'Round 1 verified',
    ));
    expect(await screen.findByText(/Round 2 unlock recorded/i)).toBeInTheDocument();
    expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
    expect(onProgressChanged).toHaveBeenCalledTimes(1);
  });
});
