import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { R2View, R2Card } from '../../services/round2Service';

const NAMES = [
  'Chrono Freeze',
  'Witching Hour',
  'Spectral Sight',
  "Witch's Lens",
  'Hexbreaker',
  "Mechanic's Curse",
  "Witch's Elixir",
  "Raven's Messenger",
  'Phantom Shield',
  'Soul Surge',
  "The Warden's Decree — Master Card",
];
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
    expect(document.querySelector('img.r2-ghost')).toHaveAttribute('src', '/assets/round2/ghost-waiting-cutout.png');
    const earnedCards = screen.getByRole('region', { name: 'Cards earned in bidding' });
    expect(earnedCards.querySelectorAll('article')).toHaveLength(0);
    expect(screen.queryByText('Chrono Freeze')).not.toBeInTheDocument();
    expect(screen.queryByText('Your Cards')).not.toBeInTheDocument();

    const cards = makeCards();
    cards[0].status = 'live';
    current = view({ now: Date.now() + 5, cards, live: { cardId: 1, base: 100, highBid: 0, highBidder: null, endsAt: null, bids: [] } });

    expect(await screen.findByRole('button', { name: /PLACE BID/i }, { timeout: 4000 })).toBeEnabled();
    expect(screen.getByText(/ROUND 2 • BIDDING OPEN/)).toBeInTheDocument();
    expect(screen.getAllByText('Chrono Freeze')).toHaveLength(1);
    const liveCardArt = document.querySelector('.r2-live-art');
    expect(liveCardArt).toBeInTheDocument();
    expect(liveCardArt).not.toHaveClass('r2-art');
    expect(liveCardArt?.querySelector('img')).toHaveAttribute('src', '/assets/round2/cards/1.jpg');
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

  it('notifies every team when a card is won', async () => {
    const cards = makeCards();
    current = view({ cards });
    render(<Round2Auction session={session} onReturnHome={() => {}} />);
    expect(await screen.findByText(/Waiting for the next card/i)).toBeInTheDocument();

    const finishedCards = makeCards();
    finishedCards[0].status = 'sold';
    finishedCards[0].winner = 'Bravo';
    finishedCards[0].price = 170;
    current = view({ now: current.now + 5, cards: finishedCards });

    const notification = await screen.findByText('Bravo won Chrono Freeze for 170 CR');
    expect(notification).toHaveAttribute('role', 'status');
    expect(notification).toHaveClass('r2-toast');
  });

  it('shows only cards the team has won in the earned-card gallery', async () => {
    const cards = makeCards();
    cards[1].status = 'sold';
    cards[1].winner = 'Alpha';
    cards[1].price = 130;
    current = view({ cards, me: { name: 'Alpha', startCredits: 250, spent: 130, credits: 120, cards: [{ id: 2, name: 'Witching Hour', price: 130 }] } });
    render(<Round2Auction session={session} onReturnHome={() => {}} />);
    const earnedCard = await screen.findByRole('article', { name: /Witching Hour, purchased for 130 credits/i });
    expect(screen.getByText('120')).toBeInTheDocument(); // credits left in the header
    const earnedCards = screen.getByRole('region', { name: 'Cards earned in bidding' });
    expect(earnedCards.querySelectorAll('article')).toHaveLength(1);
    expect(earnedCard).toHaveAccessibleName('Witching Hour, purchased for 130 credits');
    expect(earnedCard.querySelector('.r2-earned-art')).toHaveAttribute('src', '/assets/round2/cards/2.jpg');
    expect(earnedCard.querySelector('.r2-earned-paper')).toHaveClass('r2-earned-paper');
    expect(earnedCard).toHaveTextContent('WON FOR 130 CR');
    expect(earnedCard).not.toHaveTextContent('Witching Hour power');
    expect(earnedCards).not.toHaveTextContent('Chrono Freeze');
    expect(screen.queryByText('Your Cards')).not.toBeInTheDocument();
  });
});
