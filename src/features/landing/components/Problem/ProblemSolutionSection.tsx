import React from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

export const ProblemSolutionSection: React.FC = () => {
  const PAIN_POINTS = [
    {
      title: 'Hidden faculty collisions',
      description: 'Instructors accidentally assigned to multiple classes simultaneously, causing first-day schedule panic.',
    },
    {
      title: 'Fractured laboratory periods',
      description: 'Multi-period practicals split across lunch intervals or scattered as isolated single periods.',
    },
    {
      title: 'Cascade rebalancing fatigue',
      description: 'A single instructor change forces hours of manual reshuffling across the entire department grid.',
    },
    {
      title: 'Unequal teaching load distribution',
      description: 'Teaching loads cluster unevenly across weekdays without pedagogical balance or fair distribution.',
    },
  ];

  const SOLVED_POINTS = [
    {
      title: 'Authoritative collision blocking',
      description: 'Occupancy matrix checks every slot in constant time, structurally forbidding double bookings.',
    },
    {
      title: 'Guaranteed atomic practical blocks',
      description: 'Two-period lab sessions schedule as indivisible units that never cross break intervals.',
    },
    {
      title: 'Instant preflight feasibility checks',
      description: 'Millisecond checks catch capacity shortages before search begins with exact corrective advice.',
    },
    {
      title: 'Algorithmic workload fairness',
      description: 'Heuristic scoring distributes teaching sessions evenly across days, protecting prep windows.',
    },
  ];

  return (
    <section className="py-14 lg:py-20 bg-[#f6f7f8] dark:bg-[#111112] border-b border-[#e1e4e8] dark:border-[#2a2a2d]" id="solution">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <div className="text-[11px] font-mono font-medium text-[#3b6fe0] dark:text-[#7aa2f7] uppercase tracking-wider mb-2">
            The Problem & The Solution
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#121417] dark:text-[#ececec] leading-tight text-balance">
            Academic timetabling is too complex for spreadsheets.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
            Universities spend weeks manually reconciling rooms, laboratory blocks, and faculty availability. Orqestra replaces that fragile manual grind with automated constraint solving.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Legacy Spreadsheets Card */}
          <div className="rounded-md bg-white dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#e1e4e8] dark:border-[#2a2a2d] mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 flex items-center justify-center text-[#c92a2a] dark:text-[#ff6b6b]">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#121417] dark:text-[#ececec]">The Spreadsheet Reality</h3>
                    <p className="text-[11px] text-[#5b616b] dark:text-[#a1a1a6]">Fragile, error-prone manual coordination</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-red-50 dark:bg-red-950/30 text-[#c92a2a] dark:text-[#ff6b6b] rounded border border-red-200/60 dark:border-red-900/40">
                  High Risk
                </span>
              </div>

              <div className="space-y-3.5">
                {PAIN_POINTS.map((item) => (
                  <div key={item.title} className="flex items-start gap-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#c92a2a] dark:text-[#ff6b6b] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#121417] dark:text-[#ececec]">{item.title}</p>
                      <p className="text-xs text-[#5b616b] dark:text-[#a1a1a6] mt-0.5 leading-relaxed text-pretty">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e1e4e8] dark:border-[#2a2a2d] text-[11px] font-mono text-[#5b616b] dark:text-[#a1a1a6]">
              Outcome: 40+ hours wasted per department with inevitable opening-day clashes.
            </div>
          </div>

          {/* Orqestra Solver Card (Uniform hairline border) */}
          <div className="rounded-md bg-white dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#e1e4e8] dark:border-[#2a2a2d] mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-[#e8effc] dark:bg-[#18233a] border border-[#3b6fe0]/30 dark:border-[#7aa2f7]/30 flex items-center justify-center text-[#3b6fe0] dark:text-[#7aa2f7]">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#121417] dark:text-[#ececec]">The Orqestra Solver</h3>
                    <p className="text-[11px] text-[#5b616b] dark:text-[#a1a1a6]">Constraint satisfaction in seconds</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-[#e8effc] dark:bg-[#18233a] text-[#3b6fe0] dark:text-[#7aa2f7] rounded border border-[#3b6fe0]/30 dark:border-[#7aa2f7]/30">
                  Zero Conflicts
                </span>
              </div>

              <div className="space-y-3.5">
                {SOLVED_POINTS.map((item) => (
                  <div key={item.title} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2f9e44] dark:text-[#51cf66] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#121417] dark:text-[#ececec]">{item.title}</p>
                      <p className="text-xs text-[#5b616b] dark:text-[#a1a1a6] mt-0.5 leading-relaxed text-pretty">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e1e4e8] dark:border-[#2a2a2d] text-[11px] font-mono text-[#2f9e44] dark:text-[#51cf66] flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3 h-3" />
              Outcome: 100% verified collision-free schedule ready for publication in seconds.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
