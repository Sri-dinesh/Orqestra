import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";

const PRESETS = [
  {
    name: "Quick Start — Minimal",
    spec: "1 section · 3 subjects (1 lab) · 2 faculty · 5 days × 6 periods",
    text: "Best for trying the app: the smallest complete setup that still exercises theory, labs, and generation end to end.",
    featured: false,
  },
  {
    name: "Standard B.Tech Section",
    spec: "1 section · 6 subjects (2 labs) · 5 faculty · 5 days × 7 periods",
    text: "A realistic single-section semester load with shared lab supervision across faculty.",
    featured: false,
  },
  {
    name: "Two Sections + Shared Faculty",
    spec: "2 sections · 4 subjects (1 lab) · 3 faculty · 5 days × 7 periods",
    text: "One mathematics teacher spans both sections — demonstrates cross-section conflict handling in the solver and validator.",
    featured: false,
  },
  {
    name: "Lab-Heavy Workshop Schedule",
    spec: "1 section · 5 subjects (3 labs) · 4 faculty · 6 days × 6 periods",
    text: "Stresses atomic 2-period lab blocks: five lab sessions a week that can never split or span a break.",
    featured: false,
  },
  {
    name: "Enterprise — 9 Sections (Large)",
    spec: "9 sections · 9 subjects (6 theory ×6/wk + 3 labs) · 40 faculty · 6 days × 7 periods",
    text: "Fully packed at 42/42 periods per section per week — 378 sessions solved in ~2–5s with dedicated faculty pools per subject and fair load spread.",
    featured: true,
  },
  {
    name: "B.Tech CSE 3rd Year",
    spec: "3 sections (CSE-G/H/I) · 12 subjects (4 labs) · 13 faculty · 6 days × 7 periods + Break & Lunch",
    text: "Mirrors a real Vardhaman College III-I timetable: real subjects, faculty, rooms, and period timings — fully packed at 42/42, solved in ~1s.",
    featured: true,
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
            Six presets ship with the app. Applying one creates the department,
            sections, subjects, faculty, requirements, rooms, breaks, and
            generation settings in one go — review it under Configuration, then
            generate.
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
