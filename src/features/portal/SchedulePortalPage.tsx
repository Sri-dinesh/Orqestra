import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  User,
  GraduationCap,
  Building2,
  Printer,
  Coffee,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { buildGridLayout } from '@/domain/scheduler/grid-layout';
import type {
  Department,
  Section,
  Subject,
  Faculty,
  Room,
  Break,
  Timetable,
} from '@/domain/models';

interface PortalData {
  timetable: Timetable;
  department: Department;
  term?: any;
  college?: any;
  sections: Section[];
  subjects: Subject[];
  faculty: Faculty[];
  rooms: Room[];
  breaks: Break[];
}

export function SchedulePortalPage() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug');

  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(Boolean(slug));
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoadingPortal(true);
    fetch(`/api/portal/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Published schedule not found.');
        }
        return res.json();
      })
      .then((data: PortalData) => {
        setPortalData(data);
        setLoadingPortal(false);
      })
      .catch((err: Error) => {
        setPortalError(err.message);
        setLoadingPortal(false);
      });
  }, [slug]);

  const state = useWorkspaceStore();

  const isPublicSlugMode = Boolean(slug && portalData);

  const departments: Department[] = isPublicSlugMode
    ? (portalData?.department ? [portalData.department] : [])
    : state.departments;

  // Active department selection
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    state.activeDepartmentId ?? departments[0]?.id ?? '',
  );

  const currentDept: Department | undefined = isPublicSlugMode
    ? portalData?.department
    : (departments.find((d) => d.id === selectedDeptId) ?? departments[0]);

  const sections: Section[] = isPublicSlugMode
    ? (portalData?.sections ?? [])
    : state.sections.filter((sec) => sec.departmentId === currentDept?.id);

  const subjects: Subject[] = isPublicSlugMode
    ? (portalData?.subjects ?? [])
    : state.subjects.filter((sub) => sub.departmentId === currentDept?.id);

  const faculty: Faculty[] = isPublicSlugMode
    ? (portalData?.faculty ?? [])
    : state.faculty.filter((f) => f.departmentId === currentDept?.id);

  const rooms: Room[] = isPublicSlugMode
    ? (portalData?.rooms ?? [])
    : state.rooms.filter((r) => r.departmentId === currentDept?.id);

  const breaks: Break[] = isPublicSlugMode ? (portalData?.breaks ?? []) : state.breaks;

  const timetable: Timetable | undefined = isPublicSlugMode
    ? portalData?.timetable
    : state.timetables.find((t) => t.departmentId === currentDept?.id);

  // Portal view mode: STUDENT (by Section) or FACULTY (by Teacher)
  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id ?? '');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(faculty[0]?.id ?? '');

  // Day filter (0-indexed according to workingDays)
  // Auto-detect current weekday
  const currentWeekdayIndex = useMemo(() => {
    if (!currentDept) return 0;
    const now = new Date();
    const dayMap = [6, 0, 1, 2, 3, 4, 5]; // Sunday = 6, Monday = 0...
    const jsDay = now.getDay();
    const mapped = dayMap[jsDay];
    return mapped < currentDept.workingDays.length ? mapped : 0;
  }, [currentDept]);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(currentWeekdayIndex);

  const activeSection = sections.find((s) => s.id === selectedSectionId) ?? sections[0];
  const activeFaculty = faculty.find((f) => f.id === selectedFacultyId) ?? faculty[0];

  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const facultyById = useMemo(() => new Map(faculty.map((f) => [f.id, f])), [faculty]);
  const sectionById = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);
  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  // Build grid layout for period timings and break columns
  const layout = useMemo(() => {
    if (!currentDept) return null;
    return buildGridLayout(currentDept.periodsPerDay, breaks);
  }, [currentDept, breaks]);

  // Entries for the chosen filter
  const relevantEntries = useMemo(() => {
    if (!timetable) return [];
    if (role === 'STUDENT') {
      const targetSecId = selectedSectionId || sections[0]?.id;
      return timetable.entries.filter((e) => e.sectionId === targetSecId);
    } else {
      const targetFacId = selectedFacultyId || faculty[0]?.id;
      return timetable.entries.filter((e) => e.facultyId === targetFacId);
    }
  }, [timetable, role, selectedSectionId, selectedFacultyId, sections, faculty]);

  // Agenda items for the selected day, ordered by startPeriod
  const dailyTimeline = useMemo(() => {
    if (!currentDept || !layout) return [];

    const dayEntries = relevantEntries.filter((e) => e.dayIndex === selectedDayIndex);
    const timelineItems: Array<{
      type: 'ENTRY' | 'BREAK' | 'FREE';
      startPeriod: number;
      durationPeriods: number;
      periodLabel: string;
      timing?: string;
      entry?: any;
      breakItem?: any;
    }> = [];

    // Map each column in grid layout
    for (let colIdx = 0; colIdx < layout.columns.length; colIdx++) {
      const col = layout.columns[colIdx];

      if (col.kind === 'break') {
        const b = breaks.find((x) => x.id === col.breakId);
        const timing = b?.startTime && b?.endTime ? `${b.startTime} – ${b.endTime}` : undefined;
        timelineItems.push({
          type: 'BREAK',
          startPeriod: colIdx,
          durationPeriods: 1,
          periodLabel: col.name,
          timing,
          breakItem: b,
        });
      } else {
        // Teaching period
        const entry = dayEntries.find(
          (e) => colIdx >= e.startPeriod && colIdx < e.startPeriod + e.durationPeriods,
        );

        const timing = currentDept.periodTimings?.[col.teachingIndex]
          ? [currentDept.periodTimings[col.teachingIndex].start, currentDept.periodTimings[col.teachingIndex].end].filter(Boolean).join(' – ')
          : undefined;

        if (entry) {
          // Only add at the start of multi-period sessions
          if (entry.startPeriod === colIdx) {
            timelineItems.push({
              type: 'ENTRY',
              startPeriod: colIdx,
              durationPeriods: entry.durationPeriods,
              periodLabel: `Period ${col.teachingIndex + 1}`,
              timing,
              entry,
            });
          }
        } else {
          timelineItems.push({
            type: 'FREE',
            startPeriod: colIdx,
            durationPeriods: 1,
            periodLabel: `Period ${col.teachingIndex + 1}`,
            timing,
          });
        }
      }
    }

    return timelineItems;
  }, [currentDept, layout, relevantEntries, selectedDayIndex, breaks]);

  if (loadingPortal) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111315] text-white">
          <Calendar className="h-6 w-6 animate-pulse text-[#0047FF]" />
        </div>
        <h2 className="mt-4 text-sm font-semibold text-[#111315]">Loading published institutional schedule…</h2>
        <p className="mt-1 text-xs text-[#71767B]">Fetching the latest verified timetable from Neon Cloud</p>
      </div>
    );
  }

  if (slug && portalError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <Calendar className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-base font-bold text-[#111315]">Schedule Not Available</h2>
        <p className="mt-1 max-w-sm text-xs text-[#4B5259]">
          {portalError || 'This timetable is either unpublished, expired, or the link is invalid.'}
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#111315] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-black transition"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  if (!currentDept) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center border border-[#E5E8E0] shadow-card max-w-md mx-auto my-12">
        <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-[#0047FF] border border-blue-100 mb-3">
          <Calendar className="w-8 h-8 text-[#0047FF]" />
        </div>
        <p className="text-base font-bold text-[#111315]">No Departments Found</p>
        <p className="text-xs text-[#71767B] mt-1">Please create a department in the Dashboard first to view student and faculty schedules.</p>
        <div className="mt-5">
          <Link to="/dashboard">
            <Button size="sm" className="inline-flex items-center gap-1.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const printSchedule = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono font-bold tracking-widest text-[#0047FF] uppercase">
            CAMPUS DAILY AGENDA
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#111315] tracking-tight">
            My Schedule Portal
          </h1>
          <p className="text-xs text-[#71767B] mt-0.5">
            Real-time personalized class schedule · {currentDept.name} ({currentDept.code})
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            type="button"
            onClick={printSchedule}
            className="px-3.5 py-2 text-xs font-semibold text-[#111315] bg-white border border-[#D0D5DD] hover:bg-black/5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#71767B]" />
            <span>Print Agenda</span>
          </button>
        </div>
      </div>

      {/* Control Strip (Role, Department, Target) */}
      <div className="bg-white rounded-2xl border border-[#E5E8E0] shadow-xs p-4 sm:p-5 space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Student vs Faculty Switcher */}
          <div className="flex items-center p-1 bg-[#F0F2EB] rounded-xl">
            <button
              type="button"
              onClick={() => setRole('STUDENT')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                role === 'STUDENT'
                  ? 'bg-white text-[#111315] shadow-xs'
                  : 'text-[#71767B] hover:text-[#111315]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('FACULTY')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                role === 'FACULTY'
                  ? 'bg-white text-[#111315] shadow-xs'
                  : 'text-[#71767B] hover:text-[#111315]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Faculty Workload</span>
            </button>
          </div>

          {/* Department Selector if multiple exist */}
          {departments.length > 1 && (
            <label className="flex items-center gap-2 text-xs font-semibold text-[#4B5259]">
              Department:
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  const firstSec = state.sections.find((s) => s.departmentId === e.target.value);
                  if (firstSec) setSelectedSectionId(firstSec.id);
                  const firstFac = state.faculty.find((f) => f.departmentId === e.target.value);
                  if (firstFac) setSelectedFacultyId(firstFac.id);
                }}
                className="rounded-lg border border-[#D0D5DD] bg-white px-2.5 py-1.5 text-xs font-medium text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Target Selector (Section or Faculty) */}
          <div>
            {role === 'STUDENT' ? (
              <label className="flex items-center gap-2 text-xs font-semibold text-[#4B5259]">
                Select Class Section:
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-xs font-bold text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} {sec.roomNo ? `· Room ${sec.roomNo}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="flex items-center gap-2 text-xs font-semibold text-[#4B5259]">
                Select Faculty Member:
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-xs font-bold text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
                >
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.facultyCode})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        {/* Day of Week Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#E5E8E0] scrollbar-none">
          <span className="text-xs font-semibold text-[#71767B] mr-1 hidden sm:inline">
            Day:
          </span>
          {currentDept.workingDays.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            const isToday = idx === currentWeekdayIndex;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#111315] text-white shadow-xs'
                    : 'bg-[#FAFBF9] text-[#4B5259] border border-[#E5E8E0] hover:bg-black/5 hover:text-[#111315]'
                }`}
              >
                <span>{day.substring(0, 3)}</span>
                {isToday && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-emerald-400' : 'bg-[#0047FF]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Details Badge Bar */}
      <div className="bg-[#FAFBF9] border border-[#E5E8E0] rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#111315] font-semibold">
          {role === 'STUDENT' ? (
            <>
              <GraduationCap className="w-4 h-4 text-[#0047FF]" />
              <span>Section: <strong>{activeSection?.name ?? '—'}</strong></span>
              {activeSection?.roomNo && (
                <span className="text-[#71767B]">· Homeroom: {activeSection.roomNo}</span>
              )}
              {activeSection?.classAdvisor && (
                <span className="text-[#71767B]">· Advisor: {activeSection.classAdvisor}</span>
              )}
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-[#0047FF]" />
              <span>Faculty: <strong>{activeFaculty?.name ?? '—'}</strong> ({activeFaculty?.facultyCode})</span>
              <span className="text-[#71767B]">· Weekly Load: {relevantEntries.reduce((acc, e) => acc + e.durationPeriods, 0)} periods</span>
            </>
          )}
        </div>

        <div className="text-[#71767B] font-mono">
          Showing: <strong>{currentDept.workingDays[selectedDayIndex]}</strong> · {dailyTimeline.filter((t) => t.type === 'ENTRY').length} class session(s)
        </div>
      </div>

      {/* Daily Timeline Cards */}
      {!timetable ? (
        <div className="bg-white rounded-2xl border border-[#E5E8E0] p-12 text-center text-[#71767B] space-y-2">
          <Calendar className="w-10 h-10 mx-auto text-[#71767B]/40" />
          <p className="text-base font-bold text-[#111315]">Timetable Not Yet Generated</p>
          <p className="text-xs">Generate the timetable in the scheduling engine to view live class schedules.</p>
        </div>
      ) : dailyTimeline.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E8E0] p-12 text-center text-[#71767B]">
          <p className="text-sm font-semibold text-[#111315]">No sessions scheduled for this day</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dailyTimeline.map((item, idx) => {
            if (item.type === 'BREAK') {
              return (
                <div
                  key={idx}
                  className="bg-[#FAFBF9] border border-dashed border-[#D0D5DD] rounded-xl px-5 py-3 flex items-center justify-between text-xs text-[#71767B]"
                >
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-[#111315] uppercase tracking-wider text-[11px]">
                      {item.periodLabel}
                    </span>
                  </div>
                  {item.timing && (
                    <span className="font-mono text-[#555] font-medium">{item.timing}</span>
                  )}
                </div>
              );
            }

            if (item.type === 'FREE') {
              return (
                <div
                  key={idx}
                  className="bg-white/60 border border-[#E5E8E0] rounded-xl px-5 py-3 flex items-center justify-between text-xs text-[#71767B]/70"
                >
                  <span className="font-medium text-[11px] text-[#71767B]">
                    {item.periodLabel}
                  </span>
                  <span className="italic">Free Period / Self Study</span>
                  {item.timing && <span className="font-mono text-[11px]">{item.timing}</span>}
                </div>
              );
            }

            // ENTRY Card
            const entry = item.entry;
            const subject = subjectById.get(entry.subjectId);
            const teacher = facultyById.get(entry.facultyId);
            const section = sectionById.get(entry.sectionId);
            const room = entry.roomId ? roomById.get(entry.roomId) : null;
            const isLab = subject?.type === 'LAB' || entry.durationPeriods > 1;

            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all hover:shadow-md ${
                  isLab
                    ? 'border-purple-200/80 bg-purple-50/15'
                    : 'border-[#E5E8E0] hover:border-black/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#111315] text-white">
                        {item.periodLabel}
                        {entry.durationPeriods > 1 ? ` – P${entry.startPeriod + entry.durationPeriods}` : ''}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isLab
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isLab ? 'Laboratory (2 Periods)' : 'Theory Session'}
                      </span>
                      {subject?.courseCode && (
                        <span className="font-mono text-xs text-[#71767B]">
                          [{subject.courseCode}]
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#111315] pt-0.5">
                      {subject?.name ?? 'Course Title'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4B5259] pt-1">
                      {role === 'STUDENT' ? (
                        <span className="flex items-center gap-1.5 font-medium">
                          <User className="w-3.5 h-3.5 text-[#0047FF]" />
                          Instructor: <strong>{teacher?.name ?? '—'}</strong> ({teacher?.facultyCode})
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 font-medium">
                          <GraduationCap className="w-3.5 h-3.5 text-[#0047FF]" />
                          Class: <strong>{section?.name ?? '—'}</strong>
                        </span>
                      )}

                      {(room || section?.roomNo) && (
                        <span className="flex items-center gap-1.5 font-mono text-[#111315] bg-[#F0F2EB] px-2 py-0.5 rounded-lg">
                          <Building2 className="w-3.5 h-3.5 text-[#71767B]" />
                          Room: <strong>{room?.code ?? section?.roomNo}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {item.timing && (
                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E5E8E0] text-xs">
                      <span className="text-[10px] uppercase font-mono text-[#71767B]">Period Time</span>
                      <span className="font-mono font-bold text-[#111315] text-sm">
                        {item.timing}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
