import { describe, expect, it } from 'vitest';
import { generateTimetable } from '@/domain/scheduler/engine';
import { validateTimetable } from '@/domain/validation/engine';
import { analyzeFeasibility } from '@/domain/scheduler/feasibility';
import { TimetableEditService } from '@/application/timetable-service';
import { StorageService } from '@/storage';
import { LocalStorageAdapter } from '@/storage/adapters/local-storage-adapter';
import { datasetMinimal } from '../fixtures/datasets';
import type { PersistedWorkspace } from '@/storage/workspace-document';

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

describe('integration: full workflow (§107)', () => {
  it('preflight → generate → validate → edit → undo-equivalent → export → reset → import → validate', () => {
    const ds = datasetMinimal();
    const seed = 777;

    // 1. preflight
    const feasibility = analyzeFeasibility(ds);
    expect(feasibility.verdict).toBe('READY');

    // 2-3. generate + validate
    const result = generateTimetable({
      department: ds.department,
      sections: ds.sections,
      subjects: ds.subjects,
      faculty: ds.faculty,
      config: ds.config,
      seed,
      maxDurationMs: 10_000,
      maxExploredNodes: 2_000_000,
      cancellation: { isCancelled: () => false },
    });
    expect(result.status).toBe('COMPLETED');
    expect(result.timetable).not.toBeNull();
    expect(result.validation?.isValid).toBe(true);

    const timetable = result.timetable!;
    expect(validateTimetable(timetable, ds.config).isValid).toBe(true);

    // 4. edit: move a theory entry to a free slot
    const editService = new TimetableEditService(ds.config);
    const theory = timetable.entries.find((e) => e.durationPeriods === 1)!;
    const freeDay = ds.department.workingDays.length - 1;
    const freePeriod = ds.department.periodsPerDay - 1;
    const outcome = editService.executeCommand(timetable, {
      operation: 'MOVE_ENTRY',
      payload: { entryId: theory.id, dayIndex: freeDay, startPeriod: freePeriod },
      affectedEntryIds: [theory.id],
      timestamp: new Date().toISOString(),
    });
    expect(outcome.status).toBe('COMMITTED');

    // 5. undo-equivalent: move it back
    const undoOutcome = editService.executeCommand(outcome.timetable!, {
      operation: 'MOVE_ENTRY',
      payload: { entryId: theory.id, dayIndex: theory.dayIndex, startPeriod: theory.startPeriod },
      affectedEntryIds: [theory.id],
      timestamp: new Date().toISOString(),
    });
    expect(undoOutcome.status).toBe('COMMITTED');
    expect(validateTimetable(undoOutcome.timetable!, ds.config).isValid).toBe(true);

    // 6. export / reset / import
    const adapter = new MemoryAdapter();
    const storage = new StorageService(adapter);
    storage.save(
      {
        departments: [ds.department],
        sections: ds.sections,
        subjects: ds.subjects,
        faculty: ds.faculty,
        timetables: [undoOutcome.timetable!],
        activeDepartmentId: ds.department.id,
      },
    );
    const json = storage.export();
    storage.reset();
    expect(storage.load().status).toBe('EMPTY');

    storage.import(json);
    const reloaded = storage.load();
    expect(reloaded.status).toBe('LOADED');
    const restored = reloaded.workspace!.payload.timetables[0];

    // 7. validate again after import
    expect(validateTimetable(restored, ds.config).isValid).toBe(true);
  });
});
