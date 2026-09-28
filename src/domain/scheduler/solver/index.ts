import type {
  Department,
  Faculty,
  GenerationDiagnostic,
  GenerationMetrics,
  Section,
  Subject,
  TimetableEntry,
} from '../../models';
import { generateId } from '../../models/ids';
import { OccupancyIndex } from '../occupancy';
import { createSeededRng } from '../seeded-rng';
import { expandRequirements } from '../session-expansion';
import type { SessionUnit } from '../session-expansion';
import { scoreCandidatePlacement } from '../scoring';

export interface SolverInput {
  department: Department;
  sections: Section[];
  subjects: Subject[];
  faculty: Faculty[];
  seed: number;
  maxDurationMs: number;
  maxExploredNodes: number;
  /** Optional cap on same-subject sessions per section per day. */
  maxSessionsPerSubjectPerDay: number | null;
  /** Optional cap on lab blocks per section per day. */
  maxLabSessionsPerSectionPerDay: number | null;
}

export interface CancellationToken {
  isCancelled(): boolean;
}

export class BudgetExceededError extends Error {
  readonly kind: 'TIMEOUT' | 'NODES';
  constructor(kind: 'TIMEOUT' | 'NODES') {
    super(kind === 'TIMEOUT' ? 'Search duration budget exceeded.' : 'Search node budget exceeded.');
    this.kind = kind;
  }
}

export interface SolverOutput {
  status: 'COMPLETED' | 'IMPOSSIBLE' | 'TIMEOUT' | 'CANCELLED';
  entries: TimetableEntry[] | null;
  metrics: GenerationMetrics;
  diagnostics: GenerationDiagnostic[];
}

interface Candidate {
  dayIndex: number;
  startPeriod: number;
  facultyId: string;
  score: number;
}

const DAY_MS = 0;

/**
 * Constraint-based backtracking scheduler (§10, §76).
 * Controlled mutation with explicit rollback; occupancy index gives ~O(1) slot checks.
 */
export function solveSchedule(
  input: SolverInput,
  cancellation: CancellationToken,
): SolverOutput {
  const start = Date.now();
  const preStart = start;
  const expanded = expandRequirements({ sections: input.sections, subjects: input.subjects });
  // Section-major ordering: finish one section (labs first) before the next.
  // Sections only interact through shared faculty, so this converts the search
  // into sequential near-independent sub-problems — critical for tightly
  // packed (fully-occupied) timetables where global lab-first ordering thrashes.
  const sessions = [...expanded].sort((a, b) =>
    a.sectionId !== b.sectionId
      ? a.sectionId < b.sectionId
        ? -1
        : 1
      : a.durationPeriods !== b.durationPeriods
        ? b.durationPeriods - a.durationPeriods
        : a.subjectId !== b.subjectId
          ? a.subjectId < b.subjectId
            ? -1
            : 1
          : a.sessionIndex - b.sessionIndex,
  );
  const facultyById = new Map(input.faculty.map((f) => [f.id, f]));

  const metrics: GenerationMetrics = {
    durationMs: 0,
    preprocessingMs: 0,
    searchMs: 0,
    exploredNodes: 0,
    backtrackCount: 0,
    candidateEvaluations: 0,
    sessionsScheduled: 0,
    finalScore: null,
    seed: input.seed,
  };

  const diagnostics: GenerationDiagnostic[] = [];

  // Pre-check: any session with zero eligible faculty is unschedulable.
  for (const s of sessions) {
    if (s.eligibleFacultyIds.length === 0) {
      diagnostics.push({
        code: 'SESSION_NO_FACULTY',
        message: `Session "${s.id}" has no eligible faculty.`,
        sectionIds: [s.sectionId],
        subjectIds: [s.subjectId],
        facultyIds: [],
        suggestions: ['Assign eligible faculty to this subject.'],
      });
    }
  }
  if (diagnostics.length > 0) {
    metrics.preprocessingMs = Date.now() - preStart;
    metrics.durationMs = Date.now() - start;
    return { status: 'IMPOSSIBLE', entries: null, metrics, diagnostics };
  }

  const periodsPerDay = input.department.periodsPerDay;
  const dayCount = input.department.workingDays.length;
  const maxSessionsPerSubjectPerDay = input.maxSessionsPerSubjectPerDay ?? null;
  const maxLabSessionsPerSectionPerDay = input.maxLabSessionsPerSectionPerDay ?? null;
  const occupancy = new OccupancyIndex();
  const placed: TimetableEntry[] = [];
  const rollbacks: Array<() => void> = [];
  const rng = createSeededRng(input.seed);
  void rng; // reserved for seeded tie-breaking
  const deadline = start + input.maxDurationMs;
  let searchStart = 0;

  const checkCancellationAndBudget = (): void => {
    metrics.exploredNodes++;
    if (cancellation.isCancelled()) {
      throw new CancellationSignal();
    }
    if (metrics.exploredNodes > input.maxExploredNodes) {
      throw new BudgetExceededError('NODES');
    }
    if ((metrics.exploredNodes & 0x3ff) === 0 && Date.now() > deadline) {
      throw new BudgetExceededError('TIMEOUT');
    }
  };

  searchStart = Date.now();

  /**
   * MRV (minimum remaining values) dynamic ordering (§7/§77): among the next
   * MRV_WINDOW unscheduled sessions, place the one with the fewest feasible
   * placements first. Critical for tightly packed schedules where static
   * ordering thrashes. A count of 0 prunes the branch immediately.
   */
  const MRV_WINDOW = 24;
  const MRV_COUNT_CAP = 32;

  function countFeasiblePlacements(session: SessionUnit): number {
    let count = 0;
    for (let day = 0; day < dayCount && count < MRV_COUNT_CAP; day++) {
      if (maxSessionsPerSubjectPerDay !== null) {
        let sameDay = 0;
        for (const e of placed) {
          if (e.sectionId === session.sectionId && e.subjectId === session.subjectId && e.dayIndex === day) sameDay++;
        }
        if (sameDay >= maxSessionsPerSubjectPerDay) continue;
      }
      const maxStart = periodsPerDay - session.durationPeriods;
      for (let p = 0; p <= maxStart && count < MRV_COUNT_CAP; p++) {
        const periods: number[] = [];
        for (let q = p; q < p + session.durationPeriods; q++) periods.push(q);
        if (!occupancy.isSectionFree(session.sectionId, day, periods)) continue;
        for (const fid of session.eligibleFacultyIds) {
          if (!facultyById.get(fid)?.active) continue;
          if (!occupancy.isFacultyFree(fid, day, periods)) continue;
          count++;
          if (count >= MRV_COUNT_CAP) break;
        }
      }
    }
    return count;
  }

  function pickSessionIndex(from: number): number {
    let best = from;
    let bestCount = Number.POSITIVE_INFINITY;
    const end = Math.min(searchOrder.length, from + MRV_WINDOW);
    for (let j = from; j < end; j++) {
      const c = countFeasiblePlacements(searchOrder[j]);
      if (c === 0) return j; // dead end — fail fast
      if (c < bestCount) {
        bestCount = c;
        best = j;
      }
    }
    return best;
  }

  /** Recursive backtracking over remaining sessions (most-constrained first). */
  function backtrack(index: number): boolean {
    if (index >= searchOrder.length) return true;
    checkCancellationAndBudget();

    const pick = pickSessionIndex(index);
    const session = searchOrder[pick];
    // Bring the chosen session to the current position; restore after recursion.
    searchOrder[pick] = searchOrder[index];
    searchOrder[index] = session;

    const candidates = generateCandidates(session);
    for (const candidate of candidates) {
      metrics.candidateEvaluations++;
      checkCancellationAndBudget();

      const entry: TimetableEntry = {
        id: generateId('entry'),
        sectionId: session.sectionId,
        subjectId: session.subjectId,
        facultyId: candidate.facultyId,
        dayIndex: candidate.dayIndex,
        startPeriod: candidate.startPeriod,
        durationPeriods: session.durationPeriods,
        source: 'GENERATED',
        revision: 0,
      };
      const periods = occupiedPeriods(entry);
      if (!occupancy.isSectionFree(entry.sectionId, entry.dayIndex, periods)) continue;
      if (!occupancy.isFacultyFree(entry.facultyId, entry.dayIndex, periods)) continue;
      if (!facultyWithinLimits(entry)) continue;
      if (!subjectPerDayWithinLimits(entry)) continue;
      if (!labPerDayWithinLimits(entry)) continue;


      // Apply + propagate
      placed.push(entry);
      rollbacks.push(occupancy.apply(entry));
      recordLabUsage(entry);

      if (backtrack(index + 1)) return true;

      // Rollback
      unrecordLabUsage(entry);
      rollbacks.pop()!();
      placed.pop();
      metrics.backtrackCount++;
    }

    // Restore ordering
    searchOrder[index] = searchOrder[pick];
    searchOrder[pick] = session;
    return false;
  }

  /** Re-select most constrained remaining session each step (dynamic ordering). */
  let searchOrder: SessionUnit[] = sessions;

  function generateCandidates(session: SessionUnit): Candidate[] {
    const candidates: Candidate[] = [];
    for (let day = 0; day < dayCount; day++) {
      const maxStart = periodsPerDay - session.durationPeriods;
      for (let p = 0; p <= maxStart; p++) {
        for (const fid of session.eligibleFacultyIds) {
          if (!facultyById.get(fid)?.active) continue;
          candidates.push({
            dayIndex: day,
            startPeriod: p,
            facultyId: fid,
            score: 0,
          });
        }
      }
    }
    // Deterministic heuristic ordering: soft score, day/period, faculty stability.
    candidates.sort((a, b) => {
      const sa = candidateScore(session, a);
      const sb = candidateScore(session, b);
      if (sa !== sb) return sb - sa;
      if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
      if (a.startPeriod !== b.startPeriod) return a.startPeriod - b.startPeriod;
      return a.facultyId < b.facultyId ? -1 : 1;
    });
    return candidates;
  }

  function candidateScore(session: SessionUnit, c: Candidate): number {
    const pseudo: TimetableEntry = {
      id: 'pseudo',
      sectionId: session.sectionId,
      subjectId: session.subjectId,
      facultyId: c.facultyId,
      dayIndex: c.dayIndex,
      startPeriod: c.startPeriod,
      durationPeriods: session.durationPeriods,
      source: 'GENERATED',
      revision: 0,
    };
    let score = scoreCandidatePlacement(pseudo, placed, periodsPerDay);
    // Spread faculty load: prefer faculty with lower current load.
    const load = placed.filter((e) => e.facultyId === c.facultyId).length;
    score -= load * 0.2;
    // Prefer distributing same-subject sessions across days.
    const sameDayCount = placed.filter(
      (e) => e.sectionId === session.sectionId && e.subjectId === session.subjectId && e.dayIndex === c.dayIndex,
    ).length;
    score -= sameDayCount * 0.8;
    // Balance the section's daily load: strongly prefer the emptiest days.
    // For fully-packed timetables this is the dominant heuristic — placing a
    // lab on an already-heavy day starves the remaining sessions and causes
    // deep dead ends discovered only much later.
    let sectionDayLoad = 0;
    for (const e of placed) {
      if (e.sectionId === session.sectionId && e.dayIndex === c.dayIndex) {
        sectionDayLoad += e.durationPeriods;
      }
    }
    score -= sectionDayLoad * 2;
    // Lab time-slot variety: penalize lab start-periods that are already
    // commonly used by other sections, so labs don't all sit at the same time.
    if (session.durationPeriods >= 2) {
      const usage = labStartPeriodUsage[c.dayIndex]?.[c.startPeriod] ?? 0;
      score -= usage * 1.5;
    }
    return score;
  }

  /**
   * Per-(day, startPeriod) count of lab blocks currently placed across all
   * sections. Used to bias later lab placements toward less-used time slots,
   * giving lab start times visual variety across the grid.
   */
  const labStartPeriodUsage: number[][] = Array.from({ length: dayCount }, () =>
    new Array<number>(Math.max(1, periodsPerDay)).fill(0),
  );
  function recordLabUsage(entry: TimetableEntry): void {
    if (entry.durationPeriods < 2) return;
    labStartPeriodUsage[entry.dayIndex][entry.startPeriod] =
      (labStartPeriodUsage[entry.dayIndex]?.[entry.startPeriod] ?? 0) + 1;
  }
  function unrecordLabUsage(entry: TimetableEntry): void {
    if (entry.durationPeriods < 2) return;
    labStartPeriodUsage[entry.dayIndex][entry.startPeriod] = Math.max(
      0,
      (labStartPeriodUsage[entry.dayIndex]?.[entry.startPeriod] ?? 0) - 1,
    );
  }

  /** Optional soft cap: max sessions of one subject for a section per day (§S1 made bounded). */
  function subjectPerDayWithinLimits(entry: TimetableEntry): boolean {
    const cap = maxSessionsPerSubjectPerDay;
    if (cap === null) return true;
    let count = 0;
    for (const e of placed) {
      if (
        e.sectionId === entry.sectionId &&
        e.subjectId === entry.subjectId &&
        e.dayIndex === entry.dayIndex
      ) {
        count++;
        if (count >= cap) return false;
      }
    }
    return true;
  }

  /** Optional cap: max laboratory blocks for a section per day. */
  function labPerDayWithinLimits(entry: TimetableEntry): boolean {
    const cap = maxLabSessionsPerSectionPerDay;
    if (cap === null || entry.durationPeriods < 2) return true;
    let count = 0;
    for (const e of placed) {
      if (
        e.sectionId === entry.sectionId &&
        e.dayIndex === entry.dayIndex &&
        e.durationPeriods >= 2
      ) {
        count++;
        if (count >= cap) return false;
      }
    }
    return true;
  }

  function facultyWithinLimits(entry: TimetableEntry): boolean {
    const f = facultyById.get(entry.facultyId);
    if (!f) return false;
    if (f.maxPeriodsPerWeek !== null) {
      let load = 0;
      for (const e of placed) {
        if (e.facultyId === f.id) load += e.durationPeriods;
      }
      if (load + entry.durationPeriods > f.maxPeriodsPerWeek) return false;
    }
    if (f.maxPeriodsPerDay !== null) {
      let load = 0;
      for (const e of placed) {
        if (e.facultyId === f.id && e.dayIndex === entry.dayIndex) {
          load += e.durationPeriods;
        }
      }
      if (load + entry.durationPeriods > f.maxPeriodsPerDay) return false;
    }
    return true;
  }

  function occupiedPeriods(entry: TimetableEntry): number[] {
    const out: number[] = [];
    for (let p = entry.startPeriod; p < entry.startPeriod + entry.durationPeriods; p++) {
      out.push(p);
    }
    return out;
  }

  class CancellationSignal extends Error {}

  try {
    const success = backtrack(0);
    metrics.searchMs = Date.now() - searchStart;
    if (!success) {
      return {
        status: 'IMPOSSIBLE',
        entries: null,
        metrics,
        diagnostics: [
          {
            code: 'NO_FEASIBLE_SCHEDULE',
            message:
              'No feasible schedule found: the search explored all placements without satisfying every hard constraint.',
            sectionIds: [],
            subjectIds: [],
            facultyIds: [],
            suggestions: [
              'Reduce required weekly sessions.',
              'Add more eligible faculty.',
              'Increase working days or periods per day.',
            ],
          },
        ],
      };
    }
    metrics.sessionsScheduled = placed.length;
    metrics.durationMs = Date.now() - start;
    return { status: 'COMPLETED', entries: placed, metrics, diagnostics: [] };
  } catch (error) {
    metrics.searchMs = Date.now() - searchStart;
    metrics.durationMs = Date.now() - start;
    if (error instanceof CancellationSignal) {
      return { status: 'CANCELLED', entries: null, metrics, diagnostics: [] };
    }
    if (error instanceof BudgetExceededError) {
      diagnostics.push({
        code: error.kind === 'TIMEOUT' ? 'SEARCH_TIMEOUT' : 'SEARCH_NODE_LIMIT',
        message:
          error.kind === 'TIMEOUT'
            ? 'Search budget exhausted before proving feasibility (duration limit).'
            : 'Search budget exhausted before proving feasibility (node limit).',
        sectionIds: [],
        subjectIds: [],
        facultyIds: [],
        suggestions: [
          'Increase the search budget in generation settings.',
          'Simplify configuration (fewer shared faculty, fewer overlapping requirements).',
        ],
      });
      return { status: 'TIMEOUT', entries: null, metrics, diagnostics };
    }
    throw error;
  }
}

export { DAY_MS };
