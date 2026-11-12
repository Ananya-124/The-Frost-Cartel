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

  it('allows advancing to next eligible round and shows reset every team option', async () => {
    vi.mocked(progressionService.getAdminTeam).mockResolvedValue(state(null));
    render(<AdminProgressionControls teamId="team-42" teamName="North Hall" />);

    const moveButton = await screen.findByRole('button', { name: 'Move North Hall to Round 2' });
    expect(moveButton).toBeEnabled();

    expect(screen.getByRole('button', { name: '⚠️ Reset Every Team' })).toBeInTheDocument();
    expect(progressionService.getAdminTeam).toHaveBeenCalledWith('team-42');
  });

  it('moves an eligible team forward through the authenticated server action', async () => {
    vi.mocked(progressionService.getAdminTeam).mockResolvedValue(state('2026-11-12T10:00:00.000Z'));
    vi.mocked(progressionService.adminAction).mockResolvedValue(state('2026-11-12T10:00:00.000Z', 'AVAILABLE'));
    const onProgressChanged = vi.fn();
    render(<AdminProgressionControls teamId="team-42" teamName="North Hall" onProgressChanged={onProgressChanged} />);

    const moveButton = await screen.findByRole('button', { name: 'Move North Hall to Round 2' });
    fireEvent.click(moveButton);

    await waitFor(() => expect(progressionService.adminAction).toHaveBeenCalledWith(
      'team-42', 'ROUND', 2, 'unlock',
    ));
    expect(await screen.findByText(/North Hall moved to Round 2/i)).toBeInTheDocument();
    expect(onProgressChanged).toHaveBeenCalledTimes(1);
  });
});
