import type { PersistedWorkspace } from '../workspace-document';

export interface StorageAdapter {
  loadWorkspace(): PersistedWorkspace | null;
  saveWorkspace(workspace: PersistedWorkspace): void;
  clearWorkspace(): void;
  getRawPayload(): string | null;
}
