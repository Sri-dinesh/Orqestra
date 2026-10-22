import React from 'react';
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
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';

export const DepartmentNav: React.FC = () => {
  const { departmentId } = useParams();
  const state = useWorkspaceStore();
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
  const timetable = state.timetables.find((t) => t.departmentId === departmentId);

  const tabs = [
    {
      to: `/departments/${departmentId}/configuration`,
      label: 'Configuration',
      icon: Settings,
      count: sectionsCount > 0 ? `${sectionsCount} Secs` : undefined,
    },
    {
      to: `/departments/${departmentId}/subjects`,
      label: 'Subjects',
      icon: BookOpen,
      count: subjectsCount > 0 ? subjectsCount : undefined,
    },
    {
      to: `/departments/${departmentId}/faculty`,
      label: 'Faculty',
      icon: Users,
      count: facultyCount > 0 ? facultyCount : undefined,
    },
    {
      to: `/departments/${departmentId}/rooms`,
      label: 'Rooms & Labs',
      icon: Building2,
      count: roomsCount > 0 ? roomsCount : undefined,
    },
    ...(!isReadOnly
      ? [
          {
            to: `/departments/${departmentId}/generate`,
            label: 'Generate',
            icon: Sparkles,
            highlight: true,
          },
        ]
      : []),
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
    <div className="mb-6 rounded-2xl bg-white border border-[#E5E8E0] shadow-xs p-1.5 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1 overflow-x-auto py-0.5 px-1 scrollbar-none">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#71767B] hover:text-[#111315] hover:bg-black/5 rounded-xl transition-all mr-1"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <span className="h-4 w-px bg-[#E5E8E0] mr-1 hidden sm:inline" />

        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#111315] text-white shadow-xs'
                    : tab.highlight
                    ? 'text-[#0047FF] bg-[#EBF1FF]/60 hover:bg-[#EBF1FF]'
                    : 'text-[#4B5259] hover:text-[#111315] hover:bg-black/5'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-black/10 dark:bg-white/20">
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700">
                  {tab.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center gap-2 pr-3 text-xs text-[#71767B]">
        {isReadOnly && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-500/20">
            <Lock className="w-2.5 h-2.5" />
            <span>Read-Only View</span>
          </span>
        )}
        <span className="font-bold text-[#111315]">{department.code}</span>
        <span>•</span>
        <span className="truncate max-w-[200px]">{department.name}</span>
      </div>
    </div>
  );
};
