import type {
  Department,
  Faculty,
  Section,
  Subject,
  TimetableConfiguration,
} from '@/domain/models';
import { DEFAULT_GENERATION_SETTINGS, DEFAULT_HARD_CONSTRAINTS, DEFAULT_SOFT_WEIGHTS } from '@/domain/policies';
import type { WorkingDay } from '@/domain/enums';

let seq = 0;
const uid = (p: string) => `${p}_${(seq++).toString(36)}`;

export interface Dataset {
  department: Department;
  sections: Section[];
  subjects: Subject[];
  faculty: Faculty[];
  config: TimetableConfiguration;
}

function build(
  opts: {
    days?: WorkingDay[];
    periodsPerDay?: number;
    sections: Array<{ name: string; requirements: Array<{ subjectId: string; sessionsPerWeek: number }> }>;
    subjects: Array<{ code: string; type: 'THEORY' | 'LAB'; sessionsPerWeek: number; facultyIdx: number[]; sectionsIdx: number[] }>;
    facultyCount: number;
    maxPeriodsPerWeek?: number | null;
  },
): Dataset {
  const days = opts.days ?? ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const periodsPerDay = opts.periodsPerDay ?? 6;
  const department: Department = {
    id: uid('dept'),
    code: 'CSE',
    name: 'Computer Science',
    workingDays: days,
    periodsPerDay,
    status: 'READY',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const sections: Section[] = opts.sections.map((s) => ({
    id: uid('sec'),
    departmentId: department.id,
    name: s.name,
    year: 2,
    semester: 3,
    studentCount: 60,
    subjectRequirements: s.requirements.map((r) => ({
      id: uid('req'),
      subjectId: r.subjectId,
      sessionsPerWeek: r.sessionsPerWeek,
    })),
    active: true,
  }));
  const subjects: Subject[] = opts.subjects.map((s) => ({
    id: s.code,
    departmentId: department.id,
    code: s.code,
    name: `${s.code} Course`,
    type: s.type,
    sessionsPerWeek: s.sessionsPerWeek,
    durationPeriods: s.type === 'LAB' ? 2 : 1,
    eligibleFacultyIds: s.facultyIdx.map((i) => `F${i}`),
    eligibleSectionIds: s.sectionsIdx.map((i) => sections[i].id),
    active: true,
  }));
  const faculty: Faculty[] = Array.from({ length: opts.facultyCount }, (_, i) => ({
    id: `F${i}`,
    departmentId: department.id,
    facultyCode: `FAC${i}`,
    name: `Faculty ${i}`,
    subjectIds: [],
    sectionIds: [],
    availability: [],
    preferredSlots: [],
    maxPeriodsPerDay: null,
    maxPeriodsPerWeek: opts.maxPeriodsPerWeek ?? null,
    active: true,
  }));
  const config: TimetableConfiguration = {
    workingDays: days,
    periodsPerDay,
    periodDefinitions: Array.from({ length: periodsPerDay }, (_, i) => ({ index: i, label: `P${i + 1}` })),
    sections,
    subjects,
    faculty,
    hardConstraints: DEFAULT_HARD_CONSTRAINTS,
    softWeights: DEFAULT_SOFT_WEIGHTS,
    generationSettings: { ...DEFAULT_GENERATION_SETTINGS, seed: 123456 },
  };
  return { department, sections, subjects, faculty, config };
}

/** Dataset A: minimal valid — 1 section, theory + 1 lab, ample faculty. */
export function datasetMinimal(): Dataset {
  return build({
    sections: [{ name: 'A', requirements: [
      { subjectId: 'MATH', sessionsPerWeek: 4 },
      { subjectId: 'PHY', sessionsPerWeek: 3 },
      { subjectId: 'PHYL', sessionsPerWeek: 1 },
    ] }],
    subjects: [
      { code: 'MATH', type: 'THEORY', sessionsPerWeek: 4, facultyIdx: [0], sectionsIdx: [0] },
      { code: 'PHY', type: 'THEORY', sessionsPerWeek: 3, facultyIdx: [1], sectionsIdx: [0] },
      { code: 'PHYL', type: 'LAB', sessionsPerWeek: 1, facultyIdx: [1, 2], sectionsIdx: [0] },
    ],
    facultyCount: 3,
  });
}

/** Dataset B: shared faculty across two sections. */
export function datasetSharedFaculty(): Dataset {
  return build({
    sections: [
      { name: 'A', requirements: [
        { subjectId: 'CS1', sessionsPerWeek: 3 },
        { subjectId: 'CS2', sessionsPerWeek: 3 },
      ] },
      { name: 'B', requirements: [
        { subjectId: 'CS1', sessionsPerWeek: 3 },
        { subjectId: 'MA1', sessionsPerWeek: 3 },
      ] },
    ],
    subjects: [
      { code: 'CS1', type: 'THEORY', sessionsPerWeek: 3, facultyIdx: [0], sectionsIdx: [0, 1] },
      { code: 'CS2', type: 'THEORY', sessionsPerWeek: 3, facultyIdx: [1], sectionsIdx: [0] },
      { code: 'MA1', type: 'THEORY', sessionsPerWeek: 3, facultyIdx: [2], sectionsIdx: [1] },
    ],
    facultyCount: 3,
  });
}

/** Dataset C: dense labs. */
export function datasetDenseLabs(): Dataset {
  return build({
    periodsPerDay: 6,
    sections: [{ name: 'A', requirements: [
      { subjectId: 'L1', sessionsPerWeek: 2 },
      { subjectId: 'L2', sessionsPerWeek: 2 },
      { subjectId: 'L3', sessionsPerWeek: 2 },
      { subjectId: 'T1', sessionsPerWeek: 6 },
    ] }],
    subjects: [
      { code: 'L1', type: 'LAB', sessionsPerWeek: 2, facultyIdx: [0], sectionsIdx: [0] },
      { code: 'L2', type: 'LAB', sessionsPerWeek: 2, facultyIdx: [1], sectionsIdx: [0] },
      { code: 'L3', type: 'LAB', sessionsPerWeek: 2, facultyIdx: [2], sectionsIdx: [0] },
      { code: 'T1', type: 'THEORY', sessionsPerWeek: 6, facultyIdx: [3], sectionsIdx: [0] },
    ],
    facultyCount: 4,
  });
}

/** Dataset D: impossible — required periods exceed weekly capacity. */
export function datasetImpossibleCapacity(): Dataset {
  return build({
    periodsPerDay: 2,
    sections: [{ name: 'A', requirements: [{ subjectId: 'T1', sessionsPerWeek: 12 }] }],
    subjects: [{ code: 'T1', type: 'THEORY', sessionsPerWeek: 12, facultyIdx: [0], sectionsIdx: [0] }],
    facultyCount: 1,
  });
}

/** Dataset E: impossible — single faculty required far beyond weekly capacity. */
export function datasetFacultyOverload(): Dataset {
  return build({
    sections: [
      { name: 'A', requirements: [{ subjectId: 'T1', sessionsPerWeek: 15 }] },
      { name: 'B', requirements: [{ subjectId: 'T1', sessionsPerWeek: 15 }] },
    ],
    subjects: [{ code: 'T1', type: 'THEORY', sessionsPerWeek: 15, facultyIdx: [0], sectionsIdx: [0, 1] }],
    facultyCount: 1,
    maxPeriodsPerWeek: 20,
  });
}

/** Dataset F: large benchmark — 8 sections, shared faculty, labs. */
export function datasetLarge(): Dataset {
  const sections = Array.from({ length: 8 }, (_, i) => ({
    name: `S${i + 1}`,
    requirements: [] as Array<{ subjectId: string; sessionsPerWeek: number }>,
  }));
  const subjectSpecs: Array<{ code: string; type: 'THEORY' | 'LAB'; sessionsPerWeek: number; facultyIdx: number[]; sectionsIdx: number[] }> = [];
  for (let i = 0; i < 8; i++) {
    sections[i].requirements.push({ subjectId: `CORE${i}`, sessionsPerWeek: 4 });
    subjectSpecs.push({ code: `CORE${i}`, type: 'THEORY', sessionsPerWeek: 4, facultyIdx: [i], sectionsIdx: [i] });
    sections[i].requirements.push({ subjectId: `LAB${i}`, sessionsPerWeek: 1 });
    subjectSpecs.push({ code: `LAB${i}`, type: 'LAB', sessionsPerWeek: 1, facultyIdx: [8 + (i % 4)], sectionsIdx: [i] });
    // Shared math across every other pair of sections
    if (i % 2 === 0) {
      sections[i].requirements.push({ subjectId: 'MATH', sessionsPerWeek: 3 });
      sections[i + 1].requirements.push({ subjectId: 'MATH', sessionsPerWeek: 3 });
    }
  }
  subjectSpecs.push({ code: 'MATH', type: 'THEORY', sessionsPerWeek: 3, facultyIdx: [12, 13, 14], sectionsIdx: sections.map((_, i) => i) });
  return build({
    periodsPerDay: 7,
    days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    sections,
    subjects: subjectSpecs,
    facultyCount: 15,
  });
}
