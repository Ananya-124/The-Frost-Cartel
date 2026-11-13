import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TeamSession } from '../../../types/team.types';
import { round2Service, subscribeToAuctionChanges, type R2Card, type R2View } from '../../../services/round2Service';
import { HauntedGraveyardAtmosphere } from '../haunted/HauntedGraveyardAtmosphere';
import { AuctionCard, CardArt } from './AuctionCard';
import { AuctionOutcomeModal, getRandomPhrase } from './AuctionOutcomeModal';
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
  const [myPlacedBid, setMyPlacedBid] = useState<{ cardId: number; amount: number } | null>(null);

  // Outcome pop-up modal state (winner / loser funny quotes)
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'winner' | 'loser';
    phrase: string;
    cardName?: string;
    paidPrice?: number;
    winnerTeam?: string;
    isFinalSummary?: boolean;
  }>({
    isOpen: false,
    type: 'loser',
    phrase: '',
  });

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

    const myCurrentName = r.me?.name ?? team;

    // Announce auction results and trigger the outcome modal whenever a card settles.
    const prev = prevStatus.current;
    for (const c of r.cards) {
      const before = prev[c.id];
      if (before && before !== c.status) {
        if (c.status === 'sold') {
          showBanner(`${c.winner ?? 'A team'} won ${c.name} for ${c.price ?? c.defaultBase} CR`);
          const isWinner = !!c.winner && c.winner.trim().toLowerCase() === myCurrentName.trim().toLowerCase();
          setModalState({
            isOpen: true,
            type: isWinner ? 'winner' : 'loser',
            phrase: getRandomPhrase(isWinner ? 'winner' : 'loser'),
            cardName: c.name,
            paidPrice: c.price ?? c.defaultBase,
            winnerTeam: c.winner ?? undefined,
          });
        } else if (c.status === 'unsold') {
          showBanner(`💀 ${c.name} went unsold`);
          setModalState({
            isOpen: true,
            type: 'loser',
            phrase: getRandomPhrase('loser'),
            cardName: c.name,
          });
        }
      }
      prev[c.id] = c.status;
    }
  }, [showBanner, team]);

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
  const min = live ? live.base : 0;
  const credits = view?.me?.credits ?? 0;
  const hasPlacedBid = Boolean(live?.hasBid || (myPlacedBid && live && myPlacedBid.cardId === live.cardId));
  const myBidAmount = live?.myBid ?? (myPlacedBid && live && myPlacedBid.cardId === live.cardId ? myPlacedBid.amount : null);

  const secs = endsAt !== null && nowMs ? Math.max(0, Math.ceil((endsAt - nowMs) / 1000)) : null;
  const closing = secs === 0;
  const tooPoor = !!live && credits < min;
  const amountNum = Number.parseInt(amount, 10);
  const canBid = !!live && !hasPlacedBid && !busy && !closing && !tooPoor && Number.isFinite(amountNum) && amountNum >= min && amountNum <= credits;

  let timerClass = 'text-cartel-amber';
  if (secs !== null && secs <= 5) timerClass = 'text-red-500 animate-pulse';
  else if (secs !== null && secs <= 15) timerClass = 'text-yellow-400 animate-pulse';

  // Prefill the bid box whenever the live card changes
  const promptKey = live ? `${live.cardId}:${live.base}` : '';
  if (promptKey !== seenKey) {
    setSeenKey(promptKey);
    setError('');
    if (promptKey) setAmount(String(live?.base ?? ''));
  }

  const placeBid = async () => {
    if (!canBid || !live) return;
    if (!pendingBid.current || pendingBid.current.amount !== amountNum) {
      pendingBid.current = { amount: amountNum, requestId: globalThis.crypto?.randomUUID?.() ?? `r2-${Date.now()}-${Math.random().toString(36).slice(2)}` };
    }
    const requestId = pendingBid.current.requestId;
    setBusy(true);
    setError('');
    try {
      const r = await round2Service.bid(amountNum, requestId);
      if (r.success) {
        setMyPlacedBid({ cardId: live.cardId, amount: amountNum });
        pendingBid.current = null;
        apply(r);
        showBanner(r.bid?.duplicate ? 'Your sealed bid was already recorded.' : 'Sealed bid locked in successfully.');
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
          <div className="flex items-center gap-2">
            <button onClick={onReturnHome} className="r2-btn rounded-xl px-4 py-2 font-cinzel text-xs tracking-widest text-amber-200/90 cursor-pointer">
              ← RETURN
            </button>
          </div>
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
                      <div className="min-w-0 flex-1">
                        <h2 className="font-gothic text-3xl sm:text-4xl text-amber-200 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          {liveCard.name}
                        </h2>

                        {/* High-Visibility Card Ability & Description Container */}
                        <div className="mt-3 p-3.5 sm:p-4 rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-950/70 via-black/85 to-[#160c05] shadow-[0_0_25px_rgba(245,158,11,0.22)]">
                          <div className="flex items-center gap-1.5 font-cinzel text-[11px] sm:text-xs font-black text-amber-300 tracking-widest uppercase mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                            <span aria-hidden="true" className="text-base">📜</span>
                            <span>POWER CARD ABILITY & STRATEGIC EFFECT</span>
                          </div>
                          <p className="font-sans text-sm sm:text-base leading-relaxed text-amber-50 font-semibold tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] select-text">
                            {liveCard.description}
                          </p>
                        </div>
                      </div>
                      {secs !== null && (
                        <div className="text-right shrink-0" aria-label="Seconds left">
                          <div className={`font-cinzel text-5xl sm:text-6xl font-bold tabular-nums ${timerClass}`}>{secs}</div>
                          {closing && <div className="font-cinzel text-[10px] tracking-widest text-cartel-silver/70">CLOSING…</div>}
                        </div>
                      )}
                    </div>

                    {/* Starting Base Price Card (No High Bid Shown - Blind Sealed Auction) */}
                    <div className="mt-4 rounded-xl border border-orange-800/40 bg-black/55 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-cinzel text-[10px] tracking-widest text-cartel-silver/70 uppercase">STARTING BASE PRICE</div>
                        <div className="font-cinzel text-3xl sm:text-4xl text-amber-100/95 font-bold">
                          {live.base} <span className="text-lg text-amber-300 font-normal">CR</span>
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/50 bg-amber-500/10 font-cinzel text-xs tracking-wider text-amber-300 font-bold">
                          <span>🔒</span> BLIND SEALED BIDDING
                        </span>
                        <p className="text-[11px] text-cartel-silver/70 mt-1 font-mono">1 sealed bid per squad · highest bid revealed at zero</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Single Sealed Bid State: Locked in after submitting */}
                {hasPlacedBid ? (
                  <div className="mt-5 p-5 rounded-xl border-2 border-amber-500/60 bg-gradient-to-b from-[#1c1206]/90 to-[#0e0701]/95 text-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                    <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-cinzel text-xs font-bold tracking-widest uppercase">
                      <span>🔒</span> SEALED BID SUBMITTED
                    </div>
                    <div className="mt-3 font-cinzel text-4xl sm:text-5xl font-black text-amber-100 tracking-tight">
                      {myBidAmount !== null ? `${myBidAmount} CR` : 'BID RECORDED'}
                    </div>
                    <p className="mt-2 font-mono text-xs sm:text-sm text-stone-300 max-w-md mx-auto">
                      Your sealed bid is locked in the Cartel ledger. Each squad can only bid once.
                      The winner will be revealed when the timer expires!
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={min}
                        max={credits}
                        step={1}
                        aria-label="Your sealed bid in credits"
                        placeholder={`Enter bid (min ${min} CR)`}
                        value={amount}
                        disabled={closing || busy}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') void placeBid(); }}
                        className="flex-1 min-w-[140px] bg-black/60 border border-orange-700/50 rounded-lg px-3 py-3 text-xl font-cinzel text-amber-100 disabled:opacity-40"
                      />
                      {[live.base, live.base + 20, live.base + 50, live.base + 100].filter((val) => val <= credits).map((n) => (
                        <button
                          key={n}
                          type="button"
                          disabled={closing || busy}
                          onClick={() => setAmount(String(n))}
                          className="r2-btn px-3 py-2 rounded-lg font-cinzel text-xs sm:text-sm text-amber-200/90 disabled:opacity-40 cursor-pointer"
                        >
                          {n} CR
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs text-cartel-silver/70 font-cinzel tracking-wider">
                      <span>MINIMUM BID: {min} CR</span>
                      <span>WALLET: {credits} CR</span>
                    </div>

                    <div className="mt-2 text-[11px] font-mono text-amber-300/80 bg-amber-950/30 border border-amber-500/20 rounded p-2 text-center">
                      ⚠️ <strong>WARNING:</strong> Each squad can bid <strong>ONLY ONCE</strong> for this card. Once submitted, your sealed bid cannot be modified.
                    </div>

                    {tooPoor && <p className="mt-1 text-sm text-red-400">You do not have enough credits to bid on this card.</p>}
                    {error && <p className="mt-1 text-sm text-red-400">{error}</p>}

                    <button
                      onClick={() => void placeBid()}
                      disabled={!canBid}
                      className="mt-3 w-full py-4 rounded-lg bg-gradient-to-r from-orange-800 via-orange-600 to-orange-800 text-black font-cinzel font-bold tracking-widest text-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg"
                    >
                      {busy ? 'SEALING BID…' : 'SUBMIT SEALED BID'}
                    </button>
                  </div>
                )}
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

      {/* Outcome Pop-up with Sarcastic / Savage Phrases for Winners and Losers */}
      <AuctionOutcomeModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        phrase={modalState.phrase}
        cardName={modalState.cardName}
        paidPrice={modalState.paidPrice}
        winnerTeam={modalState.winnerTeam}
        isFinalSummary={modalState.isFinalSummary}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
