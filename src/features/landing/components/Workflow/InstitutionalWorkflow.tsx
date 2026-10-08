import React, { useState } from 'react';
import { Shield, Users, BookOpen, GraduationCap, CheckCircle2 } from 'lucide-react';

export const InstitutionalWorkflow: React.FC = () => {
  const [activeRole, setActiveRole] = useState(0);

  const roles = [
    {
      id: 'admin',
      role: 'Academic Registrar',
      icon: Shield,
      responsibility: 'Constitutional Invariants & Policy',
      action: 'Configures academic calendar windows, campus lunch intermissions, building travel buffers, and hard constraint rules.',
      output: 'Enforced Institutional Rulebook',
    },
    {
      id: 'chair',
      role: 'Department Head',
      icon: Users,
      responsibility: 'Course Allocations & Cohorts',
      action: 'Assigns faculty to curriculum modules, defines laboratory section splits, and sets elective prerequisites.',
      output: 'Curriculum Credit Matrix',
    },
    {
      id: 'faculty',
      role: 'Teaching Faculty',
      icon: BookOpen,
      responsibility: 'Availability & Preferences',
      action: 'Submits research blockouts, preferred morning or afternoon lecturing slots, and office hour windows.',
      output: 'Verified Availability Vectors',
    },
    {
      id: 'student',
      role: 'Student & Registrant',
      icon: GraduationCap,
      responsibility: 'Conflict-Free Enrollment',
      action: 'Receives synchronized ICS calendar feeds, Canvas LMS timetable integration, and personalized room navigation.',
      output: '100% Conflict-Free Semester',
    },
  ];

  return (
    <section className="gsap-section-reveal py-20 lg:py-28 bg-[#F7F8F5] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#4B5259] uppercase tracking-widest mb-3">
            <span>Governance Architecture</span>
            <span aria-hidden="true" className="text-black/30">·</span>
            <span className="text-[#0047FF]">Multi-Role Orchestration</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111315] leading-tight text-balance">
            Coordinated across every institutional tier.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4B5259] leading-relaxed max-w-2xl text-balance">
            Scheduling touches everyone from the university provost to undergraduate freshmen.
            Cadence unites institutional stakeholders in a unified role-governed pipeline.
          </p>
        </div>

        {/* 4-Step Linear Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {roles.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = activeRole === idx;
            return (
              <button
                key={item.id}
                onClick={() => setActiveRole(idx)}
                className={`p-5 rounded-2xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-[#111315] text-white border-[#111315] shadow-md'
                    : 'bg-white text-[#30363D] border-[#E5E8E0] hover:border-black/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-[#FAFBF9] text-[#111315]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs opacity-50">0{idx + 1}</span>
                </div>
                <div className="font-display font-bold text-sm mb-1">{item.role}</div>
                <div className={`text-[11px] leading-tight ${isSelected ? 'text-white/70' : 'text-[#71767B]'}`}>
                  {item.responsibility}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Role Inspector Card */}
        <div className="rounded-2xl bg-white border border-[#E5E8E0] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4">
            <div>
              <span className="text-xs font-mono text-[#0047FF] font-semibold uppercase">
                ACTIVE WORKFLOW PHASE 0{activeRole + 1}
              </span>
              <h3 className="font-display text-xl font-bold text-[#111315] mt-0.5">
                {roles[activeRole].role}: {roles[activeRole].responsibility}
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>OUTPUT: {roles[activeRole].output}</span>
            </div>
          </div>
          <p className="text-sm text-[#4B5259] leading-relaxed">
            {roles[activeRole].action}
          </p>
        </div>
      </div>
    </section>
  );
};
