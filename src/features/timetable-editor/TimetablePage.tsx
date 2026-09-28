import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, Select } from '@/components/ui/primitives';
import { useEditorStore, popUndoCommand, popRedoCommand } from '@/state/stores/editor-store';
import {
  selectCurrentFaculty,
  selectCurrentSections,
  selectCurrentSubjects,
  selectTimetableForActiveDepartment,
  useWorkspaceStore,
} from '@/state/stores/workspace-store';
import { TimetableEditService } from '@/application/timetable-service';
import { exportTimetable } from '@/application/export-service';
import type { EditCommand } from '@/application/timetable-edit-commands';
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import { DEFAULT_GENERATION_SETTINGS, DEFAULT_HARD_CONSTRAINTS, DEFAULT_SOFT_WEIGHTS } from '@/domain/policies';
import type { Conflict, TimetableConfiguration } from '@/domain/models';

interface CellVm {
  dayIndex: number;
  periodIndex: number;
  entryId: string | null;
  isStart: boolean;
  isContinuation: boolean;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  type: 'THEORY' | 'LAB';
}

export function TimetablePage() {
  const { departmentId } = useParams();
  const state = useWorkspaceStore();
  const sections = useWorkspaceStore(selectCurrentSections);
  const subjects = useWorkspaceStore(selectCurrentSubjects);
  const faculty = useWorkspaceStore(selectCurrentFaculty);
  const timetable = useWorkspaceStore(selectTimetableForActiveDepartment);
  const editor = useEditorStore();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [focusConflictId, setFocusConflictId] = useState<string | null>(null);

  const department = state.departments.find((d) => d.id === departmentId);
  const config: TimetableConfiguration | null = useMemo(() => {
    if (!department) return null;
    return {
      workingDays: department.workingDays,
      periodsPerDay: department.periodsPerDay,
      periodDefinitions: Array.from({ length: department.periodsPerDay }, (_, i) => ({ index: i, label: `P${i + 1}` })),
      sections,
      subjects,
      faculty,
      hardConstraints: DEFAULT_HARD_CONSTRAINTS,
      softWeights: DEFAULT_SOFT_WEIGHTS,
      generationSettings: { ...DEFAULT_GENERATION_SETTINGS },
    };
  }, [department, sections, subjects, faculty]);

  const editService = useMemo(() => (config ? new TimetableEditService(config) : null), [config]);

  if (!department || !config || !editService) {
    return <p className="text-sm text-slate-500">Select a department first.</p>;
  }

  if (!timetable) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Timetable — {department.code}</h1>
        <p className="text-sm text-slate-500">No timetable generated yet.</p>
        <Link className="text-blue-600 underline" to={`/departments/${departmentId}/generate`}>
          Go to generation →
        </Link>
      </div>
    );
  }

  // Stale detection (§111)
  const currentSnapshot = buildConfigurationSnapshot(config);
  const isStale = timetable.configurationSnapshot.fingerprint !== currentSnapshot.fingerprint;

  const activeSectionId = selectedSectionId ?? sections[0]?.id ?? null;
  const activeSection = sections.find((s) => s.id === activeSectionId);

  const entries = timetable.entries.filter((e) => e.sectionId === activeSectionId);
  const entryById = new Map(timetable.entries.map((e) => [e.id, e]));
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const facultyById = new Map(faculty.map((f) => [f.id, f]));

  // Build grid view models (§94, §95)
  const cells: CellVm[][] = department.workingDays.map((_, dayIndex) =>
    Array.from({ length: department.periodsPerDay }, (_, periodIndex): CellVm => {
      const entry = entries.find(
        (e) =>
          e.dayIndex === dayIndex &&
          periodIndex >= e.startPeriod &&
          periodIndex < e.startPeriod + e.durationPeriods,
      );
      if (!entry) {
        return { dayIndex, periodIndex, entryId: null, isStart: false, isContinuation: false, subjectCode: '', subjectName: '', facultyName: '', type: 'THEORY' };
      }
      const subject = subjectById.get(entry.subjectId);
      const member = facultyById.get(entry.facultyId);
      return {
        dayIndex,
        periodIndex,
        entryId: entry.id,
        isStart: periodIndex === entry.startPeriod,
        isContinuation: periodIndex !== entry.startPeriod,
        subjectCode: subject?.code ?? '?',
        subjectName: subject?.name ?? 'Unknown subject',
        facultyName: member?.name ?? 'Unknown faculty',
        type: subject?.type ?? 'THEORY',
      };
    }),
  );

  const conflictsForSection = (timetable.validationSummary?.conflicts ?? []).filter((c) =>
    activeSectionId ? c.sectionIds.length === 0 || c.sectionIds.includes(activeSectionId) : true,
  );
  const conflictCells = new Set<string>();
  for (const c of conflictsForSection) {
    if (c.dayIndex !== null && c.periodIndex !== null) conflictCells.add(`${c.dayIndex}:${c.periodIndex}`);
  }

  const runCommand = (command: EditCommand) => {
    const outcome = editService.executeCommand(timetable, command);
    if (outcome.status === 'COMMITTED' && outcome.timetable) {
      state.upsertTimetable(outcome.timetable);
      editor.pushHistory(command);
      editor.showToast('success', 'Edit committed.');
    } else {
      editor.showToast(
        'error',
        `Edit blocked: ${outcome.conflicts[0]?.type ?? outcome.error ?? 'hard-constraint violation'}`,
      );
    }
  };

  const inverseOf = (command: EditCommand): EditCommand | null => {
    // Build the inverse for undo where meaningful.
    switch (command.operation) {
      case 'MOVE_ENTRY': {
        const movePayload = command.payload as { entryId: string; dayIndex: number; startPeriod: number };
        const e = entryById.get(movePayload.entryId);
        if (!e) return null;
        return { ...command, operation: 'MOVE_ENTRY', payload: { entryId: e.id, dayIndex: e.dayIndex, startPeriod: e.startPeriod } };
      }
      case 'CHANGE_FACULTY': {
        const payload = command.payload as { entryId: string; facultyId: string };
        const e = entryById.get(payload.entryId);
        if (!e) return null;
        return { ...command, operation: 'CHANGE_FACULTY', payload: { entryId: e.id, facultyId: e.facultyId } };
      }
      case 'SWAP_ENTRIES': {
        return { ...command }; // swapping is its own inverse
      }
      case 'CLEAR_ENTRY':
      case 'REMOVE_ENTRY': {
        const e = entryById.get((command.payload as { entryId: string }).entryId);
        if (!e) return null;
        return {
          ...command,
          operation: 'ADD_ENTRY',
          payload: { entry: { ...e } },
        };
      }
      default:
        return null;
    }
  };

  const handleUndo = () => {
    const cmd = popUndoCommand();
    if (!cmd) return;
    const inverse = inverseOf(cmd);
    if (!inverse) {
      editor.showToast('warning', 'Cannot undo this operation.');
      return;
    }
    const outcome = editService.executeCommand(timetable, inverse);
    if (outcome.status === 'COMMITTED' && outcome.timetable) {
      state.upsertTimetable(outcome.timetable);
      editor.showToast('success', 'Undo applied.');
    } else {
      editor.showToast('error', 'Undo blocked: would create a hard conflict.');
    }
  };

  const handleRedo = () => {
    const cmd = popRedoCommand();
    if (!cmd) return;
    const outcome = editService.executeCommand(timetable, cmd);
    if (outcome.status === 'COMMITTED' && outcome.timetable) {
      state.upsertTimetable(outcome.timetable);
      editor.showToast('success', 'Redo applied.');
    } else {
      editor.showToast('error', 'Redo blocked: would create a hard conflict.');
    }
  };

  const doExportPdf = () => {
    if (!activeSectionId) return;
    try {
      exportTimetable('PDF', {
        timetable,
        department,
        sections,
        subjects,
        faculty,
        sectionId: activeSectionId,
      });
      editor.showToast('success', 'PDF exported.');
    } catch {
      editor.showToast('error', 'PDF export failed.');
    }
  };

  const doExportExcel = () => {
    if (!activeSectionId) return;
    try {
      exportTimetable('XLSX', {
        timetable,
        department,
        sections,
        subjects,
        faculty,
        sectionId: activeSectionId,
      });
      editor.showToast('success', 'Excel exported.');
    } catch {
      editor.showToast('error', 'Excel export failed.');
    }
  };

  const onCellClick = (cell: CellVm) => {
    if (!cell.entryId) return;
    editor.selectEntry(cell.entryId);
  };

  const moveSelectedTo = (dayIndex: number, periodIndex: number) => {
    const entryId = editor.selectedEntryId;
    if (!entryId) {
      editor.showToast('warning', 'Select an entry first, then choose “Move here” on a target slot.');
      return;
    }
    const entry = entryById.get(entryId);
    if (!entry) return;
    // Lab atomicity: moving moves the whole block (start period only).
    if (entry.sectionId !== activeSectionId) {
      editor.showToast('error', 'Cannot move an entry across sections. Use swap instead.');
      return;
    }
    runCommand({
      operation: 'MOVE_ENTRY',
      payload: { entryId, dayIndex, startPeriod: periodIndex },
      affectedEntryIds: [entryId],
      timestamp: new Date().toISOString(),
    });
    editor.selectEntry(null);
  };

  const swapSelectedWith = (dayIndex: number, periodIndex: number) => {
    const target = cells[dayIndex]?.[periodIndex];
    if (!target?.entryId) return;
    const sourceId = editor.selectedEntryId;
    if (!sourceId) return;
    const a = entryById.get(sourceId);
    const b = entryById.get(target.entryId);
    if (!a || !b) return;
    runCommand({
      operation: 'SWAP_ENTRIES',
      payload: { entryAId: a.id, entryBId: b.id },
      affectedEntryIds: [a.id, b.id],
      timestamp: new Date().toISOString(),
    });
    editor.selectEntry(null);
  };

  const clearSelected = () => {
    const entryId = editor.selectedEntryId;
    if (!entryId) return;
    runCommand({
      operation: 'CLEAR_ENTRY',
      payload: { entryId },
      affectedEntryIds: [entryId],
      timestamp: new Date().toISOString(),
    });
    editor.selectEntry(null);
  };

  const changeFacultyForSelected = (facultyId: string) => {
    const entryId = editor.selectedEntryId;
    if (!entryId) return;
    runCommand({
      operation: 'CHANGE_FACULTY',
      payload: { entryId, facultyId },
      affectedEntryIds: [entryId],
      timestamp: new Date().toISOString(),
    });
  };

  const selectedConflict: Conflict | null =
    conflictsForSection.find((c) => c.id === focusConflictId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Timetable — {department.code}</h1>
        <div className="flex items-center gap-2">
          <Badge tone={isStale ? 'amber' : timetable.validationSummary?.isValid ? 'green' : 'red'}>
            {isStale ? 'STALE' : timetable.status}
          </Badge>
          <Button variant="secondary" onClick={handleUndo} disabled={editor.undoStack.length === 0}>
            Undo
          </Button>
          <Button variant="secondary" onClick={handleRedo} disabled={editor.redoStack.length === 0}>
            Redo
          </Button>
          <Link className="text-sm text-blue-600 underline" to={`/departments/${departmentId}/generate`}>
            Regenerate
          </Link>
          <Button variant="secondary" onClick={doExportPdf}>Export PDF</Button>
          <Button variant="secondary" onClick={doExportExcel}>Export Excel</Button>
        </div>
      </div>

      {isStale && (
        <div role="status" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          The configuration has changed since this timetable was generated. Regenerate to reconcile.
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">
          Section:{' '}
          <Select
            value={activeSectionId ?? ''}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="ml-1 w-48"
            aria-label="Select section"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </label>
        {editor.selectedEntryId && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Selected entry — click a slot below to move, or use swap/clear:
            </span>
            <Button variant="secondary" onClick={clearSelected}>Clear</Button>
            <Select
              className="w-44"
              aria-label="Change faculty for selected entry"
              onChange={(e) => {
                if (e.target.value) changeFacultyForSelected(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
            >
              <option value="">Change faculty…</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <Card title={`${activeSection?.name ?? 'Section'} — weekly grid`}>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-slate-200 bg-slate-50 p-2 text-xs"></th>
                {Array.from({ length: department.periodsPerDay }, (_, i) => (
                  <th key={i} className="border border-slate-200 bg-slate-50 p-2 text-xs font-semibold">
                    Period {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cells.map((row, dayIndex) => (
                <tr key={dayIndex}>
                  <th className="border border-slate-200 bg-slate-50 p-2 text-xs font-semibold">
                    {department.workingDays[dayIndex]}
                  </th>
                  {row.map((cell) => {
                    const occupied = cell.entryId !== null;
                    const isConflict = conflictCells.has(`${cell.dayIndex}:${cell.periodIndex}`);
                    const isSelected = cell.entryId !== null && cell.entryId === editor.selectedEntryId;
                    const bg = !occupied
                      ? 'bg-white hover:bg-slate-50'
                      : isConflict
                        ? 'bg-red-100 border-red-400'
                        : cell.type === 'LAB'
                          ? 'bg-indigo-100'
                          : 'bg-blue-50';
                    return (
                      <td
                        key={cell.periodIndex}
                        className={`border p-1 align-top ${bg} ${isSelected ? 'ring-2 ring-blue-600' : ''} ${cell.isContinuation ? 'text-[10px] italic text-slate-500' : ''}`}
                        colSpan={cell.isStart && cell.type === 'LAB' && cells[dayIndex][cell.periodIndex + 1]?.entryId === cell.entryId ? 1 : 1}
                      >
                        {occupied && cell.isStart ? (
                          <button
                            type="button"
                            className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                            onClick={() => onCellClick(cell)}
                            aria-label={`${cell.subjectCode} ${cell.facultyName} day ${cell.dayIndex + 1} period ${cell.periodIndex + 1}`}
                          >
                            <span className="block text-xs font-semibold">{cell.subjectCode}</span>
                            <span className="block text-[10px] text-slate-600">{cell.facultyName}</span>
                            {cell.type === 'LAB' && <span className="block text-[10px] font-medium text-indigo-700">LAB (2p)</span>}
                          </button>
                        ) : occupied && cell.isContinuation ? (
                          <span className="text-[10px] text-slate-400">↳ {cell.subjectCode}</span>
                        ) : (
                          <button
                            type="button"
                            className="h-10 w-full text-left text-[10px] text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 hover:text-slate-500"
                            onClick={() => {
                              if (editor.selectedEntryId) moveSelectedTo(cell.dayIndex, cell.periodIndex);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              if (editor.selectedEntryId) swapSelectedWith(cell.dayIndex, cell.periodIndex);
                            }}
                            aria-label={`Empty slot day ${cell.dayIndex + 1} period ${cell.periodIndex + 1}`}
                          >
                            {editor.selectedEntryId ? '+ move here' : ''}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Click an entry to select it. With a selection: click an empty slot to move, right-click to swap. Labs move as one 2-period block.
        </p>
      </Card>

      <Card title="Validation panel">
        {conflictsForSection.length === 0 ? (
          <div className="text-sm text-green-700">
            <p className="font-medium">Valid timetable</p>
            <p className="text-xs">0 hard conflicts, 0 missing sessions, 0 duplicate sessions.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {conflictsForSection.map((c) => (
              <li key={c.id} className={`rounded border p-2 text-xs ${c.severity === 'ERROR' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center justify-between">
                  <strong className={c.severity === 'ERROR' ? 'text-red-800' : 'text-amber-800'}>{c.type}</strong>
                  <Button variant="secondary" onClick={() => setFocusConflictId(c.id)}>
                    Inspect
                  </Button>
                </div>
                <p className="mt-1 text-slate-600">
                  {c.dayIndex !== null ? `${department.workingDays[c.dayIndex]} ` : ''}
                  {c.periodIndex !== null ? `period ${c.periodIndex + 1}` : ''}
                </p>
                {c.resolutionHints.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-slate-500">
                    {c.resolutionHints.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        {selectedConflict && (
          <div className="mt-3 rounded border border-slate-300 bg-slate-50 p-3 text-xs">
            <strong>{selectedConflict.type}</strong>
            <p className="mt-1">Entries: {selectedConflict.entryIds.join(', ') || '—'}</p>
            <p>Faculty: {selectedConflict.facultyIds.map((id) => facultyById.get(id)?.name ?? id).join(', ') || '—'}</p>
            <p>Subject: {selectedConflict.subjectIds.map((id) => subjectById.get(id)?.code ?? id).join(', ') || '—'}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
