import {
  persistedWorkspaceSchema,
  timetableConfigurationSchema,
} from '@/domain/schemas';
import { ImportError, ExportError, MigrationError } from '@/domain/errors';
import { APPLICATION_VERSION, SCHEMA_VERSION } from '@/domain/policies';
import type { z } from 'zod';
import type { PersistedWorkspace, PersistedWorkspacePayload } from './workspace-document';
import { LocalStorageAdapter } from './adapters/local-storage-adapter';
import type { StorageAdapter } from './adapters/types';
import { migrateWorkspace } from './migrations';

export interface LoadOutcome {
  status: 'LOADED' | 'EMPTY' | 'RECOVERED' | 'CORRUPT';
  workspace: PersistedWorkspace | null;
  rawBackup: string | null;
  message: string | null;
}

/**
 * StorageService (§21): save / load / import / export / reset / migrate.
 * Deserialization pipeline (§33): parse → migrate → schema validation → normalize.
 */
export class StorageService {
  constructor(private adapter: StorageAdapter = new LocalStorageAdapter()) {}

  load(): LoadOutcome {
    const raw = this.adapter.getRawPayload();
    if (raw === null) {
      return { status: 'EMPTY', workspace: null, rawBackup: null, message: null };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        status: 'CORRUPT',
        workspace: null,
        rawBackup: raw,
        message: 'Workspace data is not valid JSON. Recovery required.',
      };
    }

    // Migrate if old schema
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'schemaVersion' in parsed &&
      (parsed as Record<string, unknown>)['schemaVersion'] !== SCHEMA_VERSION
    ) {
      try {
        parsed = migrateWorkspace(parsed as Record<string, unknown>);
      } catch (error) {
        return {
          status: 'CORRUPT',
          workspace: null,
          rawBackup: raw,
          message: error instanceof MigrationError ? error.message : 'Migration failed.',
        };
      }
    }

    const result = persistedWorkspaceSchema.safeParse(parsed);
    if (!result.success) {
      return {
        status: 'CORRUPT',
        workspace: null,
        rawBackup: raw,
        message: `Workspace failed validation: ${result.error.issues[0]?.message ?? 'unknown'}`,
      };
    }
    return { status: 'LOADED', workspace: result.data as PersistedWorkspace, rawBackup: null, message: null };
  }

  save(payload: PersistedWorkspacePayload, createdAt?: string): void {
    const existing = this.adapter.loadWorkspace();
    const doc: PersistedWorkspace = {
      schemaVersion: SCHEMA_VERSION,
      applicationVersion: APPLICATION_VERSION,
      createdAt: createdAt ?? existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload,
    };
    this.adapter.saveWorkspace(doc);
  }

  reset(): void {
    this.adapter.clearWorkspace();
  }

  export(): string {
    const outcome = this.load();
    if (!outcome.workspace) {
      throw new ExportError('No workspace data available to export.');
    }
    return JSON.stringify(outcome.workspace, null, 2);
  }

  /** Validate imported JSON; returns the parsed document for preview/confirmation (§90). */
  parseImport(json: string): PersistedWorkspace {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new ImportError('Import file is not valid JSON.');
    }
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'schemaVersion' in parsed &&
      (parsed as Record<string, unknown>)['schemaVersion'] !== SCHEMA_VERSION
    ) {
      try {
        parsed = migrateWorkspace(parsed as Record<string, unknown>);
      } catch (error) {
        throw new ImportError(
          error instanceof MigrationError ? error.message : 'Import migration failed.',
        );
      }
    }
    const result = persistedWorkspaceSchema.safeParse(parsed);
    if (!result.success) {
      throw new ImportError(
        `Import failed schema validation: ${result.error.issues[0]?.message ?? 'unknown'}`,
      );
    }
    return result.data as PersistedWorkspace;
  }

  import(json: string): PersistedWorkspace {
    const doc = this.parseImport(json);
    this.adapter.saveWorkspace(doc);
    return doc;
  }

  /** Validate a full TimetableConfiguration crossing a trust boundary. */
  validateConfigurationPayload(config: unknown): z.infer<typeof timetableConfigurationSchema> {
    return timetableConfigurationSchema.parse(config);
  }
}
