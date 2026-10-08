import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export const ConflictDetectionDemo: React.FC = () => {
  const [resolved, setResolved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyResolution = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setResolved(true);
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.65 },
          colors: ["#0047FF", "#10B981"],
        });
      } catch {
        // ignore
      }
    }, 700);
  };

  const handleReset = () => {
    setResolved(false);
    setIsApplying(false);
  };

  return (
    <section className="gsap-section-reveal py-20 lg:py-28 bg-[#FAFBF9] border-t border-[#E5E8E0] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Conflict Diagnostics</span>
            <span aria-hidden="true" className="text-black/30">
              ·
            </span>
            <span className="text-[#0047FF]">Autonomous Remediation</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            See conflicts before they become problems.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            When room collisions or professor conflicts are detected during
            planning, Cadence doesn’t just show a red error—it ranks verified
            alternatives based on capacity, equipment, and building transit
            time.
          </p>
        </div>

        {/* Live Conflict Scenario Card */}
        <div className="rounded-2xl bg-white border border-[#E5E8E0] p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Collision Diagnostic */}
            <div className="lg:col-span-6 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b pb-2 text-[#71767B]">
                <span>FACILITY COLLISION ANALYSIS</span>
                <span
                  className={
                    resolved
                      ? "text-emerald-700 font-bold"
                      : "text-rose-700 font-bold"
                  }
                >
                  {resolved ? "0 CONFLICTS" : "COLLISION DETECTED"}
                </span>
              </div>

              {/* Slot 1 */}
              <div className="p-4 rounded-xl border border-[#E5E8E0] bg-[#F7F8F5]">
                <div className="flex items-center justify-between text-[11px] text-[#71767B] mb-1">
                  <span>MON 10:00 - 11:00</span>
                  <span className="text-[#0047FF] font-semibold">
                    Turing Lecture Hall 101
                  </span>
                </div>
                <div className="font-bold text-sm text-[#111315] font-sans">
                  CS-301: Algorithms & Complexity (CSE Cohort A)
                </div>
                <div className="text-[11px] text-[#4B5259] font-sans mt-0.5">
                  Prof. Marcus Chen · 68 Registered Students
                </div>
              </div>

              {/* Colliding Slot 2 or Resolved Slot */}
              {!resolved ? (
                <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/90 animate-pulse">
                  <div className="flex items-center justify-between text-[11px] text-rose-800 mb-1">
                    <span>MON 10:00 - 11:00 (SAME SLOT)</span>
                    <span className="font-bold text-rose-700">
                      Turing Lecture Hall 101 (SAME ROOM)
                    </span>
                  </div>
                  <div className="font-bold text-sm text-rose-950 font-sans">
                    EE-205: Digital Logic Systems (ECE Cohort B)
                  </div>
                  <div className="text-[11px] text-rose-800 font-sans mt-0.5">
                    Prof. David Kelling · 54 Registered Students
                  </div>
                  <div className="mt-3 pt-2 border-t border-rose-200 text-rose-900 flex items-center gap-1.5 font-sans font-medium text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>
                      Double-Booking Hazard: 2 classes scheduled in Turing 101
                      simultaneously.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950">
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 mb-1">
                    <span>MON 10:00 - 11:00</span>
                    <span className="font-bold text-emerald-700">
                      Shannon Amphitheater 204 (RELOCATED)
                    </span>
                  </div>
                  <div className="font-bold text-sm font-sans">
                    EE-205: Digital Logic Systems (ECE Cohort B)
                  </div>
                  <div className="text-[11px] text-emerald-800 font-sans mt-0.5">
                    Prof. David Kelling · 54 Registered Students (Cap: 80 ·
                    Margin: +26)
                  </div>
                  <div className="mt-3 pt-2 border-t border-emerald-200 flex items-center gap-1.5 font-sans font-medium text-[11px] text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Conflict fully resolved. Zero room collisions across
                      campus.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Cadence Autonomous Recommendation Engine */}
            <div className="lg:col-span-6 rounded-2xl bg-[#111315] text-white p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
                  Remediation Engine
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  SCORE: 98.4% MATCH
                </span>
              </div>

              {!resolved ? (
                <>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white mb-2">
                      Recommended Relocation: Shannon 204
                    </h3>
                    <p className="text-xs text-white/70 leading-relaxed font-sans">
                      Cadence searched 42 lecture halls and identified Shannon
                      Amphitheater 204 as the optimal relocation target.
                    </p>
                  </div>

                  {/* Room specs */}
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] text-white/40">
                        ROOM CAPACITY
                      </div>
                      <div className="font-bold text-white mt-0.5">
                        80 Seats (Need 54)
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] text-white/40">
                        EQUIPMENT COMPLIANCE
                      </div>
                      <div className="font-bold text-emerald-400 mt-0.5">
                        Dual Projector Match
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] text-white/40">
                        DISTANCE TO EE FACULTY
                      </div>
                      <div className="font-bold text-white mt-0.5">
                        Adjacent Wing (40m)
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] text-white/40">
                        SCHEDULE PERTURBATION
                      </div>
                      <div className="font-bold text-blue-400 mt-0.5">
                        0 Other Classes Moved
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyResolution}
                    disabled={isApplying}
                    className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#0047FF] hover:bg-[#0038CC] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isApplying
                        ? "Applying Relocation..."
                        : "Apply Recommended Relocation"}
                    </span>
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                    <div className="font-bold text-sm text-white mb-1">
                      Relocation Successfully Committed
                    </div>
                    <p className="text-xs text-emerald-300 font-sans leading-relaxed">
                      Shannon 204 locked for EE-205 on MON 10:00. Student
                      calendar feeds and syllabus room announcements updated in
                      real time.
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                  >
                    Simulate Conflict Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
