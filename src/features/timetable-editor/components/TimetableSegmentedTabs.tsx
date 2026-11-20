'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, UserCheck, Grid3X3 } from 'lucide-react';

export type TimetableViewType = 'section' | 'faculty' | 'master';

interface TimetableSegmentedTabsProps {
  departmentId: string;
  activeView: TimetableViewType;
}

export const TimetableSegmentedTabs: React.FC<TimetableSegmentedTabsProps> = ({
  departmentId,
  activeView,
}) => {
  const tabs = [
    {
      id: 'section' as const,
      label: 'Section View',
      to: `/departments/${departmentId}/timetable`,
      icon: Calendar,
      title: 'View and edit section schedules',
    },
    {
      id: 'faculty' as const,
      label: 'Faculty View',
      to: `/departments/${departmentId}/faculty-timetable`,
      icon: UserCheck,
      title: 'View individual faculty schedules and meeting finder',
    },
    {
      id: 'master' as const,
      label: 'Master Grid',
      to: `/departments/${departmentId}/master-timetable`,
      icon: Grid3X3,
      title: 'View institutional master matrix across all sections',
    },
  ];

  return (
    <nav
      aria-label="Timetable perspectives"
      className="inline-flex items-center gap-1 rounded-lg bg-[#eef0f2] dark:bg-[#111112] p-1 border border-[#e1e4e8] dark:border-[#2a2a2d] shrink-0"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;
        return (
          <Link
            key={tab.id}
            to={tab.to}
            title={tab.title}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
              isActive
                ? 'bg-white dark:bg-[#18181a] text-[#3b6fe0] dark:text-[#7aa2f7] shadow-xs'
                : 'text-[#5b616b] dark:text-[#8c9199] hover:text-[#121417] dark:hover:text-[#ececec] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
};
