import React, { useState } from 'react';
import type { AdminTeam, TeamStatus } from '../../../types/team.types';
import { adminService } from '../../../services/adminService';
import { TeamDetailsModal } from '../teams/TeamDetailsModal';

export const AdminResultsTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState<AdminTeam | null>(null);

  const results = adminService.getResults(search, statusFilter);

  const handleExportCSV = () => {
    const csvContent = adminService.exportResultsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `frost_cartel_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: TeamStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-cyan-950/80 border-cyan-500/60 text-cyan-400';
      case 'active':
        return 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400';
      case 'paused':
        return 'bg-amber-950/80 border-amber-500/60 text-amber-400';
      default:
        return 'bg-cartel-charcoal border-white/20 text-cartel-silver';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Export Toolbar */}
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
              aria-label="Filter leaderboard by team name"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by team name..."
              className="w-full pl-8 pr-3 py-1.5 bg-cartel-charcoal border border-cartel-frostBorder/50 rounded text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            aria-label="Filter results by status"
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-cartel-charcoal border border-cartel-frostBorder/50 rounded text-cartel-silver font-cinzel text-xs focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin cursor-pointer"
          >
            <option value="all">All Round Statuses</option>
            <option value="completed">Completed Only</option>
            <option value="active">Active Only</option>
            <option value="paused">Paused Only</option>
            <option value="waiting">Waiting Only</option>
          </select>

          <span className="text-xs font-mono text-cartel-silver/60">
            <span>Rankings: </span><strong className="text-white">{results.length}</strong><span> squads</span>
          </span>
        </div>

        {/* CSV Export CTA */}
        <button
          type="button"
          onClick={handleExportCSV}
          className="px-4 py-2 rounded bg-cartel-charcoal hover:bg-white/10 border border-cartel-cyan/50 text-cartel-cyan font-cinzel font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <span aria-hidden="true">📥</span>
          <span>Export Results (CSV)</span>
        </button>
      </div>

      {/* Standings Table */}
      <div className="stone-panel rounded-xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cartel-midnight/90 text-cartel-silver font-cinzel text-[11px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">Rank</th>
                <th className="py-3 px-3.5">Team Name</th>
                <th className="py-3 px-3 text-right">Stage 1 (100 CR)</th>
                <th className="py-3 px-3 text-right">Stage 2 (150 CR)</th>
                <th className="py-3 px-3 text-right">Stage 3 (250 CR)</th>
                <th className="py-3 px-4 text-right">Total Credits</th>
                <th className="py-3 px-3">Round Status</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-cartel-silver/50 font-mono">
                    No results match current search criteria.
                  </td>
                </tr>
              ) : (
                results.map((team, idx) => {
                  const rank = idx + 1;
                  const isTopThree = rank <= 3;
                  const badgeClass = getStatusBadge(team.status);

                  return (
                    <tr
                      key={team.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-2.5 px-3.5 text-center font-mono font-bold text-cartel-silver/70">
                        {isTopThree ? (
                          <span className="text-cartel-amber">#{rank}</span>
                        ) : (
                          <span>#{rank}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 font-cinzel font-bold text-white">
                        <div className="flex items-center space-x-1.5">
                          {rank === 1 && <span aria-hidden="true">👑</span>}
                          <span>{team.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-cartel-silver">
                        {team.stages['stage-1'].earnedCredits} CR
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-cartel-silver">
                        {team.stages['stage-2'].earnedCredits} CR
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-cartel-silver">
                        {team.stages['stage-3'].earnedCredits} CR
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-black text-sm text-cartel-pumpkin">
                        {team.credits} / 500 CR
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block text-[9px] font-cinzel font-bold px-2 py-0.5 rounded-full border uppercase ${badgeClass}`}
                        >
                          {team.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTeam(team)}
                          className="px-2.5 py-1 rounded bg-cartel-charcoal hover:bg-white/10 text-cartel-cyan font-cinzel text-[10px] font-bold border border-cartel-cyan/30 cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TeamDetailsModal
        team={selectedTeam}
        isOpen={Boolean(selectedTeam)}
        onClose={() => setSelectedTeam(null)}
      />
    </div>
  );
};

