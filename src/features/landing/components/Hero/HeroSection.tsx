import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { HeroScheduleVisualizer } from './HeroScheduleVisualizer';
import { ScheduleClass } from '../../types/schedule';

interface HeroSectionProps {
  onScrollToDemo: () => void;
  onRequestPilot: () => void;
  onSelectClass?: (item: ScheduleClass) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onScrollToDemo: _onScrollToDemo,
  onRequestPilot,
  onSelectClass,
}) => {
  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-[#F7F8F5]">
      {/* Subtle architectural grid backdrop */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />

      {/* Subtle radial ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-50/50 via-transparent to-transparent pointer-events-none blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Eyebrow & Headline Container */}
        <div className="max-w-4xl mx-auto text-center mb-10 lg:mb-14">
          {/* Eyebrow - Clean unboxed text with typographic separator (Zero-pill discipline) */}
          <div className="flex items-center justify-center gap-2 text-xs font-mono font-medium tracking-widest text-[#4B5259] uppercase mb-4">
            <span>Academic Scheduling Infrastructure</span>
            <span aria-hidden="true" className="text-black/30">·</span>
            <span className="text-[#0047FF] font-semibold">Constraint Solver Engine</span>
          </div>

          {/* Primary Editorial Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111315] leading-[1.08] text-balance mb-6">
            Build the timetable your institution{' '}
            <span className="relative inline-block">
              actually needs.
              <span className="absolute bottom-1 left-0 w-full h-[3px] bg-[#0047FF]/25 -z-10 rounded-full" />
            </span>
          </h1>

          {/* Value Proposition Subtitle */}
          <p className="text-base sm:text-lg lg:text-xl text-[#4B5259] max-w-2xl mx-auto leading-relaxed text-balance mb-8">
            Generate optimized, conflict-free academic schedules by coordinating faculty availability,
            classrooms, laboratories, sections, workloads, and institutional rules automatically.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-[#111315] hover:bg-[#0047FF] rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
            >
              <span>Enter Orqestra Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={onRequestPilot}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-[#111315] bg-white hover:bg-[#FAFBF9] border border-[#E5E8E0] hover:border-[#111315] rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>Request institutional pilot</span>
            </button>
          </div>

          {/* Institutional Trust markers */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-[#71767B]">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Colleges & Universities
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Secondary Schools
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Multi-Campus Academic Systems
            </span>
          </div>
        </div>

        {/* Hero Visual - Signature Scheduling Engine Visualizer */}
        <div className="max-w-5xl mx-auto">
          <div className="mb-2 flex items-center justify-between text-xs text-[#71767B] px-1 font-mono">
            <span>LIVE SOLVER INTERFACE</span>
            <span className="tabular">LATENCY: 0.04S · CONFLICT RESOLUTION: ACTIVE</span>
          </div>
          <HeroScheduleVisualizer onSelectClass={onSelectClass} />
        </div>

        {/* Rigorous Quantitative Proof Band */}
        <div className="mt-14 max-w-5xl mx-auto pt-8 border-t border-[#E5E8E0] grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="font-display text-2xl lg:text-3xl font-bold text-[#111315] tabular">
              100%
            </div>
            <div className="text-xs font-medium text-[#71767B] mt-1">
              Conflict-Free Proof
            </div>
          </div>
          <div>
            <div className="font-display text-2xl lg:text-3xl font-bold text-[#111315] tabular">
              14,000+
            </div>
            <div className="text-xs font-medium text-[#71767B] mt-1">
              Active Constraints Evaluated
            </div>
          </div>
          <div>
            <div className="font-display text-2xl lg:text-3xl font-bold text-[#111315] tabular">
              &lt; 30s
            </div>
            <div className="text-xs font-medium text-[#71767B] mt-1">
              Full Semester Generation
            </div>
          </div>
          <div>
            <div className="font-display text-2xl lg:text-3xl font-bold text-[#111315] tabular">
              0
            </div>
            <div className="text-xs font-medium text-[#71767B] mt-1">
              Faculty Overlaps
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
