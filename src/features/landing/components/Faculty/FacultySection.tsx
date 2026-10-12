import React from "react";
import { Link } from "react-router-dom";
import { CalendarCheck2, HeartHandshake, Table2, ArrowRight } from "lucide-react";

const CARDS = [
  {
    icon: CalendarCheck2,
    title: "Availability + preferred windows",
    text: "A dedicated grid editor sets each teacher's available periods and preferred teaching windows. Availability is a hard gate in the solver; preferences guide scoring toward humane schedules.",
  },
  {
    icon: HeartHandshake,
    title: "Workload caps, fairly shared",
    text: "Cap max periods per week and per day per faculty member. The solver steers placement to the least-loaded eligible teacher, keeping balanced pools within a 1–2 period spread — and preflight warns before anyone is over capacity.",
  },
  {
    icon: Table2,
    title: "Read-only faculty timetable",
    text: "Review any teacher's full week across all sections in one grid — total load, daily spread, and lab blocks at a glance — with print support for notice boards and personal copies.",
  },
];

export const FacultySection: React.FC = () => {
  return (
    <section className="gsap-section-reveal py-20 lg:py-28 bg-[#F7F8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Faculty management</span>
            <span aria-hidden="true" className="text-black/30">
              ·
            </span>
            <span className="text-[#0047FF]">Availability, fairness, review</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            Teachers get balanced weeks, not leftover slots.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            Subjects draw from eligible faculty pools, so no single teacher
            becomes a bottleneck — and every assignment is still validated
            against collisions and caps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CARDS.map((c) => (
            <article
              key={c.title}
              className="rounded-2xl bg-white border border-[#E5E8E0] p-6 flex flex-col"
            >
              <div className="w-9 h-9 rounded-lg bg-[#111315] text-white flex items-center justify-center mb-4">
                <c.icon size={18} />
              </div>
              <h3 className="font-display text-lg font-bold text-[#111315] mb-2">
                {c.title}
              </h3>
              <p className="text-[13px] text-[#4B5259] leading-relaxed">{c.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[#E5E8E0] bg-white p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-sm text-[#4B5259] leading-relaxed flex-1">
            Cross-section sharing works out of the box: assign one mathematics
            teacher across two sections and the solver plus validator keep them
            out of double-bookings automatically.
          </p>
          <Link
            to="/dashboard"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#111315] hover:bg-[#0047FF] rounded-xl transition-colors"
          >
            <span>Manage faculty</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
