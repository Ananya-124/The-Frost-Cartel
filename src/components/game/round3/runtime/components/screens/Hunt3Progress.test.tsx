import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Hunt3State } from '../../../../../../types/hunt3.types';
import Hunt3Progress from './Hunt3Progress';

afterEach(cleanup);
function makeState(): Hunt3State {
  return {
    teamId: 'ui-hunt3', stage: 1, completed: false, score: 0,
    scoreBreakdown: { stage1: 0, stage2: 0, stage3: 0, stage4: 0, optional: 0 },
    evidence: { archivist: [], tracker: [] }, trail: { archivist: null, tracker: null, resolved: false },
    seals: { power: { archive: false, physical: [], disabled: false }, resonance: { archive: false, physical: [], disabled: false }, memory: { archive: false, physical: [], disabled: false } },
    components: [], apparatus: { archive: null, physical: null, configured: false },
    weakness: { archive: false, trials: [], discovered: false, lure: 0, weakened: 0 },
    boss: { step: 0, warning: null, stability: 0, captured: false, lastActionAt: null, deadlineAt: null },
    optional: { archivist: false, tracker: false, complete: false }, actions: [], penalties: 0, updatedAt: new Date().toISOString(),
  };
}

describe('Hunt III progress controls', () => {
  it('shows timeline-specific field-investigation instructions and submits its location finding', async () => {
    const state = makeState(); state.evidence.archivist = ['sighting-ledger', 'containment-observation', 'old-facility-report'];
    const onAction = vi.fn(async () => ({ success: true, message: 'waiting for Tracker', state }));
    render(<Hunt3Progress state={state} actor="archivist" message="" working={false} onAction={onAction} />);
    expect(screen.getByText(/Search the Past archive records in the world/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Examine sighting-ledger/i })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Last known wing/i), { target: { value: 'east-wing' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit private trail finding/i }));
    expect(onAction).toHaveBeenCalledWith({ type: 'submit', id: 'trail-location', value: { location: 'east-wing' } });
  });

  it('shows the current server warning and partner responsibility during final capture', () => {
    const state = makeState(); state.stage = 4; state.boss.step = 1; state.boss.warning = 'Current is arcing across the floor. Ground the chamber.';
    render(<Hunt3Progress state={state} actor="archivist" message="" working={false} onAction={vi.fn()} />);
    expect(screen.getByText(/Current is arcing across the floor/)).toBeInTheDocument();
    expect(screen.getByText(/Tracker · Future/)).toBeInTheDocument();
    expect(screen.getByText(/Your partner must operate their timeline control/)).toBeInTheDocument();
  });
});
