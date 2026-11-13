import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Building2, GraduationCap, Stethoscope } from 'lucide-react';

const PRESETS = [
  {
    icon: Building2,
    name: 'Standard Secondary School',
    institution: 'CBSE and High School Pattern',
    spec: '4 sections · 9 courses · 15 teachers · 5 days × 7 periods',
    text: 'Secondary school curriculum with standardized subject allocations, morning break, and lunch intervals. Fully scheduled with zero collisions in under a second.',
    featured: false,
  },
  {
    icon: GraduationCap,
    name: 'B.Tech CSE Enterprise Blueprint',
    institution: 'Engineering University Scale',
    spec: '9 sections · 8 courses with 3 continuous labs · 40 faculty · 14 rooms · 6 days × 7 periods',
    text: 'Large engineering college scale covering 342 teaching sessions, dedicated faculty pools per course, two period atomic laboratory practicals, and balanced daily loads.',
    featured: true,
  },
  {
    icon: Stethoscope,
    name: 'Medical College Clinical Phase',
    institution: 'MBBS Clinical Rotations',
    spec: '3 batches · 8 clinical courses · 16 doctors · 5 days × 6 periods',
    text: 'Clinical phase curriculum coordinating hospital ward rotations, histopathology sessions, and diagnostic laboratories without double booking practicing consultants.',
    featured: false,
  },
];

export const PresetsSection: React.FC = () => {
  return (
    <section id="presets" className="py-20 lg:py-28 bg-[#ffffff] dark:bg-[#111112] border-b border-[#e1e4e8] dark:border-[#2a2a2d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#5b616b] dark:text-[#a1a1a6] uppercase tracking-widest mb-3">
            <span>Prebuilt Blueprints</span>
            <span aria-hidden="true" className="text-[#d3d7dd] dark:text-[#36363a]">·</span>
            <span className="text-[#3b6fe0] dark:text-[#7aa2f7]">Instant Department Setup</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#121417] dark:text-[#ececec] leading-tight text-balance">
            Start from an accredited institutional structure, not an empty form.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed max-w-2xl text-pretty">
            Three production grade institutional blueprints ship directly inside the workstation. Applying a blueprint sets up sections, courses, faculty pools, and room allocations in one click.
          </p>
        </div>

        {/* Blueprint Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PRESETS.map((p) => (
            <div
              key={p.name}
              className={`rounded-md border p-6 sm:p-8 flex flex-col justify-between transition-colors ${
                p.featured
                  ? 'bg-[#121417] dark:bg-[#18181a] text-white border-[#121417] dark:border-[#2a2a2d]'
                  : 'bg-white dark:bg-[#18181a] text-[#121417] dark:text-[#ececec] border-[#e1e4e8] dark:border-[#2a2a2d] hover:border-[#3b6fe0]/40 dark:hover:border-[#7aa2f7]/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center ${
                    p.featured ? 'bg-white/10 text-[#7aa2f7]' : 'bg-[#e8effc] dark:bg-[#18233a] text-[#3b6fe0] dark:text-[#7aa2f7]'
                  }`}>
                    <p.icon className="w-5 h-5" />
                  </div>
                  {p.featured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#7aa2f7] uppercase px-2 py-0.5 rounded bg-white/10">
                      <Star className="w-3 h-3 fill-current" /> Most Popular
                    </span>
                  )}
                </div>

                <h3 className={`text-base font-semibold mb-1 ${p.featured ? 'text-white' : 'text-[#121417] dark:text-[#ececec]'}`}>
                  {p.name}
                </h3>
                <p className={`text-xs font-mono mb-3 ${
                  p.featured ? 'text-[#7aa2f7]' : 'text-[#3b6fe0] dark:text-[#7aa2f7]'
                }`}>
                  {p.institution}
                </p>

                <p className={`text-xs font-mono mb-4 p-2.5 rounded ${
                  p.featured ? 'bg-white/5 text-white/70' : 'bg-[#f6f7f8] dark:bg-[#111112] text-[#5b616b] dark:text-[#a1a1a6] border border-[#e1e4e8]/60 dark:border-[#2a2a2d]'
                }`}>
                  {p.spec}
                </p>

                <p className={`text-xs leading-relaxed text-pretty ${
                  p.featured ? 'text-white/80' : 'text-[#5b616b] dark:text-[#a1a1a6]'
                }`}>
                  {p.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Row */}
        <div className="rounded-md bg-[#f6f7f8] dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed max-w-2xl text-pretty">
            Presets live directly inside the workstation under Institutional Blueprints. Load any blueprint, inspect the generated parameters, and generate the schedule instantly.
          </p>
          <Link
            to="/dashboard"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white dark:text-[#111112] bg-[#121417] dark:bg-[#ececec] hover:bg-[#3b6fe0] dark:hover:bg-[#7aa2f7] active:scale-[0.98] rounded-md transition-all duration-150"
          >
            <span>Explore Blueprints</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
