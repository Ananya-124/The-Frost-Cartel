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
          {/* Haunted Cartel Skull Sigil */}
          <div className="relative flex items-center justify-center shrink-0">
            <img
              src="/assets/cartel_skull_crossbones_gold.png"
              alt="Frost Cartel Sigil"
              aria-hidden="true"
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain filter drop-shadow-[0_0_8px_rgba(246,166,58,0.7)] group-hover:scale-105 transition-transform select-none"
            />
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
