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

const CORE_BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Zero schedule collisions',
    headline: 'Guaranteed conflict prevention across parallel sections',
    text: 'Algorithmic backtracking ensures no faculty member, classroom, or student batch is double booked across teaching periods, preventing opening day chaos.',
  },
  {
    icon: Clock,
    title: 'Atomic continuous laboratory blocks',
    headline: 'Practical labs scheduled as indivisible multi period units',
    text: 'Laboratory sessions are placed as uninterrupted two period blocks by construction. They never cross lunch intervals or get fragmented across days.',
  },
  {
    icon: Scale,
    title: 'Equitable faculty workload distribution',
    headline: 'Intelligent heuristics balance teaching loads across working days',
    text: 'Heuristic scoring balances daily and weekly hours among eligible teachers, protecting preparation time and preventing educator burnout.',
  },
  {
    icon: Award,
    title: 'Instant regulatory curriculum compliance',
    headline: 'Aligned with credit standards and institutional guidelines',
    text: 'Strictly satisfies AICTE, UGC, and national credit mandates by verifying exact weekly session counts per course before generation completes.',
  },
  {
    icon: FileDown,
    title: 'Notice board publication exports',
    headline: 'Official printable PDF grids with crest headers and signatures',
    text: 'Generate official notice board timetables with institutional crests, course codes, instructor names, section advisors, and signatory blocks.',
  },
];

const CAPABILITY_TILES = [
  {
    icon: Cpu,
    title: 'Minimum remaining values backtracking solver',
    text: 'Evaluates hard constraints against an occupancy matrix in constant time, exploring thousands of candidate states per second with reversible rollback.',
  },
  {
    icon: Layers,
    title: 'Multi semester workspace isolation',
    text: 'Maintain separate academic terms with full semester cloning. Carry over faculty directories, rooms, and course structures without retyping data.',
  },
  {
    icon: History,
    title: 'Twenty restorable snapshot versions',
    text: 'Every solver execution and manual edit creates a restorable snapshot in your browser. Revert to any prior iteration with complete confidence.',
  },
];

export const FeatureStorytelling: React.FC = () => {
  return (
    <section id="features" className="py-20 lg:py-28 bg-[#ffffff] dark:bg-[#111112] border-b border-[#e1e4e8] dark:border-[#2a2a2d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#5b616b] dark:text-[#a1a1a6] uppercase tracking-widest mb-3">
            <span>Core Capabilities</span>
            <span aria-hidden="true" className="text-[#d3d7dd] dark:text-[#36363a]">·</span>
            <span className="text-[#3b6fe0] dark:text-[#7aa2f7]">Engineered for Higher Education</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#121417] dark:text-[#ececec] leading-tight text-balance">
            Everything an academic institution requires to generate verifiable timetables.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed max-w-2xl text-pretty">
            Designed specifically for engineering colleges, universities, and academic departments balancing complex faculty pools, multi period laboratories, and physical room constraints.
          </p>
        </div>

        {/* 5 Core Outcome-Driven Benefit Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {CORE_BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-md bg-white dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] p-6 flex flex-col justify-between hover:border-[#3b6fe0]/50 dark:hover:border-[#7aa2f7]/50 transition-colors"
            >
              <div>
                <div className="w-10 h-10 rounded-md bg-[#e8effc] dark:bg-[#18233a] text-[#3b6fe0] dark:text-[#7aa2f7] flex items-center justify-center mb-4 border border-[#3b6fe0]/20 dark:border-[#7aa2f7]/20">
                  <b.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[#121417] dark:text-[#ececec] mb-1">
                  {b.title}
                </h3>
                <p className="text-xs font-mono text-[#3b6fe0] dark:text-[#7aa2f7] mb-3">
                  {b.headline}
                </p>
                <p className="text-xs text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
                  {b.text}
                </p>
              </div>
            </div>
          ))}

          {/* Special Bento Architecture Card */}
          <div className="rounded-md bg-[#121417] dark:bg-[#18181a] text-white p-6 flex flex-col justify-between border border-[#121417] dark:border-[#2a2a2d]">
            <div>
              <div className="w-10 h-10 rounded-md bg-white/10 text-[#7aa2f7] flex items-center justify-center mb-4 border border-white/10">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Deterministic solver seeding
              </h3>
              <p className="text-xs font-mono text-[#7aa2f7] mb-3">
                Bit identical timetable reproduction
              </p>
              <p className="text-xs text-white/70 leading-relaxed text-pretty">
                Every solver run records its pseudo random number seed. Running the solver with the exact same seed and parameters regenerates the exact same schedule bit for bit.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-mono text-[#51cf66]">
              Verified by automated integration test suites
            </div>
          </div>
        </div>

        {/* 3 Secondary Capability Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {CAPABILITY_TILES.map((t) => (
            <div
              key={t.title}
              className="p-5 rounded-md bg-[#f6f7f8] dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <t.icon className="w-4 h-4 text-[#3b6fe0] dark:text-[#7aa2f7]" />
                  <h4 className="text-sm font-semibold text-[#121417] dark:text-[#ececec]">
                    {t.title}
                  </h4>
                </div>
                <p className="text-xs text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
                  {t.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
