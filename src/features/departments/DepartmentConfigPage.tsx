import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, EditModal, Field, Input, PageHeader, Select } from '@/components/ui/primitives';
import {
  selectCurrentSections,
  selectCurrentSubjects,
  selectCurrentFaculty,
  useWorkspaceStore,
} from '@/state/stores/workspace-store';
import { WORKING_DAYS } from '@/domain/enums';
import type { WorkingDay } from '@/domain/enums';
import type { SubjectRequirement } from '@/domain/models';

export function DepartmentConfigPage() {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const state = useWorkspaceStore();
  const department = state.departments.find((d) => d.id === departmentId) ?? null;
  const sections = useWorkspaceStore(selectCurrentSections);
  const subjects = useWorkspaceStore(selectCurrentSubjects);
  const faculty = useWorkspaceStore(selectCurrentFaculty);

  const [sectionName, setSectionName] = useState('');
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [studentCount, setStudentCount] = useState(60);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionEditForm, setSectionEditForm] = useState({ name: '', year: 1, semester: 1, studentCount: 0, roomNo: '', classAdvisor: '' });
  const [editingDepartment, setEditingDepartment] = useState(false);
  const [departmentEditForm, setDepartmentEditForm] = useState({ code: '', name: '' });

  if (!department) {
    return (
      <div className="rounded-card bg-white p-10 text-center shadow-panel">
        <p className="text-sm font-medium text-ink">No department selected</p>
        <p className="mt-1 text-sm text-body-gray">
          Pick one from the{' '}
          <Link className="text-metric-blue underline" to="/">
            dashboard
          </Link>
          .
        </p>
      </div>
    );
  }

  const updateDays = (day: WorkingDay, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...department.workingDays, day]))
      : department.workingDays.filter((d) => d !== day);
    if (next.length === 0) return;
    state.updateDepartment(department.id, { workingDays: next });
  };

  const requirementsForSection = (sectionId: string): SubjectRequirement[] =>
    state.sections.find((s) => s.id === sectionId)?.subjectRequirements ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Department setup"
        title={`${department.code} — Configuration`}
        actions={
          <>
            <Badge tone={department.status === 'READY' ? 'green' : 'amber'}>{department.status}</Badge>
            <Button
              variant="secondary"
              onClick={() => {
                setDepartmentEditForm({ code: department.code, name: department.name });
                setEditingDepartment(true);
              }}
            >
              Edit details
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Academic period details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Teaching periods per day" hint="Breaks (e.g. lunch) add their own columns and are never counted here.">
              <Input
                type="number"
                min={1}
                max={12}
                value={department.periodsPerDay}
                onChange={(e) =>
                  state.updateDepartment(department.id, {
                    periodsPerDay: Math.max(1, Math.min(12, Number(e.target.value) || 1)),
                  })
                }
                aria-label="Periods per day"
              />
            </Field>
            <Field label="Status">
              <Select
                value={department.status}
                onChange={(e) => state.updateDepartment(department.id, { status: e.target.value as 'DRAFT' | 'READY' | 'ARCHIVED' })}
                aria-label="Department status"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="READY">READY</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </Select>
            </Field>
            <Field label="Effective from" hint="Official exports">
              <Input
                value={department.effectiveFrom ?? ''}
                onChange={(e) =>
                  state.updateDepartment(department.id, {
                    effectiveFrom: e.target.value.trim() ? e.target.value.trim() : undefined,
                  })
                }
                placeholder="01-06-2026"
                aria-label="Effective from date"
              />
            </Field>
            <Field label="Mentors" hint="Official exports, free text">
              <Input
                value={department.mentors ?? ''}
                onChange={(e) =>
                  state.updateDepartment(department.id, {
                    mentors: e.target.value.trim() ? e.target.value : undefined,
                  })
                }
                placeholder="Name (roll range), …"
                aria-label="Mentors"
              />
            </Field>
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-body-gray">Working days</span>
              <div className="flex flex-wrap gap-2">
                {WORKING_DAYS.map((day) => (
                  <label key={day} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 has-checked:bg-info-bg hover:bg-surface-3">
                    <input
                      type="checkbox"
                      className="accent-metric-blue"
                      checked={department.workingDays.includes(day)}
                      onChange={(e) => updateDays(day, e.target.checked)}
                    />
                    {day.slice(0, 3)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Period timings">
          <p className="mb-3 text-xs text-body-gray">
            Wall-clock times for each teaching period, shown in timetable grids and exports. Leave blank to show period numbers only.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: department.periodsPerDay }, (_, i) => {
              const current = department.periodTimings?.[i] ?? { start: '', end: '' };
              const setTiming = (patch: { start?: string; end?: string }) => {
                const next = Array.from({ length: department.periodsPerDay }, (_, j) =>
                  j === i
                    ? { start: patch.start ?? department.periodTimings?.[j]?.start ?? '', end: patch.end ?? department.periodTimings?.[j]?.end ?? '' }
                    : { ...(department.periodTimings?.[j] ?? { start: '', end: '' }) },
                );
                state.updateDepartment(department.id, { periodTimings: next });
              };
              return (
                <li key={i} className="flex items-center gap-1.5 rounded-xl bg-surface-1 px-2.5 py-2">
                  <span className="w-7 shrink-0 text-xs font-semibold text-ink">P{i + 1}</span>
                  <Input
                    value={current.start}
                    onChange={(e) => setTiming({ start: e.target.value })}
                    placeholder="9:10 AM"
                    aria-label={`Period ${i + 1} start time`}
                    className="min-w-0"
                  />
                  <span className="shrink-0 text-xs text-body-gray">–</span>
                  <Input
                    value={current.end}
                    onChange={(e) => setTiming({ end: e.target.value })}
                    placeholder="10:00 AM"
                    aria-label={`Period ${i + 1} end time`}
                    className="min-w-0"
                  />
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title={`Sections (${sections.length})`}>
          <form
            className="mb-5 grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!sectionName.trim()) return;
              state.addSection({
                departmentId: department.id,
                name: sectionName,
                year,
                semester,
                studentCount,
                subjectRequirements: [],
              });
              setSectionName('');
            }}
          >
            <Field label="Name"><Input value={sectionName} onChange={(e) => setSectionName(e.target.value)} required aria-label="Section name" /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Year"><Input type="number" min={1} max={8} value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year" /></Field>
              <Field label="Sem"><Input type="number" min={1} max={12} value={semester} onChange={(e) => setSemester(Number(e.target.value))} aria-label="Semester" /></Field>
              <Field label="Students"><Input type="number" min={0} value={studentCount} onChange={(e) => setStudentCount(Number(e.target.value))} aria-label="Student count" /></Field>
            </div>
            <div className="sm:col-span-2"><Button type="submit" size="sm">Add section</Button></div>
          </form>
          <ul className="space-y-2">
            {sections.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface-1 px-3 py-2">
                <span className="text-sm text-ink">
                  <strong>{s.name}</strong>
                  <span className="ml-2 text-xs text-body-gray">Y{s.year} S{s.semester} · {s.studentCount} students</span>
                </span>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSectionId(s.id);
                      setSectionEditForm({ name: s.name, year: s.year, semester: s.semester, studentCount: s.studentCount, roomNo: s.roomNo ?? '', classAdvisor: s.classAdvisor ?? '' });
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => state.removeSection(s.id)} aria-label={`Remove section ${s.name}`}>
                    Remove
                  </Button>
                </div>
              </li>
            ))}
            {sections.length === 0 && <li className="text-xs text-body-gray">No sections yet.</li>}
          </ul>
        </Card>
      </div>

      <Card title={`Section requirements — ${subjects.length} subjects, ${faculty.length} faculty available`}>
        {sections.length === 0 || subjects.length === 0 ? (
          <p className="text-sm text-body-gray">
            Add sections and subjects first, then assign weekly requirements here.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {sections.map((section) => (
              <div key={section.id} className="rounded-xl bg-surface-1 p-4">
                <h3 className="mb-2 text-sm font-semibold text-ink">{section.name}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-body-gray">
                      <th className="pb-1.5">Subject</th>
                      <th className="pb-1.5">Sessions / wk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.filter((sub) => sub.active).map((sub) => {
                      const req = requirementsForSection(section.id).find((r) => r.subjectId === sub.id);
                      const value = req?.sessionsPerWeek ?? 0;
                      const applicable = sub.eligibleSectionIds.includes(section.id);
                      return (
                        <tr key={sub.id} className="border-t border-white">
                          <td className="py-1.5 pr-2">
                            <span className="font-medium text-ink">{sub.code}</span>
                            <span className="ml-1.5 text-xs text-body-gray">{sub.type === 'LAB' ? 'Lab' : 'Theory'}</span>
                            {!applicable && value > 0 && (
                              <button
                                type="button"
                                className="ml-2 cursor-pointer text-[11px] text-metric-blue underline focus-visible:outline-2 focus-visible:outline-metric-blue"
                                onClick={() =>
                                  state.updateSubject(sub.id, {
                                    eligibleSectionIds: [...sub.eligibleSectionIds, section.id],
                                  })
                                }
                              >
                                Mark applicable
                              </button>
                            )}
                          </td>
                          <td className="py-1.5">
                            <Input
                              type="number"
                              min={0}
                              max={12}
                              value={value}
                              aria-label={`Sessions per week for ${sub.code} in ${section.name}`}
                              className="w-20"
                              onChange={(e) => {
                                const n = Math.max(0, Number(e.target.value) || 0);
                                const reqs = requirementsForSection(section.id).filter((r) => r.subjectId !== sub.id);
                                if (n > 0) {
                                  reqs.push({ id: `req_${section.id}_${sub.id}`, subjectId: sub.id, sessionsPerWeek: n });
                                  if (!sub.eligibleSectionIds.includes(section.id)) {
                                    state.updateSubject(sub.id, {
                                      eligibleSectionIds: [...sub.eligibleSectionIds, section.id],
                                    });
                                  }
                                }
                                state.updateSection(section.id, { subjectRequirements: reqs });
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => navigate(`/departments/${department.id}/subjects`)}>Manage subjects</Button>
        <Button variant="secondary" onClick={() => navigate(`/departments/${department.id}/faculty`)}>Manage faculty</Button>
        <Button onClick={() => navigate(`/departments/${department.id}/generate`)}>Generate timetable</Button>
      </div>

      {editingSectionId && (
        <EditModal
          title="Edit section"
          onClose={() => setEditingSectionId(null)}
          onSubmit={(e) => {
            e.preventDefault();
            if (!sectionEditForm.name.trim()) return;
            state.updateSection(editingSectionId, {
              name: sectionEditForm.name.trim(),
              year: Math.max(1, sectionEditForm.year),
              semester: Math.max(1, sectionEditForm.semester),
              studentCount: Math.max(0, sectionEditForm.studentCount),
              roomNo: sectionEditForm.roomNo.trim() ? sectionEditForm.roomNo.trim() : undefined,
              classAdvisor: sectionEditForm.classAdvisor.trim() ? sectionEditForm.classAdvisor.trim() : undefined,
            });
            setEditingSectionId(null);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><Input value={sectionEditForm.name} onChange={(e) => setSectionEditForm({ ...sectionEditForm, name: e.target.value })} required aria-label="Edit section name" /></Field>
            <Field label="Year"><Input type="number" min={1} max={8} value={sectionEditForm.year} onChange={(e) => setSectionEditForm({ ...sectionEditForm, year: Number(e.target.value) })} aria-label="Edit year" /></Field>
            <Field label="Semester"><Input type="number" min={1} max={12} value={sectionEditForm.semester} onChange={(e) => setSectionEditForm({ ...sectionEditForm, semester: Number(e.target.value) })} aria-label="Edit semester" /></Field>
            <Field label="Students"><Input type="number" min={0} value={sectionEditForm.studentCount} onChange={(e) => setSectionEditForm({ ...sectionEditForm, studentCount: Number(e.target.value) })} aria-label="Edit student count" /></Field>
            <Field label="Room No" hint="Official exports"><Input value={sectionEditForm.roomNo} onChange={(e) => setSectionEditForm({ ...sectionEditForm, roomNo: e.target.value })} placeholder="1020" aria-label="Edit room number" /></Field>
            <Field label="Class advisor" hint="Official exports"><Input value={sectionEditForm.classAdvisor} onChange={(e) => setSectionEditForm({ ...sectionEditForm, classAdvisor: e.target.value })} placeholder="Mr. P. Vikram" aria-label="Edit class advisor" /></Field>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Save changes</Button>
              <Button type="button" variant="secondary" onClick={() => setEditingSectionId(null)}>Cancel</Button>
            </div>
          </div>
        </EditModal>
      )}

      {editingDepartment && (
        <EditModal
          title="Edit department details"
          onClose={() => setEditingDepartment(false)}
          onSubmit={(e) => {
            e.preventDefault();
            if (!departmentEditForm.code.trim() || !departmentEditForm.name.trim()) return;
            state.updateDepartment(department.id, {
              code: departmentEditForm.code.trim(),
              name: departmentEditForm.name.trim(),
            });
            setEditingDepartment(false);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code"><Input value={departmentEditForm.code} onChange={(e) => setDepartmentEditForm({ ...departmentEditForm, code: e.target.value })} required aria-label="Edit department code" /></Field>
            <Field label="Name"><Input value={departmentEditForm.name} onChange={(e) => setDepartmentEditForm({ ...departmentEditForm, name: e.target.value })} required aria-label="Edit department name" /></Field>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Save changes</Button>
              <Button type="button" variant="secondary" onClick={() => setEditingDepartment(false)}>Cancel</Button>
            </div>
          </div>
        </EditModal>
      )}
    </div>
  );
}
