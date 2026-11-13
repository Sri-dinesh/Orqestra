import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sliders, Cpu, FileCheck } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Sliders,
    title: 'Define institutional parameters',
    text: 'Set schedule dimensions, add theory courses and continuous laboratory blocks, assign faculty pools, or apply a preconfigured blueprint.',
  },
  {
    step: '02',
    icon: Cpu,
    title: 'Solve with constraint intelligence',
    text: 'Preflight checks verify capacity in milliseconds. The backtracking solver then resolves all course requirements in seconds using MRV heuristics.',
  },
  {
    step: '03',
    icon: FileCheck,
    title: 'Review and publish schedules',
    text: 'Fine-tune manual assignments with real-time collision prevention, then export notice-board PDFs with institutional headers and signatures.',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-14 lg:py-20 bg-[#f6f7f8] dark:bg-[#111112] border-b border-[#e1e4e8] dark:border-[#2a2a2d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <div className="text-[11px] font-mono font-medium text-[#3b6fe0] dark:text-[#7aa2f7] uppercase tracking-wider mb-2">
            Workflow
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#121417] dark:text-[#ececec] leading-tight text-balance">
            From setup to publication in three steps.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
            The exact same solver, validation boundaries, and export engines shown here power your department schedule in the workstation.
          </p>
        </div>

        {/* 3 Step Sequence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className="rounded-md bg-white dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] p-5 sm:p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-semibold text-[#3b6fe0] dark:text-[#7aa2f7] px-2 py-0.5 rounded bg-[#e8effc] dark:bg-[#18233a] border border-[#3b6fe0]/20 dark:border-[#7aa2f7]/20">
                    Step {s.step}
                  </span>
                  <div className="w-7 h-7 rounded-md bg-[#f6f7f8] dark:bg-[#232326] border border-[#e1e4e8] dark:border-[#2a2a2d] flex items-center justify-center text-[#5b616b] dark:text-[#a1a1a6]">
                    <s.icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h3 className="text-base font-semibold text-[#121417] dark:text-[#ececec] mb-2">
                  {s.title}
                </h3>
                <p className="text-xs text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
                  {s.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Full Packing Rule Guarantee Banner */}
        <div className="rounded-md bg-white dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] p-5 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="text-[11px] font-mono font-semibold text-[#3b6fe0] dark:text-[#7aa2f7] uppercase tracking-wider mb-1">
              Mathematical Invariant
            </div>
            <p className="text-sm font-semibold text-[#121417] dark:text-[#ececec] mb-1">
              The Full Packing Rule
            </p>
            <p className="text-xs text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
              Total required session periods must match working days multiplied by daily teaching periods. Continuous lab blocks count as two periods each. Preflight warnings compute any period deficit before search begins.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white dark:text-[#111112] bg-[#3b6fe0] hover:bg-[#2e5ccb] dark:bg-[#7aa2f7] dark:hover:bg-[#94b5f9] active:scale-[0.98] rounded-md transition-all duration-150"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
