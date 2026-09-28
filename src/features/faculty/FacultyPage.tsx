import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Field, Input } from '@/components/ui/primitives';
import { useEditorStore } from '@/state/stores/editor-store';
import {
  selectCurrentSections,
  selectCurrentSubjects,
  selectTimetableForActiveDepartment,
  useWorkspaceStore,
} from '@/state/stores/workspace-store';
import { computeFacultyWorkload } from '@/domain/scheduler/feasibility';

export function FacultyPage() {
  const { departmentId } = useParams();
  const state = useWorkspaceStore();
  const subjects = useWorkspaceStore(selectCurrentSubjects);
  const sections = useWorkspaceStore(selectCurrentSections);
  const timetable = useWorkspaceStore(selectTimetableForActiveDepartment);
  const showToast = useEditorStore((s) => s.showToast);
  const members = state.faculty.filter((f) => f.departmentId === departmentId);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [maxPerDay, setMaxPerDay] = useState<string>('');
  const [maxPerWeek, setMaxPerWeek] = useState<string>('');

  if (!departmentId) return <p className="text-sm text-slate-500">Select a department first.</p>;

  const assignedLoad = new Map<string, number>();
  if (timetable) {
    for (const e of timetable.entries) {
      assignedLoad.set(e.facultyId, (assignedLoad.get(e.facultyId) ?? 0) + e.durationPeriods);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Faculty</h1>

      <Card title="Add faculty member">
        <form
          className="grid gap-3 sm:grid-cols-4"
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
          <Field label="Max periods/day (optional)"><Input type="number" min={1} value={maxPerDay} onChange={(e) => setMaxPerDay(e.target.value)} aria-label="Max periods per day" /></Field>
          <Field label="Max periods/week (optional)"><Input type="number" min={1} value={maxPerWeek} onChange={(e) => setMaxPerWeek(e.target.value)} aria-label="Max periods per week" /></Field>
          <div className="sm:col-span-4"><Button type="submit">Add faculty</Button></div>
        </form>
      </Card>

      <Card title={`Faculty (${members.length})`}>
        {members.length === 0 ? (
          <p className="text-sm text-slate-500">No faculty yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {members.map((f) => {
              const required = computeFacultyWorkload(f, sections.filter((s) => s.active), subjects);
              const assigned = assignedLoad.get(f.id) ?? 0;
              const capacity = f.maxPeriodsPerWeek ?? null;
              const over = capacity !== null && required > capacity;
              return (
                <li key={f.id} className="rounded border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>{f.facultyCode}</strong> — {f.name}{' '}
                      {!f.active && <span className="text-xs text-red-600">inactive</span>}
                      <div className="mt-1 text-xs text-slate-500">
                        Required weekly periods: <strong>{required}</strong>
                        {timetable ? <> · Assigned (current timetable): <strong>{assigned}</strong></> : null}
                        {capacity !== null ? <> · Remaining capacity: <strong className={over ? 'text-red-600' : ''}>{capacity - required}</strong></> : null}
                        {over && <span className="ml-2 text-xs font-semibold text-red-600">Over capacity</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        Subjects:
                        {subjects
                          .filter((s) => f.subjectIds.includes(s.id) || s.eligibleFacultyIds.includes(f.id))
                          .map((s) => (
                            <label key={s.id} className="flex items-center gap-1">
                              <input
                                type="checkbox"
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
                        {subjects.length === 0 && <span>none available</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => state.updateFaculty(f.id, { active: !f.active })}>
                        {f.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="danger"
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
      <Link className="text-sm text-blue-600 underline" to={`/departments/${departmentId}/configuration`}>
        Back to configuration
      </Link>
    </div>
  );
}
