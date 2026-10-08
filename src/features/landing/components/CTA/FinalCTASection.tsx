import React, { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface FinalCTASectionProps {
  onRequestPilot: () => void;
  onScrollToDemo: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({
  onRequestPilot,
  onScrollToDemo,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Floating timetable preview chips
  const floatingBlocks = [
    {
      code: "CS-301",
      title: "Algorithms & Complexity",
      room: "Turing 101",
      time: "MON 09:30",
      pos: "top-8 left-8 hidden lg:block",
    },
    {
      code: "EE-205",
      title: "Digital Logic Lab",
      room: "Circuits 01",
      time: "TUE 13:30",
      pos: "top-12 right-12 hidden lg:block",
    },
    {
      code: "MA-201",
      title: "Linear Algebra",
      room: "Shannon 204",
      time: "WED 10:45",
      pos: "bottom-12 left-16 hidden lg:block",
    },
    {
      code: "CS-408",
      title: "Distributed Systems",
      room: "Systems Lab 03",
      time: "THU 08:30",
      pos: "bottom-10 right-20 hidden lg:block",
    },
  ];

  return (
    <section className="gsap-section-reveal py-24 lg:py-32 bg-[#111315] text-white relative overflow-hidden">
      {/* Background architectural grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern-dark opacity-20 pointer-events-none" />

      {/* Floating schedule cards that react on hover and scroll parallax */}
      {floatingBlocks.map((b) => (
        <div
          key={b.code}
          className={`gsap-parallax-float absolute ${b.pos} p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md transition-all duration-700 pointer-events-none font-mono text-xs ${
            isHovered
              ? "opacity-80 translate-y-0 scale-100"
              : "opacity-25 translate-y-2 scale-95"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
            <span>{b.time}</span>
            <span className="text-emerald-400">0 CONFLICTS</span>
          </div>
          <div className="font-bold text-white font-sans">
            {b.code} · {b.title}
          </div>
          <div className="text-[10px] text-white/60 mt-0.5">{b.room}</div>
        </div>
      ))}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Kicker */}
        <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-widest mb-6">
          <span>INSTITUTIONAL DEPLOYMENT</span>
          <span aria-hidden="true" className="text-white/30">
            ·
          </span>
          <span>AUTUMN 2026 SEMESTER</span>
        </div>

        {/* Headline */}
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] text-balance mb-6">
          Your next semester could already be scheduled.
        </h2>

        {/* Supporting message */}
        <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed text-balance mb-10">
          Set your constraints. Generate the schedule in under 30 seconds.
          Adjust anything mid-semester without rebuilding from scratch.
        </p>

        {/* Interactive CTA button with hover detection */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            onClick={onRequestPilot}
            className="w-full sm:w-auto px-8 py-4 text-sm font-semibold text-white bg-[#0047FF] hover:bg-[#0038CC] rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 group"
          >
            <span>Request Institutional Pilot</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onScrollToDemo}
            className="w-full sm:w-auto px-8 py-4 text-sm font-semibold text-white/90 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200"
          >
            Test Live Interactive Sandbox
          </button>
        </div>

        {/* Bottom verification markers */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dedicated SIS Implementation Engineer</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Student Double-Booking Guarantee</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>FERPA & SOC 2 Compliant</span>
          </span>
        </div>
      </div>
    </section>
  );
};
