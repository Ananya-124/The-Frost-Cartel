import React, { useState } from 'react';
import { adminService } from '../../../services/adminService';
import { useNativeDialog } from '../../../hooks/useNativeDialog';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated?: () => void;
  onSuccess?: () => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onTeamCreated,
  onSuccess,
}) => {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { dialogRef } = useNativeDialog(isOpen, onClose);

  if (!isOpen) return null;

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = teamName.trim();
    const trimmedPass = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedName) {
      setErrorMessage('Team Name is required.');
      return;
    }

    if (!trimmedPass) {
      setErrorMessage('Master Passkey is required.');
      return;
    }

    if (trimmedPass.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }

    if (trimmedPass !== trimmedConfirm) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = adminService.createTeam(trimmedName, trimmedPass);
    setIsSubmitting(false);

    if (result.success) {
      setTeamName('');
      setPassword('');
      setConfirmPassword('');
      onTeamCreated?.();
      onSuccess?.();
      onClose();
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="create-team-title"
      className="fixed inset-0 z-50 m-0 w-full h-full max-w-none max-h-none p-4 flex items-center justify-center bg-cartel-void/85 backdrop-blur-sm border-none bg-transparent outline-none animate-fadeIn"
    >
      <div className="stone-panel rounded-xl max-w-md w-full p-6 relative shadow-2xl border border-cartel-frostBorder/40">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl text-cartel-amber" aria-hidden="true">🗝️</span>
            <div>
              <h3 id="create-team-title" className="text-lg font-gothic font-bold text-white tracking-wide">
                MANUAL SQUAD CREATION
              </h3>
              <p className="text-[11px] font-cinzel text-cartel-silver/70">
                Credentials are exact and issued by the administrator.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-cartel-silver/60 hover:text-white p-1 rounded font-mono text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-2.5 rounded bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-sans flex items-center gap-2"
          >
            <span aria-hidden="true">⚠️</span>
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          <div>
            <label
              htmlFor="create-team-name"
              className="block text-[11px] font-cinzel font-bold text-cartel-amber uppercase tracking-wider mb-1"
            >
              TEAM NAME (EXACT &amp; UNIQUE)
            </label>
            <input
              id="create-team-name"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Iron Phantoms"
              className="w-full px-3 py-2 bg-cartel-charcoal border border-cartel-frostBorder/60 rounded text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin"
              required
            />
          </div>

          <div>
            <label
              htmlFor="create-team-password"
              className="block text-[11px] font-cinzel font-bold text-cartel-amber uppercase tracking-wider mb-1"
            >
              MASTER PASSKEY
            </label>
            <input
              id="create-team-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 bg-cartel-charcoal border border-cartel-frostBorder/60 rounded text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin"
              required
            />
          </div>

          <div>
            <label
              htmlFor="create-team-confirm-password"
              className="block text-[11px] font-cinzel font-bold text-cartel-amber uppercase tracking-wider mb-1"
            >
              CONFIRM PASSKEY
            </label>
            <input
              id="create-team-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 bg-cartel-charcoal border border-cartel-frostBorder/60 rounded text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2.5 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded bg-cartel-charcoal hover:bg-white/5 border border-white/15 text-cartel-silver font-cinzel text-xs font-semibold tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-gradient-to-r from-cartel-pumpkin via-cartel-amber to-cartel-pumpkin text-cartel-void font-cinzel font-bold text-xs uppercase tracking-wider shadow-pumpkinGlow hover:scale-102 transition-all cursor-pointer disabled:opacity-50"
            >
              Create Squad
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
