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
    adminAdvanceTeam: vi.fn(),
    adminRound2Global: vi.fn(),
    adminRound3Global: vi.fn(),
    adminResetAllTeamsProgress: vi.fn(),
  },
}));

function state(round2Status: 'LOCKED' | 'AVAILABLE' = 'LOCKED'): TeamProgression {
  return {
    teamId: 'team-42',
    rounds: [1, 2, 3, 4].map((round_id) => ({
      round_id,
      status: round_id === 1 ? 'COMPLETED' : round_id === 2 ? round2Status : 'LOCKED',
      eligible_at: round_id === 2 ? '2026-11-12T10:00:00.000Z' : null,
      completed_at: null,
    })) as TeamProgression['rounds'],
    hunts: [1, 2, 3].map((hunt_id) => ({ hunt_id, status: 'LOCKED' as const, completed_at: null })),
    audit: [],
  };
}

describe('Admin team round progression controls', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows direct round jump actions and batch advance options for the selected server team', async () => {
    vi.mocked(progressionService.getAdminTeam).mockResolvedValue({ success: true, ...state() });
    render(<AdminProgressionControls teamId="team-42" teamName="North Hall" />);

    expect(await screen.findByRole('button', { name: /Jump to Round 2/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: '⚡ Advance All to R2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '⚡ Advance All to R3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '⚠️ Reset Every Team' })).toBeInTheDocument();
    expect(screen.getByText(/Round 01/)).toBeInTheDocument();
    expect(screen.getByText(/Round 02/)).toBeInTheDocument();
    expect(progressionService.getAdminTeam).toHaveBeenCalledWith('team-42');
  });

  it('moves the selected team to Round 2 after server confirmation', async () => {
    vi.mocked(progressionService.getAdminTeam).mockResolvedValue({ success: true, ...state() });
    vi.mocked(progressionService.adminAdvanceTeam).mockResolvedValue({ success: true, roundId: 2, ...state('AVAILABLE') });
    const onProgressChanged = vi.fn();
    render(<AdminProgressionControls teamId="team-42" teamName="North Hall" onProgressChanged={onProgressChanged} />);

    fireEvent.click(await screen.findByRole('button', { name: /Jump to Round 2/i }));
    await waitFor(() => expect(progressionService.adminAdvanceTeam).toHaveBeenCalledWith(
      'team-42', 2, expect.stringContaining('North Hall directly to Round 2'),
    ));
    expect(await screen.findByText(/North Hall moved directly to Round 2!/i)).toBeInTheDocument();
    expect(onProgressChanged).toHaveBeenCalledTimes(1);
  });
});
