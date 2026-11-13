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

  const jumpDirectlyToRound = async (targetRound: number) => {
    if (actionInFlight.current || !teamId) return;
    actionInFlight.current = true;
    setBusyRound(targetRound); setError(''); setNotice('');
    try {
      const next = await progressionService.adminAdvanceTeam(teamId, targetRound, `Admin jumped ${teamName} directly to Round ${targetRound}`);
      setProgression(next);
      setNotice(`⚡ ${teamName} moved directly to Round ${targetRound}! Prior rounds auto-completed and route assigned.`);
      try { await onProgressChanged?.(); }
      catch { setError('Team updated, but dashboard summary could not refresh.'); }
    } catch (cause) {
      setError(errorStatus(cause) === 401 ? 'Administrator session expired. Sign in again to continue.' : cause instanceof Error ? cause.message : `Could not move ${teamName} to Round ${targetRound}.`);
    } finally {
      actionInFlight.current = false;
      setBusyRound(null);
    }
  };

  const rounds = progression?.rounds ?? [];

  return <section aria-label={`Team progression for ${teamName}`} className="space-y-4 border-t border-white/10 pt-4">
    {/* Header with Team Name & Reset/Refresh */}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h4 className="text-xs font-cinzel font-bold uppercase tracking-wider text-cartel-cyan">Team rounds · {teamName}</h4>
        <p className="mt-1 text-[10px] text-cartel-silver/60">Move this squad to any round below with one click. Prior rounds are auto-completed.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (!window.confirm('⚡ Advance and update ALL squads simultaneously to Round 2: The Haunted Auction? This will complete Round 1 and unseal Round 2 for all squads.')) return;
            setLoading(true);
            void progressionService.adminRound2Global('advance', 'Admin batch advanced all squads to Round 2')
              .then((res) => {
                setNotice(`⚡ Updated all squads to Round 2 simultaneously! (${res.updatedCount} squads updated).`);
                void load();
                void onProgressChanged?.();
              })
              .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Batch advance to Round 2 failed.'))
              .finally(() => setLoading(false));
          }}
          disabled={loading || busyRound !== null}
          className="rounded border border-purple-500/50 bg-purple-950/40 hover:bg-purple-900/60 px-2.5 py-1 text-[10px] font-cinzel font-bold uppercase text-purple-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          ⚡ Advance All to R2
        </button>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm('⚡ Advance and update ALL squads simultaneously to Round 3: Paradox Hunt? This will complete prior rounds, sync auction power cards, and unseal Round 3 for all squads.')) return;
            setLoading(true);
            void progressionService.adminRound3Global('advance', 'Admin batch advanced all squads to Round 3')
              .then((res) => {
                setNotice(`⚡ Updated all squads to Round 3 simultaneously! (${res.updatedCount} squads updated, ${res.cardsSynced} cards synced).`);
                void load();
                void onProgressChanged?.();
              })
              .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Batch advance to Round 3 failed.'))
              .finally(() => setLoading(false));
          }}
          disabled={loading || busyRound !== null}
          className="rounded border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/60 px-2.5 py-1 text-[10px] font-cinzel font-bold uppercase text-cyan-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          ⚡ Advance All to R3
        </button>
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

    {/* PROMINENT DIRECT JUMP BAR */}
    <div className="rounded-xl border-2 border-amber-500/50 bg-amber-950/30 p-3.5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-xs font-cinzel font-black text-amber-300 uppercase tracking-widest">
            MOVE {teamName.toUpperCase()} DIRECTLY TO ROUND:
          </span>
        </div>
        <span className="text-[10px] text-amber-200/70 font-mono">1-click jump & auto-qualify</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[1, 2, 3, 4].map((rId) => {
          const isRound4 = rId === 4;
          const currentRoundState = rounds.find((r) => r.round_id === rId);
          const isActive = currentRoundState?.status === 'AVAILABLE' || currentRoundState?.status === 'IN_PROGRESS';
          return (
            <button
              key={rId}
              type="button"
              disabled={busyRound !== null || loading}
              onClick={() => { void jumpDirectlyToRound(rId); }}
              className={`p-2.5 rounded-lg text-xs font-cinzel font-bold uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border-2 ${
                isRound4
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] hover:scale-103'
                  : isActive
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-cartel-charcoal hover:bg-white/10 border-white/20 text-white'
              } disabled:opacity-50 disabled:cursor-wait`}
            >
              <span className="text-xs font-black">
                {isRound4 ? '⚡ Jump to Round 4' : `Jump to Round ${rId}`}
              </span>
              <span className={`text-[9px] font-mono ${isRound4 ? 'text-black/90 font-bold' : 'text-cartel-silver/70'}`}>
                {busyRound === rId ? 'Moving…' : isActive ? '● Currently Active' : ROUND_NAMES[rId]?.short ?? `Round ${rId}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>

    {error && <div role="alert" className="flex flex-wrap justify-between gap-2 rounded border border-red-500/40 bg-red-950/30 p-2 text-xs text-red-200"><span>{error}</span><button type="button" onClick={() => { void load(); }} className="underline">Retry</button></div>}
    {notice && <output aria-live="polite" className="block rounded border border-emerald-500/30 bg-emerald-950/30 p-2 text-xs text-emerald-200">{notice}</output>}

    {loading && !progression ? <p role="status" className="text-xs text-cartel-silver/60">Loading team rounds…</p> : !progression ? null : <>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {rounds.map((round) => {
          const isActive = round.status === 'AVAILABLE' || round.status === 'IN_PROGRESS';
          const isCompleted = round.status === 'COMPLETED';
          return (
            <div key={round.round_id} className={`flex items-center justify-between gap-3 rounded-lg border p-3.5 ${
              isActive ? 'border-amber-500/60 bg-amber-950/20 shadow-sm' : isCompleted ? 'border-emerald-500/30 bg-emerald-950/15' : 'border-white/10 bg-black/25'
            }`}>
              <div>
                <span className="text-xs font-cinzel font-bold text-white block">
                  {ROUND_NAMES[round.round_id]?.title ?? `Round ${String(round.round_id).padStart(2, '0')}`}
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-wider ${
                  isActive ? 'text-amber-400 font-bold' : isCompleted ? 'text-emerald-400' : 'text-cartel-silver/60'
                }`}>
                  {round.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                {round.round_id === 4 ? (
                  <button
                    type="button"
                    disabled={busyRound !== null || loading}
                    onClick={() => { void jumpDirectlyToRound(4); }}
                    className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/60 text-amber-300 font-cinzel text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {busyRound === 4 ? 'Moving…' : '⚡ Jump R4'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyRound !== null || loading}
                    onClick={() => { void jumpDirectlyToRound(round.round_id); }}
                    className="px-2.5 py-1 rounded bg-cartel-charcoal hover:bg-white/10 border border-white/20 text-white font-cinzel text-[10px] font-bold cursor-pointer disabled:opacity-50"
                  >
                    {busyRound === round.round_id ? 'Moving…' : `Jump R${round.round_id}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Standalone Big Action Button */}
      <div className="pt-2">
        <button
          type="button"
          disabled={busyRound !== null || loading}
          onClick={() => { void jumpDirectlyToRound(4); }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-black font-cinzel font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer disabled:opacity-50"
        >
          {busyRound === 4 ? 'Moving squad to Round 4…' : `⚡ JUMP ${teamName.toUpperCase()} DIRECTLY TO ROUND 4 (CAMPUS EXPEDITION)`}
        </button>
      </div>
    </>}
  </section>;
};
