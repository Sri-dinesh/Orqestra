import { describe, expect, it } from 'vitest';
import {
  allDaySplitPositions,
  analyzeFeasibility,
  computeLabCapacity,
  computeUsableCapacity,
  daySpecificBlockedTeaching,
} from '@/domain/scheduler/feasibility';
import { datasetMinimal } from '../../fixtures/datasets';
import type { Break } from '@/domain/models';

const lunch = (dayIndex: number | null, startPeriod = 4): Break => ({
  id: `break_${dayIndex ?? 'all'}`,
  name: 'Lunch Break',
  dayIndex,
  startPeriod,
  durationPeriods: 1,
});

describe('break-aware preflight capacity', () => {
  it('does not subtract all-day breaks from usable capacity (they add columns)', () => {
    // 7 teaching periods × 7 days stay fully teachable with a daily lunch column.
    expect(computeUsableCapacity(7, 7, [lunch(null)])).toBe(49);
    expect(computeUsableCapacity(7, 7, [])).toBe(49);
  });

  it('subtracts day-specific breaks from their day only', () => {
    // One assembly break on a single day of a 5 × 6 grid.
    expect(computeUsableCapacity(5, 6, [lunch(2, 2)])).toBe(29);
    expect(daySpecificBlockedTeaching(2, 6, [lunch(2, 2)])).toEqual(new Set([2]));
    expect(daySpecificBlockedTeaching(0, 6, [lunch(2, 2)])).toEqual(new Set());
  });

  it('ignores out-of-range day-specific break periods instead of going negative', () => {
    const bogus: Break = { id: 'b', name: 'Bogus', dayIndex: 1, startPeriod: 99, durationPeriods: 4 };
    expect(computeUsableCapacity(2, 4, [bogus])).toBe(8);
  });

  it('splits lab runs at all-day break columns', () => {
    // Lunch after P4: runs [P1–P4] and [P5–P7] fit 2 + 1 two-period lab blocks.
    expect(allDaySplitPositions(7, [lunch(null)])).toEqual([4]);
    expect(computeLabCapacity(7, 7, [lunch(null)])).toBe(21);
    // No breaks: floor(7 / 2) blocks per day.
    expect(computeLabCapacity(7, 7, [])).toBe(21);
    // Lunch after P2 of 4 teaching periods: runs [P1–P2] and [P3–P4] fit 1 + 1.
    expect(computeLabCapacity(3, 4, [lunch(null, 2)])).toBe(6);
  });

  it('reports no slack when requirements exactly fill the teachable periods', () => {
    const ds = datasetMinimal();
    // Minimal requires 4 + 3 + 1×2 = 9 periods; a 3 day × 3 teaching-period
    // grid with a daily lunch column has exactly 9 teachable periods.
    const department = {
      ...ds.department,
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY'] as const,
      periodsPerDay: 3,
    };
    const exact = analyzeFeasibility({
      department: { ...department, workingDays: [...department.workingDays] },
      sections: ds.sections,
      subjects: ds.subjects,
      faculty: ds.faculty,
      breaks: [lunch(null, 1)],
    });
    expect(exact.sectionReports[0].weeklyCapacity).toBe(9);
    expect(exact.sectionReports[0].labCapacity).toBe(3);
    expect(exact.verdict).toBe('READY');
    expect(exact.diagnostics.find((d) => d.code === 'SECTION_CAPACITY_SLACK')).toBeUndefined();
  });

  it('keeps warning about genuine slack even when breaks exist', () => {
    const ds = datasetMinimal();
    // 5 days × 6 teaching periods with a daily lunch column → 30 teachable; requires 9.
    const result = analyzeFeasibility({
      department: ds.department,
      sections: ds.sections,
      subjects: ds.subjects,
      faculty: ds.faculty,
      breaks: [lunch(null)],
    });
    expect(result.verdict).toBe('READY');
    const slack = result.diagnostics.filter((d) => d.code === 'SECTION_CAPACITY_SLACK');
    expect(slack).toHaveLength(1);
    expect(slack[0].message).toContain('requires 9 of 30');
  });

  it('treats a day-specific break as lost teachable time on that day', () => {
    const ds = datasetMinimal();
    // 2 days × 5 teaching periods = 10, minus one Tuesday block = 9 = required.
    const department = {
      ...ds.department,
      workingDays: ['MONDAY', 'TUESDAY'] as const,
      periodsPerDay: 5,
    };
    const result = analyzeFeasibility({
      department: { ...department, workingDays: [...department.workingDays] },
      sections: ds.sections,
      subjects: ds.subjects,
      faculty: ds.faculty,
      breaks: [lunch(1, 2)],
    });
    expect(result.sectionReports[0].weeklyCapacity).toBe(9);
    expect(result.verdict).toBe('READY');
    expect(result.diagnostics.find((d) => d.code === 'SECTION_CAPACITY_SLACK')).toBeUndefined();
  });
});
