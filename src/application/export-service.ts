import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ExportError } from '@/domain/errors';
import type { Department, Faculty, Subject, Timetable } from '@/domain/models';

export type ExportFormat = 'PDF' | 'XLSX';

export interface ExportInput {
  timetable: Timetable;
  department: Department;
  sections: { id: string; name: string }[];
  subjects: Subject[];
  faculty: Faculty[];
  sectionId: string;
}

export interface GridCellVm {
  label: string | null; // null = empty slot
  detail: string | null;
  isContinuation: boolean;
}

/**
 * Shared view-model builder used by both PDF and Excel exporters.
 * rows = working days, columns = periods, labs marked across both periods.
 */
export function buildTimetableGrid(input: ExportInput): {
  dayLabels: string[];
  periodLabels: string[];
  grid: GridCellVm[][];
} {
  const { timetable, department, sectionId, subjects, faculty } = input;
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const facultyById = new Map(faculty.map((f) => [f.id, f]));
  const entries = timetable.entries.filter((e) => e.sectionId === sectionId);

  const dayLabels = department.workingDays;
  const periodLabels = Array.from({ length: department.periodsPerDay }, (_, i) => `P${i + 1}`);

  const grid: GridCellVm[][] = dayLabels.map((_, dayIndex) =>
    Array.from({ length: department.periodsPerDay }, (_, periodIndex): GridCellVm => {
      const entry = entries.find(
        (e) =>
          e.dayIndex === dayIndex &&
          periodIndex >= e.startPeriod &&
          periodIndex < e.startPeriod + e.durationPeriods,
      );
      if (!entry) return { label: null, detail: null, isContinuation: false };
      const subject = subjectById.get(entry.subjectId);
      const member = facultyById.get(entry.facultyId);
      const isContinuation = periodIndex !== entry.startPeriod;
      return {
        label: `${subject?.code ?? '?'}${subject?.type === 'LAB' ? ' (LAB)' : ''}`,
        detail: member?.name ?? null,
        isContinuation,
      };
    }),
  );
  return { dayLabels, periodLabels, grid };
}

export function exportTimetableAsPdf(input: ExportInput): void {
  const { timetable, department, sections } = input;
  const section = sections.find((s) => s.id === input.sectionId);
  const { dayLabels, periodLabels, grid } = buildTimetableGrid(input);

  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const sectionName = section?.name ?? 'Section';

    doc.setFontSize(14);
    doc.text(`${department.name} (${department.code}) — Timetable`, 14, 14);
    doc.setFontSize(10);
    doc.text(
      `Section: ${sectionName} · ${department.workingDays.join(', ')} · ${department.periodsPerDay} periods/day`,
      14,
      20,
    );
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Generated: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · Status: ${timetable.status} · Revision: ${timetable.revision}`,
      14,
      25,
    );
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 30,
      head: [['Day', ...periodLabels]],
      body: dayLabels.map((day, d) => [
        day,
        ...grid[d].map((cell) => (cell.label === null ? '' : cell.isContinuation ? `↳ ${cell.label}` : cell.label)),
      ]),
      styles: { fontSize: 7, cellPadding: 1.5, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'bold', halign: 'left', fillColor: [241, 245, 249] } },
      alternateRowStyles: { fillColor: [252, 253, 255] },
    });

    doc.save(`timetable-${department.code}-${sectionName}.pdf`);
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
