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

  it('orchestrates the blur-to-clear initial reveal and waits before launching dove flight', () => {
    vi.useFakeTimers();

    render(
      <RoundFourIntro
        onExit={mockExit}
        onProceedToFloors={mockProceed}
        initialState="INITIAL_REVEAL"
      />
    );

    // Initial state: dove is NOT flying yet while screen is blurred
    expect(screen.queryByAltText(/White messenger dove in flight/i)).toBeNull();

    // Fast forward 500ms (still during reveal): dove should NOT be flying
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByAltText(/White messenger dove in flight/i)).toBeNull();

    // Fast forward reveal completion (1000ms) + pause (400ms) = 1400ms total
    act(() => {
      vi.advanceTimersByTime(950);
    });

    // Dove flight animation should now be active
    expect(screen.getByAltText(/White messenger dove in flight/i)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('displays the perched white dove, sealed ancient letter on pedestal, and "OPEN THE ANCIENT LETTER" prompt', () => {
    render(
      <RoundFourIntro
        onExit={mockExit}
        onProceedToFloors={mockProceed}
        initialState="LETTER_AVAILABLE"
      />
    );

    // Perched dove sprite presence
    expect(screen.getByAltText(/Perched White Dove/i)).toBeInTheDocument();

    // Letter on stone pedestal
    expect(screen.getByAltText(/Sealed ancient letter on stone pedestal/i)).toBeInTheDocument();

    // "OPEN THE ANCIENT LETTER" callout and button
    expect(screen.getAllByText('OPEN THE ANCIENT LETTER').length).toBeGreaterThanOrEqual(1);
  });

  it('opens the ancient parchment modal upon clicking the sealed letter and displays exact storyline', () => {
    vi.useFakeTimers();

    render(
      <RoundFourIntro
        onExit={mockExit}
        onProceedToFloors={mockProceed}
        initialState="LETTER_AVAILABLE"
      />
    );

    const letterButton = screen.getByRole('button', { name: /OPEN THE ANCIENT LETTER/i });
    fireEvent.click(letterButton);

    // Fast-forward open letter transition (380ms)
    act(() => {
      vi.advanceTimersByTime(400);
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

    vi.useRealTimers();
  });

  it('crossfades smoothly via blur-to-clear transition into the college destination screen without particle explosions', () => {
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

    // Banned visual effects check: NO screen-shrinking tunnel or particle explosion
    expect(screen.queryByText(/streak-/i)).toBeNull();

    // Advance blur crossfade transition (1400ms)
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // College destination should now be rendered and fully interactive
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
