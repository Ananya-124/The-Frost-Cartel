import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FrostCartelHomePage } from '../home/FrostCartelHomePage';
import { authService } from '../../services/authService';
import { adminService } from '../../services/adminService';

vi.mock('../game/round3/runtime/components/screens/GameScreen', () => ({
  default: ({ teamName }: { teamName: string }) => <div data-testid="round3-game">PARADOX GAME · {teamName}</div>,
}));

describe('FROST CARTEL Homepage & Team Authentication', () => {
  beforeEach(() => {
    authService.logout();
    window.location.hash = '';
    vi.unstubAllGlobals();
    window.scrollTo = () => {};
    Element.prototype.scrollIntoView = () => {};
  });

  it('renders branding, tagline, and corner quick navigation', () => {
    render(<FrostCartelHomePage />);

    // Brand titles
    const headings = screen.getAllByText('FROST CARTEL');
    expect(headings.length).toBeGreaterThanOrEqual(1);

    // Tagline & Supporting line
    expect(screen.getByText('ENTER THE DARKNESS • CLAIM YOUR DESTINY')).toBeInTheDocument();
    expect(screen.getByText('Three rounds. One haunted world.')).toBeInTheDocument();

    // Corner Quick Navigation (Leaderboard only - Admin portal is hardened and unlinked on public home)
    expect(screen.getByRole('button', { name: /View Tournament Standings/i })).toBeInTheDocument();
    expect(screen.queryByTitle('Admin Control Vault')).not.toBeInTheDocument();
  });

  it('renders the three circular portals with correct status and availability', () => {
    render(<FrostCartelHomePage />);

    // Round 1
    expect(screen.getByText('THE GRAVEYARD ESCAPE')).toBeInTheDocument();
    expect(screen.getByText('ROUND 01 ACTIVE • READY')).toBeInTheDocument();
    const enterRound1Btn = screen.getByRole('button', { name: /ENTER ROUND 01/i });
    expect(enterRound1Btn).toBeEnabled();

    // Round 2
    expect(screen.getByText('THE HAUNTED AUCTION')).toBeInTheDocument();
    expect(screen.getByText('ROUND 02 ACTIVE • READY')).toBeInTheDocument();
    const round2Btn = screen.getByRole('button', { name: /ENTER ROUND 02/i });
    expect(round2Btn).toBeEnabled();

    // Round 3
    expect(screen.getByText('PARADOX HUNT')).toBeInTheDocument();
    expect(screen.getByText('ROUND 03 FOUNDATION • READY')).toBeInTheDocument();
    const round3Btn = screen.getByRole('button', { name: /ENTER ROUND 03/i });
    expect(round3Btn).toBeEnabled();

    // Round 4
    expect(screen.getByText('THE RADIANT TREASURE HUNT')).toBeInTheDocument();
    expect(screen.getByText('ROUND 04 ACTIVE • READY')).toBeInTheDocument();
    const round4Btn = screen.getByRole('button', { name: /ENTER ROUND 04/i });
    expect(round4Btn).toBeEnabled();
  });

  it('opens the Round 3 foundation from the player portal', async () => {
    await authService.loginTeam('Paradox Test Team', 'paradox-key');
    const state = {
      success: true,
      session: {
        teamId: 'paradox-test', teamName: 'Paradox Test Team', currentHunt: 'paradox-hunt',
        playerProgress: {}, timelines: { past: {}, future: {} }, activeTimeline: 'past',
        evidenceDiscoveries: [], cardUsage: [], score: 0, completed: false, completedAt: null, updatedAt: new Date().toISOString(),
      },
      inventory: [], cards: [],
    };
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      return Promise.resolve({
        ok: true,
        json: async () => {
          if (url.includes('/api/auth/session')) return { playerNumber: 1 };
          if (url.endsWith('/api/round3/run')) {
            return {
              success: true,
              run: { status: 'running', remainingMs: 60_000, remainingSeconds: 60, startedAt: null, updatedAt: new Date().toISOString() },
            };
          }
          return state;
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<FrostCartelHomePage />);

    fireEvent.click(screen.getByRole('button', { name: /ENTER ROUND 03/i }));

    expect(await screen.findByText('PARADOX GAME · Paradox Test Team')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/round3/session'), expect.objectContaining({ method: 'POST' })));
    vi.unstubAllGlobals();
  });

  it('validates required fields on team login submission', async () => {
    render(<FrostCartelHomePage />);

    const submitBtn = screen.getByRole('button', { name: /ENTER THE GAME/i });
    fireEvent.click(submitBtn);

    // Should display required field error
    expect(await screen.findByText('Please enter your assigned Team Name / Login ID.')).toBeInTheDocument();

    // Fill team name only
    const teamInput = screen.getByLabelText(/TEAM NAME \/ LOGIN ID/i);
    fireEvent.change(teamInput, { target: { value: 'CryptReapers' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Please enter your Master Passkey.')).toBeInTheDocument();
  });

  it('toggles password visibility when clicking eye button', () => {
    render(<FrostCartelHomePage />);

    const passwordInput = screen.getByLabelText(/^PASSWORD$/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByLabelText(/Show password/i);
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('authenticates team and displays gothic crypt portal with unsealed status', async () => {
    adminService.updateRound1Status('running');
    render(<FrostCartelHomePage />);

    const teamInput = screen.getByLabelText(/TEAM NAME \/ LOGIN ID/i);
    const passwordInput = screen.getByLabelText(/^PASSWORD$/i);
    const submitBtn = screen.getByRole('button', { name: /ENTER THE GAME/i });

    fireEvent.change(teamInput, { target: { value: 'ShadowSquad' } });
    fireEvent.change(passwordInput, { target: { value: 'crypt-key-2026' } });
    fireEvent.click(submitBtn);

    // Authenticating state
    expect(screen.getByText(/AUTH\.\.\./i)).toBeInTheDocument();

    // Dashboard modal appears after authentication
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getAllByText('ShadowSquad').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('THE GATES ARE UNSEALED')).toBeInTheDocument();
    expect(screen.getAllByText('THE GRAVEYARD ESCAPE').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('UP TO 500 CR')).toBeInTheDocument();

    // Signing out returns to unauthenticated state
    const signOutBtn = screen.getByRole('button', { name: /SIGN OUT/i });
    fireEvent.click(signOutBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ENTER THE GAME/i })).toBeInTheDocument();
  });

  it('closes squad dashboard when clicking close jewel button', async () => {
    render(<FrostCartelHomePage />);

    const teamInput = screen.getByLabelText(/TEAM NAME \/ LOGIN ID/i);
    const passwordInput = screen.getByLabelText(/^PASSWORD$/i);
    const submitBtn = screen.getByRole('button', { name: /ENTER THE GAME/i });

    fireEvent.change(teamInput, { target: { value: 'CryptReapers' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: /Close portal/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('enters Round 1: The Graveyard Escape when clicking Enter Round 1 button', async () => {
    adminService.updateRound1Status('running');
    render(<FrostCartelHomePage />);

    const teamInput = screen.getByLabelText(/TEAM NAME \/ LOGIN ID/i);
    const passwordInput = screen.getByLabelText(/^PASSWORD$/i);
    const submitBtn = screen.getByRole('button', { name: /ENTER THE GAME/i });

    fireEvent.change(teamInput, { target: { value: 'ShadowSquad' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const enterRoundBtn = screen.getByRole('button', { name: /ENTER THE GRAVEYARD/i });
    fireEvent.click(enterRoundBtn);

    // Modal closes and Round 1 Master Dashboard is rendered
    expect(screen.getByText('ROUND 01 • MASTER PORTAL')).toBeInTheDocument();
    expect(screen.getByText('PORTAL 01')).toBeInTheDocument();
    expect(screen.getByText('PORTAL 02')).toBeInTheDocument();
    expect(screen.getByText('PORTAL 03')).toBeInTheDocument();

    // Clicking Exit returns to homepage
    const exitBtn = screen.getByRole('button', { name: /Exit/i });
    fireEvent.click(exitBtn);

    expect(screen.queryByText('ROUND 01 • MASTER PORTAL')).not.toBeInTheDocument();
    expect(screen.getByText('ENTER THE DARKNESS • CLAIM YOUR DESTINY')).toBeInTheDocument();
  });

  it('opens and closes tournament leaderboard modal from corner navigation', () => {
    render(<FrostCartelHomePage />);

    // Click Leaderboard in corner nav
    const leaderboardBtn = screen.getByRole('button', { name: /View Tournament Standings/i });
    fireEvent.click(leaderboardBtn);

    // Modal is visible
    expect(screen.getByText('FROST CARTEL LEADERBOARD')).toBeInTheDocument();
    expect(screen.getByText('TOURNAMENT AUDIT STANDINGS')).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getAllByRole('button', { name: /Close Leaderboard/i })[0];
    fireEvent.click(closeBtn);

    expect(screen.queryByText('FROST CARTEL LEADERBOARD')).not.toBeInTheDocument();
  });
});
