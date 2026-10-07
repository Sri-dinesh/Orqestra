/** Core domain identifiers — always stable strings, never display names or indexes. */

export type DepartmentId = string;
export type SectionId = string;
export type SubjectId = string;
export type FacultyId = string;
export type TimetableId = string;
export type TimetableEntryId = string;
export type RequirementId = string;
export type SessionUnitId = string;
export type GenerationJobId = string;
export type RoomId = string;
export type BreakId = string;

export interface Identifiable {
  id: string;
}

let counter = 0;

/** Deterministic-ish unique ID generator suitable for browser and tests. */
export function generateId(prefix: string): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}_${rand}`;
}
