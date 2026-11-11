import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminPortal } from '../admin/AdminPortal';

describe('FROST CARTEL Admin Portal', () => {
  const mockNavigatePublic = vi.fn();
  let teams: Array<Record<string, unknown>>;
  const response = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  const apiPath = (input: RequestInfo | URL) => new URL(String(input), 'http://test.local').pathname;

  beforeEach(() => {
    vi.clearAllMocks();
    teams = [
      { id: 'team-1', teamName: 'Phantom Crypt', isPaused: false, score: 120, maxCredits: 500, totalCredits: 85, loginCount: 1, lastLoginAt: null, createdAt: '2026-01-01T00:00:00Z', stages: [{ stage_id: 1, status: 'COMPLETED', score: 120, max_score: 150, completed_at: '2026-01-01T00:10:00Z' }], rounds: [{ roundId: 1, status: 'IN_PROGRESS', completedAt: null }], hunts: [], round4: null },
      { id: 'team-2', teamName: 'Wraith Syndicate', isPaused: false, score: 80, maxCredits: 500, totalCredits: 80, loginCount: 1, lastLoginAt: null, createdAt: '2026-01-02T00:00:00Z', stages: [], rounds: [{ roundId: 1, status: 'AVAILABLE', completedAt: null }], hunts: [], round4: null },
    ];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = apiPath(input);
      if (path === '/api/admin/dashboard') return response({ success: true, data: { stats: { totalTeams: teams.length, activeTeams: 1, pausedTeams: 0, averageScore: 100, round1Active: true }, recentLogs: [] } });
      if (path === '/api/admin/teams' && init?.method === 'POST') {
        const payload = JSON.parse(String(init.body)) as { teamName: string };
        if (teams.some((team) => team.teamName === payload.teamName)) return response({ success: false, message: 'A squad with this name already exists.' }, 409);
        teams.push({ id: 'team-new', teamName: payload.teamName, isPaused: false, score: 0, maxCredits: 500, totalCredits: 0, loginCount: 0, lastLoginAt: null, createdAt: '2026-01-03T00:00:00Z', stages: [], rounds: [{ roundId: 1, status: 'AVAILABLE', completedAt: null }], hunts: [], round4: null });
        return response({ success: true, team: { id: 'team-new', teamName: payload.teamName } }, 201);
      }
      if (path === '/api/admin/teams') return response({ success: true, teams });
      if (path === '/api/round1/admin/config') return response({ success: true, configuration: { lifecycle: 'running', durationMinutes: 22 } });
      if (path === '/api/admin/results') return response({ success: true, results: teams.map((team, index) => ({ id: team.id, teamName: team.teamName, score: team.score, rank: index + 1, maxCredits: team.maxCredits, last_login_at: team.lastLoginAt, completedStages: 0 })) });
      return response({ success: false, message: `Unhandled test API ${path}` }, 404);
    }));
  });

  it('renders admin header and tab navigation with live-session status', async () => {
    render(<AdminPortal onNavigatePublic={mockNavigatePublic} />);

    expect(screen.getByText('CONTROL VAULT')).toBeInTheDocument();
    expect(screen.getByText('SERVER SESSION ACTIVE:')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Dashboard$/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Teams/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Round Control/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Results/i })[0]).toBeInTheDocument();
  });

  it('renders required summary metrics on Dashboard tab', () => {
    render(<AdminPortal onNavigatePublic={mockNavigatePublic} />);

    expect(screen.getByText('TOTAL TEAMS')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE SESSIONS')).toBeInTheDocument();
    expect(screen.getByText('WAITING')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE TEAMS')).toBeInTheDocument();
    expect(screen.getByText('PAUSED')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('switches to Teams tab and submits team creation to the server', async () => {
    render(<AdminPortal onNavigatePublic={mockNavigatePublic} />);

    // Switch to Teams
    const teamsBtn = screen.getAllByRole('button', { name: /Teams/i })[0];
    fireEvent.click(teamsBtn);

    // Click "+ Create Team"
    const createBtn = screen.getByRole('button', { name: /\+ Create Team/i });
    fireEvent.click(createBtn);

    expect(screen.getByText('MANUAL SQUAD CREATION')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/TEAM NAME/i);
    const passInput = screen.getByLabelText(/^MASTER PASSKEY/i);
    const confirmInput = screen.getByLabelText(/CONFIRM PASSKEY/i);
    const submitBtn = screen.getByRole('button', { name: /Create Squad/i });

    // Test creating team with duplicate name
    fireEvent.change(nameInput, { target: { value: 'Phantom Crypt' } });
    fireEvent.change(passInput, { target: { value: 'secretpass123' } });
    fireEvent.change(confirmInput, { target: { value: 'secretpass123' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();

    // Create unique team
    fireEvent.change(nameInput, { target: { value: 'Vampire Syndicate' } });
    fireEvent.change(passInput, { target: { value: 'cryptpass456' } });
    fireEvent.change(confirmInput, { target: { value: 'cryptpass456' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByText('MANUAL SQUAD CREATION')).not.toBeInTheDocument();
    });

    expect(teams.some((team) => team.teamName === 'Vampire Syndicate')).toBe(true);
  });

  it('filters teams by search input', async () => {
    render(<AdminPortal onNavigatePublic={mockNavigatePublic} />);

    const teamsBtn = screen.getAllByRole('button', { name: /Teams/i })[0];
    fireEvent.click(teamsBtn);

    const searchInput = screen.getByPlaceholderText(/Search team name\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'Phantom' } });

    expect(await screen.findByText('Phantom Crypt')).toBeInTheDocument();
    expect(screen.queryByText('Wraith Syndicate')).not.toBeInTheDocument();
  });

  it('navigates to Round Control and displays simultaneous stage architecture', () => {
    render(<AdminPortal onNavigatePublic={mockNavigatePublic} />);

    const roundsBtn = screen.getAllByRole('button', { name: /Round Control/i })[0];
    fireEvent.click(roundsBtn);

    expect(screen.getByText('ROUND 1 MASTER TIMELINE & CONTROLS')).toBeInTheDocument();
    expect(screen.getByText('The Crypt Chamber')).toBeInTheDocument();
    expect(screen.getByText('The Mausoleum Decipher')).toBeInTheDocument();
    expect(screen.getByText('The Arch-Lich Gate')).toBeInTheDocument();
    expect(screen.getByText('NON-SEQUENTIAL UNLOCK VERIFIED')).toBeInTheDocument();
  });

  it('switches to Results tab, loads server standings, and triggers CSV export', async () => {
    render(<AdminPortal onNavigatePublic={mockNavigatePublic} />);

    const resultsBtn = screen.getAllByRole('button', { name: /Results/i })[0];
    fireEvent.click(resultsBtn);

    expect(await screen.findByText('Rankings:')).toBeInTheDocument();
    expect(screen.getByText('Stage 1 Score')).toBeInTheDocument();
    expect(screen.getByText('Stage 2 Score')).toBeInTheDocument();
    expect(screen.getByText('Stage 3 Score')).toBeInTheDocument();
    expect(screen.getByText('Official Score')).toBeInTheDocument();
    expect(screen.getByText('Wallet Credits')).toBeInTheDocument();

    const exportBtn = screen.getByRole('button', { name: /Export Results \(CSV\)/i });
    expect(exportBtn).toBeInTheDocument();
  });

  it('returns to public homepage when clicking View Public Homepage button', () => {
    render(<AdminPortal onNavigatePublic={mockNavigatePublic} />);

    const publicBtn = screen.getByRole('button', { name: /View Public Homepage/i });
    fireEvent.click(publicBtn);

    expect(mockNavigatePublic).toHaveBeenCalledTimes(1);
  });
});
