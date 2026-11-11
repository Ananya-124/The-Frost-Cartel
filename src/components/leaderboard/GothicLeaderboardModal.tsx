import React, { useEffect, useState } from 'react';
import { adminReadService, type ApiLeaderboardEntry } from '../../services/adminReadService';
import { useNativeDialog } from '../../hooks/useNativeDialog';

interface GothicLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GothicLeaderboardModal: React.FC<GothicLeaderboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { dialogRef } = useNativeDialog(isOpen, onClose);
  const [searchQuery, setSearchQuery] = useState('');
  const [standings, setStandings] = useState<ApiLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStandings = async () => {
    setLoading(true); setError(null);
    try { setStandings(await adminReadService.getLeaderboard()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load the leaderboard.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isOpen) void loadStandings(); }, [isOpen]);

  if (!isOpen) return null;

  const filtered = standings.filter((team) =>
    team.team_name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="leaderboard-title"
      className="fixed inset-0 z-50 m-0 w-full h-full max-w-none max-h-none p-3 sm:p-6 flex items-center justify-center bg-black/85 backdrop-blur-md border-none outline-none animate-fadeIn select-none"
    >
      <div className="stone-panel rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col relative shadow-[0_0_60px_rgba(246,166,58,0.2)] border-2 border-cartel-amber/40 bg-gradient-to-b from-[#140e0b] via-cartel-void to-black overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-amber-900/40 flex items-center justify-between shrink-0 bg-black/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border border-cartel-amber/60 bg-cartel-charcoal flex items-center justify-center text-cartel-amber shadow-pumpkinGlow text-lg">
              🏆
            </div>
            <div>
              <div className="text-[10px] font-cinzel text-cartel-amber font-bold tracking-widest uppercase">
                TOURNAMENT AUDIT STANDINGS
              </div>
              <h2 id="leaderboard-title" className="text-xl sm:text-2xl font-gothic font-bold text-white tracking-wide">
                FROST CARTEL LEADERBOARD
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Leaderboard"
            className="w-8 h-8 rounded-full bg-cartel-charcoal border border-white/20 text-cartel-silver hover:text-white flex items-center justify-center text-sm font-mono transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 sm:p-4 bg-cartel-midnight/50 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-2 text-xs text-cartel-silver/60" aria-hidden="true">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search squad name..."
              className="w-full bg-black/70 border border-white/15 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white font-mono placeholder:text-cartel-silver/40 focus:outline-none focus:border-cartel-amber"
            />
          </div>

          <div className="text-xs font-mono text-cartel-silver/70">
            Total Squads: <strong className="text-white">{standings.length}</strong> • Ranked by Official Score
          </div>
        </div>

        {/* Scrollable Standings Table */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-cinzel font-bold text-cartel-silver/60 uppercase">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Operative Squad</th>
                <th className="py-2.5 px-3 text-right">Official Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {loading ? <tr><td colSpan={3} className="py-8 text-center text-cartel-silver/60">Loading leaderboard…</td></tr>
                : error ? <tr><td colSpan={3} className="py-8 text-center text-red-300" role="alert">{error}<button type="button" onClick={() => { void loadStandings(); }} className="ml-2 underline">Retry</button></td></tr>
                : filtered.length === 0 ? <tr><td colSpan={3} className="py-8 text-center text-cartel-silver/60">{searchQuery ? 'No teams match your search.' : 'No leaderboard results yet.'}</td></tr>
                : filtered.map((team) => {
                const rank = team.rank;
                const isTop1 = rank === 1;
                const isTop2 = rank === 2;
                const isTop3 = rank === 3;

                return (
                  <tr
                    key={team.team_id}
                    className={`hover:bg-white/5 transition-colors ${
                      isTop1
                        ? 'bg-amber-950/20 text-amber-200'
                        : isTop2
                        ? 'bg-slate-900/30 text-slate-200'
                        : isTop3
                        ? 'bg-orange-950/15 text-orange-200'
                        : 'text-cartel-bone'
                    }`}
                  >
                    {/* Rank column with Medal */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-cinzel font-black">
                        {isTop1 && <span className="text-base" aria-hidden="true">🥇</span>}
                        {isTop2 && <span className="text-base" aria-hidden="true">🥈</span>}
                        {isTop3 && <span className="text-base" aria-hidden="true">🥉</span>}
                        <span>#{rank}</span>
                      </div>
                    </td>

                    {/* Squad Name */}
                    <td className="py-3 px-3">
                      <div className="font-gothic text-sm font-bold text-white tracking-wide">
                        {team.team_name}
                      </div>
                      <div className="text-[10px] text-cartel-silver/50">
                        {team.team_id}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-mono text-sm font-bold text-cartel-pumpkin">
                        {team.score} <span className="text-[10px] text-cartel-silver/60">PTS</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/60 border-t border-white/10 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-cartel-charcoal hover:bg-white/10 border border-white/20 text-white font-cinzel text-xs font-bold uppercase cursor-pointer"
          >
            Close Leaderboard
          </button>
        </div>
      </div>
    </dialog>
  );
};

