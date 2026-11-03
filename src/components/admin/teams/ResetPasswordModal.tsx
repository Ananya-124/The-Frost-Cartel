import React, { useState } from 'react';
import { adminService } from '../../../services/adminService';
import type { AdminTeam } from '../../../types/team.types';
import { useNativeDialog } from '../../../hooks/useNativeDialog';

interface ResetPasswordModalProps {
  team: AdminTeam | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  team,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { dialogRef } = useNativeDialog(isOpen, onClose);

  if (!isOpen || !team) return null;

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = newPassword.trim();
    if (!trimmed || trimmed.length < 4) {
      setErrorMessage('Passkey must be at least 4 characters.');
      return;
    }

    const res = adminService.resetTeamPassword(team.id, trimmed);
    if (res.success) {
      setNewPassword('');
      onSuccess();
      onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="reset-pass-title"
      className="fixed inset-0 z-50 m-0 w-full h-full max-w-none max-h-none p-4 flex items-center justify-center bg-cartel-void/85 backdrop-blur-sm border-none bg-transparent outline-none animate-fadeIn"
    >
      <div className="stone-panel rounded-xl max-w-sm w-full p-6 relative shadow-2xl border border-cartel-frostBorder/40">
        <h3 id="reset-pass-title" className="text-base font-cinzel font-bold text-white mb-1">
          RESET PASSKEY: {team.name}
        </h3>
        <p className="text-xs text-cartel-silver/70 mb-4 font-sans">
          Assign a new organizer master passkey for this squad.
        </p>

        {errorMessage && (
          <div role="alert" aria-live="assertive" className="mb-3 p-2 rounded bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="reset-team-pass-input"
              className="block text-[10px] font-cinzel font-bold text-cartel-amber uppercase mb-1"
            >
              NEW PASSKEY (MIN. 4 CHARS)
            </label>
            <input
              id="reset-team-pass-input"
              name="newPasskey"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-cartel-charcoal border border-cartel-frostBorder/60 rounded text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cancel password reset"
              className="px-3 py-1.5 rounded bg-cartel-charcoal hover:bg-white/5 border border-white/15 text-cartel-silver font-cinzel text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              aria-label="Confirm reset passkey"
              className="px-3.5 py-1.5 rounded bg-gradient-to-r from-cartel-pumpkin to-cartel-amber text-cartel-void font-cinzel font-bold text-xs uppercase cursor-pointer"
            >
              Set Passkey
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

