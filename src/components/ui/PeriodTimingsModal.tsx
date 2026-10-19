import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, X, AlertTriangle, Check, RotateCcw } from 'lucide-react';
import type { Break, Department, PeriodTiming } from '@/domain/models';
import {
  autoGeneratePeriodTimings,
  calculateDurationMinutes,
  shiftPeriodTiming,
  validatePeriodTimings,
} from '@/domain/timing/period-timing-utils';

interface PeriodTimingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department;
  breaks: Break[];
  onSave: (timings: PeriodTiming[]) => void;
}

export const PeriodTimingsModal: React.FC<PeriodTimingsModalProps> = ({
  isOpen,
  onClose,
  department,
  breaks,
  onSave,
}) => {
  const periodsCount = department.periodsPerDay;

  // Initialize timings from department, or empty default slots
  const [timings, setTimings] = useState<PeriodTiming[]>([]);
  const [quickStartTime, setQuickStartTime] = useState<string>('09:00 AM');
  const [quickDuration, setQuickDuration] = useState<number>(50);
  const [accountForBreaks, setAccountForBreaks] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      const existing = department.periodTimings ?? [];
      const initialized = Array.from({ length: periodsCount }, (_, i) => ({
        start: existing[i]?.start ?? '',
        end: existing[i]?.end ?? '',
      }));
      setTimings(initialized);

      if (existing[0]?.start) {
        setQuickStartTime(existing[0].start);
      }
      if (existing[0]?.start && existing[0]?.end) {
        const dur = calculateDurationMinutes(existing[0].start, existing[0].end);
        if (dur && dur > 0) setQuickDuration(dur);
      }
    }
  }, [isOpen, department, periodsCount]);

  if (!isOpen) return null;

  const handleTimingChange = (index: number, field: 'start' | 'end', value: string) => {
    setTimings((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const handleShiftPeriod = (index: number, deltaMinutes: number) => {
    setTimings((prev) => {
      const next = [...prev];
      next[index] = shiftPeriodTiming(next[index], deltaMinutes);
      return next;
    });
  };

  const handleShiftAll = (deltaMinutes: number) => {
    setTimings((prev) => prev.map((t) => shiftPeriodTiming(t, deltaMinutes)));
  };

  const handleAutoGenerate = () => {
    const generated = autoGeneratePeriodTimings({
      periodsCount,
      startTime: quickStartTime,
      periodDurationMinutes: quickDuration,
      breaks,
      accountForBreaks,
    });
    setTimings(generated);
  };

  const handleClearAll = () => {
    setTimings(Array.from({ length: periodsCount }, () => ({ start: '', end: '' })));
  };

  const validation = validatePeriodTimings(timings);

  const handleSave = () => {
    onSave(timings);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="period-timings-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E8E0] bg-[#FAFAF8]">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Clock className="w-5 h-5 text-metric-blue" />
            </span>
            <div>
              <h3 id="period-timings-title" className="text-base font-bold text-[#111315]">
                Adjust Period Timings
              </h3>
              <p className="text-xs text-body-gray">
                {department.name} ({department.code}) · {periodsCount} periods/day
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-body-gray hover:text-[#111315] hover:bg-black/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Auto-Scheduler Assistant */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Quick Schedule Generator
              </h4>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                  Start Time
                </label>
                <input
                  type="text"
                  value={quickStartTime}
                  onChange={(e) => setQuickStartTime(e.target.value)}
                  placeholder="09:00 AM"
                  className="w-full text-xs rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 font-medium text-ink focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-blue-950 mb-1">
                  Period Duration
                </label>
                <div className="flex items-center gap-1.5">
                  {[45, 50, 60].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setQuickDuration(dur)}
                      className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                        quickDuration === dur
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-blue-900 border border-blue-200 hover:bg-blue-100/50'
                      }`}
                    >
                      {dur}m
                    </button>
                  ))}
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={quickDuration}
                    onChange={(e) => setQuickDuration(Number(e.target.value) || 50)}
                    className="w-14 text-xs rounded-lg border border-blue-300 bg-white px-2 py-1 font-medium text-ink focus:border-blue-600 focus:outline-hidden"
                    aria-label="Custom period duration in minutes"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Fill All
                </button>
              </div>
            </div>

            {breaks.length > 0 && (
              <label className="mt-2.5 flex items-center gap-2 cursor-pointer text-xs text-blue-900">
                <input
                  type="checkbox"
                  checked={accountForBreaks}
                  onChange={(e) => setAccountForBreaks(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Automatically insert breaks (Lunch / Recess) into timing sequence</span>
              </label>
            )}
          </div>

          {/* Validation Warnings */}
          {!validation.isValid && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Timing Inconsistencies</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                {validation.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Individual Period Timings List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink uppercase tracking-wider">
                Periods Schedule
              </span>
              <div className="flex items-center gap-1 text-[11px] text-body-gray">
                <span>Shift all:</span>
                <button
                  type="button"
                  onClick={() => handleShiftAll(-5)}
                  className="px-1.5 py-0.5 rounded bg-surface-1 hover:bg-surface-2 border border-black/10 font-medium"
                  title="Shift all periods earlier by 5 minutes"
                >
                  -5m
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftAll(5)}
                  className="px-1.5 py-0.5 rounded bg-surface-1 hover:bg-surface-2 border border-black/10 font-medium"
                  title="Shift all periods later by 5 minutes"
                >
                  +5m
                </button>
              </div>
            </div>

            <div className="divide-y divide-[#E5E8E0] rounded-xl border border-[#E5E8E0] overflow-hidden bg-white">
              {Array.from({ length: periodsCount }, (_, i) => {
                const timing = timings[i] ?? { start: '', end: '' };
                const dur = calculateDurationMinutes(timing.start, timing.end);
                const precedingBreaks = breaks.filter((b) => b.startPeriod === i && i > 0);

                return (
                  <React.Fragment key={i}>
                    {/* Render break indicator if a break occurs before this period */}
                    {precedingBreaks.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between px-3 py-1.5 bg-[#F9FAF8] border-y border-[#E5E8E0] text-[11px] text-[#555A60]"
                      >
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>{b.name}</span>
                          {b.startTime && b.endTime && (
                            <span className="text-body-gray">
                              ({b.startTime} – {b.endTime})
                            </span>
                          )}
                        </div>
                        {b.endTime && (
                          <button
                            type="button"
                            onClick={() => handleTimingChange(i, 'start', b.endTime!)}
                            className="text-[10px] text-blue-600 hover:underline font-medium"
                            title="Set P${i + 1} start time to break end time"
                          >
                            Snap P{i + 1} start to {b.endTime}
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Period row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 hover:bg-[#FAFAF8] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-7 rounded-lg bg-surface-1 border border-black/10 text-xs font-bold text-ink">
                          P{i + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={timing.start}
                            onChange={(e) => handleTimingChange(i, 'start', e.target.value)}
                            placeholder="09:00 AM"
                            className="w-24 text-xs font-medium text-ink rounded-md border border-[#E5E8E0] bg-white px-2 py-1 focus:border-blue-500 focus:outline-hidden"
                            aria-label={`Period ${i + 1} start time`}
                          />
                          <span className="text-xs text-body-gray font-bold">–</span>
                          <input
                            type="text"
                            value={timing.end}
                            onChange={(e) => handleTimingChange(i, 'end', e.target.value)}
                            placeholder="09:50 AM"
                            className="w-24 text-xs font-medium text-ink rounded-md border border-[#E5E8E0] bg-white px-2 py-1 focus:border-blue-500 focus:outline-hidden"
                            aria-label={`Period ${i + 1} end time`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {dur !== null && (
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              dur > 0 && dur <= 120
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {dur > 0 ? `${dur} min` : 'Invalid'}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleShiftPeriod(i, -5)}
                            className="px-1.5 py-0.5 text-[10px] font-medium rounded border border-black/10 bg-white hover:bg-black/5"
                            title="Shift this period 5 mins earlier"
                          >
                            -5m
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShiftPeriod(i, 5)}
                            className="px-1.5 py-0.5 text-[10px] font-medium rounded border border-black/10 bg-white hover:bg-black/5"
                            title="Shift this period 5 mins later"
                          >
                            +5m
                          </button>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E8E0] bg-[#FAFAF8]">
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-body-gray hover:text-rose-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear All
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E5E8E0] bg-white hover:bg-black/5 text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-metric-blue hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Save Period Timings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
