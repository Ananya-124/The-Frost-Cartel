import React from 'react';

interface State { error: boolean; isChunkError: boolean }
interface Props { children: React.ReactNode; stageLabel: string }

export class Round1DeferredBoundary extends React.Component<Props, State> {
  state: State = { error: false, isChunkError: false };

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? error.message : String(error);
    const isChunkError =
      msg.includes('dynamically imported module') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Importing a module script failed');
    return { error: true, isChunkError };
  }

  componentDidCatch(error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes('dynamically imported module') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Importing a module script failed')
    ) {
      const key = 'fc_chunk_boundary_reload';
      const last = sessionStorage.getItem(key);
      const now = Date.now();
      if (!last || now - Number(last) > 10000) {
        sessionStorage.setItem(key, String(now));
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="min-h-screen bg-black text-stone-100 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p>
            {this.state.isChunkError
              ? 'A new game update was deployed. Reloading latest assets…'
              : `Could not load ${this.props.stageLabel}. Your saved progress is safe; retry the download.`}
          </p>
          <button
            type="button"
            className="px-4 py-2 border border-amber-500 rounded bg-amber-500/20 text-amber-200 font-cinzel hover:bg-amber-500/30"
            onClick={() => window.location.reload()}
          >
            Reload Game
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
