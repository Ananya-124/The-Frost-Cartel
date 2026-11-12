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
  const [round2Active, setRound2Active] = useState(false);
  const [round3Active, setRound3Active] = useState(false);
  const [round4Active, setRound4Active] = useState(false);
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

  useEffect(() => {
    let active = true;
    if (selectedTeamId) {
      void progressionService.getAdminTeam(selectedTeamId).then((data) => {
        if (!active) return;
        const r2 = data.rounds.find((r) => r.round_id === 2);
        setRound2Active(r2?.status === 'AVAILABLE' || r2?.status === 'IN_PROGRESS');
        const r3 = data.rounds.find((r) => r.round_id === 3);
        setRound3Active(r3?.status === 'AVAILABLE' || r3?.status === 'IN_PROGRESS');
        const r4 = data.rounds.find((r) => r.round_id === 4);
        setRound4Active(r4?.status === 'AVAILABLE' || r4?.status === 'IN_PROGRESS');
      }).catch(() => undefined);
    }
    return () => { active = false; };
  }, [selectedTeamId]);

  const handleGlobalRound2Action = (action: 'unlock' | 'lock') => {
    requestConfirmation(
      action === 'unlock' ? 'UNLOCK ROUND 2 FOR ALL SQUADS' : 'LOCK ROUND 2 FOR ALL SQUADS',
      action === 'unlock'
        ? 'This will unlock Round 2: The Haunted Auction for ALL squads across the tournament simultaneously.'
        : 'This will lock Round 2 for all squads.',
      async () => {
        setTimerBusy(true); setRoundError(null);
        try {
          const res = await progressionService.adminRound2Global(action);
          setRound2Active(res.isActive);
          setFeedbackNotice(`Round 2 ${action === 'unlock' ? 'unlocked' : 'locked'} for all squads across the tournament.`);
          setTimeout(() => setFeedbackNotice(null), 4000);
          await onRefresh();
        } catch (error) {
          setRoundError(error instanceof Error ? error.message : `Round 2 ${action} failed.`);
          throw error;
        } finally {
          setTimerBusy(false);
        }
      },
      action === 'lock',
      action === 'unlock' ? 'UNLOCK FOR ALL SQUADS' : 'LOCK ROUND 2'
    );
  };

  const handleGlobalRound3Action = (action: 'advance' | 'lock') => {
    requestConfirmation(
      action === 'lock' ? 'LOCK ROUND 3 FOR ALL SQUADS' : 'ADVANCE ALL SQUADS TO ROUND 3 (SYNC AUCTION CARDS)',
      action === 'lock'
        ? 'This will lock Round 3 for all squads across the tournament.'
        : 'This will complete Round 2, transfer all won auction cards into each squad\'s Round 3 inventory, and unlock Round 3 (Paradox Hunt) for ALL squads across the tournament.',
      async () => {
        setTimerBusy(true); setRoundError(null);
        try {
          const res = await progressionService.adminRound3Global(action);
          setRound3Active(res.isActive);
          if (res.isActive) {
            setFeedbackNotice(`Advanced all squads to Round 3! Synced ${res.cardsSynced} auction cards into squad inventories.`);
          } else {
            setFeedbackNotice('Round 3 locked for all squads.');
          }
          setTimeout(() => setFeedbackNotice(null), 4000);
          await onRefresh();
        } catch (error) {
          setRoundError(error instanceof Error ? error.message : `Round 3 ${action} failed.`);
          throw error;
        } finally {
          setTimerBusy(false);
        }
      },
      action === 'lock',
      action === 'lock' ? 'LOCK ROUND 3' : 'ADVANCE TO ROUND 3'
    );
  };

  const handleGlobalRound4Action = (action: 'advance' | 'lock') => {
    requestConfirmation(
      action === 'lock' ? 'LOCK ROUND 4 FOR ALL SQUADS' : 'ADVANCE ALL SQUADS TO ROUND 4',
      action === 'lock'
        ? 'This will lock Round 4 for all squads.'
        : 'This will finalize Round 3 and unlock Round 4 (The Campus Expedition) for ALL squads across the tournament.',
      async () => {
        setTimerBusy(true); setRoundError(null);
        try {
          const res = await progressionService.adminRound4Global(action);
          setRound4Active(res.isActive);
          setFeedbackNotice(`Round 4 ${res.isActive ? 'unlocked' : 'locked'} for all squads across the tournament.`);
          setTimeout(() => setFeedbackNotice(null), 4000);
          await onRefresh();
        } catch (error) {
          setRoundError(error instanceof Error ? error.message : `Round 4 ${action} failed.`);
          throw error;
        } finally {
          setTimerBusy(false);
        }
      },
      action === 'lock',
      action === 'lock' ? 'LOCK ROUND 4' : 'ADVANCE TO ROUND 4'
    );
  };

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

      {/* Round 2 Tournament Master Orchestration Bar */}
      <div className="stone-panel rounded-xl p-5 border border-cartel-cyan/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="text-xl" aria-hidden="true">🏛️</span>
            <h2 className="text-lg font-cinzel font-bold text-white tracking-wide">
              ROUND 2 MASTER CONTROLS — THE HAUNTED AUCTION
            </h2>
            <output
              aria-live="polite"
              className={`text-[10px] font-cinzel font-black px-2.5 py-0.5 rounded-full border uppercase inline-block ${
                round2Active
                  ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-400'
                  : 'bg-cartel-charcoal border-white/20 text-cartel-silver'
              }`}
            >
              {round2Active ? 'ACTIVE • UNLOCKED FOR ALL SQUADS' : 'LOCKED • ALL SQUADS'}
            </output>
          </div>
          <p className="text-xs text-cartel-silver/70 font-sans">
            Round 2 is a shared tournament auction. Unlocking it automatically grants Round 2 access to all tournament squads simultaneously.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {!round2Active ? (
            <button
              type="button"
              disabled={timerBusy || actionBusy}
              onClick={() => handleGlobalRound2Action('unlock')}
              className="px-4 py-2 rounded bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-40 transition-all"
            >
              🔓 UNLOCK ROUND 2 (ALL SQUADS)
            </button>
          ) : (
            <button
              type="button"
              disabled={timerBusy || actionBusy}
              onClick={() => handleGlobalRound2Action('lock')}
              className="px-4 py-2 rounded bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-40 transition-all"
            >
              🔒 LOCK ROUND 2 (ALL SQUADS)
            </button>
          )}
        </div>
      </div>

      {/* Round 3 Tournament Master Orchestration Bar */}
      <div className="stone-panel rounded-xl p-5 border border-purple-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="text-xl" aria-hidden="true">⏳</span>
            <h2 className="text-lg font-cinzel font-bold text-white tracking-wide">
              ROUND 3 MASTER CONTROLS — THE PARADOX HUNT
            </h2>
            <output
              aria-live="polite"
              className={`text-[10px] font-cinzel font-black px-2.5 py-0.5 rounded-full border uppercase inline-block ${
                round3Active
                  ? 'bg-purple-950/80 border-purple-500/70 text-purple-300'
                  : 'bg-cartel-charcoal border-white/20 text-cartel-silver'
              }`}
            >
              {round3Active ? 'ACTIVE • UNLOCKED FOR ALL SQUADS' : 'LOCKED • ALL SQUADS'}
            </output>
          </div>
          <p className="text-xs text-cartel-silver/70 font-sans">
            Advancing to Round 3 finalizes Round 2, transfers all won auction power cards into each squad's Round 3 inventory, and unlocks Paradox Hunt for all squads.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {!round3Active ? (
            <button
              type="button"
              disabled={timerBusy || actionBusy}
              onClick={() => handleGlobalRound3Action('advance')}
              className="px-4 py-2 rounded bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-cinzel font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer disabled:opacity-40 transition-all"
            >
              🔓 ADVANCE ALL SQUADS TO ROUND 3 (SYNC AUCTION CARDS)
            </button>
          ) : (
            <button
              type="button"
              disabled={timerBusy || actionBusy}
              onClick={() => handleGlobalRound3Action('lock')}
              className="px-4 py-2 rounded bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-40 transition-all"
            >
              🔒 LOCK ROUND 3 (ALL SQUADS)
            </button>
          )}
        </div>
      </div>

      {/* Round 4 Tournament Master Orchestration Bar */}
      <div className="stone-panel rounded-xl p-5 border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="text-xl" aria-hidden="true">📜</span>
            <h2 className="text-lg font-cinzel font-bold text-white tracking-wide">
              ROUND 4 MASTER CONTROLS — THE CAMPUS EXPEDITION
            </h2>
            <output
              aria-live="polite"
              className={`text-[10px] font-cinzel font-black px-2.5 py-0.5 rounded-full border uppercase inline-block ${
                round4Active
                  ? 'bg-amber-950/80 border-amber-500/70 text-amber-300'
                  : 'bg-cartel-charcoal border-white/20 text-cartel-silver'
              }`}
            >
              {round4Active ? 'ACTIVE • UNLOCKED FOR ALL SQUADS' : 'LOCKED • ALL SQUADS'}
            </output>
          </div>
          <p className="text-xs text-cartel-silver/70 font-sans">
            Unlocks the final physical campus expedition chamber and releases puzzle routes for all squads.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {!round4Active ? (
            <button
              type="button"
              disabled={timerBusy || actionBusy}
              onClick={() => handleGlobalRound4Action('advance')}
              className="px-4 py-2 rounded bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-cinzel font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer disabled:opacity-40 transition-all"
            >
              🔓 ADVANCE ALL SQUADS TO ROUND 4
            </button>
          ) : (
            <button
              type="button"
              disabled={timerBusy || actionBusy}
              onClick={() => handleGlobalRound4Action('lock')}
              className="px-4 py-2 rounded bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-40 transition-all"
            >
              🔒 LOCK ROUND 4 (ALL SQUADS)
            </button>
          )}
        </div>
      </div>

      {/* 4. Server-authoritative team progression */}
      <div className="stone-panel rounded-xl p-5 border border-white/10 shadow-xl space-y-4">
        <div className="pb-3 border-b border-white/10">
          <h3 className="text-sm font-cinzel font-bold text-white uppercase">Team round and hunt progression</h3>
          <p className="mt-1 text-xs text-cartel-silver/70">Changes are recorded through the authenticated progression API. Round 2 is unlocked globally for all squads via the controls above or via individual squad controls.</p>
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
