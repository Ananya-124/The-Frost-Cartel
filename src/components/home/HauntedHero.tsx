import React from 'react';
import type { TeamSession } from '../../types/team.types';
import type { RoundConfig } from '../../types/round.types';
import { RoundPortalSection } from './RoundPortalSection';
import { TeamLoginPanel } from '../player/TeamLoginPanel';

interface HauntedHeroProps {
  session: TeamSession | null;
  rounds: RoundConfig[];
  onLoginSuccess: (session: TeamSession) => void;
  onOpenDashboard: () => void;
  onSelectRound: (round: RoundConfig) => void;
}

export const HauntedHero: React.FC<HauntedHeroProps> = ({
  session,
  rounds,
  onLoginSuccess,
  onOpenDashboard,
  onSelectRound,
}) => {
  return (
    <section className="relative z-10 w-full min-h-screen flex flex-col justify-between py-4 sm:py-6 lg:py-8">
      {/* 1. Main Hero Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center w-full my-auto">
        {/* Top Runic Medallion & Branding */}
        <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
          {/* Top Skull & Astral Compass Sigil */}
          <div className="flex justify-center mb-2">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full border border-cartel-amber/50 animate-spin-slow opacity-80"
              />
              <div
                aria-hidden="true"
                className="absolute inset-1 rounded-full border border-dotted border-cartel-cyan/40 animate-spin-slow-reverse opacity-75"
              />
              <img
                src="/assets/gothic_skull_emblem.png"
                alt=""
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain filter drop-shadow-[0_0_12px_rgba(246,166,58,0.7)]"
              />
            </div>
          </div>

          {/* Main Display Title */}
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-gothic tracking-wider sm:tracking-widest silver-metallic-text leading-none mb-1.5 drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
            FROST CARTEL
          </h1>

          {/* Tagline */}
          <p className="text-[10px] xs:text-xs sm:text-sm font-cinzel text-cartel-cyan font-bold tracking-wider sm:tracking-[0.25em] uppercase mb-1 drop-shadow-[0_2px_10px_rgba(127,229,217,0.4)]">
            ENTER THE DARKNESS • CLAIM YOUR DESTINY
          </p>

          {/* Supporting line */}
          <p className="text-[10px] xs:text-[11px] sm:text-xs font-cinzel text-cartel-amber font-semibold tracking-wider sm:tracking-[0.2em] uppercase mb-4 sm:mb-6 drop-shadow-[0_2px_8px_rgba(242,122,26,0.5)]">
            Three rounds. One haunted world.
          </p>
        </div>

        {/* 2. The Four Circular Magical Portals (Horizontal on desktop, no box cards) */}
        <div className="w-full mb-6 sm:mb-8 lg:mb-10">
          <RoundPortalSection
            rounds={rounds}
            onSelectRound={onSelectRound}
          />
        </div>

        {/* 3. Integrated Player Login — Ancient Haunted Access Console */}
        <div className="w-full max-w-3xl mx-auto" id="login-section">
          {session ? (
            <div className="relative bg-gradient-to-b from-black/80 via-cartel-void/90 to-black/85 border border-cartel-pumpkin/50 rounded-xl p-4 sm:p-5 text-center shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cartel-pumpkin/20 border border-cartel-pumpkin text-cartel-pumpkin text-xs font-cinzel font-bold mb-2 shadow-pumpkinGlow">
                <span className="w-2 h-2 rounded-full bg-cartel-pumpkin animate-ping" aria-hidden="true" />
                <span>ACTIVE SQUAD SESSION: {session.teamName}</span>
              </div>
              <p className="text-xs sm:text-sm text-cartel-silver/85 font-sans mb-3 max-w-lg mx-auto">
                Your squad is authenticated and staged. Round 1 will unlock upon the organizer's signal.
              </p>
              <button
                onClick={onOpenDashboard}
                className="py-2 px-6 rounded-md bg-gradient-to-r from-cartel-pumpkin via-cartel-amber to-cartel-pumpkin text-cartel-void font-cinzel font-black text-xs uppercase tracking-widest shadow-pumpkinGlow hover:scale-105 transition-all cursor-pointer border border-cartel-amber/50"
              >
                OPEN SQUAD CONSOLE
              </button>
            </div>
          ) : (
            <TeamLoginPanel onLoginSuccess={onLoginSuccess} />
          )}
        </div>
      </div>

      {/* 4. Minimalist Ambient Horror Footer */}
      <footer className="relative z-10 w-full text-center py-3 text-[10px] text-cartel-silver/40 font-mono tracking-widest uppercase">
        <span>FROST CARTEL • HALLOWEEN INVITATIONAL 2026 • 2-PLAYER SQUADS ONLY</span>
      </footer>
    </section>
  );
};
