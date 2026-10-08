import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export const FeatureStorytelling: React.FC = () => {
  const [activeStory, setActiveStory] = useState(0);

  const stories = [
    {
      id: 'faculty',
      number: '01',
      title: 'Faculty constraints',
      subtitle: 'Availability, workloads, and pedagogical well-being.',
      description:
        'Set precise professor availability, research blockouts, preferred time bands, and maximum daily lecture caps. Cadence prevents teacher burnout while guaranteeing that every required syllabus credit is delivered.',
      metrics: [
        { label: 'Max Daily Teaching Cap', value: '4 Hours' },
        { label: 'Weekly Variance', value: '< 5%' },
        { label: 'Preference Satisfaction', value: '96.2%' },
      ],
      interactiveType: 'faculty-grid',
    },
    {
      id: 'rooms',
      number: '02',
      title: 'Rooms and laboratories',
      subtitle: 'Capacity matching, specialized hardware, and safety limits.',
      description:
        'Assign classrooms based on exact student cohort registrations, acoustic lecture-capture needs, and specialized laboratory rigs (FPGA boards, wet chemistry hoods, isolation subnets). Never squeeze 90 students into a 60-seat hall.',
      metrics: [
        { label: 'Capacity Utilization', value: '88.4%' },
        { label: 'Lab Instrument Idle Reduction', value: '62%' },
        { label: 'Overcrowding Incidents', value: '0' },
      ],
      interactiveType: 'room-matcher',
    },
    {
      id: 'conflict',
      number: '03',
      title: 'Conflict pre-flight resolution',
      subtitle: 'Mathematically prove zero collisions before publishing.',
      description:
        'Traditional timetable drafts suffer from dozens of silent collisions discovered only during the first week of classes. Cadence mathematically verifies every intersection of teacher, room, cohort, and period before publishing.',
      metrics: [
        { label: 'Pre-flight Verification', value: '100%' },
        { label: 'First-Week Revisions', value: '0' },
        { label: 'Audit History', value: 'Immutable' },
      ],
      interactiveType: 'collision-detector',
    },
    {
      id: 'workload',
      number: '04',
      title: 'Workload balancing',
      subtitle: 'Eliminate peak-day fatigue and erratic gaps.',
      description:
        'The optimization engine automatically balances course hours across the five-day academic week. Students avoid five consecutive lectures on Tuesday followed by an empty Friday; professors maintain predictable schedules.',
      metrics: [
        { label: 'Student Schedule Balance', value: 'Optimized' },
        { label: 'Gap Hours Reduced', value: '-74%' },
        { label: 'Gini Workload Coeff', value: '0.08' },
      ],
      interactiveType: 'histogram',
    },
    {
      id: 'multidept',
      number: '05',
      title: 'Multi-department coordination',
      subtitle: 'Shared foundation courses and central infrastructure.',
      description:
        'When Computer Science, Electrical Engineering, and Mathematics share foundational Linear Algebra professors or auditorium facilities, Cadence orchestrates cross-faculty constraints seamlessly without department clashes.',
      metrics: [
        { label: 'Cross-Faculty Conflicts', value: '0' },
        { label: 'Auditorium Sync', value: 'Automated' },
        { label: 'Elective Interlock', value: '4 Tracks' },
      ],
      interactiveType: 'multi-dept',
    },
  ];

  const current = stories[activeStory];

  return (
    <section className="gsap-section-reveal py-20 lg:py-28 bg-[#FAFBF9] border-y border-[#E5E8E0] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Operational Architecture</span>
            <span aria-hidden="true" className="text-black/30">·</span>
            <span className="text-[#0047FF]">Institutional Realities</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            Designed around how institutions actually operate.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            Generic scheduling algorithms treat courses as abstract boxes. Cadence is built around the complex,
            human, and physical constraints of higher education.
          </p>
        </div>

        {/* Story Selector Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-[#E5E8E0]">
          {stories.map((story, idx) => (
            <button
              key={story.id}
              onClick={() => setActiveStory(idx)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeStory === idx
                  ? 'bg-[#111315] text-white shadow-sm'
                  : 'bg-white text-[#4B5259] border border-[#E5E8E0] hover:text-[#111315] hover:border-black/30'
              }`}
            >
              <span className="font-mono opacity-60 text-[10px]">{story.number}</span>
              <span>{story.title}</span>
            </button>
          ))}
        </div>

        {/* Active Story Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Editorial Story Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="text-xs font-mono text-[#0047FF] font-semibold uppercase tracking-wider mb-2">
                Chapter {current.number}
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#111315] tracking-tight mb-2">
                {current.title}
              </h3>
              <p className="text-sm font-medium text-[#4B5259] mb-4">
                {current.subtitle}
              </p>
              <p className="text-sm text-[#4B5259] leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Quantified Metrics Band */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#E5E8E0]">
              {current.metrics.map((m) => (
                <div key={m.label} className="p-3 rounded-xl bg-white border border-[#E5E8E0]">
                  <div className="font-display text-lg font-bold text-[#111315] tabular">
                    {m.value}
                  </div>
                  <div className="text-[10px] font-medium text-[#71767B] mt-0.5 leading-tight">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Bespoke Visual Representation */}
          <div className="lg:col-span-7 rounded-2xl bg-white border border-[#E5E8E0] p-6 sm:p-8 shadow-sm min-h-[380px] flex flex-col justify-center">
            {activeStory === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#71767B] border-b pb-2">
                  <span>FACULTY AVAILABILITY MATRIX</span>
                  <span>DR. MARCUS CHEN (CSE)</span>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI'].map((d, i) => (
                    <div key={d} className="p-3 rounded-lg border border-[#E5E8E0] bg-[#FAFBF9]">
                      <div className="font-bold text-[#111315] mb-2">{d}</div>
                      <div className="space-y-1 text-[10px]">
                        <div className="p-1 rounded bg-emerald-50 text-emerald-700">08:30 Avail</div>
                        <div className="p-1 rounded bg-emerald-50 text-emerald-700">10:45 Avail</div>
                        <div
                          className={`p-1 rounded ${
                            i === 3
                              ? 'bg-rose-50 text-rose-700 font-semibold'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {i === 3 ? 'Blocked (Research)' : '13:30 Avail'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-[#FAFBF9] border border-[#E5E8E0] text-[11px] text-[#4B5259] flex items-center justify-between">
                  <span>Weekly Load Cap: 12 hrs</span>
                  <span className="font-mono text-emerald-700 font-semibold">100% Policy Compliant</span>
                </div>
              </div>
            )}

            {activeStory === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#71767B] border-b pb-2">
                  <span>FACILITY MATCHING ALGORITHM</span>
                  <span>ENROLLED: 78 STUDENTS</span>
                </div>
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-rose-900">Knuth Room 12 (Capacity: 30)</div>
                      <div className="text-[10px] text-rose-700 font-sans">
                        Capacity mismatch: Deficit of 48 seats
                      </div>
                    </div>
                    <span className="text-rose-700 font-bold">PRUNED</span>
                  </div>
                  <div className="p-3 rounded-xl border border-[#E5E8E0] bg-[#FAFBF9] flex items-center justify-between opacity-60">
                    <div>
                      <div className="font-bold text-[#111315]">Circuits Lab 01 (Capacity: 35)</div>
                      <div className="text-[10px] text-[#71767B] font-sans">
                        Missing high-bandwidth projector
                      </div>
                    </div>
                    <span className="text-[#71767B]">REJECTED</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center justify-between shadow-xs">
                    <div>
                      <div className="font-bold text-emerald-950">Shannon Amphitheater 204 (Capacity: 80)</div>
                      <div className="text-[10px] text-emerald-800 font-sans">
                        Ideal fit: 78 enrolled + 2 seats margin + dual lecture capture
                      </div>
                    </div>
                    <span className="text-emerald-700 font-bold">ALLOCATED</span>
                  </div>
                </div>
              </div>
            )}

            {activeStory === 2 && (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-left">
                  <div className="flex items-center gap-2 font-bold text-xs font-mono text-emerald-800 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>PRE-FLIGHT MATHEMATICAL PROOF PASSED</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed font-sans">
                    Every section, faculty member, and facility pair evaluated under binary integer linear
                    programming. Graph coloring theorem guarantees non-interference.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-left font-mono text-xs">
                  <div className="p-3 rounded-lg border bg-[#FAFBF9]">
                    <div className="text-[10px] text-[#71767B]">FACULTY OVERLAPS</div>
                    <div className="font-bold text-emerald-700 text-sm mt-0.5">0 Detected</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-[#FAFBF9]">
                    <div className="text-[10px] text-[#71767B]">ROOM COLLISIONS</div>
                    <div className="font-bold text-emerald-700 text-sm mt-0.5">0 Detected</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-[#FAFBF9]">
                    <div className="text-[10px] text-[#71767B]">COURSE PLACEMENT</div>
                    <div className="font-bold text-emerald-700 text-sm mt-0.5">100.0% Complete</div>
                  </div>
                </div>
              </div>
            )}

            {activeStory === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#71767B] border-b pb-2">
                  <span>DAILY LOAD DISTRIBUTION HISTOGRAM</span>
                  <span>WEEKLY EQUILIBRIUM</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  {[
                    { day: 'MON', hours: 3.5, label: 'Optimal' },
                    { day: 'TUE', hours: 4.0, label: 'Balanced' },
                    { day: 'WED', hours: 3.0, label: 'Optimal' },
                    { day: 'THU', hours: 3.5, label: 'Optimal' },
                    { day: 'FRI', hours: 2.0, label: 'Research Afternoon' },
                  ].map((row) => (
                    <div key={row.day} className="flex items-center gap-3">
                      <span className="w-10 text-[#4B5259] font-bold">{row.day}</span>
                      <div className="flex-1 bg-[#F1F3ED] h-6 rounded-md overflow-hidden relative">
                        <div
                          className="bg-[#0047FF] h-full rounded-md flex items-center justify-end pr-2 text-white text-[10px] font-bold"
                          style={{ width: `${(row.hours / 5) * 100}%` }}
                        >
                          {row.hours}h
                        </div>
                      </div>
                      <span className="text-[10px] text-[#71767B] w-28 text-right font-sans">
                        {row.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeStory === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#71767B] border-b pb-2">
                  <span>CROSS-STREAM CONVERGENCE</span>
                  <span>SHARED MATHEMATICS AUDITORIUM</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-mono">
                  <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                    <div className="font-bold text-[#111315]">CSE Cohort</div>
                    <div className="text-[10px] text-blue-700 mt-1">60 Students</div>
                  </div>
                  <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50">
                    <div className="font-bold text-[#111315]">ECE Cohort</div>
                    <div className="text-[10px] text-purple-700 mt-1">45 Students</div>
                  </div>
                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                    <div className="font-bold text-[#111315]">MECH Cohort</div>
                    <div className="text-[10px] text-amber-700 mt-1">50 Students</div>
                  </div>
                </div>
                <div className="text-center font-mono text-xs text-[#71767B]">↓ Synchronized Convergence ↓</div>
                <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 font-mono text-xs text-center">
                  <div className="font-bold">Grand Auditorium A (Capacity: 220)</div>
                  <div className="text-[11px] text-emerald-800 font-sans mt-0.5">
                    MA-201 Linear Algebra Foundation · Prof. Sarah Al-Mansoor · MON 10:45
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
