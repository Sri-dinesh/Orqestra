import type { Break, PeriodTiming } from '@/domain/models';

/**
 * Parses a time string into minutes from midnight (0..1439).
 * Supports formats like "09:00 AM", "9:00 AM", "1:30 PM", "13:30", "9:00", etc.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim().toUpperCase();
  if (!trimmed) return null;

  // Regex matching "HH:MM [AM|PM]" or "H:MM [AM|PM]"
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3];

  if (isNaN(hours) || isNaN(minutes) || minutes < 0 || minutes >= 60) return null;

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === 'AM') {
      if (hours === 12) hours = 0;
    } else if (meridiem === 'PM') {
      if (hours !== 12) hours += 12;
    }
  } else {
    // 24-hour format
    if (hours < 0 || hours >= 24) return null;
  }

  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight into 12-hour "hh:mm AM/PM" string.
 */
export function formatMinutesToTime(totalMinutes: number): string {
  // Normalize within 24h
  const mins = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours24 = Math.floor(mins / 60);
  const minutes = mins % 60;

  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;

  const hh = hours12 < 10 ? `0${hours12}` : `${hours12}`;
  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return `${hh}:${mm} ${meridiem}`;
}

/**
 * Computes duration in minutes between start and end time strings.
 */
export function calculateDurationMinutes(startStr: string, endStr: string): number | null {
  const start = parseTimeToMinutes(startStr);
  const end = parseTimeToMinutes(endStr);
  if (start === null || end === null) return null;
  const diff = end - start;
  return diff >= 0 ? diff : diff + 1440;
}

/**
 * Shifts both start and end times by delta minutes.
 */
export function shiftPeriodTiming(timing: PeriodTiming, deltaMinutes: number): PeriodTiming {
  const start = parseTimeToMinutes(timing.start);
  const end = parseTimeToMinutes(timing.end);

  return {
    start: start !== null ? formatMinutesToTime(start + deltaMinutes) : timing.start,
    end: end !== null ? formatMinutesToTime(end + deltaMinutes) : timing.end,
  };
}

export interface AutoTimingOptions {
  periodsCount: number;
  startTime: string; // e.g. "09:00 AM"
  periodDurationMinutes: number; // e.g. 50
  breaks?: Break[];
  accountForBreaks?: boolean;
}

/**
 * Sequentially computes start and end times for all periods in a day,
 * optionally automatically spacing around breaks (Lunch, Short Break).
 */
export function autoGeneratePeriodTimings(options: AutoTimingOptions): PeriodTiming[] {
  const {
    periodsCount,
    startTime,
    periodDurationMinutes,
    breaks = [],
    accountForBreaks = true,
  } = options;

  const initialMinutes = parseTimeToMinutes(startTime) ?? 9 * 60; // default 09:00 AM
  const duration = Math.max(10, Math.min(180, periodDurationMinutes || 50));
  const timings: PeriodTiming[] = [];

  let currentCursor = initialMinutes;

  for (let i = 0; i < periodsCount; i++) {
    // Check if any break is placed before this period (i.e. startPeriod === i)
    if (accountForBreaks && i > 0) {
      const precedingBreaks = breaks.filter((b) => b.startPeriod === i);
      for (const b of precedingBreaks) {
        if (b.startTime && b.endTime) {
          const bStart = parseTimeToMinutes(b.startTime);
          const bEnd = parseTimeToMinutes(b.endTime);
          if (bStart !== null && bEnd !== null && bEnd > bStart) {
            // Fast-forward cursor to break end time
            currentCursor = Math.max(currentCursor, bEnd);
            continue;
          }
        }
        // Fallback break duration if explicit times not set:
        // Lunch is typically ~50m, short break ~15m
        const isLunch = b.name.toLowerCase().includes('lunch');
        const defaultBreakMins = isLunch ? 50 : 15;
        currentCursor += defaultBreakMins;
      }
    }

    const startStr = formatMinutesToTime(currentCursor);
    const endMinutes = currentCursor + duration;
    const endStr = formatMinutesToTime(endMinutes);

    timings.push({
      start: startStr,
      end: endStr,
    });

    currentCursor = endMinutes;
  }

  return timings;
}

/**
 * Validates a list of period timings and returns issues or warnings.
 */
export function validatePeriodTimings(timings: PeriodTiming[]): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  for (let i = 0; i < timings.length; i++) {
    const t = timings[i];
    if (!t) continue;

    if (!t.start && !t.end) continue; // Unconfigured is acceptable

    if ((t.start && !t.end) || (!t.start && t.end)) {
      warnings.push(`Period ${i + 1} has an incomplete time range.`);
      continue;
    }

    const startMins = parseTimeToMinutes(t.start);
    const endMins = parseTimeToMinutes(t.end);

    if (startMins === null || endMins === null) {
      warnings.push(`Period ${i + 1} has an invalid time format (expected e.g. "09:00 AM").`);
      continue;
    }

    if (endMins <= startMins) {
      warnings.push(`Period ${i + 1} end time (${t.end}) must be after start time (${t.start}).`);
    }

    // Check overlap with previous period
    if (i > 0 && timings[i - 1]?.end) {
      const prevEnd = parseTimeToMinutes(timings[i - 1].end);
      if (prevEnd !== null && startMins < prevEnd) {
        warnings.push(`Period ${i + 1} starts (${t.start}) before Period ${i} ends (${timings[i - 1].end}).`);
      }
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
