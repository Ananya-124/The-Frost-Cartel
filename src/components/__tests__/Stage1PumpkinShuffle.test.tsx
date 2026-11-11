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
  trials: [
    { pumpkins: 5, tries: 2, reward: 40, shuffleSeconds: 20 },
    { pumpkins: 7, tries: 2, reward: 60, shuffleSeconds: 20 },
  ],
  revealSeconds: 3,
};

const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const ATTEMPT_MS = 25000; // lead + reveal + lead + 20s shuffle + settle
const credits = (id: string) => round1Service.getTeamSession(id, 'Test Squad').credits;

/** `skulls` lists which pumpkin hides the skull on each attempt, in order. */
function setup(teamId: string, skulls: number[] = [0, 0, 0, 0]) {
  round1Service.beginRound1(teamId, 'Test Squad', true);
  const session = round1Service.getTeamSession(teamId, 'Test Squad');
  const serverState = { ...session.stage1State, trials: session.stage1State.trials.map((trial) => ({ ...trial })) };
  let serverCredits = 0;
  let activeTarget = 0;
  const onAward = vi.fn();
  const queue = [...skulls];
  const onAction = vi.fn(async (type: string, fields: Record<string, unknown> = {}) => {
    let skullId: number | undefined;
    let creditsAwarded = 0;
    const trialIndex = Number(fields.trialIndex ?? 0);
    const trial = serverState.trials[trialIndex];
    if (type === 'stage1.begin') {
      trial.attemptsUsed += 1;
      activeTarget = queue.shift() ?? 0;
      skullId = activeTarget;
      serverState.activeTrial = trialIndex;
      serverState.activeTarget = activeTarget;
    } else if (type === 'stage1.guess') {
      const won = Number(fields.guessId) === activeTarget;
      if (won) {
        trial.status = 'won';
        trial.earnedCredits = config.trials[trialIndex].reward;
        creditsAwarded = trial.earnedCredits;
        serverCredits += creditsAwarded;
      } else if (trial.attemptsUsed >= config.trials[trialIndex].tries) trial.status = 'lost';
    }
    const response = { success: true, session: { ...session, credits: serverCredits, stage1State: { ...serverState, trials: serverState.trials.map((item) => ({ ...item })) } }, score: serverCredits, completed: false, skullId, creditsAwarded };
    return response;
  });
  const ui = (
    <Stage1PumpkinShuffle
      teamId={teamId}
      config={config}
      onReturnDashboard={() => {}}
      onSkipStage={() => {}}
      onCreditsAwarded={onAward}
      rng={seeded(11)}
      pickSkull={() => queue.shift() ?? 0}
      initialState={serverState}
      secondsRemaining={1200}
      onAction={onAction}
    />
  );
  const utils = render(ui);
  const pumpkin = (id: number) => utils.container.querySelector(`[data-pumpkin="${id}"]`) as HTMLButtonElement;
  return { ...utils, ui, onAward, pumpkin, onAction, serverState, getServerCredits: () => serverCredits, session };
}

/** Starts the shown trial, waits for the shuffle to end, then smashes `pick`. */
async function attempt(pumpkin: (id: number) => HTMLButtonElement, begin: RegExp, pick: number, settleMs = 2600) {
  fireEvent.click(screen.getByRole('button', { name: begin }));
  await advance(ATTEMPT_MS);
  expect(screen.getByText('Which pumpkin hides the skull?')).toBeInTheDocument();
  fireEvent.click(pumpkin(pick));
  await advance(settleMs);
}

describe('Stage 1 — Pumpkin Shuffle (two trials)', () => {
  beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); sessionStorage.clear(); });
  afterEach(() => { vi.useRealTimers(); });

  it('opens on Trial I with 5 pumpkins, 2 tries and 40 credits', () => {
    const { container } = setup('s1-open');
    expect(screen.getByText('Trial I — 5 pumpkins')).toBeInTheDocument();
    expect(screen.getByText(/40 credits · 2 tries · 20s shuffle/i)).toBeInTheDocument();
    expect(container.querySelectorAll('[data-pumpkin]')).toHaveLength(5);
  });

  it('shows the skull briefly, hides it, shuffles 20 seconds, then lets the player guess', async () => {
    const { container, pumpkin } = setup('s1-flow');
    fireEvent.click(screen.getByRole('button', { name: /Begin trial I/i }));
    expect(container.querySelector('.s1-skull-rest')).toBeNull();

    await advance(800);
    expect(container.querySelector('.s1-skull-rest')).not.toBeNull(); // skull visible
    await advance(3000);
    expect(container.querySelector('.s1-skull-rest')).toBeNull(); // hidden again

    await advance(1500);
    expect(screen.getByText('Follow the skull')).toBeInTheDocument();
    expect(container.querySelector('.s1-skull-rest')).toBeNull(); // never visible while shuffling
    expect(pumpkin(0)).toBeDisabled();

    await advance(20500);
    expect(screen.getByText('Which pumpkin hides the skull?')).toBeInTheDocument();
    expect(pumpkin(0)).toBeEnabled();
  });

  it('spends a try as soon as the trial starts', async () => {
    const { serverState, onAction } = setup('s1-spend');
    fireEvent.click(screen.getByRole('button', { name: /Begin trial I/i }));
    await act(async () => { await Promise.resolve(); });
    expect(onAction).toHaveBeenCalledWith('stage1.begin', { trialIndex: 0 });
    expect(serverState.trials[0].attemptsUsed).toBe(1);
  });

  it('winning Trial I on the first try shows the skull and awards 40 credits', async () => {
    const { container, pumpkin, onAward } = setup('s1-win1', [2]);
    fireEvent.click(screen.getByRole('button', { name: /Begin trial I/i }));
    await advance(ATTEMPT_MS);
    fireEvent.click(pumpkin(2));
    await advance(700);
    expect(container.querySelector('.s1-skull-emerge')).not.toBeNull();
    expect(container.querySelectorAll('.s1-shell-shard')).toHaveLength(16);
    expect(container.querySelectorAll('.s1-seed')).toHaveLength(12);
    expect(container.querySelector('.s1-blast-flash')).not.toBeNull();
    expect(container.querySelectorAll('.s1-blast-smoke')).toHaveLength(7);

    await advance(2000);
    expect(screen.getByText('Trial I cleared')).toBeInTheDocument();
    expect(screen.getByText('+40 credits')).toBeInTheDocument();
    expect(onAward).toHaveBeenCalledTimes(1);
    expect(credits('s1-win1')).toBe(0); // browser cache is not the gameplay authority
  });

  it('a wrong pumpkin on try 1 leaves one try; winning on try 2 still pays 40', async () => {
    const { container, pumpkin, getServerCredits, serverState } = setup('s1-try2', [1, 3]);
    await attempt(pumpkin, /Begin trial I/i, 0); // wrong
    expect(container.querySelectorAll('.s1-dust').length).toBeGreaterThan(0);
    expect(container.querySelector('.s1-skull-emerge')).toBeNull();
    expect(screen.getByText('One try left')).toBeInTheDocument();
    expect(getServerCredits()).toBe(0);

    await attempt(pumpkin, /Take the last try/i, 3); // right
    expect(screen.getByText('Trial I cleared')).toBeInTheDocument();
    expect(getServerCredits()).toBe(40);
    expect(serverState.trials[0].attemptsUsed).toBe(2);
  });

  it('two wrong guesses lose Trial I (no credits) and Trial II unlocks with 7 pumpkins', async () => {
    const { container, pumpkin, getServerCredits } = setup('s1-lose1', [1, 1]);
    await attempt(pumpkin, /Begin trial I/i, 0);
    await attempt(pumpkin, /Take the last try/i, 0, 2800);
    expect(screen.getByText('Trial I lost')).toBeInTheDocument();
    expect(screen.getByText('No credits this trial')).toBeInTheDocument();
    expect(getServerCredits()).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: /Continue to trial II/i }));
    expect(screen.getByText('Trial II — 7 pumpkins')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-pumpkin]')).toHaveLength(7);
    expect(screen.getByText(/60 credits · 2 tries/i)).toBeInTheDocument();
  });

  it('winning both trials gives 100 credits and the summary', async () => {
    const { pumpkin, onAward, getServerCredits, serverState } = setup('s1-both', [0, 6]);
    await attempt(pumpkin, /Begin trial I/i, 0);
    fireEvent.click(screen.getByRole('button', { name: /Continue to trial II/i }));
    await attempt(pumpkin, /Begin trial II/i, 6);
    expect(screen.getByText('Trial II cleared')).toBeInTheDocument();
    expect(screen.getByText('+60 credits')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /See the result/i }));
    expect(screen.getByText('Stage 1 finished')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(onAward).toHaveBeenCalledTimes(2);
    expect(getServerCredits()).toBe(100);
    expect(serverState.trials.every((trial) => trial.status === 'won')).toBe(true);
  });

  it('ignores clicks while the pumpkins are still shuffling', async () => {
    const { pumpkin, onAward } = setup('s1-early');
    fireEvent.click(screen.getByRole('button', { name: /Begin trial I/i }));
    await advance(6000);
    fireEvent.click(pumpkin(0));
    await advance(3000);
    expect(screen.getByText('Follow the skull')).toBeInTheDocument();
    expect(onAward).not.toHaveBeenCalled();
  });

  it('leaving mid-trial does not refund the try', async () => {
    const first = setup('s1-leave');
    fireEvent.click(screen.getByRole('button', { name: /Begin trial I/i }));
    await advance(1000);
    first.unmount();

    render(<Stage1PumpkinShuffle teamId="s1-leave" config={config} initialState={first.serverState} secondsRemaining={1200} onAction={first.onAction} onReturnDashboard={() => {}} onSkipStage={() => {}} onCreditsAwarded={() => {}} />);
    expect(screen.getByText(/1 try left in this trial/i)).toBeInTheDocument();
  });

  it('opens straight on the summary when both trials are already finished', () => {
    round1Service.beginRound1('s1-done', 'Test Squad', true);
    const completed = round1Service.getStage1State('s1-done')!;
    completed.trials.forEach((trial) => { trial.status = 'won'; });
    render(
      <Stage1PumpkinShuffle teamId="s1-done" config={config} initialState={completed} secondsRemaining={1200} onAction={vi.fn()} onReturnDashboard={() => {}} onSkipStage={() => {}} onCreditsAwarded={() => {}} />
    );
    expect(screen.getByText('Stage 1 finished')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Begin trial/i })).toBeNull();
  });
});
