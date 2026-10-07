import type { Break } from '../models';

/**
 * Teaching-period-first grid layout.
 *
 * `periodsPerDay` counts TEACHING periods only. Breaks are positioned in
 * teaching coordinates (`Break.startPeriod` = "after this many teaching
 * periods", clamped to [0, teachingPerDay]):
 *
 * - All-day breaks (`dayIndex === null`) insert extra break columns shared by
 *   every day, so the grid is wider than the teaching count.
 * - Day-specific breaks overlay teaching slots on their day only (no new
 *   column), keeping the grid rectangular.
 *
 * Timetable entries always live in GRID coordinates (`startPeriod` indexes
 * `layout.columns`, whose length is `gridSlotsPerDay`).
 */

export interface TeachingColumn {
  kind: 'teaching';
  teachingIndex: number;
}

export interface BreakColumn {
  kind: 'break';
  breakId: string;
  name: string;
}

export type GridColumn = TeachingColumn | BreakColumn;

export interface GridLayout {
  /** Teaching periods per day (excludes break columns). */
  teachingPerDay: number;
  /** Total columns per day, including all-day break columns. */
  gridSlotsPerDay: number;
  columns: GridColumn[];
}

/** All-day breaks in stable position order. */
export function allDayBreaksSorted(breaks: Break[]): Break[] {
  return breaks
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => b.dayIndex === null)
    .sort((x, y) => x.b.startPeriod - y.b.startPeriod || x.i - y.i)
    .map(({ b }) => b);
}

/** Clamp a teaching-coordinate position into [0, teachingPerDay]. */
export function clampTeachingPosition(position: number, teachingPerDay: number): number {
  if (!Number.isFinite(position)) return 0;
  return Math.max(0, Math.min(teachingPerDay, Math.floor(position)));
}

/** Build the per-day column layout: teaching slots with break columns inserted. */
export function buildGridLayout(teachingPerDay: number, breaks: Break[]): GridLayout {
  const T = Math.max(0, Math.floor(teachingPerDay));
  const columns: GridColumn[] = [];
  const ordered = allDayBreaksSorted(breaks);
  let bi = 0;
  const pushBreak = (b: Break) => {
    const duration = Math.max(1, Math.floor(b.durationPeriods));
    for (let k = 0; k < duration; k++) {
      columns.push({ kind: 'break', breakId: b.id, name: b.name });
    }
  };
  for (let t = 0; t < T; t++) {
    while (bi < ordered.length && clampTeachingPosition(ordered[bi].startPeriod, T) <= t) {
      pushBreak(ordered[bi]);
      bi++;
    }
    columns.push({ kind: 'teaching', teachingIndex: t });
  }
  while (bi < ordered.length) {
    pushBreak(ordered[bi]);
    bi++;
  }
  return { teachingPerDay: T, gridSlotsPerDay: columns.length, columns };
}

/** Teaching index of a grid slot, or -1 for break columns. */
export function teachingIndexAt(layout: GridLayout, gridSlot: number): number {
  const col = layout.columns[gridSlot];
  if (!col || col.kind !== 'teaching') return -1;
  return col.teachingIndex;
}

/** True when the grid slot is an all-day break column. */
export function isBreakColumn(layout: GridLayout, gridSlot: number): boolean {
  return layout.columns[gridSlot]?.kind === 'break';
}

/** Display label for a grid column: `P1`… for teaching, the break name otherwise. */
export function gridColumnLabel(layout: GridLayout, gridSlot: number): string {
  const col = layout.columns[gridSlot];
  if (!col) return `P${gridSlot + 1}`;
  return col.kind === 'teaching' ? `P${col.teachingIndex + 1}` : col.name;
}

/** Grid slot of a teaching index (inverse of the column map). Returns -1 if absent. */
export function gridSlotForTeaching(layout: GridLayout, teachingIndex: number): number {
  return layout.columns.findIndex(
    (c) => c.kind === 'teaching' && c.teachingIndex === teachingIndex,
  );
}

export interface GridSpan {
  /** Grid-coordinate start slot (inclusive). */
  start: number;
  /** Grid-coordinate end slot (exclusive). */
  end: number;
}

/**
 * Convert stored (teaching-coordinate) breaks to grid-coordinate spans for
 * one day: all-day break columns plus day-specific overlays mapped through
 * the inserted columns. Spans are end-exclusive and may be adjacent.
 */
export function gridBreakSpansForDay(
  dayIndex: number,
  layout: GridLayout,
  breaks: Break[],
): GridSpan[] {
  const spans: GridSpan[] = [];
  // All-day break columns.
  let runStart = -1;
  for (let g = 0; g <= layout.gridSlotsPerDay; g++) {
    const isBreakCol = g < layout.gridSlotsPerDay && isBreakColumn(layout, g);
    if (isBreakCol && runStart < 0) runStart = g;
    if (!isBreakCol && runStart >= 0) {
      spans.push({ start: runStart, end: g });
      runStart = -1;
    }
  }
  // Day-specific overlays: map teaching ranges through the inserted columns.
  for (const b of breaks) {
    if (b.dayIndex === null || b.dayIndex !== dayIndex) continue;
    const slots = teachingRangeToGridSlots(
      layout,
      b.startPeriod,
      Math.max(1, Math.floor(b.durationPeriods)),
    );
    spans.push(...groupContiguousSlots(slots));
  }
  return spans;
}

/** Group sorted grid slots into contiguous end-exclusive spans. */
export function groupContiguousSlots(slots: number[]): GridSpan[] {
  const spans: GridSpan[] = [];
  let s = -1;
  let prev = -2;
  const flush = () => {
    if (s >= 0) spans.push({ start: s, end: prev + 1 });
    s = -1;
  };
  for (const g of slots) {
    if (s < 0) s = g;
    else if (g !== prev + 1) {
      flush();
      s = g;
    }
    prev = g;
  }
  flush();
  return spans;
}

/**
 * Map a teaching-coordinate [start, start + duration) range to grid slots,
 * skipping all-day break columns (they sit *between* teaching slots).
 * Out-of-range teaching indices are ignored.
 */
export function teachingRangeToGridSlots(
  layout: GridLayout,
  startTeaching: number,
  duration: number,
): number[] {
  const slots: number[] = [];
  for (let t = Math.floor(startTeaching); t < Math.floor(startTeaching) + Math.floor(duration); t++) {
    if (t < 0 || t >= layout.teachingPerDay) continue;
    const g = gridSlotForTeaching(layout, t);
    if (g >= 0) slots.push(g);
  }
  return slots;
}

/**
 * Convert stored breaks to grid-coordinate `Break` spans, preserving identity
 * fields. Used at the engine boundary so solver/validator/post-pass keep
 * working in pure grid coordinates.
 */
export function toGridBreaks(layout: GridLayout, breaks: Break[], dayCount: number): Break[] {
  const out: Break[] = [];
  // All-day columns (identical every day → a single all-day span set).
  const byBreak = new Map<string, number[]>();
  layout.columns.forEach((col, g) => {
    if (col.kind !== 'break') return;
    const list = byBreak.get(col.breakId) ?? [];
    list.push(g);
    byBreak.set(col.breakId, list);
  });
  const meta = new Map(breaks.map((b) => [b.id, b]));
  for (const [breakId, slots] of byBreak) {
    const original = meta.get(breakId);
    if (!original) continue;
    let s = slots[0];
    for (let i = 1; i <= slots.length; i++) {
      if (i < slots.length && slots[i] === slots[i - 1] + 1) continue;
      out.push({
        ...original,
        dayIndex: null,
        startPeriod: s,
        durationPeriods: slots[i - 1] - s + 1,
      });
      if (i < slots.length) s = slots[i];
    }
  }
  // Day-specific overlays, mapped per applicable day.
  for (const b of breaks) {
    if (b.dayIndex === null) continue;
    if (b.dayIndex < 0 || b.dayIndex >= dayCount) continue;
    const slots = teachingRangeToGridSlots(layout, b.startPeriod, b.durationPeriods);
    if (slots.length === 0) continue;
    let s = slots[0];
    for (let i = 1; i <= slots.length; i++) {
      if (i < slots.length && slots[i] === slots[i - 1] + 1) continue;
      out.push({ ...b, startPeriod: s, durationPeriods: slots[i - 1] - s + 1 });
      if (i < slots.length) s = slots[i];
    }
  }
  return out;
}
