import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { R2View, R2Card } from '../../services/round2Service';

const NAMES = ['Vampire Shield', 'Witch Hex', 'Ghost Pass', 'Zombie Revive', 'Pumpkin Bomb', 'Reaper Strike'];
const makeCards = (): R2Card[] =>
  NAMES.map((name, i) => ({ id: i + 1, name, description: `${name} power`, icon: '🎃', defaultBase: 100, status: 'pending', winner: null, price: null }));

let current: R2View;
const bidMock = vi.fn();

vi.mock('../../services/round2Service', () => ({
  round2Service: {
    getRound1Credits: () => 250,
    join: vi.fn(async () => current),
    getState: vi.fn(async () => current),
    bid: (...a: unknown[]) => bidMock(...a),
    saveInventory: vi.fn(),
  },
}));

import { Round2Auction } from '../game/round2/Round2Auction';

const session = { teamId: 't1', teamName: 'Alpha', credits: 250, currentRound: 2, gameStatus: 'active', loginTime: '' } as never;
const view = (over: Partial<R2View> = {}): R2View => ({
  success: true,
  now: Date.now(),
  cards: makeCards(),
  live: null,
  minIncrement: 10,
  me: { name: 'Alpha', startCredits: 250, spent: 0, credits: 250, cards: [] },
  ...over,
});

describe('Round2Auction (player screen)', () => {
  beforeEach(() => {
    bidMock.mockReset();
    current = view();
  });

  it('waits, then shows the card the admin puts up for bidding', async () => {
    render(<Round2Auction session={session} onReturnHome={() => {}} />);
    expect(await screen.findByText(/Waiting for the next card/i)).toBeInTheDocument();
    expect(screen.getAllByText('Vampire Shield')).toHaveLength(1); // only in the card row

    const cards = makeCards();
    cards[0].status = 'live';
    current = view({ now: Date.now() + 5, cards, live: { cardId: 1, base: 100, highBid: 0, highBidder: null, endsAt: null, bids: [] } });

    expect(await screen.findByRole('button', { name: /PLACE BID/i }, { timeout: 4000 })).toBeEnabled();
    expect(screen.getByText(/ROUND 2 • BIDDING OPEN/)).toBeInTheDocument();
    expect(screen.getAllByText('Vampire Shield').length).toBeGreaterThan(1); // stage + card row
  });

  it('places a bid at the minimum and reflects the lead', async () => {
    const cards = makeCards();
    cards[0].status = 'live';
    const live = { cardId: 1, base: 100, highBid: 0, highBidder: null, endsAt: null, bids: [] as never[] };
    current = view({ cards, live });
    bidMock.mockImplementation(async () => {
      current = view({ now: Date.now() + 10, cards, live: { ...live, highBid: 100, highBidder: 'Alpha', bids: [{ team: 'Alpha', amount: 100, t: 1 }] } });
      return current;
    });

    render(<Round2Auction session={session} onReturnHome={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: /PLACE BID/i }));
    await waitFor(() => expect(bidMock).toHaveBeenCalledWith('Alpha', 100));
    expect(await screen.findByText('YOU ARE LEADING')).toBeInTheDocument();
  });

  it('blocks a bid the team cannot afford', async () => {
    const cards = makeCards();
    cards[0].status = 'live';
    current = view({
      cards,
      live: { cardId: 1, base: 400, highBid: 0, highBidder: null, endsAt: null, bids: [] },
    });
    render(<Round2Auction session={session} onReturnHome={() => {}} />);
    expect(await screen.findByText(/do not have enough credits/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PLACE BID/i })).toBeDisabled();
  });

  it('lists cards the team has won', async () => {
    const cards = makeCards();
    cards[1].status = 'sold';
    cards[1].winner = 'Alpha';
    cards[1].price = 130;
    current = view({ cards, me: { name: 'Alpha', startCredits: 250, spent: 130, credits: 120, cards: [{ id: 2, name: 'Witch Hex', price: 130 }] } });
    render(<Round2Auction session={session} onReturnHome={() => {}} />);
    expect(await screen.findByText('130 CR')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument(); // credits left in the header
  });
});
