import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Stage1Config, Stage1State } from '../../../types/round1.types';
import { DEFAULT_STAGE1_TRIALS } from '../../../constants/stage1.constants';
import type { Round1ActionResponse } from '../../../services/round1ApiService';
import { soundController } from '../../../utils/soundController';
import { SkipStageModal } from '../common/SkipStageModal';
import { HauntedGraveyardAtmosphere } from '../haunted/HauntedGraveyardAtmosphere';
import { LedClock } from './LedClock';
import { type Round1TimerStore, useRound1TimerSeconds, useRound1TimerStore } from '../round1TimerStore';
import { PumpkinSvg, S1Defs, SkullSvg } from './PumpkinArt';
import {
  buildShufflePlan,
  clampPumpkinCount,
  clampSeconds,
  identitySlots,
  pumpkinAtSlot,
  planSwaps,
  swapSlots,
} from './pumpkinShuffle';
import '../../../styles/stage1.css';

interface Stage1PumpkinShuffleProps {
  teamId: string;
  config: Stage1Config;
  onReturnDashboard: () => void;
  onSkipStage: () => void;
  /** Called whenever a trial is won and credits were added. */
  onCreditsAwarded: () => void;
  initialState: Stage1State;
  timerStore?: Round1TimerStore;
  secondsRemaining?: number;
  onAction: (type: string, fields?: Record<string, unknown>) => Promise<Round1ActionResponse>;
  /** Random source for the shuffle — only replaced in tests. */
  rng?: () => number;
  /** Chooses which pumpkin hides the skull — only replaced in tests. */
}

type Phase = 'intro' | 'reveal' | 'shuffle' | 'guess' | 'smashing' | 'missed' | 'trial_end' | 'summary';

const LEAD_MS = 700; // pause before the skull is shown, and after it is hidden again
const SMASH_MS = 450; // how long the pumpkin shakes before it bursts
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

const SHARD_GRID = [
  [[0, 0], [25, 0], [50, 0], [76, 0], [100, 0]],
  [[0, 24], [22, 27], [52, 22], [77, 28], [100, 23]],
  [[0, 50], [27, 47], [49, 53], [76, 48], [100, 52]],
  [[0, 75], [23, 78], [53, 72], [75, 78], [100, 74]],
  [[0, 100], [26, 100], [49, 100], [77, 100], [100, 100]],
];
const SHELL_SHARDS = SHARD_GRID.slice(0, 4).flatMap((row, y) =>
  row.slice(0, 4).map((_, x) => {
    const points = [row[x], row[x + 1], SHARD_GRID[y + 1][x + 1], SHARD_GRID[y + 1][x]];
    const polygon = points.map(([px, py]) => `${px}% ${py}%`).join(', ');
    const dx = (x - 1.5) * 42 + (y % 2 ? 10 : -8);
    const dy = (y - 1.5) * 36 - 28 - (x % 2) * 12;
    const rotation = (x * 17 - y * 13) + (x % 2 ? 19 : -16);
    return { polygon, dx, dy, rotation, delay: (x + y) * 0.012 };
  })
);

const EMBERS = [
  { ex: -26, ey: -70, delay: '0.5s' },
  { ex: 18, ey: -84, delay: '0.65s' },
  { ex: -8, ey: -96, delay: '0.8s' },
  { ex: 32, ey: -60, delay: '0.95s' },
  { ex: -34, ey: -50, delay: '1.1s' },
  { ex: 6, ey: -76, delay: '1.25s' },
];
const SEEDS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const distance = 48 + (i % 3) * 15;
  return {
    dx: Math.round(Math.cos(angle) * distance),
    dy: Math.round(Math.sin(angle) * distance - 25),
    rotation: (i * 47) % 180,
    delay: `${(i % 4) * 0.025}s`,
  };
});

const NOTICE: Record<string, string> = {
  expired: 'The round timer has ended — no more credits can be earned.',
  resolved: 'This trial is already closed.',
  no_tries: 'There are no tries left in this trial.',
  locked: 'Finish the previous trial first.',
  unknown_team: 'This squad has not started Round 1 yet.',
  bad_trial: 'This trial does not exist.',
};

const fmt = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
const vars = (o: Record<string, string | number>) => o as unknown as React.CSSProperties;
const cloneState = (s: Stage1State): Stage1State => ({ trials: s.trials.map((t) => ({ ...t })) });

const SoundIcon = ({ muted }: { muted: boolean }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 10v4h4l5 4V6l-5 4H4z" />
    {muted ? <path fill="none" d="M17 9l4 6M21 9l-4 6" /> : <path fill="none" d="M16.5 9a4 4 0 010 6M19 6.5a8 8 0 010 11" />}
  </svg>
);
const Pips: React.FC<{ used: number; total: number }> = ({ used, total }) => (
  <span className="inline-flex gap-1.5 align-middle" aria-label={`${total - used} of ${total} tries left`}>
    {Array.from({ length: total }, (_, i) => <span key={i} className={`s1-pip ${i < used ? 's1-pip-used' : ''}`} />)}
  </span>
);

const Round1TimerClock: React.FC<{ timerStore: Round1TimerStore }> = ({ timerStore }) => {
  const secondsRemaining=useRound1TimerSeconds(timerStore);
  return <LedClock value={fmt(secondsRemaining)} warn={secondsRemaining <= 60} label={`Round time left ${fmt(secondsRemaining)}`} />;
};

const Round1TimerButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { timerStore: Round1TimerStore }> = ({ timerStore, disabled, ...props }) => {
  const secondsRemaining=useRound1TimerSeconds(timerStore);
  return <button {...props} disabled={disabled || secondsRemaining <= 0} />;
};

const Round1ExpiredNotice: React.FC<{ timerStore: Round1TimerStore }> = ({ timerStore }) => {
  const secondsRemaining=useRound1TimerSeconds(timerStore);
  return secondsRemaining <= 0 ? <p className="s1-body text-sm text-red-300 mt-2">{NOTICE.expired}</p> : null;
};

export const Stage1PumpkinShuffle: React.FC<Stage1PumpkinShuffleProps> = ({
  teamId: _teamId,
  config,
  onReturnDashboard,
  onSkipStage,
  onCreditsAwarded,
  initialState,
  timerStore,
  secondsRemaining = 25 * 60,
  onAction,
  rng = Math.random,
}) => {
  const resolvedTimerStore = useRound1TimerStore(timerStore, secondsRemaining);
  const trials = config.trials && config.trials.length > 0 ? config.trials : DEFAULT_STAGE1_TRIALS;
  const revealMs = clampSeconds(config.revealSeconds, 3, 1, 10) * 1000;

  const [state, setState] = useState<Stage1State>(() => cloneState(initialState));
  const firstPending = state.trials.findIndex((t) => t.status === 'pending');
  const [trialIdx, setTrialIdx] = useState(() => (firstPending === -1 ? trials.length - 1 : firstPending));
  const [phase, setPhase] = useState<Phase>(() => (firstPending === -1 ? 'summary' : 'intro'));

  const trial = trials[trialIdx];
  const trialState = state.trials[trialIdx];
  const count = clampPumpkinCount(trial.pumpkins);
  const shuffleMs = clampSeconds(trial.shuffleSeconds, 20, 5, 60) * 1000;
  const triesLeft = trial.tries - trialState.attemptsUsed;

  const [slots, setSlots] = useState<number[]>(() => identitySlots(count));
  const [skullId, setSkullId] = useState(0);
  const [lifted, setLifted] = useState<number | null>(null); // pumpkin raised to show the skull
  const [broken, setBroken] = useState<number | null>(null); // pumpkin being smashed
  const [burst, setBurst] = useState(false);
  const [swapMs, setSwapMs] = useState(400);
  const [front, setFront] = useState<number | null>(null);
  const [shuffleLeft, setShuffleLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const [lastResult, setLastResult] = useState<{ won: boolean; awarded: number; expired: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [isMuted, setIsMuted] = useState(soundController.isMuted());
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ticker = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const slotsRef = useRef<number[]>(slots);
  const skullRef = useRef(0);
  const hopRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const btnRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const actionPendingRef = useRef(false);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    clearInterval(ticker.current);
  }, []);
  useEffect(() => clearAll, [clearAll]);

  useEffect(() => setState(cloneState(initialState)), [initialState]);

  const hop = (id: number, up: boolean, ms: number) => {
    const el = hopRefs.current[id];
    if (!el || typeof el.animate !== 'function') return;
    el.animate(
      [
        { transform: 'translateY(0) scale(1)' },
        { transform: `translateY(${up ? -22 : 8}px) scale(${up ? 1.05 : 0.96})`, offset: 0.5 },
        { transform: 'translateY(0) scale(1)' },
      ],
      { duration: ms, easing: 'ease-in-out' }
    );
  };

  const applySwap = (a: number, b: number, stepMs: number) => {
    const dur = Math.max(220, Math.round(stepMs * 0.85));
    const idA = pumpkinAtSlot(slotsRef.current, a);
    const idB = pumpkinAtSlot(slotsRef.current, b);
    const next = swapSlots(slotsRef.current, a, b);
    slotsRef.current = next;
    setSwapMs(dur);
    setFront(idA);
    setSlots(next);
    hop(idA, true, dur);
    hop(idB, false, dur);
  };

  const beginShuffle = (swaps: [number, number][], plan: number[]) => {
    setPhase('shuffle');
    soundController.playPortalWhoosh();
    const startedAt = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      setShuffleLeft(Math.max(0, Math.ceil((shuffleMs - elapsed) / 1000)));
      setProgress(Math.min(1, elapsed / shuffleMs));
    };
    tick();
    ticker.current = setInterval(tick, 200);
    let at = 0;
    plan.forEach((stepMs, i) => {
      schedule(() => applySwap(swaps[i][0], swaps[i][1], stepMs), at);
      at += stepMs;
    });
    schedule(() => {
      clearInterval(ticker.current);
      setShuffleLeft(0);
      setProgress(1);
      setFront(null);
      setPhase('guess');
      soundController.playChime();
    }, at + 500);
  };

  const startAttempt = async () => {
    if (actionPendingRef.current) return;
    if(resolvedTimerStore.getSnapshot()<=0){setNotice(NOTICE.expired);return;}
    actionPendingRef.current = true;
    setActionPending(true);
    try {
    const res = await onAction('stage1.begin', { trialIndex: trialIdx });
    setState(cloneState(res.session.stage1State));
    setNotice(null);
    clearAll();
    soundController.playClick();
    const start = identitySlots(count);
    slotsRef.current = start;
    setSlots(start);
    setBroken(null);
    setBurst(false);
    setLifted(null);
    setFront(null);
    setLastResult(null);
    setShuffleLeft(Math.round(shuffleMs / 1000));
    setProgress(0);

    const id = Number(res.skullId);
    skullRef.current = id;
    setSkullId(id);
    setPhase('reveal');

    const plan = buildShufflePlan(shuffleMs);
    const swaps = planSwaps(count, plan.length, rng);
    schedule(() => {
      setLifted(id);
      soundController.playDiscover();
    }, LEAD_MS);
    schedule(() => setLifted(null), LEAD_MS + revealMs);
    schedule(() => beginShuffle(swaps, plan), LEAD_MS + revealMs + LEAD_MS);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Cannot start this trial.'); }
    finally { actionPendingRef.current = false; setActionPending(false); }
  };

  const smash = (id: number) => {
    if (phase !== 'guess') return;
    setPhase('smashing');
    setBroken(id);
    setBurst(false);
    soundController.playClick();
    schedule(() => {
      setBurst(true);
      void (async () => {
        try {
          const res = await onAction('stage1.guess', { trialIndex: trialIdx, guessId: id });
          const nextState = res.session.stage1State;
          setState(cloneState(nextState));
          const won = nextState.trials[trialIdx].status === 'won';
          if (won) soundController.playDiscover(); else soundController.playError();
          if (won && Number(res.creditsAwarded ?? 0) > 0) onCreditsAwarded();
          setLastResult({ won, awarded: Number(res.creditsAwarded ?? 0), expired: Boolean(res.expired) });
          if (!won && nextState.trials[trialIdx].status === 'pending') schedule(() => setLifted(skullRef.current), 700);
          schedule(() => setPhase(won || nextState.trials[trialIdx].status !== 'pending' ? 'trial_end' : 'missed'), 1800);
        } catch (error) { setNotice(error instanceof Error ? error.message : 'The guess could not be submitted.'); setPhase('guess'); }
      })();
    }, SMASH_MS);
  };

  const goToTrial = (idx: number) => {
    clearAll();
    const c = clampPumpkinCount(trials[idx].pumpkins);
    const start = identitySlots(c);
    slotsRef.current = start;
    setSlots(start);
    setTrialIdx(idx);
    setBroken(null);
    setBurst(false);
    setLifted(null);
    setLastResult(null);
    setNotice(null);
    setPhase('intro');
  };

  const continueAfterTrial = () => {
    const next = state.trials.findIndex((t) => t.status === 'pending');
    if (next === -1) {
      setPhase('summary');
    } else {
      goToTrial(next);
    }
  };

  const focusSlot = (slot: number) => {
    const id = pumpkinAtSlot(slotsRef.current, slot);
    if (id >= 0) btnRefs.current[id]?.focus();
  };
  const onGroupKey = (e: React.KeyboardEvent) => {
    if (phase !== 'guess') return;
    const activeId = Object.entries(btnRefs.current).find(([, el]) => el === document.activeElement)?.[0];
    if (activeId === undefined) return;
    const slot = slots[Number(activeId)];
    if (e.key === 'ArrowRight') { e.preventDefault(); focusSlot(Math.min(count - 1, slot + 1)); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); focusSlot(Math.max(0, slot - 1)); }
  };

  const canPick = phase === 'guess';
  const totalEarned = state.trials.reduce((a, t) => a + t.earnedCredits, 0);
  const totalPossible = trials.reduce((a, t) => a + t.reward, 0);
  const isLastTrial = trialIdx >= trials.length - 1;
  const allClosed = state.trials.every((t) => t.status !== 'pending');

  const titles: Record<Phase, { title: string; hint: string }> = {
    intro: { title: `Trial ${ROMAN[trialIdx]} — ${count} pumpkins`, hint: 'A skull rests under one pumpkin. Watch where it goes, follow the shuffle, then smash the right one.' },
    reveal: { title: 'Mark where the skull rests', hint: 'It will be hidden in a moment.' },
    shuffle: { title: 'Follow the skull', hint: 'Keep your eyes on the pumpkin that hides it.' },
    guess: { title: 'Which pumpkin hides the skull?', hint: 'Click a pumpkin to smash it, or use ← → and Enter.' },
    smashing: { title: '…', hint: '' },
    missed: { title: 'Nothing but pulp', hint: 'The skull was under the pumpkin that was raised.' },
    trial_end: lastResult?.won
      ? { title: `Trial ${ROMAN[trialIdx]} cleared`, hint: '' }
      : { title: `Trial ${ROMAN[trialIdx]} lost`, hint: '' },
    summary: { title: 'Stage 1 finished', hint: '' },
  };

  return (
    <div className="relative flex-1 flex flex-col text-cartel-bone font-sans">
      <S1Defs />
      {/* Original background, untouched */}
      <HauntedGraveyardAtmosphere />

      <div className="relative z-10 flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 py-4 sm:py-5">
        {/* Top bar */}
        <header className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-start gap-x-6 gap-y-3">
          <div className="hidden lg:block" aria-hidden="true" />

          <div className="order-2 lg:order-none text-center">
            <div className="s1-label">
              Stage 01 of 03 <span aria-hidden="true">•</span> {totalPossible} credits
              {allClosed && <span> <span aria-hidden="true">•</span> {totalEarned} earned <span aria-hidden="true">✓</span></span>}
            </div>
            <h1 className="s1-title mt-1">{config.title}</h1>
          </div>

          <div className="order-1 lg:order-none justify-self-center lg:justify-self-end flex flex-wrap items-center justify-center gap-2.5">
            <Round1TimerClock timerStore={resolvedTimerStore} />
            <button type="button" onClick={() => setIsMuted(soundController.toggleMute())} aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'} className="s1-icon-btn">
              <SoundIcon muted={isMuted} />
            </button>
            <button type="button" onClick={() => setIsSkipModalOpen(true)} className="s1-btn-outline">Skip stage</button>
            <button type="button" onClick={onReturnDashboard} className="s1-btn-outline">Round dashboard</button>
          </div>
        </header>

        {/* Trial progress */}
        <nav className="flex flex-wrap items-center justify-center gap-2 mt-4" aria-label="Trials">
          {trials.map((t, i) => {
            const st = state.trials[i];
            const cls = st.status === 'won' ? 's1-chip-won' : st.status === 'lost' ? 's1-chip-lost' : i === trialIdx && phase !== 'summary' ? 's1-chip-active' : '';
            const mark = st.status === 'won' ? ' ✓' : st.status === 'lost' ? ' ✕' : '';
            return (
              <span key={i} className={`s1-chip ${cls}`}>
                Trial {ROMAN[i]} · {t.pumpkins} pumpkins · {t.reward} CR{mark}
              </span>
            );
          })}
          {phase !== 'summary' && (
            <span className="s1-chip flex items-center gap-2">
              Tries <Pips used={trialState.attemptsUsed} total={trial.tries} />
            </span>
          )}
        </nav>

        {/* Status */}
        <section className="text-center mt-5 mb-1 min-h-[84px]" aria-live="polite">
          <h2 className="s1-head text-2xl sm:text-3xl">{titles[phase].title}</h2>
          {titles[phase].hint && <p className="s1-body text-base sm:text-lg mt-1 max-w-md mx-auto leading-snug">{titles[phase].hint}</p>}
          {phase === 'shuffle' && (
            <div className="mt-3 max-w-xs mx-auto">
              <div className="s1-head flex justify-between text-xs tracking-[0.2em] mb-1.5"><span>Shuffling</span><span className="tabular-nums">{fmt(shuffleLeft)}</span></div>
              <div className="s1-bar" role="progressbar" aria-label="Shuffle progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><span style={{ width: `${progress * 100}%` }} /></div>
            </div>
          )}
        </section>

        {/* The stage: pumpkins on a mossy stone ledge */}
        {phase !== 'summary' && (
          <div className="s1-altar w-full max-w-2xl mx-auto" style={vars({ '--n': count })} role="group" aria-label="Pumpkins" onKeyDown={onGroupKey}>
            <div className="s1-ledge" aria-hidden="true" />
            <div className="s1-candle s1-candle-left" aria-hidden="true">
              <span className="s1-candle-flame" />
              <span className="s1-candle-wick" />
              <span className="s1-candle-body">
                <span className="s1-wax-drip s1-wax-drip-one" />
                <span className="s1-wax-drip s1-wax-drip-two" />
              </span>
              <span className="s1-candle-foot" />
            </div>
            <div className="s1-candle s1-candle-right" aria-hidden="true">
              <span className="s1-candle-flame" />
              <span className="s1-candle-wick" />
              <span className="s1-candle-body">
                <span className="s1-wax-drip s1-wax-drip-two" />
                <span className="s1-wax-drip s1-wax-drip-one" />
              </span>
              <span className="s1-candle-foot" />
            </div>
            <div className="s1-cells">
              {slots.map((slot, id) => {
                const isBroken = broken === id;
                const idle = phase === 'intro' || phase === 'guess' || phase === 'missed';
                const hasSkull = id === skullId;
                return (
                  <div
                    key={id}
                    className={`s1-cell ${lifted === id ? 's1-lifted' : ''} ${idle ? 's1-idle' : ''} ${isBroken && !burst ? 's1-shaking' : ''}`}
                    style={vars({ '--swap-ms': `${swapMs}ms`, '--d': `${-id * 0.9}s`, transform: `translateX(${slot * 100}%)`, zIndex: front === id || isBroken ? 5 : 1 })}
                  >
                    {!(isBroken && burst) && <span className="s1-pool" aria-hidden="true" />}
                    <span className="s1-shadow" aria-hidden="true" />

                    {/* the skull lies on the table only while it is meant to be seen */}
                    {lifted === id && hasSkull && !isBroken && <SkullSvg className="s1-skull-rest" />}

                    {!(isBroken && burst) && (
                      <button
                        type="button"
                        ref={(el) => { btnRefs.current[id] = el; }}
                        data-pumpkin={id}
                        disabled={!canPick}
                        tabIndex={slot === 0 ? 0 : -1}
                        aria-label={`Smash the pumpkin in position ${slot + 1} of ${count}`}
                        onClick={() => smash(id)}
                        className={`s1-btn ${canPick ? 's1-pickable' : ''}`}
                      >
                        <span className="s1-lift">
                          <span className="s1-hop" ref={(el) => { hopRefs.current[id] = el; }}>
                            <PumpkinSvg className="s1-pumpkin-svg" />
                          </span>
                        </span>
                      </button>
                    )}

                    {isBroken && (
                      <span className={`s1-blast ${burst ? 's1-blast-burst' : ''}`} aria-hidden="true">
                        <span className="s1-blast-flash" />
                        <span className="s1-blast-core" />
                        {Array.from({ length: 7 }, (_, i) => <span key={i} className={`s1-blast-smoke s1-blast-smoke-${i + 1}`} />)}
                        {burst && (
                          <span className="s1-fragment-layer">
                            {SHELL_SHARDS.map((shard, i) => (
                              <span
                                key={i}
                                className="s1-shell-shard"
                                style={vars({
                                  '--clip': `polygon(${shard.polygon})`,
                                  '--dx': `${shard.dx}px`,
                                  '--dy': `${shard.dy}px`,
                                  '--rot': `${shard.rotation}deg`,
                                  '--shard-delay': `${shard.delay}s`,
                                })}
                              >
                                <PumpkinSvg className="s1-shard-image" />
                              </span>
                            ))}
                            {SEEDS.map((seed, i) => (
                              <span
                                key={`seed-${i}`}
                                className={`s1-seed s1-seed-${i + 1}`}
                                style={vars({
                                  '--dx': `${seed.dx}px`,
                                  '--dy': `${seed.dy}px`,
                                  '--rot': `${seed.rotation}deg`,
                                  '--shard-delay': seed.delay,
                                })}
                              />
                            ))}
                          </span>
                        )}
                      </span>
                    )}

                    {isBroken && burst && (
                      <>
                        <span className="s1-stack s1-broken">
                          {hasSkull && <span className="s1-glow" aria-hidden="true" />}
                          {hasSkull && <span className="s1-skull-clip"><span className="s1-skull-emerge"><SkullSvg className="s1-skull-img" /></span></span>}
                        </span>
                        {[0, 0.12, 0.26].map((d, i) => <span key={d} className="s1-dust" style={vars({ '--delay': `${d}s`, '--dxp': `${(i - 1) * 14}px` })} />)}
                        {hasSkull && EMBERS.map((e, i) => <span key={i} className="s1-ember" style={vars({ '--ex': e.ex, '--ey': e.ey, '--delay': e.delay })} />)}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="s1-fogband" aria-hidden="true" />
          </div>
        )}

        {/* Controls / results */}
        <section className="mt-6 flex flex-col items-center text-center gap-3">
          {phase === 'intro' && (
            <div className="s1-panel px-6 py-4 max-w-lg w-full">
              <Round1TimerButton type="button" onClick={startAttempt} disabled={actionPending || triesLeft <= 0} className="s1-btn-primary" timerStore={resolvedTimerStore}>
                {trialState.attemptsUsed === 0 ? `Begin trial ${ROMAN[trialIdx]}` : 'Take the next try'}
              </Round1TimerButton>
              <p className="s1-label mt-3 !text-[12px]">
                {trial.reward} credits · {trial.tries} tries · {Math.round(shuffleMs / 1000)}s shuffle
              </p>
              <p className="s1-body text-base mt-1.5 leading-snug">
                {trialState.attemptsUsed === 0 ? 'The skull is shown once. A try is used as soon as the trial starts.' : `${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left in this trial.`}
              </p>
              {notice && <p className="s1-body text-sm text-red-300 mt-2">{notice}</p>}
              <Round1ExpiredNotice timerStore={resolvedTimerStore} />
            </div>
          )}

          {phase === 'missed' && (
            <div className="s1-panel px-6 py-4 max-w-lg w-full">
              <Round1TimerButton type="button" onClick={startAttempt} disabled={actionPending} className="s1-btn-primary" timerStore={resolvedTimerStore}>Take the last try</Round1TimerButton>
              <p className="s1-label mt-3 !text-[12px]">One try left</p>
              <p className="s1-body text-base mt-1 leading-snug">Win this trial on the last try and the {trial.reward} credits are still yours.</p>
            </div>
          )}

          {phase === 'trial_end' && lastResult && (
            <div className="s1-panel px-6 py-4 max-w-lg w-full">
              <p className="s1-head text-2xl">
                {lastResult.won ? (lastResult.awarded > 0 ? `+${lastResult.awarded} credits` : 'Solved — no credits (timer ended)') : 'No credits this trial'}
              </p>
              <p className="s1-body text-base mt-1 leading-snug">
                {lastResult.won ? `The skull was found in ${trialState.attemptsUsed} ${trialState.attemptsUsed === 1 ? 'try' : 'tries'}.` : 'Both tries are used up.'}
                {!isLastTrial ? ` Trial ${ROMAN[trialIdx + 1]} has ${clampPumpkinCount(trials[trialIdx + 1].pumpkins)} pumpkins and is worth ${trials[trialIdx + 1].reward} credits.` : ''}
              </p>
              <button type="button" onClick={continueAfterTrial} className="s1-btn-primary mt-4">
                {state.trials.some((t) => t.status === 'pending') ? `Continue to trial ${ROMAN[trialIdx + 1]}` : 'See the result'}
              </button>
            </div>
          )}

          {phase === 'summary' && (
            <div className="s1-panel px-7 py-6 max-w-md w-full">
              <p className="s1-head text-4xl">{totalEarned} <span className="text-lg text-[#f4ede0]">/ {totalPossible} credits</span></p>
              <ul className="mt-3 space-y-1.5">
                {trials.map((t, i) => (
                  <li key={i} className="s1-label flex justify-between !text-[12px]">
                    <span>Trial {ROMAN[i]} · {t.pumpkins} pumpkins</span>
                    <span className={state.trials[i].status === 'won' ? 'text-[#b6dfa8]' : 'text-[#e0a198]'}>
                      {state.trials[i].status === 'won' ? `+${state.trials[i].earnedCredits} CR` : 'lost'}
                    </span>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={onReturnDashboard} className="s1-btn-primary mt-5">Return to round dashboard</button>
            </div>
          )}
        </section>
      </div>

      <SkipStageModal
        isOpen={isSkipModalOpen}
        stageNumber={1}
        stageTitle={config.title}
        rewardCredits={config.rewardCredits}
        onContinue={() => setIsSkipModalOpen(false)}
        onConfirmSkip={() => {
          setIsSkipModalOpen(false);
          onSkipStage();
        }}
      />
    </div>
  );
};
