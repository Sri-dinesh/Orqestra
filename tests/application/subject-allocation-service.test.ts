import { describe, expect, it } from 'vitest';
import type { Faculty, Section, Subject, TimetableEntry } from '@/domain/models';
import { computeSectionSubjectAllocations } from '@/application/subject-allocation-service';

describe('computeSectionSubjectAllocations', () => {
  const section: Section = {
    id: 'sec_a',
    departmentId: 'dept_cse',
    name: 'Section A',
    year: 1,
    semester: 1,
    studentCount: 60,
    active: true,
    subjectRequirements: [
      { id: 'req_1', subjectId: 'sub_math', sessionsPerWeek: 4 },
      { id: 'req_2', subjectId: 'sub_phy', sessionsPerWeek: 3 },
      { id: 'req_3', subjectId: 'sub_lab', sessionsPerWeek: 1 },
    ],
  };

  const subjects: Subject[] = [
    {
      id: 'sub_math',
      departmentId: 'dept_cse',
      code: 'MATH101',
      name: 'Linear Algebra',
      type: 'THEORY',
      sessionsPerWeek: 4,
      durationPeriods: 1,
      eligibleFacultyIds: ['fac_1'],
      eligibleSectionIds: ['sec_a'],
      active: true,
    },
    {
      id: 'sub_phy',
      departmentId: 'dept_cse',
      code: 'PHY101',
      name: 'Physics',
      type: 'THEORY',
      sessionsPerWeek: 3,
      durationPeriods: 1,
      eligibleFacultyIds: ['fac_2'],
      eligibleSectionIds: ['sec_a'],
      active: true,
    },
    {
      id: 'sub_lab',
      departmentId: 'dept_cse',
      code: 'PHYLAB',
      name: 'Physics Lab',
      type: 'LAB',
      sessionsPerWeek: 1,
      durationPeriods: 2,
      eligibleFacultyIds: ['fac_2'],
      eligibleSectionIds: ['sec_a'],
      active: true,
    },
  ];

  const faculty: Faculty[] = [
    {
      id: 'fac_1',
      departmentId: 'dept_cse',
      facultyCode: 'EUL',
      name: 'Dr. Euler',
      subjectIds: [],
      sectionIds: [],
      availability: [],
      preferredSlots: [],
      maxPeriodsPerDay: null,
      maxPeriodsPerWeek: null,
      active: true,
    },
    {
      id: 'fac_2',
      departmentId: 'dept_cse',
      facultyCode: 'NEW',
      name: 'Dr. Newton',
      subjectIds: [],
      sectionIds: [],
      availability: [],
      preferredSlots: [],
      maxPeriodsPerDay: null,
      maxPeriodsPerWeek: null,
      active: true,
    },
  ];

  it('correctly reports 100% satisfied when all required sessions are present', () => {
    const entries: TimetableEntry[] = [
      // 4 math sessions
      { id: 'e1', sectionId: 'sec_a', subjectId: 'sub_math', facultyId: 'fac_1', roomId: null, dayIndex: 0, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      { id: 'e2', sectionId: 'sec_a', subjectId: 'sub_math', facultyId: 'fac_1', roomId: null, dayIndex: 1, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      { id: 'e3', sectionId: 'sec_a', subjectId: 'sub_math', facultyId: 'fac_1', roomId: null, dayIndex: 2, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      { id: 'e4', sectionId: 'sec_a', subjectId: 'sub_math', facultyId: 'fac_1', roomId: null, dayIndex: 3, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      // 3 physics sessions
      { id: 'e5', sectionId: 'sec_a', subjectId: 'sub_phy', facultyId: 'fac_2', roomId: null, dayIndex: 0, startPeriod: 1, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      { id: 'e6', sectionId: 'sec_a', subjectId: 'sub_phy', facultyId: 'fac_2', roomId: null, dayIndex: 1, startPeriod: 1, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      { id: 'e7', sectionId: 'sec_a', subjectId: 'sub_phy', facultyId: 'fac_2', roomId: null, dayIndex: 2, startPeriod: 1, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      // 1 lab (2 periods)
      { id: 'e8', sectionId: 'sec_a', subjectId: 'sub_lab', facultyId: 'fac_2', roomId: null, dayIndex: 4, startPeriod: 2, durationPeriods: 2, source: 'GENERATED', revision: 1 },
    ];

    const result = computeSectionSubjectAllocations(section, subjects, faculty, entries);

    expect(result.totalTargetSessions).toBe(8);
    expect(result.totalAssignedSessions).toBe(8);
    expect(result.totalTargetPeriods).toBe(9); // 4 + 3 + 2 = 9
    expect(result.totalAssignedPeriods).toBe(9);
    expect(result.percentageSatisfied).toBe(100);
    expect(result.items.every((i) => i.status === 'MET')).toBe(true);
  });

  it('detects under-allocated and over-allocated subjects with missing counts', () => {
    const entries: TimetableEntry[] = [
      // Only 2 math sessions (target is 4) -> UNDER by 2
      { id: 'e1', sectionId: 'sec_a', subjectId: 'sub_math', facultyId: 'fac_1', roomId: null, dayIndex: 0, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      { id: 'e2', sectionId: 'sec_a', subjectId: 'sub_math', facultyId: 'fac_1', roomId: null, dayIndex: 1, startPeriod: 0, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      // 4 physics sessions (target is 3) -> OVER by 1
      { id: 'e3', sectionId: 'sec_a', subjectId: 'sub_phy', facultyId: 'fac_2', roomId: null, dayIndex: 0, startPeriod: 1, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      { id: 'e4', sectionId: 'sec_a', subjectId: 'sub_phy', facultyId: 'fac_2', roomId: null, dayIndex: 1, startPeriod: 1, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      { id: 'e5', sectionId: 'sec_a', subjectId: 'sub_phy', facultyId: 'fac_2', roomId: null, dayIndex: 2, startPeriod: 1, durationPeriods: 1, source: 'GENERATED', revision: 1 },
      { id: 'e6', sectionId: 'sec_a', subjectId: 'sub_phy', facultyId: 'fac_2', roomId: null, dayIndex: 3, startPeriod: 1, durationPeriods: 1, source: 'GENERATED', revision: 1 },
    ];

    const result = computeSectionSubjectAllocations(section, subjects, faculty, entries);

    const math = result.items.find((i) => i.subjectId === 'sub_math')!;
    expect(math.status).toBe('UNDER');
    expect(math.missingSessions).toBe(2);
    expect(math.assignedFacultyNames).toEqual(['Dr. Euler']);

    const phy = result.items.find((i) => i.subjectId === 'sub_phy')!;
    expect(phy.status).toBe('OVER');
    expect(phy.extraSessions).toBe(1);

    const lab = result.items.find((i) => i.subjectId === 'sub_lab')!;
    expect(lab.status).toBe('UNDER');
    expect(lab.missingSessions).toBe(1);

    expect(result.satisfiedSubjectsCount).toBe(0);
    expect(result.percentageSatisfied).toBe(0);
  });
});
