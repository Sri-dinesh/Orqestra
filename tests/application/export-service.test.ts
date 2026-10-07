import { describe, expect, it, vi } from 'vitest';
import {
  buildTimetableGrid,
  buildTimetableWorkbook,
  exportTimetableAsExcel,
  exportTimetableAsPdf,
} from '@/application/export-service';
import { generateTimetable } from '@/domain/scheduler/engine';
import { datasetMinimal } from '../fixtures/datasets';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

vi.mock('xlsx', async (importOriginal) => {
  const actual = await importOriginal<typeof import('xlsx')>();
  return { ...actual, writeFile: vi.fn() };
});

vi.mock('jspdf', () => {
  const mockDoc = {
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    getTextColor: vi.fn(() => '#000000'),
    text: vi.fn(),
    line: vi.fn(),
    save: vi.fn(),
    output: vi.fn(() => new ArrayBuffer(1024)),
    internal: { pageSize: { getWidth: () => 297, getHeight: () => 210 } },
  };
  const JsPDFMock = vi.fn(() => mockDoc);
  return { default: JsPDFMock };
});

vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));

function makeExportInput() {
  const ds = datasetMinimal();
  const result = generateTimetable({
    department: ds.department,
    sections: ds.sections,
    subjects: ds.subjects,
    faculty: ds.faculty,
    config: ds.config,
    seed: 123456,
    maxDurationMs: 10_000,
    maxExploredNodes: 2_000_000,
    cancellation: { isCancelled: () => false },
  });
  if (result.status !== 'COMPLETED' || !result.timetable) {
    throw new Error('fixture generation failed');
  }
  return {
    ds,
    input: {
      timetable: result.timetable,
      department: ds.department,
      sections: ds.sections,
      subjects: ds.subjects,
      faculty: ds.faculty,
      sectionId: ds.sections[0].id,
    },
  };
}

describe('export service', () => {
  it('builds a correct grid view model with atomic lab cells', () => {
    const { ds, input } = makeExportInput();
    const { dayLabels, periodLabels, grid } = buildTimetableGrid(input);

    expect(dayLabels).toEqual(ds.department.workingDays);
    expect(periodLabels.length).toBe(ds.department.periodsPerDay);
    expect(grid.length).toBe(ds.department.workingDays.length);
    expect(grid[0].length).toBe(ds.department.periodsPerDay);

    // The lab occupies two consecutive cells; the second is a continuation.
    const labSubject = ds.subjects.find((s) => s.type === 'LAB')!;
    let labStarts = 0;
    let labContinuations = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell.label?.startsWith(labSubject.code)) {
          if (cell.isContinuation) labContinuations++;
          else labStarts++;
        }
      }
    }
    expect(labStarts).toBe(1);
    expect(labContinuations).toBe(1);
  });

  it('produces an Excel workbook with three correct sheets', () => {
    const { input } = makeExportInput();
    const wb = buildTimetableWorkbook(input);
    expect(wb.SheetNames).toEqual(['Timetable', 'Sessions', 'Metadata']);

    const sessions = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Sessions']);
    expect(sessions.length).toBe(8); // 4 MATH + 3 PHY + 1 lab
    const lab = sessions.find((r) => r['Type'] === 'LAB');
    expect(lab).toBeDefined();
    expect(lab?.['Duration (periods)']).toBe(2);

    const meta = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Metadata']);
    expect(meta.some((r) => r['Field'] === 'Seed')).toBe(true);
  });

  it('writes the Excel file with the expected filename', () => {
    const { ds, input } = makeExportInput();
    exportTimetableAsExcel(input);
    expect(vi.mocked(XLSX.writeFile)).toHaveBeenCalled();
    const [, filename] = vi.mocked(XLSX.writeFile).mock.calls[0];
    expect(filename).toBe(`timetable-${ds.department.code}-${ds.sections[0].name}.xlsx`);
  });

  it('generates a PDF and saves it with the expected filename', () => {
    const { ds, input } = makeExportInput();
    exportTimetableAsPdf(input);
    const JsPDF = jsPDF as unknown as ReturnType<typeof vi.fn>;
    expect(JsPDF).toHaveBeenCalledWith({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const instance = JsPDF.mock.results[0].value as { save: ReturnType<typeof vi.fn> };
    expect(instance.save).toHaveBeenCalledWith(`timetable-${ds.department.code}-${ds.sections[0].name}.pdf`);
  });

  it('renders the official notice-board format with vertical break columns', () => {
    const { ds, input } = makeExportInput();
    const official = {
      ...input,
      breaks: [
        { id: 'brk1', name: 'Break', dayIndex: null, startPeriod: 2, durationPeriods: 1 },
        { id: 'brk2', name: 'Lunch', dayIndex: null, startPeriod: 4, durationPeriods: 1 },
      ],
      collegeDetails: {
        name: 'Vardhaman College of Engineering',
        code: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        website: '',
        contactEmail: '',
        contactPhone: '',
        academicYear: '2026 - 2027',
        logoDataUrl: '',
      },
      sections: [{ ...ds.sections[0], roomNo: '1020', classAdvisor: 'Mr. P. Vikram' }],
    };
    vi.mocked(autoTable).mockClear();
    exportTimetableAsPdf(official);
    const JsPDF = jsPDF as unknown as ReturnType<typeof vi.fn>;
    const instance = JsPDF.mock.results[0].value as { text: ReturnType<typeof vi.fn> };
    const texts = instance.text.mock.calls.map((c) => String(c[0]));
    expect(texts.some((t) => t.includes('CLASS TIMETABLE'))).toBe(true);
    expect(texts.some((t) => t.includes('Room No: 1020'))).toBe(true);
    expect(texts.some((t) => t.includes('VARDHAMAN COLLEGE OF ENGINEERING'))).toBe(true);
    // Grid table: time row carries vertical break markers spanning all rows.
    const calls = vi.mocked(autoTable).mock.calls.map((c) => c[1] as { body?: unknown[][] });
    const gridCall = calls.find((c) =>
      (c.body ?? []).some((row) =>
        (row as { vertical?: string }[]).some(
          (cell) => typeof cell === 'object' && cell !== null && 'vertical' in cell,
        ),
      ),
    );
    expect(gridCall).toBeDefined();
    const verticals = (gridCall!.body ?? []).flatMap((row) =>
      (row as { vertical?: string }[]).map((cell) =>
        typeof cell === 'object' && cell !== null ? cell.vertical : undefined,
      ),
    );
    expect(verticals).toContain('Break');
    expect(verticals).toContain('Lunch');
    // Advisor bar table mentions the class advisor.
    const advisorCall = calls.find((c) =>
      JSON.stringify(c.body ?? []).includes('Mr. P. Vikram'),
    );
    expect(advisorCall).toBeDefined();
  });
});
