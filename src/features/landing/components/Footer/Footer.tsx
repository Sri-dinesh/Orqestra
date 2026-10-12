import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B0D0F] text-white pt-16 pb-12 border-t border-white/10 relative overflow-hidden">
      {/* Architectural subtle dark pattern */}
      <div className="absolute inset-0 bg-grid-pattern-dark opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-white text-[#111315] flex items-center justify-center font-mono text-xs font-bold">
                O
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Orqestra
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed max-w-sm font-sans">
              A browser-based timetable generator for teaching departments.
              Configure sections, subjects, and faculty, generate conflict-free
              weekly schedules, edit with full validation, and export official
              PDF and Excel timetables — all offline, with nothing leaving your
              machine.
            </p>
            <div className="pt-2 flex items-center gap-2 font-mono text-[11px] text-white/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>100% CLIENT-SIDE · NO BACKEND · NO ACCOUNT</span>
            </div>
          </div>

          {/* Column 1: Product */}
          <div>
            <div className="text-xs font-mono font-semibold text-white/40 uppercase tracking-wider mb-4">
              Product
            </div>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#engine" className="hover:text-white transition-colors">
                  Scheduling engine
                </a>
              </li>
              <li>
                <a href="#editor" className="hover:text-white transition-colors">
                  Timetable editor
                </a>
              </li>
              <li>
                <a href="#presets" className="hover:text-white transition-colors">
                  Built-in presets
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Workflow (real app screens) */}
          <div>
            <div className="text-xs font-mono font-semibold text-white/40 uppercase tracking-wider mb-4">
              Workflow
            </div>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/departments" className="hover:text-white transition-colors">
                  Department configuration
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Generate timetable
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Timetable editor
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Faculty timetable view
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-white transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Data & privacy (real guarantees) */}
          <div>
            <div className="text-xs font-mono font-semibold text-white/40 uppercase tracking-wider mb-4">
              Data & Privacy
            </div>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>Offline-first local storage</li>
              <li>Workspace import / export (JSON)</li>
              <li>Version history with restore</li>
              <li>Notice-board PDF export</li>
              <li>Excel grid export</li>
              <li>No account, no tracking backend</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 font-mono gap-4">
          <div>© 2026 Orqestra. MIT licensed. Your data never leaves your browser.</div>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="hover:text-white transition-colors">
              Open app
            </Link>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
