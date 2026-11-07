import { Router } from 'express';
import { requireTeamAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { activateRound3Card, completeRound3Hunt, discoverRound3Evidence, ensureRound3Session, getRound3Run, getRound3State, loadRound3DevelopmentSample, pauseRound3Run, resumeRound3Run, round3GameplayAllowed, startRound3Run, updateRound3Progress } from '../services/round3.service.ts';
import { applyRound3Hunt1Action, ensureRound3Hunt1State, getRound3Hunt1State } from '../services/round3-hunt1.service.ts';
import { applyRound3Hunt2Action, ensureRound3Hunt2State, getRound3Hunt2State, round3Hunt2StateForActor } from '../services/round3-hunt2.service.ts';
import { applyRound3Hunt3Action, ensureRound3Hunt3State, getRound3Hunt3State, round3Hunt3StateForActor } from '../services/round3-hunt3.service.ts';

export const round3Router = Router();
const auth = requireTeamAuth;
const teamOf = (req: AuthenticatedRequest) => req.team ? { id: req.team.id, teamName: req.team.teamName } : null;

round3Router.get('/run', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  ensureRound3Session({ id: req.team.id, teamName: req.team.teamName });
  return res.json({ success: true, run: getRound3Run(req.team.id) });
});
round3Router.post('/run/start', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  ensureRound3Session({ id: req.team.id, teamName: req.team.teamName });
  return res.json({ success: true, run: startRound3Run(req.team.id) });
});
round3Router.post('/run/pause', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  return res.json({ success: true, run: pauseRound3Run(req.team.id) });
});
round3Router.post('/run/resume', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  return res.json({ success: true, run: resumeRound3Run(req.team.id) });
});

round3Router.post('/hunt1/session', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  ensureRound3Session({ id: req.team.id, teamName: req.team.teamName });
  return res.json({ success: true, state: ensureRound3Hunt1State(req.team.id) });
});

round3Router.get('/hunt1/state', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const state = getRound3Hunt1State(req.team.id);
  return state ? res.json({ success: true, state }) : res.status(404).json({ success: false, message: 'Hunt 1 session has not been initialized.' });
});

round3Router.post('/hunt1/action', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  if (!round3GameplayAllowed(req.team.id)) return res.status(409).json({ success: false, message: 'Round 3 gameplay is not active.' });
  if (req.body?.actor !== 'archivist' && req.body?.actor !== 'tracker') return res.status(400).json({ success: false, message: 'Select the investigator responsible for this Hunt I action.' });
  const result = applyRound3Hunt1Action(req.team.id, req.body);
  return result ? res.json(result) : res.status(400).json({ success: false, message: 'Invalid Hunt 1 action or session.' });
});

round3Router.post('/hunt2/session', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  if (!getRound3Hunt1State(req.team.id)?.completed) return res.status(423).json({ success: false, message: 'Complete Hunt I before entering Hunt II.' });
  ensureRound3Session({ id: req.team.id, teamName: req.team.teamName });
  const state = ensureRound3Hunt2State(req.team.id);
  const actor = req.playerNumber === 1 ? 'archivist' : 'tracker';
  return res.json({ success: true, state: round3Hunt2StateForActor(state, actor) });
});

round3Router.get('/hunt2/state', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  if (!getRound3Hunt1State(req.team.id)?.completed) return res.status(423).json({ success: false, message: 'Complete Hunt I before opening Hunt II.' });
  const state = getRound3Hunt2State(req.team.id);
  if (!state) return res.status(404).json({ success: false, message: 'Hunt 2 session has not been initialized.' });
  const actor = req.playerNumber === 1 ? 'archivist' : 'tracker';
  return res.json({ success: true, state: round3Hunt2StateForActor(state, actor) });
});

round3Router.post('/hunt2/action', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  if (!round3GameplayAllowed(req.team.id)) return res.status(409).json({ success: false, message: 'Round 3 gameplay is not active.' });
  if (!getRound3Hunt1State(req.team.id)?.completed) return res.status(423).json({ success: false, message: 'Complete Hunt I before taking Hunt II actions.' });
  const actor = req.body?.actor === 'tracker' ? 'tracker' : 'archivist';
  const result = applyRound3Hunt2Action(req.team.id, { ...req.body, actor });
  if (!result) return res.status(400).json({ success: false, message: 'Invalid Hunt 2 action or session.' });
  return res.json({ ...result, state: result.state });
});

round3Router.post('/hunt3/session', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  if (!getRound3Hunt2State(req.team.id)?.completed) return res.status(423).json({ success: false, message: 'Complete Hunt II before entering Hunt III.' });
  ensureRound3Session({ id: req.team.id, teamName: req.team.teamName });
  const state = ensureRound3Hunt3State(req.team.id);
  return res.json({ success: true, state });
});

round3Router.get('/hunt3/state', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  if (!getRound3Hunt2State(req.team.id)?.completed) return res.status(423).json({ success: false, message: 'Complete Hunt II before opening Hunt III.' });
  const state = getRound3Hunt3State(req.team.id);
  if (!state) return res.status(404).json({ success: false, message: 'Hunt III session has not been initialized.' });
  return res.json({ success: true, state });
});

round3Router.post('/hunt3/action', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  if (!round3GameplayAllowed(req.team.id)) return res.status(409).json({ success: false, message: 'Round 3 gameplay is not active.' });
  if (!getRound3Hunt2State(req.team.id)?.completed) return res.status(423).json({ success: false, message: 'Complete Hunt II before taking Hunt III actions.' });
  const actor = req.body?.actor === 'tracker' ? 'tracker' : 'archivist';
  const result = applyRound3Hunt3Action(req.team.id, actor, req.body ?? {});
  if (!result) return res.status(400).json({ success: false, message: 'Invalid Hunt III action, inactive run, or session.' });
  return res.json({ ...result, state: result.state });
});

round3Router.get('/state', auth, (req: AuthenticatedRequest, res) => {
  const team = teamOf(req);
  if (!team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const state = getRound3State(team);
  return state ? res.json(state) : res.status(404).json({ success: false, message: 'Round 3 session has not been initialized.' });
});

round3Router.post('/session', auth, (req: AuthenticatedRequest, res) => {
  const team = teamOf(req);
  if (!team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  return res.json(ensureRound3Session(team));
});

round3Router.patch('/progress', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  if (!updateRound3Progress(req.team.id, req.body)) return res.status(400).json({ success: false, message: 'Invalid progress or timeline state.' });
  return res.json(getRound3State({ id: req.team.id, teamName: req.team.teamName }));
});

round3Router.post('/evidence/:evidenceId/discover', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const evidence = discoverRound3Evidence(req.team.id, String(req.params.evidenceId));
  return evidence ? res.json({ success: true, evidenceDiscoveries: evidence }) : res.status(400).json({ success: false, message: 'Invalid evidence identifier.' });
});

round3Router.post('/cards/:cardId/activate', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const result = activateRound3Card(req.team.id, String(req.params.cardId), req.body?.source);
  if ('error' in result && typeof result.error === 'string') return res.status(result.error.startsWith('Unknown') ? 400 : 409).json({ success: false, message: result.error });
  return res.json({ success: true, usage: result, state: getRound3State({ id: req.team.id, teamName: req.team.teamName }) });
});

round3Router.post('/complete', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const completed = completeRound3Hunt(req.team.id);
  return completed ? res.json({ success: true, completed: true, completedAt: completed.completed_at }) : res.status(404).json({ success: false, message: 'Round 3 session has not been initialized.' });
});

round3Router.post('/development/sample-inventory', auth, (req: AuthenticatedRequest, res) => {
  if (!req.team) return res.status(401).json({ success: false, message: 'Squad authentication required.' });
  const enabled = process.env.NODE_ENV !== 'production' && process.env.ROUND3_ENABLE_DEV_INVENTORY === 'true';
  if (!loadRound3DevelopmentSample(req.team.id, enabled)) return res.status(404).json({ success: false, message: 'Development sample inventory is disabled.' });
  return res.json(getRound3State({ id: req.team.id, teamName: req.team.teamName }));
});
