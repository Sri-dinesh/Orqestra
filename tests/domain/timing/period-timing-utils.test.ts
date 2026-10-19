import { describe, expect, it } from 'vitest';
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  calculateDurationMinutes,
  shiftPeriodTiming,
  autoGeneratePeriodTimings,
  validatePeriodTimings,
} from '@/domain/timing/period-timing-utils';
import type { Break } from '@/domain/models';

describe('period-timing-utils', () => {
  it('correctly parses 12h and 24h times to minutes from midnight', () => {
    expect(parseTimeToMinutes('09:00 AM')).toBe(540);
    expect(parseTimeToMinutes('9:30 AM')).toBe(570);
    expect(parseTimeToMinutes('12:00 PM')).toBe(720);
    expect(parseTimeToMinutes('12:50 PM')).toBe(770);
    expect(parseTimeToMinutes('01:40 PM')).toBe(820);
    expect(parseTimeToMinutes('12:00 AM')).toBe(0);
    expect(parseTimeToMinutes('11:59 PM')).toBe(1439);
    expect(parseTimeToMinutes('14:30')).toBe(870);
    expect(parseTimeToMinutes('')).toBeNull();
    expect(parseTimeToMinutes('invalid')).toBeNull();
  });

  it('formats minutes from midnight to standard 12h time string', () => {
    expect(formatMinutesToTime(540)).toBe('09:00 AM');
    expect(formatMinutesToTime(720)).toBe('12:00 PM');
    expect(formatMinutesToTime(770)).toBe('12:50 PM');
    expect(formatMinutesToTime(820)).toBe('01:40 PM');
    expect(formatMinutesToTime(0)).toBe('12:00 AM');
  });

  it('calculates duration in minutes accurately', () => {
    expect(calculateDurationMinutes('09:10 AM', '10:00 AM')).toBe(50);
    expect(calculateDurationMinutes('10:00 AM', '10:45 AM')).toBe(45);
    expect(calculateDurationMinutes('11:00 AM', '12:00 PM')).toBe(60);
    expect(calculateDurationMinutes('', '10:00 AM')).toBeNull();
  });

  it('shifts period times forward and backward by delta minutes', () => {
    const shifted = shiftPeriodTiming({ start: '09:00 AM', end: '09:50 AM' }, 10);
    expect(shifted).toEqual({ start: '09:10 AM', end: '10:00 AM' });

    const shiftedBack = shiftPeriodTiming({ start: '09:00 AM', end: '09:50 AM' }, -15);
    expect(shiftedBack).toEqual({ start: '08:45 AM', end: '09:35 AM' });
  });

  it('auto-generates sequential period timings without breaks', () => {
    const timings = autoGeneratePeriodTimings({
      periodsCount: 4,
      startTime: '09:00 AM',
      periodDurationMinutes: 50,
      accountForBreaks: false,
    });

    expect(timings.length).toBe(4);
    expect(timings[0]).toEqual({ start: '09:00 AM', end: '09:50 AM' });
    expect(timings[1]).toEqual({ start: '09:50 AM', end: '10:40 AM' });
    expect(timings[2]).toEqual({ start: '10:40 AM', end: '11:30 AM' });
    expect(timings[3]).toEqual({ start: '11:30 AM', end: '12:20 PM' });
  });

  it('auto-generates period timings respecting configured breaks', () => {
    const breaks: Break[] = [
      {
        id: 'break_1',
        name: 'Short Break',
        dayIndex: null,
        startPeriod: 2, // after P2
        durationPeriods: 1,
        startTime: '10:40 AM',
        endTime: '10:55 AM', // 15m break
      },
      {
        id: 'break_2',
        name: 'Lunch Break',
        dayIndex: null,
        startPeriod: 4, // after P4
        durationPeriods: 1,
        startTime: '12:35 PM',
        endTime: '01:25 PM', // 50m lunch
      },
    ];

    const timings = autoGeneratePeriodTimings({
      periodsCount: 6,
      startTime: '09:00 AM',
      periodDurationMinutes: 50,
      breaks,
      accountForBreaks: true,
    });

    expect(timings[0]).toEqual({ start: '09:00 AM', end: '09:50 AM' });
    expect(timings[1]).toEqual({ start: '09:50 AM', end: '10:40 AM' });
    // P3 starts after Short Break (10:55 AM)
    expect(timings[2]).toEqual({ start: '10:55 AM', end: '11:45 AM' });
    expect(timings[3]).toEqual({ start: '11:45 AM', end: '12:35 PM' });
    // P5 starts after Lunch Break (01:25 PM)
    expect(timings[4]).toEqual({ start: '01:25 PM', end: '02:15 PM' });
    expect(timings[5]).toEqual({ start: '02:15 PM', end: '03:05 PM' });
  });

  it('validates period timings and detects invalid order or negative durations', () => {
    const valid = [
      { start: '09:00 AM', end: '09:50 AM' },
      { start: '09:50 AM', end: '10:40 AM' },
    ];
    expect(validatePeriodTimings(valid).isValid).toBe(true);

    const reversed = [{ start: '10:00 AM', end: '09:00 AM' }];
    const res1 = validatePeriodTimings(reversed);
    expect(res1.isValid).toBe(false);
    expect(res1.warnings.some((w) => w.includes('must be after start time'))).toBe(true);

    const overlapping = [
      { start: '09:00 AM', end: '10:00 AM' },
      { start: '09:50 AM', end: '10:40 AM' },
    ];
    const res2 = validatePeriodTimings(overlapping);
    expect(res2.isValid).toBe(false);
    expect(res2.warnings.some((w) => w.includes('before Period 1 ends'))).toBe(true);
  });
});
