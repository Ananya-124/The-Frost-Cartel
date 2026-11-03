import React from 'react';
import { useNativeDialog } from '../../../hooks/useNativeDialog';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  const { dialogRef } = useNativeDialog(isOpen, onCancel);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 m-0 w-full h-full max-w-none max-h-none p-4 flex items-center justify-center bg-cartel-void/85 backdrop-blur-sm border-none bg-transparent outline-none animate-fadeIn"
    >
      <div className="stone-panel rounded-xl max-w-md w-full p-6 relative shadow-2xl border border-cartel-frostBorder/40">
        <div className="flex items-start space-x-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-red-950/80 border border-red-500/60 text-red-300'
                : 'bg-cartel-charcoal border border-cartel-amber/50 text-cartel-amber'
            }`}
          >
            <span className="text-lg" aria-hidden="true">{isDanger ? '⚠️' : '🗝️'}</span>
          </div>
          <div>
            <h3 id="confirm-modal-title" className="text-lg font-cinzel font-bold text-white tracking-wide">
              {title}
            </h3>
            <p className="text-xs text-cartel-silver/80 mt-1 leading-relaxed font-sans">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded bg-cartel-charcoal hover:bg-white/5 border border-white/15 text-cartel-silver hover:text-white font-cinzel text-xs font-semibold tracking-wider transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded font-cinzel font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              isDanger
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : 'bg-gradient-to-r from-cartel-pumpkin to-cartel-amber text-cartel-void shadow-pumpkinGlow hover:scale-105'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
};

