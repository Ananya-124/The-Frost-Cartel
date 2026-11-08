import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { round1Service } from '../../services/round1Service';
import type { Stage1Config } from '../../types/round1.types';

vi.mock('../../utils/soundController', () => ({
  soundController: {
    isMuted: () => false,
    toggleMute: () => true,
    playClick: vi.fn(),
    playDiscover: vi.fn(),
    playError: vi.fn(),
    playChime: vi.fn(),
    playPortalWhoosh: vi.fn(),
    playVictory: vi.fn(),
    playHover: vi.fn(),
  },
}));

import { Stage1PumpkinShuffle } from '../game/stage1/Stage1PumpkinShuffle';

const config: Stage1Config = {
  title: 'The Pumpkin Shuffle',
  description: 'd',
  instructions: 'i',
  rewardCredits: 100,
  isReadyForPublication: true,
  activityType: 'skull_pumpkin_shuffle',
  pumpkinCount: 3,
  shuffleSeconds: 20,
  revealSeconds: 3,
};

const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

function setup(teamId: string, seed = 5) {
  round1Service.beginRound1(teamId, 'Test Squad', true);
  const onDone = vi.fn();
  const utils = render(
    <Stage1PumpkinShuffle
      teamId={teamId}
      config={config}
      isCompleted={false}
      onReturnDashboard={() => {}}
      onSkipStage={() => {}}
      onStageCompleted={onDone}
      rng={seeded(seed)}
    />
  );
  const skull = Math.floor(seeded(seed)() * 3); // the first random number picks the skull pumpkin
  const pumpkin = (id: number) => utils.container.querySelector(`[data-pumpkin="${id}"]`) as HTMLButtonElement;
  return { ...utils, onDone, skull, pumpkin };
}

describe('Stage 1 — Pumpkin Shuffle', () => {
  beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
  afterEach(() => { vi.useRealTimers(); });

  it('shows the skull briefly, hides it, shuffles for 20 seconds, then lets the player guess', async () => {
    const { container, pumpkin } = setup('s1-flow');
    expect(screen.getByText('Watch the skull. Follow the pumpkin.')).toBeInTheDocument();
    expect(pumpkin(0)).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /BEGIN THE RITE/i }));
    expect(screen.getByText(/Remember where the skull sleeps/i)).toBeInTheDocument();
    expect(container.querySelector('.s1-skull-rest')).toBeNull();

    await advance(800); // pumpkin lifts, skull visible
    expect(container.querySelector('.s1-skull-rest')).not.toBeNull();

    await advance(3000); // skull hidden again
    expect(container.querySelector('.s1-skull-rest')).toBeNull();

    await advance(1500); // shuffling has started
    expect(screen.getByText('The pumpkins are shuffling!')).toBeInTheDocument();
    expect(container.querySelector('.s1-skull-rest')).toBeNull(); // never visible while shuffling
    expect(pumpkin(0)).toBeDisabled();

    await advance(20500);
    expect(screen.getByText('Which pumpkin hides the skull?')).toBeInTheDocument();
    expect(pumpkin(0)).toBeEnabled();
    expect(container.querySelector('.s1-skull-rest')).toBeNull();
  });

  it('breaking the right pumpkin shows the skull and awards the credits once', async () => {
    const { container, pumpkin, skull, onDone } = setup('s1-win');
    fireEvent.click(screen.getByRole('button', { name: /BEGIN THE RITE/i }));
    await advance(25000);

    fireEvent.click(pumpkin(skull));
    await advance(500);
    expect(container.querySelector('.s1-skull-rise')).not.toBeNull();
    expect(container.querySelectorAll('.s1-shard').length).toBeGreaterThan(0);

    await advance(2000);
    expect(screen.getAllByText(/The skull awakens!/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/\+100 credits earned/i)).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(round1Service.getTeamSession('s1-win', 'Test Squad').credits).toBe(100);
    expect(round1Service.getTeamSession('s1-win', 'Test Squad').stages['stage-1'].status).toBe('completed');
  });

  it('breaking a wrong pumpkin shows smoke, reveals the real skull, awards nothing, and allows another try', async () => {
    const { container, pumpkin, skull, onDone } = setup('s1-miss');
    fireEvent.click(screen.getByRole('button', { name: /BEGIN THE RITE/i }));
    await advance(25000);

    fireEvent.click(pumpkin((skull + 1) % 3));
    await advance(500);
    expect(container.querySelectorAll('.s1-smoke').length).toBeGreaterThan(0);
    expect(container.querySelector('.s1-skull-rise')).toBeNull();

    await advance(2000);
    expect(screen.getByText('Only pumpkin guts…')).toBeInTheDocument();
    expect(container.querySelector('.s1-skull-rest')).not.toBeNull(); // the real hiding place is shown
    expect(onDone).not.toHaveBeenCalled();
    expect(round1Service.getTeamSession('s1-miss', 'Test Squad').credits).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: /FACE THE NEXT SHUFFLE/i }));
    expect(screen.getByText(/Remember where the skull sleeps/i)).toBeInTheDocument();
  });

  it('ignores clicks while the pumpkins are still shuffling', async () => {
    const { pumpkin, onDone } = setup('s1-early');
    fireEvent.click(screen.getByRole('button', { name: /BEGIN THE RITE/i }));
    await advance(6000);
    fireEvent.click(pumpkin(0));
    await advance(3000);
    expect(screen.getByText('The pumpkins are shuffling!')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
