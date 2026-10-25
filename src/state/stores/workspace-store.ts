import { create } from 'zustand';
import { generateId } from '@/domain/models/ids';
import type {
  CollegeDetails,
  Department,
  Faculty,
  GenerationMetadata,
  InstitutionalMembership,
  PeriodTiming,
  Section,
  Subject,
  Timetable,
  Room,
  Break,
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
  maxConsecutiveTheory: number | null;
  maxGapsPerDay: number | null;
}

export interface WorkspaceState {
  departments: Department[];
  sections: Section[];
  subjects: Subject[];
  faculty: Faculty[];
  timetables: Timetable[];
  rooms: Room[];
  breaks: Break[];
  activeDepartmentId: string | null;
  activeTimetableId: string | null;
  persistenceStatus: 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR' | 'OFFLINE';
  /** Per-department generation settings overrides (keyed by department ID). */
  generationSettingsOverrides: Record<string, Partial<GenerationSettingsOverrides>>;
  /** Institution profile (Settings). Descriptive metadata only. */
  collegeDetails: CollegeDetails;
  /** Current institutional user membership & role (§RBAC). */
  membership: InstitutionalMembership | null;

  setActiveDepartment: (id: string | null) => void;
  setActiveTimetable: (id: string | null) => void;
  addDepartment: (input: { code: string; name: string; workingDays: WorkingDay[]; periodsPerDay: number; periodTimings?: PeriodTiming[] }) => Department;
  updateDepartment: (id: string, patch: Partial<Department>) => void;
  clearDepartmentResources: (id: string) => void;
  removeDepartment: (id: string) => void;

  addSection: (input: Omit<Section, 'id' | 'active'>) => Section;
  updateSection: (id: string, patch: Partial<Section>) => void;
  removeSection: (id: string) => { blocked: boolean; reason: string | null };

  addSubject: (input: Omit<Subject, 'id' | 'active'>) => Subject;
  updateSubject: (id: string, patch: Partial<Subject>) => void;
  removeSubject: (id: string) => { blocked: boolean; reason: string | null };

  addFaculty: (input: Omit<Faculty, 'id' | 'active'>) => Faculty;
  updateFaculty: (id: string, patch: Partial<Faculty>) => void;
  removeFaculty: (id: string) => { blocked: boolean; reason: string | null };

  upsertTimetable: (timetable: Timetable) => void;
  setTimetableStatus: (id: string, status: Timetable['status']) => void;
  updateTimetable: (id: string, patch: Partial<Timetable>) => void;
  removeTimetable: (idOrDepartmentId: string) => void;

  addRoom: (input: Omit<Room, 'id' | 'active'>) => Room;
  updateRoom: (id: string, patch: Partial<Room>) => void;
  removeRoom: (id: string) => { blocked: boolean; reason: string | null };

  addBreak: (input: Omit<Break, 'id'>) => Break;
  updateBreak: (id: string, patch: Partial<Break>) => void;
  removeBreak: (id: string) => void;

  replaceAll: (payload: {
    departments: Department[];
    sections: Section[];
    subjects: Subject[];
    faculty: Faculty[];
    timetables: Timetable[];
    rooms?: Room[];
    breaks?: Break[];
    activeDepartmentId: string | null;
    activeTimetableId?: string | null;
    generationSettingsOverrides?: Record<string, Partial<GenerationSettingsOverrides>>;
    collegeDetails?: CollegeDetails;
    membership?: InstitutionalMembership | null;
  }) => void;
  setMembership: (membership: InstitutionalMembership | null) => void;
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
  rooms: [],
  breaks: [],
  activeDepartmentId: null,
  activeTimetableId: null,
  persistenceStatus: 'IDLE',
  generationSettingsOverrides: {},
  collegeDetails: EMPTY_COLLEGE_DETAILS,
  membership: null,

  setActiveDepartment: (id) =>
    set((s) => ({
      activeDepartmentId: id,
      activeTimetableId:
        id && s.activeTimetableId && s.timetables.some((t) => t.id === s.activeTimetableId && t.departmentId === id)
          ? s.activeTimetableId
          : null,
    })),
  setActiveTimetable: (id) => set({ activeTimetableId: id }),

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

  clearDepartmentResources: (id) =>
    set((s) => ({
      sections: s.sections.filter((item) => item.departmentId !== id),
      subjects: s.subjects.filter((item) => item.departmentId !== id),
      faculty: s.faculty.filter((item) => item.departmentId !== id),
      timetables: s.timetables.filter((item) => item.departmentId !== id),
      rooms: s.rooms.filter((item) => item.departmentId !== id),
      breaks: s.breaks.filter((item) => item.departmentId !== id),
      activeTimetableId:
        s.activeTimetableId && s.timetables.some((item) => item.id === s.activeTimetableId && item.departmentId === id)
          ? null
          : s.activeTimetableId,
      generationSettingsOverrides: Object.fromEntries(
        Object.entries(s.generationSettingsOverrides).filter(([departmentId]) => departmentId !== id),
      ),
    })),

  removeDepartment: (id) =>
    set((s) => {
      const nextDepartments = s.departments.filter((department) => department.id !== id);
      const nextTimetables = s.timetables.filter((timetable) => timetable.departmentId !== id);
      const nextActiveDepartmentId =
        s.activeDepartmentId === id ? nextDepartments[0]?.id ?? null : s.activeDepartmentId;
      const nextActiveTimetableId =
        s.activeTimetableId && !nextTimetables.some((timetable) => timetable.id === s.activeTimetableId)
          ? nextTimetables.find((timetable) => timetable.departmentId === nextActiveDepartmentId)?.id ?? null
          : s.activeTimetableId;

      return {
        departments: nextDepartments,
        sections: s.sections.filter((item) => item.departmentId !== id),
        subjects: s.subjects.filter((item) => item.departmentId !== id),
        faculty: s.faculty.filter((item) => item.departmentId !== id),
        timetables: nextTimetables,
        rooms: s.rooms.filter((item) => item.departmentId !== id),
        breaks: s.breaks.filter((item) => item.departmentId !== id),
        activeDepartmentId: nextActiveDepartmentId,
        activeTimetableId: nextActiveTimetableId,
        generationSettingsOverrides: Object.fromEntries(
          Object.entries(s.generationSettingsOverrides).filter(([departmentId]) => departmentId !== id),
        ),
        membership:
          s.membership?.departmentId === id
            ? { ...s.membership, departmentId: null }
            : s.membership,
      };
    }),

  addSection: (input) => {
    const section: Section = { ...input, id: generateId('sec'), active: true };
    set((s) => ({ sections: [...s.sections, section] }));
    return section;
  },

  updateSection: (id, patch) =>
    set((s) => ({ sections: s.sections.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

  removeSection: (id) => {
    const state = get();
    const referenced = state.timetables.some((timetable) =>
      timetable.entries.some((entry) => entry.sectionId === id),
    );
    if (referenced) {
      set((s) => ({
        sections: s.sections.map((section) =>
          section.id === id ? { ...section, active: false } : section,
        ),
      }));
      return { blocked: true, reason: 'Section is referenced by a timetable; it was deactivated instead.' };
    }

    set((s) => ({
      sections: s.sections.filter((section) => section.id !== id),
      subjects: s.subjects.map((subject) => ({
        ...subject,
        eligibleSectionIds: subject.eligibleSectionIds.filter((sectionId) => sectionId !== id),
      })),
    }));
    return { blocked: false, reason: null };
  },

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
        return { timetables: next, activeTimetableId: timetable.id };
      }
      return { timetables: [...s.timetables, timetable], activeTimetableId: timetable.id };
    }),

  setTimetableStatus: (id, status) =>
    set((s) => ({
      timetables: s.timetables.map((t) => (t.id === id ? ({ ...t, status } as unknown as Timetable) : t)),
    })),

  updateTimetable: (id, patch) =>
    set((s) => ({
      timetables: s.timetables.map((t) =>
        t.id === id ? ({ ...t, ...patch, updatedAt: new Date().toISOString() } as unknown as Timetable) : t,
      ),
    })),

  removeTimetable: (idOrDepartmentId) =>
    set((s) => {
      const target = s.timetables.find(
        (t) => t.id === idOrDepartmentId || t.departmentId === idOrDepartmentId,
      );
      const removingById = s.timetables.some((t) => t.id === idOrDepartmentId);
      const nextTimetables = s.timetables.filter(
        (t) => removingById ? t.id !== idOrDepartmentId : t.departmentId !== idOrDepartmentId,
      );
      const deptId = target?.departmentId ?? idOrDepartmentId;
      const activeWasRemoved = s.activeTimetableId
        ? !nextTimetables.some((t) => t.id === s.activeTimetableId)
        : false;
      const nextActiveTimetable = activeWasRemoved
        ? nextTimetables.find((t) => t.departmentId === deptId)?.id ?? null
        : s.activeTimetableId;
      const nextDepartments = s.departments.map((d) =>
        d.id === deptId && !nextTimetables.some((t) => t.departmentId === deptId) && d.status !== 'ARCHIVED'
          ? { ...d, status: 'READY' as const }
          : d,
      );
      return {
        timetables: nextTimetables,
        departments: nextDepartments,
        activeTimetableId: nextActiveTimetable,
      };
    }),

  addRoom: (input) => {
    const room = { ...input, id: generateId('room'), active: true };
    set((state) => ({ rooms: [...state.rooms, room] }));
    return room;
  },
  updateRoom: (id, patch) =>
    set((state) => ({ rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  removeRoom: (id) => {
    const state = get();
    const referenced = state.timetables.some((timetable) =>
      timetable.entries.some((entry) => entry.roomId === id),
    );
    if (referenced) {
      set((s) => ({
        rooms: s.rooms.map((room) => (room.id === id ? { ...room, active: false } : room)),
      }));
      return { blocked: true, reason: 'Room is referenced by a timetable; it was disabled instead.' };
    }
    set((s) => ({ rooms: s.rooms.filter((room) => room.id !== id) }));
    return { blocked: false, reason: null };
  },

  addBreak: (input) => {
    const brk = { ...input, id: generateId('break') };
    set((state) => ({ breaks: [...state.breaks, brk] }));
    return brk;
  },
  updateBreak: (id, patch) =>
    set((state) => ({ breaks: state.breaks.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
  removeBreak: (id) => set((state) => ({ breaks: state.breaks.filter((b) => b.id !== id) })),

  replaceAll: (payload) =>
    set((s) => ({
      ...payload,
      departments: payload.departments ?? [],
      sections: payload.sections ?? [],
      subjects: payload.subjects ?? [],
      faculty: payload.faculty ?? [],
      timetables: payload.timetables ?? [],
      rooms: payload.rooms ?? [],
      breaks: payload.breaks ?? [],
      activeTimetableId: payload.activeTimetableId ?? null,
      generationSettingsOverrides: payload.generationSettingsOverrides ?? {},
      collegeDetails: payload.collegeDetails ?? EMPTY_COLLEGE_DETAILS,
      membership: payload.membership !== undefined ? payload.membership : s.membership,
      persistenceStatus: 'IDLE',
    })),
  setMembership: (membership) => set({ membership }),
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
  selectTimetableForDepartment(s, s.activeDepartmentId);

export const selectTimetablesForDepartment = (
  s: WorkspaceState,
  departmentId: string | null,
): Timetable[] => s.timetables.filter((t) => t.departmentId === departmentId);

export const selectTimetableForDepartment = (
  s: WorkspaceState,
  departmentId: string | null,
): Timetable | null => {
  const timetables = selectTimetablesForDepartment(s, departmentId);
  return timetables.find((t) => t.id === s.activeTimetableId) ?? timetables[0] ?? null;
};

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
