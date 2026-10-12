import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface FinalCTASectionProps {
  onScrollToDemo: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({
  onScrollToDemo,
}) => {
  const floatingBlocks = [
    {
      code: "CSE-G",
      title: "B.Tech CSE 3rd Year · 42/42 packed",
      room: "Break + Lunch columns · ~1s solve",
      time: "6 DAYS × 7 PERIODS",
      pos: "top-8 left-8 hidden lg:block",
    },
    {
      code: "SEC-A…I",
      title: "Enterprise · 378 sessions",
      room: "9 sections · 40 faculty · ~2–5s",
      time: "FULLY PACKED",
      pos: "top-12 right-12 hidden lg:block",
    },
    {
      code: "v20",
      title: "Version history with restore",
      room: "Every run & edit snapshotted",
      time: "REVERSIBLE",
      pos: "bottom-12 left-16 hidden lg:block",
    },
    {
      code: "PDF+XLSX",
      title: "Notice-board export",
      room: "Crest header · signatories",
      time: "READY TO PIN",
      pos: "bottom-10 right-20 hidden lg:block",
    },
  ];

  return (
    <section className="gsap-section-reveal py-24 lg:py-32 bg-[#111315] text-white relative overflow-hidden">
      {/* Background architectural grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern-dark opacity-20 pointer-events-none" />

      {/* Floating product-fact cards */}
      {floatingBlocks.map((b) => (
        <div
          key={b.code}
          className={`absolute ${b.pos} p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md pointer-events-none font-mono text-xs opacity-60`}
        >
          <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
            <span>{b.time}</span>
            <span className="text-emerald-400">IN THE APP</span>
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
          <span>OFFLINE · PRIVATE · MIT LICENSED</span>
        </div>

        {/* Headline */}
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] text-balance mb-6">
          Your department&apos;s timetable is one preset away.
        </h2>

        {/* Supporting message */}
        <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed text-balance mb-10">
          Apply a preset, check preflight, generate in seconds, edit anything
          with validation blocking conflicts — then export the notice-board PDF.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-4 text-sm font-semibold text-white bg-[#0047FF] hover:bg-[#0038CC] rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 group"
          >
            <span>Open the app</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            onClick={onScrollToDemo}
            className="w-full sm:w-auto px-8 py-4 text-sm font-semibold text-white/90 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200"
          >
            See how it works
          </button>
        </div>

        {/* Bottom verification markers — real guarantees */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>No account needed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Works offline, data stays in your browser</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>PDF + Excel export included</span>
          </span>
        </div>
      </div>
    </section>
  );
};
