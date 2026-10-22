import type { PersistedWorkspacePayload } from './workspace-document';
import { STORAGE_KEYS } from './workspace-document';

export interface AcademicTerm {
  id: string;
  name: string;
  academicYear: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: {
    departments: number;
    sections: number;
    faculty: number;
    rooms: number;
  };
}

export interface CloneTermOptions {
  name: string;
  academicYear: string;
  includeFaculty: boolean;
  includeRooms: boolean;
  includeDepartments: boolean;
  includeSubjects: boolean;
  includeTimetables: boolean;
}

const TERMS_STORAGE_KEY = 'wts:v1:academic_terms';
const ACTIVE_TERM_STORAGE_KEY = 'wts:v1:active_term_id';

function getBacking(): Storage | { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; removeItem: (k: string) => void } {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    /* fallback to memory */
  }
  const memoryStore = new Map<string, string>();
  return {
    getItem: (k: string) => memoryStore.get(k) ?? null,
    setItem: (k: string, v: string) => memoryStore.set(k, v),
    removeItem: (k: string) => memoryStore.delete(k),
  };
}

export function listTerms(): AcademicTerm[] {
  const backing = getBacking();
  const raw = backing.getItem(TERMS_STORAGE_KEY);
  if (!raw) {
    const defaultTerm: AcademicTerm = {
      id: 'default',
      name: 'Academic Year 2026-27 (Odd Sem)',
      academicYear: '2026-27',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    backing.setItem(TERMS_STORAGE_KEY, JSON.stringify([defaultTerm]));
    return [defaultTerm];
  }
  try {
    const terms = JSON.parse(raw);
    return Array.isArray(terms) && terms.length > 0 ? terms : [];
  } catch {
    return [];
  }
}

export function getActiveTermId(): string {
  const backing = getBacking();
  return backing.getItem(ACTIVE_TERM_STORAGE_KEY) || 'default';
}

export function setActiveTermId(termId: string): void {
  const backing = getBacking();
  backing.setItem(ACTIVE_TERM_STORAGE_KEY, termId);
}

export function getActiveTerm(): AcademicTerm {
  const terms = listTerms();
  const activeId = getActiveTermId();
  return terms.find((t) => t.id === activeId) || terms[0] || {
    id: 'default',
    name: 'Default Semester',
    academicYear: '2026-27',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function saveTermWorkspace(termId: string, payload: PersistedWorkspacePayload): void {
  const backing = getBacking();
  const key = termId === 'default' ? STORAGE_KEYS.workspace : `${STORAGE_KEYS.workspace}:${termId}`;
  const now = new Date().toISOString();

  const doc = {
    schemaVersion: 1,
    applicationVersion: '1.0.0',
    createdAt: now,
    updatedAt: now,
    payload,
  };

  backing.setItem(key, JSON.stringify(doc));
  if (termId === getActiveTermId() && termId !== 'default') {
    // Keep legacy key mirrored for safety
    backing.setItem(STORAGE_KEYS.workspace, JSON.stringify(doc));
  }

  // Update stats in terms list
  const terms = listTerms();
  const idx = terms.findIndex((t) => t.id === termId);
  if (idx !== -1) {
    terms[idx] = {
      ...terms[idx],
      updatedAt: now,
      stats: {
        departments: payload.departments.length,
        sections: payload.sections.length,
        faculty: payload.faculty.length,
        rooms: (payload.rooms ?? []).length,
      },
    };
    backing.setItem(TERMS_STORAGE_KEY, JSON.stringify(terms));
  }
}

export function loadTermWorkspace(termId: string): PersistedWorkspacePayload | null {
  const backing = getBacking();
  const key = termId === 'default' ? STORAGE_KEYS.workspace : `${STORAGE_KEYS.workspace}:${termId}`;
  const raw = backing.getItem(key) || (termId === 'default' ? null : backing.getItem(STORAGE_KEYS.workspace));
  if (!raw) return null;
  try {
    const doc = JSON.parse(raw);
    return doc?.payload ?? null;
  } catch {
    return null;
  }
}

export function createTerm(name: string, academicYear: string): AcademicTerm {
  const backing = getBacking();
  const terms = listTerms();
  const id = `term-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newTerm: AcademicTerm = {
    id,
    name: name.trim(),
    academicYear: academicYear.trim(),
    createdAt: now,
    updatedAt: now,
    stats: {
      departments: 0,
      sections: 0,
      faculty: 0,
      rooms: 0,
    },
  };

  const updatedTerms = [...terms, newTerm];
  backing.setItem(TERMS_STORAGE_KEY, JSON.stringify(updatedTerms));

  // Initialize empty workspace payload
  const emptyPayload: PersistedWorkspacePayload = {
    departments: [],
    sections: [],
    subjects: [],
    faculty: [],
    timetables: [],
    rooms: [],
    breaks: [],
    activeDepartmentId: null,
  };
  saveTermWorkspace(id, emptyPayload);

  return newTerm;
}

export function cloneTerm(sourceTermId: string, options: CloneTermOptions): AcademicTerm {
  const backing = getBacking();
  const terms = listTerms();
  const sourcePayload = loadTermWorkspace(sourceTermId) || {
    departments: [],
    sections: [],
    subjects: [],
    faculty: [],
    timetables: [],
    rooms: [],
    breaks: [],
    activeDepartmentId: null,
  };

  const id = `term-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newTerm: AcademicTerm = {
    id,
    name: options.name.trim(),
    academicYear: options.academicYear.trim(),
    createdAt: now,
    updatedAt: now,
    stats: {
      departments: options.includeDepartments ? sourcePayload.departments.length : 0,
      sections: options.includeDepartments ? sourcePayload.sections.length : 0,
      faculty: options.includeFaculty ? sourcePayload.faculty.length : 0,
      rooms: options.includeRooms ? (sourcePayload.rooms ?? []).length : 0,
    },
  };

  // Build cloned payload based on options
  const clonedPayload: PersistedWorkspacePayload = {
    departments: options.includeDepartments ? sourcePayload.departments.map((d) => ({ ...d })) : [],
    sections: options.includeDepartments ? sourcePayload.sections.map((s) => ({ ...s })) : [],
    subjects: options.includeSubjects ? sourcePayload.subjects.map((sub) => ({ ...sub })) : [],
    faculty: options.includeFaculty ? sourcePayload.faculty.map((f) => ({ ...f })) : [],
    rooms: options.includeRooms ? (sourcePayload.rooms ?? []).map((r) => ({ ...r })) : [],
    breaks: sourcePayload.breaks ? sourcePayload.breaks.map((b) => ({ ...b })) : [],
    timetables: options.includeTimetables ? sourcePayload.timetables.map((t) => ({ ...t })) : [],
    activeDepartmentId: options.includeDepartments ? sourcePayload.activeDepartmentId : null,
    collegeDetails: sourcePayload.collegeDetails ? { ...sourcePayload.collegeDetails, academicYear: options.academicYear } : undefined,
  };

  backing.setItem(TERMS_STORAGE_KEY, JSON.stringify([...terms, newTerm]));
  saveTermWorkspace(id, clonedPayload);

  return newTerm;
}

export function updateTerm(termId: string, patch: Partial<Omit<AcademicTerm, 'id' | 'createdAt'>>): void {
  const backing = getBacking();
  const terms = listTerms();
  const idx = terms.findIndex((t) => t.id === termId);
  if (idx !== -1) {
    terms[idx] = {
      ...terms[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    backing.setItem(TERMS_STORAGE_KEY, JSON.stringify(terms));
  }
}

export function deleteTerm(termId: string): boolean {
  const backing = getBacking();
  const terms = listTerms();
  if (terms.length <= 1) return false; // Prevent deleting the sole term

  const updatedTerms = terms.filter((t) => t.id !== termId);
  backing.setItem(TERMS_STORAGE_KEY, JSON.stringify(updatedTerms));

  const key = `${STORAGE_KEYS.workspace}:${termId}`;
  backing.removeItem(key);

  if (getActiveTermId() === termId) {
    setActiveTermId(updatedTerms[0].id);
  }
  return true;
}

export function syncTermsFromCloud(terms: AcademicTerm[], activeTermId?: string): void {
  if (!terms || terms.length === 0) return;
  const backing = getBacking();
  backing.setItem(TERMS_STORAGE_KEY, JSON.stringify(terms));
  if (activeTermId) {
    backing.setItem(ACTIVE_TERM_STORAGE_KEY, activeTermId);
  }
}

