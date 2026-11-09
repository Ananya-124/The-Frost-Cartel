// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../state/createInitialState';
import { GameStore } from '../state/store';
import { Scheduler } from '../context';
import { activateCardEffect, createCardEffects } from './cardEffects';
import { cardsFromTestingInventory, TEST_POWER_CARDS } from '../../testingCards';
import { INTERACTABLES } from '../../config/interactables';
import type { GameContext } from '../context';

function contextFor(id: string): GameContext {
  const cards = cardsFromTestingInventory([id as (typeof TEST_POWER_CARDS)[number]['id']]);
  const state = createInitialState('Testing Team', cards);
  state.phase = 'playing';
  const store = new GameStore();
  store.replaceState(state);
  return { state, store, scheduler: new Scheduler(), cardEffects: createCardEffects() };
}

describe('temporary Round 3 Power Cards', () => {
  it('offers all eleven cards in the isolated test inventory', () => {
    expect(TEST_POWER_CARDS).toHaveLength(11);
    expect(new Set(TEST_POWER_CARDS.map((card) => card.id)).size).toBe(11);
  });

  it.each([
    'chrono-freeze', 'spectral-sight', 'witchs-lens', 'witchs-elixir',
    'phantom-shield', 'wardens-decree',
  ] as const)('%s activates once and rejects a duplicate use', (id) => {
    const ctx = contextFor(id);
    if (id === 'spectral-sight') {
      ctx.state.huntIndex = 1;
      ctx.state.flags = { key: true, fuse: true, power: true, drawer: true, arch: true, tape: true };
    }
    if (id === 'witchs-lens') {
      ctx.state.huntIndex = 1;
      const object = INTERACTABLES.find((item) => item.id === 'weaknessArchive' && item.timeline === 'past')!;
      ctx.state.players[0].x = object.x;
      ctx.state.players[0].y = object.y;
    }
    expect(activateCardEffect(ctx, 0)).toBe(true);
    expect(ctx.state.cards[0].uses).toBe(0);
    expect(activateCardEffect(ctx, 0)).toBe(false);
  });

  it('adds five seconds only to an active canvas synchronization window', () => {
    const ctx = contextFor('witching-hour');
    expect(activateCardEffect(ctx, 0)).toBe(false);
    expect(ctx.state.cards[0].uses).toBe(1);
    ctx.state.players[0].syncArmedAt = ctx.state.time;
    expect(activateCardEffect(ctx, 0)).toBe(true);
    expect(ctx.state.syncWindowBonus).toBe(5);
    expect(activateCardEffect(ctx, 0)).toBe(false);
  });

  it('eliminates a wrong verification answer and keeps the correct answer available', () => {
    const ctx = contextFor('hexbreaker');
    const question = { prompt: 'Pick the answer', options: ['A', 'B', 'C'], correctIndex: 1 };
    ctx.state.puzzles[0] = { kind: 'verification', question };
    expect(activateCardEffect(ctx, 0)).toBe(true);
    const puzzle = ctx.state.puzzles[0];
    expect(puzzle?.kind).toBe('verification');
    if (puzzle?.kind === 'verification') {
      expect(puzzle.eliminatedOptions).toContain(0);
      expect(puzzle.eliminatedOptions).not.toContain(1);
    }
  });

  it('forgives exactly one incorrect sequence with no score loss', () => {
    const ctx = contextFor('witchs-elixir');
    expect(activateCardEffect(ctx, 0)).toBe(true);
    const before = ctx.state.score;
    ctx.state.flags.tape = true;
    ctx.state.flags.pastVerified = true;
    ctx.state.flags.futureVerified = true;
    ctx.state.puzzles[0] = { kind: 'sequence', length: 2, input: [] };
    const { pressPuzzleKey } = requirePuzzleManager();
    pressPuzzleKey(ctx.state, 0, 0);
    pressPuzzleKey(ctx.state, 0, 0);
    expect(ctx.state.score).toBe(before);
    expect(ctx.state.forgiveness).toBe(0);
  });

  it.each(['mechanics-curse', 'soul-surge'] as const)('%s refuses use without an eligible task-panel stage', (id) => {
    const ctx = contextFor(id);
    expect(activateCardEffect(ctx, 0)).toBe(false);
    expect(ctx.state.cards[0].uses).toBe(1);
  });
});

function requirePuzzleManager() {
  // Static imports keep Vitest's ESM transform straightforward.
  return puzzleManager;
}
import * as puzzleManager from '../puzzles/puzzleManager';
