import React from 'react';
import type { TeamProgression, ProgressStatus } from '../../services/progressionService';

interface Props {
  progression: TeamProgression | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const HUNTS = ['Hunt I · The Forgotten Incident', 'Hunt II · The False Memory', 'Hunt III · The Final Containment'];

function label(status: ProgressStatus): string {
  return status.replace('_', ' ');
}

function statusStyle(status: ProgressStatus): string {
  if (status === 'COMPLETED') return 'text-emerald-300 border-emerald-500/40 bg-emerald-950/40';
  if (status === 'IN_PROGRESS') return 'text-amber-200 border-amber-500/40 bg-amber-950/40';
  if (status === 'AVAILABLE') return 'text-teal-200 border-teal-500/40 bg-teal-950/40';
  return 'text-stone-300 border-white/10 bg-black/30';
}

export const TeamProgressionSummary: React.FC<Props> = ({ progression, loading, error, onRetry }) => (
  <section aria-label="Team round progression" className="mx-auto mt-3 w-full max-w-5xl rounded-lg border border-cartel-amber/30 bg-black/75 px-4 py-3 text-left shadow-xl">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-cartel-amber">Your expedition record</h2>
      {loading && <span role="status" className="text-xs text-cartel-silver/70">Checking server progression…</span>}
    </div>
    {error && (
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2" role="alert">
        <p className="text-xs text-red-200">{error}</p>
        <button type="button" onClick={onRetry} className="rounded border border-cartel-amber/50 px-3 py-1 text-xs text-cartel-amber">Retry</button>
      </div>
    )}
    {progression && !error && (
      <>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {progression.rounds.map((round) => (
            <div key={round.round_id} className={`rounded border px-2.5 py-2 ${statusStyle(round.status)}`}>
              <div className="text-[10px] font-cinzel uppercase tracking-wide">Round {String(round.round_id).padStart(2, '0')}</div>
              <div className="mt-0.5 text-[11px] font-bold">{label(round.status)}</div>
              {round.status === 'LOCKED' && round.eligible_at && <div className="mt-1 text-[10px] text-amber-200">Eligible · awaiting admin unlock</div>}
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Round 3 hunt progression">
          {HUNTS.map((hunt, index) => {
            const status = progression.hunts.find((item) => item.hunt_id === index + 1)?.status ?? 'LOCKED';
            return <div key={hunt} className={`flex items-center justify-between gap-2 rounded border px-2.5 py-2 ${statusStyle(status)}`}>
              <span className="text-[10px] font-cinzel leading-tight">{hunt}</span><span className="shrink-0 text-[10px] font-bold">{label(status)}</span>
            </div>;
          })}
        </div>
      </>
    )}
    {!progression && !loading && !error && <p className="mt-2 text-xs text-cartel-silver/70">Sign in to view your server-recorded progression.</p>}
  </section>
);
