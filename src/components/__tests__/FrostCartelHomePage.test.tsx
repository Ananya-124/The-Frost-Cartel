import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { FrostCartelHomePage } from '../home/FrostCartelHomePage';
import { authService } from '../../services/authService';
import { round1Service } from '../../services/round1Service';

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

  const stubRound1Server = () => {
    round1Service.beginRound1('server-test-team', 'ShadowSquad', true);
    const session = round1Service.getTeamSession('server-test-team', 'ShadowSquad');
    const progression = { success: true, teamId: 'server-test-team', rounds: [1, 2, 3, 4].map((round_id) => ({ round_id, status: round_id === 1 ? 'IN_PROGRESS' : 'LOCKED', eligible_at: null, completed_at: null })), hunts: [1, 2, 3].map((hunt_id) => ({ hunt_id, status: 'LOCKED', completed_at: null })) };
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.includes('/api/progression/me') ? progression
        : url.includes('/api/round1/state') ? { success: true, round: { id: 1, name: 'Round 1', isActive: true, totalDurationSeconds: 3600, remainingSeconds: 3600 }, team: { score: 0, maxCredits: 500, isPaused: false }, session, config: { stage1: round1Service.getStage1Config(), stage2: round1Service.getStage2Config(), stage3: round1Service.getStage3Config() } }
          : { success: true };
      return { ok: true, status: 200, json: async () => body };
    }));
  };

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

  it('requires a verified team session before showing round access', () => {
    render(<FrostCartelHomePage />);

    expect(screen.getAllByText('SIGN IN TO CHECK ACCESS')).toHaveLength(4);
    expect(screen.getAllByRole('button', { name: 'SIGN IN' })).toHaveLength(4);
    expect(screen.getAllByRole('button', { name: 'SIGN IN' }).every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
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
    const progression = { success: true, teamId: 'paradox-test', rounds: [1, 2, 3, 4].map((round_id) => ({ round_id, status: round_id === 3 ? 'AVAILABLE' : 'LOCKED', eligible_at: null, completed_at: null })), hunts: [1, 2, 3].map((hunt_id) => ({ hunt_id, status: hunt_id === 1 ? 'AVAILABLE' : 'LOCKED', completed_at: null })) };
    const signedIn = authService.getCurrentSession()!;
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const payload = url.includes('/api/progression/me/rounds/3/start') ? progression
        : url.includes('/api/progression/me') ? progression
          : url.includes('/api/auth/session') ? { success: true, playerNumber: 1, team: { id: signedIn.teamId, teamName: signedIn.teamName, score: 0, totalCredits: 0, maxCredits: 500, isPaused: false } }
            : state;
      return { ok: true, json: async () => payload };
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<FrostCartelHomePage />);

    const rounds = screen.getByRole('region', { name: 'Frost Cartel Game Rounds' });
    const round3Card = Array.from(rounds.querySelectorAll('h3'))
      .find((heading) => heading.textContent === 'PARADOX LAB')?.closest('.group');
    expect(round3Card).toBeTruthy();
    await within(round3Card as HTMLElement).findByText('AVAILABLE');
    fireEvent.click(within(round3Card as HTMLElement).getByRole('button', { name: 'ENTER ROUND' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/progression/me/rounds/3/start'), expect.anything()));
    expect(await screen.findByTestId('round3-game')).toHaveTextContent('Paradox Test Team');
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
    stubRound1Server();
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
    expect(screen.getByText('WALLET: 0 CR')).toBeInTheDocument();

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
    stubRound1Server();
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
    expect(await screen.findByText('ROUND 01 • MASTER PORTAL')).toBeInTheDocument();
    expect(await screen.findByText('PORTAL 01')).toBeInTheDocument();
    expect(await screen.findByText('PORTAL 02')).toBeInTheDocument();
    expect(await screen.findByText('PORTAL 03')).toBeInTheDocument();

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
