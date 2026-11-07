import React, { useEffect } from 'react';
import { CheckCircle2, Award, BookOpen, ArrowRight, X } from 'lucide-react';

export interface ToastData {
  id: string;
  type: 'task' | 'clue' | 'stage';
  title: string;
  points?: number;
  message?: string;
  journalEntry?: string;
  nextObjective?: string;
}

interface CompletionToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const CompletionToast: React.FC<CompletionToastProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      onDismiss(latest.id);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 max-w-xl w-[92vw] pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto relative overflow-hidden rounded-xl border border-cyan-500/40 bg-gray-950/95 p-4 shadow-2xl shadow-cyan-950/60 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300"
          style={{
            backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(6, 182, 212, 0.15), transparent 40%), radial-gradient(circle at 90% 80%, rgba(245, 158, 11, 0.12), transparent 40%)'
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between gap-3 border-b border-cyan-900/40 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/40">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/80">
                  {toast.type === 'stage' ? 'Hunt Stage Complete' : toast.type === 'task' ? 'Task Verified' : 'Clue Discovered'}
                </span>
                <h4 className="font-semibold text-sm text-cyan-100">{toast.title}</h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {toast.points !== undefined && toast.points > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 ring-1 ring-amber-500/40">
                  <Award className="h-3.5 w-3.5" />
                  <span>+{toast.points} PTS</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
                aria-label="Dismiss feedback"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body message */}
          {toast.message && (
            <p className="text-xs text-gray-300 leading-relaxed mb-2 font-mono">
              {toast.message}
            </p>
          )}

          {/* Journal unlock indicator */}
          {toast.journalEntry && (
            <div className="flex items-center gap-1.5 text-[11px] text-cyan-300/90 bg-cyan-950/40 rounded px-2 py-1 mb-2 border border-cyan-800/30">
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span>Journal: {toast.journalEntry}</span>
            </div>
          )}

          {/* Next objective guidance */}
          {toast.nextObjective && (
            <div className="flex items-start gap-1.5 text-xs font-medium text-amber-200/90 bg-amber-950/30 rounded p-2 border border-amber-800/40">
              <ArrowRight className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-[10px] uppercase text-amber-400/80 block">NEXT OBJECTIVE</span>
                <span>{toast.nextObjective}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
