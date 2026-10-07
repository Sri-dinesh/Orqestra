/** Core domain entities (source of truth for structure; see schemas for runtime validation). */

import type {
  DepartmentId,
  FacultyId,
  RequirementId,
  SectionId,
  SubjectId,
  TimetableEntryId,
  RoomId,
  BreakId,
} from './ids';
import type {
  ConflictSeverity,
  ConflictType,
  DepartmentStatus,
  EntrySource,
  SubjectType,
  TimetableStatus,
  WorkingDay,
} from '../enums';

/* ---------- Department / Section / Subject / Faculty ---------- */

/**
 * Workspace-level institution profile. Purely descriptive metadata — it does
 * not participate in scheduling, validation, or the configuration fingerprint.
 * All fields optional so an empty workspace stays unannotated.
 */
export interface CollegeDetails {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  academicYear: string;
  logoDataUrl: string;
}

export const EMPTY_COLLEGE_DETAILS: CollegeDetails = {
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  website: '',
  contactEmail: '',
  contactPhone: '',
  academicYear: '',
  logoDataUrl: '',
};

/** Wall-clock time range of one teaching period, free text (e.g. "9:10 AM"). */
export interface PeriodTiming {
  start: string;
  end: string;
}

export interface Department {
  id: DepartmentId;
  code: string;
  name: string;
  workingDays: WorkingDay[];
  /** TEACHING periods per day. Breaks (e.g. lunch) add extra grid columns and are never counted here. */
  periodsPerDay: number;
  /** Optional wall-clock times per teaching period (index-aligned, may be partial). */
  periodTimings?: PeriodTiming[];
  /** Official timetable header: "With effect from" date (free text). */
  effectiveFrom?: string;
  /** Mentor block printed on official exports (free text). */
  mentors?: string;
  status: DepartmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: SectionId;
  departmentId: DepartmentId;
  name: string;
  year: number;
  semester: number;
  studentCount: number;
  subjectRequirements: SubjectRequirement[];
  /** Homeroom shown on official exports (e.g. "1020"). */
  roomNo?: string;
  /** Class advisor name shown on official exports. */
  classAdvisor?: string;
  active: boolean;
}

export interface SubjectRequirement {
  id: RequirementId;
  subjectId: SubjectId;
  sessionsPerWeek: number;
}

export interface Subject {
  id: SubjectId;
  departmentId: DepartmentId;
  code: string;
  name: string;
  type: SubjectType;
  /** Official course code shown on exports (e.g. "A8519"). */
  courseCode?: string;
  sessionsPerWeek: number;
  durationPeriods: number;
  eligibleFacultyIds: FacultyId[];
  eligibleSectionIds: SectionId[];
  active: boolean;
}

export interface FacultyAvailability {
  dayIndex: number;
  /** Grid-coordinate start slot (includes break columns; lunch is never teachable anyway). */
  startPeriod: number;
  durationPeriods: number;
}

export interface Faculty {
  id: FacultyId;
  departmentId: DepartmentId;
  facultyCode: string;
  name: string;
  subjectIds: SubjectId[];
  sectionIds: SectionId[];
  /** Optional blocked-out periods. Empty = available everywhere. */
  availability: FacultyAvailability[];
  preferredSlots: FacultyAvailability[];
  maxPeriodsPerDay: number | null;
  maxPeriodsPerWeek: number | null;
  active: boolean;
}

export interface Room {
  id: RoomId;
  departmentId: DepartmentId;
  code: string;
  name: string;
  capacity: number;
  type: SubjectType | 'GENERAL';
  active: boolean;
}

export interface Break {
  id: BreakId;
  name: string;
  dayIndex: number | null; // null means everyday
  /**
   * Position in TEACHING coordinates: "after this many teaching periods"
   * (0 = first column, teachingPerDay = end of day). All-day breaks insert
   * extra grid columns at this position; day-specific breaks instead block
   * that teaching range on their day so the grid stays rectangular.
   */
  startPeriod: number;
  durationPeriods: number;
  /** Optional wall-clock display times (free text, e.g. "12:50 PM"). */
  startTime?: string;
  endTime?: string;
}

/* ---------- Configuration ---------- */

export interface PeriodDefinition {
  index: number;
  label: string;
}

export interface HardConstraintPolicy {
  /** All hard constraints are mandatory in V1; flags exist for future relaxation. */
  enforceSectionCollision: boolean;
  enforceFacultyCollision: boolean;
  enforceLabAtomicity: boolean;
  enforceRequirementCounts: boolean;
  enforceRoomCollision: boolean;
  enforceBreaks: boolean;
}

export interface SoftConstraintWeights {
  subjectDistribution: number;
  sectionBalance: number;
  facultyBalance: number;
  gapReduction: number;
  labDistribution: number;
  preferenceSatisfaction: number;
}

export interface GenerationSettings {
  seed: number | null;
  maxSearchDurationMs: number;
  maxExploredNodes: number;
  maxBacktrackDepth: number | null;
  /** Soft cap: avoid >N sessions of the same subject for a section on one day. */
  maxSessionsPerSubjectPerDay: number | null;
  /** Soft cap: avoid >N laboratory blocks for a section on one day. */
  maxLabSessionsPerSectionPerDay: number | null;
  maxConsecutiveTheory: number | null;
  maxGapsPerDay: number | null;
  softWeights: SoftConstraintWeights;
}

export interface TimetableConfiguration {
  workingDays: WorkingDay[];
  periodsPerDay: number;
  periodDefinitions: PeriodDefinition[];
  sections: Section[];
  subjects: Subject[];
  faculty: Faculty[];
  rooms: Room[];
  breaks: Break[];
  hardConstraints: HardConstraintPolicy;
  softWeights: SoftConstraintWeights;
  generationSettings: GenerationSettings;
}

/* ---------- Timetable ---------- */

export interface TimetableEntry {
  id: TimetableEntryId;
  sectionId: SectionId;
  subjectId: SubjectId;
  facultyId: FacultyId;
  roomId: RoomId | null;
  dayIndex: number;
  /** 0-based start slot in GRID coordinates (includes break columns). */
  startPeriod: number;
  durationPeriods: number;
  source: EntrySource;
  revision: number;
}

export interface ConfigurationSnapshot {
  fingerprint: string;
  workingDays: WorkingDay[];
  periodsPerDay: number;
  sectionIds: SectionId[];
  subjectRequirementCounts: Record<string, number>;
}

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  messageKey: string;
  messageParams: Record<string, string | number>;
  dayIndex: number | null;
  /** Grid-coordinate slot (includes break columns). */
  periodIndex: number | null;
  entryIds: string[];
  facultyIds: string[];
  sectionIds: string[];
  subjectIds: string[];
  resolutionHints: string[];
}

export interface ValidationResult {
  isValid: boolean;
  hardConflictCount: number;
  softViolationCount: number;
  conflicts: Conflict[];
  warnings: Conflict[];
  checkedAt: string;
  validatorVersion: string;
}

export interface GenerationMetrics {
  durationMs: number;
  preprocessingMs: number;
  searchMs: number;
  exploredNodes: number;
  backtrackCount: number;
  candidateEvaluations: number;
  sessionsScheduled: number;
  finalScore: number | null;
  seed: number;
}

export interface GenerationMetadata {
  seed: number;
  engineVersion: string;
  constraintVersion: string;
  generatedAt: string;
  configurationFingerprint: string;
  metrics: GenerationMetrics;
}

export type GenerationResultStatus =
  | 'COMPLETED'
  | 'IMPOSSIBLE'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'FAILED';

export interface GenerationDiagnostic {
  code: string;
  message: string;
  sectionIds: string[];
  subjectIds: string[];
  facultyIds: string[];
  suggestions: string[];
}

export interface GenerationResult {
  status: GenerationResultStatus;
  timetable: Timetable | null;
  validation: ValidationResult | null;
  diagnostics: GenerationDiagnostic[];
  metrics: GenerationMetrics | null;
  metadata: GenerationMetadata | null;
}

export interface BaseTimetable {
  id: string;
  departmentId: DepartmentId;
  configurationSnapshot: ConfigurationSnapshot;
  entries: TimetableEntry[];
  generationMetadata: GenerationMetadata | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
  versionHistory?: TimetableVersion[];
}

export interface ValidTimetable extends BaseTimetable {
  status: 'VALID';
  validationSummary: ValidationResult & { isValid: true };
}

export interface InvalidTimetable extends BaseTimetable {
  status: 'INVALID';
  validationSummary: ValidationResult & { isValid: false };
}

export interface StaleTimetable extends BaseTimetable {
  status: 'STALE';
  validationSummary: ValidationResult | null;
}

export interface OtherTimetable extends BaseTimetable {
  status: Exclude<TimetableStatus, 'VALID' | 'INVALID' | 'STALE'>;
  validationSummary: ValidationResult | null;
}

export type Timetable = ValidTimetable | InvalidTimetable | StaleTimetable | OtherTimetable;

/** Why a version snapshot was recorded. */
export type TimetableVersionOrigin = 'GENERATED' | 'EDIT' | 'RESTORE';

/**
 * Immutable snapshot of a timetable state at a point in time.
 * Entries are deep-copied so later edits never mutate history.
 */
export interface TimetableVersion {
  /** Monotonic per-timetable version number (matches the timetable revision when recorded). */
  version: number;
  origin: TimetableVersionOrigin;
  recordedAt: string;
  entries: TimetableEntry[];
  status: TimetableStatus;
  validationSummary: ValidationResult | null;
  generationMetadata: GenerationMetadata | null;
  /** Human-readable note, e.g. what edit produced this version. */
  label: string;
}
