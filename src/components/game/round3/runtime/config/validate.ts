import { DOORS } from '../engine/world/geometry';
import type { ProgressFlag } from '../types';
import { HUNTS } from './hunts';
import { INTERACTABLES } from './interactables';
import { MIRROR_CLUE } from './clues';

/**
 * Checks that the hunt configuration is internally consistent: every clue sits
 * on a real object, every requirement and door lock can be satisfied inside the
 * same hunt, and no object holds two clues. Returns a list of problems.
 */
export function validateConfig(): string[] {
  const problems: string[] = [];

  for (const hunt of HUNTS) {
    const granted = new Set<ProgressFlag>();
    const seen = new Set<string>();

    for (const clue of [...hunt.clues, MIRROR_CLUE]) {
      const id = `${clue.timeline}:${clue.objectId}`;
      if (!INTERACTABLES.some((o) => o.id === clue.objectId && o.timeline === clue.timeline)) {
        problems.push(`${hunt.title}: clue "${clue.title}" has no object ${id}`);
      }
      if (seen.has(id)) problems.push(`${hunt.title}: two clues on ${id}`);
      seen.add(id);
      if (clue.grants) granted.add(clue.grants);
    }

    for (const clue of hunt.clues) {
      if (clue.requires && !granted.has(clue.requires)) {
        problems.push(`${hunt.title}: "${clue.title}" requires ${clue.requires}, which no clue grants`);
      }
    }

    for (const door of DOORS) {
      for (const lock of [door.pastLock, door.futureLock]) {
        if (lock && !granted.has(lock)) {
          problems.push(`${hunt.title}: door ${door.from}-${door.to} needs ${lock}, which no clue grants`);
        }
      }
    }

    // Hunt I is driven by the server-authoritative incident evidence model; its
    // interactables do not grant the legacy tape/anchor progression flags.
    if (hunt.index !== 0) {
      if (!granted.has('tape')) problems.push(`${hunt.title}: no clue grants the tape`);
      if (!granted.has('anchor')) problems.push(`${hunt.title}: no clue grants the anchor`);
    }

    for (const timeline of ['past', 'future'] as const) {
      const q = hunt.verification[timeline].question;
      if (q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        problems.push(`${hunt.title}: ${timeline} question answer out of range`);
      }
      const seq = hunt.sequence[timeline].steps;
      if (seq.length === 0 || seq.some((s) => s < 0 || s > 3)) {
        problems.push(`${hunt.title}: ${timeline} sequence has invalid symbols`);
      }
    }
  }

  return problems;
}
