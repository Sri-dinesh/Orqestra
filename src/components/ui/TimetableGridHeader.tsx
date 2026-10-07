import type { Break, PeriodTiming } from '@/domain/models';
import type { GridColumn } from '@/domain/scheduler/grid-layout';

interface Props {
  columns: GridColumn[];
  /** Wall-clock times per teaching index (may be partial). */
  periodTimings?: PeriodTiming[];
  breaks: Break[];
}

/** Table header row for timetable grids: P-numbers plus wall-clock times, break names plus their times. */
export function TimetableGridHeader({ columns, periodTimings, breaks }: Props) {
  return (
    <tr>
      <th className="p-1"></th>
      {columns.map((col, i) => {
        let title: string;
        let sub: string | null = null;
        if (col.kind === 'teaching') {
          title = `P${col.teachingIndex + 1}`;
          const t = periodTimings?.[col.teachingIndex];
          if (t?.start || t?.end) sub = [t?.start, t?.end].filter(Boolean).join(' – ');
        } else {
          title = col.name;
          const b = breaks.find((x) => x.id === col.breakId);
          if (b?.startTime || b?.endTime) sub = [b?.startTime, b?.endTime].filter(Boolean).join(' – ');
        }
        return (
          <th key={i} className="p-1 text-[11px] font-semibold uppercase tracking-wide text-body-gray">
            <span className="block">{title}</span>
            {sub && (
              <span className="block text-[9px] font-medium normal-case tracking-normal text-body-gray/80">
                {sub}
              </span>
            )}
          </th>
        );
      })}
    </tr>
  );
}
