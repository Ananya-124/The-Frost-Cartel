import React, { useCallback, useEffect, useRef, useState } from 'react';
import { errorStatus, progressionService, type TeamProgression } from '../../../services/progressionService';

interface Props { teamId: string; teamName: string; onProgressChanged?: () => void | Promise<void> }

export const AdminProgressionControls: React.FC<Props> = ({ teamId, teamName, onProgressChanged }) => {
  const [progression, setProgression] = useState<TeamProgression | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyRound, setBusyRound] = useState<number | null>(null);
  const actionInFlight = useRef(false);

  const load = useCallback(async () => {
    if (!teamId) { setProgression(null); return; }
    setLoading(true); setError('');
    try { setProgression(await progressionService.getAdminTeam(teamId)); }
    catch (cause) {
      setError(errorStatus(cause) === 401 ? 'Administrator session expired. Sign in again to continue.' : cause instanceof Error ? cause.message : 'Could not load team progression.');
    } finally { setLoading(false); }
  }, [teamId]);
  useEffect(() => { void load(); }, [load]);

  const moveTeamForward = async (roundId: number) => {
    if (actionInFlight.current || !teamId) return;
    actionInFlight.current = true;
    setBusyRound(roundId); setError(''); setNotice('');
    try {
      const next = await progressionService.adminAction(teamId, 'ROUND', roundId, 'unlock');
      setProgression(next);
      setNotice(`${teamName} moved to Round ${roundId}.`);
      try { await onProgressChanged?.(); }
      catch { setError('The team update was saved, but the dashboard summary could not refresh.'); }
    } catch (cause) {
      setError(errorStatus(cause) === 401 ? 'Administrator session expired. Sign in again to continue.' : cause instanceof Error ? cause.message : `Could not move ${teamName} to Round ${roundId}.`);
    } finally { actionInFlight.current = false; setBusyRound(null); }
  };

  const rounds = progression?.rounds ?? [];
  const nextRound = [2, 3, 4].find((roundId) => {
    const current = rounds.find((row) => row.round_id === roundId);
    const previous = rounds.find((row) => row.round_id === roundId - 1);
    return current?.status === 'LOCKED' && (previous?.status === 'COMPLETED' || Boolean(current.eligible_at));
  });

  return <section aria-label={`Team progression for ${teamName}`} className="space-y-3 border-t border-white/10 pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h4 className="text-xs font-cinzel font-bold uppercase tracking-wider text-cartel-cyan">Team rounds · {teamName}</h4>
        <p className="mt-1 text-[10px] text-cartel-silver/60">Move this team forward one round at a time. Round 2 entry still requires the auction to be started from the Auction tab.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (!window.confirm(`⚠️ Reset progress for EVERY squad across the tournament? All squads will be returned to Round 1 staged.`)) return;
            setLoading(true);
            void progressionService.adminResetAllTeamsProgress('Reset all squads triggered from team progression')
              .then((res) => {
                setNotice(`Master Reset Complete! All ${res.resetCount} squads reset to Round 1 staged.`);
                void load();
                void onProgressChanged?.();
              })
              .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Reset failed.'))
              .finally(() => setLoading(false));
          }}
          disabled={loading || busyRound !== null}
          className="rounded border border-red-500/50 bg-red-950/40 hover:bg-red-900/60 px-2.5 py-1 text-[10px] font-cinzel font-bold uppercase text-red-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          ⚠️ Reset Every Team
        </button>
        <button type="button" onClick={() => { void load(); }} disabled={loading || busyRound !== null} className="rounded border border-cartel-amber/40 px-2 py-1 text-[10px] text-cartel-amber disabled:opacity-50">{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
    </div>

    {error && <div role="alert" className="flex flex-wrap justify-between gap-2 rounded border border-red-500/40 bg-red-950/30 p-2 text-xs text-red-200"><span>{error}</span><button type="button" onClick={() => { void load(); }} className="underline">Retry</button></div>}
    {notice && <output aria-live="polite" className="block rounded border border-emerald-500/30 bg-emerald-950/30 p-2 text-xs text-emerald-200">{notice}</output>}

    {loading && !progression ? <p role="status" className="text-xs text-cartel-silver/60">Loading team rounds…</p> : !progression ? null : <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rounds.map((round) => <div key={round.round_id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 p-3">
          <span className="text-xs font-cinzel font-bold text-white">Round {String(round.round_id).padStart(2, '0')}</span>
          <span className="rounded border border-cartel-amber/30 px-2 py-0.5 text-[10px] font-mono text-cartel-amber">{round.status.replace('_', ' ')}</span>
        </div>)}
      </div>
      {nextRound !== undefined ? <button type="button" aria-label={`Move ${teamName} to Round ${nextRound}`} disabled={busyRound !== null} onClick={() => { void moveTeamForward(nextRound); }} className="rounded border border-cartel-amber/50 bg-cartel-amber/10 px-3 py-2 text-xs font-cinzel font-bold uppercase text-cartel-amber enabled:hover:bg-cartel-amber/20 disabled:cursor-wait disabled:opacity-50">
        {busyRound === nextRound ? 'Updating team…' : `Move team to Round ${nextRound}`}
      </button> : <p className="text-[10px] text-cartel-silver/60">No next round is ready for this team yet.</p>}
    </>}
  </section>;
};
