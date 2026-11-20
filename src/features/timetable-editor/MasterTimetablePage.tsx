import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, PageHeader } from '@/components/ui/primitives';
import { selectTimetableForDepartment, useWorkspaceStore } from '@/state/stores/workspace-store';
import { buildGridLayout, getDepartmentBreaks, gridColumnLabel } from '@/domain/scheduler/grid-layout';
import { TimetableGridHeader } from '@/components/ui/TimetableGridHeader';
import { ExportPreviewModal } from '@/components/ui/ExportPreviewModal';
import { DepartmentNav } from '@/components/ui/DepartmentNav';
import { DepartmentNotFound } from '@/components/ui/DepartmentNotFound';
import { TimetableSegmentedTabs } from './components/TimetableSegmentedTabs';
import { ExportDropdown } from './components/ExportDropdown';
import {
  TimetableFilterToolbar,
  matchTimetableSlot,
  type SlotTypeFilter,
} from '@/components/ui/TimetableFilterToolbar';

interface MasterCell {
  entryId: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  durationPeriods: number;
  isStart: boolean;
  type: 'THEORY' | 'LAB';
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

  useEffect(() => {
    if (departmentId && state.activeDepartmentId !== departmentId) {
      state.setActiveDepartment(departmentId);
    }
  }, [departmentId, state.activeDepartmentId, state.setActiveDepartment]);

  const department = state.departments.find((d) => d.id === departmentId);
  const sections = useMemo(
    () => state.sections.filter((s) => s.departmentId === departmentId),
    [state.sections, departmentId],
  );
  const subjects = useMemo(
    () => state.subjects.filter((s) => s.departmentId === departmentId),
    [state.subjects, departmentId],
  );
  const faculty = useMemo(
    () => state.faculty.filter((f) => f.departmentId === departmentId),
    [state.faculty, departmentId],
  );
  const timetable = useMemo(
    () => selectTimetableForDepartment(state, departmentId ?? null),
    [state, departmentId],
  );
  const breaks = useWorkspaceStore((s) => s.breaks);

  const [focusSectionId, setFocusSectionId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // In-grid filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SlotTypeFilter>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setSelectedSubjectId(null);
    setSelectedFacultyId(null);
  };

  const isFilterActive = Boolean(
    searchQuery.trim() ||
      typeFilter !== 'ALL' ||
      selectedSubjectId ||
      selectedFacultyId,
  );

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
            subjectId: e.subjectId,
            facultyId: e.facultyId,
            subjectCode: subject?.code ?? '?',
            subjectName: subject?.name ?? 'Unknown subject',
            facultyName: member?.name ?? 'Unknown faculty',
            durationPeriods: e.durationPeriods,
            isStart: p === e.startPeriod,
            type: subject?.type ?? 'THEORY',
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

  const isChipMatching = (chip: MasterCell) => {
    if (!isFilterActive) return true;
    return matchTimetableSlot(
      {
        entryId: chip.entryId,
        subjectCode: chip.subjectCode,
        subjectName: chip.subjectName,
        facultyName: chip.facultyName,
        type: chip.type,
      },
      { searchQuery, typeFilter, selectedSubjectId, selectedFacultyId },
      { subjectId: chip.subjectId, facultyId: chip.facultyId },
    );
  };

  const matchStats = useMemo(() => {
    let matchingSlots = 0;
    let matchingHours = 0;
    let theorySlots = 0;
    let labSlots = 0;

    if (isFilterActive) {
      for (const [, chips] of cellBySlot.entries()) {
        for (const chip of chips) {
          if (chip.isStart && isChipMatching(chip)) {
            matchingSlots++;
            matchingHours += chip.durationPeriods;
            if (chip.type === 'LAB') labSlots++;
            else theorySlots++;
          }
        }
      }
    }

    return {
      matchingSlots,
      matchingHours,
      theorySlots,
      labSlots,
      isFilterActive,
    };
  }, [cellBySlot, isFilterActive, searchQuery, typeFilter, selectedSubjectId, selectedFacultyId]);

  if (!department) {
    return <DepartmentNotFound requestedId={departmentId} targetPage="master-timetable" />;
  }

  if (!timetable) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Institution view" title={`Master timetable — ${department.code}`} />
        <Card>
          <p className="text-sm text-[#5b616b]">No timetable generated yet.</p>
          <Link to={`/departments/${departmentId}/generate`}>
            <Button size="sm" className="mt-3">Go to generation →</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const dayCount = department.workingDays.length;
  const ppd = department.periodsPerDay;
  const deptBreaks = getDepartmentBreaks(breaks, department.id);
  // Grid columns: teaching periods plus inserted break columns (e.g. lunch).
  const layout = buildGridLayout(ppd, deptBreaks);

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
    <div className="space-y-6">
      <DepartmentNav />
      <PageHeader
        eyebrow="Institution view"
        title={`Master timetable — ${department.code}`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone={timetable.validationSummary?.isValid ? 'green' : 'red'}>
              {sections.length} sections · {totalSessions} periods
            </Badge>
            <TimetableSegmentedTabs departmentId={departmentId!} activeView="master" />
          </div>
        }
      />

      {/* Workstation Control Toolbar */}
      <div className="rounded-xl border border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#5b616b] dark:text-[#8c9199]">
          <span className="font-semibold text-[#121417] dark:text-[#ececec]">Master Grid Scope:</span>
          <span className="px-2 py-0.5 rounded-md bg-[#f6f7f8] dark:bg-[#111112] border border-[#e1e4e8] dark:border-[#2a2a2d]">
            {sections.length} Sections
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#f6f7f8] dark:bg-[#111112] border border-[#e1e4e8] dark:border-[#2a2a2d]">
            {activeFacultyIds.size} Active Faculty
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#f6f7f8] dark:bg-[#111112] border border-[#e1e4e8] dark:border-[#2a2a2d]">
            Busiest: {department.workingDays[busiestDay] ?? 'N/A'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ExportDropdown
            onPreview={() => setPreviewModalOpen(true)}
            onPrint={() => window.print()}
          />
        </div>
      </div>

      {/* Section filter + per-day load */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFocusSectionId(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-metric-blue ${
            focusSectionId === null ? 'bg-charcoal text-white' : 'bg-surface-2 text-[#5b616b] hover:text-ink'
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
              focusSectionId === s.id ? 'bg-charcoal text-white' : 'bg-surface-2 text-[#5b616b] hover:text-ink'
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
          <p className="text-xs text-[#5b616b]">Scheduled periods</p>
        </Card>
        <Card>
          <p className="text-xl font-semibold tracking-tight text-ink">{capacity}</p>
          <p className="text-xs text-[#5b616b]">Grid capacity (sections × slots)</p>
        </Card>
        <Card>
          <p className="text-xl font-semibold tracking-tight text-ink">
            {dayCount > 0 ? department.workingDays[busiestDay].slice(0, 3) : '—'}
          </p>
          <p className="text-xs text-[#5b616b]">Busiest day ({perDayLoad[busiestDay] ?? 0} periods)</p>
        </Card>
        <Card>
          <p className="text-xl font-semibold tracking-tight text-ink">{activeFacultyIds.size}</p>
          <p className="text-xs text-[#5b616b]">Faculty teaching</p>
        </Card>
      </div>

      <TimetableFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        selectedSubjectId={selectedSubjectId}
        onSubjectSelect={setSelectedSubjectId}
        selectedFacultyId={selectedFacultyId}
        onFacultySelect={setSelectedFacultyId}
        subjects={subjects}
        faculty={faculty}
        matchStats={matchStats}
        onClearFilters={handleClearFilters}
      />

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
                          {chips.map((chip) => {
                            const isMatch = isChipMatching(chip);
                            const chipDimming = isFilterActive && !isMatch ? 'opacity-25 hover:opacity-80 transition-opacity' : '';
                            const chipHighlight = isFilterActive && isMatch ? 'ring-2 ring-[#3b6fe0] dark:ring-[#7aa2f7] shadow-sm z-10' : '';
                            return (
                              <div
                                key={`${chip.sectionId}-${chip.entryId}-${periodIndex}`}
                                className={`rounded-md px-1.5 py-1 transition-all duration-150 ${sectionTone(chip.sectionId)} ${chipHighlight} ${chipDimming}`}
                                title={`${sectionName(chip.sectionId)} · ${chip.subjectName} — ${chip.facultyName}`}
                              >
                                {chip.isStart ? (
                                  <>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="block truncate text-[11px] font-semibold text-ink">
                                        {chip.subjectCode}
                                      </span>
                                      {isFilterActive && isMatch && (
                                        <span className="text-[9px] font-bold px-1 rounded bg-[#3b6fe0] text-white dark:bg-[#7aa2f7] dark:text-[#111112]">
                                          MATCH
                                        </span>
                                      )}
                                    </div>
                                    <span className="block truncate text-[10px] text-[#5b616b]">
                                      {focusSectionId ? chip.facultyName : `${sectionName(chip.sectionId)} · ${chip.facultyName}`}
                                    </span>
                                    {chip.durationPeriods >= 2 && (
                                      <span className="block text-[10px] font-medium text-[#5b3fb8]">LAB (2p)</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="block text-[10px] text-[#5b616b]">↳ {chip.subjectCode}</span>
                                )}
                              </div>
                            );
                          })}
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
        <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-[#5b616b]" aria-label="Section color legend">
          {sections.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span className={`h-3.5 w-5 rounded ring-1 ring-inset ring-hairline ${sectionTone(s.id)}`} aria-hidden="true" />
              {s.name}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-[#5b616b]">
          Read-only overview of every section in {department.code}. Filter with the section chips above; hover a cell for subject and faculty details. Labs span two periods. Use the section view to edit.
        </p>
      </Card>

      {timetable && (
        <ExportPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          timetable={timetable}
          department={department}
          sections={sections}
          subjects={subjects}
          faculty={faculty}
          breaks={breaks}
          collegeDetails={state.collegeDetails}
          initialSectionId={focusSectionId ?? undefined}
          type="MASTER"
        />
      )}
    </div>
  );
}
