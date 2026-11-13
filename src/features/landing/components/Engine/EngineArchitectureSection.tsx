import React, { useState } from 'react';
import { ShieldCheck, ChevronRight } from 'lucide-react';

interface Stage {
  id: string;
  step: string;
  title: string;
  description: string;
  details: string;
}

const STAGES: Stage[] = [
  {
    id: 'preflight',
    step: 'Stage 1',
    title: 'Preflight feasibility analysis',
    description: 'Instant diagnostics evaluating section capacity, lab feasibility, and faculty pools before search starts.',
    details: 'Verifies that required sessions do not exceed working days multiplied by periods. Confirms uninterrupted two-period slots exist around lunch breaks, and checks faculty load caps to flag shortfalls before solving.',
  },
  {
    id: 'expansion',
    step: 'Stage 2',
    title: 'Session expansion & structural ordering',
    description: 'Deconstructs course syllabi into session units while maintaining continuous laboratory atomicity.',
    details: 'Expands 4-lecture courses into 4 single-period units and labs into indivisible 2-period units. Arranging sessions in section-major order decouples the search space into sub-problems solvable in seconds.',
  },
  {
    id: 'search',
    step: 'Stage 3',
    title: 'Backtracking solver with MRV heuristics',
    description: 'Constant-time collision checks across an occupancy matrix, heuristic ranking, and zero-memory rollbacks.',
    details: 'Picks the most constrained session first. An occupancy matrix verifies faculty availability, room capacity, and lab continuity in O(1) time. Weighted heuristics optimize daily distribution and faculty balance.',
  },
  {
    id: 'validation',
    step: 'Stage 4',
    title: 'Authoritative independent validator',
    description: 'Independent validation pass re-checking every hard constraint before saving.',
    details: 'Shares zero operational code with the solver algorithm. Independently re-scans the resulting grid to verify no instructor double-bookings, unbroken lab blocks, and exact syllabus adherence.',
  },
  {
    id: 'scoring',
    step: 'Stage 5',
    title: 'Pedagogical soft scoring',
    description: 'Multi-factor quality score assessing schedule ergonomics, gap reduction, and faculty balance.',
    details: 'Evaluates the completed timetable for subject spread across weekdays, balanced daily teaching hours, and minimal idle gaps for instructors.',
  },
];

export const EngineArchitectureSection: React.FC = () => {
  const [activeId, setActiveId] = useState<string>(STAGES[0].id);
  const active = STAGES.find((s) => s.id === activeId) ?? STAGES[0];

  return (
    <section id="engine" className="py-14 lg:py-20 bg-[#ffffff] dark:bg-[#111112] border-b border-[#e1e4e8] dark:border-[#2a2a2d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <div className="text-[11px] font-mono font-medium text-[#3b6fe0] dark:text-[#7aa2f7] uppercase tracking-wider mb-2">
            Solver Engine
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#121417] dark:text-[#ececec] leading-tight text-balance">
            Deterministic constraint solver, not an opaque black box.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
            Constraint satisfaction backtracking search with heuristic guidance, running entirely in your browser with zero server latency.
          </p>
        </div>

        {/* Interactive Pipeline Showcase */}
        <div className="rounded-md bg-[#f6f7f8] dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Stage Selector Column */}
            <div className="lg:col-span-5 space-y-1.5">
              <div className="text-[11px] font-mono font-semibold text-[#5b616b] dark:text-[#a1a1a6] uppercase tracking-wider mb-2 px-1">
                Execution Pipeline
              </div>

              {STAGES.map((s) => {
                const isCurrent = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveId(s.id)}
                    className={`w-full text-left p-3 rounded-md border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-white dark:bg-[#232326] border-[#3b6fe0] dark:border-[#7aa2f7] shadow-xs'
                        : 'bg-white/60 dark:bg-[#18181a]/60 border-[#e1e4e8] dark:border-[#2a2a2d] hover:bg-white dark:hover:bg-[#232326] hover:border-[#d3d7dd] dark:hover:border-[#36363a]'
                    }`}
                  >
                    <div>
                      <span className={`text-[10px] font-mono font-semibold uppercase ${
                        isCurrent ? 'text-[#3b6fe0] dark:text-[#7aa2f7]' : 'text-[#5b616b] dark:text-[#a1a1a6]'
                      }`}>
                        {s.step}
                      </span>
                      <h3 className="text-xs sm:text-sm font-semibold text-[#121417] dark:text-[#ececec]">
                        {s.title}
                      </h3>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                      isCurrent ? 'text-[#3b6fe0] dark:text-[#7aa2f7] translate-x-0.5' : 'text-[#d3d7dd] dark:text-[#36363a]'
                    }`} />
                  </button>
                );
              })}
            </div>

            {/* Stage Deep Dive Detail Box */}
            <div className="lg:col-span-7 rounded-md bg-white dark:bg-[#111112] border border-[#e1e4e8] dark:border-[#2a2a2d] p-5 sm:p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-[#e1e4e8] dark:border-[#2a2a2d] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3b6fe0] dark:bg-[#7aa2f7]" />
                    <span className="text-[11px] font-mono font-semibold text-[#3b6fe0] dark:text-[#7aa2f7] uppercase">
                      {active.step} In Depth
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-emerald-50 dark:bg-emerald-950/30 text-[#2f9e44] dark:text-[#51cf66] rounded border border-emerald-200/60 dark:border-emerald-900/40">
                    O(1) Verification
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-[#121417] dark:text-[#ececec] mb-1.5">
                  {active.title}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-[#3b6fe0] dark:text-[#7aa2f7] mb-3">
                  {active.description}
                </p>
                <p className="text-xs text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
                  {active.details}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#e1e4e8] dark:border-[#2a2a2d] flex items-center justify-between text-[11px] font-mono text-[#5b616b] dark:text-[#a1a1a6]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2f9e44] dark:text-[#51cf66]" />
                  <span>Dual validation</span>
                </span>
                <span>Deterministic reproducibility</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
