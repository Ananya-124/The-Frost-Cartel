import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TeamSession } from '../../../types/team.types';
import { round2Service, type R2Card, type R2View } from '../../../services/round2Service';
import { CARD_COLOR, STAGE_GHOST } from '../../../constants/auction.constants';
import { HauntedGraveyardAtmosphere } from '../haunted/HauntedGraveyardAtmosphere';
import { AuctionCard, CardArt } from './AuctionCard';
import '../../../styles/round2.css';

interface Round2AuctionProps {
  session: TeamSession;
  onReturnHome: () => void;
}

const POLL_MS = 800; // how often the player asks the server for the live card
const POLL_HIDDEN_MS = 3000; // slower when the browser tab is in the background

const CobWeb: React.FC<{ flip?: boolean }> = ({ flip }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 120 120"
    className={`absolute top-1 w-24 h-24 sm:w-32 sm:h-32 opacity-50 pointer-events-none ${
      flip ? 'right-1 -scale-x-100' : 'left-1'
    }`}
    fill="none"
    stroke="rgba(190,175,220,0.4)"
    strokeWidth="1"
  >
    <path d="M0 0 L120 0 M0 0 L0 120 M0 0 L105 70 M0 0 L70 105 M0 0 L118 35 M0 0 L35 118" />
    <path d="M30 0 Q28 28 0 30 M60 0 Q55 55 0 60 M90 0 Q82 82 0 90" />
  </svg>
);

const Divider: React.FC = () => (
  <div className="flex items-center justify-center gap-3 w-full max-w-md mx-auto opacity-80">
    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-cartel-pumpkin" />
    <span aria-hidden="true" className="r2-pumpkin text-2xl">🎃</span>
    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-cartel-pumpkin" />
  </div>
);

const StageGhost: React.FC = () => {
  const [broken, setBroken] = useState(false);
  return broken ? (
    <span aria-hidden="true" className="r2-ghost text-7xl inline-block">👻</span>
  ) : (
    <img src={STAGE_GHOST} alt="" onError={() => setBroken(true)} className="r2-ghost w-28 sm:w-36 h-auto" />
  );
};

export const Round2Auction: React.FC<Round2AuctionProps> = ({ session, onReturnHome }) => {
  const team = session.teamName;
  const [startCredits] = useState(() => round2Service.getRound1Credits(session.teamId, session.credits));
  const [view, setView] = useState<R2View | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');
  const [nowMs, setNowMs] = useState(0);
  const [seenKey, setSeenKey] = useState('');

  const offset = useRef(0); // server clock minus this browser's clock
  const lastServerNow = useRef(0);
  const prevStatus = useRef<Record<number, R2Card['status']>>({});
  const lastInventory = useRef('');
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

    // Mirror the cards won + credits left for Round 3, only when they actually change.
    const inventory = JSON.stringify(r.me);
    if (inventory !== lastInventory.current) {
      lastInventory.current = inventory;
      round2Service.saveInventory(r.me);
    }

    // Announce a card that has just been sold or has gone unsold.
    const prev = prevStatus.current;
    for (const c of r.cards) {
      const before = prev[c.id];
      if (before && before !== c.status) {
        if (c.status === 'sold') showBanner(`${c.icon} ${c.name} sold to ${c.winner} for ${c.price} CR`);
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

    const loop = async (first: boolean) => {
      let r = first ? await round2Service.join(team, startCredits) : await round2Service.getState(team);
      if (!alive) return;
      if (r.success && !r.me) {
        r = await round2Service.join(team, startCredits);
        if (!alive) return;
      }
      if (r.success) apply(r);
      else setOffline(true);
      timer = setTimeout(() => void loop(false), document.hidden ? POLL_HIDDEN_MS : POLL_MS);
    };

    void loop(true);
    return () => {
      alive = false;
      clearTimeout(timer);
      clearTimeout(bannerTimer.current);
    };
  }, [team, startCredits, apply]);

  // The countdown only needs a fast clock while a timed card is live.
  const endsAt = view?.live?.endsAt ?? null;
  useEffect(() => {
    if (endsAt === null) return;
    const i = setInterval(() => setNowMs(Date.now() + offset.current), 250);
    return () => clearInterval(i);
  }, [endsAt]);

  const live = view?.live ?? null;
  const liveCard = live ? view?.cards.find((c) => c.id === live.cardId) : undefined;
  const inc = view?.minIncrement ?? 10;
  const min = live ? (live.highBidder ? live.highBid + inc : live.base) : 0;
  const ref = live ? (live.highBidder ? live.highBid : live.base) : 0;
  const credits = view?.me?.credits ?? startCredits;
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
    setBusy(true);
    setError('');
    try {
      const r = await round2Service.bid(myName, amountNum);
      if (r.success) apply(r);
      else setError(r.message ?? 'Bid failed.');
    } finally {
      setBusy(false);
    }
  };

  const won = view?.me?.cards ?? [];
  const allSold = !!view && view.cards.every((c) => c.status === 'sold');
  let footer = 'ROUND 2 • WAITING FOR THE NEXT CARD';
  if (live) footer = 'ROUND 2 • BIDDING OPEN';
  else if (allSold) footer = 'ROUND 2 • AUCTION COMPLETE';

  return (
    <div className="relative min-h-screen bg-cartel-void text-cartel-bone font-sans">
      <HauntedGraveyardAtmosphere />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-5">
        {/* Header */}
        <header className="grid grid-cols-[auto_1fr_auto] items-start gap-3 mb-5">
          <button onClick={onReturnHome} className="r2-btn rounded-xl px-4 py-2 font-cinzel text-xs tracking-widest text-amber-200/90 cursor-pointer">
            ← RETURN
          </button>
          <div className="r2-title-plate text-center px-4 py-2">
            <h1 className="r2-title font-gothic text-3xl sm:text-5xl tracking-wide">THE HAUNTED AUCTION</h1>
            <div className="mt-1"><Divider /></div>
          </div>
          <div className="r2-btn rounded-xl px-4 py-2 text-center min-w-[110px]">
            <div className="font-cinzel text-[10px] tracking-widest text-cartel-silver/80 truncate max-w-[140px]">{team}</div>
            <div className="font-cinzel text-xl sm:text-2xl text-amber-200/90 flex items-center justify-center gap-1.5">
              <span aria-hidden="true" className="r2-pumpkin text-xl">🎃</span>
              <span>{credits}</span>
              <span className="text-xs">CR</span>
            </div>
          </div>
        </header>

        {offline && (
          <div role="status" className="mb-3 text-center font-cinzel text-xs tracking-widest text-red-300 border border-red-500/40 bg-black/60 rounded-lg py-1.5">
            RECONNECTING TO THE AUCTION…
          </div>
        )}
        {banner && (
          <div role="status" aria-live="polite" className="mb-4 text-center font-cinzel text-amber-200 border border-orange-700/50 bg-black/70 rounded-lg py-2">
            {banner}
          </div>
        )}

        {/* Stage + your cards */}
        <div className="grid lg:grid-cols-[2.3fr_1fr] gap-5">
          <section className="r2-panel relative rounded-2xl p-5 min-h-[260px] overflow-hidden" aria-label="Card on the block">
            <CobWeb />
            <CobWeb flip />
            <span aria-hidden="true" className="r2-candle absolute bottom-3 left-4 text-3xl drop-shadow-[0_0_10px_rgba(255,140,0,0.55)]">🕯️</span>
            <span aria-hidden="true" className="r2-candle absolute bottom-3 right-4 text-3xl drop-shadow-[0_0_10px_rgba(255,140,0,0.55)]" style={{ animationDelay: '-1.2s' }}>🕯️</span>

            {live && liveCard ? (
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="r2-art w-36 sm:w-44 shrink-0 mx-auto sm:mx-0 aspect-[4/5] rounded-xl overflow-hidden flex items-center justify-center" style={{ '--c': CARD_COLOR } as React.CSSProperties}>
                    <CardArt card={liveCard} className="h-[88%] w-auto object-contain r2-art-img" />
                    <span aria-hidden="true" className="r2-shine" />
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
              <div className="relative z-10 flex flex-col items-center justify-center text-center py-6 min-h-[220px]">
                <div className="relative flex items-end justify-center h-40 w-72 max-w-full">
                  <div aria-hidden="true" className="r2-mist absolute left-1/2 bottom-0 w-72 h-16 rounded-[50%] blur-xl" />
                  {[
                    { l: '28%', wx: '-18px', wd: '0s' },
                    { l: '50%', wx: '10px', wd: '1.5s' },
                    { l: '70%', wx: '22px', wd: '3s' },
                  ].map((w) => (
                    <span key={w.l} aria-hidden="true" className="r2-wisp" style={{ left: w.l, '--wx': w.wx, '--wd': w.wd } as React.CSSProperties} />
                  ))}
                  <StageGhost />
                </div>
                <p className="r2-wait mt-3 font-cinzel uppercase tracking-wider text-lg sm:text-2xl text-[#a58acb]">
                  {view ? 'Waiting for the next card...' : 'Connecting to the auction...'}
                </p>
                <div className="mt-2 w-full"><Divider /></div>
              </div>
            )}
          </section>

          <aside className="r2-panel relative rounded-2xl p-4" aria-label="Your cards">
            <div className="flex items-center gap-2 border-b border-orange-700/40 pb-2">
              <span aria-hidden="true" className="r2-pumpkin text-3xl">🎃</span>
              <h2 className="font-cinzel text-xl tracking-wider text-amber-200/90">Your Cards</h2>
            </div>
            <div className="relative mt-3 rounded-lg bg-[#0b0614]/70 border border-orange-800/40 p-3 min-h-[150px]">
              {won.length === 0 ? (
                <>
                  <p className="font-garamond italic text-lg text-[#9a84c0]">None yet...</p>
                  <div aria-hidden="true" className="absolute right-3 bottom-3 flex -space-x-8 opacity-30">
                    {[-12, 0, 12].map((r) => (
                      <div key={r} className="w-16 h-24 rounded-md border border-violet-300/15 bg-gradient-to-b from-[#1b1230] to-[#0a0714]" style={{ transform: `rotate(${r}deg)` }} />
                    ))}
                  </div>
                </>
              ) : (
                <ul className="text-sm space-y-1.5">
                  {won.map((c) => {
                    const full = view?.cards.find((x) => x.id === c.id);
                    return (
                      <li key={c.id} className="flex items-center gap-3 border-b border-white/5 pb-1.5">
                        <span className="r2-art w-10 h-10 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                          {full ? <CardArt card={full} className="h-full w-full object-contain" /> : <span aria-hidden="true">🃏</span>}
                        </span>
                        <span className="flex-1 font-cinzel">{c.name}</span>
                        <b className="text-amber-200/90">{c.price} CR</b>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>

        {/* All auction cards */}
        <section className="mt-9 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6" aria-label="All auction cards">
          {view
            ? view.cards.map((c, i) => <AuctionCard key={c.id} card={c} index={i} live={live?.cardId === c.id} />)
            : Array.from({ length: 11 }, (_, i) => <div key={i} className="r2-panel rounded-2xl h-72 animate-pulse" />)}
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
