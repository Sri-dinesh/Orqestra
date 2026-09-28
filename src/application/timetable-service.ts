import { validateEntryPlacement, validateTimetable } from '@/domain/validation/engine';
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import type { Conflict, Timetable, TimetableConfiguration, TimetableEntry } from '@/domain/models';
import type { EditCommand } from './timetable-edit-commands';
import { applyEditCommand } from './timetable-edit-commands';

export interface EditOutcome {
  status: 'COMMITTED' | 'REJECTED';
  timetable: Timetable | null;
  conflicts: Conflict[];
  error: string | null;
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

    // Targeted validation on affected entries first (cheap).
    const targeted = validateEntryPlacement(
      { ...draft, configurationSnapshot: timetable.configurationSnapshot },
      this.config,
      applied.affected,
    );
    if (!targeted.isValid) {
      return { status: 'REJECTED', timetable: null, conflicts: targeted.conflicts, error: 'TARGETED_CONFLICT' };
    }

    // Commit
    const committed: Timetable = {
      ...draft,
      status: timetable.status === 'STALE' ? 'STALE' : 'DRAFT',
      revision: timetable.revision + 1,
      updatedAt: new Date().toISOString(),
    };

    // Full authoritative validation after commit.
    const full = validateTimetable(committed, this.config);
    committed.validationSummary = full;
    committed.status = full.isValid && committed.status !== 'STALE' ? 'VALID' : committed.status === 'STALE' ? 'STALE' : 'INVALID';

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
