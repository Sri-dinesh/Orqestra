import type { Break, Department, Faculty, Section, Subject, TimetableEntry } from '@/domain/models';
import { buildGridLayout, getDepartmentBreaks } from '@/domain/scheduler/grid-layout';

export interface BusyFacultyDetail {
  facultyId: string;
  facultyName: string;
  sectionId: string;
  sectionName: string;
  subjectCode: string;
  subjectName: string;
}

export interface SlotAvailabilityInfo {
  dayIndex: number;
  periodIndex: number;
  columnLabel: string;
  isBreak: boolean;
  breakName?: string;
  isCommonFree: boolean;
  freeFacultyCount: number;
  busyFacultyCount: number;
  totalSelectedFaculty: number;
  freeFacultyNames: string[];
  busyFaculty: BusyFacultyDetail[];
}

export interface CommonFreeSlotSummary {
  slots: SlotAvailabilityInfo[][]; // dayIndex -> periodIndex -> SlotAvailabilityInfo
  totalCommonFreeSlots: number;
  totalTeachingSlots: number;
  bestDayIndex: number | null;
  bestDayName: string | null;
  bestDayFreeCount: number;
}

/**
 * Computes mutual free periods and availability across a selected group of faculty
 * for department meetings, mentoring, or remedial scheduling.
 */
export function computeCommonFreeSlots(
  department: Department,
  faculty: Faculty[],
  selectedFacultyIds: string[],
  entries: TimetableEntry[],
  breaks: Break[] = [],
  sections: Section[] = [],
  subjects: Subject[] = [],
): CommonFreeSlotSummary {
  const deptBreaks = getDepartmentBreaks(breaks, department.id);
  const layout = buildGridLayout(department.periodsPerDay, deptBreaks);

  const sectionById = new Map(sections.map((s) => [s.id, s]));
  const subjectById = new Map(subjects.map((s) => [s.id, s]));

  const selectedSet = new Set(selectedFacultyIds);
  const selectedFaculty = faculty.filter((f) => selectedSet.has(f.id));
  const totalSelected = selectedFaculty.length;

  // Pre-index entries for fast lookup: `facultyId:dayIndex:periodIndex` -> entry
  const entryIndex = new Map<string, TimetableEntry>();
  for (const entry of entries) {
    if (!selectedSet.has(entry.facultyId)) continue;
    for (let p = entry.startPeriod; p < entry.startPeriod + entry.durationPeriods; p++) {
      entryIndex.set(`${entry.facultyId}:${entry.dayIndex}:${p}`, entry);
    }
  }

  const slots: SlotAvailabilityInfo[][] = [];
  let totalCommonFreeSlots = 0;
  let totalTeachingSlots = 0;
  const freeCountByDay: number[] = new Array(department.workingDays.length).fill(0);

  for (let dayIndex = 0; dayIndex < department.workingDays.length; dayIndex++) {
    const daySlots: SlotAvailabilityInfo[] = [];

    for (let periodIndex = 0; periodIndex < layout.columns.length; periodIndex++) {
      const col = layout.columns[periodIndex];

      if (col.kind === 'break') {
        daySlots.push({
          dayIndex,
          periodIndex,
          columnLabel: col.name,
          isBreak: true,
          breakName: col.name,
          isCommonFree: false,
          freeFacultyCount: 0,
          busyFacultyCount: 0,
          totalSelectedFaculty: totalSelected,
          freeFacultyNames: [],
          busyFaculty: [],
        });
        continue;
      }

      totalTeachingSlots++;
      const columnLabel = `P${col.teachingIndex + 1}`;
      const freeFacultyNames: string[] = [];
      const busyFaculty: BusyFacultyDetail[] = [];

      for (const member of selectedFaculty) {
        const teachingEntry = entryIndex.get(`${member.id}:${dayIndex}:${periodIndex}`);
        if (!teachingEntry) {
          freeFacultyNames.push(member.name);
        } else {
          const sec = sectionById.get(teachingEntry.sectionId);
          const sub = subjectById.get(teachingEntry.subjectId);
          busyFaculty.push({
            facultyId: member.id,
            facultyName: member.name,
            sectionId: teachingEntry.sectionId,
            sectionName: sec?.name ?? 'Unknown section',
            subjectCode: sub?.code ?? '?',
            subjectName: sub?.name ?? 'Unknown subject',
          });
        }
      }

      const isCommonFree = totalSelected > 0 && busyFaculty.length === 0;
      if (isCommonFree) {
        totalCommonFreeSlots++;
        freeCountByDay[dayIndex]++;
      }

      daySlots.push({
        dayIndex,
        periodIndex,
        columnLabel,
        isBreak: false,
        isCommonFree,
        freeFacultyCount: freeFacultyNames.length,
        busyFacultyCount: busyFaculty.length,
        totalSelectedFaculty: totalSelected,
        freeFacultyNames,
        busyFaculty,
      });
    }

    slots.push(daySlots);
  }

  let bestDayIndex: number | null = null;
  let bestDayName: string | null = null;
  let bestDayFreeCount = 0;

  for (let d = 0; d < freeCountByDay.length; d++) {
    if (freeCountByDay[d] > bestDayFreeCount) {
      bestDayFreeCount = freeCountByDay[d];
      bestDayIndex = d;
      bestDayName = department.workingDays[d];
    }
  }

  return {
    slots,
    totalCommonFreeSlots,
    totalTeachingSlots,
    bestDayIndex,
    bestDayName,
    bestDayFreeCount,
  };
}
