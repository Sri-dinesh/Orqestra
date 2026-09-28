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
} from './rules';
import type { ValidationContext } from './rules';

/**
 * Independent authoritative validator (§14.1).
 * A timetable may be marked VALID only when this returns isValid === true.
 */
export function validateTimetable(
  timetable: Timetable,
  config: TimetableConfiguration,
  currentSnapshot = buildConfigurationSnapshot(config),
): ValidationResult {
  const ctx: ValidationContext = { timetable, config, currentSnapshot };

  const conflicts: Conflict[] = [
    ...validateStructureAndReferences(ctx),
    ...validateCollisions(ctx),
    ...validateLaboratories(ctx),
    ...validateRequirements(ctx),
    ...validateConfigurationConsistency(ctx),
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
  const ctx: ValidationContext = { timetable, config, currentSnapshot: timetable.configurationSnapshot };

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
