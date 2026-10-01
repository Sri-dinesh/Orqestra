import type { Timetable, TimetableConfiguration } from '@/domain/models';
import type { EditCommand } from '@/application/timetable-edit-commands';

export type SlotConflictKind = 'MOVE' | 'SWAP';

export interface SlotConflict {
  /** "dayIndex:periodIndex" of the target slot. */
  slot: string;
  kind: SlotConflictKind;
  /** What would be violated, e.g. 'FACULTY_TIME_CONFLICT'. */
  reason: string;
}

/**
 * Compute, for every grid slot, whether acting on the selected entry there
 * would be rejected. Runs the real edit service against throwaway drafts —
 * identical logic to the commit path, so a slot is marked blocked if and only
 * if committing would actually fail.
 *
 * Semantics mirror the grid's interactions exactly:
 * - EMPTY cell → left-click would MOVE the selection to that cell's start
 *   period. Marked only when that exact placement is rejected.
 * - OCCUPIED cell (same section) → right-click would SWAP with the entry
 *   there. Every cell of that entry is marked, since right-clicking any of
 *   them runs the same swap. Different-length pairs (theory vs lab) are
 *   marked DURATION_MISMATCH without running the service — the commit path
 *   rejects them at the payload level.
 */
export function computeSlotConflicts(
  timetable: Timetable,
  service: {
    executeCommand(
      t: Timetable,
      c: EditCommand,
    ): { status: string; conflicts: { type: string }[]; error?: string | null };
  },
  config: TimetableConfiguration,
  selectedEntryId: string | null,
): Map<string, SlotConflict> {
  const result = new Map<string, SlotConflict>();
  if (!selectedEntryId) return result;
  const entry = timetable.entries.find((e) => e.id === selectedEntryId);
  if (!entry) return result;

  const periodsPerDay = config.periodsPerDay;
  const dayCount = config.workingDays.length;

  /** The entry of the SELECTED entry's section covering this slot, if any. */
  const sectionTargetAt = (day: number, p: number) =>
    timetable.entries.find(
      (e) =>
        e.sectionId === entry.sectionId &&
        e.dayIndex === day &&
        p >= e.startPeriod &&
        p < e.startPeriod + e.durationPeriods,
    );

  const reasonOf = (outcome: { conflicts: { type: string }[]; error?: string | null }) =>
    outcome.conflicts[0]?.type ?? outcome.error ?? 'HARD_CONFLICT';

  for (let day = 0; day < dayCount; day++) {
    for (let p = 0; p < periodsPerDay; p++) {
      const target = sectionTargetAt(day, p);
      if (target && target.id === entry.id) continue; // its own slot — not actionable

      if (!target) {
        // Empty cell → MOVE attempt for this exact start period.
        const outcome = service.executeCommand(timetable, {
          operation: 'MOVE_ENTRY',
          payload: { entryId: entry.id, dayIndex: day, startPeriod: p },
          affectedEntryIds: [entry.id],
          timestamp: '',
        });
        if (outcome.status === 'REJECTED') {
          const reason = reasonOf(outcome);
          result.set(`${day}:${p}`, { slot: `${day}:${p}`, kind: 'MOVE', reason });
        }
      } else {
        // Occupied cell → SWAP attempt. Mark every cell of the target: a
        // right-click on any of them resolves to this same swap.
        const markTarget = (reason: string) => {
          const end = Math.min(target.startPeriod + target.durationPeriods, periodsPerDay);
          for (let q = target.startPeriod; q < end; q++) {
            result.set(`${day}:${q}`, { slot: `${day}:${q}`, kind: 'SWAP', reason });
          }
        };

        if (target.durationPeriods !== entry.durationPeriods) {
          // Payload-level rejection (theory vs lab) — no service call needed.
          markTarget('DURATION_MISMATCH');
        } else {
          const outcome = service.executeCommand(timetable, {
            operation: 'SWAP_ENTRIES',
            payload: { entryAId: entry.id, entryBId: target.id },
            affectedEntryIds: [entry.id, target.id],
            timestamp: '',
          });
          if (outcome.status === 'REJECTED') markTarget(reasonOf(outcome));
        }
      }
    }
  }
  return result;
}
