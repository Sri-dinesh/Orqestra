import React, { useState } from "react";
import { Cpu } from "lucide-react";

interface Stage {
  id: string;
  step: string;
  title: string;
  description: string;
  details: string;
}

const STAGES: Stage[] = [
  {
    id: "preflight",
    step: "Stage 1",
    title: "Preflight feasibility",
    description:
      "Millisecond diagnostics before the search starts — capacity, labs, faculty, references.",
    details:
      "Section capacity compares required periods (labs = 2) against working days × teaching periods per day; over-capacity blocks generation, under-capacity warns with the exact empty-period count. Lab placeability splits each day at break columns (a lab can never span a break). Faculty demand is split evenly across each subject's eligible pool — over-cap raises a blocking error, unassigned faculty raise an advisory warning. Stale subject references are flagged.",
  },
  {
    id: "expansion",
    step: "Stage 2",
    title: "Session expansion & ordering",
    description:
      "Each requirement becomes session units; labs stay atomic 2-period blocks by construction.",
    details:
      "A requirement like “6×/week” expands into 6 independent session units; a lab expands into 1 unit with durationPeriods = 2, so atomicity is guaranteed structurally. Sessions are arranged section-major — all of one section's sessions (labs first) before the next — turning one giant search into near-independent sub-problems, which is what makes fully-packed timetables solvable in seconds.",
  },
  {
    id: "search",
    step: "Stage 3",
    title: "Backtracking search (MRV)",
    description:
      "Most-constrained session first, O(1) collision checks, heuristic ordering, reversible mutation.",
    details:
      "At every step the solver picks the most constrained session among the next 24 unscheduled (MRV) — dead ends are pruned before placement, not after. Candidates (day × start period × eligible faculty) must pass hard constraints via an occupancy index: section and faculty collisions, lab atomicity, per-day subject/lab caps, and faculty workload caps. Feasible candidates are ranked by weighted heuristics: section day-load spread, day-completion bonus, faculty fairness (least-loaded first), period-band balancing, and subject/lab distribution. Placement is reversibly mutated with O(1) rollback — no state is ever rebuilt on backtrack.",
  },
  {
    id: "validation",
    step: "Stage 4",
    title: "Independent validation",
    description:
      "The solver's output is never trusted — a separate validator re-checks everything.",
    details:
      "validateTimetable() re-checks the finished grid through layered rules — structure and references, faculty and section collisions, lab atomicity, requirement counts, config staleness — sharing no code with the solver. Only a clean pass marks the timetable VALID, so a solver bug cannot produce a silently-conflicted schedule.",
  },
  {
    id: "scoring",
    step: "Stage 5",
    title: "Soft scoring",
    description:
      "A normalized quality score explains how good the schedule is, not just that it is valid.",
    details:
      "After validation the schedule receives a weighted quality score (subject spread across days, daily balance per section, faculty balance, gap reduction, lab distribution). Weights come from the configuration's softWeights and the total is surfaced in the generation metadata shown on the Generate page.",
  },
];

export const EngineArchitectureSection: React.FC = () => {
  const [activeId, setActiveId] = useState<string>(STAGES[0].id);
  const active = STAGES.find((s) => s.id === activeId) ?? STAGES[0];

  return (
    <section
      id="engine"
      className="gsap-section-reveal py-20 lg:py-28 bg-[#F7F8F5] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Scheduling engine</span>
            <span aria-hidden="true" className="text-black/30">
              ·
            </span>
            <span className="text-[#0047FF]">
              Constraint backtracking, honestly explained
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            A solver you can reason about, not a black box.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            Generation is a constraint-satisfaction backtracking search with
            heuristic guidance — pure, side-effect-free TypeScript running
            entirely in your browser. Select a stage to see what it actually
            does.
          </p>
        </div>

        {/* Pipeline */}
        <div className="rounded-2xl bg-white border border-[#E5E8E0] p-6 lg:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Stage list */}
            <div className="lg:col-span-5 space-y-2.5">
              <div className="text-xs font-mono text-[#71767B] uppercase tracking-wider mb-3 px-1">
                Generation pipeline
              </div>
              {STAGES.map((s, i) => {
                const isActive = activeId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveId(s.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs ${
                      isActive
                        ? "bg-[#111315] text-white border-[#111315] shadow-sm"
                        : "bg-[#FAFBF9] text-[#30363D] border-[#E5E8E0] hover:border-[#0047FF] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">
                        {i + 1}. {s.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono ${isActive ? "text-blue-300" : "text-[#71767B]"}`}
                      >
                        {s.step.toUpperCase()}
                      </span>
                    </div>
                    <p
                      className={`line-clamp-2 text-[11px] ${isActive ? "text-white/70" : "text-[#71767B]"}`}
                    >
                      {s.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Core + inspector */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-col p-6 rounded-2xl bg-[#111315] text-white border border-black/10 relative overflow-hidden min-h-[220px]">
                <div className="absolute inset-0 bg-radial-gradient from-blue-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-1">
                  {active.step} · Active stage
                </div>
                <h3 className="font-display text-xl font-bold tracking-tight text-white mb-2">
                  {active.title}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {active.details}
                </p>
              </div>

              <div className="rounded-xl bg-[#FAFBF9] border border-[#E5E8E0] p-5">
                <p className="text-xs font-mono font-bold text-[#0047FF] uppercase mb-3">
                  Determinism & budgets
                </p>
                <ul className="grid sm:grid-cols-2 gap-3 text-xs text-[#4B5259] leading-relaxed">
                  <li className="rounded-lg bg-white border border-[#E5E8E0] p-3">
                    <strong className="text-[#111315]">Seeded runs.</strong>{" "}
                    A seeded PRNG drives ordering — identical input + identical
                    seed = bit-identical timetable. The seed is stored in the
                    generation metadata.
                  </li>
                  <li className="rounded-lg bg-white border border-[#E5E8E0] p-3">
                    <strong className="text-[#111315]">Cancellable.</strong>{" "}
                    The Cancel button stops the search via a cancellation token
                    checked on every node.
                  </li>
                  <li className="rounded-lg bg-white border border-[#E5E8E0] p-3">
                    <strong className="text-[#111315]">Node + time budgets.</strong>{" "}
                    Configurable per department (defaults: 20M nodes, 60s).
                    Exhaustion reports SEARCH_NODE_LIMIT or SEARCH_TIMEOUT with
                    actionable diagnostics.
                  </li>
                  <li className="rounded-lg bg-white border border-[#E5E8E0] p-3">
                    <strong className="text-[#111315]">Faculty fairness.</strong>{" "}
                    Placement steers toward the least-loaded eligible teacher,
                    so balanced pools stay within a 1–2 period spread.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
