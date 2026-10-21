import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  UserCheck,
  Calendar,
  Printer,
  FileText,
  AlertTriangle,
  Check,
  Search,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import type { Department, Faculty, Section, Subject, Timetable, TimetableEntry } from '@/domain/models';
import {
  findSubstitutesForEntry,
  generateSubstitutionSlipData,
  type SubstituteCandidate,
  type SubstitutionSlipData,
} from '@/domain/substitution/substitution-service';

export interface SubstituteModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: Timetable;
  department: Department;
  subjects: Subject[];
  faculty: Faculty[];
  sections: Section[];
  initialEntryId?: string | null;
  initialFacultyId?: string | null;
  collegeName?: string;
  academicYear?: string;
  onAssignSubstitute: (entryId: string, substituteFacultyId: string) => void;
}

export const SubstituteModal: React.FC<SubstituteModalProps> = ({
  isOpen,
  onClose,
  timetable,
  department,
  subjects,
  faculty,
  sections,
  initialEntryId = null,
  initialFacultyId = null,
  collegeName = 'COLLEGE OF ENGINEERING & TECHNOLOGY',
  academicYear = '2026-27',
  onAssignSubstitute,
}) => {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(initialEntryId);
  const [filterDayIndex, setFilterDayIndex] = useState<string>('ALL');
  const [filterSectionId, setFilterSectionId] = useState<string>('ALL');
  const [filterFacultyId, setFilterFacultyId] = useState<string>(initialFacultyId ?? 'ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'BEST_MATCH' | 'AVAILABLE' | 'OVERLOADED' | 'BUSY'>('ALL');
  const [activeSlipData, setActiveSlipData] = useState<SubstitutionSlipData | null>(null);
  const [confirmOverloadedCandidate, setConfirmOverloadedCandidate] = useState<SubstituteCandidate | null>(null);

  // Synchronize initial entry or faculty when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialEntryId) {
        setSelectedEntryId(initialEntryId);
      } else if (initialFacultyId) {
        setFilterFacultyId(initialFacultyId);
        // Pre-select first entry for this faculty
        const firstEntry = timetable.entries.find((e) => e.facultyId === initialFacultyId);
        if (firstEntry) setSelectedEntryId(firstEntry.id);
      } else if (timetable.entries.length > 0 && !selectedEntryId) {
        setSelectedEntryId(timetable.entries[0].id);
      }
      setActiveSlipData(null);
      setConfirmOverloadedCandidate(null);
    }
  }, [isOpen, initialEntryId, initialFacultyId, timetable.entries]);

  // Lookup maps
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const facultyMap = useMemo(() => new Map(faculty.map((f) => [f.id, f])), [faculty]);
  const sectionMap = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);
  const entryMap = useMemo(() => new Map(timetable.entries.map((e) => [e.id, e])), [timetable.entries]);

  // Selected entry object
  const currentEntry: TimetableEntry | null = useMemo(() => {
    if (!selectedEntryId) return null;
    return entryMap.get(selectedEntryId) ?? null;
  }, [selectedEntryId, entryMap]);

  // Filtered entries for session picker
  const filteredEntries = useMemo(() => {
    return timetable.entries.filter((e) => {
      if (filterDayIndex !== 'ALL' && e.dayIndex !== Number(filterDayIndex)) return false;
      if (filterSectionId !== 'ALL' && e.sectionId !== filterSectionId) return false;
      if (filterFacultyId !== 'ALL' && e.facultyId !== filterFacultyId) return false;
      return true;
    });
  }, [timetable.entries, filterDayIndex, filterSectionId, filterFacultyId]);

  // Evaluated substitute candidates for the active entry
  const candidates: SubstituteCandidate[] = useMemo(() => {
    if (!currentEntry) return [];
    return findSubstitutesForEntry({
      timetable,
      entry: currentEntry,
      subjects,
      faculty,
      sections,
      department,
    });
  }, [timetable, currentEntry, subjects, faculty, sections, department]);

  // Filtered candidate list based on search and tier filter
  const displayedCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (tierFilter !== 'ALL') {
        if (tierFilter === 'OVERLOADED') {
          if (c.tier !== 'OVERLOADED' && c.tier !== 'UNAVAILABLE_PREFERENCE') return false;
        } else if (c.tier !== tierFilter) {
          return false;
        }
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = c.faculty.name.toLowerCase().includes(term);
        const matchesCode = c.faculty.facultyCode.toLowerCase().includes(term);
        if (!matchesName && !matchesCode) return false;
      }
      return true;
    });
  }, [candidates, tierFilter, searchTerm]);

  // Counts by tier
  const bestMatchCount = useMemo(() => candidates.filter((c) => c.tier === 'BEST_MATCH').length, [candidates]);
  const availableCount = useMemo(() => candidates.filter((c) => c.tier === 'AVAILABLE').length, [candidates]);
  const overloadedCount = useMemo(
    () => candidates.filter((c) => c.tier === 'OVERLOADED' || c.tier === 'UNAVAILABLE_PREFERENCE').length,
    [candidates],
  );
  const busyCount = useMemo(() => candidates.filter((c) => c.tier === 'BUSY').length, [candidates]);

  if (!isOpen) return null;

  const currentSubject = currentEntry ? subjectMap.get(currentEntry.subjectId) : null;
  const currentFaculty = currentEntry ? facultyMap.get(currentEntry.facultyId) : null;
  const currentSection = currentEntry ? sectionMap.get(currentEntry.sectionId) : null;

  const handleOpenSlip = (candidate: SubstituteCandidate) => {
    if (!currentEntry || !currentSubject || !currentFaculty || !currentSection) return;
    const slip = generateSubstitutionSlipData({
      collegeName,
      academicYear,
      department,
      absentFaculty: currentFaculty,
      substituteFaculty: candidate.faculty,
      subject: currentSubject,
      section: currentSection,
      dayIndex: currentEntry.dayIndex,
      startPeriod: currentEntry.startPeriod,
      durationPeriods: currentEntry.durationPeriods,
    });
    setActiveSlipData(slip);
  };

  const handleAssign = (candidate: SubstituteCandidate) => {
    if (!currentEntry) return;

    if (candidate.tier === 'OVERLOADED' || candidate.tier === 'UNAVAILABLE_PREFERENCE') {
      setConfirmOverloadedCandidate(candidate);
      return;
    }

    onAssignSubstitute(currentEntry.id, candidate.faculty.id);
    handleOpenSlip(candidate);
  };

  const handleConfirmOverloadedAssign = () => {
    if (!currentEntry || !confirmOverloadedCandidate) return;
    const candidate = confirmOverloadedCandidate;
    setConfirmOverloadedCandidate(null);
    onAssignSubstitute(currentEntry.id, candidate.faculty.id);
    handleOpenSlip(candidate);
  };

  const getTimingText = (dayIndex: number, startPeriod: number, duration: number) => {
    const dayName = department.workingDays[dayIndex] ?? `Day ${dayIndex + 1}`;
    const timing = department.periodTimings?.[startPeriod];
    const periodLabel = duration > 1 ? `Periods ${startPeriod + 1}–${startPeriod + duration}` : `Period ${startPeriod + 1}`;
    const timeSlot = timing?.start && timing?.end ? ` (${timing.start} – ${timing.end})` : '';
    return `${dayName}, ${periodLabel}${timeSlot}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="substitute-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-surface-0 rounded-2xl border border-[#E5E8E0] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E8E0] bg-[#FAFAF8]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-metric-blue">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="substitute-modal-title" className="text-base font-semibold text-ink">
                Faculty Substitution & Coverage Assistant
              </h2>
              <p className="text-xs text-[#71767B]">
                Find conflict-free, qualified faculty to cover lectures and generate official coverage notices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-body-gray hover:text-ink hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {activeSlipData ? (
          /* Official Substitution Memo / Slip View */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveSlipData(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-metric-blue hover:underline"
              >
                ← Back to Candidate Recommendations
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-metric-blue hover:bg-blue-700 rounded-lg shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Official Slip
              </button>
            </div>

            {/* Printable Memo Document */}
            <div className="p-8 bg-white border border-gray-300 rounded-xl shadow-xs text-ink space-y-6 print:border-none print:p-0 print:shadow-none">
              <div className="text-center border-b border-gray-300 pb-4">
                <h1 className="text-lg font-bold tracking-wide uppercase text-gray-900">{activeSlipData.collegeName}</h1>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mt-0.5">
                  Department of {activeSlipData.departmentName} ({activeSlipData.departmentCode})
                </p>
                <div className="inline-block mt-3 px-3 py-1 bg-gray-100 rounded border border-gray-300 text-xs font-bold uppercase tracking-widest text-gray-800">
                  Faculty Substitution & Class Coverage Slip
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-600 border-b border-gray-200 pb-3">
                <div>
                  <span className="font-semibold text-gray-700">Date of Memo:</span> {activeSlipData.memoDate}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Academic Year:</span> {activeSlipData.academicYear}
                </div>
              </div>

              {/* Grid table */}
              <table className="w-full text-xs border border-gray-300 divide-y divide-gray-300">
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-gray-50/50">
                    <td className="px-4 py-2 font-semibold text-gray-700 w-1/3">Scheduled / Absent Faculty:</td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {activeSlipData.absentFacultyName} ({activeSlipData.absentFacultyCode})
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/40">
                    <td className="px-4 py-2 font-semibold text-emerald-900 w-1/3">Assigned Substitute Faculty:</td>
                    <td className="px-4 py-2 font-bold text-emerald-900">
                      {activeSlipData.substituteFacultyName} ({activeSlipData.substituteFacultyCode})
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold text-gray-700">Section / Class:</td>
                    <td className="px-4 py-2 text-gray-900">{activeSlipData.sectionName}</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="px-4 py-2 font-semibold text-gray-700">Subject / Course:</td>
                    <td className="px-4 py-2 text-gray-900">
                      {activeSlipData.subjectCode} — {activeSlipData.subjectName}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold text-gray-700">Date & Day:</td>
                    <td className="px-4 py-2 text-gray-900">{activeSlipData.dayOfWeek}</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="px-4 py-2 font-semibold text-gray-700">Period & Timing:</td>
                    <td className="px-4 py-2 text-gray-900">
                      {activeSlipData.periodLabel} ({activeSlipData.timeSlot})
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold text-gray-700">Classroom / Lab:</td>
                    <td className="px-4 py-2 text-gray-900">{activeSlipData.roomNo}</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="px-4 py-2 font-semibold text-gray-700">Reason / Remarks:</td>
                    <td className="px-4 py-2 text-gray-900 italic">{activeSlipData.reason}</td>
                  </tr>
                </tbody>
              </table>

              <div className="bg-amber-50/60 border border-amber-200 rounded p-3 text-[11px] text-amber-900">
                <strong>Notice:</strong> The substitute faculty member designated above has agreed to handle the
                stipulated class and take student attendance for this session.
              </div>

              {/* Signatures */}
              <div className="pt-10 grid grid-cols-3 gap-6 text-center text-xs text-gray-700">
                <div className="border-t border-gray-400 pt-2">
                  <div className="font-medium">Absent Faculty</div>
                  <div className="text-[10px] text-gray-500">Signature / Consent</div>
                </div>
                <div className="border-t border-gray-400 pt-2">
                  <div className="font-semibold text-gray-900">Substitute Faculty</div>
                  <div className="text-[10px] text-gray-500">Signature / Acceptance</div>
                </div>
                <div className="border-t border-gray-400 pt-2">
                  <div className="font-semibold text-gray-900">Head of Department</div>
                  <div className="text-[10px] text-gray-500">Approval & Seal</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Main Finder & Recommendation View */
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Session Selector / Target Banner */}
            <div className="rounded-xl border border-[#E5E8E0] bg-[#F9FAF8] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-metric-blue" />
                  Target Session to Substitute
                </span>
                {/* Session Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filterDayIndex}
                    onChange={(e) => setFilterDayIndex(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-[#E5E8E0] bg-white text-ink"
                  >
                    <option value="ALL">All Days</option>
                    {department.workingDays.map((d, i) => (
                      <option key={i} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterSectionId}
                    onChange={(e) => setFilterSectionId(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-[#E5E8E0] bg-white text-ink"
                  >
                    <option value="ALL">All Sections</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterFacultyId}
                    onChange={(e) => setFilterFacultyId(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-[#E5E8E0] bg-white text-ink"
                  >
                    <option value="ALL">All Faculty</option>
                    {faculty.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specific Entry Selector */}
              <div>
                <select
                  value={selectedEntryId ?? ''}
                  onChange={(e) => setSelectedEntryId(e.target.value || null)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-[#E5E8E0] bg-white text-ink focus:outline-hidden focus:ring-2 focus:ring-metric-blue"
                >
                  {filteredEntries.map((e) => {
                    const sub = subjectMap.get(e.subjectId);
                    const sec = sectionMap.get(e.sectionId);
                    const fac = facultyMap.get(e.facultyId);
                    const timing = getTimingText(e.dayIndex, e.startPeriod, e.durationPeriods);
                    return (
                      <option key={e.id} value={e.id}>
                        {timing} — {sec?.name} · {sub?.code} ({sub?.name}) — {fac?.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Active Entry Detail Pill */}
              {currentEntry && currentSubject && currentFaculty && currentSection && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E5E8E0] text-xs">
                  <div>
                    <span className="text-[11px] text-[#71767B] block">Subject</span>
                    <span className="font-semibold text-ink">
                      {currentSubject.code} ({currentSubject.name})
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#71767B] block">Current Faculty</span>
                    <span className="font-semibold text-ink">{currentFaculty.name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#71767B] block">Class Section</span>
                    <span className="font-semibold text-ink">{currentSection.name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#71767B] block">Slot & Duration</span>
                    <span className="font-semibold text-ink">
                      {department.workingDays[currentEntry.dayIndex]}, P{currentEntry.startPeriod + 1} ({currentEntry.durationPeriods}{' '}
                      {currentEntry.durationPeriods > 1 ? 'hrs' : 'hr'})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Candidate Filters & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Tier Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F1F3ED] rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setTierFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    tierFilter === 'ALL' ? 'bg-white text-ink shadow-xs font-semibold' : 'text-[#71767B] hover:text-ink'
                  }`}
                >
                  All ({candidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('BEST_MATCH')}
                  className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                    tierFilter === 'BEST_MATCH'
                      ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  Best Match ({bestMatchCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('AVAILABLE')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    tierFilter === 'AVAILABLE'
                      ? 'bg-sky-600 text-white shadow-xs font-semibold'
                      : 'text-sky-700 hover:bg-sky-50'
                  }`}
                >
                  Available ({availableCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('OVERLOADED')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    tierFilter === 'OVERLOADED'
                      ? 'bg-amber-600 text-white shadow-xs font-semibold'
                      : 'text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  Overloaded ({overloadedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('BUSY')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    tierFilter === 'BUSY'
                      ? 'bg-rose-600 text-white shadow-xs font-semibold'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  Busy ({busyCount})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#71767B]" />
                <input
                  type="text"
                  placeholder="Filter candidate faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E5E8E0] bg-white text-ink placeholder-[#71767B] focus:outline-hidden focus:ring-2 focus:ring-metric-blue"
                />
              </div>
            </div>

            {/* Candidate List */}
            {displayedCandidates.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-[#E5E8E0] bg-[#F9FAF8]">
                <p className="text-sm font-medium text-ink">No substitute faculty found</p>
                <p className="text-xs text-[#71767B] mt-1">
                  Try adjusting the tier filters or searching for a different faculty name.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedCandidates.map((c) => {
                  const f = c.faculty;
                  const isEligibleSubject = c.isEligible;
                  const isBusy = c.tier === 'BUSY';
                  const isOverloaded = c.tier === 'OVERLOADED' || c.tier === 'UNAVAILABLE_PREFERENCE';
                  const isBest = c.tier === 'BEST_MATCH';

                  return (
                    <div
                      key={f.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                        isBest
                          ? 'bg-emerald-50/30 border-emerald-300 hover:border-emerald-400'
                          : isBusy
                          ? 'bg-gray-50/50 border-gray-200 opacity-60'
                          : isOverloaded
                          ? 'bg-amber-50/20 border-amber-300 hover:border-amber-400'
                          : 'bg-white border-[#E5E8E0] hover:border-blue-300'
                      }`}
                    >
                      {/* Left: Avatar & Info */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                            isBest
                              ? 'bg-emerald-100 text-emerald-800'
                              : isBusy
                              ? 'bg-gray-200 text-gray-700'
                              : isOverloaded
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {f.facultyCode.slice(0, 3)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-ink">{f.name}</span>
                            <span className="text-xs text-[#71767B]">({f.facultyCode})</span>

                            {/* Tier Badge */}
                            {isBest && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Sparkles className="w-2.5 h-2.5" /> Best Match
                              </span>
                            )}
                            {c.tier === 'AVAILABLE' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-300">
                                Available
                              </span>
                            )}
                            {c.tier === 'OVERLOADED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertTriangle className="w-2.5 h-2.5" /> Overloaded
                              </span>
                            )}
                            {c.tier === 'UNAVAILABLE_PREFERENCE' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-800 border border-orange-300">
                                Off-Preference
                              </span>
                            )}
                            {isBusy && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                                Conflict
                              </span>
                            )}
                          </div>

                          {/* Workload and qualification tags */}
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#71767B]">
                            <span>
                              Today: <strong className="text-ink">{c.dailyLoad}</strong>
                              {f.maxPeriodsPerDay ? `/${f.maxPeriodsPerDay}` : ''} periods
                            </span>
                            <span>•</span>
                            <span>
                              Weekly: <strong className="text-ink">{c.weeklyLoad}</strong>
                              {f.maxPeriodsPerWeek ? `/${f.maxPeriodsPerWeek}` : ''} periods
                            </span>
                            <span>•</span>
                            <span className={isEligibleSubject ? 'text-emerald-700 font-medium' : 'text-[#71767B]'}>
                              {isEligibleSubject ? '✓ Designated for this subject' : 'General Department Faculty'}
                            </span>
                          </div>

                          {/* Reason breakdown */}
                          <div className="mt-1 text-[11px] text-[#71767B] italic">
                            {c.reasons.join(' · ')}
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenSlip(c)}
                          title="Generate official substitution slip without assigning"
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#E5E8E0] bg-white text-ink hover:bg-black/5 transition-colors inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-body-gray" />
                          Slip
                        </button>

                        {isBusy ? (
                          <button
                            type="button"
                            disabled
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                          >
                            Busy
                          </button>
                        ) : isOverloaded ? (
                          <button
                            type="button"
                            onClick={() => handleAssign(c)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors inline-flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Assign Anyway
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAssign(c)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-metric-blue hover:bg-blue-700 text-white shadow-xs transition-colors inline-flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Assign Substitute
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal for Overloaded Faculty */}
        {confirmOverloadedCandidate && (
          <div className="absolute inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-2xl p-5 border border-amber-300 shadow-xl space-y-4">
              <div className="flex items-center gap-3 text-amber-700">
                <div className="p-2 rounded-xl bg-amber-100">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Workload Limit Warning</h3>
                  <p className="text-xs text-[#71767B]">Confirm substitute assignment</p>
                </div>
              </div>

              <div className="text-xs text-ink space-y-2 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <p>
                  Assigning <strong>{confirmOverloadedCandidate.faculty.name}</strong> will exceed their configured daily
                  or weekly workload cap:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-amber-900">
                  {confirmOverloadedCandidate.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmOverloadedCandidate(null)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E8E0] bg-white text-ink hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOverloadedAssign}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  Confirm & Assign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#E5E8E0] bg-[#FAFAF8]">
          <div className="text-xs text-[#71767B]">
            {activeSlipData ? 'Substitution slip ready for print.' : `${candidates.length} active faculty evaluated.`}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E5E8E0] bg-white hover:bg-black/5 text-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
