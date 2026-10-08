import React, { useState } from "react";
import { INSTITUTION_TIERS } from "../../data/mockSchedule";
import { Building2, Users, Clock } from "lucide-react";

export const InstitutionScaleSection: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<string>("university");

  const currentTier =
    INSTITUTION_TIERS.find((t) => t.id === selectedTier) ||
    INSTITUTION_TIERS[2];

  return (
    <section
      id="scale"
      className="gsap-section-reveal py-20 lg:py-28 bg-[#F7F8F5] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Organizational Scale</span>
            <span aria-hidden="true" className="text-black/30">
              ·
            </span>
            <span className="text-[#0047FF]">Architecture Across Campuses</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            Built for 50 students or 50,000.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            From single-building preparatory academies to distributed
            multi-campus university systems, the constraint solver scales
            without degradation in solve time or schedule optimality.
          </p>
        </div>

        {/* Tier Selector Buttons (Segmented tabs) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {INSTITUTION_TIERS.map((tier) => {
            const isSelected = selectedTier === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-[#111315] text-white border-[#111315] shadow-sm"
                    : "bg-white text-[#30363D] border-[#E5E8E0] hover:border-black/30"
                }`}
              >
                <div className="font-display font-bold text-sm mb-1">
                  {tier.name}
                </div>
                <div
                  className={`text-xs tabular font-mono ${isSelected ? "text-blue-300" : "text-[#71767B]"}`}
                >
                  {tier.students.toLocaleString()} students
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Tier Architectural Breakdown */}
        <div className="rounded-2xl bg-white border border-[#E5E8E0] p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-mono text-[#0047FF] font-semibold uppercase">
                SCALABILITY PROFILE
              </span>
              <h3 className="font-display text-2xl font-bold text-[#111315]">
                {currentTier.name}
              </h3>
              <p className="text-xs sm:text-sm text-[#4B5259] leading-relaxed">
                {currentTier.description}
              </p>

              <div className="p-4 rounded-xl bg-[#FAFBF9] border border-[#E5E8E0] space-y-2 font-mono text-xs text-[#4B5259]">
                <div className="flex justify-between">
                  <span className="text-[#71767B]">Weekly Constraints:</span>
                  <span className="font-bold text-[#111315] tabular">
                    {currentTier.weeklyConstraints.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71767B]">
                    Total Course Allocations:
                  </span>
                  <span className="font-bold text-[#111315] tabular">
                    {currentTier.courses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71767B]">
                    Distributed Rooms & Labs:
                  </span>
                  <span className="font-bold text-[#111315] tabular">
                    {currentTier.rooms.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Quantitative Metrics Grid */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-[#F7F8F5] border border-[#E5E8E0] text-center">
                <Users className="w-5 h-5 mx-auto text-[#0047FF] mb-2" />
                <div className="font-display text-2xl font-bold text-[#111315] tabular">
                  {currentTier.students.toLocaleString()}
                </div>
                <div className="text-[11px] font-medium text-[#71767B] mt-1">
                  Enrolled Students
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#F7F8F5] border border-[#E5E8E0] text-center">
                <Building2 className="w-5 h-5 mx-auto text-[#0047FF] mb-2" />
                <div className="font-display text-2xl font-bold text-[#111315] tabular">
                  {currentTier.faculty.toLocaleString()}
                </div>
                <div className="text-[11px] font-medium text-[#71767B] mt-1">
                  Active Faculty
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#111315] text-white border border-black/20 text-center col-span-2 sm:col-span-1">
                <Clock className="w-5 h-5 mx-auto text-emerald-400 mb-2" />
                <div className="font-display text-2xl font-bold text-emerald-400 tabular">
                  {currentTier.solveTimeSeconds}s
                </div>
                <div className="text-[11px] font-medium text-white/70 mt-1">
                  Full Timetable Solve
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
