import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ExportError } from '@/domain/errors';
import { buildGridLayout, gridColumnLabel } from '@/domain/scheduler/grid-layout';
import type { Break, CollegeDetails, Department, Faculty, Subject, Timetable } from '@/domain/models';

export type ExportFormat = 'PDF' | 'XLSX' | 'WORD';

export interface ExportInput {
  timetable: Timetable;
  department: Department;
  sections: { id: string; name: string; roomNo?: string; classAdvisor?: string; year?: number; semester?: number }[];
  subjects: Subject[];
  faculty: Faculty[];
  breaks?: Break[];
  collegeDetails?: CollegeDetails;
  sectionId: string;
}

export interface GridCellVm {
  label: string | null; // null = empty slot
  detail: string | null;
  isContinuation: boolean;
  isBreak: boolean;
}

/**
 * Shared view-model builder used by PDF, Excel, and Word exporters.
 */
export function buildTimetableGrid(input: ExportInput): {
  dayLabels: string[];
  periodLabels: string[];
  grid: GridCellVm[][];
} {
  const { timetable, department, sectionId, subjects, faculty, breaks = [] } = input;
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const facultyById = new Map(faculty.map((f) => [f.id, f]));
  const entries = timetable.entries.filter((e) => e.sectionId === sectionId);

  const layout = buildGridLayout(department.periodsPerDay, breaks);
  const dayLabels = department.workingDays;
  const breakById = new Map(breaks.map((b) => [b.id, b]));
  const timeRange = (start?: string, end?: string) =>
    start || end ? [start, end].filter(Boolean).join(' – ') : null;
  const periodLabels = layout.columns.map((col, g) => {
    const base = gridColumnLabel(layout, g);
    if (col.kind === 'teaching') {
      const t = department.periodTimings?.[col.teachingIndex];
      const range = timeRange(t?.start, t?.end);
      return range ? `${base} · ${range}` : base;
    }
    const b = breakById.get(col.breakId);
    const range = timeRange(b?.startTime, b?.endTime);
    return range ? `${base} · ${range}` : base;
  });

  const grid: GridCellVm[][] = dayLabels.map((_, dayIndex) =>
    layout.columns.map((col, periodIndex): GridCellVm => {
      if (col.kind === 'break') {
        return { label: col.name, detail: null, isContinuation: false, isBreak: true };
      }
      const entry = entries.find(
        (e) =>
          e.dayIndex === dayIndex &&
          periodIndex >= e.startPeriod &&
          periodIndex < e.startPeriod + e.durationPeriods,
      );
      if (!entry) return { label: null, detail: null, isContinuation: false, isBreak: false };
      const subject = subjectById.get(entry.subjectId);
      const member = facultyById.get(entry.facultyId);
      const isContinuation = periodIndex !== entry.startPeriod;
      return {
        label: `${subject?.code ?? '?'}${subject?.type === 'LAB' ? ' (LAB)' : ''}`,
        detail: member?.name ?? null,
        isContinuation,
        isBreak: false,
      };
    }),
  );
  return { dayLabels, periodLabels, grid };
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'] as const;

function romanNumeral(n: number): string {
  return n >= 1 && n <= ROMAN.length ? ROMAN[n - 1] : String(n);
}

function formatDayMonthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Final Y of the last drawn autoTable. */
function tableEndY(doc: jsPDF, fallback: number): number {
  const tracked = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY;
  return typeof tracked === 'number' ? tracked : fallback;
}

interface OfficialCell {
  content: string;
  colSpan?: number;
  rowSpan?: number;
  vertical?: string;
  styles?: Record<string, unknown>;
}

/**
 * Official single-page class timetable PDF in notice-board format.
 */
export function buildOfficialTimetablePdf(input: ExportInput): jsPDF {
  const { timetable, department, sections, subjects, faculty, breaks = [] } = input;
  const college = input.collegeDetails;
  const section = sections.find((s) => s.id === input.sectionId);
  const sectionName = section?.name ?? 'Section';

  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const PAGE_W = 297;
    const MARGIN = 8;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const CX = PAGE_W / 2;
    let y = 6;

    const subjectById = new Map(subjects.map((s) => [s.id, s]));
    const facultyById = new Map(faculty.map((f) => [f.id, f]));
    const layout = buildGridLayout(department.periodsPerDay, breaks);
    const entries = timetable.entries.filter((e) => e.sectionId === input.sectionId);
    const entryAt = (day: number, slot: number) =>
      entries.find((e) => e.dayIndex === day && slot >= e.startPeriod && slot < e.startPeriod + e.durationPeriods);

    // ---- Crest & Institution Header ----
    const collegeName = college?.name?.trim() || department.name;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 19, 21);
    doc.text(collegeName.toUpperCase(), CX, y, { align: 'center' });
    y += 4;

    doc.setFontSize(9);
    doc.text(`DEPARTMENT OF ${department.name.toUpperCase()}`, CX, y, { align: 'center' });
    y += 3.8;

    const sectionYear = section?.year ?? 1;
    const yearSem = Math.max(1, (section?.semester ?? 1) - (sectionYear - 1) * 2);
    doc.text(
      `CLASS TIMETABLE — B. Tech ${romanNumeral(sectionYear)} Year ${romanNumeral(yearSem)} Semester (${sectionName})`,
      CX,
      y,
      { align: 'center' },
    );
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const academicYear = college?.academicYear?.trim() || '—';
    const roomNo = section?.roomNo ?? '—';
    const effectiveDate = department.effectiveFrom ?? formatDayMonthYear(timetable.createdAt || new Date().toISOString());
    doc.text(
      `Academic Year: ${academicYear}    |    Room No: ${roomNo}    |    With effect from: ${effectiveDate}`,
      CX,
      y,
      { align: 'center' },
    );
    y += 2.5;

    if (typeof doc.setDrawColor === 'function') doc.setDrawColor(160, 165, 170);
    if (typeof doc.setLineWidth === 'function') doc.setLineWidth(0.2);
    if (typeof doc.line === 'function') doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 2;

    // ---- Weekly Grid Table ----
    const gridWidth = layout.gridSlotsPerDay;
    const breakSlots = layout.columns.map((c, g) => (c.kind === 'break' ? g : -1)).filter((g) => g >= 0);
    const totalRows = 2 + department.workingDays.length;
    const timeRow: OfficialCell[] = [{ content: 'DAY / TIME', styles: { fontStyle: 'bold', fillColor: [240, 242, 245] } }];
    const numberRow: OfficialCell[] = [{ content: 'PERIOD', styles: { fontStyle: 'bold', fillColor: [240, 242, 245] } }];

    layout.columns.forEach((col, g) => {
      if (col.kind === 'break') {
        const b = breaks.find((x) => x.id === col.breakId);
        const timeStr = [b?.startTime, b?.endTime].filter(Boolean).join(' - ');
        timeRow.push({
          content: timeStr ? `${col.name}\n${timeStr}` : col.name,
          rowSpan: totalRows,
          vertical: col.name,
          styles: { fontStyle: 'bold', fillColor: [253, 248, 237], textColor: [146, 105, 14], halign: 'center', valign: 'middle' },
        });
        return;
      }
      const t = department.periodTimings?.[col.teachingIndex];
      timeRow.push({
        content: t?.start || t?.end ? `${t?.start ?? ''}\n${t?.end ?? ''}` : gridColumnLabel(layout, g),
        styles: { fillColor: [245, 247, 250], fontStyle: 'bold' },
      });
      numberRow.push({
        content: String(col.teachingIndex + 1),
        styles: { fillColor: [245, 247, 250], fontStyle: 'bold' },
      });
    });

    const body: OfficialCell[][] = [timeRow, numberRow];
    department.workingDays.forEach((day, dayIndex) => {
      const row: OfficialCell[] = [{ content: day.slice(0, 3).toUpperCase(), styles: { fontStyle: 'bold', fillColor: [245, 247, 250] } }];
      for (let g = 0; g < gridWidth; g++) {
        if (breakSlots.includes(g)) continue;
        const entry = entryAt(dayIndex, g);
        if (!entry) {
          row.push({ content: '—', styles: { textColor: [160, 165, 170] } });
          continue;
        }
        if (g !== entry.startPeriod) continue;
        const subject = subjectById.get(entry.subjectId);
        const member = facultyById.get(entry.facultyId);
        const cell: OfficialCell = {
          content: `${subject?.code ?? '?'}\n(${member?.facultyCode ?? member?.name?.split(' ')[0] ?? '?'})`,
          styles: {
            fontStyle: 'bold',
            fillColor: subject?.type === 'LAB' ? [235, 230, 252] : [240, 245, 255],
          },
        };
        if (entry.durationPeriods > 1) cell.colSpan = entry.durationPeriods;
        row.push(cell);
      }
      body.push(row);
    });

    // Precise, uniform equal column widths for all teaching periods
    const dayColWidth = 16;
    const breakColWidth = 12;
    const numBreaks = breakSlots.length;
    const numTeaching = layout.columns.filter((c) => c.kind === 'teaching').length;
    const teachingColWidth = (CONTENT_W - dayColWidth - (numBreaks * breakColWidth)) / Math.max(1, numTeaching);

    const columnStyles: Record<number, { cellWidth: number }> = { 0: { cellWidth: dayColWidth } };
    layout.columns.forEach((col, g) => {
      columnStyles[g + 1] = { cellWidth: col.kind === 'break' ? breakColWidth : teachingColWidth };
    });

    autoTable(doc, {
      startY: y,
      body: body as never,
      styles: {
        fontSize: 7,
        cellPadding: 1,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.15,
        lineColor: [70, 75, 80],
        textColor: [17, 19, 21],
        overflow: 'linebreak',
      },
      columnStyles,
      margin: { left: MARGIN, right: MARGIN },
    });
    y = tableEndY(doc, y + 40) + 2.5;

    // ---- Class Advisor & Mentors Bar ----
    const advisorText = `Class Advisor : ${section?.classAdvisor ?? '—'}`;
    const mentorsText = department.mentors?.trim() || '';
    const advisorContent = mentorsText ? `${advisorText}        |        Mentors : ${mentorsText}` : advisorText;

    autoTable(doc, {
      startY: y,
      body: [[{
        content: advisorContent,
        styles: { fontStyle: 'bold', fontSize: 7.5, fillColor: [248, 249, 250], textColor: [20, 20, 20], halign: 'left' },
      }]],
      styles: { cellPadding: 1.2, lineWidth: 0.15, lineColor: [70, 75, 80] },
      margin: { left: MARGIN, right: MARGIN },
    });
    y = tableEndY(doc, y + 6) + 2.5;

    // ---- Course Details & Instructor Details (Side by Side) ----
    const sectionSubjects = subjects.filter((s) => s.eligibleSectionIds.includes(input.sectionId));
    const courseBody: OfficialCell[][] = sectionSubjects.map((s) => [
      { content: s.code, styles: { fontStyle: 'bold' } },
      { content: s.courseCode ?? '—' },
      { content: s.name, styles: { halign: 'left' } },
    ]);

    const courseWidth = 152;
    autoTable(doc, {
      startY: y,
      head: [
        [{ content: 'Course Details', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fillColor: [235, 238, 242], textColor: [15, 20, 25] } }],
        ['Short Name', 'Course Code', 'Title of the Course'],
      ],
      body: courseBody as never,
      styles: {
        fontSize: 6.5,
        cellPadding: 0.9,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.15,
        lineColor: [70, 75, 80],
        textColor: [17, 19, 21],
      },
      headStyles: { fontStyle: 'bold', fillColor: [242, 244, 247], textColor: [17, 19, 21], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 28 },
        2: { cellWidth: courseWidth - 48 },
      },
      margin: { left: MARGIN },
      tableWidth: courseWidth,
    });
    const courseEndY = tableEndY(doc, y + 30);

    const instructorBody: OfficialCell[][] = sectionSubjects.map((s) => {
      const instructors = s.eligibleFacultyIds
        .map((id) => facultyById.get(id)?.name ?? id)
        .filter(Boolean);
      return [
        { content: s.code, styles: { fontStyle: 'bold' } },
        { content: instructors.length > 0 ? instructors.join(' / ') : '—', styles: { halign: 'left' } },
      ];
    });

    const instructorWidth = CONTENT_W - courseWidth - 3;
    autoTable(doc, {
      startY: y,
      head: [
        [{ content: 'Course Instructor Details', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [235, 238, 242], textColor: [15, 20, 25] } }],
        ['Short Name', 'Name of the Course Instructor'],
      ],
      body: instructorBody as never,
      styles: {
        fontSize: 6.5,
        cellPadding: 0.9,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.15,
        lineColor: [70, 75, 80],
        textColor: [17, 19, 21],
      },
      headStyles: { fontStyle: 'bold', fillColor: [242, 244, 247], textColor: [17, 19, 21], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: instructorWidth - 22 },
      },
      margin: { left: MARGIN + courseWidth + 3 },
      tableWidth: instructorWidth,
    });
    const instructorEndY = tableEndY(doc, y + 30);
    y = Math.max(courseEndY, instructorEndY) + 2.5;

    // ---- Signatories ----
    const sigColWidth = CONTENT_W / 4;
    autoTable(doc, {
      startY: y,
      body: [
        [
          { content: '\n\n', styles: { minCellHeight: 8 } },
          { content: '\n\n', styles: { minCellHeight: 8 } },
          { content: '\n\n', styles: { minCellHeight: 8 } },
          { content: '\n\n', styles: { minCellHeight: 8 } },
        ],
        ['HOD', 'CHIEF TIME TABLE COORDINATOR', 'DEAN (ACADEMIC AFFAIRS)', 'PRINCIPAL'],
      ],
      styles: {
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 1,
        lineWidth: 0.15,
        lineColor: [70, 75, 80],
        textColor: [17, 19, 21],
      },
      columnStyles: {
        0: { cellWidth: sigColWidth },
        1: { cellWidth: sigColWidth },
        2: { cellWidth: sigColWidth },
        3: { cellWidth: sigColWidth },
      },
      margin: { left: MARGIN, right: MARGIN },
    });
    y = tableEndY(doc, y + 12) + 2.5;

    // ---- Footer: Copy to (Left) & Version (Right) ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(60, 65, 70);
    doc.text('Copy to:', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text('1. PA to Principal   2. Office of the Dean of Academics   3. Office of the Controller of Examinations   4. Display in Notice Boards', MARGIN + 12, y);

    const stamp = formatDayMonthYear(timetable.updatedAt || new Date().toISOString());
    doc.setFont('helvetica', 'bolditalic');
    doc.text(
      `Version #: V${timetable.revision + 1} dated ${stamp}${department.effectiveFrom ? ` w.e.f ${department.effectiveFrom}` : ''}`,
      PAGE_W - MARGIN,
      y,
      { align: 'right' },
    );

    return doc;
  } catch (error) {
    throw new ExportError('Failed to generate PDF export.', { cause: String(error) });
  }
}

/**
 * Build Faculty Timetable PDF document.
 */
export function buildFacultyTimetablePdf(
  input: Omit<ExportInput, 'sectionId'> & { facultyId: string },
): jsPDF {
  const { timetable, department, sections, subjects, faculty, breaks = [] } = input;
  const college = input.collegeDetails;
  const member = faculty.find((f) => f.id === input.facultyId);
  const facultyName = member?.name ?? 'Faculty Member';

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PAGE_W = 297;
  const MARGIN = 10;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const CX = PAGE_W / 2;
  let y = 10;

  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const sectionById = new Map(sections.map((s) => [s.id, s]));
  const layout = buildGridLayout(department.periodsPerDay, breaks);
  const entries = timetable.entries.filter((e) => e.facultyId === input.facultyId);
  const entryAt = (day: number, slot: number) =>
    entries.find((e) => e.dayIndex === day && slot >= e.startPeriod && slot < e.startPeriod + e.durationPeriods);

  // Header
  const collegeName = college?.name?.trim() || department.name;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 19, 21);
  doc.text(collegeName.toUpperCase(), CX, y, { align: 'center' });
  y += 5.5;

  doc.setFontSize(10.5);
  doc.text(`DEPARTMENT OF ${department.name.toUpperCase()}`, CX, y, { align: 'center' });
  y += 5;

  doc.text(`INDIVIDUAL FACULTY TIMETABLE — ${facultyName.toUpperCase()} (${member?.facultyCode ?? ''})`, CX, y, { align: 'center' });
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const academicYear = college?.academicYear?.trim() || '—';
  const totalLoad = entries.reduce((sum, e) => sum + e.durationPeriods, 0);
  doc.text(`Academic Year: ${academicYear}    |    Faculty Code: ${member?.facultyCode ?? '—'}    |    Weekly Workload: ${totalLoad} Periods`, CX, y, { align: 'center' });
  y += 4;

  doc.setDrawColor(160, 165, 170);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 3;

  // Grid
  const gridWidth = layout.gridSlotsPerDay;
  const breakSlots = layout.columns.map((c, g) => (c.kind === 'break' ? g : -1)).filter((g) => g >= 0);
  const totalRows = 2 + department.workingDays.length;
  const timeRow: OfficialCell[] = [{ content: 'DAY / TIME', styles: { fontStyle: 'bold', fillColor: [240, 242, 245] } }];
  const numberRow: OfficialCell[] = [{ content: 'PERIOD', styles: { fontStyle: 'bold', fillColor: [240, 242, 245] } }];

  layout.columns.forEach((col, g) => {
    if (col.kind === 'break') {
      const b = breaks.find((x) => x.id === col.breakId);
      const timeStr = [b?.startTime, b?.endTime].filter(Boolean).join(' - ');
      timeRow.push({
        content: timeStr ? `${col.name}\n${timeStr}` : col.name,
        rowSpan: totalRows,
        styles: { fontStyle: 'bold', fillColor: [253, 248, 237], textColor: [146, 105, 14], halign: 'center', valign: 'middle' },
      });
      return;
    }
    const t = department.periodTimings?.[col.teachingIndex];
    timeRow.push({
      content: t?.start || t?.end ? `${t?.start ?? ''}\n${t?.end ?? ''}` : gridColumnLabel(layout, g),
      styles: { fillColor: [245, 247, 250], fontStyle: 'bold' },
    });
    numberRow.push({
      content: String(col.teachingIndex + 1),
      styles: { fillColor: [245, 247, 250], fontStyle: 'bold' },
    });
  });

  const body: OfficialCell[][] = [timeRow, numberRow];
  department.workingDays.forEach((day, dayIndex) => {
    const row: OfficialCell[] = [{ content: day.slice(0, 3).toUpperCase(), styles: { fontStyle: 'bold', fillColor: [245, 247, 250] } }];
    for (let g = 0; g < gridWidth; g++) {
      if (breakSlots.includes(g)) continue;
      const entry = entryAt(dayIndex, g);
      if (!entry) {
        row.push({ content: '—', styles: { textColor: [160, 165, 170] } });
        continue;
      }
      if (g !== entry.startPeriod) continue;
      const subject = subjectById.get(entry.subjectId);
      const sec = sectionById.get(entry.sectionId);
      const cell: OfficialCell = {
        content: `${subject?.code ?? '?'}\n(${sec?.name ?? 'Sec'})`,
        styles: {
          fontStyle: 'bold',
          fillColor: subject?.type === 'LAB' ? [235, 230, 252] : [240, 245, 255],
        },
      };
      if (entry.durationPeriods > 1) cell.colSpan = entry.durationPeriods;
      row.push(cell);
    }
    body.push(row);
  });

  const dayColWidth = 18;
  const breakColWidth = 13;
  const numBreaks = breakSlots.length;
  const numTeaching = layout.columns.filter((c) => c.kind === 'teaching').length;
  const teachingColWidth = (CONTENT_W - dayColWidth - (numBreaks * breakColWidth)) / Math.max(1, numTeaching);

  const columnStyles: Record<number, { cellWidth: number }> = { 0: { cellWidth: dayColWidth } };
  layout.columns.forEach((col, g) => {
    columnStyles[g + 1] = { cellWidth: col.kind === 'break' ? breakColWidth : teachingColWidth };
  });

  autoTable(doc, {
    startY: y,
    body: body as never,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.15,
      lineColor: [70, 75, 80],
      textColor: [17, 19, 21],
    },
    columnStyles,
    margin: { left: MARGIN, right: MARGIN },
  });
  y = tableEndY(doc, y + 60) + 6;

  // Workload Summary Table
  const facultySubjects = Array.from(new Set(entries.map((e) => e.subjectId)))
    .map((id) => subjectById.get(id))
    .filter(Boolean) as Subject[];

  const summaryBody = facultySubjects.map((s) => {
    const sEntries = entries.filter((e) => e.subjectId === s.id);
    const secs = Array.from(new Set(sEntries.map((e) => sectionById.get(e.sectionId)?.name ?? ''))).join(', ');
    const hours = sEntries.reduce((acc, e) => acc + e.durationPeriods, 0);
    return [s.code, s.name, s.type, secs, String(hours)];
  });

  autoTable(doc, {
    startY: y,
    head: [['Subject Code', 'Subject Name', 'Type', 'Assigned Sections', 'Weekly Periods']],
    body: summaryBody as never,
    styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center', valign: 'middle', lineWidth: 0.15, lineColor: [70, 75, 80] },
    headStyles: { fontStyle: 'bold', fillColor: [240, 242, 245], textColor: [17, 19, 21] },
    columnStyles: { 0: { cellWidth: 26 }, 1: { cellWidth: 90, halign: 'left' }, 2: { cellWidth: 24 }, 3: { cellWidth: 70 }, 4: { cellWidth: 35 } },
    margin: { left: MARGIN, right: MARGIN },
  });

  return doc;
}

/**
 * Build Master Timetable PDF document.
 */
export function buildMasterTimetablePdf(input: Omit<ExportInput, 'sectionId'>): jsPDF {
  const { timetable, department, sections, subjects, faculty, breaks = [] } = input;
  const college = input.collegeDetails;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PAGE_W = 297;
  const MARGIN = 8;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const CX = PAGE_W / 2;
  let y = 8;

  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const facultyById = new Map(faculty.map((f) => [f.id, f]));
  const layout = buildGridLayout(department.periodsPerDay, breaks);

  const collegeName = college?.name?.trim() || department.name;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 19, 21);
  doc.text(collegeName.toUpperCase(), CX, y, { align: 'center' });
  y += 5;

  doc.setFontSize(10);
  doc.text(`DEPARTMENT OF ${department.name.toUpperCase()} — MASTER TIMETABLE`, CX, y, { align: 'center' });
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Total Sections: ${sections.length}    |    Working Days: ${department.workingDays.length}    |    Periods/Day: ${department.periodsPerDay}`, CX, y, { align: 'center' });
  y += 3;

  // Render each day's master grid
  const teachingCols = layout.columns.filter((c) => c.kind === 'teaching');
  const head = [['Section', ...teachingCols.map((c) => `P${c.teachingIndex + 1}`)]];

  department.workingDays.forEach((day, dayIndex) => {
    if (y > 175) {
      doc.addPage('a4', 'landscape');
      y = 10;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 35, 40);
    doc.text(`${day.toUpperCase()} SCHEDULE`, MARGIN, y);
    y += 2.5;

    const body: string[][] = sections.map((sec) => {
      const secRow: string[] = [sec.name];
      teachingCols.forEach((col) => {
        const entry = timetable.entries.find(
          (e) =>
            e.sectionId === sec.id &&
            e.dayIndex === dayIndex &&
            col.teachingIndex >= e.startPeriod &&
            col.teachingIndex < e.startPeriod + e.durationPeriods,
        );
        if (!entry) {
          secRow.push('—');
        } else {
          const s = subjectById.get(entry.subjectId);
          const f = facultyById.get(entry.facultyId);
          secRow.push(`${s?.code ?? '?'}\n(${f?.facultyCode ?? f?.name?.split(' ')[0] ?? '?'})`);
        }
      });
      return secRow;
    });

    const secColWidth = 24;
    const colW = (CONTENT_W - secColWidth) / Math.max(1, teachingCols.length);
    const colStyles: Record<number, { cellWidth: number }> = { 0: { cellWidth: secColWidth } };
    teachingCols.forEach((_, i) => {
      colStyles[i + 1] = { cellWidth: colW };
    });

    autoTable(doc, {
      startY: y,
      head,
      body,
      styles: { fontSize: 6.5, cellPadding: 1, halign: 'center', valign: 'middle', lineWidth: 0.15, lineColor: [70, 75, 80] },
      headStyles: { fontStyle: 'bold', fillColor: [240, 242, 245], textColor: [17, 19, 21] },
      columnStyles: colStyles,
      margin: { left: MARGIN, right: MARGIN },
    });
    y = tableEndY(doc, y + 30) + 4;
  });

  return doc;
}

/**
 * Build Word-compatible document (.doc HTML with Word XML styles).
 */
export function buildTimetableWordHtml(input: ExportInput): string {
  const { timetable, department, sections, subjects, faculty } = input;
  const college = input.collegeDetails;
  const section = sections.find((s) => s.id === input.sectionId);
  const sectionName = section?.name ?? 'Section';
  const { dayLabels, periodLabels, grid } = buildTimetableGrid(input);

  const collegeName = college?.name?.trim() || department.name;
  const academicYear = college?.academicYear?.trim() || '—';
  const roomNo = section?.roomNo ?? '—';
  const effectiveDate = department.effectiveFrom ?? formatDayMonthYear(timetable.createdAt || new Date().toISOString());

  const sectionSubjects = subjects.filter((s) => s.eligibleSectionIds.includes(input.sectionId));
  const facultyById = new Map(faculty.map((f) => [f.id, f]));

  return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>Timetable — ${sectionName}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 841.9pt 595.3pt;
      mso-page-orientation: landscape;
      margin: 20pt 20pt 20pt 20pt;
    }
    div.Section1 { page: Section1; font-family: 'Calibri', 'Arial', sans-serif; }
    h1 { font-size: 16pt; margin: 0; text-align: center; color: #111; }
    h2 { font-size: 13pt; margin: 3pt 0; text-align: center; color: #222; }
    h3 { font-size: 11pt; margin: 2pt 0; text-align: center; color: #333; }
    .meta { font-size: 9.5pt; text-align: center; margin-bottom: 8pt; color: #444; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 10pt; font-size: 9pt; }
    th, td { border: 1pt solid #444; padding: 4pt 3pt; text-align: center; vertical-align: middle; }
    th { background-color: #f0f2f5; font-weight: bold; }
    .break-cell { background-color: #fdf8ed; color: #92690e; font-weight: bold; }
    .lab-cell { background-color: #f3f0fc; font-weight: bold; }
    .theory-cell { background-color: #f0f5ff; font-weight: bold; }
    .sig-table td { height: 35pt; vertical-align: bottom; }
    .footer { font-size: 8pt; color: #555; }
  </style>
</head>
<body>
  <div class="Section1">
    <h1>${collegeName.toUpperCase()}</h1>
    <h2>DEPARTMENT OF ${department.name.toUpperCase()}</h2>
    <h3>CLASS TIMETABLE — ${sectionName}</h3>
    <div class="meta">
      <strong>Academic Year:</strong> ${academicYear} &nbsp;|&nbsp;
      <strong>Room No:</strong> ${roomNo} &nbsp;|&nbsp;
      <strong>With effect from:</strong> ${effectiveDate}
    </div>

    <!-- Weekly Grid -->
    <table>
      <thead>
        <tr>
          <th style="width: 60pt;">DAY</th>
          ${periodLabels.map((p) => `<th>${p}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${dayLabels
          .map(
            (day, d) => `<tr>
          <th>${day.slice(0, 3).toUpperCase()}</th>
          ${grid[d]
            .map((c) => {
              if (c.isBreak) return `<td class="break-cell">${c.label}</td>`;
              if (!c.label) return `<td>—</td>`;
              return `<td class="${c.label.includes('(LAB)') ? 'lab-cell' : 'theory-cell'}">${c.label}<br/><span style="font-size: 8pt; color: #555;">${c.detail ?? ''}</span></td>`;
            })
            .join('')}
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>

    <div style="font-weight: bold; font-size: 9pt; padding: 4pt; border: 1pt solid #444; margin-bottom: 8pt; background: #fafafa;">
      Class Advisor: ${section?.classAdvisor ?? '—'} &nbsp;&nbsp;|&nbsp;&nbsp; Mentors: ${department.mentors || '—'}
    </div>

    <!-- Course & Instructor Details -->
    <table style="width: 100%;">
      <thead>
        <tr>
          <th style="width: 80pt;">Short Name</th>
          <th style="width: 100pt;">Course Code</th>
          <th>Title of the Course</th>
          <th>Course Instructor</th>
        </tr>
      </thead>
      <tbody>
        ${sectionSubjects
          .map((s) => {
            const instructors = s.eligibleFacultyIds.map((id) => facultyById.get(id)?.name ?? id).filter(Boolean);
            return `<tr>
            <td style="font-weight: bold;">${s.code}</td>
            <td>${s.courseCode ?? '—'}</td>
            <td style="text-align: left;">${s.name}</td>
            <td style="text-align: left;">${instructors.join(' / ') || '—'}</td>
          </tr>`;
          })
          .join('')}
      </tbody>
    </table>

    <!-- Signatories -->
    <table class="sig-table">
      <tr>
        <td></td><td></td><td></td><td></td>
      </tr>
      <tr style="background: #f0f2f5; font-weight: bold;">
        <td>HOD</td>
        <td>CHIEF TIME TABLE COORDINATOR</td>
        <td>DEAN (ACADEMIC AFFAIRS)</td>
        <td>PRINCIPAL</td>
      </tr>
    </table>

    <div class="footer">
      <span>Copy to: 1. PA to Principal &nbsp; 2. Dean of Academics &nbsp; 3. Controller of Examinations &nbsp; 4. Notice Boards</span>
      <span style="float: right;">Version #: V${timetable.revision + 1} dated ${formatDayMonthYear(timetable.updatedAt || new Date().toISOString())}</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Export Timetable as Word (.doc).
 */
export function exportTimetableAsWord(input: ExportInput): void {
  try {
    const html = buildTimetableWordHtml(input);
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const section = input.sections.find((s) => s.id === input.sectionId);
    a.href = url;
    a.download = `timetable-${input.department.code}-${section?.name ?? 'Section'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new ExportError('Failed to generate Word export.', { cause: String(error) });
  }
}

/**
 * Export Timetable as PDF.
 */
export function exportTimetableAsPdf(input: ExportInput): void {
  try {
    const doc = buildOfficialTimetablePdf(input);
    const sectionName = input.sections.find((s) => s.id === input.sectionId)?.name ?? 'Section';
    doc.save(`timetable-${input.department.code}-${sectionName}.pdf`);
  } catch (error) {
    throw new ExportError('Failed to generate PDF export.', { cause: String(error) });
  }
}

/**
 * Build Excel Workbook.
 */
export function buildTimetableWorkbook(input: ExportInput): XLSX.WorkBook {
  try {
    const { timetable, department, sections, subjects, faculty } = input;
    const section = sections.find((s) => s.id === input.sectionId);
    const sectionName = section?.name ?? 'Section';
    const { dayLabels, periodLabels, grid } = buildTimetableGrid(input);

    const wb = XLSX.utils.book_new();

    // Sheet 1: Grid
    const aoa: (string | null)[][] = [
      [`${department.name} (${department.code}) — Timetable`],
      [`Section: ${sectionName}`, null, `Status: ${timetable.status}`, `Revision: ${timetable.revision}`],
      [],
      ['Day', ...periodLabels],
      ...dayLabels.map((day, d) => [
        day,
        ...grid[d].map((cell) =>
          cell.label === null ? null : cell.isContinuation ? `↳ ${cell.label}` : `${cell.label}${cell.detail ? ` — ${cell.detail}` : ''}`,
        ),
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 12 }, ...periodLabels.map(() => ({ wch: 18 }))];
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');

    // Sheet 2: Sessions
    const listAoA: (string | number)[][] = [
      ['Section', 'Subject Code', 'Subject Name', 'Type', 'Faculty', 'Day', 'Start Period', 'Duration (periods)', 'Source'],
    ];
    const subjectById = new Map(subjects.map((s) => [s.id, s]));
    const facultyById = new Map(faculty.map((f) => [f.id, f]));
    for (const e of timetable.entries.filter((x) => x.sectionId === input.sectionId)) {
      listAoA.push([
        sectionName,
        subjectById.get(e.subjectId)?.code ?? e.subjectId,
        subjectById.get(e.subjectId)?.name ?? '',
        subjectById.get(e.subjectId)?.type ?? '',
        facultyById.get(e.facultyId)?.name ?? e.facultyId,
        department.workingDays[e.dayIndex] ?? String(e.dayIndex),
        e.startPeriod + 1,
        e.durationPeriods,
        e.source,
      ]);
    }
    const listWs = XLSX.utils.aoa_to_sheet(listAoA);
    listWs['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 28 }, { wch: 8 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, listWs, 'Sessions');

    // Sheet 3: Metadata
    const meta = timetable.generationMetadata;
    const metaWs = XLSX.utils.aoa_to_sheet([
      ['Field', 'Value'],
      ['Department', `${department.name} (${department.code})`],
      ['Section', sectionName],
      ['Timetable ID', timetable.id],
      ['Status', timetable.status],
      ['Revision', timetable.revision],
      ['Schema snapshot fingerprint', timetable.configurationSnapshot.fingerprint],
      ['Generated at', meta?.generatedAt ?? '—'],
      ['Seed', meta?.seed ?? '—'],
      ['Engine version', meta?.engineVersion ?? '—'],
      ['Generation duration (ms)', meta?.metrics.durationMs ?? '—'],
      ['Explored nodes', meta?.metrics.exploredNodes ?? '—'],
      ['Backtracks', meta?.metrics.backtrackCount ?? '—'],
      ['Final score', meta?.metrics.finalScore ?? '—'],
      ['Exported at', new Date().toISOString()],
    ]);
    metaWs['!cols'] = [{ wch: 26 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');

    return wb;
  } catch (error) {
    throw new ExportError('Failed to generate Excel export.', { cause: String(error) });
  }
}

/**
 * Export Timetable as Excel.
 */
export function exportTimetableAsExcel(input: ExportInput): void {
  try {
    const wb = buildTimetableWorkbook(input);
    const section = input.sections.find((s) => s.id === input.sectionId);
    const sectionName = section?.name ?? 'Section';
    XLSX.writeFile(wb, `timetable-${input.department.code}-${sectionName}.xlsx`);
  } catch (error) {
    if (error instanceof ExportError) throw error;
    throw new ExportError('Failed to generate Excel export.', { cause: String(error) });
  }
}

/**
 * Unified export dispatcher.
 */
export function exportTimetable(format: ExportFormat, input: ExportInput): void {
  if (format === 'PDF') exportTimetableAsPdf(input);
  else if (format === 'XLSX') exportTimetableAsExcel(input);
  else if (format === 'WORD') exportTimetableAsWord(input);
}
