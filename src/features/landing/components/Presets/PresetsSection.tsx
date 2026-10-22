import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";

const PRESETS = [
  {
    name: "Standard School — Delhi Public School",
    spec: "4 sections (9-A, 9-B, 10-A, 10-B) · 9 subjects (1 lab) · 15 teachers · 5 days × 7 periods",
    text: "CBSE secondary wing with real subject curriculum, period timings, morning recess, and lunch break. Solved with zero conflicts in ~1s.",
    featured: false,
  },
  {
    name: "B.Tech CSE (Enterprise) — 9 Sections",
    spec: "9 sections (CSE-A to CSE-I) · 8 subjects (5 theory + 3 labs) · 40 faculty · 14 rooms · 6 days × 7 periods",
    text: "Vardhaman College of Engineering scale: 342 sessions, 5 dedicated faculty per subject, 2-period atomic lab blocks, morning break & lunch. 100% conflict-free in ~2.5s.",
    featured: true,
  },
  {
    name: "Medical College — AIIMS Clinical Phase",
    spec: "3 batches (Alpha, Beta, Gamma) · 8 subjects (5 theory + 3 clinical) · 16 doctors · 5 days × 6 periods",
    text: "MBBS clinical curriculum with hospital ward rotations, histopathology and diagnostic laboratories. Solved in ~0.3s.",
    featured: false,
  },
];

export const PresetsSection: React.FC = () => {
  return (
    <section
      id="presets"
      className="gsap-section-reveal py-20 lg:py-28 bg-white border-y border-[#E5E8E0]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Built-in presets</span>
            <span aria-hidden="true" className="text-black/30">
              ·
            </span>
            <span className="text-[#0047FF]">One click sets up everything</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            Start from a real department, not a blank form.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            Three production-grade institutional blueprints ship with the app:
            Standard School, B.Tech Enterprise (9 Sections), and Medical College.
            Applying one pre-configures all sections, subjects, faculty, rooms,
            and generates a 100% conflict-free timetable in one click.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRESETS.map((p) => (
            <article
              key={p.name}
              className={`rounded-2xl border p-5 flex flex-col ${
                p.featured
                  ? "bg-[#111315] text-white border-[#111315]"
                  : "bg-[#FAFBF9] border-[#E5E8E0]"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display text-base font-bold leading-snug">
                  {p.name}
                </h3>
                {p.featured && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono font-bold text-blue-300 uppercase">
                    <Star size={11} /> Popular
                  </span>
                )}
              </div>
              <p
                className={`text-[11px] font-mono mb-2.5 ${p.featured ? "text-white/60" : "text-[#71767B]"}`}
              >
                {p.spec}
              </p>
              <p
                className={`text-[13px] leading-relaxed flex-1 ${p.featured ? "text-white/80" : "text-[#4B5259]"}`}
              >
                {p.text}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-[#FAFBF9] border border-[#E5E8E0] p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-sm text-[#4B5259] leading-relaxed flex-1">
            Presets live on the dashboard under “Institutional Blueprints” —
            apply one, inspect the generated configuration, then head to the
            Generate page.
          </p>
          <Link
            to="/dashboard"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#111315] hover:bg-[#0047FF] rounded-xl transition-colors"
          >
            <span>Browse presets</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
