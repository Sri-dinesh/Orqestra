import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, Users } from 'lucide-react';
import { Badge, Button, Card, PageHeader, Select } from '@/components/ui/primitives';
import { selectTimetableForDepartment, useWorkspaceStore } from '@/state/stores/workspace-store';
import { buildGridLayout, getDepartmentBreaks, gridColumnLabel } from '@/domain/scheduler/grid-layout';
import { TimetableGridHeader } from '@/components/ui/TimetableGridHeader';
import { ExportPreviewModal } from '@/components/ui/ExportPreviewModal';
import { SubstituteModal } from '@/components/ui/SubstituteModal';
import { DepartmentNav } from '@/components/ui/DepartmentNav';
import { DepartmentNotFound } from '@/components/ui/DepartmentNotFound';
import { computeCommonFreeSlots } from '@/application/common-free-slot-service';

interface FacultyCell {
  sectionId: string;
  sectionName: string;
  subjectCode: string;
  subjectName: string;
  durationPeriods: number;
  isStart: boolean;
}

/** Section accent colors for the grid (mirror of section-grid palette family). */
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

export function FacultyTimetablePage() {
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

  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [substituteModalOpen, setSubstituteModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'INDIVIDUAL' | 'MEETING_FINDER'>('INDIVIDUAL');
  const [selectedMeetingFacultyIds, setSelectedMeetingFacultyIds] = useState<string[]>([]);
  const [inspectedSlot, setInspectedSlot] = useState<{ dayIndex: number; periodIndex: number } | null>(null);

  // Initialize selected meeting faculty to all active faculty once loaded
  useEffect(() => {
    if (faculty.length > 0 && selectedMeetingFacultyIds.length === 0) {
      setSelectedMeetingFacultyIds(faculty.filter((f) => f.active).map((f) => f.id));
    }
  }, [faculty, selectedMeetingFacultyIds.length]);

  const activeFacultyId = selectedFacultyId ?? faculty.find((f) => f.active)?.id ?? null;
  const activeFaculty = faculty.find((f) => f.id === activeFacultyId);

  const commonFreeSummary = useMemo(() => {
    if (!department || !timetable || viewMode !== 'MEETING_FINDER') return null;
    return computeCommonFreeSlots(
      department,
      faculty,
      selectedMeetingFacultyIds,
      timetable.entries,
      breaks,
      sections,
      subjects,
    );
  }, [department, timetable, viewMode, faculty, selectedMeetingFacultyIds, breaks, sections, subjects]);

  /**
   * Sessions for the selected faculty across ALL sections, indexed by
   * `dayIndex:periodIndex`. A session occupies every period it spans so
   * multi-period labs render continuously in the grid.
   */
  const cellBySlot = useMemo(() => {
    const map = new Map<string, FacultyCell>();
    if (!timetable || !activeFacultyId) return map;
    const sectionById = new Map(sections.map((s) => [s.id, s]));
    const subjectById = new Map(subjects.map((s) => [s.id, s]));
    for (const e of timetable.entries) {
      if (e.facultyId !== activeFacultyId) continue;
      const subject = subjectById.get(e.subjectId);
      const section = sectionById.get(e.sectionId);
      for (let p = e.startPeriod; p < e.startPeriod + e.durationPeriods; p++) {
        map.set(`${e.dayIndex}:${p}`, {
          sectionId: e.sectionId,
          sectionName: section?.name ?? 'Unknown section',
          subjectCode: subject?.code ?? '?',
          subjectName: subject?.name ?? 'Unknown subject',
          durationPeriods: e.durationPeriods,
          isStart: p === e.startPeriod,
        });
      }
    }
    return map;
  }, [timetable, activeFacultyId, sections, subjects]);

  if (!department) {
    return <DepartmentNotFound requestedId={departmentId} targetPage="faculty-timetable" />;
  }

  if (!timetable) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Faculty workload" title={`Faculty timetable — ${department.code}`} />
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

  // Weekly stats for the selected faculty.
  const weeklyLoad = cellBySlot.size;
  const dailyLoad: number[] = new Array(dayCount).fill(0);
  for (const [slot] of cellBySlot) {
    const [d, p] = slot.split(':').map(Number);
    if (d < dayCount) dailyLoad[d] = Math.max(dailyLoad[d], p + 1); // last occupied period → rough day-extent
  }
  const busyDays = dailyLoad.filter((v) => v > 0).length;
  const freePeriods = dayCount * ppd - weeklyLoad;

  const sectionTone = (sectionId: string) => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    return SECTION_TONES[(idx < 0 ? 0 : idx) % SECTION_TONES.length];
  };

  return (
    <div className="space-y-6">
      <DepartmentNav />
      <PageHeader
        eyebrow="Faculty workload"
        title={`Faculty timetable — ${department.code}`}
        actions={
          <>
            {viewMode === 'INDIVIDUAL' ? (
              <Badge tone={weeklyLoad > 0 ? 'blue' : 'slate'}>
                {weeklyLoad} periods / week
              </Badge>
            ) : (
              <Badge tone={(commonFreeSummary?.totalCommonFreeSlots ?? 0) > 0 ? 'green' : 'amber'}>
                {commonFreeSummary?.totalCommonFreeSlots ?? 0} mutual free periods
              </Badge>
            )}
            <Button variant="secondary" size="sm" onClick={() => setPreviewModalOpen(true)}>
              Preview & Export
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setSubstituteModalOpen(true)}>
              Substitute Assistant
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>Print</Button>
            <Link to={`/departments/${departmentId}/master-timetable`}>
              <Button variant="secondary" size="sm">Master view</Button>
            </Link>
            <Link to={`/departments/${departmentId}/timetable`}>
              <Button variant="secondary" size="sm">Section view →</Button>
            </Link>
          </>
        }
      />

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#e1e4e8] bg-[#ffffff] p-2">
        <div className="flex items-center gap-1 rounded-md bg-[#eef0f2] p-1">
          <button
            type="button"
            onClick={() => setViewMode('INDIVIDUAL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'INDIVIDUAL'
                ? 'bg-white text-ink shadow-sm'
                : 'text-[#5b616b] hover:text-ink'
            }`}
          >
            Individual Schedule
          </button>
          <button
            type="button"
            onClick={() => setViewMode('MEETING_FINDER')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'MEETING_FINDER'
                ? 'bg-white text-metric-blue shadow-sm'
                : 'text-[#5b616b] hover:text-ink'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Common Free Periods (Meeting Finder)</span>
          </button>
        </div>

        {viewMode === 'INDIVIDUAL' && (
          <label className="flex items-center gap-2 text-xs font-medium text-ink">
            Faculty:
            <Select
              value={activeFacultyId ?? ''}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="w-56 text-xs"
              aria-label="Select faculty member"
            >
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}{f.active ? '' : ' (inactive)'}
                </option>
              ))}
            </Select>
          </label>
        )}
      </div>

      {viewMode === 'INDIVIDUAL' && (
        <>
          {activeFaculty && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card>
                <p className="text-xl font-semibold tracking-tight text-ink">{weeklyLoad}</p>
                <p className="text-xs text-[#5b616b]">Periods / week</p>
              </Card>
              <Card>
                <p className="text-xl font-semibold tracking-tight text-ink">{busyDays}/{dayCount}</p>
                <p className="text-xs text-[#5b616b]">Busy days</p>
              </Card>
              <Card>
                <p className="text-xl font-semibold tracking-tight text-ink">{freePeriods}</p>
                <p className="text-xs text-[#5b616b]">Free periods</p>
              </Card>
              <Card>
                <p className="text-xl font-semibold tracking-tight text-ink">
                  {new Set([...cellBySlot.values()].map((c) => c.sectionId)).size}
                </p>
                <p className="text-xs text-[#5b616b]">Sections taught</p>
              </Card>
            </div>
          )}

          <Card title={`${activeFaculty?.name ?? 'Faculty'} — weekly schedule across all sections`}>
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
                        const cell = cellBySlot.get(`${dayIndex}:${periodIndex}`);
                        if (!cell) {
                          return (
                            <td key={periodIndex} className="rounded-lg bg-surface-1 p-1">
                              <span className="block h-12" aria-label={`Free ${gridColumnLabel(layout, periodIndex)}`} />
                            </td>
                          );
                        }
                        const tone = sectionTone(cell.sectionId);
                        return (
                          <td key={periodIndex} className={`rounded-lg p-1 align-top ${tone}`}>
                            {cell.isStart ? (
                              <div className="p-1.5">
                                <span className="block text-xs font-semibold text-ink">{cell.subjectCode}</span>
                                <span className="block truncate text-[10px] text-[#5b616b]">{cell.sectionName}</span>
                                {cell.durationPeriods >= 2 && (
                                  <span className="block text-[10px] font-medium text-[#5b3fb8]">LAB (2p)</span>
                                )}
                              </div>
                            ) : (
                              <span className="block p-1.5 text-[10px] text-[#5b616b]">↳ {cell.subjectCode}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-[#5b616b]">
              Read-only view: every session this faculty member teaches, across all sections. Cell colors identify the section. Use the section timetable to edit sessions.
            </p>
          </Card>
        </>
      )}

      {viewMode === 'MEETING_FINDER' && commonFreeSummary && (
        <div className="space-y-6">
          {/* Faculty Multi-Selector Card */}
          <Card
            title={`Select Faculty Members (${selectedMeetingFacultyIds.length} of ${faculty.length} included)`}
            actions={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs"
                  onClick={() => setSelectedMeetingFacultyIds(faculty.filter((f) => f.active).map((f) => f.id))}
                >
                  Select all active
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs"
                  onClick={() => setSelectedMeetingFacultyIds([])}
                >
                  Clear all
                </Button>
              </div>
            }
          >
            <div className="flex flex-wrap gap-2 pt-1">
              {faculty.map((f) => {
                const isSelected = selectedMeetingFacultyIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedMeetingFacultyIds(selectedMeetingFacultyIds.filter((id) => id !== f.id));
                      } else {
                        setSelectedMeetingFacultyIds([...selectedMeetingFacultyIds, f.id]);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-100 text-metric-blue ring-1 ring-metric-blue/40 font-semibold'
                        : 'bg-[#eef0f2] text-[#5b616b] hover:text-ink'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isSelected ? 'bg-metric-blue' : 'bg-transparent border border-gray-400'
                      }`}
                    />
                    <span>{f.name}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Stat metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight text-ink">
                    {commonFreeSummary.totalCommonFreeSlots}
                  </p>
                  <p className="text-xs text-[#5b616b]">Mutual Free Periods</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-metric-blue">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-bold tracking-tight text-ink">
                    {commonFreeSummary.bestDayName ?? 'None'}
                  </p>
                  <p className="text-xs text-[#5b616b]">
                    Best Meeting Day ({commonFreeSummary.bestDayFreeCount} slots)
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-50 text-purple-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight text-ink">
                    {selectedMeetingFacultyIds.length}
                  </p>
                  <p className="text-xs text-[#5b616b]">Faculty Included</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight text-ink">
                    {commonFreeSummary.totalTeachingSlots}
                  </p>
                  <p className="text-xs text-[#5b616b]">Total Teaching Slots</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Availability Grid */}
          <Card
            title="Mutual Availability Grid"
            actions={
              <span className="text-xs text-body-gray">
                Click any slot to inspect faculty availability details
              </span>
            }
          >
            {selectedMeetingFacultyIds.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#5b616b]">
                Please select at least one faculty member above to view availability.
              </div>
            ) : (
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
                    {commonFreeSummary.slots.map((row, dayIndex) => (
                      <tr key={dayIndex}>
                        <th className="whitespace-nowrap rounded-lg bg-surface-2 px-2.5 text-[11px] font-semibold text-ink">
                          {department.workingDays[dayIndex].slice(0, 3)}
                        </th>
                        {row.map((slot) => {
                          if (slot.isBreak) {
                            return (
                              <td
                                key={slot.periodIndex}
                                className="rounded-lg bg-[#fdf6e9] p-1 align-middle ring-1 ring-inset ring-[#f0dfb8]"
                              >
                                <span
                                  className="block rounded-md p-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-[#92690e]"
                                  aria-label={`${slot.breakName} — ${department.workingDays[dayIndex]}`}
                                >
                                  🍽 {slot.breakName}
                                </span>
                              </td>
                            );
                          }

                          const isInspected =
                            inspectedSlot?.dayIndex === slot.dayIndex &&
                            inspectedSlot?.periodIndex === slot.periodIndex;

                          if (slot.isCommonFree) {
                            return (
                              <td
                                key={slot.periodIndex}
                                onClick={() => setInspectedSlot({ dayIndex: slot.dayIndex, periodIndex: slot.periodIndex })}
                                className={`cursor-pointer rounded-lg border border-emerald-300 bg-emerald-100 p-2 text-center transition-all hover:bg-emerald-200 ${
                                  isInspected ? 'ring-2 ring-emerald-600' : ''
                                }`}
                                title={`All ${slot.totalSelectedFaculty} faculty are free. Click to inspect.`}
                              >
                                <div className="text-xs font-bold text-emerald-950">✓ 100% Free</div>
                                <div className="text-[10px] text-emerald-800">
                                  All {slot.totalSelectedFaculty} available
                                </div>
                              </td>
                            );
                          }

                          if (slot.freeFacultyCount > 0) {
                            return (
                              <td
                                key={slot.periodIndex}
                                onClick={() => setInspectedSlot({ dayIndex: slot.dayIndex, periodIndex: slot.periodIndex })}
                                className={`cursor-pointer rounded-lg border border-amber-200 bg-amber-50/70 p-2 text-center transition-all hover:bg-amber-100 ${
                                  isInspected ? 'ring-2 ring-amber-500' : ''
                                }`}
                                title={`${slot.freeFacultyCount} free, ${slot.busyFacultyCount} teaching. Click to inspect.`}
                              >
                                <div className="text-xs font-semibold text-amber-950">
                                  {slot.freeFacultyCount}/{slot.totalSelectedFaculty} Free
                                </div>
                                <div className="text-[10px] text-amber-800">
                                  {slot.busyFacultyCount} teaching
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={slot.periodIndex}
                              onClick={() => setInspectedSlot({ dayIndex: slot.dayIndex, periodIndex: slot.periodIndex })}
                              className={`cursor-pointer rounded-lg bg-surface-1 p-2 text-center transition-all hover:bg-surface-2 ${
                                isInspected ? 'ring-2 ring-gray-400' : ''
                              }`}
                              title="All selected faculty are teaching. Click to inspect."
                            >
                              <div className="text-xs text-[#5b616b]">All busy</div>
                              <div className="text-[10px] text-[#5b616b]/70">0 available</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#5b616b] border-t border-[#e1e4e8] pt-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-emerald-100 border border-emerald-300" />
                <span>100% Mutual Free (All selected faculty available)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-amber-50 border border-amber-200" />
                <span>Partially Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-surface-1" />
                <span>All Busy</span>
              </div>
            </div>
          </Card>

          {/* Inspected Slot Inspector */}
          {inspectedSlot && (() => {
            const slot = commonFreeSummary.slots[inspectedSlot.dayIndex]?.[inspectedSlot.periodIndex];
            if (!slot) return null;
            return (
              <Card
                title={`Slot Details — ${department.workingDays[slot.dayIndex]} ${gridColumnLabel(layout, slot.periodIndex)}`}
                actions={
                  <Badge tone={slot.isCommonFree ? 'green' : slot.freeFacultyCount > 0 ? 'amber' : 'slate'}>
                    {slot.isCommonFree
                      ? `✓ All ${slot.totalSelectedFaculty} Faculty Available`
                      : `${slot.freeFacultyCount} of ${slot.totalSelectedFaculty} Available`}
                  </Badge>
                }
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      Available Faculty ({slot.freeFacultyNames.length})
                    </h4>
                    {slot.freeFacultyNames.length === 0 ? (
                      <p className="mt-2 text-xs italic text-body-gray">No faculty free in this slot.</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {slot.freeFacultyNames.map((name) => (
                          <li key={name} className="flex items-center gap-2 text-xs font-medium text-emerald-950">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            <span>{name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-md border border-amber-200 bg-amber-50/40 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Busy / Teaching Faculty ({slot.busyFaculty.length})
                    </h4>
                    {slot.busyFaculty.length === 0 ? (
                      <p className="mt-2 text-xs italic text-body-gray">None (everyone is free!).</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {slot.busyFaculty.map((b) => (
                          <li key={b.facultyId} className="text-xs text-amber-950">
                            <span className="font-semibold">{b.facultyName}</span>
                            <span className="text-[#5b616b]"> — {b.subjectCode} ({b.subjectName}) in <strong>{b.sectionName}</strong></span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Card>
            );
          })()}
        </div>
      )}

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
          activeFacultyId={activeFacultyId ?? undefined}
          type="FACULTY"
        />
      )}

      {timetable && (
        <SubstituteModal
          isOpen={substituteModalOpen}
          onClose={() => setSubstituteModalOpen(false)}
          timetable={timetable}
          department={department}
          subjects={subjects}
          faculty={faculty}
          sections={sections}
          initialFacultyId={activeFacultyId ?? undefined}
          collegeName={state.collegeDetails?.name}
          academicYear={state.collegeDetails?.academicYear}
          onAssignSubstitute={(entryId, substituteFacultyId) => {
            const nextEntries = timetable.entries.map((e) =>
              e.id === entryId ? { ...e, facultyId: substituteFacultyId } : e,
            );
            state.updateTimetable(timetable.id, { entries: nextEntries });
          }}
        />
      )}
    </div>
  );
}
