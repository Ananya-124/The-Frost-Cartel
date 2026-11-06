import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TeamSession } from '../../../types/team.types';
import { round2Service, type R2View } from '../../../services/round2Service';
import { HauntedGraveyardAtmosphere } from '../haunted/HauntedGraveyardAtmosphere';
import { AuctionCard, AuctionCardDefs } from './AuctionCard';

interface Round2AuctionProps {
  session: TeamSession;
  onReturnHome: () => void;
}

export const Round2Auction: React.FC<Round2AuctionProps> = ({ session, onReturnHome }) => {
  const team = session.teamName;
  const [startCredits] = useState(() => round2Service.getRound1Credits(session.teamId, session.credits));
  const [view, setView] = useState<R2View | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');
  const offset = useRef(0);
  const prevLive = useRef<number | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const [seenKey, setSeenKey] = useState('');

  const apply = useCallback((r: R2View) => {
    offset.current = r.now - Date.now();
    setNowMs(r.now);
    setView(r);
    round2Service.saveInventory(r.me);
    const before = prevLive.current;
    const now = r.live?.cardId ?? null;
    if (before !== null && now === null) {
      const c = r.cards.find((x) => x.id === before);
      if (c) {
        setBanner(c.status === 'sold' ? `${c.icon} ${c.name} sold to ${c.winner} for ${c.price} CR` : `💀 ${c.name} went unsold`);
        setTimeout(() => setBanner(''), 6000);
      }
    }
    prevLive.current = now;
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const r = await round2Service.getState(team);
      if (alive && r.success) apply(r);
    };
    round2Service.join(team, startCredits).then((r) => {
      if (!alive) return;
      if (r.success) apply(r);
      else setError(r.message ?? 'Could not join the auction.');
    });
    const poll = setInterval(load, 800);
    const tick = setInterval(() => setNowMs(Date.now() + offset.current), 250);
    return () => { alive = false; clearInterval(poll); clearInterval(tick); };
  }, [team, startCredits, apply]);

  const live = view?.live ?? null;
  const card = live ? view?.cards.find((c) => c.id === live.cardId) : undefined;
  const inc = view?.minIncrement ?? 10;
  const min = live ? (live.highBidder ? live.highBid + inc : live.base) : 0;
  const ref = live ? (live.highBidder ? live.highBid : live.base) : 0;
  const liveId = live?.cardId ?? null;
  const credits = view?.me?.credits ?? startCredits;
  const leading = !!live && live.highBidder === team;
  const secs = live?.endsAt && nowMs ? Math.max(0, Math.ceil((live.endsAt - nowMs) / 1000)) : null;
  let timerClass = 'text-cartel-amber';
  if (secs !== null && secs <= 5) timerClass = 'text-red-500 animate-pulse';
  else if (secs !== null && secs <= 15) timerClass = 'text-yellow-400 animate-pulse';

  // Prefill the bid box whenever the card or the minimum bid changes (state adjusted during render).
  const promptKey = liveId === null ? '' : `${liveId}:${min}`;
  if (promptKey !== seenKey) {
    setSeenKey(promptKey);
    if (promptKey) setAmount(String(min));
  }

  const placeBid = async () => {
    if (busy || !live) return;
    setBusy(true);
    setError('');
    const r = await round2Service.bid(team, Number.parseInt(amount, 10));
    if (r.success) apply(r);
    else setError(r.message ?? 'Bid failed.');
    setBusy(false);
  };

  return (
    <div className="relative min-h-screen bg-cartel-void text-cartel-bone font-sans">
      <HauntedGraveyardAtmosphere />
      <AuctionCardDefs />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-5">
        <header className="flex items-center justify-between gap-3 mb-5">
          <button onClick={onReturnHome} className="font-cinzel text-xs tracking-widest text-cartel-silver/70 hover:text-white cursor-pointer">← RETURN</button>
          <h1 className="font-gothic text-2xl sm:text-4xl amber-flame-text text-center">THE HAUNTED AUCTION</h1>
          <div className="stone-panel rounded-lg px-4 py-2 text-right">
            <div className="font-cinzel text-[10px] tracking-widest text-cartel-silver/60">{team}</div>
            <div className="font-cinzel text-2xl text-cartel-amber">{credits} <span className="text-xs">CR</span></div>
          </div>
        </header>

        {banner && <div className="mb-4 text-center font-cinzel text-cartel-amber border border-cartel-amber/50 bg-cartel-midnight/90 rounded-lg py-2">{banner}</div>}

        <div className="grid lg:grid-cols-3 gap-5">
          <section className="stone-panel rounded-xl p-5 lg:col-span-2">
            {live && card ? (
              <>
                <div className="flex items-start gap-5">
                  <div className="w-36 shrink-0 sm:w-44">
                    <AuctionCard card={card} lot={card.id} base={live.base} live />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-gothic text-3xl text-cartel-amber">{card.name}</h2>
                        <p className="font-garamond text-cartel-silver/80">{card.description}</p>
                      </div>
                      {secs !== null && <div className={`font-cinzel text-6xl font-bold tabular-nums ${timerClass}`}>{secs}</div>}
                    </div>
                    <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-4">
                      <div className="font-cinzel text-[10px] tracking-widest text-cartel-silver/60">CURRENT HIGH BID</div>
                      <div className="font-cinzel text-4xl text-white">{live.highBidder ? live.highBid : '—'}</div>
                      <div className="text-sm text-cartel-silver/70">{live.highBidder ? `by ${live.highBidder}` : 'no bids yet'}</div>
                    </div>
                  </div>
                </div>
                {leading && <div className="mt-3 text-center rounded-lg border border-emerald-500/60 bg-emerald-950/60 text-emerald-400 font-cinzel tracking-widest py-2">YOU ARE LEADING</div>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={amount}
                    disabled={leading}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void placeBid(); }}
                    className="flex-1 min-w-[140px] bg-black/60 border border-cartel-amber/40 rounded-lg px-3 py-3 text-xl font-cinzel text-white disabled:opacity-40"
                  />
                  {[10, 20, 50].map((n) => (
                    <button key={n} disabled={leading} onClick={() => setAmount(String(ref + n))} className="px-4 rounded-lg border border-cartel-cyan/40 text-cartel-cyan font-cinzel hover:bg-cartel-cyan/10 disabled:opacity-40 cursor-pointer">+{n}</button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-cartel-silver/60 font-cinzel tracking-wider">MINIMUM BID: {min} CR</p>
                {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
                <button onClick={() => void placeBid()} disabled={busy || leading} className="mt-3 w-full py-4 rounded-lg bg-cartel-pumpkin text-black font-cinzel font-bold tracking-widest text-lg hover:shadow-pumpkinGlow disabled:opacity-40 cursor-pointer">PLACE BID</button>
                <h3 className="mt-5 font-cinzel text-xs tracking-widest text-cartel-silver/60">RECENT BIDS</h3>
                <ul className="mt-1 text-sm">
                  {live.bids.slice(0, 5).map((b) => (
                    <li key={b.t + b.team} className="flex justify-between border-b border-white/5 py-1"><span>{b.team}</span><b className="text-cartel-amber">{b.amount}</b></li>
                  ))}
                  {live.bids.length === 0 && <li className="text-cartel-silver/50 py-1">No bids yet</li>}
                </ul>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl animate-ghost-float">👻</div>
                <p className="mt-4 font-cinzel tracking-widest text-cartel-silver/80">WAITING FOR THE NEXT CARD...</p>
                {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
              </div>
            )}
          </section>

          <aside className="stone-panel rounded-xl p-5">
            <h3 className="font-cinzel tracking-widest text-cartel-amber mb-2">YOUR CARDS</h3>
            <ul className="text-sm">
              {view?.me?.cards.map((c) => (
                <li key={c.id} className="flex justify-between border-b border-white/5 py-1"><span>{c.name}</span><b className="text-cartel-amber">{c.price} CR</b></li>
              ))}
              {!view?.me?.cards.length && <li className="text-cartel-silver/50">None yet</li>}
            </ul>
          </aside>
        </div>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {view?.cards.map((c, i) => (
            <AuctionCard key={c.id} card={c} lot={i + 1} />
          ))}
        </section>
      </div>
    </div>
  );
};
