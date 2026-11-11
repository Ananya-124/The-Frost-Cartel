import React, { useState } from 'react';
import { adminReadService } from '../../../services/adminReadService';
import type { AdminTeam } from '../../../types/team.types';
import { useNativeDialog } from '../../../hooks/useNativeDialog';

interface ResetPasswordModalProps {
  team: AdminTeam | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  team,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { dialogRef } = useNativeDialog(isOpen, onClose);

  if (!isOpen || !team) return null;

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const result = await adminReadService.resetTeamPassword(team.id);
      setNewPassword(result.newPassword);
      await onSuccess();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Passkey could not be reset.');
    } finally { setIsSubmitting(false); }
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
        <p className="text-xs text-cartel-silver/70 mb-4 font-sans">The server will generate a new passkey and store only its secure hash.</p>

        {errorMessage && (
          <div role="alert" aria-live="assertive" className="mb-3 p-2 rounded bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
            {errorMessage}
          </div>
        )}

        {newPassword && <div className="mb-3 rounded border border-emerald-500/30 bg-emerald-950/30 p-3"><p className="text-xs text-emerald-200">Passkey reset confirmed. Copy it now; it will not be shown again.</p><output className="mt-2 block break-all font-mono text-sm text-white select-all">{newPassword}</output></div>}

        <form onSubmit={(event) => { void handleSubmit(event); }} className="space-y-3">

          <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Cancel password reset"
              className="px-3 py-1.5 rounded bg-cartel-charcoal hover:bg-white/5 border border-white/15 text-cartel-silver font-cinzel text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              aria-label="Confirm reset passkey"
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded bg-gradient-to-r from-cartel-pumpkin to-cartel-amber text-cartel-void font-cinzel font-bold text-xs uppercase cursor-pointer"
            >
              {isSubmitting ? 'Resetting…' : newPassword ? 'Generate Another Passkey' : 'Generate Passkey'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

