import { MigrationError } from '@/domain/errors';
import { APPLICATION_VERSION, SCHEMA_VERSION } from '@/domain/policies';
import type { PersistedWorkspace } from '../workspace-document';

type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * Ordered migrations. Migration N converts schema N-1 → N.
 * Example future entry:
 *   2: (d) => ({ ...d, payload: { ...d.payload, terms: [] } }),
 */
const MIGRATIONS: Record<number, MigrationFn> = {};

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
