import type { Faculty, Section, Subject, TimetableEntry } from '@/domain/models';

export type AllocationStatus = 'MET' | 'UNDER' | 'OVER';

export interface SubjectAllocationItem {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectType: 'THEORY' | 'LAB';
  durationPeriods: number;
  targetSessions: number;
  assignedSessions: number;
  assignedPeriods: number;
  targetPeriods: number;
  status: AllocationStatus;
  missingSessions: number;
  extraSessions: number;
  assignedFacultyNames: string[];
  eligibleFacultyIds: string[];
}

export interface SectionAllocationSummary {
  sectionId: string;
  sectionName: string;
  items: SubjectAllocationItem[];
  totalTargetSessions: number;
  totalAssignedSessions: number;
  totalTargetPeriods: number;
  totalAssignedPeriods: number;
  satisfiedSubjectsCount: number;
  totalSubjectsCount: number;
  percentageSatisfied: number;
}

/**
 * Computes how accurately a section's scheduled timetable entries fulfill
 * its configured subject requirements (target sessions vs actual sessions).
 */
export function computeSectionSubjectAllocations(
  section: Section,
  subjects: Subject[],
  faculty: Faculty[],
  entries: TimetableEntry[],
): SectionAllocationSummary {
  const sectionEntries = entries.filter((e) => e.sectionId === section.id);
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const facultyById = new Map(faculty.map((f) => [f.id, f]));

  const requirements = section.subjectRequirements ?? [];

  // Group entries by subjectId
  const entriesBySubject = new Map<string, TimetableEntry[]>();
  for (const entry of sectionEntries) {
    const list = entriesBySubject.get(entry.subjectId) ?? [];
    list.push(entry);
    entriesBySubject.set(entry.subjectId, list);
  }

  // Union of required subjects and any extra subjects present in entries
  const allSubjectIds = Array.from(
    new Set([
      ...requirements.map((r) => r.subjectId),
      ...Array.from(entriesBySubject.keys()),
    ]),
  );

  const items: SubjectAllocationItem[] = [];

  for (const subjectId of allSubjectIds) {
    const subject = subjectById.get(subjectId);
    if (!subject) continue;

    const req = requirements.find((r) => r.subjectId === subjectId);
    const targetSessions = req?.sessionsPerWeek ?? 0;
    const duration = subject.durationPeriods || (subject.type === 'LAB' ? 2 : 1);
    const targetPeriods = targetSessions * duration;

    const assignedEntries = entriesBySubject.get(subjectId) ?? [];
    const assignedSessions = assignedEntries.length;
    const assignedPeriods = assignedEntries.reduce((sum, e) => sum + e.durationPeriods, 0);

    let status: AllocationStatus = 'MET';
    let missingSessions = 0;
    let extraSessions = 0;

    if (assignedSessions < targetSessions) {
      status = 'UNDER';
      missingSessions = targetSessions - assignedSessions;
    } else if (assignedSessions > targetSessions) {
      status = 'OVER';
      extraSessions = assignedSessions - targetSessions;
    }

    const assignedFacultyNames = Array.from(
      new Set(
        assignedEntries
          .map((e) => facultyById.get(e.facultyId)?.name)
          .filter((name): name is string => Boolean(name)),
      ),
    );

    items.push({
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      subjectType: subject.type,
      durationPeriods: duration,
      targetSessions,
      assignedSessions,
      assignedPeriods,
      targetPeriods,
      status,
      missingSessions,
      extraSessions,
      assignedFacultyNames,
      eligibleFacultyIds: subject.eligibleFacultyIds ?? [],
    });
  }

  // Sort: UNDER first, then OVER, then MET, then by code
  items.sort((a, b) => {
    const order: Record<AllocationStatus, number> = { UNDER: 0, OVER: 1, MET: 2 };
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status];
    }
    return a.subjectCode.localeCompare(b.subjectCode);
  });

  const totalTargetSessions = items.reduce((sum, i) => sum + i.targetSessions, 0);
  const totalAssignedSessions = items.reduce((sum, i) => sum + i.assignedSessions, 0);
  const totalTargetPeriods = items.reduce((sum, i) => sum + i.targetPeriods, 0);
  const totalAssignedPeriods = items.reduce((sum, i) => sum + i.assignedPeriods, 0);
  const satisfiedSubjectsCount = items.filter((i) => i.status === 'MET').length;
  const totalSubjectsCount = items.length;
  const percentageSatisfied =
    totalSubjectsCount > 0 ? Math.round((satisfiedSubjectsCount / totalSubjectsCount) * 100) : 100;

  return {
    sectionId: section.id,
    sectionName: section.name,
    items,
    totalTargetSessions,
    totalAssignedSessions,
    totalTargetPeriods,
    totalAssignedPeriods,
    satisfiedSubjectsCount,
    totalSubjectsCount,
    percentageSatisfied,
  };
}
