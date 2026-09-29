import type { Timetable, TimetableVersion, TimetableVersionOrigin } from '@/domain/models';

/** Maximum snapshots retained per timetable (oldest are dropped first). */
export const MAX_VERSIONS_PER_TIMETABLE = 20;

/**
 * Create an immutable snapshot of the timetable's current state.
 * Entries and validation summary are deep-copied so later edits
 * never mutate history.
 */
export function captureVersion(
  timetable: Timetable,
  origin: TimetableVersionOrigin,
  label: string,
): TimetableVersion {
  return {
    version: timetable.revision,
    origin,
    recordedAt: new Date().toISOString(),
    entries: timetable.entries.map((e) => ({ ...e })),
    status: timetable.status,
    validationSummary: timetable.validationSummary
      ? { ...timetable.validationSummary }
      : null,
    generationMetadata: timetable.generationMetadata
      ? { ...timetable.generationMetadata }
      : null,
    label,
  };
}

/**
 * Append a snapshot to the timetable's version history (newest last),
 * capping the number of retained versions.
 */
export function withVersion(
  timetable: Timetable,
  origin: TimetableVersionOrigin,
  label: string,
): Timetable {
  const history = [...(timetable.versionHistory ?? []), captureVersion(timetable, origin, label)];
  const trimmed = history.slice(-MAX_VERSIONS_PER_TIMETABLE);
  return { ...timetable, versionHistory: trimmed };
}
