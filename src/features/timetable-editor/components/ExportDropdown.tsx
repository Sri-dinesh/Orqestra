'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, FileSpreadsheet, Printer, Eye } from 'lucide-react';

interface ExportDropdownProps {
  onPreview?: () => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onPreview,
  onExportPdf,
  onExportExcel,
  onPrint,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] text-[#121417] dark:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326] transition-colors cursor-pointer shadow-xs"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Download className="w-3.5 h-3.5 text-[#5b616b] dark:text-[#8c9199]" />
        <span>Export</span>
        <ChevronDown className="w-3 h-3 text-[#5b616b] dark:text-[#8c9199]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 origin-top-right rounded-lg border border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] p-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5b616b] dark:text-[#8c9199]">
            Export Options
          </div>

          {onPreview && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onPreview();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md text-[#121417] dark:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326] text-left cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-[#3b6fe0] dark:text-[#7aa2f7]" />
              <div>
                <p className="font-medium">Preview &amp; Settings</p>
                <p className="text-[10px] text-[#5b616b] dark:text-[#8c9199]">Configure and inspect layout</p>
              </div>
            </button>
          )}

          {onExportPdf && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onExportPdf();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md text-[#121417] dark:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326] text-left cursor-pointer transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <div>
                <p className="font-medium">Download Official PDF</p>
                <p className="text-[10px] text-[#5b616b] dark:text-[#8c9199]">Print-ready vector format</p>
              </div>
            </button>
          )}

          {onExportExcel && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onExportExcel();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md text-[#121417] dark:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326] text-left cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-medium">Export to Excel</p>
                <p className="text-[10px] text-[#5b616b] dark:text-[#8c9199]">Spreadsheet (.xlsx) matrix</p>
              </div>
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onPrint();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md text-[#121417] dark:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326] text-left cursor-pointer transition-colors border-t border-[#e1e4e8] dark:border-[#2a2a2d] mt-1 pt-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-[#5b616b] dark:text-[#8c9199]" />
              <div>
                <p className="font-medium">Print Schedule</p>
                <p className="text-[10px] text-[#5b616b] dark:text-[#8c9199]">Send directly to printer</p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
