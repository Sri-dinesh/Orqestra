import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  area: string;
}

interface State {
  error: Error | null;
}

/** Error boundary so one failed area does not take down the shell (§118). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[WTS:${this.props.area}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">
            Something went wrong in {this.props.area}
          </h2>
          <p className="mt-2 text-sm text-red-700">{this.state.error.message}</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              onClick={() => this.setState({ error: null })}
            >
              Retry
            </button>
            <button
              type="button"
              className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
              onClick={() => window.location.reload()}
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
