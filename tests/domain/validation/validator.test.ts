import { describe, expect, it } from 'vitest';
import { validateTimetable } from '@/domain/validation/engine';
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import { generateId } from '@/domain/models/ids';
import type { Timetable, TimetableEntry } from '@/domain/models';
import { datasetMinimal } from '../../fixtures/datasets';

function makeTimetable(ds: ReturnType<typeof datasetMinimal>, entries: TimetableEntry[]): Timetable {
  return {
    id: generateId('tt'),
    departmentId: ds.department.id,
    configurationSnapshot: buildConfigurationSnapshot(ds.config),
    entries,
    status: 'GENERATED',
    validationSummary: null,
    generationMetadata: null,
    revision: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function entry(overrides: Partial<TimetableEntry> & { sectionId: string; subjectId: string; facultyId: string; dayIndex: number; startPeriod: number }): TimetableEntry {
  return {
    id: generateId('entry'), roomId: null,
    durationPeriods: 1,
    source: 'GENERATED',
    revision: 0,
    ...overrides,
  };
}

describe('validator', () => {
  const ds = datasetMinimal();
  const sectionA = ds.sections[0];
  const math = ds.subjects.find((s) => s.code === 'MATH')!;
  const phy = ds.subjects.find((s) => s.code === 'PHY')!;
  const phyl = ds.subjects.find((s) => s.code === 'PHYL')!;
  const f0 = 'F0';
  const f1 = 'F1';

  const requiredEntries = (n = 4): TimetableEntry[] => {
    // Minimal valid: place 4 MATH, 3 PHY, 1 lab with no overlap
    const out: TimetableEntry[] = [];
    for (let i = 0; i < 4; i++) out.push(entry({ sectionId: sectionA.id, subjectId: math.id, facultyId: f0, dayIndex: Math.floor(i / 2), startPeriod: (i % 2) * 3 }));
    for (let i = 0; i < 3; i++) out.push(entry({ sectionId: sectionA.id, subjectId: phy.id, facultyId: f1, dayIndex: Math.floor(i / 2), startPeriod: (i % 2) * 3 + 1 }));
    out.push(entry({ sectionId: sectionA.id, subjectId: phyl.id, facultyId: f1, dayIndex: 4, startPeriod: 0, durationPeriods: 2 }));
    return out.slice(0, n === 4 ? out.length : out.length);
  };

  it('accepts a well-formed timetable with zero hard conflicts', () => {
    const result = validateTimetable(makeTimetable(ds, requiredEntries()), ds.config);
    expect(result.isValid).toBe(true);
    expect(result.hardConflictCount).toBe(0);
  });

  it('detects section double-booking', () => {
    const entries = requiredEntries();
    entries.push(entry({ sectionId: sectionA.id, subjectId: phy.id, facultyId: f1, dayIndex: 0, startPeriod: 0 }));
    const result = validateTimetable(makeTimetable(ds, entries), ds.config);
    expect(result.conflicts.some((c) => c.type === 'SECTION_TIME_CONFLICT')).toBe(true);
  });

  it('detects faculty double-booking', () => {
    const entries = requiredEntries();
    // f0 teaches MATH at day0 p0; add PHY with f0 at the same slot
    entries.push(entry({ sectionId: sectionA.id, subjectId: phy.id, facultyId: f0, dayIndex: 0, startPeriod: 5 }));
    // Make an actual same-slot conflict: replace the push above
    entries[entries.length - 1] = entry({ sectionId: sectionA.id, subjectId: phy.id, facultyId: f0, dayIndex: 0, startPeriod: 0 });
    const result = validateTimetable(makeTimetable(ds, entries), ds.config);
    expect(result.conflicts.some((c) => c.type === 'FACULTY_TIME_CONFLICT')).toBe(true);
  });

  it('detects missing required sessions', () => {
    const entries = requiredEntries().filter((e) => e.subjectId !== phyl.id); // drop the lab
    const result = validateTimetable(makeTimetable(ds, entries), ds.config);
    expect(result.conflicts.some((c) => c.type === 'MISSING_REQUIRED_SESSION')).toBe(true);
  });

  it('detects excess sessions', () => {
    const entries = [
      ...requiredEntries(),
      entry({ sectionId: sectionA.id, subjectId: math.id, facultyId: f0, dayIndex: 4, startPeriod: 4 }),
    ];
    const result = validateTimetable(makeTimetable(ds, entries), ds.config);
    expect(result.conflicts.some((c) => c.type === 'EXCESS_REQUIRED_SESSION')).toBe(true);
  });

  it('detects duplicate entry identity', () => {
    const entries = requiredEntries();
    entries[1].id = entries[0].id;
    const result = validateTimetable(makeTimetable(ds, entries), ds.config);
    expect(result.conflicts.some((c) => c.type === 'DUPLICATE_SESSION')).toBe(true);
  });

  it('detects invalid subject reference', () => {
    const entries = requiredEntries();
    entries[0].subjectId = 'NOPE';
    const result = validateTimetable(makeTimetable(ds, entries), ds.config);
    expect(result.conflicts.some((c) => c.type === 'INVALID_SUBJECT')).toBe(true);
  });

  it('detects invalid faculty reference', () => {
    const entries = requiredEntries();
    entries[0].facultyId = 'NOPE';
    const result = validateTimetable(makeTimetable(ds, entries), ds.config);
    expect(result.conflicts.some((c) => c.type === 'INVALID_FACULTY')).toBe(true);
  });

  it('detects faculty not eligible for subject', () => {
    const entries = requiredEntries();
    entries[0].facultyId = f1; // F1 is not eligible for MATH
    const result = validateTimetable(makeTimetable(ds, entries), ds.config);
    expect(result.conflicts.some((c) => c.type === 'FACULTY_NOT_ELIGIBLE')).toBe(true);
  });

  it('detects invalid day reference', () => {
    const entries = requiredEntries();
    entries[0].dayIndex = 9;
    const result = validateTimetable(makeTimetable(ds, entries), ds.config);
    expect(result.conflicts.some((c) => c.type === 'INVALID_DAY')).toBe(true);
  });

  it('detects lab out of bounds', () => {
    const entries = requiredEntries();
    const lab = entries.find((e) => e.subjectId === phyl.id)!;
    lab.startPeriod = 5; // 6-period day, lab occupies 5 and 6 → out of bounds
    const result = validateTimetable(makeTimetable(ds, entries), ds.config);
    expect(result.conflicts.some((c) => c.type === 'LAB_OUT_OF_BOUNDS')).toBe(true);
  });

  it('detects stale configuration', () => {
    const tt = makeTimetable(ds, requiredEntries());
    tt.configurationSnapshot = { ...tt.configurationSnapshot, fingerprint: 'deadbeef' };
    const result = validateTimetable(tt, ds.config);
    expect(result.conflicts.some((c) => c.type === 'STALE_TIMETABLE')).toBe(true);
  });
});
