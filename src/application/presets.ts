import type { WorkingDay } from '@/domain/enums';
import type { useWorkspaceStore } from '@/state/stores/workspace-store';

export interface PresetSubject {
  code: string;
  name: string;
  type: 'THEORY' | 'LAB';
  sessionsPerWeek: number;
  /** Indices into the preset's faculty list. */
  faculty: number[];
  /** Indices into the preset's section list. */
  sections: number[];
}

export interface PresetDefinition {
  id: string;
  label: string;
  description: string;
  department: { code: string; name: string };
  workingDays: WorkingDay[];
  periodsPerDay: number;
  sections: Array<{ name: string; year: number; semester: number; studentCount: number }>;
  faculty: Array<{ facultyCode: string; name: string }>;
  subjects: PresetSubject[];
  /** Per-section weekly requirements: [sectionIndex][subjectIndex] = sessions. */
  requirements: number[][];
  /** Optional generation settings applied with the preset. */
  generationSettings?: {
    maxSessionsPerSubjectPerDay?: number | null;
    maxLabSessionsPerSectionPerDay?: number | null;
  };
}

const WEEK5: WorkingDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export const BUILT_IN_PRESETS: PresetDefinition[] = [
  {
    id: 'minimal',
    label: 'Quick Start — Minimal',
    description: '1 section, 3 subjects (1 lab), 2 faculty, 5 days × 6 periods. Best for trying the app.',
    department: { code: 'GEN', name: 'General Studies' },
    workingDays: WEEK5,
    periodsPerDay: 6,
    sections: [{ name: 'A', year: 1, semester: 1, studentCount: 40 }],
    faculty: [
      { facultyCode: 'F1', name: 'Dr. Ada Sharma' },
      { facultyCode: 'F2', name: 'Prof. Ravi Kumar' },
    ],
    subjects: [
      { code: 'MATH', name: 'Mathematics', type: 'THEORY', sessionsPerWeek: 4, faculty: [0], sections: [0] },
      { code: 'PHYS', name: 'Physics', type: 'THEORY', sessionsPerWeek: 3, faculty: [1], sections: [0] },
      { code: 'PHYS-L', name: 'Physics Lab', type: 'LAB', sessionsPerWeek: 1, faculty: [1], sections: [0] },
    ],
    requirements: [[4, 3, 1]],
  },
  {
    id: 'standard-btech',
    label: 'Standard B.Tech Section',
    description: '1 section, 6 subjects (2 labs), 5 faculty, 5 days × 7 periods. A realistic semester load.',
    department: { code: 'CSE', name: 'Computer Science & Engineering' },
    workingDays: WEEK5,
    periodsPerDay: 7,
    sections: [{ name: 'CSE-A', year: 2, semester: 3, studentCount: 60 }],
    faculty: [
      { facultyCode: 'F1', name: 'Dr. Meera Iyer' },
      { facultyCode: 'F2', name: 'Dr. Arjun Patel' },
      { facultyCode: 'F3', name: 'Prof. Sneha Rao' },
      { facultyCode: 'F4', name: 'Dr. Vikram Singh' },
      { facultyCode: 'F5', name: 'Prof. Divya Nair' },
    ],
    subjects: [
      { code: 'DSA', name: 'Data Structures & Algorithms', type: 'THEORY', sessionsPerWeek: 4, faculty: [0], sections: [0] },
      { code: 'DBMS', name: 'Database Systems', type: 'THEORY', sessionsPerWeek: 3, faculty: [1], sections: [0] },
      { code: 'OS', name: 'Operating Systems', type: 'THEORY', sessionsPerWeek: 3, faculty: [2], sections: [0] },
      { code: 'MATH-III', name: 'Discrete Mathematics', type: 'THEORY', sessionsPerWeek: 3, faculty: [3], sections: [0] },
      { code: 'DSA-L', name: 'DSA Lab', type: 'LAB', sessionsPerWeek: 1, faculty: [0, 4], sections: [0] },
      { code: 'DBMS-L', name: 'DBMS Lab', type: 'LAB', sessionsPerWeek: 1, faculty: [1, 4], sections: [0] },
    ],
    requirements: [[4, 3, 3, 3, 1, 1]],
  },
  {
    id: 'two-sections-shared',
    label: 'Two Sections + Shared Faculty',
    description: '2 sections sharing one mathematics faculty across 4 subjects (1 lab), 3 faculty, 5 days × 7 periods. Demonstrates cross-section conflict handling.',
    department: { code: 'IT', name: 'Information Technology' },
    workingDays: WEEK5,
    periodsPerDay: 7,
    sections: [
      { name: 'IT-A', year: 2, semester: 3, studentCount: 55 },
      { name: 'IT-B', year: 2, semester: 3, studentCount: 55 },
    ],
    faculty: [
      { facultyCode: 'F1', name: 'Dr. Kavya Menon' },
      { facultyCode: 'F2', name: 'Prof. Nilesh Joshi' },
      { facultyCode: 'F3', name: 'Dr. Tara Bose' },
    ],
    subjects: [
      { code: 'MATH', name: 'Engineering Mathematics', type: 'THEORY', sessionsPerWeek: 3, faculty: [0], sections: [0, 1] },
      { code: 'CN', name: 'Computer Networks', type: 'THEORY', sessionsPerWeek: 3, faculty: [1], sections: [0] },
      { code: 'SE', name: 'Software Engineering', type: 'THEORY', sessionsPerWeek: 3, faculty: [2], sections: [1] },
      { code: 'CN-L', name: 'Networks Lab', type: 'LAB', sessionsPerWeek: 1, faculty: [1], sections: [0] },
    ],
    requirements: [
      [3, 3, 0, 1],
      [3, 0, 3, 0],
    ],
  },
  {
    id: 'lab-heavy',
    label: 'Lab-Heavy Workshop Schedule',
    description: '1 section, 3 labs + 2 theory, 4 faculty, 6 days × 6 periods. Stresses atomic 2-period lab blocks.',
    department: { code: 'MECH', name: 'Mechanical Engineering' },
    workingDays: [...WEEK5, 'SATURDAY'],
    periodsPerDay: 6,
    sections: [{ name: 'MECH-A', year: 1, semester: 2, studentCount: 50 }],
    faculty: [
      { facultyCode: 'F1', name: 'Prof. Sanjay Gupta' },
      { facultyCode: 'F2', name: 'Dr. Priya Desai' },
      { facultyCode: 'F3', name: 'Prof. Manoj Verma' },
      { facultyCode: 'F4', name: 'Dr. Leena George' },
    ],
    subjects: [
      { code: 'WS-M', name: 'Manufacturing Workshop', type: 'LAB', sessionsPerWeek: 2, faculty: [0], sections: [0] },
      { code: 'WS-C', name: 'CAD Lab', type: 'LAB', sessionsPerWeek: 2, faculty: [1], sections: [0] },
      { code: 'TH-L', name: 'Thermodynamics Lab', type: 'LAB', sessionsPerWeek: 1, faculty: [2], sections: [0] },
      { code: 'THERMO', name: 'Thermodynamics', type: 'THEORY', sessionsPerWeek: 4, faculty: [2], sections: [0] },
      { code: 'GRAPH', name: 'Engineering Graphics', type: 'THEORY', sessionsPerWeek: 3, faculty: [3], sections: [0] },
    ],
    requirements: [[2, 2, 1, 4, 3]],
  },
  {
    id: 'enterprise',
  label: 'Enterprise — 9 Sections (Large)',
  description: '9 sections, 8 subjects (5 theory ×7/wk + 3 labs ×1/wk), 40 faculty, 6 days × 7 periods. Fills 41 of 42 weekly periods per section; labs run once a week on a distinct day/time per section.',
    department: { code: 'ENT', name: 'Enterprise Institute of Technology' },
    workingDays: [...WEEK5, 'SATURDAY'],
    periodsPerDay: 7,
    sections: Array.from({ length: 9 }, (_, i) => ({
      name: `SEC-${String.fromCharCode(65 + i)}`,
      year: 2,
      semester: 4,
      studentCount: 55 + (i % 3) * 5,
    })),
    faculty: Array.from({ length: 40 }, (_, i) => ({
      facultyCode: `F${String(i + 1).padStart(2, '0')}`,
      name: `Faculty ${i + 1}`,
    })),
    subjects: [
      // 5 theory subjects — 7 sessions/week each (fills the 7-period day),
      // each backed by a dedicated pool of 4 faculty (~16 periods each/week).
      { code: 'THE-1', name: 'Advanced Algorithms', type: 'THEORY', sessionsPerWeek: 6, faculty: [0, 1, 2, 3], sections: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      { code: 'THE-2', name: 'Distributed Systems', type: 'THEORY', sessionsPerWeek: 6, faculty: [4, 5, 6, 7], sections: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      { code: 'THE-3', name: 'Machine Learning', type: 'THEORY', sessionsPerWeek: 6, faculty: [8, 9, 10, 11], sections: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      { code: 'THE-4', name: 'Compiler Design', type: 'THEORY', sessionsPerWeek: 6, faculty: [12, 13, 14, 15], sections: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      { code: 'THE-5', name: 'Operations Research', type: 'THEORY', sessionsPerWeek: 6, faculty: [16, 17, 18, 19], sections: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      // 6th theory subject closes the packing: 6×6 theory + 3×2-period labs = 42 = full week.
      { code: 'THE-6', name: 'Signal Processing', type: 'THEORY', sessionsPerWeek: 6, faculty: [35, 36, 37, 38], sections: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      // 3 labs — dedicated faculty pools disjoint from theory (5 per lab),
      // so a lab block never competes with a theory session for the same teacher.
      { code: 'LAB-1', name: 'Algorithms Lab', type: 'LAB', sessionsPerWeek: 1, faculty: [20, 21, 22, 23, 24], sections: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      { code: 'LAB-2', name: 'Systems Lab', type: 'LAB', sessionsPerWeek: 1, faculty: [25, 26, 27, 28, 29], sections: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      { code: 'LAB-3', name: 'ML Lab', type: 'LAB', sessionsPerWeek: 1, faculty: [30, 31, 32, 33, 34], sections: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      // Faculty 35–39 remain reserve capacity (available but unassigned).
    ],
    // Per section: 6×6 theory sessions (36 periods) + 3×2-period lab blocks (6 periods) = 42 = 6 days × 7 periods.
    // Fully packed: every period of every day is assigned. Lab days carry 5 theory + 1 lab; other days 6 theory.
    requirements: Array.from({ length: 9 }, () => [6, 6, 6, 6, 6, 6, 1, 1, 1]),
    generationSettings: {
      // Note: cap 2 (not 1) — with only 36 required periods (slack), cap 1 makes
      // the greedy backtracking search thrash; cap 2 solves in ~1s with 0 backtracks.
      maxSessionsPerSubjectPerDay: 2,
      maxLabSessionsPerSectionPerDay: 1,
    },
  },
];

export function getPresetById(id: string): PresetDefinition | undefined {
  return BUILT_IN_PRESETS.find((p) => p.id === id);
}

type WorkspaceStore = ReturnType<typeof useWorkspaceStore.getState>;

/**
 * Apply a preset: creates the department, sections, subjects, faculty and
 * requirement/assignment wiring in one go. Returns the new department ID.
 */
export function applyPreset(preset: PresetDefinition, store: WorkspaceStore): string {
  const department = store.addDepartment({
    code: preset.department.code,
    name: preset.department.name,
    workingDays: [...preset.workingDays],
    periodsPerDay: preset.periodsPerDay,
  });

  store.updateDepartment(department.id, { status: 'READY' });

  const facultyIds = preset.faculty.map((f) =>
    store.addFaculty({
      departmentId: department.id,
      facultyCode: f.facultyCode,
      name: f.name,
      subjectIds: [],
      sectionIds: [],
      availability: [],
      preferredSlots: [],
      maxPeriodsPerDay: null,
      maxPeriodsPerWeek: null,
    }).id,
  );

  const sectionIds = preset.sections.map((s) =>
    store.addSection({
      departmentId: department.id,
      name: s.name,
      year: s.year,
      semester: s.semester,
      studentCount: s.studentCount,
      subjectRequirements: [],
    }).id,
  );

  const subjectIds = preset.subjects.map((s) =>
    store.addSubject({
      departmentId: department.id,
      code: s.code,
      name: s.name,
      type: s.type,
      sessionsPerWeek: s.sessionsPerWeek,
      durationPeriods: s.type === 'LAB' ? 2 : 1,
      eligibleFacultyIds: s.faculty.map((i) => facultyIds[i]),
      eligibleSectionIds: s.sections.map((i) => sectionIds[i]),
    }).id,
  );

  // Wire requirements per section from the matrix.
  preset.requirements.forEach((subjectSessions, sectionIdx) => {
    const reqs = subjectSessions
      .map((sessionsPerWeek, subjectIdx) => ({ subjectId: subjectIds[subjectIdx], sessionsPerWeek }))
      .filter((r) => r.sessionsPerWeek > 0)
      .map((r) => ({ id: `req_${sectionIds[sectionIdx]}_${r.subjectId}`, ...r }));
    store.updateSection(sectionIds[sectionIdx], { subjectRequirements: reqs });
  });

  // Presets may declare generation settings overrides (e.g. per-day caps).
  if (preset.generationSettings) {
    store.setGenerationSettingsOverrides(department.id, preset.generationSettings);
  }

  store.setActiveDepartment(department.id);
  return department.id;
}

