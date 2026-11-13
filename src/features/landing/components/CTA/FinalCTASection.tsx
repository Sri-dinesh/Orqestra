import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface FinalCTASectionProps {
  onScrollToDemo?: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = () => {
  return (
    <section className="py-14 sm:py-20 bg-[#111112] text-white relative overflow-hidden border-t border-[#2a2a2d]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Kicker */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-[11px] font-mono text-[#7aa2f7] uppercase tracking-wider mb-5 border border-white/10">
          <Sparkles className="w-3 h-3 text-[#51cf66]" />
          <span>Open Source & Offline</span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white leading-tight text-balance mb-4">
          Publish your department schedule with mathematical certainty.
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto leading-relaxed text-pretty mb-8">
          Eliminate manual scheduling conflicts permanently. Apply an institutional blueprint, run preflight checks, and generate conflict-free timetables in seconds.
        </p>

        {/* Identical Primary CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-[#3b6fe0] hover:bg-[#2e5ccb] active:scale-[0.98] rounded-md transition-all duration-150 flex items-center justify-center gap-2 group shadow-none"
          >
            <span>Launch Free Workstation</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Risk Reversal Guarantee Chips */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-[11px] text-white/60 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-[#51cf66]" />
            <span>100% Free & MIT Licensed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-[#51cf66]" />
            <span>Zero Server Data Transmission</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-[#51cf66]" />
            <span>Runs 100% in Browser</span>
          </span>
        </div>
      </div>
    </section>
  );
};
