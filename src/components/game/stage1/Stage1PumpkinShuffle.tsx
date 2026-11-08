import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Stage1Config, Stage1State } from '../../../types/round1.types';
import { DEFAULT_STAGE1_TRIALS } from '../../../constants/stage1.constants';
import { round1Service } from '../../../services/round1Service';
import { soundController } from '../../../utils/soundController';
import { SkipStageModal } from '../common/SkipStageModal';
import { HauntedGraveyardAtmosphere } from '../haunted/HauntedGraveyardAtmosphere';
import { CandleSvg, PumpkinBaseBack, PumpkinBaseFront, PumpkinSvg, S1Defs, ShardSvg, SkullSvg } from './PumpkinArt';
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
  /** Random source for the shuffle — only replaced in tests. */
  rng?: () => number;
  /** Chooses which pumpkin hides the skull — only replaced in tests. */
  pickSkull?: (count: number) => number;
}

type Phase = 'intro' | 'reveal' | 'shuffle' | 'guess' | 'smashing' | 'missed' | 'trial_end' | 'summary';

const LEAD_MS = 700; // pause before the skull is shown, and after it is hidden again
const SMASH_MS = 450; // how long the pumpkin shakes before it bursts
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

const FRAGS = [
  { s: 0, dx: -62, up: -70, down: 30, rot: '-220deg', sz: 26, delay: '0s', dur: '1.05s' },
  { s: 1, dx: -34, up: -96, down: 36, rot: '160deg', sz: 22, delay: '0.02s', dur: '1.15s' },
  { s: 2, dx: -8, up: -108, down: 26, rot: '-90deg', sz: 20, delay: '0s', dur: '1.2s' },
  { s: 3, dx: 22, up: -98, down: 34, rot: '200deg', sz: 24, delay: '0.03s', dur: '1.1s' },
  { s: 4, dx: 52, up: -82, down: 28, rot: '-160deg', sz: 22, delay: '0.01s', dur: '1.05s' },
  { s: 5, dx: 76, up: -54, down: 38, rot: '120deg', sz: 26, delay: '0.02s', dur: '1s' },
  { s: 1, dx: -84, up: -40, down: 40, rot: '260deg', sz: 17, delay: '0.04s', dur: '0.95s' },
  { s: 3, dx: 92, up: -36, down: 42, rot: '-240deg', sz: 17, delay: '0.03s', dur: '0.95s' },
];
const EMBERS = [
  { ex: -26, ey: -70, delay: '0.5s' },
  { ex: 18, ey: -84, delay: '0.65s' },
  { ex: -8, ey: -96, delay: '0.8s' },
  { ex: 32, ey: -60, delay: '0.95s' },
  { ex: -34, ey: -50, delay: '1.1s' },
  { ex: 6, ey: -76, delay: '1.25s' },
];

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

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg>
);
const SoundIcon = ({ muted }: { muted: boolean }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 10v4h4l5 4V6l-5 4H4z" />
    {muted ? <path d="M17 9l4 6M21 9l-4 6" /> : <path d="M16.5 9a4 4 0 010 6M19 6.5a8 8 0 010 11" />}
  </svg>
);
const Pips: React.FC<{ used: number; total: number }> = ({ used, total }) => (
  <span className="inline-flex gap-1.5 align-middle" aria-label={`${total - used} of ${total} tries left`}>
    {Array.from({ length: total }, (_, i) => <span key={i} className={`s1-pip ${i < used ? 's1-pip-used' : ''}`} />)}
  </span>
);

export const Stage1PumpkinShuffle: React.FC<Stage1PumpkinShuffleProps> = ({
  teamId,
  config,
  onReturnDashboard,
  onSkipStage,
  onCreditsAwarded,
  rng = Math.random,
  pickSkull,
}) => {
  const trials = config.trials && config.trials.length > 0 ? config.trials : DEFAULT_STAGE1_TRIALS;
  const revealMs = clampSeconds(config.revealSeconds, 3, 1, 10) * 1000;

  const [state, setState] = useState<Stage1State>(() => {
    round1Service.settleAbandonedStage1(teamId); // a try that was started and abandoned counts as used
    const s = round1Service.getStage1State(teamId);
    return s ? cloneState(s) : { trials: trials.map(() => ({ attemptsUsed: 0, status: 'pending' as const, earnedCredits: 0 })) };
  });
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
  const [secondsRemaining, setSecondsRemaining] = useState(() => round1Service.getTimeRemainingSeconds(teamId));
  const [isMuted, setIsMuted] = useState(soundController.isMuted());
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ticker = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const slotsRef = useRef<number[]>(slots);
  const skullRef = useRef(0);
  const hopRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const btnRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    clearInterval(ticker.current);
  }, []);
  useEffect(() => clearAll, [clearAll]);

  useEffect(() => {
    const t = setInterval(() => setSecondsRemaining(round1Service.getTimeRemainingSeconds(teamId)), 1000);
    return () => clearInterval(t);
  }, [teamId]);

  const refreshState = () => {
    const s = round1Service.getStage1State(teamId);
    if (s) setState(cloneState(s));
  };

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

  const startAttempt = () => {
    const res = round1Service.beginStage1Attempt(teamId, trialIdx); // spends one try right now
    if (!res.ok) {
      setNotice(NOTICE[res.reason] ?? 'Cannot start this trial.');
      refreshState();
      return;
    }
    setNotice(null);
    refreshState();
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

    const id = pickSkull ? pickSkull(count) : Math.min(count - 1, Math.floor(rng() * count));
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
  };

  const smash = (id: number) => {
    if (phase !== 'guess') return;
    setPhase('smashing');
    setBroken(id);
    setBurst(false);
    soundController.playClick();
    schedule(() => {
      setBurst(true);
      const hit = id === skullRef.current;
      if (hit) {
        soundController.playDiscover();
        const res = round1Service.resolveStage1Trial(teamId, trialIdx, true);
        setLastResult({ won: true, awarded: res.creditsAwarded, expired: res.reason === 'expired' });
        if (res.success && res.creditsAwarded > 0) onCreditsAwarded();
        refreshState();
        schedule(() => setPhase('trial_end'), 1800);
        return;
      }
      soundController.playError();
      schedule(() => setLifted(skullRef.current), 700); // show where the skull really was
      const used = round1Service.getStage1State(teamId)?.trials[trialIdx].attemptsUsed ?? trial.tries;
      if (used >= trial.tries) {
        const res = round1Service.resolveStage1Trial(teamId, trialIdx, false);
        setLastResult({ won: false, awarded: 0, expired: res.reason === 'expired' });
        refreshState();
        schedule(() => setPhase('trial_end'), 2000);
      } else {
        schedule(() => setPhase('missed'), 1800);
      }
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

  const expired = secondsRemaining <= 0;
  const canPick = phase === 'guess';
  const totalEarned = state.trials.reduce((a, t) => a + t.earnedCredits, 0);
  const totalPossible = trials.reduce((a, t) => a + t.reward, 0);
  const isLastTrial = trialIdx >= trials.length - 1;

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
      <HauntedGraveyardAtmosphere />
      <div className="absolute inset-0 bg-black/60 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 55%, transparent 35%, rgba(0,0,0,0.65) 100%)' }} aria-hidden="true" />

      <div className="relative z-10 flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-4 sm:py-5">
        {/* Top bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="font-cinzel text-[10px] tracking-[0.22em] text-[#b88a52] uppercase">Round 1 · Stage 1</div>
            <h1 className="font-cinzel text-lg sm:text-xl tracking-[0.12em] uppercase text-[#e6d6b6]">{config.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 font-mono text-xs px-2.5 py-1.5 rounded-sm border ${secondsRemaining <= 60 ? 'border-red-500/50 text-red-300' : 'border-white/15 text-cartel-silver'}`} aria-label="Round time left">
              <ClockIcon />{fmt(Math.max(0, secondsRemaining))}
            </div>
            <button type="button" onClick={() => setIsMuted(soundController.toggleMute())} aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'} className="s1-btn-ghost !px-2.5 !py-1.5">
              <SoundIcon muted={isMuted} />
            </button>
            <button type="button" onClick={() => setIsSkipModalOpen(true)} className="s1-btn-ghost !py-1.5 !px-3 !text-[10px]">Skip stage</button>
            <button type="button" onClick={onReturnDashboard} className="s1-btn-ghost !py-1.5 !px-3 !text-[10px]">Dashboard</button>
          </div>
        </header>

        {/* Trial progress */}
        <nav className="flex flex-wrap items-center gap-2 mt-3" aria-label="Trials">
          {trials.map((t, i) => {
            const st = state.trials[i];
            const cls = st.status === 'won' ? 's1-pill-won' : st.status === 'lost' ? 's1-pill-lost' : i === trialIdx && phase !== 'summary' ? 's1-pill-active' : '';
            const mark = st.status === 'won' ? ' ✓' : st.status === 'lost' ? ' ✕' : '';
            return (
              <span key={i} className={`s1-pill ${cls}`}>
                Trial {ROMAN[i]} · {t.pumpkins} pumpkins · {t.reward} CR{mark}
              </span>
            );
          })}
          {phase !== 'summary' && (
            <span className="ml-auto font-cinzel text-[10px] tracking-[0.16em] uppercase text-[#a89c82] flex items-center gap-2">
              Tries <Pips used={trialState.attemptsUsed} total={trial.tries} />
            </span>
          )}
        </nav>

        {/* Status */}
        <section className="text-center mt-4 mb-1 min-h-[72px]" aria-live="polite">
          <h2 className="font-cinzel text-base sm:text-lg tracking-[0.14em] uppercase text-[#eadcc0]">{titles[phase].title}</h2>
          {titles[phase].hint && <p className="text-xs text-[#a89c82] mt-1 max-w-md mx-auto leading-relaxed">{titles[phase].hint}</p>}
          {phase === 'shuffle' && (
            <div className="mt-2.5 max-w-xs mx-auto">
              <div className="flex justify-between font-cinzel text-[10px] tracking-[0.2em] text-[#b88a52] mb-1"><span>SHUFFLING</span><span className="tabular-nums">{fmt(shuffleLeft)}</span></div>
              <div className="s1-bar" role="progressbar" aria-label="Shuffle progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><span style={{ width: `${progress * 100}%` }} /></div>
            </div>
          )}
        </section>

        {/* The table */}
        {phase !== 'summary' && (
          <div className="s1-altar" style={vars({ '--n': count })} role="group" aria-label="Pumpkins" onKeyDown={onGroupKey}>
            <div className="s1-wall" aria-hidden="true" />
            <div className="s1-top" aria-hidden="true" />
            <div className="s1-front" aria-hidden="true" />
            <div className="s1-light l" aria-hidden="true" />
            <div className="s1-light r" aria-hidden="true" />
            <CandleSvg className="s1-candle l" />
            <CandleSvg className="s1-candle r" />

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

                    {isBroken && burst && (
                      <>
                        <span className="s1-stack s1-broken">
                          {hasSkull && <span className="s1-glow" aria-hidden="true" />}
                          <PumpkinBaseBack className="s1-layer s1-l1" />
                          {hasSkull && <span className="s1-skull-clip"><span className="s1-skull-emerge"><SkullSvg className="s1-skull-img" /></span></span>}
                          <PumpkinBaseFront className="s1-layer s1-l3" />
                        </span>
                        {FRAGS.map((f, i) => (
                          <span key={i} className="s1-frag" style={vars({ '--dx': f.dx, '--up': f.up, '--down': f.down, '--rot': f.rot, '--sz': f.sz, '--delay': f.delay, '--dur': f.dur })}>
                            <span className="s1-frag-y"><ShardSvg index={f.s} /></span>
                          </span>
                        ))}
                        {[0, 0.12, 0.26].map((d, i) => <span key={d} className="s1-dust" style={vars({ '--delay': `${d}s`, '--dxp': `${(i - 1) * 14}px` })} />)}
                        {hasSkull && EMBERS.map((e, i) => <span key={i} className="s1-ember" style={vars({ '--ex': e.ex, '--ey': e.ey, '--delay': e.delay })} />)}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls / results */}
        <section className="mt-5 flex flex-col items-center text-center gap-3">
          {phase === 'intro' && (
            <div className="s1-panel px-6 py-4 max-w-md w-full">
              <p className="font-cinzel text-xs tracking-[0.16em] uppercase text-[#d8c7a4]">
                {trial.reward} credits · {trial.tries} tries · {Math.round(shuffleMs / 1000)}s shuffle
              </p>
              <p className="text-xs text-[#a89c82] mt-1.5">
                {trialState.attemptsUsed === 0 ? 'The skull is shown once. A try is used as soon as the trial starts.' : `${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left in this trial.`}
              </p>
              {(expired || notice) && <p className="text-xs text-red-300 mt-2">{notice ?? NOTICE.expired}</p>}
              <button type="button" onClick={startAttempt} disabled={expired || triesLeft <= 0} className="s1-btn-primary mt-3">
                {trialState.attemptsUsed === 0 ? `Begin trial ${ROMAN[trialIdx]}` : 'Take the next try'}
              </button>
            </div>
          )}

          {phase === 'missed' && (
            <div className="s1-panel px-6 py-4 max-w-md w-full">
              <p className="font-cinzel text-xs tracking-[0.16em] uppercase text-[#d8c7a4]">One try left</p>
              <p className="text-xs text-[#a89c82] mt-1.5">Win this trial on the last try and the {trial.reward} credits are still yours.</p>
              <button type="button" onClick={startAttempt} disabled={expired} className="s1-btn-primary mt-3">Take the last try</button>
            </div>
          )}

          {phase === 'trial_end' && lastResult && (
            <div className="s1-panel px-6 py-4 max-w-md w-full">
              <p className="font-cinzel text-sm tracking-[0.14em] uppercase text-[#eadcc0]">
                {lastResult.won ? (lastResult.awarded > 0 ? `+${lastResult.awarded} credits` : 'Solved — no credits (timer ended)') : 'No credits this trial'}
              </p>
              <p className="text-xs text-[#a89c82] mt-1.5">
                {lastResult.won ? `The skull was found in ${trialState.attemptsUsed} ${trialState.attemptsUsed === 1 ? 'try' : 'tries'}.` : 'Both tries are used up.'}
                {!isLastTrial ? ` Trial ${ROMAN[trialIdx + 1]} has ${clampPumpkinCount(trials[trialIdx + 1].pumpkins)} pumpkins and is worth ${trials[trialIdx + 1].reward} credits.` : ''}
              </p>
              <button type="button" onClick={continueAfterTrial} className="s1-btn-primary mt-3">
                {state.trials.some((t) => t.status === 'pending') ? `Continue to trial ${ROMAN[trialIdx + 1]}` : 'See the result'}
              </button>
            </div>
          )}

          {phase === 'summary' && (
            <div className="s1-panel px-7 py-6 max-w-md w-full">
              <p className="font-cinzel text-2xl text-[#eadcc0] tracking-[0.1em]">{totalEarned} <span className="text-sm text-[#a89c82]">/ {totalPossible} credits</span></p>
              <ul className="mt-3 space-y-1.5 text-sm text-[#bfb299]">
                {trials.map((t, i) => (
                  <li key={i} className="flex justify-between font-cinzel text-[11px] tracking-[0.12em] uppercase">
                    <span>Trial {ROMAN[i]} · {t.pumpkins} pumpkins</span>
                    <span className={state.trials[i].status === 'won' ? 'text-[#aac8a0]' : 'text-[#c49088]'}>
                      {state.trials[i].status === 'won' ? `+${state.trials[i].earnedCredits} CR` : 'lost'}
                    </span>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={onReturnDashboard} className="s1-btn-primary mt-4">Return to round dashboard</button>
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
