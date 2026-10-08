import React, { useState } from "react";
import { Cpu, CheckCircle2 } from "lucide-react";

interface EngineNode {
  id: string;
  title: string;
  description: string;
  type: "input" | "core" | "output";
  details: string;
}

export const EngineArchitectureSection: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string>("in-1");

  const inputNodes: EngineNode[] = [
    {
      id: "in-1",
      title: "Faculty Availability",
      description:
        "Blocked days, sabbaticals, research hours, maximum consecutive teaching blocks.",
      type: "input",
      details:
        "Mathematical model treats availability as a boolean matrix constraint A(f, t) ∈ {0, 1}. Zero values enforce hard non-assignment barriers.",
    },
    {
      id: "in-2",
      title: "Room & Lab Capacities",
      description:
        "Physical seat counts, acoustic profiles, wheelchair accessibility, projector requirements.",
      type: "input",
      details:
        "Enforces Cap(room) ≥ Enrolled(section) with a configurable buffer margin (e.g. 15%) to avoid overcrowded lecture halls.",
    },
    {
      id: "in-3",
      title: "Laboratory Hardware Specs",
      description:
        "High-performance GPUs, FPGA workstations, cleanroom biosafety levels, fume hoods.",
      type: "input",
      details:
        "Laboratory courses strictly require RoomEquipment(r) ⊇ CourseNeeds(c). Non-matching standard classrooms are immediately pruned.",
    },
    {
      id: "in-4",
      title: "Curriculum & Cohort Rules",
      description:
        "Multi-section prerequisite branches, common core tracks, shared mathematics lectures.",
      type: "input",
      details:
        "Prevents sibling cohort collision: Section A and Section B of the same major will never have overlapping required foundation lectures.",
    },
    {
      id: "in-5",
      title: "Workload & Rest Policies",
      description:
        "Daily teaching caps, mandatory campus-wide lunch intermission, inter-building transit gaps.",
      type: "input",
      details:
        "Soft and hard heuristics guarantee faculty never teach >4 hours in a single calendar day without at least a 60-minute recovery period.",
    },
    {
      id: "in-6",
      title: "Electives & Cross-Registration",
      description:
        "Inter-departmental electives, minor tracks, and graduate seminar blocks.",
      type: "input",
      details:
        "Synchronizes elective bands across 4 distinct departments so students can attend cross-disciplinary minors without course clashes.",
    },
  ];

  const outputNodes: EngineNode[] = [
    {
      id: "out-1",
      title: "Conflict-Free Timetables",
      description:
        "Zero faculty overlaps, zero room collisions, and complete curriculum coverage.",
      type: "output",
      details:
        "Instantly exportable as ICS calendar feeds, PDF booklets, interactive student mobile portals, and SIS sync.",
    },
    {
      id: "out-2",
      title: "Faculty Teaching Schedules",
      description:
        "Balanced individual schedules with personal calendar subscriptions and office hour buffers.",
      type: "output",
      details:
        "Each professor receives a verified personal schedule adhering to their specific research and committee hours.",
    },
    {
      id: "out-3",
      title: "Space Utilization Maps",
      description:
        "Real-time room occupancy heatmaps and unused inventory reports for campus facilities.",
      type: "output",
      details:
        "Eliminates ghost rooms and afternoon dead zones by spreading cohort usage efficiently across available real estate.",
    },
  ];

  const currentNode =
    [...inputNodes, ...outputNodes].find((n) => n.id === activeNode) ||
    inputNodes[0];

  return (
    <section
      id="architecture"
      className="gsap-section-reveal py-20 lg:py-28 bg-[#F7F8F5] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>System Architecture</span>
            <span aria-hidden="true" className="text-black/30">
              ·
            </span>
            <span className="text-[#0047FF]">
              Constraint Satisfaction Engine
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            Thousands of constraints. One coordinated schedule.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            Cadence evaluates academic scheduling as a multi-dimensional
            constraint satisfaction problem (CSP), coordinating hard
            institutional rules and soft pedagogical preferences in real time.
          </p>
        </div>

        {/* System Diagram Flow Container */}
        <div
          id="engine-architecture-diagram"
          className="rounded-2xl bg-white border border-[#E5E8E0] p-6 lg:p-10 shadow-sm"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Column 1: Input Constraint Nodes (Left) */}
            <div className="lg:col-span-4 space-y-2.5">
              <div className="text-xs font-mono text-[#71767B] uppercase tracking-wider mb-3 px-1">
                Institutional Constraints (Inputs)
              </div>
              {inputNodes.map((node) => {
                const isActive = activeNode === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setActiveNode(node.id)}
                    className={`engine-input-node w-full text-left p-3.5 rounded-xl border transition-all text-xs ${
                      isActive
                        ? "bg-[#111315] text-white border-[#111315] shadow-sm"
                        : "bg-[#FAFBF9] text-[#30363D] border-[#E5E8E0] hover:border-[#0047FF] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{node.title}</span>
                      <span
                        className={`text-[10px] font-mono ${isActive ? "text-blue-300" : "text-[#71767B]"}`}
                      >
                        HARD / SOFT
                      </span>
                    </div>
                    <p
                      className={`line-clamp-1 text-[11px] ${isActive ? "text-white/70" : "text-[#71767B]"}`}
                    >
                      {node.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Column 2: Core Cadence Solver Node (Center) */}
            <div className="engine-core-solver lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#111315] text-white border border-black/10 relative overflow-hidden text-center min-h-[360px]">
              {/* Subtle pulsing background glow */}
              <div className="absolute inset-0 bg-radial-gradient from-blue-500/10 via-transparent to-transparent pointer-events-none" />

              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                <Cpu className="w-6 h-6 animate-pulse" />
              </div>

              <div className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-1">
                Core Engine
              </div>
              <h3 className="font-display text-xl font-bold tracking-tight text-white mb-2">
                Cadence Constraint Solver
              </h3>
              <p className="text-xs text-white/70 max-w-xs mx-auto leading-relaxed mb-6 font-sans">
                Branch-and-bound optimization with graph coloring heuristics and
                backtracking pruning.
              </p>

              {/* Engine Metrics badge strip */}
              <div className="w-full grid grid-cols-2 gap-2 text-left pt-4 border-t border-white/10 text-[11px] font-mono">
                <div className="p-2 rounded bg-white/5">
                  <div className="text-white/40 text-[9px] uppercase">
                    Search Pruning
                  </div>
                  <div className="text-white font-semibold">
                    99.4% Eliminated
                  </div>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <div className="text-white/40 text-[9px] uppercase">
                    Solve Guarantee
                  </div>
                  <div className="text-emerald-400 font-semibold">
                    0 Collisions
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Output Artifacts (Right) */}
            <div className="lg:col-span-4 space-y-2.5">
              <div className="text-xs font-mono text-[#71767B] uppercase tracking-wider mb-3 px-1">
                Verified Outputs (Artifacts)
              </div>
              {outputNodes.map((node) => {
                const isActive = activeNode === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setActiveNode(node.id)}
                    className={`engine-output-node w-full text-left p-4 rounded-xl border transition-all text-xs ${
                      isActive
                        ? "bg-[#111315] text-white border-[#111315] shadow-sm"
                        : "bg-[#FAFBF9] text-[#30363D] border-[#E5E8E0] hover:border-[#0047FF] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{node.title}</span>
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-emerald-600"}`}
                      />
                    </div>
                    <p
                      className={`line-clamp-2 text-[11px] ${isActive ? "text-white/70" : "text-[#71767B]"}`}
                    >
                      {node.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Node Inspector Drawer */}
          <div className="mt-8 pt-6 border-t border-[#E5E8E0] bg-[#FAFBF9] rounded-xl p-5 border">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#0047FF] uppercase">
                  ACTIVE RULE SPECIFICATION:
                </span>
                <span className="text-sm font-bold text-[#111315]">
                  {currentNode.title}
                </span>
              </div>
              <span className="text-xs font-mono text-[#71767B]">
                STATUS: ENFORCED IN SOLVER KERNEL
              </span>
            </div>
            <p className="text-xs text-[#4B5259] leading-relaxed max-w-4xl">
              {currentNode.details}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
