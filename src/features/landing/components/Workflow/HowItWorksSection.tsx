import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    n: "01",
    title: "Create a department — or apply a preset",
    text: "Start from scratch on the dashboard, or apply one of 3 institutional blueprints (from Standard School to a 9-section B.Tech Enterprise setup) that wires up sections, subjects, faculty, and requirements in one click.",
  },
  {
    n: "02",
    title: "Configure days, periods, sections, subjects, faculty",
    text: "Set working days and teaching periods per day, add sections, define theory and lab subjects with eligible faculty pools, and assign weekly session requirements per section. Labs always count as 2 consecutive periods.",
  },
  {
    n: "03",
    title: "Check preflight before you generate",
    text: "The Generate page analyzes feasibility in milliseconds: section capacity vs. weekly periods, lab placeability around breaks, faculty workload vs. caps, and stale subject references — with exact shortfalls and suggestions.",
  },
  {
    n: "04",
    title: "Generate with a seeded solver",
    text: "Run the backtracking search with an optional seed (same input + same seed = bit-identical timetable), per-department time and node budgets, live progress, and cancel. Finished runs report duration, explored nodes, backtracks, and a quality score.",
  },
  {
    n: "05",
    title: "Edit by hand — validation blocks conflicts",
    text: "Click an entry to select it, click a free slot to move, right-click to swap, double-click to change subject, faculty, day, or period. Conflicting edits are rejected with a blocking modal; valid edits support undo/redo and snapshot a restorable version.",
  },
  {
    n: "06",
    title: "Review faculty load, then export",
    text: "Set availability and preferred windows per teacher, review the read-only faculty timetable for weekly balance, then export the official notice-board PDF or Excel grid — or print directly.",
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section
      id="how-it-works"
      className="gsap-section-reveal py-20 lg:py-28 bg-[#F7F8F5]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Workflow</span>
            <span aria-hidden="true" className="text-black/30">
              ·
            </span>
            <span className="text-[#0047FF]">How it works</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            From empty department to notice-board PDF in six steps.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            This is the actual workflow in the app — the same screens,
            services, and guarantees described here are what you get when you
            open the dashboard.
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="rounded-2xl bg-white border border-[#E5E8E0] p-6 flex flex-col"
            >
              <span className="text-xs font-mono font-bold text-[#0047FF] mb-3">
                {s.n}
              </span>
              <h3 className="font-display text-lg font-bold text-[#111315] mb-2 leading-snug">
                {s.title}
              </h3>
              <p className="text-[13px] text-[#4B5259] leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-2xl bg-[#111315] text-white p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex-1">
            <p className="text-xs font-mono uppercase tracking-widest text-blue-300 mb-2">
              The full-packing rule
            </p>
            <p className="text-sm text-white/80 leading-relaxed max-w-3xl">
              A section's weekly requirements must sum to exactly{" "}
              <span className="font-mono text-white">
                working days × teaching periods per day
              </span>{" "}
              (labs = 2 periods each). Breaks like lunch sit in their own grid
              columns and are never counted. If requirements sum to less, the
              shortfall shows up as empty periods — the Generate page's
              preflight warnings tell you the exact gap.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#111315] bg-white hover:bg-blue-50 rounded-xl transition-colors"
          >
            <span>Try it on the dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
