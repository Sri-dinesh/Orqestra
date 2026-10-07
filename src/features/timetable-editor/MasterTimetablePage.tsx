import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, PageHeader } from '@/components/ui/primitives';
import {
  selectCurrentFaculty,
  selectCurrentSections,
  selectCurrentSubjects,
  selectTimetableForActiveDepartment,
  useWorkspaceStore,
} from '@/state/stores/workspace-store';
import { buildGridLayout, gridColumnLabel } from '@/domain/scheduler/grid-layout';
import { TimetableGridHeader } from '@/components/ui/TimetableGridHeader';

interface MasterCell {
  entryId: string;
  sectionId: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  durationPeriods: number;
  isStart: boolean;
}

/** Section accent colors (same palette family as the faculty view). */
const SECTION_TONES = [
  'bg-[#dce4fd] text-ink',
  'bg-[#e7e0fd] text-ink',
  'bg-[#d8f0e2] text-ink',
  'bg-[#fdecd8] text-ink',
  'bg-[#fbdfe4] text-ink',
  'bg-[#dcf0f6] text-ink',
  'bg-[#ece8d8] text-ink',
  'bg-[#e2e2f8] text-ink',
  'bg-[#dce8dc] text-ink',
];

/**
 * Institution-wide master timetable: every section of the department in one
 * grid. Each row is a day; the columns are periods. Because multiple sections
 * share a slot, each cell stacks one chip per section. Read-only — this is
 * the "notice board" view for the whole department.
 */
export function MasterTimetablePage() {
  const { departmentId } = useParams();
  const state = useWorkspaceStore();
  const sections = useWorkspaceStore(selectCurrentSections);
  const subjects = useWorkspaceStore(selectCurrentSubjects);
  const faculty = useWorkspaceStore(selectCurrentFaculty);
  const timetable = useWorkspaceStore(selectTimetableForActiveDepartment);
  const breaks = useWorkspaceStore((s) => s.breaks);

  const department = state.departments.find((d) => d.id === departmentId);
  const [focusSectionId, setFocusSectionId] = useState<string | null>(null);

  /**
   * All sessions indexed by `dayIndex:periodIndex`, each slot holding a chip
   * per section-entry covering that period. Labs occupy every period they
   * span; `isStart` marks where the label renders.
   */
  const cellBySlot = useMemo(() => {
    const map = new Map<string, MasterCell[]>();
    if (!timetable) return map;
    const subjectById = new Map(subjects.map((s) => [s.id, s]));
    const facultyById = new Map(faculty.map((f) => [f.id, f]));
    // Render order follows the section list, so chips stack consistently.
    const sectionOrder = new Map(sections.map((s, i) => [s.id, i]));
    const chips: Array<{ slot: string; cell: MasterCell }> = [];
    for (const e of timetable.entries) {
      const subject = subjectById.get(e.subjectId);
      const member = facultyById.get(e.facultyId);
      for (let p = e.startPeriod; p < e.startPeriod + e.durationPeriods; p++) {
        chips.push({
          slot: `${e.dayIndex}:${p}`,
          cell: {
            entryId: e.id,
            sectionId: e.sectionId,
            subjectCode: subject?.code ?? '?',
            subjectName: subject?.name ?? 'Unknown subject',
            facultyName: member?.name ?? 'Unknown faculty',
            durationPeriods: e.durationPeriods,
            isStart: p === e.startPeriod,
          },
        });
      }
    }
    chips.sort(
      (a, b) =>
        (sectionOrder.get(a.cell.sectionId) ?? 99) - (sectionOrder.get(b.cell.sectionId) ?? 99),
    );
    for (const { slot, cell } of chips) {
      const list = map.get(slot) ?? [];
      list.push(cell);
      map.set(slot, list);
    }
    return map;
  }, [timetable, sections, subjects, faculty]);

  if (!department) {
    return <p className="text-sm text-body-gray">Select a department first.</p>;
  }

  if (!timetable) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Institution view" title={`Master timetable — ${department.code}`} />
        <Card>
          <p className="text-sm text-body-gray">No timetable generated yet.</p>
          <Link to={`/departments/${departmentId}/generate`}>
            <Button size="sm" className="mt-3">Go to generation →</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const dayCount = department.workingDays.length;
  const ppd = department.periodsPerDay;
  // Grid columns: teaching periods plus inserted break columns (e.g. lunch).
  const layout = buildGridLayout(ppd, breaks);

  const sectionTone = (sectionId: string) => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    return SECTION_TONES[(idx < 0 ? 0 : idx) % SECTION_TONES.length];
  };
  const sectionName = (sectionId: string) =>
    sections.find((s) => s.id === sectionId)?.name ?? 'Unknown';

  const visibleSections = focusSectionId
    ? sections.filter((s) => s.id === focusSectionId)
    : sections;

  // Workload summaries.
  const totalSessions = timetable.entries.reduce((acc, e) => acc + e.durationPeriods, 0);
  const capacity = dayCount * ppd * Math.max(sections.length, 1);
  const perDayLoad: number[] = new Array(dayCount).fill(0);
  for (const e of timetable.entries) {
    if (e.dayIndex < dayCount) perDayLoad[e.dayIndex] += e.durationPeriods;
  }
  const busiestDay = perDayLoad.indexOf(Math.max(...perDayLoad));
  const activeFacultyIds = new Set(timetable.entries.map((e) => e.facultyId));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Institution view"
        title={`Master timetable — ${department.code}`}
        actions={
          <>
            <Badge tone={timetable.validationSummary?.isValid ? 'green' : 'red'}>
              {sections.length} sections · {totalSessions} periods
            </Badge>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>Print</Button>
            <Link to={`/departments/${departmentId}/timetable`}>
              <Button variant="secondary" size="sm">Section view →</Button>
            </Link>
          </>
        }
      />

      {/* Section filter + per-day load */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFocusSectionId(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-metric-blue ${
            focusSectionId === null ? 'bg-charcoal text-white' : 'bg-surface-2 text-body-gray hover:text-ink'
          }`}
          aria-pressed={focusSectionId === null}
        >
          All sections
        </button>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFocusSectionId(focusSectionId === s.id ? null : s.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-metric-blue ${
              focusSectionId === s.id ? 'bg-charcoal text-white' : 'bg-surface-2 text-body-gray hover:text-ink'
            }`}
            aria-pressed={focusSectionId === s.id}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-xl font-semibold tracking-tight text-ink">{totalSessions}</p>
          <p className="text-xs text-body-gray">Scheduled periods</p>
        </Card>
        <Card>
          <p className="text-xl font-semibold tracking-tight text-ink">{capacity}</p>
          <p className="text-xs text-body-gray">Grid capacity (sections × slots)</p>
        </Card>
        <Card>
          <p className="text-xl font-semibold tracking-tight text-ink">
            {dayCount > 0 ? department.workingDays[busiestDay].slice(0, 3) : '—'}
          </p>
          <p className="text-xs text-body-gray">Busiest day ({perDayLoad[busiestDay] ?? 0} periods)</p>
        </Card>
        <Card>
          <p className="text-xl font-semibold tracking-tight text-ink">{activeFacultyIds.size}</p>
          <p className="text-xs text-body-gray">Faculty teaching</p>
        </Card>
      </div>

      <Card
        title={
          focusSectionId
            ? `${sectionName(focusSectionId)} — weekly schedule`
            : 'All sections — weekly schedule'
        }
      >
        <div className="overflow-x-auto pb-1">
          <table className="min-w-full border-separate border-spacing-1 text-sm">
            <thead>
              <TimetableGridHeader
                columns={layout.columns}
                periodTimings={department.periodTimings}
                breaks={breaks}
              />
            </thead>
            <tbody>
              {Array.from({ length: dayCount }, (_, dayIndex) => (
                <tr key={dayIndex}>
                  <th className="whitespace-nowrap rounded-lg bg-surface-2 px-2.5 text-[11px] font-semibold text-ink">
                    {department.workingDays[dayIndex].slice(0, 3)}
                  </th>
                  {layout.columns.map((col, periodIndex) => {
                    if (col.kind === 'break') {
                      return (
                        <td key={periodIndex} className="rounded-lg bg-[#fdf6e9] p-1 align-middle ring-1 ring-inset ring-[#f0dfb8]">
                          <span
                            className="block rounded-md p-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-[#92690e]"
                            aria-label={`${col.name} — ${department.workingDays[dayIndex]}`}
                          >
                            🍽 {col.name}
                          </span>
                        </td>
                      );
                    }
                    const key = `${dayIndex}:${periodIndex}`;
                    const all = cellBySlot.get(key) ?? [];
                    const chips = all.filter((c) => visibleSections.some((s) => s.id === c.sectionId));
                    if (chips.length === 0) {
                      return (
                        <td key={periodIndex} className="rounded-lg bg-surface-1 p-1">
                          <span className="block h-14" aria-label={`Free ${gridColumnLabel(layout, periodIndex)}`} />
                        </td>
                      );
                    }
                    return (
                      <td key={periodIndex} className="rounded-lg bg-surface-1 p-0.5 align-top">
                        <div className="flex flex-col gap-0.5">
                          {chips.map((chip) => (
                            <div
                              key={`${chip.sectionId}-${chip.entryId}-${periodIndex}`}
                              className={`rounded-md px-1.5 py-1 ${sectionTone(chip.sectionId)}`}
                              title={`${sectionName(chip.sectionId)} · ${chip.subjectName} — ${chip.facultyName}`}
                            >
                              {chip.isStart ? (
                                <>
                                  <span className="block truncate text-[11px] font-semibold text-ink">
                                    {chip.subjectCode}
                                  </span>
                                  <span className="block truncate text-[10px] text-body-gray">
                                    {focusSectionId ? chip.facultyName : `${sectionName(chip.sectionId)} · ${chip.facultyName}`}
                                  </span>
                                  {chip.durationPeriods >= 2 && (
                                    <span className="block text-[10px] font-medium text-[#5b3fb8]">LAB (2p)</span>
                                  )}
                                </>
                              ) : (
                                <span className="block text-[10px] text-body-gray">↳ {chip.subjectCode}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend: section color key */}
        <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-body-gray" aria-label="Section color legend">
          {sections.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span className={`h-3.5 w-5 rounded ring-1 ring-inset ring-hairline ${sectionTone(s.id)}`} aria-hidden="true" />
              {s.name}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-body-gray">
          Read-only overview of every section in {department.code}. Filter with the section chips above; hover a cell for subject and faculty details. Labs span two periods. Use the section view to edit.
        </p>
      </Card>
    </div>
  );
}
