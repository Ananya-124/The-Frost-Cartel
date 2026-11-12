import React, { useCallback, useEffect, useRef, useState } from 'react';
import { errorStatus, progressionService, type ProgressAction, type ProgressEntity, type TeamProgression } from '../../../services/progressionService';

interface Props { teamId: string; teamName: string; onProgressChanged?: () => void | Promise<void> }
const huntNames = ['Hunt I · The Forgotten Incident', 'Hunt II · The False Memory', 'Hunt III · The Final Containment'];

export const AdminProgressionControls: React.FC<Props> = ({ teamId, teamName, onProgressChanged }) => {
  const [progression, setProgression] = useState<TeamProgression | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const actionInFlight = useRef(false);

  const load = useCallback(async () => {
    if (!teamId) { setProgression(null); return; }
    setLoading(true); setError('');
    try { setProgression(await progressionService.getAdminTeam(teamId)); }
    catch (cause) {
      setError(errorStatus(cause) === 401 ? 'Administrator session expired. Sign in again to continue.' : cause instanceof Error ? cause.message : 'Could not load progression.');
    } finally { setLoading(false); }
  }, [teamId]);
  useEffect(() => { void load(); }, [load]);

  const perform = async (entity: ProgressEntity, id: number, action: ProgressAction) => {
    if (actionInFlight.current || !teamId) return;
    if (action === 'reset' && !window.confirm(`Reset ${entity === 'ROUND' ? `Round ${id}` : `Hunt ${id}`} progression for ${teamName}? Audit history will be retained.`)) return;
    const key = `${entity}-${id}-${action}`;
    actionInFlight.current = true;
    setBusy(key); setError(''); setNotice('');
    try {
      const next = await progressionService.adminAction(teamId, entity, id, action, reason);
      setProgression(next);
      setNotice(
        entity === 'ROUND' && id === 2
          ? `Round 2 ${action} recorded for ALL squads across the tournament.`
          : `${entity === 'ROUND' ? `Round ${id}` : `Hunt ${id}`} ${action} recorded.`
      );
      try { await onProgressChanged?.(); }
      catch { setError('The progression change was saved, but the dashboard summary could not refresh.'); }
    } catch (cause) {
      setError(errorStatus(cause) === 401 ? 'Administrator session expired. Sign in again to continue.' : cause instanceof Error ? cause.message : 'Progression action failed.');
    } finally { actionInFlight.current = false; setBusy(null); }
  };

  const handleQuickAdvance = async (targetRound: number) => {
    if (actionInFlight.current || !teamId) return;
    actionInFlight.current = true;
    setBusy(`advance-${targetRound}`); setError(''); setNotice('');
    try {
      const next = await progressionService.adminAdvanceTeam(teamId, targetRound, reason);
      setProgression(next);
      setNotice(`Squad ${teamName} advanced to Round ${targetRound}! Inventory and cards synced.`);
      try { await onProgressChanged?.(); }
      catch { setError('Progression changed, but dashboard summary could not refresh.'); }
    } catch (cause) {
      setError(errorStatus(cause) === 401 ? 'Administrator session expired. Sign in again to continue.' : cause instanceof Error ? cause.message : 'Advance action failed.');
    } finally {
      actionInFlight.current = false;
      setBusy(null);
    }
  };

  const stateFor = (entity: ProgressEntity, id: number) => entity === 'ROUND'
    ? progression?.rounds.find((row) => row.round_id === id)
    : progression?.hunts.find((row) => row.hunt_id === id);
  const renderRow = (entity: ProgressEntity, id: number, title: string) => {
    const state = stateFor(entity, id);
    const isRound2 = entity === 'ROUND' && id === 2;
    return <div key={`${entity}-${id}`} className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-cinzel font-bold text-white">{title}</span>
          {isRound2 && (
            <span className="rounded border border-cyan-500/40 bg-cyan-950/40 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300">
              ALL SQUADS
            </span>
          )}
        </div>
        <span className="rounded border border-cartel-amber/30 px-2 py-0.5 text-[10px] font-mono text-cartel-amber">{state?.status ?? '—'}{entity === 'ROUND' && state && 'eligible_at' in state && state.eligible_at && state.status === 'LOCKED' ? ' · ELIGIBLE' : ''}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(['unlock', 'lock', 'complete', 'reset'] as const).map((action) => {
          const key = `${entity}-${id}-${action}`;
          const eligible = entity !== 'ROUND' || id <= 2 || Boolean(state && 'eligible_at' in state && state.eligible_at);
          const forbidden = action === 'unlock' && (state?.status !== 'LOCKED' || !eligible) || action === 'lock' && state?.status === 'LOCKED' || action === 'complete' && state?.status === 'COMPLETED';
          return <button key={action} type="button" aria-label={`${action} ${entity === 'ROUND' ? 'Round' : 'Hunt'} ${id}`} title={isRound2 && action === 'unlock' ? 'Unlock Round 2 for all squads across the tournament' : action === 'unlock' && entity === 'ROUND' && id > 1 && !eligible ? `Complete Round ${id - 1} before unlocking this round.` : undefined} disabled={Boolean(busy) || loading || !state || forbidden} onClick={() => { void perform(entity, id, action); }}
            className="rounded border border-cartel-frostBorder/30 px-2 py-1 text-[10px] font-cinzel uppercase text-cartel-silver enabled:hover:border-cartel-amber/50 enabled:hover:text-cartel-amber disabled:cursor-not-allowed disabled:opacity-35">
            {busy === key ? 'Saving…' : action}
          </button>;
        })}
      </div>
    </div>;
  };

  return <section aria-label={`Progression controls for ${teamName}`} className="space-y-3 border-t border-white/10 pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h4 className="text-xs font-cinzel font-bold uppercase tracking-wider text-cartel-cyan">Progression · {teamName}</h4><p className="mt-1 text-[10px] text-cartel-silver/60">Round 2 is a shared tournament auction — unlocking Round 2 unseals it for all tournament squads simultaneously.</p></div>
      <button type="button" onClick={() => { void load(); }} disabled={loading} className="rounded border border-cartel-amber/40 px-2 py-1 text-[10px] text-cartel-amber disabled:opacity-50">{loading ? 'Loading…' : 'Refresh'}</button>
    </div>
    {error && <div role="alert" className="flex flex-wrap justify-between gap-2 rounded border border-red-500/40 bg-red-950/30 p-2 text-xs text-red-200"><span>{error}</span><button type="button" onClick={() => { void load(); }} className="underline">Retry</button></div>}
    {notice && <output aria-live="polite" className="block rounded border border-emerald-500/30 bg-emerald-950/30 p-2 text-xs text-emerald-200">{notice}</output>}
    <label className="block text-[10px] text-cartel-silver/70">Audit reason (optional)<input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} className="mt-1 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white" /></label>

    {/* ONE-CLICK SQUAD ROUND CONTROLLER */}
    <div className="rounded-xl border border-amber-500/40 bg-black/40 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider">
            ⚡ Quick Squad Round Director
          </span>
          <p className="text-[10px] text-stone-300">
            One-click advance: automatically completes prior stages, syncs inventory/cards, and unlocks the selected round.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {[
          { id: 1, name: 'Round 1: Crypt', desc: 'The Graveyard Escape' },
          { id: 2, name: 'Round 2: Auction', desc: 'The Haunted Auction' },
          { id: 3, name: 'Round 3: Paradox', desc: 'Paradox Hunt (+ Cards)' },
          { id: 4, name: 'Round 4: Expedition', desc: 'Campus Expedition' },
        ].map((r) => {
          const rState = progression?.rounds.find((row) => row.round_id === r.id);
          const isCurrent = rState?.status === 'AVAILABLE' || rState?.status === 'IN_PROGRESS';
          const isCompleted = rState?.status === 'COMPLETED';
          return (
            <button
              key={r.id}
              type="button"
              disabled={Boolean(busy) || loading}
              onClick={() => { void handleQuickAdvance(r.id); }}
              className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                isCurrent
                  ? 'border-emerald-400 bg-emerald-950/70 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                  : isCompleted
                  ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-200 hover:border-cyan-400'
                  : 'border-white/15 bg-black/50 text-stone-300 hover:border-amber-400/60 hover:bg-amber-950/30'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span>{r.name}</span>
                <span className={isCurrent ? 'text-emerald-400 font-black' : isCompleted ? 'text-cyan-400' : 'text-stone-400'}>
                  {isCurrent ? '● ACTIVE' : isCompleted ? '✓ DONE' : '○ JUMP'}
                </span>
              </div>
              <div className="text-[9px] text-stone-400 mt-1 truncate">{r.desc}</div>
            </button>
          );
        })}
      </div>
    </div>

    {/* EXPLANATION ACCORDION: WHAT ARE LOCK, UNLOCK, COMPLETE, RESET? */}
    <details className="rounded border border-white/10 bg-black/20 px-3 py-2 text-left">
      <summary className="cursor-pointer text-[10px] font-cinzel font-bold uppercase tracking-wider text-cartel-amber">
        ❓ Guide: What do Lock, Unlock, Complete, & Reset mean?
      </summary>
      <div className="mt-2 space-y-1.5 text-[10px] text-stone-300 leading-relaxed font-sans">
        <p><strong className="text-emerald-300 font-bold uppercase">Unlock:</strong> Makes a round or hunt playable and unsealed for this squad so they can enter immediately.</p>
        <p><strong className="text-cyan-300 font-bold uppercase">Complete:</strong> Finalizes the round as solved and satisfies prerequisites for subsequent rounds.</p>
        <p><strong className="text-amber-300 font-bold uppercase">Lock:</strong> Revokes access, preventing the squad from entering until re-unlocked.</p>
        <p><strong className="text-red-300 font-bold uppercase">Reset:</strong> Clears the squad's completion timestamp and returns the round to locked while preserving audit logs.</p>
        <p className="text-stone-400 pt-1 border-t border-white/10 italic">
          💡 Tip: Use the <strong>Quick Squad Round Director</strong> above for standard tournament progression — it manages completions and inventory sync automatically without having to click individual buttons.
        </p>
      </div>
    </details>

    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{[1, 2, 3, 4].map((id) => renderRow('ROUND', id, `Round ${String(id).padStart(2, '0')}`))}</div>
    <h5 className="pt-1 text-[10px] font-cinzel font-bold uppercase tracking-wider text-cartel-amber">Round 3 hunts · sequential</h5>
    <div className="grid grid-cols-1 gap-2">{[1, 2, 3].map((id) => renderRow('HUNT', id, huntNames[id - 1]))}</div>
    <div className="max-h-36 space-y-1 overflow-y-auto rounded border border-white/10 bg-black/25 p-2" aria-label="Progression audit history">
      <div className="text-[10px] font-cinzel uppercase text-cartel-silver/70">Recent progression audit</div>
      {progression?.audit?.length ? progression.audit.map((entry) => <p key={entry.id} className="text-[10px] text-cartel-silver/80">{new Date(entry.created_at).toLocaleString()} · {entry.entity_type} {entry.entity_id} · {entry.action_performed} · {entry.previous_state ?? '—'} → {entry.new_state}{entry.reason ? ` · ${entry.reason}` : ''}</p>) : <p className="text-[10px] text-cartel-silver/50">{loading ? 'Loading history…' : 'No progression changes recorded.'}</p>}
    </div>
  </section>;
};
