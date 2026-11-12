import React, { useEffect, useRef, useState } from 'react';
import type { AdminTeam, Round1Status } from '../../../types/admin';
import { adminReadService } from '../../../services/adminReadService';
import { round1Api } from '../../../services/round1ApiService';
import { progressionService } from '../../../services/progressionService';
import { AdminProgressionControls } from '../teams/AdminProgressionControls';
import { ConfirmationModal } from '../shared/ConfirmationModal';
import { AdminStageConfigPanel } from './AdminStageConfigPanel';

interface AdminRoundControlTabProps {
  round1Status: Round1Status;
  preselectedTeamId?: string;
  onRefresh: () => void;
}

function getRound1BadgeStyle(status: Round1Status): { label: string; badgeClass: string } {
  switch (status) {
    case 'running':
      return {
        label: 'RUNNING • ACTIVE',
        badgeClass: 'bg-emerald-950/80 border-emerald-500/70 text-emerald-400',
      };
    case 'paused':
      return {
        label: 'PAUSED • HALTED',
        badgeClass: 'bg-amber-950/80 border-amber-500/70 text-amber-400',
      };
    case 'completed':
      return {
        label: 'COMPLETED • CLOSED',
        badgeClass: 'bg-cyan-950/80 border-cyan-500/70 text-cyan-400',
      };
    default:
      return {
        label: 'NOT STARTED • STAGED',
        badgeClass: 'bg-cartel-charcoal border-white/20 text-cartel-silver',
      };
  }
}

export const AdminRoundControlTab: React.FC<AdminRoundControlTabProps> = ({
  round1Status,
  preselectedTeamId,
  onRefresh,
}) => {
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [teamLoadError, setTeamLoadError] = useState<string | null>(null);

  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    preselectedTeamId || (teams[0]?.id ?? '')
  );
  const [roundDuration, setRoundDuration] = useState<number>(22);
  const [serverStatus, setServerStatus] = useState<Round1Status>(round1Status);
  const [timerBusy, setTimerBusy] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [roundError, setRoundError] = useState<string | null>(null);
  const actionInFlight = useRef(false);
  const [actionBusy, setActionBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void adminReadService.getTeams().then((result) => { if (active) { setTeams(result); setSelectedTeamId((current) => preselectedTeamId ?? (result.some((team) => team.id === current) ? current : result[0]?.id ?? '')); } })
      .catch((error: unknown) => { if (active) setTeamLoadError(error instanceof Error ? error.message : 'Could not load the server team roster.'); });
    return () => { active = false; };
  }, [preselectedTeamId]);
  React.useEffect(() => {
    void round1Api.adminConfig().then(({ configuration }) => {
      setRoundDuration(configuration.durationMinutes);
      if (configuration.lifecycle) setServerStatus(configuration.lifecycle === 'running' ? 'running' : configuration.lifecycle === 'paused' ? 'paused' : configuration.lifecycle === 'completed' ? 'completed' : 'not_started');
    })
      .catch((error: unknown) => setRoundError(error instanceof Error ? error.message : 'Could not load Round 1 settings.'));
  }, []);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    isDanger?: boolean;
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  const selectedTeam: AdminTeam | undefined = teams.find((t) => t.id === selectedTeamId);
  const roundBadge = getRound1BadgeStyle(serverStatus);

  const requestConfirmation = (
    title: string,
    message: string,
    action: () => void | Promise<void>,
    isDanger = false,
    confirmLabel = 'Confirm Action'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      action: async () => {
        if (actionInFlight.current) return;
        actionInFlight.current = true; setActionBusy(true); setRoundError(null);
        try {
          await action();
          await onRefresh();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (error) {
          setRoundError(error instanceof Error ? error.message : 'Round 1 action failed.');
        } finally { actionInFlight.current = false; setActionBusy(false); }
      },
      isDanger,
      confirmLabel,
    });
  };

  const handleGlobalStatusChange = (status: Round1Status) => {
    const actionDescriptions: Record<Round1Status, { title: string; message: string; danger: boolean }> = {
      running: {
        title: 'START ROUND 1',
        message: 'This will initiate Round 1: The Graveyard Escape for all squads. All 3 stages unlock simultaneously.',
        danger: false,
      },
      paused: {
        title: 'PAUSE ROUND 1',
        message: 'This will pause all active sessions across workstations.',
        danger: true,
      },
      completed: {
        title: 'END ROUND 1',
        message: 'This will finalize Round 1 permanently. Squad credit balances will freeze.',
        danger: true,
      },
      not_started: {
        title: 'RESET ROUND 1',
        message: 'Reset Round 1 to staged state.',
        danger: true,
      },
    };

    const config = actionDescriptions[status];
    requestConfirmation(
      config.title,
      config.message,
      async () => {
        setTimerBusy(true); setRoundError(null);
        try {
          const action = status === 'running' ? (serverStatus === 'paused' ? 'resume' : 'start') : status === 'paused' ? 'pause' : 'end';
          await round1Api.timer(action);
          setServerStatus(action === 'start' || action === 'resume' ? 'running' : action === 'pause' ? 'paused' : 'completed');
          setFeedbackNotice(`Round 1 timer ${action === 'start' ? 'started' : action === 'resume' ? 'resumed' : action === 'pause' ? 'paused' : 'ended'} successfully.`);
          setTimeout(() => setFeedbackNotice(null), 3500);
        } catch (error) { setRoundError(error instanceof Error ? error.message : 'Timer action failed.'); throw error; }
        finally { setTimerBusy(false); }
      },
      config.danger,
      config.title
    );
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackNotice && (
        <output
          aria-live="polite"
          className="p-3 rounded-lg bg-cartel-midnight border border-cartel-amber text-cartel-amber text-xs font-cinzel font-bold flex items-center gap-2 animate-fadeIn block"
        >
          <span aria-hidden="true">📜</span>
          <span>{feedbackNotice}</span>
        </output>
      )}
      {roundError && <output role="alert" className="text-xs text-red-300">{roundError}</output>}
      {teamLoadError && <div role="alert" className="rounded border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-200">{teamLoadError}</div>}

      {/* 1. Global Round State Bar */}
      <div className="stone-panel rounded-xl p-5 border border-cartel-frostBorder/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="text-xl" aria-hidden="true">⏱️</span>
            <h2 className="text-lg font-cinzel font-bold text-white tracking-wide">
              ROUND 1 MASTER TIMELINE & CONTROLS
            </h2>
            <output
              aria-live="polite"
              className={`text-[10px] font-cinzel font-black px-2.5 py-0.5 rounded-full border uppercase inline-block ${roundBadge.badgeClass}`}
            >
              {roundBadge.label}
            </output>
          </div>
          <p className="text-xs text-cartel-silver/70 font-sans">
            Central orchestration of Round 1 commencement, pause halts, and round conclusion.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {serverStatus !== 'running' && (
            <button
              type="button"
              disabled={timerBusy}
              onClick={() => handleGlobalStatusChange('running')}
              className="px-3.5 py-2 rounded bg-gradient-to-r from-cartel-pumpkin via-cartel-amber to-cartel-pumpkin text-cartel-void font-cinzel font-black text-xs uppercase tracking-wider shadow-pumpkinGlow hover:scale-102 transition-all cursor-pointer"
            >
              {serverStatus === 'paused' ? 'Resume Round 1' : 'Start Round 1'}
            </button>
          )}

          {serverStatus === 'running' && (
            <button
              type="button"
              disabled={timerBusy}
              onClick={() => handleGlobalStatusChange('paused')}
              className="px-3.5 py-2 rounded bg-amber-600/90 hover:bg-amber-500 text-cartel-void font-cinzel font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Pause Round 1
            </button>
          )}

          {serverStatus !== 'completed' && (
            <button
              type="button"
              disabled={timerBusy}
              onClick={() => handleGlobalStatusChange('completed')}
              className="px-3.5 py-2 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 font-cinzel font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              End Round 1
            </button>
          )}

          {/* Configurable Duration Selector (20 - 25 Mins) */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
            <label htmlFor="duration-select" className="text-[10px] font-cinzel font-bold text-cartel-amber uppercase">
              DURATION:
            </label>
            <select
              id="duration-select"
              value={roundDuration}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTimerBusy(true); setRoundError(null);
                void round1Api.updateAdminConfig('duration', { durationMinutes: val })
                  .then(() => setRoundDuration(val))
                  .catch((error: unknown) => setRoundError(error instanceof Error ? error.message : 'Duration could not be saved.'))
                  .finally(() => setTimerBusy(false));
              }}
              disabled={timerBusy}
              className="bg-cartel-charcoal border border-white/20 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
            >
              <option value={20}>20m</option>
              <option value={21}>21m</option>
              <option value={22}>22m (Default)</option>
              <option value={23}>23m</option>
              <option value={24}>24m</option>
              <option value={25}>25m</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Simultaneous Stages Architectural Blueprint (Section 8 Requirement) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-cinzel font-bold text-cartel-amber uppercase tracking-wider">
            ROUND 1 CHAMBERS — SIMULTANEOUS ACCESS ARCHITECTURE
          </h3>
          <output className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full inline-block">
            NON-SEQUENTIAL UNLOCK VERIFIED
          </output>
        </div>

        <div className="p-3 bg-cartel-midnight/80 rounded-lg border border-white/10 text-xs text-cartel-silver/80 font-sans flex items-start gap-2.5">
          <span className="text-cartel-amber text-base" aria-hidden="true">ℹ️</span>
          <div>
            <strong className="text-white">Tournament Rule Notice:</strong> When Round 1 starts, all three
            stages are accessible to all squads. Squads can enter any chamber, decipher puzzles in parallel,
            or skip stages as their tactical strategy dictates. Skipping forfeits that stage's fixed credits.
          </div>
        </div>

        {/* 3 Chamber Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Stage 1 */}
          <div className="stone-panel rounded-lg p-4 border border-cartel-pumpkin/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-cinzel font-bold text-cartel-pumpkin uppercase">
                CHAMBER 01
              </span>
              <span className="text-xs font-mono font-bold text-cartel-amber bg-cartel-charcoal px-2 py-0.5 rounded border border-cartel-amber/30">
                100 CR
              </span>
            </div>
            <h4 className="text-sm font-cinzel font-bold text-white mb-1">
              The Crypt Chamber
            </h4>
            <p className="text-[11px] text-cartel-silver/70 leading-relaxed font-sans">
              Initial decipher puzzle focusing on crypt symbols and hidden tombstones. Fixed reward: 100 Credits upon completion.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="stone-panel rounded-lg p-4 border border-cartel-amber/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-cinzel font-bold text-cartel-amber uppercase">
                CHAMBER 02
              </span>
              <span className="text-xs font-mono font-bold text-cartel-amber bg-cartel-charcoal px-2 py-0.5 rounded border border-cartel-amber/30">
                150 CR
              </span>
            </div>
            <h4 className="text-sm font-cinzel font-bold text-white mb-1">
              The Mausoleum Decipher
            </h4>
            <p className="text-[11px] text-cartel-silver/70 leading-relaxed font-sans">
              Intermediate riddle involving sarcophagus alignments and spectral runic keys. Fixed reward: 150 Credits upon completion.
            </p>
          </div>

          {/* Stage 3 */}
          <div className="stone-panel rounded-lg p-4 border border-cartel-cyan/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-cinzel font-bold text-cartel-cyan uppercase">
                CHAMBER 03
              </span>
              <span className="text-xs font-mono font-bold text-cartel-cyan bg-cartel-charcoal px-2 py-0.5 rounded border border-cartel-cyan/30">
                250 CR
              </span>
            </div>
            <h4 className="text-sm font-cinzel font-bold text-white mb-1">
              The Arch-Lich Gate
            </h4>
            <p className="text-[11px] text-cartel-silver/70 leading-relaxed font-sans">
              High-difficulty cemetery escape gate cipher. Fixed reward: 250 Credits. Max combined yield: 500 Credits.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Round 1 Chamber Rules & Puzzle Configuration */}
      <AdminStageConfigPanel />

      {/* 4. Server-authoritative team progression */}
      <div className="stone-panel rounded-xl p-5 border border-white/10 shadow-xl space-y-4">
        <div className="pb-3 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-cinzel font-bold text-white uppercase">Move a team forward / Direct Round Jump</h3>
            <p className="mt-1 text-xs text-cartel-silver/70">Progress any team to Round 4 or another round directly. Prior rounds are auto-completed.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => {
                requestConfirmation(
                  '⚡ ADVANCE ALL SQUADS TO ROUND 4',
                  'Are you sure you want to advance EVERY squad across the tournament directly to Round 4: The Campus Expedition? This will auto-qualify all squads, assign campus routes, and unseal Round 4.',
                  async () => {
                    const res = await progressionService.adminRound4Global('advance', 'Admin advanced all squads directly to Round 4');
                    setFeedbackNotice(`⚡ Successfully advanced all squads to Round 4! (${res.updatedCount} squads updated)`);
                    setTimeout(() => setFeedbackNotice(null), 4000);
                  },
                  false,
                  'Advance All to Round 4'
                );
              }}
              className="px-3.5 py-1.5 rounded bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-black font-cinzel font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all cursor-pointer disabled:opacity-50"
            >
              ⚡ Advance All to Round 4
            </button>
            {teams.length > 0 && (
              <div className="flex items-center gap-1.5">
                <label htmlFor="squad-select-control" className="text-xs font-cinzel font-bold text-cartel-amber uppercase">
                  Squad:
                </label>
                <select
                  id="squad-select-control"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="bg-cartel-charcoal border border-white/20 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.currentRound})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        {teams.length === 0 && !teamLoadError && <p role="status" className="text-xs text-cartel-silver/60">Loading teams…</p>}
        {selectedTeam && <AdminProgressionControls key={selectedTeam.id} teamId={selectedTeam.id} teamName={selectedTeam.name} onProgressChanged={onRefresh} />}
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
        confirmLabel={confirmModal.confirmLabel}
        isSubmitting={actionBusy}
        errorMessage={roundError}
      />
    </div>
  );
};
