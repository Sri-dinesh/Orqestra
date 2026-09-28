import { create } from 'zustand';
import type { EditCommand } from '@/application/timetable-edit-commands';

const HISTORY_LIMIT = 100;

export interface EditorState {
  selectedSectionId: string | null;
  selectedEntryId: string | null;
  undoStack: EditCommand[];
  redoStack: EditCommand[];
  lastToast: { kind: 'success' | 'error' | 'warning'; message: string; id: number } | null;

  selectSection: (id: string | null) => void;
  selectEntry: (id: string | null) => void;
  pushHistory: (command: EditCommand) => void;
  clearHistory: () => void;
  showToast: (kind: 'success' | 'error' | 'warning', message: string) => void;
  clearToast: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedSectionId: null,
  selectedEntryId: null,
  undoStack: [],
  redoStack: [],
  lastToast: null,

  selectSection: (id) => set({ selectedSectionId: id }),
  selectEntry: (id) => set({ selectedEntryId: id }),

  pushHistory: (command) =>
    set((s) => ({
      undoStack: [...s.undoStack, command].slice(-HISTORY_LIMIT),
      redoStack: [],
    })),
  clearHistory: () => set({ undoStack: [], redoStack: [] }),
  showToast: (kind, message) => set({ lastToast: { kind, message, id: Date.now() } }),
  clearToast: () => set({ lastToast: null }),
}));

/** Pop from undo stack; pushes onto redo stack. */
export function popUndoCommand(): EditCommand | null {
  const { undoStack, redoStack } = useEditorStore.getState();
  if (undoStack.length === 0) return null;
  const popped = undoStack[undoStack.length - 1];
  useEditorStore.setState({
    undoStack: undoStack.slice(0, -1),
    redoStack: [...redoStack, popped].slice(-HISTORY_LIMIT),
  });
  return popped;
}

/** Pop from redo stack; caller re-executes the command. */
export function popRedoCommand(): EditCommand | null {
  const { redoStack } = useEditorStore.getState();
  if (redoStack.length === 0) return null;
  const popped = redoStack[redoStack.length - 1];
  useEditorStore.setState({ redoStack: redoStack.slice(0, -1) });
  return popped;
}
