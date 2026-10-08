import React from 'react';

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
                C⊞
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Cadence
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed max-w-sm font-sans">
              Timetabling infrastructure for modern education. Automated, conflict-free academic scheduling
              engineered for colleges, universities, and multi-campus institutions worldwide.
            </p>
            <div className="pt-2 flex items-center gap-2 font-mono text-[11px] text-white/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>CORE SOLVER CLUSTER: OPERATIONAL (0.04S)</span>
            </div>
          </div>

          {/* Column 1: Product */}
          <div>
            <div className="text-xs font-mono font-semibold text-white/40 uppercase tracking-wider mb-4">
              Product
            </div>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li><a href="#interactive-demo" className="hover:text-white transition-colors">Timetable Generator</a></li>
              <li><a href="#architecture" className="hover:text-white transition-colors">Constraint Solver</a></li>
              <li><a href="#controls" className="hover:text-white transition-colors">Policy Invariants Engine</a></li>
              <li><a href="#analytics" className="hover:text-white transition-colors">Room Utilization Heatmaps</a></li>
              <li><a href="#interactive-demo" className="hover:text-white transition-colors">Dynamic Conflict Resolver</a></li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div>
            <div className="text-xs font-mono font-semibold text-white/40 uppercase tracking-wider mb-4">
              Solutions
            </div>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li><a href="#scale" className="hover:text-white transition-colors">Colleges & Universities</a></li>
              <li><a href="#scale" className="hover:text-white transition-colors">Secondary Schools</a></li>
              <li><a href="#scale" className="hover:text-white transition-colors">Multi-Campus Systems</a></li>
              <li><a href="#scale" className="hover:text-white transition-colors">Technical Institutes</a></li>
              <li><a href="#scale" className="hover:text-white transition-colors">Medical & Laboratory Wings</a></li>
            </ul>
          </div>

          {/* Column 3: Standards & Trust */}
          <div>
            <div className="text-xs font-mono font-semibold text-white/40 uppercase tracking-wider mb-4">
              Infrastructure
            </div>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li><span className="hover:text-white transition-colors cursor-pointer">SIS / Canvas LMS APIs</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">FERPA Compliance</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">SOC 2 Type II Security</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Immutable Audit Trail</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">System Status</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 font-mono gap-4">
          <div>
            © 2026 Cadence Academic Technologies Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Institutional Terms</span>
            <span className="hover:text-white transition-colors cursor-pointer">Security Whitepaper</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
