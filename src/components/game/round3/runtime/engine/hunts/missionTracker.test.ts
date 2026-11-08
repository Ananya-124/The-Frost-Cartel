import { describe, expect, it } from 'vitest';
import { createInitialState } from '../state/createInitialState';
import { getObjective } from './missionTracker';

describe('Round 3 role objectives', () => {
  it('shows only the currently active Hunt I task and uses retained task names', () => {
    const state = createInitialState('Objective test');
    state.huntIndex = 0;
    state.hunt1Challenge = 3;
    expect(getObjective(state, 'past')).toContain('Task 3');
    expect(getObjective(state, 'past')).toContain('signal route');
    expect(getObjective(state, 'future')).toContain('verified route');
    expect(getObjective(state, 'past')).not.toMatch(/visitor|report index|shredded/i);
  });

  it('uses server-synchronized task and stage state for Hunt II and III', () => {
    const state = createInitialState('Objective test');
    state.huntIndex = 1;
    state.hunt2Challenge = 4;
    expect(getObjective(state, 'past')).toContain('The Memory Anchor');
    state.huntIndex = 2;
    state.hunt3Stage = 3;
    expect(getObjective(state, 'future')).toContain('The Bait Protocol');
    state.hunt3Complete = true;
    expect(getObjective(state, 'future')).toContain('entity is contained');
  });
});
