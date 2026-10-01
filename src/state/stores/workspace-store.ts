import { create } from 'zustand';
import { generateId } from '@/domain/models/ids';
import type {
  CollegeDetails,
  Department,
  Faculty,
  GenerationMetadata,
  Section,
  Subject,
  Timetable,
} from '@/domain/models';
import { EMPTY_COLLEGE_DETAILS } from '@/domain/models';
import type { WorkingDay } from '@/domain/enums';

export interface GenerationSettingsOverrides {
  maxSessionsPerSubjectPerDay: number | null;
  maxLabSessionsPerSectionPerDay: number | null;
  /** Search duration budget in ms (overrides the default). */
  maxSearchDurationMs: number | null;
  /** Search node budget (overrides the default). */
  maxExploredNodes: number | null;
}

export interface WorkspaceState {
  departments: Department[];
  sections: Section[];
  subjects: Subject[];
  faculty: Faculty[];
  timetables: Timetable[];
  activeDepartmentId: string | null;
  persistenceStatus: 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR';
  /** Per-department generation settings overrides (keyed by department ID). */
  generationSettingsOverrides: Record<string, Partial<GenerationSettingsOverrides>>;
  /** Institution profile (Settings). Descriptive metadata only. */
  collegeDetails: CollegeDetails;

  setActiveDepartment: (id: string | null) => void;
  addDepartment: (input: { code: string; name: string; workingDays: WorkingDay[]; periodsPerDay: number }) => Department;
  updateDepartment: (id: string, patch: Partial<Department>) => void;
  removeDepartment: (id: string) => void;

  addSection: (input: Omit<Section, 'id' | 'active'>) => Section;
  updateSection: (id: string, patch: Partial<Section>) => void;
  removeSection: (id: string) => void;

  addSubject: (input: Omit<Subject, 'id' | 'active'>) => Subject;
  updateSubject: (id: string, patch: Partial<Subject>) => void;
  removeSubject: (id: string) => { blocked: boolean; reason: string | null };

  addFaculty: (input: Omit<Faculty, 'id' | 'active'>) => Faculty;
  updateFaculty: (id: string, patch: Partial<Faculty>) => void;
  removeFaculty: (id: string) => { blocked: boolean; reason: string | null };

  upsertTimetable: (timetable: Timetable) => void;
  setTimetableStatus: (id: string, status: Timetable['status']) => void;
  updateTimetable: (id: string, patch: Partial<Timetable>) => void;

  replaceAll: (payload: {
    departments: Department[];
    sections: Section[];
    subjects: Subject[];
    faculty: Faculty[];
    timetables: Timetable[];
    activeDepartmentId: string | null;
    generationSettingsOverrides?: Record<string, Partial<GenerationSettingsOverrides>>;
    collegeDetails?: CollegeDetails;
  }) => void;
  setPersistenceStatus: (status: WorkspaceState['persistenceStatus']) => void;
  setCollegeDetails: (details: CollegeDetails) => void;
  setGenerationSettingsOverrides: (
    departmentId: string,
    overrides: Partial<GenerationSettingsOverrides>,
  ) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  departments: [],
  sections: [],
  subjects: [],
  faculty: [],
  timetables: [],
  activeDepartmentId: null,
  persistenceStatus: 'IDLE',
  generationSettingsOverrides: {},
  collegeDetails: EMPTY_COLLEGE_DETAILS,

  setActiveDepartment: (id) => set({ activeDepartmentId: id }),

  addDepartment: (input) => {
    const now = new Date().toISOString();
    const department: Department = {
      id: generateId('dept'),
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    set((s) => ({ departments: [...s.departments, department], activeDepartmentId: department.id }));
    return department;
  },

  updateDepartment: (id, patch) =>
    set((s) => ({
      departments: s.departments.map((d) =>
        d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d,
      ),
    })),

  removeDepartment: (id) =>
    set((s) => ({
      departments: s.departments.filter((d) => d.id !== id),
      sections: s.sections.filter((x) => x.departmentId !== id),
      subjects: s.subjects.filter((x) => x.departmentId !== id),
      faculty: s.faculty.filter((x) => x.departmentId !== id),
      timetables: s.timetables.filter((t) => t.departmentId !== id),
      activeDepartmentId: s.activeDepartmentId === id ? null : s.activeDepartmentId,
    })),

  addSection: (input) => {
    const section: Section = { ...input, id: generateId('sec'), active: true };
    set((s) => ({ sections: [...s.sections, section] }));
    return section;
  },

  updateSection: (id, patch) =>
    set((s) => ({ sections: s.sections.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

  removeSection: (id) => set((s) => ({ sections: s.sections.filter((x) => x.id !== id) })),

  addSubject: (input) => {
    const subject: Subject = { ...input, id: generateId('sub'), active: true };
    set((s) => ({ subjects: [...s.subjects, subject] }));
    return subject;
  },

  updateSubject: (id, patch) =>
    set((s) => ({ subjects: s.subjects.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

  /** Reference-safe delete (§35, §112): block hard delete when timetable references exist. */
  removeSubject: (id) => {
    const state = get();
    const referenced = state.timetables.some((t) => t.entries.some((e) => e.subjectId === id));
    if (referenced) {
      // Soft-deactivate instead
      set((s) => ({ subjects: s.subjects.map((x) => (x.id === id ? { ...x, active: false } : x)) }));
      return { blocked: true, reason: 'Subject is referenced by a timetable; it was deactivated instead.' };
    }
    set((s) => ({ subjects: s.subjects.filter((x) => x.id !== id) }));
    return { blocked: false, reason: null };
  },

  addFaculty: (input) => {
    const member: Faculty = { ...input, id: generateId('fac'), active: true };
    set((s) => ({ faculty: [...s.faculty, member] }));
    return member;
  },

  updateFaculty: (id, patch) =>
    set((s) => ({ faculty: s.faculty.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

  removeFaculty: (id) => {
    const state = get();
    const referenced = state.timetables.some((t) => t.entries.some((e) => e.facultyId === id));
    if (referenced) {
      set((s) => ({ faculty: s.faculty.map((x) => (x.id === id ? { ...x, active: false } : x)) }));
      return { blocked: true, reason: 'Faculty is referenced by a timetable; it was deactivated instead.' };
    }
    set((s) => ({ faculty: s.faculty.filter((x) => x.id !== id) }));
    return { blocked: false, reason: null };
  },

  upsertTimetable: (timetable) =>
    set((s) => {
      const idx = s.timetables.findIndex((t) => t.id === timetable.id);
      if (idx >= 0) {
        const next = [...s.timetables];
        next[idx] = timetable;
        return { timetables: next };
      }
      return { timetables: [...s.timetables, timetable] };
    }),

  setTimetableStatus: (id, status) =>
    set((s) => ({
      timetables: s.timetables.map((t) => (t.id === id ? { ...t, status } : t)),
    })),

  updateTimetable: (id, patch) =>
    set((s) => ({
      timetables: s.timetables.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
      ),
    })),

  replaceAll: (payload) =>
    set({
      ...payload,
      collegeDetails: payload.collegeDetails ?? EMPTY_COLLEGE_DETAILS,
      persistenceStatus: 'IDLE',
    }),
  setPersistenceStatus: (persistenceStatus) => set({ persistenceStatus }),

  setCollegeDetails: (collegeDetails) => set({ collegeDetails }),

  setGenerationSettingsOverrides: (departmentId, overrides) =>
    set((s) => ({
      generationSettingsOverrides: {
        ...s.generationSettingsOverrides,
        [departmentId]: { ...s.generationSettingsOverrides[departmentId], ...overrides },
      },
    })),
}));

/* ---------- Selectors (§86) ---------- */

export const selectActiveDepartment = (s: WorkspaceState): Department | null =>
  s.departments.find((d) => d.id === s.activeDepartmentId) ?? null;

export const selectCurrentSections = (s: WorkspaceState): Section[] =>
  s.sections.filter((x) => x.departmentId === s.activeDepartmentId);

export const selectCurrentSubjects = (s: WorkspaceState): Subject[] =>
  s.subjects.filter((x) => x.departmentId === s.activeDepartmentId);

export const selectCurrentFaculty = (s: WorkspaceState): Faculty[] =>
  s.faculty.filter((x) => x.departmentId === s.activeDepartmentId);

export const selectTimetableForActiveDepartment = (s: WorkspaceState): Timetable | null =>
  s.timetables.find((t) => t.departmentId === s.activeDepartmentId) ?? null;

export function selectTimetableEntriesForSection(
  timetable: Timetable | null,
  sectionId: string,
): Timetable['entries'] {
  return timetable ? timetable.entries.filter((e) => e.sectionId === sectionId) : [];
}

export function selectFacultyWeeklyLoad(
  faculty: Faculty[],
  entries: Timetable['entries'],
): Map<string, number> {
  const load = new Map<string, number>();
  for (const f of faculty) load.set(f.id, 0);
  for (const e of entries) {
    load.set(e.facultyId, (load.get(e.facultyId) ?? 0) + e.durationPeriods);
  }
  return load;
}

export type { GenerationMetadata };
