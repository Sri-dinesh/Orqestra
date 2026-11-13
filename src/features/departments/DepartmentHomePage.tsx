import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, Copy, Edit3, Layers3, Plus, Settings2, Trash2 } from 'lucide-react';
import { Badge, Button, Card, EditModal, PageHeader } from '@/components/ui/primitives';
import { DepartmentNav } from '@/components/ui/DepartmentNav';
import { DepartmentNotFound } from '@/components/ui/DepartmentNotFound';
import { TimetableDetailsModal } from '@/features/timetables/TimetableDetailsModal';
import { DepartmentPresetLibrary } from '@/features/departments/DepartmentPresetLibrary';
import { useEditorStore } from '@/state/stores/editor-store';
import { selectTimetablesForDepartment, useWorkspaceStore } from '@/state/stores/workspace-store';
import type { Timetable } from '@/domain/models';
import { flushPersistence } from '@/hooks/usePersistence';

function timetableTone(status: Timetable['status']): 'green' | 'red' | 'amber' | 'blue' | 'slate' {
  if (status === 'VALID') return 'green';
  if (status === 'INVALID' || status === 'FAILED') return 'red';
  if (status === 'STALE') return 'amber';
  if (status === 'GENERATED' || status === 'DRAFT') return 'blue';
  return 'slate';
}

export function DepartmentHomePage() {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const state = useWorkspaceStore();
  const showToast = useEditorStore((store) => store.showToast);
  const department = state.departments.find((item) => item.id === departmentId);
  const timetables = useMemo(() => selectTimetablesForDepartment(state, departmentId ?? null), [state, departmentId]);
  const [editingTimetableId, setEditingTimetableId] = useState<string | null>(null);
  const [deletingTimetableId, setDeletingTimetableId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!department || !departmentId) {
    return <DepartmentNotFound requestedId={departmentId} targetPage="configuration" />;
  }

  const membership = state.membership;
  const isReadOnly = membership?.role === 'FACULTY' || (
    membership?.role === 'HOD' && Boolean(membership.departmentId) && membership.departmentId !== departmentId
  );
  const sectionsCount = state.sections.filter((section) => section.departmentId === departmentId).length;
  const subjectsCount = state.subjects.filter((subject) => subject.departmentId === departmentId).length;
  const facultyCount = state.faculty.filter((member) => member.departmentId === departmentId).length;
  const editingTimetable = editingTimetableId
    ? timetables.find((timetable) => timetable.id === editingTimetableId) ?? null
    : null;
  const deletingTimetable = deletingTimetableId
    ? timetables.find((timetable) => timetable.id === deletingTimetableId) ?? null
    : null;

  const openTimetable = (timetableId: string) => {
    state.setActiveDepartment(departmentId);
    state.setActiveTimetable(timetableId);
    navigate(`/departments/${departmentId}/timetable`);
  };

  const startNewTimetable = () => {
    state.setActiveDepartment(departmentId);
    state.setActiveTimetable(null);
    navigate(`/departments/${departmentId}/generate`);
  };

  const deleteTimetable = async () => {
    if (!deletingTimetable) return;
    setIsDeleting(true);
    try {
      state.removeTimetable(deletingTimetable.id);
      const result = await flushPersistence();
      showToast(
        result.ok ? 'success' : 'warning',
        result.ok
          ? `${deletingTimetable.name ?? 'Timetable'} was deleted.`
          : 'Timetable was removed locally but could not sync to the cloud.',
      );
      setDeletingTimetableId(null);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not delete timetable.');
    } finally {
      setIsDeleting(false);
    }
  };

  const duplicateTimetable = async (sourceId: string) => {
    const clone = state.duplicateTimetable(sourceId);
    if (!clone) {
      showToast('error', 'Could not duplicate timetable.');
      return;
    }
    await flushPersistence();
    showToast('success', `"${clone.name}" created.`);
  };

  return (
    <div className="space-y-7">
      <DepartmentNav />

      <PageHeader
        eyebrow="Department workspace"
        title={department.name}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/departments/${departmentId}/configuration`}>
              <Button variant="secondary" className="inline-flex items-center gap-1.5"><Settings2 className="h-4 w-4" /> Configure</Button>
            </Link>
            {!isReadOnly && (
              <Button onClick={startNewTimetable} className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" /> New timetable</Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><div className="flex items-center gap-3"><Layers3 className="h-5 w-5 text-metric-blue" /><div><p className="text-xl font-bold text-ink">{sectionsCount}</p><p className="text-xs text-body-gray">Sections</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-metric-blue" /><div><p className="text-xl font-bold text-ink">{timetables.length}</p><p className="text-xs text-body-gray">Timetables</p></div></div></Card>
        <Card><div><p className="text-xl font-bold text-ink">{subjectsCount}</p><p className="text-xs text-body-gray">Subjects</p></div></Card>
        <Card><div><p className="text-xl font-bold text-ink">{facultyCount}</p><p className="text-xs text-body-gray">Faculty</p></div></Card>
      </div>

      <Card
        title="Timetable library"
        actions={
          <span className="text-xs text-body-gray">{timetables.length === 0 ? 'No schedules yet' : `${timetables.length} saved schedule${timetables.length === 1 ? '' : 's'}`}</span>
        }
      >
        {timetables.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#e1e4e8] bg-[#ffffff] px-6 py-12 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-metric-blue" />
            <h2 className="mt-4 text-base font-bold text-ink">Create the first timetable for {department.code}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-body-gray">
              Finish the department setup, then generate a named schedule. You can keep multiple versions here without replacing older schedules.
            </p>
            {!isReadOnly && (
              <Button onClick={startNewTimetable} className="mt-5 inline-flex items-center gap-1.5"><Plus className="h-4 w-4" /> Create timetable</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {timetables.map((timetable) => (
              <div key={timetable.id} className="rounded-md border border-[#e1e4e8] bg-[#ffffff] p-4 transition hover:border-[#B8C8F5] hover:bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-ink">{timetable.name ?? 'Untitled timetable'}</h3>
                    <p className="mt-1 text-xs text-body-gray">Updated {new Date(timetable.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <Badge tone={timetableTone(timetable.status)}>{timetable.status}</Badge>
                </div>
                <p className="mt-3 min-h-10 text-sm leading-relaxed text-body-gray">
                  {timetable.description || 'No description added yet.'}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#e1e4e8] pt-3">
                  <span className="text-xs font-mono text-body-gray">Revision {timetable.revision}</span>
                  <div className="flex items-center gap-2">
                    {!isReadOnly && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setEditingTimetableId(timetable.id)} aria-label={`Edit ${timetable.name ?? 'timetable'}`}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void duplicateTimetable(timetable.id)}
                          aria-label={`Duplicate ${timetable.name ?? 'timetable'}`}
                          title="Duplicate timetable"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setDeletingTimetableId(timetable.id)} aria-label={`Delete ${timetable.name ?? 'timetable'}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" onClick={() => openTimetable(timetable.id)} className="inline-flex items-center gap-1.5">Open <ArrowRight className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {!isReadOnly && <DepartmentPresetLibrary departmentId={departmentId} />}

      {editingTimetable && (
        <TimetableDetailsModal
          timetable={editingTimetable}
          onClose={() => setEditingTimetableId(null)}
          onSave={({ name, description }) => {
            state.updateTimetable(editingTimetable.id, { name, description });
            setEditingTimetableId(null);
            showToast('success', 'Timetable details updated.');
          }}
        />
      )}

      {deletingTimetable && (
        <EditModal
          title={`Delete ${deletingTimetable.name ?? 'timetable'}?`}
          onClose={() => setDeletingTimetableId(null)}
          onSubmit={(event) => {
            event.preventDefault();
            void deleteTimetable();
          }}
        >
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-body-gray">
              This removes the saved timetable and its revision history. The department configuration and other timetables will remain unchanged.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDeletingTimetableId(null)} disabled={isDeleting}>Cancel</Button>
              <Button type="submit" variant="danger" disabled={isDeleting} className="inline-flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? 'Deleting…' : 'Delete timetable'}
              </Button>
            </div>
          </div>
        </EditModal>
      )}
    </div>
  );
}
