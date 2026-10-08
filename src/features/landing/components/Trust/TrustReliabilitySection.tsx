import React from "react";
import { CheckCircle2 } from "lucide-react";

export const TrustReliabilitySection: React.FC = () => {
  const securityPillars = [
    {
      title: "Immutable Versioning & Audit Log",
      description:
        "Every timetable generation and room reallocation creates a signed audit checkpoint. Roll back entire semester drafts in one click.",
    },
    {
      title: "SIS & LMS Direct Synchronization",
      description:
        "Bi-directional integration with Ellucian Banner, Canvas LMS, Blackboard Learn, and Workday Student through secure REST APIs.",
    },
    {
      title: "FERPA & SOC 2 Type II Certified",
      description:
        "Enterprise data protection. Student privacy safeguarded with end-to-end encryption at rest (AES-256) and in transit (TLS 1.3).",
    },
    {
      title: "Role-Based Access Governance",
      description:
        "Granular permissions ensuring professors only view and edit their department courses, while registrars govern campus policies.",
    },
  ];

  return (
    <section className="gsap-section-reveal py-20 lg:py-28 bg-[#FAFBF9] border-t border-[#E5E8E0] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Institutional Reliability</span>
            <span aria-hidden="true" className="text-black/30">
              ·
            </span>
            <span className="text-[#0047FF]">Enterprise Infrastructure</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            Scheduling institutions can depend on.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            Universities cannot afford timetable downtime or corrupted course
            registration feeds. Cadence is engineered with mission-critical
            institutional stability.
          </p>
        </div>

        {/* Security & System Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {securityPillars.map((p) => (
            <div
              key={p.title}
              className="p-6 rounded-2xl bg-white border border-[#E5E8E0] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#0047FF] uppercase mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>VERIFIED PILLAR</span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#111315] mb-2">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5259] leading-relaxed">
                  {p.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Editorial Testimonials (No fake headshots, dignified typographical quotes) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-[#E5E8E0]">
          <div className="p-8 rounded-2xl bg-[#111315] text-white border border-black/20 flex flex-col justify-between">
            <blockquote className="font-display text-xl sm:text-2xl font-medium text-white/95 leading-relaxed mb-8">
              “Scheduling six engineering departments previously demanded three
              weeks of grueling committee meetings. With Cadence, we generate
              and test four complete alternative semester models in an
              afternoon.”
            </blockquote>
            <div className="pt-4 border-t border-white/10 flex items-baseline justify-between text-xs font-mono">
              <div>
                <div className="font-bold text-white text-sm">
                  Prof. A. Henderson, Ph.D.
                </div>
                <div className="text-white/60 font-sans mt-0.5">
                  Dean of Academic Planning · Polytechnic University
                </div>
              </div>
              <span className="text-blue-400">18,500 STUDENTS</span>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-[#E5E8E0] shadow-sm flex flex-col justify-between">
            <blockquote className="font-display text-xl sm:text-2xl font-medium text-[#111315] leading-relaxed mb-8">
              “The dynamic adjustment capability is what convinced us. When two
              physics lecture halls flooded last October, we relocated 24 course
              sessions without creating a single student conflict or room
              clash.”
            </blockquote>
            <div className="pt-4 border-t border-[#E5E8E0] flex items-baseline justify-between text-xs font-mono">
              <div>
                <div className="font-bold text-[#111315] text-sm">
                  M. Rosenthal
                </div>
                <div className="text-[#71767B] font-sans mt-0.5">
                  University Registrar · Metropolitan Institute of Tech
                </div>
              </div>
              <span className="text-[#0047FF]">MULTI-CAMPUS</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
