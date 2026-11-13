import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Building2, GraduationCap, Stethoscope } from 'lucide-react';

const PRESETS = [
  {
    icon: Building2,
    name: 'Secondary School',
    institution: 'Standard K-12 Model',
    spec: '4 sections · 9 courses · 15 teachers · 5 days × 7 periods',
    text: 'Standard curriculum with common core subjects, fixed lunch intervals, and automated faculty distribution.',
    featured: false,
  },
  {
    icon: GraduationCap,
    name: 'B.Tech CSE Enterprise',
    institution: 'Engineering University',
    spec: '9 sections · 8 courses (3 labs) · 40 faculty · 14 rooms · 6 days × 7 periods',
    text: 'Large engineering structure covering 342 weekly sessions, faculty pools, two-period continuous labs, and balanced daily loads.',
    featured: true,
  },
  {
    icon: Stethoscope,
    name: 'Medical College Phase',
    institution: 'MBBS Clinical Rotations',
    spec: '3 batches · 8 clinical courses · 16 doctors · 5 days × 6 periods',
    text: 'Clinical rotation schedule coordinating hospital ward duties and laboratories without double-booking active physicians.',
    featured: false,
  },
];

export const PresetsSection: React.FC = () => {
  return (
    <section id="presets" className="py-14 lg:py-20 bg-white dark:bg-[#111112] border-b border-[#e1e4e8] dark:border-[#2a2a2d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <div className="text-[11px] font-mono font-medium text-[#3b6fe0] dark:text-[#7aa2f7] uppercase tracking-wider mb-2">
            Presets
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#121417] dark:text-[#ececec] leading-tight text-balance">
            Start from an institutional blueprint, not a blank form.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed text-pretty">
            Three blueprints ship directly inside the workstation. Applying one configures sections, courses, faculty pools, and rooms in one click.
          </p>
        </div>

        {/* Blueprint Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {PRESETS.map((p) => (
            <div
              key={p.name}
              className={`rounded-md border p-5 sm:p-6 flex flex-col justify-between transition-colors ${
                p.featured
                  ? 'bg-[#121417] dark:bg-[#18181a] text-white border-[#121417] dark:border-[#2a2a2d]'
                  : 'bg-white dark:bg-[#18181a] text-[#121417] dark:text-[#ececec] border-[#e1e4e8] dark:border-[#2a2a2d] hover:border-[#3b6fe0]/40 dark:hover:border-[#7aa2f7]/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                    p.featured ? 'bg-white/10 text-[#7aa2f7]' : 'bg-[#e8effc] dark:bg-[#18233a] text-[#3b6fe0] dark:text-[#7aa2f7]'
                  }`}>
                    <p.icon className="w-4 h-4" />
                  </div>
                  {p.featured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#7aa2f7] uppercase px-2 py-0.5 rounded bg-white/10">
                      <Star className="w-2.5 h-2.5 fill-current" /> Most Popular
                    </span>
                  )}
                </div>

                <h3 className={`text-base font-semibold mb-0.5 ${p.featured ? 'text-white' : 'text-[#121417] dark:text-[#ececec]'}`}>
                  {p.name}
                </h3>
                <p className={`text-xs font-mono mb-2.5 ${
                  p.featured ? 'text-[#7aa2f7]' : 'text-[#3b6fe0] dark:text-[#7aa2f7]'
                }`}>
                  {p.institution}
                </p>

                <p className={`text-[11px] font-mono mb-3 p-2 rounded ${
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
        <div className="rounded-md bg-[#f6f7f8] dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed max-w-2xl text-pretty">
            Blueprints are accessible inside the workstation. You can load any blueprint, customize rules, and generate in real time.
          </p>
          <Link
            to="/dashboard"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white dark:text-[#111112] bg-[#121417] dark:bg-[#ececec] hover:bg-[#3b6fe0] dark:hover:bg-[#7aa2f7] active:scale-[0.98] rounded-md transition-all duration-150"
          >
            <span>Explore Blueprints</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
