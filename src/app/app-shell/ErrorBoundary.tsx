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
        <div className="max-w-2xl mx-auto my-12 p-5 rounded-md bg-white border border-[#e1e4e8] shadow-none">
          <div className="flex items-start gap-3.5">
            <span className="p-2.5 rounded-md bg-rose-50 text-[#c92a2a] border border-rose-100 shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#c92a2a]" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-[#121417]">
                Something went wrong in {this.props.area}
              </h2>
              <p className="mt-1 text-xs text-[#5b616b]">
                An unexpected runtime error occurred. Don&apos;t worry — your timetable data is preserved.
              </p>
              <div className="mt-3 p-3 rounded-md bg-[#f6f7f8] border border-[#e1e4e8] font-mono text-xs text-[#c92a2a] overflow-x-auto">
                {this.state.error.message || 'Unknown runtime error'}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#3b6fe0] hover:bg-[#2e5ccb] text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleGoDashboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[#e1e4e8] bg-[#f6f7f8] hover:bg-[#eef0f2] text-[#121417] transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Go to Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[#e1e4e8] bg-[#f6f7f8] hover:bg-[#eef0f2] text-[#5b616b] transition-colors cursor-pointer"
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
