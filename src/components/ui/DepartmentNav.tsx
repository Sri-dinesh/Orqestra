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
  Check,
} from 'lucide-react';
import { selectTimetableForDepartment, selectTimetablesForDepartment, useWorkspaceStore } from '@/state/stores/workspace-store';

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
    <div className="mb-6 rounded-lg bg-white border border-[#e1e4e8] shadow-none p-1.5 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1 overflow-x-auto py-0.5 px-1 scrollbar-none">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5b616b] hover:text-[#121417] hover:bg-[#eef0f2] rounded-md transition-all mr-1"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <span className="h-4 w-px bg-[#e1e4e8] mr-1 hidden sm:inline" />

        {/* Step-by-Step Setup Tabs */}
        {setupSteps.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.stepNum === 0}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#e8effc] text-[#3b6fe0] shadow-none'
                    : 'text-[#5b616b] hover:text-[#121417] hover:bg-[#eef0f2]'
                }`
              }
            >
              <div className="flex items-center justify-center">
                {tab.done ? (
                  <Check className="w-3.5 h-3.5 text-[#2f9e44] shrink-0" />
                ) : (
                  <Icon className="w-3.5 h-3.5 opacity-70" />
                )}
              </div>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-sm text-[10px] font-mono font-medium bg-[#eef0f2] text-[#5b616b]">
                  {tab.count}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Action: Generate */}
        {!isReadOnly && (
          <>
            <span className="h-4 w-px bg-[#e1e4e8] mx-0.5" />
            <NavLink
              to={`/departments/${departmentId}/generate`}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#3b6fe0] text-white shadow-none'
                    : 'text-[#3b6fe0] bg-[#e8effc] hover:bg-[#dbe7fa]'
                }`
              }
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate</span>
            </NavLink>
          </>
        )}

        {/* Output Views */}
        <span className="h-4 w-px bg-[#e1e4e8] mx-0.5" />
        {viewTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#e8effc] text-[#3b6fe0] shadow-none'
                    : 'text-[#5b616b] hover:text-[#121417] hover:bg-[#eef0f2]'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-sm text-[10px] font-mono font-semibold bg-emerald-50 text-[#2f9e44] border border-emerald-200/60">
                  {tab.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center gap-2 pr-3 text-xs text-[#5b616b]">
        {/* Progress indicator */}
        <span
          className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-medium ${
            coreSetupDone
              ? 'bg-emerald-50 text-[#2f9e44] border border-emerald-200/60'
              : 'bg-amber-50 text-[#b7791f] border border-amber-200/60'
          }`}
        >
          {coreSetupDone ? 'Setup Complete' : `${completedStepsCount}/4 Steps`}
        </span>

        {isReadOnly && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-[#b7791f] border border-amber-200/60">
            <Lock className="w-2.5 h-2.5" />
            <span>Read-Only View</span>
          </span>
        )}
        <span className="font-mono font-semibold text-[#121417]">{department.code}</span>
        <span>•</span>
        <span className="truncate max-w-[180px]">{department.name}</span>
      </div>
    </div>
  );
};
