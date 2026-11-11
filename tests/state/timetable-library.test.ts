import { beforeEach, describe, expect, it } from 'vitest';
import type { Timetable } from '@/domain/models';
import type { WorkingDay } from '@/domain/enums';
import {
  selectTimetableForDepartment,
  useWorkspaceStore,
} from '@/state/stores/workspace-store';

const department = {
  id: 'dept_cse',
  code: 'CSE',
  name: 'Computer Science',
  workingDays: ['MONDAY'] as WorkingDay[],
  periodsPerDay: 6,
  status: 'READY' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function timetable(id: string, name: string): Timetable {
  return {
    id,
    departmentId: department.id,
    name,
    description: `${name} description`,
    configurationSnapshot: {
      fingerprint: id,
      workingDays: ['MONDAY'] as WorkingDay[],
      periodsPerDay: 6,
      sectionIds: [],
      subjectRequirementCounts: {},
    },
    entries: [],
    generationMetadata: null,
    revision: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    status: 'DRAFT',
    validationSummary: null,
    versionHistory: [],
  };
}

describe('department timetable library', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      departments: [department],
      sections: [],
      subjects: [],
      faculty: [],
      timetables: [],
      rooms: [],
      breaks: [],
      activeDepartmentId: department.id,
      activeTimetableId: null,
      generationSettingsOverrides: {},
    });
  });

  it('keeps multiple timetables in the same department and selects the newest one', () => {
    const first = timetable('tt_first', 'Odd semester');
    const second = timetable('tt_second', 'Even semester');

    useWorkspaceStore.getState().upsertTimetable(first);
    useWorkspaceStore.getState().upsertTimetable(second);

    expect(useWorkspaceStore.getState().timetables).toHaveLength(2);
    expect(selectTimetableForDepartment(useWorkspaceStore.getState(), department.id)?.id).toBe('tt_second');
  });

  it('allows choosing and editing a saved timetable without changing its siblings', () => {
    const first = timetable('tt_first', 'Odd semester');
    const second = timetable('tt_second', 'Even semester');
    const state = useWorkspaceStore.getState();
    state.upsertTimetable(first);
    state.upsertTimetable(second);
    state.setActiveTimetable(first.id);
    state.updateTimetable(first.id, { name: 'Main classroom schedule', description: 'Published schedule' });

    const next = useWorkspaceStore.getState();
    expect(selectTimetableForDepartment(next, department.id)?.name).toBe('Main classroom schedule');
    expect(next.timetables.find((item) => item.id === first.id)?.name).toBe('Main classroom schedule');
    expect(next.timetables.find((item) => item.id === second.id)?.name).toBe('Even semester');
  });

  it('removes only the selected timetable when removing by timetable id', () => {
    const first = timetable('tt_first', 'Odd semester');
    const second = timetable('tt_second', 'Even semester');
    const state = useWorkspaceStore.getState();
    state.upsertTimetable(first);
    state.upsertTimetable(second);
    state.setActiveTimetable(second.id);
    state.removeTimetable(second.id);

    const next = useWorkspaceStore.getState();
    expect(next.timetables.map((item) => item.id)).toEqual(['tt_first']);
    expect(next.activeTimetableId).toBe('tt_first');
  });

  it('duplicates a timetable with a fresh id, "Copy of" prefix, revision 1, and clean version history', () => {
    const original = timetable('tt_original', 'Odd semester');
    const state = useWorkspaceStore.getState();
    state.upsertTimetable(original);

    const clone = state.duplicateTimetable('tt_original');

    const next = useWorkspaceStore.getState();
    expect(clone).not.toBeNull();
    expect(clone!.id).not.toBe('tt_original');
    expect(clone!.name).toBe('Copy of Odd semester');
    expect(clone!.status).toBe('DRAFT');
    expect(clone!.revision).toBe(1);
    expect(clone!.versionHistory).toHaveLength(0);
    expect(next.timetables).toHaveLength(2);
    expect(next.activeTimetableId).toBe(clone!.id);
  });

  it('returns null when duplicating a non-existent timetable id', () => {
    const result = useWorkspaceStore.getState().duplicateTimetable('tt_does_not_exist');
    expect(result).toBeNull();
  });

  it('removes a department and every department-owned resource', () => {
    const state = useWorkspaceStore.getState();
    state.addRoom({
      departmentId: department.id,
      code: 'LAB-1',
      name: 'Lab 1',
      capacity: 30,
      type: 'LAB',
    });
    state.addBreak({
      departmentId: department.id,
      name: 'Lunch',
      dayIndex: null,
      startPeriod: 3,
      durationPeriods: 1,
    });
    state.setGenerationSettingsOverrides(department.id, { maxGapsPerDay: 1 });

    state.removeDepartment(department.id);

    const next = useWorkspaceStore.getState();
    expect(next.departments).toHaveLength(0);
    expect(next.rooms).toHaveLength(0);
    expect(next.breaks).toHaveLength(0);
    expect(next.generationSettingsOverrides).toEqual({});
    expect(next.activeDepartmentId).toBeNull();
    expect(next.activeTimetableId).toBeNull();
  });

  it('protects timetable-referenced sections and rooms from destructive deletion', () => {
    const state = useWorkspaceStore.getState();
    const section = state.addSection({
      departmentId: department.id,
      name: 'A',
      year: 1,
      semester: 1,
      studentCount: 30,
      subjectRequirements: [],
    });
    const room = state.addRoom({
      departmentId: department.id,
      code: 'ROOM-1',
      name: 'Room 1',
      capacity: 30,
      type: 'GENERAL',
    });
    const saved = {
      ...timetable('tt_references', 'Referenced schedule'),
      entries: [{
        id: 'entry_1',
        sectionId: section.id,
        subjectId: 'subject_1',
        facultyId: 'faculty_1',
        roomId: room.id,
        dayIndex: 0,
        startPeriod: 0,
        durationPeriods: 1,
        source: 'MANUAL' as const,
        revision: 1,
      }],
    };
    state.upsertTimetable(saved);

    const removedSection = state.removeSection(section.id);
    const removedRoom = state.removeRoom(room.id);

    expect(removedSection.blocked).toBe(true);
    expect(removedRoom.blocked).toBe(true);
    expect(useWorkspaceStore.getState().sections.find((item) => item.id === section.id)?.active).toBe(false);
    expect(useWorkspaceStore.getState().rooms.find((item) => item.id === room.id)?.active).toBe(false);
  });
});
