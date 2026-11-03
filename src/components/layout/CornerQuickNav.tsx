import React from 'react';
import type { TeamSession } from '../../types/team.types';

interface CornerQuickNavProps {
  session: TeamSession | null;
  onOpenDashboard: () => void;
  onOpenLeaderboard: () => void;
  onNavigateHome?: () => void;
}

export const CornerQuickNav: React.FC<CornerQuickNavProps> = ({
  session,
  onOpenDashboard,
  onOpenLeaderboard,
  onNavigateHome,
}) => {
  return (
    <nav
      aria-label="Quick Navigation"
      className="fixed top-4 right-4 z-40 flex items-center gap-2 select-none"
    >
      {/* 1. Home / Sanctuary Anchor */}
      {onNavigateHome && (
        <button
          type="button"
          onClick={onNavigateHome}
          title="Sanctuary Home"
          aria-label="Sanctuary Home"
          className="h-8 px-2.5 rounded-full bg-black/75 hover:bg-black border border-white/15 hover:border-cartel-amber/50 text-cartel-silver hover:text-white font-cinzel text-[11px] font-bold tracking-wider backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
        >
          <span aria-hidden="true">🏰</span>
          <span className="hidden sm:inline">Home</span>
        </button>
      )}

      {/* 2. Live Leaderboard Button */}
      <button
        type="button"
        onClick={onOpenLeaderboard}
        title="View Tournament Standings"
        aria-label="View Tournament Standings"
        className="h-8 px-3 rounded-full bg-black/75 hover:bg-amber-950/60 border border-cartel-amber/50 hover:border-cartel-amber text-cartel-amber hover:text-white font-cinzel text-[11px] font-bold tracking-wider backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(246,166,58,0.2)]"
      >
        <span aria-hidden="true">🏆</span>
        <span>Leaderboard</span>
      </button>

      {/* 3. Squad Console Button (When Authenticated) */}
      {session && (
        <button
          type="button"
          onClick={onOpenDashboard}
          title="Open Squad Console"
          aria-label="Open Squad Console"
          className="h-8 px-3 rounded-full bg-gradient-to-r from-cartel-pumpkin via-cartel-amber to-cartel-pumpkin text-cartel-void font-cinzel text-[11px] font-black tracking-wider shadow-pumpkinGlow hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer border border-cartel-amber/60"
        >
          <span aria-hidden="true">💀</span>
          <span className="truncate max-w-[120px]">{session.teamName}</span>
        </button>
      )}
    </nav>
  );
};

