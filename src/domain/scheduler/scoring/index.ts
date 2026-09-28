import type { SoftConstraintWeights, TimetableEntry } from '../../models';
import type { SessionUnit } from '../session-expansion';

export interface ScoreInput {
  entries: TimetableEntry[];
  periodsPerDay: number;
  workingDaysCount: number;
  weights: SoftConstraintWeights;
}

interface ScoreComponent {
  value: number; // normalized 0..1, higher = better
  weight: number;
}

/**
 * Soft-constraint scoring (§13, §78). Pure function; consumes explicit weights.
 * Higher total = better schedule quality.
 */
export function scoreSchedule(input: ScoreInput): { total: number; components: Record<string, number> } {
  const components: Record<string, ScoreComponent> = {
    subjectDistribution: {
      value: distributionScore(input),
      weight: input.weights.subjectDistribution,
    },
    sectionBalance: {
      value: dailyBalanceScore(input),
      weight: input.weights.sectionBalance,
    },
    facultyBalance: {
      value: facultyBalanceScore(input),
      weight: input.weights.facultyBalance,
    },
    gapReduction: { value: gapScore(input), weight: input.weights.gapReduction },
    labDistribution: { value: labDistributionScore(input), weight: input.weights.labDistribution },
    preferenceSatisfaction: {
      value: 1, // no explicit preferences configured in most workspaces; neutral
      weight: input.weights.preferenceSatisfaction,
    },
  };

  let weighted = 0;
  let totalWeight = 0;
  const out: Record<string, number> = {};
  for (const [name, c] of Object.entries(components)) {
    weighted += c.value * c.weight;
    totalWeight += c.weight;
    out[name] = Number(c.value.toFixed(4));
  }
  return { total: totalWeight > 0 ? Number((weighted / totalWeight).toFixed(4)) : 0, components: out };
}

/** S1: spread same-subject sessions across distinct days. */
function distributionScore(input: ScoreInput): number {
  const bySectionSubject = new Map<string, Set<number>>();
  for (const e of input.entries) {
    const key = `${e.sectionId}:${e.subjectId}`;
    const days = bySectionSubject.get(key) ?? new Set<number>();
    days.add(e.dayIndex);
    bySectionSubject.set(key, days);
  }
  let sum = 0;
  let count = 0;
  for (const days of bySectionSubject.values()) {
    sum += Math.min(1, days.size / Math.max(1, input.workingDaysCount));
    count++;
  }
  return count === 0 ? 1 : sum / count;
}

/** S2: penalize sections with heavily overloaded days. */
function dailyBalanceScore(input: ScoreInput): number {
  const load = new Map<string, number>(); // section:day → periods
  for (const e of input.entries) {
    for (let p = e.startPeriod; p < e.startPeriod + e.durationPeriods; p++) {
      const key = `${e.sectionId}:${e.dayIndex}`;
      load.set(key, (load.get(key) ?? 0) + 1);
    }
  }
  const bySection = new Map<string, number[]>();
  for (const [key, periods] of load) {
    const sectionId = key.slice(0, key.lastIndexOf(':'));
    const arr = bySection.get(sectionId) ?? [];
    arr.push(periods);
    bySection.set(sectionId, arr);
  }
  let sum = 0;
  let count = 0;
  for (const loads of bySection.values()) {
    if (loads.length < 2) {
      sum += 1;
      count++;
      continue;
    }
    const mean = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((a, b) => a + (b - mean) ** 2, 0) / loads.length;
    const maxVar = mean > 0 ? Math.min(1, (input.periodsPerDay - mean) ** 2) : 1;
    sum += maxVar > 0 ? 1 - Math.min(1, variance / maxVar) : 1;
    count++;
  }
  return count === 0 ? 1 : sum / count;
}

/** S3: spread faculty load across days. */
function facultyBalanceScore(input: ScoreInput): number {
  const load = new Map<string, number>(); // faculty:day → periods
  for (const e of input.entries) {
    for (let p = e.startPeriod; p < e.startPeriod + e.durationPeriods; p++) {
      const key = `${e.facultyId}:${e.dayIndex}`;
      load.set(key, (load.get(key) ?? 0) + 1);
    }
  }
  const byFaculty = new Map<string, number[]>();
  for (const [key, periods] of load) {
    const fid = key.slice(0, key.lastIndexOf(':'));
    const arr = byFaculty.get(fid) ?? [];
    arr.push(periods);
    byFaculty.set(fid, arr);
  }
  let sum = 0;
  let count = 0;
  for (const loads of byFaculty.values()) {
    if (loads.length < 2) {
      sum += 1;
      count++;
      continue;
    }
    const mean = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((a, b) => a + (b - mean) ** 2, 0) / loads.length;
    sum += 1 - Math.min(1, variance / Math.max(1, mean * mean));
    count++;
  }
  return count === 0 ? 1 : sum / count;
}

/** S6: fraction of section-days without isolated gaps. */
function gapScore(input: ScoreInput): number {
  const occupied = new Map<string, Set<number>>(); // section:day → periods
  for (const e of input.entries) {
    for (let p = e.startPeriod; p < e.startPeriod + e.durationPeriods; p++) {
      const key = `${e.sectionId}:${e.dayIndex}`;
      const set = occupied.get(key) ?? new Set<number>();
      set.add(p);
      occupied.set(key, set);
    }
  }
  let cleanDays = 0;
  let total = 0;
  for (const set of occupied.values()) {
    const periods = [...set].sort((a, b) => a - b);
    let gaps = 0;
    for (let i = 1; i < periods.length; i++) {
      if (periods[i] - periods[i - 1] > 1) gaps++;
    }
    if (gaps === 0) cleanDays++;
    total++;
  }
  return total === 0 ? 1 : cleanDays / total;
}

/** S8: labs spread across distinct days per section. */
function labDistributionScore(input: ScoreInput): number {
  const labs = input.entries.filter((e) => e.durationPeriods > 1);
  if (labs.length === 0) return 1;
  const bySectionDay = new Map<string, Set<number>>();
  for (const e of labs) {
    const days = bySectionDay.get(e.sectionId) ?? new Set<number>();
    days.add(e.dayIndex);
    bySectionDay.set(e.sectionId, days);
  }
  let sum = 0;
  for (const [sectionId, days] of bySectionDay) {
    const sectionLabs = labs.filter((e) => e.sectionId === sectionId).length;
    sum += Math.min(1, days.size / sectionLabs);
  }
  return sum / bySectionDay.size;
}

/** Quick per-candidate score delta used during search (§8 candidate ordering). */
export function scoreCandidatePlacement(
  entry: TimetableEntry,
  existing: TimetableEntry[],
  periodsPerDay: number,
): number {
  // Prefer earlier days/periods slightly and avoid gaps next to existing entries.
  let score = 0;
  score -= entry.dayIndex * 0.1;
  score -= entry.startPeriod * 0.05;
  const neighborBefore = existing.some(
    (e) =>
      e.sectionId === entry.sectionId &&
      e.dayIndex === entry.dayIndex &&
      e.startPeriod + e.durationPeriods === entry.startPeriod,
  );
  const neighborAfter = existing.some(
    (e) =>
      e.sectionId === entry.sectionId &&
      e.dayIndex === entry.dayIndex &&
      entry.startPeriod + entry.durationPeriods === e.startPeriod,
  );
  if (neighborBefore || neighborAfter) score += 1;
  if (entry.startPeriod + entry.durationPeriods > periodsPerDay) score -= 10;
  return score;
}

export type { SessionUnit };
