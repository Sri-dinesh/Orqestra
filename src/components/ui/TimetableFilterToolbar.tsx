'use client';

import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { Faculty, Subject } from '@/domain/models';

export type SlotTypeFilter = 'ALL' | 'THEORY' | 'LAB';

export interface TimetableFilterState {
  searchQuery: string;
  typeFilter: SlotTypeFilter;
  selectedSubjectId: string | null;
  selectedFacultyId: string | null;
}

export interface MatchStats {
  matchingSlots: number;
  matchingHours: number;
  theorySlots: number;
  labSlots: number;
  isFilterActive: boolean;
}

export interface TimetableFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: SlotTypeFilter;
  onTypeFilterChange: (type: SlotTypeFilter) => void;
  selectedSubjectId: string | null;
  onSubjectSelect: (subjectId: string | null) => void;
  selectedFacultyId: string | null;
  onFacultySelect: (facultyId: string | null) => void;
  subjects: Subject[];
  faculty: Faculty[];
  matchStats: MatchStats;
  onClearFilters: () => void;
}

/**
 * Pure evaluation function checking if a timetable grid cell matches the active filter criteria.
 */
export function matchTimetableSlot(
  cell: {
    entryId: string | null;
    subjectCode?: string;
    subjectName?: string;
    facultyName?: string;
    type?: 'THEORY' | 'LAB';
  },
  filter: TimetableFilterState,
  entryDetails?: {
    subjectId?: string;
    facultyId?: string;
  },
): boolean {
  const isFilterActive = Boolean(
    filter.searchQuery.trim() ||
      filter.typeFilter !== 'ALL' ||
      filter.selectedSubjectId ||
      filter.selectedFacultyId,
  );

  // When no filters are active, all cells match
  if (!isFilterActive) return true;

  // Empty cells do not match an active filter
  if (!cell.entryId) return false;

  // Type filter check
  if (filter.typeFilter !== 'ALL' && cell.type !== filter.typeFilter) {
    return false;
  }

  // Subject selector check
  if (filter.selectedSubjectId && entryDetails?.subjectId !== filter.selectedSubjectId) {
    return false;
  }

  // Faculty selector check
  if (filter.selectedFacultyId && entryDetails?.facultyId !== filter.selectedFacultyId) {
    return false;
  }

  // Text search query check
  const q = filter.searchQuery.trim().toLowerCase();
  if (q) {
    const tokens = q.split(/\s+/).filter(Boolean);
    const target = `${cell.subjectCode ?? ''} ${cell.subjectName ?? ''} ${cell.facultyName ?? ''} ${cell.type ?? ''}`.toLowerCase();
    if (!tokens.every((token) => target.includes(token))) {
      return false;
    }
  }

  return true;
}

export const TimetableFilterToolbar: React.FC<TimetableFilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  selectedSubjectId,
  onSubjectSelect,
  selectedFacultyId,
  onFacultySelect,
  subjects,
  faculty,
  matchStats,
  onClearFilters,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Global '/' keyboard shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        if (e.key === 'Escape' && target === inputRef.current) {
          inputRef.current?.blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeSubjects = subjects.filter((s) => s.active);
  const activeFaculty = faculty.filter((f) => f.active);

  return (
    <div className="rounded-xl border border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] p-3 sm:p-3.5 mb-4 shadow-xs transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Search input with keyboard hint */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8c9199] dark:text-[#6e6e73] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search slots by code, name, faculty... (Press / to focus)"
            className="w-full pl-9 pr-14 py-1.5 text-xs rounded-lg border border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112] text-[#121417] dark:text-[#ececec] placeholder:text-[#8c9199] dark:placeholder:text-[#6e6e73] focus:outline-none focus:border-[#3b6fe0] dark:focus:border-[#7aa2f7] transition-all"
            aria-label="Filter timetable slots"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 p-0.5 rounded text-[#8c9199] hover:text-[#121417] dark:hover:text-[#ececec] transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2.5 top-2 hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono rounded border border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] text-[#8c9199] dark:text-[#6e6e73] pointer-events-none">
              /
            </kbd>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Segmented Pill Toggle */}
          <div
            role="group"
            aria-label="Filter by session type"
            className="inline-flex items-center rounded-lg border border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112] p-0.5"
          >
            {(['ALL', 'THEORY', 'LAB'] as const).map((type) => {
              const isSelected = typeFilter === type;
              const label = type === 'ALL' ? 'All Types' : type === 'THEORY' ? 'Theory' : 'Labs';
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onTypeFilterChange(type)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#e8effc] text-[#3b6fe0] dark:bg-[#18233a] dark:text-[#7aa2f7] shadow-xs'
                      : 'text-[#5b616b] dark:text-[#a1a1a6] hover:text-[#121417] dark:hover:text-[#ececec]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Subject Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedSubjectId ?? ''}
              onChange={(e) => onSubjectSelect(e.target.value ? e.target.value : null)}
              className="h-8 pl-2.5 pr-7 text-xs rounded-lg border border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112] text-[#121417] dark:text-[#ececec] focus:outline-none focus:border-[#3b6fe0] dark:focus:border-[#7aa2f7] cursor-pointer"
              aria-label="Filter by subject"
            >
              <option value="">All Subjects</option>
              {activeSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Faculty Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedFacultyId ?? ''}
              onChange={(e) => onFacultySelect(e.target.value ? e.target.value : null)}
              className="h-8 pl-2.5 pr-7 text-xs rounded-lg border border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112] text-[#121417] dark:text-[#ececec] focus:outline-none focus:border-[#3b6fe0] dark:focus:border-[#7aa2f7] cursor-pointer"
              aria-label="Filter by faculty"
            >
              <option value="">All Faculty</option>
              {activeFaculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {matchStats.isFilterActive && (
            <button
              type="button"
              onClick={onClearFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#c0392b] dark:text-[#f87171] hover:bg-[#fee2e2] dark:hover:bg-[#381e1e] rounded-lg transition-colors cursor-pointer"
              title="Reset all search filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Results Banner */}
      {matchStats.isFilterActive && (
        <div className="mt-2.5 pt-2.5 border-t border-[#e1e4e8] dark:border-[#2a2a2d] flex flex-wrap items-center justify-between text-xs text-[#5b616b] dark:text-[#a1a1a6]">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#3b6fe0] dark:bg-[#7aa2f7] animate-pulse" />
            <span className="font-medium text-[#121417] dark:text-[#ececec]">
              Showing {matchStats.matchingSlots} matching session{matchStats.matchingSlots === 1 ? '' : 's'}
            </span>
            <span className="text-[#8c9199] dark:text-[#6e6e73]">
              ({matchStats.matchingHours} period{matchStats.matchingHours === 1 ? '' : 's'} • {matchStats.theorySlots} Theory, {matchStats.labSlots} Lab)
            </span>
          </div>
          <span className="text-[11px] text-[#3b6fe0] dark:text-[#7aa2f7] font-medium">
            Highlighted in grid below
          </span>
        </div>
      )}
    </div>
  );
};
