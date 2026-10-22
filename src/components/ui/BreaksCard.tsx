import React, { useState, useMemo } from 'react';
import { Coffee, Plus, Trash2, Edit2, Clock, Check, Sparkles, X } from 'lucide-react';
import { Button, Card, Field, Input, Select } from '@/components/ui/primitives';
import type { Break, Department } from '@/domain/models';
import { getDepartmentBreaks } from '@/domain/scheduler/grid-layout';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { useEditorStore } from '@/state/stores/editor-store';

interface BreaksCardProps {
  department: Department;
}

export const BreaksCard: React.FC<BreaksCardProps> = ({ department }) => {
  const allBreaks = useWorkspaceStore((s) => s.breaks);
  const breaks = useMemo(
    () => getDepartmentBreaks(allBreaks, department.id),
    [allBreaks, department.id],
  );
  const state = useWorkspaceStore();
  const showToast = useEditorStore((s) => s.showToast);

  const [isAdding, setIsAdding] = useState(false);
  const [editingBreakId, setEditingBreakId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('Lunch Break');
  const [startPeriod, setStartPeriod] = useState<number>(Math.min(4, department.periodsPerDay));
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('12:50 PM');
  const [endTime, setEndTime] = useState('01:40 PM');

  const resetForm = () => {
    setName('Lunch Break');
    setStartPeriod(Math.min(4, department.periodsPerDay));
    setDayIndex(null);
    setStartTime('12:50 PM');
    setEndTime('01:40 PM');
    setIsAdding(false);
    setEditingBreakId(null);
  };

  const handleStartEdit = (b: Break) => {
    setEditingBreakId(b.id);
    setName(b.name);
    setStartPeriod(b.startPeriod);
    setDayIndex(b.dayIndex);
    setStartTime(b.startTime ?? '');
    setEndTime(b.endTime ?? '');
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingBreakId) {
      state.updateBreak(editingBreakId, {
        departmentId: department.id,
        name: name.trim(),
        startPeriod: Math.max(0, Math.min(department.periodsPerDay, startPeriod)),
        dayIndex,
        durationPeriods: 1,
        startTime: startTime.trim() || undefined,
        endTime: endTime.trim() || undefined,
      });
      showToast('success', `Updated break "${name.trim()}".`);
    } else {
      state.addBreak({
        departmentId: department.id,
        name: name.trim(),
        startPeriod: Math.max(0, Math.min(department.periodsPerDay, startPeriod)),
        dayIndex,
        durationPeriods: 1,
        startTime: startTime.trim() || undefined,
        endTime: endTime.trim() || undefined,
      });
      showToast('success', `Added break "${name.trim()}".`);
    }

    resetForm();
  };

  const handleDelete = (id: string, breakName: string) => {
    state.removeBreak(id);
    showToast('success', `Removed break "${breakName}".`);
  };

  const handleAddPresetLunch = () => {
    const p4 = Math.min(4, department.periodsPerDay);
    state.addBreak({
      departmentId: department.id,
      name: 'Lunch Break',
      startPeriod: p4,
      dayIndex: null,
      durationPeriods: 1,
      startTime: '12:50 PM',
      endTime: '01:40 PM',
    });
    showToast('success', 'Added Standard Lunch Break after P4.');
  };

  const handleAddPresetMorningTea = () => {
    const p2 = Math.min(2, department.periodsPerDay);
    state.addBreak({
      departmentId: department.id,
      name: 'Morning Recess',
      startPeriod: p2,
      dayIndex: null,
      durationPeriods: 1,
      startTime: '10:40 AM',
      endTime: '11:00 AM',
    });
    showToast('success', 'Added Morning Recess after P2.');
  };

  return (
    <Card title={`Breaks & Recess Schedule (${breaks.length})`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-body-gray">
          Configure lunch, recess, or assembly breaks. All-day breaks insert dedicated break columns in grids and exports.
        </p>
        {!isAdding && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="shrink-0 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Break</span>
          </Button>
        )}
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-5 rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-[#0047FF]" />
              <h4 className="text-xs font-bold text-[#111315] uppercase tracking-wide">
                {editingBreakId ? 'Edit Break' : 'Add New Break'}
              </h4>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="text-[#71767B] hover:text-[#111315] p-1 rounded-lg"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick suggestions */}
          <div>
            <span className="block text-[11px] font-semibold text-[#111315] mb-1.5">Quick Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Lunch Break', start: '12:50 PM', end: '01:40 PM', p: Math.min(4, department.periodsPerDay) },
                { label: 'Morning Recess', start: '10:40 AM', end: '11:00 AM', p: Math.min(2, department.periodsPerDay) },
                { label: 'Afternoon Break', start: '03:10 PM', end: '03:25 PM', p: Math.min(6, department.periodsPerDay) },
                { label: 'Morning Assembly', start: '08:45 AM', end: '09:00 AM', p: 0 },
                { label: 'Friday Prayer', start: '12:30 PM', end: '02:00 PM', p: Math.min(4, department.periodsPerDay) },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setName(s.label);
                    setStartTime(s.start);
                    setEndTime(s.end);
                    setStartPeriod(s.p);
                  }}
                  className="px-2 py-0.5 text-xs font-medium rounded-md bg-white border border-blue-200 text-blue-900 hover:bg-blue-100/60 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Break Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lunch Break"
                required
                aria-label="Break name"
              />
            </Field>

            <Field label="Placement in Day">
              <Select
                value={String(startPeriod)}
                onChange={(e) => setStartPeriod(Number(e.target.value))}
                aria-label="Break position"
              >
                <option value="0">Start of Day (Before P1)</option>
                {Array.from({ length: department.periodsPerDay }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    After Period {i + 1} {i + 1 === department.periodsPerDay ? '(End of day)' : ''}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Day Scope">
              <Select
                value={dayIndex === null ? 'ALL' : String(dayIndex)}
                onChange={(e) => setDayIndex(e.target.value === 'ALL' ? null : Number(e.target.value))}
                aria-label="Break day scope"
              >
                <option value="ALL">Every Working Day (Creates Break Column)</option>
                {department.workingDays.map((day, idx) => (
                  <option key={day} value={String(idx)}>
                    {day} only (Blocks Slot)
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Start Time">
                <Input
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="12:50 PM"
                  aria-label="Break start time"
                />
              </Field>
              <Field label="End Time">
                <Input
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="01:40 PM"
                  aria-label="Break end time"
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{editingBreakId ? 'Save Changes' : 'Create Break'}</span>
            </Button>
          </div>
        </form>
      )}

      {/* Break List */}
      <div className="space-y-2">
        {breaks.map((b) => {
          const isAllDay = b.dayIndex === null;
          const dayName = isAllDay ? 'All Days' : department.workingDays[b.dayIndex!] ?? `Day ${b.dayIndex! + 1}`;
          const positionLabel =
            b.startPeriod <= 0
              ? 'Start of day'
              : `After P${Math.min(b.startPeriod, department.periodsPerDay)}`;

          return (
            <div
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E8E0] bg-[#FAFBF9] px-3.5 py-2.5 hover:bg-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/50">
                  <Coffee className="w-4 h-4 text-amber-600" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-semibold text-[#111315]">{b.name}</strong>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {positionLabel}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        isAllDay
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-[#4B5259] border border-slate-200'
                      }`}
                    >
                      {dayName}
                    </span>
                  </div>
                  {b.startTime && b.endTime && (
                    <div className="flex items-center gap-1 text-[11px] text-[#71767B] mt-0.5">
                      <Clock className="w-3 h-3 text-[#71767B]" />
                      <span>{b.startTime} – {b.endTime}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStartEdit(b)}
                  className="text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline ml-1">Edit</span>
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(b.id, b.name)}
                  className="text-xs"
                  aria-label={`Remove break ${b.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline ml-1">Remove</span>
                </Button>
              </div>
            </div>
          );
        })}

        {breaks.length === 0 && !isAdding && (
          <div className="rounded-xl border border-dashed border-[#E5E8E0] bg-[#FAFBF9] p-6 text-center">
            <Coffee className="w-8 h-8 text-[#71767B] mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-[#111315]">No breaks configured yet</p>
            <p className="text-[11px] text-[#71767B] mt-1 max-w-sm mx-auto">
              Teaching periods run consecutively without recess. Add a standard lunch break or morning tea below to divide the day.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddPresetLunch}
                className="inline-flex items-center gap-1.5 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0047FF]" />
                <span>+ Standard Lunch Break (After P4)</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddPresetMorningTea}
                className="inline-flex items-center gap-1.5 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0047FF]" />
                <span>+ Morning Recess (After P2)</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
