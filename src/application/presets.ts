import type { WorkingDay } from '@/domain/enums';
import type { CollegeDetails, PeriodTiming } from '@/domain/models';
import type { useWorkspaceStore } from '@/state/stores/workspace-store';

export interface PresetSubject {
  code: string;
  name: string;
  type: 'THEORY' | 'LAB';
  /** Official course code for exports (e.g. "A8519"). */
  courseCode?: string;
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
  department: { code: string; name: string; effectiveFrom?: string; mentors?: string };
  workingDays: WorkingDay[];
  /** Teaching periods per day (breaks add extra columns, never counted here). */
  periodsPerDay: number;
  sections: Array<{ name: string; year: number; semester: number; studentCount: number; roomNo?: string; classAdvisor?: string }>;
  faculty: Array<{ facultyCode: string; name: string }>;
  subjects: PresetSubject[];
  /** Per-section weekly requirements: [sectionIndex][subjectIndex] = sessions. */
  requirements: number[][];
  /** Optional generation settings applied with the preset. */
  generationSettings?: {
    maxSessionsPerSubjectPerDay?: number | null;
    maxLabSessionsPerSectionPerDay?: number | null;
    maxConsecutiveTheory?: number | null;
    maxGapsPerDay?: number | null;
  };
  rooms?: { code: string; name: string; capacity: number; type: "GENERAL" | "THEORY" | "LAB" }[];
  /** Break positions are teaching-coordinate: startPeriod = "after this many teaching periods". */
  breaks?: { name: string; dayIndex: number | null; startPeriod: number; durationPeriods: number; startTime?: string; endTime?: string }[];
  /** Wall-clock times per teaching period (index-aligned). */
  periodTimings?: PeriodTiming[];
  /** Institution profile applied with the preset (merged over current values). */
  college?: Partial<CollegeDetails>;
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
  {
    id: 'btech-cse-3rd-year',
    label: 'B.Tech CSE 3rd Year',
    description: 'Vardhaman III Year I Semester pattern: 6 Days, 7 Teaching Periods + Break & Lunch, 3 Sections (CSE-G/H/I). Real subjects, faculty, rooms & timings.',
    department: {
      code: 'CSE-3',
      name: 'Computer Science and Engineering',
      effectiveFrom: '01-06-2026',
      mentors: 'Mr. B. J. V. Varma (5BZ-5CW), Ms. Monika Garg (5CX-5DU), Mr. Gireesh K. Agarwal (5DV-5EQ), Ms. Sahezadi Begum (LE43-LE49)',
    },
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    periodsPerDay: 7,
    // Wall-clock times per teaching period (P1–P7), matching the reference timetable.
    periodTimings: [
      { start: '9:10 AM', end: '10:00 AM' },
      { start: '10:10 AM', end: '11:00 AM' },
      { start: '11:10 AM', end: '12:00 PM' },
      { start: '12:00 PM', end: '12:50 PM' },
      { start: '1:40 PM', end: '2:40 PM' },
      { start: '2:40 PM', end: '3:30 PM' },
      { start: '3:30 PM', end: '4:40 PM' },
    ],
    sections: [
      { name: 'CSE-G', year: 3, semester: 5, studentCount: 60, roomNo: '1020', classAdvisor: 'Mr. P. Vikram' },
      { name: 'CSE-H', year: 3, semester: 5, studentCount: 60, roomNo: '1021' },
      { name: 'CSE-I', year: 3, semester: 5, studentCount: 60, roomNo: '1022' },
    ],
    faculty: [
      { facultyCode: 'VTR', name: 'Ms. Varsha Thakur' },
      { facultyCode: 'GAA', name: 'Ms. G. Anusha' },
      { facultyCode: 'PVM', name: 'Mr. P. Vikram' },
      { facultyCode: 'MCA', name: 'Mr. Manish Chhabra' },
      { facultyCode: 'AAI', name: 'Ms. A. Ashwini' },
      { facultyCode: 'GBM', name: 'Dr. Gouse Baig Mohammad' },
      { facultyCode: 'RBP', name: 'Dr. Rajkumar B Patil' },
      { facultyCode: 'RAS', name: 'Ms. R. Arul Selvi' },
      { facultyCode: 'CMA', name: 'Dr. Ch. Madhurya' },
      { facultyCode: 'PKI', name: 'Ms. P. Kaveri' },
      { facultyCode: 'DDS', name: 'Ms. Devika Das' },
      { facultyCode: 'VPI', name: 'Dr. V. Parvathi' },
      { facultyCode: 'YVA', name: 'Dr. Y. Vijayalata' },
    ],
    subjects: [
      { code: 'CNS', name: 'Computer Networks', courseCode: 'A8519', type: 'THEORY', sessionsPerWeek: 6, faculty: [0], sections: [0, 1, 2] },
      { code: 'SEG', name: 'Software Engineering', courseCode: 'A8520', type: 'THEORY', sessionsPerWeek: 5, faculty: [1], sections: [0, 1, 2] },
      { code: 'WTS', name: 'Web Technologies', courseCode: 'A8604', type: 'THEORY', sessionsPerWeek: 5, faculty: [2], sections: [0, 1, 2] },
      { code: 'MLG', name: 'Machine Learning', courseCode: 'A8703', type: 'THEORY', sessionsPerWeek: 6, faculty: [3], sections: [0, 1, 2] },
      { code: 'PE-I', name: 'Professional Elective - I (UML / EHG / DSE)', courseCode: 'A8557 / A8651 / A8851', type: 'THEORY', sessionsPerWeek: 5, faculty: [4, 5, 6, 3], sections: [0, 1, 2] },
      { code: 'MAD', name: 'Mobile Application Development', courseCode: 'A8606', type: 'THEORY', sessionsPerWeek: 2, faculty: [9, 1], sections: [0, 1, 2] },
      { code: 'MADL', name: 'Mobile Application Development Laboratory', type: 'LAB', sessionsPerWeek: 1, faculty: [9, 1], sections: [0, 1, 2] },
      { code: 'RMY', name: 'Research Methodology', courseCode: 'A8035', type: 'THEORY', sessionsPerWeek: 2, faculty: [12], sections: [0, 1, 2] },
      { code: 'LSM', name: 'Library/Sports/Mentoring', courseCode: '--', type: 'THEORY', sessionsPerWeek: 3, faculty: [2], sections: [0, 1, 2] },
      { code: 'WTL', name: 'Web Technologies Laboratory', courseCode: 'A8605', type: 'LAB', sessionsPerWeek: 1, faculty: [2, 7], sections: [0, 1, 2] },
      { code: 'MLL', name: 'Machine Learning Laboratory', courseCode: 'A8704', type: 'LAB', sessionsPerWeek: 1, faculty: [3, 8], sections: [0, 1, 2] },
      { code: 'ACS', name: 'Advanced English Communication Skills Laboratory', courseCode: 'A8012', type: 'LAB', sessionsPerWeek: 1, faculty: [10, 11], sections: [0, 1, 2] },
    ],
    // 6 days × 7 teaching periods = 42 teachable periods required.
    // 34 theory + 4 lab blocks × 2 periods = 42. Full packing!
    requirements: Array.from({ length: 3 }, () => [6, 5, 5, 6, 5, 2, 1, 2, 3, 1, 1, 1]),
    rooms: [
      { code: '1020', name: 'Theory Room 1020', capacity: 70, type: 'THEORY' },
      { code: '1021', name: 'Theory Room 1021', capacity: 70, type: 'THEORY' },
      { code: '1022', name: 'Theory Room 1022', capacity: 70, type: 'THEORY' },
      { code: '1201-A', name: 'WTL Lab A', capacity: 65, type: 'LAB' },
      { code: '1201-B', name: 'WTL Lab B', capacity: 65, type: 'LAB' },
      { code: '1202', name: 'MLL Lab 1202', capacity: 65, type: 'LAB' },
      { code: '1203', name: 'MLL Lab 1203', capacity: 65, type: 'LAB' },
      { code: '1101-A', name: 'MAD Lab A', capacity: 65, type: 'LAB' },
      { code: '1101-B', name: 'MAD Lab B', capacity: 65, type: 'LAB' },
      { code: '5105', name: 'ACS Lab 5105', capacity: 65, type: 'LAB' },
    ],
    breaks: [
      // Teaching-coordinate positions: short break after P2, lunch after the 4 morning periods (P1–P4).
      { name: 'Break', dayIndex: null, startPeriod: 2, durationPeriods: 1, startTime: '11:00 AM', endTime: '11:10 AM' },
      { name: 'Lunch', dayIndex: null, startPeriod: 4, durationPeriods: 1, startTime: '12:50 PM', endTime: '1:40 PM' },
    ],
    generationSettings: {
      maxSessionsPerSubjectPerDay: 2,
      maxLabSessionsPerSectionPerDay: 1,
      maxConsecutiveTheory: 4,
      maxGapsPerDay: 1,
    },
    college: {
      name: 'Vardhaman College of Engineering',
      academicYear: '2026 - 2027',
    },
  }
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
    ...(preset.periodTimings ? { periodTimings: preset.periodTimings.map((t) => ({ ...t })) } : {}),
  });

  store.updateDepartment(department.id, {
    status: 'READY',
    ...(preset.department.effectiveFrom !== undefined
      ? { effectiveFrom: preset.department.effectiveFrom }
      : {}),
    ...(preset.department.mentors !== undefined ? { mentors: preset.department.mentors } : {}),
  });

  if (preset.college) {
    store.setCollegeDetails({ ...store.collegeDetails, ...preset.college });
  }

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
      ...(s.roomNo !== undefined ? { roomNo: s.roomNo } : {}),
      ...(s.classAdvisor !== undefined ? { classAdvisor: s.classAdvisor } : {}),
    }).id,
  );

  const subjectIds = preset.subjects.map((s) =>
    store.addSubject({
      departmentId: department.id,
      code: s.code,
      name: s.name,
      type: s.type,
      ...(s.courseCode !== undefined ? { courseCode: s.courseCode } : {}),
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


  if (preset.rooms) {
    preset.rooms.forEach((r) => {
      store.addRoom({
        departmentId: department.id,
        code: r.code,
        name: r.name,
        capacity: r.capacity,
        type: r.type,
      });
    });
  }

  if (preset.breaks) {
    preset.breaks.forEach((b) => {
      store.addBreak({
        name: b.name,
        dayIndex: b.dayIndex,
        startPeriod: b.startPeriod,
        durationPeriods: b.durationPeriods,
        ...(b.startTime !== undefined ? { startTime: b.startTime } : {}),
        ...(b.endTime !== undefined ? { endTime: b.endTime } : {}),
      });
    });
  }

  // Presets may declare generation settings overrides (e.g. per-day caps).
  if (preset.generationSettings) {
    store.setGenerationSettingsOverrides(department.id, preset.generationSettings);
  }

  store.setActiveDepartment(department.id);
  return department.id;
}

