import React from 'react';

interface State { error: boolean }
interface Props { children: React.ReactNode; stageLabel: string }

export class Round1DeferredBoundary extends React.Component<Props, State> {
  state: State = { error: false };

  static getDerivedStateFromError(): State { return { error: true }; }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="min-h-screen bg-black text-stone-100 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p>Could not load {this.props.stageLabel}. Your saved progress is safe; retry the download.</p>
          <button type="button" className="px-4 py-2 border border-amber-500 rounded" onClick={() => window.location.reload()}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
