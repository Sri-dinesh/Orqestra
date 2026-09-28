import type {
  ConfigurationSnapshot,
  Department,
  Faculty,
  Section,
  Subject,
  TimetableConfiguration,
} from '../models';
import type { WorkingDay } from '../enums';

/** Default duration derived from subject type. */
export function defaultDurationFor(type: Subject['type']): number {
  return type === 'LAB' ? 2 : 1;
}

/** Normalize user-entered subject values into a canonical record. */
export function normalizeSubject(input: Subject): Subject {
  return {
    ...input,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    durationPeriods: defaultDurationFor(input.type),
    eligibleFacultyIds: dedupe(input.eligibleFacultyIds),
    eligibleSectionIds: dedupe(input.eligibleSectionIds),
  };
}

export function normalizeFaculty(input: Faculty): Faculty {
  return {
    ...input,
    facultyCode: input.facultyCode.trim().toUpperCase(),
    name: input.name.trim(),
    subjectIds: dedupe(input.subjectIds),
    sectionIds: dedupe(input.sectionIds),
  };
}

export function normalizeDepartment(input: Department): Department {
  return {
    ...input,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    workingDays: dedupe(input.workingDays),
    periodsPerDay: Math.max(1, Math.min(12, Math.floor(input.periodsPerDay))),
  };
}

/** Stable JSON stringification with sorted object keys for fingerprinting. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

/** Simple deterministic 32-bit string hash (FNV-1a style). */
export function hashString(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Compute the scheduling-relevant configuration fingerprint.
 * Includes only data that materially affects scheduling (§111).
 */
export function computeConfigurationFingerprint(
  config: TimetableConfiguration,
): string {
  const relevant = {
    workingDays: [...config.workingDays].sort(),
    periodsPerDay: config.periodsPerDay,
    sections: config.sections
      .filter((s) => s.active)
      .map((s) => ({ id: s.id, reqs: sortedReqs(s) }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    subjects: config.subjects
      .filter((s) => s.active)
      .map((s) => ({
        id: s.id,
        type: s.type,
        duration: s.durationPeriods,
        sections: [...s.eligibleSectionIds].sort(),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    faculty: config.faculty
      .filter((f) => f.active)
      .map((f) => ({
        id: f.id,
        subjects: [...f.subjectIds].sort(),
        maxWeek: f.maxPeriodsPerWeek,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
  return hashString(stableStringify(relevant));
}

function sortedReqs(s: Section): Array<{ subjectId: string; n: number }> {
  return s.subjectRequirements
    .map((r) => ({ subjectId: r.subjectId, n: r.sessionsPerWeek }))
    .sort((a, b) => a.subjectId.localeCompare(b.subjectId));
}

/** Build the canonical snapshot stored with a generated timetable (§60). */
export function buildConfigurationSnapshot(
  config: TimetableConfiguration,
): ConfigurationSnapshot {
  const subjectRequirementCounts: Record<string, number> = {};
  for (const section of config.sections) {
    if (!section.active) continue;
    for (const req of section.subjectRequirements) {
      const key = `${section.id}:${req.subjectId}`;
      subjectRequirementCounts[key] = req.sessionsPerWeek;
    }
  }
  return {
    fingerprint: computeConfigurationFingerprint(config),
    workingDays: [...config.workingDays].sort(),
    periodsPerDay: config.periodsPerDay,
    sectionIds: config.sections
      .filter((s) => s.active)
      .map((s) => s.id)
      .sort(),
    subjectRequirementCounts,
  };
}

/** Compare snapshots to detect stale timetables (H12). */
export function isSnapshotCompatible(
  timetableSnapshot: ConfigurationSnapshot,
  currentSnapshot: ConfigurationSnapshot,
): boolean {
  return timetableSnapshot.fingerprint === currentSnapshot.fingerprint;
}

function dedupe<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export type { WorkingDay };
