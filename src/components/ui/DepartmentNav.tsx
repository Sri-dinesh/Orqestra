'use client';

import React, { useEffect } from 'react';
import { NavLink, Link, useParams } from 'react-router-dom';
import {
  Settings,
  BookOpen,
  Users,
  Building2,
  Sparkles,
  Calendar,
  UserCheck,
  Grid3X3,
  LayoutDashboard,
  ArrowLeft,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import {
  selectTimetableForDepartment,
  selectTimetablesForDepartment,
  useWorkspaceStore,
} from '@/state/stores/workspace-store';

export const DepartmentNav: React.FC = () => {
  const { departmentId } = useParams();
  const state = useWorkspaceStore();

  useEffect(() => {
    if (departmentId && state.activeDepartmentId !== departmentId) {
      state.setActiveDepartment(departmentId);
    }
  }, [departmentId, state.activeDepartmentId, state.setActiveDepartment]);

  const department = state.departments.find((d) => d.id === departmentId);

  if (!department || !departmentId) return null;

  const membership = state.membership;
  const isForeignDeptForHod =
    membership?.role === 'HOD' &&
    Boolean(membership.departmentId) &&
    membership.departmentId !== departmentId;
  const isFaculty = membership?.role === 'FACULTY';
  const isReadOnly = Boolean(isForeignDeptForHod || isFaculty);

  const sectionsCount = state.sections.filter((s) => s.departmentId === departmentId).length;
  const subjectsCount = state.subjects.filter((s) => s.departmentId === departmentId).length;
  const facultyCount = state.faculty.filter((f) => f.departmentId === departmentId).length;
  const roomsCount = state.rooms.filter((r) => r.departmentId === departmentId).length;
  const timetable = selectTimetableForDepartment(state, departmentId);
  const timetableCount = selectTimetablesForDepartment(state, departmentId).length;

  const setupSteps = [
    {
      to: `/departments/${departmentId}`,
      label: 'Overview',
      stepNum: 0,
      icon: LayoutDashboard,
      done: timetableCount > 0,
      count: timetableCount > 0 ? timetableCount : undefined,
    },
    {
      to: `/departments/${departmentId}/configuration`,
      label: 'Configuration',
      stepNum: 1,
      icon: Settings,
      done: sectionsCount > 0,
      count: sectionsCount > 0 ? `${sectionsCount}s` : undefined,
    },
    {
      to: `/departments/${departmentId}/subjects`,
      label: 'Subjects',
      stepNum: 2,
      icon: BookOpen,
      done: subjectsCount > 0,
      count: subjectsCount > 0 ? subjectsCount : undefined,
    },
    {
      to: `/departments/${departmentId}/faculty`,
      label: 'Faculty',
      stepNum: 3,
      icon: Users,
      done: facultyCount > 0,
      count: facultyCount > 0 ? facultyCount : undefined,
    },
    {
      to: `/departments/${departmentId}/rooms`,
      label: 'Rooms & Labs',
      stepNum: 4,
      icon: Building2,
      done: roomsCount > 0,
      count: roomsCount > 0 ? roomsCount : undefined,
    },
  ];

  const coreSetupDone = sectionsCount > 0 && subjectsCount > 0 && facultyCount > 0;
  const completedStepsCount = setupSteps.filter((s) => s.stepNum > 0 && s.done).length;

  const viewTabs = [
    {
      to: `/departments/${departmentId}/timetable`,
      label: 'Timetable',
      icon: Calendar,
      badge: timetable ? `v${timetable.revision}` : undefined,
    },
    {
      to: `/departments/${departmentId}/faculty-timetable`,
      label: 'Faculty View',
      icon: UserCheck,
    },
    {
      to: `/departments/${departmentId}/master-timetable`,
      label: 'Master Grid',
      icon: Grid3X3,
    },
  ];

  return (
    <div className="mb-6 space-y-2.5">
      {/* Tier 1: Department Breadcrumb, Identity & Setup Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5b616b] dark:text-[#8c9199] hover:text-[#121417] dark:hover:text-[#ececec] transition-colors shrink-0"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <span className="text-[#d1d5db] dark:text-[#3b3b40]">/</span>

          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-[#eef0f2] dark:bg-[#1f1f23] text-[#121417] dark:text-[#ececec] border border-[#e1e4e8] dark:border-[#2a2a2d] shrink-0">
            {department.code}
          </span>

          <span className="text-xs font-semibold text-[#121417] dark:text-[#ececec] truncate">
            {department.name}
          </span>
        </div>

        {/* Right side status indicators */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
              coreSetupDone
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#2f9e44] dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/60'
                : 'bg-amber-50 dark:bg-amber-950/40 text-[#b7791f] dark:text-amber-400 border-amber-200/70 dark:border-amber-800/60'
            }`}
          >
            {coreSetupDone ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-[#2f9e44] dark:text-emerald-400" />
                <span>Setup Complete</span>
              </>
            ) : (
              <span>{completedStepsCount}/4 Configured</span>
            )}
          </span>

          {isReadOnly && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-[#b7791f] dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/60">
              <Lock className="w-3 h-3" />
              <span>Read-Only View</span>
            </span>
          )}
        </div>
      </div>

      {/* Tier 2: Dedicated Horizontal Navigation Bar */}
      <div className="rounded-xl bg-white dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Step-by-Step Configuration Tabs */}
        {setupSteps.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.stepNum === 0}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#e8effc] dark:bg-[#18233a] text-[#3b6fe0] dark:text-[#7aa2f7] border border-blue-200/70 dark:border-blue-900/60 shadow-2xs'
                    : 'text-[#5b616b] dark:text-[#8c9199] hover:text-[#121417] dark:hover:text-[#ececec] hover:bg-[#f6f7f8] dark:hover:bg-[#232326]'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5 opacity-80" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-black/5 dark:bg-white/10 text-[#5b616b] dark:text-[#8c9199]">
                  {tab.count}
                </span>
              )}
              {tab.done && tab.stepNum > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#2f9e44] dark:bg-emerald-400 ml-0.5" />
              )}
            </NavLink>
          );
        })}

        {/* Separator before Actions */}
        {!isReadOnly && <span className="h-4 w-px bg-[#e1e4e8] dark:bg-[#2a2a2d] mx-1 shrink-0" />}

        {/* Action: Generate */}
        {!isReadOnly && (
          <NavLink
            to={`/departments/${departmentId}/generate`}
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#3b6fe0] text-white shadow-xs'
                  : 'text-[#3b6fe0] dark:text-[#7aa2f7] bg-[#e8effc] dark:bg-[#18233a] hover:bg-[#dbe7fa] dark:hover:bg-[#212f4d] border border-blue-200/60 dark:border-blue-900/60'
              }`
            }
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate</span>
          </NavLink>
        )}

        {/* Separator before Output Views */}
        <span className="h-4 w-px bg-[#e1e4e8] dark:bg-[#2a2a2d] mx-1 shrink-0" />

        {/* Output Timetable Views */}
        {viewTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#e8effc] dark:bg-[#18233a] text-[#3b6fe0] dark:text-[#7aa2f7] border border-blue-200/70 dark:border-blue-900/60 shadow-2xs'
                    : 'text-[#5b616b] dark:text-[#8c9199] hover:text-[#121417] dark:hover:text-[#ececec] hover:bg-[#f6f7f8] dark:hover:bg-[#232326]'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#2f9e44] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                  {tab.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
