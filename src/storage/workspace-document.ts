import type {
  Break,
  CollegeDetails,
  Department,
  Faculty,
  Room,
  Section,
  Subject,
  Timetable,
} from '@/domain/models';
import type { GenerationSettingsOverrides } from '@/state/stores/workspace-store';

export interface PersistedWorkspacePayload {
  departments: Department[];
  sections: Section[];
  subjects: Subject[];
  faculty: Faculty[];
  timetables: Timetable[];
  /** Rooms; absent in documents saved before they existed. */
  rooms?: Room[];
  /** Breaks (e.g. lunch); absent in documents saved before they existed. */
  breaks?: Break[];
  activeDepartmentId: string | null;
  /** Institution profile; absent in documents saved before it existed. */
  collegeDetails?: CollegeDetails;
  generationSettingsOverrides?: Record<string, Partial<GenerationSettingsOverrides>>;
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
