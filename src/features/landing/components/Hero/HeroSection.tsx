import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Cpu } from 'lucide-react';
import { HeroScheduleVisualizer } from './HeroScheduleVisualizer';
import { ScheduleClass } from '../../types/schedule';

interface HeroSectionProps {
  onScrollToDemo: () => void;
  onSelectClass?: (item: ScheduleClass) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSelectClass,
}) => {
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 overflow-hidden bg-[#f6f7f8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Eyebrow & Hero Copy */}
        <div className="max-w-[680px] mx-auto text-center mb-10 sm:mb-14">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#ffffff] border border-[#e1e4e8] text-xs font-mono font-medium text-[#5b616b] mb-6 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b6fe0]" />
            <span>Academic Timetable Generator</span>
            <span aria-hidden="true" className="text-[#d3d7dd]">·</span>
            <span className="text-[#121417] font-semibold">100% Client Side Solver</span>
          </div>

          {/* Heading with approved text gradient */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08] text-balance mb-6 bg-gradient-to-r from-[#000000] to-[#666666] bg-clip-text text-transparent">
            Conflict free institutional timetables without spreadsheet chaos.
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-[#5b616b] leading-relaxed text-pretty mb-8">
            Generate collision free weekly schedules for universities, colleges, and academic departments in seconds. An authoritative backtracking constraint solver running completely in your browser.
          </p>

          {/* Single Primary Action CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-[#3b6fe0] hover:bg-[#2e5ccb] active:scale-[0.98] rounded-md transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center gap-2 group shadow-none focus:outline-none focus:ring-2 focus:ring-[#3b6fe0] focus:ring-offset-2"
            >
              <span>Launch Free Workstation</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* One Clean Proof Line */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-[#5b616b]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2f9e44]" />
              <span>Zero data leaves your browser</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2f9e44]" />
              <span>No signup or credit card required</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2f9e44]" />
              <span>Official notice board PDF export</span>
            </span>
          </div>
        </div>

        {/* Hero Visual: Interactive Schedule Specimen */}
        <div className="max-w-5xl mx-auto">
          <div className="mb-2.5 flex items-center justify-between text-xs text-[#5b616b] px-1 font-mono">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#3b6fe0]" />
              <span>LIVE SOLVER PREVIEW · SECTION SCHEDULE GRID</span>
            </span>
            <span className="hidden sm:inline">
              O(1) OCCUPANCY MATRIX · ZERO CONFLICTS
            </span>
          </div>
          <HeroScheduleVisualizer onSelectClass={onSelectClass} />
        </div>

        {/* Real Proof Metric Band */}
        <div className="mt-14 max-w-5xl mx-auto pt-8 border-t border-[#e1e4e8] grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-md bg-white border border-[#e1e4e8]">
            <div className="text-2xl lg:text-3xl font-semibold text-[#121417] font-mono">
              378
            </div>
            <div className="text-xs font-medium text-[#5b616b] mt-1 text-pretty">
              Sessions solved in 2.4s in the Enterprise blueprint
            </div>
          </div>
          <div className="p-4 rounded-md bg-white border border-[#e1e4e8]">
            <div className="text-2xl lg:text-3xl font-semibold text-[#121417] font-mono">
              100%
            </div>
            <div className="text-xs font-medium text-[#5b616b] mt-1 text-pretty">
              Client side computation with zero server data retention
            </div>
          </div>
          <div className="p-4 rounded-md bg-white border border-[#e1e4e8]">
            <div className="text-2xl lg:text-3xl font-semibold text-[#121417] font-mono">
              20
            </div>
            <div className="text-xs font-medium text-[#5b616b] mt-1 text-pretty">
              Reversible snapshots stored locally per timetable
            </div>
          </div>
          <div className="p-4 rounded-md bg-white border border-[#e1e4e8]">
            <div className="text-2xl lg:text-3xl font-semibold text-[#121417] font-mono">
              0
            </div>
            <div className="text-xs font-medium text-[#5b616b] mt-1 text-pretty">
              Licensing fees or subscription contracts required
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
