import { describe, expect, it } from 'vitest';
import type { Department, Faculty, TimetableEntry } from '@/domain/models';
import { computeCommonFreeSlots } from '@/application/common-free-slot-service';

describe('computeCommonFreeSlots', () => {
  const department: Department = {
    id: 'dept_cse',
    code: 'CSE',
    name: 'Computer Science',
    workingDays: ['MONDAY', 'TUESDAY'],
    periodsPerDay: 4,
    status: 'READY',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const faculty: Faculty[] = [
    { id: 'f1', departmentId: 'dept_cse', facultyCode: 'TUR', name: 'Dr. Turing', subjectIds: [], sectionIds: [], availability: [], preferredSlots: [], maxPeriodsPerDay: null, maxPeriodsPerWeek: null, active: true },
    { id: 'f2', departmentId: 'dept_cse', facultyCode: 'LOV', name: 'Dr. Lovelace', subjectIds: [], sectionIds: [], availability: [], preferredSlots: [], maxPeriodsPerDay: null, maxPeriodsPerWeek: null, active: true },
    { id: 'f3', departmentId: 'dept_cse', facultyCode: 'HOP', name: 'Dr. Hopper', subjectIds: [], sectionIds: [], availability: [], preferredSlots: [], maxPeriodsPerDay: null, maxPeriodsPerWeek: null, active: true },
  ];

  it('detects common free slots where all selected faculty have no class', () => {
    const entries: TimetableEntry[] = [
      // Day 0, Period 0: f1 teaches
      { id: 'e1', sectionId: 'sec_1', subjectId: 'sub_1', facultyId: 'f1', roomId: null, dayIndex: 0, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      // Day 0, Period 1: f2 teaches
      { id: 'e2', sectionId: 'sec_1', subjectId: 'sub_2', facultyId: 'f2', roomId: null, dayIndex: 0, startPeriod: 1, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      // Day 1, Period 0: f3 teaches
      { id: 'e3', sectionId: 'sec_1', subjectId: 'sub_3', facultyId: 'f3', roomId: null, dayIndex: 1, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 1 },
    ];

    // For f1 and f2:
    // Day 0:
    //   Period 0: f1 busy, f2 free (not common free)
    //   Period 1: f1 free, f2 busy (not common free)
    //   Period 2: f1 free, f2 free (COMMON FREE!)
    //   Period 3: f1 free, f2 free (COMMON FREE!)
    // Day 1:
    //   Period 0: f1 free, f2 free (COMMON FREE!)
    //   Period 1: f1 free, f2 free (COMMON FREE!)
    //   Period 2: f1 free, f2 free (COMMON FREE!)
    //   Period 3: f1 free, f2 free (COMMON FREE!)
    // Total for {f1, f2} = 6 common free slots.
    const result = computeCommonFreeSlots(department, faculty, ['f1', 'f2'], entries);

    expect(result.totalTeachingSlots).toBe(8);
    expect(result.totalCommonFreeSlots).toBe(6);
    expect(result.bestDayName).toBe('TUESDAY'); // Day 1 has 4 free slots
    expect(result.bestDayFreeCount).toBe(4);

    // Check specific slot details
    const day0Slot0 = result.slots[0][0];
    expect(day0Slot0.isCommonFree).toBe(false);
    expect(day0Slot0.busyFacultyCount).toBe(1);
    expect(day0Slot0.freeFacultyCount).toBe(1);

    const day0Slot2 = result.slots[0][2];
    expect(day0Slot2.isCommonFree).toBe(true);
    expect(day0Slot2.busyFacultyCount).toBe(0);
    expect(day0Slot2.freeFacultyCount).toBe(2);
  });

  it('excludes breaks from common free slots', () => {
    const breaks = [
      { id: 'b1', name: 'Lunch', dayIndex: null, startPeriod: 2, durationPeriods: 1 },
    ];

    const result = computeCommonFreeSlots(department, faculty, ['f1'], [], breaks);

    // 4 teaching periods + 1 break = 5 grid columns per day
    expect(result.slots[0]).toHaveLength(5);
    const breakSlot = result.slots[0][2];
    expect(breakSlot.isBreak).toBe(true);
    expect(breakSlot.isCommonFree).toBe(false);
  });
});
