import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Stage1Config } from '../../../types/round1.types';
import { round1Service } from '../../../services/round1Service';
import { soundController } from '../../../utils/soundController';
import { SkipStageModal } from '../common/SkipStageModal';
import { HauntedGraveyardAtmosphere } from '../haunted/HauntedGraveyardAtmosphere';
import { PumpkinSvg, SkullSvg } from './PumpkinArt';
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
  isCompleted: boolean;
  onReturnDashboard: () => void;
  onSkipStage: () => void;
  onStageCompleted: () => void;
  /** Random source — only replaced in tests. */
  rng?: () => number;
}

type Phase = 'intro' | 'reveal' | 'shuffle' | 'guess' | 'smashing' | 'missed' | 'won';

const LEAD_MS = 700; // pause before the skull is shown, and after it is hidden again
const SMASH_MS = 450; // how long the pumpkin shakes before it bursts

const SHARDS = [
  { dx: '-90px', dy: '-70px', rot: '-200deg', delay: '0s' },
  { dx: '-60px', dy: '-120px', rot: '160deg', delay: '0.02s' },
  { dx: '-20px', dy: '-140px', rot: '-120deg', delay: '0s' },
  { dx: '30px', dy: '-130px', rot: '220deg', delay: '0.03s' },
  { dx: '70px', dy: '-100px', rot: '-180deg', delay: '0.01s' },
  { dx: '100px', dy: '-60px', rot: '140deg', delay: '0s' },
  { dx: '-110px', dy: '-20px', rot: '260deg', delay: '0.04s' },
  { dx: '110px', dy: '-10px', rot: '-240deg', delay: '0.02s' },
];
const SEEDS = [
  { dx: '-50px', dy: '-90px', rot: '120deg', delay: '0.05s' },
  { dx: '40px', dy: '-110px', rot: '-90deg', delay: '0.08s' },
  { dx: '-80px', dy: '-30px', rot: '200deg', delay: '0.03s' },
  { dx: '85px', dy: '-45px', rot: '-160deg', delay: '0.06s' },
  { dx: '0px', dy: '-125px', rot: '90deg', delay: '0.1s' },
];
const SPARKS = [
  { dx: '-80px', dy: '-60px', delay: '0.35s' },
  { dx: '80px', dy: '-70px', delay: '0.4s' },
  { dx: '-40px', dy: '-110px', delay: '0.45s' },
  { dx: '45px', dy: '-120px', delay: '0.5s' },
  { dx: '-110px', dy: '-20px', delay: '0.55s' },
  { dx: '110px', dy: '-25px', delay: '0.6s' },
];

const fmt = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
const vars = (o: Record<string, string | number>) => o as unknown as React.CSSProperties;

export const Stage1PumpkinShuffle: React.FC<Stage1PumpkinShuffleProps> = ({
  teamId,
  config,
  isCompleted,
  onReturnDashboard,
  onSkipStage,
  onStageCompleted,
  rng = Math.random,
}) => {
  const count = clampPumpkinCount(config.pumpkinCount);
  const shuffleMs = clampSeconds(config.shuffleSeconds, 20, 5, 60) * 1000;
  const revealMs = clampSeconds(config.revealSeconds, 3, 1, 10) * 1000;

  const [phase, setPhase] = useState<Phase>('intro');
  const [slots, setSlots] = useState<number[]>(() => identitySlots(count));
  const [skullId, setSkullId] = useState(0);
  const [lifted, setLifted] = useState<number | null>(null); // pumpkin currently raised to show the skull
  const [broken, setBroken] = useState<number | null>(null); // pumpkin being smashed
  const [burst, setBurst] = useState(false); // true once the smashed pumpkin has exploded
  const [swapMs, setSwapMs] = useState(400);
  const [front, setFront] = useState<number | null>(null);
  const [shuffleLeft, setShuffleLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [award, setAward] = useState<number | null>(null);
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

  // Round countdown (same master clock as the other stages)
  useEffect(() => {
    const t = setInterval(() => setSecondsRemaining(round1Service.getTimeRemainingSeconds(teamId)), 1000);
    return () => clearInterval(t);
  }, [teamId]);

  const hop = (id: number, up: boolean, ms: number) => {
    const el = hopRefs.current[id];
    if (!el || typeof el.animate !== 'function') return;
    el.animate(
      [
        { transform: 'translateY(0) scale(1)' },
        { transform: `translateY(${up ? -34 : 12}px) scale(${up ? 1.08 : 0.94})`, offset: 0.5 },
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

  const startRound = () => {
    if (secondsRemaining <= 0 && !isCompleted) return;
    clearAll();
    soundController.playClick();
    const start = identitySlots(count);
    slotsRef.current = start;
    setSlots(start);
    setBroken(null);
    setBurst(false);
    setLifted(null);
    setFront(null);
    setShuffleLeft(Math.round(shuffleMs / 1000));
    setProgress(0);
    setAward(null);

    const id = Math.min(count - 1, Math.floor(rng() * count)); // which pumpkin hides the skull
    skullRef.current = id;
    setSkullId(id);
    setAttempts((a) => a + 1);
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

  const finishWin = () => {
    const res = round1Service.completeStage(teamId, 'stage-1');
    if (res.success) {
      setAward(res.creditsAwarded);
      onStageCompleted();
    } else {
      setAward(0);
    }
    setPhase('won');
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
        schedule(finishWin, 1300);
      } else {
        soundController.playError();
        schedule(() => setLifted(skullRef.current), 600); // show where the skull really was
        schedule(() => setPhase('missed'), 1500);
      }
    }, SMASH_MS);
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
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusSlot(Math.min(count - 1, slot + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusSlot(Math.max(0, slot - 1));
    }
  };

  const toggleMute = () => setIsMuted(soundController.toggleMute());

  const expired = secondsRemaining <= 0 && !isCompleted;
  const canPick = phase === 'guess';
  const status: Record<Phase, { title: string; hint: string }> = {
    intro: { title: 'Watch the skull. Follow the pumpkin.', hint: 'A skull sleeps under one of the pumpkins. Remember it, follow the shuffle, then smash the right pumpkin.' },
    reveal: { title: 'Remember where the skull sleeps…', hint: 'Look closely — it will be hidden any moment.' },
    shuffle: { title: 'The pumpkins are shuffling!', hint: 'Keep your eyes on the pumpkin that hides the skull.' },
    guess: { title: 'Which pumpkin hides the skull?', hint: 'Smash it! Click a pumpkin (or use ← → and Enter).' },
    smashing: { title: 'SMASH!', hint: '' },
    missed: { title: 'Only pumpkin guts…', hint: 'The skull was under the pumpkin that just rose. Try again.' },
    won: { title: 'The skull awakens!', hint: '' },
  };

  return (
    <div className="relative flex-1 flex flex-col text-cartel-bone font-sans">
      <HauntedGraveyardAtmosphere />
      <div className="absolute inset-0 bg-black/45 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 sm:p-6">
        {/* Top bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-900/50 pb-3 mb-5">
          <div>
            <div className="text-[10px] font-cinzel text-cartel-pumpkin font-bold uppercase tracking-widest flex items-center gap-2">
              <span>STAGE 01 OF 03 • {config.rewardCredits} CREDITS</span>
              {isCompleted && <span className="px-1.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 text-[9px]">COMPLETED ✓</span>}
            </div>
            <h1 className="text-xl sm:text-3xl font-gothic text-amber-200 tracking-wide drop-shadow-[0_0_10px_rgba(255,120,20,0.5)]">{config.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`font-mono text-sm px-2.5 py-1 rounded border ${secondsRemaining <= 60 ? 'border-red-500/60 text-red-300 animate-pulse' : 'border-white/15 text-cartel-silver'}`} aria-label="Round time left">
              ⏱ {fmt(Math.max(0, secondsRemaining))}
            </div>
            <button type="button" onClick={toggleMute} aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'} className="px-2.5 py-1 rounded bg-black/50 border border-white/15 text-cartel-silver cursor-pointer">
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button type="button" onClick={() => setIsSkipModalOpen(true)} className="px-3 py-1.5 rounded bg-black/50 hover:bg-white/10 border border-white/15 text-cartel-silver font-cinzel text-xs uppercase tracking-wider cursor-pointer">
              Skip Stage
            </button>
            <button type="button" onClick={onReturnDashboard} className="px-3.5 py-1.5 rounded bg-cartel-pumpkin/20 hover:bg-cartel-pumpkin/30 border border-cartel-pumpkin/60 text-cartel-pumpkin font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer">
              Round Dashboard
            </button>
          </div>
        </header>

        {/* Status */}
        <section className="text-center mb-4 min-h-[88px]" aria-live="polite">
          <h2 className="font-cinzel font-bold text-lg sm:text-2xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{status[phase].title}</h2>
          {status[phase].hint && <p className="text-xs sm:text-sm text-cartel-silver/80 mt-1 max-w-xl mx-auto">{status[phase].hint}</p>}
          {phase === 'shuffle' && (
            <div className="mt-3 max-w-sm mx-auto">
              <div className="flex justify-between text-[11px] font-cinzel tracking-widest text-amber-300 mb-1">
                <span>SHUFFLING</span>
                <span className="tabular-nums">{fmt(shuffleLeft)}</span>
              </div>
              <div className="s1-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                <span style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          )}
        </section>

        {/* The altar with the pumpkins */}
        <div className="relative flex items-end justify-center">
          <span aria-hidden="true" className="s1-candle absolute -left-1 sm:-left-6 bottom-2 text-3xl sm:text-4xl drop-shadow-[0_0_12px_rgba(255,150,30,0.7)]">🕯️</span>
          <span aria-hidden="true" className="s1-candle absolute -right-1 sm:-right-6 bottom-2 text-3xl sm:text-4xl drop-shadow-[0_0_12px_rgba(255,150,30,0.7)]" style={{ animationDelay: '-1.3s' }}>🕯️</span>

          <div className="s1-altar w-full" role="group" aria-label="Pumpkins" onKeyDown={onGroupKey}>
            <div className="s1-fog" aria-hidden="true" />
            {slots.map((slot, id) => {
              const isBroken = broken === id;
              const showBody = !(isBroken && burst);
              const idle = phase === 'intro' || phase === 'guess' || phase === 'missed';
              return (
                <div
                  key={id}
                  className={`s1-cell ${lifted === id ? 's1-lifted' : ''} ${idle ? 's1-idle' : ''} ${isBroken && !burst ? 's1-shaking' : ''}`}
                  style={vars({ '--n': count, '--swap-ms': `${swapMs}ms`, '--d': `${-id * 0.7}s`, transform: `translateX(${slot * 100}%)`, zIndex: front === id || isBroken ? 5 : 1 })}
                >
                  <span className="s1-shadow" aria-hidden="true" />

                  {/* skull sits on the altar, under the pumpkin — only drawn when it is meant to be seen */}
                  {lifted === id && id === skullId && !isBroken && <SkullSvg className="s1-skull-rest" />}

                  {showBody && (
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

                  {/* the burst */}
                  {isBroken && burst && (
                    <>
                      {SHARDS.map((s, i) => <span key={`h${i}`} className="s1-shard" style={vars({ '--dx': s.dx, '--dy': s.dy, '--rot': s.rot, '--delay': s.delay })} />)}
                      {SEEDS.map((s, i) => <span key={`e${i}`} className="s1-seed" style={vars({ '--dx': s.dx, '--dy': s.dy, '--rot': s.rot, '--delay': s.delay })} />)}
                      {id === skullId ? (
                        <>
                          <span className="s1-ring" />
                          <SkullSvg className="s1-skull-rise" />
                          {SPARKS.map((s, i) => <span key={`k${i}`} className="s1-sparkle" style={vars({ '--dx': s.dx, '--dy': s.dy, '--delay': s.delay })} />)}
                        </>
                      ) : (
                        [0, 0.15, 0.3].map((d) => <span key={d} className="s1-smoke" style={vars({ '--delay': `${d}s` })} />)
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls / results */}
        <section className="mt-6 flex flex-col items-center text-center gap-3 min-h-[120px]">
          {phase === 'intro' && (
            <>
              {expired ? (
                <p className="text-red-300 font-cinzel tracking-wider">The round timer has ended — no more credits can be earned.</p>
              ) : (
                <button type="button" onClick={startRound} className="s1-pulse px-8 py-3 rounded-lg bg-gradient-to-r from-orange-800 via-orange-500 to-orange-800 text-black font-cinzel font-black tracking-widest text-sm sm:text-base hover:brightness-110 active:scale-95 transition cursor-pointer">
                  {isCompleted ? 'PLAY AGAIN (NO EXTRA CREDITS)' : 'BEGIN THE RITE'}
                </button>
              )}
              <p className="text-[11px] text-cartel-silver/60 font-mono">The skull is shown for {Math.round(revealMs / 1000)}s, then {count} pumpkins shuffle for {Math.round(shuffleMs / 1000)}s. Wrong guess? Try again as often as the clock allows.</p>
            </>
          )}

          {phase === 'missed' && (
            <>
              <p className="text-amber-200/90 font-cinzel tracking-wider">Attempt {attempts} — the skull slipped away.</p>
              <button type="button" onClick={startRound} disabled={expired} className="s1-pop px-8 py-3 rounded-lg bg-gradient-to-r from-orange-800 via-orange-500 to-orange-800 text-black font-cinzel font-black tracking-widest hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-40">
                FACE THE NEXT SHUFFLE
              </button>
            </>
          )}

          {phase === 'won' && (
            <div className="s1-pop rounded-xl border border-orange-600/60 bg-black/70 px-8 py-5 shadow-pumpkinGlow">
              <div className="font-gothic text-2xl text-amber-200">💀 The skull awakens!</div>
              <p className="mt-1 text-sm text-cartel-silver">
                {award && award > 0
                  ? `Stage cleared in ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}. +${award} credits earned.`
                  : isCompleted
                    ? 'Already cleared earlier — no extra credits this time.'
                    : 'The round timer had ended, so no credits were awarded.'}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={onReturnDashboard} className="px-6 py-2 rounded-lg bg-cartel-pumpkin/25 border border-cartel-pumpkin text-cartel-pumpkin font-cinzel font-bold tracking-widest cursor-pointer hover:bg-cartel-pumpkin/35">
                  RETURN TO ROUND DASHBOARD
                </button>
                <button type="button" onClick={() => { setPhase('intro'); setBroken(null); setBurst(false); setLifted(null); }} className="px-5 py-2 rounded-lg bg-black/60 border border-white/20 text-cartel-silver font-cinzel tracking-widest cursor-pointer hover:bg-white/10">
                  PLAY AGAIN
                </button>
              </div>
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
