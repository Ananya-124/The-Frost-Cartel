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

  it('shows one next-round action for the selected server team', async () => {
    vi.mocked(progressionService.getAdminTeam).mockResolvedValue({ success: true, ...state() });
    render(<AdminProgressionControls teamId="team-42" teamName="North Hall" />);

    expect(await screen.findByRole('button', { name: 'Move North Hall to Round 2' })).toBeEnabled();
    expect(screen.getByText(/Round 01/)).toBeInTheDocument();
    expect(screen.getByText(/Round 02/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /lock|complete|reset|hunt/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Round 2 gameplay also requires the auction to be started/i)).toBeInTheDocument();
    expect(progressionService.getAdminTeam).toHaveBeenCalledWith('team-42');
    expect(progressionService.getAdminTeams).not.toHaveBeenCalled();
  });

  it('moves only the selected team after server confirmation', async () => {
    vi.mocked(progressionService.getAdminTeam).mockResolvedValue({ success: true, ...state() });
    vi.mocked(progressionService.adminAction).mockResolvedValue({ success: true, ...state('AVAILABLE') });
    const onProgressChanged = vi.fn();
    render(<AdminProgressionControls teamId="team-42" teamName="North Hall" onProgressChanged={onProgressChanged} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Move North Hall to Round 2' }));
    await waitFor(() => expect(progressionService.adminAction).toHaveBeenCalledWith(
      'team-42', 'ROUND', 2, 'unlock',
    ));
    expect(await screen.findByText('North Hall moved to Round 2.')).toBeInTheDocument();
    expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
    expect(onProgressChanged).toHaveBeenCalledTimes(1);
  });
});
