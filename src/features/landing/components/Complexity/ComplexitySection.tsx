import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export const ComplexitySection: React.FC = () => {
  const [facultyCount, setFacultyCount] = useState(180);
  const [roomCount, setRoomCount] = useState(95);
  const [courseCount, setCourseCount] = useState(380);

  // Combinatorial explosion calculation
  // Total potential combinations (Slots x Rooms)^Courses
  // Expressed as scientific notation exponent
  const totalSlots = 30; // 5 days x 6 periods
  const exponent = Math.round(
    courseCount * Math.log10(Math.max(1, roomCount * totalSlots))
  );

  return (
    <section className="gsap-section-reveal py-20 lg:py-28 bg-[#111315] text-white relative overflow-hidden">
      {/* Subtle architectural dark grid */}
      <div className="absolute inset-0 bg-grid-pattern-dark opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-blue-400 uppercase tracking-widest mb-3">
            <span>Combinatorial Reality</span>
            <span aria-hidden="true" className="text-white/30">·</span>
            <span>Mathematical Complexity</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight text-balance">
            Scheduling becomes complex remarkably fast.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl text-balance">
            Every semester, a typical institution attempts to coordinate thousands of interdependent variables.
            One small shift in faculty availability triggers an avalanche of downstream collisions.
          </p>
        </div>

        {/* Visual Equation Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm mb-12">
          <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-6">
            The Institutional Equation
          </div>
          <div id="complexity-equation" className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="pt-4 md:pt-0">
              <div className="font-display text-2xl sm:text-3xl font-bold text-white tabular">14</div>
              <div className="text-xs text-white/60 mt-1 uppercase font-mono">Departments</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="font-display text-2xl sm:text-3xl font-bold text-white tabular">180</div>
              <div className="text-xs text-white/60 mt-1 uppercase font-mono">Faculty Members</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="font-display text-2xl sm:text-3xl font-bold text-white tabular">320</div>
              <div className="text-xs text-white/60 mt-1 uppercase font-mono">Classrooms & Labs</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="font-display text-2xl sm:text-3xl font-bold text-white tabular">2,400</div>
              <div className="text-xs text-white/60 mt-1 uppercase font-mono">Class Sections</div>
            </div>
            <div className="pt-4 md:pt-0 col-span-2 md:col-span-1">
              <div className="font-display text-2xl sm:text-3xl font-bold text-emerald-400 tabular">1</div>
              <div className="text-xs text-emerald-400/80 mt-1 uppercase font-mono">Coordinated Timetable</div>
            </div>
          </div>
        </div>

        {/* Interactive Constraint Interdependency Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interconnected Dependency Flow */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="text-xs font-mono text-white/50 uppercase tracking-wider mb-4">
                Constraint Chain Reaction Flow
              </div>

              {/* Chain Steps */}
              <div className="space-y-3 font-mono text-xs">
                {[
                  {
                    step: '01',
                    label: 'Faculty Availability',
                    detail: 'Dr. Thorne blocked Monday mornings for Dean meetings',
                    status: 'Constrained',
                  },
                  {
                    step: '02',
                    label: 'Room Facility & Capacity',
                    detail: 'CS-408 needs 80-seat room with dual projection and lab sync',
                    status: 'Matched',
                  },
                  {
                    step: '03',
                    label: 'Cohort Collision Avoidance',
                    detail: 'Sem III students cannot take Algorithms and Systems simultaneously',
                    status: 'Enforced',
                  },
                  {
                    step: '04',
                    label: 'Hardware & Lab Rotation',
                    detail: 'FPGA hardware in Lab 01 requires 2-hour uninterrupted blocks',
                    status: 'Synchronized',
                  },
                  {
                    step: '05',
                    label: 'Workload & Rest Intervals',
                    detail: 'Faculty capped at 4 hours daily with 45min mandatory break',
                    status: 'Balanced',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5 gap-2 hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-white/10 text-white/80 flex items-center justify-center text-[10px] font-bold">
                        {item.step}
                      </span>
                      <div>
                        <span className="text-white font-medium">{item.label}</span>
                        <p className="text-[11px] text-white/50 font-sans mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-blue-400 self-start sm:self-center font-mono">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Real-time Permutation Calculator */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-white/50 uppercase tracking-wider">
                State Space Calculator
              </span>
              <span className="text-xs font-mono text-amber-400">NP-Hard Problem</span>
            </div>

            <p className="text-xs text-white/70 leading-relaxed mb-6 font-sans">
              Adjust institution parameters below to see the combinatorial explosion that breaks traditional spreadsheets.
            </p>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-white/80">Faculty Members</span>
                  <span className="text-white font-bold tabular">{facultyCount}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="500"
                  value={facultyCount}
                  onChange={(e) => setFacultyCount(Number(e.target.value))}
                  className="w-full accent-[#0047FF] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-white/80">Available Rooms & Labs</span>
                  <span className="text-white font-bold tabular">{roomCount}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="250"
                  value={roomCount}
                  onChange={(e) => setRoomCount(Number(e.target.value))}
                  className="w-full accent-[#0047FF] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-white/80">Course Sections</span>
                  <span className="text-white font-bold tabular">{courseCount}</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="800"
                  value={courseCount}
                  onChange={(e) => setCourseCount(Number(e.target.value))}
                  className="w-full accent-[#0047FF] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Calculated Output Display */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-[11px] font-mono text-white/40 uppercase">
                Theoretical Permutation Space
              </div>
              <div className="font-display text-3xl font-bold text-white mt-1 tabular flex items-baseline gap-2">
                <span>10^{exponent}</span>
                <span className="text-xs font-sans font-normal text-white/50">potential slot assignments</span>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2 font-sans">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>
                  Over 99.98% of random assignments violate at least one hard institutional constraint.
                  Cadence cuts through this space in under 30 seconds.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
