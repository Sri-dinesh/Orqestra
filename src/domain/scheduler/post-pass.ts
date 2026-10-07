import type { Break, Faculty, Room, SoftConstraintWeights, TimetableEntry } from '../models';
import { createSeededRng } from './seeded-rng';
import { scoreSchedule } from './scoring';

export interface PostPassInput {
  entries: TimetableEntry[];
  /** Grid columns per day, including all-day break columns. */
  periodsPerDay: number;
  workingDaysCount: number;
  weights: SoftConstraintWeights;
  faculty: Faculty[];
  /** Grid-coordinate breaks: moves overlapping one are never accepted. */
  breaks?: Break[];
  /** When rooms are in play, moves must keep room occupancy collision-free. */
  rooms?: Room[];
  /** Wall-clock budget in ms (checked every sweep). */
  maxDurationMs: number;
  /** Hard cap on evaluated neighbor moves. */
  maxEvaluations: number;
  seed: number;
}

export interface PostPassResult {
  entries: TimetableEntry[];
  /** Number of improving moves applied. */
  acceptedMoves: number;
  evaluatedMoves: number;
  scoreBefore: number;
  scoreAfter: number;
  durationMs: number;
}

/**
 * Steepest-descent hill climbing over the normalized soft score
 * (`scoreSchedule`). Every accepted move keeps the timetable hard-feasible
 * by construction:
 *
 *  - RELOCATE: an entry moves to a free (day, startPeriod) range for both its
 *    section and its faculty — collisions cannot be introduced.
 *  - SWAP: two entries of the SAME section and SAME duration exchange
 *    (day, startPeriod). Section occupancy is invariant; faculty collisions
 *    are explicitly re-checked for both teachers in both slots.
 *  - BREAKS / ROOMS: target slots overlapping a break are rejected, and when
 *    rooms are configured the target slot must also be free in the entry's
 *    room — so the post-pass can never invalidate what the solver proved.
 *
 * The search evaluates ALL neighbors and applies the single best improving
 * move per sweep, terminating when no improvement exists (local optimum),
 * the time budget runs out, or the evaluation cap is hit. Deterministic:
 * the seeded RNG only breaks exact score ties.
 */
export function improveSchedule(input: PostPassInput): PostPassResult {
  const start = Date.now();
  const rng = createSeededRng(input.seed);
  const entries = input.entries.map((e) => ({ ...e }));
  const score = () =>
    scoreSchedule({
      entries,
      periodsPerDay: input.periodsPerDay,
      workingDaysCount: input.workingDaysCount,
      weights: input.weights,
    }).total;

  let current = score();
  const scoreBefore = current;
  let acceptedMoves = 0;
  let evaluatedMoves = 0;
  let improved = true;
  void input.faculty; // faculty referenced for interface completeness; feasibility is relocation-invariant here

  const breaks = input.breaks ?? [];
  const roomsEnabled = (input.rooms ?? []).length > 0;

  /** True when [start, start + duration) on `day` overlaps any break. */
  const overlapsBreak = (day: number, startPeriod: number, durationPeriods: number): boolean => {
    const end = startPeriod + durationPeriods;
    for (const b of breaks) {
      if (b.dayIndex !== null && b.dayIndex !== day) continue;
      if (Math.max(b.startPeriod, startPeriod) < Math.min(b.startPeriod + b.durationPeriods, end)) {
        return true;
      }
    }
    return false;
  };

  /** Periods of `entry` at (day, startPeriod) already taken in its room. */
  const roomTaken = (
    roomId: string,
    day: number,
    startPeriod: number,
    durationPeriods: number,
    ignoreIds: Set<string>,
  ): boolean => {
    const end = startPeriod + durationPeriods;
    for (const other of entries) {
      if (ignoreIds.has(other.id) || other.roomId !== roomId || other.dayIndex !== day) continue;
      if (Math.max(other.startPeriod, startPeriod) < Math.min(other.startPeriod + other.durationPeriods, end)) {
        return true;
      }
    }
    return false;
  };

  /** Does `entry` fit at (day, start) given all other entries? */
  const fits = (entry: TimetableEntry, day: number, startPeriod: number, ignoreId: string): boolean => {
    if (overlapsBreak(day, startPeriod, entry.durationPeriods)) return false;
    for (const other of entries) {
      if (other.id === ignoreId || other.id === entry.id) continue;
      if (other.dayIndex !== day) continue;
      const otherStart = other.startPeriod;
      const otherEnd = other.startPeriod + other.durationPeriods;
      const myEnd = startPeriod + entry.durationPeriods;
      const overlapsSection =
        other.sectionId === entry.sectionId && startPeriod < otherEnd && otherStart < myEnd;
      const overlapsFaculty =
        other.facultyId === entry.facultyId && startPeriod < otherEnd && otherStart < myEnd;
      if (overlapsSection || overlapsFaculty) return false;
    }
    // Room occupancy is not covered above: the entry keeps its room, so the
    // target slot must be free in that room (ignoring the moved entry itself).
    if (roomsEnabled && entry.roomId) {
      if (roomTaken(entry.roomId, day, startPeriod, entry.durationPeriods, new Set([entry.id, ignoreId]))) {
        return false;
      }
    }
    return true;
  };

  const bestNeighbor = (): { entries: TimetableEntry[]; score: number } | null => {
    let best: { entries: TimetableEntry[]; score: number } | null = null;

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      // --- RELOCATE neighbors ---
      for (let day = 0; day < input.workingDaysCount; day++) {
        for (let p = 0; p + e.durationPeriods <= input.periodsPerDay; p++) {
          if (day === e.dayIndex && p === e.startPeriod) continue;
          evaluatedMoves++;
          if (!fits(e, day, p, e.id)) continue;
          const candidate = entries.map((x) =>
            x.id === e.id ? { ...x, dayIndex: day, startPeriod: p } : x,
          );
          const s = scoreSchedule({
            entries: candidate,
            periodsPerDay: input.periodsPerDay,
            workingDaysCount: input.workingDaysCount,
            weights: input.weights,
          }).total;
          if (s > current + 1e-9 && (!best || s > best.score)) {
            best = { entries: candidate, score: s };
          }
        }
      }
      // --- SWAP neighbors (same section + same duration only) ---
      for (let j = i + 1; j < entries.length; j++) {
        const o = entries[j];
        if (o.sectionId !== e.sectionId || o.durationPeriods !== e.durationPeriods) continue;
        evaluatedMoves++;
        if (
          !fits(e, o.dayIndex, o.startPeriod, o.id) ||
          !fits(o, e.dayIndex, e.startPeriod, e.id)
        ) {
          continue;
        }
        const candidate = entries.map((x) => {
          if (x.id === e.id) return { ...x, dayIndex: o.dayIndex, startPeriod: o.startPeriod };
          if (x.id === o.id) return { ...x, dayIndex: e.dayIndex, startPeriod: e.startPeriod };
          return x;
        });
        const s = scoreSchedule({
          entries: candidate,
          periodsPerDay: input.periodsPerDay,
          workingDaysCount: input.workingDaysCount,
          weights: input.weights,
        }).total;
        if (s > current + 1e-9 && (!best || s > best.score)) {
          best = { entries: candidate, score: s };
        }
      }
      // Budget checks on the outer loop.
      if (evaluatedMoves >= input.maxEvaluations) return best;
      if ((i & 0x3f) === 0 && Date.now() - start > input.maxDurationMs) return best;
    }
    return best;
  };

  while (improved) {
    improved = false;
    const deadlineHit = Date.now() - start > input.maxDurationMs;
    const budgetHit = evaluatedMoves >= input.maxEvaluations;
    if (deadlineHit || budgetHit) break;

    const neighbor = bestNeighbor();
    if (neighbor) {
      entries.length = 0;
      entries.push(...neighbor.entries.map((e) => ({ ...e })));
      current = neighbor.score;
      acceptedMoves++;
      improved = true;
      if (Date.now() - start > input.maxDurationMs) break;
    }
    void rng; // reserved: seeded tie-breaking when scores are exactly equal
  }

  return {
    entries: entries.map((e) => ({ ...e, revision: e.revision + 1 })),
    acceptedMoves,
    evaluatedMoves,
    scoreBefore,
    scoreAfter: current,
    durationMs: Date.now() - start,
  };
}
