import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Edit3, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Badge, Button, Card, EditModal, Field, Input, PageHeader } from '@/components/ui/primitives';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { useEditorStore } from '@/state/stores/editor-store';
import { WORKING_DAYS, type WorkingDay } from '@/domain/enums';
import { flushPersistence } from '@/hooks/usePersistence';

const DEFAULT_WORKING_DAYS: WorkingDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

function statusTone(status: string): 'green' | 'amber' | 'slate' {
  if (status === 'READY') return 'green';
  if (status === 'ARCHIVED') return 'slate';
  return 'amber';
}

export function DepartmentsPage() {
  const state = useWorkspaceStore();
  const navigate = useNavigate();
  const role = state.membership?.role ?? 'ADMIN';
  const canManage = role === 'ADMIN';
  const showToast = useEditorStore((store) => store.showToast);

  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [periodsPerDay, setPeriodsPerDay] = useState(6);
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>(DEFAULT_WORKING_DAYS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ code: '', name: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetCreateForm = () => {
    setCode('');
    setName('');
    setPeriodsPerDay(6);
    setWorkingDays(DEFAULT_WORKING_DAYS);
  };

  const createDepartment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    if (!trimmedCode || !trimmedName || workingDays.length === 0) return;

    const department = state.addDepartment({
      code: trimmedCode,
      name: trimmedName,
      workingDays,
      periodsPerDay: Math.max(1, Math.min(12, periodsPerDay || 1)),
    });
    state.setActiveDepartment(department.id);
    state.setActiveTimetable(null);
    resetCreateForm();
    setCreateOpen(false);
    navigate(`/departments/${department.id}`);
  };

  const deletingDepartment = deletingId
    ? state.departments.find((department) => department.id === deletingId) ?? null
    : null;

  const deleteDepartment = async () => {
    if (!deletingDepartment) return;
    setIsDeleting(true);
    try {
      state.removeDepartment(deletingDepartment.id);
      const result = await flushPersistence();
      if (result.ok) {
        showToast('success', `${deletingDepartment.name} was deleted.`);
      } else {
        showToast('warning', `${deletingDepartment.name} was removed locally but could not sync to the cloud.`);
      }
      setDeletingId(null);
      navigate('/departments', { replace: true });
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not delete department.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace structure"
        title="Departments"
        actions={
          canManage ? (
            <Button onClick={() => setCreateOpen((open) => !open)} className="inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              {createOpen ? 'Close form' : 'New department'}
            </Button>
          ) : undefined
        }
      />

      {createOpen && canManage && (
        <Card title="Create a department" actions={<span className="text-xs text-body-gray">You can configure the details later.</span>}>
          <form className="grid gap-5 sm:grid-cols-2" onSubmit={createDepartment}>
            <Field label="Department code" hint="Short code used across the workspace.">
              <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="CSE" required aria-label="Department code" />
            </Field>
            <Field label="Department name">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Computer Science & Engineering" required aria-label="Department name" />
            </Field>
            <Field label="Teaching periods per day">
              <Input
                type="number"
                min={1}
                max={12}
                value={periodsPerDay}
                onChange={(event) => setPeriodsPerDay(Number(event.target.value))}
                required
                aria-label="Teaching periods per day"
              />
            </Field>
            <Field label="Working days">
              <div className="flex flex-wrap gap-2 pt-1">
                {WORKING_DAYS.map((day) => (
                  <label key={day} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E8E0] bg-surface-1 px-3 py-1.5 text-xs font-medium hover:bg-surface-2">
                    <input
                      type="checkbox"
                      className="accent-metric-blue"
                      checked={workingDays.includes(day)}
                      onChange={(event) =>
                        setWorkingDays((current) =>
                          event.target.checked ? [...current, day] : current.filter((value) => value !== day),
                        )
                      }
                    />
                    {day.slice(0, 3)}
                  </label>
                ))}
              </div>
            </Field>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" disabled={workingDays.length === 0} className="inline-flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                Create department
              </Button>
            </div>
          </form>
        </Card>
      )}

      {state.departments.length === 0 ? (
        <Card>
          <div className="mx-auto max-w-xl py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EBF1FF] text-metric-blue">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-ink">Create your first department</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-body-gray">
              Departments keep their own configuration, people, resources, and timetable library. Start here, then open a department to generate schedules.
            </p>
            {canManage && (
              <Button onClick={() => setCreateOpen(true)} className="mt-6 inline-flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                Create department
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {state.departments.map((department) => {
            const timetableCount = state.timetables.filter((timetable) => timetable.departmentId === department.id).length;
            const sectionsCount = state.sections.filter((section) => section.departmentId === department.id).length;
            const subjectsCount = state.subjects.filter((subject) => subject.departmentId === department.id).length;
            const facultyCount = state.faculty.filter((member) => member.departmentId === department.id).length;

            return (
              <Card key={department.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-metric-blue">{department.code}</p>
                    <h2 className="mt-1 truncate text-lg font-bold text-ink">{department.name}</h2>
                    <p className="mt-1 text-xs text-body-gray">
                      {department.workingDays.length} working days · {department.periodsPerDay} periods/day
                    </p>
                  </div>
                  <Badge tone={statusTone(department.status)}>{department.status.replaceAll('_', ' ')}</Badge>
                </div>

                <dl className="mt-5 grid grid-cols-4 gap-2 rounded-xl border border-[#E5E8E0] bg-surface-1 p-3 text-center">
                  <div><dt className="text-[10px] uppercase tracking-wide text-body-gray">Sections</dt><dd className="mt-1 text-sm font-bold text-ink">{sectionsCount}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wide text-body-gray">Subjects</dt><dd className="mt-1 text-sm font-bold text-ink">{subjectsCount}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wide text-body-gray">Faculty</dt><dd className="mt-1 text-sm font-bold text-ink">{facultyCount}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wide text-body-gray">Schedules</dt><dd className="mt-1 text-sm font-bold text-ink">{timetableCount}</dd></div>
                </dl>

                <div className="mt-5 flex items-center gap-2">
                  <Link
                    to={`/departments/${department.id}`}
                    onClick={() => {
                      state.setActiveDepartment(department.id);
                      state.setActiveTimetable(null);
                    }}
                    className="flex-1"
                  >
                    <Button className="w-full inline-flex items-center justify-center gap-1.5">
                      Open department <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  {canManage && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-label={`Edit ${department.name}`}
                        onClick={() => {
                          setEditingId(department.id);
                          setEditForm({ code: department.code, name: department.name });
                        }}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        aria-label={`Delete ${department.name}`}
                        onClick={() => setDeletingId(department.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {state.departments.length > 0 && canManage && (
        <div className="rounded-2xl border border-[#D7E2FF] bg-[#F2F6FF] p-4 text-sm text-[#18366F]">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-metric-blue" />
            <p><strong>Next:</strong> open a department, finish its configuration, then create as many named timetables as you need for that department.</p>
          </div>
        </div>
      )}

      {editingId && (
        <EditModal
          title="Edit department details"
          onClose={() => setEditingId(null)}
          onSubmit={(event) => {
            event.preventDefault();
            const trimmedCode = editForm.code.trim().toUpperCase();
            const trimmedName = editForm.name.trim();
            if (!trimmedCode || !trimmedName) return;
            state.updateDepartment(editingId, { code: trimmedCode, name: trimmedName });
            setEditingId(null);
          }}
        >
          <div className="grid gap-4">
            <Field label="Department code"><Input value={editForm.code} onChange={(event) => setEditForm({ ...editForm, code: event.target.value })} required aria-label="Edit department code" /></Field>
            <Field label="Department name"><Input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} required aria-label="Edit department name" /></Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
              <Button type="submit">Save changes</Button>
            </div>
          </div>
        </EditModal>
      )}

      {deletingDepartment && (
        <EditModal
          title={`Delete ${deletingDepartment.name}?`}
          onClose={() => setDeletingId(null)}
          onSubmit={(event) => {
            event.preventDefault();
            void deleteDepartment();
          }}
        >
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-body-gray">
              This permanently removes the department and its sections, subjects, faculty, rooms, breaks, generation settings, and saved timetables from this workspace.
            </p>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-800">
              This action cannot be undone from the app. Export your workspace first if you need a backup.
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDeletingId(null)} disabled={isDeleting}>Cancel</Button>
              <Button type="submit" variant="danger" disabled={isDeleting} className="inline-flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? 'Deleting…' : 'Delete department'}
              </Button>
            </div>
          </div>
        </EditModal>
      )}
    </div>
  );
}
