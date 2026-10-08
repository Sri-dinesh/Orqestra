import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";

export const ConstraintPolicyControls: React.FC = () => {
  const [maxDailyHours, setMaxDailyHours] = useState(4);
  const [lunchSynchronized, setLunchSynchronized] = useState(true);
  const [avoidConsecutiveLabs, setAvoidConsecutiveLabs] = useState(true);
  const [saturdayPolicy, setSaturdayPolicy] = useState<
    "off" | "electives" | "full"
  >("off");
  const [capacityMargin, setCapacityMargin] = useState(15);

  return (
    <section
      id="controls"
      className="gsap-section-reveal py-20 lg:py-28 bg-[#F7F8F5] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Governance & Policy</span>
            <span aria-hidden="true" className="text-black/30">
              ·
            </span>
            <span className="text-[#0047FF]">Institutional Invariants</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            Automation without surrendering control.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            Academic administrators define the strict boundaries and soft
            pedagogical preferences. The engine executes within your
            institutional constitution—never overriding human authority.
          </p>
        </div>

        {/* Policy Configuration Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Policy Toggles */}
          <div className="lg:col-span-8 rounded-2xl bg-white border border-[#E5E8E0] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#111315]">
                  Institutional Rulebook Parameters
                </h3>
                <p className="text-xs text-[#71767B]">
                  Active constraints applied to the combinatorial solver kernel.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                POLICY INDEX: 99.8%
              </span>
            </div>

            {/* Rule 1: Max lectures per day */}
            <div className="p-4 rounded-xl bg-[#FAFBF9] border border-[#E5E8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#111315]">
                    Maximum Lectures per Faculty / Day
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                    HARD RULE
                  </span>
                </div>
                <p className="text-xs text-[#71767B] mt-0.5">
                  Prevents pedagogical fatigue and guarantees time for research
                  and student office hours.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="6"
                  value={maxDailyHours}
                  onChange={(e) => setMaxDailyHours(Number(e.target.value))}
                  className="w-28 accent-[#0047FF] bg-[#E5E8E0] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <span className="w-12 font-mono font-bold text-sm text-[#111315] tabular text-right">
                  {maxDailyHours} hrs
                </span>
              </div>
            </div>

            {/* Rule 2: Synchronized Lunch Break */}
            <div className="p-4 rounded-xl bg-[#FAFBF9] border border-[#E5E8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#111315]">
                    Campus-Wide Synchronized Lunch Break
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                    HARD RULE
                  </span>
                </div>
                <p className="text-xs text-[#71767B] mt-0.5">
                  Protects 12:45 – 13:30 across every department for dining,
                  club meetings, and transit.
                </p>
              </div>
              <button
                onClick={() => setLunchSynchronized(!lunchSynchronized)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                  lunchSynchronized
                    ? "bg-[#111315] text-white"
                    : "bg-[#E5E8E0] text-[#71767B]"
                }`}
              >
                {lunchSynchronized ? "ENFORCED (12:45)" : "DISABLED"}
              </button>
            </div>

            {/* Rule 3: Avoid consecutive labs */}
            <div className="p-4 rounded-xl bg-[#FAFBF9] border border-[#E5E8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#111315]">
                    Prohibit Back-to-Back Laboratory Sessions
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                    SOFT RULE
                  </span>
                </div>
                <p className="text-xs text-[#71767B] mt-0.5">
                  Students never spend four consecutive hours in high-intensity
                  hardware or wet chemistry labs.
                </p>
              </div>
              <button
                onClick={() => setAvoidConsecutiveLabs(!avoidConsecutiveLabs)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                  avoidConsecutiveLabs
                    ? "bg-[#0047FF] text-white"
                    : "bg-[#E5E8E0] text-[#71767B]"
                }`}
              >
                {avoidConsecutiveLabs ? "ACTIVE" : "INACTIVE"}
              </button>
            </div>

            {/* Rule 4: Saturday Policy */}
            <div className="p-4 rounded-xl bg-[#FAFBF9] border border-[#E5E8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#111315]">
                    Weekend Scheduling Allowance
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                    INSTITUTIONAL
                  </span>
                </div>
                <p className="text-xs text-[#71767B] mt-0.5">
                  Controls whether Saturday can host elective coursework or
                  remains strictly closed.
                </p>
              </div>
              <div className="flex items-center gap-1 bg-[#F1F3ED] p-1 rounded-lg text-xs font-medium">
                {(["off", "electives", "full"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSaturdayPolicy(mode)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono capitalize transition-all ${
                      saturdayPolicy === mode
                        ? "bg-white text-[#111315] shadow-xs font-bold"
                        : "text-[#4B5259] hover:text-[#111315]"
                    }`}
                  >
                    {mode === "off"
                      ? "No Weekends"
                      : mode === "electives"
                        ? "Electives Only"
                        : "Full Sat"}
                  </button>
                ))}
              </div>
            </div>

            {/* Rule 5: Room capacity margin */}
            <div className="p-4 rounded-xl bg-[#FAFBF9] border border-[#E5E8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#111315]">
                    Seating Safety & Buffer Margin
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                    SOFT BUFFER
                  </span>
                </div>
                <p className="text-xs text-[#71767B] mt-0.5">
                  Requires physical room capacity to exceed enrolled students by
                  this percentage.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={capacityMargin}
                  onChange={(e) => setCapacityMargin(Number(e.target.value))}
                  className="w-28 accent-[#0047FF] bg-[#E5E8E0] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <span className="w-12 font-mono font-bold text-sm text-[#111315] tabular text-right">
                  +{capacityMargin}%
                </span>
              </div>
            </div>
          </div>

          {/* Right: Policy Summary & Mathematical Invariant Guarantee */}
          <div className="lg:col-span-4 rounded-2xl bg-[#111315] text-white p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Invariants Engine</span>
            </div>

            <h3 className="font-display text-xl font-bold text-white tracking-tight">
              Hard vs. Soft Optimization
            </h3>

            <p className="text-xs text-white/70 leading-relaxed font-sans">
              Cadence uses a two-tier optimization function: Hard constraints
              cannot be breached under any mathematical condition; soft
              preferences maximize pedagogical quality.
            </p>

            <div className="space-y-3 font-mono text-xs pt-4 border-t border-white/10">
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="text-emerald-400 font-bold mb-1">
                  Tier 1: Hard Invariants
                </div>
                <div className="text-[11px] text-white/60 font-sans">
                  Double bookings = 0, Room capacity deficit = 0, Lunch
                  collisions = 0.
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="text-blue-400 font-bold mb-1">
                  Tier 2: Soft Heuristics
                </div>
                <div className="text-[11px] text-white/60 font-sans">
                  Professor preferred mornings, even weekly student
                  distribution, campus transit minimization.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-[11px] text-white/50 font-mono">
              ROLE: ACADEMIC REGISTRAR PERMISSIONS REQUIRED TO ALTER POLICY
              INVARIANTS.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
