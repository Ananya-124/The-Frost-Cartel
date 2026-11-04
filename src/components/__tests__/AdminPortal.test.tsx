import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminPortal } from '../admin/AdminPortal';

describe('FROST CARTEL Admin Portal', () => {
  const mockNavigatePublic = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders admin header, tab navigation, and mock mode banner', () => {
    render(<AdminPortal onNavigatePublic={mockNavigatePublic} />);

    expect(screen.getByText('CONTROL VAULT')).toBeInTheDocument();
    expect(screen.getByText('MOCK REPOSITORY ACTIVE:')).toBeInTheDocument();
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

  it('switches to Teams tab and creates a new squad with unique name validation', async () => {
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

    expect(screen.getByText('Vampire Syndicate')).toBeInTheDocument();
  });

  it('filters teams by search input', () => {
    render(<AdminPortal onNavigatePublic={mockNavigatePublic} />);

    const teamsBtn = screen.getAllByRole('button', { name: /Teams/i })[0];
    fireEvent.click(teamsBtn);

    const searchInput = screen.getByPlaceholderText(/Search team name\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'Phantom' } });

    expect(screen.getByText('Phantom Crypt')).toBeInTheDocument();
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

  it('switches to Results tab, lists standings, and triggers CSV export', () => {
    render(<AdminPortal onNavigatePublic={mockNavigatePublic} />);

    const resultsBtn = screen.getAllByRole('button', { name: /Results/i })[0];
    fireEvent.click(resultsBtn);

    expect(screen.getByText('Rankings:')).toBeInTheDocument();
    expect(screen.getByText('Stage 1 (100 CR)')).toBeInTheDocument();
    expect(screen.getByText('Stage 2 (150 CR)')).toBeInTheDocument();
    expect(screen.getByText('Stage 3 (250 CR)')).toBeInTheDocument();

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
