import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, PageHeader, Select } from '@/components/ui/primitives';
import {
  selectCurrentFaculty,
  selectCurrentSections,
  selectCurrentSubjects,
  selectTimetableForActiveDepartment,
  useWorkspaceStore,
} from '@/state/stores/workspace-store';

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
  const sections = useWorkspaceStore(selectCurrentSections);
  const subjects = useWorkspaceStore(selectCurrentSubjects);
  const faculty = useWorkspaceStore(selectCurrentFaculty);
  const timetable = useWorkspaceStore(selectTimetableForActiveDepartment);

  const department = state.departments.find((d) => d.id === departmentId);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);

  const activeFacultyId = selectedFacultyId ?? faculty.find((f) => f.active)?.id ?? null;
  const activeFaculty = faculty.find((f) => f.id === activeFacultyId);

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
    return <p className="text-sm text-body-gray">Select a department first.</p>;
  }

  if (!timetable) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Faculty workload" title={`Faculty timetable — ${department.code}`} />
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Faculty workload"
        title={`Faculty timetable — ${department.code}`}
        actions={
          <>
            <Badge tone={weeklyLoad > 0 ? 'blue' : 'slate'}>
              {weeklyLoad} periods / week
            </Badge>
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

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          Faculty:
          <Select
            value={activeFacultyId ?? ''}
            onChange={(e) => setSelectedFacultyId(e.target.value)}
            className="w-56"
            aria-label="Select faculty member"
          >
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}{f.active ? '' : ' (inactive)'}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {activeFaculty && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <p className="text-xl font-semibold tracking-tight text-ink">{weeklyLoad}</p>
            <p className="text-xs text-body-gray">Periods / week</p>
          </Card>
          <Card>
            <p className="text-xl font-semibold tracking-tight text-ink">{busyDays}/{dayCount}</p>
            <p className="text-xs text-body-gray">Busy days</p>
          </Card>
          <Card>
            <p className="text-xl font-semibold tracking-tight text-ink">{freePeriods}</p>
            <p className="text-xs text-body-gray">Free periods</p>
          </Card>
          <Card>
            <p className="text-xl font-semibold tracking-tight text-ink">
              {new Set([...cellBySlot.values()].map((c) => c.sectionId)).size}
            </p>
            <p className="text-xs text-body-gray">Sections taught</p>
          </Card>
        </div>
      )}

      <Card title={`${activeFaculty?.name ?? 'Faculty'} — weekly schedule across all sections`}>
        <div className="overflow-x-auto pb-1">
          <table className="min-w-full border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="p-1"></th>
                {Array.from({ length: ppd }, (_, i) => (
                  <th key={i} className="p-1 text-[11px] font-semibold uppercase tracking-wide text-body-gray">
                    P{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: dayCount }, (_, dayIndex) => (
                <tr key={dayIndex}>
                  <th className="whitespace-nowrap rounded-lg bg-surface-2 px-2.5 text-[11px] font-semibold text-ink">
                    {department.workingDays[dayIndex].slice(0, 3)}
                  </th>
                  {Array.from({ length: ppd }, (_, periodIndex) => {
                    const cell = cellBySlot.get(`${dayIndex}:${periodIndex}`);
                    if (!cell) {
                      return (
                        <td key={periodIndex} className="rounded-lg bg-surface-1 p-1">
                          <span className="block h-12" aria-label={`Free period ${periodIndex + 1}`} />
                        </td>
                      );
                    }
                    const tone = sectionTone(cell.sectionId);
                    return (
                      <td key={periodIndex} className={`rounded-lg p-1 align-top ${tone}`}>
                        {cell.isStart ? (
                          <div className="p-1.5">
                            <span className="block text-xs font-semibold text-ink">{cell.subjectCode}</span>
                            <span className="block truncate text-[10px] text-body-gray">{cell.sectionName}</span>
                            {cell.durationPeriods >= 2 && (
                              <span className="block text-[10px] font-medium text-[#5b3fb8]">LAB (2p)</span>
                            )}
                          </div>
                        ) : (
                          <span className="block p-1.5 text-[10px] text-body-gray">↳ {cell.subjectCode}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-body-gray">
          Read-only view: every session this faculty member teaches, across all sections. Cell colors identify the section. Use the section timetable to edit sessions.
        </p>
      </Card>
    </div>
  );
}
