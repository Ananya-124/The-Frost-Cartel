import React, { useState } from 'react';
import type { TeamSession } from '../../types/team.types';
import { authService } from '../../services/authService';

interface TeamLoginPanelProps {
  onLoginSuccess: (session: TeamSession) => void;
}

export const TeamLoginPanel: React.FC<TeamLoginPanelProps> = ({
  onLoginSuccess,
}) => {
  const [teamName, setTeamName] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = teamName.trim();
    const trimmedPass = passkey.trim();

    if (!trimmedName) {
      setErrorMessage('Please enter your assigned Team Name / Login ID.');
      return;
    }

    if (!trimmedPass) {
      setErrorMessage('Please enter your Master Passkey.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.loginTeam(trimmedName, trimmedPass);
      if (response.success && response.team) {
        onLoginSuccess(response.team);
      } else {
        setErrorMessage(response.message || 'Authentication failed. Check your credentials.');
      }
    } catch {
      setErrorMessage('Network or system error during authentication. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto text-center px-4">
      {/* 1. Ancient Gothic Altar Crest / Carved Skull Sigil */}
      <div className="flex flex-col items-center mb-2">
        <div className="relative group/skull flex items-center justify-center mb-1">
          {/* Subtle warm amber radial glow aura */}
          <div
            aria-hidden="true"
            className="absolute -inset-2 rounded-full bg-cartel-amber/20 blur-md opacity-70 group-hover/skull:opacity-100 transition-opacity duration-300 pointer-events-none"
          />
          <img
            src="/assets/cartel_skull_crossbones.png"
            alt="Frost Cartel Skull and Crossbones"
            className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain drop-shadow-[0_0_16px_rgba(246,166,58,0.65)] group-hover/skull:drop-shadow-[0_0_24px_rgba(246,166,58,0.95)] group-hover/skull:scale-105 transition-all duration-300 select-none filter brightness-105"
          />
        </div>

        {/* Console Heading */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-cinzel font-bold text-white tracking-widest silver-metallic-text uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          ENTER THE CARTEL
        </h2>
        <p className="text-[10px] sm:text-xs font-cinzel text-cartel-amber/90 font-semibold tracking-[0.2em] uppercase mt-0.5">
          ONLY ASSIGNED TEAMS MAY ENTER.
        </p>
      </div>

      {/* 2. Error Feedback Alert formatted as a Crimson Runic Seal */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-3 max-w-md mx-auto p-2.5 rounded-md bg-red-950/85 border border-red-500/60 text-red-200 text-xs font-sans flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-fadeIn text-left"
        >
          <span className="text-sm shrink-0" aria-hidden="true">⚠️</span>
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-300 hover:text-white text-xs font-mono px-1 cursor-pointer"
            title="Dismiss alert"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Form: Ancient Stone & Iron Gate-Control Surface */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative bg-gradient-to-b from-black/75 via-cartel-void/90 to-black/85 border border-white/10 rounded-xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-md"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          {/* Team Name / Login ID Input */}
          <div className="text-left">
            <label
              htmlFor="squad-name-input"
              className="block text-[10px] sm:text-[11px] font-cinzel font-bold text-cartel-silver/80 uppercase mb-1 tracking-wider"
            >
              TEAM NAME / LOGIN ID
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-cartel-silver/40" aria-hidden="true">
                👤
              </span>
              <input
                id="squad-name-input"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter squad identifier"
                disabled={isSubmitting}
                autoComplete="off"
                className="w-full pl-8 pr-3 py-2 bg-black/60 border border-white/15 focus:border-cartel-amber focus:ring-1 focus:ring-cartel-amber rounded-md text-xs sm:text-sm text-white placeholder-cartel-silver/30 font-sans transition-all outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="text-left">
            <label
              htmlFor="passkey-input"
              className="block text-[10px] sm:text-[11px] font-cinzel font-bold text-cartel-silver/80 uppercase mb-1 tracking-wider"
            >
              PASSWORD
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-cartel-silver/40" aria-hidden="true">
                🔒
              </span>
              <input
                id="passkey-input"
                type={showPassword ? 'text' : 'password'}
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter access passkey"
                disabled={isSubmitting}
                autoComplete="current-password"
                className="w-full pl-8 pr-9 py-2 bg-black/60 border border-white/15 focus:border-cartel-amber focus:ring-1 focus:ring-cartel-amber rounded-md text-xs sm:text-sm text-white placeholder-cartel-silver/30 font-mono tracking-widest transition-all outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-2.5 text-xs text-cartel-amber/70 hover:text-white font-mono cursor-pointer transition-colors"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Carved Glowing Stone Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 sm:py-3 px-6 rounded-md bg-gradient-to-r from-cartel-pumpkin via-cartel-amber to-cartel-pumpkin text-cartel-void font-cinzel font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-pumpkinGlow hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2 border border-cartel-amber/50"
        >
          {isSubmitting ? (
            <>
              <span className="w-3 h-3 border-2 border-cartel-void border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              <span>AUTH...</span>
            </>
          ) : (
            <span>ENTER THE GAME</span>
          )}
        </button>

        {/* 5. Subtext */}
        <p className="mt-3 text-[10px] sm:text-[11px] text-cartel-silver/60 font-sans tracking-wide">
          Credentials are provided by the event administrator.
        </p>
      </form>
    </div>
  );
};
