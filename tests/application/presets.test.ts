import { beforeEach, describe, expect, it } from 'vitest';
import { BUILT_IN_PRESETS, applyPreset } from '@/application/presets';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { analyzeFeasibility } from '@/domain/scheduler/feasibility';
import { generateTimetable } from '@/domain/scheduler/engine';
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import { DEFAULT_GENERATION_SETTINGS, DEFAULT_HARD_CONSTRAINTS, DEFAULT_SOFT_WEIGHTS } from '@/domain/policies';
import type { TimetableConfiguration } from '@/domain/models';

describe('built-in presets', () => {
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

  it('exposes five presets with unique ids and codes', () => {
    expect(BUILT_IN_PRESETS.length).toBe(5);
    expect(new Set(BUILT_IN_PRESETS.map((p) => p.id)).size).toBe(5);
    expect(new Set(BUILT_IN_PRESETS.map((p) => p.department.code)).size).toBe(5);
  });

  for (const preset of BUILT_IN_PRESETS) {
    it(`applies "${preset.label}" to an empty workspace and generates a valid timetable`, () => {
      applyPreset(preset, useWorkspaceStore.getState());
      const store = useWorkspaceStore.getState();
      const deptId = store.activeDepartmentId!;

      const department = store.departments.find((d) => d.id === deptId)!;
      const sections = store.sections.filter((s) => s.departmentId === deptId);
      const subjects = store.subjects.filter((s) => s.departmentId === deptId);
      const faculty = store.faculty.filter((f) => f.departmentId === deptId);

      // Preset wiring sanity
      expect(sections.length).toBe(preset.sections.length);
      expect(subjects.length).toBe(preset.subjects.length);
      expect(faculty.length).toBe(preset.faculty.length);
      expect(subjects.every((s) => s.eligibleFacultyIds.length > 0)).toBe(true);
      expect(sections.every((s) => s.subjectRequirements.length > 0)).toBe(true);

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
          seed: 123456,
          ...(preset.id === 'enterprise'
            ? { maxSessionsPerSubjectPerDay: 1, maxLabSessionsPerSectionPerDay: 1 }
            : {}),
        },
      };

      // Presets must be feasible (they are realistic configurations)
      expect(analyzeFeasibility({ department, sections, subjects, faculty }).verdict).toBe('READY');

      const isEnterprise = preset.id === 'enterprise';
      const result = generateTimetable({
        department,
        sections,
        subjects,
        faculty,
        config,
        seed: 123456,
        maxDurationMs: isEnterprise ? 60_000 : 10_000,
        maxExploredNodes: isEnterprise ? 50_000_000 : 2_000_000,
        cancellation: { isCancelled: () => false },
      });
      expect(result.status).toBe('COMPLETED');
      expect(result.validation?.isValid).toBe(true);

      // Full sections coverage: every section has all its required sessions
      const snapshot = buildConfigurationSnapshot(config);
      for (const section of sections) {
        const sectionEntries = result.timetable!.entries.filter((e) => e.sectionId === section.id);
        const required = Object.entries(snapshot.subjectRequirementCounts)
          .filter(([key]) => key.startsWith(`${section.id}:`))
          .reduce((acc, [, n]) => acc + n, 0);
        expect(sectionEntries.length).toBe(required);
      }
    }, 70_000);
  }
});
