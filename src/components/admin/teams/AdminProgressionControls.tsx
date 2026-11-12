import React, { useCallback, useEffect, useRef, useState } from 'react';
import { errorStatus, progressionService, type TeamProgression } from '../../../services/progressionService';

interface Props { teamId: string; teamName: string; onProgressChanged?: () => void | Promise<void> }

const ROUND_NAMES: Record<number, { title: string; short: string }> = {
  1: { title: 'Round 01: The Graveyard Escape', short: 'R1: Crypt' },
  2: { title: 'Round 02: The Haunted Auction', short: 'R2: Auction' },
  3: { title: 'Round 03: Paradox Lab', short: 'R3: Paradox' },
  4: { title: 'Round 04: The Campus Expedition', short: 'R4: Expedition' },
};

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

  return <section aria-label={`Team progression for ${teamName}`} className="space-y-4 border-t border-white/10 pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h4 className="text-xs font-cinzel font-bold uppercase tracking-wider text-cartel-cyan">Team rounds · {teamName}</h4>
        <p className="mt-1 text-[10px] text-cartel-silver/60">Advance this team to its next eligible round. Round 2 gameplay also requires the auction to be started from the Auction tab.</p>
      </div>
      <button type="button" onClick={() => { void load(); }} disabled={loading || busyRound !== null} className="rounded border border-cartel-amber/40 px-2 py-1 text-[10px] text-cartel-amber disabled:opacity-50">{loading ? 'Loading…' : 'Refresh'}</button>
    </div>

    {error && <div role="alert" className="flex flex-wrap justify-between gap-2 rounded border border-red-500/40 bg-red-950/30 p-2 text-xs text-red-200"><span>{error}</span><button type="button" onClick={() => { void load(); }} className="underline">Retry</button></div>}
    {notice && <output aria-live="polite" className="block rounded border border-emerald-500/30 bg-emerald-950/30 p-2 text-xs text-emerald-200">{notice}</output>}

    {loading && !progression ? <p role="status" className="text-xs text-cartel-silver/60">Loading team rounds…</p> : !progression ? null : <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rounds.map((round) => {
          const isActive = round.status === 'AVAILABLE' || round.status === 'IN_PROGRESS';
          const isCompleted = round.status === 'COMPLETED';
          return (
            <div key={round.round_id} className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
              isActive ? 'border-amber-500/60 bg-amber-950/20' : isCompleted ? 'border-emerald-500/30 bg-emerald-950/15' : 'border-white/10 bg-black/25'
            }`}>
              <div>
                <span className="text-xs font-cinzel font-bold text-white block">
                  {ROUND_NAMES[round.round_id]?.title ?? `Round ${String(round.round_id).padStart(2, '0')}`}
                </span>
                <span className={`text-[9px] font-mono uppercase ${
                  isActive ? 'text-amber-400 font-bold' : isCompleted ? 'text-emerald-400' : 'text-cartel-silver/60'
                }`}>
                  {round.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {nextRound !== undefined ? <button type="button" aria-label={`Move ${teamName} to Round ${nextRound}`} disabled={busyRound !== null} onClick={() => { void moveTeamForward(nextRound); }} className="rounded border border-cartel-amber/50 bg-cartel-amber/10 px-3 py-2 text-xs font-cinzel font-bold uppercase text-cartel-amber enabled:hover:bg-cartel-amber/20 disabled:cursor-wait disabled:opacity-50">
        {busyRound === nextRound ? 'Updating team…' : `Move team to Round ${nextRound}`}
      </button> : <p className="text-[10px] text-cartel-silver/60">Squad is at maximum round progression or already unlocked.</p>}
    </>}
  </section>;
};
