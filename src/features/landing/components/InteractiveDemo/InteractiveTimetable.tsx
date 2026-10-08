import React, { useState } from "react";
import { ScheduleClass } from "../../types/schedule";
import { DEMO_DATASETS } from "../../data/mockSchedule";
import { TimetableGrid } from "./TimetableGrid";
import { RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface InteractiveTimetableProps {
  onOpenDetails?: (c: ScheduleClass) => void;
}

export const InteractiveTimetable: React.FC<InteractiveTimetableProps> = ({
  onOpenDetails,
}) => {
  const [department, setDepartment] = useState<"CSE" | "ECE">("CSE");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [classes, setClasses] = useState<ScheduleClass[]>(
    DEMO_DATASETS.CSE.classes,
  );
  const [activeConflict, setActiveConflict] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ScheduleClass | null>(
    null,
  );

  const handleDepartmentChange = (dept: "CSE" | "ECE") => {
    setDepartment(dept);
    setClasses(DEMO_DATASETS[dept].classes);
    setActiveConflict(null);
  };

  const handleSimulateConflict = () => {
    // Introduce an intentional conflict between two courses sharing a room
    setActiveConflict(
      "Simulated Room Collision: CS-201 and EE-205 both requested Turing Hall 101 on TUE at 10:45.",
    );
  };

  const handleAutoResolve = () => {
    setActiveConflict(null);
    try {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.7 },
        colors: ["#0047FF", "#10B981"],
      });
    } catch {
      // ignore
    }
  };

  const handleGenerateSchedule = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setActiveConflict(null);

    const steps = [
      "Reading faculty availability matrix...",
      "Allocating lecture halls & computer lab workstations...",
      "Balancing weekly cohort workloads...",
      "Executing branch-and-bound conflict resolution...",
      "Verifying zero collisions across all 14 courses...",
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setGenerationStep(steps[current]);
        current++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
        setGenerationStep("Generation complete: 0 conflicts detected");
        try {
          confetti({
            particleCount: 45,
            spread: 70,
            origin: { y: 0.65 },
            colors: ["#0047FF", "#10B981", "#111315"],
          });
        } catch {
          // ignore
        }
      }
    }, 600);
  };

  return (
    <section
      id="interactive-demo"
      className="gsap-section-reveal py-20 lg:py-28 bg-[#F7F8F5] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
              <span>Interactive Sandbox</span>
              <span aria-hidden="true" className="text-black/30">
                ·
              </span>
              <span className="text-[#0047FF]">Live Schedule Generator</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
              Test the scheduling engine directly.
            </h2>
            <p className="mt-3 text-base text-[#4B5259] leading-relaxed">
              Explore how real institutional curriculum data behaves under
              constraint optimization. Navigate with keyboard or mouse to
              inspect any slot or simulate collisions.
            </p>
          </div>

          {/* Primary Sandbox Actions with High-Contrast Accessible Focus States */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateConflict}
              className="px-4 py-2.5 text-xs font-semibold text-[#4B5259] bg-white border border-[#E5E8E0] hover:border-amber-500 hover:text-amber-700 rounded-xl transition-all shadow-sm flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-[#0047FF] focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-[#0047FF]"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulate Conflict</span>
            </button>
            <button
              onClick={handleGenerateSchedule}
              disabled={isGenerating}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0047FF] hover:bg-[#0038CC] rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#0047FF] focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-[#0047FF]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`}
              />
              <span>
                {isGenerating ? "Optimizing..." : "Generate Schedule"}
              </span>
            </button>
          </div>
        </div>

        {/* Conflict Alert Banner if active */}
        {activeConflict && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium">{activeConflict}</span>
            </div>
            <button
              onClick={handleAutoResolve}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Auto-Resolve via Cadence Solver
            </button>
          </div>
        )}

        {/* Timetable Console Card */}
        <div className="rounded-2xl bg-white border border-[#E5E8E0] shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 bg-[#FAFBF9] border-b border-[#E5E8E0] flex flex-wrap items-center justify-between gap-4">
            {/* Department Segmented Controls with High-Contrast Accessible Focus States */}
            <div
              className="flex items-center gap-1.5 p-1 bg-[#F1F3ED] rounded-xl"
              role="tablist"
              aria-label="Department selectors"
            >
              <button
                role="tab"
                aria-selected={department === "CSE"}
                onClick={() => handleDepartmentChange("CSE")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-[#0047FF] focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-[#0047FF] ${
                  department === "CSE"
                    ? "bg-white text-[#111315] shadow-xs"
                    : "text-[#4B5259] hover:text-[#111315]"
                }`}
              >
                Computer Science (CSE)
              </button>
              <button
                role="tab"
                aria-selected={department === "ECE"}
                onClick={() => handleDepartmentChange("ECE")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-[#0047FF] focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-[#0047FF] ${
                  department === "ECE"
                    ? "bg-white text-[#111315] shadow-xs"
                    : "text-[#4B5259] hover:text-[#111315]"
                }`}
              >
                Electrical Eng (ECE)
              </button>
            </div>

            {/* Semester & Section selectors */}
            <div className="flex items-center gap-3 text-xs text-[#4B5259]">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-[#71767B]">TERM:</span>
                <span className="font-semibold text-[#111315]">
                  Autumn 2026
                </span>
              </div>
              <span className="text-black/20">|</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-[#71767B]">COHORT:</span>
                <span className="font-semibold text-[#111315]">
                  Sem III / Sec A
                </span>
              </div>
            </div>

            {/* Engine status indicator */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[#30363D] font-medium">
                {isGenerating ? generationStep : "SOLVER READY · 0 CONFLICTS"}
              </span>
            </div>
          </div>

          {/* Timetable Weekly Canvas */}
          <TimetableGrid
            classes={classes}
            isGenerating={isGenerating}
            selectedClassId={selectedClass?.id}
            onSelectClass={(item) => setSelectedClass(item)}
            onOpenDetails={onOpenDetails}
          />

          {/* Active Class Inspection Bar */}
          {selectedClass && (
            <div className="px-6 py-4 bg-[#111315] text-white flex flex-wrap items-center justify-between gap-4 border-t border-black/10 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-emerald-400 font-bold">
                  COURSE INSPECTOR:
                </span>
                <span className="font-bold text-white">
                  {selectedClass.courseCode}: {selectedClass.courseName}
                </span>
                <span className="text-white/30">|</span>
                <span className="text-white/80">
                  {selectedClass.facultyName}
                </span>
                <span className="text-white/30">|</span>
                <span className="text-white/80 font-mono">
                  {selectedClass.roomName}
                </span>
                <span className="text-white/30">|</span>
                <span className="text-white/80 font-mono">
                  {selectedClass.startTime}
                </span>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-white/80 hover:text-white underline underline-offset-4 font-mono text-[11px] px-2 py-1 rounded focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Dismiss course inspector"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Bottom Footer Statistics */}
          <div className="p-4 bg-[#FAFBF9] border-t border-[#E5E8E0] flex flex-wrap items-center justify-between text-xs text-[#71767B]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[#30363D]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Course Placement Satisfied</span>
              </span>
              <span className="hidden sm:flex items-center gap-1.5 text-[#30363D]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Double-Bookings</span>
              </span>
            </div>
            <div className="font-mono text-[11px] text-[#4B5259]">
              ALGORITHM:{" "}
              <span className="font-semibold text-[#111315]">
                CSP GRAPH COLORING
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
