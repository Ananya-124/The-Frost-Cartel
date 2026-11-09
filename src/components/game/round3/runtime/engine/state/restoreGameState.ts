import { createInitialState } from './createInitialState';
import type { GameState, PowerCard } from '../../types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Restores a saved team snapshot while replacing its cards with current owned inventory. */
export function restoreGameState(saved: unknown, teamName: string, cards: readonly PowerCard[]): GameState {
  const base = createInitialState(teamName, cards);
  if (!isRecord(saved)) return base;
  const candidate = saved as Partial<GameState>;
  const phase: GameState['phase'] = candidate.phase === 'playing' || candidate.phase === 'ended' ? candidate.phase : 'menu';
  const huntIndex = Number.isInteger(candidate.huntIndex) && Number(candidate.huntIndex) >= 0 && Number(candidate.huntIndex) <= 2
    ? Number(candidate.huntIndex) as GameState['huntIndex'] : 0;
  const restored: GameState = { ...base, ...candidate, teamName, cards: cards.map((card) => ({ ...card })), phase, huntIndex };
  restored.syncWindowBonus ??= 0;
  restored.highlightedObjectId ??= null;
  restored.highlightTimer ??= 0;
  restored.forgiveness ??= 0;
  if (phase === 'playing') {
    restored.freezeTimer = 0;
    restored.huntIntro = null;
  }
  restored.dirty = true;
  return restored;
}
