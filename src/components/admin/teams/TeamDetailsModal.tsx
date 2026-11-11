import React, { useState } from 'react';
import type { AdminTeam, StageId, StageStatus, TeamStatus } from '../../../types/admin';
import { useNativeDialog } from '../../../hooks/useNativeDialog';
import { AdminProgressionControls } from './AdminProgressionControls';
import { EditTeamNameModal } from './EditTeamNameModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { adminReadService } from '../../../services/adminReadService';

interface TeamDetailsModalProps {
  team: AdminTeam | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
}

function getTeamStatusBadgeClass(status: TeamStatus): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400';
    case 'paused':
      return 'bg-amber-950/80 border-amber-500/60 text-amber-400';
    case 'completed':
      return 'bg-cyan-950/80 border-cyan-500/60 text-cyan-400';
    default:
      return 'bg-cartel-charcoal border-white/20 text-cartel-silver';
  }
}

function getStageStatusBadgeClass(status: StageStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400';
    case 'in_progress':
      return 'bg-amber-950/80 border-amber-500/60 text-amber-400';
    case 'skipped':
      return 'bg-red-950/80 border-red-500/60 text-red-400';
    default:
      return 'bg-cartel-charcoal border-white/20 text-cartel-silver/60';
  }
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '—';
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return timestamp;
  }
}

export const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
  team,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const { dialogRef } = useNativeDialog(isOpen, onClose);
  const [editingName, setEditingName] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen || !team) return null;

  const stageKeys: StageId[] = ['stage-1', 'stage-2', 'stage-3'];
  const statusBadgeClass = getTeamStatusBadgeClass(team.status);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="team-details-title"
      className="fixed inset-0 z-50 m-0 w-full h-full max-w-none max-h-none p-4 flex items-center justify-center bg-cartel-void/85 backdrop-blur-sm border-none bg-transparent outline-none animate-fadeIn"
    >
      <div className="stone-panel rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col relative shadow-2xl border border-cartel-frostBorder/40 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-cartel-midnight/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border border-cartel-amber/50 bg-cartel-charcoal flex items-center justify-center text-cartel-amber shadow-pumpkinGlow">
              <span className="text-lg" aria-hidden="true">💀</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="team-details-title" className="text-xl font-gothic font-bold text-white tracking-wide">
                  {team.name}
                </h3>
                <span
                  className={`text-[10px] font-cinzel font-bold px-2 py-0.5 rounded-full border uppercase ${statusBadgeClass}`}
                >
                  {team.status}
                </span>
              </div>
              <p className="text-[11px] font-mono text-cartel-silver/60">
                <span>TEAM ID: </span>{team.id}<span> • CREATED: </span>{formatTimestamp(team.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => setEditingName(true)} className="rounded border border-white/20 px-2 py-1 text-[10px] text-cartel-silver disabled:opacity-50">Rename</button>
            <button type="button" disabled={busy} onClick={() => setResettingPassword(true)} className="rounded border border-cartel-amber/30 px-2 py-1 text-[10px] text-cartel-amber disabled:opacity-50">Reset password</button>
            <button type="button" disabled={busy} onClick={() => { void (async () => {
              setBusy(true); setError(null); setNotice(null);
              try { await adminReadService.setTeamPaused(team.id, team.status !== 'paused'); await onRefresh?.(); setNotice(team.status === 'paused' ? 'Team resumed.' : 'Team paused.'); }
              catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not change team status.'); }
              finally { setBusy(false); }
            })(); }} className="rounded border border-cartel-amber/30 px-2 py-1 text-[10px] text-cartel-amber disabled:opacity-50">{busy ? 'Saving…' : team.status === 'paused' ? 'Resume team' : 'Pause team'}</button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-cartel-silver/60 hover:text-white p-1 rounded transition-colors text-sm font-mono cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {error && <p role="alert" className="rounded border border-red-500/40 bg-red-950/30 p-2 text-xs text-red-200">{error}</p>}
          {notice && <output aria-live="polite" className="block rounded border border-emerald-500/30 bg-emerald-950/30 p-2 text-xs text-emerald-200">{notice}</output>}
          {/* Top Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-cartel-charcoal/80 border border-white/10 rounded p-3">
              <div className="text-[10px] font-cinzel text-cartel-silver/60 uppercase">CURRENT ROUND</div>
              <div className="text-sm font-cinzel font-bold text-white mt-0.5">{team.currentRound}</div>
            </div>
            <div className="bg-cartel-charcoal/80 border border-white/10 rounded p-3">
              <div className="text-[10px] font-cinzel text-cartel-silver/60 uppercase">CURRENT STAGE</div>
              <div className="text-sm font-cinzel font-bold text-cartel-amber mt-0.5 uppercase">
                {team.currentStage}
              </div>
            </div>
            <div className="bg-cartel-charcoal/80 border border-white/10 rounded p-3">
              <div className="text-[10px] font-cinzel text-cartel-silver/60 uppercase">STAGE START</div>
              <div className="text-xs font-mono font-semibold text-cartel-silver mt-1">
                {formatTimestamp(team.stageStartTime)}
              </div>
            </div>
            <div className="bg-cartel-charcoal/80 border border-cartel-pumpkin/40 rounded p-3">
              <div className="text-[10px] font-cinzel text-cartel-silver/60 uppercase">WALLET CREDITS</div>
              <div className="text-base font-mono font-bold text-cartel-pumpkin mt-0.5">
                {team.credits} / 500 CR
              </div>
            </div>
          </div>

          {/* Timestamps Row */}
          <div className="bg-cartel-midnight/60 border border-white/5 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-cartel-silver/60">Round 1 Start: </span>
              <span className="text-white">{formatTimestamp(team.roundStartTime)}</span>
            </div>
            <div>
              <span className="text-cartel-silver/60">Round 1 End: </span>
              <span className="text-white">{formatTimestamp(team.roundEndTime)}</span>
            </div>
          </div>

          {/* Stage Tracking Section */}
          <div>
            <h4 className="text-xs font-cinzel font-bold text-cartel-amber uppercase tracking-wider mb-2.5">
              STAGE PROGRESSION &amp; SCORE AUDIT
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stageKeys.map((key) => {
                const stage = team.stages[key];
                const stageBadgeClass = getStageStatusBadgeClass(stage.status);
                return (
                  <div
                    key={key}
                    className="stone-panel rounded-lg p-3 border border-white/10 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-cinzel font-bold text-white">
                          {key.toUpperCase()}
                        </span>
                        <span
                          className={`text-[9px] font-cinzel font-bold px-2 py-0.5 rounded-full border uppercase ${stageBadgeClass}`}
                        >
                          {stage.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] font-sans text-cartel-silver/80 leading-tight mb-2">
                        {stage.name}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-cartel-silver/60">Reward Potential:</span>
                        <span className="text-cartel-amber">{stage.rewardCredits} PTS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cartel-silver/60">Stage Score:</span>
                        <span className="text-emerald-400 font-bold">{stage.earnedCredits} PTS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cartel-silver/60">Started:</span>
                        <span className="text-cartel-silver">{formatTimestamp(stage.startTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cartel-silver/60">Completed:</span>
                        <span className="text-cartel-silver">{formatTimestamp(stage.endTime)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity History Timeline */}
          <AdminProgressionControls teamId={team.id} teamName={team.name} onProgressChanged={onRefresh ? () => onRefresh() : undefined} />

          {/* Activity History Timeline */}
          <div>
            <h4 className="text-xs font-cinzel font-bold text-cartel-cyan uppercase tracking-wider mb-2.5">
              ACTIVITY HISTORY (AUDIT TRAIL)
            </h4>
            <div className="bg-cartel-midnight/70 border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {team.activityHistory.length === 0 ? (
                <p className="text-xs text-cartel-silver/50 font-mono text-center py-2">
                  No activity recorded yet for this team.
                </p>
              ) : (
                team.activityHistory.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start justify-between text-xs py-1.5 border-b border-white/5 last:border-0 gap-2 font-mono"
                  >
                    <div className="flex items-start space-x-2">
                      <span className="text-cartel-amber shrink-0" aria-hidden="true">►</span>
                      <span className="text-cartel-silver/90 font-sans">{act.description}</span>
                    </div>
                    <span className="text-[10px] text-cartel-silver/50 shrink-0">
                      {formatTimestamp(act.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end shrink-0 bg-cartel-midnight/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-cartel-charcoal hover:bg-white/10 border border-white/20 text-white font-cinzel text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
      <EditTeamNameModal team={team} isOpen={editingName} onClose={() => setEditingName(false)} onSuccess={async () => { await onRefresh?.(); setEditingName(false); setNotice('Team name updated.'); }} />
      <ResetPasswordModal team={team} isOpen={resettingPassword} onClose={() => setResettingPassword(false)} onSuccess={async () => { await onRefresh?.(); setNotice('Password reset confirmed.'); }} />
    </dialog>
  );
};
