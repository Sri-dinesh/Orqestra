import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface FinalCTASectionProps {
  onScrollToDemo?: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = () => {
  return (
    <section className="py-24 sm:py-32 bg-[#111112] text-white relative overflow-hidden border-t border-[#2a2a2d]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Kicker */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 text-xs font-mono text-[#7aa2f7] uppercase tracking-widest mb-8 border border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-[#51cf66]" />
          <span>Institutional Readiness · Open Source Workstation</span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.15] text-balance mb-6">
          Publish your department schedule with mathematical certainty.
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty mb-10">
          Eliminate manual scheduling conflicts permanently. Apply an accredited blueprint, run preflight diagnostics, and generate conflict free timetables in seconds.
        </p>

        {/* Identical Primary CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-white bg-[#3b6fe0] hover:bg-[#2e5ccb] active:scale-[0.98] rounded-md transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center gap-2.5 group shadow-none focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] focus:ring-offset-2 focus:ring-offset-[#111112]"
          >
            <span>Launch Free Workstation</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Risk Reversal Guarantee Chips */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-white/60 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#51cf66]" />
            <span>100% Free and MIT Licensed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#51cf66]" />
            <span>Zero Server Data Transmission</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#51cf66]" />
            <span>Instant In Browser Execution</span>
          </span>
        </div>
      </div>
    </section>
  );
};
