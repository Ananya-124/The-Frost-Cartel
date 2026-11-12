import { Router, type Request, type Response, type NextFunction } from 'express';
import { db } from '../../database/db.ts';

export const round2Router = Router();

// ---------- EDIT HERE: auction rules and the 11 cards ----------
const CONFIG = { minIncrement: 10, snipeSeconds: 10, maxCredits: 500 };
const CARDS = [
  { id: 1, name: 'Chrono Freeze', description: 'Freeze the active task countdown for 10 seconds. Your team can continue moving, interacting and solving puzzles while time stands still.', icon: '⏳', defaultBase: 100 },
  { id: 2, name: 'Witching Hour', description: 'Gain an additional 5 seconds during a timed synchronization challenge. Use this advantage when every second counts.', icon: '🌙', defaultBase: 100 },
  { id: 3, name: 'Spectral Sight', description: 'Reveal one hidden clue or receive an additional hint for your current task. See what others might miss.', icon: '👁️', defaultBase: 100 },
  { id: 4, name: "Witch's Lens", description: 'Highlight one important interactable object in your current room. Let the supernatural guide your investigation.', icon: '🔍', defaultBase: 100 },
  { id: 5, name: 'Hexbreaker', description: 'Eliminate one incorrect option or reveal one wrong connection in an active puzzle. Break through the curse of uncertainty.', icon: '🔓', defaultBase: 100 },
  { id: 6, name: "Mechanic's Curse", description: 'Automatically validate one correctly configured stage of a multi-stage mechanism. Skip the final confirmation and move forward.', icon: '⚙️', defaultBase: 100 },
  { id: 7, name: "Witch's Elixir", description: 'Forgive one incorrect input that would normally trigger a mistake penalty. Every team deserves a second chance.', icon: '🧪', defaultBase: 100 },
  { id: 8, name: "Raven's Messenger", description: 'Reveal the location of the next relevant interactable object in your timeline. Let the raven lead the way.', icon: '🐦‍⬛', defaultBase: 100 },
  { id: 9, name: 'Phantom Shield', description: 'Protect your team from one failed synchronization penalty or one failed timed-control attempt. The spirits grant you one layer of protection.', icon: '🛡️', defaultBase: 100 },
  { id: 10, name: 'Soul Surge', description: 'Instantly complete one correctly configured stage of a multi-stage mechanism without performing its final activation interaction. Unleash the power of the soul.', icon: '🔮', defaultBase: 100 },
  { id: 11, name: "The Warden's Decree — Master Card", description: 'Choose one competing team and order a 2-minute gameplay pause. Present this card to the event coordinators, who will enforce the pause manually. Even time itself must obey the Warden.', icon: '👑', defaultBase: 100 },
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
if (saved && (S.cards.length !== CARDS.length || S.cards.some((card, index) => card.id !== CARDS[index].id || card.name !== CARDS[index].name))) {
  S = { ...S, cards: fresh().cards, live: null };
  save();
}
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
  const t = l.highBidder ? S.teams[key(l.highBidder)] : undefined;
  if (card && t) {
    t.spent += l.highBid;
    t.cards.push({ id: card.id, name: card.name, price: l.highBid });
    Object.assign(card, { status: 'sold', winner: t.name, price: l.highBid });
  } else if (card) card.status = 'unsold';
  S.live = null;
  save();
}
setInterval(() => { if (S.live?.endsAt && Date.now() >= S.live.endsAt) settle(); }, 250).unref();

// ---------- Player endpoints ----------
round2Router.get('/state', (req, res) => { res.json(view(req.query.team as string | undefined)); });

// Sync the Round 1 balance on join until the team has spent credits in the auction.
round2Router.post('/join', (req, res) => {
  const name = String(req.body?.teamName ?? '').trim();
  if (!name) return fail(res, 400, 'Team name is required.');
  const credits = Math.max(0, Math.min(CONFIG.maxCredits, Math.floor(Number(req.body?.credits) || 0)));
  const teamKey = key(name);
  const team = S.teams[teamKey];
  if (!team) {
    S.teams[teamKey] = { name, startCredits: credits, spent: 0, cards: [] };
    save();
  } else if (
    team.spent === 0 &&
    team.cards.length === 0 &&
    key(S.live?.highBidder ?? '') !== teamKey &&
    team.startCredits !== credits
  ) {
    team.startCredits = credits;
    save();
  }
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
  if (t && S.live?.highBidder && key(S.live.highBidder) === key(t.name)) return fail(res, 409, 'This team leads the live card. End bidding first.');
  delete S.teams[key(String(req.params.name))];
  save();
  res.json({ success: true });
});
