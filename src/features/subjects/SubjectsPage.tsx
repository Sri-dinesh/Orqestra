import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Field, Input, Select } from '@/components/ui/primitives';
import { useEditorStore } from '@/state/stores/editor-store';
import { selectCurrentFaculty, selectCurrentSections, useWorkspaceStore } from '@/state/stores/workspace-store';
import type { SubjectType } from '@/domain/enums';

export function SubjectsPage() {
  const { departmentId } = useParams();
  const state = useWorkspaceStore();
  const sections = useWorkspaceStore(selectCurrentSections);
  const faculty = useWorkspaceStore(selectCurrentFaculty);
  const showToast = useEditorStore((s) => s.showToast);
  const subjects = state.subjects.filter((s) => s.departmentId === departmentId);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<SubjectType>('THEORY');
  const [sessions, setSessions] = useState(3);
  const [eligibleSections, setEligibleSections] = useState<string[]>([]);
  const [eligibleFaculty, setEligibleFaculty] = useState<string[]>([]);

  if (!departmentId) return <p className="text-sm text-slate-500">Select a department first.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Subjects</h1>

      <Card title="Add subject">
        <form
          className="grid gap-3 sm:grid-cols-2"
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
            <div className="flex flex-wrap gap-2">
              {sections.map((s) => (
                <label key={s.id} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={eligibleSections.includes(s.id)}
                    onChange={(e) =>
                      setEligibleSections((prev) =>
                        e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id),
                      )
                    }
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Eligible faculty">
            <div className="flex flex-wrap gap-2">
              {faculty.map((f) => (
                <label key={f.id} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={eligibleFaculty.includes(f.id)}
                    onChange={(e) =>
                      setEligibleFaculty((prev) =>
                        e.target.checked ? [...prev, f.id] : prev.filter((x) => x !== f.id),
                      )
                    }
                  />
                  {f.name}
                </label>
              ))}
            </div>
          </Field>
          <div className="sm:col-span-2"><Button type="submit">Add subject</Button></div>
        </form>
      </Card>

      <Card title={`Subjects (${subjects.length})`}>
        {subjects.length === 0 ? (
          <p className="text-sm text-slate-500">No subjects yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {subjects.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
                <div>
                  <strong>{s.code}</strong> — {s.name}{' '}
                  <span className="text-xs text-slate-400">
                    ({s.type}, {s.sessionsPerWeek}/wk, {s.durationPeriods}p{type === 'LAB' ? '' : ''}, {s.eligibleFacultyIds.length} faculty)
                  </span>
                  {!s.active && <span className="ml-2 text-xs text-red-600">inactive</span>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => state.updateSubject(s.id, { active: !s.active })}
                  >
                    {s.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="danger"
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
      <Link className="text-sm text-blue-600 underline" to={`/departments/${departmentId}/configuration`}>
        Back to configuration
      </Link>
    </div>
  );
}
