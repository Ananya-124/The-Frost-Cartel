import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ROUND3_CARD_CATALOG } from '../../constants/round3.cards';
import type { Round3StateResponse } from '../../types/round3.types';
import { ParadoxHunt } from '../game/round3/ParadoxHunt';

vi.mock('../game/round3/runtime/components/screens/GameScreen', () => ({
  default: ({ teamName }: { teamName: string }) => <div data-testid="paradox-game">PARADOX GAME · {teamName}</div>,
}));

const teamSession = { teamId: 'team-r3-test', teamName: 'Paradox Team', credits: 0, currentRound: 3, gameStatus: 'active' as const, loginTime: new Date().toISOString() };
const state: Round3StateResponse = {
  success: true,
  session: {
    teamId: teamSession.teamId, teamName: teamSession.teamName, currentHunt: 'paradox-hunt',
    playerProgress: {}, timelines: { past: {}, future: {} }, activeTimeline: 'past', evidenceDiscoveries: [],
    cardUsage: [], score: 0, completed: false, completedAt: null, updatedAt: new Date().toISOString(),
  },
  inventory: [], cards: ROUND3_CARD_CATALOG,
};

describe('Paradox Hunt foundation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => state }));
  });

  it('opens the game runtime only after the authenticated team session loads', async () => {
    const fetchMock = vi.mocked(fetch);
    render(<ParadoxHunt session={teamSession} onReturnHome={() => {}} />);
    expect(await screen.findByTestId('paradox-game')).toHaveTextContent('Paradox Team');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/session'), expect.objectContaining({ method: 'POST' })));
  });
});
