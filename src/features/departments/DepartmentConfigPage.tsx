import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, Field, Input, Select } from '@/components/ui/primitives';
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

  if (!department) {
    return (
      <div className="text-sm text-slate-500">
        No department selected. <Link className="text-blue-600 underline" to="/">Go to dashboard</Link>.
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {department.code} — Configuration
        </h1>
        <Badge tone={department.status === 'READY' ? 'green' : 'amber'}>{department.status}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Academic period details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Periods per day">
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
            <div className="sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-600">Working days</span>
              <div className="flex flex-wrap gap-3">
                {WORKING_DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
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

        <Card title={`Sections (${sections.length})`}>
          <form
            className="mb-4 grid gap-3 sm:grid-cols-4"
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
            <Field label="Year"><Input type="number" min={1} max={8} value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year" /></Field>
            <Field label="Semester"><Input type="number" min={1} max={12} value={semester} onChange={(e) => setSemester(Number(e.target.value))} aria-label="Semester" /></Field>
            <Field label="Students"><Input type="number" min={0} value={studentCount} onChange={(e) => setStudentCount(Number(e.target.value))} aria-label="Student count" /></Field>
            <div className="sm:col-span-4"><Button type="submit">Add section</Button></div>
          </form>
          <ul className="space-y-2 text-sm">
            {sections.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
                <span>
                  <strong>{s.name}</strong> · Y{s.year} S{s.semester} · {s.studentCount} students
                </span>
                <Button variant="danger" onClick={() => state.removeSection(s.id)} aria-label={`Remove section ${s.name}`}>
                  Remove
                </Button>
              </li>
            ))}
            {sections.length === 0 && <li className="text-xs text-slate-500">No sections yet.</li>}
          </ul>
        </Card>
      </div>

      <Card title={`Section requirements (${subjects.length} subjects, ${faculty.length} faculty available)`}>
        {sections.length === 0 || subjects.length === 0 ? (
          <p className="text-sm text-slate-500">
            Add sections and subjects first, then assign weekly requirements here.
          </p>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="rounded border border-slate-200 p-3">
                <h3 className="mb-2 text-sm font-semibold">{section.name}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500">
                      <th className="py-1">Subject</th>
                      <th className="py-1">Sessions / week</th>
                      <th className="py-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.filter((sub) => sub.active).map((sub) => {
                      const req = requirementsForSection(section.id).find((r) => r.subjectId === sub.id);
                      const value = req?.sessionsPerWeek ?? 0;
                      const applicable = sub.eligibleSectionIds.includes(section.id);
                      return (
                        <tr key={sub.id} className="border-t border-slate-100">
                          <td className="py-1">
                            {sub.code} — {sub.name}{' '}<span className="text-xs text-slate-400">({sub.type})</span>
                            {!applicable && value > 0 && (
                              <button
                                type="button"
                                className="ml-2 text-[11px] text-blue-600 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                                onClick={() =>
                                  state.updateSubject(sub.id, {
                                    eligibleSectionIds: [...sub.eligibleSectionIds, section.id],
                                  })
                                }
                              >
                                Mark applicable to {section.name}
                              </button>
                            )}
                          </td>
                          <td className="py-1">
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
                                  // Auto-wire applicability when a requirement is entered
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
                          <td></td>
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

      <div className="flex gap-2">
        <Button onClick={() => navigate(`/departments/${department.id}/subjects`)}>Manage subjects</Button>
        <Button onClick={() => navigate(`/departments/${department.id}/faculty`)}>Manage faculty</Button>
        <Button onClick={() => navigate(`/departments/${department.id}/generate`)}>Generate timetable</Button>
      </div>
    </div>
  );
}
