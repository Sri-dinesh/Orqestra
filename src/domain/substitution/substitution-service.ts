import type { Faculty, Section, Subject, Timetable, TimetableEntry, Department } from '@/domain/models';

export type CandidateTier =
  | 'BEST_MATCH'
  | 'AVAILABLE'
  | 'OVERLOADED'
  | 'UNAVAILABLE_PREFERENCE'
  | 'BUSY';

export interface SubstituteCandidate {
  faculty: Faculty;
  tier: CandidateTier;
  isEligible: boolean;
  isBusy: boolean;
  busyDetails?: string;
  isUnavailablePreference: boolean;
  dailyLoad: number;
  weeklyLoad: number;
  wouldExceedDailyCap: boolean;
  wouldExceedWeeklyCap: boolean;
  reasons: string[];
}

export interface SubstitutionQuery {
  timetable: Timetable;
  entry: TimetableEntry;
  subjects: Subject[];
  faculty: Faculty[];
  sections: Section[];
  department: Department;
}

/**
 * Pure evaluation function that ranks all faculty members in the department
 * by their suitability to substitute for a specific timetable entry.
 */
export function findSubstitutesForEntry(query: SubstitutionQuery): SubstituteCandidate[] {
  const { timetable, entry, subjects, faculty, sections } = query;
  const subject = subjects.find((s) => s.id === entry.subjectId);
  const entryStart = entry.startPeriod;
  const entryEnd = entry.startPeriod + entry.durationPeriods;
  const sectionById = new Map(sections.map((s) => [s.id, s]));

  const candidates: SubstituteCandidate[] = [];

  for (const f of faculty) {
    if (!f.active) continue;
    if (f.id === entry.facultyId) continue; // Skip current faculty

    // 1. Eligibility: Check if faculty is designated for this subject
    const isEligible =
      !subject ||
      subject.eligibleFacultyIds.length === 0 ||
      subject.eligibleFacultyIds.includes(f.id);

    // 2. Schedule Conflict: Check if faculty is already teaching at this slot
    let isBusy = false;
    let busyDetails: string | undefined = undefined;

    for (const e of timetable.entries) {
      if (e.id === entry.id) continue;
      if (e.facultyId !== f.id) continue;
      if (e.dayIndex !== entry.dayIndex) continue;

      const eStart = e.startPeriod;
      const eEnd = e.startPeriod + e.durationPeriods;

      // Overlap check
      const overlaps = !(eEnd <= entryStart || eStart >= entryEnd);
      if (overlaps) {
        isBusy = true;
        const sec = sectionById.get(e.sectionId);
        busyDetails = sec ? `Busy teaching ${sec.name}` : 'Busy teaching another section';
        break;
      }
    }

    // 3. Availability Preference: Check if marked unavailable in faculty availability grid
    let isUnavailablePreference = false;
    if (f.availability && f.availability.length > 0) {
      const pref = f.availability.find(
        (a) =>
          a.dayIndex === entry.dayIndex &&
          !(a.startPeriod + a.durationPeriods <= entryStart || a.startPeriod >= entryEnd),
      );
      if (pref) {
        isUnavailablePreference = true;
      }
    }

    // 4. Workload calculation
    let dailyLoad = 0;
    let weeklyLoad = 0;

    for (const e of timetable.entries) {
      if (e.id === entry.id) continue;
      if (e.facultyId === f.id) {
        weeklyLoad += e.durationPeriods;
        if (e.dayIndex === entry.dayIndex) {
          dailyLoad += e.durationPeriods;
        }
      }
    }

    const wouldExceedDailyCap =
      f.maxPeriodsPerDay !== null &&
      dailyLoad + entry.durationPeriods > f.maxPeriodsPerDay;

    const wouldExceedWeeklyCap =
      f.maxPeriodsPerWeek !== null &&
      weeklyLoad + entry.durationPeriods > f.maxPeriodsPerWeek;

    // 5. Reasons & Tier determination
    const reasons: string[] = [];
    let tier: CandidateTier;

    if (isBusy) {
      tier = 'BUSY';
      reasons.push(busyDetails ?? 'Schedule conflict at this period');
    } else if (wouldExceedDailyCap || wouldExceedWeeklyCap) {
      tier = 'OVERLOADED';
      if (wouldExceedDailyCap) {
        reasons.push(`Would exceed daily limit of ${f.maxPeriodsPerDay} periods (currently ${dailyLoad})`);
      }
      if (wouldExceedWeeklyCap) {
        reasons.push(`Would exceed weekly limit of ${f.maxPeriodsPerWeek} periods (currently ${weeklyLoad})`);
      }
    } else if (isUnavailablePreference) {
      tier = 'UNAVAILABLE_PREFERENCE';
      reasons.push('Marked unavailable in availability profile');
    } else if (isEligible) {
      tier = 'BEST_MATCH';
      reasons.push('Qualified for subject · Free slot · Within workload limits');
    } else {
      tier = 'AVAILABLE';
      reasons.push('Free slot · Within workload limits (General substitute)');
    }

    candidates.push({
      faculty: f,
      tier,
      isEligible,
      isBusy,
      busyDetails,
      isUnavailablePreference,
      dailyLoad,
      weeklyLoad,
      wouldExceedDailyCap,
      wouldExceedWeeklyCap,
      reasons,
    });
  }

  // Tier priority rank
  const tierWeight: Record<CandidateTier, number> = {
    BEST_MATCH: 1,
    AVAILABLE: 2,
    OVERLOADED: 3,
    UNAVAILABLE_PREFERENCE: 4,
    BUSY: 5,
  };

  // Sort candidates: highest tier first, then by lowest daily load, then lowest weekly load
  candidates.sort((a, b) => {
    const tierDiff = tierWeight[a.tier] - tierWeight[b.tier];
    if (tierDiff !== 0) return tierDiff;

    const dailyDiff = a.dailyLoad - b.dailyLoad;
    if (dailyDiff !== 0) return dailyDiff;

    return a.weeklyLoad - b.weeklyLoad;
  });

  return candidates;
}

export interface SubstitutionSlipData {
  collegeName: string;
  departmentName: string;
  departmentCode: string;
  memoDate: string;
  academicYear: string;
  absentFacultyName: string;
  absentFacultyCode: string;
  substituteFacultyName: string;
  substituteFacultyCode: string;
  subjectCode: string;
  subjectName: string;
  sectionName: string;
  dayOfWeek: string;
  periodLabel: string;
  timeSlot: string;
  roomNo: string;
  reason: string;
}

export function generateSubstitutionSlipData(input: {
  collegeName?: string;
  academicYear?: string;
  department: Department;
  absentFaculty: Faculty;
  substituteFaculty: Faculty;
  subject: Subject;
  section: Section;
  dayIndex: number;
  startPeriod: number;
  durationPeriods: number;
  roomNo?: string;
  reason?: string;
}): SubstitutionSlipData {
  const {
    collegeName = 'COLLEGE OF ENGINEERING & TECHNOLOGY',
    academicYear = '2026-27',
    department,
    absentFaculty,
    substituteFaculty,
    subject,
    section,
    dayIndex,
    startPeriod,
    durationPeriods,
    roomNo = 'Regular Classroom',
    reason = 'Official Duty / Medical Leave',
  } = input;

  const dayOfWeek = department.workingDays[dayIndex] ?? `Day ${dayIndex + 1}`;
  const periodLabel =
    durationPeriods > 1
      ? `Period ${startPeriod + 1} – ${startPeriod + durationPeriods}`
      : `Period ${startPeriod + 1}`;

  const timing = department.periodTimings?.[startPeriod];
  const timeSlot = timing?.start && timing?.end ? `${timing.start} – ${timing.end}` : 'As per timetable';

  return {
    collegeName,
    departmentName: department.name,
    departmentCode: department.code,
    memoDate: new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    academicYear,
    absentFacultyName: absentFaculty.name,
    absentFacultyCode: absentFaculty.facultyCode,
    substituteFacultyName: substituteFaculty.name,
    substituteFacultyCode: substituteFaculty.facultyCode,
    subjectCode: subject.code,
    subjectName: subject.name,
    sectionName: section.name,
    dayOfWeek,
    periodLabel,
    timeSlot,
    roomNo,
    reason,
  };
}
