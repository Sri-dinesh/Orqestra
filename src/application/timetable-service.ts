import { validateEntryPlacement, validateTimetable } from '@/domain/validation/engine';
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import type { Conflict, Timetable, TimetableConfiguration, TimetableEntry } from '@/domain/models';
import type { EditCommand } from './timetable-edit-commands';
import { applyEditCommand } from './timetable-edit-commands';
import { withVersion } from './timetable-versioning';

export interface EditOutcome {
  status: 'COMMITTED' | 'REJECTED';
  timetable: Timetable | null;
  conflicts: Conflict[];
  error: string | null;
}

/** Human-readable label for a version snapshot recorded before a command runs. */
function describeCommand(command: EditCommand): string {
  const payload = command.payload as { entryId?: string } | undefined;
  const at = payload?.entryId ? ` (entry ${payload.entryId.slice(-4)})` : '';
  switch (command.operation) {
    case 'MOVE_ENTRY':
      return `Moved${at}`;
    case 'CHANGE_FACULTY':
      return `Faculty changed${at}`;
    case 'SWAP_ENTRIES':
      return 'Swapped entries';
    case 'CLEAR_ENTRY':
      return `Cleared${at}`;
    case 'REMOVE_ENTRY':
      return `Removed${at}`;
    case 'ADD_ENTRY':
      return 'Added entry';
    default:
      return command.operation;
  }
}

/**
 * Transactional edit flow (§16, §83):
 * draft → apply → targeted validation → commit → full validation.
 * For V1, hard-constraint violations block the commit.
 */
export class TimetableEditService {
  constructor(private config: TimetableConfiguration) {}

  executeCommand(timetable: Timetable, command: EditCommand): EditOutcome {
    // Draft copy — never mutate committed state before validation.
    const draft: Timetable = { ...timetable, entries: [...timetable.entries] };

    const applied = applyEditCommand(draft, command);
    if (applied.error !== null) {
      return { status: 'REJECTED', timetable: null, conflicts: [], error: applied.error };
    }
    draft.entries = applied.entries.map((e) => ({ ...e, revision: e.revision + 1 }));
    draft.configurationSnapshot = timetable.configurationSnapshot;

    // Full authoritative validation on the DRAFT, before anything commits.
    // This guarantees an integrity-invalid timetable (collisions, lab atomicity,
    // structure/references) can never reach committed state. Requirement-count
    // shortfalls are NOT blocking: removing a session (Clear) is an intentional
    // edit whose consequence is an unmet requirement — the commit records it and
    // the timetable is marked INVALID so the validation panel shows the gap.
    const draftCheck = validateTimetable(draft, this.config);
    const blocking = draftCheck.conflicts.filter(
      (c) =>
        c.severity === 'ERROR' &&
        c.type !== 'MISSING_REQUIRED_SESSION' &&
        c.type !== 'EXCESS_REQUIRED_SESSION',
    );
    if (blocking.length > 0) {
      return { status: 'REJECTED', timetable: null, conflicts: blocking, error: 'HARD_CONFLICT' };
    }

    // Commit — snapshot the pre-edit state into version history first.
    const committed: Timetable = {
      ...withVersion(timetable, 'EDIT', describeCommand(command)),
      ...draft,
      status: timetable.status === 'STALE' ? 'STALE' : 'DRAFT',
      revision: timetable.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    committed.validationSummary = draftCheck;
    committed.status =
      committed.status === 'STALE' ? 'STALE' : draftCheck.isValid ? 'VALID' : 'INVALID';

    return { status: 'COMMITTED', timetable: committed, conflicts: [], error: null };
  }

  /** Preview whether a would-be placement is valid, without committing. */
  previewPlacement(
    timetable: Timetable,
    entry: TimetableEntry,
  ): { valid: boolean; conflicts: Conflict[] } {
    const draft: Timetable = {
      ...timetable,
      entries: [...timetable.entries.filter((e) => e.id !== entry.id), entry],
    };
    const targeted = validateEntryPlacement(draft, this.config, [entry.id]);
    return { valid: targeted.isValid, conflicts: targeted.conflicts };
  }

  revalidate(timetable: Timetable): ValidationResultSummary {
    const currentSnapshot = buildConfigurationSnapshot(this.config);
    const result = validateTimetable(timetable, this.config, currentSnapshot);
    const isStale = timetable.configurationSnapshot.fingerprint !== currentSnapshot.fingerprint;
    const status = isStale ? 'STALE' : result.isValid ? 'VALID' : 'INVALID';
    return { result, status, isStale };
  }
}

export interface ValidationResultSummary {
  result: import('@/domain/models').ValidationResult;
  status: 'VALID' | 'INVALID' | 'STALE';
  isStale: boolean;
}
