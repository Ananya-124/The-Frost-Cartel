import React, { useState } from 'react';
import type { AdminTeam, Round1Status, StageId } from '../../../types/admin';
import { STAGE_NAMES } from '../../../constants/rounds.constants';
import { adminService } from '../../../services/adminService';
import { round1Service } from '../../../services/round1Service';
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
  const { teams } = adminService.getTeams('', 'all', 1, 100);

  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    preselectedTeamId || (teams[0]?.id ?? '')
  );
  const [roundDuration, setRoundDuration] = useState<number>(() => round1Service.getDurationMinutes());
  const [targetDestination, setTargetDestination] = useState<StageId | 'round-2'>('stage-1');
  const [movementReason, setMovementReason] = useState('Administrator realignment');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    isDanger?: boolean;
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  const selectedTeam: AdminTeam | undefined = teams.find((t) => t.id === selectedTeamId);
  const roundBadge = getRound1BadgeStyle(round1Status);

  const requestConfirmation = (
    title: string,
    message: string,
    action: () => void,
    isDanger = false,
    confirmLabel = 'Confirm Action'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      action: () => {
        action();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        onRefresh();
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
      () => {
        const res = adminService.updateRound1Status(status);
        setFeedbackNotice(res.message);
        setTimeout(() => setFeedbackNotice(null), 3500);
      },
      config.danger,
      config.title
    );
  };

  const handleExecuteMove = () => {
    if (!selectedTeam) return;

    if (targetDestination === 'round-2') {
      requestConfirmation(
        `TRANSFER SQUAD TO ROUND 2`,
        `Are you sure you want to transfer "${selectedTeam.name}" to Round 2: The Haunted Auction? Their earned balance of ${selectedTeam.credits} credits will carry over intact.`,
        () => {
          const res = adminService.moveTeamToRound2(selectedTeam.id);
          setFeedbackNotice(res.message);
          setTimeout(() => setFeedbackNotice(null), 3500);
        },
        false,
        'Transfer to Round 2'
      );
    } else {
      const destinationName = STAGE_NAMES[targetDestination as StageId];
      requestConfirmation(
        `STAGE MOVEMENT: ${selectedTeam.name}`,
        `Move "${selectedTeam.name}" from [${selectedTeam.currentStage}] to [${destinationName}]? Earned credits will be preserved; completion credits are NOT automatically awarded.`,
        () => {
          const res = adminService.moveTeamStage(
            selectedTeam.id,
            targetDestination,
            movementReason.trim() || 'Administrator realignment'
          );
          setFeedbackNotice(res.message);
          setTimeout(() => setFeedbackNotice(null), 3500);
        },
        false,
        'Move Squad'
      );
    }
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
          {round1Status !== 'running' && (
            <button
              type="button"
              onClick={() => handleGlobalStatusChange('running')}
              className="px-3.5 py-2 rounded bg-gradient-to-r from-cartel-pumpkin via-cartel-amber to-cartel-pumpkin text-cartel-void font-cinzel font-black text-xs uppercase tracking-wider shadow-pumpkinGlow hover:scale-102 transition-all cursor-pointer"
            >
              {round1Status === 'paused' ? 'Resume Round 1' : 'Start Round 1'}
            </button>
          )}

          {round1Status === 'running' && (
            <button
              type="button"
              onClick={() => handleGlobalStatusChange('paused')}
              className="px-3.5 py-2 rounded bg-amber-600/90 hover:bg-amber-500 text-cartel-void font-cinzel font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Pause Round 1
            </button>
          )}

          {round1Status !== 'completed' && (
            <button
              type="button"
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
                setRoundDuration(val);
                round1Service.setDurationMinutes(val);
              }}
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

      {/* 4. Manual Team Stage & Round Movement Console */}
      <div className="stone-panel rounded-xl p-5 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <span className="text-base text-cartel-amber" aria-hidden="true">⚙️</span>
            <h3 className="text-sm font-cinzel font-bold text-white tracking-wide uppercase">
              MANUAL SQUAD STAGE REALIGNMENT & ROUND 2 TRANSFER
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cartel-silver/50">
            ADMINISTRATOR PRIVILEGED ACTION
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          {/* Select Squad */}
          <div className="md:col-span-4">
            <label
              htmlFor="select-team-dropdown"
              className="block text-[10px] font-cinzel font-bold text-cartel-amber uppercase mb-1"
            >
              SELECT OPERATIVE SQUAD
            </label>
            <select
              id="select-team-dropdown"
              name="selectedTeam"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-3 py-2 bg-cartel-charcoal border border-cartel-frostBorder/50 rounded text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin cursor-pointer"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.currentRound} • {t.currentStage} • {t.credits} CR)
                </option>
              ))}
            </select>
          </div>

          {/* Target Destination */}
          <div className="md:col-span-4">
            <label
              htmlFor="target-destination-dropdown"
              className="block text-[10px] font-cinzel font-bold text-cartel-amber uppercase mb-1"
            >
              TARGET DESTINATION
            </label>
            <select
              id="target-destination-dropdown"
              name="targetDestination"
              value={targetDestination}
              onChange={(e) => setTargetDestination(e.target.value as StageId | 'round-2')}
              className="w-full px-3 py-2 bg-cartel-charcoal border border-cartel-frostBorder/50 rounded text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin cursor-pointer"
            >
              <option value="stage-1">Stage 1: The Crypt Chamber (100 CR)</option>
              <option value="stage-2">Stage 2: The Mausoleum Decipher (150 CR)</option>
              <option value="stage-3">Stage 3: The Arch-Lich Gate (250 CR)</option>
              <option value="round-2">Round 2: The Haunted Auction (Transfer)</option>
            </select>
          </div>

          {/* Reason / Note */}
          <div className="md:col-span-2">
            <label
              htmlFor="movement-reason-input"
              className="block text-[10px] font-cinzel font-bold text-cartel-silver uppercase mb-1"
            >
              REASON NOTE
            </label>
            <input
              id="movement-reason-input"
              name="movementReason"
              type="text"
              value={movementReason}
              onChange={(e) => setMovementReason(e.target.value)}
              placeholder="e.g. Workstation reset"
              className="w-full px-2.5 py-2 bg-cartel-charcoal border border-white/10 rounded text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin"
            />
          </div>

          {/* Execute Button */}
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={handleExecuteMove}
              disabled={!selectedTeam}
              aria-label="Execute stage movement or transfer"
              className="w-full py-2.5 px-3 rounded bg-gradient-to-r from-cartel-pumpkin via-cartel-amber to-cartel-pumpkin text-cartel-void font-cinzel font-black text-xs uppercase tracking-wider shadow-pumpkinGlow hover:scale-102 transition-all cursor-pointer disabled:opacity-50"
            >
              Execute Move →
            </button>
          </div>
        </div>

        {/* Source vs Destination preview */}
        {selectedTeam && (
          <div className="p-3 bg-cartel-midnight/50 rounded border border-white/5 flex flex-wrap items-center justify-between text-xs font-mono gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-cartel-silver/60">Source Stage:</span>
              <span className="text-cartel-amber font-bold uppercase">
                {selectedTeam.currentStage} ({selectedTeam.currentRound})
              </span>
              <span className="text-cartel-silver/30" aria-hidden="true">→</span>
              <span className="text-cartel-silver/60">Destination:</span>
              <span className="text-emerald-400 font-bold uppercase">
                {targetDestination === 'round-2'
                  ? 'Round 2: The Haunted Auction'
                  : STAGE_NAMES[targetDestination as StageId]}
              </span>
            </div>
            <div className="text-[11px] text-cartel-silver/60">
              Current balance preserved: <strong className="text-white">{selectedTeam.credits} CR</strong>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
        confirmLabel={confirmModal.confirmLabel}
      />
    </div>
  );
};
