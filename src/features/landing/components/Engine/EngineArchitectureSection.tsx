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
    description: 'Instant millisecond diagnostics evaluating section capacity, lab feasibility, and faculty allocation pools before search begins.',
    details: 'Calculates whether required course sessions exceed working days multiplied by periods. Lab placeability checks confirm continuous two period intervals exist around break columns. Faculty demand is compared against individual teaching load caps to flag shortfalls before running the search.',
  },
  {
    id: 'expansion',
    step: 'Stage 2',
    title: 'Session expansion and structural ordering',
    description: 'Deconstructs course syllabi into session units while maintaining continuous laboratory atomicity by structural invariant.',
    details: 'A course requiring four weekly lectures expands into four independent single period units. A laboratory expands into an indivisible unit with duration of two periods. Sessions are arranged section major, transforming a combinatorially explosive search into decoupled sub problems solvable in seconds.',
  },
  {
    id: 'search',
    step: 'Stage 3',
    title: 'Backtracking solver with minimum remaining values',
    description: 'Constant time collision checks across an occupancy matrix, heuristic candidate ranking, and zero memory state rollbacks.',
    details: 'At every placement step the solver selects the most constrained session among candidates. An occupancy matrix verifies hard constraints in O(1) time: faculty overlaps, room availability, and lab continuity. Candidates are ranked using weighted heuristics for daily spread and faculty fairness.',
  },
  {
    id: 'validation',
    step: 'Stage 4',
    title: 'Authoritative independent validator',
    description: 'Solver output is never taken on faith. An isolated validator re checks every constraint before saving.',
    details: 'The validator shares zero operational code with the solver algorithm. It independently re scans the generated grid to confirm no teacher is scheduled in two locations, continuous lab blocks remain unbroken, and session counts match syllabus requirements exactly.',
  },
  {
    id: 'scoring',
    step: 'Stage 5',
    title: 'Pedagogical soft scoring',
    description: 'A multi factor quality score evaluating schedule ergonomics, gap reduction, and faculty balance.',
    details: 'After passing hard validation, schedules receive a normalized score based on subject distribution across the week, daily teaching load balance per section, and minimization of unnecessary idle hours for instructors.',
  },
];

export const EngineArchitectureSection: React.FC = () => {
  const [activeId, setActiveId] = useState<string>(STAGES[0].id);
  const active = STAGES.find((s) => s.id === activeId) ?? STAGES[0];

  return (
    <section id="engine" className="py-20 lg:py-28 bg-[#ffffff] border-b border-[#e1e4e8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#5b616b] uppercase tracking-widest mb-3">
            <span>Scheduling Engine</span>
            <span aria-hidden="true" className="text-[#d3d7dd]">·</span>
            <span className="text-[#3b6fe0]">Transparent Constraint Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#121417] leading-tight text-balance">
            A deterministic constraint solver, not an opaque black box.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#5b616b] leading-relaxed max-w-2xl text-pretty">
            Orqestra executes a constraint satisfaction backtracking search with heuristic guidance. Pure, side effect free TypeScript running entirely in your browser without external server calls.
          </p>
        </div>

        {/* Interactive Pipeline Showcase */}
        <div className="rounded-md bg-[#f6f7f8] border border-[#e1e4e8] p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Stage Selector Column */}
            <div className="lg:col-span-5 space-y-2">
              <div className="text-xs font-mono font-semibold text-[#5b616b] uppercase tracking-wider mb-3 px-1">
                Execution Pipeline
              </div>

              {STAGES.map((s) => {
                const isCurrent = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveId(s.id)}
                    className={`w-full text-left p-3.5 rounded-md border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-white border-[#3b6fe0] shadow-xs'
                        : 'bg-white/60 border-[#e1e4e8] hover:bg-white hover:border-[#d3d7dd]'
                    }`}
                  >
                    <div>
                      <span className={`text-[11px] font-mono font-semibold uppercase ${
                        isCurrent ? 'text-[#3b6fe0]' : 'text-[#5b616b]'
                      }`}>
                        {s.step}
                      </span>
                      <h3 className="text-sm font-semibold text-[#121417] mt-0.5">
                        {s.title}
                      </h3>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${
                      isCurrent ? 'text-[#3b6fe0] translate-x-0.5' : 'text-[#d3d7dd]'
                    }`} />
                  </button>
                );
              })}
            </div>

            {/* Stage Deep Dive Detail Box */}
            <div className="lg:col-span-7 rounded-md bg-white border border-[#e1e4e8] p-6 sm:p-8 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#e1e4e8] mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3b6fe0]" />
                    <span className="text-xs font-mono font-semibold text-[#3b6fe0] uppercase">
                      {active.step} In Depth
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-emerald-50 text-[#2f9e44] rounded border border-emerald-200/60">
                    O(1) Verification
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-[#121417] mb-2">
                  {active.title}
                </h3>
                <p className="text-sm font-medium text-[#3b6fe0] mb-4">
                  {active.description}
                </p>
                <p className="text-xs text-[#5b616b] leading-relaxed text-pretty">
                  {active.details}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-[#e1e4e8] flex items-center justify-between text-xs font-mono text-[#5b616b]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#2f9e44]" />
                  <span>Dual validation verified</span>
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
