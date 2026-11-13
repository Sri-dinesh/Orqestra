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
    <section className="relative pt-20 pb-12 sm:pt-24 sm:pb-14 overflow-hidden bg-[#f6f7f8] dark:bg-[#111112]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Eyebrow & Hero Copy */}
        <div className="max-w-3xl sm:max-w-4xl mx-auto text-center mb-6 sm:mb-8">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#ffffff] dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] text-[11px] font-mono font-medium text-[#5b616b] dark:text-[#a1a1a6] mb-3.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b6fe0] dark:bg-[#7aa2f7]" />
            <span>Academic Timetable Generator</span>
            <span aria-hidden="true" className="text-[#d3d7dd] dark:text-[#36363a]">·</span>
            <span className="text-[#121417] dark:text-[#ececec] font-semibold">100% Client Side Solver</span>
          </div>

          {/* Heading with approved text gradient */}
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold tracking-tight leading-[1.12] text-balance mb-3.5 bg-gradient-to-r from-[#000000] to-[#666666] dark:from-[#ffffff] dark:to-[#9b9b9b] bg-clip-text text-transparent">
            Conflict free institutional timetables without spreadsheet chaos.
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-base text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed max-w-2xl mx-auto text-pretty mb-5">
            Generate collision free weekly schedules for universities, colleges, and schools in seconds with an authoritative backtracking constraint solver running in your browser.
          </p>

          {/* Single Primary Action CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-white dark:text-[#111112] bg-[#3b6fe0] hover:bg-[#2e5ccb] dark:bg-[#7aa2f7] dark:hover:bg-[#94b5f9] active:scale-[0.98] rounded-md transition-all duration-150 flex items-center justify-center gap-2 group shadow-none focus:outline-none focus:ring-2 focus:ring-[#3b6fe0] dark:focus:ring-[#7aa2f7] focus:ring-offset-2"
            >
              <span>Launch Free Workstation</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* One Clean Proof Line */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] font-mono text-[#5b616b] dark:text-[#a1a1a6]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2f9e44] dark:text-[#51cf66]" />
              <span>Zero server transmission</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2f9e44] dark:text-[#51cf66]" />
              <span>No signup or card required</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2f9e44] dark:text-[#51cf66]" />
              <span>Official notice board PDF export</span>
            </span>
          </div>
        </div>

        {/* Hero Visual: Interactive Schedule Specimen */}
        <div className="max-w-5xl mx-auto">
          <div className="mb-2 flex items-center justify-between text-[11px] text-[#5b616b] dark:text-[#a1a1a6] px-1 font-mono">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#3b6fe0] dark:text-[#7aa2f7]" />
              <span>LIVE SOLVER PREVIEW · SECTION SCHEDULE GRID</span>
            </span>
            <span className="hidden sm:inline">
              O(1) OCCUPANCY MATRIX · ZERO CONFLICTS
            </span>
          </div>
          <HeroScheduleVisualizer onSelectClass={onSelectClass} />

          {/* Compact Integrated Metric Band */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 rounded-md border border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] divide-y md:divide-y-0 md:divide-x divide-[#e1e4e8] dark:divide-[#2a2a2d] text-center overflow-hidden">
            <div className="py-2.5 px-3">
              <div className="text-xl lg:text-2xl font-bold text-[#121417] dark:text-[#ececec] font-mono tabular">
                378
              </div>
              <div className="text-[11px] text-[#5b616b] dark:text-[#a1a1a6] mt-0.5">
                Sessions solved in 2.4s
              </div>
            </div>
            <div className="py-2.5 px-3">
              <div className="text-xl lg:text-2xl font-bold text-[#121417] dark:text-[#ececec] font-mono tabular">
                100%
              </div>
              <div className="text-[11px] text-[#5b616b] dark:text-[#a1a1a6] mt-0.5">
                Client side computation
              </div>
            </div>
            <div className="py-2.5 px-3">
              <div className="text-xl lg:text-2xl font-bold text-[#121417] dark:text-[#ececec] font-mono tabular">
                20
              </div>
              <div className="text-[11px] text-[#5b616b] dark:text-[#a1a1a6] mt-0.5">
                Reversible snapshots saved
              </div>
            </div>
            <div className="py-2.5 px-3">
              <div className="text-xl lg:text-2xl font-bold text-[#121417] dark:text-[#ececec] font-mono tabular">
                0
              </div>
              <div className="text-[11px] text-[#5b616b] dark:text-[#a1a1a6] mt-0.5">
                Licensing or subscription fees
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
