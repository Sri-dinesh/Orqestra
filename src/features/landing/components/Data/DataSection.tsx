import React from "react";
import { Link } from "react-router-dom";
import { FileDown, History, Lock, ArrowRight } from "lucide-react";

const CARDS = [
  {
    icon: FileDown,
    title: "Official exports",
    points: [
      "Notice-board PDF per section: crest header, time grid with vertical break columns, class advisor, course/instructor details, mentors, and signatories.",
      "Excel grid output for sharing and records.",
      "Print support, including the read-only faculty timetable view.",
    ],
  },
  {
    icon: History,
    title: "Version history with restore",
    points: [
      "Every generation and committed edit appends a deep-copied snapshot (newest last, capped at 20).",
      "Origins labeled GENERATED, EDIT, or RESTORE with human-readable labels and timestamps.",
      "Restoring snapshots the current state first — so a restore is itself reversible. Revision increments on every change.",
    ],
  },
  {
    icon: Lock,
    title: "Private by architecture",
    points: [
      "Fully client-side: no backend, no accounts, nothing ever leaves your machine. Works offline.",
      "Workspace persists in local storage as a versioned document (schema v2) with migrations, Zod validation, and corruption recovery.",
      "Workspace-level import/export to JSON (orqestra-workspace-*.json) for backup and transfer.",
    ],
  },
];

export const DataSection: React.FC = () => {
  return (
    <section className="gsap-section-reveal py-20 lg:py-28 bg-[#F7F8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Export · Versions · Privacy</span>
            <span aria-hidden="true" className="text-black/30">
              ·
            </span>
            <span className="text-[#0047FF]">Ship it and keep it</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            The output is official. The data stays yours.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            Timetables are only useful pinned to a board or filed in a record —
            and department data is only safe when it never leaves the
            department.
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
              <h3 className="font-display text-lg font-bold text-[#111315] mb-3">
                {c.title}
              </h3>
              <ul className="space-y-2.5">
                {c.points.map((pt) => (
                  <li
                    key={pt.slice(0, 24)}
                    className="text-[13px] text-[#4B5259] leading-relaxed flex gap-2"
                  >
                    <span aria-hidden="true" className="text-[#0047FF] font-bold">
                      ·
                    </span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-[#111315] text-white p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center gap-5">
          <p className="text-sm text-white/80 leading-relaxed flex-1 max-w-3xl">
            Strict TypeScript throughout, a pure side-effect-free domain core,
            and 51 automated tests — including enterprise-scale end-to-end runs
            (9 sections, 378 sessions, 0 empty slots) — back every timetable the
            app produces.
          </p>
          <Link
            to="/dashboard"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#111315] bg-white hover:bg-blue-50 rounded-xl transition-colors"
          >
            <span>Open the app</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
