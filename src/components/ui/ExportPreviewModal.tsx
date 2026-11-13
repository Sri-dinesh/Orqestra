import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCode,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import {
  exportTimetableAsPdf,
  exportTimetableAsExcel,
  exportTimetableAsWord,
  exportDepartmentBookletPdf,
  buildTimetableGrid,
  type ExportInput,
} from '@/application/export-service';
import type { Department, Faculty, Subject, Timetable, CollegeDetails, Break } from '@/domain/models';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: Timetable;
  department: Department;
  sections: { id: string; name: string; roomNo?: string; classAdvisor?: string; year?: number; semester?: number }[];
  subjects: Subject[];
  faculty: Faculty[];
  breaks?: Break[];
  collegeDetails?: CollegeDetails;
  initialSectionId?: string;
  type?: 'SECTION' | 'FACULTY' | 'MASTER';
  activeFacultyId?: string;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  timetable,
  department,
  sections,
  subjects,
  faculty,
  breaks = [],
  collegeDetails,
  initialSectionId,
  type = 'SECTION',
  activeFacultyId,
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    initialSectionId ?? sections[0]?.id ?? '',
  );
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(
    activeFacultyId ?? faculty[0]?.id ?? '',
  );
  const [zoom, setZoom] = useState<number>(100);
  const [previewTab, setPreviewTab] = useState<'SHEET' | 'EXCEL' | 'WORD'>('SHEET');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSection = sections.find((s) => s.id === selectedSectionId) ?? sections[0];

  const exportInput: ExportInput = {
    timetable,
    department,
    sections,
    subjects,
    faculty,
    breaks,
    collegeDetails,
    sectionId: selectedSectionId || (sections[0]?.id ?? ''),
  };

  const { dayLabels, periodLabels, grid } = buildTimetableGrid(exportInput);
  const facultyById = new Map(faculty.map((f) => [f.id, f]));
  const sectionSubjects = subjects.filter((s) => s.eligibleSectionIds.includes(currentSection?.id ?? ''));

  const collegeName = collegeDetails?.name?.trim() || department.name;
  const academicYear = collegeDetails?.academicYear?.trim() || '—';
  const effectiveDate =
    department.effectiveFrom ??
    new Date(timetable.createdAt || Date.now()).toLocaleDateString('en-GB');

  const notifySuccess = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadPdf = () => {
    try {
      exportTimetableAsPdf(exportInput);
      notifySuccess('PDF downloaded successfully!');
    } catch {
      alert('Failed to generate PDF');
    }
  };

  const handleDownloadExcel = () => {
    try {
      exportTimetableAsExcel(exportInput);
      notifySuccess('Excel spreadsheet downloaded!');
    } catch {
      alert('Failed to generate Excel file');
    }
  };

  const handleDownloadWord = () => {
    try {
      exportTimetableAsWord(exportInput);
      notifySuccess('Word document downloaded!');
    } catch {
      alert('Failed to generate Word document');
    }
  };

  const handleDownloadBooklet = () => {
    try {
      exportDepartmentBookletPdf({
        timetable,
        department,
        sections,
        subjects,
        faculty,
        breaks,
        collegeDetails,
      });
      notifySuccess(`Department Booklet (${sections.length} sections) downloaded!`);
    } catch {
      alert('Failed to generate Department Booklet PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto no-print">
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col bg-[#f6f7f8] rounded-md shadow-2xl border border-black/10 overflow-hidden">
        {/* Modal Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-b border-[#e1e4e8] gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#121417] text-white text-xs font-bold">
              O
            </span>
            <div>
              <h2 className="text-base font-bold text-[#121417]">
                Export &amp; Print Preview
              </h2>
              <p className="text-xs text-[#5b616b]">
                Notice-board ready institutional document · {department.name} ({department.code})
              </p>
            </div>
          </div>

          {/* Section / Faculty Selector */}
          <div className="flex items-center gap-3">
            {type === 'SECTION' && sections.length > 0 && (
              <label className="flex items-center gap-2 text-xs font-semibold text-[#5b616b]">
                Section:
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="rounded-lg border border-[#e1e4e8] bg-white px-2.5 py-1.5 text-xs font-medium text-[#121417] focus:outline-none focus:ring-2 focus:ring-[#3b6fe0]"
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} {sec.roomNo ? `(Room ${sec.roomNo})` : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {type === 'FACULTY' && faculty.length > 0 && (
              <label className="flex items-center gap-2 text-xs font-semibold text-[#5b616b]">
                Faculty:
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="rounded-lg border border-[#e1e4e8] bg-white px-2.5 py-1.5 text-xs font-medium text-[#121417] focus:outline-none focus:ring-2 focus:ring-[#3b6fe0]"
                >
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.facultyCode})
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* View Mode Tabs */}
            <div className="flex items-center rounded-lg bg-[#F0F2EB] p-1">
              <button
                type="button"
                onClick={() => setPreviewTab('SHEET')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  previewTab === 'SHEET'
                    ? 'bg-white text-[#121417] shadow-xs'
                    : 'text-[#5b616b] hover:text-[#121417]'
                }`}
              >
                Notice Sheet (PDF)
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('EXCEL')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  previewTab === 'EXCEL'
                    ? 'bg-white text-[#121417] shadow-xs'
                    : 'text-[#5b616b] hover:text-[#121417]'
                }`}
              >
                Excel Grid
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('WORD')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  previewTab === 'WORD'
                    ? 'bg-white text-[#121417] shadow-xs'
                    : 'text-[#5b616b] hover:text-[#121417]'
                }`}
              >
                Word Doc
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border-l border-[#e1e4e8] pl-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(60, z - 10))}
                className="p-1.5 rounded-lg text-[#5b616b] hover:text-[#121417] hover:bg-black/5"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-medium text-[#5b616b] w-10 text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(150, z + 10))}
                className="p-1.5 rounded-lg text-[#5b616b] hover:text-[#121417] hover:bg-black/5"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="p-1.5 rounded-lg text-[#5b616b] hover:text-[#121417] hover:bg-black/5"
                title="Reset Zoom"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5b616b] hover:text-[#121417] hover:bg-black/5 ml-2"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success toast notification */}
        {downloadSuccess && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Modal Scrollable Canvas */}
        <div className="flex-1 overflow-auto p-6 sm:p-10 flex justify-center bg-[#e1e4e8]/40">
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="w-full max-w-[1040px] bg-white rounded-md shadow-xl border border-black/10 p-8 sm:p-10 text-[#121417]"
          >
            {/* Document Header */}
            <div className="text-center space-y-1 mb-5">
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#121417] uppercase">
                {collegeName}
              </h1>
              <p className="text-sm font-semibold tracking-wide text-[#33383F] uppercase">
                Department of {department.name}
              </p>
              <h2 className="text-xs sm:text-sm font-bold text-[#3b6fe0] tracking-wider uppercase">
                Class Timetable — {currentSection?.name ?? 'Section'}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[#555D67] pt-1">
                <span>
                  <strong>Academic Year:</strong> {academicYear}
                </span>
                <span>•</span>
                <span>
                  <strong>Room No:</strong> {currentSection?.roomNo ?? '—'}
                </span>
                <span>•</span>
                <span>
                  <strong>With effect from:</strong> {effectiveDate}
                </span>
              </div>
              <div className="h-[2px] w-full bg-[#121417]/15 mt-3 rounded-full" />
            </div>

            {/* Weekly Timetable Grid */}
            <div className="overflow-x-auto mb-4 border border-[#333] rounded-lg">
              <table className="w-full border-collapse text-center text-xs">
                <thead>
                  <tr className="bg-[#F0F3F6] border-b border-[#333]">
                    <th className="border-r border-[#333] p-2 font-bold w-20 text-[#121417]">
                      DAY
                    </th>
                    {periodLabels.map((lbl, idx) => (
                      <th
                        key={idx}
                        className="border-r last:border-r-0 border-[#333] p-2 font-bold text-[#121417]"
                      >
                        {lbl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dayLabels.map((day, d) => (
                    <tr
                      key={day}
                      className="border-b last:border-b-0 border-[#333]"
                    >
                      <th className="border-r border-[#333] p-2 font-bold bg-[#F5F7FA] text-[#121417]">
                        {day.slice(0, 3).toUpperCase()}
                      </th>
                      {grid[d].map((cell, cIdx) => {
                        if (cell.isBreak) {
                          return (
                            <td
                              key={cIdx}
                              className="border-r last:border-r-0 border-[#333] p-2 bg-[#FDF8ED] text-[#92690E] font-semibold text-[11px]"
                            >
                              {cell.label}
                            </td>
                          );
                        }
                        if (!cell.label) {
                          return (
                            <td
                              key={cIdx}
                              className="border-r last:border-r-0 border-[#333] p-2 text-[#999]"
                            >
                              —
                            </td>
                          );
                        }
                        const isLab = cell.label.includes('(LAB)');
                        return (
                          <td
                            key={cIdx}
                            className={`border-r last:border-r-0 border-[#333] p-2 ${
                              isLab ? 'bg-[#F3F0FC]' : 'bg-[#F0F5FF]'
                            }`}
                          >
                            <span className="block font-bold text-[#121417] text-[11.5px]">
                              {cell.label}
                            </span>
                            {cell.detail && (
                              <span className="block text-[10px] text-[#555] font-medium mt-0.5">
                                ({cell.detail})
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Class Advisor & Mentors Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-[#ffffff] border border-[#333] rounded-lg text-xs font-semibold text-[#121417] mb-4">
              <span>
                Class Advisor:{' '}
                <span className="font-normal text-[#333]">
                  {currentSection?.classAdvisor ?? '—'}
                </span>
              </span>
              {department.mentors && (
                <span>
                  Mentors:{' '}
                  <span className="font-normal text-[#333]">
                    {department.mentors}
                  </span>
                </span>
              )}
            </div>

            {/* Course Details & Faculty Instructor Details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-5">
              {/* Course Details */}
              <div className="md:col-span-7 border border-[#333] rounded-lg overflow-hidden">
                <div className="bg-[#F0F3F6] font-bold text-xs p-1.5 text-center border-b border-[#333]">
                  Course Details
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#ffffff] border-b border-[#333] text-[11px] font-semibold">
                      <th className="p-1.5 border-r border-[#333] w-16 text-center">
                        Code
                      </th>
                      <th className="p-1.5 border-r border-[#333] w-20 text-center">
                        Course Code
                      </th>
                      <th className="p-1.5 text-left">Title of the Course</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionSubjects.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b last:border-b-0 border-[#333]"
                      >
                        <td className="p-1.5 border-r border-[#333] font-bold text-center">
                          {s.code}
                        </td>
                        <td className="p-1.5 border-r border-[#333] text-center text-[#444]">
                          {s.courseCode ?? '—'}
                        </td>
                        <td className="p-1.5 text-left font-medium">{s.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Course Instructor Details */}
              <div className="md:col-span-5 border border-[#333] rounded-lg overflow-hidden">
                <div className="bg-[#F0F3F6] font-bold text-xs p-1.5 text-center border-b border-[#333]">
                  Course Instructor Details
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#ffffff] border-b border-[#333] text-[11px] font-semibold">
                      <th className="p-1.5 border-r border-[#333] w-16 text-center">
                        Code
                      </th>
                      <th className="p-1.5 text-left">Name of the Instructor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionSubjects.map((s) => {
                      const instructors = s.eligibleFacultyIds
                        .map((id) => facultyById.get(id)?.name ?? id)
                        .filter(Boolean);
                      return (
                        <tr
                          key={s.id}
                          className="border-b last:border-b-0 border-[#333]"
                        >
                          <td className="p-1.5 border-r border-[#333] font-bold text-center">
                            {s.code}
                          </td>
                          <td className="p-1.5 text-left font-medium text-[#222]">
                            {instructors.join(' / ') || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Signatories */}
            <div className="border border-[#333] rounded-lg overflow-hidden mb-4">
              <div className="grid grid-cols-4 divide-x divide-[#333] text-center">
                <div className="h-12 flex items-end justify-center pb-1 font-bold text-xs bg-white"></div>
                <div className="h-12 flex items-end justify-center pb-1 font-bold text-xs bg-white"></div>
                <div className="h-12 flex items-end justify-center pb-1 font-bold text-xs bg-white"></div>
                <div className="h-12 flex items-end justify-center pb-1 font-bold text-xs bg-white"></div>
              </div>
              <div className="grid grid-cols-4 divide-x divide-[#333] bg-[#F0F3F6] border-t border-[#333] text-center py-1.5 font-bold text-[10.5px]">
                <div>HOD</div>
                <div>CHIEF TIME TABLE COORDINATOR</div>
                <div>DEAN (ACADEMIC AFFAIRS)</div>
                <div>PRINCIPAL</div>
              </div>
            </div>

            {/* Notice Footer & Copy To */}
            <div className="flex flex-wrap items-center justify-between text-[10.5px] text-[#555] pt-2 border-t border-[#e1e4e8]">
              <div className="space-x-2">
                <strong>Copy to:</strong>
                <span>1. PA to Principal</span>
                <span>2. Dean of Academics</span>
                <span>3. Controller of Examinations</span>
                <span>4. Notice Boards</span>
              </div>
              <div className="italic font-medium">
                Version #: V{timetable.revision + 1} · {department.code}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-t border-[#e1e4e8] gap-3">
          <div className="text-xs text-[#5b616b]">
            All exports are generated client-side directly from authoritative validation engine.
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold text-[#121417] bg-[#F0F2EB] hover:bg-[#e1e4e8] rounded-md transition-all duration-150 flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Timetable</span>
            </button>
            {sections.length > 1 && (
              <button
                type="button"
                onClick={handleDownloadBooklet}
                className="px-4 py-2 text-xs font-semibold text-[#3b6fe0] bg-[#EBF1FF] hover:bg-[#D9E5FF] rounded-md transition-all duration-150 flex items-center gap-1.5 shadow-xs"
                title="Generate combined PDF booklet for all sections in this department"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Department Booklet ({sections.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadWord}
              className="px-4 py-2 text-xs font-semibold text-[#121417] bg-[#F0F2EB] hover:bg-[#e1e4e8] rounded-md transition-all duration-150 flex items-center gap-1.5 shadow-xs"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Word (.doc)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="px-4 py-2 text-xs font-semibold text-[#121417] bg-[#F0F2EB] hover:bg-[#e1e4e8] rounded-md transition-all duration-150 flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#121417] hover:bg-[#3b6fe0] rounded-md transition-all duration-150 flex items-center gap-1.5 shadow-md hover:shadow-lg"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Official PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
