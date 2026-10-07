import { beforeEach, describe, expect, it } from 'vitest';
import { StorageService } from '@/storage';
import { LocalStorageAdapter } from '@/storage/adapters/local-storage-adapter';
import { datasetMinimal } from '../fixtures/datasets';
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import { generateId } from '@/domain/models/ids';
import type { PersistedWorkspace } from '@/storage/workspace-document';

// Simple in-memory localStorage for tests
class MemoryAdapter extends LocalStorageAdapter {
  private store = new Map<string, string>();
  getRawPayload(): string | null {
    return this.store.get('wts:v1:workspace') ?? null;
  }
  saveWorkspace(workspace: PersistedWorkspace): void {
    this.store.set('wts:v1:workspace', JSON.stringify(workspace));
  }
  clearWorkspace(): void {
    this.store.delete('wts:v1:workspace');
  }
  setRaw(raw: string): void {
    this.store.set('wts:v1:workspace', raw);
  }
}

function makeWorkspace() {
  const ds = datasetMinimal();
  const payload = {
    departments: [ds.department],
    sections: ds.sections,
    subjects: ds.subjects,
    faculty: ds.faculty,
    timetables: [
      {
        id: generateId('tt'),
        departmentId: ds.department.id,
        configurationSnapshot: buildConfigurationSnapshot(ds.config),
        entries: [],
        status: 'EMPTY' as const,
        validationSummary: null,
        generationMetadata: null,
        revision: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    activeDepartmentId: ds.department.id,
  };
  return { ds, payload };
}

describe('storage service', () => {
  let adapter: MemoryAdapter;
  let service: StorageService;

  beforeEach(() => {
    adapter = new MemoryAdapter();
    service = new StorageService(adapter);
  });

  it('round-trips save/load', () => {
    const { payload } = makeWorkspace();
    service.save(payload);
    const outcome = service.load();
    expect(outcome.status).toBe('LOADED');
    expect(outcome.workspace?.payload.departments[0].code).toBe('CSE');
  });

  it('returns EMPTY for missing data', () => {
    expect(service.load().status).toBe('EMPTY');
  });

  it('recovers from corrupted JSON without throwing', () => {
    adapter.setRaw('{not json');
    const outcome = service.load();
    expect(outcome.status).toBe('CORRUPT');
    expect(outcome.rawBackup).toBe('{not json');
  });

  it('recovers from schema-invalid payloads', () => {
    adapter.setRaw(JSON.stringify({ schemaVersion: 1, garbage: true }));
    expect(service.load().status).toBe('CORRUPT');
  });

  it('migrates old schema versions via the chain', () => {
    const { payload } = makeWorkspace();
    const raw = { schemaVersion: 1, applicationVersion: '0.9.0', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), payload };
    adapter.setRaw(JSON.stringify(raw));
    // v1 is current; no migration needed — this only verifies acceptance
    const outcome = service.load();
    expect(outcome.status).toBe('LOADED');
  });

  it('rejects newer schema versions', () => {
    const { payload } = makeWorkspace();
    adapter.setRaw(JSON.stringify({ schemaVersion: 99, payload }));
    expect(service.load().status).toBe('CORRUPT');
  });

  it('migrates v3 teaching-unaware grids to teaching-period counts (v4)', () => {
    const { payload } = makeWorkspace();
    // Old semantics: 7 grid slots including lunch at grid index 3.
    const v3 = {
      schemaVersion: 3,
      applicationVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: {
        ...payload,
        departments: [{ ...payload.departments[0], periodsPerDay: 7 }],
        breaks: [
          { id: 'brk_lunch', name: 'Lunch Break', dayIndex: null, startPeriod: 3, durationPeriods: 1 },
          { id: 'brk_asm', name: 'Assembly', dayIndex: 1, startPeriod: 5, durationPeriods: 1 },
        ],
      },
    };
    adapter.setRaw(JSON.stringify(v3));
    const outcome = service.load();
    expect(outcome.status).toBe('LOADED');
    const migrated = outcome.workspace!;
    expect(migrated.schemaVersion).toBe(4);
    // Lunch is excluded from the count; its column stays 4th.
    expect(migrated.payload.departments[0].periodsPerDay).toBe(6);
    expect(migrated.payload.breaks).toMatchObject([
      { id: 'brk_lunch', startPeriod: 3 },
      // Assembly sat on old-grid slot 5 (past one lunch column) → teaching slot 4.
      { id: 'brk_asm', startPeriod: 4 },
    ]);
    expect(migrated.payload.rooms).toEqual([]);
  });

  it('exports and imports the workspace', () => {
    const { payload } = makeWorkspace();
    service.save(payload);
    const json = service.export();
    service.reset();
    expect(service.load().status).toBe('EMPTY');
    const doc = service.parseImport(json);
    expect(doc.payload.departments.length).toBe(1);
    service.import(json);
    expect(service.load().status).toBe('LOADED');
  });

  it('throws ImportError for invalid import payloads', () => {
    expect(() => service.parseImport('nope')).toThrow();
  });
});
