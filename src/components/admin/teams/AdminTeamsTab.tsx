import React, { useState } from 'react';
import type { AdminTeam, TeamStatus } from '../../../types/team.types';
import { adminService } from '../../../services/adminService';
import { CreateTeamModal } from './CreateTeamModal';
import { TeamDetailsModal } from './TeamDetailsModal';
import { EditTeamNameModal } from './EditTeamNameModal';
import { ConfirmationModal } from '../shared/ConfirmationModal';

interface AdminTeamsTabProps {
  onRefreshMetrics: () => void;
  onNavigateToRoundControl: (teamId?: string) => void;
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

function formatTime(timestamp: string | null): string {
  if (!timestamp) return '—';
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return timestamp;
  }
}

export const AdminTeamsTab: React.FC<AdminTeamsTabProps> = ({
  onRefreshMetrics,
  onNavigateToRoundControl,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<AdminTeam | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ team: AdminTeam; action: 'reset' | 'demote' } | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Fetch data
  const { teams, totalCount, totalPages } = adminService.getTeams(
    search,
    statusFilter,
    page,
    pageSize
  );

  const handleRefresh = () => {
    onRefreshMetrics();
  };

  const confirmTeamAction = () => {
    if (!pendingAction) return;
    const result = pendingAction.action === 'reset'
      ? adminService.resetTeamProgress(pendingAction.team.id)
      : adminService.demoteTeamToPreviousRound(pendingAction.team.id);
    setPendingAction(null);
    setActionNotice(result.message);
    handleRefresh();
  };

  return (
    <div className="space-y-4">
      {actionNotice && (
        <output
          aria-live="polite"
          className="block rounded-lg border border-cartel-amber/40 bg-cartel-midnight/80 px-4 py-2 text-xs font-cinzel text-cartel-amber"
        >
          {actionNotice}
        </output>
      )}
      {/* Action and Filter Header */}
      <div className="stone-panel rounded-xl p-4 border border-cartel-frostBorder/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search by team name */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-cartel-silver/50 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={search}
              aria-label="Search teams by callsign"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search team name..."
              className="w-full pl-8 pr-3 py-1.5 bg-cartel-charcoal border border-cartel-frostBorder/50 rounded text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            aria-label="Filter teams by status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-cartel-charcoal border border-cartel-frostBorder/50 rounded text-cartel-silver font-cinzel text-xs focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="waiting">Waiting</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>

          <span className="text-xs font-mono text-cartel-silver/60">
            <span>Showing: </span><strong className="text-white">{teams.length}</strong><span> of {totalCount} squads</span>
          </span>
        </div>

        {/* Create Team CTA */}
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded bg-gradient-to-r from-cartel-pumpkin via-cartel-amber to-cartel-pumpkin text-cartel-void font-cinzel font-black text-xs uppercase tracking-wider shadow-pumpkinGlow hover:scale-102 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          + Create Team
        </button>
      </div>

      {/* Team Table */}
      <div className="stone-panel rounded-xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cartel-midnight/90 text-cartel-silver font-cinzel text-[11px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-3.5">Team Name</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Round</th>
                <th className="py-3 px-3">Stage</th>
                <th className="py-3 px-3">Round Start</th>
                <th className="py-3 px-3">Stage Start</th>
                <th className="py-3 px-3">Round End</th>
                <th className="py-3 px-3 text-right">Credits</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-cartel-silver/50 font-mono">
                    No teams match current search and status filters.
                  </td>
                </tr>
              ) : (
                teams.map((team) => {
                  const badgeClass = getTeamStatusBadgeClass(team.status);
                  return (
                    <tr
                      key={team.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-cinzel font-bold text-white">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm" aria-hidden="true">💀</span>
                          <span>{team.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block text-[9px] font-cinzel font-bold px-2 py-0.5 rounded-full border uppercase ${badgeClass}`}
                        >
                          {team.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-cartel-silver text-[11px]">
                        {team.currentRound}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-cartel-amber text-[11px] uppercase">
                        {team.currentStage}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-cartel-silver/70 text-[11px]">
                        {formatTime(team.roundStartTime)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-cartel-silver/70 text-[11px]">
                        {formatTime(team.stageStartTime)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-cartel-silver/70 text-[11px]">
                        {formatTime(team.roundEndTime)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-cartel-pumpkin text-right text-[11px]">
                        {team.credits} CR
                      </td>
                      <td className="py-2.5 px-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeam(team);
                            setIsDetailsOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-cartel-charcoal hover:bg-white/10 text-cartel-cyan font-cinzel text-[10px] font-bold border border-cartel-cyan/30 cursor-pointer"
                          title="View complete squad details"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeam(team);
                            setIsEditNameOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-cartel-charcoal hover:bg-white/10 text-white font-cinzel text-[10px] font-bold border border-white/20 cursor-pointer"
                          title="Edit team callsign"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingAction({ team, action: 'reset' })}
                          className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900/70 text-red-200 font-cinzel text-[10px] font-bold border border-red-500/30 cursor-pointer"
                          title="Reset all progress and credits to the beginning of Round 1"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingAction({ team, action: 'demote' })}
                          disabled={team.currentRound === 'Round 1'}
                          className="px-2 py-1 rounded bg-cartel-charcoal hover:bg-white/10 text-cartel-amber font-cinzel text-[10px] font-bold border border-cartel-amber/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title={team.currentRound === 'Round 1' ? 'Already in the first round' : 'Move back one round'}
                        >
                          Demote
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateToRoundControl(team.id)}
                          className="px-2 py-1 rounded bg-cartel-charcoal hover:bg-cartel-pumpkin/20 text-cartel-pumpkin font-cinzel text-[10px] font-bold border border-cartel-pumpkin/40 cursor-pointer"
                          title="Move squad to stage / round"
                        >
                          Move →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-cartel-silver/70 bg-cartel-midnight/30">
            <div>
              <span>Page</span> {page} <span>of</span> {totalPages}
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-cartel-charcoal border border-white/10 text-white disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded bg-cartel-charcoal border border-white/10 text-white disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTeamModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleRefresh}
      />

      <TeamDetailsModal
        team={selectedTeam}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTeam(null);
        }}
      />

      <EditTeamNameModal
        team={selectedTeam}
        isOpen={isEditNameOpen}
        onClose={() => {
          setIsEditNameOpen(false);
          setSelectedTeam(null);
        }}
        onSuccess={handleRefresh}
      />

      <ConfirmationModal
        isOpen={pendingAction !== null}
        title={pendingAction?.action === 'reset' ? 'RESET TEAM PROGRESS' : 'DEMOTE TEAM'}
        message={pendingAction?.action === 'reset'
          ? `Reset ${pendingAction.team.name} to Round 1, Stage 1? This clears its stage progress, earned credits, and Round 1 game state.`
          : `Move ${pendingAction?.team.name} back to Round 1, Stage 3? Earned credits and completed-stage records will be preserved.`}
        confirmLabel={pendingAction?.action === 'reset' ? 'Reset Progress' : 'Demote'}
        isDanger={pendingAction?.action === 'reset'}
        onConfirm={confirmTeamAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
};
