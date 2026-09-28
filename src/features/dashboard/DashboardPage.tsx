import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Badge, Button, Card, Field, Input } from '@/components/ui/primitives';
import {
  selectActiveDepartment,
  useWorkspaceStore,
} from '@/state/stores/workspace-store';
import type { Timetable } from '@/domain/models';
import { WORKING_DAYS } from '@/domain/enums';
import type { WorkingDay } from '@/domain/enums';
import { BUILT_IN_PRESETS, applyPreset } from '@/application/presets';
import { useEditorStore } from '@/state/stores/editor-store';
import { flushPersistence } from '@/hooks/usePersistence';

type DeptStatus =
  | 'NOT_CONFIGURED'
  | 'CONFIGURATION_INCOMPLETE'
  | 'READY'
  | 'GENERATED'
  | 'VALID'
  | 'INVALID'
  | 'STALE';

function computeDepartmentStatus(timetable: Timetable | undefined, sectionsCount: number, subjectsCount: number, facultyCount: number): DeptStatus {
  if (sectionsCount === 0 || subjectsCount === 0 || facultyCount === 0) {
    return 'CONFIGURATION_INCOMPLETE';
  }
  if (!timetable) return 'READY';
  return (timetable.status as DeptStatus) ?? 'READY';
}

export function DashboardPage() {
  const state = useWorkspaceStore();
  const navigate = useNavigate();
  const activeDepartment = selectActiveDepartment(state);
  const showToast = useEditorStore((s) => s.showToast);
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [periods, setPeriods] = useState(6);
  const [days, setDays] = useState<WorkingDay[]>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);

  const statusTone: Record<DeptStatus, 'green' | 'red' | 'amber' | 'slate' | 'blue'> = {
    NOT_CONFIGURED: 'slate',
    CONFIGURATION_INCOMPLETE: 'amber',
    READY: 'blue',
    GENERATED: 'blue',
    VALID: 'green',
    INVALID: 'red',
    STALE: 'amber',
  };

  const cards = useMemo(
    () =>
      state.departments.map((d) => {
        const sections = state.sections.filter((s) => s.departmentId === d.id);
        const subjects = state.subjects.filter((s) => s.departmentId === d.id);
        const faculty = state.faculty.filter((f) => f.departmentId === d.id);
        const timetable = state.timetables.find((t) => t.departmentId === d.id);
        const status = computeDepartmentStatus(timetable, sections.length, subjects.length, faculty.length);
        return { department: d, sections: sections.length, subjects: subjects.length, faculty: faculty.length, timetable, status };
      }),
    [state.departments, state.sections, state.subjects, state.faculty, state.timetables],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <Button onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Cancel' : 'Create department'}
        </Button>
      </div>

      {showCreate && (
        <Card title="New department">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!code.trim() || !name.trim()) return;
              state.addDepartment({ code, name, workingDays: days, periodsPerDay: periods });
              setCode('');
              setName('');
              setShowCreate(false);
            }}
          >
            <Field label="Code">
              <Input value={code} onChange={(e) => setCode(e.target.value)} required aria-label="Department code" />
            </Field>
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} required aria-label="Department name" />
            </Field>
            <Field label="Periods per day">
              <Input type="number" min={1} max={12} value={periods} onChange={(e) => setPeriods(Number(e.target.value))} aria-label="Periods per day" />
            </Field>
            <Field label="Working days">
              <div className="flex flex-wrap gap-2">
                {WORKING_DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={days.includes(day)}
                      onChange={(e) =>
                        setDays((prev) => (e.target.checked ? [...prev, day] : prev.filter((x) => x !== day)))
                      }
                    />
                    {day.slice(0, 3)}
                  </label>
                ))}
              </div>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Card>
      )}

      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No departments yet. Create one from scratch or start from a preset below.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ department, sections, subjects, faculty, timetable, status }) => (
            <Card key={department.id} title={`${department.code} — ${department.name}`}>
              <div className="mb-3 flex items-center gap-2">
                <Badge tone={statusTone[status]}>{status}</Badge>
                {timetable?.status === 'STALE' ? <Badge tone="amber">STALE</Badge> : null}
              </div>
              <dl className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div><dt className="text-slate-500">Sections</dt><dd className="font-semibold">{sections}</dd></div>
                <div><dt className="text-slate-500">Subjects</dt><dd className="font-semibold">{subjects}</dd></div>
                <div><dt className="text-slate-500">Faculty</dt><dd className="font-semibold">{faculty}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    state.setActiveDepartment(department.id);
                    window.location.hash = '';
                  }}
                >
                  <Link to={`/departments/${department.id}/configuration`}>Configure</Link>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => state.setActiveDepartment(department.id)}
                >
                  <Link to={`/departments/${department.id}/subjects`}>Subjects</Link>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => state.setActiveDepartment(department.id)}
                >
                  <Link to={`/departments/${department.id}/generate`}>Generate</Link>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => state.setActiveDepartment(department.id)}
                >
                  <Link to={`/departments/${department.id}/timetable`}>Timetable</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {activeDepartment ? (
        <p className="text-xs text-slate-500">Active department: {activeDepartment.code}</p>
      ) : null}

      <Card title="Built-in presets" actions={<span className="text-xs text-slate-400">One click sets up department, sections, subjects, faculty & assignments</span>}>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUILT_IN_PRESETS.map((preset) => (
            <div key={preset.id} className="rounded border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{preset.label}</h3>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const deptId = applyPreset(preset, useWorkspaceStore.getState());
                    flushPersistence();
                    showToast('success', `Preset applied: ${preset.department.code}. Review it under Configuration.`);
                    navigate(`/departments/${deptId}/configuration`);
                  }}
                >
                  Apply
                </Button>
              </div>
              <p className="mt-1 text-xs text-slate-500">{preset.description}</p>
              <p className="mt-2 text-[11px] text-slate-400">
                {preset.sections.length} section(s) · {preset.subjects.length} subjects · {preset.faculty.length} faculty · {preset.workingDays.length} days × {preset.periodsPerDay} periods
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
