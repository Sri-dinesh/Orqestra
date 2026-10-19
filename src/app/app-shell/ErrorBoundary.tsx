import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, RefreshCw } from 'lucide-react';

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
    console.error(`[Orqestra:${this.props.area}]`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleGoDashboard = () => {
    this.setState({ error: null });
    window.location.href = '/dashboard';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-6 rounded-2xl bg-white border border-rose-200 shadow-card">
          <div className="flex items-start gap-4">
            <span className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-display font-bold text-[#111315]">
                Something went wrong in {this.props.area}
              </h2>
              <p className="mt-1 text-xs text-[#71767B]">
                An unexpected runtime error occurred. Don&apos;t worry — your timetable data is preserved.
              </p>
              <div className="mt-3 p-3 rounded-xl bg-[#FAFBF9] border border-[#E5E8E0] font-mono text-xs text-rose-700 overflow-x-auto">
                {this.state.error.message || 'Unknown runtime error'}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#111315] hover:bg-[#2A2E33] text-white shadow-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleGoDashboard}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-[#D0D5DD] bg-white hover:bg-black/5 text-[#111315] shadow-xs transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Go to Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-[#D0D5DD] bg-white hover:bg-black/5 text-[#71767B] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Page</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
