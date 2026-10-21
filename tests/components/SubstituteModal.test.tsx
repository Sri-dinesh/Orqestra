import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubstituteModal } from '@/components/ui/SubstituteModal';
import type { Department, Faculty, Section, Subject, Timetable, TimetableEntry } from '@/domain/models';

describe('SubstituteModal', () => {
  const department: Department = {
    id: 'dept_cs',
    code: 'CSE',
    name: 'Computer Science',
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
    periodsPerDay: 5,
    periodTimings: [
      { start: '09:00 AM', end: '09:50 AM' },
      { start: '09:50 AM', end: '10:40 AM' },
    ],
    status: 'READY',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const subject: Subject = {
    id: 'sub_algo',
    departmentId: 'dept_cs',
    code: 'CS301',
    name: 'Algorithms',
    type: 'THEORY',
    sessionsPerWeek: 4,
    durationPeriods: 1,
    eligibleFacultyIds: ['fac_match'],
    eligibleSectionIds: ['sec_1'],
    active: true,
  };

  const facultyOriginal: Faculty = {
    id: 'fac_orig',
    departmentId: 'dept_cs',
    facultyCode: 'CSE01',
    name: 'Dr. Original',
    subjectIds: ['sub_algo'],
    sectionIds: ['sec_1'],
    availability: [],
    preferredSlots: [],
    maxPeriodsPerDay: 4,
    maxPeriodsPerWeek: 18,
    active: true,
  };

  const facultyMatch: Faculty = {
    id: 'fac_match',
    departmentId: 'dept_cs',
    facultyCode: 'CSE02',
    name: 'Dr. Match',
    subjectIds: ['sub_algo'],
    sectionIds: ['sec_1'],
    availability: [],
    preferredSlots: [],
    maxPeriodsPerDay: 4,
    maxPeriodsPerWeek: 18,
    active: true,
  };

  const facultyOther: Faculty = {
    id: 'fac_other',
    departmentId: 'dept_cs',
    facultyCode: 'CSE03',
    name: 'Dr. Other',
    subjectIds: [],
    sectionIds: [],
    availability: [],
    preferredSlots: [],
    maxPeriodsPerDay: 4,
    maxPeriodsPerWeek: 18,
    active: true,
  };

  const section: Section = {
    id: 'sec_1',
    departmentId: 'dept_cs',
    name: 'CSE-A',
    year: 2,
    semester: 3,
    studentCount: 60,
    subjectRequirements: [],
    active: true,
  };

  const entry: TimetableEntry = {
    id: 'entry_1',
    sectionId: 'sec_1',
    subjectId: 'sub_algo',
    facultyId: 'fac_orig',
    dayIndex: 0,
    startPeriod: 1,
    durationPeriods: 1,
    roomId: null,
    source: 'GENERATED',
    revision: 1,
  };

  const timetable: Timetable = {
    id: 'tt_1',
    departmentId: 'dept_cs',
    configurationSnapshot: { fingerprint: 'abc' } as any,
    entries: [entry],
    status: 'VALID',
    validationSummary: null as any,
    generationMetadata: null,
    revision: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  } as unknown as Timetable;

  it('renders modal with target session details and evaluated candidates', () => {
    render(
      <SubstituteModal
        isOpen={true}
        onClose={vi.fn()}
        timetable={timetable}
        department={department}
        subjects={[subject]}
        faculty={[facultyOriginal, facultyMatch, facultyOther]}
        sections={[section]}
        initialEntryId="entry_1"
        onAssignSubstitute={vi.fn()}
      />,
    );

    expect(screen.getByText('Faculty Substitution & Coverage Assistant')).toBeDefined();
    expect(screen.getAllByText('Dr. Match').length).toBeGreaterThan(0);
    expect(screen.getByText('Best Match')).toBeDefined();
    expect(screen.getAllByText('Dr. Other').length).toBeGreaterThan(0);
  });

  it('filters candidates when typing in search input', () => {
    render(
      <SubstituteModal
        isOpen={true}
        onClose={vi.fn()}
        timetable={timetable}
        department={department}
        subjects={[subject]}
        faculty={[facultyOriginal, facultyMatch, facultyOther]}
        sections={[section]}
        initialEntryId="entry_1"
        onAssignSubstitute={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Filter candidate faculty...');
    fireEvent.change(searchInput, { target: { value: 'Match' } });

    // In the candidate cards list, only Dr. Match should be rendered
    expect(screen.getByText(/\(CSE02\)/)).toBeDefined();
    expect(screen.queryByText(/\(CSE03\)/)).toBeNull();
  });

  it('invokes onAssignSubstitute when clicking Assign Substitute', () => {
    const onAssign = vi.fn();
    render(
      <SubstituteModal
        isOpen={true}
        onClose={vi.fn()}
        timetable={timetable}
        department={department}
        subjects={[subject]}
        faculty={[facultyOriginal, facultyMatch, facultyOther]}
        sections={[section]}
        initialEntryId="entry_1"
        onAssignSubstitute={onAssign}
      />,
    );

    const assignBtns = screen.getAllByRole('button', { name: /Assign Substitute/i });
    expect(assignBtns.length).toBeGreaterThan(0);
    fireEvent.click(assignBtns[0]);

    expect(onAssign).toHaveBeenCalledWith('entry_1', 'fac_match');
  });

  it('toggles printable substitution slip memo view', () => {
    render(
      <SubstituteModal
        isOpen={true}
        onClose={vi.fn()}
        timetable={timetable}
        department={department}
        subjects={[subject]}
        faculty={[facultyOriginal, facultyMatch, facultyOther]}
        sections={[section]}
        initialEntryId="entry_1"
        onAssignSubstitute={vi.fn()}
      />,
    );

    const slipBtns = screen.getAllByRole('button', { name: /Slip/i });
    fireEvent.click(slipBtns[0]);

    // Should switch to memo view
    expect(screen.getByText(/Faculty Substitution & Class Coverage Slip/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Print Official Slip/i })).toBeDefined();

    // Click back button
    const backBtn = screen.getByRole('button', { name: /Back to Candidate Recommendations/i });
    fireEvent.click(backBtn);

    expect(screen.queryByText(/Faculty Substitution & Class Coverage Slip/i)).toBeNull();
    expect(screen.getAllByText('Dr. Match').length).toBeGreaterThan(0);
  });
});
