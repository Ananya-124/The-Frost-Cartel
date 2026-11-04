import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RoundFourIntro } from '../game/round4/RoundFourIntro';

describe('Round 04 Introduction: The Messenger\'s Letter', () => {
  const mockExit = vi.fn();
  const mockProceed = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders minimal header with branding, sound toggle, and exit, without avatar or banned banners', () => {
    render(<RoundFourIntro onExit={mockExit} onProceedToFloors={mockProceed} />);

    // Header branding
    expect(screen.getByText('FROST CARTEL')).toBeInTheDocument();
    expect(screen.getByText('ROUND 04')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mute Audio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exit Round 4 and return to Home/i })).toBeInTheDocument();

    // Constraint verification: strictly NO "THE RADIANT TREASURE HUNT" banner
    expect(screen.queryByText(/THE RADIANT TREASURE HUNT/i)).toBeNull();

    // Constraint verification: strictly NO player avatar
    expect(screen.queryByAltText(/player character/i)).toBeNull();
    expect(screen.queryByAltText(/hooded player/i)).toBeNull();
  });

  it('displays the white dove, sealed ancient letter on pedestal, and "A LETTER AWAITS..." prompt', () => {
    render(
      <RoundFourIntro
        onExit={mockExit}
        onProceedToFloors={mockProceed}
        initialState="LETTER_DROPPED"
      />
    );

    // Perched dove sprite presence
    expect(screen.getByAltText(/Perched White Dove/i)).toBeInTheDocument();

    // Letter on stone pedestal
    expect(screen.getByAltText(/Sealed ancient letter on stone pedestal/i)).toBeInTheDocument();

    // "A LETTER AWAITS..." callout
    expect(screen.getByText('A LETTER AWAITS...')).toBeInTheDocument();
  });

  it('opens the ancient parchment modal upon clicking the sealed letter and displays exact storyline', () => {
    render(
      <RoundFourIntro
        onExit={mockExit}
        onProceedToFloors={mockProceed}
        initialState="LETTER_DROPPED"
      />
    );

    const letterButton = screen.getByRole('button', { name: /Inspect and unseal ancient letter/i });
    fireEvent.click(letterButton);

    // Fast-forward open letter transition (400ms)
    act(() => {
      // Advance to LETTER_REVEALED
    });

    // Dialog title
    expect(screen.getByText('THE DAWN AWAKENS')).toBeInTheDocument();

    // Storyline text verification
    expect(
      screen.getByText(/The darkness has finally faded\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Beyond the graveyard, a new dawn awaits\. Hidden within the walls of your own college lies a forgotten treasure — a relic of knowledge, mystery and unimaginable value\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Explore the floors, uncover the scattered clues, and follow the ancient trail to discover the Golden Relic\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your next journey begins where your own story was written\./i)
    ).toBeInTheDocument();

    // Button to begin the hunt
    expect(screen.getByRole('button', { name: /Begin the hunt through time and space/i })).toBeInTheDocument();
  });

  it('navigates through the golden portal sequence into the college destination screen', () => {
    vi.useFakeTimers();

    render(
      <RoundFourIntro
        onExit={mockExit}
        onProceedToFloors={mockProceed}
        initialState="LETTER_REVEALED"
      />
    );

    // Click Begin the Hunt
    const beginButton = screen.getByRole('button', { name: /Begin the hunt through time and space/i });
    fireEvent.click(beginButton);

    // Advance cascading portal states:
    // PORTAL_IGNITION (900ms) -> SCREEN_CONTRACTION (1100ms) -> PARTICLE_FRAGMENTATION (900ms) -> WHITE_PORTAL (1000ms) -> TUNNEL_TRAVEL (1300ms) -> COLLEGE_REVEAL (900ms)
    act(() => { vi.advanceTimersByTime(1000); });
    act(() => { vi.advanceTimersByTime(1200); });
    act(() => { vi.advanceTimersByTime(1000); });
    act(() => { vi.advanceTimersByTime(1100); });
    act(() => { vi.advanceTimersByTime(1400); });
    act(() => { vi.advanceTimersByTime(1000); });

    // College destination should now be rendered
    expect(screen.getByText('THE COLLEGE OF OCCULT SCIENCES')).toBeInTheDocument();
    expect(screen.getByText('Grand Foyer & Marble Colonnade')).toBeInTheDocument();
    expect(screen.getByText('The Antiquities & Map Archives')).toBeInTheDocument();
    expect(screen.getByText('The Alchemical Laboratories')).toBeInTheDocument();
    expect(screen.getByText('The Astronomer’s Cupola & Observatory')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('calls onExit when exit button is clicked', () => {
    render(<RoundFourIntro onExit={mockExit} onProceedToFloors={mockProceed} />);

    const exitBtn = screen.getByRole('button', { name: /Exit Round 4 and return to Home/i });
    fireEvent.click(exitBtn);

    expect(mockExit).toHaveBeenCalledTimes(1);
  });
});
