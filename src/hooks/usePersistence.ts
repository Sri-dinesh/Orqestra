import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { StorageService } from '@/storage';
import type { PersistedWorkspace } from '@/storage/workspace-document';
import type { LoadOutcome } from '@/storage';
import { LocalStorageAdapter } from '@/storage/adapters/local-storage-adapter';

const storageServices = new Map<string, StorageService>();
let activeStorageNamespace = 'anonymous';

export function clearInMemoryWorkspace() {
  useWorkspaceStore.getState().replaceAll({
    departments: [],
    sections: [],
    subjects: [],
    faculty: [],
    timetables: [],
    rooms: [],
    breaks: [],
    activeDepartmentId: null,
  });
}

export function getStorageService(namespace = activeStorageNamespace): StorageService {
  const existing = storageServices.get(namespace);
  if (existing) return existing;

  const service = new StorageService(new LocalStorageAdapter(namespace));
  storageServices.set(namespace, service);
  return service;
}

/**
 * Load-on-mount and debounced save on committed state changes (§37.3, §88).
 * Corrupted storage surfaces recovery state instead of crashing.
 */
export function usePersistence(namespace = 'anonymous'): LoadOutcome | null {
  const outcomeRef = useRef<LoadOutcome | null>(null);
  const state = useWorkspaceStore();
  const firstRun = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  activeStorageNamespace = namespace;

  useEffect(() => {
    if (!firstRun.current) return;
    firstRun.current = false;
    const service = getStorageService(namespace);
    const outcome = service.load();
    outcomeRef.current = outcome;
    if (outcome.workspace) {
      useWorkspaceStore.getState().replaceAll({
        departments: outcome.workspace.payload.departments,
        sections: outcome.workspace.payload.sections,
        subjects: outcome.workspace.payload.subjects,
        faculty: outcome.workspace.payload.faculty,
        timetables: outcome.workspace.payload.timetables,
        rooms: outcome.workspace.payload.rooms,
        breaks: outcome.workspace.payload.breaks,
        activeDepartmentId: outcome.workspace.payload.activeDepartmentId,
        generationSettingsOverrides: outcome.workspace.payload.generationSettingsOverrides,
        collegeDetails: outcome.workspace.payload.collegeDetails,
      });
    } else {
      // Never leave another authenticated user's in-memory workspace visible
      // while a fresh or corrupted namespace is being initialized.
      useWorkspaceStore.getState().replaceAll({
        departments: [],
        sections: [],
        subjects: [],
        faculty: [],
        timetables: [],
        rooms: [],
        breaks: [],
        activeDepartmentId: null,
      });
    }
  }, []);

  useEffect(() => {
    if (firstRun.current) return; // skip the initial render before load
    if (state.persistenceStatus === 'SAVING') return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const service = getStorageService(namespace);
      useWorkspaceStore.getState().setPersistenceStatus('SAVING');
      try {
        service.save(
          {
            departments: state.departments,
            sections: state.sections,
            subjects: state.subjects,
            faculty: state.faculty,
            timetables: state.timetables,
            rooms: state.rooms,
            breaks: state.breaks,
            activeDepartmentId: state.activeDepartmentId,
            generationSettingsOverrides: state.generationSettingsOverrides,
            collegeDetails: state.collegeDetails,
          },
          (getStoredCreatedAt() as string | null) ?? undefined,
        );
        useWorkspaceStore.getState().setPersistenceStatus('SAVED');
      } catch {
        useWorkspaceStore.getState().setPersistenceStatus('ERROR');
      }
    }, 500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [namespace, state.departments, state.sections, state.subjects, state.faculty, state.timetables, state.rooms, state.breaks, state.activeDepartmentId, state.generationSettingsOverrides, state.collegeDetails, state.persistenceStatus]);

  return outcomeRef.current;
}

function getStoredCreatedAt(): string | null {
  try {
    const raw = getStorageService().load();
    return raw.workspace?.createdAt ?? null;
  } catch {
    return null;
  }
}

/**
 * Immediately write the current workspace to Local Storage, bypassing the
 * debounce. Call after important one-shot actions (preset apply, import)
 * or before a full page navigation.
 */
export function flushPersistence(): void {
  const state = useWorkspaceStore.getState();
  const service = getStorageService();
  try {
    service.save(
      {
        departments: state.departments,
        sections: state.sections,
        subjects: state.subjects,
        faculty: state.faculty,
        timetables: state.timetables,
        rooms: state.rooms,
        breaks: state.breaks,
        activeDepartmentId: state.activeDepartmentId,
        generationSettingsOverrides: state.generationSettingsOverrides,
        collegeDetails: state.collegeDetails,
      },
      (getStoredCreatedAt() as string | null) ?? undefined,
    );
    state.setPersistenceStatus('SAVED');
  } catch {
    state.setPersistenceStatus('ERROR');
  }
}

export type { PersistedWorkspace };
