import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { StorageService } from '@/storage';
import type { PersistedWorkspace } from '@/storage/workspace-document';
import type { LoadOutcome } from '@/storage';

let storageService: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageService) storageService = new StorageService();
  return storageService;
}

/**
 * Load-on-mount and debounced save on committed state changes (§37.3, §88).
 * Corrupted storage surfaces recovery state instead of crashing.
 */
export function usePersistence(): LoadOutcome | null {
  const outcomeRef = useRef<LoadOutcome | null>(null);
  const state = useWorkspaceStore();
  const firstRun = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!firstRun.current) return;
    firstRun.current = false;
    const service = getStorageService();
    const outcome = service.load();
    outcomeRef.current = outcome;
    if (outcome.workspace) {
      useWorkspaceStore.getState().replaceAll({
        departments: outcome.workspace.payload.departments,
        sections: outcome.workspace.payload.sections,
        subjects: outcome.workspace.payload.subjects,
        faculty: outcome.workspace.payload.faculty,
        timetables: outcome.workspace.payload.timetables,
        activeDepartmentId: outcome.workspace.payload.activeDepartmentId,
      });
    }
  }, []);

  useEffect(() => {
    if (firstRun.current) return; // skip the initial render before load
    if (state.persistenceStatus === 'SAVING') return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const service = getStorageService();
      useWorkspaceStore.getState().setPersistenceStatus('SAVING');
      try {
        service.save(
          {
            departments: state.departments,
            sections: state.sections,
            subjects: state.subjects,
            faculty: state.faculty,
            timetables: state.timetables,
            activeDepartmentId: state.activeDepartmentId,
            generationSettingsOverrides: state.generationSettingsOverrides,
          } as never,
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
  }, [state.departments, state.sections, state.subjects, state.faculty, state.timetables, state.activeDepartmentId, state.generationSettingsOverrides, state.persistenceStatus]);

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
        activeDepartmentId: state.activeDepartmentId,
        generationSettingsOverrides: state.generationSettingsOverrides,
      } as never,
      (getStoredCreatedAt() as string | null) ?? undefined,
    );
    state.setPersistenceStatus('SAVED');
  } catch {
    state.setPersistenceStatus('ERROR');
  }
}

export type { PersistedWorkspace };
