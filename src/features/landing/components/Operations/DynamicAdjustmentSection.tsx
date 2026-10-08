import React, { useState } from 'react';
import { UserX, RefreshCw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const DynamicAdjustmentSection: React.FC = () => {
  const [professorUnavailable, setProfessorUnavailable] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleComplete, setRescheduleComplete] = useState(false);

  const handleSimulateAbsence = () => {
    setIsRescheduling(true);
    setProfessorUnavailable(true);
    setRescheduleComplete(false);

    setTimeout(() => {
      setIsRescheduling(false);
      setRescheduleComplete(true);
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.6 },
          colors: ['#0047FF', '#10B981'],
        });
      } catch {
        // ignore
      }
    }, 1200);
  };

  const handleReset = () => {
    setProfessorUnavailable(false);
    setRescheduleComplete(false);
    setIsRescheduling(false);
  };

  return (
    <section className="gsap-section-reveal py-20 lg:py-28 bg-[#FAFBF9] border-t border-[#E5E8E0] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Dynamic Adaptation</span>
            <span aria-hidden="true" className="text-black/30">·</span>
            <span className="text-[#0047FF]">Mid-Semester Agility</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            Change the plan without rebuilding everything.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            When a professor goes on emergency medical leave or an auditorium undergoes electrical repair,
            Cadence recalculates localized assignments while holding the rest of the schedule stable.
          </p>
        </div>

        {/* Live Scenario Simulator Card */}
        <div className="rounded-2xl bg-white border border-[#E5E8E0] p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Interactive Scenario Control */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-4 rounded-xl bg-[#F7F8F5] border border-[#E5E8E0]">
                <div className="text-xs font-mono text-[#71767B] uppercase tracking-wider mb-2">
                  Simulation Scenario
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#111315] text-white flex items-center justify-center font-bold text-sm">
                    MC
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#111315]">Dr. Marcus Chen</div>
                    <div className="text-xs text-[#4B5259]">Algorithms & Complexity · 3 Sections</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#E5E8E0] flex items-center justify-between">
                  <span className="text-xs font-medium text-[#30363D]">
                    Status on Wednesday:
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
                      professorUnavailable
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {professorUnavailable ? 'UNAVAILABLE (SYMPOSIUM)' : 'AVAILABLE (NORMAL)'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div>
                {!professorUnavailable ? (
                  <button
                    onClick={handleSimulateAbsence}
                    className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#111315] hover:bg-[#0047FF] transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Simulate Dr. Chen Absent on Wednesday</span>
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-[#111315] bg-[#F1F3ED] hover:bg-[#E5E8E0] transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reset Scenario to Baseline</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right: Reschedule Propagation Visual */}
            <div className="lg:col-span-7 rounded-xl bg-[#FAFBF9] border border-[#E5E8E0] p-6 font-mono text-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-2 text-[#71767B]">
                <span>SOLVER RECALCULATION LOG</span>
                <span>DELTA PROPAGATION: LOCALIZED</span>
              </div>

              {isRescheduling && (
                <div className="p-6 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0047FF]" />
                  <div className="text-sm font-bold text-[#111315]">
                    Evaluating non-disruptive permutations...
                  </div>
                  <div className="text-[11px] text-[#71767B]">
                    Freezing unaffected 2,397 sections · Rescheduling 3 impacted classes
                  </div>
                </div>
              )}

              {!isRescheduling && !rescheduleComplete && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-white border border-[#E5E8E0] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#111315]">WED 08:30 · CS-415 (Compilers)</div>
                      <div className="text-[10px] text-[#71767B] font-sans">
                        Assigned to Dr. Chen in Shannon 204
                      </div>
                    </div>
                    <span className="text-emerald-700 font-bold">STABLE</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-[#E5E8E0] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#111315]">WED 10:45 · CS-301 (Algorithms Sec A)</div>
                      <div className="text-[10px] text-[#71767B] font-sans">
                        Assigned to Dr. Chen in Turing 101
                      </div>
                    </div>
                    <span className="text-emerald-700 font-bold">STABLE</span>
                  </div>
                  <div className="p-2.5 text-center text-[#71767B] text-[11px] font-sans">
                    Baseline timetable running normally with 0 conflicts. Click simulate above.
                  </div>
                </div>
              )}

              {rescheduleComplete && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900">
                    <div className="font-bold flex items-center gap-1.5 text-xs text-emerald-950 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>3 Classes Automatically Relocated · 0 Downstream Conflicts</span>
                    </div>
                    <div className="text-[11px] text-emerald-800 font-sans">
                      Displaced CS-301 moved to Thursday 08:30 open slot. CS-415 swapped with Friday tutorial.
                      Remaining 2,397 sections across the university were completely untouched!
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="p-2 rounded bg-white border">
                      <div className="font-bold text-[#111315]">3 Classes</div>
                      <div className="text-[10px] text-[#71767B]">Rescheduled</div>
                    </div>
                    <div className="p-2 rounded bg-white border">
                      <div className="font-bold text-emerald-600">0 Collisions</div>
                      <div className="text-[10px] text-[#71767B]">Introduced</div>
                    </div>
                    <div className="p-2 rounded bg-white border">
                      <div className="font-bold text-[#111315]">1.8 Seconds</div>
                      <div className="text-[10px] text-[#71767B]">Solve Time</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
