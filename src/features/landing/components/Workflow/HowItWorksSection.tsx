import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sliders, Cpu, FileCheck } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Sliders,
    title: 'Define institutional parameters',
    summary: 'Working days, periods, rooms, and faculty pools',
    text: 'Set your schedule dimensions, add theory courses and continuous laboratory blocks, assign eligible faculty pools, or apply one of three preconfigured institutional blueprints in one click.',
  },
  {
    step: '02',
    icon: Cpu,
    title: 'Solve with constraint intelligence',
    summary: 'Preflight diagnostics and backtracking search',
    text: 'Preflight checks verify capacity in milliseconds before search begins. The backtracking solver then resolves hundreds of course requirements in seconds using minimum remaining values heuristics.',
  },
  {
    step: '03',
    icon: FileCheck,
    title: 'Review and publish official schedules',
    summary: 'Conflict guarded hand edits and notice board exports',
    text: 'Make fine manual adjustments with an authoritative validator that immediately blocks double bookings. When finalized, export official notice board PDFs with crest headers and signature blocks.',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-[#f6f7f8] dark:bg-[#111112] border-b border-[#e1e4e8] dark:border-[#2a2a2d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#5b616b] dark:text-[#a1a1a6] uppercase tracking-widest mb-3">
            <span>Workflow</span>
            <span aria-hidden="true" className="text-[#d3d7dd] dark:text-[#36363a]">·</span>
            <span className="text-[#3b6fe0] dark:text-[#7aa2f7]">From Setup to Publication</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#121417] dark:text-[#ececec] leading-tight text-balance">
            Publish your institutional timetable in three decisive steps.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed max-w-2xl text-pretty">
            Experience the real workstation workflow. The exact same solver, validation boundaries, and export engines running in these steps power your operational schedule.
          </p>
        </div>

        {/* 3 Step Sequence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className="rounded-md bg-white dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] p-6 sm:p-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-mono font-semibold text-[#3b6fe0] dark:text-[#7aa2f7] px-2 py-0.5 rounded bg-[#e8effc] dark:bg-[#18233a] border border-[#3b6fe0]/20 dark:border-[#7aa2f7]/20">
                    Step {s.step}
                  </span>
                  <div className="w-8 h-8 rounded-md bg-[#f6f7f8] dark:bg-[#232326] border border-[#e1e4e8] dark:border-[#2a2a2d] flex items-center justify-center text-[#5b616b] dark:text-[#a1a1a6]">
                    <s.icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-[#121417] dark:text-[#ececec] mb-1">
                  {s.title}
                </h3>
                <p className="text-xs font-mono text-[#3b6fe0] dark:text-[#7aa2f7] mb-3">
                  {s.summary}
                </p>
                <p className="text-xs text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
                  {s.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Full Packing Rule Guarantee Banner */}
        <div className="rounded-md bg-white dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] p-6 lg:p-8 flex flex-col lg:flex-row lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#3b6fe0] dark:text-[#7aa2f7] uppercase tracking-wider mb-2">
              <span>The Full Packing Rule</span>
              <span aria-hidden="true" className="text-[#d3d7dd] dark:text-[#36363a]">·</span>
              <span className="text-[#5b616b] dark:text-[#a1a1a6] font-normal">Mathematical Invariant</span>
            </div>
            <p className="text-sm font-semibold text-[#121417] dark:text-[#ececec] mb-1">
              Required session periods must match working days multiplied by daily teaching periods.
            </p>
            <p className="text-xs text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
              Two period continuous laboratories count as two periods each. Breaks like lunch sit in dedicated interval columns and are never counted toward session capacity. If requirements fall short, preflight warnings calculate the exact missing periods before search starts.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white dark:text-[#111112] bg-[#3b6fe0] hover:bg-[#2e5ccb] dark:bg-[#7aa2f7] dark:hover:bg-[#94b5f9] active:scale-[0.98] rounded-md transition-all duration-150"
          >
            <span>Test on Live Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
