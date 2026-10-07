import type {
  Break,
  Department,
  Faculty,
  GenerationDiagnostic,
  Section,
  Subject,
} from '../../models';
import { validateConfiguration } from '../../configuration/validate';
import type { ConfigurationValidationResult } from '../../configuration/validate';
import { clampTeachingPosition } from '../grid-layout';

export interface FeasibilityInput {
  department: Department;
  sections: Section[];
  subjects: Subject[];
  faculty: Faculty[];
  /** Scheduled breaks (e.g. lunch) block those periods for teaching. */
  breaks?: Break[];
}

export interface SectionCapacityReport {
  sectionId: string;
  requiredPeriods: number;
  weeklyCapacity: number;
  labSessions: number;
  labCapacity: number;
}

export interface FacultyWorkloadReport {
  facultyId: string;
  requiredPeriods: number;
  weeklyCapacity: number;
  dailyLimitsViolated: boolean;
}

export interface FeasibilityResult {
  verdict: 'READY' | 'IMPOSSIBLE_OR_INVALID';
  configValidation: ConfigurationValidationResult;
  sectionReports: SectionCapacityReport[];
  facultyReports: FacultyWorkloadReport[];
  diagnostics: GenerationDiagnostic[];
}

/** Required periods per section including lab double-counting (§4.1). */
export function computeSectionRequirement(
  section: Section,
  subjects: Subject[],
): { requiredPeriods: number; labSessions: number; missingSubjects: string[] } {
  let requiredPeriods = 0;
  let labSessions = 0;
  const missingSubjects: string[] = [];
  for (const req of section.subjectRequirements) {
    const subject = subjects.find((s) => s.id === req.subjectId);
    if (!subject || !subject.active) {
      if (req.sessionsPerWeek > 0) missingSubjects.push(req.subjectId);
      continue;
    }
    const duration = subject.type === 'LAB' ? 2 : 1;
    requiredPeriods += req.sessionsPerWeek * duration;
    if (subject.type === 'LAB') labSessions += req.sessionsPerWeek;
  }
  return { requiredPeriods, labSessions, missingSubjects };
}

/**
 * Teaching slots blocked on a given day by DAY-SPECIFIC breaks only.
 * All-day breaks insert extra grid columns instead of consuming teaching
 * periods, so they never reduce usable capacity — but they do split lab
 * runs (see `allDaySplitPositions`). Out-of-range teaching indices are
 * ignored so a stale break can never drive capacity negative.
 */
export function daySpecificBlockedTeaching(
  dayIndex: number,
  teachingPerDay: number,
  breaks: Break[],
): Set<number> {
  const blocked = new Set<number>();
  for (const b of breaks) {
    if (b.dayIndex === null || b.dayIndex !== dayIndex) continue;
    const duration = Math.max(1, Math.floor(b.durationPeriods));
    for (let t = Math.floor(b.startPeriod); t < Math.floor(b.startPeriod) + duration; t++) {
      if (t >= 0 && t < teachingPerDay) blocked.add(t);
    }
  }
  return blocked;
}

/** Sorted unique teaching-coordinate positions where all-day breaks split the day. */
export function allDaySplitPositions(teachingPerDay: number, breaks: Break[]): number[] {
  const positions = new Set<number>();
  for (const b of breaks) {
    if (b.dayIndex !== null) continue;
    positions.add(clampTeachingPosition(b.startPeriod, teachingPerDay));
  }
  return [...positions].sort((a, b) => a - b);
}

/**
 * Teachable periods per week (§4.3): teaching periods minus teaching slots
 * blocked by day-specific breaks. All-day breaks add their own columns, so
 * they leave usable capacity untouched.
 */
export function computeUsableCapacity(
  workingDaysCount: number,
  teachingPerDay: number,
  breaks: Break[] = [],
): number {
  let usable = 0;
  for (let day = 0; day < workingDaysCount; day++) {
    usable += teachingPerDay - daySpecificBlockedTeaching(day, teachingPerDay, breaks).size;
  }
  return Math.max(0, usable);
}

/**
 * Theoretical maximum non-overlapping 2-period lab blocks per section per
 * week (§4.3): within each day, free teaching runs — split at all-day break
 * columns and excluding day-specific blocks — contribute floor(run / 2).
 */
export function computeLabCapacity(
  workingDaysCount: number,
  teachingPerDay: number,
  breaks: Break[] = [],
): number {
  const splits = allDaySplitPositions(teachingPerDay, breaks);
  let capacity = 0;
  for (let day = 0; day < workingDaysCount; day++) {
    const blocked = daySpecificBlockedTeaching(day, teachingPerDay, breaks);
    const bounds = [0, ...splits, teachingPerDay];
    for (let s = 0; s < bounds.length - 1; s++) {
      let run = 0;
      for (let t = bounds[s]; t < bounds[s + 1]; t++) {
        if (blocked.has(t)) {
          capacity += Math.floor(run / 2);
          run = 0;
        } else {
          run++;
        }
      }
      capacity += Math.floor(run / 2);
    }
  }
  return capacity;
}

/**
 * Estimated weekly periods per faculty member (§4.2).
 * Subject demand is summed across sections, then divided evenly among the
 * subject's eligible faculty (ceil). This avoids the over-pessimistic
 * worst-case where every eligible faculty member teaches every section.
 */
export function computeFacultyWorkload(
  faculty: Faculty,
  sections: Section[],
  subjects: Subject[],
): number {
  let total = 0;
  for (const subject of subjects) {
    if (!subject.active || !subject.eligibleFacultyIds.includes(faculty.id)) continue;
    // Demand across all active applicable sections requiring this subject.
    let demand = 0;
    for (const section of sections) {
      if (!section.active) continue;
      if (!subject.eligibleSectionIds.includes(section.id)) continue;
      const req = section.subjectRequirements.find((r) => r.subjectId === subject.id);
      if (!req || req.sessionsPerWeek === 0) continue;
      demand += req.sessionsPerWeek * (subject.type === 'LAB' ? 2 : 1);
    }
    if (demand > 0) {
      total += Math.ceil(demand / subject.eligibleFacultyIds.length);
    }
  }
  return total;
}

/** Diagnostics that advise but do not make generation impossible. */
const WARNING_CODES = new Set(['SECTION_CAPACITY_SLACK', 'FACULTY_UNASSIGNED']);

/** Full preflight analysis. Returns structured diagnostics, never throws. */
export function analyzeFeasibility(input: FeasibilityInput): FeasibilityResult {
  const { department, sections, subjects, faculty, breaks = [] } = input;
  const diagnostics: GenerationDiagnostic[] = [];

  const configValidation = validateConfiguration({
    department,
    sections,
    subjects,
    faculty,
  });

  for (const issue of configValidation.issues) {
    diagnostics.push({
      code: issue.code,
      message: issue.message,
      sectionIds: issue.entityIds.filter((id) => sections.some((s) => s.id === id)),
      subjectIds: issue.entityIds.filter((id) => subjects.some((s) => s.id === id)),
      facultyIds: issue.entityIds.filter((id) => faculty.some((f) => f.id === id)),
      suggestions: issue.suggestions,
    });
  }

  const activeSections = sections.filter((s) => s.active);
  // `periodsPerDay` counts teaching periods only: all-day breaks add their
  // own grid columns, so only day-specific breaks reduce usable capacity.
  const weeklyCapacity = computeUsableCapacity(
    department.workingDays.length,
    department.periodsPerDay,
    breaks,
  );
  const labCapacity = computeLabCapacity(
    department.workingDays.length,
    department.periodsPerDay,
    breaks,
  );

  const sectionReports: SectionCapacityReport[] = [];
  for (const section of activeSections) {
    const { requiredPeriods, labSessions, missingSubjects } = computeSectionRequirement(
      section,
      subjects,
    );
    const report: SectionCapacityReport = {
      sectionId: section.id,
      requiredPeriods,
      weeklyCapacity,
      labSessions,
      labCapacity,
    };
    sectionReports.push(report);

    if (requiredPeriods > weeklyCapacity) {
      diagnostics.push({
        code: 'INSUFFICIENT_SECTION_CAPACITY',
        message: `Insufficient weekly capacity for section "${section.name}": requires ${requiredPeriods} periods but only ${weeklyCapacity} are available.`,
        sectionIds: [section.id],
        subjectIds: [],
        facultyIds: [],
        suggestions: [
          'Increase working days or periods per day.',
          'Reduce required weekly sessions for this section.',
          'Reduce break durations blocking teachable periods.',
        ],
      });
    }
    if (labSessions > labCapacity) {
      diagnostics.push({
        code: 'INSUFFICIENT_LAB_CAPACITY',
        message: `Section "${section.name}" requires ${labSessions} lab blocks but at most ${labCapacity} non-overlapping blocks fit in the week.`,
        sectionIds: [section.id],
        subjectIds: [],
        facultyIds: [],
        suggestions: ['Reduce lab sessions or increase periods per day.', 'Review laboratory capacity.'],
      });
    }
    if (missingSubjects.length > 0) {
      diagnostics.push({
        code: 'MISSING_SUBJECT_REFERENCES',
        message: `Section "${section.name}" references ${missingSubjects.length} missing subject(s).`,
        sectionIds: [section.id],
        subjectIds: missingSubjects,
        facultyIds: [],
        suggestions: ['Remove stale requirements or recreate the subjects.'],
      });
    }
    if (requiredPeriods < weeklyCapacity) {
      const shortfall = weeklyCapacity - requiredPeriods;
      diagnostics.push({
        code: 'SECTION_CAPACITY_SLACK',
        message: `Section "${section.name}" requires ${requiredPeriods} of ${weeklyCapacity} weekly periods — ${shortfall} period(s) will remain empty.`,
        sectionIds: [section.id],
        subjectIds: [],
        facultyIds: [],
        suggestions: [
          `Add or raise weekly sessions so requirements sum to ${weeklyCapacity} periods (labs count as 2 periods each).`,
          'Fully-packed timetables require demand to exactly match capacity.',
        ],
      });
    }
  }

  const facultyReports: FacultyWorkloadReport[] = [];
  for (const f of faculty) {
    if (!f.active) continue;
    const required = computeFacultyWorkload(f, activeSections, subjects);
    const weeklyCap = f.maxPeriodsPerWeek ?? weeklyCapacity;
    const report: FacultyWorkloadReport = {
      facultyId: f.id,
      requiredPeriods: required,
      weeklyCapacity: weeklyCap,
      dailyLimitsViolated: false,
    };
    facultyReports.push(report);

    if (required === 0) {
      diagnostics.push({
        code: 'FACULTY_UNASSIGNED',
        message: `Faculty "${f.name}" is not eligible for any subject and will receive no teaching sessions.`,
        sectionIds: [],
        subjectIds: [],
        facultyIds: [f.id],
        suggestions: [
          'Assign this faculty member to a subject pool in the Faculty page.',
        ],
      });
    }

    if (required > weeklyCap) {
      diagnostics.push({
        code: 'FACULTY_CAPACITY_EXCEEDED',
        message: `Faculty "${f.name}" requires ${required} periods weekly but capacity is ${weeklyCap}.`,
        sectionIds: [],
        subjectIds: [],
        facultyIds: [f.id],
        suggestions: [
          'Add another eligible faculty member.',
          'Reduce required sessions.',
          'Raise the faculty weekly cap.',
        ],
      });
    }
  }

  const verdict: FeasibilityResult['verdict'] =
    diagnostics.some((d) => !WARNING_CODES.has(d.code)) ? 'IMPOSSIBLE_OR_INVALID' : 'READY';
  return { verdict, configValidation, sectionReports, facultyReports, diagnostics };
}
