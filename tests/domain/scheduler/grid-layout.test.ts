import { describe, expect, it } from 'vitest';
import {
  buildGridLayout,
  gridBreakSpansForDay,
  gridColumnLabel,
  gridSlotForTeaching,
  isBreakColumn,
  teachingIndexAt,
  teachingRangeToGridSlots,
  toGridBreaks,
} from '@/domain/scheduler/grid-layout';
import type { Break } from '@/domain/models';

const lunch = (startPeriod: number, dayIndex: number | null = null): Break => ({
  id: `break_${dayIndex ?? 'all'}_${startPeriod}`,
  name: 'Lunch Break',
  dayIndex,
  startPeriod,
  durationPeriods: 1,
});

describe('grid layout', () => {
  it('inserts an all-day lunch column after the 4th teaching period', () => {
    const layout = buildGridLayout(7, [lunch(4)]);
    expect(layout.teachingPerDay).toBe(7);
    expect(layout.gridSlotsPerDay).toBe(8);
    expect(layout.columns.map((c) => (c.kind === 'teaching' ? `P${c.teachingIndex + 1}` : 'LUNCH')))
      .toEqual(['P1', 'P2', 'P3', 'P4', 'LUNCH', 'P5', 'P6', 'P7']);
    expect(gridColumnLabel(layout, 4)).toBe('Lunch Break');
    expect(gridColumnLabel(layout, 5)).toBe('P5');
    expect(isBreakColumn(layout, 4)).toBe(true);
    expect(isBreakColumn(layout, 3)).toBe(false);
    expect(teachingIndexAt(layout, 5)).toBe(4);
    expect(teachingIndexAt(layout, 4)).toBe(-1);
    expect(gridSlotForTeaching(layout, 4)).toBe(5);
  });

  it('renders no extra columns without breaks', () => {
    const layout = buildGridLayout(6, []);
    expect(layout.gridSlotsPerDay).toBe(6);
    expect(layout.columns.every((c) => c.kind === 'teaching')).toBe(true);
  });

  it('clamps out-of-range break positions to the day edges', () => {
    const start = buildGridLayout(4, [lunch(-3)]);
    expect(start.columns[0]).toMatchObject({ kind: 'break' });
    const end = buildGridLayout(4, [lunch(99)]);
    expect(end.columns[end.columns.length - 1]).toMatchObject({ kind: 'break' });
    expect(end.gridSlotsPerDay).toBe(5);
  });

  it('maps teaching ranges to grid slots around inserted columns', () => {
    const layout = buildGridLayout(7, [lunch(4)]);
    // Teaching P5–P6 (indices 4–5) sit at grid slots 5–6, past lunch.
    expect(teachingRangeToGridSlots(layout, 4, 2)).toEqual([5, 6]);
    // A range clipped by the grid edge maps only its inside part.
    expect(teachingRangeToGridSlots(layout, 6, 3)).toEqual([7]);
  });

  it('converts breaks to grid-coordinate spans per day', () => {
    const layout = buildGridLayout(7, [lunch(4)]);
    // Lunch column (grid 4) applies every day.
    expect(gridBreakSpansForDay(0, layout, [lunch(4)])).toEqual([{ start: 4, end: 5 }]);
    // A Tuesday-only overlay on teaching index 2 lands on grid slot 2.
    const extra = lunch(2, 1);
    expect(gridBreakSpansForDay(1, layout, [lunch(4), extra])).toEqual([
      { start: 4, end: 5 },
      { start: 2, end: 3 },
    ]);
    expect(gridBreakSpansForDay(0, layout, [lunch(4), extra])).toEqual([{ start: 4, end: 5 }]);
  });

  it('emits grid breaks preserving identity for solver and validator', () => {
    const breaks = [lunch(4)];
    const layout = buildGridLayout(7, breaks);
    const grid = toGridBreaks(layout, breaks, 7);
    expect(grid).toHaveLength(1);
    expect(grid[0]).toMatchObject({ dayIndex: null, startPeriod: 4, durationPeriods: 1, name: 'Lunch Break' });
    // Day-specific overlays map through inserted columns and keep their day.
    const tue = lunch(5, 2);
    const mapped = toGridBreaks(layout, [lunch(4), tue], 7);
    const dayBreak = mapped.find((b) => b.dayIndex === 2);
    expect(dayBreak).toMatchObject({ startPeriod: 6, durationPeriods: 1 });
    // Out-of-range days are dropped.
    expect(toGridBreaks(layout, [lunch(0, 9)], 7).filter((b) => b.dayIndex === 9)).toHaveLength(0);
  });
});
