import { describe, expect, it } from 'vitest';
import {
  applyRound3Hunt3ActionToState,
  createFreshRound3Hunt3State,
  normalizeRound3Hunt3State,
  round3Hunt3StateForActor,
  STAGE_POINTS,
  SEALS,
  COMPONENTS,
  APPARATUS,
  BOSS_SEQUENCE,
} from '../round3-hunt3.rules.ts';
import type { Hunt3Actor } from '../../src/types/hunt3.types.ts';

describe('Round 3 Hunt III rules unit tests', () => {
  const teamId = 'test-team-hunt3-rules';

  it('creates fresh initial state with Stage 1 and 0 points', () => {
    const state = createFreshRound3Hunt3State(teamId);
    expect(state.teamId).toBe(teamId);
    expect(state.stage).toBe(1);
    expect(state.completed).toBe(false);
    expect(state.score).toBe(0);
    expect(state.scoreBreakdown).toEqual({ stage1: 0, stage2: 0, stage3: 0, stage4: 0, optional: 0 });
    expect(state.journal).toHaveLength(0);
    expect(state.penalties).toBe(0);
  });

  it('normalizes corrupted and partial states safely', () => {
    expect(normalizeRound3Hunt3State(null, teamId)).toBeNull();
    expect(normalizeRound3Hunt3State({ teamId: 'wrong-team' }, teamId)).toBeNull();

    const normalized = normalizeRound3Hunt3State({ stage: 2, score: 250 }, teamId);
    expect(normalized).not.toBeNull();
    expect(normalized?.stage).toBe(2);
    expect(normalized?.score).toBe(250);
    expect(normalized?.teamId).toBe(teamId);
  });

  it('isolates actor-specific views when sharedView is false and preserves full view when true', () => {
    const state = createFreshRound3Hunt3State(teamId);
    state.evidence.archivist.push('sighting-ledger');
    state.evidence.tracker.push('cold-ash');

    const archivistView = round3Hunt3StateForActor(state, 'archivist', false);
    expect(archivistView.evidence.archivist).toContain('sighting-ledger');
    expect(archivistView.evidence.tracker).toHaveLength(0);

    const trackerView = round3Hunt3StateForActor(state, 'tracker', false);
    expect(trackerView.evidence.tracker).toContain('cold-ash');
    expect(trackerView.evidence.archivist).toHaveLength(0);

    const sharedView = round3Hunt3StateForActor(state, 'archivist', true);
    expect(sharedView.evidence.archivist).toContain('sighting-ledger');
    expect(sharedView.evidence.tracker).toContain('cold-ash');
  });

  it('progresses through Stage 1 — The Entity Trail (250 points)', () => {
    let state = createFreshRound3Hunt3State(teamId);

    // Wrong actor interaction rejected
    const wrongActor = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'interact', id: 'sighting-ledger' });
    expect(wrongActor?.result.success).toBe(false);
    expect(wrongActor?.result.message).toContain('other investigator’s timeline');

    // Archivist gathers 3 historical records
    for (const id of ['sighting-ledger', 'containment-observation', 'old-facility-report']) {
      const act = applyRound3Hunt3ActionToState(state, 'archivist', { type: 'interact', id });
      expect(act?.result.success).toBe(true);
      state = act!.result.state;
    }

    // Tracker gathers 3 physical traces
    for (const id of ['cold-ash', 'drag-marks', 'shattered-compass']) {
      const act = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'interact', id });
      expect(act?.result.success).toBe(true);
      state = act!.result.state;
    }

    // Wrong submission yields penalty
    const wrongSub = applyRound3Hunt3ActionToState(state, 'archivist', { type: 'submit', id: 'trail-location', value: { location: 'wrong-wing' } });
    expect(wrongSub?.result.success).toBe(false);
    expect(wrongSub?.scoreDelta).toBe(0); // 0 score floor
    expect(wrongSub?.result.state.penalties).toBe(20);

    // Correct Archivist submission
    const archSub = applyRound3Hunt3ActionToState(state, 'archivist', { type: 'submit', id: 'trail-location', value: { location: 'east-wing' } });
    expect(archSub?.result.success).toBe(true);
    state = archSub!.result.state;
    expect(state.stage).toBe(1); // awaits tracker

    // Correct Tracker submission completes Stage 1
    const trackSub = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'submit', id: 'trail-location', value: { location: 'cold-star' } });
    expect(trackSub?.result.success).toBe(true);
    expect(trackSub?.scoreDelta).toBe(250);
    state = trackSub!.result.state;
    expect(state.stage).toBe(2);
    expect(state.score).toBe(250);
    expect(state.scoreBreakdown.stage1).toBe(250);
  });

  it('progresses through Stage 2 — Break the Three Seals (400 points)', () => {
    let state = createFreshRound3Hunt3State(teamId);
    state.stage = 2;

    for (const seal of SEALS) {
      // Archivist inspects diagram
      const diag = applyRound3Hunt3ActionToState(state, 'archivist', { type: 'interact', id: `${seal}-diagram` });
      expect(diag?.result.success).toBe(true);
      state = diag!.result.state;

      // Archivist submits sequence
      const seq = seal === 'power' ? ['source', 'ground', 'return'] : seal === 'resonance' ? ['low-tone', 'phase-two', 'silence'] : ['arrival', 'warning', 'anchor'];
      const archSub = applyRound3Hunt3ActionToState(state, 'archivist', { type: 'submit', id: `seal-${seal}-archive`, value: { sequence: seq } });
      expect(archSub?.result.success).toBe(true);
      state = archSub!.result.state;

      // Tracker inspects mechanism
      const mech = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'interact', id: `${seal}-mechanism` });
      expect(mech?.result.success).toBe(true);
      state = mech!.result.state;

      // Tracker submits configuration
      const trackSub = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'submit', id: `seal-${seal}`, value: { sequence: seq } });
      expect(trackSub?.result.success).toBe(true);
      state = trackSub!.result.state;
      expect(state.seals[seal].disabled).toBe(true);
    }

    // Component collection: catalogue first
    const cat = applyRound3Hunt3ActionToState(state, 'archivist', { type: 'interact', id: 'component-catalog' });
    expect(cat?.result.success).toBe(true);
    state = cat!.result.state;

    // Decoy component rejected
    const decoy = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'interact', id: 'recover-shattered-glass' });
    expect(decoy?.result.success).toBe(true);
    expect(decoy?.result.message).toContain('decoy');

    // 4 components recovered by Tracker
    for (let i = 0; i < COMPONENTS.length; i++) {
      const part = COMPONENTS[i];
      const rec = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'interact', id: `recover-${part}` });
      expect(rec?.result.success).toBe(true);
      state = rec!.result.state;
      if (i === COMPONENTS.length - 1) {
        expect(rec?.scoreDelta).toBe(400);
      }
    }

    expect(state.stage).toBe(3);
    expect(state.scoreBreakdown.stage2).toBe(400);
  });

  it('progresses through Stage 3 — The Bait Protocol (350 points)', () => {
    let state = createFreshRound3Hunt3State(teamId);
    state.stage = 3;
    state.components = [...COMPONENTS];
    state.actions.push('physical-apparatus');

    // Archivist inspects blueprint and submits
    const bp = applyRound3Hunt3ActionToState(state, 'archivist', { type: 'interact', id: 'apparatus-blueprint' });
    expect(bp?.result.success).toBe(true);
    state = bp!.result.state;

    const bpSub = applyRound3Hunt3ActionToState(state, 'archivist', { type: 'submit', id: 'apparatus', value: { sequence: APPARATUS } });
    expect(bpSub?.result.success).toBe(true);
    state = bpSub!.result.state;

    // Tracker submits physical placement
    const physSub = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'submit', id: 'apparatus', value: { sequence: APPARATUS } });
    expect(physSub?.result.success).toBe(true);
    state = physSub!.result.state;
    expect(state.apparatus.configured).toBe(true);

    // Weakness investigation
    const notes = applyRound3Hunt3ActionToState(state, 'archivist', { type: 'interact', id: 'weakness-notes' });
    state = notes!.result.state;

    const testSt = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'interact', id: 'test-station' });
    state = testSt!.result.state;

    for (const [condition, reading] of [['frequency-low', 'withdrawal'], ['light-dark', 'surge'], ['temperature-cold', 'withdrawal']]) {
      const trial = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'submit', id: 'weakness-trial', value: { condition, reading } });
      expect(trial?.result.success).toBe(true);
      state = trial!.result.state;
    }

    const weakConc = applyRound3Hunt3ActionToState(state, 'archivist', { type: 'submit', id: 'weakness-conclusion', value: { profile: ['frequency-low', 'light-dark', 'temperature-cold'] } });
    expect(weakConc?.result.success).toBe(true);
    state = weakConc!.result.state;
    expect(state.weakness.discovered).toBe(true);

    // Lure and 3 disruptor pulses
    const lure = applyRound3Hunt3ActionToState(state, 'archivist', { type: 'interact', id: 'lure-control' });
    expect(lure?.result.success).toBe(true);
    state = lure!.result.state;

    for (let i = 0; i < 3; i++) {
      const pulse = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'interact', id: 'disruptor' });
      expect(pulse?.result.success).toBe(true);
      state = pulse!.result.state;
      if (i === 2) {
        expect(pulse?.scoreDelta).toBe(350);
      }
    }

    expect(state.stage).toBe(4);
    expect(state.scoreBreakdown.stage3).toBe(350);
  });

  it('awards 100 points for hidden paired discovery', () => {
    let state = createFreshRound3Hunt3State(teamId);
    state.stage = 3;

    const archivistTrace = applyRound3Hunt3ActionToState(state, 'archivist', { type: 'interact', id: 'secret-inscription' });
    expect(archivistTrace?.result.success).toBe(true);
    expect(archivistTrace?.scoreDelta).toBe(0);
    state = archivistTrace!.result.state;

    const trackerTrace = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'interact', id: 'secret-residue' });
    expect(trackerTrace?.result.success).toBe(true);
    expect(trackerTrace?.scoreDelta).toBe(100);
    state = trackerTrace!.result.state;

    expect(state.scoreBreakdown.optional).toBe(100);
    expect(state.optional.complete).toBe(true);

    // Repeated action does not award twice
    const repeat = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'interact', id: 'secret-residue' });
    expect(repeat?.scoreDelta).toBe(0);
  });

  it('completes Stage 4 — Final Containment Boss Sequence (500 points)', () => {
    let state = createFreshRound3Hunt3State(teamId);
    state.stage = 4;
    state.boss.deadlineAt = Date.now() + 12_000;

    for (let i = 0; i < BOSS_SEQUENCE.length; i++) {
      const step = BOSS_SEQUENCE[i];
      state.boss.lastActionAt = Date.now() - 1000; // pass cadence guard

      const act = applyRound3Hunt3ActionToState(state, step.actor, { type: 'interact', id: step.control });
      expect(act?.result.success).toBe(true);
      state = act!.result.state;
      expect(state.boss.step).toBe(i + 1);

      if (i === BOSS_SEQUENCE.length - 1) {
        expect(act?.scoreDelta).toBe(500);
      }
    }

    expect(state.completed).toBe(true);
    expect(state.boss.captured).toBe(true);
    expect(state.scoreBreakdown.stage4).toBe(500);

    // Further action on completed hunt is rejected cleanly
    const after = applyRound3Hunt3ActionToState(state, 'tracker', { type: 'interact', id: 'close-containment' });
    expect(after?.result.success).toBe(false);
    expect(after?.result.message).toContain('Hunt III is complete');
  });

  it('handles boss timeout destabilization and step degradation', () => {
    let state = createFreshRound3Hunt3State(teamId);
    state.stage = 4;
    state.boss.step = 2;
    state.boss.stability = 2;
    state.boss.deadlineAt = Date.now() - 1000; // expired

    const timeoutAct = applyRound3Hunt3ActionToState(state, 'archivist', { type: 'interact', id: 'release-memory' });
    expect(timeoutAct?.result.success).toBe(false);
    expect(timeoutAct?.result.message).toContain('warning window closed');
    expect(timeoutAct?.result.state.boss.step).toBe(1);
    expect(timeoutAct?.result.state.boss.stability).toBe(1);
  });
});
