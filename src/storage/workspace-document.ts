import type {
  Department,
  Faculty,
  Section,
  Subject,
  Timetable,
} from '@/domain/models';

export interface PersistedWorkspacePayload {
  departments: Department[];
  sections: Section[];
  subjects: Subject[];
  faculty: Faculty[];
  timetables: Timetable[];
  activeDepartmentId: string | null;
}

export interface PersistedWorkspace {
  schemaVersion: number;
  applicationVersion: string;
  createdAt: string;
  updatedAt: string;
  payload: PersistedWorkspacePayload;
}

export const STORAGE_KEYS = {
  workspace: 'wts:v1:workspace',
  preferences: 'wts:v1:preferences',
  metadata: 'wts:v1:metadata',
} as const;
