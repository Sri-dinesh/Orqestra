import { describe, expect, it, beforeEach } from 'vitest';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import type { Timetable } from '@/domain/models';

describe('timetable deletion in workspace store', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().replaceAll({
      departments: [],
      sections: [],
      subjects: [],
      faculty: [],
      timetables: [],
      rooms: [],
      breaks: [],
      activeDepartmentId: null,
    });
  });

  it('removes a timetable by id and sets department status back to READY', () => {
    const store = useWorkspaceStore.getState();
    const dept = store.addDepartment({
      code: 'CSE',
      name: 'Computer Science',
      workingDays: ['MONDAY', 'TUESDAY'],
      periodsPerDay: 6,
    });
    store.updateDepartment(dept.id, { status: 'READY' });

    const mockTimetable: Timetable = {
      id: 'tt_1',
      departmentId: dept.id,
      configurationSnapshot: {} as any,
      entries: [],
      status: 'VALID',
      validationSummary: {
        isValid: true,
        conflicts: [],
        hardConflictCount: 0,
        softViolationCount: 0,
        warnings: [],
        checkedAt: new Date().toISOString(),
        validatorVersion: '1.0',
      },
      generationMetadata: null,
      versionHistory: [],
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.upsertTimetable(mockTimetable);

    expect(useWorkspaceStore.getState().timetables).toHaveLength(1);
    expect(useWorkspaceStore.getState().departments[0].status).toBe('READY');

    // Remove the timetable
    useWorkspaceStore.getState().removeTimetable('tt_1');

    const state = useWorkspaceStore.getState();
    expect(state.timetables).toHaveLength(0);
    expect(state.departments[0].status).toBe('READY');
  });

  it('removes a timetable by departmentId', () => {
    const store = useWorkspaceStore.getState();
    const dept = store.addDepartment({
      code: 'ECE',
      name: 'Electronics',
      workingDays: ['MONDAY', 'TUESDAY'],
      periodsPerDay: 6,
    });

    const mockTimetable: Timetable = {
      id: 'tt_2',
      departmentId: dept.id,
      configurationSnapshot: {} as any,
      entries: [],
      status: 'VALID',
      validationSummary: {
        isValid: true,
        conflicts: [],
        hardConflictCount: 0,
        softViolationCount: 0,
        warnings: [],
        checkedAt: new Date().toISOString(),
        validatorVersion: '1.0',
      },
      generationMetadata: null,
      versionHistory: [],
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.upsertTimetable(mockTimetable);
    expect(useWorkspaceStore.getState().timetables).toHaveLength(1);

    useWorkspaceStore.getState().removeTimetable(dept.id);
    expect(useWorkspaceStore.getState().timetables).toHaveLength(0);
  });
});
