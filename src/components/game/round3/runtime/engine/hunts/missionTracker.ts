import type { GameState, MissionCondition, Timeline } from '../../types';

export function isConditionMet(state: GameState, condition: MissionCondition): boolean {
  return condition === 'entityMarked' ? state.entityMarked : !!state.flags[condition];
}

/** The objective a player sees: the first step whose condition is not yet met. */
export function getObjective(state: GameState, timeline: Timeline): string {
  const investigator = timeline === 'past' ? 'Archivist' : 'Tracker';
  if (state.huntIndex === 0) {
    const taskNumber = state.hunt1Challenge ?? 1;
    const taskObjectives: Record<number, Record<Timeline, string>> = {
      1: { past: 'Task 1 · Read the generator wiring diagram and submit its connection order.', future: 'Task 1 · Reconnect and test the generator using the Archivist’s decoded wiring.' },
      2: { past: 'Task 2 · Reconcile the observation log and submit the Past event timeline.', future: 'Task 2 · Reconstruct the room’s physical event timeline.' },
      3: { past: 'Task 3 · Decode the original signal route for the Tracker.', future: 'Task 3 · Reconnect the console using the Archivist’s verified route.' },
      4: { past: 'Task 4 · Submit the experiment’s purpose and intended procedure.', future: 'Task 4 · Submit the failure cause and transmission aftermath.' },
    };
    return taskObjectives[taskNumber]?.[timeline] ?? 'Follow the active Hunt I task panel.';
  }
  if (state.huntIndex === 1) {
    if (state.hunt2Complete) return 'Hunt II complete. Continue to the Hunt III task panel.';
    const challenge = state.hunt2Challenge ?? 2;
    const taskTitle: Record<number, string> = { 2: 'The Hidden Weakness', 3: 'The Broken Memory', 4: 'The Memory Anchor', 5: 'The Final Memory' };
    return `${investigator} · Hunt II ${taskTitle[challenge] ?? 'investigation'} — follow the role-specific task panel.`;
  }
  if (state.hunt3Complete) return 'Hunt III complete. The entity is contained.';
  const stage = state.hunt3Stage ?? 1;
  const stageTitle: Record<number, string> = { 1: 'The Entity’s Trail', 2: 'Break the Three Seals', 3: 'The Bait Protocol', 4: 'Final Containment' };
  return `${investigator} · Hunt III ${stageTitle[stage] ?? 'investigation'} — follow the role-specific task panel.`;
}
