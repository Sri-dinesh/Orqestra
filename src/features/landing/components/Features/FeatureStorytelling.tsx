import React from 'react';
import {
  ShieldCheck,
  Clock,
  Scale,
  Award,
  FileDown,
  Cpu,
  Layers,
  History,
} from 'lucide-react';

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: 'Zero schedule collisions',
    text: 'Backtracking search ensures no faculty member, room, or student batch is double booked across teaching periods.',
  },
  {
    icon: Clock,
    title: 'Atomic continuous laboratory blocks',
    text: 'Two-period lab sessions schedule as indivisible units that never fragment across days or cross lunch intervals.',
  },
  {
    icon: Scale,
    title: 'Equitable faculty workload',
    text: 'Heuristics distribute daily and weekly teaching loads fairly, protecting preparation windows and preventing burnout.',
  },
  {
    icon: Award,
    title: 'Regulatory curriculum compliance',
    text: 'Strictly satisfies institutional credit mandates by verifying weekly session counts before timetable completion.',
  },
  {
    icon: FileDown,
    title: 'Notice board publication exports',
    text: 'Generate official notice-board PDF documents complete with institutional headers, course codes, and signature blocks.',
  },
  {
    icon: Cpu,
    title: 'Deterministic solver seeding',
    text: 'Pure client-side execution records solver seeds so identical inputs reliably produce bit-identical schedules.',
  },
];

const ARCHITECTURE_PILLARS = [
  {
    icon: Cpu,
    title: 'MRV Backtracking Solver',
    text: 'Evaluates hard constraints against an occupancy matrix in constant time with instant state rollbacks.',
  },
  {
    icon: Layers,
    title: 'Multi-Semester Isolation',
    text: 'Keep academic terms separate with semester cloning to carry over faculty and room data without re-entry.',
  },
  {
    icon: History,
    title: 'Local Snapshot History',
    text: 'Every solver run and manual edit creates a restorable browser snapshot for instant one-click rollback.',
  },
];

export const FeatureStorytelling: React.FC = () => {
  return (
    <section id="features" className="py-14 lg:py-20 bg-white dark:bg-[#111112] border-b border-[#e1e4e8] dark:border-[#2a2a2d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <div className="text-[11px] font-mono font-medium text-[#3b6fe0] dark:text-[#7aa2f7] uppercase tracking-wider mb-2">
            Capabilities
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#121417] dark:text-[#ececec] leading-tight text-balance">
            Everything needed for verifiable academic timetables.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
            Built for engineering colleges, universities, and academic departments balancing faculty availability, multi-period laboratories, and room constraints.
          </p>
        </div>

        {/* 6 Core Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {CAPABILITIES.map((c) => (
            <div
              key={c.title}
              className="rounded-md bg-[#ffffff] dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] p-5 flex flex-col justify-between hover:border-[#3b6fe0]/40 dark:hover:border-[#7aa2f7]/40 transition-colors"
            >
              <div>
                <div className="w-8 h-8 rounded-md bg-[#e8effc] dark:bg-[#18233a] text-[#3b6fe0] dark:text-[#7aa2f7] flex items-center justify-center mb-3.5 border border-[#3b6fe0]/20 dark:border-[#7aa2f7]/20">
                  <c.icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#121417] dark:text-[#ececec] mb-1.5">
                  {c.title}
                </h3>
                <p className="text-xs text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
                  {c.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 3 Secondary Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {ARCHITECTURE_PILLARS.map((p) => (
            <div
              key={p.title}
              className="p-4 rounded-md bg-[#f6f7f8] dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded bg-white dark:bg-[#232326] border border-[#e1e4e8] dark:border-[#2a2a2d] flex items-center justify-center shrink-0 mt-0.5 text-[#3b6fe0] dark:text-[#7aa2f7]">
                <p.icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#121417] dark:text-[#ececec] mb-0.5">
                  {p.title}
                </h4>
                <p className="text-[11px] text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
                  {p.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
