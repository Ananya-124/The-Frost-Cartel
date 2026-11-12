import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TeamSession } from '../../../types/team.types';
import { round2Service, subscribeToAuctionChanges, type R2Card, type R2View } from '../../../services/round2Service';
import { HauntedGraveyardAtmosphere } from '../haunted/HauntedGraveyardAtmosphere';
import { AuctionCard, CardArt } from './AuctionCard';
import '../../../styles/round2.css';

interface Round2AuctionProps {
  session: TeamSession;
  onReturnHome: () => void;
}

const FALLBACK_POLL_MS = 15000; // SSE delivers changes; this is reconnect recovery only.

const Divider: React.FC = () => (
  <div className="flex items-center justify-center gap-3 w-full max-w-md mx-auto opacity-80">
    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-cartel-pumpkin" />
    <img
      src="/assets/round2/credits-pumpkin.png?v=2"
      alt=""
      aria-hidden="true"
      className="r2-pumpkin r2-divider-pumpkin"
    />
    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-cartel-pumpkin" />
  </div>
);

export const Round2Auction: React.FC<Round2AuctionProps> = ({ session, onReturnHome }) => {
  const team = session.teamName;
  const [view, setView] = useState<R2View | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');
  const [nowMs, setNowMs] = useState(0);
  const [seenKey, setSeenKey] = useState('');

  const offset = useRef(0); // server clock minus this browser's clock
  const lastServerNow = useRef(0);
  const prevStatus = useRef<Record<number, R2Card['status']>>({});
  const pendingBid = useRef<{ amount: number; requestId: string } | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showBanner = useCallback((text: string) => {
    setBanner(text);
    clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(''), 6000);
  }, []);

  /** Take a fresh answer from the server (poll or bid). Ignores answers older than one already shown. */
  const apply = useCallback((r: R2View) => {
    if (r.now < lastServerNow.current) return;
    lastServerNow.current = r.now;
    offset.current = r.now - Date.now();
    setNowMs(r.now);
    setView(r);
    setOffline(false);
      setConnectionMessage('');

    // Announce auction results to every team as they receive the updated state.
    const prev = prevStatus.current;
    for (const c of r.cards) {
      const before = prev[c.id];
      if (before && before !== c.status) {
        if (c.status === 'sold') showBanner(`${c.winner ?? 'A team'} won ${c.name} for ${c.price ?? c.defaultBase} CR`);
        else if (c.status === 'unsold') showBanner(`💀 ${c.name} went unsold`);
      }
      prev[c.id] = c.status;
    }
  }, [showBanner]);

  // Join once, then keep asking the server what is on the block. If the server forgets this team
  // (admin reset / team removed) the team is joined again automatically.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let first = true;
    let inFlight = false;
    let refreshQueued = false;

    const refresh = async () => {
      if (!alive) return;
      if (inFlight) { refreshQueued = true; return; }
      inFlight = true;
      try {
        let r = first ? await round2Service.join() : await round2Service.getState();
        first = false;
        if (!alive) return;
        if (r.success && !r.me) r = await round2Service.join();
        if (!alive) return;
        if (r.success) apply(r);
        else { setOffline(true); setConnectionMessage(r.message ?? 'Auction server is unavailable.'); }
      } finally {
        inFlight = false;
        if (refreshQueued && alive) { refreshQueued = false; void refresh(); }
      }
    };

    const scheduleFallback = () => {
      timer = setTimeout(() => {
        if (document.visibilityState === 'visible') void refresh();
        scheduleFallback();
      }, FALLBACK_POLL_MS);
    };
    void refresh();
    const unsubscribe = subscribeToAuctionChanges(() => { void refresh(); });
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    scheduleFallback();
    return () => {
      alive = false;
      clearTimeout(timer);
      clearTimeout(bannerTimer.current);
      unsubscribe();
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [team, apply]);

  // The countdown only needs a fast clock while a timed card is live.
  const endsAt = view?.live?.endsAt ?? null;
  useEffect(() => {
    if (endsAt === null) return;
    const i = setInterval(() => setNowMs(Date.now() + offset.current), 1000);
    return () => clearInterval(i);
  }, [endsAt]);

  const live = view?.live ?? null;
  const liveCard = live ? view?.cards.find((c) => c.id === live.cardId) : undefined;
  const inc = view?.minIncrement ?? 10;
  const min = live ? (live.highBidder ? live.highBid + inc : live.base) : 0;
  const ref = live ? (live.highBidder ? live.highBid : live.base) : 0;
  const credits = view?.me?.credits ?? 0;
  const myName = view?.me?.name ?? team; // the server may store the team name with different capitals
  const leading = !!live && live.highBidder === myName;
  const secs = endsAt !== null && nowMs ? Math.max(0, Math.ceil((endsAt - nowMs) / 1000)) : null;
  const closing = secs === 0;
  const tooPoor = !!live && credits < min;
  const amountNum = Number.parseInt(amount, 10);
  const canBid = !!live && !leading && !busy && !closing && !tooPoor && Number.isFinite(amountNum) && amountNum >= min && amountNum <= credits;

  let timerClass = 'text-cartel-amber';
  if (secs !== null && secs <= 5) timerClass = 'text-red-500 animate-pulse';
  else if (secs !== null && secs <= 15) timerClass = 'text-yellow-400 animate-pulse';

  // Prefill the bid box whenever the card or the minimum bid changes (state adjusted during render).
  const promptKey = live ? `${live.cardId}:${min}` : '';
  if (promptKey !== seenKey) {
    setSeenKey(promptKey);
    setError('');
    if (promptKey) setAmount(String(min));
  }

  const placeBid = async () => {
    if (!canBid) return;
    if (!pendingBid.current || pendingBid.current.amount !== amountNum) {
      pendingBid.current = { amount: amountNum, requestId: globalThis.crypto?.randomUUID?.() ?? `r2-${Date.now()}-${Math.random().toString(36).slice(2)}` };
    }
    const requestId = pendingBid.current.requestId;
    setBusy(true);
    setError('');
    try {
      const r = await round2Service.bid(amountNum, requestId);
      if (r.success) {
        pendingBid.current = null;
        apply(r);
        showBanner(r.bid?.duplicate ? 'Your earlier bid was received. Auction state is up to date.' : 'Bid accepted.');
      } else setError(r.message ?? 'Bid failed. You can retry safely.');
    } finally {
      setBusy(false);
    }
  };

  const won = view?.me?.cards ?? [];
  const earnedCards = won.flatMap((earned) => {
    const card = view?.cards.find((candidate) => candidate.id === earned.id);
    return card ? [{ card, paidPrice: earned.price }] : [];
  });
  const allSold = !!view && view.cards.every((c) => c.status === 'sold');
  let footer = 'ROUND 2 • WAITING FOR THE NEXT CARD';
  if (live) footer = 'ROUND 2 • BIDDING OPEN';
  else if (allSold) footer = 'ROUND 2 • AUCTION COMPLETE';

  return (
    <div className="r2-page relative min-h-screen bg-cartel-void text-cartel-bone font-sans">
      <HauntedGraveyardAtmosphere />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-5">
        {/* Header */}
        <header className="grid grid-cols-[auto_1fr_auto] items-start gap-3 mb-5">
          <button onClick={onReturnHome} className="r2-btn rounded-xl px-4 py-2 font-cinzel text-xs tracking-widest text-amber-200/90 cursor-pointer">
            ← RETURN
          </button>
          <div className="r2-title-plate text-center px-4 py-2">
            <h1 className="r2-title" aria-label="The Haunted Auction">
              <span className="r2-title-the">THE</span>
              <span className="r2-title-line r2-title-haunted">HAUNTED</span>
              <span className="r2-title-line r2-title-auction">AUCTION</span>
            </h1>
            <div className="mt-1"><Divider /></div>
          </div>
          <div className="r2-btn rounded-xl px-4 py-2 text-center min-w-[110px]">
            <div className="font-cinzel text-[10px] tracking-widest text-cartel-silver/80 truncate max-w-[140px]">{team}</div>
            <div className="font-cinzel text-xl sm:text-2xl text-amber-200/90 flex items-center justify-center gap-1.5">
              <img
                src="/assets/round2/credits-pumpkin.png?v=2"
                alt=""
                aria-hidden="true"
                className="r2-pumpkin r2-credit-pumpkin"
              />
              <span>{credits}</span>
              <span className="text-xs">CR</span>
            </div>
          </div>
        </header>

        {offline && (
          <div role="status" className="mb-3 text-center font-cinzel text-xs tracking-widest text-red-300 border border-red-500/40 bg-black/60 rounded-lg py-1.5">
            {connectionMessage || 'RECONNECTING TO THE AUCTION…'}
          </div>
        )}
        {banner && (
          <div role="status" aria-live="polite" className="r2-toast fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-xl border border-orange-500/70 bg-[#100c19]/95 px-5 py-3 text-center font-cinzel font-bold tracking-wide text-amber-100 shadow-[0_0_24px_rgba(224,144,47,0.5)] backdrop-blur">
            {banner}
          </div>
        )}

        {/* Auction stage */}
        <div>
          <section
            className={`r2-panel relative rounded-2xl overflow-hidden ${live ? 'p-5 min-h-[260px]' : 'r2-waiting-panel'}`}
            aria-label="Card on the block"
          >
            {live && liveCard ? (
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="r2-live-art w-36 sm:w-44 shrink-0 mx-auto sm:mx-0 aspect-[4/5]">
                    <CardArt card={liveCard} className="h-full w-full object-contain" />
                    <span className="r2-badge r2-badge-live">LIVE</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-gothic text-3xl text-amber-200/90">{liveCard.name}</h2>
                        <p className="font-garamond text-cartel-silver/80">{liveCard.description}</p>
                      </div>
                      {secs !== null && (
                        <div className="text-right" aria-label="Seconds left">
                          <div className={`font-cinzel text-5xl sm:text-6xl font-bold tabular-nums ${timerClass}`}>{secs}</div>
                          {closing && <div className="font-cinzel text-[10px] tracking-widest text-cartel-silver/70">CLOSING…</div>}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 rounded-lg border border-orange-800/40 bg-black/45 p-4">
                      <div className="font-cinzel text-[10px] tracking-widest text-cartel-silver/70">CURRENT HIGH BID</div>
                      <div className="font-cinzel text-4xl text-amber-100/90">{live.highBidder ? live.highBid : '—'}</div>
                      <div className="text-sm text-cartel-silver/70">{live.highBidder ? `by ${live.highBidder}` : `no bids yet · base ${live.base} CR`}</div>
                    </div>
                  </div>
                </div>

                {leading && (
                  <div className="mt-3 text-center rounded-lg border border-emerald-600/50 bg-emerald-950/60 text-emerald-400 font-cinzel tracking-widest py-2">
                    YOU ARE LEADING
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={min}
                    step={1}
                    aria-label="Your bid in credits"
                    value={amount}
                    disabled={leading || closing}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void placeBid(); }}
                    className="flex-1 min-w-[140px] bg-black/60 border border-orange-700/50 rounded-lg px-3 py-3 text-xl font-cinzel text-amber-100 disabled:opacity-40"
                  />
                  {[10, 20, 50].map((n) => (
                    <button
                      key={n}
                      disabled={leading || closing}
                      onClick={() => setAmount(String(ref + n))}
                      className="r2-btn px-4 rounded-lg font-cinzel text-amber-200/90 disabled:opacity-40 cursor-pointer"
                    >
                      +{n}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-cartel-silver/70 font-cinzel tracking-wider">MINIMUM BID: {min} CR · YOU HAVE {credits} CR</p>
                {tooPoor && !leading && <p className="mt-1 text-sm text-red-400">You do not have enough credits to bid on this card.</p>}
                {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
                <button
                  onClick={() => void placeBid()}
                  disabled={!canBid}
                  className="mt-3 w-full py-4 rounded-lg bg-gradient-to-r from-orange-800 via-orange-600 to-orange-800 text-black font-cinzel font-bold tracking-widest text-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {busy ? 'PLACING…' : 'PLACE BID'}
                </button>

                <h3 className="mt-5 font-cinzel text-xs tracking-widest text-cartel-silver/70">RECENT BIDS</h3>
                <ul className="mt-1 text-sm">
                  {live.bids.slice(0, 5).map((b, i) => (
                    <li key={`${b.t}-${i}`} className="flex justify-between border-b border-white/5 py-1">
                      <span>{b.team}</span>
                      <b className="text-amber-200/90">{b.amount}</b>
                    </li>
                  ))}
                  {live.bids.length === 0 && <li className="text-cartel-silver/50 py-1">No bids yet</li>}
                </ul>
              </div>
            ) : (
              <div className="r2-waiting-content relative z-10 flex flex-col items-center justify-end text-center">
                <p className="r2-wait">
                  {view ? 'Waiting for the next card...' : 'Connecting to the auction...'}
                </p>
                <div aria-hidden="true" className="r2-wait-divider">
                  <span />
                  <img
                    src="/assets/round2/credits-pumpkin.png?v=2"
                    alt=""
                    aria-hidden="true"
                    className="r2-pumpkin r2-divider-pumpkin"
                  />
                  <span />
                </div>
              </div>
            )}
          </section>

        </div>

        <section className="mt-9" aria-label="Cards earned in bidding">
          <h2 className="mb-5 text-center font-cinzel text-xl tracking-widest text-amber-200/90">CARDS EARNED IN BIDDING</h2>
          {earnedCards.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
              {earnedCards.map(({ card, paidPrice }, index) => (
                <AuctionCard key={card.id} card={card} paidPrice={paidPrice} index={index} />
              ))}
            </div>
          ) : (
            <p className="text-center font-garamond italic text-lg text-[#9a84c0]">
              {view ? 'Cards you win at auction will appear here.' : 'Connecting to the auction...'}
            </p>
          )}
        </section>

        {/* Footer banner */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent to-orange-600/70" />
          <div className="r2-btn rounded-full px-6 py-2 font-cinzel tracking-wider text-lg sm:text-xl text-amber-200/90 flex items-center gap-3">
            {live && <span aria-hidden="true" className="r2-hourglass">⏳</span>}
            <span>{footer}</span>
          </div>
          <span className="h-px flex-1 max-w-xs bg-gradient-to-l from-transparent to-orange-600/70" />
        </div>
      </div>
    </div>
  );
};
