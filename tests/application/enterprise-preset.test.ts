import { beforeEach, describe, expect, it } from 'vitest';
import { applyPreset, getPresetById } from '@/application/presets';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { analyzeFeasibility } from '@/domain/scheduler/feasibility';
import { generateTimetable } from '@/domain/scheduler/engine';
import { validateTimetable } from '@/domain/validation/engine';
import {
  DEFAULT_GENERATION_SETTINGS,
  DEFAULT_HARD_CONSTRAINTS,
  DEFAULT_SOFT_WEIGHTS,
} from '@/domain/policies';
import type { TimetableConfiguration } from '@/domain/models';

describe('enterprise preset', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().replaceAll({
      departments: [],
      sections: [],
      subjects: [],
      faculty: [],
      timetables: [],
      activeDepartmentId: null,
    });
  });

  it('is registered and structured as 9 sections / 8 subjects / 40 faculty', () => {
    const preset = getPresetById('enterprise');
    expect(preset).toBeDefined();
    expect(preset!.sections.length).toBe(9);
    expect(preset!.subjects.length).toBe(8);
    expect(preset!.subjects.filter((s) => s.type === 'THEORY').length).toBe(5);
    expect(preset!.subjects.filter((s) => s.type === 'LAB').length).toBe(3);
    expect(preset!.faculty.length).toBe(40);
    expect(preset!.requirements.every((r) => r.length === 8)).toBe(true);
    // Full-packing invariant: required periods per section === weekly capacity
    const requiredPeriods = preset!.requirements[0].reduce(
      (acc, n, i) => acc + n * (preset!.subjects[i].type === 'LAB' ? 2 : 1),
      0,
    );
    expect(requiredPeriods).toBe(preset!.workingDays.length * preset!.periodsPerDay);
  });

  it('applies to the workspace, passes preflight, and generates a VALID timetable', () => {
    const preset = getPresetById('enterprise')!;
    applyPreset(preset, useWorkspaceStore.getState());
    const store = useWorkspaceStore.getState();
    const deptId = store.activeDepartmentId!;

    const department = store.departments.find((d) => d.id === deptId)!;
    const sections = store.sections.filter((s) => s.departmentId === deptId);
    const subjects = store.subjects.filter((s) => s.departmentId === deptId);
    const faculty = store.faculty.filter((f) => f.departmentId === deptId);

    expect(sections.length).toBe(9);
    expect(subjects.length).toBe(8);
    expect(faculty.length).toBe(40);

    const config: TimetableConfiguration = {
      workingDays: department.workingDays,
      periodsPerDay: department.periodsPerDay,
      periodDefinitions: Array.from({ length: department.periodsPerDay }, (_, i) => ({
        index: i,
        label: `P${i + 1}`,
      })),
      sections,
      subjects,
      faculty,
      hardConstraints: DEFAULT_HARD_CONSTRAINTS,
      softWeights: DEFAULT_SOFT_WEIGHTS,
      generationSettings: {
        ...DEFAULT_GENERATION_SETTINGS,
        seed: 123456,
        maxSessionsPerSubjectPerDay: 1,
        maxLabSessionsPerSectionPerDay: 1,
      },
    };

    expect(analyzeFeasibility({ department, sections, subjects, faculty }).verdict).toBe('READY');

    const result = generateTimetable({
      department,
      sections,
      subjects,
      faculty,
      config,
      seed: 123456,
      maxDurationMs: 60_000,
      maxExploredNodes: 50_000_000,
      cancellation: { isCancelled: () => false },
    });
    expect(result.status).toBe('COMPLETED');
    expect(result.validation?.isValid).toBe(true);

    const validation = validateTimetable(result.timetable!, config);
    expect(validation.hardConflictCount).toBe(0);

    // Full-packing check: every period of every day is assigned for every section.
    // Also verifies max 1 subject-session per day and max 1 lab block per day.
    const dayCount = department.workingDays.length;
    for (const section of sections) {
      const sectionEntries = result.timetable!.entries.filter((e) => e.sectionId === section.id);
      for (let day = 0; day < dayCount; day++) {
        const occupied = new Set<number>();
        const labsToday = new Set<string>();
        const subjectsToday = new Map<string, number>();
        for (const e of sectionEntries) {
          if (e.dayIndex !== day) continue;
          for (let p = e.startPeriod; p < e.startPeriod + e.durationPeriods; p++) occupied.add(p);
          if (e.durationPeriods >= 2) labsToday.add(e.id);
          subjectsToday.set(e.subjectId, (subjectsToday.get(e.subjectId) ?? 0) + 1);
        }
        expect(occupied.size).toBe(department.periodsPerDay); // zero empty periods
        expect(labsToday.size).toBeLessThanOrEqual(1); // max 1 lab per day
        for (const n of subjectsToday.values()) expect(n).toBeLessThanOrEqual(1); // max 1 session per subject per day
      }
      // 6 lab blocks across 6 days + 1-per-day => exactly one lab every day
      const labDays = new Set(
        sectionEntries.filter((e) => e.durationPeriods >= 2).map((e) => e.dayIndex),
      );
      expect(labDays.size).toBe(6);
    }
  }, 60_000);
});

describe('maxSessionsPerSubjectPerDay constraint', () => {
  it('never places two sessions of one subject for one section on the same day', () => {
    const ds = useEnterpriseFixture();
    const result = generateTimetable({
      department: ds.department,
      sections: ds.sections,
      subjects: ds.subjects,
      faculty: ds.faculty,
      config: ds.config,
      seed: 99,
      maxDurationMs: 60_000,
      maxExploredNodes: 50_000_000,
      cancellation: { isCancelled: () => false },
    });
    expect(result.status).toBe('COMPLETED');
    const entries = result.timetable!.entries;
    for (const a of entries) {
      for (const b of entries) {
        if (a === b) continue;
        if (a.sectionId === b.sectionId && a.subjectId === b.subjectId) {
          expect(a.dayIndex).not.toBe(b.dayIndex);
        }
      }
    }
  }, 45_000);

  function useEnterpriseFixture() {
    const preset = getPresetById('enterprise')!;
    const store = useWorkspaceStore.getState();
    store.replaceAll({
      departments: [],
      sections: [],
      subjects: [],
      faculty: [],
      timetables: [],
      activeDepartmentId: null,
    });
    applyPreset(preset, store);
    const s = useWorkspaceStore.getState();
    const deptId = s.activeDepartmentId!;
    const department = s.departments.find((d) => d.id === deptId)!;
    const sections = s.sections.filter((x) => x.departmentId === deptId);
    const subjects = s.subjects.filter((x) => x.departmentId === deptId);
    const faculty = s.faculty.filter((x) => x.departmentId === deptId);
    const config: TimetableConfiguration = {
      workingDays: department.workingDays,
      periodsPerDay: department.periodsPerDay,
      periodDefinitions: Array.from({ length: department.periodsPerDay }, (_, i) => ({ index: i, label: `P${i + 1}` })),
      sections,
      subjects,
      faculty,
      hardConstraints: DEFAULT_HARD_CONSTRAINTS,
      softWeights: DEFAULT_SOFT_WEIGHTS,
      generationSettings: {
        ...DEFAULT_GENERATION_SETTINGS,
        seed: 99,
        maxSessionsPerSubjectPerDay: 1,
        maxLabSessionsPerSectionPerDay: 1,
      },
    };
    return { department, sections, subjects, faculty, config };
  }
});
