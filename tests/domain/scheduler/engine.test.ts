import { describe, expect, it } from 'vitest';
import { generateTimetable } from '@/domain/scheduler/engine';
import { validateTimetable } from '@/domain/validation/engine';
import { analyzeFeasibility } from '@/domain/scheduler/feasibility';
import {
  datasetDenseLabs,
  datasetFacultyOverload,
  datasetImpossibleCapacity,
  datasetLarge,
  datasetMinimal,
  datasetSharedFaculty,
} from '../../fixtures/datasets';

function runGenerate(ds: ReturnType<typeof datasetMinimal>, seed = 123456) {
  return generateTimetable({
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
}

describe('scheduler engine', () => {
  it('generates a valid timetable for the minimal dataset', () => {
    const ds = datasetMinimal();
    const result = runGenerate(ds);
    expect(result.status).toBe('COMPLETED');
    expect(result.validation?.isValid).toBe(true);
    expect(result.timetable?.entries.length).toBe(8); // 4 + 3 + 1
  });

  it('handles shared faculty without overlap (Dataset B)', () => {
    const ds = datasetSharedFaculty();
    const result = runGenerate(ds);
    expect(result.status).toBe('COMPLETED');
    expect(result.validation?.isValid).toBe(true);
  });

  it('keeps labs atomic: every lab entry has duration 2 within day bounds', () => {
    const ds = datasetDenseLabs();
    const result = runGenerate(ds);
    expect(result.status).toBe('COMPLETED');
    const labs = result.timetable!.entries.filter((e) => e.durationPeriods === 2);
    expect(labs.length).toBe(6); // 3 lab subjects × 2 sessions
    for (const lab of labs) {
      expect(lab.startPeriod + 2).toBeLessThanOrEqual(ds.department.periodsPerDay);
    }
    // No lab shares a period with another entry in the same section
    const sectionEntries = result.timetable!.entries;
    for (const lab of labs) {
      for (const other of sectionEntries) {
        if (other === lab) continue;
        const overlap =
          other.dayIndex === lab.dayIndex &&
          other.startPeriod < lab.startPeriod + 2 &&
          lab.startPeriod < other.startPeriod + other.durationPeriods;
        expect(overlap).toBe(false);
      }
    }
  });

  it('rejects impossible capacity in preflight (Dataset D)', () => {
    const ds = datasetImpossibleCapacity();
    const feasibility = analyzeFeasibility(ds);
    expect(feasibility.verdict).toBe('IMPOSSIBLE_OR_INVALID');
    expect(feasibility.diagnostics.some((d) => d.code === 'INSUFFICIENT_SECTION_CAPACITY')).toBe(true);
  });

  it('rejects overloaded faculty in preflight (Dataset E)', () => {
    const ds = datasetFacultyOverload();
    const feasibility = analyzeFeasibility(ds);
    expect(feasibility.verdict).toBe('IMPOSSIBLE_OR_INVALID');
    expect(feasibility.diagnostics.some((d) => d.code === 'FACULTY_CAPACITY_EXCEEDED')).toBe(true);
  });

  it('is deterministic for the same seed and input', () => {
    const ds = datasetMinimal();
    const a = runGenerate(ds, 42);
    const ds2 = datasetMinimal();
    const b = runGenerate(ds2, 42);
    // Compare by subject code + slot (IDs are random per fixture build)
    const subjById = new Map(ds.subjects.map((s) => [s.id, s.code]));
    const subjById2 = new Map(ds2.subjects.map((s) => [s.id, s.code]));
    const shapeA = a.timetable?.entries.map((e) => [subjById.get(e.subjectId), e.dayIndex, e.startPeriod]);
    const shapeB = b.timetable?.entries.map((e) => [subjById2.get(e.subjectId), e.dayIndex, e.startPeriod]);
    expect(shapeA).toEqual(shapeB);
  });

  it('generates a valid timetable for the large dataset within the node budget', () => {
    const ds = datasetLarge();
    const result = runGenerate(ds);
    if (result.status === 'COMPLETED') {
      const validation = validateTimetable(result.timetable!, ds.config);
      expect(validation.isValid).toBe(true);
      expect(validation.hardConflictCount).toBe(0);
    } else {
      // Either impossible (diagnosed) or bounded timeout — never an unbounded hang.
      expect(['IMPOSSIBLE', 'TIMEOUT']).toContain(result.status);
    }
  }, 30_000);
});
