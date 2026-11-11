import React, { useState } from 'react';
import { adminReadService } from '../../../services/adminReadService';
import type { AdminTeam } from '../../../types/team.types';
import { useNativeDialog } from '../../../hooks/useNativeDialog';

interface EditTeamNameModalProps {
  team: AdminTeam | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

const EditTeamNameDialogContent: React.FC<{
  team: AdminTeam;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}> = ({ team, onClose, onSuccess }) => {
  const [newName, setNewName] = useState(team.name);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = newName.trim();
    if (!trimmed) {
      setErrorMessage('Team Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      await adminReadService.renameTeam(team.id, trimmed);
      await onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Team name could not be updated.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="stone-panel rounded-xl max-w-sm w-full p-6 relative shadow-2xl border border-cartel-frostBorder/40">
      <h3 id="edit-team-title" className="text-base font-cinzel font-bold text-white mb-1">
        EDIT SQUAD CALLSIGN
      </h3>
      <p className="text-xs text-cartel-silver/70 mb-4 font-sans">
        Update the display team name. Must remain unique across all tournament teams.
      </p>

      {errorMessage && (
        <div role="alert" aria-live="assertive" className="mb-3 p-2 rounded bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="edit-team-name-input"
            className="block text-[10px] font-cinzel font-bold text-cartel-amber uppercase mb-1"
          >
            TEAM NAME
          </label>
          <input
            id="edit-team-name-input"
            name="teamName"
            type="text"
            value={newName}
            disabled={isSaving}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 bg-cartel-charcoal border border-cartel-frostBorder/60 rounded text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cartel-pumpkin"
            required
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cancel editing"
            className="px-3 py-1.5 rounded bg-cartel-charcoal hover:bg-white/5 border border-white/15 text-cartel-silver font-cinzel text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            aria-label="Confirm update team name"
            className="px-3.5 py-1.5 rounded bg-gradient-to-r from-cartel-pumpkin to-cartel-amber text-cartel-void font-cinzel font-bold text-xs uppercase cursor-pointer"
          >
            {isSaving ? 'Saving…' : 'Update Name'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const EditTeamNameModal: React.FC<EditTeamNameModalProps> = ({
  team,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { dialogRef } = useNativeDialog(isOpen, onClose);

  if (!isOpen || !team) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="edit-team-title"
      className="fixed inset-0 z-50 m-0 w-full h-full max-w-none max-h-none p-4 flex items-center justify-center bg-cartel-void/85 backdrop-blur-sm border-none bg-transparent outline-none animate-fadeIn"
    >
      <EditTeamNameDialogContent
        key={team.id}
        team={team}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </dialog>
  );
};

