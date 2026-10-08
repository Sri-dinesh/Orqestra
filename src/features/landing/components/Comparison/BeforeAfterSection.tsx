import React from 'react';
import { CheckCircle2, XCircle, FileSpreadsheet, Sparkles } from 'lucide-react';

export const BeforeAfterSection: React.FC = () => {

  return (
    <section className="gsap-section-reveal py-20 lg:py-28 bg-[#F7F8F5] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Operational Transformation</span>
            <span aria-hidden="true" className="text-black/30">·</span>
            <span className="text-[#0047FF]">Before vs. After</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            The end of spreadsheet paralysis.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            Manual academic scheduling consumes weeks of departmental negotiations, only to produce
            schedules riddled with first-day collisions and student grievances.
          </p>
        </div>

        {/* Side-by-side Architectural Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: Manual Spreadsheet Scheduling (Chaos) */}
          <div className="rounded-2xl bg-white border border-rose-200 p-6 sm:p-8 flex flex-col justify-between shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-rose-100 text-rose-800 text-[11px] font-mono font-semibold rounded-bl-xl border-l border-b border-rose-200">
              TRADITIONAL SPREADSHEETS
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet className="w-5 h-5 text-rose-600" />
                <h3 className="font-display text-xl font-bold text-[#111315]">
                  Manual Cell Coordination
                </h3>
              </div>
              <p className="text-xs text-[#4B5259] leading-relaxed mb-6 font-sans">
                Teams of academic coordinators editing disconnected spreadsheets, attempting to track hundreds
                of professors across email threads and sticky notes.
              </p>

              {/* Visual Simulated Spreadsheet Chaos */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5 font-mono text-xs mb-6">
                <div className="flex items-center justify-between text-[11px] text-stone-500 border-b pb-1">
                  <span>ROOM 204 (UNTRACKED)</span>
                  <span className="text-rose-600 font-bold">3 OVERLAPS</span>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-100/80 border border-rose-300 text-rose-900 flex items-start justify-between">
                  <div>
                    <span className="font-bold line-through opacity-70">CS-301 (Prof. Chen)</span>
                    <div className="text-[10px] text-rose-700 font-sans mt-0.5">
                      Double-booked with Physics 102! Discovered by students at door.
                    </div>
                  </div>
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                </div>
                <div className="p-2.5 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-900 text-[11px]">
                  <span className="font-bold">Faculty email note:</span> "Dr. Thorne cannot do Fridays" (missed in v4 revision).
                </div>
                <div className="p-2 rounded bg-stone-200/60 text-stone-600 text-[10px]">
                  <span>REVISION 14_FINAL_v2_APPROVED_ACTUAL.xlsx</span>
                </div>
              </div>
            </div>

            {/* Pain Metrics */}
            <div className="pt-4 border-t border-rose-100 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="font-display text-lg font-bold text-rose-700 tabular">5–10 Days</div>
                <div className="text-[10px] text-[#71767B] mt-0.5">Planning Cycle</div>
              </div>
              <div>
                <div className="font-display text-lg font-bold text-rose-700 tabular">18–35</div>
                <div className="text-[10px] text-[#71767B] mt-0.5">Hidden Collisions</div>
              </div>
              <div>
                <div className="font-display text-lg font-bold text-rose-700 tabular">Endless</div>
                <div className="text-[10px] text-[#71767B] mt-0.5">Manual Revisions</div>
              </div>
            </div>
          </div>

          {/* Right: Cadence Automated Infrastructure */}
          <div className="rounded-2xl bg-[#111315] text-white border border-black/20 p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#0047FF] text-white text-[11px] font-mono font-semibold rounded-bl-xl">
              CADENCE INFRASTRUCTURE
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="font-display text-xl font-bold text-white">
                  Constraint Optimization Engine
                </h3>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mb-6 font-sans">
                Full-cohort mathematical constraint satisfaction. Real physical rooms, faculty availability matrices,
                and syllabus credit requirements solved in a single coherent model.
              </p>

              {/* Visual Simulated Cadence Clean Grid */}
              <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2.5 font-mono text-xs mb-6">
                <div className="flex items-center justify-between text-[11px] text-white/40 border-b border-white/10 pb-1">
                  <span>SYSTEM AUDIT: SEMESTER 2026-A</span>
                  <span className="text-emerald-400 font-bold">100% SATISFIED</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 flex items-start justify-between">
                  <div>
                    <span className="font-bold text-white">Branch-and-Bound Verification Passed</span>
                    <div className="text-[10px] text-emerald-400/90 font-sans mt-0.5">
                      All 180 faculty, 320 rooms, and 2,400 course allocations mathematically verified.
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                </div>
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200 text-[11px] font-sans">
                  Dynamic change propagation: any change automatically re-optimizes within 4 seconds.
                </div>
                <div className="p-2 rounded bg-white/5 text-white/40 text-[10px]">
                  <span>IMMUTABLE AUDIT HASH: #cad-7f9a2 · EXPORTABLE TO SIS / CANVAS</span>
                </div>
              </div>
            </div>

            {/* Proof Metrics */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="font-display text-lg font-bold text-emerald-400 tabular">&lt; 30s</div>
                <div className="text-[10px] text-white/60 mt-0.5">Generation Time</div>
              </div>
              <div>
                <div className="font-display text-lg font-bold text-emerald-400 tabular">0</div>
                <div className="text-[10px] text-white/60 mt-0.5">Collisions Detected</div>
              </div>
              <div>
                <div className="font-display text-lg font-bold text-emerald-400 tabular">1-Click</div>
                <div className="text-[10px] text-white/60 mt-0.5">Change Propagation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
