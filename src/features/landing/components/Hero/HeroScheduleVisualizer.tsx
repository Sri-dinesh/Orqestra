import React, { useState } from "react";
import { ScheduleClass } from "../../types/schedule";
import {
  HERO_INITIAL_CLASSES,
  HERO_OPTIMIZED_CLASSES,
  DAYS,
} from "../../data/mockSchedule";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

interface HeroVisualizerProps {
  onSelectClass?: (item: ScheduleClass) => void;
}

export const HeroScheduleVisualizer: React.FC<HeroVisualizerProps> = ({
  onSelectClass,
}) => {
  const [isOptimized, setIsOptimized] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepMessage, setStepMessage] = useState(
    "Schedule verified · 0 conflicts",
  );
  const [selectedCell, setSelectedCell] = useState<ScheduleClass | null>(null);

  const activeClasses = isOptimized
    ? HERO_OPTIMIZED_CLASSES
    : HERO_INITIAL_CLASSES;

  const runOptimization = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsOptimized(false);

    const steps = [
      "Scanning 180 faculty availability matrices...",
      "Matching cohort size to physical room capacities...",
      "Allocating specialized FPGA & DB laboratory hardware...",
      "Resolving 3 faculty double-bookings & overlaps...",
      "Snapping verified allocations to conflict-free grid...",
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setStepMessage(steps[currentStep]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsOptimized(true);
        setIsProcessing(false);
        setStepMessage("Schedule optimized · 0 conflicts · 100% placed");
        // trigger subtle celebratory confetti
        try {
          confetti({
            particleCount: 35,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#0047FF", "#10B981", "#111315"],
          });
        } catch {
          // fallback if window not ready
        }
      }
    }, 700);
  };

  const triggerChaos = () => {
    setIsOptimized(false);
    setStepMessage("Detected 3 operational conflicts across sections");
  };

  return (
    <div className="relative w-full rounded-2xl bg-white border border-[#E5E8E0] shadow-xl shadow-black/5 overflow-hidden">
      {/* Top Console Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-[#FAFBF9] border-b border-[#E5E8E0] gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isProcessing
                  ? "bg-amber-400"
                  : isOptimized
                    ? "bg-emerald-400"
                    : "bg-rose-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isProcessing
                  ? "bg-amber-500"
                  : isOptimized
                    ? "bg-emerald-500"
                    : "bg-rose-500"
              }`}
            />
          </span>
          <span className="text-xs font-mono font-medium text-[#4B5259] tracking-tight">
            ENGINE STATUS:{" "}
            <span className="text-[#111315] font-semibold">{stepMessage}</span>
          </span>
        </div>

        {/* Engine action buttons with accessible focus rings */}
        <div className="flex items-center gap-2">
          {isOptimized ? (
            <button
              onClick={triggerChaos}
              className="text-xs font-medium text-[#4B5259] hover:text-[#111315] px-2.5 py-1.5 rounded-md hover:bg-black/5 transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#0047FF] focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-[#0047FF]"
              title="Simulate schedule conflicts"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Simulate Conflict</span>
            </button>
          ) : (
            <button
              onClick={runOptimization}
              disabled={isProcessing}
              className="text-xs font-semibold text-white bg-[#0047FF] hover:bg-[#0038CC] px-3 py-1.5 rounded-md transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#0047FF] focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-[#0047FF]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`}
              />
              <span>{isProcessing ? "Solving..." : "Resolve & Optimize"}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#71767B] bg-[#F1F3ED] px-2 py-1 rounded">
            <span>SEMESTER / 2026-A</span>
            <span className="text-black/30">|</span>
            <span className="tabular">0 CONFLICTS</span>
          </div>
        </div>
      </div>

      {/* Schedule Matrix Grid */}
      <div className="p-4 sm:p-5 overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Day Headers */}
          <div className="grid grid-cols-5 gap-2.5 mb-2.5">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center py-1.5 bg-[#F7F8F5] border border-[#E5E8E0] rounded-lg text-xs font-mono font-semibold text-[#30363D]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Schedule Slots Rows */}
          <div className="grid grid-cols-5 gap-2.5">
            {DAYS.map((day) => {
              const dayClasses = activeClasses.filter((c) => c.day === day);
              return (
                <div key={day} className="flex flex-col gap-2 min-h-[300px]">
                  {dayClasses.map((item) => {
                    const isConflict = !isOptimized && item.hasConflict;
                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Inspect ${item.courseCode} ${item.courseName}, taught by ${item.facultyName} in ${item.roomName}`}
                        onClick={() => {
                          setSelectedCell(item);
                          if (onSelectClass) onSelectClass(item);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedCell(item);
                            if (onSelectClass) onSelectClass(item);
                          }
                        }}
                        className={`group relative p-3 rounded-xl border transition-all duration-300 cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-[#0047FF] focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-[#0047FF] focus-visible:z-10 ${
                          isConflict
                            ? "bg-rose-50/90 border-rose-200 shadow-sm"
                            : "bg-white border-[#E5E8E0] hover:border-[#0047FF] hover:shadow-md hover:-translate-y-0.5"
                        }`}
                      >
                        {/* Time & Type Kicker */}
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                          <span
                            className={`tabular ${isConflict ? "text-rose-600 font-semibold" : "text-[#71767B]"}`}
                          >
                            {item.startTime.split(" - ")[0]}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-wider ${
                              item.type === "lab"
                                ? "text-[#0047FF] font-semibold"
                                : "text-[#4B5259]"
                            }`}
                          >
                            {item.type}
                          </span>
                        </div>

                        {/* Course Name */}
                        <div className="font-semibold text-xs text-[#111315] tracking-tight group-hover:text-[#0047FF] group-focus-visible:text-[#0047FF] transition-colors line-clamp-1">
                          {item.courseCode} · {item.courseName}
                        </div>

                        {/* Room & Faculty */}
                        <div className="mt-1 text-[11px] text-[#4B5259] flex items-center justify-between">
                          <span className="truncate">{item.roomName}</span>
                          <span className="text-[10px] text-[#71767B] shrink-0 ml-1">
                            {item.section}
                          </span>
                        </div>

                        {/* Conflict Warning callout */}
                        {isConflict && item.conflictReason && (
                          <div className="mt-2 pt-2 border-t border-rose-200/80 text-[10px] text-rose-700 font-medium flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                            <span className="leading-tight">
                              {item.conflictReason}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty state filler slot */}
                  {dayClasses.length < 3 && (
                    <div className="p-3 rounded-xl border border-dashed border-[#E5E8E0] bg-[#FAFBF9] text-center flex items-center justify-center min-h-[70px]">
                      <span className="text-[11px] font-mono text-[#8C9298]">
                        Free Study Block
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Cell Inspector Banner */}
      {selectedCell && (
        <div className="px-5 py-3 bg-[#111315] text-white flex flex-wrap items-center justify-between gap-3 text-xs border-t border-black/10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-emerald-400 font-medium">
              INSPECTING:
            </span>
            <span className="font-semibold text-white">
              {selectedCell.courseCode} — {selectedCell.courseName}
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/80">{selectedCell.facultyName}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/80 font-mono">
              {selectedCell.roomName}
            </span>
          </div>
          <button
            onClick={() => setSelectedCell(null)}
            className="text-white/80 hover:text-white text-[11px] underline underline-offset-4 px-2 py-1 rounded focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close inspector"
          >
            Close Inspector
          </button>
        </div>
      )}

      {/* Bottom Proof Strip */}
      <div className="px-5 py-2.5 bg-[#FAFBF9] border-t border-[#E5E8E0] flex flex-wrap items-center justify-between text-xs text-[#71767B]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[#30363D] font-medium">
              Room Capacities Validated
            </span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[#30363D] font-medium">
              Faculty Workload Balanced
            </span>
          </span>
          <span className="hidden md:flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[#30363D] font-medium">
              Lab Equipment Synchronized
            </span>
          </span>
        </div>
        <div className="font-mono text-[11px] text-[#4B5259]">
          SOLVE LATENCY:{" "}
          <span className="font-semibold text-[#111315]">2.4s</span>
        </div>
      </div>
    </div>
  );
};
