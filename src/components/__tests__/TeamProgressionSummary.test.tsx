import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamProgressionSummary } from '../player/TeamProgressionSummary';

describe('Team progression summary', () => {
  it('shows round and sequential hunt states from the server response', () => {
    render(<TeamProgressionSummary loading={false} error={null} onRetry={vi.fn()} progression={{
      teamId: 'server-team',
      rounds: [1, 2, 3, 4].map((round_id) => ({ round_id, status: round_id === 1 ? 'COMPLETED' as const : round_id === 2 ? 'LOCKED' as const : 'AVAILABLE' as const, eligible_at: round_id === 2 ? '2026-01-01' : null, completed_at: null })),
      hunts: [1, 2, 3].map((hunt_id) => ({ hunt_id, status: hunt_id === 1 ? 'COMPLETED' as const : hunt_id === 2 ? 'IN_PROGRESS' as const : 'LOCKED' as const, completed_at: null })),
    }} />);
    expect(screen.getByText('Eligible · awaiting admin unlock')).toBeInTheDocument();
    expect(screen.getByText('Hunt I · The Forgotten Incident')).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('Hunt III · The Final Containment')).toBeInTheDocument();
  });

  it('provides retry after a server failure', () => {
    render(<TeamProgressionSummary loading={false} error="Server unavailable" onRetry={vi.fn()} progression={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
