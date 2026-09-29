import { useEffect } from 'react';
import { Button } from './primitives';
import type { Conflict } from '@/domain/models';

/**
 * Blocking modal shown when an edit is rejected due to hard-constraint
 * conflicts. Cannot be dismissed by backdrop click — the user must
 * acknowledge with OK, so the rejection is never missed.
 */
export function ConflictModal({
  conflicts,
  onClose,
}: {
  conflicts: Conflict[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Edit blocked by conflicts"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/50 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-card bg-white shadow-raised">
        <div className="flex items-center gap-2.5 border-b border-hairline px-5 py-3.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger-bg text-sm font-bold text-danger" aria-hidden="true">
            !
          </span>
          <h2 className="text-sm font-semibold text-ink">Edit blocked — conflict detected</h2>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-5">
          <p className="text-xs text-body-gray">
            The change was rejected because it would violate hard scheduling rules. Nothing was modified.
          </p>
          <ul className="mt-3 space-y-2">
            {conflicts.slice(0, 8).map((c, i) => (
              <li key={c.id ?? i} className="rounded-xl bg-danger-bg p-3 text-xs text-danger">
                <strong>{c.type.replace(/_/g, ' ').toLowerCase()}</strong>
                {c.dayIndex !== null && (
                  <span className="ml-1 text-body-gray">
                    · day {c.dayIndex + 1}
                    {c.periodIndex !== null ? `, period ${c.periodIndex + 1}` : ''}
                  </span>
                )}
                {c.resolutionHints.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-body-gray">
                    {c.resolutionHints.slice(0, 2).map((h, j) => <li key={j}>{h}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          {conflicts.length > 8 && (
            <p className="mt-2 text-[11px] text-body-gray">+{conflicts.length - 8} more conflict(s)</p>
          )}
        </div>
        <div className="flex justify-end border-t border-hairline px-5 py-3">
          <Button size="sm" onClick={onClose}>OK</Button>
        </div>
      </div>
    </div>
  );
}
