import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Leaderboard from './Leaderboard';

describe('Round 3 Leaderboard Qualification', () => {
  it('qualifies the top 5 teams for the next round and does not qualify the 6th', () => {
    const mockEntries = [
      { name: 'amith', score: 1300 },
      { name: 'yash', score: 1250 },
      { name: 'akshat', score: 1090 },
      { name: 'ananya', score: 670 },
      { name: 'brunda', score: 200 },
      { name: 'team123', score: 0 },
    ];

    render(<Leaderboard entries={mockEntries} teamName="ananya" score={670} />);

    const qualifyBadges = screen.getAllByText(/qualifies for the next round/i);
    expect(qualifyBadges).toHaveLength(5);

    // Verify row 1 through 5 have the badge and row 6 does not
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(6);
    expect(rows[0]).toHaveTextContent(/qualifies for the next round/i);
    expect(rows[1]).toHaveTextContent(/qualifies for the next round/i);
    expect(rows[2]).toHaveTextContent(/qualifies for the next round/i);
    expect(rows[3]).toHaveTextContent(/qualifies for the next round/i);
    expect(rows[4]).toHaveTextContent(/qualifies for the next round/i);
    expect(rows[5]).not.toHaveTextContent(/qualifies for the next round/i);
  });
});
