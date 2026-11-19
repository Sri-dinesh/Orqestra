import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ScheduleInsightsModal,
  computeScheduleInsights,
} from '@/components/ui/ScheduleInsightsModal';
import type { Department, Faculty, Section, Subject, Timetable } from '@/domain/models';

describe('ScheduleInsightsModal & computeScheduleInsights', () => {
  const dummyDepartment: Department = {
    id: 'dept_cs',
    name: 'Computer Science',
    code: 'CS',
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as any,
    periodsPerDay: 6,
    status: 'READY',
    createdAt: '',
    updatedAt: '',
  };

  const dummySubjects: Subject[] = [
    {
      id: 'sub_algo',
      departmentId: 'dept_cs',
      code: 'CS201',
      name: 'Algorithms',
      type: 'THEORY',
      sessionsPerWeek: 4,
      durationPeriods: 1,
      eligibleFacultyIds: ['fac_turing'],
      eligibleSectionIds: ['sec_a'],
      active: true,
    },
    {
      id: 'sub_web_lab',
      departmentId: 'dept_cs',
      code: 'CS202L',
      name: 'Web Dev Lab',
      type: 'LAB',
      sessionsPerWeek: 1,
      durationPeriods: 2,
      eligibleFacultyIds: ['fac_hopper'],
      eligibleSectionIds: ['sec_a'],
      active: true,
    },
  ];

  const dummyFaculty: Faculty[] = [
    {
      id: 'fac_turing',
      departmentId: 'dept_cs',
      name: 'Alan Turing',
      facultyCode: 'AT',
      subjectIds: ['sub_algo'],
      sectionIds: ['sec_a'],
      availability: [],
      preferredSlots: [],
      maxPeriodsPerDay: 4,
      maxPeriodsPerWeek: 5,
      active: true,
    },
    {
      id: 'fac_hopper',
      departmentId: 'dept_cs',
      name: 'Grace Hopper',
      facultyCode: 'GH',
      subjectIds: ['sub_web_lab'],
      sectionIds: ['sec_a'],
      availability: [],
      preferredSlots: [],
      maxPeriodsPerDay: 4,
      maxPeriodsPerWeek: 10,
      active: true,
    },
    {
      id: 'fac_idle',
      departmentId: 'dept_cs',
      name: 'Ada Lovelace',
      facultyCode: 'AL',
      subjectIds: [],
      sectionIds: [],
      availability: [],
      preferredSlots: [],
      maxPeriodsPerDay: 4,
      maxPeriodsPerWeek: 12,
      active: true,
    },
  ];

  const dummySections: Section[] = [
    {
      id: 'sec_a',
      departmentId: 'dept_cs',
      name: 'Section A',
      year: 2,
      semester: 3,
      studentCount: 60,
      subjectRequirements: [],
      active: true,
    },
    {
      id: 'sec_b',
      departmentId: 'dept_cs',
      name: 'Section B',
      year: 2,
      semester: 3,
      studentCount: 55,
      subjectRequirements: [],
      active: true,
    },
  ];

  const dummyTimetable: Timetable = {
    id: 'tt_1',
    departmentId: 'dept_cs',
    status: 'VALID',
    configurationSnapshot: {
      fingerprint: 'fp_1',
      workingDays: dummyDepartment.workingDays,
      periodsPerDay: 6,
      sectionIds: ['sec_a', 'sec_b'],
      subjectRequirementCounts: {},
    },
    revision: 1,
    generationMetadata: null,
    entries: [
      // Day 0: 2 periods of Algo for Sec A
      {
        id: 'entry_1',
        sectionId: 'sec_a',
        dayIndex: 0,
        startPeriod: 0,
        durationPeriods: 1,
        subjectId: 'sub_algo',
        facultyId: 'fac_turing',
        roomId: 'r1',
        source: 'GENERATED',
        revision: 1,
      },
      {
        id: 'entry_2',
        sectionId: 'sec_a',
        dayIndex: 0,
        startPeriod: 1,
        durationPeriods: 1,
        subjectId: 'sub_algo',
        facultyId: 'fac_turing',
        roomId: 'r1',
        source: 'GENERATED',
        revision: 1,
      },
      // Day 1: Lab 2 periods for Sec A
      {
        id: 'entry_3',
        sectionId: 'sec_a',
        dayIndex: 1,
        startPeriod: 2,
        durationPeriods: 2,
        subjectId: 'sub_web_lab',
        facultyId: 'fac_hopper',
        roomId: 'r_lab',
        source: 'GENERATED',
        revision: 1,
      },
      // Day 0: 1 period for Sec B with Turing (making Turing 3 periods total)
      {
        id: 'entry_4',
        sectionId: 'sec_b',
        dayIndex: 0,
        startPeriod: 3,
        durationPeriods: 1,
        subjectId: 'sub_algo',
        facultyId: 'fac_turing',
        roomId: 'r2',
        source: 'GENERATED',
        revision: 1,
      },
    ],
    validationSummary: {
      isValid: true,
      hardConflictCount: 0,
      softViolationCount: 0,
      conflicts: [],
      warnings: [],
      checkedAt: '',
      validatorVersion: '1.0',
    },
    createdAt: '',
    updatedAt: '',
  };

  describe('computeScheduleInsights computation', () => {
    it('computes aggregated counts across all sections', () => {
      const insights = computeScheduleInsights(
        dummyTimetable,
        dummyDepartment,
        dummySubjects,
        dummyFaculty,
        dummySections,
        null,
      );

      // Total scheduled: 1 + 1 + 2 + 1 = 5 periods
      expect(insights.totalScheduledPeriods).toBe(5);
      expect(insights.totalTheoryPeriods).toBe(3);
      expect(insights.totalLabPeriods).toBe(2);
      expect(insights.activeFacultyCount).toBe(2); // Turing & Hopper have hours, Lovelace has 0
      // 5 working days * 6 periods * 2 sections = 60 periods capacity
      expect(insights.totalCapacityPeriods).toBe(60);
      expect(insights.occupancyPercent).toBe(8); // (5 / 60) * 100 = 8.33 -> 8%
      expect(insights.busiestDay?.dayName).toBe('MONDAY');
      expect(insights.busiestDay?.totalPeriods).toBe(3);
    });

    it('filters computation by targetSectionId', () => {
      const insights = computeScheduleInsights(
        dummyTimetable,
        dummyDepartment,
        dummySubjects,
        dummyFaculty,
        dummySections,
        'sec_a',
      );

      // Only entries 1, 2, 3 -> 1 + 1 + 2 = 4 periods
      expect(insights.totalScheduledPeriods).toBe(4);
      expect(insights.totalTheoryPeriods).toBe(2);
      expect(insights.totalLabPeriods).toBe(2);
      // Capacity for 1 section = 5 * 6 * 1 = 30
      expect(insights.totalCapacityPeriods).toBe(30);
      expect(insights.occupancyPercent).toBe(13); // (4 / 30) * 100 = 13.33 -> 13%
    });

    it('correctly assesses faculty workload and status', () => {
      const insights = computeScheduleInsights(
        dummyTimetable,
        dummyDepartment,
        dummySubjects,
        dummyFaculty,
        dummySections,
        null,
      );

      const turing = insights.facultyWorkloads.find((f) => f.facultyId === 'fac_turing');
      expect(turing).toBeDefined();
      expect(turing?.scheduledPeriods).toBe(3);
      expect(turing?.maxWeeklyPeriods).toBe(5);
      expect(turing?.utilizationPercent).toBe(60); // 3 / 5 = 60%
      expect(turing?.status).toBe('OPTIMAL');

      const hopper = insights.facultyWorkloads.find((f) => f.facultyId === 'fac_hopper');
      expect(hopper).toBeDefined();
      expect(hopper?.scheduledPeriods).toBe(2);
      expect(hopper?.maxWeeklyPeriods).toBe(10);
      expect(hopper?.utilizationPercent).toBe(20); // 2 / 10 = 20% (< 40% -> UNDERLOAD)
      expect(hopper?.status).toBe('UNDERLOAD');

      const lovelace = insights.facultyWorkloads.find((f) => f.facultyId === 'fac_idle');
      expect(lovelace).toBeDefined();
      expect(lovelace?.scheduledPeriods).toBe(0);
      expect(lovelace?.status).toBe('UNASSIGNED');
    });

    it('handles empty timetable safely', () => {
      const insights = computeScheduleInsights(
        null,
        dummyDepartment,
        dummySubjects,
        dummyFaculty,
        dummySections,
      );

      expect(insights.totalScheduledPeriods).toBe(0);
      expect(insights.occupancyPercent).toBe(0);
      expect(insights.activeFacultyCount).toBe(0);
    });
  });

  describe('ScheduleInsightsModal Component', () => {
    it('does not render when isOpen is false', () => {
      render(
        <ScheduleInsightsModal
          isOpen={false}
          onClose={vi.fn()}
          timetable={dummyTimetable}
          department={dummyDepartment}
          subjects={dummySubjects}
          faculty={dummyFaculty}
          sections={dummySections}
        />,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog and statistics badges when isOpen is true', () => {
      render(
        <ScheduleInsightsModal
          isOpen={true}
          onClose={vi.fn()}
          timetable={dummyTimetable}
          department={dummyDepartment}
          subjects={dummySubjects}
          faculty={dummyFaculty}
          sections={dummySections}
          activeSectionId="sec_a"
        />,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Schedule Analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/Section A/i)).toBeInTheDocument();
      // Tab buttons
      expect(screen.getByText(/Faculty Workload/i)).toBeInTheDocument();
      expect(screen.getByText(/Daily Distribution/i)).toBeInTheDocument();
      expect(screen.getByText(/Subject Breakdown/i)).toBeInTheDocument();
    });

    it('switches tabs and displays daily load and subject breakdown', () => {
      render(
        <ScheduleInsightsModal
          isOpen={true}
          onClose={vi.fn()}
          timetable={dummyTimetable}
          department={dummyDepartment}
          subjects={dummySubjects}
          faculty={dummyFaculty}
          sections={dummySections}
        />,
      );

      // Default Workload tab shows Alan Turing
      expect(screen.getByText('Alan Turing')).toBeInTheDocument();

      // Switch to Daily Distribution
      fireEvent.click(screen.getByText(/Daily Distribution/i));
      expect(screen.getByText('MONDAY')).toBeInTheDocument();
      expect(screen.getByText('TUESDAY')).toBeInTheDocument();

      // Switch to Subject Breakdown
      fireEvent.click(screen.getByText(/Subject Breakdown/i));
      expect(screen.getByText('Algorithms')).toBeInTheDocument();
      expect(screen.getByText('Web Dev Lab')).toBeInTheDocument();
    });

    it('calls onClose when clicking close button or backdrop', () => {
      const handleClose = vi.fn();
      render(
        <ScheduleInsightsModal
          isOpen={true}
          onClose={handleClose}
          timetable={dummyTimetable}
          department={dummyDepartment}
          subjects={dummySubjects}
          faculty={dummyFaculty}
          sections={dummySections}
        />,
      );

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Backdrop click
      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);
      expect(handleClose).toHaveBeenCalledTimes(2);
    });
  });
});
