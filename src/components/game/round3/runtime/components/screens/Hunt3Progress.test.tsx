import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Hunt3State } from '../../../../../../types/hunt3.types';
import Hunt3Progress from './Hunt3Progress';

afterEach(cleanup);
function makeState(): Hunt3State {
  return {
    teamId: 'ui-hunt3', stage: 1, completed: false, score: 0,
    scoreBreakdown: { stage1: 0, stage2: 0, stage3: 0, stage4: 0, optional: 0 },
    journal: [],
    evidence: { archivist: [], tracker: [] }, trail: { archivist: null, tracker: null, resolved: false },
    seals: { power: { archive: false, physical: [], disabled: false }, resonance: { archive: false, physical: [], disabled: false }, memory: { archive: false, physical: [], disabled: false } },
    components: [], apparatus: { archive: null, physical: null, configured: false },
    weakness: { archive: false, trials: [], discovered: false, lure: 0, weakened: 0 },
    boss: { step: 0, warning: null, stability: 0, captured: false, lastActionAt: null, deadlineAt: null },
    optional: { archivist: false, tracker: false, complete: false }, actions: [], penalties: 0, updatedAt: new Date().toISOString(),
  };
}

describe('Hunt III progress controls', () => {
  it('reopens the Archivist panel when all three trail clues are collected', () => {
    const state = makeState();
    const view = render(<Hunt3Progress state={state} actor="archivist" message="" working={false} onAction={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Hunt III · 1\/4 · Show Archivist tasks/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    expect(screen.queryByText('CLUES READY · NEXT ACTION')).not.toBeInTheDocument();
    state.evidence.archivist = ['sighting-ledger', 'containment-observation', 'old-facility-report'];
    view.rerender(<Hunt3Progress state={state} actor="archivist" message="" working={false} onAction={vi.fn()} />);
    expect(screen.getByText(/All three Past records are collected/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
  });

  it('shows timeline-specific field-investigation instructions and submits its location finding', async () => {
    const state = makeState(); state.evidence.archivist = ['sighting-ledger', 'containment-observation', 'old-facility-report'];
    const onAction = vi.fn(async () => ({ success: true, message: 'waiting for Tracker', state }));
    render(<Hunt3Progress state={state} actor="archivist" message="" working={false} onAction={onAction} />);
    expect(screen.getByText(/Compare the three historical records in the Past/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Examine sighting-ledger/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Evidence inspected: 3\/3/i)).toBeInTheDocument();
    expect(screen.queryByText(/Break the Three Seals/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Last known wing/i), { target: { value: 'east-wing' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit private trail finding/i }));
    expect(onAction).toHaveBeenCalledWith({ type: 'submit', id: 'trail-location', value: { location: 'east-wing' } });
  });

  it('requires the Archivist to submit a Past seal deduction and retains its shared evidence', () => {
    const state = makeState();
    state.stage = 2;
    state.evidence.archivist = ['power-diagram'];
    state.actions = ['power-diagram'];
    state.journal = [{
      id: 'power-diagram', stage: 2, actor: 'archivist', title: 'Power seal diagram', location: 'Archive · Past',
      content: 'The archive sketch marks a feed, a ground bond, and a return path.', relatedObjective: 'Break the Three Seals', verified: false,
    }];
    const onAction = vi.fn(async () => ({ success: true, message: 'verified', state }));
    render(<Hunt3Progress state={state} actor="archivist" message="" working={false} onAction={onAction} />);
    expect(screen.getByRole('heading', { name: 'Disable the three seals' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Inspect power seal diagram/i })).not.toBeInTheDocument();
    expect(screen.getByText(/POWER SEAL/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Connection 1'), { target: { value: 'source' } });
    fireEvent.change(screen.getByLabelText('Connection 2'), { target: { value: 'ground' } });
    fireEvent.change(screen.getByLabelText('Connection 3'), { target: { value: 'return' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Past power interpretation' }));
    expect(onAction).toHaveBeenCalledWith({ type: 'submit', id: 'seal-power-archive', value: { sequence: ['source', 'ground', 'return'] } });
  });

  it('shows the current server warning and partner responsibility during final capture', () => {
    const state = makeState(); state.stage = 4; state.boss.step = 1; state.boss.warning = 'Current is arcing across the floor. Ground the chamber.';
    render(<Hunt3Progress state={state} actor="archivist" message="" working={false} onAction={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Hunt III · 4\/4 · Show Archivist tasks/i }));
    expect(screen.getByText(/Current is arcing across the floor/)).toBeInTheDocument();
    expect(screen.getByText(/Tracker · Future/)).toBeInTheDocument();
    expect(screen.getByText(/Waiting for Tracker · Future to act/)).toBeInTheDocument();
    expect(screen.getByText(/Controls only register after the correct player/)).toBeInTheDocument();
  });

  it('counts the Archivist seal and catalogue work as a completed second task', () => {
    const state = makeState();
    state.stage = 3;
    state.trail.archivist = 'east-wing';
    state.actions = ['component-catalog'];
    for (const seal of ['power', 'resonance', 'memory'] as const) state.seals[seal].archive = true;
    render(<Hunt3Progress state={state} actor="archivist" message="" working={false} onAction={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Hunt III · 3\/4 · Show Archivist tasks/i }));
    expect(screen.getByText(/ARCHIVIST TASKS COMPLETED · 2\/4/i)).toBeInTheDocument();
    expect(screen.getByText(/Current task 3\/4 · IN PROGRESS/i)).toBeInTheDocument();
  });
});
