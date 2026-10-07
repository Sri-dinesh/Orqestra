import { VALIDATOR_VERSION } from '../policies';
import { buildConfigurationSnapshot } from '../configuration/normalize';
import type {
  Conflict,
  Timetable,
  TimetableConfiguration,
  ValidationResult,
} from '../models';
import {
  validateCollisions,
  validateConfigurationConsistency,
  validateLaboratories,
  validateRequirements,
  validateStructureAndReferences,
  validateFacultyLimits,
  validateRooms,
  validateBreaks,
  validateFatigueAndGaps,
} from './rules';
import type { ValidationContext } from './rules';
import { buildGridLayout, toGridBreaks } from '../scheduler/grid-layout';

/**
 * Shared grid truth for one validation pass: the teaching→grid column layout
 * plus teaching-coordinate breaks converted to grid spans. Entries, conflicts
 * and availability windows all live in these grid coordinates.
 */
function buildGridContext(config: TimetableConfiguration): Pick<ValidationContext, 'layout' | 'gridBreaks' | 'breakColumns'> {
  const layout = buildGridLayout(config.periodsPerDay, config.breaks);
  const gridBreaks = toGridBreaks(layout, config.breaks, config.workingDays.length);
  const breakColumns = new Set<number>();
  layout.columns.forEach((col, g) => {
    if (col.kind === 'break') breakColumns.add(g);
  });
  return { layout, gridBreaks, breakColumns };
}

/**
 * Independent authoritative validator (§14.1).
 * A timetable may be marked VALID only when this returns isValid === true.
 */
export function validateTimetable(
  timetable: Timetable,
  config: TimetableConfiguration,
  currentSnapshot = buildConfigurationSnapshot(config),
): ValidationResult {
  const ctx: ValidationContext = { timetable, config, currentSnapshot, ...buildGridContext(config) };

  const conflicts: Conflict[] = [
    ...validateStructureAndReferences(ctx),
    ...validateCollisions(ctx),
    ...validateLaboratories(ctx),
    ...validateRequirements(ctx),
    ...validateConfigurationConsistency(ctx),
    ...validateFacultyLimits(ctx),
    ...validateRooms(ctx),
    ...validateBreaks(ctx),
    ...validateFatigueAndGaps(ctx),
  ];

  const hardConflicts = conflicts.filter((c) => c.severity === 'ERROR');

  return {
    isValid: hardConflicts.length === 0,
    hardConflictCount: hardConflicts.length,
    softViolationCount: 0,
    conflicts: hardConflicts,
    warnings: conflicts.filter((c) => c.severity === 'WARNING'),
    checkedAt: new Date().toISOString(),
    validatorVersion: VALIDATOR_VERSION,
  };
}

/**
 * Targeted validation for a single edit (§81): checks only the affected
 * entries, section and faculty. Cheap; full validation still runs after commit.
 */
export function validateEntryPlacement(
  timetable: Timetable,
  config: TimetableConfiguration,
  affectedEntryIds: string[],
): ValidationResult {
  const ctx: ValidationContext = { timetable, config, currentSnapshot: timetable.configurationSnapshot, affectedEntryIds, ...buildGridContext(config) };

  const conflicts: Conflict[] = [
    ...validateStructureAndReferences(ctx).filter((c) =>
      c.entryIds.some((id) => affectedEntryIds.includes(id)),
    ),
    ...validateCollisions(ctx).filter((c) =>
      c.entryIds.some((id) => affectedEntryIds.includes(id)),
    ),
    ...validateLaboratories(ctx).filter((c) =>
      c.entryIds.some((id) => affectedEntryIds.includes(id)),
    ),
    ...validateFacultyLimits(ctx).filter((c) =>
      c.entryIds.some((id) => affectedEntryIds.includes(id)),
    ),
    ...validateRooms(ctx).filter((c) =>
      c.entryIds.some((id) => affectedEntryIds.includes(id)),
    ),
    ...validateBreaks(ctx).filter((c) =>
      c.entryIds.some((id) => affectedEntryIds.includes(id)),
    ),
    ...validateFatigueAndGaps(ctx).filter((c) =>
      c.entryIds.some((id) => affectedEntryIds.includes(id)),
    ),
  ];
  const hardConflicts = conflicts.filter((c) => c.severity === 'ERROR');
  return {
    isValid: hardConflicts.length === 0,
    hardConflictCount: hardConflicts.length,
    softViolationCount: 0,
    conflicts: hardConflicts,
    warnings: [],
    checkedAt: new Date().toISOString(),
    validatorVersion: VALIDATOR_VERSION,
  };
}
