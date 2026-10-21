import { describe, it, expect } from 'vitest';
import {
  findSubstitutesForEntry,
  generateSubstitutionSlipData,
} from '@/domain/substitution/substitution-service';
import type { Department, Faculty, Section, Subject, Timetable, TimetableEntry } from '@/domain/models';

describe('substitution-service', () => {
  const department: Department = {
    id: 'dept_cs',
    code: 'CSE',
    name: 'Computer Science and Engineering',
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    periodsPerDay: 7,
    periodTimings: [
      { start: '09:00 AM', end: '09:50 AM' },
      { start: '09:50 AM', end: '10:40 AM' },
      { start: '10:40 AM', end: '11:30 AM' },
    ],
    status: 'READY',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const subjectAlgo: Subject = {
    id: 'sub_algo',
    departmentId: 'dept_cs',
    code: 'CS301',
    name: 'Design and Analysis of Algorithms',
    type: 'THEORY',
    sessionsPerWeek: 4,
    durationPeriods: 1,
    eligibleFacultyIds: ['fac_prof_a', 'fac_prof_b'],
    eligibleSectionIds: ['sec_3a'],
    active: true,
  };

  const facultyOriginal: Faculty = {
    id: 'fac_original',
    departmentId: 'dept_cs',
    facultyCode: 'CSE001',
    name: 'Prof. Original',
    subjectIds: ['sub_algo'],
    sectionIds: ['sec_3a'],
    availability: [],
    preferredSlots: [],
    maxPeriodsPerDay: 4,
    maxPeriodsPerWeek: 18,
    active: true,
  };

  const facultyBestMatch: Faculty = {
    id: 'fac_prof_b',
    departmentId: 'dept_cs',
    facultyCode: 'CSE002',
    name: 'Prof. Best Match',
    subjectIds: ['sub_algo'],
    sectionIds: ['sec_3a'],
    availability: [],
    preferredSlots: [],
    maxPeriodsPerDay: 4,
    maxPeriodsPerWeek: 18,
    active: true,
  };

  const facultyGeneralAvailable: Faculty = {
    id: 'fac_general',
    departmentId: 'dept_cs',
    facultyCode: 'CSE003',
    name: 'Prof. General',
    subjectIds: [],
    sectionIds: [],
    availability: [],
    preferredSlots: [],
    maxPeriodsPerDay: 4,
    maxPeriodsPerWeek: 18,
    active: true,
  };

  const facultyBusy: Faculty = {
    id: 'fac_busy',
    departmentId: 'dept_cs',
    facultyCode: 'CSE004',
    name: 'Prof. Busy',
    subjectIds: [],
    sectionIds: [],
    availability: [],
    preferredSlots: [],
    maxPeriodsPerDay: 4,
    maxPeriodsPerWeek: 18,
    active: true,
  };

  const facultyOverloaded: Faculty = {
    id: 'fac_overloaded',
    departmentId: 'dept_cs',
    facultyCode: 'CSE005',
    name: 'Prof. Overloaded',
    subjectIds: [],
    sectionIds: [],
    availability: [],
    preferredSlots: [],
    maxPeriodsPerDay: 1, // Already teaching 1 period today -> Adding another would exceed cap
    maxPeriodsPerWeek: 18,
    active: true,
  };

  const facultyPreferenceBlocked: Faculty = {
    id: 'fac_preference',
    departmentId: 'dept_cs',
    facultyCode: 'CSE006',
    name: 'Prof. Preference Off',
    subjectIds: [],
    sectionIds: [],
    availability: [{ dayIndex: 0, startPeriod: 1, durationPeriods: 1 }], // Blocked on day 0, period 1
    preferredSlots: [],
    maxPeriodsPerDay: 4,
    maxPeriodsPerWeek: 18,
    active: true,
  };

  const sectionA: Section = {
    id: 'sec_3a',
    departmentId: 'dept_cs',
    name: 'CSE III Year - Sec A',
    year: 3,
    semester: 5,
    studentCount: 60,
    subjectRequirements: [{ id: 'req_algo_a', subjectId: 'sub_algo', sessionsPerWeek: 4 }],
    active: true,
  };

  const sectionB: Section = {
    id: 'sec_3b',
    departmentId: 'dept_cs',
    name: 'CSE III Year - Sec B',
    year: 3,
    semester: 5,
    studentCount: 60,
    subjectRequirements: [],
    active: true,
  };

  const targetEntry: TimetableEntry = {
    id: 'entry_target',
    sectionId: 'sec_3a',
    subjectId: 'sub_algo',
    facultyId: 'fac_original',
    dayIndex: 0, // Monday
    startPeriod: 1, // Period 2
    durationPeriods: 1,
    roomId: null,
    source: 'GENERATED',
    revision: 1,
  };

  const timetable: Timetable = {
    id: 'tt_1',
    departmentId: 'dept_cs',
    configurationSnapshot: { fingerprint: 'abc' } as any,
    entries: [
      targetEntry,
      // Busy faculty is teaching Sec B at the exact same day 0, period 1
      {
        id: 'entry_busy_session',
        sectionId: 'sec_3b',
        subjectId: 'sub_algo',
        facultyId: 'fac_busy',
        dayIndex: 0,
        startPeriod: 1,
        durationPeriods: 1,
        roomId: null,
        source: 'GENERATED',
        revision: 1,
      },
      // Overloaded faculty is teaching Sec B at day 0, period 0
      {
        id: 'entry_overloaded_session',
        sectionId: 'sec_3b',
        subjectId: 'sub_algo',
        facultyId: 'fac_overloaded',
        dayIndex: 0,
        startPeriod: 0,
        durationPeriods: 1,
        roomId: null,
        source: 'GENERATED',
        revision: 1,
      },
    ],
    status: 'VALID',
    validationSummary: null as any,
    generationMetadata: null,
    revision: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  } as unknown as Timetable;

  it('ranks candidates into correct tiers', () => {
    const candidates = findSubstitutesForEntry({
      timetable,
      entry: targetEntry,
      subjects: [subjectAlgo],
      faculty: [
        facultyOriginal,
        facultyBestMatch,
        facultyGeneralAvailable,
        facultyBusy,
        facultyOverloaded,
        facultyPreferenceBlocked,
      ],
      sections: [sectionA, sectionB],
      department,
    });

    // Original faculty is excluded
    expect(candidates.find((c) => c.faculty.id === 'fac_original')).toBeUndefined();

    // 1st tier candidate should be BEST_MATCH (Prof. Best Match)
    const best = candidates.find((c) => c.faculty.id === 'fac_prof_b');
    expect(best).toBeDefined();
    expect(best?.tier).toBe('BEST_MATCH');
    expect(best?.isEligible).toBe(true);

    // 2nd tier candidate should be AVAILABLE (Prof. General)
    const available = candidates.find((c) => c.faculty.id === 'fac_general');
    expect(available).toBeDefined();
    expect(available?.tier).toBe('AVAILABLE');
    expect(available?.isEligible).toBe(false);

    // Overloaded candidate should be OVERLOADED
    const overloaded = candidates.find((c) => c.faculty.id === 'fac_overloaded');
    expect(overloaded).toBeDefined();
    expect(overloaded?.tier).toBe('OVERLOADED');
    expect(overloaded?.wouldExceedDailyCap).toBe(true);

    // Preference blocked candidate should be UNAVAILABLE_PREFERENCE
    const pref = candidates.find((c) => c.faculty.id === 'fac_preference');
    expect(pref).toBeDefined();
    expect(pref?.tier).toBe('UNAVAILABLE_PREFERENCE');
    expect(pref?.isUnavailablePreference).toBe(true);

    // Busy candidate should be BUSY
    const busy = candidates.find((c) => c.faculty.id === 'fac_busy');
    expect(busy).toBeDefined();
    expect(busy?.tier).toBe('BUSY');
    expect(busy?.isBusy).toBe(true);
    expect(busy?.busyDetails).toContain('CSE III Year - Sec B');

    // Sorting order: BEST_MATCH first, then AVAILABLE, then OVERLOADED, then UNAVAILABLE_PREFERENCE, then BUSY
    expect(candidates[0].tier).toBe('BEST_MATCH');
    expect(candidates[1].tier).toBe('AVAILABLE');
  });

  it('generates accurate official substitution slip memo data', () => {
    const slip = generateSubstitutionSlipData({
      collegeName: 'Apex Institute of Technology',
      academicYear: '2026-27',
      department,
      absentFaculty: facultyOriginal,
      substituteFaculty: facultyBestMatch,
      subject: subjectAlgo,
      section: sectionA,
      dayIndex: 0,
      startPeriod: 1,
      durationPeriods: 1,
    });

    expect(slip.collegeName).toBe('Apex Institute of Technology');
    expect(slip.departmentName).toBe('Computer Science and Engineering');
    expect(slip.absentFacultyName).toBe('Prof. Original');
    expect(slip.substituteFacultyName).toBe('Prof. Best Match');
    expect(slip.subjectCode).toBe('CS301');
    expect(slip.sectionName).toBe('CSE III Year - Sec A');
    expect(slip.dayOfWeek).toBe('MONDAY');
    expect(slip.periodLabel).toBe('Period 2');
    expect(slip.timeSlot).toBe('09:50 AM – 10:40 AM');
  });
});
