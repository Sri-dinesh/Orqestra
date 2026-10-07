import { MigrationError } from '@/domain/errors';
import { APPLICATION_VERSION, SCHEMA_VERSION } from '@/domain/policies';
import type { PersistedWorkspace } from '../workspace-document';

type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * Ordered migrations. Migration N converts schema N-1 → N.
 * Example future entry:
 *   2: (d) => ({ ...d, payload: { ...d.payload, terms: [] } }),
 */
const MIGRATIONS: Record<number, MigrationFn> = {
  /** v1 → v2: add timetable versioning (versionHistory defaults to []). */
  2: (d) => {
    const payload = (d['payload'] ?? d) as Record<string, unknown>;
    const timetables = Array.isArray(payload['timetables']) ? (payload['timetables'] as Record<string, unknown>[]) : [];
    return {
      ...d,
      payload: {
        ...payload,
        timetables: timetables.map((t) => ({ ...t, versionHistory: t['versionHistory'] ?? [] })),
      },
    };
  },
  /** v2 → v3: add the institution profile (collegeDetails, all-empty default). */
  3: (d) => {
    const payload = (d['payload'] ?? d) as Record<string, unknown>;
    return {
      ...d,
      payload: {
        ...payload,
        collegeDetails: payload['collegeDetails'] ?? {
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
        },
      },
    };
  },
  /**
   * v3 → v4: periods-per-day counts teaching periods only.
   * - Rooms/breaks default to [] when absent (breaks previously didn't persist).
   * - Each department sheds its enclosed all-day break durations from
   *   periodsPerDay, so usable capacity is unchanged.
   * - Break startPeriod values move from grid to teaching coordinates:
   *   all-day breaks shift left past earlier break columns, day-specific
   *   overlays shift past enclosed break columns. The rendered grid is
   *   identical, so stored entries, availability windows and conflicts stay
   *   valid without remapping.
   */
  4: (d) => {
    const payload = (d['payload'] ?? d) as Record<string, unknown>;
    const num = (v: unknown): number =>
      typeof v === 'number' && Number.isFinite(v) ? v : 0;
    const departments = (Array.isArray(payload['departments']) ? payload['departments'] : []) as Record<string, unknown>[];
    const rawBreaks = (Array.isArray(payload['breaks']) ? payload['breaks'] : []) as Record<string, unknown>[];

    const allDay = rawBreaks
      .map((b, i) => ({ b, i }))
      // eslint-disable-next-line eqeqeq -- stored JSON may omit dayIndex; treat missing as all-day
      .filter(({ b }) => b['dayIndex'] == null)
      .sort((x, y) => num(x.b['startPeriod']) - num(y.b['startPeriod']) || x.i - y.i);

    // Teaching-coordinate position per all-day break (stable order).
    const allDayPos = new Map<Record<string, unknown>, number>();
    let columnsBefore = 0;
    for (const { b } of allDay) {
      allDayPos.set(b, num(b['startPeriod']) - columnsBefore);
      columnsBefore += Math.max(0, num(b['durationPeriods']));
    }

    const migratedBreaks = rawBreaks.map((b) => {
      // eslint-disable-next-line eqeqeq -- see above
      if (b['dayIndex'] == null) {
        return { ...b, startPeriod: Math.max(0, allDayPos.get(b) ?? num(b['startPeriod'])) };
      }
      const s = num(b['startPeriod']);
      let shift = 0;
      for (const { b: a } of allDay) {
        const aStart = num(a['startPeriod']);
        if (aStart < s) shift += Math.min(Math.max(0, num(a['durationPeriods'])), s - aStart);
      }
      return { ...b, startPeriod: Math.max(0, s - shift) };
    });

    const migratedDepartments = departments.map((dept) => {
      const oldP = num(dept['periodsPerDay']);
      let enclosed = 0;
      for (const { b } of allDay) {
        if (num(b['startPeriod']) < oldP) enclosed += Math.max(0, num(b['durationPeriods']));
      }
      return { ...dept, periodsPerDay: Math.max(1, oldP - enclosed) };
    });

    return {
      ...d,
      payload: {
        ...payload,
        rooms: payload['rooms'] ?? [],
        breaks: migratedBreaks,
        departments: migratedDepartments,
      },
    };
  },
};

/** Run the migration chain old → current (§32). Returns null if unusable. */
export function migrateWorkspace(raw: Record<string, unknown>): PersistedWorkspace | null {
  const version = raw['schemaVersion'];
  if (typeof version !== 'number' || version < 1) {
    throw new MigrationError('Persisted data has no valid schema version.');
  }
  if (version > SCHEMA_VERSION) {
    throw new MigrationError(
      `Persisted schema version ${version} is newer than supported version ${SCHEMA_VERSION}.`,
    );
  }

  let data: Record<string, unknown> = raw;
  for (let v = version; v < SCHEMA_VERSION; v++) {
    const migration = MIGRATIONS[v + 1];
    if (!migration) {
      throw new MigrationError(`Missing migration from schema v${v} to v${v + 1}.`);
    }
    data = migration(data);
  }
  return finalize(data);
}

function finalize(data: Record<string, unknown>): PersistedWorkspace {
  return {
    schemaVersion: SCHEMA_VERSION,
    applicationVersion: APPLICATION_VERSION,
    createdAt:
      typeof data['createdAt'] === 'string' ? (data['createdAt'] as string) : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payload: (data['payload'] ?? data) as PersistedWorkspace['payload'],
  };
}
