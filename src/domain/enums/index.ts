/** Stable string-union enums with serialized values. */

export type SubjectType = 'THEORY' | 'LAB';
export type TimetableStatus =
  | 'EMPTY'
  | 'GENERATING'
  | 'GENERATED'
  | 'DRAFT'
  | 'VALID'
  | 'INVALID'
  | 'STALE'
  | 'CANCELLED'
  | 'FAILED';
export type DepartmentStatus = 'DRAFT' | 'READY' | 'ARCHIVED';
export type ConflictSeverity = 'ERROR' | 'WARNING';
export type EntrySource = 'GENERATED' | 'MANUAL';

export const CONFLICT_TYPES = [
  'SECTION_TIME_CONFLICT',
  'FACULTY_TIME_CONFLICT',
  'INVALID_SUBJECT',
  'INVALID_FACULTY',
  'INVALID_SECTION',
  'FACULTY_NOT_ELIGIBLE',
  'SUBJECT_NOT_APPLICABLE',
  'INVALID_DAY',
  'INVALID_PERIOD',
  'INVALID_DURATION',
  'LAB_NOT_CONSECUTIVE',
  'LAB_OUT_OF_BOUNDS',
  'MISSING_REQUIRED_SESSION',
  'EXCESS_REQUIRED_SESSION',
  'DUPLICATE_SESSION',
  'MISSING_FACULTY',
  'FACULTY_CAPACITY_EXCEEDED',
  'CONFIGURATION_MISMATCH',
  'STALE_TIMETABLE',
  'ROOM_TIME_CONFLICT',
  'ROOM_CAPACITY_EXCEEDED',
  'ROOM_NOT_ELIGIBLE',
  'BREAK_OVERLAP',
  'FATIGUE_EXCEEDED',
  'EXCESSIVE_GAPS',
  'POOR_SUBJECT_SPREAD',
] as const;

export type ConflictType = (typeof CONFLICT_TYPES)[number];

export const EDIT_OPERATIONS = [
  'MOVE_ENTRY',
  'SWAP_ENTRIES',
  'CHANGE_SUBJECT',
  'CHANGE_FACULTY',
  'CLEAR_ENTRY',
  'ADD_ENTRY',
  'REMOVE_ENTRY',
] as const;

export type EditOperation = (typeof EDIT_OPERATIONS)[number];

export type GenerationStatus =
  | 'IDLE'
  | 'VALIDATING'
  | 'PREPARING'
  | 'SEARCHING'
  | 'OPTIMIZING'
  | 'FINAL_VALIDATION'
  | 'COMPLETED'
  | 'FAILED'
  | 'IMPOSSIBLE'
  | 'CANCELLED'
  | 'TIMEOUT';

export type GenerationStage =
  | 'Validating configuration'
  | 'Preparing sessions'
  | 'Building constraints'
  | 'Searching schedule'
  | 'Optimizing schedule'
  | 'Running final validation';

export const WORKING_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;
export type WorkingDay = (typeof WORKING_DAYS)[number];
