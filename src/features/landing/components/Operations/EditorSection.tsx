import React from "react";
import { Link } from "react-router-dom";
import {
  MousePointerClick,
  ArrowLeftRight,
  PencilLine,
  Plus,
  Undo2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

const INTERACTIONS = [
  {
    icon: MousePointerClick,
    title: "Click to move",
    text: "Click an entry to select it, then click a free slot to move it there. Labs move as one 2-period block.",
  },
  {
    icon: ArrowLeftRight,
    title: "Right-click or drag to swap",
    text: "Right-click another entry to swap with the selection — or drag any entry onto a free slot (move) or another entry (swap). Green rings mark valid drop targets.",
  },
  {
    icon: PencilLine,
    title: "Double-click to edit",
    text: "An edit dialog changes subject, faculty, day, and start period in one transaction — applied step by step, stopping at the first conflict.",
  },
  {
    icon: Plus,
    title: "Add sessions",
    text: "With nothing selected, click any free slot to add a session with sensible defaults from the section's requirements.",
  },
  {
    icon: Undo2,
    title: "Undo / redo",
    text: "Every committed command is reversible from the toolbar. Invalid states can never be committed, so history stays clean.",
  },
  {
    icon: ShieldAlert,
    title: "Blocked, with reasons",
    text: "Hard conflicts open a blocking modal — not a dismissible toast — so you always learn why: double-booked faculty, section collision, lab overrun, or duration mismatch.",
  },
];

const LEGEND = [
  ["Theory", "bg-[#dce4fd]"],
  ["Lab (2 periods)", "bg-[#e7e0fd]"],
  ["Free slot", "bg-[#FAFBF9] border border-[#E5E8E0]"],
  ["Break (fixed)", "bg-[#fdf6e9]"],
  ["Conflict", "bg-rose-100"],
  ["Selected", "bg-[#dce4fd] ring-2 ring-[#0047FF]"],
  ["Move blocked", "bg-rose-100 ring-2 ring-rose-400"],
  ["Swap blocked", "bg-[#dce4fd] ring-2 ring-amber-400"],
];

export const EditorSection: React.FC = () => {
  return (
    <section
      id="editor"
      className="gsap-section-reveal py-20 lg:py-28 bg-white border-y border-[#E5E8E0]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Timetable editor</span>
            <span aria-hidden="true" className="text-black/30">
              ·
            </span>
            <span className="text-[#0047FF]">Draft → validate → commit</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            Fix anything by hand. Invalid edits can't land.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            Nothing mutates committed state before validation passes — a
            rejected edit leaves the timetable byte-identical. Every committed
            edit snapshots a restorable version and recomputes status (VALID /
            STALE / INVALID).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTERACTIONS.map((c) => (
            <article
              key={c.title}
              className="rounded-2xl bg-[#FAFBF9] border border-[#E5E8E0] p-5 hover:border-[#0047FF]/40 hover:bg-white transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#111315] text-white flex items-center justify-center mb-4">
                <c.icon size={18} />
              </div>
              <h3 className="font-display text-base font-bold text-[#111315] mb-1.5">
                {c.title}
              </h3>
              <p className="text-[13px] text-[#4B5259] leading-relaxed">{c.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-4">
          <div className="rounded-2xl bg-[#FAFBF9] border border-[#E5E8E0] p-6">
            <p className="text-xs font-mono font-bold text-[#0047FF] uppercase mb-2">
              Live conflict preview
            </p>
            <p className="text-sm text-[#4B5259] leading-relaxed">
              While an entry is selected, the grid previews every target slot
              with the real edit service (draft-only, no mutation): red-tinted
              slots would reject a move, amber slots would reject a swap — with
              the reason in the tooltip. The validation panel lists section
              conflicts with resolution hints, and a STALE banner appears
              whenever configuration changes after generation, prompting a
              regenerate.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Grid legend">
              {LEGEND.map(([label, cls]) => (
                <li key={label} className="flex items-center gap-1.5 text-[11px] text-[#71767B]">
                  <span className={`h-3.5 w-5 rounded ${cls}`} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[#111315] text-white p-6 flex flex-col justify-between gap-5">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-blue-300 mb-2">
                Versioned editing
              </p>
              <p className="text-sm text-white/80 leading-relaxed">
                Generations, edits, and restores each append a deep-copied
                snapshot — restoring an earlier version is itself reversible.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#111315] bg-white hover:bg-blue-50 rounded-xl transition-colors self-start"
            >
              <span>Open the editor</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
