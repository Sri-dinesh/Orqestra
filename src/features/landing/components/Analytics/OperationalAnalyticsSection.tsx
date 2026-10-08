import React from 'react';

export const OperationalAnalyticsSection: React.FC = () => {
  const hourlyOccupancy = [
    { hour: '08:00', percent: 72 },
    { hour: '09:00', percent: 89 },
    { hour: '10:00', percent: 94 },
    { hour: '11:00', percent: 91 },
    { hour: '12:00', percent: 45 }, // lunch break drop
    { hour: '13:00', percent: 84 },
    { hour: '14:00', percent: 88 },
    { hour: '15:00', percent: 82 },
    { hour: '16:00', percent: 64 },
  ];

  return (
    <section id="analytics" className="gsap-section-reveal py-20 lg:py-28 bg-[#111315] text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-blue-400 uppercase tracking-widest mb-3">
            <span>Operational Intelligence</span>
            <span aria-hidden="true" className="text-white/30">·</span>
            <span>Auditable Analytics</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight text-balance">
            Real institutional analytics. Not generic metrics.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl text-balance">
            Track actual space efficiency, equipment utilization rates, and faculty equity indices
            derived directly from your verified timetable schedules.
          </p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Card 1: Hourly Campus Space Occupancy Profile */}
          <div className="lg:col-span-7 rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  Hourly Space Utilization Profile
                </h3>
                <p className="text-xs text-white/50 font-sans mt-0.5">
                  Campus-wide lecture hall and laboratory occupancy throughout standard academic days.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                AVG: 84.6%
              </span>
            </div>

            {/* Histogram bars */}
            <div className="space-y-3 font-mono text-xs">
              {hourlyOccupancy.map((slot) => (
                <div key={slot.hour} className="flex items-center gap-3">
                  <span className="w-12 text-white/60">{slot.hour}</span>
                  <div className="flex-1 bg-white/5 h-6 rounded-md overflow-hidden relative">
                    <div
                      className={`analytics-bar-fill h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-bold ${
                        slot.percent < 50
                          ? 'bg-amber-500/70 text-white'
                          : 'bg-[#0047FF] text-white'
                      }`}
                      data-width={`${slot.percent}%`}
                      style={{ width: `${slot.percent}%` }}
                    >
                      {slot.percent}%
                    </div>
                  </div>
                  <span className="text-[10px] text-white/40 w-20 text-right font-sans">
                    {slot.percent < 50 ? 'Lunch Sync' : 'Optimal'}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-white/50 font-sans">
              <span>Eliminated 8 AM dead slots and 4 PM clustering</span>
              <span className="font-mono text-emerald-400">+28% Real Estate Efficiency</span>
            </div>
          </div>

          {/* Card 2: Faculty Workload & Specialized Rigs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8">
              <h3 className="font-display text-lg font-bold text-white mb-2">
                Faculty Teaching Equity Index
              </h3>
              <p className="text-xs text-white/60 leading-relaxed mb-6 font-sans">
                Gini coefficient of workload distribution across departments. Ensures junior and senior
                professors carry balanced contact credit hours.
              </p>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-white/60">Workload Gini Coefficient:</span>
                  <span className="text-emerald-400 font-bold tabular">0.08 (Near Perfect Balance)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Excess Teaching Outliers:</span>
                  <span className="text-white font-bold tabular">0 Faculty &gt; 18h/wk</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Protected Research Windows:</span>
                  <span className="text-blue-400 font-bold tabular">100% Granted</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8">
              <h3 className="font-display text-lg font-bold text-white mb-2">
                Specialized Lab Idle Reduction
              </h3>
              <p className="text-xs text-white/60 leading-relaxed mb-4 font-sans">
                Expensive hardware synthesis and cleanroom facilities scheduled with back-to-back cohort batching.
              </p>
              <div className="font-display text-3xl font-bold text-emerald-400 tabular">
                -62%
              </div>
              <div className="text-xs text-white/50 mt-1 font-sans">
                Unscheduled idle hours for high-cost experimental laboratories
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
