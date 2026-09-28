import { PersistenceError } from '@/domain/errors';
import { STORAGE_KEYS } from '../workspace-document';
import type { PersistedWorkspace } from '../workspace-document';
import type { StorageAdapter } from './types';

/** In-memory map used when localStorage is unavailable (SSR, tests without jsdom storage). */
const memoryStore = new Map<string, string>();

function getBacking(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    /* fall through to memory */
  }
  return {
    getItem: (k: string) => memoryStore.get(k) ?? null,
    setItem: (k: string, v: string) => void memoryStore.set(k, v),
    removeItem: (k: string) => void memoryStore.delete(k),
  };
}

export class LocalStorageAdapter implements StorageAdapter {
  loadWorkspace(): PersistedWorkspace | null {
    const raw = this.getRawPayload();
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as PersistedWorkspace;
    } catch {
      return null; // caller handles corrupted payload via getRawPayload()
    }
  }

  saveWorkspace(workspace: PersistedWorkspace): void {
    try {
      getBacking().setItem(STORAGE_KEYS.workspace, JSON.stringify(workspace));
    } catch (error) {
      throw new PersistenceError('Failed to save workspace to local storage.', {
        cause: String(error),
      });
    }
  }

  clearWorkspace(): void {
    try {
      getBacking().removeItem(STORAGE_KEYS.workspace);
    } catch (error) {
      throw new PersistenceError('Failed to clear workspace.', { cause: String(error) });
    }
  }

  getRawPayload(): string | null {
    return getBacking().getItem(STORAGE_KEYS.workspace);
  }
}
