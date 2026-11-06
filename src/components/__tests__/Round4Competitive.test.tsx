import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WinnerCelebrationModal } from '../game/round4/WinnerCelebrationModal';
import { NonWinnerModal } from '../game/round4/NonWinnerModal';

describe('Round 04 Competitive Modals: Winner Celebration & Non-Winner Summary', () => {
  const mockExit = vi.fn();

  it('renders the complete WinnerCelebrationModal with dynamic team name and full narrative', () => {
    const winnerRecord = {
      teamId: 'team_alpha_01',
      teamName: 'Shadow Syndicate',
      routeId: 'route-3',
      solvedAt: new Date().toISOString(),
    };

    render(
      <WinnerCelebrationModal
        winner={winnerRecord}
        routeRomanNumeral="III"
        onExit={mockExit}
      />
    );

    // Dialog accessibility
    expect(screen.getByRole('dialog', { name: /Championship Victory Announcement/i })).toBeInTheDocument();

    // Required headings & subtitles
    expect(screen.getByText('THE RELIC HAS BEEN CLAIMED')).toBeInTheDocument();
    expect(screen.getByText(/TEAM SHADOW SYNDICATE/i)).toBeInTheDocument();
    expect(screen.getByText('CHAMPIONS')).toBeInTheDocument();
    expect(screen.getByText(/WINNERS OF THE RADIANT TREASURE HUNT • ROUTE III/i)).toBeInTheDocument();

    // Story narrative excerpts
    expect(screen.getByText(/Seven paths were forged. Seven teams answered the call/i)).toBeInTheDocument();
    expect(screen.getByText(/The journey from darkness to light is complete/i)).toBeInTheDocument();
    expect(screen.getByText('THE END — THE LEGACY BEGINS.')).toBeInTheDocument();

    // Exit Button
    const exitBtn = screen.getByRole('button', { name: /Enter The Hall of Fame/i });
    expect(exitBtn).toBeInTheDocument();
    fireEvent.click(exitBtn);
    expect(mockExit).toHaveBeenCalledTimes(1);
  });

  it('renders NonWinnerModal with winning team name and accurate completed clue count', () => {
    const winnerRecord = {
      teamId: 'team_beta_02',
      teamName: 'Celestial Seekers',
      routeId: 'route-5',
      solvedAt: '2026-11-06T12:00:00.000Z',
    };

    render(
      <NonWinnerModal
        winner={winnerRecord}
        mySolvedCount={4}
        myRouteRomanNumeral="IV"
        onExit={mockExit}
      />
    );

    expect(screen.getByRole('dialog', { name: /Tournament Finished Notice/i })).toBeInTheDocument();
    expect(screen.getByText('THE TREASURE HAS BEEN CLAIMED')).toBeInTheDocument();

    // Narrative text
    expect(screen.getByText(/Your path was completed. The clues were uncovered/i)).toBeInTheDocument();

    // Winning team details
    expect(screen.getByText(/TEAM CELESTIAL SEEKERS/i)).toBeInTheDocument();

    // Own squad stats
    expect(screen.getByText(/ROUTE IV • 4 \/ 5 Clues Completed/i)).toBeInTheDocument();

    // Return button
    const returnBtn = screen.getByRole('button', { name: /Return to Exterior/i });
    expect(returnBtn).toBeInTheDocument();
    fireEvent.click(returnBtn);
    expect(mockExit).toHaveBeenCalledTimes(1);
  });
});
