'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  X,
  TrendingUp,
  Percent,
} from 'lucide-react';
import type { Department, Faculty, Section, Subject, Timetable } from '@/domain/models';

export interface FacultyWorkloadInsight {
  facultyId: string;
  name: string;
  facultyCode: string;
  scheduledPeriods: number;
  maxWeeklyPeriods: number | null;
  utilizationPercent: number | null;
  dailyDistribution: number[];
  status: 'OPTIMAL' | 'OVERLOAD' | 'UNDERLOAD' | 'UNASSIGNED';
  subjectNames: string[];
}

export interface DayDistributionInsight {
  dayIndex: number;
  dayName: string;
  totalPeriods: number;
  theoryPeriods: number;
  labPeriods: number;
}

export interface SubjectCoverageInsight {
  subjectId: string;
  code: string;
  name: string;
  type: 'THEORY' | 'LAB';
  scheduledPeriods: number;
  sessionsCount: number;
}

export interface ScheduleInsightsData {
  totalScheduledPeriods: number;
  totalTheoryPeriods: number;
  totalLabPeriods: number;
  activeFacultyCount: number;
  totalCapacityPeriods: number;
  occupancyPercent: number;
  conflictsCount: number;
  busiestDay: DayDistributionInsight | null;
  facultyWorkloads: FacultyWorkloadInsight[];
  dailyDistributions: DayDistributionInsight[];
  subjectCoverages: SubjectCoverageInsight[];
}

/**
 * Pure analytical calculation of timetable workload and equity metrics.
 */
export function computeScheduleInsights(
  timetable: Timetable | null | undefined,
  department: Department,
  subjects: Subject[],
  faculty: Faculty[],
  sections: Section[],
  targetSectionId?: string | null,
): ScheduleInsightsData {
  const workingDays = department.workingDays ?? [];
  const dayCount = workingDays.length;
  const periodsPerDay = department.periodsPerDay ?? 0;

  // Filter entries if targetSectionId is specified, otherwise all entries
  const relevantEntries = timetable?.entries
    ? targetSectionId
      ? timetable.entries.filter((e) => e.sectionId === targetSectionId)
      : timetable.entries
    : [];

  const subjectById = new Map(subjects.map((s) => [s.id, s]));

  let totalScheduledPeriods = 0;
  let totalTheoryPeriods = 0;
  let totalLabPeriods = 0;

  // Per-faculty metrics
  const facultyPeriods = new Map<string, number>();
  const facultyDays = new Map<string, number[]>();
  const facultySubjectNames = new Map<string, Set<string>>();

  // Per-day metrics
  const dayTotals = new Array(dayCount).fill(0);
  const dayTheoryTotals = new Array(dayCount).fill(0);
  const dayLabTotals = new Array(dayCount).fill(0);

  // Per-subject metrics
  const subjectPeriodTotals = new Map<string, number>();
  const subjectSessionTotals = new Map<string, number>();

  for (const entry of relevantEntries) {
    const duration = entry.durationPeriods || 1;
    totalScheduledPeriods += duration;

    const sub = subjectById.get(entry.subjectId);
    const isLab = sub?.type === 'LAB';
    if (isLab) {
      totalLabPeriods += duration;
    } else {
      totalTheoryPeriods += duration;
    }

    // Day load
    if (entry.dayIndex >= 0 && entry.dayIndex < dayCount) {
      dayTotals[entry.dayIndex] += duration;
      if (isLab) {
        dayLabTotals[entry.dayIndex] += duration;
      } else {
        dayTheoryTotals[entry.dayIndex] += duration;
      }
    }

    // Faculty load
    if (entry.facultyId) {
      const current = facultyPeriods.get(entry.facultyId) ?? 0;
      facultyPeriods.set(entry.facultyId, current + duration);

      if (!facultyDays.has(entry.facultyId)) {
        facultyDays.set(entry.facultyId, new Array(dayCount).fill(0));
      }
      const fDayArr = facultyDays.get(entry.facultyId)!;
      if (entry.dayIndex >= 0 && entry.dayIndex < dayCount) {
        fDayArr[entry.dayIndex] += duration;
      }

      if (sub) {
        if (!facultySubjectNames.has(entry.facultyId)) {
          facultySubjectNames.set(entry.facultyId, new Set());
        }
        facultySubjectNames.get(entry.facultyId)!.add(sub.code);
      }
    }

    // Subject metrics
    const currentSubPeriods = subjectPeriodTotals.get(entry.subjectId) ?? 0;
    subjectPeriodTotals.set(entry.subjectId, currentSubPeriods + duration);
    const currentSubSessions = subjectSessionTotals.get(entry.subjectId) ?? 0;
    subjectSessionTotals.set(entry.subjectId, currentSubSessions + 1);
  }

  // Calculate capacity
  const sectionCount = targetSectionId ? 1 : Math.max(1, sections.length);
  const totalCapacityPeriods = dayCount * periodsPerDay * sectionCount;
  const occupancyPercent =
    totalCapacityPeriods > 0 ? Math.min(100, Math.round((totalScheduledPeriods / totalCapacityPeriods) * 100)) : 0;

  // Build faculty workload list
  const activeFacultyList = faculty.filter((f) => f.active);
  const facultyWorkloads: FacultyWorkloadInsight[] = activeFacultyList.map((f) => {
    const scheduled = facultyPeriods.get(f.id) ?? 0;
    const maxWeekly = f.maxPeriodsPerWeek ?? null;
    const util = maxWeekly && maxWeekly > 0 ? Math.round((scheduled / maxWeekly) * 100) : null;
    const daysArr = facultyDays.get(f.id) ?? new Array(dayCount).fill(0);
    const subList = Array.from(facultySubjectNames.get(f.id) ?? []);

    let status: FacultyWorkloadInsight['status'] = 'OPTIMAL';
    if (scheduled === 0) {
      status = 'UNASSIGNED';
    } else if (maxWeekly && scheduled > maxWeekly) {
      status = 'OVERLOAD';
    } else if (maxWeekly && util !== null && util < 40) {
      status = 'UNDERLOAD';
    }

    return {
      facultyId: f.id,
      name: f.name,
      facultyCode: f.facultyCode || f.name.slice(0, 3).toUpperCase(),
      scheduledPeriods: scheduled,
      maxWeeklyPeriods: maxWeekly,
      utilizationPercent: util,
      dailyDistribution: daysArr,
      status,
      subjectNames: subList,
    };
  });

  // Sort faculty workloads: overloaded first, then by scheduled periods descending
  facultyWorkloads.sort((a, b) => {
    if (a.status === 'OVERLOAD' && b.status !== 'OVERLOAD') return -1;
    if (b.status === 'OVERLOAD' && a.status !== 'OVERLOAD') return 1;
    return b.scheduledPeriods - a.scheduledPeriods;
  });

  // Daily distribution insights
  const dailyDistributions: DayDistributionInsight[] = workingDays.map((dayName, idx) => ({
    dayIndex: idx,
    dayName,
    totalPeriods: dayTotals[idx] ?? 0,
    theoryPeriods: dayTheoryTotals[idx] ?? 0,
    labPeriods: dayLabTotals[idx] ?? 0,
  }));

  const busiestDay =
    dailyDistributions.length > 0
      ? dailyDistributions.reduce((prev, curr) => (curr.totalPeriods > prev.totalPeriods ? curr : prev))
      : null;

  // Subject coverages
  const subjectCoverages: SubjectCoverageInsight[] = subjects
    .filter((s) => s.active)
    .map((s) => ({
      subjectId: s.id,
      code: s.code,
      name: s.name,
      type: s.type,
      scheduledPeriods: subjectPeriodTotals.get(s.id) ?? 0,
      sessionsCount: subjectSessionTotals.get(s.id) ?? 0,
    }))
    .sort((a, b) => b.scheduledPeriods - a.scheduledPeriods);

  const activeFacultyCount = facultyWorkloads.filter((f) => f.scheduledPeriods > 0).length;
  const conflictsCount = timetable?.validationSummary?.conflicts.length ?? 0;

  return {
    totalScheduledPeriods,
    totalTheoryPeriods,
    totalLabPeriods,
    activeFacultyCount,
    totalCapacityPeriods,
    occupancyPercent,
    conflictsCount,
    busiestDay,
    facultyWorkloads,
    dailyDistributions,
    subjectCoverages,
  };
}

export interface ScheduleInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: Timetable | null | undefined;
  department: Department;
  subjects: Subject[];
  faculty: Faculty[];
  sections: Section[];
  activeSectionId?: string | null;
}

export const ScheduleInsightsModal: React.FC<ScheduleInsightsModalProps> = ({
  isOpen,
  onClose,
  timetable,
  department,
  subjects,
  faculty,
  sections,
  activeSectionId,
}) => {
  const [activeTab, setActiveTab] = useState<'WORKLOAD' | 'DAYS' | 'SUBJECTS'>('WORKLOAD');

  const activeSection = sections.find((s) => s.id === activeSectionId);

  const insights = useMemo(
    () => computeScheduleInsights(timetable, department, subjects, faculty, sections, activeSectionId),
    [timetable, department, subjects, faculty, sections, activeSectionId],
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Schedule Analytics and Workload Insights"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#18181a] rounded-xl shadow-2xl border border-[#e1e4e8] dark:border-[#2a2a2d] overflow-hidden flex flex-col max-h-[88vh] transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#e8effc] dark:bg-[#18233a] text-[#3b6fe0] dark:text-[#7aa2f7]">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#121417] dark:text-[#ececec]">
                Schedule Analytics &amp; Insights
              </h2>
              <p className="text-xs text-[#5b616b] dark:text-[#8c9199]">
                {department.code} — {department.name}{' '}
                {activeSection ? `(${activeSection.name})` : '(All Sections)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#5b616b] dark:text-[#8c9199] hover:text-[#121417] dark:hover:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326] cursor-pointer"
            title="Close insights"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Stat Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 border-b border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a]">
          <div className="rounded-lg p-3 bg-[#f6f7f8] dark:bg-[#111112] border border-[#e1e4e8] dark:border-[#2a2a2d]">
            <p className="text-xl font-bold tracking-tight text-[#121417] dark:text-[#ececec]">
              {insights.totalScheduledPeriods}
            </p>
            <p className="text-[11px] text-[#5b616b] dark:text-[#8c9199] flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-[#3b6fe0] dark:text-[#7aa2f7]" />
              Scheduled Periods
            </p>
          </div>

          <div className="rounded-lg p-3 bg-[#f6f7f8] dark:bg-[#111112] border border-[#e1e4e8] dark:border-[#2a2a2d]">
            <p className="text-xl font-bold tracking-tight text-[#121417] dark:text-[#ececec]">
              {insights.occupancyPercent}%
            </p>
            <p className="text-[11px] text-[#5b616b] dark:text-[#8c9199] flex items-center gap-1 mt-0.5">
              <Percent className="w-3.5 h-3.5 text-[#3b6fe0] dark:text-[#7aa2f7]" />
              Grid Occupancy
            </p>
          </div>

          <div className="rounded-lg p-3 bg-[#f6f7f8] dark:bg-[#111112] border border-[#e1e4e8] dark:border-[#2a2a2d]">
            <p className="text-xl font-bold tracking-tight text-[#121417] dark:text-[#ececec]">
              {insights.activeFacultyCount}
            </p>
            <p className="text-[11px] text-[#5b616b] dark:text-[#8c9199] flex items-center gap-1 mt-0.5">
              <Users className="w-3.5 h-3.5 text-[#3b6fe0] dark:text-[#7aa2f7]" />
              Faculty Teaching
            </p>
          </div>

          <div className="rounded-lg p-3 bg-[#f6f7f8] dark:bg-[#111112] border border-[#e1e4e8] dark:border-[#2a2a2d]">
            <p className="text-xl font-bold tracking-tight flex items-center gap-1.5">
              {insights.conflictsCount === 0 ? (
                <span className="text-[#107e3e] dark:text-[#34d399] flex items-center gap-1">
                  <CheckCircle2 className="w-5 h-5" /> 0
                </span>
              ) : (
                <span className="text-[#c0392b] dark:text-[#f87171] flex items-center gap-1">
                  <AlertTriangle className="w-5 h-5" /> {insights.conflictsCount}
                </span>
              )}
            </p>
            <p className="text-[11px] text-[#5b616b] dark:text-[#8c9199] mt-0.5">
              {insights.conflictsCount === 0 ? 'Hard Conflicts' : 'Conflicts Detected'}
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center px-6 border-b border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112] gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('WORKLOAD')}
            className={`py-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'WORKLOAD'
                ? 'border-[#3b6fe0] text-[#3b6fe0] dark:border-[#7aa2f7] dark:text-[#7aa2f7]'
                : 'border-transparent text-[#5b616b] dark:text-[#8c9199] hover:text-[#121417] dark:hover:text-[#ececec]'
            }`}
          >
            Faculty Workload ({insights.facultyWorkloads.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DAYS')}
            className={`py-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'DAYS'
                ? 'border-[#3b6fe0] text-[#3b6fe0] dark:border-[#7aa2f7] dark:text-[#7aa2f7]'
                : 'border-transparent text-[#5b616b] dark:text-[#8c9199] hover:text-[#121417] dark:hover:text-[#ececec]'
            }`}
          >
            Daily Distribution ({insights.dailyDistributions.length} days)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SUBJECTS')}
            className={`py-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'SUBJECTS'
                ? 'border-[#3b6fe0] text-[#3b6fe0] dark:border-[#7aa2f7] dark:text-[#7aa2f7]'
                : 'border-transparent text-[#5b616b] dark:text-[#8c9199] hover:text-[#121417] dark:hover:text-[#ececec]'
            }`}
          >
            Subject Breakdown ({insights.subjectCoverages.length})
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'WORKLOAD' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#5b616b] dark:text-[#8c9199]">
                <span>Weekly teaching period allocations per faculty member</span>
                <span className="text-[11px]">Sorted by load volume</span>
              </div>

              <div className="rounded-lg border border-[#e1e4e8] dark:border-[#2a2a2d] divide-y divide-[#e1e4e8] dark:divide-[#2a2a2d] overflow-hidden">
                {insights.facultyWorkloads.map((fw) => {
                  const maxLimit = fw.maxWeeklyPeriods ?? 20;
                  const pct = Math.min(100, Math.round((fw.scheduledPeriods / maxLimit) * 100));
                  const isOverload = fw.status === 'OVERLOAD';
                  const isUnderload = fw.status === 'UNDERLOAD';

                  return (
                    <div
                      key={fw.facultyId}
                      className="p-3 bg-white dark:bg-[#18181a] hover:bg-[#f6f7f8] dark:hover:bg-[#1f1f22] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-xs text-[#121417] dark:text-[#ececec] truncate">
                            {fw.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#eef0f2] dark:bg-[#2a2a2d] text-[#5b616b] dark:text-[#8c9199]">
                            {fw.facultyCode}
                          </span>
                          {isOverload && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#fee2e2] dark:bg-[#381e1e] text-[#c0392b] dark:text-[#f87171]">
                              OVERLOAD
                            </span>
                          )}
                          {isUnderload && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#fef3c7] dark:bg-[#382f1e] text-[#92690e] dark:text-[#fbbf24]">
                              LOW LOAD
                            </span>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-[#121417] dark:text-[#ececec]">
                            {fw.scheduledPeriods}
                          </span>
                          <span className="text-xs text-[#8c9199] dark:text-[#6e6e73]">
                            {' '}
                            / {fw.maxWeeklyPeriods ? `${fw.maxWeeklyPeriods} hrs` : 'unlimited'}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-[#eef0f2] dark:bg-[#2a2a2d] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOverload
                              ? 'bg-[#c0392b] dark:bg-[#f87171]'
                              : isUnderload
                                ? 'bg-[#d9a13a] dark:bg-[#fbbf24]'
                                : 'bg-[#3b6fe0] dark:bg-[#7aa2f7]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Subjects tags */}
                      {fw.subjectNames.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {fw.subjectNames.map((sCode) => (
                            <span
                              key={sCode}
                              className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#e8effc] dark:bg-[#18233a] text-[#3b6fe0] dark:text-[#7aa2f7]"
                            >
                              {sCode}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'DAYS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#5b616b] dark:text-[#8c9199]">
                <span>Daily teaching load across working days</span>
                {insights.busiestDay && (
                  <span className="text-[#3b6fe0] dark:text-[#7aa2f7] font-medium flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Peak day: {insights.busiestDay.dayName} ({insights.busiestDay.totalPeriods} periods)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {insights.dailyDistributions.map((day) => {
                  const isPeak = insights.busiestDay?.dayIndex === day.dayIndex;
                  return (
                    <div
                      key={day.dayIndex}
                      className={`rounded-lg p-3 border transition-colors ${
                        isPeak
                          ? 'border-[#3b6fe0] dark:border-[#7aa2f7] bg-[#f8faff] dark:bg-[#141b2b]'
                          : 'border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#121417] dark:text-[#ececec]">
                          {day.dayName}
                        </span>
                        {isPeak && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#3b6fe0] dark:bg-[#7aa2f7] text-white dark:text-[#111112]">
                            PEAK
                          </span>
                        )}
                      </div>

                      <div className="text-2xl font-black tracking-tight text-[#121417] dark:text-[#ececec]">
                        {day.totalPeriods}{' '}
                        <span className="text-xs font-normal text-[#5b616b] dark:text-[#8c9199]">
                          periods
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-[#e1e4e8] dark:border-[#2a2a2d] flex items-center justify-between text-[11px] text-[#5b616b] dark:text-[#8c9199]">
                        <span>{day.theoryPeriods} Theory</span>
                        <span>{day.labPeriods} Lab</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'SUBJECTS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#5b616b] dark:text-[#8c9199]">
                <span>Scheduled sessions by course / subject</span>
                <span className="text-[11px]">
                  Total Theory: {insights.totalTheoryPeriods}p • Total Lab: {insights.totalLabPeriods}p
                </span>
              </div>

              <div className="rounded-lg border border-[#e1e4e8] dark:border-[#2a2a2d] divide-y divide-[#e1e4e8] dark:divide-[#2a2a2d] overflow-hidden">
                {insights.subjectCoverages.map((sub) => (
                  <div
                    key={sub.subjectId}
                    className="p-3 bg-white dark:bg-[#18181a] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#121417] dark:text-[#ececec]">
                          {sub.code}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                            sub.type === 'LAB'
                              ? 'bg-[#e7e0fd] text-[#5b3fb8] dark:bg-[#2b1f4a] dark:text-[#c4b5fd]'
                              : 'bg-[#dce4fd] text-[#2c5282] dark:bg-[#1b2b48] dark:text-[#93c5fd]'
                          }`}
                        >
                          {sub.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5b616b] dark:text-[#8c9199] truncate mt-0.5">
                        {sub.name}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[#121417] dark:text-[#ececec]">
                        {sub.scheduledPeriods} periods
                      </span>
                      <p className="text-[10px] text-[#8c9199] dark:text-[#6e6e73]">
                        {sub.sessionsCount} session{sub.sessionsCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112]">
          <span className="text-xs text-[#5b616b] dark:text-[#8c9199]">
            Calculated in real-time from active workstation state
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#121417] dark:bg-[#ececec] text-white dark:text-[#111112] hover:opacity-90 transition-opacity cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
