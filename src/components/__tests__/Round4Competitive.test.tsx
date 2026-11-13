import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WinnerCelebrationModal } from '../game/round4/WinnerCelebrationModal';
import { NonWinnerModal } from '../game/round4/NonWinnerModal';

describe('Round 04 Competitive Modals: Winner Celebration & Non-Winner Summary', () => {
  const mockExit = vi.fn();

  it('renders the complete WinnerCelebrationModal with dynamic team name and exact content hierarchy', () => {
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

    // Phase 2 Exact Content Hierarchy:
    // 1. SMALL BRAND LABEL
    expect(screen.getByText('FROST CARTEL')).toBeInTheDocument();

    // 2. EVENT LABEL
    expect(screen.getByText('THE RADIANT TREASURE HUNT')).toBeInTheDocument();

    // 3. MAIN CELEBRATION HEADING
    expect(screen.getByText('CONGRATULATIONS!')).toBeInTheDocument();

    // 4. EXACT ONE DYNAMIC WINNING TEAM NAME
    expect(screen.getByRole('heading', { level: 1, name: /SHADOW SYNDICATE/i })).toBeInTheDocument();
    expect(screen.queryByText(/TEAM TEAM/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('winner-celebration-video')).toHaveAttribute(
      'src',
      '/assets/round-04/winner-celebration.mp4',
    );
    expect(screen.getByTestId('winner-celebration-video')).toHaveAttribute('autoplay');
    expect(screen.getByTestId('winner-celebration-video')).toHaveProperty('muted', true);
    expect(screen.getByTestId('winner-celebration-video')).toHaveAttribute('loop');

    // 5. BOTTOM ACTION
    const exitBtn = screen.getByRole('button', { name: /Enter The Hall of Fame/i });
    expect(exitBtn).toBeInTheDocument();
    fireEvent.click(exitBtn);
    expect(mockExit).toHaveBeenCalledTimes(1);

    // Phase 1 Purged Items Assertions:
    expect(screen.queryByText(/Seven paths were forged/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Seven teams answered the call/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/THE RELIC HAS BEEN CLAIMED/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ROUTE III/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/The journey from darkness to light is complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText('THE END — THE LEGACY BEGINS.')).not.toBeInTheDocument();
  });

  it('renders correctly when team name begins with Team without duplicate prefix', () => {
    const winnerRecord = {
      teamId: 'team_ai_01',
      teamName: 'Team AI',
      routeId: 'route-1',
      solvedAt: new Date().toISOString(),
    };

    render(
      <WinnerCelebrationModal
        winner={winnerRecord}
        onExit={mockExit}
      />
    );

    // Must be TEAM AI, absolutely never TEAM TEAM AI
    expect(screen.getByRole('heading', { level: 1, name: 'TEAM AI' })).toBeInTheDocument();
    expect(screen.queryByText(/TEAM TEAM AI/i)).not.toBeInTheDocument();
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
    expect(screen.getByRole('img', { name: /skeletons celebrating/i })).toHaveAttribute(
      'src',
      '/assets/round-04/winner-celebration.png',
    );
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();

    // Return button
    const returnBtn = screen.getByRole('button', { name: /Return to Exterior from route IV, 4 clues completed/i });
    expect(returnBtn).toBeInTheDocument();
    fireEvent.click(returnBtn);
    expect(mockExit).toHaveBeenCalledTimes(1);
  });
});

