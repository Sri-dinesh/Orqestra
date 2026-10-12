import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is my data sent anywhere?",
    a: "No. Orqestra is fully client-side — there is no backend and no account. Your workspace lives in the browser's local storage, the app works offline, and nothing ever leaves your machine. Use workspace import/export (JSON) for backup and transfer.",
  },
  {
    q: "What does “fully packed” mean?",
    a: "A section's weekly session requirements must sum to exactly working days × teaching periods per day, with each lab counting as 2 periods. Breaks such as lunch sit in their own grid columns and are never counted. If requirements sum to less, the shortfall shows up as empty periods — the Generate page's preflight warnings tell you the exact gap per section.",
  },
  {
    q: "How do laboratory sessions work?",
    a: "Labs are atomic 2-period blocks by construction: a lab is placed as a single indivisible unit spanning 2 consecutive periods on one day. A lab can never split across days or span a break column, and you can optionally cap labs per section per day.",
  },
  {
    q: "What happens when I edit a timetable by hand?",
    a: "Every edit follows draft → validate → commit. The app copies the timetable, applies your change to the draft, and runs the full authoritative validator before committing. Hard conflicts (double-booked faculty, section collisions, lab overruns) are rejected with a blocking modal explaining why — a rejected edit leaves the timetable byte-identical. Committed edits support undo/redo and snapshot a restorable version.",
  },
  {
    q: "Can I reproduce a generated timetable exactly?",
    a: "Yes. Generation uses a seeded PRNG and the seed is stored in the run's metadata: identical input plus identical seed produces a bit-identical timetable. Leave the seed blank for auto mode, or set one to lock a result.",
  },
  {
    q: "What if generation fails or times out?",
    a: "Preflight diagnostics catch most impossibilities in milliseconds — capacity gaps, lab placeability, faculty overloads, stale subjects — with exact numbers and suggestions. If the search itself exhausts its per-department time or node budget, you get SEARCH_TIMEOUT or SEARCH_NODE_LIMIT with guidance (raise a budget, reduce sessions, add faculty or days), and a Cancel button stops long runs.",
  },
  {
    q: "What do VALID, STALE, and INVALID mean?",
    a: "VALID means the timetable passed full validation against the current configuration. STALE means the configuration changed after generation — regenerate to reconcile. INVALID means requirement counts drifted (for example after intentional removals) and the validation panel lists exactly what is missing or in excess.",
  },
  {
    q: "How do I back up or move my workspace?",
    a: "Settings offers workspace-level import/export to JSON (files named orqestra-workspace-*.json). Storage is schema-versioned with migrations and corruption recovery, so older workspaces upgrade cleanly on load.",
  },
];

export const FaqSection: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="gsap-section-reveal py-20 lg:py-28 bg-white border-y border-[#E5E8E0]"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>FAQ</span>
            <span aria-hidden="true" className="text-black/30">
              ·
            </span>
            <span className="text-[#0047FF]">Honest answers</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            Questions departments actually ask.
          </h2>
        </div>

        <div className="space-y-2.5">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`rounded-xl border transition-colors ${
                  isOpen
                    ? "bg-[#FAFBF9] border-[#0047FF]/40"
                    : "bg-white border-[#E5E8E0] hover:border-[#111315]/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
                >
                  <span className="text-sm font-semibold text-[#111315]">
                    {f.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-[#71767B] transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-5 text-[13px] text-[#4B5259] leading-relaxed">
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
