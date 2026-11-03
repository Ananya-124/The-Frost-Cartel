import React from 'react';
import type { TeamSession } from '../../types/team.types';

interface MinimalHeaderProps {
  session: TeamSession | null;
  onLogout?: () => void;
  onNavigateHome?: () => void;
}

export const MinimalHeader: React.FC<MinimalHeaderProps> = ({
  session,
  onLogout,
  onNavigateHome,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-cartel-void/80 backdrop-blur-md border-b border-cartel-frostBorder/40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between">
        {/* Left side: Minimal Brand Emblem */}
        <button
          onClick={onNavigateHome}
          className="flex items-center space-x-2.5 text-left group focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin rounded p-1 cursor-pointer"
          title="Return to Frost Cartel main portal"
        >
          {/* Subtle Haunted Cartel Skull Sigil */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-cartel-pumpkin/60 bg-cartel-charcoal/80 flex items-center justify-center shadow-pumpkinGlow group-hover:scale-105 transition-transform duration-300">
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cartel-amber"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M9 10h.01M15 10h.01" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M8 16c1.5-1 3-1 4 0 1-1 2.5-1 4 0" />
              <line x1="12" y1="12" x2="12" y2="14" />
            </svg>
          </div>

          <div>
            <div className="text-xs sm:text-sm font-gothic tracking-widest font-black silver-metallic-text group-hover:tracking-wider transition-all duration-300 leading-none">
              FROST CARTEL
            </div>
          </div>
        </button>

        {/* Right side: Ambient Halloween Edition indicator & Authenticated Squad token (STRICTLY NO ADMIN BUTTON) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cartel-midnight/80 border border-cartel-amber/40 text-[9px] sm:text-[10px] font-cinzel font-bold text-cartel-amber tracking-wider shadow-[0_0_8px_rgba(246,166,58,0.2)] select-none">
            <span className="text-xs" aria-hidden="true">🎃</span>
            <span className="hidden xs:inline">HALLOWEEN EDITION</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cartel-pumpkin animate-ping ml-0.5" aria-hidden="true" />
          </div>

          {session && (
            <div className="flex items-center space-x-2 pl-2 border-l border-white/10">
              <span className="text-[11px] font-mono text-cartel-cyan truncate max-w-[110px] sm:max-w-none">
                {session.teamName}
              </span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-[10px] font-cinzel uppercase text-cartel-silver/70 hover:text-cartel-pumpkin px-1.5 py-0.5 rounded border border-white/10 hover:border-cartel-pumpkin/40 transition-colors cursor-pointer"
                  title="Sign out of current squad session"
                >
                  Exit
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
