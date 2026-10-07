import { describe, expect, it } from 'vitest';
import { computeSlotConflicts } from '@/application/timetable-slot-preview';
import { TimetableEditService } from '@/application/timetable-service';
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import { generateId } from '@/domain/models/ids';
import type { Timetable, TimetableEntry } from '@/domain/models';
import { datasetMinimal, datasetSharedFaculty } from '../fixtures/datasets';

function makeTimetable(ds: ReturnType<typeof datasetMinimal>, entries: TimetableEntry[]): Timetable {
  return {
    id: generateId('tt'),
    departmentId: ds.department.id,
    configurationSnapshot: buildConfigurationSnapshot(ds.config),
    entries,
    status: 'VALID',
    validationSummary: null,
    generationMetadata: null,
    revision: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as Timetable;
}

function baseEntries(ds: ReturnType<typeof datasetMinimal>): TimetableEntry[] {
  const section = ds.sections[0];
  const math = ds.subjects.find((s) => s.code === 'MATH')!;
  const phy = ds.subjects.find((s) => s.code === 'PHY')!;
  const phyl = ds.subjects.find((s) => s.code === 'PHYL')!;
  const out: TimetableEntry[] = [];
  for (let i = 0; i < 4; i++)
    out.push({ id: `e_m${i}`, sectionId: section.id, subjectId: math.id, facultyId: 'F0', roomId: null, dayIndex: Math.floor(i / 2), startPeriod: (i % 2) * 3, durationPeriods: 1, source: 'GENERATED', revision: 0 });
  for (let i = 0; i < 3; i++)
    out.push({ id: `e_p${i}`, sectionId: section.id, subjectId: phy.id, facultyId: 'F1', roomId: null, dayIndex: Math.floor(i / 2), startPeriod: (i % 2) * 3 + 1, durationPeriods: 1, source: 'GENERATED', revision: 0 });
  out.push({ id: 'e_lab', sectionId: section.id, subjectId: phyl.id, facultyId: 'F1', roomId: null, dayIndex: 4, startPeriod: 0, durationPeriods: 2, source: 'GENERATED', revision: 0 });
  return out;
}

describe('computeSlotConflicts', () => {
  const ds = datasetMinimal();
  const service = new TimetableEditService(ds.config);
  const periodsPerDay = ds.config.periodsPerDay; // 6

  it('returns an empty map when nothing is selected or the entry is missing', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    expect(computeSlotConflicts(tt, service, ds.config, null).size).toBe(0);
    expect(computeSlotConflicts(tt, service, ds.config, 'missing-entry').size).toBe(0);
  });

  it('never marks the selected entry\'s own cells or a valid free slot', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    // e_m1 (F0) at day0 p3: its own slot must never appear as a target.
    const map = computeSlotConflicts(tt, service, ds.config, 'e_m1');
    expect(map.get('0:3')).toBeUndefined();
    // day0 p5 is free with no faculty conflict → a valid move stays unmarked.
    expect(map.get(`0:${periodsPerDay - 1}`)).toBeUndefined();
  });

  it('marks occupied same-section cells as SWAP targets (duration mismatch without a service call)', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    // e_lab (2 periods) selected: every 1-period theory cell in the section
    // is a duration-mismatched swap target.
    const map = computeSlotConflicts(tt, service, ds.config, 'e_lab');
    expect(map.get('0:0')).toEqual({ slot: '0:0', kind: 'SWAP', reason: 'DURATION_MISMATCH' });
    // The lab's own two cells are never marked.
    expect(map.get('4:0')).toBeUndefined();
    expect(map.get('4:1')).toBeUndefined();
  });

  it('marks a lab that cannot start in the final period as MOVE-blocked', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    // e_lab selected: day4 p5 is free, but a 2-period block cannot start at
    // the last period (LAB_OUT_OF_BOUNDS on commit).
    const map = computeSlotConflicts(tt, service, ds.config, 'e_lab');
    expect(map.get(`4:${periodsPerDay - 1}`)).toEqual({
      slot: `4:${periodsPerDay - 1}`,
      kind: 'MOVE',
      reason: 'LAB_OUT_OF_BOUNDS',
    });
  });

  it('marks an empty slot whose move collides with faculty in another section', () => {
    const ds2 = datasetSharedFaculty();
    const service2 = new TimetableEditService(ds2.config);
    const secA = ds2.sections[0];
    const secB = ds2.sections[1];
    const cs1 = ds2.subjects.find((s) => s.code === 'CS1')!; // F0, both sections
    const cs2 = ds2.subjects.find((s) => s.code === 'CS2')!; // F1, section A
    const entries: TimetableEntry[] = [
      // Section A: CS1 (F0) at day0 p0, CS2 (F1) at day0 p2.
      { id: 'a1', sectionId: secA.id, subjectId: cs1.id, facultyId: 'F0', roomId: null, dayIndex: 0, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 0 },
      { id: 'a2', sectionId: secA.id, subjectId: cs2.id, facultyId: 'F1', roomId: null, dayIndex: 0, startPeriod: 2, durationPeriods: 1, source: 'GENERATED', revision: 0 },
      // Section B: CS1 (F0) at day0 p1 — empty from section A's perspective.
      { id: 'b1', sectionId: secB.id, subjectId: cs1.id, facultyId: 'F0', roomId: null, dayIndex: 0, startPeriod: 1, durationPeriods: 1, source: 'GENERATED', revision: 0 },
      // More sessions so the fixture resembles a real week.
      { id: 'a3', sectionId: secA.id, subjectId: cs1.id, facultyId: 'F0', roomId: null, dayIndex: 1, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 0 },
      { id: 'a4', sectionId: secA.id, subjectId: cs2.id, facultyId: 'F1', roomId: null, dayIndex: 1, startPeriod: 2, durationPeriods: 1, source: 'GENERATED', revision: 0 },
      // Section B's remaining sessions (MA1/F2, no interaction with F0).
      { id: 'b2', sectionId: secB.id, subjectId: ds2.subjects.find((s) => s.code === 'MA1')!.id, facultyId: 'F2', roomId: null, dayIndex: 2, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 0 },
    ];
    const tt = makeTimetable(ds2, entries);
    // Select a1 (F0). day0 p1 is EMPTY for section A but F0 teaches b1
    // there → moving a1 there is rejected with FACULTY_TIME_CONFLICT.
    const map = computeSlotConflicts(tt, service2, ds2.config, 'a1');
    expect(map.get('0:1')).toEqual({ slot: '0:1', kind: 'MOVE', reason: 'FACULTY_TIME_CONFLICT' });
    // a3 (F0, day1 p0) is occupied → SWAP target; the swap exchanges a1↔a3
    // slots with no collision → allowed, so no MOVE marker.
    expect(map.get('1:0')?.kind).not.toBe('MOVE');
    // Free slot with no conflicts (day2 p3) stays unmarked.
    expect(map.get('2:3')).toBeUndefined();
  });

  it('marks an occupied cell as SWAP-blocked when the swap would double-book faculty', () => {
    const ds2 = datasetSharedFaculty();
    const service2 = new TimetableEditService(ds2.config);
    const secA = ds2.sections[0];
    const secB = ds2.sections[1];
    const cs1 = ds2.subjects.find((s) => s.code === 'CS1')!;
    const cs2 = ds2.subjects.find((s) => s.code === 'CS2')!;
    const entries: TimetableEntry[] = [
      // a1 (F0) at day0 p0, a2 (F1) at day0 p1 in section A; b1 (F0) also
      // sits at day0 p1 in section B → swapping a1↔a2 would land F0 on b1.
      { id: 'a1', sectionId: secA.id, subjectId: cs1.id, facultyId: 'F0', roomId: null, dayIndex: 0, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 0 },
      { id: 'a2', sectionId: secA.id, subjectId: cs2.id, facultyId: 'F1', roomId: null, dayIndex: 0, startPeriod: 1, durationPeriods: 1, source: 'GENERATED', revision: 0 },
      { id: 'b1', sectionId: secB.id, subjectId: cs1.id, facultyId: 'F0', roomId: null, dayIndex: 0, startPeriod: 1, durationPeriods: 1, source: 'GENERATED', revision: 0 },
      { id: 'a3', sectionId: secA.id, subjectId: cs1.id, facultyId: 'F0', roomId: null, dayIndex: 2, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 0 },
      { id: 'a4', sectionId: secA.id, subjectId: cs2.id, facultyId: 'F1', roomId: null, dayIndex: 2, startPeriod: 1, durationPeriods: 1, source: 'GENERATED', revision: 0 },
      { id: 'b2', sectionId: secB.id, subjectId: ds2.subjects.find((s) => s.code === 'MA1')!.id, facultyId: 'F2', roomId: null, dayIndex: 3, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 0 },
    ];
    const tt = makeTimetable(ds2, entries);
    // Select a1: right-clicking a2 (occupied, same section, same duration)
    // would swap F0 onto day0 p1 where b1 (F0) sits → SWAP blocked.
    const map = computeSlotConflicts(tt, service2, ds2.config, 'a1');
    expect(map.get('0:1')).toEqual({ slot: '0:1', kind: 'SWAP', reason: 'FACULTY_TIME_CONFLICT' });
  });
});
