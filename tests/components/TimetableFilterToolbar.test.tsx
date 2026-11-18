import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TimetableFilterToolbar,
  matchTimetableSlot,
  type TimetableFilterState,
} from '@/components/ui/TimetableFilterToolbar';
import type { Faculty, Subject } from '@/domain/models';

describe('matchTimetableSlot helper', () => {
  const dummyCell = {
    entryId: 'e1',
    subjectCode: 'CS101',
    subjectName: 'Data Structures',
    facultyName: 'Dr. Alan Turing',
    type: 'THEORY' as const,
  };

  const dummyLabCell = {
    entryId: 'e2',
    subjectCode: 'CS102',
    subjectName: 'Algorithms Lab',
    facultyName: 'Dr. Grace Hopper',
    type: 'LAB' as const,
  };

  const emptyCell = {
    entryId: null,
    subjectCode: '',
    subjectName: '',
    facultyName: '',
    type: 'THEORY' as const,
  };

  const defaultFilter: TimetableFilterState = {
    searchQuery: '',
    typeFilter: 'ALL',
    selectedSubjectId: null,
    selectedFacultyId: null,
  };

  it('matches all cells when filter is inactive', () => {
    expect(matchTimetableSlot(dummyCell, defaultFilter)).toBe(true);
    expect(matchTimetableSlot(emptyCell, defaultFilter)).toBe(true);
  });

  it('excludes empty slots when any filter is active', () => {
    const activeFilter: TimetableFilterState = {
      ...defaultFilter,
      searchQuery: 'Turing',
    };
    expect(matchTimetableSlot(emptyCell, activeFilter)).toBe(false);
  });

  it('filters correctly by text search query', () => {
    const filterByCode: TimetableFilterState = { ...defaultFilter, searchQuery: 'cs101' };
    expect(matchTimetableSlot(dummyCell, filterByCode)).toBe(true);
    expect(matchTimetableSlot(dummyLabCell, filterByCode)).toBe(false);

    const filterByFaculty: TimetableFilterState = { ...defaultFilter, searchQuery: 'grace' };
    expect(matchTimetableSlot(dummyCell, filterByFaculty)).toBe(false);
    expect(matchTimetableSlot(dummyLabCell, filterByFaculty)).toBe(true);
  });

  it('filters correctly by session type (THEORY vs LAB)', () => {
    const theoryFilter: TimetableFilterState = { ...defaultFilter, typeFilter: 'THEORY' };
    expect(matchTimetableSlot(dummyCell, theoryFilter)).toBe(true);
    expect(matchTimetableSlot(dummyLabCell, theoryFilter)).toBe(false);

    const labFilter: TimetableFilterState = { ...defaultFilter, typeFilter: 'LAB' };
    expect(matchTimetableSlot(dummyCell, labFilter)).toBe(false);
    expect(matchTimetableSlot(dummyLabCell, labFilter)).toBe(true);
  });

  it('filters correctly by subject ID and faculty ID', () => {
    const subjectFilter: TimetableFilterState = {
      ...defaultFilter,
      selectedSubjectId: 'sub_1',
    };
    expect(
      matchTimetableSlot(dummyCell, subjectFilter, { subjectId: 'sub_1', facultyId: 'fac_1' }),
    ).toBe(true);
    expect(
      matchTimetableSlot(dummyCell, subjectFilter, { subjectId: 'sub_2', facultyId: 'fac_1' }),
    ).toBe(false);

    const facultyFilter: TimetableFilterState = {
      ...defaultFilter,
      selectedFacultyId: 'fac_2',
    };
    expect(
      matchTimetableSlot(dummyCell, facultyFilter, { subjectId: 'sub_1', facultyId: 'fac_1' }),
    ).toBe(false);
    expect(
      matchTimetableSlot(dummyCell, facultyFilter, { subjectId: 'sub_1', facultyId: 'fac_2' }),
    ).toBe(true);
  });
});

describe('TimetableFilterToolbar Component', () => {
  const dummySubjects: Subject[] = [
    {
      id: 'sub_1',
      code: 'CS101',
      name: 'Data Structures',
      departmentId: 'd1',
      type: 'THEORY',
      sessionsPerWeek: 4,
      durationPeriods: 1,
      eligibleFacultyIds: [],
      eligibleSectionIds: [],
      active: true,
    },
  ];

  const dummyFaculty: Faculty[] = [
    {
      id: 'fac_1',
      facultyCode: 'AT',
      name: 'Dr. Alan Turing',
      departmentId: 'd1',
      subjectIds: [],
      sectionIds: [],
      availability: [],
      preferredSlots: [],
      maxPeriodsPerWeek: 18,
      maxPeriodsPerDay: 4,
      active: true,
    },
  ];

  it('renders search input and options', () => {
    render(
      <TimetableFilterToolbar
        searchQuery=""
        onSearchChange={vi.fn()}
        typeFilter="ALL"
        onTypeFilterChange={vi.fn()}
        selectedSubjectId={null}
        onSubjectSelect={vi.fn()}
        selectedFacultyId={null}
        onFacultySelect={vi.fn()}
        subjects={dummySubjects}
        faculty={dummyFaculty}
        matchStats={{
          matchingSlots: 0,
          matchingHours: 0,
          theorySlots: 0,
          labSlots: 0,
          isFilterActive: false,
        }}
        onClearFilters={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText(/Search slots by code/i)).toBeInTheDocument();
    expect(screen.getByText('All Types')).toBeInTheDocument();
    expect(screen.getByText('Theory')).toBeInTheDocument();
    expect(screen.getByText('Labs')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by faculty')).toBeInTheDocument();
  });

  it('calls onSearchChange when user types in search input', () => {
    const handleSearchChange = vi.fn();
    render(
      <TimetableFilterToolbar
        searchQuery=""
        onSearchChange={handleSearchChange}
        typeFilter="ALL"
        onTypeFilterChange={vi.fn()}
        selectedSubjectId={null}
        onSubjectSelect={vi.fn()}
        selectedFacultyId={null}
        onFacultySelect={vi.fn()}
        subjects={dummySubjects}
        faculty={dummyFaculty}
        matchStats={{
          matchingSlots: 0,
          matchingHours: 0,
          theorySlots: 0,
          labSlots: 0,
          isFilterActive: false,
        }}
        onClearFilters={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText(/Search slots by code/i);
    fireEvent.change(input, { target: { value: 'Algorithms' } });

    expect(handleSearchChange).toHaveBeenCalledWith('Algorithms');
  });

  it('shows active filter results and triggers reset', () => {
    const handleClearFilters = vi.fn();
    render(
      <TimetableFilterToolbar
        searchQuery="Data"
        onSearchChange={vi.fn()}
        typeFilter="ALL"
        onTypeFilterChange={vi.fn()}
        selectedSubjectId={null}
        onSubjectSelect={vi.fn()}
        selectedFacultyId={null}
        onFacultySelect={vi.fn()}
        subjects={dummySubjects}
        faculty={dummyFaculty}
        matchStats={{
          matchingSlots: 4,
          matchingHours: 4,
          theorySlots: 4,
          labSlots: 0,
          isFilterActive: true,
        }}
        onClearFilters={handleClearFilters}
      />,
    );

    expect(screen.getByText(/Showing 4 matching sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/Highlighted in grid below/i)).toBeInTheDocument();

    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    expect(handleClearFilters).toHaveBeenCalledTimes(1);
  });
});
