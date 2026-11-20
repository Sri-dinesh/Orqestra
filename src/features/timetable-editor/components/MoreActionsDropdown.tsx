'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Copy, Trash2 } from 'lucide-react';

interface MoreActionsDropdownProps {
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export const MoreActionsDropdown: React.FC<MoreActionsDropdownProps> = ({
  onDuplicate,
  onDelete,
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

  if (!onDuplicate && !onDelete) return null;

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-1.5 rounded-md border border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] text-[#5b616b] dark:text-[#8c9199] hover:text-[#121417] dark:hover:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326] transition-colors cursor-pointer shadow-xs"
        title="More timetable actions"
        aria-label="More actions"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 origin-top-right rounded-lg border border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] p-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
          {onDuplicate && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onDuplicate();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md text-[#121417] dark:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326] text-left cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-[#5b616b] dark:text-[#8c9199]" />
              <span>Duplicate Timetable</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Delete Timetable</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
