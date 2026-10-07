import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ExportError } from '@/domain/errors';
import { buildGridLayout, gridColumnLabel } from '@/domain/scheduler/grid-layout';
import type { Break, CollegeDetails, Department, Faculty, Subject, Timetable } from '@/domain/models';

export type ExportFormat = 'PDF' | 'XLSX';

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
 * Shared view-model builder used by both PDF and Excel exporters.
 * rows = working days, columns = teaching periods + break columns
 * (e.g. lunch), labs marked across every period they span.
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

/** Final Y of the last drawn autoTable (defensive: mocks don't track it). */
function tableEndY(doc: jsPDF, fallback: number): number {
  const tracked = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY;
  return typeof tracked === 'number' ? tracked : fallback;
}

/** "CODE\n(faculty)" cell text for one timetable entry. */
function entryCellText(
  entry: { subjectId: string; facultyId: string },
  subjectById: Map<string, Subject>,
  facultyById: Map<string, Faculty>,
): string {
  const subject = subjectById.get(entry.subjectId);
  const member = facultyById.get(entry.facultyId);
  return `${subject?.code ?? '?'}\n(${member?.facultyCode ?? '?'})`;
}

interface OfficialCell {
  content: string;
  colSpan?: number;
  rowSpan?: number;
  /** Marker for vertical break columns, drawn rotated in didDrawCell. */
  vertical?: string;
}

/**
 * Official class-timetable PDF in the institution notice-board format:
 * crest + college header, room/effective-date bar, time grid with vertical
 * break columns, class-advisor bar, course/instructor details, mentors,
 * signatories and copy-to footer.
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

/** Build the official PDF document (testable without touching the filesystem). */
export function buildOfficialTimetablePdf(input: ExportInput): jsPDF {
  const { timetable, department, sections, subjects, faculty, breaks = [] } = input;
  const college = input.collegeDetails;
  const section = sections.find((s) => s.id === input.sectionId);
  const sectionName = section?.name ?? 'Section';

  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const PAGE_W = 297;
    const MARGIN = 10;
    const CX = PAGE_W / 2;
    let y = 10;

    const subjectById = new Map(subjects.map((s) => [s.id, s]));
    const facultyById = new Map(faculty.map((f) => [f.id, f]));
    const layout = buildGridLayout(department.periodsPerDay, breaks);
    const entries = timetable.entries.filter((e) => e.sectionId === input.sectionId);
    const entryAt = (day: number, slot: number) =>
      entries.find((e) => e.dayIndex === day && slot >= e.startPeriod && slot < e.startPeriod + e.durationPeriods);

    // ---- Crest + institution header ----
    const collegeName = college?.name?.trim() || department.name;
    const initials = collegeName
      .split(/\s+/)
      .filter((w) => /[A-Za-z]/.test(w[0] ?? ''))
      .slice(0, 3)
      .map((w) => w[0]!.toUpperCase())
      .join('');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const crestW = 9;
    const crestTop = y;
    // Shield outline: top edge, sides, bottom point.
    doc.line(CX - crestW, crestTop, CX + crestW, crestTop);
    doc.line(CX - crestW, crestTop, CX - crestW, crestTop + 7);
    doc.line(CX + crestW, crestTop, CX + crestW, crestTop + 7);
    doc.line(CX - crestW, crestTop + 7, CX, crestTop + 12);
    doc.line(CX + crestW, crestTop + 7, CX, crestTop + 12);
    doc.text(initials, CX, crestTop + 6, { align: 'center' });
    y = crestTop + 15;

    const centered = (text: string, size: number, style: 'bold' | 'normal' = 'bold') => {
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      doc.text(text, CX, y, { align: 'center' });
      y += size * 0.45;
    };
    centered(collegeName.toUpperCase(), collegeName.length > 32 ? 11 : 13);
    centered(`DEPARTMENT OF ${department.name.toUpperCase()}`, 10);
    centered('CLASS TIMETABLE', 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Academic Year: ${college?.academicYear?.trim() || '—'}`, CX, y, { align: 'center' });
    y += 4.5;
    const sectionYear = section?.year ?? 1;
    const yearSem = Math.max(1, (section?.semester ?? 1) - (sectionYear - 1) * 2);
    centered(`B. Tech ${romanNumeral(sectionYear)} Year ${romanNumeral(yearSem)} Semester ${sectionName}`, 10);
    y += 1;

    // ---- Room / effective-date bar ----
    doc.setFontSize(9);
    doc.text(`Room No: ${section?.roomNo ?? '—'}`, MARGIN, y);
    doc.text(
      `With effect from: ${department.effectiveFrom ?? formatDayMonthYear(timetable.createdAt || new Date().toISOString())}`,
      PAGE_W - MARGIN,
      y,
      { align: 'right' },
    );
    y += 4;

    // ---- Weekly grid (time row + number row + day rows, one body table) ----
    const gridWidth = layout.gridSlotsPerDay;
    const breakSlots = layout.columns.map((c, g) => (c.kind === 'break' ? g : -1)).filter((g) => g >= 0);
    const totalRows = 2 + department.workingDays.length;
    const timeRow: OfficialCell[] = [{ content: '' }];
    const numberRow: OfficialCell[] = [{ content: '' }];
    layout.columns.forEach((col, g) => {
      if (col.kind === 'break') {
        const b = breaks.find((x) => x.id === col.breakId);
        const label = b?.startTime || b?.endTime ? `${col.name}\n${[b?.startTime, b?.endTime].filter(Boolean).join(' – ')}` : col.name;
        timeRow.push({ content: '', rowSpan: totalRows, vertical: label });
        return;
      }
      const t = department.periodTimings?.[col.teachingIndex];
      timeRow.push({ content: t?.start || t?.end ? `${t?.start ?? ''}\nto\n${t?.end ?? ''}` : gridColumnLabel(layout, g) });
      numberRow.push({ content: String(col.teachingIndex + 1) });
    });
    const body: OfficialCell[][] = [timeRow, numberRow];
    department.workingDays.forEach((day, dayIndex) => {
      const row: OfficialCell[] = [{ content: day.slice(0, 3).toUpperCase() }];
      for (let g = 0; g < gridWidth; g++) {
        if (breakSlots.includes(g)) continue; // covered by the vertical rowspan
        const entry = entryAt(dayIndex, g);
        if (!entry) {
          row.push({ content: '' });
          continue;
        }
        if (g !== entry.startPeriod) continue; // continuation slot of a colSpan lab
        const cell: OfficialCell = { content: entryCellText(entry, subjectById, facultyById) };
        if (entry.durationPeriods > 1) cell.colSpan = entry.durationPeriods;
        row.push(cell);
      }
      body.push(row);
    });

    const dayColWidth = 16;
    const breakColWidth = 11;
    const columnStyles: Record<number, { cellWidth: number }> = { 0: { cellWidth: dayColWidth } };
    breakSlots.forEach((g) => {
      columnStyles[g + 1] = { cellWidth: breakColWidth };
    });
    autoTable(doc, {
      startY: y,
      body: body as never,
      styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center', valign: 'middle', lineWidth: 0.2, lineColor: [60, 60, 60] },
      columnStyles,
      didParseCell: (data) => {
        if (data.row.index < 2) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        } else if (data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawCell: (data) => {
        const raw = data.cell.raw as { vertical?: string } | undefined;
        if (raw && typeof raw.vertical === 'string') {
          const cx = data.cell.x + data.cell.width / 2;
          const cy = data.cell.y + data.cell.height / 2;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          const prev = doc.getTextColor();
          doc.setTextColor(0);
          doc.text(raw.vertical.split('\n')[0], cx, cy, { angle: 90, align: 'center' });
          doc.setTextColor(prev);
        }
      },
    });
    y = tableEndY(doc, y + 60) + 4;

    // ---- Class advisor bar ----
    autoTable(doc, {
      startY: y,
      body: [[{ content: `Class Advisor : ${section?.classAdvisor ?? ''}`, styles: { fontStyle: 'bold', fontSize: 9 } }]],
      styles: { cellPadding: 2, lineWidth: 0.2, lineColor: [60, 60, 60] },
    });
    y = tableEndY(doc, y + 10) + 4;

    // ---- Course details + instructor details (side by side) ----
    const sectionSubjects = subjects.filter((s) => s.eligibleSectionIds.includes(input.sectionId));
    const courseBody: OfficialCell[][] = sectionSubjects.map((s) => [
      { content: s.code },
      { content: s.courseCode ?? '—' },
      { content: s.name },
    ]);
    const mentorsText = department.mentors?.trim() || '';
    if (mentorsText) {
      courseBody.push([
        { content: 'Mentors', styles: { fontStyle: 'bold' } } as OfficialCell,
        { content: mentorsText, colSpan: 2 } as OfficialCell,
      ]);
    }
    const courseWidth = 158;
    autoTable(doc, {
      startY: y,
      head: [
        [{ content: 'Course Details', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } }],
        ['Short Name', 'Course Code', 'Title of the Course'],
      ],
      body: courseBody as never,
      styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center', valign: 'middle', lineWidth: 0.2, lineColor: [60, 60, 60] },
      headStyles: { fontStyle: 'bold' },
      margin: { left: MARGIN },
      tableWidth: courseWidth,
    });
    const courseEndY = tableEndY(doc, y + 40);

    const instructorBody: OfficialCell[][] = [];
    for (const s of sectionSubjects) {
      const instructors = s.eligibleFacultyIds
        .map((id) => facultyById.get(id)?.name ?? id)
        .filter(Boolean);
      if (instructors.length === 0) {
        instructorBody.push([{ content: s.code }, { content: '—' }]);
      } else {
        instructors.forEach((name, i) => {
          instructorBody.push(
            i === 0
              ? [{ content: s.code, rowSpan: instructors.length }, { content: name }]
              : [{ content: name }],
          );
        });
      }
    }
    autoTable(doc, {
      startY: y,
      head: [
        [{ content: 'Course Instructor Details', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } }],
        ['Short Name', 'Name of the Course Instructor'],
      ],
      body: instructorBody as never,
      styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center', valign: 'middle', lineWidth: 0.2, lineColor: [60, 60, 60] },
      headStyles: { fontStyle: 'bold' },
      margin: { left: MARGIN + courseWidth + 4 },
      tableWidth: PAGE_W - MARGIN * 2 - courseWidth - 4,
    });
    y = Math.max(courseEndY, tableEndY(doc, y + 40)) + 4;

    // ---- Signatories ----
    autoTable(doc, {
      startY: y,
      body: [
        [
          { content: ' ', styles: { minCellHeight: 12 } },
          { content: ' ', styles: { minCellHeight: 12 } },
          { content: ' ', styles: { minCellHeight: 12 } },
          { content: ' ', styles: { minCellHeight: 12 } },
        ],
        ['HOD', 'CHIEF TIME TABLE COORDINATOR', 'DEAN (ACADEMIC AFFAIRS)', 'PRINCIPAL'],
      ],
      styles: { fontSize: 8, fontStyle: 'bold', halign: 'center', valign: 'middle', cellPadding: 2, lineWidth: 0.2, lineColor: [60, 60, 60] },
    });
    y = tableEndY(doc, y + 24) + 4;

    // ---- Copy-to + version footer ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Copy to:', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    [
      '1.    PA to Principal',
      '2.    Office of the Dean of Academics',
      '3.    Office of the Controller of Examinations',
      '4.    Display in Notice Boards',
    ].forEach((line, i) => doc.text(line, MARGIN, y + 4 + i * 3.5));
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(8);
    const stamp = formatDayMonthYear(timetable.updatedAt || new Date().toISOString());
    doc.text(
      `Version #: V${timetable.revision + 1} dated ${stamp}${department.effectiveFrom ? ` w.e.f ${department.effectiveFrom}` : ''}`,
      PAGE_W - MARGIN,
      y + 4 + 3 * 3.5,
      { align: 'right' },
    );

    return doc;
  } catch (error) {
    throw new ExportError('Failed to generate PDF export.', { cause: String(error) });
  }
}

/** Build the workbook (testable without touching the filesystem). */
export function buildTimetableWorkbook(input: ExportInput): XLSX.WorkBook {
  try {
    const { timetable, department, sections, subjects, faculty } = input;
    const section = sections.find((s) => s.id === input.sectionId);
    const sectionName = section?.name ?? 'Section';
    const { dayLabels, periodLabels, grid } = buildTimetableGrid(input);

    const wb = XLSX.utils.book_new();

    // Sheet 1: grid
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

    // Sheet 2: entry list
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

    // Sheet 3: metadata
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

/** Single entry point used by the UI. */
export function exportTimetable(format: ExportFormat, input: ExportInput): void {
  if (format === 'PDF') exportTimetableAsPdf(input);
  else exportTimetableAsExcel(input);
}
