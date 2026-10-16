import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export type ImportType = 'FACULTY' | 'SUBJECTS';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ImportType;
  departmentId: string;
  onImport: (items: any[]) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  type,
  onImport,
}) => {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    let sampleData: any[][] = [];
    let filename = '';

    if (type === 'FACULTY') {
      filename = 'faculty-import-template.xlsx';
      headers = ['Faculty Code', 'Full Name', 'Max Periods Per Day', 'Max Periods Per Week'];
      sampleData = [
        ['VTR', 'Ms. Varsha Thakur', 3, 14],
        ['PVM', 'Mr. P. Vikram', 4, 16],
        ['MCA', 'Mr. Manish Chhabra', 3, 12],
        ['GAA', 'Ms. G. Anusha', 4, 15],
      ];
    } else {
      filename = 'subjects-import-template.xlsx';
      headers = ['Short Code', 'Subject Title', 'Course Code', 'Type (THEORY/LAB)', 'Weekly Periods'];
      sampleData = [
        ['CNS', 'Computer Networks', 'A8519', 'THEORY', 4],
        ['SEG', 'Software Engineering', 'A8520', 'THEORY', 4],
        ['WTL', 'Web Technologies Laboratory', 'A8605', 'LAB', 2],
        ['MLL', 'Machine Learning Laboratory', 'A8704', 'LAB', 2],
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    ws['!cols'] = headers.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, filename);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) {
          setErrors(['The uploaded spreadsheet is empty or has no data rows.']);
          setParsedData([]);
          return;
        }

        const headerRow = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
        const dataRows = rows.slice(1).filter((r) => r.length > 0 && r.some((c) => c !== undefined && c !== ''));

        const validationErrors: string[] = [];
        const validatedItems: any[] = [];

        if (type === 'FACULTY') {
          const codeIdx = headerRow.findIndex((h) => h.includes('code') || h.includes('id'));
          const nameIdx = headerRow.findIndex((h) => h.includes('name'));
          const dayIdx = headerRow.findIndex((h) => h.includes('day'));
          const weekIdx = headerRow.findIndex((h) => h.includes('week'));

          if (codeIdx === -1 || nameIdx === -1) {
            setErrors(['Columns "Faculty Code" and "Full Name" are required in the header row.']);
            return;
          }

          dataRows.forEach((row, i) => {
            const rawCode = String(row[codeIdx] ?? '').trim().toUpperCase();
            const rawName = String(row[nameIdx] ?? '').trim();
            const rawDay = dayIdx !== -1 && row[dayIdx] !== undefined ? Number(row[dayIdx]) : null;
            const rawWeek = weekIdx !== -1 && row[weekIdx] !== undefined ? Number(row[weekIdx]) : null;

            if (!rawCode || !rawName) {
              validationErrors.push(`Row ${i + 2}: Both Faculty Code and Name must be non-empty.`);
            } else {
              validatedItems.push({
                facultyCode: rawCode,
                name: rawName,
                maxPeriodsPerDay: Number.isFinite(rawDay) && rawDay! > 0 ? rawDay : null,
                maxPeriodsPerWeek: Number.isFinite(rawWeek) && rawWeek! > 0 ? rawWeek : null,
              });
            }
          });
        } else {
          // SUBJECTS
          const codeIdx = headerRow.findIndex((h) => h.includes('code') || h.includes('short'));
          const nameIdx = headerRow.findIndex((h) => h.includes('title') || h.includes('name'));
          const courseCodeIdx = headerRow.findIndex((h) => h.includes('course'));
          const typeIdx = headerRow.findIndex((h) => h.includes('type'));
          const periodsIdx = headerRow.findIndex((h) => h.includes('period') || h.includes('session') || h.includes('hour'));

          if (codeIdx === -1 || nameIdx === -1) {
            setErrors(['Columns "Short Code" and "Subject Title" are required in the header row.']);
            return;
          }

          dataRows.forEach((row, i) => {
            const rawCode = String(row[codeIdx] ?? '').trim().toUpperCase();
            const rawName = String(row[nameIdx] ?? '').trim();
            const rawCourseCode = courseCodeIdx !== -1 && row[courseCodeIdx] ? String(row[courseCodeIdx]).trim() : '';
            const rawTypeStr = typeIdx !== -1 ? String(row[typeIdx] ?? '').toUpperCase().trim() : 'THEORY';
            const subjectType = rawTypeStr.includes('LAB') ? 'LAB' : 'THEORY';
            const rawPeriods = periodsIdx !== -1 && row[periodsIdx] !== undefined ? Number(row[periodsIdx]) : (subjectType === 'LAB' ? 2 : 4);

            if (!rawCode || !rawName) {
              validationErrors.push(`Row ${i + 2}: Short Code and Subject Title must be provided.`);
            } else {
              validatedItems.push({
                code: rawCode,
                name: rawName,
                courseCode: rawCourseCode || undefined,
                type: subjectType,
                sessionsPerWeek: Number.isFinite(rawPeriods) && rawPeriods > 0 ? rawPeriods : (subjectType === 'LAB' ? 2 : 4),
              });
            }
          });
        }

        setErrors(validationErrors);
        setParsedData(validatedItems);
      } catch (err: any) {
        setErrors([`Failed to parse spreadsheet file: ${err.message}`]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirm = () => {
    if (parsedData.length === 0) return;
    onImport(parsedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E8E0]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#F0F2EB] text-[#111315]">
              <FileSpreadsheet className="w-5 h-5 text-[#0047FF]" />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#111315]">
                Bulk Import {type === 'FACULTY' ? 'Faculty' : 'Subjects'}
              </h3>
              <p className="text-xs text-[#71767B]">
                Upload CSV or Excel spreadsheets (.xlsx, .xls, .csv)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71767B] hover:text-[#111315] hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Step 1: Download Template */}
          <div className="flex items-center justify-between p-3.5 bg-[#FAFBF9] border border-[#E5E8E0] rounded-xl">
            <div>
              <h4 className="text-xs font-bold text-[#111315]">Step 1: Download Standard Template</h4>
              <p className="text-xs text-[#71767B]">Get the pre-formatted Excel template with sample records.</p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#111315] bg-white border border-[#D0D5DD] hover:bg-black/5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#0047FF]" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Step 2: Upload File Dropzone */}
          <div>
            <h4 className="text-xs font-bold text-[#111315] mb-2">Step 2: Upload Completed File</h4>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#D0D5DD] hover:border-[#0047FF] bg-[#FAFBF9] hover:bg-blue-50/20 rounded-xl p-6 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 mx-auto text-[#71767B] mb-2" />
              <p className="text-xs font-semibold text-[#111315]">
                {fileName ? fileName : 'Click to select spreadsheet or drop file here'}
              </p>
              <p className="text-[11px] text-[#71767B] mt-0.5">Supports .xlsx, .xls, and .csv</p>
            </div>
          </div>

          {/* Validation Warnings / Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span>Validation Issues ({errors.length})</span>
              </div>
              <ul className="text-[11px] text-red-600 list-disc list-inside max-h-24 overflow-y-auto space-y-0.5">
                {errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111315] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ready to Import: {parsedData.length} records</span>
                </span>
              </div>

              <div className="border border-[#E5E8E0] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F0F2EB] sticky top-0 font-semibold text-[#4B5259]">
                    <tr>
                      {type === 'FACULTY' ? (
                        <>
                          <th className="p-2 border-b border-[#E5E8E0]">Code</th>
                          <th className="p-2 border-b border-[#E5E8E0]">Name</th>
                          <th className="p-2 border-b border-[#E5E8E0]">Max / Day</th>
                          <th className="p-2 border-b border-[#E5E8E0]">Max / Week</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2 border-b border-[#E5E8E0]">Code</th>
                          <th className="p-2 border-b border-[#E5E8E0]">Title</th>
                          <th className="p-2 border-b border-[#E5E8E0]">Course Code</th>
                          <th className="p-2 border-b border-[#E5E8E0]">Type</th>
                          <th className="p-2 border-b border-[#E5E8E0]">Periods/Wk</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E8E0]">
                    {parsedData.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className="hover:bg-black/5">
                        {type === 'FACULTY' ? (
                          <>
                            <td className="p-2 font-bold text-[#111315]">{row.facultyCode}</td>
                            <td className="p-2 text-[#333]">{row.name}</td>
                            <td className="p-2 text-[#666]">{row.maxPeriodsPerDay ?? '—'}</td>
                            <td className="p-2 text-[#666]">{row.maxPeriodsPerWeek ?? '—'}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 font-bold text-[#111315]">{row.code}</td>
                            <td className="p-2 text-[#333]">{row.name}</td>
                            <td className="p-2 text-[#666]">{row.courseCode ?? '—'}</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${row.type === 'LAB' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {row.type}
                              </span>
                            </td>
                            <td className="p-2 text-[#666]">{row.sessionsPerWeek}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 15 && (
                <p className="text-[11px] text-[#71767B] text-center">
                  Showing 15 of {parsedData.length} records...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#FAFBF9] border-t border-[#E5E8E0]">
          <span className="text-xs text-[#71767B]">
            Data is merged safely into current department workspace.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#4B5259] hover:text-[#111315] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedData.length === 0}
              onClick={handleConfirm}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#111315] hover:bg-[#0047FF] disabled:opacity-40 disabled:hover:bg-[#111315] rounded-xl transition-all shadow-xs"
            >
              Import {parsedData.length} Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
