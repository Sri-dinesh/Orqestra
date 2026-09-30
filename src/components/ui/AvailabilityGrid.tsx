import { useState } from 'react';
import type { FacultyAvailability } from '@/domain/models';

interface Props {
  workingDays: string[];
  periodsPerDay: number;
  /** Initially available windows. */
  availability: FacultyAvailability[];
  /** Initially preferred windows. */
  preferredSlots: FacultyAvailability[];
  onChange: (availability: FacultyAvailability[], preferredSlots: FacultyAvailability[]) => void;
}

/**
 * Merge the maximal runs of consecutive true cells in a row into windows.
 * Row-major over a [day][period] boolean matrix.
 */
function toWindows(grid: boolean[][]): FacultyAvailability[] {
  const windows: FacultyAvailability[] = [];
  grid.forEach((row, dayIndex) => {
    let runStart = -1;
    for (let p = 0; p <= row.length; p++) {
      const on = p < row.length && row[p];
      if (on && runStart < 0) runStart = p;
      if (!on && runStart >= 0) {
        windows.push({ dayIndex, startPeriod: runStart, durationPeriods: p - runStart });
        runStart = -1;
      }
    }
  });
  return windows;
}

/**
 * Day × period toggle grid. Left-click toggles availability; clicking an
 * available cell with the "preferred" mode toggles the preference layer.
 * Preferences are a subset of availability (a preferred period is always
 * available).
 */
export function AvailabilityGrid({ workingDays, periodsPerDay, availability, preferredSlots, onChange }: Props) {
  const [mode, setMode] = useState<'available' | 'preferred'>('available');

  const [availGrid] = useState(() => {
    const g = workingDays.map(() => new Array<boolean>(periodsPerDay).fill(false));
    for (const w of availability) {
      const row = g[w.dayIndex];
      if (row) for (let p = w.startPeriod; p < w.startPeriod + w.durationPeriods; p++) if (p < row.length) row[p] = true;
    }
    return g;
  });
  const [prefGrid] = useState(() => {
    const g = workingDays.map(() => new Array<boolean>(periodsPerDay).fill(false));
    for (const w of preferredSlots) {
      const row = g[w.dayIndex];
      if (row) for (let p = w.startPeriod; p < w.startPeriod + w.durationPeriods; p++) if (p < row.length) row[p] = true;
    }
    return g;
  });

  const emit = (a: boolean[][], p: boolean[][]) => onChange(toWindows(a), toWindows(p));

  const toggle = (dayIndex: number, periodIndex: number) => {
    if (mode === 'available') {
      // Toggling availability off also clears preference.
      const nextA = availGrid.map((r) => [...r]);
      const nextP = prefGrid.map((r) => [...r]);
      nextA[dayIndex][periodIndex] = !nextA[dayIndex][periodIndex];
      if (!nextA[dayIndex][periodIndex]) nextP[dayIndex][periodIndex] = false;
      emit(nextA, nextP);
    } else {
      // Toggling preference on implies availability on.
      const nextA = availGrid.map((r) => [...r]);
      const nextP = prefGrid.map((r) => [...r]);
      nextP[dayIndex][periodIndex] = !nextP[dayIndex][periodIndex];
      if (nextP[dayIndex][periodIndex]) nextA[dayIndex][periodIndex] = true;
      emit(nextA, nextP);
    }
  };

  const cellCls = (avail: boolean, pref: boolean) => {
    if (pref) return 'bg-metric-blue text-white ring-1 ring-inset ring-metric-blue';
    if (avail) return 'bg-success-bg text-success ring-1 ring-inset ring-success/40';
    return 'bg-surface-1 text-body-gray/40 hover:bg-surface-2';
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="text-body-gray">Editing layer:</span>
        <button
          type="button"
          onClick={() => setMode('available')}
          className={`cursor-pointer rounded-full px-2.5 py-1 font-medium transition-colors duration-150 ${
            mode === 'available' ? 'bg-charcoal text-white' : 'bg-surface-2 text-body-gray hover:text-ink'
          }`}
        >
          Available
        </button>
        <button
          type="button"
          onClick={() => setMode('preferred')}
          className={`cursor-pointer rounded-full px-2.5 py-1 font-medium transition-colors duration-150 ${
            mode === 'preferred' ? 'bg-charcoal text-white' : 'bg-surface-2 text-body-gray hover:text-ink'
          }`}
        >
          Preferred
        </button>
        <span className="ml-auto flex items-center gap-2 text-[11px] text-body-gray">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-success-bg ring-1 ring-success/40" aria-hidden="true" /> available
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-metric-blue" aria-hidden="true" /> preferred
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-surface-1 ring-1 ring-hairline" aria-hidden="true" /> unavailable
        </span>
      </div>
      <table className="border-separate border-spacing-1 text-[11px]">
        <thead>
          <tr>
            <th></th>
            {Array.from({ length: periodsPerDay }, (_, i) => (
              <th key={i} className="p-0.5 font-semibold text-body-gray">P{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {workingDays.map((day, d) => (
            <tr key={day}>
              <th className="pr-1.5 text-right font-semibold text-ink">{day.slice(0, 3)}</th>
              {Array.from({ length: periodsPerDay }, (_, p) => {
                const avail = availGrid[d]?.[p] ?? false;
                const pref = prefGrid[d]?.[p] ?? false;
                return (
                  <td key={p}>
                    <button
                      type="button"
                      aria-pressed={mode === 'available' ? avail : pref}
                      aria-label={`${day} period ${p + 1} ${mode === 'available' ? 'available' : 'preferred'}`}
                      className={`h-7 w-8 cursor-pointer rounded-md text-[10px] font-semibold transition-colors duration-150 ${cellCls(avail, pref)}`}
                      onClick={() => toggle(d, p)}
                    >
                      {pref ? '★' : avail ? '✓' : ''}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1.5 text-[11px] text-body-gray">
        Leave everything unchecked if this teacher has no restrictions — generation will use all slots. Preferences are a subset of availability.
      </p>
    </div>
  );
}
