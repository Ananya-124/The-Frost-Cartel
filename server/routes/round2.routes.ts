import { Router, type Request, type Response, type NextFunction } from 'express';
import { db } from '../../database/db.ts';

export const round2Router = Router();

// ---------- EDIT HERE: auction rules and the 6 cards ----------
const CONFIG = { minIncrement: 10, snipeSeconds: 10, maxCredits: 500 };
const CARDS = [
  { id: 1, name: 'Vampire Shield', description: 'Blocks one penalty in Round 3.', icon: '🧛', defaultBase: 100 },
  { id: 2, name: 'Witch Hex', description: 'Curse a rival squad in Round 3.', icon: '🧙', defaultBase: 100 },
  { id: 3, name: 'Ghost Pass', description: 'Skip one obstacle in Round 3.', icon: '👻', defaultBase: 150 },
  { id: 4, name: 'Zombie Revive', description: 'Revive once after failing.', icon: '🧟', defaultBase: 150 },
  { id: 5, name: 'Pumpkin Bomb', description: 'Explosive advantage in Round 3.', icon: '🎃', defaultBase: 200 },
  { id: 6, name: 'Reaper Strike', description: 'A decisive final-round strike.', icon: '💀', defaultBase: 200 },
];
const ADMIN_KEY = process.env.ROUND2_ADMIN_KEY || 'frost-r2-admin';

interface WonCard { id: number; name: string; price: number }
interface TeamRec { name: string; startCredits: number; spent: number; cards: WonCard[] }
interface Live { cardId: number; base: number; highBid: number; highBidder: string | null; endsAt: number | null; bids: { team: string; amount: number; t: number }[] }
interface CardRec { id: number; name: string; description: string; icon: string; defaultBase: number; status: 'pending' | 'live' | 'sold' | 'unsold'; winner: string | null; price: number | null }
interface State { cards: CardRec[]; live: Live | null; teams: Record<string, TeamRec> }

// Auction state is kept in memory and mirrored to one SQLite row so a server restart does not lose it.
db.exec('CREATE TABLE IF NOT EXISTS round2_state (id INTEGER PRIMARY KEY CHECK (id = 1), json TEXT NOT NULL)');
const fresh = (): State => ({ cards: CARDS.map((c) => ({ ...c, status: 'pending', winner: null, price: null })), live: null, teams: {} });
const saved = db.prepare('SELECT json FROM round2_state WHERE id = 1').get() as { json: string } | undefined;
let S: State = saved ? (JSON.parse(saved.json) as State) : fresh();
const save = () => db.prepare('INSERT INTO round2_state (id, json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json').run(JSON.stringify(S));
const key = (name: string) => name.trim().toLowerCase();
const fail = (res: Response, code: number, message: string) => res.status(code).json({ success: false, message });
const meOf = (t: TeamRec) => ({ name: t.name, startCredits: t.startCredits, spent: t.spent, credits: t.startCredits - t.spent, cards: t.cards });

function view(team?: string) {
  const t = team ? S.teams[key(team)] : undefined;
  return { success: true, now: Date.now(), cards: S.cards, live: S.live, minIncrement: CONFIG.minIncrement, me: t ? meOf(t) : null };
}

function settle() {
  const l = S.live;
  if (!l) return;
  const card = S.cards.find((c) => c.id === l.cardId);
  if (card && l.highBidder) {
    const t = S.teams[key(l.highBidder)];
    t.spent += l.highBid;
    t.cards.push({ id: card.id, name: card.name, price: l.highBid });
    Object.assign(card, { status: 'sold', winner: t.name, price: l.highBid });
  } else if (card) card.status = 'unsold';
  S.live = null;
  save();
}
setInterval(() => { if (S.live?.endsAt && Date.now() >= S.live.endsAt) settle(); }, 250);

// ---------- Player endpoints ----------
round2Router.get('/state', (req, res) => { res.json(view(req.query.team as string | undefined)); });

// First credit report per team is locked (credits come from Round 1's localStorage).
round2Router.post('/join', (req, res) => {
  const name = String(req.body?.teamName ?? '').trim();
  if (!name) return fail(res, 400, 'Team name is required.');
  const credits = Math.max(0, Math.min(CONFIG.maxCredits, Math.floor(Number(req.body?.credits) || 0)));
  if (!S.teams[key(name)]) { S.teams[key(name)] = { name, startCredits: credits, spent: 0, cards: [] }; save(); }
  res.json(view(name));
});

round2Router.post('/bid', (req, res) => {
  const l = S.live;
  const t = S.teams[key(String(req.body?.teamName ?? ''))];
  if (!t) return fail(res, 403, 'Join the auction first.');
  if (!l) return fail(res, 409, 'No card is being auctioned.');
  if (l.endsAt && Date.now() >= l.endsAt) return fail(res, 409, 'Bidding has closed.');
  if (l.highBidder === t.name) return fail(res, 409, 'You already lead this card.');
  const amount = Math.floor(Number(req.body?.amount));
  const min = l.highBidder ? l.highBid + CONFIG.minIncrement : l.base;
  if (!(amount >= min)) return fail(res, 400, `Minimum bid is ${min}.`);
  if (amount > t.startCredits - t.spent) return fail(res, 400, 'Not enough credits.');
  l.highBid = amount; l.highBidder = t.name; l.bids.unshift({ team: t.name, amount, t: Date.now() });
  if (l.endsAt && l.endsAt - Date.now() < CONFIG.snipeSeconds * 1000) l.endsAt = Date.now() + CONFIG.snipeSeconds * 1000;
  save();
  res.json(view(t.name));
});

// ---------- Admin endpoints (header x-round2-key) ----------
const admin = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['x-round2-key'] === ADMIN_KEY) next(); else fail(res, 401, 'Invalid auction key.');
};

round2Router.get('/admin/overview', admin, (_req, res) => {
  res.json({ ...view(), teams: Object.values(S.teams).map(meOf) });
});

round2Router.post('/admin/start', admin, (req, res) => {
  if (S.live) return fail(res, 409, 'A card is already live. End it first.');
  const card = S.cards.find((c) => c.id === Number(req.body?.cardId));
  if (!card || (card.status !== 'pending' && card.status !== 'unsold')) return fail(res, 400, 'That card is not available.');
  const base = Math.floor(Number(req.body?.basePrice));
  const dur = Math.max(0, Math.floor(Number(req.body?.durationSeconds) || 0));
  card.status = 'live';
  S.live = { cardId: card.id, base: base > 0 ? base : card.defaultBase, highBid: 0, highBidder: null, endsAt: dur ? Date.now() + dur * 1000 : null, bids: [] };
  save();
  res.json({ success: true });
});

round2Router.post('/admin/end', admin, (_req, res) => { settle(); res.json({ success: true }); });
round2Router.post('/admin/reset', admin, (_req, res) => { S = fresh(); save(); res.json({ success: true }); });
round2Router.delete('/admin/team/:name', admin, (req, res) => {
  const t = S.teams[key(String(req.params.name))];
  if (t?.cards.length) return fail(res, 409, 'This team already won cards.');
  delete S.teams[key(String(req.params.name))];
  save();
  res.json({ success: true });
});
