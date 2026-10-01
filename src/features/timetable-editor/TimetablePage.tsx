import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, EditModal, Field, PageHeader, Select } from '@/components/ui/primitives';
import { ConflictModal } from '@/components/ui/ConflictModal';
import type { Conflict } from '@/domain/models';
import { useEditorStore, popUndoCommand, popRedoCommand } from '@/state/stores/editor-store';
import {
  selectCurrentFaculty,
  selectCurrentSections,
  selectCurrentSubjects,
  selectTimetableForActiveDepartment,
  useWorkspaceStore,
} from '@/state/stores/workspace-store';
import { TimetableEditService } from '@/application/timetable-service';
import { withVersion } from '@/application/timetable-versioning';
import { computeSlotConflicts, type SlotConflict } from '@/application/timetable-slot-preview';
import { exportTimetable } from '@/application/export-service';
import type { EditCommand } from '@/application/timetable-edit-commands';
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import { DEFAULT_GENERATION_SETTINGS, DEFAULT_HARD_CONSTRAINTS, DEFAULT_SOFT_WEIGHTS } from '@/domain/policies';
import type { TimetableConfiguration } from '@/domain/models';

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
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [blockedConflicts, setBlockedConflicts] = useState<Conflict[] | null>(null);
  const [addSlot, setAddSlot] = useState<{ dayIndex: number; periodIndex: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
    return <p className="text-sm text-body-gray">Select a department first.</p>;
  }

  if (!timetable) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Weekly schedule" title={`Timetable — ${department.code}`} />
        <Card>
          <p className="text-sm text-body-gray">No timetable generated yet.</p>
          <Link to={`/departments/${departmentId}/generate`}>
            <Button size="sm" className="mt-3">Go to generation →</Button>
          </Link>
        </Card>
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

  // Conflict preview: which target slots would REJECT a move/swap of the
  // selected entry. Computed with the real edit service (draft-only, no
  // mutation), memoized on selection + timetable so grid renders stay cheap.
  // eslint-disable-next-line react-hooks/rules-of-hooks -- conditional return above guarantees timetable/editService exist here
  const slotConflicts: Map<string, SlotConflict> = useMemo(
    () => computeSlotConflicts(timetable, editService, config, editor.selectedEntryId),
    [timetable, editService, config, editor.selectedEntryId],
  );
  const hasMovePreview = [...slotConflicts.values()].some((c) => c.kind === 'MOVE');
  const hasSwapPreview = [...slotConflicts.values()].some((c) => c.kind === 'SWAP');
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
      // Blocking modal — the user must acknowledge the conflict.
      setBlockedConflicts(outcome.conflicts.length > 0 ? outcome.conflicts : [syntheticConflict(outcome.error ?? 'HARD_CONFLICT')]);
    }
  };

  /** Fallback conflict for payload-level errors that carry no Conflict objects. */
  const syntheticConflict = (error: string): Conflict => ({
    id: `synthetic_${error}`,
    type: error as Conflict['type'],
    severity: 'ERROR',
    messageKey: error,
    messageParams: {},
    dayIndex: null,
    periodIndex: null,
    entryIds: [],
    facultyIds: [],
    sectionIds: [],
    subjectIds: [],
    resolutionHints: [
      error === 'DURATION_MISMATCH'
        ? 'Only entries of the same length (e.g. two labs) can be swapped.'
        : 'Try a different slot or resolve the existing conflict first.',
    ],
  });

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
      setBlockedConflicts(outcome.conflicts.length > 0 ? outcome.conflicts : [syntheticConflict(outcome.error ?? 'HARD_CONFLICT')]);
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
      setBlockedConflicts(outcome.conflicts.length > 0 ? outcome.conflicts : [syntheticConflict(outcome.error ?? 'HARD_CONFLICT')]);
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
    if (!a || !b || a.id === b.id) return;
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

  const openAddSession = (dayIndex: number, periodIndex: number) => {
    setAddSlot({ dayIndex, periodIndex });
  };

  /** Subjects that this section is actually required to have (sensible add defaults). */
  const addableSubjects = useMemo(() => {
    if (!activeSectionId) return [];
    const section = sections.find((s) => s.id === activeSectionId);
    const requiredIds = new Set(
      (section?.subjectRequirements ?? []).filter((r) => r.sessionsPerWeek > 0).map((r) => r.subjectId),
    );
    return subjects.filter((s) => s.active && (requiredIds.has(s.id) || s.eligibleSectionIds.includes(activeSectionId)));
  }, [activeSectionId, sections, subjects]);

  /** Eligible faculty for a given subject in the add modal. */
  const facultyForSubject = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    const eligible = new Set(subject?.eligibleFacultyIds ?? []);
    return faculty.filter((f) => f.active && (eligible.size === 0 || eligible.has(f.id)));
  };

  const commitAddSession = (subjectId: string, facultyId: string) => {
    if (!addSlot || !activeSectionId) return;
    const subject = subjects.find((s) => s.id === subjectId);
    runCommand({
      operation: 'ADD_ENTRY',
      payload: {
        entry: {
          sectionId: activeSectionId,
          subjectId,
          facultyId,
          dayIndex: addSlot.dayIndex,
          startPeriod: addSlot.periodIndex,
          durationPeriods: subject?.type === 'LAB' ? 2 : 1,
        },
      },
      affectedEntryIds: [],
      timestamp: new Date().toISOString(),
    });
    setAddSlot(null);
  };

  const editingEntry = editingEntryId ? entryById.get(editingEntryId) ?? null : null;

  /** Apply an arbitrary combination of subject/faculty/day/period changes to the entry being edited. */
  const commitEntryEdit = (changes: { subjectId?: string; facultyId?: string; dayIndex?: number; startPeriod?: number }) => {
    if (!editingEntry) return;
    const ops: EditCommand[] = [];
    const ts = new Date().toISOString();
    if (changes.subjectId && changes.subjectId !== editingEntry.subjectId) {
      ops.push({
        operation: 'CHANGE_SUBJECT',
        payload: { entryId: editingEntry.id, subjectId: changes.subjectId },
        affectedEntryIds: [editingEntry.id],
        timestamp: ts,
      });
    }
    if (changes.facultyId && changes.facultyId !== editingEntry.facultyId) {
      ops.push({
        operation: 'CHANGE_FACULTY',
        payload: { entryId: editingEntry.id, facultyId: changes.facultyId },
        affectedEntryIds: [editingEntry.id],
        timestamp: ts,
      });
    }
    if (
      (changes.dayIndex !== undefined && changes.dayIndex !== editingEntry.dayIndex) ||
      (changes.startPeriod !== undefined && changes.startPeriod !== editingEntry.startPeriod)
    ) {
      ops.push({
        operation: 'MOVE_ENTRY',
        payload: {
          entryId: editingEntry.id,
          dayIndex: changes.dayIndex ?? editingEntry.dayIndex,
          startPeriod: changes.startPeriod ?? editingEntry.startPeriod,
        },
        affectedEntryIds: [editingEntry.id],
        timestamp: ts,
      });
    }
    // Apply sequentially; stop at the first rejection (conflict) and report it.
    let current = timetable;
    for (const cmd of ops) {
      const outcome = editService.executeCommand(current, cmd);
      if (outcome.status === 'REJECTED' || !outcome.timetable) {
        setBlockedConflicts(outcome.conflicts.length > 0 ? outcome.conflicts : [syntheticConflict(outcome.error ?? 'HARD_CONFLICT')]);
        setEditingEntryId(null);
        return;
      }
      current = outcome.timetable;
    }
    if (current !== timetable) {
      state.upsertTimetable(current);
      editor.showToast('success', 'Entry updated.');
    }
    setEditingEntryId(null);
  };

  const selectedConflict: Conflict | null =
    conflictsForSection.find((c) => c.id === focusConflictId) ?? null;

  const versionHistory = timetable.versionHistory ?? [];
  const restoreVersion = (version: number) => {
    const snap = versionHistory.find((v) => v.version === version);
    if (!snap) return;
    // Snapshot the current state before restoring, so restore is itself reversible.
    const versioned = withVersion(timetable, 'RESTORE', `Restored version ${version}`);
    const restored: typeof timetable = {
      ...versioned,
      entries: snap.entries.map((e) => ({ ...e })),
      status: snap.status === 'STALE' ? 'STALE' : 'DRAFT',
      revision: timetable.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    const full = editService.revalidate(restored);
    restored.validationSummary = full.result;
    restored.status = full.status;
    state.upsertTimetable(restored);
    editor.showToast('success', `Restored version ${version}.`);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Weekly schedule"
        title={`Timetable — ${department.code}`}
        actions={
          <>
            <Badge tone={isStale ? 'amber' : timetable.validationSummary?.isValid ? 'green' : 'red'}>
              {isStale ? 'STALE' : timetable.status}
            </Badge>
            <Button variant="secondary" size="sm" onClick={handleUndo} disabled={editor.undoStack.length === 0}>
              Undo
            </Button>
            <Button variant="secondary" size="sm" onClick={handleRedo} disabled={editor.redoStack.length === 0}>
              Redo
            </Button>
            <Button variant="secondary" size="sm" onClick={doExportPdf}>Export PDF</Button>
            <Button variant="secondary" size="sm" onClick={doExportExcel}>Export Excel</Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>Print</Button>
            <Link to={`/departments/${departmentId}/faculty-timetable`}>
              <Button variant="secondary" size="sm">Faculty view</Button>
            </Link>
            <Link to={`/departments/${departmentId}/master-timetable`}>
              <Button variant="secondary" size="sm">Master view</Button>
            </Link>
            <Link to={`/departments/${departmentId}/generate`}>
              <Button size="sm">Regenerate</Button>
            </Link>
          </>
        }
      />

      {isStale && (
        <div role="status" className="rounded-card bg-warning-bg p-3 text-sm text-warning">
          The configuration has changed since this timetable was generated. Regenerate to reconcile.
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            Section:
            <Select
              value={activeSectionId ?? ''}
              onChange={(e) => {
                setSelectedSectionId(e.target.value);
                // Drop any selection: previews/swaps target the previously
                // displayed section's entries, which would mislead here.
                if (editor.selectedEntryId) editor.selectEntry(null);
              }}
              className="w-48"
              aria-label="Select section"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </label>
        </div>
        {editor.selectedEntryId && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-info-bg px-3 py-2">
            <span className="text-xs font-medium text-info">
              Entry selected — drag it onto a free slot to move, or onto another entry to swap — or use the actions below
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditingEntryId(editor.selectedEntryId)}>
                Edit…
              </Button>
              <Button variant="secondary" size="sm" onClick={clearSelected}>Clear</Button>
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
                {faculty.filter((f) => f.active).map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Select>
            </div>
          </div>
        )}
      </div>

      <Card title={`${activeSection?.name ?? 'Section'} — weekly grid`}>
        <div className="overflow-x-auto pb-1">
          <table className="min-w-full border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="p-1"></th>
                {Array.from({ length: department.periodsPerDay }, (_, i) => (
                  <th key={i} className="p-1 text-[11px] font-semibold uppercase tracking-wide text-body-gray">
                    P{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cells.map((row, dayIndex) => (
                <tr key={dayIndex}>
                  <th className="whitespace-nowrap rounded-lg bg-surface-2 px-2.5 text-[11px] font-semibold text-ink">
                    {department.workingDays[dayIndex].slice(0, 3)}
                  </th>
                  {row.map((cell) => {
                    const occupied = cell.entryId !== null;
                    const isConflict = conflictCells.has(`${cell.dayIndex}:${cell.periodIndex}`);
                    const isSelected = cell.entryId !== null && cell.entryId === editor.selectedEntryId;
                    const slotKey = `${cell.dayIndex}:${cell.periodIndex}`;
                    const preview = slotConflicts.get(slotKey);
                    const isOwnSlot = occupied && cell.entryId === editor.selectedEntryId;
                    const bg = !occupied
                      ? preview
                        ? 'bg-danger-bg/60 hover:bg-danger-bg'
                        : 'bg-surface-1 hover:bg-surface-2'
                      : isConflict
                        ? 'bg-danger-bg'
                        : cell.type === 'LAB'
                          ? 'bg-[#e7e0fd]'
                          : 'bg-[#dce4fd]';
                    const previewRing =
                      preview && !isOwnSlot
                        ? preview.kind === 'MOVE'
                          ? 'ring-2 ring-danger/60'
                          : 'ring-2 ring-[#d9a13a]/60'
                        : '';
                    // While dragging: green ring on every valid drop target
                    // (blocked cells keep their red/amber preview ring).
                    const dragRing =
                      isDragging && !isOwnSlot && !preview ? 'ring-2 ring-success/70' : '';
                    return (
                      <td
                        key={cell.periodIndex}
                        className={`rounded-lg p-1 align-top transition-shadow duration-150 ${bg} ${isSelected ? 'ring-2 ring-metric-blue' : ''} ${previewRing} ${dragRing}`}
                        title={
                          preview && !isOwnSlot
                            ? `${preview.kind === 'MOVE' ? 'Move' : 'Swap'} blocked: ${preview.reason.replace(/_/g, ' ').toLowerCase()}`
                            : isDragging && !isOwnSlot
                              ? occupied
                                ? `Drop to swap with ${cell.subjectName}`
                                : 'Drop here to move'
                              : occupied && cell.isStart
                                ? `${cell.subjectName} — ${cell.facultyName}`
                                : undefined
                        }
                        draggable={occupied}
                        onDragStart={(e) => {
                          if (!cell.entryId) {
                            e.preventDefault();
                            return;
                          }
                          e.dataTransfer.setData('text/plain', cell.entryId);
                          e.dataTransfer.effectAllowed = 'move';
                          // Select immediately so the blocked-target previews
                          // (red/amber rings) are live for the whole drag.
                          editor.selectEntry(cell.entryId);
                          setIsDragging(true);
                        }}
                        onDragEnd={() => setIsDragging(false)}
                        onDragOver={(e) => {
                          if (!editor.selectedEntryId || isOwnSlot) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const draggedId = e.dataTransfer.getData('text/plain');
                          setIsDragging(false);
                          // Ignore drops of foreign content (other apps/tabs).
                          if (draggedId && draggedId !== editor.selectedEntryId) return;
                          const sourceId = draggedId || editor.selectedEntryId;
                          if (!sourceId || sourceId === cell.entryId) return;
                          if (!cell.entryId) moveSelectedTo(cell.dayIndex, cell.periodIndex);
                          else swapSelectedWith(cell.dayIndex, cell.periodIndex);
                        }}
                        onContextMenu={(e) => {
                          // Swap lives on the cell (not just empty slots): with a
                          // selection, right-click any OTHER entry to swap with it.
                          if (!editor.selectedEntryId) return;
                          e.preventDefault();
                          if (cell.entryId && cell.entryId !== editor.selectedEntryId) {
                            swapSelectedWith(cell.dayIndex, cell.periodIndex);
                          } else if (!cell.entryId) {
                            editor.showToast('warning', 'Right-click an occupied entry to swap with the selection.');
                          }
                        }}
                      >
                        {occupied && cell.isStart ? (
                          <button
                            type="button"
                            className="w-full cursor-grab rounded-md p-1.5 text-left active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-metric-blue"
                            onClick={() => onCellClick(cell)}
                            onDoubleClick={() => setEditingEntryId(cell.entryId)}
                            aria-label={`${cell.subjectCode} ${cell.facultyName} day ${cell.dayIndex + 1} period ${cell.periodIndex + 1}`}
                          >
                            <span className="block text-xs font-semibold text-ink">{cell.subjectCode}</span>
                            <span className="block truncate text-[10px] text-body-gray">{cell.facultyName}</span>
                            {cell.type === 'LAB' && <span className="block text-[10px] font-medium text-[#5b3fb8]">LAB (2p)</span>}
                          </button>
                        ) : occupied && cell.isContinuation ? (
                          <span className="block cursor-grab p-1.5 text-[10px] text-body-gray">↳ {cell.subjectCode}</span>
                        ) : (
                          <button
                            type="button"
                            className={`h-12 w-full cursor-pointer rounded-md text-left text-[10px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-metric-blue ${
                              preview
                                ? 'cursor-not-allowed text-danger/70'
                                : 'text-body-gray/50 hover:text-body-gray'
                            } ${editor.selectedEntryId ? 'p-1.5' : ''}`}
                            onClick={() => {
                              if (editor.selectedEntryId) moveSelectedTo(cell.dayIndex, cell.periodIndex);
                              else openAddSession(cell.dayIndex, cell.periodIndex);
                            }}
                            aria-label={`Empty slot day ${cell.dayIndex + 1} period ${cell.periodIndex + 1}`}
                          >
                            {preview
                              ? '✕ blocked'
                              : isDragging
                                ? '↓ drop here'
                                : editor.selectedEntryId
                                  ? '+ move here'
                                  : '+ add session'}
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
        <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-body-gray" aria-label="Grid legend">
          <li className="flex items-center gap-1.5"><span className="h-3.5 w-5 rounded bg-[#dce4fd] ring-1 ring-inset ring-hairline" aria-hidden="true" /> Theory</li>
          <li className="flex items-center gap-1.5"><span className="h-3.5 w-5 rounded bg-[#e7e0fd] ring-1 ring-inset ring-hairline" aria-hidden="true" /> Lab (2 periods)</li>
          <li className="flex items-center gap-1.5"><span className="h-3.5 w-5 rounded bg-surface-1 ring-1 ring-inset ring-hairline" aria-hidden="true" /> Free slot</li>
          <li className="flex items-center gap-1.5"><span className="h-3.5 w-5 rounded bg-danger-bg ring-1 ring-inset ring-hairline" aria-hidden="true" /> Conflict</li>
          <li className="flex items-center gap-1.5"><span className="h-3.5 w-5 rounded bg-[#dce4fd] ring-2 ring-metric-blue" aria-hidden="true" /> Selected</li>
          <li className="flex items-center gap-1.5"><span className="h-3.5 w-5 rounded bg-danger-bg/60 ring-2 ring-danger/60" aria-hidden="true" /> Move blocked</li>
          <li className="flex items-center gap-1.5"><span className="h-3.5 w-5 rounded bg-[#dce4fd] ring-2 ring-[#d9a13a]/60" aria-hidden="true" /> Swap blocked</li>
          <li className="flex items-center gap-1.5"><span className="text-[11px] text-body-gray" aria-hidden="true">↳</span> Lab continuation</li>
        </ul>
        <p className="mt-2 text-xs text-body-gray">
          Drag an entry onto a free slot to move it, or onto another entry to swap — green rings mark valid drop targets while dragging. Prefer clicks? Click an entry to select, then click a free slot to move or right-click an entry to swap; double-click to edit subject, faculty, day or period. With nothing selected, click a free slot to add a session. Labs move as one 2-period block.
        </p>
        {editor.selectedEntryId && (hasMovePreview || hasSwapPreview) && (
          <p className="mt-1 text-[11px] text-danger/80">
            {hasMovePreview && <span>{hasSwapPreview ? 'Red' : 'Tinted'} slots: move would be rejected. </span>}
            {hasSwapPreview && <span>Amber slots: swap would be rejected.</span>}
          </p>
        )}
      </Card>

      <Card title="Validation panel">
        {conflictsForSection.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-success-bg p-3">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-medium text-success">Valid timetable</p>
              <p className="text-xs text-body-gray">0 hard conflicts, 0 missing sessions, 0 duplicate sessions.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {conflictsForSection.map((c) => (
              <li key={c.id} className={`rounded-xl p-3 text-xs ${c.severity === 'ERROR' ? 'bg-danger-bg text-danger' : 'bg-warning-bg text-warning'}`}>
                <div className="flex items-center justify-between">
                  <strong>{c.type}</strong>
                  <Button variant="ghost" size="sm" onClick={() => setFocusConflictId(c.id)}>
                    Inspect
                  </Button>
                </div>
                <p className="mt-1 text-body-gray">
                  {c.dayIndex !== null ? `${department.workingDays[c.dayIndex]} ` : ''}
                  {c.periodIndex !== null ? `period ${c.periodIndex + 1}` : ''}
                </p>
                {c.resolutionHints.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-body-gray">
                    {c.resolutionHints.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        {selectedConflict && (
          <div className="mt-3 rounded-xl bg-surface-1 p-3 text-xs text-ink">
            <strong>{selectedConflict.type}</strong>
            <p className="mt-1">Entries: {selectedConflict.entryIds.join(', ') || '—'}</p>
            <p>Faculty: {selectedConflict.facultyIds.map((id) => facultyById.get(id)?.name ?? id).join(', ') || '—'}</p>
            <p>Subject: {selectedConflict.subjectIds.map((id) => subjectById.get(id)?.code ?? id).join(', ') || '—'}</p>
          </div>
        )}
      </Card>

      {editingEntry && (
        <EditModal
          title={`Edit entry — ${editingEntry.durationPeriods >= 2 ? 'Lab (2 periods)' : 'Theory'}`}
          onClose={() => setEditingEntryId(null)}
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget as HTMLFormElement);
            commitEntryEdit({
              subjectId: String(form.get('subjectId') ?? ''),
              facultyId: String(form.get('facultyId') ?? ''),
              dayIndex: Number(form.get('dayIndex')),
              startPeriod: Number(form.get('startPeriod')),
            });
          }}
        >
          <div className="grid gap-4">
            <Field label="Subject">
              <Select name="subjectId" defaultValue={editingEntry.subjectId} aria-label="Subject">
                {subjects.filter((s) => s.active).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}{s.type === 'LAB' ? ' (lab)' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Faculty">
              <Select name="facultyId" defaultValue={editingEntry.facultyId} aria-label="Faculty">
                {faculty.filter((f) => f.active).map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Day">
                <Select name="dayIndex" defaultValue={String(editingEntry.dayIndex)} aria-label="Day">
                  {department.workingDays.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Start period">
                <Select name="startPeriod" defaultValue={String(editingEntry.startPeriod)} aria-label="Start period">
                  {Array.from({ length: department.periodsPerDay }, (_, i) => (
                    <option key={i} value={i}>P{i + 1}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <p className="text-xs text-body-gray">
              Changes that create hard conflicts (double-booked faculty, section collisions, lab overruns) are rejected.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setEditingEntryId(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Apply changes</Button>
            </div>
          </div>
        </EditModal>
      )}

      {addSlot && (
        <EditModal
          title={`Add session — ${department.workingDays[addSlot.dayIndex]} P${addSlot.periodIndex + 1}`}
          onClose={() => setAddSlot(null)}
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget as HTMLFormElement);
            const subjectId = String(form.get('subjectId') ?? '');
            const facultyId = String(form.get('facultyId') ?? '');
            if (subjectId && facultyId) commitAddSession(subjectId, facultyId);
          }}
        >
          <div className="grid gap-4">
            <Field label="Subject">
              <Select name="subjectId" defaultValue={addableSubjects[0]?.id ?? ''} aria-label="Subject for new session">
                {addableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}{s.type === 'LAB' ? ' (lab, 2 periods)' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Faculty">
              <Select
                name="facultyId"
                defaultValue={facultyForSubject(addableSubjects[0]?.id ?? '')[0]?.id ?? ''}
                aria-label="Faculty for new session"
              >
                {facultyForSubject(addableSubjects[0]?.id ?? '').map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Select>
            </Field>
            {addableSubjects.length === 0 && (
              <p className="text-xs text-warning">
                This section has no subject requirements configured. Add subjects in Configuration first.
              </p>
            )}
            <p className="text-xs text-body-gray">
              Placements that double-book the section or the faculty member are rejected. Labs occupy 2 consecutive periods.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setAddSlot(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={addableSubjects.length === 0}>
                Add session
              </Button>
            </div>
          </div>
        </EditModal>
      )}

      {blockedConflicts && (
        <ConflictModal conflicts={blockedConflicts} onClose={() => setBlockedConflicts(null)} />
      )}

      <Card title={`Version history (${versionHistory.length})`}>
        {versionHistory.length === 0 ? (
          <p className="text-sm text-body-gray">
            No versions recorded yet. Regenerating or editing the timetable creates restore points.
          </p>
        ) : (
          <ul className="space-y-2">
            {[...versionHistory].reverse().map((v) => (
              <li key={`${v.version}-${v.recordedAt}`} className="flex items-center justify-between gap-3 rounded-xl bg-surface-1 px-3 py-2 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">v{v.version}</span>
                    <Badge tone={v.origin === 'GENERATED' ? 'blue' : v.origin === 'RESTORE' ? 'amber' : 'slate'}>
                      {v.origin}
                    </Badge>
                    <span className="truncate text-body-gray">{v.label}</span>
                  </div>
                  <div className="mt-0.5 text-body-gray">
                    {new Date(v.recordedAt).toLocaleString()} · {v.entries.length} sessions
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => restoreVersion(v.version)}>
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
