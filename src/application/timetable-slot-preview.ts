import type { Timetable, TimetableConfiguration } from '@/domain/models';
import type { EditCommand } from '@/application/timetable-edit-commands';

export type SlotConflictKind = 'MOVE' | 'SWAP';

export interface SlotConflict {
  /** "dayIndex:periodIndex" of the target slot. */
  slot: string;
  kind: SlotConflictKind;
  /** What would be violated, e.g. 'FACULTY_COLLISION'. */
  reason: string;
}

/**
 * Compute, for every grid slot, whether moving/swap-targeting the selected
 * entry there would be rejected. Runs the real edit service against throwaway
 * drafts — identical logic to the commit path, so a slot is marked blocked
 * if and only if committing would actually fail.
 *
 * For labs (2 periods), the conflict is attributed to every period the moved
 * block would occupy, so each covered cell is visibly blocked.
 */
export function computeSlotConflicts(
  timetable: Timetable,
  service: { executeCommand(t: Timetable, c: EditCommand): { status: string; conflicts: { type: string }[] } },
  config: TimetableConfiguration,
  selectedEntryId: string | null,
): Map<string, SlotConflict> {
  const result = new Map<string, SlotConflict>();
  if (!selectedEntryId) return result;
  const entry = timetable.entries.find((e) => e.id === selectedEntryId);
  if (!entry) return result;

  const periodsPerDay = config.periodsPerDay;
  const dayCount = config.workingDays.length;

  for (let day = 0; day < dayCount; day++) {
    for (let p = 0; p < periodsPerDay; p++) {
      // A 2-period block must start early enough to fit.
      if (entry.durationPeriods === 2 && p === periodsPerDay - 1) continue;

      const target = timetable.entries.find(
        (e) =>
          e.sectionId === entry.sectionId &&
          e.dayIndex === day &&
          p >= e.startPeriod &&
          p < e.startPeriod + e.durationPeriods,
      );

      if (target && target.id === entry.id) continue; // its own current slot

      if (!target) {
        // MOVE preview
        const outcome = service.executeCommand(timetable, {
          operation: 'MOVE_ENTRY',
          payload: { entryId: entry.id, dayIndex: day, startPeriod: p },
          affectedEntryIds: [entry.id],
          timestamp: '',
        });
        if (outcome.status === 'REJECTED') {
          const reason = outcome.conflicts[0]?.type ?? 'HARD_CONFLICT';
          for (let q = p; q < p + entry.durationPeriods; q++) {
            result.set(`${day}:${q}`, { slot: `${day}:${q}`, kind: 'MOVE', reason });
          }
        }
      } else if (target.durationPeriods === entry.durationPeriods) {
        // SWAP preview (only same-duration pairs can swap)
        const outcome = service.executeCommand(timetable, {
          operation: 'SWAP_ENTRIES',
          payload: { entryAId: entry.id, entryBId: target.id },
          affectedEntryIds: [entry.id, target.id],
          timestamp: '',
        });
        if (outcome.status === 'REJECTED') {
          const reason = outcome.conflicts[0]?.type ?? 'HARD_CONFLICT';
          for (let q = p; q < p + target.durationPeriods; q++) {
            result.set(`${day}:${q}`, { slot: `${day}:${q}`, kind: 'SWAP', reason });
          }
        }
      }
    }
  }
  return result;
}
