import React, { useCallback, useEffect, useState } from 'react';
import { errorStatus, progressionService, type ProgressAction, type ProgressEntity, type TeamProgression, type ServerTeamOption } from '../../../services/progressionService';

interface Props { teamId: string; teamName: string; onProgressChanged?: () => void | Promise<void> }
const huntNames = ['Hunt I · The Forgotten Incident', 'Hunt II · The False Memory', 'Hunt III · The Final Containment'];

export const AdminProgressionControls: React.FC<Props> = ({ teamId, teamName, onProgressChanged }) => {
  const [serverTeams, setServerTeams] = useState<ServerTeamOption[]>([]);
  const [targetTeamId, setTargetTeamId] = useState('');
  const [progression, setProgression] = useState<TeamProgression | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void progressionService.getAdminTeams().then((teams) => {
      if (!active) return;
      setServerTeams(teams);
      const exact = teams.find((team) => team.teamName.toLocaleLowerCase() === teamName.toLocaleLowerCase());
      const localId = teams.find((team) => team.id === teamId);
      setTargetTeamId(exact?.id ?? localId?.id ?? '');
    }).catch((cause) => {
      if (active) setError(errorStatus(cause) === 401 ? 'Administrator session expired. Sign in again to continue.' : cause instanceof Error ? cause.message : 'Could not load server teams.');
    });
    return () => { active = false; };
  }, [teamId, teamName]);

  const load = useCallback(async () => {
    if (!targetTeamId) { setProgression(null); return; }
    setLoading(true); setError('');
    try { setProgression(await progressionService.getAdminTeam(targetTeamId)); }
    catch (cause) {
      setError(errorStatus(cause) === 401 ? 'Administrator session expired. Sign in again to continue.' : cause instanceof Error ? cause.message : 'Could not load progression.');
    } finally { setLoading(false); }
  }, [targetTeamId]);
  useEffect(() => { void load(); }, [load]);

  const perform = async (entity: ProgressEntity, id: number, action: ProgressAction) => {
    if (action === 'reset' && !window.confirm(`Reset ${entity === 'ROUND' ? `Round ${id}` : `Hunt ${id}`} progression for ${teamName}? Audit history will be retained.`)) return;
    const key = `${entity}-${id}-${action}`;
    setBusy(key); setError(''); setNotice('');
    try {
      const next = await progressionService.adminAction(targetTeamId, entity, id, action, reason);
      setProgression(next);
      await onProgressChanged?.();
      setNotice(`${entity === 'ROUND' ? `Round ${id}` : `Hunt ${id}`} ${action} recorded.`);
    } catch (cause) {
      setError(errorStatus(cause) === 401 ? 'Administrator session expired. Sign in again to continue.' : cause instanceof Error ? cause.message : 'Progression action failed.');
    } finally { setBusy(null); }
  };

  const stateFor = (entity: ProgressEntity, id: number) => entity === 'ROUND'
    ? progression?.rounds.find((row) => row.round_id === id)
    : progression?.hunts.find((row) => row.hunt_id === id);
  const renderRow = (entity: ProgressEntity, id: number, title: string) => {
    const state = stateFor(entity, id);
    return <div key={`${entity}-${id}`} className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-cinzel font-bold text-white">{title}</span>
        <span className="rounded border border-cartel-amber/30 px-2 py-0.5 text-[10px] font-mono text-cartel-amber">{state?.status ?? '—'}{entity === 'ROUND' && state && 'eligible_at' in state && state.eligible_at && state.status === 'LOCKED' ? ' · ELIGIBLE' : ''}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(['unlock', 'lock', 'complete', 'reset'] as const).map((action) => {
          const key = `${entity}-${id}-${action}`;
          const forbidden = action === 'unlock' && state?.status !== 'LOCKED' || action === 'lock' && state?.status === 'LOCKED' || action === 'complete' && state?.status === 'COMPLETED';
          return <button key={action} type="button" disabled={Boolean(busy) || !state || forbidden} onClick={() => { void perform(entity, id, action); }}
            className="rounded border border-cartel-frostBorder/30 px-2 py-1 text-[10px] font-cinzel uppercase text-cartel-silver enabled:hover:border-cartel-amber/50 enabled:hover:text-cartel-amber disabled:cursor-not-allowed disabled:opacity-35">
            {busy === key ? 'Saving…' : action}
          </button>;
        })}
      </div>
    </div>;
  };

  return <section aria-label={`Progression controls for ${teamName}`} className="space-y-3 border-t border-white/10 pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h4 className="text-xs font-cinzel font-bold uppercase tracking-wider text-cartel-cyan">Server round & hunt progression</h4><p className="mt-1 text-[10px] text-cartel-silver/60">Round 2 completion is admin-recorded until that round exposes an authoritative completion record.</p></div>
      <button type="button" onClick={() => { void load(); }} disabled={loading} className="rounded border border-cartel-amber/40 px-2 py-1 text-[10px] text-cartel-amber disabled:opacity-50">{loading ? 'Loading…' : 'Refresh'}</button>
    </div>
    {error && <div role="alert" className="flex flex-wrap justify-between gap-2 rounded border border-red-500/40 bg-red-950/30 p-2 text-xs text-red-200"><span>{error}</span><button type="button" onClick={() => { void load(); }} className="underline">Retry</button></div>}
    {notice && <output aria-live="polite" className="block rounded border border-emerald-500/30 bg-emerald-950/30 p-2 text-xs text-emerald-200">{notice}</output>}
    <label className="block text-[10px] text-cartel-silver/70">Server team<select value={targetTeamId} onChange={(event) => setTargetTeamId(event.target.value)} className="mt-1 w-full rounded border border-white/15 bg-[#121316] px-2 py-1.5 text-xs text-white"><option value="">Choose a server team…</option>{serverTeams.map((team) => <option key={team.id} value={team.id}>{team.teamName}</option>)}</select></label>
    <label className="block text-[10px] text-cartel-silver/70">Audit reason (optional)<input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} className="mt-1 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white" /></label>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{[1, 2, 3, 4].map((id) => renderRow('ROUND', id, `Round ${String(id).padStart(2, '0')}`))}</div>
    <h5 className="pt-1 text-[10px] font-cinzel font-bold uppercase tracking-wider text-cartel-amber">Round 3 hunts · sequential</h5>
    <div className="grid grid-cols-1 gap-2">{[1, 2, 3].map((id) => renderRow('HUNT', id, huntNames[id - 1]))}</div>
    <div className="max-h-36 space-y-1 overflow-y-auto rounded border border-white/10 bg-black/25 p-2" aria-label="Progression audit history">
      <div className="text-[10px] font-cinzel uppercase text-cartel-silver/70">Recent progression audit</div>
      {progression?.audit?.length ? progression.audit.map((entry) => <p key={entry.id} className="text-[10px] text-cartel-silver/80">{new Date(entry.created_at).toLocaleString()} · {entry.entity_type} {entry.entity_id} · {entry.action_performed} · {entry.previous_state ?? '—'} → {entry.new_state}{entry.reason ? ` · ${entry.reason}` : ''}</p>) : <p className="text-[10px] text-cartel-silver/50">{loading ? 'Loading history…' : 'No progression changes recorded.'}</p>}
    </div>
  </section>;
};
