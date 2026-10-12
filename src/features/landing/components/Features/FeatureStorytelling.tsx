import React from "react";
import {
  LayoutDashboard,
  SlidersHorizontal,
  Zap,
  MousePointerClick,
  ShieldCheck,
  CalendarCheck2,
  History,
  FileDown,
} from "lucide-react";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Department dashboard",
    text: "Status at a glance with live counts of sections, subjects, faculty, and timetable version — plus one-click preset setup to start fast.",
  },
  {
    icon: SlidersHorizontal,
    title: "Full configuration",
    text: "Working days, periods per day, sections, theory + lab subjects, faculty pools, and per-section weekly session requirements — including breaks that sit in their own grid columns.",
  },
  {
    icon: Zap,
    title: "Automated generation",
    text: "A backtracking scheduler with seeded randomness, preflight feasibility analysis, faculty-fairness heuristics, and configurable time and node budgets.",
  },
  {
    icon: MousePointerClick,
    title: "Manual editor",
    text: "Move or swap sessions with drag-and-drop, change subject or faculty, place custom day/period sessions via an edit dialog — all with undo and redo.",
  },
  {
    icon: ShieldCheck,
    title: "Conflict blocking",
    text: "Every edit runs the full authoritative validator before commit. Hard conflicts are rejected with a blocking modal that explains exactly why.",
  },
  {
    icon: CalendarCheck2,
    title: "Faculty availability",
    text: "Set available and preferred teaching windows in a dedicated grid editor, cap weekly and daily loads, and review each teacher's week in a read-only faculty timetable.",
  },
  {
    icon: History,
    title: "Version history",
    text: "Every generation and committed edit creates a restore-point snapshot (capped at 20, newest last). Browse and restore any version — restores are reversible too.",
  },
  {
    icon: FileDown,
    title: "PDF + Excel export",
    text: "Official notice-board PDF per section — crest header, time grid with break columns, advisor, course and instructor details, mentors, signatories — plus an Excel grid and print support.",
  },
];

export const FeatureStorytelling: React.FC = () => {
  return (
    <section
      id="features"
      className="gsap-section-reveal py-20 lg:py-28 bg-white border-y border-[#E5E8E0]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Features</span>
            <span aria-hidden="true" className="text-black/30">
              ·
            </span>
            <span className="text-[#0047FF]">What the app does</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            Everything a department needs to ship a timetable.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            No backend, no accounts, no sales calls. Configure, generate, edit,
            version, and export — all offline in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl bg-[#FAFBF9] border border-[#E5E8E0] p-5 flex flex-col hover:border-[#0047FF]/40 hover:bg-white transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#111315] text-white flex items-center justify-center mb-4">
                <f.icon className="w-4.5 h-4.5" size={18} />
              </div>
              <h3 className="font-display text-base font-bold text-[#111315] mb-1.5">
                {f.title}
              </h3>
              <p className="text-[13px] text-[#4B5259] leading-relaxed">{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
