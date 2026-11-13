import React, { useEffect, useState } from 'react';
import { round2Service, subscribeToAuctionChanges, type R2Overview, type R2Result } from '../../../services/round2Service';
import { progressionService } from '../../../services/progressionService';
import { CardArt } from '../../game/round2/AuctionCard';

export const AdminAuctionTab: React.FC = () => {
  const [data, setData] = useState<R2Overview | null>(null);
  const [msg, setMsg] = useState('');
  const [bases, setBases] = useState<Record<number, string>>({});
  const [duration, setDuration] = useState('60');
  const [bump, setBump] = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [advancingAll, setAdvancingAll] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const r = await round2Service.admin.overview();
      if (!alive) return;
      if (r.success) { setData(r); setMsg(''); setSessionExpired(false); }
      else { setMsg(r.message ?? 'Failed to load auction.'); setSessionExpired(r.status === 401 || r.status === 403); }
    };
    void load();
    const i = setInterval(() => void load(), 15000);
    const unsubscribe = subscribeToAuctionChanges(() => { void load(); });
    return () => { alive = false; clearInterval(i); unsubscribe(); };
  }, [bump]);

  const act = async (p: Promise<R2Result>) => {
    const r = await p;
    setMsg(r.success ? '' : (r.message ?? 'Action failed.'));
    setSessionExpired(r.status === 401 || r.status === 403);
    setBump((n) => n + 1);
  };

  const live = data?.live ?? null;
  const liveCard = live ? data?.cards.find((c) => c.id === live.cardId) : undefined;
  const inputCls = 'bg-black/60 border border-white/20 rounded px-2 py-1 text-white font-cinzel';
  const btnCls = 'px-4 py-1.5 rounded font-cinzel text-xs tracking-widest cursor-pointer disabled:opacity-40';

  return (
    <div className="space-y-5">
      <section className="stone-panel rounded-xl p-5">
        <h2 className="font-gothic text-2xl text-cartel-amber">The Haunted Auction</h2>
        <p className="mt-1 text-sm text-cartel-silver/70">Admin actions use your signed-in administrator session. Round 2 stays unavailable to teams until an administrator starts the first auction lot.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-xs text-cartel-silver/70 font-cinzel">Bidding time (sec, 0 = manual end)
            <input type="number" min={0} value={duration} onChange={(e) => setDuration(e.target.value)} className={`${inputCls} ml-2 w-20`} />
          </label>
          <button
            className={`${btnCls} bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-600 hover:to-indigo-500 text-white font-bold shadow-[0_0_12px_rgba(147,51,234,0.4)] disabled:opacity-50`}
            disabled={advancingAll}
            onClick={async () => {
              if (!window.confirm('⚡ Advance and unlock Round 2 for ALL teams simultaneously? This will finalize Round 1 and make Round 2 available to all squads.')) return;
              setAdvancingAll(true);
              try {
                const res = await progressionService.adminRound2Global('advance', 'Admin advanced all teams to Round 2 from Auction portal');
                setMsg(`⚡ Successfully updated all teams to Round 2! (${res.updatedCount} squads updated)`);
                setSessionExpired(false);
                setBump((n) => n + 1);
              } catch (err) {
                setMsg(err instanceof Error ? err.message : 'Failed to update teams to Round 2.');
              } finally {
                setAdvancingAll(false);
              }
            }}
          >
            {advancingAll ? 'UPDATING TEAMS…' : '⚡ UNLOCK ROUND 2 FOR ALL TEAMS'}
          </button>
          <button
            className={`${btnCls} bg-gradient-to-r from-cyan-700 via-teal-600 to-cyan-800 hover:from-cyan-600 hover:to-teal-500 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)] disabled:opacity-50`}
            disabled={advancingAll}
            onClick={async () => {
              if (!window.confirm('⚡ Advance ALL teams to Round 3: Paradox Hunt? This will finalize Rounds 1 & 2, sync won auction cards to inventory, and unlock Round 3 for all squads.')) return;
              setAdvancingAll(true);
              try {
                const res = await progressionService.adminRound3Global('advance', 'Admin advanced all teams to Round 3 from Auction portal');
                setMsg(`⚡ Successfully advanced all teams to Round 3! (${res.updatedCount} squads updated, ${res.cardsSynced} cards synced)`);
                setSessionExpired(false);
                setBump((n) => n + 1);
              } catch (err) {
                setSessionExpired(false);
                setMsg(err instanceof Error ? err.message : 'Failed to update teams to Round 3.');
              } finally {
                setAdvancingAll(false);
              }
            }}
          >
            {advancingAll ? 'UPDATING TEAMS…' : '⚡ ADVANCE ALL TEAMS TO ROUND 3'}
          </button>
          <button className={`${btnCls} border border-red-500/60 text-red-400`} onClick={() => { if (window.confirm('Auction history cannot be erased. Submit a reset request for an audited rejection?')) void act(round2Service.admin.reset()); }}>REQUEST RESET</button>
        </div>
        {msg && (
          <div role="status" className={`mt-3 p-3 rounded-lg border text-sm flex flex-wrap items-center justify-between gap-2 ${sessionExpired ? 'border-red-500/60 bg-red-950/40 text-red-300' : 'border-amber-500/40 bg-black/60 text-amber-200'}`}>
            <span>{sessionExpired ? 'Your administrator session has expired or is not authorized. Sign in again through the admin portal.' : msg}</span>
            {sessionExpired && (
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/admin/dashboard';
                  window.location.reload();
                }}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-cinzel text-xs font-bold uppercase tracking-wider"
              >
                Sign in again
              </button>
            )}
          </div>
        )}
      </section>

      <section className="stone-panel rounded-xl p-5">
        <h3 className="font-cinzel tracking-widest text-cartel-silver/70 text-xs mb-2">LIVE CARD</h3>
        {live && liveCard ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <CardArt card={liveCard} className="h-28 w-auto rounded border border-amber-400/60" />
              <div>
                <div className="font-cinzel text-xl text-cartel-amber">{liveCard.name} <span className="text-xs text-cartel-silver/60">base {live.base}</span></div>
                <div className="text-sm">High bid: <b>{live.highBidder ? `${live.highBid} by ${live.highBidder}` : 'none yet'}</b>{live.endsAt ? ` · ${Math.max(0, Math.ceil((live.endsAt - (data?.now ?? 0)) / 1000))}s left` : ' · manual end'}</div>
              </div>
            </div>
            <button className={`${btnCls} bg-red-600 text-white`} onClick={() => void act(round2Service.admin.end())}>END BIDDING</button>
          </div>
        ) : <p className="text-cartel-silver/60 text-sm">{data ? 'No card is live. Start one below.' : 'Loading server auction state…'}</p>}
      </section>

      <section className="stone-panel rounded-xl p-5">
        <h3 className="font-cinzel tracking-widest text-cartel-silver/70 text-xs mb-2">CARDS</h3>
        <ul className="space-y-2">
          {data?.cards.map((c) => {
            const isLive = live && live.cardId === c.id;
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-2">
                <CardArt card={c} className="h-20 w-16 rounded border border-amber-400/50 object-cover" />
                <div className="w-64">
                  <span className="font-cinzel text-sm font-bold text-amber-100 block">{c.name}</span>
                  {c.description && <span className="text-[11px] text-amber-200/80 block leading-tight mt-0.5">{c.description}</span>}
                </div>
                <span className="w-44 text-xs font-mono">
                  {isLive ? (
                    <span className="text-amber-300 font-bold tracking-wider">● LIVE ON BLOCK</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">
                      AVAILABLE FOR SALE
                      {c.winner ? <span className="block text-[10px] text-stone-400">(Sold: {c.winner} @ {c.price} CR)</span> : null}
                    </span>
                  )}
                </span>
                {!isLive && (
                  <>
                    <label className="text-xs text-cartel-silver/70">Base price
                      <input type="number" min={1} value={bases[c.id] ?? String(c.defaultBase)} onChange={(e) => setBases({ ...bases, [c.id]: e.target.value })} className={`${inputCls} ml-2 w-24`} />
                    </label>
                    <button
                      disabled={!!live}
                      className={`${btnCls} bg-cartel-pumpkin text-black font-bold hover:brightness-110 disabled:opacity-40`}
                      onClick={() => void act(round2Service.admin.start(c.id, Number(bases[c.id] ?? c.defaultBase), Number(duration)))}
                    >
                      {c.status === 'sold' ? 'RE-AUCTION CARD' : 'START BIDDING'}
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="stone-panel rounded-xl p-5">
        <h3 className="font-cinzel tracking-widest text-cartel-silver/70 text-xs mb-2">TEAMS IN THE AUCTION ({data?.teams.length ?? 0})</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-cartel-silver/60 font-cinzel text-xs"><th>Team</th><th>Start</th><th>Spent</th><th>Left</th><th>Cards</th><th /></tr></thead>
          <tbody>
            {data?.teams.map((t) => (
              <tr key={t.name} className="border-t border-white/5">
                <td className="py-1">{t.name}</td><td>{t.startCredits}</td><td>{t.spent}</td><td className="text-cartel-amber">{t.credits}</td>
                <td>{t.cards.map((c) => c.name).join(', ') || '—'}</td>
                <td><button className="text-xs text-red-400 cursor-pointer" onClick={() => void act(round2Service.admin.removeTeam(t.name))}>remove (audited)</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-cartel-silver/50">Wallet balances and card ownership come from PostgreSQL. Won cards are usable by teams in Round 3.</p>
      </section>

      <section className="stone-panel rounded-xl p-5">
        <h3 className="font-cinzel tracking-widest text-cartel-silver/70 text-xs mb-2">RECENT ADMIN AUDIT HISTORY</h3>
        <ol className="space-y-2 text-sm">
          {data?.audit?.map((entry) => <li key={entry.id} className="border-t border-white/5 pt-2">
            <time dateTime={entry.created_at} className="text-cartel-silver/60">{new Date(entry.created_at).toLocaleString()}</time>
            {' · '}<b>{entry.admin_username}</b>{' · '}{entry.action} ({entry.outcome.toLowerCase()})
            {entry.lot_id ? ` · lot ${entry.lot_id}` : ''}
            {entry.details && Object.keys(entry.details).length ? <pre className="mt-1 whitespace-pre-wrap text-xs text-cartel-silver/50">{JSON.stringify(entry.details)}</pre> : null}
          </li>)}
          {data?.audit?.length === 0 && <li className="text-cartel-silver/50">No auction admin actions recorded.</li>}
        </ol>
      </section>
    </div>
  );
};
