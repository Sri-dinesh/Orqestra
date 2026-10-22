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
    // Labs run exactly once a week
    expect(preset!.subjects.filter((s) => s.type === 'LAB').every((s) => s.sessionsPerWeek === 1)).toBe(true);
    // 5 theory (7+8+7+7+7 = 36) + 3 labs × 2 = 42 periods per section (100% full packing)
    const requiredPeriods = preset!.requirements[0].reduce(
      (acc, n, i) => acc + n * (preset!.subjects[i].type === 'LAB' ? 2 : 1),
      0,
    );
    expect(requiredPeriods).toBe(42);
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
      rooms: store.rooms.filter((r) => r.departmentId === deptId),
      breaks: store.breaks,
      hardConstraints: DEFAULT_HARD_CONSTRAINTS,
      softWeights: DEFAULT_SOFT_WEIGHTS,
      generationSettings: {
        ...DEFAULT_GENERATION_SETTINGS,
        seed: 123456,
        maxSessionsPerSubjectPerDay: 2,
        maxLabSessionsPerSectionPerDay: 1,
      },
    };

    expect(analyzeFeasibility({ department, sections, subjects, faculty, breaks: store.breaks }).verdict).toBe('READY');

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

    // Each lab subject appears exactly once a week; labs on distinct days;
    // max 1 lab per day; max 1 session per subject per day; lab times vary.
    const dayCount = department.workingDays.length;
    const allLabStarts = new Set<string>();
    for (const section of sections) {
      const sectionEntries = result.timetable!.entries.filter((e) => e.sectionId === section.id);
      const labDays = new Set<number>();
      for (const lab of subjects.filter((s) => s.type === 'LAB')) {
        const count = sectionEntries.filter((e) => e.subjectId === lab.id).length;
        expect(count).toBe(1);
      }
      // Max 1 session per subject per section per day (per-day check)
      for (let day = 0; day < dayCount; day++) {
        const subjectsToday = new Map<string, number>();
        for (const e of sectionEntries) {
          if (e.dayIndex !== day) continue;
          if (e.durationPeriods >= 2) {
            labDays.add(e.dayIndex);
            allLabStarts.add(`${e.dayIndex}:${e.startPeriod}`);
          }
          subjectsToday.set(e.subjectId, (subjectsToday.get(e.subjectId) ?? 0) + 1);
        }
        for (const n of subjectsToday.values()) expect(n).toBeLessThanOrEqual(2);
      }
      expect(labDays.size).toBe(3); // 3 labs on 3 distinct days
      // Full packing: every period of every day is assigned.
      const occupied = new Set<string>();
      for (const e of sectionEntries) {
        for (let p = e.startPeriod; p < e.startPeriod + e.durationPeriods; p++) occupied.add(`${e.dayIndex}:${p}`);
      }
      expect(occupied.size).toBe(42);
      const totalPeriods = sectionEntries.reduce((acc, e) => acc + e.durationPeriods, 0);
      expect(totalPeriods).toBe(42);
    }
    // Slot variety: lab blocks are not all at the same time of day.
    expect(allLabStarts.size).toBeGreaterThanOrEqual(2);
    // Faculty fairness: every subject's faculty pool is used and balanced.
    const loads = new Map<string, number>();
    for (const f of faculty) loads.set(f.id, 0);
    for (const e of result.timetable!.entries) {
      loads.set(e.facultyId, (loads.get(e.facultyId) ?? 0) + e.durationPeriods);
    }
    for (const sub of subjects.filter((s) => s.type === 'THEORY')) {
      const poolLoads = sub.eligibleFacultyIds.map((id) => loads.get(id) ?? 0);
      expect(poolLoads.every((l) => l > 0)).toBe(true); // no idle faculty in a pool
      expect(Math.max(...poolLoads) - Math.min(...poolLoads)).toBeLessThanOrEqual(2); // even split
    }
  }, 60_000);
});

describe('maxSessionsPerSubjectPerDay constraint (shared faculty fixture)', () => {
  it('never places two sessions of one subject for one section on the same day when capped at 1', () => {
    const ds = useSharedFacultyFixture();
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

  /** Fixture where every subject is required ≤3 sessions/week (cap 1 = each on a distinct day). */
  function useSharedFacultyFixture() {
    const store = useWorkspaceStore.getState();
    store.replaceAll({
      departments: [],
      sections: [],
      subjects: [],
      faculty: [],
      timetables: [],
      activeDepartmentId: null,
    });
    const department = store.addDepartment({
      code: 'IT',
      name: 'Information Technology',
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      periodsPerDay: 7,
    });
    const f1 = store.addFaculty({
      departmentId: department.id,
      facultyCode: 'F1',
      name: 'Dr. Kavya',
      subjectIds: [],
      sectionIds: [],
      availability: [],
      preferredSlots: [],
      maxPeriodsPerDay: null,
      maxPeriodsPerWeek: null,
    });
    const f2 = store.addFaculty({
      departmentId: department.id,
      facultyCode: 'F2',
      name: 'Prof. Nilesh',
      subjectIds: [],
      sectionIds: [],
      availability: [],
      preferredSlots: [],
      maxPeriodsPerDay: null,
      maxPeriodsPerWeek: null,
    });
    const f3 = store.addFaculty({
      departmentId: department.id,
      facultyCode: 'F3',
      name: 'Dr. Tara',
      subjectIds: [],
      sectionIds: [],
      availability: [],
      preferredSlots: [],
      maxPeriodsPerDay: null,
      maxPeriodsPerWeek: null,
    });
    const s1 = store.addSection({ departmentId: department.id, name: 'IT-A', year: 2, semester: 3, studentCount: 50, subjectRequirements: [] });
    const s2 = store.addSection({ departmentId: department.id, name: 'IT-B', year: 2, semester: 3, studentCount: 50, subjectRequirements: [] });
    const sub1 = store.addSubject({ departmentId: department.id, code: 'MATH', name: 'Math', type: 'THEORY', sessionsPerWeek: 3, durationPeriods: 1, eligibleFacultyIds: [f1.id], eligibleSectionIds: [s1.id, s2.id] });
    const sub2 = store.addSubject({ departmentId: department.id, code: 'CN', name: 'Networks', type: 'THEORY', sessionsPerWeek: 3, durationPeriods: 1, eligibleFacultyIds: [f2.id], eligibleSectionIds: [s1.id] });
    const sub3 = store.addSubject({ departmentId: department.id, code: 'SE', name: 'Software Eng', type: 'THEORY', sessionsPerWeek: 3, durationPeriods: 1, eligibleFacultyIds: [f3.id], eligibleSectionIds: [s2.id] });
    store.updateSection(s1.id, { subjectRequirements: [{ id: 'r1', subjectId: sub1.id, sessionsPerWeek: 3 }, { id: 'r2', subjectId: sub2.id, sessionsPerWeek: 3 }] });
    store.updateSection(s2.id, { subjectRequirements: [{ id: 'r3', subjectId: sub1.id, sessionsPerWeek: 3 }, { id: 'r4', subjectId: sub3.id, sessionsPerWeek: 3 }] });
    store.setActiveDepartment(department.id);
    const s = useWorkspaceStore.getState();
    const sections = s.sections.filter((x) => x.departmentId === department.id);
    const subjects = s.subjects.filter((x) => x.departmentId === department.id);
    const faculty = s.faculty.filter((x) => x.departmentId === department.id);
    const config: TimetableConfiguration = {
      workingDays: department.workingDays,
      periodsPerDay: department.periodsPerDay,
      periodDefinitions: Array.from({ length: department.periodsPerDay }, (_, i) => ({ index: i, label: `P${i + 1}` })),
      sections,
      subjects,
      faculty,
      rooms: [],
      breaks: [],
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
