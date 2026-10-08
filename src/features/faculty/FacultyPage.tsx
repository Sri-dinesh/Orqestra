import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, EditModal, Field, Input, PageHeader } from '@/components/ui/primitives';
import { AvailabilityGrid } from '@/components/ui/AvailabilityGrid';
import type { FacultyAvailability } from '@/domain/models';
import { useEditorStore } from '@/state/stores/editor-store';
import {
  selectCurrentSections,
  selectCurrentSubjects,
  selectTimetableForActiveDepartment,
  useWorkspaceStore,
} from '@/state/stores/workspace-store';
import { computeFacultyWorkload } from '@/domain/scheduler/feasibility';
import type { Faculty } from '@/domain/models';

interface FacultyFormState {
  facultyCode: string;
  name: string;
  maxPerDay: string;
  maxPerWeek: string;
}

function facultyFormFrom(f: Faculty): FacultyFormState {
  return {
    facultyCode: f.facultyCode,
    name: f.name,
    maxPerDay: f.maxPeriodsPerDay === null ? '' : String(f.maxPeriodsPerDay),
    maxPerWeek: f.maxPeriodsPerWeek === null ? '' : String(f.maxPeriodsPerWeek),
  };
}

export function FacultyPage() {
  const { departmentId } = useParams();
  const state = useWorkspaceStore();
  const subjects = useWorkspaceStore(selectCurrentSubjects);
  const sections = useWorkspaceStore(selectCurrentSections);
  const timetable = useWorkspaceStore(selectTimetableForActiveDepartment);
  const showToast = useEditorStore((s) => s.showToast);
  const members = state.faculty.filter((f) => f.departmentId === departmentId);
  const department = state.departments.find((d) => d.id === departmentId);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [maxPerDay, setMaxPerDay] = useState('');
  const [maxPerWeek, setMaxPerWeek] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FacultyFormState | null>(null);
  const [editAvailability, setEditAvailability] = useState<FacultyAvailability[]>([]);
  const [editPreferred, setEditPreferred] = useState<FacultyAvailability[]>([]);

  const editing = editingId ? (members.find((f) => f.id === editingId) ?? null) : null;

  if (!departmentId) return <p className="text-sm text-body-gray">Select a department first.</p>;

  const assignedLoad = new Map<string, number>();
  if (timetable) {
    for (const e of timetable.entries) {
      assignedLoad.set(e.facultyId, (assignedLoad.get(e.facultyId) ?? 0) + e.durationPeriods);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Teaching staff" title="Faculty" />

      <Card title="Add faculty member">
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!code.trim() || !name.trim()) return;
            state.addFaculty({
              departmentId,
              facultyCode: code,
              name,
              subjectIds: [],
              sectionIds: [],
              availability: [],
              preferredSlots: [],
              maxPeriodsPerDay: maxPerDay ? Number(maxPerDay) : null,
              maxPeriodsPerWeek: maxPerWeek ? Number(maxPerWeek) : null,
            });
            showToast('success', `Faculty ${code} added.`);
            setCode('');
            setName('');
            setMaxPerDay('');
            setMaxPerWeek('');
          }}
        >
          <Field label="Code"><Input value={code} onChange={(e) => setCode(e.target.value)} required aria-label="Faculty code" /></Field>
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} required aria-label="Faculty name" /></Field>
          <Field label="Max periods/day" hint="Optional">
            <Input type="number" min={1} value={maxPerDay} onChange={(e) => setMaxPerDay(e.target.value)} aria-label="Max periods per day" />
          </Field>
          <Field label="Max periods/week" hint="Optional">
            <Input type="number" min={1} value={maxPerWeek} onChange={(e) => setMaxPerWeek(e.target.value)} aria-label="Max periods per week" />
          </Field>
          <div className="lg:col-span-4"><Button type="submit" size="sm">Add faculty</Button></div>
        </form>
      </Card>

      <Card title={`Faculty (${members.length})`}>
        {members.length === 0 ? (
          <p className="text-sm text-body-gray">No faculty yet.</p>
        ) : (
          <ul className="space-y-2">
            {members.map((f) => {
              const required = computeFacultyWorkload(f, sections.filter((s) => s.active), subjects);
              const assigned = assignedLoad.get(f.id) ?? 0;
              const capacity = f.maxPeriodsPerWeek ?? null;
              const over = capacity !== null && required > capacity;
              return (
                <li key={f.id} className="rounded-xl bg-[#FAFBF9] px-3 py-2.5 border border-[#E5E8E0]">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-[#111315]">
                        <strong>{f.facultyCode}</strong> — {f.name}
                        {!f.active && <span className="ml-2 text-xs font-medium text-rose-700">inactive</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-[#71767B]">
                        Required: <strong className="text-ink">{required}</strong>/wk
                        {timetable ? (<> · Assigned: <strong className="text-ink">{assigned}</strong></>) : null}
                        {capacity !== null ? (<> · Capacity {capacity}</>) : null}
                        {over && <span className="ml-1.5 font-semibold text-rose-700">Over capacity</span>}
                      </p>                          <p className="mt-0.5 text-[11px] text-[#71767B]">
                        {f.availability.length === 0
                          ? 'Availability: all slots'
                          : `Availability: ${f.availability.reduce((a, w) => a + w.durationPeriods, 0)} periods/wk`}
                        {f.preferredSlots.length > 0 &&
                          ` · ${f.preferredSlots.reduce((a, w) => a + w.durationPeriods, 0)} preferred`}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {subjects
                          .filter((s) => f.subjectIds.includes(s.id) || s.eligibleFacultyIds.includes(f.id))
                          .map((s) => (
                            <label
                              key={s.id}
                              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#111315] ring-1 ring-inset ring-[#E5E8E0] transition-colors duration-150 has-checked:bg-blue-100 hover:bg-[#FAFBF9]"
                            >
                              <input
                                type="checkbox"
                                className="accent-metric-blue"
                                checked={s.eligibleFacultyIds.includes(f.id)}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...s.eligibleFacultyIds, f.id]
                                    : s.eligibleFacultyIds.filter((x) => x !== f.id);
                                  state.updateSubject(s.id, { eligibleFacultyIds: next });
                                }}
                              />
                              {s.code}
                            </label>
                          ))}
                        {subjects.length === 0 && <span className="text-[11px] text-body-gray">No subjects available</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(f.id);
                          setEditForm(facultyFormFrom(f));
                          setEditAvailability(f.availability);
                          setEditPreferred(f.preferredSlots);
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => state.updateFaculty(f.id, { active: !f.active })}>
                        {f.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          const res = state.removeFaculty(f.id);
                          showToast(res.blocked ? 'warning' : 'success', res.reason ?? `Faculty ${f.facultyCode} removed.`);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Link className="text-sm text-metric-blue underline" to={`/departments/${departmentId}/configuration`}>
        Back to configuration
      </Link>

      {editing && editForm && (
        <EditModal
          title={`Edit faculty ${editing.facultyCode}`}
          onClose={() => {
            setEditingId(null);
            setEditForm(null);
          }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!editForm.facultyCode.trim() || !editForm.name.trim()) return;
            const duplicate = members.some(
              (m) => m.id !== editing.id && m.facultyCode === editForm.facultyCode.trim(),
            );
            if (duplicate) {
              showToast('error', `Faculty code ${editForm.facultyCode} already exists in this department.`);
              return;
            }
            state.updateFaculty(editing.id, {
              facultyCode: editForm.facultyCode.trim(),
              name: editForm.name.trim(),
              maxPeriodsPerDay: editForm.maxPerDay ? Number(editForm.maxPerDay) : null,
              maxPeriodsPerWeek: editForm.maxPerWeek ? Number(editForm.maxPerWeek) : null,
              availability: editAvailability,
              preferredSlots: editPreferred,
            });
            showToast('success', `Faculty ${editForm.facultyCode} updated.`);
            setEditingId(null);
            setEditForm(null);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code"><Input value={editForm.facultyCode} onChange={(e) => setEditForm({ ...editForm, facultyCode: e.target.value })} required aria-label="Edit faculty code" /></Field>
            <Field label="Name"><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required aria-label="Edit faculty name" /></Field>
            <Field label="Max periods/day" hint="Optional">
              <Input type="number" min={1} value={editForm.maxPerDay} onChange={(e) => setEditForm({ ...editForm, maxPerDay: e.target.value })} aria-label="Edit max periods per day" />
            </Field>
            <Field label="Max periods/week" hint="Optional">
              <Input type="number" min={1} value={editForm.maxPerWeek} onChange={(e) => setEditForm({ ...editForm, maxPerWeek: e.target.value })} aria-label="Edit max periods per week" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Availability & preferred slots">
                <AvailabilityGrid
                  workingDays={department?.workingDays ?? ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']}
                  periodsPerDay={department?.periodsPerDay ?? 7}
                  breaks={state.breaks}
                  availability={editAvailability}
                  preferredSlots={editPreferred}
                  onChange={(a, p) => {
                    setEditAvailability(a);
                    setEditPreferred(p);
                  }}
                />
              </Field>
            </div>
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
    </div>
  );
}
