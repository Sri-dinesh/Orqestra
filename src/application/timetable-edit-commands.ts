import type { Timetable, TimetableEntry } from '@/domain/models';
import type { EditOperation } from '@/domain/enums';

export interface EditCommandPayloads {
  MOVE_ENTRY: { entryId: string; dayIndex: number; startPeriod: number };
  SWAP_ENTRIES: { entryAId: string; entryBId: string };
  CHANGE_SUBJECT: { entryId: string; subjectId: string };
  CHANGE_FACULTY: { entryId: string; facultyId: string };
  CLEAR_ENTRY: { entryId: string };
  ADD_ENTRY: {
    entry: Omit<TimetableEntry, 'id' | 'revision' | 'source'> & { id?: string };
  };
  REMOVE_ENTRY: { entryId: string };
}

export interface EditCommand<T extends EditOperation = EditOperation> {
  operation: T;
  payload: EditCommandPayloads[T];
  affectedEntryIds: string[];
  timestamp: string;
}

export interface EditCommandResult {
  success: boolean;
  timetable: Timetable | null;
  /** Machine-readable reasons when rejected (from targeted validation). */
  conflicts: import('@/domain/models').Conflict[];
}

/** Pure application of a command to a timetable. Returns null payload errors via thrown AppError-free result. */
export function applyEditCommand(
  timetable: Timetable,
  command: EditCommand,
): { entries: TimetableEntry[]; affected: string[]; error: string | null } {
  const entries = [...timetable.entries];
  const affected: string[] = [];

  switch (command.operation) {
    case 'MOVE_ENTRY': {
      const { entryId, dayIndex, startPeriod } = command.payload as EditCommandPayloads['MOVE_ENTRY'];
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) return { entries, affected, error: 'ENTRY_NOT_FOUND' };
      const idx = entries.indexOf(entry);
      entries[idx] = { ...entry, dayIndex, startPeriod };
      affected.push(entryId);
      return { entries, affected, error: null };
    }
    case 'SWAP_ENTRIES': {
      const { entryAId, entryBId } = command.payload as EditCommandPayloads['SWAP_ENTRIES'];
      const a = entries.find((e) => e.id === entryAId);
      const b = entries.find((e) => e.id === entryBId);
      if (!a || !b) return { entries, affected, error: 'ENTRY_NOT_FOUND' };
      if (a.durationPeriods !== b.durationPeriods) {
        return { entries, affected, error: 'DURATION_MISMATCH' };
      }
      const ai = entries.indexOf(a);
      const bi = entries.indexOf(b);
      entries[ai] = { ...a, dayIndex: b.dayIndex, startPeriod: b.startPeriod };
      entries[bi] = { ...b, dayIndex: a.dayIndex, startPeriod: a.startPeriod };
      affected.push(entryAId, entryBId);
      return { entries, affected, error: null };
    }
    case 'CHANGE_SUBJECT': {
      const { entryId, subjectId } = command.payload as EditCommandPayloads['CHANGE_SUBJECT'];
      const idx = entries.findIndex((e) => e.id === entryId);
      if (idx < 0) return { entries, affected, error: 'ENTRY_NOT_FOUND' };
      entries[idx] = { ...entries[idx], subjectId };
      affected.push(entryId);
      return { entries, affected, error: null };
    }
    case 'CHANGE_FACULTY': {
      const { entryId, facultyId } = command.payload as EditCommandPayloads['CHANGE_FACULTY'];
      const idx = entries.findIndex((e) => e.id === entryId);
      if (idx < 0) return { entries, affected, error: 'ENTRY_NOT_FOUND' };
      entries[idx] = { ...entries[idx], facultyId };
      affected.push(entryId);
      return { entries, affected, error: null };
    }
    case 'CLEAR_ENTRY':
    case 'REMOVE_ENTRY': {
      const { entryId } = command.payload as EditCommandPayloads['CLEAR_ENTRY'];
      const idx = entries.findIndex((e) => e.id === entryId);
      if (idx < 0) return { entries, affected, error: 'ENTRY_NOT_FOUND' };
      entries.splice(idx, 1);
      affected.push(entryId);
      return { entries, affected, error: null };
    }
    case 'ADD_ENTRY': {
      const { entry } = command.payload as EditCommandPayloads['ADD_ENTRY'];
      const newEntry: TimetableEntry = {
        ...entry,
        id: entry.id ?? `entry_manual_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        source: 'MANUAL',
        revision: 0,
      };
      entries.push(newEntry);
      affected.push(newEntry.id);
      return { entries, affected, error: null };
    }
    default:
      return { entries, affected, error: 'UNKNOWN_OPERATION' };
  }
}
