import type {
  Conflict,
  Timetable,
  TimetableConfiguration,
} from '../models';
import { generateId } from '../models/ids';
import { isSnapshotCompatible } from '../configuration/normalize';
import type { ConfigurationSnapshot } from '../models';

export interface ValidationContext {
  timetable: Timetable;
  config: TimetableConfiguration;
  currentSnapshot: ConfigurationSnapshot;
}

function conflict(
  type: Conflict['type'],
  severity: Conflict['severity'],
  messageKey: string,
  messageParams: Record<string, string | number>,
  opts: Partial<Pick<Conflict, 'dayIndex' | 'periodIndex' | 'entryIds' | 'facultyIds' | 'sectionIds' | 'subjectIds' | 'resolutionHints'>> = {},
): Conflict {
  return {
    id: generateId('conflict'),
    type,
    severity,
    messageKey,
    messageParams,
    dayIndex: opts.dayIndex ?? null,
    periodIndex: opts.periodIndex ?? null,
    entryIds: opts.entryIds ?? [],
    facultyIds: opts.facultyIds ?? [],
    sectionIds: opts.sectionIds ?? [],
    subjectIds: opts.subjectIds ?? [],
    resolutionHints: opts.resolutionHints ?? [],
  };
}

/** Layer 1 + 2: structural and reference validation (H3, H4, H9). */
export function validateStructureAndReferences(ctx: ValidationContext): Conflict[] {
  const conflicts: Conflict[] = [];
  const { timetable, config } = ctx;
  const subjectIds = new Set(config.subjects.map((s) => s.id));
  const facultyIds = new Set(config.faculty.map((f) => f.id));
  const sectionIds = new Set(config.sections.map((s) => s.id));
  const subjectById = new Map(config.subjects.map((s) => [s.id, s]));

  for (const entry of timetable.entries) {
    const base = { entryIds: [entry.id], sectionIds: [entry.sectionId], subjectIds: [entry.subjectId], facultyIds: [entry.facultyId] };

    if (entry.dayIndex < 0 || entry.dayIndex >= config.workingDays.length) {
      conflicts.push(
        conflict('INVALID_DAY', 'ERROR', 'conflict.invalidDay', { dayIndex: entry.dayIndex }, {
          ...base,
          dayIndex: entry.dayIndex,
          resolutionHints: ['Move the entry to a valid working day.'],
        }),
      );
    }
    if (entry.startPeriod < 0 || entry.startPeriod >= config.periodsPerDay) {
      conflicts.push(
        conflict('INVALID_PERIOD', 'ERROR', 'conflict.invalidPeriod', { period: entry.startPeriod }, {
          ...base,
          dayIndex: entry.dayIndex,
          periodIndex: entry.startPeriod,
          resolutionHints: ['Move the entry to a valid period.'],
        }),
      );
    }
    if (!subjectIds.has(entry.subjectId)) {
      conflicts.push(
        conflict('INVALID_SUBJECT', 'ERROR', 'conflict.invalidSubject', {}, base),
      );
    }
    if (!facultyIds.has(entry.facultyId)) {
      conflicts.push(
        conflict('INVALID_FACULTY', 'ERROR', 'conflict.invalidFaculty', {}, base),
      );
    }
    if (!sectionIds.has(entry.sectionId)) {
      conflicts.push(
        conflict('INVALID_SECTION', 'ERROR', 'conflict.invalidSection', {}, base),
      );
    }
    const subject = subjectById.get(entry.subjectId);
    if (subject && !subject.eligibleFacultyIds.includes(entry.facultyId)) {
      conflicts.push(
        conflict('FACULTY_NOT_ELIGIBLE', 'ERROR', 'conflict.facultyNotEligible', {}, {
          ...base,
          resolutionHints: ['Assign a faculty member eligible for this subject.'],
        }),
      );
    }
    if (subject && !subject.eligibleSectionIds.includes(entry.sectionId)) {
      conflicts.push(
        conflict('SUBJECT_NOT_APPLICABLE', 'ERROR', 'conflict.subjectNotApplicable', {}, base),
      );
    }
    const expectedDuration = subject ? subject.durationPeriods : entry.durationPeriods;
    if (subject && entry.durationPeriods !== expectedDuration) {
      conflicts.push(
        conflict('INVALID_DURATION', 'ERROR', 'conflict.invalidDuration', { expected: expectedDuration, actual: entry.durationPeriods }, base),
      );
    }
  }
  return conflicts;
}

/** Layer 3: collision validation (H1, H2) — full-range check, lab-aware. */
export function validateCollisions(ctx: ValidationContext): Conflict[] {
  const conflicts: Conflict[] = [];
  const { timetable } = ctx;
  const sectionSlots = new Map<string, Map<string, string[]>>();
  const facultySlots = new Map<string, Map<string, string[]>>();

  for (const entry of timetable.entries) {
    for (let p = entry.startPeriod; p < entry.startPeriod + entry.durationPeriods; p++) {
      const sKey = `${entry.sectionId}`;
      const fKey = `${entry.facultyId}`;
      const slot = `${entry.dayIndex}:${p}`;

      const sMap = sectionSlots.get(sKey) ?? new Map<string, string[]>();
      const existingS = sMap.get(slot);
      if (existingS) {
        conflicts.push(
          conflict('SECTION_TIME_CONFLICT', 'ERROR', 'conflict.sectionConflict', { day: entry.dayIndex, period: p }, {
            dayIndex: entry.dayIndex,
            periodIndex: p,
            entryIds: [...existingS, entry.id],
            sectionIds: [entry.sectionId],
            resolutionHints: ['Move one of the conflicting entries to a free slot.'],
          }),
        );
      } else {
        sMap.set(slot, [entry.id]);
      }
      sectionSlots.set(sKey, sMap);

      const fMap = facultySlots.get(fKey) ?? new Map<string, string[]>();
      const existingF = fMap.get(slot);
      if (existingF) {
        conflicts.push(
          conflict('FACULTY_TIME_CONFLICT', 'ERROR', 'conflict.facultyConflict', { day: entry.dayIndex, period: p }, {
            dayIndex: entry.dayIndex,
            periodIndex: p,
            entryIds: [...existingF, entry.id],
            facultyIds: [entry.facultyId],
            resolutionHints: ['Assign a different faculty member or move one entry.'],
          }),
        );
      } else {
        fMap.set(slot, [entry.id]);
      }
      facultySlots.set(fKey, fMap);
    }
  }
  return conflicts;
}

/** Layer 5: lab validation (H5, H6). */
export function validateLaboratories(ctx: ValidationContext): Conflict[] {
  const conflicts: Conflict[] = [];
  for (const entry of ctx.timetable.entries) {
    const subject = ctx.config.subjects.find((s) => s.id === entry.subjectId);
    if (!subject) continue;
    if (subject.type === 'LAB') {
      if (entry.durationPeriods !== 2) {
        conflicts.push(
          conflict('LAB_NOT_CONSECUTIVE', 'ERROR', 'conflict.labNotConsecutive', { actual: entry.durationPeriods }, {
            entryIds: [entry.id],
            sectionIds: [entry.sectionId],
            subjectIds: [entry.subjectId],
            resolutionHints: ['Lab sessions must occupy exactly 2 consecutive periods.'],
          }),
        );
      }
      if (entry.startPeriod + entry.durationPeriods > ctx.config.periodsPerDay) {
        conflicts.push(
          conflict('LAB_OUT_OF_BOUNDS', 'ERROR', 'conflict.labOutOfBounds', {}, {
            entryIds: [entry.id],
            dayIndex: entry.dayIndex,
            periodIndex: entry.startPeriod,
            sectionIds: [entry.sectionId],
            resolutionHints: ['Move the lab block so both periods fit within the day.'],
          }),
        );
      }
    } else if (entry.durationPeriods !== 1) {
      conflicts.push(
        conflict('INVALID_DURATION', 'ERROR', 'conflict.theoryDuration', {}, {
          entryIds: [entry.id],
          resolutionHints: ['Theory sessions occupy exactly 1 period.'],
        }),
      );
    }
  }
  return conflicts;
}

/** Layer 4: requirement validation (H7, H8, H13) using the snapshot counts. */
export function validateRequirements(ctx: ValidationContext): Conflict[] {
  const conflicts: Conflict[] = [];
  const { timetable } = ctx;
  const counts = new Map<string, number>();
  const seenEntryIds = new Set<string>();

  for (const entry of timetable.entries) {
    if (seenEntryIds.has(entry.id)) {
      conflicts.push(
        conflict('DUPLICATE_SESSION', 'ERROR', 'conflict.duplicateSession', { entryId: entry.id }, {
          entryIds: [entry.id],
        }),
      );
    }
    seenEntryIds.add(entry.id);
    const key = `${entry.sectionId}:${entry.subjectId}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  for (const [key, required] of Object.entries(timetable.configurationSnapshot.subjectRequirementCounts)) {
    if (required === 0) continue;
    const actual = counts.get(key) ?? 0;
    const [sectionId, subjectId] = key.split(':');
    if (actual < required) {
      conflicts.push(
        conflict('MISSING_REQUIRED_SESSION', 'ERROR', 'conflict.missingSessions', { required, actual, subjectId }, {
          sectionIds: [sectionId],
          subjectIds: [subjectId],
          resolutionHints: ['Generate again or add the missing session manually.'],
        }),
      );
    } else if (actual > required) {
      conflicts.push(
        conflict('EXCESS_REQUIRED_SESSION', 'ERROR', 'conflict.excessSessions', { required, actual, subjectId }, {
          sectionIds: [sectionId],
          subjectIds: [subjectId],
          resolutionHints: ['Remove excess sessions for this subject.'],
        }),
      );
    }
  }

  // H10: entries for section-subject combos that are not in the snapshot at all
  for (const [key, count] of counts) {
    if (!(key in timetable.configurationSnapshot.subjectRequirementCounts) && count > 0) {
      const [sectionId, subjectId] = key.split(':');
      conflicts.push(
        conflict('EXCESS_REQUIRED_SESSION', 'ERROR', 'conflict.unscheduledSubject', { subjectId }, {
          sectionIds: [sectionId],
          subjectIds: [subjectId],
          resolutionHints: ['Remove entries for subjects not assigned to this section.'],
        }),
      );
    }
  }
  return conflicts;
}

/** Layer 6: configuration consistency (H12). */
export function validateConfigurationConsistency(ctx: ValidationContext): Conflict[] {
  const conflicts: Conflict[] = [];
  if (!isSnapshotCompatible(ctx.timetable.configurationSnapshot, ctx.currentSnapshot)) {
    conflicts.push(
      conflict('STALE_TIMETABLE', 'ERROR', 'conflict.staleTimetable', {}, {
        resolutionHints: ['Configuration changed since generation. Regenerate the timetable.'],
      }),
    );
  }
  return conflicts;
}
