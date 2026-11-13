import React from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

export const ProblemSolutionSection: React.FC = () => {
  const PAIN_POINTS = [
    {
      title: 'Hidden faculty collisions',
      description: 'Spreadsheet cells allow the same instructor to be assigned to two classes simultaneously, causing panic on the first morning of classes.',
    },
    {
      title: 'Fractured laboratory periods',
      description: 'Continuous practical laboratory sessions accidentally get split across lunch intervals or scattered as isolated individual periods.',
    },
    {
      title: 'Manual exhaustion after single changes',
      description: 'When one professor requests a schedule change, hours of manual rebalancing are required to prevent cascade conflicts.',
    },
    {
      title: 'Unequal teaching load distribution',
      description: 'Junior faculty end up with back to back teaching loads while senior schedules cluster randomly without pedagogical balance.',
    },
  ];

  const SOLVED_POINTS = [
    {
      title: 'Authoritative collision blocking',
      description: 'An occupancy matrix evaluates every session in constant time, structurally forbidding double bookings across all departments.',
    },
    {
      title: 'Guaranteed atomic practical blocks',
      description: 'Two period lab sessions are scheduled as indivisible units that never cross break intervals or exceed room capacities.',
    },
    {
      title: 'Instant preflight feasibility checks',
      description: 'Diagnostics calculate capacity shortfalls in milliseconds before search begins, providing exact corrective suggestions.',
    },
    {
      title: 'Algorithmic workload fairness',
      description: 'Soft constraint heuristics distribute sessions evenly across working days, protecting faculty research and preparation windows.',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-[#f6f7f8] border-b border-[#e1e4e8]" id="solution">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#5b616b] uppercase tracking-widest mb-3">
            <span>The Academic Bottleneck</span>
            <span aria-hidden="true" className="text-[#d3d7dd]">·</span>
            <span className="text-[#3b6fe0]">From Manual Chaos to Solver Precision</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#121417] leading-tight text-balance">
            Academic timetabling is too complex for human memory and spreadsheets.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#5b616b] leading-relaxed max-w-2xl text-pretty">
            Universities spend weeks every semester manually reconciling rooms, laboratory blocks, and faculty availability. Orqestra replaces that fragile manual grind with automated constraint solving.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Legacy Spreadsheets Card */}
          <div className="rounded-md bg-white border border-[#e1e4e8] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-[#e1e4e8] mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-red-50 border border-red-200/60 flex items-center justify-center text-[#c92a2a]">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#121417]">The Spreadsheet Reality</h3>
                    <p className="text-xs text-[#5b616b]">Fragile, error prone manual coordination</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase bg-red-50 text-[#c92a2a] rounded border border-red-200/60">
                  High Risk
                </span>
              </div>

              <div className="space-y-4">
                {PAIN_POINTS.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-[#c92a2a] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#121417]">{item.title}</p>
                      <p className="text-xs text-[#5b616b] mt-0.5 leading-relaxed text-pretty">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-[#e1e4e8] text-xs font-mono text-[#5b616b]">
              Outcome: 40+ hours wasted per department with inevitable opening day clashes.
            </div>
          </div>

          {/* Orqestra Solver Card */}
          <div className="rounded-md bg-white border border-[#3b6fe0]/40 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-[#e1e4e8] mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#e8effc] border border-[#3b6fe0]/30 flex items-center justify-center text-[#3b6fe0]">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#121417]">The Orqestra Solver</h3>
                    <p className="text-xs text-[#5b616b]">Mathematical constraint satisfaction in seconds</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase bg-[#e8effc] text-[#3b6fe0] rounded border border-[#3b6fe0]/30">
                  Zero Conflicts
                </span>
              </div>

              <div className="space-y-4">
                {SOLVED_POINTS.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#2f9e44] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#121417]">{item.title}</p>
                      <p className="text-xs text-[#5b616b] mt-0.5 leading-relaxed text-pretty">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-[#e1e4e8] text-xs font-mono text-[#2f9e44] flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Outcome: 100% verified collision free schedule ready for notice board publication in seconds.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
