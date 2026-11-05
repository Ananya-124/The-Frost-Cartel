import React, { useEffect, useState } from 'react';
import { round2Service, type R2Overview, type R2Result } from '../../../services/round2Service';

export const AdminAuctionTab: React.FC = () => {
  const [key, setKey] = useState(() => round2Service.getAdminKey());
  const [data, setData] = useState<R2Overview | null>(null);
  const [msg, setMsg] = useState('');
  const [bases, setBases] = useState<Record<number, string>>({});
  const [duration, setDuration] = useState('60');
  const [bump, setBump] = useState(0);

  useEffect(() => {
    if (!key) return;
    let alive = true;
    const load = async () => {
      const r = await round2Service.admin.overview(key);
      if (!alive) return;
      if (r.success) { setData(r); setMsg(''); } else setMsg(r.message ?? 'Failed to load auction.');
    };
    void load();
    const i = setInterval(() => void load(), 1000);
    return () => { alive = false; clearInterval(i); };
  }, [key, bump]);

  const act = async (p: Promise<R2Result>) => {
    const r = await p;
    setMsg(r.success ? '' : (r.message ?? 'Action failed.'));
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
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input type="password" placeholder="Auction key" value={key} onChange={(e) => { setKey(e.target.value); round2Service.setAdminKey(e.target.value); }} className={inputCls} />
          <label className="text-xs text-cartel-silver/70 font-cinzel">Bidding time (sec, 0 = manual end)
            <input type="number" min={0} value={duration} onChange={(e) => setDuration(e.target.value)} className={`${inputCls} ml-2 w-20`} />
          </label>
          <button className={`${btnCls} border border-red-500/60 text-red-400`} onClick={() => { if (window.confirm('Reset the whole auction? All cards, bids and teams are cleared.')) void act(round2Service.admin.reset(key)); }}>RESET AUCTION</button>
        </div>
        {msg && <p className="mt-2 text-sm text-red-400">{msg}</p>}
      </section>

      <section className="stone-panel rounded-xl p-5">
        <h3 className="font-cinzel tracking-widest text-cartel-silver/70 text-xs mb-2">LIVE CARD</h3>
        {live && liveCard ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-cinzel text-xl text-cartel-amber">{liveCard.icon} {liveCard.name} <span className="text-xs text-cartel-silver/60">base {live.base}</span></div>
              <div className="text-sm">High bid: <b>{live.highBidder ? `${live.highBid} by ${live.highBidder}` : 'none yet'}</b>{live.endsAt ? ` · ${Math.max(0, Math.ceil((live.endsAt - (data?.now ?? 0)) / 1000))}s left` : ' · manual end'}</div>
            </div>
            <button className={`${btnCls} bg-red-600 text-white`} onClick={() => void act(round2Service.admin.end(key))}>END BIDDING</button>
          </div>
        ) : <p className="text-cartel-silver/60 text-sm">No card is live. Start one below.</p>}
      </section>

      <section className="stone-panel rounded-xl p-5">
        <h3 className="font-cinzel tracking-widest text-cartel-silver/70 text-xs mb-2">CARDS</h3>
        <ul className="space-y-2">
          {data?.cards.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-2">
              <span className="w-48 font-cinzel">{c.icon} {c.name}</span>
              <span className="w-40 text-xs uppercase text-cartel-silver/70">{c.status}{c.winner ? ` → ${c.winner} @ ${c.price}` : ''}</span>
              {(c.status === 'pending' || c.status === 'unsold') && (
                <>
                  <label className="text-xs text-cartel-silver/70">Base price
                    <input type="number" min={1} value={bases[c.id] ?? String(c.defaultBase)} onChange={(e) => setBases({ ...bases, [c.id]: e.target.value })} className={`${inputCls} ml-2 w-24`} />
                  </label>
                  <button disabled={!!live} className={`${btnCls} bg-cartel-pumpkin text-black`} onClick={() => void act(round2Service.admin.start(key, c.id, Number(bases[c.id] ?? c.defaultBase), Number(duration)))}>START BIDDING</button>
                </>
              )}
            </li>
          ))}
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
                <td><button className="text-xs text-red-400 cursor-pointer" onClick={() => void act(round2Service.admin.removeTeam(key, t.name))}>remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-cartel-silver/50">Teams appear here when they open Round 2. Removing a team lets it rejoin with fresh Round 1 credits (only if it has won nothing).</p>
      </section>
    </div>
  );
};
