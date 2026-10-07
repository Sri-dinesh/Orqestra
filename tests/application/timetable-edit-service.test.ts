import { describe, expect, it } from 'vitest';
import { TimetableEditService } from '@/application/timetable-service';
import type { EditCommand } from '@/application/timetable-edit-commands';
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import { generateId } from '@/domain/models/ids';
import type { Timetable, TimetableEntry } from '@/domain/models';
import { datasetMinimal } from '../fixtures/datasets';

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
    out.push({ id: `e_m${i}`, sectionId: section.id, subjectId: math.id, facultyId: 'F0', dayIndex: Math.floor(i / 2), startPeriod: (i % 2) * 3, durationPeriods: 1, roomId: null, source: 'GENERATED', revision: 0 });
  for (let i = 0; i < 3; i++)
    out.push({ id: `e_p${i}`, sectionId: section.id, subjectId: phy.id, facultyId: 'F1', dayIndex: Math.floor(i / 2), startPeriod: (i % 2) * 3 + 1, durationPeriods: 1, roomId: null, source: 'GENERATED', revision: 0 });
  out.push({ id: 'e_lab', sectionId: section.id, subjectId: phyl.id, facultyId: 'F1', dayIndex: 4, startPeriod: 0, durationPeriods: 2, roomId: null, source: 'GENERATED', revision: 0 });
  return out;
}

const cmd = (operation: EditCommand['operation'], payload: unknown, affected: string[]): EditCommand =>
  ({ operation, payload, affectedEntryIds: affected, timestamp: new Date().toISOString() } as EditCommand);

describe('timetable edit service', () => {
  const ds = datasetMinimal();
  const service = new TimetableEditService(ds.config);

  it('commits a valid move and increments revision', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    const outcome = service.executeCommand(tt, cmd('MOVE_ENTRY', { entryId: 'e_m0', dayIndex: 4, startPeriod: 4 }, ['e_m0']));
    expect(outcome.status).toBe('COMMITTED');
    expect(outcome.timetable?.revision).toBe(1);
    const moved = outcome.timetable!.entries.find((e) => e.id === 'e_m0');
    expect(moved?.dayIndex).toBe(4);
    expect(moved?.startPeriod).toBe(4);
  });

  it('blocks a move that creates a section collision', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    // e_m0 is day0 p0; e_p0 is day0 p1. Move e_m0 to day0 p1 → collision
    const outcome = service.executeCommand(tt, cmd('MOVE_ENTRY', { entryId: 'e_m0', dayIndex: 0, startPeriod: 1 }, ['e_m0']));
    expect(outcome.status).toBe('REJECTED');
    expect(outcome.conflicts.length).toBeGreaterThan(0);
  });

  it('blocks a faculty change to an ineligible faculty member', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    // F0 is not eligible for PHY (only F1 is)
    const outcome = service.executeCommand(tt, cmd('CHANGE_FACULTY', { entryId: 'e_p0', facultyId: 'F0' }, ['e_p0']));
    expect(outcome.status).toBe('REJECTED');
    expect(outcome.conflicts.some((c) => c.type === 'FACULTY_NOT_ELIGIBLE')).toBe(true);
  });

  it('blocks a move that double-books faculty across two entries', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    // e_m1 (F0) is at day0 p3; e_m0 (F0) is at day0 p0. Moving e_m1 onto p0 double-books F0.
    const outcome = service.executeCommand(tt, cmd('MOVE_ENTRY', { entryId: 'e_m1', dayIndex: 0, startPeriod: 0 }, ['e_m1']));
    expect(outcome.status).toBe('REJECTED');
    expect(outcome.conflicts.some((c) => c.type === 'FACULTY_TIME_CONFLICT')).toBe(true);
  });

  it('moves a lab as one atomic block and blocks invalid half-block placements', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    // lab at day4 p0-1 → move to day3 p2-3 (free)
    const outcome = service.executeCommand(tt, cmd('MOVE_ENTRY', { entryId: 'e_lab', dayIndex: 3, startPeriod: 2 }, ['e_lab']));
    expect(outcome.status).toBe('COMMITTED');
    const lab = outcome.timetable!.entries.find((e) => e.id === 'e_lab');
    expect(lab?.startPeriod).toBe(2);
    expect(lab?.durationPeriods).toBe(2);
    // Move lab to the last period → out of bounds → rejected
    const outcome2 = service.executeCommand(makeTimetable(ds, baseEntries(ds)), cmd('MOVE_ENTRY', { entryId: 'e_lab', dayIndex: 0, startPeriod: 5 }, ['e_lab']));
    expect(outcome2.status).toBe('REJECTED');
  });

  it('blocks subject change to a subject not applicable to the section', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    const outcome = service.executeCommand(tt, cmd('CHANGE_SUBJECT', { entryId: 'e_m0', subjectId: 'NOPE' }, ['e_m0']));
    expect(outcome.status).toBe('REJECTED');
  });

  it('supports swap of two theory entries', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    const outcome = service.executeCommand(tt, cmd('SWAP_ENTRIES', { entryAId: 'e_m0', entryBId: 'e_p0' }, ['e_m0', 'e_p0']));
    expect(outcome.status).toBe('COMMITTED');
    const a = outcome.timetable!.entries.find((e) => e.id === 'e_m0')!;
    const b = outcome.timetable!.entries.find((e) => e.id === 'e_p0')!;
    expect([a.dayIndex, a.startPeriod]).toEqual([0, 1]);
    expect([b.dayIndex, b.startPeriod]).toEqual([0, 0]);
  });

  it('supports clear (remove) and add round-trip', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    const cleared = service.executeCommand(tt, cmd('CLEAR_ENTRY', { entryId: 'e_m0' }, ['e_m0']));
    expect(cleared.status).toBe('COMMITTED');
    expect(cleared.timetable!.entries.find((e) => e.id === 'e_m0')).toBeUndefined();
    const entry = tt.entries.find((e) => e.id === 'e_m0')!;
    const added = service.executeCommand(cleared.timetable!, cmd('ADD_ENTRY', { entry }, [entry.id]));
    expect(added.status).toBe('COMMITTED');
    expect(added.timetable!.entries.some((e) => e.subjectId === entry.subjectId && e.dayIndex === entry.dayIndex)).toBe(true);
  });

  it('revalidate marks stale timetables', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    const summary = service.revalidate(tt);
    expect(summary.isStale).toBe(false);
    expect(summary.status).toBe('VALID');
    const stale = { ...tt, configurationSnapshot: { ...tt.configurationSnapshot, fingerprint: 'zzz' } };
    expect(service.revalidate(stale).status).toBe('STALE');
  });

  it('leaves the committed timetable unchanged when a command errors', () => {
    const tt = makeTimetable(ds, baseEntries(ds));
    const before = tt.entries.length;
    const outcome = service.executeCommand(tt, cmd('MOVE_ENTRY', { entryId: 'does-not-exist', dayIndex: 0, startPeriod: 0 }, ['x']));
    expect(outcome.status).toBe('REJECTED');
    expect(tt.entries.length).toBe(before);
  });
});
