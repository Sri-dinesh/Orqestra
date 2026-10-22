import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { StorageService } from '@/storage';
import type { PersistedWorkspace } from '@/storage/workspace-document';
import type { LoadOutcome } from '@/storage';
import { LocalStorageAdapter } from '@/storage/adapters/local-storage-adapter';
import { fetchCloudWorkspace, saveCloudWorkspace } from '@/storage/cloud-sync';
import { getActiveTermId, syncTermsFromCloud } from '@/storage/term-manager';

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
 * Enterprise cloud-first persistence with local fallback cache (§37.3, §88).
 * Fast local-storage load on mount, background authoritative sync from Neon Postgres,
 * debounced cloud persistence, and automatic local-to-cloud migration.
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

    // 1. Instant local-storage cache hydration
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

    // 2. Authoritative background sync from Neon Postgres (when authenticated)
    if (namespace !== 'anonymous') {
      const activeTermId = getActiveTermId();
      fetchCloudWorkspace(activeTermId).then((cloudData) => {
        if (!cloudData) return;

        // Keep local term manager in sync with cloud terms
        syncTermsFromCloud(cloudData.terms, cloudData.activeTermId);

        const hasCloudData =
          cloudData.workspace.departments.length > 0 ||
          cloudData.workspace.timetables.length > 0 ||
          Boolean(cloudData.workspace.collegeDetails?.name);

        const hasLocalData = (outcome.workspace?.payload.departments.length ?? 0) > 0;

        if (cloudData.membership) {
          useWorkspaceStore.getState().setMembership(cloudData.membership);
        }

        if (hasCloudData) {
          // Cloud has authoritative data: update store and mirror to local cache
          useWorkspaceStore.getState().replaceAll({
            departments: cloudData.workspace.departments,
            sections: cloudData.workspace.sections,
            subjects: cloudData.workspace.subjects,
            faculty: cloudData.workspace.faculty,
            timetables: cloudData.workspace.timetables,
            rooms: cloudData.workspace.rooms,
            breaks: cloudData.workspace.breaks,
            activeDepartmentId: cloudData.workspace.activeDepartmentId,
            generationSettingsOverrides: cloudData.workspace.generationSettingsOverrides,
            collegeDetails: cloudData.workspace.collegeDetails,
            membership: cloudData.membership ?? null,
          });

          service.save(cloudData.workspace);
          useWorkspaceStore.getState().setPersistenceStatus('SAVED');
        } else if (hasLocalData && outcome.workspace) {
          // Local has data from pre-login/preset: automatically migrate to cloud (unless read-only faculty)!
          if (cloudData.membership?.role !== 'FACULTY') {
            useWorkspaceStore.getState().setPersistenceStatus('SAVING');
            saveCloudWorkspace(outcome.workspace.payload, cloudData.activeTermId).then(
              (res) => {
                useWorkspaceStore
                  .getState()
                  .setPersistenceStatus(res.ok ? 'SAVED' : 'ERROR');
              },
            );
          } else {
            useWorkspaceStore.getState().setPersistenceStatus('SAVED');
          }
        } else {
          useWorkspaceStore.getState().setPersistenceStatus('SAVED');
        }
      });
    }
  }, [namespace]);

  // Debounced persistence on store updates
  useEffect(() => {
    if (firstRun.current) return;
    if (state.persistenceStatus === 'SAVING') return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const service = getStorageService(namespace);
      useWorkspaceStore.getState().setPersistenceStatus('SAVING');

      const payload = {
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
      };

      // A. Write to local storage cache immediately
      try {
        service.save(payload, (getStoredCreatedAt() as string | null) ?? undefined);
      } catch (e) {
        console.warn('Local storage cache save failed:', e);
      }

      // B. Write to Neon Postgres if authenticated (and role is not read-only faculty)
      const currentRole = useWorkspaceStore.getState().membership?.role;
      if (namespace !== 'anonymous') {
        if (currentRole === 'FACULTY') {
          useWorkspaceStore.getState().setPersistenceStatus('SAVED');
          return;
        }

        const activeTermId = getActiveTermId();
        saveCloudWorkspace(payload, activeTermId)
          .then((res) => {
            if (res.ok) {
              useWorkspaceStore.getState().setPersistenceStatus('SAVED');
            } else {
              console.warn('Cloud sync error:', res.error);
              useWorkspaceStore.getState().setPersistenceStatus('OFFLINE');
            }
          })
          .catch((err) => {
            console.warn('Cloud sync network error:', err);
            useWorkspaceStore.getState().setPersistenceStatus('OFFLINE');
          });
      } else {
        useWorkspaceStore.getState().setPersistenceStatus('SAVED');
      }
    }, 600);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [
    namespace,
    state.departments,
    state.sections,
    state.subjects,
    state.faculty,
    state.timetables,
    state.rooms,
    state.breaks,
    state.activeDepartmentId,
    state.generationSettingsOverrides,
    state.collegeDetails,
  ]);

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
 * Immediately persist the current workspace to Local Storage and Neon Postgres,
 * bypassing debounce.
 */
export function flushPersistence(): void {
  const state = useWorkspaceStore.getState();
  const service = getStorageService();

  const payload = {
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
  };

  try {
    service.save(payload, (getStoredCreatedAt() as string | null) ?? undefined);
    state.setPersistenceStatus('SAVED');
  } catch {
    state.setPersistenceStatus('ERROR');
  }

  if (activeStorageNamespace !== 'anonymous') {
    const activeTermId = getActiveTermId();
    state.setPersistenceStatus('SAVING');
    saveCloudWorkspace(payload, activeTermId).then((res) => {
      state.setPersistenceStatus(res.ok ? 'SAVED' : 'OFFLINE');
    });
  }
}

export type { PersistedWorkspace };
