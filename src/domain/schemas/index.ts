import { z } from 'zod';
import {
  CONFLICT_TYPES,
  EDIT_OPERATIONS,
  WORKING_DAYS,
} from '../enums';

/* ---------- Primitive schemas ---------- */

export const workingDaySchema = z.enum(WORKING_DAYS);
export const subjectTypeSchema = z.enum(['THEORY', 'LAB']);
export const departmentStatusSchema = z.enum(['DRAFT', 'READY', 'ARCHIVED']);
export const entrySourceSchema = z.enum(['GENERATED', 'MANUAL']);
export const conflictSeveritySchema = z.enum(['ERROR', 'WARNING']);
export const conflictTypeSchema = z.enum(CONFLICT_TYPES);
export const editOperationSchema = z.enum(EDIT_OPERATIONS);
export const timetableStatusSchema = z.enum([
  'EMPTY',
  'GENERATING',
  'GENERATED',
  'DRAFT',
  'VALID',
  'INVALID',
  'STALE',
  'CANCELLED',
  'FAILED',
]);

const isoString = z.string().min(1);

/* ---------- Entity schemas ---------- */

export const subjectRequirementSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  sessionsPerWeek: z.number().int().min(0),
});

export const sectionSchema = z.object({
  id: z.string(),
  departmentId: z.string(),
  name: z.string().min(1),
  year: z.number().int().min(1).max(8),
  semester: z.number().int().min(1).max(12),
  studentCount: z.number().int().min(0),
  subjectRequirements: z.array(subjectRequirementSchema),
  active: z.boolean(),
});

export const subjectSchema = z.object({
  id: z.string(),
  departmentId: z.string(),
  code: z.string().min(1),
  name: z.string().min(1),
  type: subjectTypeSchema,
  sessionsPerWeek: z.number().int().min(0),
  durationPeriods: z.number().int().min(1).max(3),
  eligibleFacultyIds: z.array(z.string()),
  eligibleSectionIds: z.array(z.string()),
  active: z.boolean(),
});

export const facultyAvailabilitySchema = z.object({
  dayIndex: z.number().int().min(0).max(6),
  startPeriod: z.number().int().min(0),
  durationPeriods: z.number().int().min(1),
});

export const facultySchema = z.object({
  id: z.string(),
  departmentId: z.string(),
  facultyCode: z.string().min(1),
  name: z.string().min(1),
  subjectIds: z.array(z.string()),
  sectionIds: z.array(z.string()),
  availability: z.array(facultyAvailabilitySchema),
  preferredSlots: z.array(facultyAvailabilitySchema),
  maxPeriodsPerDay: z.number().int().min(1).nullable(),
  maxPeriodsPerWeek: z.number().int().min(1).nullable(),
  active: z.boolean(),
});

export const departmentSchema = z.object({
  id: z.string(),
  code: z.string().min(1),
  name: z.string().min(1),
  workingDays: z.array(workingDaySchema).min(1),
  periodsPerDay: z.number().int().min(1).max(12),
  status: departmentStatusSchema,
  createdAt: isoString,
  updatedAt: isoString,
});

/* ---------- Timetable schemas ---------- */

export const timetableEntrySchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  subjectId: z.string(),
  facultyId: z.string(),
  dayIndex: z.number().int().min(0),
  startPeriod: z.number().int().min(0),
  durationPeriods: z.number().int().min(1).max(3),
  source: entrySourceSchema,
  revision: z.number().int().min(0),
});

export const configurationSnapshotSchema = z.object({
  fingerprint: z.string(),
  workingDays: z.array(workingDaySchema),
  periodsPerDay: z.number().int().min(1),
  sectionIds: z.array(z.string()),
  subjectRequirementCounts: z.record(z.number()),
});

export const conflictSchema = z.object({
  id: z.string(),
  type: conflictTypeSchema,
  severity: conflictSeveritySchema,
  messageKey: z.string(),
  messageParams: z.record(z.union([z.string(), z.number()])),
  dayIndex: z.number().int().nullable(),
  periodIndex: z.number().int().nullable(),
  entryIds: z.array(z.string()),
  facultyIds: z.array(z.string()),
  sectionIds: z.array(z.string()),
  subjectIds: z.array(z.string()),
  resolutionHints: z.array(z.string()),
});

export const validationResultSchema = z.object({
  isValid: z.boolean(),
  hardConflictCount: z.number().int().min(0),
  softViolationCount: z.number().int().min(0),
  conflicts: z.array(conflictSchema),
  warnings: z.array(conflictSchema),
  checkedAt: isoString,
  validatorVersion: z.string(),
});

export const generationMetricsSchema = z.object({
  durationMs: z.number().min(0),
  preprocessingMs: z.number().min(0),
  searchMs: z.number().min(0),
  exploredNodes: z.number().min(0),
  backtrackCount: z.number().min(0),
  candidateEvaluations: z.number().min(0),
  sessionsScheduled: z.number().min(0),
  finalScore: z.number().nullable(),
  seed: z.number(),
});

export const generationMetadataSchema = z.object({
  seed: z.number(),
  engineVersion: z.string(),
  constraintVersion: z.string(),
  generatedAt: isoString,
  configurationFingerprint: z.string(),
  metrics: generationMetricsSchema,
});

export const timetableSchema = z.object({
  id: z.string(),
  departmentId: z.string(),
  configurationSnapshot: configurationSnapshotSchema,
  entries: z.array(timetableEntrySchema),
  status: timetableStatusSchema,
  validationSummary: validationResultSchema.nullable(),
  generationMetadata: generationMetadataSchema.nullable(),
  revision: z.number().int().min(0),
  createdAt: isoString,
  updatedAt: isoString,
});

export const softConstraintWeightsSchema = z.object({
  subjectDistribution: z.number().min(0),
  sectionBalance: z.number().min(0),
  facultyBalance: z.number().min(0),
  gapReduction: z.number().min(0),
  labDistribution: z.number().min(0),
  preferenceSatisfaction: z.number().min(0),
});

export const generationSettingsSchema = z.object({
  seed: z.number().nullable(),
  maxSearchDurationMs: z.number().min(1000),
  maxExploredNodes: z.number().min(1000),
  maxBacktrackDepth: z.number().min(1).nullable(),
  maxSessionsPerSubjectPerDay: z.number().int().min(1).nullable(),
  maxLabSessionsPerSectionPerDay: z.number().int().min(1).nullable(),
  softWeights: softConstraintWeightsSchema,
});

export const timetableConfigurationSchema = z.object({
  workingDays: z.array(workingDaySchema).min(1),
  periodsPerDay: z.number().int().min(1).max(12),
  periodDefinitions: z.array(
    z.object({ index: z.number().int().min(0), label: z.string() }),
  ),
  sections: z.array(sectionSchema),
  subjects: z.array(subjectSchema),
  faculty: z.array(facultySchema),
  hardConstraints: z.object({
    enforceSectionCollision: z.boolean(),
    enforceFacultyCollision: z.boolean(),
    enforceLabAtomicity: z.boolean(),
    enforceRequirementCounts: z.boolean(),
  }),
  softWeights: softConstraintWeightsSchema,
  generationSettings: generationSettingsSchema,
});

/* ---------- Persisted workspace ---------- */

export const persistedWorkspacePayloadSchema = z.object({
  departments: z.array(departmentSchema),
  sections: z.array(sectionSchema),
  subjects: z.array(subjectSchema),
  faculty: z.array(facultySchema),
  timetables: z.array(timetableSchema),
  activeDepartmentId: z.string().nullable(),
  generationSettingsOverrides: z
    .record(
      z.object({
        maxSessionsPerSubjectPerDay: z.number().int().min(1).nullable().optional(),
        maxLabSessionsPerSectionPerDay: z.number().int().min(1).nullable().optional(),
        maxSearchDurationMs: z.number().int().min(1000).nullable().optional(),
        maxExploredNodes: z.number().int().min(1000).nullable().optional(),
      }),
    )
    .optional(),
});

export const persistedWorkspaceSchema = z.object({
  schemaVersion: z.number().int().min(1),
  applicationVersion: z.string(),
  createdAt: isoString,
  updatedAt: isoString,
  payload: persistedWorkspacePayloadSchema,
});
