import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { R2View, R2Card } from '../../services/round2Service';
import { WINNER_PHRASES, LOSER_PHRASES } from '../game/round2/AuctionOutcomeModal';

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
let auctionChanged: (() => void) | null = null;

vi.mock('../../services/round2Service', () => ({
  round2Service: {
    join: vi.fn(async () => current),
    getState: vi.fn(async () => current),
    bid: (...a: unknown[]) => bidMock(...a),
  },
  subscribeToAuctionChanges: (callback: () => void) => { auctionChanged = callback; return () => { auctionChanged = null; }; },
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
    auctionChanged = null;
  });

  it('waits, then shows the card the admin puts up for sealed bidding (no high bid or leading team shown)', async () => {
    render(<Round2Auction session={session} onReturnHome={() => {}} />);
    expect(await screen.findByText(/Waiting for the next card/i)).toBeInTheDocument();
    expect(document.querySelector('.r2-waiting-panel')).toBeInTheDocument();
    expect(document.querySelector('.r2-cobweb')).not.toBeInTheDocument();
    expect(document.querySelector('.r2-ghost, img[src*="ghost-waiting-cutout"]')).not.toBeInTheDocument();
    expect(screen.queryByText('👻')).not.toBeInTheDocument();
    expect(document.querySelector('.r2-wait-flame, .r2-candle')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain('🕯️');
    const earnedCards = screen.getByRole('region', { name: 'Cards earned in bidding' });
    expect(earnedCards.querySelectorAll('article')).toHaveLength(0);
    expect(screen.queryByText('Chrono Freeze')).not.toBeInTheDocument();
    expect(screen.queryByText('Your Cards')).not.toBeInTheDocument();

    const cards = makeCards();
    cards[0].status = 'live';
    current = view({ now: Date.now() + 5, cards, live: { cardId: 1, base: 100, highBid: 0, highBidder: null, endsAt: null, bids: [] } });
    act(() => auctionChanged?.());

    expect(await screen.findByRole('button', { name: /SUBMIT SEALED BID/i }, { timeout: 4000 })).toBeEnabled();
    expect(screen.getByText(/ROUND 2 • BIDDING OPEN/)).toBeInTheDocument();
    expect(screen.getAllByText('Chrono Freeze')).toHaveLength(1);
    expect(screen.queryByText(/CURRENT HIGH BID/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/YOU ARE LEADING/i)).not.toBeInTheDocument();
    expect(screen.getByText(/BLIND SEALED BIDDING/i)).toBeInTheDocument();
    expect(document.querySelector('.r2-panel')).toBeInTheDocument();
    expect(document.querySelector('.r2-panel')).not.toHaveClass('r2-waiting-panel');
    const liveCardArt = document.querySelector('.r2-live-art');
    expect(liveCardArt).toBeInTheDocument();
    expect(liveCardArt).not.toHaveClass('r2-art');
    expect(liveCardArt?.querySelector('img')).toHaveAttribute('src', '/assets/round2/cards/1.jpg');
  });

  it('places a single sealed bid, locks it in, and prevents second bid', async () => {
    const cards = makeCards();
    cards[0].status = 'live';
    const live = { cardId: 1, base: 100, highBid: 0, highBidder: null, endsAt: null, bids: [] as never[] };
    current = view({ cards, live });
    bidMock.mockImplementation(async () => {
      current = view({
        now: Date.now() + 10,
        cards,
        live: { ...live, myBid: 120, hasBid: true, bids: [{ team: 'Alpha', amount: 120, t: 1 }] },
      });
      return current;
    });

    render(<Round2Auction session={session} onReturnHome={() => {}} />);
    const submitBtn = await screen.findByRole('button', { name: /SUBMIT SEALED BID/i });
    fireEvent.click(submitBtn);

    await waitFor(() => expect(bidMock).toHaveBeenCalledWith(100, expect.any(String)));
    expect(bidMock.mock.calls[0][1]).toMatch(/^r2-|^[0-9a-f-]{36}$/i);
    expect(await screen.findByText(/SEALED BID SUBMITTED/i)).toBeInTheDocument();
    expect(screen.queryByText(/CURRENT HIGH BID/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/YOU ARE LEADING/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /SUBMIT SEALED BID/i })).not.toBeInTheDocument();
  });

  it('reuses the same request ID when retrying a bid after a failed response', async () => {
    const cards = makeCards();
    cards[0].status = 'live';
    const live = { cardId: 1, base: 100, highBid: 0, highBidder: null, endsAt: null, bids: [] as never[] };
    current = view({ cards, live });
    bidMock.mockResolvedValueOnce({ success: false, message: 'Temporary network failure.' });
    bidMock.mockImplementationOnce(async (_amount: number, _requestId: string) => {
      const updated = view({
        now: Date.now() + 5,
        cards,
        live: { ...live, myBid: 100, hasBid: true, bids: [{ team: 'Alpha', amount: 100, t: 1 }] },
      });
      current = updated;
      return updated;
    });
    render(<Round2Auction session={session} onReturnHome={() => {}} />);
    const bidButton = await screen.findByRole('button', { name: /SUBMIT SEALED BID/i });
    fireEvent.click(bidButton);
    await screen.findByText('Temporary network failure.');
    fireEvent.click(bidButton);
    await waitFor(() => expect(bidMock).toHaveBeenCalledTimes(2));
    expect(bidMock.mock.calls[1][1]).toBe(bidMock.mock.calls[0][1]);
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
    expect(screen.getByRole('button', { name: /SUBMIT SEALED BID/i })).toBeDisabled();
  });

  it('shows outcome popup with funny sarcastic winner phrase when team wins', async () => {
    const cards = makeCards();
    current = view({ cards });
    render(<Round2Auction session={session} onReturnHome={() => {}} />);
    expect(await screen.findByText(/Waiting for the next card/i)).toBeInTheDocument();

    const finishedCards = makeCards();
    finishedCards[0].status = 'sold';
    finishedCards[0].winner = 'Alpha'; // This team!
    finishedCards[0].price = 150;
    current = view({ now: current.now + 5, cards: finishedCards });
    act(() => auctionChanged?.());

    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/VICTORY! CARD WON/i)).toBeInTheDocument();
    expect(screen.getByText('Chrono Freeze')).toBeInTheDocument();
    expect(screen.getByText(/WINNING BID: 150 CR/i)).toBeInTheDocument();
    
    // Check that one of the exact WINNER_PHRASES is displayed
    const bodyText = document.body.textContent ?? '';
    const hasWinnerPhrase = WINNER_PHRASES.some((phrase) => bodyText.includes(phrase));
    expect(hasWinnerPhrase).toBe(true);

    // Dismiss modal
    fireEvent.click(screen.getByRole('button', { name: /CLAIM GLORY & CONTINUE/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows outcome popup with savage loser phrase when team loses', async () => {
    const cards = makeCards();
    current = view({ cards });
    render(<Round2Auction session={session} onReturnHome={() => {}} />);
    expect(await screen.findByText(/Waiting for the next card/i)).toBeInTheDocument();

    const finishedCards = makeCards();
    finishedCards[0].status = 'sold';
    finishedCards[0].winner = 'Bravo'; // Another team won
    finishedCards[0].price = 180;
    current = view({ now: current.now + 5, cards: finishedCards });
    act(() => auctionChanged?.());

    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/AUCTION DEFEAT: OUTBID!/i)).toBeInTheDocument();
    expect(screen.getByText('Chrono Freeze')).toBeInTheDocument();
    expect(screen.getByText(/SOLD FOR: 180 CR \(to Bravo\)/i)).toBeInTheDocument();

    // Check that one of the exact LOSER_PHRASES is displayed
    const bodyText = document.body.textContent ?? '';
    const hasLoserPhrase = LOSER_PHRASES.some((phrase) => bodyText.includes(phrase));
    expect(hasLoserPhrase).toBe(true);

    // Dismiss modal
    fireEvent.click(screen.getByRole('button', { name: /ACCEPT YOUR FATE & CONTINUE/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
