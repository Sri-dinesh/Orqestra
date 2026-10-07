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
  affectedEntryIds?: string[];
  /** Teaching→grid column layout (entries live in grid coordinates). */
  layout: import('../scheduler/grid-layout').GridLayout;
  /** Breaks converted to grid-coordinate spans (see `toGridBreaks`). */
  gridBreaks: import('../models').Break[];
  /** Grid slots occupied by all-day break columns. */
  breakColumns: Set<number>;
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

  const entries = ctx.affectedEntryIds ? timetable.entries.filter(e => ctx.affectedEntryIds!.includes(e.id)) : timetable.entries;
  for (const entry of entries) {
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
    if (entry.startPeriod < 0 || entry.startPeriod >= ctx.layout.gridSlotsPerDay) {
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
  const { timetable, affectedEntryIds } = ctx;

  if (affectedEntryIds && affectedEntryIds.length > 0) {
    const affected = timetable.entries.filter((e) => affectedEntryIds.includes(e.id));
    for (const a of affected) {
      for (const e of timetable.entries) {
        if (a.id === e.id) continue;
        if (a.dayIndex === e.dayIndex) {
          const aEnd = a.startPeriod + a.durationPeriods;
          const eEnd = e.startPeriod + e.durationPeriods;
          if (Math.max(a.startPeriod, e.startPeriod) < Math.min(aEnd, eEnd)) {
             const startOverlap = Math.max(a.startPeriod, e.startPeriod);
             if (a.sectionId === e.sectionId) {
               conflicts.push(conflict('SECTION_TIME_CONFLICT', 'ERROR', 'conflict.sectionConflict', { day: a.dayIndex, period: startOverlap }, {
                 dayIndex: a.dayIndex, periodIndex: startOverlap, entryIds: [a.id, e.id], sectionIds: [a.sectionId], resolutionHints: ['Move one of the conflicting entries to a free slot.']
               }));
             }
             if (a.facultyId === e.facultyId) {
               conflicts.push(conflict('FACULTY_TIME_CONFLICT', 'ERROR', 'conflict.facultyConflict', { day: a.dayIndex, period: startOverlap }, {
                 dayIndex: a.dayIndex, periodIndex: startOverlap, entryIds: [a.id, e.id], facultyIds: [a.facultyId], resolutionHints: ['Assign a different faculty member or move one entry.']
               }));
             }
          }
        }
      }
    }
    return conflicts;
  }

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

export function validateFacultyLimits(ctx: ValidationContext): Conflict[] {
  const conflicts: Conflict[] = [];
  const { timetable, config, affectedEntryIds } = ctx;
  const facultyById = new Map(config.faculty.map((f) => [f.id, f]));
  const loadByFaculty = new Map<string, number>();
  const loadByFacultyDay = new Map<string, number>();

  let affectedFacultyIds: Set<string> | null = null;
  if (affectedEntryIds && affectedEntryIds.length > 0) {
    affectedFacultyIds = new Set(
      timetable.entries
        .filter((e) => affectedEntryIds.includes(e.id))
        .map((e) => e.facultyId)
    );
  }

  for (const entry of timetable.entries) {
    const fId = entry.facultyId;
    if (affectedFacultyIds && !affectedFacultyIds.has(fId)) continue;
    const f = facultyById.get(fId);
    if (!f) continue;

    // Check availability windows (if any declared)
    if (f.availability.length > 0) {
      const dayWindows = f.availability.filter((w) => w.dayIndex === entry.dayIndex);
      let isAvailable = dayWindows.length > 0;
      if (isAvailable) {
        for (let p = entry.startPeriod; p < entry.startPeriod + entry.durationPeriods; p++) {
          if (!dayWindows.some((w) => p >= w.startPeriod && p < w.startPeriod + w.durationPeriods)) {
            isAvailable = false;
            break;
          }
        }
      }
      if (!isAvailable) {
        conflicts.push(
          conflict('FACULTY_TIME_CONFLICT', 'ERROR', 'conflict.facultyUnavailable', { day: entry.dayIndex }, {
            dayIndex: entry.dayIndex,
            entryIds: [entry.id],
            facultyIds: [fId],
            resolutionHints: ['Move the entry to a time when the faculty is available.'],
          }),
        );
      }
    }

    // Accumulate load
    loadByFaculty.set(fId, (loadByFaculty.get(fId) ?? 0) + entry.durationPeriods);
    const dayKey = `${fId}:${entry.dayIndex}`;
    loadByFacultyDay.set(dayKey, (loadByFacultyDay.get(dayKey) ?? 0) + entry.durationPeriods);
  }

  // Check weekly and daily caps
  for (const f of config.faculty) {
    if (affectedFacultyIds && !affectedFacultyIds.has(f.id)) continue;
    if (f.maxPeriodsPerWeek !== null) {
      const load = loadByFaculty.get(f.id) ?? 0;
      if (load > f.maxPeriodsPerWeek) {
        conflicts.push(
          conflict('FACULTY_CAPACITY_EXCEEDED', 'ERROR', 'conflict.facultyWeeklyCapExceeded', { limit: f.maxPeriodsPerWeek, actual: load }, {
            facultyIds: [f.id],
            resolutionHints: ['Reassign some sessions to other faculty members.'],
          }),
        );
      }
    }
    if (f.maxPeriodsPerDay !== null) {
      for (let day = 0; day < config.workingDays.length; day++) {
        const load = loadByFacultyDay.get(`${f.id}:${day}`) ?? 0;
        if (load > f.maxPeriodsPerDay) {
          conflicts.push(
            conflict('FACULTY_CAPACITY_EXCEEDED', 'ERROR', 'conflict.facultyDailyCapExceeded', { limit: f.maxPeriodsPerDay, actual: load, day }, {
              dayIndex: day,
              facultyIds: [f.id],
              resolutionHints: ['Spread the faculty member\'s sessions across other days.'],
            }),
          );
        }
      }
    }
  }

  return conflicts;
}

/** Layer 5: lab validation (H5, H6). */
export function validateLaboratories(ctx: ValidationContext): Conflict[] {
  const conflicts: Conflict[] = [];
  const entries = ctx.affectedEntryIds ? ctx.timetable.entries.filter(e => ctx.affectedEntryIds!.includes(e.id)) : ctx.timetable.entries;
  for (const entry of entries) {
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
      if (entry.startPeriod + entry.durationPeriods > ctx.layout.gridSlotsPerDay) {
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

export function validateRooms(ctx: ValidationContext): Conflict[] {
  const conflicts: Conflict[] = [];
  const { timetable, config, affectedEntryIds } = ctx;
  if (!config.hardConstraints.enforceRoomCollision) return conflicts;

  const roomById = new Map(config.rooms.map((r) => [r.id, r]));
  const sectionById = new Map(config.sections.map((s) => [s.id, s]));
  const subjectById = new Map(config.subjects.map((s) => [s.id, s]));
  
  const roomSlots = new Map<string, Map<string, string[]>>();

  const entries = timetable.entries;

  for (const entry of entries) {
    if (!entry.roomId) continue;
    
    // Check Room Capacity and Eligibility only for affected entries
    const isAffected = !affectedEntryIds || affectedEntryIds.includes(entry.id);
    const room = roomById.get(entry.roomId);
    
    if (isAffected && room) {
      const section = sectionById.get(entry.sectionId);
      if (section && room.capacity < section.studentCount) {
        conflicts.push(conflict('ROOM_CAPACITY_EXCEEDED', 'ERROR', 'conflict.roomCapacityExceeded', { capacity: room.capacity, count: section.studentCount }, {
          entryIds: [entry.id],
          resolutionHints: ['Assign a room with larger capacity.']
        }));
      }

      const subject = subjectById.get(entry.subjectId);
      if (subject) {
        if (room.type !== 'GENERAL' && room.type !== subject.type) {
           conflicts.push(conflict('ROOM_NOT_ELIGIBLE', 'ERROR', 'conflict.roomNotEligible', { roomType: room.type, subjectType: subject.type }, {
             entryIds: [entry.id],
             resolutionHints: ['Assign a room that matches the subject type.']
           }));
        }
      }
    }

    for (let p = entry.startPeriod; p < entry.startPeriod + entry.durationPeriods; p++) {
      const rKey = `${entry.roomId}`;
      const slot = `${entry.dayIndex}:${p}`;
      const rMap = roomSlots.get(rKey) ?? new Map<string, string[]>();
      const existingR = rMap.get(slot);
      if (existingR) {
        // To avoid duplicate collisions, only push if one of the entries is affected
        const isCurrentAffected = isAffected || existingR.some(id => affectedEntryIds?.includes(id));
        if (isCurrentAffected) {
           conflicts.push(conflict('ROOM_TIME_CONFLICT', 'ERROR', 'conflict.roomConflict', { day: entry.dayIndex, period: p }, {
             dayIndex: entry.dayIndex,
             periodIndex: p,
             entryIds: [...existingR, entry.id],
             resolutionHints: ['Assign one of the entries to a different room.']
           }));
        }
      } else {
        rMap.set(slot, [entry.id]);
      }
      roomSlots.set(rKey, rMap);
    }
  }

  return conflicts;
}

export function validateBreaks(ctx: ValidationContext): Conflict[] {
  const conflicts: Conflict[] = [];
  const { timetable, config, affectedEntryIds, gridBreaks } = ctx;
  if (!config.hardConstraints.enforceBreaks) return conflicts;

  const entries = affectedEntryIds ? timetable.entries.filter((e) => affectedEntryIds.includes(e.id)) : timetable.entries;

  for (const entry of entries) {
    // Grid-coordinate spans (all-day columns + mapped day-specific overlays).
    for (const b of gridBreaks) {
      if (b.dayIndex !== null && b.dayIndex !== entry.dayIndex) continue;

      const bStart = b.startPeriod;
      const bEnd = b.startPeriod + b.durationPeriods;
      const eStart = entry.startPeriod;
      const eEnd = entry.startPeriod + entry.durationPeriods;

      if (Math.max(bStart, eStart) < Math.min(bEnd, eEnd)) {
        conflicts.push(conflict('BREAK_OVERLAP', 'ERROR', 'conflict.breakOverlap', { breakName: b.name }, {
          entryIds: [entry.id],
          dayIndex: entry.dayIndex,
          resolutionHints: ['Move the entry so it does not overlap with a break.']
        }));
      }
    }
  }

  return conflicts;
}

export function validateFatigueAndGaps(ctx: ValidationContext): Conflict[] {
  const conflicts: Conflict[] = [];
  const { timetable, config, affectedEntryIds } = ctx;
  const { maxConsecutiveTheory, maxGapsPerDay } = config.generationSettings;
  
  if (maxConsecutiveTheory === null && maxGapsPerDay === null) return conflicts;
  
  const subjectById = new Map(config.subjects.map((s) => [s.id, s]));

  // Evaluate per section, per day
  let sectionIdsToCheck: Set<string> | null = null;
  if (affectedEntryIds) {
    sectionIdsToCheck = new Set(timetable.entries.filter(e => affectedEntryIds.includes(e.id)).map(e => e.sectionId));
  } else {
    sectionIdsToCheck = new Set(config.sections.map(s => s.id));
  }

  for (const sectionId of sectionIdsToCheck) {
    for (let day = 0; day < config.workingDays.length; day++) {
      const dailyEntries = timetable.entries
        .filter(e => e.sectionId === sectionId && e.dayIndex === day)
        .sort((a, b) => a.startPeriod - b.startPeriod);
        
      if (dailyEntries.length === 0) continue;

      // Fatigue check
      if (maxConsecutiveTheory !== null) {
        let consecutiveCount = 0;
        let consecutiveIds: string[] = [];
        let prevEnd = -1;
        for (const entry of dailyEntries) {
          // A break column (e.g. lunch) between two sessions breaks the
          // consecutive-theory streak — the day is genuinely interrupted.
          if (prevEnd >= 0) {
            for (const bc of ctx.breakColumns) {
              if (bc >= prevEnd && bc < entry.startPeriod) {
                consecutiveCount = 0;
                consecutiveIds = [];
                break;
              }
            }
          }
          prevEnd = entry.startPeriod + entry.durationPeriods;
          const subject = subjectById.get(entry.subjectId);
          if (subject && subject.type === 'THEORY') {
            consecutiveCount++;
            consecutiveIds.push(entry.id);
            if (consecutiveCount > maxConsecutiveTheory) {
              // Only report if affected
              if (!affectedEntryIds || consecutiveIds.some(id => affectedEntryIds.includes(id))) {
                conflicts.push(conflict('FATIGUE_EXCEEDED', 'WARNING', 'conflict.fatigueExceeded', { count: consecutiveCount, limit: maxConsecutiveTheory }, {
                  entryIds: [...consecutiveIds],
                  sectionIds: [sectionId],
                  dayIndex: day,
                  resolutionHints: ['Insert a gap or a lab session to break up consecutive theory sessions.']
                }));
              }
            }
          } else {
            consecutiveCount = 0;
            consecutiveIds = [];
          }
        }
      }

      // Gap check
      if (maxGapsPerDay !== null) {
        let gaps = 0;
        for (let i = 0; i < dailyEntries.length - 1; i++) {
          const curr = dailyEntries[i];
          const next = dailyEntries[i + 1];
          const gapSize = next.startPeriod - (curr.startPeriod + curr.durationPeriods);
          
          if (gapSize > 0) {
            // Is it a break? Grid-coordinate spans (same frame as entries).
            let breakCoverage = 0;
            for (const b of ctx.gridBreaks) {
              if (b.dayIndex === null || b.dayIndex === day) {
                const bStart = b.startPeriod;
                const bEnd = b.startPeriod + b.durationPeriods;
                const gapStart = curr.startPeriod + curr.durationPeriods;
                const gapEnd = next.startPeriod;
                
                const overlapStart = Math.max(bStart, gapStart);
                const overlapEnd = Math.min(bEnd, gapEnd);
                if (overlapStart < overlapEnd) {
                  breakCoverage += (overlapEnd - overlapStart);
                }
              }
            }
            if (gapSize > breakCoverage) {
              gaps += (gapSize - breakCoverage);
            }
          }
        }

        if (gaps > maxGapsPerDay) {
          const entryIds = dailyEntries.map(e => e.id);
          if (!affectedEntryIds || entryIds.some(id => affectedEntryIds.includes(id))) {
            conflicts.push(conflict('EXCESSIVE_GAPS', 'WARNING', 'conflict.excessiveGaps', { count: gaps, limit: maxGapsPerDay }, {
              entryIds,
              sectionIds: [sectionId],
              dayIndex: day,
              resolutionHints: ['Compact the schedule to reduce gaps between sessions.']
            }));
          }
        }
      }
    }
  }

  return conflicts;
}
