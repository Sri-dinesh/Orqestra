import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, EditModal, Field, Input, PageHeader, Select } from '@/components/ui/primitives';
import { useEditorStore } from '@/state/stores/editor-store';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import type { SubjectType } from '@/domain/enums';
import type { Subject } from '@/domain/models';
import { BulkImportModal } from '@/components/ui/BulkImportModal';
import { DepartmentNav } from '@/components/ui/DepartmentNav';
import { DepartmentNotFound } from '@/components/ui/DepartmentNotFound';

interface SubjectFormState {
  code: string;
  name: string;
  courseCode: string;
  type: SubjectType;
  sessions: number;
  eligibleSections: string[];
  eligibleFaculty: string[];
}

function subjectFormFrom(s: Subject): SubjectFormState {
  return {
    code: s.code,
    name: s.name,
    courseCode: s.courseCode ?? '',
    type: s.type,
    sessions: s.sessionsPerWeek,
    eligibleSections: [...s.eligibleSectionIds],
    eligibleFaculty: [...s.eligibleFacultyIds],
  };
}

function CheckboxChips({
  options,
  selected,
  onToggle,
  emptyMessage = 'None available yet.',
}: {
  options: Array<{ id: string; label: string }>;
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
  emptyMessage?: string;
}) {
  if (options.length === 0) return <p className="text-xs text-body-gray italic">{emptyMessage}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label
          key={o.id}
          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[#F1F3ED] px-3 py-1.5 text-xs font-medium text-[#111315] transition-colors duration-150 has-checked:bg-blue-100 hover:bg-[#E5E8E0]"
        >
          <input
            type="checkbox"
            className="accent-metric-blue"
            checked={selected.includes(o.id)}
            onChange={(e) => onToggle(o.id, e.target.checked)}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function SubjectsPage() {
  const { departmentId } = useParams();
  const state = useWorkspaceStore();

  useEffect(() => {
    if (departmentId && state.activeDepartmentId !== departmentId) {
      state.setActiveDepartment(departmentId);
    }
  }, [departmentId, state.activeDepartmentId, state.setActiveDepartment]);

  const department = state.departments.find((d) => d.id === departmentId);
  const sections = useMemo(
    () => state.sections.filter((s) => s.departmentId === departmentId),
    [state.sections, departmentId],
  );
  const faculty = useMemo(
    () => state.faculty.filter((f) => f.departmentId === departmentId),
    [state.faculty, departmentId],
  );
  const showToast = useEditorStore((s) => s.showToast);
  const subjects = useMemo(
    () => state.subjects.filter((s) => s.departmentId === departmentId),
    [state.subjects, departmentId],
  );

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<SubjectType>('THEORY');
  const [sessions, setSessions] = useState(3);
  const [eligibleSections, setEligibleSections] = useState<string[]>([]);
  const [eligibleFaculty, setEligibleFaculty] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SubjectFormState | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const editing = editingId ? (subjects.find((s) => s.id === editingId) ?? null) : null;

  if (!department || !departmentId) return <DepartmentNotFound requestedId={departmentId} targetPage="subjects" />;

  const handleBulkImport = (items: any[]) => {
    let count = 0;
    for (const item of items) {
      if (subjects.some((s) => s.code === item.code)) continue;
      state.addSubject({
        departmentId,
        code: item.code,
        name: item.name,
        courseCode: item.courseCode ?? undefined,
        type: item.type,
        sessionsPerWeek: item.sessionsPerWeek,
        durationPeriods: item.type === 'LAB' ? 2 : 1,
        eligibleSectionIds: sections.map((s) => s.id),
        eligibleFacultyIds: [],
      });
      count++;
    }
    showToast('success', `Imported ${count} subjects successfully.`);
  };

  return (
    <div className="space-y-6">
      <DepartmentNav />
      <PageHeader
        eyebrow="Course catalogue"
        title="Subjects"
        actions={
          <Button variant="secondary" size="sm" onClick={() => setImportModalOpen(true)}>
            Bulk Import (Excel/CSV)
          </Button>
        }
      />

      <Card title="Add subject">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!code.trim() || !name.trim()) return;
            if (subjects.some((s) => s.code === code.trim().toUpperCase())) {
              showToast('error', `Subject code ${code} already exists in this department.`);
              return;
            }
            state.addSubject({
              departmentId,
              code,
              name,
              type,
              sessionsPerWeek: Math.max(1, sessions),
              durationPeriods: type === 'LAB' ? 2 : 1,
              eligibleFacultyIds: eligibleFaculty,
              eligibleSectionIds: eligibleSections,
            });
            showToast('success', `Subject ${code} added.`);
            setCode('');
            setName('');
            setEligibleSections([]);
            setEligibleFaculty([]);
          }}
        >
          <Field label="Code"><Input value={code} onChange={(e) => setCode(e.target.value)} required aria-label="Subject code" /></Field>
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} required aria-label="Subject name" /></Field>
          <Field label="Type" hint="Lab = 2 consecutive periods; theory = 1 period.">
            <Select value={type} onChange={(e) => setType(e.target.value as SubjectType)} aria-label="Subject type">
              <option value="THEORY">Theory</option>
              <option value="LAB">Laboratory</option>
            </Select>
          </Field>
          <Field label="Sessions per week">
            <Input type="number" min={1} max={12} value={sessions} onChange={(e) => setSessions(Number(e.target.value))} aria-label="Sessions per week" />
          </Field>
          <Field label="Applicable sections">
            <CheckboxChips
              options={sections.map((s) => ({ id: s.id, label: s.name }))}
              selected={eligibleSections}
              onToggle={(id, checked) =>
                setEligibleSections((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
              }
            />
          </Field>
          <Field label="Eligible faculty">
            <CheckboxChips
              options={faculty.map((f) => ({ id: f.id, label: f.name }))}
              selected={eligibleFaculty}
              emptyMessage="No faculty added yet. You can assign faculty in Step 3."
              onToggle={(id, checked) =>
                setEligibleFaculty((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
              }
            />
          </Field>
          <div className="sm:col-span-2"><Button type="submit" size="sm">Add subject</Button></div>
        </form>
      </Card>

      <Card title={`Subjects (${subjects.length})`}>
        {subjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E8E0] bg-[#FAFBF9] p-6 text-center">
            <p className="text-sm font-semibold text-[#111315]">No subjects in catalogue yet</p>
            <p className="mt-1 text-xs text-body-gray">
              Add your department's theory and lab subjects above, or use Bulk Import to load from Excel or CSV.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {subjects.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#FAFBF9] px-3 py-2.5 border border-[#E5E8E0]">
                <div className="min-w-0">
                  <p className="text-sm text-[#111315]">
                    <strong>{s.code}</strong> — {s.name}
                    {!s.active && <span className="ml-2 text-xs font-medium text-rose-700">inactive</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-[#71767B]">
                    {s.type === 'LAB' ? 'Lab' : 'Theory'} · {s.sessionsPerWeek}/wk · {s.durationPeriods}p · {s.eligibleFacultyIds.length} faculty · {s.eligibleSectionIds.length} sections
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(s.id);
                      setEditForm(subjectFormFrom(s));
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => state.updateSubject(s.id, { active: !s.active })}>
                    {s.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const res = state.removeSubject(s.id);
                      showToast(res.blocked ? 'warning' : 'success', res.reason ?? `Subject ${s.code} removed.`);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Guided Bottom Navigation Flow */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link to={`/departments/${departmentId}/configuration`}>
          <Button variant="secondary">
            ← Step 1: Configuration
          </Button>
        </Link>
        <Link to={`/departments/${departmentId}/faculty`}>
          <Button>
            Next Step: Faculty →
          </Button>
        </Link>
      </div>

      {editing && editForm && (
        <EditModal
          title={`Edit subject ${editing.code}`}
          onClose={() => {
            setEditingId(null);
            setEditForm(null);
          }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!editForm.code.trim() || !editForm.name.trim()) return;
            const duplicate = subjects.some(
              (s) => s.id !== editing.id && s.code === editForm.code.trim().toUpperCase(),
            );
            if (duplicate) {
              showToast('error', `Subject code ${editForm.code} already exists in this department.`);
              return;
            }
            state.updateSubject(editing.id, {
              code: editForm.code.trim(),
              name: editForm.name.trim(),
              courseCode: editForm.courseCode.trim() ? editForm.courseCode.trim() : undefined,
              type: editForm.type,
              sessionsPerWeek: Math.max(1, editForm.sessions),
              durationPeriods: editForm.type === 'LAB' ? 2 : 1,
              eligibleFacultyIds: editForm.eligibleFaculty,
              eligibleSectionIds: editForm.eligibleSections,
            });
            showToast('success', `Subject ${editForm.code} updated.`);
            setEditingId(null);
            setEditForm(null);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code"><Input value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} required aria-label="Edit subject code" /></Field>
            <Field label="Name"><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required aria-label="Edit subject name" /></Field>
            <Field label="Course code" hint="Official exports (e.g. A8519)"><Input value={editForm.courseCode} onChange={(e) => setEditForm({ ...editForm, courseCode: e.target.value })} placeholder="A8519" aria-label="Edit course code" /></Field>
            <Field label="Type" hint="Changing type also updates session length (lab = 2 periods).">
              <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value as SubjectType })} aria-label="Edit subject type">
                <option value="THEORY">Theory</option>
                <option value="LAB">Laboratory</option>
              </Select>
            </Field>
            <Field label="Sessions per week">
              <Input type="number" min={1} max={12} value={editForm.sessions} onChange={(e) => setEditForm({ ...editForm, sessions: Number(e.target.value) })} aria-label="Edit sessions per week" />
            </Field>
            <Field label="Applicable sections">
              <CheckboxChips
                options={sections.map((s) => ({ id: s.id, label: s.name }))}
                selected={editForm.eligibleSections}
                onToggle={(id, checked) =>
                  setEditForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          eligibleSections: checked
                            ? [...prev.eligibleSections, id]
                            : prev.eligibleSections.filter((x) => x !== id),
                        }
                      : prev,
                  )
                }
              />
            </Field>
            <Field label="Eligible faculty">
              <CheckboxChips
                options={faculty.map((f) => ({ id: f.id, label: f.name }))}
                selected={editForm.eligibleFaculty}
                onToggle={(id, checked) =>
                  setEditForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          eligibleFaculty: checked
                            ? [...prev.eligibleFaculty, id]
                            : prev.eligibleFaculty.filter((x) => x !== id),
                        }
                      : prev,
                  )
                }
              />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Save changes</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setEditForm(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </EditModal>
      )}

      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="SUBJECTS"
        departmentId={departmentId}
        onImport={handleBulkImport}
      />
    </div>
  );
}
