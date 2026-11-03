import React, { useState } from 'react';
import type { DashboardMetrics, Round1Status } from '../../../types/admin';
import { adminService } from '../../../services/adminService';
import { ConfirmationModal } from '../shared/ConfirmationModal';

interface AdminDashboardTabProps {
  metrics: DashboardMetrics;
  onRefresh: () => void;
  onNavigateToTeams: () => void;
  onNavigateToRoundControl: () => void;
}

function getRound1BadgeStyle(status: Round1Status): { label: string; badgeClass: string; icon: string } {
  switch (status) {
    case 'running':
      return {
        label: 'RUNNING • ACTIVE',
        badgeClass: 'bg-emerald-950/80 border-emerald-500/70 text-emerald-400',
        icon: '⚔️',
      };
    case 'paused':
      return {
        label: 'PAUSED • HALTED',
        badgeClass: 'bg-amber-950/80 border-amber-500/70 text-amber-400',
        icon: '⏸️',
      };
    case 'completed':
      return {
        label: 'COMPLETED • CLOSED',
        badgeClass: 'bg-cyan-950/80 border-cyan-500/70 text-cyan-400',
        icon: '🏆',
      };
    default:
      return {
        label: 'NOT STARTED • STAGED',
        badgeClass: 'bg-cartel-charcoal border-white/20 text-cartel-silver',
        icon: '⏳',
      };
  }
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  metrics,
  onRefresh,
  onNavigateToTeams,
  onNavigateToRoundControl,
}) => {
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

  const roundBadge = getRound1BadgeStyle(metrics.round1Status);

  const requestAction = (
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

  const handleStart = () => {
    requestAction(
      'COMMENCE ROUND 1',
      'This will unlock Round 1: The Graveyard Escape for all waiting teams and initialize their session clocks. Are you ready to commence?',
      () => adminService.updateRound1Status('running'),
      false,
      'Start Round 1'
    );
  };

  const handlePause = () => {
    requestAction(
      'PAUSE ROUND 1 GLOBALLY',
      'This will immediately pause active gameplay across all squad stations and flag them as paused. Confirm global pause?',
      () => adminService.updateRound1Status('paused'),
      true,
      'Pause Round 1'
    );
  };

  const handleResume = () => {
    requestAction(
      'RESUME ROUND 1 GLOBALLY',
      'This will resume gameplay across all paused workstations and restore the active status. Resume Round 1?',
      () => adminService.updateRound1Status('running'),
      false,
      'Resume Round 1'
    );
  };

  const handleEnd = () => {
    requestAction(
      'END ROUND 1 (PERMANENT)',
      'This will conclude Round 1 for all teams, freeze final credit tallies, and finalize the stage records. This action cannot be reversed without manual override.',
      () => adminService.updateRound1Status('completed'),
      true,
      'End Round 1'
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Global Round 1 Status Hero Card */}
      <div className="stone-panel rounded-xl p-5 border border-cartel-frostBorder/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="text-xl" aria-hidden="true">{roundBadge.icon}</span>
            <h2 className="text-lg font-cinzel font-bold text-white tracking-wide">
              ROUND 01 — THE GRAVEYARD ESCAPE
            </h2>
            <output
              aria-live="polite"
              className={`text-[10px] font-cinzel font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider inline-block ${roundBadge.badgeClass}`}
            >
              {roundBadge.label}
            </output>
          </div>
          <p className="text-xs text-cartel-silver/70 font-sans max-w-xl">
            Stage duration: 20–25 minutes. Maximum reward: 500 Credits. When active, all three
            chambers unlock simultaneously for all squads.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {metrics.round1Status === 'not_started' && (
            <button
              type="button"
              onClick={handleStart}
              className="px-4 py-2 rounded bg-gradient-to-r from-cartel-pumpkin via-cartel-amber to-cartel-pumpkin text-cartel-void font-cinzel font-black text-xs uppercase tracking-wider shadow-pumpkinGlow hover:scale-102 transition-all cursor-pointer"
            >
              Start Round 1
            </button>
          )}

          {metrics.round1Status === 'running' && (
            <>
              <button
                type="button"
                onClick={handlePause}
                className="px-3.5 py-2 rounded bg-amber-600/90 hover:bg-amber-500 text-cartel-void font-cinzel font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Pause Round 1
              </button>
              <button
                type="button"
                onClick={handleEnd}
                className="px-3.5 py-2 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 font-cinzel font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                End Round 1
              </button>
            </>
          )}

          {metrics.round1Status === 'paused' && (
            <>
              <button
                type="button"
                onClick={handleResume}
                className="px-4 py-2 rounded bg-gradient-to-r from-cartel-pumpkin via-cartel-amber to-cartel-pumpkin text-cartel-void font-cinzel font-black text-xs uppercase tracking-wider shadow-pumpkinGlow hover:scale-102 transition-all cursor-pointer"
              >
                Resume Round 1
              </button>
              <button
                type="button"
                onClick={handleEnd}
                className="px-3.5 py-2 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 font-cinzel font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                End Round 1
              </button>
            </>
          )}

          {metrics.round1Status === 'completed' && (
            <button
              type="button"
              onClick={onNavigateToRoundControl}
              className="px-4 py-2 rounded bg-cartel-charcoal hover:bg-white/10 border border-cartel-cyan/40 text-cartel-cyan font-cinzel font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Manage Round 2 Transfer
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Grid (7 Required Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Teams */}
        <div
          onClick={onNavigateToTeams}
          className="stone-panel rounded-lg p-3.5 border border-white/10 hover:border-cartel-amber/50 cursor-pointer transition-all"
        >
          <div className="text-[10px] font-cinzel text-cartel-silver/60 uppercase">TOTAL TEAMS</div>
          <div className="text-2xl font-mono font-bold text-white mt-1">{metrics.totalTeams}</div>
          <div className="text-[10px] text-cartel-silver/50 font-sans mt-0.5">Capacity: 70 squads</div>
        </div>

        {/* Active Sessions */}
        <div className="stone-panel rounded-lg p-3.5 border border-white/10">
          <div className="text-[10px] font-cinzel text-cartel-silver/60 uppercase">ACTIVE SESSIONS</div>
          <div className="text-2xl font-mono font-bold text-cartel-cyan mt-1">
            {metrics.totalActiveSessions}
          </div>
          <div className="text-[10px] text-cartel-silver/50 font-sans mt-0.5">Dual-player sync</div>
        </div>

        {/* Waiting Teams */}
        <div
          onClick={onNavigateToTeams}
          className="stone-panel rounded-lg p-3.5 border border-white/10 hover:border-white/20 cursor-pointer transition-all"
        >
          <div className="text-[10px] font-cinzel text-cartel-silver/60 uppercase">WAITING</div>
          <div className="text-2xl font-mono font-bold text-cartel-silver mt-1">
            {metrics.waitingTeams}
          </div>
          <div className="text-[10px] text-cartel-silver/50 font-sans mt-0.5">Staged for entry</div>
        </div>

        {/* Active Teams */}
        <div
          onClick={onNavigateToTeams}
          className="stone-panel rounded-lg p-3.5 border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-all"
        >
          <div className="text-[10px] font-cinzel text-cartel-silver/60 uppercase">ACTIVE TEAMS</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {metrics.activeTeams}
          </div>
          <div className="text-[10px] text-emerald-400/60 font-sans mt-0.5">In chambers</div>
        </div>

        {/* Paused Teams */}
        <div
          onClick={onNavigateToTeams}
          className="stone-panel rounded-lg p-3.5 border border-white/10 hover:border-amber-500/50 cursor-pointer transition-all"
        >
          <div className="text-[10px] font-cinzel text-cartel-silver/60 uppercase">PAUSED</div>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
            {metrics.pausedTeams}
          </div>
          <div className="text-[10px] text-amber-400/60 font-sans mt-0.5">Temporarily held</div>
        </div>

        {/* Completed Teams */}
        <div
          onClick={onNavigateToTeams}
          className="stone-panel rounded-lg p-3.5 border border-cartel-pumpkin/30 hover:border-cartel-pumpkin cursor-pointer transition-all"
        >
          <div className="text-[10px] font-cinzel text-cartel-silver/60 uppercase">COMPLETED</div>
          <div className="text-2xl font-mono font-bold text-cartel-pumpkin mt-1">
            {metrics.completedTeams}
          </div>
          <div className="text-[10px] text-cartel-pumpkin/60 font-sans mt-0.5">Escaped cemetery</div>
        </div>
      </div>

      {/* 3. Operational Quick Guidance Strip */}
      <div className="p-4 bg-cartel-midnight/80 rounded-lg border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-cartel-silver/80">
          <span className="text-base text-cartel-amber" aria-hidden="true">⚙️</span>
          <span>
            <strong className="text-white">Admin Command: </strong>To move squads between chambers or
            advance them to Round 2 (The Haunted Auction), use the <strong className="text-cartel-amber">Round Control</strong> tab.
          </span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={onNavigateToTeams}
            className="px-3 py-1.5 rounded bg-cartel-charcoal hover:bg-white/10 border border-white/15 text-white font-cinzel text-[11px] font-semibold cursor-pointer transition-colors"
          >
            Manage Squads →
          </button>
          <button
            type="button"
            onClick={onNavigateToRoundControl}
            className="px-3 py-1.5 rounded bg-cartel-charcoal hover:bg-white/10 border border-cartel-amber/40 text-cartel-amber font-cinzel text-[11px] font-semibold cursor-pointer transition-colors"
          >
            Round Control →
          </button>
        </div>
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
